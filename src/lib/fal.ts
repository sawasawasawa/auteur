// fal.ai B-roll generation. Produces a 9:16 vertical clip per beat.
// We pick the cheap-and-fast model so 5 beats stay under 1 minute and under a dollar.

import { fal } from "@fal-ai/client";
import { promises as fs } from "node:fs";
import path from "node:path";

const KEY = process.env.FAL_KEY;
if (KEY) fal.config({ credentials: KEY });

// LTX 2.3 Fast: $0.04/sec, max 20s, very fast (~10-20s per 5s clip).
const MODEL = "fal-ai/ltx-2.3/text-to-video/fast";

export interface BrollRequest {
  prompt: string;
  durationSec: number; // requested duration; LTX rounds to nearest multiple of 2 typically
}

export interface BrollResult {
  url: string;          // fal-hosted URL
  localPath: string;    // path inside public/broll/{sessionId}/{idx}.mp4
  publicPath: string;   // web path served by Next.js (relative to publicDir)
  durationSec: number;
}

export async function generateBroll(
  sessionId: string,
  index: number,
  req: BrollRequest
): Promise<BrollResult> {
  if (!KEY) throw new Error("FAL_KEY not configured");

  const safeDur = Math.max(2, Math.min(8, Math.round(req.durationSec)));

  const result: any = await fal.subscribe(MODEL, {
    input: {
      prompt: req.prompt,
      aspect_ratio: "9:16",
      resolution: "1080p",
    } as any,
  });

  const url: string | undefined = result?.data?.video?.url || result?.video?.url;
  if (!url) {
    throw new Error("fal returned no video url: " + JSON.stringify(result).slice(0, 500));
  }

  const outDir = path.join(process.cwd(), "public", "broll", sessionId);
  await fs.mkdir(outDir, { recursive: true });
  const filename = `${String(index).padStart(2, "0")}.mp4`;
  const localPath = path.join(outDir, filename);

  // Download
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download fal video: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(localPath, buf);

  return {
    url,
    localPath,
    publicPath: `broll/${sessionId}/${filename}`,
    durationSec: safeDur,
  };
}

// Build a vivid one-line action prompt from a caption beat. Keeps it tactical,
// cinematic, no abstractions (LTX struggles with abstract language).
export function brollPromptFor(beatText: string, hook: string, brand = "AUTEUR"): string {
  return [
    "cinematic close-up handheld documentary footage,",
    "moody natural lighting, shallow depth of field,",
    "subject: " + beatText.toLowerCase(),
    ", subtle camera drift, no text overlays, no captions, no faces of real people,",
    "vertical 9:16 portrait composition",
  ].join(" ");
}
