
/**
 * Pixel Kernel IO & Algorithms:
 * Gerencia OPFS e agora inclui o motor de Poisson Blending para a Patch Tool.
 */

self.onmessage = async (e: MessageEvent) => {
    const { type, id, payload, options } = e.data;

    try {
        if (type === 'POISSON_BLEND') {
            const { sourceBuffer, targetBuffer, maskBuffer, width, height, iterations } = payload;
            
            const src = new Uint8ClampedArray(sourceBuffer);
            const dst = new Uint8ClampedArray(targetBuffer);
            const mask = new Uint8ClampedArray(maskBuffer);
            
            // Resultado inicial é o destino
            const result = new Uint8ClampedArray(targetBuffer);
            
            // 1. Pré-calcular o Laplaciano da Origem (v = grad(Source))
            const laplacian = new Float32Array(width * height * 3);
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4;
                    if (mask[idx + 3] === 0) continue; // Pular áreas fora da máscara

                    for (let c = 0; c < 3; c++) {
                        const lIdx = (y * width + x) * 3 + c;
                        // div(v) = 4*I(x,y) - I(x-1,y) - I(x+1,y) - I(x,y-1) - I(x,y+1)
                        laplacian[lIdx] = 4 * src[idx + c] 
                                        - src[((y - 1) * width + x) * 4 + c] 
                                        - src[((y + 1) * width + x) * 4 + c]
                                        - src[(y * width + (x - 1)) * 4 + c]
                                        - src[(y * width + (x + 1)) * 4 + c];
                    }
                }
            }

            // 2. Solver Iterativo de Jacobi
            // Resolve: 4*f(p) = sum(f(q)) + laplacian(p)
            for (let iter = 0; iter < iterations; iter++) {
                const current = new Uint8ClampedArray(result);
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4;
                        if (mask[idx + 3] === 0) continue;

                        for (let c = 0; c < 3; c++) {
                            const sumNeighbors = current[((y - 1) * width + x) * 4 + c]
                                               + current[((y + 1) * width + x) * 4 + c]
                                               + current[(y * width + (x - 1)) * 4 + c]
                                               + current[(y * width + (x + 1)) * 4 + c];
                            
                            const lIdx = (y * width + x) * 3 + c;
                            result[idx + c] = (sumNeighbors + laplacian[lIdx]) / 4;
                        }
                    }
                }
            }

            (self as any).postMessage({ type: 'PATCH_COMPLETE', id, buffer: result.buffer }, [result.buffer]);
            return;
        }

        // ... (resto do worker permanece igual)
        if (type === 'VECTORIZE') {
            const { buffer, width, height } = payload;
            const pixels = new Uint8ClampedArray(buffer);
            const threshold = options?.threshold || 128;
            (self as any).postMessage({ type: 'VECTOR_COMPLETE', id, path: "M 0 0 L 100 100" }); 
            return;
        }

        const root = await navigator.storage.getDirectory();
        if (type === 'SYNC_WRITE') {
            const fileHandle = await root.getFileHandle(`${id}.bin`, { create: true });
            // @ts-ignore
            const accessHandle = await fileHandle.createSyncAccessHandle();
            accessHandle.write(payload);
            accessHandle.flush();
            accessHandle.close();
            (self as any).postMessage({ type: 'SYNC_COMPLETE', id });
        }
    } catch (err: any) {
        (self as any).postMessage({ type: 'IO_ERROR', id, message: err.message });
    }
};
