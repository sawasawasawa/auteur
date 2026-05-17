// Wraps whisper-cli (whisper.cpp). Returns transcript with word-level timestamps.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const WHISPER_BIN = process.env.WHISPER_BIN || "/opt/homebrew/bin/whisper-cli";
const WHISPER_MODEL =
  process.env.WHISPER_MODEL ||
  "/Users/mateuszsawka/Library/Application Support/Listender/models/ggml-large-v3-turbo.bin";

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperResult {
  text: string;
  words: WhisperWord[];
}

export async function transcribe(audioPath: string): Promise<WhisperResult> {
  // whisper-cli writes JSON next to the audio file with -oj
  const outBase = audioPath.replace(/\.[^.]+$/, "");
  const args = [
    "-m", WHISPER_MODEL,
    "-f", audioPath,
    "-of", outBase,
    "-oj",            // JSON output
    "-ml", "1",       // max segment length 1 token -> word-level segments
    "-sow",           // split on word
    "-l", "auto",
    "-t", "8",
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(WHISPER_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (b) => (err += b.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`whisper-cli exited ${code}: ${err.slice(-2000)}`))));
  });

  const jsonPath = outBase + ".json";
  const raw = await fs.readFile(jsonPath, "utf8");
  const data = JSON.parse(raw);

  // whisper-cli JSON shape: { transcription: [ { offsets:{from,to}, text, ... } ] }
  const segs: any[] = data.transcription || [];
  const words: WhisperWord[] = segs
    .map((s) => {
      const text = (s.text || "").trim();
      if (!text) return null;
      return {
        word: text,
        start: (s.offsets?.from ?? 0) / 1000,
        end: (s.offsets?.to ?? 0) / 1000,
      } satisfies WhisperWord;
    })
    .filter(Boolean) as WhisperWord[];

  const text = words.map((w) => w.word).join(" ").replace(/\s+([,.!?])/g, "$1");
  return { text, words };
}
