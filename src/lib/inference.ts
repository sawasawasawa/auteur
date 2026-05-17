// Wraps PAI's Inference.ts. Shells out to Bun + the local script so no API keys are required.
// Returns JSON-parsed payload or throws.

import { spawn } from "node:child_process";

const INFER = process.env.PAI_INFERENCE || `${process.env.HOME}/.claude/PAI/Tools/Inference.ts`;

export type Level = "fast" | "standard" | "smart";

export async function infer(
  systemPrompt: string,
  userPrompt: string,
  opts: { level?: Level; json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  const level = opts.level || "standard";
  const args: string[] = [INFER, "--level", level];
  if (opts.json) args.push("--json");
  if (opts.timeoutMs) args.push("--timeout", String(opts.timeoutMs));
  args.push(systemPrompt, userPrompt);

  return new Promise((resolve, reject) => {
    const child = spawn("bun", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (b) => (out += b.toString()));
    child.stderr.on("data", (b) => (err += b.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(sanitize(out.trim()));
      else reject(new Error(`Inference exited ${code}: ${err || out}`));
    });
  });
}

// Strip em-dashes and en-dashes from model output before it ever touches UI.
// They break Mateusz's typographic preference and look out of place in burned-in captions.
function sanitize(s: string): string {
  return s
    .replace(/—/g, ", ")  // em-dash to comma-space
    .replace(/–/g, " - "); // en-dash to space-hyphen-space
}

export async function inferJson<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  opts: { level?: Level; timeoutMs?: number } = {}
): Promise<T> {
  const raw = await infer(systemPrompt, userPrompt, { ...opts, json: true });
  // Inference.ts --json already validates JSON shape; parse defensively.
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Sometimes the model wraps in code fences. Strip and retry.
    const cleaned = raw.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
