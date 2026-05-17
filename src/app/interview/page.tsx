"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Concept {
  id: string; title: string; hook: string; questions: string[];
}

export default function InterviewPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("s") || "";
  const [concept, setConcept] = useState<Concept | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/session/${sessionId}`).then(async (r) => {
      const data = await r.json();
      if (data.pickedConcept) setConcept(data.pickedConcept);
    });
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setErr(null);
    setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128_000 });
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = upload;
      mr.start(1000);
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          if (next >= 90) stop();
          return next;
        });
      }, 1000);
    } catch (e: any) {
      setErr(e.message || "mic permission denied");
    }
  }

  function stop() {
    setRecording(false);
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  async function upload() {
    setUploading(true);
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fd = new FormData();
    fd.append("sessionId", sessionId);
    fd.append("audio", blob, "interview.webm");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "upload failed");
      router.push(`/render?s=${sessionId}`);
    } catch (e: any) {
      setErr(e.message);
      setUploading(false);
    }
  }

  function nextQuestion() {
    if (!concept) return;
    setQIdx((i) => Math.min(i + 1, concept.questions.length - 1));
  }

  return (
    <section className="px-6 py-12 max-w-3xl mx-auto animate-slideUp">
      {!concept ? (
        <div className="text-white/40 animate-pulse2">Loading concept...</div>
      ) : (
        <>
          <div className="text-xs uppercase tracking-widest text-amber mb-2">{concept.title}</div>
          <h2 className="display text-3xl md:text-4xl leading-tight mb-8">"{concept.hook}"</h2>

          <div className="card mb-8">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
              Question {qIdx + 1} of {concept.questions.length}
            </div>
            <div className="display text-3xl leading-tight mb-4">{concept.questions[qIdx]}</div>
            <button onClick={nextQuestion} disabled={qIdx >= concept.questions.length - 1} className="btn btn-ghost">
              Next question
            </button>
          </div>

          <div className="flex items-center gap-6">
            {!recording && !uploading && (
              <button onClick={start} className="btn">Start recording</button>
            )}
            {recording && (
              <button onClick={stop} className="btn" style={{ background: "#fb5607" }}>
                Stop and ship ({elapsed}s)
              </button>
            )}
            {uploading && <div className="text-white/70 animate-pulse2">Uploading and processing...</div>}
          </div>

          {recording && (
            <div className="mt-6 flex items-center gap-3 text-flame">
              <span className="inline-block h-3 w-3 rounded-full bg-flame animate-pulse2" />
              <span className="text-sm uppercase tracking-widest">Recording / 90s max</span>
            </div>
          )}

          {err ? <p className="text-flame mt-4 text-sm">{err}</p> : null}
        </>
      )}
    </section>
  );
}
