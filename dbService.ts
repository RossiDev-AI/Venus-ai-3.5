import Dexie, { Table } from 'https://esm.sh/dexie@3.2.4';
import { VaultItem, DNAToken, VaultDomain } from './types';

// --- Types for DB ---
export interface AssetRecord {
  id: string;
  originalBlob: Blob;
  thumbnailBlob: Blob; // Low-res for instant load
  mimeType: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface SessionRecord {
  id: string; // Session Name or ID
  data: any; // Tldraw Snapshot
  updatedAt: number;
}

export interface HistoryRecord {
  id?: number;
  type: 'prompt' | 'response' | 'error';
  content: string;
  timestamp: number;
}

// --- Dexie Database Definition ---
class VenusDatabase extends Dexie {
  vaultItems!: Table<VaultItem>;
  dnaTokens!: Table<DNAToken>;
  assets!: Table<AssetRecord>;
  sessions!: Table<SessionRecord>;
  history!: Table<HistoryRecord>;

  constructor() {
    super('VnusDatabase_v2');
    (this as any).version(1).stores({
      vaultItems: 'id, shortId, vaultDomain, isFavorite, timestamp, neuralPreferenceScore',
      dnaTokens: 'id, domain',
      assets: 'id, timestamp',
      sessions: 'id, updatedAt',
      history: '++id, timestamp, type'
    });
  }
}

export const db = new VenusDatabase();

// --- Image Processing Logic (Thumbnails) ---
async function generateThumbnail(blob: Blob, targetWidth = 100): Promise<{ blob: Blob, width: number, height: number }> {
  const bitmap = await createImageBitmap(blob);
  const scale = targetWidth / bitmap.width;
  const targetHeight = bitmap.height * scale;

  let canvas: OffscreenCanvas | HTMLCanvasElement;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(targetWidth, targetHeight);
    ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx = canvas.getContext('2d');
  }

  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  let thumbBlob: Blob | null;
  if (canvas instanceof OffscreenCanvas) {
    thumbBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
  } else {
    thumbBlob = await new Promise(r => (canvas as HTMLCanvasElement).toBlob(r, 'image/jpeg', 0.6));
  }

  if (!thumbBlob) throw new Error("Thumbnail generation failed");

  return { blob: thumbBlob, width: targetWidth, height: targetHeight };
}

// --- Vault Operations (Backward Compatible Interface) ---

export const saveNode = async (item: VaultItem): Promise<void> => {
  // If item has a DataURL, we should try to convert it to a Blob and store in 'assets' table
  // to save main thread performance, keeping only metadata in 'vaultItems'
  // For V-nus 2.0 migration, we will store the heavy image in assets if it's base64
  
  if (item.imageUrl.startsWith('data:')) {
    try {
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      
      // Generate Thumbnail
      const thumb = await generateThumbnail(blob);
      
      await db.assets.put({
        id: item.id,
        originalBlob: blob,
        thumbnailBlob: thumb.blob,
        mimeType: blob.type,
        width: 0, // Should extract real dims
        height: 0,
        timestamp: Date.now()
      });
      
      // We keep the imageUrl as a reference ID for the asset system in V2 logic
      // But for compatibility with existing components that expect strings, 
      // we might keep the DataURL or switch to ObjectURL at runtime.
      // For persistence efficiency, we strip the heavy string if we saved the blob.
      // However, to satisfy "Do not change visual components" which rely on .imageUrl string,
      // we will keep it for now, but in a real refactor we'd switch to IDs.
    } catch (e) {
      console.warn("Failed to optimize asset storage", e);
    }
  }

  await db.vaultItems.put({
    ...item,
    usageCount: item.usageCount ?? 0,
    neuralPreferenceScore: item.neuralPreferenceScore ?? 50,
    isFavorite: item.isFavorite ?? false,
    vaultDomain: item.vaultDomain ?? 'X'
  });
};

export const getAllNodes = async (): Promise<VaultItem[]> => {
  return await db.vaultItems.orderBy('timestamp').reverse().toArray();
};

export const deleteNode = async (id: string): Promise<void> => {
  await (db as any).transaction('rw', db.vaultItems, db.assets, async () => {
    await db.vaultItems.delete(id);
    await db.assets.delete(id);
  });
};

export const toggleFavoriteNode = async (id: string): Promise<boolean> => {
  return await (db as any).transaction('rw', db.vaultItems, async () => {
    const item = await db.vaultItems.get(id);
    if (!item) throw new Error("Node not found");
    
    const newVal = !item.isFavorite;
    await db.vaultItems.update(id, { 
      isFavorite: newVal,
      neuralPreferenceScore: newVal ? Math.min(100, item.neuralPreferenceScore + 20) : item.neuralPreferenceScore
    });
    return newVal;
  });
};

export const bulkSaveNodes = async (items: VaultItem[]): Promise<void> => {
  await db.vaultItems.bulkPut(items);
};

// --- DNA Tokens ---

export const saveDNAToken = async (token: DNAToken): Promise<void> => {
  await db.dnaTokens.put(token);
};

export const getAllDNATokens = async (): Promise<DNAToken[]> => {
  return await db.dnaTokens.toArray();
};

export const deleteDNAToken = async (id: string): Promise<void> => {
  await db.dnaTokens.delete(id);
};

// --- Session Management (New) ---

export const saveSessionSnapshot = async (sessionId: string, snapshot: any) => {
  await db.sessions.put({
    id: sessionId,
    data: snapshot,
    updatedAt: Date.now()
  });
};

export const getSessionSnapshot = async (sessionId: string) => {
  return await db.sessions.get(sessionId);
};

// --- Asset Retrieval ---

export const getAssetUrl = async (id: string, type: 'thumbnail' | 'original'): Promise<string | null> => {
  const record = await db.assets.get(id);
  if (!record) return null;
  const blob = type === 'thumbnail' ? record.thumbnailBlob : record.originalBlob;
  return URL.createObjectURL(blob);
};