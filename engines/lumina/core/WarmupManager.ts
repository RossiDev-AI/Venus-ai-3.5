import { Capabilities } from '../../../utils/Capabilities';

export interface WarmupTask {
    id: string;
    label: string;
    progress: number;
    status: 'pending' | 'loading' | 'ready' | 'error' | 'unavailable';
}

export class WarmupManager {
    private listeners: { [key: string]: Function[] } = {};
    private tasks: Map<string, WarmupTask> = new Map();
    public aiEnabled: boolean = true;
    public multiThreaded: boolean = false;

    constructor() {
        this.multiThreaded = typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated;
        if (!this.multiThreaded) {
            console.warn('Venus Kernel: SharedArrayBuffer indisponível. Operando em modo Single-Thread (Standard).');
        }
        this.registerTasks();
    }

    on(event: string, fn: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
        return this;
    }

    off(event: string, fn: Function) {
        if (!this.listeners[event]) return this;
        this.listeners[event] = this.listeners[event].filter(l => l !== fn);
        return this;
    }

    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return false;
        this.listeners[event].forEach(fn => fn(...args));
        return true;
    }

    private registerTasks() {
        this.tasks.set('canvaskit', { id: 'canvaskit', label: 'Skia Vector Engine', progress: 0, status: 'pending' });
        this.tasks.set('ffmpeg', { id: 'ffmpeg', label: `FFmpeg (${this.multiThreaded ? 'Parallel' : 'Single-Thread'})`, progress: 0, status: 'pending' });
        this.tasks.set('sam', { id: 'sam', label: `Segment AI (${Capabilities.hasWebGPU ? 'WebGPU' : 'WASM'})`, progress: 0, status: 'pending' });
    }

    updateTask(id: string, updates: Partial<WarmupTask>) {
        const task = this.tasks.get(id);
        if (task) {
            // SAFEGUARD: Ensure visual fields are primitives. Fixes React Error #31.
            const sanitized: Partial<WarmupTask> = { ...updates };
            if (sanitized.label !== undefined) sanitized.label = String(sanitized.label);
            if (sanitized.status !== undefined) sanitized.status = String(sanitized.status) as any;
            
            Object.assign(task, sanitized);
            this.emit('update', Array.from(this.tasks.values()));
        }
    }

    getTasks() {
        return Array.from(this.tasks.values());
    }

    async ignite() {
        console.log(`Venus Kernel: Ignite init. Multi-threaded: ${this.multiThreaded}`);
        
        const kernelTimeout = setTimeout(() => {
            console.warn("Venus Kernel: Timeout global. Forçando liberação da UI.");
            this.handleTimeoutFallback();
        }, 5000); 

        try {
            const samHealthPromise = this.handshakeWorker();
            const ckPromise = this.loadWithProgress('canvaskit', 'https://unpkg.com/canvaskit-wasm@0.39.1/bin/canvaskit.wasm')
                .catch((err) => {
                    this.updateTask('canvaskit', { 
                      status: 'unavailable', 
                      label: `Skia Engine (${err.message || 'Network Error'})` 
                    });
                });

            await Promise.all([samHealthPromise, ckPromise]);
            
            clearTimeout(kernelTimeout);
            console.log("Venus Kernel: Inicialização concluída.");
        } catch (e: any) {
            console.warn("Venus Kernel: Falha na aceleração. Continuando em modo Standard.", e);
            this.handleTimeoutFallback();
        }
    }

    private handleTimeoutFallback() {
        this.aiEnabled = false;
        this.tasks.forEach(t => {
            if (t.status === 'pending' || t.status === 'loading') {
                this.updateTask(t.id, { status: 'unavailable', label: `${String(t.label)} (Offline Mode)` });
            }
        });
    }

    private async handshakeWorker(): Promise<void> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn("Worker Handshake Timed Out (2s). Skipping AI.");
                this.updateTask('sam', { status: 'unavailable' });
                resolve();
            }, 2000);

            try {
                const workerUrl = new URL('/engines/lumina/workers/AI.worker.ts', import.meta.url);
                const worker = new Worker(workerUrl, { type: 'module' });
                
                worker.onmessage = (e) => {
                    if (e.data === 'PONG') {
                        clearTimeout(timeout);
                        worker.terminate();
                        this.updateTask('sam', { status: 'ready', progress: 100 });
                        resolve();
                    }
                };
                
                worker.onerror = (err: any) => {
                    clearTimeout(timeout);
                    console.warn("Kernel Worker Failure:", err);
                    worker.terminate();
                    this.updateTask('sam', { status: 'unavailable', label: 'Segment AI (Unsupported)' });
                    resolve(); 
                };

                worker.postMessage('PING');
            } catch (e: any) {
                clearTimeout(timeout);
                console.warn("Worker Constructor Failed:", e);
                this.updateTask('sam', { status: 'unavailable' });
                resolve();
            }
        });
    }

    private async loadWithProgress(taskId: string, url: string) {
        this.updateTask(taskId, { status: 'loading' });
        try {
            const response = await fetch(url);
            if (!response.body) throw new Error("Fetch stream failed");
            
            const reader = response.body.getReader();
            const contentLength = +(response.headers.get('Content-Length') || 0);
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                receivedLength += value.length;
                const progress = contentLength ? (receivedLength / contentLength) * 100 : 0;
                this.updateTask(taskId, { progress });
            }
            this.updateTask(taskId, { status: 'ready', progress: 100 });
        } catch (e: any) {
            console.warn(`Failed to load ${taskId}`, e);
            this.updateTask(taskId, { status: 'error' });
            throw e; 
        }
    }
}

export const warmupManager = new WarmupManager();