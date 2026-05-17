import { z } from "zod";

export const ConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  hook: z.string(),
  angle: z.string(),
  format: z.string(),
  why: z.string(),
  questions: z.array(z.string()).min(3).max(6),
});

export const ConceptsResponse = z.object({
  concepts: z.array(ConceptSchema).length(3),
});

export const CutBeatSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  overlay: z.string().optional(),
});

export const CutPlanSchema = z.object({
  hook: z.string(),
  beats: z.array(CutBeatSchema).min(1),
  targetDurationSec: z.number().min(10).max(45),
});

export type Concept = z.infer<typeof ConceptSchema>;
export type CutPlan = z.infer<typeof CutPlanSchema>;
