import { NextRequest } from "next/server";
import { getSession } from "@/lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const s = getSession(sessionId);
  if (!s) return new Response("session not found", { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      // Replay log
      for (const entry of s.phaseLog) send(entry);

      const onPhase = (entry: unknown) => send(entry);
      s.events.on("phase", onPhase);

      const interval = setInterval(() => controller.enqueue(enc.encode(`: keepalive\n\n`)), 10_000);

      const close = () => {
        clearInterval(interval);
        s.events.off("phase", onPhase);
        try { controller.close(); } catch {}
      };

      // Auto-close once a terminal phase fires (give 500ms grace for client to read).
      s.events.on("phase", (e: any) => {
        if (e.phase === "done" || e.phase === "error") setTimeout(close, 600);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
