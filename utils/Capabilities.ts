
export class Capabilities {
    static get isIsolated() {
        return typeof window !== 'undefined' && window.crossOriginIsolated;
    }

    static get hasSharedArrayBuffer() {
        return typeof window !== 'undefined' && !!window.SharedArrayBuffer;
    }

    static get hasWebGPU() {
        return typeof navigator !== 'undefined' && !!(navigator as any).gpu;
    }

    static get canUseMultithreading() {
        // SharedArrayBuffer requer Cross-Origin Isolation para segurança (Spectre/Meltdown)
        return this.isIsolated && this.hasSharedArrayBuffer;
    }

    static get engineType() {
        if (this.hasWebGPU) return 'WebGPU (Ultra High Performance)';
        return 'WebGL/WASM (Compatibility Mode)';
    }

    static get aiStatus() {
        if (this.canUseMultithreading && this.hasWebGPU) return 'Optimal';
        if (this.canUseMultithreading) return 'Good (WASM Parallel)';
        return 'Degraded (Single Thread)';
    }
}
