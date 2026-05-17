"use client";
import { useEffect, useRef, useState } from "react";

const SAMPLE_SHORTS = [
  {
    src: "/fallback.mp4",
    label: "Hackathon judge / contrarian",
    hook: "I scored the crashed team higher.",
  },
];

export default function DemoPage() {
  const [i, setI] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => void 0);
    }
  }, [i]);

  const s = SAMPLE_SHORTS[i];

  return (
    <section className="px-6 py-12 max-w-3xl mx-auto animate-slideUp text-center">
      <div className="text-xs uppercase tracking-widest text-amber mb-3">Pre-rendered sample</div>
      <h2 className="display text-4xl md:text-5xl mb-2">{s.hook}</h2>
      <p className="text-white/40 text-sm mb-8">Generated end-to-end by Auteur. {s.label}.</p>

      <div
        className="mx-auto rounded-[40px] border-4 border-white/20 overflow-hidden shadow-2xl"
        style={{ width: 320, aspectRatio: "9 / 16", background: "#000" }}
      >
        <video ref={videoRef} src={s.src} controls autoPlay playsInline className="w-full h-full object-cover" />
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <a href={s.src} download className="btn">Download MP4</a>
        <a href="/" className="btn btn-ghost">Make your own</a>
      </div>
    </section>
  );
}
