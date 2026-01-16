import { uniqueId } from "tldraw";

interface SamRequest {
  resolve: (data: any) => void;
  reject: (err: any) => void;
}

class SamBridgeService {
  private worker: Worker;
  private pendingRequests: Map<string, SamRequest> = new Map();
  private activeImageId: string | null = null;

  constructor() {
    // Correct way to instantiate Workers in modern ESM environments
    const workerUrl = new URL('../workers/sam.worker.ts', import.meta.url);
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(e: MessageEvent) {
    const { type, id, result, error } = e.data;
    const req = this.pendingRequests.get(id);
    if (!req) return;

    if (type === 'ERROR') {
      req.reject(error);
    } else {
      req.resolve(result);
    }
    this.pendingRequests.delete(id);
  }

  /**
   * Pre-loads an image into the SAM worker using SharedArrayBuffer for zero-copy transfer.
   */
  async loadImage(imageUrl: string, imageId: string): Promise<void> {
    if (this.activeImageId === imageId) return; // Already loaded

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas error");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // --- Shared Memory Allocation ---
        // Create SAB big enough for RGBA data
        const sab = new SharedArrayBuffer(imageData.data.length);
        const uint8View = new Uint8Array(sab);
        uint8View.set(imageData.data);

        const id = uniqueId();
        this.pendingRequests.set(id, { resolve, reject });

        this.worker.postMessage({
          type: 'PROCESS_EMBEDDING',
          id,
          payload: {
            imageId,
            width: img.width,
            height: img.height,
            channels: 4,
            sharedBuffer: sab 
          }
        });
        
        this.activeImageId = imageId;
      };
      img.onerror = reject;
    });
  }

  /**
   * Requests a segmentation mask for a specific point on the active image.
   */
  async segmentPoint(imageId: string, x: number, y: number, originalWidth: number, originalHeight: number): Promise<ImageBitmap> {
    const id = uniqueId();
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: 'SEGMENT_POINT',
        id,
        payload: {
          imageId,
          point: [x, y],
          originalSize: [originalWidth, originalHeight]
        }
      });
    });
  }
}

export const samBridge = new SamBridgeService();