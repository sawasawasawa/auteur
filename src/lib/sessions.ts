// In-memory session store. Process-local; fine for the local Ralph backend.
// Each session tracks niche, picked concept, audio path, transcript, cut plan, render path, and a phase stream.

import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";

export type Phase =
  | "seeded"
  | "concept-picked"
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "cutting"
  | "broll"
  | "rendering"
  | "done"
  | "error";

export interface Concept {
  id: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  why: string;
  questions: string[];
}

export interface CutBeat {
  start: number;
  end: number;
  text: string;
  overlay?: string;
}

export interface Session {
  id: string;
  niche: string;
  vibe?: string;
  useFalBroll?: boolean;
  concepts: Concept[];
  pickedConcept?: Concept;
  audioPath?: string;
  transcript?: { text: string; words: { word: string; start: number; end: number }[] };
  cutPlan?: { hook: string; beats: CutBeat[]; targetDurationSec: number };
  brollPaths?: string[]; // public-relative paths, indexed by beat
  renderPath?: string;
  phase: Phase;
  phaseLog: { ts: number; phase: Phase; note?: string }[];
  events: EventEmitter;
  error?: string;
}

// Persist across Next.js dev HMR reloads + route handler module instances.
const GLOBAL_KEY = "__AUTEUR_SESSIONS__";
const g = globalThis as any;
if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, Session>();
const SESSIONS: Map<string, Session> = g[GLOBAL_KEY];

export function createSession(niche: string, vibe?: string, useFalBroll?: boolean): Session {
  const id = randomUUID();
  const s: Session = {
    id,
    niche,
    vibe,
    useFalBroll,
    concepts: [],
    phase: "seeded",
    phaseLog: [{ ts: Date.now(), phase: "seeded" }],
    events: new EventEmitter(),
  };
  SESSIONS.set(id, s);
  return s;
}

export function getSession(id: string): Session | undefined {
  return SESSIONS.get(id);
}

export function setPhase(id: string, phase: Phase, note?: string) {
  const s = SESSIONS.get(id);
  if (!s) return;
  s.phase = phase;
  s.phaseLog.push({ ts: Date.now(), phase, note });
  s.events.emit("phase", { phase, note, ts: Date.now() });
}

export function setError(id: string, message: string) {
  const s = SESSIONS.get(id);
  if (!s) return;
  s.error = message;
  setPhase(id, "error", message);
}
