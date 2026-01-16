
import * as PIXI from 'pixi.js';
import { VaultItem } from '../types';

const DB_NAME = 'LuminaVault_V2';
const DB_VERSION = 1;

export class VaultDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for full resolution Blobs (High Res)
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
        
        // Store for Metadata + Low Res Thumbnails (Fast Access)
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Core Operations ---

  async saveAsset(item: VaultItem, blob: Blob): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['assets', 'meta'], 'readwrite');
    
    // Save High Res Blob
    tx.objectStore('assets').put({ id: item.id, blob });
    
    // Save Meta + Grading + Thumbnail (assume item.imageUrl is a dataURL or similar for thumbnail in V2)
    // In a real V2, we might generate a specific small thumbnail here.
    tx.objectStore('meta').put(item);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMeta(id: string): Promise<VaultItem | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const request = tx.objectStore('meta').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAssetBlob(id: string): Promise<Blob | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('assets', 'readonly');
      const request = tx.objectStore('assets').get(id);
      request.onsuccess = () => resolve(request.result?.blob);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Canvas Sync (Pixi Integration) ---

  /**
   * Loads a Vault Asset directly into a Pixi Texture.
   * Handles ObjectURL lifecycle to prevent memory leaks.
   */
  async syncTexture(id: string, type: 'thumbnail' | 'high-res' = 'high-res'): Promise<PIXI.Texture | null> {
    try {
      let src: string | undefined;

      if (type === 'thumbnail') {
        const meta = await this.getMeta(id);
        src = meta?.imageUrl; // Assuming imageUrl serves as the low-res/preview
      } else {
        const blob = await this.getAssetBlob(id);
        if (blob) {
          src = URL.createObjectURL(blob);
        } else {
          // Fallback to meta if blob missing
          const meta = await this.getMeta(id);
          src = meta?.originalImageUrl || meta?.imageUrl;
        }
      }

      if (!src) return null;

      const texture = await PIXI.Assets.load(src);
      
      // If we created an ObjectURL, revoke it after loading to free Blob memory
      if (type === 'high-res' && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }

      return texture;
    } catch (e) {
      console.error(`Vault Sync Failed for ${id}:`, e);
      return null;
    }
  }
}

export const vaultDB = new VaultDatabase();
