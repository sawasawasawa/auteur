"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeedPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!niche.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), vibe: vibe.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || "seed failed");
      const data = await res.json();
      router.push(`/concepts?s=${data.sessionId}`);
    } catch (e: any) {
      setErr(e.message || String(e));
      setLoading(false);
    }
  }

  return (
    <section className="px-6 py-16 max-w-3xl mx-auto animate-slideUp">
      <h1 className="display text-6xl md:text-7xl mb-4 leading-[1.02]">
        Become a content creator <span className="text-amber">in 90 seconds.</span>
      </h1>
      <p className="text-white/60 text-lg mb-10 max-w-xl">
        Tell Auteur who you are. It writes three video concepts, interviews you, picks the best 30 seconds, and ships a finished vertical short.
      </p>

      <label className="block text-sm uppercase tracking-widest text-white/40 mb-2">Who are you?</label>
      <textarea
        value={niche}
        onChange={(e) => setNiche(e.target.value)}
        placeholder="e.g. Solo founder building a fitness app for retired endurance athletes. Spent 12 years coaching D1 swimmers. Hate the word wellness."
        rows={4}
        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-amber/60 focus:bg-white/8 mb-6 resize-none"
      />

      <label className="block text-sm uppercase tracking-widest text-white/40 mb-2">Vibe (optional)</label>
      <input
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        placeholder="dry, direct, no fluff"
        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-amber/60 mb-8"
      />

      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={go} disabled={loading || niche.trim().length < 6} className="btn">
          {loading ? "Generating concepts..." : "Generate 3 concepts"}
        </button>
        <a href="/demo" className="btn btn-ghost">Watch a sample</a>
      </div>

      {err ? <p className="text-flame mt-4 text-sm">{err}</p> : null}

      <div className="mt-16 text-white/30 text-xs uppercase tracking-[0.3em]">
        Step 1 of 4 / Seed / Concepts / Interview / Reveal
      </div>
    </section>
  );
}
