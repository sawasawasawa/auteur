import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const s = getSession(sessionId);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    id: s.id,
    niche: s.niche,
    phase: s.phase,
    concepts: s.concepts,
    pickedConcept: s.pickedConcept,
    renderPath: s.renderPath,
    error: s.error,
  });
}
