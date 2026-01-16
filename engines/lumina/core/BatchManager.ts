import { BatchItem, BatchMacro, BatchAction } from '../../../types';
import { storageManager } from './StorageManager';
import JSZip from 'jszip';

export class BatchManager {
    private queue: BatchItem[] = [];
    private activeWorkers = 0;
    private maxWorkers = navigator.hardwareConcurrency || 4;
    private onProgressUpdate: (p: number, items: BatchItem[]) => void = () => {};

    async processLote(files: File[], macro: BatchMacro, onUpdate: any): Promise<void> {
        this.onProgressUpdate = onUpdate;
        this.queue = files.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            status: 'waiting',
            progress: 0
        }));

        this.updateUI();

        for (let i = 0; i < Math.min(this.maxWorkers, this.queue.length); i++) {
            this.processNext(macro);
        }
    }

    private async processNext(macro: BatchMacro) {
        const item = this.queue.find(i => i.status === 'waiting');
        if (!item || this.activeWorkers >= this.maxWorkers) return;

        this.activeWorkers++;
        item.status = 'processing';
        this.updateUI();

        try {
            // Caminho absoluto para a raiz do projeto
            const workerUrl = new URL('/engines/lumina/workers/Batch.worker.ts', import.meta.url);
            const worker = new Worker(workerUrl, { type: 'module' });
            
            worker.onmessage = async (e) => {
                const { type, blob, message } = e.data;

                if (type === 'SUCCESS') {
                    item.status = 'done';
                    item.progress = 100;
                    const opfsId = await storageManager.storeAsset(`batch_${item.id}`, blob);
                    item.resultId = opfsId;
                } else {
                    item.status = 'error';
                    item.error = message;
                }

                this.activeWorkers--;
                worker.terminate();
                this.updateUI();
                this.processNext(macro);
            };

            worker.postMessage({
                id: item.id,
                file: item.file,
                macro: macro,
                options: { format: 'image/jpeg', quality: 0.85 }
            });
        } catch (e) {
            console.error("Batch Worker Error:", e);
            item.status = 'error';
            item.error = "Worker Init Failed";
            this.activeWorkers--;
            this.updateUI();
            this.processNext(macro);
        }
    }

    private updateUI() {
        const done = this.queue.filter(i => i.status === 'done' || i.status === 'error').length;
        const totalProgress = (done / this.queue.length) * 100;
        this.onProgressUpdate(totalProgress, [...this.queue]);
    }

    async exportZip(): Promise<Blob> {
        const zip = new JSZip();
        const root = await navigator.storage.getDirectory();

        for (const item of this.queue) {
            if (item.status === 'done' && item.resultId) {
                const fileName = item.resultId.split('//')[1];
                const fileHandle = await root.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                zip.file(item.file.name.replace(/\.[^/.]+$/, "") + "_lumina.jpg", file);
            }
        }

        return await zip.generateAsync({ type: 'blob' });
    }
}

export const batchManager = new BatchManager();