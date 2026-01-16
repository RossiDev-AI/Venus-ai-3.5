
import { z } from "https://esm.sh/zod";

// --- Gemini Response Schemas ---

export const TimelineBeatSchema = z.object({
  caption: z.string(),
  scoutQuery: z.string(),
  duration: z.number().optional().default(6),
  cameraMovement: z.string().optional(),
});

export const TimelineSchema = z.array(TimelineBeatSchema);

export const DNAAnalysisSchema = z.object({
  character: z.string().optional(),
  environment: z.string().optional(),
  pose: z.string().optional(),
  technical_tags: z.array(z.string()).optional().default([]),
  spatial_metadata: z.object({
    camera_angle: z.string().optional(),
    depth_map: z.string().optional()
  }).optional(),
  aesthetic_dna: z.object({
    lighting_setup: z.string().optional(),
    color_palette: z.array(z.string()).optional()
  }).optional()
});

export const ScoutCandidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  source_layer: z.string(),
  composite_score: z.number(),
  quality_metrics: z.object({
    technical: z.number(),
    aesthetic: z.number()
  }),
  votes: z.array(z.object({
    agent: z.string(),
    score: z.number(),
    critique: z.string()
  })),
  dna_preview: z.object({
    z_anatomy: z.number().optional(),
    z_structure: z.number().optional(),
    z_lighting: z.number().optional(),
    z_texture: z.number().optional()
  })
});

export const ScoutDataSchema = z.object({
  candidates: z.array(ScoutCandidateSchema),
  consensus_report: z.string(),
  winner_id: z.string(),
  search_stats: z.object({
    premium_hits: z.number(),
    internal_hits: z.number()
  })
});

// --- Validation Helper ---
export const safeParseJSON = <T>(schema: z.ZodSchema<T>, jsonString: string): T | null => {
  try {
    // Remove markdown code blocks if present
    const cleanJson = jsonString.replace(/```json\n?|```/g, '');
    const parsed = JSON.parse(cleanJson);
    return schema.parse(parsed);
  } catch (error) {
    console.error("Zod Validation Failed:", error);
    return null;
  }
};
