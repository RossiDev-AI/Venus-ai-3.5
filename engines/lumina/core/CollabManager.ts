
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Editor, TLShapeId } from 'tldraw';

export interface LuminaPresence {
    name: string;
    color: string;
    cursor: { x: number, y: number } | null;
    selection: TLShapeId[];
}

export class CollabManager {
    public doc: Y.Doc;
    public provider: WebrtcProvider | null = null;
    private shapesMap: Y.Map<any>;
    private editor: Editor | null = null;
    private isSyncing = false;

    constructor() {
        this.doc = new Y.Doc();
        this.shapesMap = this.doc.getMap('lumina_shapes');
    }

    /**
     * Inicializa a sala de colaboração baseada em um Room ID.
     */
    initialize(roomId: string, editor: Editor) {
        this.editor = editor;
        
        // P2P via WebRTC (Sinalização via servidor público padrão do y-webrtc)
        this.provider = new WebrtcProvider(`vnus-lumina-${roomId}`, this.doc, {
            signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com']
        });

        const { awareness } = this.provider;

        // Configuração de Presença Local
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        awareness.setLocalState({
            user: {
                name: `Artist_${Math.floor(Math.random()*1000)}`,
                color: randomColor,
                cursor: null,
                selection: []
            }
        });

        // Sincronização: Yjs -> tldraw (Entrada de dados remotos)
        this.shapesMap.observe((event) => {
            if (this.isSyncing) return;
            
            this.doc.transact(() => {
                event.changes.keys.forEach((change, key) => {
                    if (change.action === 'add' || change.action === 'update') {
                        const remoteShape = this.shapesMap.get(key);
                        if (remoteShape) {
                            this.isSyncing = true;
                            this.editor?.updateShape(remoteShape);
                            this.isSyncing = false;
                        }
                    } else if (change.action === 'delete') {
                        this.isSyncing = true;
                        this.editor?.deleteShape(key as TLShapeId);
                        this.isSyncing = false;
                    }
                });
            });
        });

        // Sincronização: tldraw -> Yjs (Saída de dados locais)
        editor.store.listen((event) => {
            if (this.isSyncing) return;
            if (event.source !== 'user') return;

            this.doc.transact(() => {
                // Adições e Updates
                if (event.changes.added) {
                    Object.values(event.changes.added).forEach((shape: any) => {
                        if (shape.type === 'lumina-image') this.shapesMap.set(shape.id, shape);
                    });
                }
                if (event.changes.updated) {
                    Object.values(event.changes.updated).forEach(([_, shape]: any) => {
                        if (shape.type === 'lumina-image') this.shapesMap.set(shape.id, shape);
                    });
                }
                // Remoções
                if (event.changes.removed) {
                    Object.keys(event.changes.removed).forEach(id => {
                        this.shapesMap.delete(id);
                    });
                }
            });
        });

        console.log(`Lumina Collab: Connected to room ${roomId}`);
    }

    updateCursor(x: number, y: number) {
        this.provider?.awareness.setLocalStateField('user', {
            ...this.provider.awareness.getLocalState()?.user,
            cursor: { x, y }
        });
    }

    destroy() {
        this.provider?.destroy();
        this.doc.destroy();
    }
}

export const collabManager = new CollabManager();
