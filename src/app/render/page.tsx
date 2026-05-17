"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PHASES = [
  { key: "uploaded", label: "Uploaded" },
  { key: "transcribing", label: "Transcribing" },
  { key: "transcribed", label: "Transcript ready" },
  { key: "cutting", label: "AI cut decisions" },
  { key: "broll", label: "Generating fal.ai B-roll" },
  { key: "rendering", label: "Rendering 9:16" },
  { key: "done", label: "Done" },
];

export default function RenderPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("s") || "";
  const [phase, setPhase] = useState<string>("uploaded");
  const [note, setNote] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [startedAt] = useState<number>(Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/api/progress/${sessionId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.phase) {
          setPhase(data.phase);
          if (data.note) setNote(data.note);
          if (data.phase === "done") {
            setTimeout(() => router.push(`/reveal?s=${sessionId}`), 400);
            es.close();
          }
          if (data.phase === "error") {
            setErr(data.note || "Pipeline failed");
            es.close();
          }
        }
      } catch {}
    };
    es.onerror = () => {/* keep alive; SSE will retry */};
    return () => es.close();
  }, [sessionId, router]);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000) + tick * 0;
  const phaseIndex = Math.max(0, PHASES.findIndex((p) => p.key === phase));

  return (
    <section className="px-6 py-16 max-w-2xl mx-auto animate-slideUp">
      <h2 className="display text-4xl md:text-5xl mb-3">Auteur is working.</h2>
      <p className="text-white/50 mb-10">Cutting, scoring, rendering. About a minute.</p>

      <ol className="space-y-3 mb-10">
        {PHASES.map((p, i) => {
          const state = i < phaseIndex ? "done" : i === phaseIndex ? "active" : "todo";
          return (
            <li
              key={p.key}
              className={
                "flex items-center gap-4 p-4 rounded-2xl border " +
                (state === "active"
                  ? "border-amber/60 bg-amber/5"
                  : state === "done"
                  ? "border-white/15 bg-white/[0.03] opacity-80"
                  : "border-white/8 bg-white/[0.02] opacity-50")
              }
            >
              <span
                className={
                  "h-3 w-3 rounded-full " +
                  (state === "active" ? "bg-amber animate-pulse2" : state === "done" ? "bg-white/70" : "bg-white/20")
                }
              />
              <span className="font-medium text-white/90">{p.label}</span>
              {state === "active" && note ? <span className="ml-auto text-xs text-white/40">{note}</span> : null}
            </li>
          );
        })}
      </ol>

      <div className="text-white/40 text-sm">Elapsed {elapsed}s</div>
      {err ? <p className="text-flame mt-4 text-sm">{err}</p> : null}
    </section>
  );
}
