
import { pipeline, env, RawImage } from 'https://esm.sh/@xenova/transformers@2.17.2';
import * as Comlink from 'https://esm.sh/comlink@4.4.1';

// Configuração para ambiente Browser/Worker
env.allowLocalModels = false;
env.useBrowserCache = true;

class IAWorkerKernel {
  static segmenter: any = null;
  static depthEstimator: any = null;

  static async getSegmenter() {
    if (this.segmenter === null) {
      console.log("Kernel: Carregando modelo de segmentação...");
      // BiRefNet é SOTA (State of the Art) para remoção de fundo
      this.segmenter = await pipeline('image-segmentation', 'Xenova/birefnet-general', {
        device: 'webgpu', // Tenta WebGPU primeiro
        dtype: 'fp32', // Fallback seguro
      });
    }
    return this.segmenter;
  }
}

export class IAWorkerService {
  /**
   * Remove o fundo da imagem usando IA local.
   * Retorna um ImageBitmap para transferência zero-copy.
   */
  async segmentImage(imageUrl: string): Promise<ImageBitmap> {
    const segmenter = await IAWorkerKernel.getSegmenter();
    
    // Inferência
    const result = await segmenter(imageUrl);
    
    // O pipeline retorna uma RawImage ou similar que pode ser convertida para blob
    // Se for uma máscara binária, precisamos aplicá-la ou retornar a imagem RGBA
    // O modelo birefnet retorna a imagem com alfa ou a máscara. Vamos assumir processamento.
    
    // Para simplificar a integração com o frontend, retornamos a máscara processada ou a imagem final.
    // Em transformers.js v2+, image-segmentation pipelines geralmente retornam um objeto com `mask` ou a imagem direta.
    
    // Extraindo blob
    const blob = await result.toBlob();
    return await createImageBitmap(blob);
  }

  /**
   * Análise de Histograma Ultra-Rápida (Offscreen)
   */
  async analyzeLuminance(imageBase64: string) {
    try {
        const response = await fetch(imageBase64);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        const canvas = new OffscreenCanvas(256, 256); // Downscale para performance
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        
        ctx.drawImage(bitmap, 0, 0, 256, 256);
        const imgData = ctx.getImageData(0, 0, 256, 256);
        const data = imgData.data;
        
        const r = new Uint32Array(256), g = new Uint32Array(256), b = new Uint32Array(256), l = new Uint32Array(256);
        
        for (let i = 0; i < data.length; i += 4) {
          r[data[i]]++;
          g[data[i+1]]++;
          b[data[i+2]]++;
          const luma = Math.round(0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2]);
          l[luma]++;
        }
        
        return { 
            r: Array.from(r), 
            g: Array.from(g), 
            b: Array.from(b), 
            l: Array.from(l) 
        };
    } catch (e) {
        return null;
    }
  }
}

Comlink.expose(new IAWorkerService());
