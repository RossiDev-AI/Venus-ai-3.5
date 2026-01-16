
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
    public multiThreaded: boolean = Capabilities.canUseMultithreading;

    constructor() {
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
        this.tasks.set('ffmpeg', { id: 'ffmpeg', label: `FFmpeg (${this.multiThreaded ? 'MT' : 'ST'})`, progress: 0, status: 'pending' });
        this.tasks.set('sam', { id: 'sam', label: `Segment AI (${Capabilities.hasWebGPU ? 'WebGPU' : 'WASM'})`, progress: 0, status: 'pending' });
    }

    updateTask(id: string, updates: Partial<WarmupTask>) {
        const task = this.tasks.get(id);
        if (task) {
            Object.assign(task, updates);
            this.emit('update', Array.from(this.tasks.values()));
        }
    }

    getTasks() {
        return Array.from(this.tasks.values());
    }

    async ignite() {
        console.log(`Venus Kernel: Critical Init Start. MultiThreaded: ${this.multiThreaded}`);
        
        // Timer de resiliência: 10 segundos
        const kernelTimeout = setTimeout(() => {
            console.error("Ambiente restrito: Módulos de carga pesada desativados por Timeout.");
            this.handleTimeoutFallback();
        }, 10000);

        try {
            // Handshake do AI Worker - Usando caminho relativo correto para o bundle
            const samHealthPromise = this.handshakeWorker('../workers/AI.worker.ts');
            
            // Carregamento Progressivo WASM (Exemplo Skia)
            const ckPromise = this.loadWithProgress('canvaskit', 'https://unpkg.com/canvaskit-wasm@0.39.1/bin/canvaskit.wasm');

            await Promise.all([samHealthPromise, ckPromise]);
            
            clearTimeout(kernelTimeout);
            console.log("Venus Kernel: Full Acceleration Active.");
        } catch (e) {
            console.warn("Venus Kernel: Partial Failure. Transitioning to Recovery Mode.", e);
            this.handleTimeoutFallback();
        }
    }

    private handleTimeoutFallback() {
        this.aiEnabled = false;
        const pending = Array.from(this.tasks.values()).filter(t => t.status === 'loading' || t.status === 'pending');
        pending.forEach(t => {
            if (t.id !== 'canvaskit') { // Skia é o único obrigatório para o fallback
                this.updateTask(t.id, { status: 'unavailable', label: `${t.label} (Blocked)` });
            }
        });
    }

    private async handshakeWorker(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Resolver URL relativa ao módulo atual para garantir que o Vite/Browser encontre o arquivo
                const workerUrl = new URL(path, import.meta.url).href;
                const worker = new Worker(workerUrl, { type: 'module' });
                
                worker.onmessage = (e) => {
                    if (e.data === 'PONG') {
                        worker.terminate();
                        resolve();
                    }
                };
                
                worker.onerror = (err) => {
                    // Log detalhado para diagnosticar falhas de carregamento/CORS
                    console.error(`[WORKER_HANDSHAKE_FAIL]: ${path}`, {
                        message: err.message,
                        filename: err.filename,
                        lineno: err.lineno
                    });
                    worker.terminate();
                    reject(new Error(`Worker execution failed: ${path}`));
                };

                worker.postMessage('PING');
            } catch (e) {
                console.error(`[WORKER_CREATION_FAIL]: ${path}`, e);
                reject(e);
            }
        });
    }

    private async loadWithProgress(taskId: string, url: string) {
        this.updateTask(taskId, { status: 'loading' });
        try {
            const response = await fetch(url);
            if (!response.body) throw new Error("No body");
            
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
        } catch (e) {
            console.error(`Fetch Failure for ${taskId}:`, e);
            this.updateTask(taskId, { status: 'error' });
        }
    }
}

export const warmupManager = new WarmupManager();
