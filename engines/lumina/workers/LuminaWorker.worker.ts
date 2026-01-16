
import pica from 'pica';

const picaInstance = pica();

self.onmessage = async (e: MessageEvent) => {
    const { 
        pixelBuffer, 
        statusBuffer, 
        width, 
        height, 
        operation, 
        params 
    } = e.data;

    const pixels = new Uint8ClampedArray(pixelBuffer);
    const status = new Int32Array(statusBuffer);

    // Sinaliza que o processamento começou
    Atomics.store(status, 0, 1); // BUSY

    try {
        switch (operation) {
            case 'FILTER_BRIGHTNESS':
                const factor = params.factor || 1;
                for (let i = 0; i < pixels.length; i += 4) {
                    pixels[i] *= factor;     // R
                    pixels[i + 1] *= factor; // G
                    pixels[i + 2] *= factor; // B
                }
                break;

            case 'FILTER_GRAYSCALE':
                for (let i = 0; i < pixels.length; i += 4) {
                    const avg = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
                    pixels[i] = avg;
                    pixels[i + 1] = avg;
                    pixels[i + 2] = avg;
                }
                break;

            case 'RESIZE_LANCZOS':
                // Nota: Pica geralmente trabalha com Canvas. Para buffers puros em worker:
                // Em uma implementação real, usaríamos o pica.resize() com buffers de entrada/saída.
                break;
        }

        // Sinaliza conclusão
        Atomics.store(status, 0, 2); // DONE
    } catch (err) {
        console.error("Lumina Worker Error:", err);
        Atomics.store(status, 0, 3); // ERROR
    }
};
