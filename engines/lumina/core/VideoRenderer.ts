
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import * as PIXI from 'pixi.js';
import { LuminaEngine } from './LuminaEngine';
import { AnimationTrack, VideoExportSettings } from '../../../types';

export class VideoRenderer {
    private ffmpeg: FFmpeg | null = null;
    private isLoaded = false;
    private engine: LuminaEngine;

    constructor(engine: LuminaEngine) {
        this.engine = engine;
    }

    /**
     * Carrega o núcleo do FFmpeg em uma thread separada (se suportado) ou via blob URL.
     */
    async initialize() {
        if (this.isLoaded) return;

        this.ffmpeg = new FFmpeg();
        
        // Log forwarding
        this.ffmpeg.on('log', ({ message }) => {
            console.debug(`[FFmpeg]: ${message}`);
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            // Habilita suporte a multi-threading se SharedArrayBuffer estiver disponível
            // workerLoadURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
        });

        this.isLoaded = true;
    }

    /**
     * Interpolação linear simples com suporte básico a easing.
     */
    private interpolate(start: number, end: number, progress: number, easing: string = 'linear'): number {
        let t = progress;
        // Basic easings
        switch (easing) {
            case 'easeIn': t = t * t; break;
            case 'easeOut': t = t * (2 - t); break;
            case 'easeInOut': t = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; break;
        }
        return start + (end - start) * t;
    }

    /**
     * Aplica o estado da animação aos sprites do PixiJS para um dado tempo.
     */
    private applyAnimationState(time: number, tracks: Map<string, AnimationTrack[]>) {
        tracks.forEach((objTracks, spriteId) => {
            // Note: In a real implementation, we would access sprites by ID map from LuminaEngine.
            // Assuming LuminaEngine exposes a method to get sprite by ID or we iterate children.
            // For agora, simulamos encontrando o sprite no stage por nome ou propriedade.
            const sprite = (this.engine.app.stage.children.find((c: any) => c.name === spriteId || (c as any)._shapeId === spriteId) as PIXI.Sprite);
            
            if (sprite) {
                objTracks.forEach(track => {
                    // Encontrar keyframes vizinhos
                    const sorted = track.keyframes.sort((a, b) => a.time - b.time);
                    let startKf = sorted[0];
                    let endKf = sorted[sorted.length - 1];

                    // Clamp values
                    if (time <= startKf.time) {
                        this.applyProperty(sprite, track.property, startKf.value);
                        return;
                    }
                    if (time >= endKf.time) {
                        this.applyProperty(sprite, track.property, endKf.value);
                        return;
                    }

                    // Interpolate
                    for (let i = 0; i < sorted.length - 1; i++) {
                        if (time >= sorted[i].time && time < sorted[i+1].time) {
                            startKf = sorted[i];
                            endKf = sorted[i+1];
                            const range = endKf.time - startKf.time;
                            const progress = (time - startKf.time) / range;
                            const val = this.interpolate(startKf.value, endKf.value, progress, endKf.easing);
                            this.applyProperty(sprite, track.property, val);
                            break;
                        }
                    }
                });
            }
        });
    }

    private applyProperty(sprite: PIXI.Sprite, prop: string, value: number) {
        switch (prop) {
            case 'x': sprite.x = value; break;
            case 'y': sprite.y = value; break;
            case 'scale': sprite.scale.set(value); break;
            case 'rotation': sprite.rotation = value * (Math.PI / 180); break;
            case 'opacity': sprite.alpha = value; break;
            case 'blur': 
                const filter = sprite.filters?.find(f => f instanceof PIXI.BlurFilter) as PIXI.BlurFilter;
                if (filter) filter.strength = value;
                break;
        }
    }

    /**
     * Pipeline principal de renderização.
     */
    async renderVideo(
        settings: VideoExportSettings, 
        tracks: Map<string, AnimationTrack[]>, 
        onProgress: (p: number) => void
    ): Promise<Uint8Array | null> {
        if (!this.ffmpeg) await this.initialize();
        if (!this.ffmpeg) throw new Error("FFmpeg init failed");

        const { width, height, fps, duration, format } = settings;
        const totalFrames = Math.ceil(duration * fps);
        const timeStep = 1 / fps;

        // 1. Preparar Canvas
        const app = this.engine.app;
        const originalWidth = app.renderer.width;
        const originalHeight = app.renderer.height;
        
        // Redimensionar para saída temporariamente
        app.renderer.resize(width, height);
        
        // Parar Ticker automático para controle manual
        app.ticker.stop();

        try {
            console.log(`Starting Render: ${totalFrames} frames at ${width}x${height}`);

            // 2. Loop de Renderização
            for (let i = 0; i < totalFrames; i++) {
                const currentTime = i * timeStep;
                
                // A. Atualizar Cena (Animação)
                this.applyAnimationState(currentTime, tracks);
                
                // B. Renderizar Frame
                app.render();

                // C. Extrair Blob
                // Usamos o canvas do Pixi diretamente. 
                // Pixi v8 app.canvas é o elemento HTMLCanvasElement ou OffscreenCanvas
                const canvas = app.canvas as HTMLCanvasElement;
                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
                
                if (blob) {
                    const filename = `frame_${i.toString().padStart(5, '0')}.png`;
                    await this.ffmpeg.writeFile(filename, await fetchFile(blob));
                }

                // UI Feedback (yield to main thread)
                onProgress(Math.round((i / totalFrames) * 50)); // Primeiros 50% é rendering
                await new Promise(r => setTimeout(r, 0));
            }

            // 3. Encoding
            onProgress(55);
            const outputName = `output.${format}`;
            const inputArgs = ['-framerate', fps.toString(), '-i', 'frame_%05d.png'];
            let codecArgs: string[] = [];

            if (format === 'mp4') {
                // H.264 High Profile, YUV420P para compatibilidade máxima
                codecArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-crf', '23'];
            } else if (format === 'webm') {
                // VP9 com transparência (se necessário)
                codecArgs = ['-c:v', 'libvpx-vp9', '-lossless', '1'];
                if (settings.transparent) {
                    codecArgs.push('-pix_fmt', 'yuva420p');
                }
            } else if (format === 'gif') {
                // Paleta otimizada para GIF de alta qualidade
                // Complex filter: generate palette -> use palette
                await this.ffmpeg.exec([
                    ...inputArgs, 
                    '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen`, 
                    '-y', 'palette.png'
                ]);
                codecArgs = [
                    '-i', 'palette.png',
                    '-lavfi', `fps=${fps},scale=${width}:${height}:flags=lanczos[x];[x][1:v]paletteuse`,
                ];
            }

            await this.ffmpeg.exec([...inputArgs, ...codecArgs, outputName]);
            
            onProgress(90);
            const data = await this.ffmpeg.readFile(outputName);
            
            // 4. Limpeza
            // Limpar frames para liberar memória do WASM
            for (let i = 0; i < totalFrames; i++) {
                const f = `frame_${i.toString().padStart(5, '0')}.png`;
                await this.ffmpeg.deleteFile(f);
            }
            if (format === 'gif') await this.ffmpeg.deleteFile('palette.png');
            await this.ffmpeg.deleteFile(outputName);

            onProgress(100);
            return data as Uint8Array;

        } catch (e) {
            console.error("Render error:", e);
            return null;
        } finally {
            // Restaurar estado do app
            app.renderer.resize(originalWidth, originalHeight);
            app.ticker.start();
        }
    }
}
