// ffmpeg wrappers: cut audio according to a cut plan with crossfades, normalize loudness.

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function ffmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (b) => (err += b.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed (${code}): ${err.slice(-1500)}`))));
  });
}

export interface ClipRange { start: number; end: number; }

export async function cutAndConcat(
  inputAudio: string,
  ranges: ClipRange[],
  outPath: string
): Promise<void> {
  const dir = path.dirname(outPath);
  await fs.mkdir(dir, { recursive: true });

  // Build filter_complex that trims each range, applies 30ms fade in/out, concatenates, then loudnorm.
  const inputs: string[] = ["-i", inputAudio];
  const filters: string[] = [];
  const labels: string[] = [];

  ranges.forEach((r, i) => {
    const dur = Math.max(0.1, r.end - r.start);
    filters.push(
      `[0:a]atrim=start=${r.start.toFixed(3)}:end=${r.end.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.03,afade=t=out:st=${(dur - 0.03).toFixed(3)}:d=0.03[a${i}]`
    );
    labels.push(`[a${i}]`);
  });

  filters.push(`${labels.join("")}concat=n=${ranges.length}:v=0:a=1[ac]`);
  filters.push(`[ac]loudnorm=I=-16:LRA=11:TP=-1.5[a]`);

  const filterStr = filters.join(";");
  await ffmpeg([
    "-y",
    ...inputs,
    "-filter_complex", filterStr,
    "-map", "[a]",
    "-c:a", "aac",
    "-b:a", "192k",
    outPath,
  ]);
}

export async function audioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      audioPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (b) => (out += b.toString()));
    child.stderr.on("data", (b) => (err += b.toString()));
    child.on("close", (code) => (code === 0 ? resolve(parseFloat(out.trim())) : reject(new Error(err))));
  });
}
