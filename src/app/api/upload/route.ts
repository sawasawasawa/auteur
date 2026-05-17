import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { getSession, setPhase } from "@/lib/sessions";
import { processSession } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const sessionId = form.get("sessionId");
  const file = form.get("audio");
  if (typeof sessionId !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "sessionId + audio required" }, { status: 400 });
  }
  const s = getSession(sessionId);
  if (!s) return NextResponse.json({ error: "session not found" }, { status: 404 });

  const tmpDir = path.join(process.cwd(), ".tmp-auteur", sessionId);
  await fs.mkdir(tmpDir, { recursive: true });

  const ext = (file as any).type?.includes("webm") ? "webm" : "wav";
  const rawPath = path.join(tmpDir, `raw.${ext}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(rawPath, buf);

  // Convert to 16k mono wav for whisper-cli.
  const wavPath = path.join(tmpDir, "raw.wav");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", [
      "-y", "-i", rawPath, "-ac", "1", "-ar", "16000", wavPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (b) => (err += b.toString()));
    child.on("close", (c) => (c === 0 ? resolve() : reject(new Error(err.slice(-1000)))));
  });

  s.audioPath = wavPath;
  setPhase(sessionId, "uploaded", `${(buf.length / 1024).toFixed(0)} KB`);

  // Fire the pipeline; do not await.
  processSession(sessionId).catch((err) => {
    setPhase(sessionId, "error", String(err?.message || err));
  });

  return NextResponse.json({ ok: true });
}
