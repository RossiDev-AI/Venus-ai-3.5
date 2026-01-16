
import { SamModel, AutoProcessor, env, RawImage } from 'https://esm.sh/@xenova/transformers@2.17.2';

// Configure for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class SAM {
  static modelId = 'Xenova/slimmable-networks-mobile-sam-vit-b'; // Fast, lightweight SAM
  static model: any = null;
  static processor: any = null;
  static currentEmbeddings: any = null;
  static currentImageId: string | null = null;

  static async getInstance() {
    if (!this.model) {
      this.model = await SamModel.from_pretrained(this.modelId, {
        dtype: 'fp16', // Quantized for speed
        device: 'webgpu', // Prefer WebGPU
      });
      this.processor = await AutoProcessor.from_pretrained(this.modelId);
    }
    return { model: this.model, processor: this.processor };
  }
}

self.onmessage = async (e) => {
  const { type, id, payload } = e.data;

  if (type === 'PROCESS_EMBEDDING') {
    // 1. Compute Image Embeddings (Heavy task, run once per image)
    try {
      const { model, processor } = await SAM.getInstance();
      const { width, height, channels, sharedBuffer, imageId } = payload;

      // Reconstruct image from SharedArrayBuffer (Zero-Copy)
      const array = new Uint8ClampedArray(sharedBuffer);
      const rawImage = new RawImage(array, width, height, channels);

      const inputs = await processor(rawImage);
      SAM.currentEmbeddings = await model.get_image_embeddings(inputs);
      SAM.currentImageId = imageId;

      self.postMessage({ type: 'EMBEDDING_READY', id });
    } catch (err: any) {
      self.postMessage({ type: 'ERROR', id, error: err.message });
    }
  } 
  else if (type === 'SEGMENT_POINT') {
    // 2. Run Inference on Point (Lightweight, runs on click)
    try {
      if (!SAM.currentEmbeddings || SAM.currentImageId !== payload.imageId) {
        throw new Error("Embeddings not ready or mismatch.");
      }

      const { model, processor } = await SAM.getInstance();
      const { point } = payload; // [x, y]

      // Prepare inputs: 1 point, label 1 (foreground)
      const input_points = [[[point[0], point[1]]]];
      const input_labels = [[1]];

      const outputs = await model({
        ...SAM.currentEmbeddings,
        input_points,
        input_labels,
      });

      // Extract the best mask (highest IOU score)
      // The model returns multiple masks, usually index 0 is best for single point
      const masks = outputs.pred_masks;
      const maskData = masks.data; // Float32Array of logits
      const dims = masks.dims; // [batch, points, height, width]

      // Post-process mask: Logits -> Probability -> Threshold -> Binary Bitmap
      const maskWidth = dims[3];
      const maskHeight = dims[2];
      const maskSize = maskWidth * maskHeight;
      const binaryMask = new Uint8Array(maskSize * 4); // RGBA

      for (let i = 0; i < maskSize; i++) {
        // Simple threshold at 0.0 for logits
        const val = maskData[i] > 0.0 ? 255 : 0;
        const idx = i * 4;
        binaryMask[idx] = val;     // R
        binaryMask[idx + 1] = val; // G
        binaryMask[idx + 2] = val; // B
        binaryMask[idx + 3] = val; // A (Alpha map)
      }

      const bitmap = await createImageBitmap(new ImageData(new Uint8ClampedArray(binaryMask), maskWidth, maskHeight));

      (self as any).postMessage({ type: 'SEGMENT_COMPLETE', id, result: bitmap }, [bitmap]);

    } catch (err: any) {
      self.postMessage({ type: 'ERROR', id, error: err.message });
    }
  }
};
