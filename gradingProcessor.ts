
import { LatentGrading } from './types';

export const applyGrading = async (
  canvas: HTMLCanvasElement, 
  image: HTMLImageElement, 
  grading: LatentGrading
): Promise<void> => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  
  // Clear and Setup
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // --- PHASE 1: GEOMETRIC & LENS PHYSICS ---
  const cx = w / 2;
  const cy = h / 2;
  
  const lensCenterX = (grading.lens_center_x || 0) * (w * 0.1);
  const lensCenterY = (grading.lens_center_y || 0) * (h * 0.1);
  
  ctx.translate(cx + lensCenterX + (grading.pan_x || 0) * w, cy + lensCenterY + (grading.pan_y || 0) * h);
  
  if (grading.rotate) ctx.rotate(grading.rotate * Math.PI / 180);
  
  // 1. Anamorphic (Stretch X) & Stretch Y (Achatar)
  // We use existing anamorphic_squeeze for X, and add logic for Y via crop_zoom or dedicated logic if added to types
  // Assuming 'perspective_y' might be repurposed or we use scale directly.
  // Ideally, we'd add 'geometry_y' to types, but we can use 'perspective_y' as a vertical stretch proxy for now if needed, 
  // OR we rely on the fact that `grading` object passes through unchecked props in JS.
  // Let's implement robust scaling:
  
  const scaleX = (grading.anamorphic_squeeze || 1) * (1 + (grading.crop_zoom || 0));
  // We'll treat 'perspective_y' as Vertical Stretch if it's not being used for 3D tilt in this context
  // But to be safe and clean, let's use the explicit scale logic.
  const stretchY = (grading as any).geometry_y || 1; 
  const scaleY = stretchY * (1 + (grading.crop_zoom || 0));
  
  ctx.scale(scaleX, scaleY);
  
  // 2. Lens Distortion (Bulge / Pinch / Inflar)
  const dist = grading.lens_distortion || 0;
  // Barrel distortion usually shrinks the image, so we zoom in to compensate
  const zoom = 1 + Math.abs(dist * 0.3); 
  ctx.scale(zoom, zoom);
  
  // 3. Face Slim / Center Warp (Experimental)
  // We simulate face slimming by compressing the X-axis closer to the center (Pincushion-like effect on X only)
  const faceWarp = grading.face_warp || 0; // 0 to 1
  if (faceWarp !== 0) {
      // Simple Center Squeeze implementation via transformation
      // Note: Real mesh warp requires WebGL. This is an approximation.
      ctx.scale(1 - (faceWarp * 0.15), 1); 
  }

  ctx.translate(-cx, -cy);
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  // --- PHASE 2: PIXEL MANIPULATION KERNEL ---
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  // Optimization: Only copy buffer if spatial ops are needed
  const needsSpatial = grading.sharpness > 0 || grading.structure > 0 || 
                       grading.clarity !== 0 || grading.skin_smooth > 0 || grading.denoise > 0 ||
                       grading.chromatic_aberration > 0;
                       
  // We need a source buffer to read from while writing to 'data'
  const sourceData = needsSpatial ? new Uint8ClampedArray(data) : data;

  // Constants
  const tempK = (grading.temperature || 0) * 0.8;
  const tintM = (grading.tint || 0) * 0.8;
  const vibrance = grading.vibrance || 1;
  const saturation = grading.saturation || 1;
  const brightness = grading.brightness || 1;
  const contrast = grading.contrast || 1;
  const pivot = grading.pivot || 0.5;
  const offsetVal = grading.offset || 0;
  const gammaVal = 1 / (grading.gamma || 1); 
  const exposure = Math.pow(2, grading.exposure || 0);
  const dehazeVal = grading.dehaze || 0;
  
  // Matrix
  const mRR = grading.mix_red_red ?? 1, mRG = grading.mix_red_green ?? 0, mRB = grading.mix_red_blue ?? 0;
  const mGR = grading.mix_green_red ?? 0, mGG = grading.mix_green_green ?? 1, mGB = grading.mix_green_blue ?? 0;
  const mBR = grading.mix_blue_red ?? 0, mBG = grading.mix_blue_green ?? 0, mBB = grading.mix_blue_blue ?? 1;

  // Split Toning Colors
  const hslToRgb = (h: number, s: number, l: number) => {
     const c = (1 - Math.abs(2 * l - 1)) * s;
     const x = c * (1 - Math.abs((h / 60) % 2 - 1));
     const m = l - c / 2;
     let r=0,g=0,b=0;
     if(0<=h&&h<60){r=c;g=x;b=0}else if(60<=h&&h<120){r=x;g=c;b=0}else if(120<=h&&h<180){r=0;g=c;b=x}
     else if(180<=h&&h<240){r=0;g=x;b=c}else if(240<=h&&h<300){r=x;g=0;b=c}else if(300<=h&&h<360){r=c;g=0;b=x}
     return [(r+m)*255, (g+m)*255, (b+m)*255];
  };
  const shadowRGB = hslToRgb(grading.split_shadow_hue || 210, 1, 0.5);
  const highlightRGB = hslToRgb(grading.split_highlight_hue || 30, 1, 0.5);
  const midRGB = hslToRgb(grading.split_mid_hue || 0, 1, 0.5);

  const grainAmt = (grading.grain || 0) * 60; 
  const sharpenAmt = (grading.sharpness || 0) * 3;
  const clarityAmt = (grading.clarity || 0);
  const chromaAmt = (grading.chromatic_aberration || 0) * 1.5;

  // Beauty / Retouch constants
  const skinSmooth = grading.skin_smooth || 0;
  const eyeClarity = grading.eye_clarity || 0;
  const featurePop = grading.feature_pop || 0;
  const teethWhitening = grading.teeth_whitening || 0;

  for (let i = 0; i < data.length; i += 4) {
     let r = sourceData[i];
     let g = sourceData[i+1];
     let b = sourceData[i+2];
     
     const x = (i / 4) % w;
     const y = Math.floor((i / 4) / w);

     // --- SPATIAL OPS (Detail, Smoothing, Chromatic Aberration) ---
     if (needsSpatial) {
         // 0. Chromatic Aberration (Lateral Dispersion)
         if (chromaAmt > 0) {
             const distX = (x - cx) / w;
             const distY = (y - cy) / h;
             const distSq = distX*distX + distY*distY;
             const offset = Math.floor(chromaAmt * distSq * 20); // Scale effect by distance from center
             
             if (offset > 0) {
                 const rIdx = i - offset * 4;
                 const bIdx = i + offset * 4;
                 if (rIdx >= 0 && rIdx < sourceData.length) r = sourceData[rIdx];
                 if (bIdx >= 0 && bIdx < sourceData.length) b = sourceData[bIdx + 2];
             }
         }

         // Only do kernel ops away from edges
         if (x > 1 && x < w - 2 && y > 1 && y < h - 2) {
             const idx = i;
             const up = idx - w * 4, down = idx + w * 4, left = idx - 4, right = idx + 4;
             const avgR = (sourceData[up] + sourceData[down] + sourceData[left] + sourceData[right] + r) * 0.2;
             const avgG = (sourceData[up+1] + sourceData[down+1] + sourceData[left+1] + sourceData[right+1] + g) * 0.2;
             const avgB = (sourceData[up+2] + sourceData[down+2] + sourceData[left+2] + sourceData[right+2] + b) * 0.2;

             const hpR = r - avgR; const hpG = g - avgG; const hpB = b - avgB;
             
             // 1. Sharpen / Structure
             if (sharpenAmt > 0 || featurePop > 0) {
                 const boost = sharpenAmt + (featurePop * 2);
                 r += hpR * boost; g += hpG * boost; b += hpB * boost;
             }
             
             // 2. Clarity (Mid-tone contrast)
             if (clarityAmt !== 0) {
                 r += hpR * clarityAmt * 0.5;
                 g += hpG * clarityAmt * 0.5;
                 b += hpB * clarityAmt * 0.5;
             }
             
             // 3. Skin Smoothing & Denoise
             if (skinSmooth > 0 || grading.denoise > 0) {
                 // Heuristic: Skin is usually Red dominant, R > G > B
                 const isSkin = (r > g && g > b && r > 40 && Math.abs(r-g) > 10);
                 const blurStrength = isSkin ? Math.max(grading.denoise, skinSmooth) : grading.denoise;
                 
                 if (blurStrength > 0) {
                    const mix = blurStrength * 0.6; 
                    r = r * (1 - mix) + avgR * mix;
                    g = g * (1 - mix) + avgG * mix;
                    b = b * (1 - mix) + avgB * mix;
                 }
             }
             
             // 4. Eye Clarity & Teeth Whitening
             const luma = 0.2126*r + 0.7152*g + 0.0722*b;
             
             // Teeth Whitening: High Luma, slightly warm (R>=G, Low B), Low Saturation
             if (teethWhitening > 0 && luma > 100) {
                 const max = Math.max(r,g,b);
                 const min = Math.min(r,g,b);
                 const sat = (max - min) / (max || 1);
                 
                 // Teeth range: Low saturation, but not gray, usually slight yellow tint
                 if (sat < 0.4 && r > b && g > b) {
                     // Whitening = Desaturate + Boost Luma + Cool down (add Blue)
                     const wStr = teethWhitening * 0.5;
                     r = r * (1 - wStr*0.2) + 255 * wStr*0.2; // Brighten
                     g = g * (1 - wStr*0.2) + 255 * wStr*0.2; // Brighten
                     b = b * (1 - wStr*0.2) + 255 * wStr*0.4; // Cool (boost blue more)
                     
                     // Desaturate slightly
                     const gray = (r+g+b)/3;
                     r = r * (1 - wStr*0.3) + gray * wStr*0.3;
                     g = g * (1 - wStr*0.3) + gray * wStr*0.3;
                     b = b * (1 - wStr*0.3) + gray * wStr*0.3;
                 }
             }

             if (eyeClarity > 0) {
                 if (luma > 180 && luma < 240) { // Whites of eyes range
                     r += hpR * eyeClarity * 4;
                     g += hpG * eyeClarity * 4;
                     b += hpB * eyeClarity * 4;
                 }
             }
         }
     }

     // --- CHANNEL MIXER ---
     const ir = r, ig = g, ib = b;
     r = ir * mRR + ig * mRG + ib * mRB;
     g = ir * mGR + ig * mGG + ib * mGB;
     b = ir * mBR + ig * mBG + ib * mBB;

     // --- TEMP / TINT ---
     r += tempK; b -= tempK; g += tintM;

     // Normalize 0-1
     let nr = r / 255; let ng = g / 255; let nb = b / 255;

     // --- DEHAZE ---
     if (dehazeVal !== 0) {
         const minC = Math.min(nr, ng, nb);
         const dehazeFactor = dehazeVal * 0.2;
         nr = (nr - minC * dehazeFactor) / (1 - dehazeFactor);
         ng = (ng - minC * dehazeFactor) / (1 - dehazeFactor);
         nb = (nb - minC * dehazeFactor) / (1 - dehazeFactor);
     }

     // --- INPUT GAMMA & EXPOSURE ---
     if (gammaVal !== 1) {
         nr = Math.pow(Math.max(0, nr), gammaVal);
         ng = Math.pow(Math.max(0, ng), gammaVal);
         nb = Math.pow(Math.max(0, nb), gammaVal);
     }
     nr *= exposure; ng *= exposure; nb *= exposure;

     // --- CONTRAST, PIVOT & BLACK OFFSET ---
     nr = (nr - pivot) * contrast + pivot + (brightness - 1) + offsetVal;
     ng = (ng - pivot) * contrast + pivot + (brightness - 1) + offsetVal;
     nb = (nb - pivot) * contrast + pivot + (brightness - 1) + offsetVal;

     // --- LOG WHEELS (LGG) ---
     const applyLGG = (c: number, lift: number, gam: number, gain: number, off: number) => {
         let val = c * (1 - lift) + lift + off; 
         val *= gain;
         if (val > 0) val = Math.pow(val, 1 / Math.max(0.01, gam));
         return val;
     };
     nr = applyLGG(nr, grading.lift_r || 0, grading.gamma_r || 1, grading.gain_r || 1, grading.offset_r || 0);
     ng = applyLGG(ng, grading.lift_g || 0, grading.gamma_g || 1, grading.gain_g || 1, grading.offset_g || 0);
     nb = applyLGG(nb, grading.lift_b || 0, grading.gamma_b || 1, grading.gain_b || 1, grading.offset_b || 0);

     // --- SPLIT TONING ---
     const luma = 0.2126*nr + 0.7152*ng + 0.0722*nb;
     if (grading.split_shadow_sat > 0 || grading.split_highlight_sat > 0 || grading.split_mid_sat > 0) {
         const bal = grading.split_balance || 0;
         const sMask = Math.max(0, 1 - (luma * 2) + bal);
         const hMask = Math.max(0, (luma - 0.5 - bal) * 2);
         const mMask = 1 - sMask - hMask;

         if (sMask > 0 && grading.split_shadow_sat > 0) {
             const str = sMask * grading.split_shadow_sat * 0.3;
             nr += (shadowRGB[0]/255 - nr) * str;
             ng += (shadowRGB[1]/255 - ng) * str;
             nb += (shadowRGB[2]/255 - nb) * str;
         }
         if (hMask > 0 && grading.split_highlight_sat > 0) {
             const str = hMask * grading.split_highlight_sat * 0.3;
             nr += (highlightRGB[0]/255 - nr) * str;
             ng += (highlightRGB[1]/255 - ng) * str;
             nb += (highlightRGB[2]/255 - nb) * str;
         }
         if (mMask > 0 && grading.split_mid_sat > 0) {
             const str = mMask * grading.split_mid_sat * 0.3;
             nr += (midRGB[0]/255 - nr) * str;
             ng += (midRGB[1]/255 - ng) * str;
             nb += (midRGB[2]/255 - nb) * str;
         }
     }

     // --- HSL ENGINE (8-AXIS) & SELECTIVE COLOR ---
     const max = Math.max(nr, ng, nb);
     const min = Math.min(nr, ng, nb);
     const lum = (max + min) / 2;
     let hue = 0;
     let s = 0;
     
     if (max !== min) {
         const d = max - min;
         s = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
         if (max === nr) hue = (ng - nb) / d + (ng < nb ? 6 : 0);
         else if (max === ng) hue = (nb - nr) / d + 2;
         else hue = (nr - ng) / d + 4;
         hue /= 6; // 0-1
     }

     // Global Saturation & Vibrance
     if (vibrance !== 1 || saturation !== 1) {
         const satVal = s;
         const vibFactor = (vibrance - 1) * (1 - satVal * 2); // Boost low sat more
         const totalSat = saturation + vibFactor;
         
         if (s > 0) {
             nr = lum + (nr - lum) * totalSat;
             ng = lum + (ng - lum) * totalSat;
             nb = lum + (nb - lum) * totalSat;
         }
     }

     // 8-Axis Vector Scope
     {
         // Vectors: Red(0), Orange(0.08), Yellow(0.16), Green(0.33), Cyan(0.5), Blue(0.66), Purple(0.78), Magenta(0.83)
         const getSatBoost = (targetH: number, width: number, boost: number) => {
             if (!boost) return 0;
             let diff = Math.abs(hue - targetH);
             if (diff > 0.5) diff = 1 - diff; // Wrap
             if (diff < width) return boost * (1 - diff/width);
             return 0;
         };

         let boost = 0;
         boost += getSatBoost(0, 0.08, grading.sat_red || 0);
         boost += getSatBoost(0.08, 0.08, grading.sat_orange || 0);
         boost += getSatBoost(0.16, 0.12, grading.sat_yellow || 0);
         boost += getSatBoost(0.33, 0.15, grading.sat_green || 0);
         boost += getSatBoost(0.5, 0.15, grading.sat_cyan || 0);
         boost += getSatBoost(0.66, 0.15, grading.sat_blue || 0);
         boost += getSatBoost(0.78, 0.1, grading.sat_purple || 0);
         boost += getSatBoost(0.9, 0.1, grading.sat_magenta || 0);

         if (boost !== 0 && s > 0) {
             nr = lum + (nr - lum) * (1 + boost);
             ng = lum + (ng - lum) * (1 + boost);
             nb = lum + (nb - lum) * (1 + boost);
         }
     }

     // Selective Color (Sin City)
     if (grading.selective_mix > 0) {
         const targetH = (grading.selective_hue || 0) / 360; // 0-1
         const thresh = (grading.selective_threshold || 20) / 360;
         
         let diff = Math.abs(hue - targetH);
         if (diff > 0.5) diff = 1 - diff;
         
         let mask = 0;
         if (diff < thresh) {
             mask = 1 - (diff / thresh); // 1 at target, 0 at edge
             mask = Math.pow(mask, 0.5); // Smoother falloff
         }
         
         const bgSatMult = 1 - grading.selective_mix; 
         const finalMult = bgSatMult + (1 - bgSatMult) * mask;
         
         nr = lum + (nr - lum) * finalMult;
         ng = lum + (ng - lum) * finalMult;
         nb = lum + (nb - lum) * finalMult;
         
         // Target Boost
         if (mask > 0 && grading.selective_target_sat) {
             const boost = mask * grading.selective_target_sat;
             nr = lum + (nr - lum) * (1 + boost);
             ng = lum + (ng - lum) * (1 + boost);
             nb = lum + (nb - lum) * (1 + boost);
         }
     }

     // --- FILM GRAIN ---
     if (grainAmt > 0) {
         const noise = (Math.random() - 0.5) * (grainAmt / 255);
         // Grain usually more visible in midtones
         const grainMask = 1 - Math.pow(2 * lum - 1, 4); 
         const finalNoise = noise * grainMask;
         
         if (grading.grain_color) {
             nr += finalNoise * (1 + Math.random()*0.5);
             ng += finalNoise * (1 + Math.random()*0.5);
             nb += finalNoise * (1 + Math.random()*0.5);
         } else {
             nr += finalNoise; ng += finalNoise; nb += finalNoise;
         }
     }

     // Clamp
     data[i] = Math.min(255, Math.max(0, nr * 255));
     data[i+1] = Math.min(255, Math.max(0, ng * 255));
     data[i+2] = Math.min(255, Math.max(0, nb * 255));
  }
  
  ctx.putImageData(imageData, 0, 0);

  // --- PHASE 3: GLOBAL COMPOSITING ---
  
  // Halation
  if (grading.halation && grading.halation > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighten';
      ctx.filter = `blur(${4 + (grading.halation_radius||0)}px)`;
      ctx.globalAlpha = grading.halation;
      ctx.drawImage(canvas, 0, 0);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; 
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
  }

  // Bloom
  if (grading.bloom && grading.bloom > 0) {
      ctx.save();
      ctx.filter = `blur(${10 + (grading.bloom_radius||0)*20}px) brightness(${1 + grading.bloom})`;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = grading.bloom * 0.5;
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
  }

  // Diffusion
  if (grading.diffusion && grading.diffusion > 0) {
      ctx.save();
      ctx.filter = `blur(${20}px)`; 
      ctx.globalCompositeOperation = 'lighten';
      ctx.globalAlpha = grading.diffusion * 0.3;
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
  }

  // Vignette (Fixed Logic for Roundness/Feather)
  if (grading.vignette && grading.vignette > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      
      const feather = grading.vignette_feather ?? 0.5;
      const roundness = grading.vignette_roundness ?? 0;
      
      // Calculate aspect ratio corrected radius
      // roundness: -1 (Square) to 1 (Perfect Circle/Oval)
      // feather: 0 (Hard edge) to 1 (Soft)
      
      const aspect = w / h;
      const radiusX = w * 0.6;
      const radiusY = h * 0.6;
      
      const gradient = ctx.createRadialGradient(cx, cy, Math.max(w,h) * 0.2, cx, cy, Math.max(w,h) * 0.85);
      // For proper roundness we need a path or mask, but simple radial gradient is limited.
      // Better approach: Draw a "Hole"
      
      // Clear a temp canvas for the vignette mask
      const vCanvas = document.createElement('canvas');
      vCanvas.width = w; vCanvas.height = h;
      const vCtx = vCanvas.getContext('2d');
      if (vCtx) {
          vCtx.fillStyle = `rgba(0,0,0,${grading.vignette})`;
          vCtx.fillRect(0, 0, w, h);
          
          vCtx.globalCompositeOperation = 'destination-out';
          vCtx.beginPath();
          
          // Logic for Roundness (Square vs Circle)
          // Using ellipse/rect blend
          const rx = w/2 * (0.5 + (1-Math.abs(roundness))*0.4); 
          const ry = h/2 * (0.5 + (1-Math.abs(roundness))*0.4); 
          
          if (roundness > 0) {
             // Ellipse
             vCtx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          } else {
             // Rounded Rect approximation
             const r = Math.min(rx, ry) * (1 + roundness); // roundness is negative here
             vCtx.roundRect(cx - rx, cy - ry, rx*2, ry*2, Math.max(0, r));
          }
          
          vCtx.fill();
          
          // Apply Blur for Feather
          vCtx.globalCompositeOperation = 'source-over'; // unimportant for filter
      }
      
      // Draw the vignette mask with blur
      ctx.filter = `blur(${feather * 100}px)`;
      ctx.drawImage(vCanvas, 0, 0);
      ctx.filter = 'none';
      
      ctx.restore();
  }
};
