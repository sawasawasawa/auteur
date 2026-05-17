import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import React from "react";

export interface Beat {
  start: number;
  end: number;
  text: string;
  overlay?: string;
}

export interface ShortProps {
  audioSrc: string;
  durationSec: number;
  hook: string;
  beats: Beat[];
  brand: string;
}

const PALETTES = [
  { bg: "#0a0a0a", ink: "#fafaf9", pop: "#ffb703" },
  { bg: "#1a1530", ink: "#fafaf9", pop: "#fb5607" },
  { bg: "#0e1a2b", ink: "#fafaf9", pop: "#3a86ff" },
];

function resolveAudio(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith("/")) return src; // absolute web path under public/
  return staticFile(src);
}

export const Short: React.FC<ShortProps> = ({ audioSrc, durationSec, hook, beats, brand }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Smooth gradient drift
  const t = frame / (durationSec * fps);
  const palette = PALETTES[Math.floor(t * PALETTES.length) % PALETTES.length];
  const drift = interpolate(frame, [0, durationSec * fps], [0, 12]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(140% 80% at ${20 + drift}% ${30 - drift}%, ${palette.pop}22 0%, ${palette.bg} 60%)`,
        fontFamily: "Inter, ui-sans-serif",
      }}
    >
      {audioSrc ? <Audio src={resolveAudio(audioSrc)} /> : null}

      {/* Hook (first 1.8s) */}
      <Sequence from={0} durationInFrames={Math.round(1.8 * fps)}>
        <HookBlock text={hook} pop={palette.pop} ink={palette.ink} />
      </Sequence>

      {/* Captions per beat */}
      {beats.map((b, i) => {
        const from = Math.round(b.start * fps);
        const dur = Math.max(6, Math.round((b.end - b.start) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <CaptionBlock text={b.text} overlay={b.overlay} pop={palette.pop} ink={palette.ink} />
          </Sequence>
        );
      })}

      {/* Brand mark bottom-left */}
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 60,
          color: palette.ink,
          opacity: 0.6,
          fontSize: 32,
          letterSpacing: 8,
          fontWeight: 700,
        }}
      >
        {brand}
      </div>
    </AbsoluteFill>
  );
};

const HookBlock: React.FC<{ text: string; pop: string; ink: string }> = ({ text, pop, ink }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 180 } });
  const scale = interpolate(s, [0, 1], [0.85, 1]);
  const opacity = interpolate(frame, [0, 6, 50, 54], [0, 1, 1, 0]);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: ink,
          fontSize: 130,
          lineHeight: 1.05,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: -2,
          transform: `scale(${scale})`,
          opacity,
          textShadow: `0 8px 30px ${pop}55`,
        }}
      >
        {text.split(" ").map((w, i) => (
          <span key={i} style={{ display: "inline-block", marginRight: 18 }}>
            <span style={{ color: i % 3 === 1 ? pop : ink }}>{w}</span>
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CaptionBlock: React.FC<{ text: string; overlay?: string; pop: string; ink: string }> = ({
  text,
  overlay,
  pop,
  ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", padding: 100, textAlign: "center" }}>
      {overlay ? (
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 0,
            right: 0,
            textAlign: "center",
            color: pop,
            fontSize: 56,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 2,
            opacity: fadeIn * 0.95,
          }}
        >
          {overlay}
        </div>
      ) : null}
      <div
        style={{
          color: ink,
          fontSize: 96,
          lineHeight: 1.05,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: -1,
          opacity: fadeIn,
          marginBottom: 220,
          textShadow: "0 6px 16px rgba(0,0,0,0.6)",
        }}
      >
        {text.split(" ").map((w, i) => (
          <span key={i} style={{ display: "inline-block", marginRight: 16, color: i % 2 === 1 ? pop : ink }}>
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
