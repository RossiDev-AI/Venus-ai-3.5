import pica from 'pica';
// Fix: Added PIXI import to resolve 'Cannot find name PIXI' error
import * as PIXI from 'pixi.js';
import { luminaEngine } from './LuminaEngine';
import { storageManager } from './StorageManager';

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'tiff';

export interface ExportSettings {
    width: number;
    height: number;
    dpi: number;
    format: ExportFormat;
    quality: number;
    bitDepth: 8 | 16;
    iccProfile: 'sRGB' | 'AdobeRGB' | 'CMYK';
}

export class ExportManager {
    private picaInstance = pica();

    /**
     * Inicia o processo de exportação em alta fidelidade.
     */
    async export(settings: ExportSettings, onProgress: (p: number) => void): Promise<Blob> {
        console.log('Lumina Export: Initializing Offscreen Buffer', settings);
        
        // 1. Criar Offscreen Canvas na resolução final
        const exportCanvas = new OffscreenCanvas(settings.width, settings.height);
        
        // 2. Renderizar o estado atual do motor para o canvas de exportação
        onProgress(10);
        await this.renderOffscreen(exportCanvas, settings);
        
        // 3. Resampling Lanczos3 (via Pica) se houver mudança de escala
        onProgress(40);
        const finalCanvas = await this.applyResampling(exportCanvas, settings);

        // 4. Encoding Industrial
        onProgress(70);
        const blob = await this.encode(finalCanvas, settings);
        
        // 5. Bufferização OPFS (Evita pico de RAM antes do download)
        const exportId = `export_${Date.now()}`;
        await storageManager.storeAsset(exportId, blob);
        
        onProgress(100);
        return blob;
    }

    private async renderOffscreen(canvas: OffscreenCanvas, settings: ExportSettings) {
        // O motor PixiJS renderiza o stage atual para o canvas offscreen
        const renderer = luminaEngine.app.renderer;
        
        // Temporariamente ajustamos o renderer ou usamos uma textura de renderização
        // Fix: Use PIXI namespace for RenderTexture to resolve 'Cannot find name PIXI'
        const renderTexture = PIXI.RenderTexture.create({
            width: settings.width,
            height: settings.height
        });

        // Captura o stage
        renderer.render({
            container: luminaEngine.app.stage,
            target: renderTexture
        });

        // Extrai para o canvas offscreen
        const pixels = await renderer.extract.canvas(renderTexture);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(pixels, 0, 0, settings.width, settings.height);
        
        renderTexture.destroy(true);
    }

    private async applyResampling(source: OffscreenCanvas, settings: ExportSettings): Promise<OffscreenCanvas> {
        // Se a escala for 1:1, não precisa de Pica
        if (source.width === settings.width && source.height === settings.height) return source;

        const target = new OffscreenCanvas(settings.width, settings.height);
        await this.picaInstance.resize(source, target, {
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2
        });
        return target;
    }

    private async encode(canvas: OffscreenCanvas, settings: ExportSettings): Promise<Blob> {
        const quality = settings.quality / 100;
        
        // Mock de LittleCMS/ICC logic: Aqui anexaríamos o perfil ao buffer
        // Em um ambiente industrial, usaríamos UPNG.encode ou similar
        
        switch (settings.format) {
            case 'png':
                return await canvas.convertToBlob({ type: 'image/png' });
            case 'webp':
                return await canvas.convertToBlob({ type: 'image/webp', quality });
            case 'jpeg':
                return await canvas.convertToBlob({ type: 'image/jpeg', quality });
            case 'tiff':
                // Nota: TIFF requer UTIF.js para encoding de 16-bit real
                return await canvas.convertToBlob({ type: 'image/png' }); // Fallback
            default:
                return await canvas.convertToBlob({ type: 'image/png' });
        }
    }
}

export const exportManager = new ExportManager();