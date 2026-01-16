
import * as PIXI from 'pixi.js';
import { type CanvasKit, type Surface, type Canvas } from 'canvaskit-wasm';
import { skiaService } from './SkiaService';

export class SkiaLayer {
    private ck: CanvasKit | null = null;
    private surface: Surface | null = null;
    private canvasElement: HTMLCanvasElement;
    private texture: PIXI.Texture | null = null;
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = width;
        this.canvasElement.height = height;
    }

    async setup() {
        this.ck = await skiaService.initialize();
        this.surface = this.ck.MakeCanvasSurface(this.canvasElement);
        if (!this.surface) throw new Error('SkiaLayer: Failed to create surface');
        
        // Criar textura Pixi vinculada ao elemento canvas do Skia
        this.texture = PIXI.Texture.from(this.canvasElement);
    }

    /**
     * Executa operações de desenho de alta precisão.
     * @param drawFn Callback que recebe o canvas do Skia para desenho.
     */
    draw(drawFn: (canvas: Canvas, ck: CanvasKit) => void) {
        if (!this.surface || !this.ck) return;

        const canvas = this.surface.getCanvas();
        drawFn(canvas, this.ck);
        
        this.surface.flush();
        
        // Sincroniza a textura do Pixi com o novo frame do Skia
        if (this.texture) {
            this.texture.source.update();
        }
    }

    getTexture(): PIXI.Texture | null {
        return this.texture;
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.canvasElement.width = w;
        this.canvasElement.height = h;
        
        // Recriar surface após redimensionamento (Skia requirement)
        if (this.surface) {
            this.surface.delete();
            if (this.ck) {
                this.surface = this.ck.MakeCanvasSurface(this.canvasElement);
            }
        }
    }

    /**
     * Liberação rigorosa de memória WASM e GPU.
     */
    dispose() {
        if (this.surface) {
            this.surface.delete();
            this.surface = null;
        }
        if (this.texture) {
            this.texture.destroy(true);
            this.texture = null;
        }
        this.ck = null;
    }
}
