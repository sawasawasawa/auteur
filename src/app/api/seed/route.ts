import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inferJson } from "@/lib/inference";
import { createSession } from "@/lib/sessions";
import { ConceptsResponse } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  niche: z.string().min(6).max(4000),
  vibe: z.string().max(500).optional(),
  useFalBroll: z.boolean().optional(),
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
  const { niche, vibe, useFalBroll } = parsed.data;
  const session = createSession(niche, vibe, useFalBroll);

  const user = `Creator description:\n${niche}\n\n${vibe ? `Vibe / tone: ${vibe}\n` : ""}Output STRICT JSON only.`;

  // Try fast (Haiku) first for snappy demo. Fall back to standard if it dies, then a static template.
  const attempts: { level: "fast" | "standard"; timeoutMs: number }[] = [
    { level: "fast", timeoutMs: 45_000 },
    { level: "standard", timeoutMs: 90_000 },
  ];
  let lastErr: any = null;
  for (const a of attempts) {
    try {
      const raw = await inferJson<unknown>(SYSTEM, user, a);
      const data = ConceptsResponse.parse(raw);
      session.concepts = data.concepts.map((c, i) => ({ ...c, id: c.id || `c${i + 1}` }));
      return NextResponse.json({ sessionId: session.id, concepts: session.concepts });
    } catch (err: any) {
      lastErr = err;
      console.error(`[seed] ${a.level} attempt failed:`, err?.message);
    }
  }
  // Static fallback so the demo never hard-fails.
  session.concepts = staticConcepts(niche);
  return NextResponse.json({
    sessionId: session.id,
    concepts: session.concepts,
    fallback: true,
    warning: lastErr?.message?.slice(0, 200),
  });
}

function staticConcepts(niche: string) {
  const tag = niche.split(/[.,\n]/)[0].slice(0, 80);
  return [
    {
      id: "c1",
      title: "The Mistake Everyone Makes",
      hook: `Most ${tag} get this completely backwards.`,
      angle: "contrarian",
      format: "talking head",
      why: "Contrarian opener forces a stop-and-listen reaction in the first second.",
      questions: [
        "What is the single biggest myth in your world that you wish people would stop repeating?",
        "Tell me about the moment you realized you had been wrong about something important.",
        "What does almost nobody get right that you see clearly?",
        "If a beginner asked you for one rule to live by here, what would it be?",
      ],
    },
    {
      id: "c2",
      title: "The Day That Changed Everything",
      hook: "One moment changed how I do this forever.",
      angle: "story",
      format: "talking head",
      why: "Story openers hijack the reader's narrative reflex, keeps them watching to the resolution.",
      questions: [
        "Walk me through a specific day or moment that completely rewired how you think.",
        "What were you doing before that moment that you would never go back to?",
        "What did the people around you not understand at the time?",
        "What would you tell yourself the day before that moment happened?",
      ],
    },
    {
      id: "c3",
      title: "The Tactic Nobody Uses",
      hook: "I use one tiny trick that nobody else does.",
      angle: "how-to",
      format: "talking head",
      why: "Hyper-specific tactical promise creates a save-and-share urgency.",
      questions: [
        "What is something you do every single day that you have never explained to anyone?",
        "What is the smallest possible action that gives you the biggest payoff?",
        "Walk me through that tactic step by step.",
        "What stops most people from trying this for themselves?",
      ],
    },
  ];
}
