
import * as Y from 'yjs';
import { Editor } from 'tldraw';
import { LuminaSnapshot } from '../../../types';
import { storageManager } from './StorageManager';
import { toast } from 'sonner';

export class HistoryManager {
    private snapshots: LuminaSnapshot[] = [];
    private yDoc: Y.Doc;
    private editor: Editor | null = null;
    private autoSaveInterval: any = null;

    constructor(yDoc: Y.Doc) {
        this.yDoc = yDoc;
    }

    setEditor(editor: Editor) {
        this.editor = editor;
    }

    /**
     * Cria um snapshot do estado atual.
     */
    async createSnapshot(label: string, isAuto = false): Promise<LuminaSnapshot | null> {
        if (!this.editor) return null;

        try {
            // 1. Capturar binário do Yjs (Snapshot Incremental)
            const yjsState = Y.encodeStateAsUpdate(this.yDoc);
            
            // 2. Gerar thumbnail rápida via OffscreenCanvas ou buffer do editor
            const thumb = await this.generateFastThumbnail();

            const snapshot: LuminaSnapshot = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                label,
                yjsState,
                thumbnail: thumb,
                isAuto
            };

            // 3. Persistir no OPFS (Snapshots folder)
            await storageManager.saveSnapshotToDisk(snapshot);
            
            this.snapshots.unshift(snapshot);

            // 4. Limpeza inteligente (Pruning)
            this.pruneSnapshots();

            return snapshot;
        } catch (e) {
            console.error("Snapshot failed:", e);
            return null;
        }
    }

    private async generateFastThumbnail(): Promise<string> {
        if (!this.editor) return "";
        // Usamos o exportToBlob interno mas com escala muito reduzida para performance
        const bounds = this.editor.getViewportPageBounds();
        // Nota: exportToBlob é custoso, em produção usaríamos o app.renderer.extract do PixiJS
        // Mas para consistência com o tldraw:
        const blob = await this.editor.getSvgString(this.editor.getCurrentPageShapeIds());
        // Simulação de thumbnail base64 rápida
        return `data:image/svg+xml;base64,${btoa(blob.svg)}`;
    }

    private async pruneSnapshots() {
        // Mantém os últimos 10 manuais e 5 automáticos
        const auto = this.snapshots.filter(s => s.isAuto).slice(0, 5);
        const manual = this.snapshots.filter(s => !s.isAuto).slice(0, 10);
        this.snapshots = [...manual, ...auto].sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Restaura o estado a partir de um snapshot.
     */
    async restore(snapshotId: string) {
        const snapshot = this.snapshots.find(s => s.id === snapshotId);
        if (!snapshot) return;

        toast.loading(`Viajando para: ${snapshot.label}...`);
        
        // Aplicar estado ao Yjs
        Y.applyUpdate(this.yDoc, snapshot.yjsState);
        
        // O sincronismo entre Yjs e Editor deve ocorrer via CollabManager ou observer
        toast.success("Estado restaurado.");
    }

    startAutoSave() {
        if (this.autoSaveInterval) return;
        this.autoSaveInterval = setInterval(() => {
            this.createSnapshot(`Auto-Save ${new Date().toLocaleTimeString()}`, true);
        }, 5 * 60 * 1000); // 5 minutos
    }

    getHistory() {
        return this.snapshots;
    }

    async loadFromDisk() {
        const diskSnapshots = await storageManager.loadAllSnapshots();
        this.snapshots = diskSnapshots.sort((a, b) => b.timestamp - a.timestamp);
    }
}
