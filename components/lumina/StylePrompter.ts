
import { LatentGrading } from '../../types';

export const generateStyleDescriptors = (grading: LatentGrading | undefined): string => {
  if (!grading) return "";

  const descriptors: string[] = [];

  // Tone & Temperature
  if (grading.temperature > 10) descriptors.push("warm lighting", "golden hour tones");
  if (grading.temperature < -10) descriptors.push("cool lighting", "blue hour tones");
  if (grading.sepia > 0.3) descriptors.push("vintage sepia aesthetics", "old photo style");
  if (grading.grayscale > 0.5) descriptors.push("black and white", "noir style");

  // Exposure & Contrast
  if (grading.contrast > 1.2) descriptors.push("high contrast", "dramatic lighting");
  if (grading.contrast < 0.8) descriptors.push("low contrast", "flat lighting", "soft look");
  if (grading.brightness < 0.8) descriptors.push("low key", "dark atmosphere");
  if (grading.brightness > 1.2) descriptors.push("high key", "bright atmosphere");

  // Color & Saturation
  if (grading.saturation > 1.3) descriptors.push("vibrant colors", "highly saturated");
  if (grading.saturation < 0.7) descriptors.push("muted colors", "desaturated");
  if (grading.tint > 10) descriptors.push("magenta tint");
  if (grading.tint < -10) descriptors.push("green tint", "matrix style");

  // Texture & FX
  if (grading.grain > 0) descriptors.push("film grain texture", "analog photography look");
  if (grading.bloom > 0) descriptors.push("dreamy glow", "soft focus", "ethereal");
  if (grading.vignette > 0.5) descriptors.push("vignetted edges");

  return descriptors.join(", ");
};
