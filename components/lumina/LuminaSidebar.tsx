
import React, { useState, useEffect } from 'react';
import { useEditor, TLShape, track } from 'tldraw';
import { Layers, Sliders, Sparkles, Target, Grid, Download, Type, Box, History, Zap, Shapes, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { NodeInspector } from './panels/NodeInspector';
import { CatalogBrowser } from './panels/CatalogBrowser';
import { NeuralCore } from './panels/NeuralCore';
import { PluginPanel } from './panels/PluginPanel';
import { HistoryPanel } from './panels/HistoryPanel';
import { BatchPanel } from './panels/BatchPanel';
import { VectorInspector } from './panels/VectorInspector';
import { ReviewPanel } from './panels/ReviewPanel';
import { ExportDialog } from './ExportDialog';

export const LuminaSidebar = track(() => {
  const editor = useEditor();
  const [activeTab, setActiveTab] = useState<'PROPS' | 'CATALOG' | 'NEURAL' | 'LAYERS' | 'PLUGINS' | 'HISTORY' | 'BATCH' | 'VECTOR' | 'REVIEW'>('PROPS');
  
  const selection = editor.getSelectedShapes().length === 1 ? editor.getSelectedShapes()[0] : null;
  const allShapes = editor.getCurrentPageShapes().slice().reverse();
  const selectedShapeIds = editor.getSelectedShapeIds();
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (selection?.type === 'lumina-vector') setActiveTab('VECTOR');
  }, [selection]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-zinc-400 select-none bg-[#0c0c0e]">
      <div className="flex bg-[#0e0e11] border-b border-white/5 h-20 shrink-0 p-2 gap-1 overflow-x-auto no-scrollbar">
        {[
            { id: 'PROPS', label: 'Nodes', icon: Sliders },
            { id: 'VECTOR', label: 'Path', icon: Shapes },
            { id: 'CATALOG', label: 'Catalog', icon: Grid },
            { id: 'NEURAL', label: 'AI Core', icon: Sparkles },
            { id: 'REVIEW', label: 'Review', icon: Users },
            { id: 'BATCH', label: 'Batch', icon: Zap },
            { id: 'HISTORY', label: 'History', icon: History },
            { id: 'PLUGINS', label: 'Plugins', icon: Box },
            { id: 'LAYERS', label: 'Stack', icon: Layers }
        ].map(t => (
            <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 min-w-[65px] flex flex-col items-center justify-center gap-1.5 transition-all rounded-2xl relative ${activeTab === t.id ? 'text-white bg-white/[0.04] shadow-xl' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02]'}`}
            >
                <t.icon size={18} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t.label}</span>
                {activeTab === t.id && (
                    <motion.div layoutId="sidebar-tab" className="absolute bottom-1 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
                )}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0e]">
        <AnimatePresence mode="wait">
            {activeTab === 'PROPS' && <NodeInspector key="props" editor={editor} selection={selection} />}
            {activeTab === 'VECTOR' && <VectorInspector key="vector" />}
            {activeTab === 'CATALOG' && <CatalogBrowser key="catalog" editor={editor} />}
            {activeTab === 'NEURAL' && <NeuralCore key="neural" editor={editor} />}
            {activeTab === 'REVIEW' && <ReviewPanel key="review" />}
            {activeTab === 'BATCH' && <BatchPanel key="batch" />}
            {activeTab === 'HISTORY' && <HistoryPanel key="history" />}
            {activeTab === 'PLUGINS' && <PluginPanel key="plugins" />}
            {activeTab === 'LAYERS' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-4 pb-32">
                    <div className="flex items-center justify-between px-3 mb-6">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Stack ({allShapes.length})</span>
                    </div>
                    {allShapes.map((s: any) => (
                        <div 
                            key={s.id} onClick={() => editor.select(s.id)}
                            className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all cursor-pointer group shadow-xl ${selectedShapeIds.includes(s.id) ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-black/40 border-white/5'}`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                                {s.props.url ? <img src={s.props.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Type size={16} /></div>}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black text-zinc-100 truncate uppercase">{s.props.vaultId || s.type}</p>
                                <p className="text-[8px] mono text-zinc-700 font-bold uppercase mt-1">ID: {s.id.slice(-8)}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="h-20 bg-[#0e0e11] border-t border-white/5 px-8 flex items-center justify-between shrink-0">
            <button 
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
                <Download size={14} /> Export Master
            </button>
            <span className="text-[9px] mono text-indigo-500 font-black tracking-tighter bg-indigo-500/10 px-2 py-0.5 rounded">REVIEW_P2P_v1.0</span>
      </div>

      <ExportDialog isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
});
