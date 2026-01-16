import { Peer, DataConnection, MediaConnection } from 'peerjs';
import { Editor } from 'tldraw';
import { toast } from 'sonner';

export interface ReviewComment {
    id: string;
    x: number;
    y: number;
    text: string;
    author: string;
    timestamp: number;
}

export interface ReviewStroke {
    points: { x: number, y: number }[];
    color: string;
}

// Fix: Implemented manual event handling to replace missing/unresolved EventEmitter in browser environment
export class ReviewManager {
    private listeners: { [key: string]: Function[] } = {};

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

    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private call: MediaConnection | null = null;
    public myId: string = '';
    public remoteStream: MediaStream | null = null;
    
    public comments: ReviewComment[] = [];
    public ephemeralStrokes: ReviewStroke[] = [];
    public isMuted: boolean = false;

    /**
     * Inicializa o nó P2P.
     */
    async initialize(): Promise<string> {
        return new Promise((resolve) => {
            this.peer = new Peer(`LUMINA-${Math.floor(1000 + Math.random() * 9000)}`, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                this.myId = id;
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this.setupConnection(conn);
                toast.success("Reviewer conectado à sessão!");
            });

            this.peer.on('call', (call) => {
                call.answer(); // Guest apenas assiste
                call.on('stream', (stream) => {
                    this.remoteStream = stream;
                    // Added fix: emit method is now correctly defined via the internal listeners implementation
                    this.emit('stream-updated', stream);
                });
            });
        });
    }

    private setupConnection(conn: DataConnection) {
        this.connection = conn;
        conn.on('data', (data: any) => {
            if (this.isMuted) return;

            if (data.type === 'STROKE') {
                this.handleRemoteStroke(data.payload);
            }
            if (data.type === 'COMMENT') {
                this.handleRemoteComment(data.payload);
            }
        });
    }

    /**
     * Conecta a um host Lumina existente.
     */
    async joinSession(hostId: string) {
        if (!this.peer) await this.initialize();
        const conn = this.peer!.connect(hostId);
        this.setupConnection(conn);
        toast.info("Aguardando stream do Designer...");
    }

    /**
     * Designer inicia a transmissão do seu canvas.
     */
    startStreaming(canvas: HTMLCanvasElement, targetPeerId: string) {
        const stream = canvas.captureStream(30);
        this.call = this.peer!.call(targetPeerId, stream);
    }

    sendStroke(stroke: ReviewStroke) {
        this.connection?.send({ type: 'STROKE', payload: stroke });
    }

    sendComment(comment: Omit<ReviewComment, 'id' | 'timestamp'>) {
        const fullComment = { ...comment, id: crypto.randomUUID(), timestamp: Date.now() };
        this.connection?.send({ type: 'COMMENT', payload: fullComment });
        this.handleRemoteComment(fullComment);
    }

    private handleRemoteStroke(stroke: ReviewStroke) {
        this.ephemeralStrokes.push(stroke);
        // Added fix: emit method is now correctly defined via the internal listeners implementation
        this.emit('strokes-updated', [...this.ephemeralStrokes]);
        
        // Auto-fade out das anotações após 3s
        setTimeout(() => {
            this.ephemeralStrokes = this.ephemeralStrokes.filter(s => s !== stroke);
            // Added fix: emit method is now correctly defined via the internal listeners implementation
            this.emit('strokes-updated', [...this.ephemeralStrokes]);
        }, 3000);
    }

    private handleRemoteComment(comment: ReviewComment) {
        this.comments.push(comment);
        // Added fix: emit method is now correctly defined via the internal listeners implementation
        this.emit('comments-updated', [...this.comments]);
        toast(`Novo Pin: ${comment.text}`, { icon: '📍' });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        toast(this.isMuted ? "Anotações do Revisor Silenciadas" : "Review Ativo");
    }
}

export const reviewManager = new ReviewManager();