
import { pipeline, env } from 'https://esm.sh/@xenova/transformers@2.17.2';

// Skip local model checks for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class LuminaBrain {
  static instance: any = null;

  static async getInstance() {
    if (!this.instance) {
      // Using a segmentation model to refine masks or segment objects
      // 'birefnet-general' is excellent for background/foreground separation
      this.instance = await pipeline('image-segmentation', 'Xenova/birefnet-general', {
        device: 'webgpu', // Try WebGPU first
        dtype: 'fp32',    // Fallback safety
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;

  if (type === 'REFINE_MASK') {
    try {
      const segmenter = await LuminaBrain.getInstance();
      
      // In a real scenario, we might pass the original image AND the coarse mask 
      // to a specific inpainting-mask-refinement model. 
      // Here we use the segmentation model to ensure the mask aligns with object boundaries.
      const result = await segmenter(payload.imageUrl);

      let maskBlob;
      // Handle Transformers.js return types
      if (Array.isArray(result) && result[0]?.mask) {
         maskBlob = await result[0].mask.toBlob();
      } else if (result.mask) {
         maskBlob = await result.mask.toBlob();
      } else {
         maskBlob = await result.toBlob();
      }

      const bitmap = await createImageBitmap(maskBlob);

      (self as any).postMessage({ type: 'SUCCESS', id, result: bitmap }, [bitmap]);
    } catch (error: any) {
      (self as any).postMessage({ type: 'ERROR', id, error: error.message });
    }
  }
});
