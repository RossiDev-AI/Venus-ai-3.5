
import React, { useState, useCallback } from 'react';
import { track } from 'tldraw';
import { Layers, Play, Zap, FileJson, Download, Trash2, Loader2, CheckCircle, AlertCircle, HardDrive } from 'lucide-react';
import { batchManager } from '../../../engines/lumina/core/BatchManager';
import { BatchItem, BatchMacro } from '../../../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { toast } from 'sonner';

const DEFAULT_MACROS: BatchMacro[] = [
    { 
        id: 'web-opt', 
        name: 'Optimize for Web', 
        actions: [
            { type: 'RESIZE', params: { width: 1920 } },
            { type: 'FILTER', params: { contrast: 1.1, saturation: 1.05 } },
            { type: 'WATERMARK', params: { text: 'LATENT CINEMA STUDIO' } }
        ] 
    },
    { 
        id: 'vintage-8mm', 
        name: 'Kodak 8mm Texture', 
        actions: [
            { type: 'FILTER', params: { brightness: 0.95, contrast: 1.3, saturation: 0.8 } },
            { type: 'FILTER', params: { sepia: 0.4 } }
        ] 
    }
];

export const BatchPanel = track(() => {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedMacroId, setSelectedMacroId] = useState(DEFAULT_MACROS[0].id);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const startBatch = async () => {
        const macro = DEFAULT_MACROS.find(m => m.id === selectedMacroId)!;
        setIsProcessing(true);
        const tid = toast.loading(`Processando lote de ${files.length} arquivos...`);

        await batchManager.processLote(files, macro, (p: number, items: BatchItem[]) => {
            setProgress(p);
            setBatchQueue(items);
            if (p === 100) {
                setIsProcessing(false);
                toast.success("Processamento em lote concluído!", { id: tid });
            }
        });
    };

    const downloadResults = async () => {
        const zipBlob = await batchManager.exportZip();
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lumina_Batch_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0e]">
            {/* Macro & File Selection */}
            <div className="p-8 space-y-8 border-b border-white/5 bg-[#0e0e11]/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Parallel Batch Engine</h3>
                        <p className="text-[8px] mono text-zinc-500 uppercase font-bold tracking-widest">v3.0 Worker Pool Pipeline</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Macro Selection</label>
                    <div className="grid grid-cols-1 gap-2">
                        {DEFAULT_MACROS.map(m => (
                            <button 
                                key={m.id}
                                onClick={() => setSelectedMacroId(m.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedMacroId === m.id ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-xl' : 'bg-black/40 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{m.name}</span>
                                <FileJson size={14} className={selectedMacroId === m.id ? 'text-indigo-400' : 'opacity-20'} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative group">
                        <input 
                            type="file" multiple accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-8 bg-zinc-900/40 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 group-hover:border-indigo-500/30 transition-all">
                            <Layers size={24} className="text-zinc-700 group-hover:text-indigo-400" />
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                {files.length > 0 ? `${files.length} Files Selected` : 'Drop Image Folder'}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={startBatch}
                        disabled={files.length === 0 || isProcessing}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        Execute Multi-Core Batch
                    </button>
                </div>
            </div>

            {/* Monitoring Queue */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Active Queue ({batchQueue.length})</span>
                    {progress === 100 && (
                        <button onClick={downloadResults} className="flex items-center gap-2 text-emerald-500 text-[8px] font-black uppercase hover:underline">
                            <Download size={10} /> Download Zip
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {batchQueue.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-10">
                            <HardDrive size={48} />
                            <p className="text-[9px] font-black uppercase tracking-widest">Pipeline Standby</p>
                        </div>
                    ) : (
                        batchQueue.map((item, i) => (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center gap-4 group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-black border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                                    {item.status === 'done' ? (
                                        <CheckCircle size={16} className="text-emerald-500" />
                                    ) : item.status === 'error' ? (
                                        <AlertCircle size={16} className="text-red-500" />
                                    ) : (
                                        <Loader2 size={16} className="text-indigo-400 animate-spin" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[9px] font-black text-white uppercase truncate">{item.file.name}</h4>
                                    <div className="w-full h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${item.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${item.progress}%` }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            
            {/* Global Footer Progress */}
            {isProcessing && (
                <div className="p-6 bg-indigo-600/10 border-t border-indigo-500/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[8px] font-black text-indigo-400 uppercase">Global Progress</span>
                        <span className="text-[10px] mono font-bold text-white">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-indigo-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});
