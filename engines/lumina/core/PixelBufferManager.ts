
export enum WorkerState {
    IDLE = 0,
    BUSY = 1,
    DONE = 2,
    ERROR = 3
}

export class PixelBufferManager {
    private pixelBuffer: SharedArrayBuffer;
    private statusBuffer: SharedArrayBuffer;
    private pixels: Uint8ClampedArray;
    private status: Int32Array;
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        
        // Aloca 4 bytes por pixel (RGBA)
        this.pixelBuffer = new SharedArrayBuffer(width * height * 4);
        this.pixels = new Uint8ClampedArray(this.pixelBuffer);
        
        // Aloca buffer de status para Atomics
        this.statusBuffer = new SharedArrayBuffer(4);
        this.status = new Int32Array(this.statusBuffer);
        
        Atomics.store(this.status, 0, WorkerState.IDLE);
    }

    getPixels() { return this.pixels; }
    getPixelBuffer() { return this.pixelBuffer; }
    getStatusBuffer() { return this.statusBuffer; }

    setPixels(data: Uint8ClampedArray) {
        this.pixels.set(data);
    }

    checkStatus(): WorkerState {
        return Atomics.load(this.status, 0);
    }

    resetStatus() {
        Atomics.store(this.status, 0, WorkerState.IDLE);
    }

    dispose() {
        // SharedArrayBuffers não podem ser desalocados manualmente, 
        // mas liberamos as referências para o GC
        (this as any).pixels = null;
        (this as any).status = null;
    }
}
