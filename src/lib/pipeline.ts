// Orchestrates the full Auteur pipeline for a session:
// transcribe → cut decisions (LLM) → ffmpeg cut → Remotion render → done

import path from "node:path";
import { promises as fs } from "node:fs";
import { getSession, setPhase, setError } from "@/lib/sessions";
import { transcribe } from "@/lib/whisper";
import { inferJson } from "@/lib/inference";
import { CutPlanSchema } from "@/lib/schemas";
import { cutAndConcat } from "@/lib/ffmpeg";

const CUT_SYSTEM = `You are a top-tier short-form editor. You receive:
- A creator concept (title, hook, angle)
- A word-level transcript of a raw interview (each word has start/end seconds)

Your job: pick the BEST 25-35 contiguous-or-near-contiguous seconds of speech that form a complete short.

Output STRICT JSON only, no fences, no prose:
{
  "hook": "<2-6 words, ALL CAPS, the title-card hook>",
  "targetDurationSec": <number 25-35>,
  "beats": [
    { "start": <sec>, "end": <sec>, "text": "<verbatim spoken words for this beat>", "overlay": "<optional 2-4 word emphasis text>" }
  ]
}

Rules:
- Use real timestamps from the transcript. Never invent times.
- 3-7 beats. Each beat 2-7 seconds.
- Beats can skip filler. Prefer cohesive flow.
- First beat must align with the hook line (the opener).
- Overlay text: optional, used to emphasize one key word per beat. Use sparingly (every 2-3 beats).`;

export async function processSession(sessionId: string): Promise<void> {
  const s = getSession(sessionId);
  if (!s || !s.audioPath || !s.pickedConcept) {
    throw new Error("session not ready");
  }

  // Transcribe
  setPhase(sessionId, "transcribing");
  const tr = await transcribe(s.audioPath);
  s.transcript = tr;
  setPhase(sessionId, "transcribed", `${tr.words.length} words`);

  // Cut plan
  setPhase(sessionId, "cutting");
  const transcriptForLLM = tr.words.map((w) => `[${w.start.toFixed(2)}-${w.end.toFixed(2)}] ${w.word}`).join(" ");
  const concept = s.pickedConcept;
  const cutUser = `Concept:\n- Title: ${concept.title}\n- Hook: ${concept.hook}\n- Angle: ${concept.angle}\n\nWord-level transcript:\n${transcriptForLLM}\n\nReturn STRICT JSON cut plan.`;
  let cutPlan;
  try {
    const raw = await inferJson<unknown>(CUT_SYSTEM, cutUser, { level: "standard", timeoutMs: 60_000 });
    cutPlan = CutPlanSchema.parse(raw);
  } catch (err: any) {
    // Fallback: keep first 30s.
    const lastWord = tr.words.at(-1);
    const endCap = Math.min(30, lastWord?.end ?? 30);
    cutPlan = {
      hook: concept.hook.split(" ").slice(0, 4).join(" ").toUpperCase(),
      targetDurationSec: endCap,
      beats: chunkBeats(tr.words, endCap),
    };
  }
  s.cutPlan = cutPlan;

  // Cut audio with ffmpeg
  const tmpDir = path.dirname(s.audioPath);
  const cutAudio = path.join(tmpDir, "cut.m4a");
  await cutAndConcat(s.audioPath, cutPlan.beats.map((b) => ({ start: b.start, end: b.end })), cutAudio);

  // Re-time beats to start from 0 with concatenated durations.
  let cursor = 0;
  const stagedBeats = cutPlan.beats.map((b) => {
    const dur = b.end - b.start;
    const stage = { start: cursor, end: cursor + dur, text: b.text.toUpperCase(), overlay: b.overlay?.toUpperCase() };
    cursor += dur;
    return stage;
  });
  const totalDur = cursor;

  // Render (dynamic import to keep Remotion out of dev route bundle)
  setPhase(sessionId, "rendering");
  const outDir = path.join(process.cwd(), "public", "renders");
  await fs.mkdir(outDir, { recursive: true });
  const audioPublicDir = path.join(process.cwd(), "public", "audio");
  await fs.mkdir(audioPublicDir, { recursive: true });
  const audioPublicPath = path.join(audioPublicDir, `${sessionId}.m4a`);
  await fs.copyFile(cutAudio, audioPublicPath);

  const outPath = path.join(outDir, `${sessionId}.mp4`);
  const { renderShort } = await import("@/lib/remotionRender");
  await renderShort({
    audioPath: `audio/${sessionId}.m4a`,
    durationSec: totalDur,
    hook: cutPlan.hook.toUpperCase(),
    beats: stagedBeats,
    outPath,
    brand: "AUTEUR",
  });

  s.renderPath = `/renders/${sessionId}.mp4`;
  setPhase(sessionId, "done", s.renderPath);
}

function chunkBeats(words: { word: string; start: number; end: number }[], cap: number) {
  const beats: { start: number; end: number; text: string; overlay?: string }[] = [];
  let i = 0;
  while (i < words.length && words[i].end <= cap) {
    const j = Math.min(i + 6, words.length);
    const slice = words.slice(i, j);
    beats.push({
      start: slice[0].start,
      end: slice.at(-1)!.end,
      text: slice.map((w) => w.word).join(" "),
    });
    i = j;
  }
  return beats.length ? beats : [{ start: 0, end: Math.min(cap, words.at(-1)?.end ?? cap), text: words.map((w) => w.word).join(" ") }];
}
