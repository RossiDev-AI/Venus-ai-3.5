
import React, { useState, useEffect } from 'react';
import { track, useEditor } from 'tldraw';
import { HistoryManager } from '../../../engines/lumina/core/HistoryManager';
import { collabManager } from '../../../engines/lumina/core/CollabManager';
import { Clock, RotateCcw, Save, Archive, AlertTriangle, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { LuminaSnapshot } from '../../../types';

export const HistoryPanel = track(() => {
    const editor = useEditor();
    const [historyManager] = useState(() => new HistoryManager(collabManager.doc));
    const [snapshots, setSnapshots] = useState<LuminaSnapshot[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        historyManager.setEditor(editor);
        historyManager.loadFromDisk().then(() => {
            setSnapshots(historyManager.getHistory());
        });
        historyManager.startAutoSave();
    }, [editor, historyManager]);

    const handleManualSnapshot = async () => {
        setIsSaving(true);
        const label = window.prompt("Nome do Snapshot:", "Manual Milestone");
        if (label) {
            await historyManager.createSnapshot(label);
            setSnapshots([...historyManager.getHistory()]);
        }
        setIsSaving(false);
    };

    const handleRestore = async (id: string) => {
        if (confirm("Isso irá substituir o estado atual pelo snapshot. Continuar?")) {
            await historyManager.restore(id);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0e]">
            <div className="p-8 space-y-6 border-b border-white/5 bg-[#0e0e11]/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Time Machine</h3>
                            <p className="text-[8px] mono text-zinc-500 uppercase font-bold tracking-widest">v2.1 Persistence Hub</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleManualSnapshot}
                        disabled={isSaving}
                        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        <Save size={16} />
                    </button>
                </div>
                
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <Archive size={14} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">OPFS Resilient Storage Active</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <AnimatePresence>
                    {snapshots.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                            <RotateCcw size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting First Milestone</p>
                        </div>
                    ) : (
                        snapshots.map((s, i) => (
                            <motion.div 
                                key={s.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-4 bg-zinc-900/40 border rounded-[2rem] hover:border-white/20 transition-all group relative overflow-hidden ${s.isAuto ? 'border-white/5' : 'border-indigo-500/20'}`}
                            >
                                <div className="flex gap-4 items-center relative z-10">
                                    <div className="w-16 h-12 rounded-xl bg-black border border-white/5 overflow-hidden shrink-0">
                                        <img src={s.thumbnail} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-[10px] font-black text-white uppercase truncate pr-2">{s.label}</h4>
                                            {s.isAuto && <span className="text-[6px] font-black text-zinc-600 bg-black px-1.5 py-0.5 rounded uppercase">Auto</span>}
                                        </div>
                                        <p className="text-[8px] mono text-zinc-500 font-bold uppercase mt-1">
                                            {new Date(s.timestamp).toLocaleTimeString()} • {new Date(s.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleRestore(s.id)}
                                        className="p-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition-all"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <div className="p-6 border-t border-white/5 bg-zinc-900/20">
                <div className="flex items-center gap-3 text-amber-500">
                    <AlertTriangle size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Disaster Recovery: 30s Heartbeat</span>
                </div>
            </div>
        </div>
    );
});
