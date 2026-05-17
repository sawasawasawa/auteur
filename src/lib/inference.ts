// Primary: fal.ai any-llm (uses FAL_KEY, ~6-7s per call, reliable).
// Fallback: PAI Inference.ts (Claude subscription) — slower, kept as safety net.

import { spawn } from "node:child_process";

const INFER = process.env.PAI_INFERENCE || `${process.env.HOME}/.claude/PAI/Tools/Inference.ts`;
const FAL_KEY = process.env.FAL_KEY;

export type Level = "fast" | "standard" | "smart";

const FAL_MODEL: Record<Level, string> = {
  fast: "google/gemini-2.0-flash-001",
  standard: "anthropic/claude-haiku-4.5",
  smart: "anthropic/claude-sonnet-4.5",
};

async function inferViaFal(systemPrompt: string, userPrompt: string, level: Level, timeoutMs: number): Promise<string> {
  if (!FAL_KEY) throw new Error("FAL_KEY not set");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("https://fal.run/fal-ai/any-llm", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: FAL_MODEL[level],
        system_prompt: systemPrompt,
        prompt: userPrompt,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`fal ${res.status}: ${text.slice(0, 400)}`);
    }
    const data: any = await res.json();
    const out: string = data?.output ?? data?.response ?? data?.text ?? "";
    if (!out) throw new Error("fal returned empty output: " + JSON.stringify(data).slice(0, 400));
    return stripFences(sanitize(out.trim()));
  } finally {
    clearTimeout(t);
  }
}

function stripFences(s: string): string {
  // Models love to wrap JSON in ```json fences. Strip them.
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function infer(
  systemPrompt: string,
  userPrompt: string,
  opts: { level?: Level; json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  const level = opts.level || "standard";
  const timeoutMs = opts.timeoutMs || (level === "fast" ? 30_000 : 60_000);

  // Try fal first (fast + reliable).
  if (FAL_KEY) {
    try {
      return await inferViaFal(systemPrompt, userPrompt, level, timeoutMs);
    } catch (err: any) {
      console.error("[inference] fal failed, falling back to PAI:", err?.message);
    }
  }

  // Fallback: PAI Inference.ts via Claude subscription CLI.
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
      if (code === 0) resolve(stripFences(sanitize(out.trim())));
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
