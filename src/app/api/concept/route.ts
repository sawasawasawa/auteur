import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, setPhase } from "@/lib/sessions";

const Body = z.object({ sessionId: z.string(), conceptId: z.string() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const s = getSession(parsed.data.sessionId);
  if (!s) return NextResponse.json({ error: "session not found" }, { status: 404 });
  const concept = s.concepts.find((c) => c.id === parsed.data.conceptId);
  if (!concept) return NextResponse.json({ error: "concept not found" }, { status: 404 });
  s.pickedConcept = concept;
  setPhase(s.id, "concept-picked", concept.title);
  return NextResponse.json({ ok: true });
}
