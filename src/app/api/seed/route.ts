import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inferJson } from "@/lib/inference";
import { createSession } from "@/lib/sessions";
import { ConceptsResponse } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  niche: z.string().min(2).max(280),
  vibe: z.string().max(120).optional(),
});

const SYSTEM = `You are a senior short-form content strategist who has produced viral 9:16 shorts for first-time creators.

Given a creator description, propose THREE distinct video concepts, each ranked by hook strength. Each concept must:
- Be doable as a 25-35 second talking-head short
- Lead with a punchy hook line written in the creator's voice (Hormozi-grade: specific number, contrarian frame, or curiosity gap)
- Use a distinct angle (story / contrarian take / how-to / behind-scenes / belief shift)
- Include 4-5 interview questions designed to extract spoken material that becomes the cut

Return STRICT JSON only, no prose, no code fences. Shape:
{
  "concepts": [
    {
      "id": "c1",
      "title": "<short title>",
      "hook": "<spoken-out-loud first line under 12 words>",
      "angle": "<one of: story, contrarian, how-to, behind-scenes, belief-shift>",
      "format": "<talking head | walk-and-talk | screen + voice>",
      "why": "<one sentence why this hooks this niche>",
      "questions": ["q1","q2","q3","q4"]
    },
    ... 2 more concepts ...
  ]
}`;

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { niche, vibe } = parsed.data;
  const session = createSession(niche, vibe);

  const user = `Creator description:\n${niche}\n\n${vibe ? `Vibe / tone: ${vibe}\n` : ""}Output STRICT JSON only.`;

  try {
    const raw = await inferJson<unknown>(SYSTEM, user, { level: "standard", timeoutMs: 60_000 });
    const data = ConceptsResponse.parse(raw);
    session.concepts = data.concepts.map((c, i) => ({ ...c, id: c.id || `c${i + 1}` }));
    return NextResponse.json({ sessionId: session.id, concepts: session.concepts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Inference failed" }, { status: 500 });
  }
}
