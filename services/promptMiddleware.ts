
import { z } from "https://esm.sh/zod";

// --- Schemas ---

export const PromptRequestSchema = z.object({
  prompt: z.string().min(3, "Prompt too short"),
  negativePrompt: z.string().optional(),
  model: z.string().default('gemini-2.5-flash-image'),
  seed: z.number().optional(),
  config: z.object({
    temperature: z.number().min(0).max(1).optional(),
    topK: z.number().optional(),
  }).optional()
});

export const PromptMetadataSchema = z.object({
  timestamp: z.number(),
  apiVersion: z.string(),
  secureSeed: z.number(),
  requestId: z.string(),
});

export type ValidatedPrompt = z.infer<typeof PromptRequestSchema>;
export type PromptMetadata = z.infer<typeof PromptMetadataSchema>;

export interface ShieldedRequest {
  data: ValidatedPrompt;
  meta: PromptMetadata;
}

// --- Middleware Engine ---

export const promptShield = {
  /**
   * Validates and enriches a raw prompt request.
   * Ensures reproducibility by injecting a seed if missing.
   */
  prepare: (rawInput: any): ShieldedRequest => {
    // 1. Validate Input
    const result = PromptRequestSchema.safeParse(rawInput);
    
    if (!result.success) {
      console.error("Prompt Shield: Blocked invalid input", result.error);
      throw new Error(`Invalid Prompt: ${result.error.issues[0].message}`);
    }

    const data = result.data;

    // 2. Inject Metadata
    const meta: PromptMetadata = {
      timestamp: Date.now(),
      apiVersion: 'v2.0-alpha',
      secureSeed: data.seed ?? Math.floor(Math.random() * 10000000), // Ensure seed exists
      requestId: crypto.randomUUID()
    };

    // 3. Return Enriched Packet
    return { data, meta };
  },

  /**
   * Helper to format a system instruction that forces JSON compliance
   * (Useful for non-image tasks)
   */
  getSystemInstruction: (role: string = "Visual Architect") => {
    return `Role: ${role}. Strict JSON Output. No Markdown. Integrity Check: ${Date.now()}.`;
  }
};
