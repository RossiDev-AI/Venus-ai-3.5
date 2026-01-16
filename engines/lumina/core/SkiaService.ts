
import CanvasKitInit, { type CanvasKit, type Typeface } from 'canvaskit-wasm';

export class SkiaService {
    private ck: CanvasKit | null = null;
    private initPromise: Promise<CanvasKit> | null = null;
    private typefaces: Map<string, Typeface> = new Map();

    async initialize(): Promise<CanvasKit> {
        if (this.ck) return this.ck;
        if (this.initPromise) return this.initPromise;

        console.log('Lumina Skia: Initializing CanvasKit WASM...');
        
        this.initPromise = CanvasKitInit({
            // Fix: Use absolute URL for WASM binary to avoid relative path resolution errors in Sandbox
            // This prevents the "at.get is not a function" error which occurs when the WASM fails to load/compile
            locateFile: (file) => `https://unpkg.com/canvaskit-wasm@0.39.1/bin/${file}`,
        }).then((ck) => {
            this.ck = ck;
            console.log('Lumina Skia: Environment Ready');
            return ck;
        }).catch((e) => {
            console.error("Lumina Skia: Critical WASM Init Failure", e);
            throw e;
        });

        return this.initPromise;
    }

    async loadFont(name: string, url: string): Promise<Typeface | null> {
        if (this.typefaces.has(name)) return this.typefaces.get(name)!;
        
        try {
            const ck = await this.initialize();
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const tf = ck.Typeface.MakeFreeTypeFaceFromData(buffer);
            if (tf) {
                this.typefaces.set(name, tf);
                return tf;
            }
        } catch (e) {
            console.error(`Lumina Skia: Failed to load font ${name}`, e);
        }
        return null;
    }

    getTypeface(name: string): Typeface | null {
        return this.typefaces.get(name) || null;
    }

    getInstance(): CanvasKit | null {
        return this.ck;
    }
}

export const skiaService = new SkiaService();
