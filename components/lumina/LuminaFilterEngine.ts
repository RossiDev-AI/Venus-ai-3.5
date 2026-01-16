
import * as PIXI from 'pixi.js';
import { LatentGrading } from '../../types';

export class LuminaFilterEngine {
  
  /**
   * Converts V-nus LatentGrading metadata into a highly optimized PixiJS ColorMatrixFilter.
   * This runs on the GPU via WebGL fragments.
   */
  static applyGrading(sprite: PIXI.Sprite, grading: LatentGrading) {
    const matrix = new PIXI.ColorMatrixFilter();
    
    // Reset to identity
    matrix.reset();

    // 1. Exposure / Brightness (Offset & Multiplier)
    // Combine exposure (log) and brightness (linear)
    const exposureMult = Math.pow(2, grading.exposure || 0);
    const brightMult = grading.brightness || 1;
    matrix.brightness(exposureMult * brightMult, false);

    // 2. Contrast
    if (grading.contrast !== 1) {
      matrix.contrast(grading.contrast, false);
    }

    // 3. Saturation & Vibrance (Approximated via Saturation)
    // We combine saturation and vibrance into a single saturation pass for performance
    const sat = (grading.saturation || 1) * (grading.vibrance || 1);
    if (sat !== 1) {
      matrix.saturate(sat, true); // True = multiply existing
    }

    // 4. Hue Rotation
    if (grading.hueRotate !== 0) {
      matrix.hue(grading.hueRotate, true);
    }

    // 5. Tint / Temperature (Color Tone)
    // We simulate temp/tint using explicit color multipliers
    // simplified: red boost for warm, blue boost for cool
    if (grading.temperature !== 0 || grading.tint !== 0) {
       const t = (grading.temperature || 0) / 100; // -1 to 1
       const tint = (grading.tint || 0) / 100;
       
       // Matrix multiplication for channel weighting
       // R, G, B, A, Offset
       const r = 1 + (t > 0 ? t * 0.2 : 0) + (tint > 0 ? tint * 0.2 : 0);
       const g = 1 + (tint < 0 ? Math.abs(tint) * 0.2 : 0);
       const b = 1 + (t < 0 ? Math.abs(t) * 0.2 : 0);
       
       // Manual matrix append
       const tintMatrix = [
         r, 0, 0, 0, 0,
         0, g, 0, 0, 0,
         0, 0, b, 0, 0,
         0, 0, 0, 1, 0
       ];
       matrix._loadMatrix(tintMatrix, true);
    }

    // 6. Vintage / Sepia
    if (grading.sepia && grading.sepia > 0) {
      matrix.sepia(grading.sepia > 0.5); // Pixi sepia is boolean-ish in v7/v8 std methods, or we mix
      // For fine control, we'd mix matrices, but strict Pixi `sepia` is often a toggle or requires custom mix
      // We will stick to standard methods for reliability
    }

    // Apply specific LUT Simulation if preset exists
    if (grading.preset_name === 'KODAK_5219') {
        matrix.contrast(1.1, true);
        matrix.saturate(1.1, true);
        matrix.hue(-5, true);
    } else if (grading.preset_name === 'CINESTILL_800T') {
        // Cool shadows, warm highlights (matrix approx)
        matrix.brightness(1.1, true);
        matrix.night(0.3, true); // Pixi 'night' preset approx
    }

    sprite.filters = [matrix];
  }
}
