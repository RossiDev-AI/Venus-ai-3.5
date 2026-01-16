
import React, { useState, useEffect } from 'react';
import { track, useEditor } from 'tldraw';
import { pluginManager, PluginManifest } from '../../../engines/lumina/plugins/PluginManager';
import { Plus, Trash2, ExternalLink, Shield, Package, Globe, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

export const PluginPanel = track(() => {
    const editor = useEditor();
    const [plugins, setPlugins] = useState<PluginManifest[]>([]);
    const [pluginUrl, setPluginUrl] = useState('');
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        pluginManager.setEditor(editor);
        refresh();
    }, [editor]);

    const refresh = () => {
        setPlugins(pluginManager.getActivePlugins());
    };

    const handleInstall = async () => {
        if (!pluginUrl) return;
        setIsInstalling(true);
        await pluginManager.installPlugin(pluginUrl);
        setPluginUrl('');
        setIsInstalling(false);
        refresh();
    };

    const handleDelete = (id: string) => {
        pluginManager.uninstallPlugin(id);
        refresh();
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0e]">
            {/* Header / Search */}
            <div className="p-8 space-y-6 border-b border-white/5 bg-[#0e0e11]/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                        <Package size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Plugin Ecosystem</h3>
                        <p className="text-[8px] mono text-zinc-500 uppercase font-bold tracking-widest">v1.0 Sandboxed Modules</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-black/60 px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 focus-within:border-indigo-500/40 transition-all">
                        <Globe size={14} className="text-zinc-600" />
                        <input 
                            value={pluginUrl}
                            onChange={e => setPluginUrl(e.target.value)}
                            placeholder="Plugin Manifest URL..." 
                            className="bg-transparent border-none outline-none text-[10px] font-bold text-white w-full uppercase tracking-widest placeholder:text-zinc-800"
                        />
                    </div>
                    <button 
                        onClick={handleInstall}
                        disabled={isInstalling || !pluginUrl}
                        className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all active:scale-95 disabled:opacity-30"
                    >
                        {isInstalling ? <Plus size={18} className="animate-spin" /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <AnimatePresence>
                    {plugins.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                            <Terminal size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest">No active modules detected</p>
                        </div>
                    ) : (
                        plugins.map(p => (
                            <motion.div 
                                key={p.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h4 className="text-[12px] font-black text-white uppercase tracking-tight">{p.name}</h4>
                                        <p className="text-[8px] mono text-zinc-500 font-bold">BY {p.author.toUpperCase()} • V{p.version}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(p.id)}
                                        className="p-2 text-zinc-700 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <p className="text-[10px] text-zinc-400 leading-relaxed mb-6">
                                    {p.description || "Experimental module for extending Lumina Studio capabilities."}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {p.permissions.map(perm => (
                                            <div key={perm} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[6px] font-black text-indigo-400 uppercase">
                                                {perm}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-500">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[7px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Dev Tools */}
            <div className="p-6 border-t border-white/5 bg-zinc-900/20">
                <div className="flex items-center justify-between text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Shield size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Iframe Sandbox: Active</span>
                    </div>
                    <button className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-indigo-400 transition-all">
                        Documentation <ExternalLink size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
});
