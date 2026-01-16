
export interface WarmupTask {
    id: string;
    label: string;
    progress: number;
    status: 'pending' | 'loading' | 'ready' | 'error';
}

/**
 * Added fix: Implemented manual event handling to replace missing/unresolved EventEmitter in browser environment.
 * This resolves the 'emit' property error on line 29 and 'on/off' property errors in WarmupUI.tsx.
 */
export class WarmupManager {
    private listeners: { [key: string]: Function[] } = {};

    /**
     * Added fix: Manual event listener registration.
     */
    on(event: string, fn: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
        return this;
    }

    /**
     * Added fix: Manual event listener removal.
     */
    off(event: string, fn: Function) {
        if (!this.listeners[event]) return this;
        this.listeners[event] = this.listeners[event].filter(l => l !== fn);
        return this;
    }

    /**
     * Added fix: Manual event emission.
     */
    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return false;
        this.listeners[event].forEach(fn => fn(...args));
        return true;
    }

    private tasks: Map<string, WarmupTask> = new Map();

    constructor() {
        this.registerTasks();
    }

    private registerTasks() {
        this.tasks.set('canvaskit', { id: 'canvaskit', label: 'Skia Vector Engine', progress: 0, status: 'pending' });
        this.tasks.set('ffmpeg', { id: 'ffmpeg', label: 'Video Transcode Core', progress: 0, status: 'pending' });
        this.tasks.set('sam', { id: 'sam', label: 'Segment Anything AI', progress: 0, status: 'pending' });
    }

    updateTask(id: string, updates: Partial<WarmupTask>) {
        const task = this.tasks.get(id);
        if (task) {
            Object.assign(task, updates);
            // Added fix: emit method is now correctly defined via the internal listeners implementation
            this.emit('update', Array.from(this.tasks.values()));
        }
    }

    getTasks() {
        return Array.from(this.tasks.values());
    }

    isReady() {
        return Array.from(this.tasks.values()).every(t => t.status === 'ready');
    }

    /**
     * Inicia o download antecipado dos binários WASM.
     */
    async ignite() {
        // Exemplo: Disparar preload do CanvasKit
        import('canvaskit-wasm').then(() => {
            this.updateTask('canvaskit', { status: 'ready', progress: 100 });
        });
        
        // Em produção, isso se conectaria aos hooks de progresso reais dos loaders
    }
}

export const warmupManager = new WarmupManager();
