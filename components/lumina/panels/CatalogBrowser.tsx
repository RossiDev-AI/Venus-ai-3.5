
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor, createShapeId, track } from 'tldraw';
import { Search, Image as ImageIcon, Filter, Loader2, Download, ExternalLink, MousePointer2 } from 'lucide-react';
import { AssetProvider, LuminaExternalAsset, SearchFilters } from '../../../engines/lumina/services/AssetProvider';
import { storageManager } from '../../../engines/lumina/core/StorageManager';
import { toast } from 'sonner';

export const CatalogBrowser = track(({ editor }: { editor: Editor }) => {
  const [assets, setAssets] = useState<LuminaExternalAsset[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const getKeys = () => {
      const saved = localStorage.getItem('venus_app_settings');
      return saved ? JSON.parse(saved) : {};
  };

  const performSearch = async (isNew = true) => {
    const keys = getKeys();
    if (!query) return;
    
    setLoading(true);
    try {
        const filters: SearchFilters = { query, page: isNew ? 1 : page, orientation: 'landscape' };
        const [pexels, unsplash] = await Promise.all([
            AssetProvider.searchPexels(filters, keys.pexelsApiKey),
            AssetProvider.searchUnsplash(filters, keys.unsplashAccessKey)
        ]);

        const combined = [...pexels, ...unsplash];
        setAssets(prev => isNew ? combined : [...prev, ...combined]);
        setHasMore(combined.length > 0);
        if (isNew) setPage(2);
        else setPage(prev => prev + 1);
    } catch (e) {
        toast.error("Falha na busca de ativos.");
    } finally {
        setLoading(false);
    }
  };

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        performSearch(false);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleImport = async (asset: LuminaExternalAsset, x?: number, y?: number) => {
    const tid = toast.loading(`Importando ${asset.author}...`);
    try {
        const { localUrl } = await storageManager.persistToCache(asset.fullUrl, asset.id);
        const viewport = editor.getViewportPageBounds();
        const posX = x ?? viewport.center.x - 400;
        const posY = y ?? viewport.center.y - 250;

        editor.createShape({
            id: createShapeId(),
            type: 'lumina-image',
            x: posX,
            y: posY,
            props: {
                url: localUrl,
                vaultId: asset.id,
                w: 800,
                h: 500,
                brightness: 1, contrast: 1, saturation: 1, 
                opacity: 1, blendMode: 'normal'
            }
        });
        toast.success("Ativo sincronizado com o disco local", { id: tid });
    } catch (e) {
        toast.error("Erro ao baixar ativo de alta resolução.", { id: tid });
    }
  };

  const onDragStart = (e: React.DragEvent, asset: LuminaExternalAsset) => {
    e.dataTransfer.setData('application/lumina-asset', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
        <div className="p-6 space-y-4 border-b border-white/5">
            <div className="flex items-center gap-3 bg-black/60 px-4 py-3 rounded-2xl border border-white/10 group focus-within:border-indigo-500/50 transition-all">
                <Search size={14} className="text-zinc-600" />
                <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && performSearch(true)}
                    placeholder="Search Cinematic Assets..." 
                    className="bg-transparent border-none outline-none text-[11px] font-bold text-white w-full uppercase tracking-widest placeholder:text-zinc-800"
                />
            </div>
            
            <div className="flex gap-2">
                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-500 border border-white/5 transition-all flex items-center justify-center gap-2">
                    <Filter size={10} /> Orientation
                </button>
                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-500 border border-white/5 transition-all flex items-center justify-center gap-2">
                    <ImageIcon size={10} /> Pro Only
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 pb-40">
                {assets.map((asset, index) => (
                    <div 
                        key={asset.id}
                        ref={index === assets.length - 1 ? lastElementRef : null}
                        draggable
                        onDragStart={(e) => onDragStart(e, asset)}
                        onClick={() => handleImport(asset)}
                        className="group relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-all shadow-xl"
                    >
                        <img src={asset.thumbUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <span className="text-[7px] font-black text-white uppercase tracking-widest bg-indigo-600 px-3 py-1 rounded-full shadow-lg">Import to Stage</span>
                        </div>
                        <div className="absolute bottom-1 left-2">
                            <span className="text-[6px] text-white/40 font-bold uppercase tracking-tighter truncate max-w-[80px]">{asset.author}</span>
                        </div>
                        <div className="absolute top-1 right-2">
                             <span className={`text-[5px] font-black uppercase px-1 rounded ${asset.provider === 'unsplash' ? 'bg-black text-white' : 'bg-emerald-500 text-black'}`}>{asset.provider}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {loading && (
                <div className="py-10 flex flex-col items-center gap-3">
                    <Loader2 size={24} className="text-indigo-500 animate-spin" />
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Querying Neural Providers...</span>
                </div>
            )}
        </div>
    </div>
  );
});
