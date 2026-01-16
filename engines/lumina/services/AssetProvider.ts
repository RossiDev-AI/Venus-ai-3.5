
import { AppSettings } from '../../../types';

export interface SearchFilters {
    query: string;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    color?: string;
    page: number;
}

export interface LuminaExternalAsset {
    id: string;
    provider: 'unsplash' | 'pexels';
    thumbUrl: string;
    fullUrl: string;
    author: string;
    width: number;
    height: number;
}

export class AssetProvider {
    /**
     * Busca imagens no Pexels
     */
    static async searchPexels(filters: SearchFilters, apiKey: string): Promise<LuminaExternalAsset[]> {
        if (!apiKey) return [];
        const orientation = filters.orientation === 'squarish' ? 'square' : filters.orientation || 'landscape';
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(filters.query)}&orientation=${orientation}&page=${filters.page}&per_page=20${filters.color ? `&color=${filters.color}` : ''}`;
        
        const resp = await fetch(url, { headers: { Authorization: apiKey } });
        const data = await resp.json();
        
        return (data.photos || []).map((p: any) => ({
            id: `px-${p.id}`,
            provider: 'pexels',
            thumbUrl: p.src.medium,
            fullUrl: p.src.large2x,
            author: p.photographer,
            width: p.width,
            height: p.height
        }));
    }

    /**
     * Busca imagens no Unsplash
     */
    static async searchUnsplash(filters: SearchFilters, accessKey: string): Promise<LuminaExternalAsset[]> {
        if (!accessKey) return [];
        const orientation = filters.orientation || 'landscape';
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(filters.query)}&orientation=${orientation}&page=${filters.page}&per_page=20${filters.color ? `&color=${filters.color}` : ''}`;
        
        const resp = await fetch(url, { headers: { Authorization: `Client-ID ${accessKey}` } });
        const data = await resp.json();
        
        return (data.results || []).map((p: any) => ({
            id: `un-${p.id}`,
            provider: 'unsplash',
            thumbUrl: p.urls.small,
            fullUrl: p.urls.full,
            author: p.user.name,
            width: p.width,
            height: p.height
        }));
    }
}
