
/**
 * Lumina Batch Kernel:
 * Executa filtros e transformações em OffscreenCanvas para máxima performance.
 */

self.onmessage = async (e: MessageEvent) => {
    const { id, file, macro, options } = e.data;

    try {
        // 1. Carregar imagem no worker
        const bitmap = await createImageBitmap(file);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Contexto Offscreen falhou.");

        ctx.drawImage(bitmap, 0, 0);

        // 2. Executar Pipeline de Ações
        for (const action of macro.actions) {
            await executeAction(ctx, canvas, action);
        }

        // 3. Gerar Blob final
        const resultBlob = await canvas.convertToBlob({ 
            type: options?.format || 'image/jpeg', 
            quality: options?.quality || 0.9 
        });

        // 4. Retornar dados para a Main Thread (Zero-copy via ArrayBuffer se necessário)
        self.postMessage({ type: 'SUCCESS', id, blob: resultBlob });
        
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', id, message: err.message });
    }
};

async function executeAction(ctx: OffscreenCanvasRenderingContext2D, canvas: OffscreenCanvas, action: any) {
    const { type, params } = action;

    switch (type) {
        case 'FILTER':
            // Simulação de filtros simples via Canvas 2D 
            // Em produção, usaríamos o PixiJS WebGL context no worker
            ctx.filter = `brightness(${params.brightness || 1}) contrast(${params.contrast || 1}) saturate(${params.saturation || 1})`;
            const temp = canvas.transferToImageBitmap();
            ctx.drawImage(temp, 0, 0);
            ctx.filter = 'none';
            break;
            
        case 'RESIZE':
            const targetW = params.width || canvas.width;
            const targetH = params.height || canvas.height;
            const resized = new OffscreenCanvas(targetW, targetH);
            const rCtx = resized.getContext('2d');
            rCtx?.drawImage(canvas, 0, 0, targetW, targetH);
            // Redefinir canvas principal
            canvas.width = targetW;
            canvas.height = targetH;
            ctx.drawImage(resized, 0, 0);
            break;

        case 'WATERMARK':
            ctx.font = 'bold 24px Inter';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText(params.text || 'LUMINA STUDIO', 40, canvas.height - 40);
            break;
    }
}
