
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { warmupManager } from '../engines/lumina/core/WarmupManager';
import { Capabilities } from '../utils/Capabilities';
import { toast } from 'sonner';

export class FFmpegService {
  private static instance: FFmpeg | null = null;
  private static isLoaded = false;

  static async getFFmpeg() {
    if (this.instance) return this.instance;
    const ffmpeg = new FFmpeg();
    this.instance = ffmpeg;
    return ffmpeg;
  }

  static async load(onLog?: (msg: string) => void) {
    const ffmpeg = await this.getFFmpeg();
    if (this.isLoaded) return ffmpeg;

    const useMultithread = Capabilities.canUseMultithreading;
    
    // Fallback dinâmico para versão Single Thread se não houver isolamento
    const baseURL = useMultithread 
        ? 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
        : 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/esm';
    
    if (!useMultithread) {
        console.warn("FFmpeg: Carregando Core Single-Thread por restrição de ambiente.");
    }

    try {
        // Correção Crítica: Usar toBlobURL para evitar bloqueio de scripts externos no Firefox
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

        await ffmpeg.load({
          coreURL,
          wasmURL,
        });

        ffmpeg.on('log', ({ message }) => {
          if (onLog) onLog(message);
        });

        this.isLoaded = true;
        warmupManager.updateTask('ffmpeg', { status: 'ready', progress: 100 });
    } catch (e) {
        console.error("FFmpeg: Falha crítica na inicialização do Kernel WASM.", e);
        warmupManager.updateTask('ffmpeg', { status: 'error' });
        toast.error("Erro no motor de vídeo.");
    }
    
    return ffmpeg;
  }

  static async transcode(
    frames: Blob[],
    fps: number = 30,
    format: 'mp4' | 'webm' = 'mp4',
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    const ffmpeg = await this.getFFmpeg();
    
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) onProgress(progress * 100);
    });

    for (let i = 0; i < frames.length; i++) {
      const num = i.toString().padStart(5, '0');
      await ffmpeg.writeFile(`frame_${num}.png`, await fetchFile(frames[i]));
    }

    const outputName = `output.${format}`;
    const args = [
      '-framerate', fps.toString(),
      '-i', 'frame_%05d.png',
      '-c:v', format === 'mp4' ? 'libx264' : 'libvpx-vp9',
      '-pix_fmt', 'yuv420p',
      outputName
    ];

    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    
    // Cleanup virtual FS
    for (let i = 0; i < frames.length; i++) {
        const num = i.toString().padStart(5, '0');
        await ffmpeg.deleteFile(`frame_${num}.png`);
    }
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
  }
}
