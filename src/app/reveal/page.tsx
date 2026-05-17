"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function RevealPage() {
  const sp = useSearchParams();
  const sessionId = sp.get("s") || "";
  const [url, setUrl] = useState<string | null>(null);
  const [niche, setNiche] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/session/${sessionId}`).then(async (r) => {
      const data = await r.json();
      setUrl(data.renderPath || null);
      setNiche(data.niche || "");
    });
  }, [sessionId]);

  return (
    <section className="px-6 py-12 max-w-3xl mx-auto animate-slideUp text-center">
      <div className="text-xs uppercase tracking-widest text-amber mb-3">Your short is ready</div>
      <h2 className="display text-4xl md:text-5xl mb-8">Ship it.</h2>

      {url ? (
        <>
          <div
            className="mx-auto rounded-[40px] border-4 border-white/20 overflow-hidden shadow-2xl"
            style={{ width: 320, aspectRatio: "9 / 16", background: "#000" }}
          >
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <a href={url} download className="btn">Download MP4</a>
            <a href="/" className="btn btn-ghost">Make another</a>
          </div>

          {niche && <p className="text-white/40 text-sm mt-8 max-w-xl mx-auto">For: {niche}</p>}
        </>
      ) : (
        <div className="text-white/40 animate-pulse2">Loading your short...</div>
      )}
    </section>
  );
}
