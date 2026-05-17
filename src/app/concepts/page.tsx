"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Concept {
  id: string; title: string; hook: string; angle: string; format: string; why: string; questions: string[];
}

export default function ConceptsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("s") || "";
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/session/${sessionId}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setConcepts(data.concepts || []);
    }).catch((e) => setErr(e.message));
  }, [sessionId]);

  async function confirm() {
    if (!picked) return;
    const res = await fetch("/api/concept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, conceptId: picked }),
    });
    if (!res.ok) { setErr("Pick failed"); return; }
    router.push(`/interview?s=${sessionId}`);
  }

  return (
    <section className="px-6 py-12 max-w-5xl mx-auto animate-slideUp">
      <h2 className="display text-4xl md:text-5xl mb-2">Pick the angle.</h2>
      <p className="text-white/50 mb-10">Three concepts, ranked. Lead with the strongest hook.</p>

      {err ? <p className="text-flame mb-4">{err}</p> : null}

      {concepts.length === 0 ? (
        <div className="text-white/40 animate-pulse2">Generating concepts...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {concepts.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setPicked(c.id)}
              className={`card text-left flex flex-col gap-3 ${picked === c.id ? "selected" : ""}`}
            >
              <div className="text-xs uppercase tracking-widest text-amber">#{i + 1} / {c.angle}</div>
              <div className="display text-2xl leading-tight">{c.title}</div>
              <div className="text-white/80 text-lg leading-snug">"{c.hook}"</div>
              <div className="text-white/40 text-sm">{c.format}</div>
              <div className="text-white/60 text-sm italic">{c.why}</div>
              <div className="mt-2 border-t border-white/10 pt-3">
                <div className="text-xs uppercase tracking-widest text-white/40 mb-1">You will answer:</div>
                <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                  {c.questions.slice(0, 4).map((q, j) => <li key={j}>{q}</li>)}
                </ul>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center gap-4">
        <button onClick={confirm} disabled={!picked} className="btn">
          {picked ? "Start interview" : "Pick one"}
        </button>
        <a href="/" className="btn btn-ghost">Rewrite the seed</a>
      </div>
    </section>
  );
}
