
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
        // Detecção nativa imediata. Se não houver SAB, o sistema aceita o modo Standard.
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
            Object.assign(task, updates);
            this.emit('update', Array.from(this.tasks.values()));
        }
    }

    getTasks() {
        return Array.from(this.tasks.values());
    }

    async ignite() {
        console.log(`Venus Kernel: Ignite init. Multi-threaded: ${this.multiThreaded}`);
        
        // Timeout global de segurança reduzido para não prender o usuário
        const kernelTimeout = setTimeout(() => {
            console.warn("Venus Kernel: Timeout global. Forçando liberação da UI.");
            this.handleTimeoutFallback();
        }, 5000); 

        try {
            // Handshake do AI Worker - Non-blocking soft fail
            const samHealthPromise = this.handshakeWorker();
            
            // Carregamento Progressivo WASM (Skia) - Non-blocking soft fail
            const ckPromise = this.loadWithProgress('canvaskit', 'https://unpkg.com/canvaskit-wasm@0.39.1/bin/canvaskit.wasm')
                .catch(() => this.updateTask('canvaskit', { status: 'unavailable' }));

            await Promise.all([samHealthPromise, ckPromise]);
            
            clearTimeout(kernelTimeout);
            console.log("Venus Kernel: Inicialização concluída.");
        } catch (e) {
            console.warn("Venus Kernel: Falha na aceleração. Continuando em modo Standard.", e);
            this.handleTimeoutFallback();
        }
    }

    private handleTimeoutFallback() {
        this.aiEnabled = false;
        this.tasks.forEach(t => {
            if (t.status === 'pending' || t.status === 'loading') {
                // Marca tudo que não carregou como indisponível para liberar a UI
                this.updateTask(t.id, { status: 'unavailable', label: `${t.label} (Offline)` });
            }
        });
    }

    private async handshakeWorker(): Promise<void> {
        return new Promise((resolve) => {
            // Timeout agressivo de 2 segundos para o worker. 
            // Se não responder PONG em 2s, assume falha e libera a UI.
            const timeout = setTimeout(() => {
                console.warn("Worker Handshake Timed Out (2s). Skipping AI.");
                this.updateTask('sam', { status: 'unavailable' });
                resolve();
            }, 2000);

            try {
                // Caminho relativo robusto para bundlers modernos
                const workerUrl = new URL('../workers/AI.worker.ts', import.meta.url);
                const worker = new Worker(workerUrl, { type: 'module' });
                
                worker.onmessage = (e) => {
                    if (e.data === 'PONG') {
                        clearTimeout(timeout);
                        worker.terminate();
                        this.updateTask('sam', { status: 'ready', progress: 100 });
                        resolve();
                    }
                };
                
                worker.onerror = (err) => {
                    clearTimeout(timeout);
                    console.warn("Kernel Worker Failure:", err);
                    worker.terminate();
                    this.updateTask('sam', { status: 'unavailable' });
                    resolve(); 
                };

                worker.postMessage('PING');
            } catch (e) {
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
        } catch (e) {
            console.warn(`Failed to load ${taskId}`, e);
            this.updateTask(taskId, { status: 'error' });
            throw e; // Repassa erro para ser tratado no ignite
        }
    }
}

export const warmupManager = new WarmupManager();
