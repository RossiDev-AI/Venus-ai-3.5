
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { Download, X, Layers, Printer, Ruler, Image as ImageIcon, Loader2, Video, Clapperboard, Film } from 'lucide-react';
import { exportManager, ExportSettings } from '../../engines/lumina/core/ExportManager';
import { luminaEngine } from '../../engines/lumina/core/LuminaEngine';
import { VideoRenderer } from '../../engines/lumina/core/VideoRenderer';
import { VideoExportSettings, AnimationTrack } from '../../types';
import { toast } from 'sonner';

export const ExportDialog: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Image Settings
    const [imgSettings, setImgSettings] = useState<ExportSettings>({
        width: 3840,
        height: 2160,
        dpi: 300,
        format: 'png',
        quality: 95,
        bitDepth: 8,
        iccProfile: 'sRGB'
    });

    // Video Settings
    const [vidSettings, setVidSettings] = useState<VideoExportSettings>({
        format: 'mp4',
        fps: 30,
        duration: 5,
        width: 1920,
        height: 1080,
        transparent: false
    });

    const handleImageExport = async () => {
        setIsExporting(true);
        const tid = toast.loading("Iniciando Renderização Industrial...");
        try {
            const blob = await exportManager.export(imgSettings, (p) => setProgress(p));
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lumina_Master_${Date.now()}.${imgSettings.format}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Master Exportado com Sucesso!", { id: tid });
            onClose();
        } catch (e) {
            toast.error("Falha Crítica na Exportação", { id: tid });
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    const handleVideoExport = async () => {
        setIsExporting(true);
        const tid = toast.loading("Iniciando Pipeline de Vídeo...");
        
        try {
            const renderer = new VideoRenderer(luminaEngine);
            
            // Mock de Tracks de Animação (Em produção, isso viria da Timeline)
            // Simula um zoom in suave e fade in
            const mockTracks = new Map<string, AnimationTrack[]>();
            // Assumindo que temos acesso aos IDs, para demo usaremos 'all' ou lógica interna do renderer
            
            const videoData = await renderer.renderVideo(vidSettings, mockTracks, (p) => setProgress(p));
            
            if (videoData) {
                const blob = new Blob([videoData.buffer], { type: `video/${vidSettings.format}` });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Lumina_Sequence_${Date.now()}.${vidSettings.format}`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Vídeo Renderizado!", { id: tid });
                onClose();
            } else {
                throw new Error("Blob vazio");
            }
        } catch (e: any) {
            console.error(e);
            toast.error(`Falha no Render de Vídeo: ${e.message}`, { id: tid });
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-xl bg-[#0e0e11] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                            {activeTab === 'IMAGE' ? <Download size={24} /> : <Film size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Exportar Master</h3>
                            <div className="flex gap-4 mt-2">
                                <button onClick={() => setActiveTab('IMAGE')} className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'IMAGE' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-600'}`}>Still Image</button>
                                <button onClick={() => setActiveTab('VIDEO')} className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'VIDEO' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-600'}`}>Motion Video</button>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-8">
                    {activeTab === 'IMAGE' ? (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2"><Ruler size={10} /> Largura (px)</label>
                                    <input type="number" value={imgSettings.width} onChange={e => setImgSettings({...imgSettings, width: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2"><Printer size={10} /> DPI</label>
                                    <select value={imgSettings.dpi} onChange={e => setImgSettings({...imgSettings, dpi: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
                                        <option value={72}>72 DPI (Web)</option>
                                        <option value={150}>150 DPI (Print)</option>
                                        <option value={300}>300 DPI (Pro)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2"><ImageIcon size={10} /> Formato</label>
                                    <select value={imgSettings.format} onChange={e => setImgSettings({...imgSettings, format: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
                                        <option value="png">PNG (Lossless)</option>
                                        <option value="jpeg">JPEG (High Qual)</option>
                                        <option value="webp">WebP (Optimized)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={10} /> ICC Profile</label>
                                    <select value={imgSettings.iccProfile} onChange={e => setImgSettings({...imgSettings, iccProfile: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
                                        <option value="sRGB">sRGB</option>
                                        <option value="AdobeRGB">Adobe RGB</option>
                                        <option value="CMYK">CMYK</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2"><Video size={10} /> Formato</label>
                                    <select value={vidSettings.format} onChange={e => setVidSettings({...vidSettings, format: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
                                        <option value="mp4">MP4 (H.264)</option>
                                        <option value="webm">WebM (Alpha)</option>
                                        <option value="gif">GIF (Animated)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2"><Clapperboard size={10} /> FPS</label>
                                    <select value={vidSettings.fps} onChange={e => setVidSettings({...vidSettings, fps: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
                                        <option value={24}>24 FPS (Cinema)</option>
                                        <option value={30}>30 FPS (Standard)</option>
                                        <option value={60}>60 FPS (Smooth)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Duração (s)</label>
                                    <input type="number" value={vidSettings.duration} onChange={e => setVidSettings({...vidSettings, duration: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Transparência</label>
                                    <button 
                                        onClick={() => setVidSettings({...vidSettings, transparent: !vidSettings.transparent})}
                                        className={`w-full h-[42px] rounded-xl border flex items-center justify-center transition-all ${vidSettings.transparent ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-white/10 text-zinc-500'}`}
                                    >
                                        {vidSettings.transparent ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-8 bg-zinc-900/30 border-t border-white/5">
                    <button 
                        onClick={activeTab === 'IMAGE' ? handleImageExport : handleVideoExport}
                        disabled={isExporting}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Renderizando ({progress}%)
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                {activeTab === 'IMAGE' ? 'Exportar Imagem' : 'Renderizar Sequência'}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
