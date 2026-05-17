// Renders the Remotion <Short> composition into an mp4 using @remotion/renderer programmatically.

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { promises as fs } from "node:fs";

let bundleCache: string | null = null;

async function getBundle(): Promise<string> {
  if (bundleCache) return bundleCache;
  const entry = path.join(process.cwd(), "src/remotion/index.ts");
  bundleCache = await bundle({
    entryPoint: entry,
    onProgress: () => void 0,
    webpackOverride: (c) => c,
  });
  return bundleCache;
}

export interface RenderInput {
  audioPath: string;       // path to the cut audio
  durationSec: number;
  hook: string;
  beats: { start: number; end: number; text: string; overlay?: string }[];
  brand?: string;
  outPath: string;         // mp4 output
}

export async function renderShort(input: RenderInput): Promise<string> {
  const serveUrl = await getBundle();
  const composition = await selectComposition({
    serveUrl,
    id: "Short",
    inputProps: {
      audioSrc: input.audioPath,
      durationSec: input.durationSec,
      hook: input.hook,
      beats: input.beats,
      brand: input.brand || "AUTEUR",
    },
  });

  await fs.mkdir(path.dirname(input.outPath), { recursive: true });

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: Math.max(30, Math.ceil(input.durationSec * 30)),
      fps: 30,
      width: 1080,
      height: 1920,
    },
    serveUrl,
    codec: "h264",
    outputLocation: input.outPath,
    inputProps: {
      audioSrc: input.audioPath,
      durationSec: input.durationSec,
      hook: input.hook,
      beats: input.beats,
      brand: input.brand || "AUTEUR",
    },
    concurrency: 4,
    crf: 20,
  });

  return input.outPath;
}
