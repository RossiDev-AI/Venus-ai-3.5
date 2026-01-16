
import { LuminaSnapshot } from "../../../types";

export class StorageManager {
    private root: FileSystemDirectoryHandle | null = null;
    private initialized = false;

    async initialize() {
        if (this.initialized) return;
        this.root = await navigator.storage.getDirectory();
        this.initialized = true;
    }

    async saveSnapshotToDisk(snapshot: LuminaSnapshot) {
        if (!this.root) await this.initialize();
        const folder = await this.root!.getDirectoryHandle('snapshots', { create: true });
        const file = await folder.getFileHandle(`${snapshot.id}.json`, { create: true });
        const writable = await file.createWritable();
        
        // Serialização customizada para o Uint8Array do Yjs
        const data = {
            ...snapshot,
            yjsState: Array.from(snapshot.yjsState) // Converter para array para JSON
        };

        await writable.write(JSON.stringify(data));
        await writable.close();
    }

    async loadAllSnapshots(): Promise<LuminaSnapshot[]> {
        if (!this.root) await this.initialize();
        const results: LuminaSnapshot[] = [];
        try {
            const folder = await this.root!.getDirectoryHandle('snapshots', { create: false });
            // @ts-ignore
            for await (const entry of folder.values()) {
                // Added fix: entry is FileSystemHandle, need to cast to FileSystemFileHandle if it's a file
                if (entry.kind === 'file') {
                    const file = await (entry as FileSystemFileHandle).getFile();
                    const text = await file.text();
                    const raw = JSON.parse(text);
                    results.push({
                        ...raw,
                        yjsState: new Uint8Array(raw.yjsState)
                    });
                }
            }
        } catch (e) {}
        return results;
    }

    async persistToCache(url: string, assetId: string): Promise<{ localUrl: string, thumbData: string }> {
        if (!this.root) await this.initialize();
        const response = await fetch(url);
        const blob = await response.blob();
        const fileHandle = await this.root!.getFileHandle(`${assetId}.bin`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return { localUrl: URL.createObjectURL(blob), thumbData: "" };
    }

    async storeAsset(id: string, blob: Blob): Promise<string> {
        if (!this.root) await this.initialize();
        const fileHandle = await this.root!.getFileHandle(`${id}.bin`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return `opfs://${id}.bin`;
    }
}

export const storageManager = new StorageManager();
