
import { pipeline, env, RawImage } from 'https://esm.sh/@huggingface/transformers@3.0.0-alpha.19';

// Configuração para SharedArrayBuffer (SharedWorker-ready)
env.allowLocalModels = false;
env.useBrowserCache = true;

class NeuralAIKernel {
    static segmentationInstance: any = null;

    static async getSegmenter(device: string, onProgress: (p: any) => void) {
        if (!this.segmentationInstance) {
            // Em transformers.js v3, o progress_callback reporta estágios de download
            this.segmentationInstance = await pipeline('image-segmentation', 'Xenova/rmbg-1.4', {
                progress_callback: onProgress,
                device: device // 'webgpu', 'wasm' ou 'webgl'
            });
        }
        return this.segmentationInstance;
    }
}

self.onmessage = async (e: MessageEvent) => {
    // 1. Handshake Check
    if (e.data === 'PING') {
        self.postMessage('PONG');
        return;
    }

    const { type, buffer, width, height, id, device = 'wasm' } = e.data;

    try {
        if (type === 'REMOVE_BG') {
            const segmenter = await NeuralAIKernel.getSegmenter(device, (p) => {
                // Reporta progresso real para a UI principal
                self.postMessage({ type: 'PROGRESS', id, payload: p });
            });
            const image = new RawImage(new Uint8ClampedArray(buffer), width, height, 4);
            const result = await segmenter(image);
            const maskCanvas = await result.mask.toCanvas();
            const maskData = maskCanvas.toDataURL('image/png');
            self.postMessage({ type: 'SUCCESS', id, maskData });
        }
    } catch (error: any) {
        self.postMessage({ type: 'ERROR', id, message: error.message });
    }
};
