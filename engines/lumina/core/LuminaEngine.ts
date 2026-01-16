
import * as PIXI from 'pixi.js';
import { TLShapeId, Editor } from 'tldraw';
import { filterManager } from './FilterManager';
import { storageManager } from './StorageManager';
import { LuminaBlendFilter } from '../filters/LuminaBlendFilter';

export class LuminaEngine {
    public app: PIXI.Application;
    private sprites: Map<TLShapeId, PIXI.Sprite | PIXI.Container> = new Map();
    private symbols: Map<string, PIXI.Texture> = new Map();
    private renderBuffers: Map<string, PIXI.RenderTexture> = new Map();
    private isInitialized = false;

    constructor() {
        this.app = new PIXI.Application();
    }

    async initialize(container: HTMLElement) {
        if (this.isInitialized) return;
        
        try {
            await this.app.init({
                resizeTo: container,
                backgroundAlpha: 0,
                antialias: true,
                preference: 'webgl', // Prefer WebGL for filters
                resolution: window.devicePixelRatio || 2,
                autoDensity: true,
                hello: true // Debug log to confirm Pixi version
            });
            container.appendChild(this.app.canvas);
            this.isInitialized = true;
            console.log('Lumina Engine: GPU Context Acquired');
        } catch (e) {
            console.error('Lumina Engine: Failed to initialize WebGL context', e);
        }
    }

    /**
     * Smart Objects: Registra ou recupera uma textura compartilhada.
     */
    async getSmartTexture(symbolId: string, url: string): Promise<PIXI.Texture> {
        if (this.symbols.has(symbolId)) return this.symbols.get(symbolId)!;
        const texture = await PIXI.Assets.load(url);
        this.symbols.set(symbolId, texture);
        return texture;
    }

    /**
     * Recursive Tree Builder: Gerencia Smart Objects e Clipping Masks.
     */
    async upsertSprite(id: TLShapeId, props: any, editor: Editor) {
        if (!this.isInitialized) return;

        let displayObject = this.sprites.get(id);
        const bounds = editor.getShapePageBounds(id);
        const viewport = editor.getViewportPageBounds();

        // 1. Culling Engine
        if (!bounds || !viewport.collides(bounds)) {
            if (displayObject) displayObject.renderable = false;
            return;
        }

        // 2. Adjustment Layer Logic
        if (props.type === 'adjustment') {
            await this.processAdjustmentLayer(id, props, editor);
            return;
        }

        // 3. Smart Object / Normal Sprite
        if (!displayObject) {
            const texture = props.symbolId 
                ? await this.getSmartTexture(props.symbolId, props.url)
                : await PIXI.Assets.load(props.url);
            
            displayObject = new PIXI.Sprite(texture);
            this.app.stage.addChild(displayObject);
            this.sprites.set(id, displayObject);
        }

        displayObject.renderable = true;
        // Use editor bounds to position and size the sprite accurately on the canvas
        displayObject.x = bounds.x;
        displayObject.y = bounds.y;
        displayObject.width = bounds.width;
        displayObject.height = bounds.height;
        
        // 4. Clipping Masks
        if (props.clippingParentId) {
            const parent = this.sprites.get(props.clippingParentId);
            if (parent instanceof PIXI.Sprite) {
                displayObject.mask = parent;
            }
        }

        // 5. Advanced Blending
        if (props.blendMode && props.blendMode !== 'normal') {
            this.applyAdvancedBlend(displayObject as PIXI.Sprite, props.blendMode);
        }

        filterManager.applyFilters(displayObject as PIXI.Sprite, id, props);
    }

    // --- Stub Methods for Engine Features ---
    async generateDepthMap(id: TLShapeId, onProgress: (p: any) => void) {
        onProgress({ status: 'progress', progress: 0 });
        await new Promise(r => setTimeout(r, 1000));
        onProgress({ status: 'progress', progress: 100 });
    }

    setLensActive(id: TLShapeId | null) {
        console.log(`Lumina Engine: Lens processing enabled for node ${id}`);
    }

    async executeSmartFill(id: TLShapeId, editor: Editor, onProgress: (p: any) => void): Promise<string> {
        onProgress({ status: 'progress', progress: 10 });
        await new Promise(r => setTimeout(r, 2000));
        onProgress({ status: 'progress', progress: 100 });
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    }

    async autoVectorize(id: TLShapeId, options: any, callback: (pathData: string) => void) {
        await new Promise(r => setTimeout(r, 1200));
        callback("M 0 0 L 100 0 L 100 100 L 0 100 Z");
    }

    async extractBackground(id: TLShapeId, onProgress: (p: any) => void) {
        onProgress({ status: 'progress', progress: 0 });
        await new Promise(r => setTimeout(r, 1500));
        onProgress({ status: 'progress', progress: 100 });
    }

    private async processAdjustmentLayer(id: TLShapeId, props: any, editor: Editor) {
        const bounds = editor.getShapePageBounds(id)!;
        
        let buffer = this.renderBuffers.get(id);
        if (!buffer || buffer.width !== bounds.width) {
            buffer = PIXI.RenderTexture.create({ width: bounds.width, height: bounds.height });
            this.renderBuffers.set(id, buffer);
        }

        let sprite = this.sprites.get(id) as PIXI.Sprite;
        if (!sprite) {
            sprite = new PIXI.Sprite(buffer);
            this.app.stage.addChild(sprite);
            this.sprites.set(id, sprite);
        }
        
        sprite.visible = false;
        
        const matrix = new PIXI.Matrix();
        matrix.translate(-bounds.x, -bounds.y);
        this.app.renderer.render({
            container: this.app.stage,
            target: buffer,
            transform: matrix,
            clear: true
        });

        sprite.visible = true;
        sprite.x = bounds.x;
        sprite.y = bounds.y;
        
        filterManager.applyFilters(sprite, id, props);
    }

    private applyAdvancedBlend(sprite: PIXI.Sprite, mode: string) {
        let blendFilter = sprite.filters?.find(f => f instanceof LuminaBlendFilter) as LuminaBlendFilter;
        if (!blendFilter) {
            blendFilter = new LuminaBlendFilter();
            sprite.filters = [...(sprite.filters || []), blendFilter];
        }
        blendFilter.setMode(mode);
    }

    syncCamera(x: number, y: number, z: number) {
        this.app.stage.x = x;
        this.app.stage.y = y;
        this.app.stage.scale.set(z);
    }

    removeSprite(id: TLShapeId) {
        const obj = this.sprites.get(id);
        if (obj) {
            this.app.stage.removeChild(obj);
            obj.destroy();
            this.sprites.delete(id);
            this.renderBuffers.delete(id);
        }
    }
}

export const luminaEngine = new LuminaEngine();
