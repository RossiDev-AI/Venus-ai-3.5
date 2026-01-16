
import { pipeline, env, RawImage } from 'https://esm.sh/@huggingface/transformers@3.0.0-alpha.19';

// Configuração para processamento em browser com cache agressivo
env.allowLocalModels = false;
env.useBrowserCache = true;

class NeuralAIKernel {
    static segmentationInstance: any = null;
    static depthInstance: any = null;

    static async getSegmenter(progressCallback: (p: any) => void) {
        if (!this.segmentationInstance) {
            this.segmentationInstance = await pipeline('image-segmentation', 'Xenova/rmbg-1.4', {
                progress_callback: progressCallback,
                device: 'webgpu'
            });
        }
        return this.segmentationInstance;
    }

    static async getDepthEstimator(progressCallback: (p: any) => void) {
        if (!this.depthInstance) {
            // DepthAnything é o estado da arte para guiar difusão mantendo perspectiva
            this.depthInstance = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
                progress_callback: progressCallback,
                device: 'webgpu'
            });
        }
        return this.depthInstance;
    }
}

self.onmessage = async (e: MessageEvent) => {
    const { type, buffer, width, height, id, options } = e.data;

    try {
        if (type === 'EXTRACT_STRUCTURE') {
            const depthEstimator = await NeuralAIKernel.getDepthEstimator((p) => {
                self.postMessage({ type: 'PROGRESS', payload: p });
            });

            // Converte buffer RGBA para formato RawImage
            const image = new RawImage(new Uint8ClampedArray(buffer), width, height, 4);
            const result = await depthEstimator(image);
            
            // O mapa de profundidade é essencial para o Generative Fill manter a escala
            const depthCanvas = await result.depth.toCanvas();
            const depthData = depthCanvas.toDataURL('image/png');

            self.postMessage({ type: 'STRUCTURE_SUCCESS', id, depthData });
            return;
        }

        if (type === 'REMOVE_BG') {
            const segmenter = await NeuralAIKernel.getSegmenter((p) => {
                self.postMessage({ type: 'PROGRESS', payload: p });
            });
            const image = new RawImage(new Uint8ClampedArray(buffer), width, height, 4);
            const result = await segmenter(image);
            const maskCanvas = await result.mask.toCanvas();
            const maskData = maskCanvas.toDataURL('image/png');
            self.postMessage({ type: 'SUCCESS', id, maskData });
        }
    } catch (error: any) {
        console.error("AI Worker Error:", error);
        self.postMessage({ type: 'ERROR', message: error.message });
    }
};
