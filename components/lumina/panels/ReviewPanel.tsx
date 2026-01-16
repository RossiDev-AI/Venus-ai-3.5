
import React, { useState, useEffect } from 'react';
import { track, useEditor } from 'tldraw';
import { reviewManager } from '../../../engines/lumina/core/ReviewManager';
import { Users, Video, Link, Share2, Shield, EyeOff, Monitor, Zap, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { toast } from 'sonner';

export const ReviewPanel = track(() => {
    const editor = useEditor();
    const [peerId, setPeerId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [isZen, setIsZen] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        reviewManager.initialize().then(id => setPeerId(id));
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(peerId);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
        toast.success("ID de Review copiado!");
    };

    const handleJoin = async () => {
        if (!targetId) return;
        await reviewManager.joinSession(targetId);
    };

    const handleStartBroadcast = () => {
        const canvas = document.querySelector('.tl-canvas canvas') as HTMLCanvasElement;
        if (canvas) {
            reviewManager.startStreaming(canvas, targetId);
            toast.success("Stream de Viewport Iniciado!");
        }
    };

    const toggleZen = () => {
        setIsZen(!isZen);
        const root = document.querySelector('.h-full') as HTMLElement;
        if (!isZen) {
            root?.requestFullscreen();
            document.body.classList.add('minimal-ui');
        } else {
            document.exitFullscreen();
            document.body.classList.remove('minimal-ui');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0e]">
            {/* Host Section */}
            <div className="p-8 space-y-8 border-b border-white/5 bg-[#0e0e11]/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Review Station</h3>
                        <p className="text-[8px] mono text-zinc-500 uppercase font-bold tracking-widest">P2P Encrypted Review Channel</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Your Unique ID</label>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black/60 px-4 py-3 rounded-2xl border border-white/10 flex items-center justify-between group">
                            <span className="text-[10px] mono font-bold text-indigo-400">{peerId || 'Generating...'}</span>
                            <button onClick={handleCopy} className="text-zinc-600 hover:text-white transition-all">
                                {hasCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                        <button className="p-4 bg-white/5 hover:bg-indigo-600 text-zinc-500 hover:text-white rounded-2xl transition-all">
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Remote Link */}
            <div className="p-8 space-y-6 bg-black/20">
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Connect to Session</label>
                    <input 
                        value={targetId}
                        onChange={e => setTargetId(e.target.value)}
                        placeholder="Paste Peer ID..."
                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-4 text-[10px] mono text-white outline-none focus:border-indigo-500/30 transition-all uppercase placeholder:text-zinc-800"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleJoin} className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                        <Link size={14} /> Join Channel
                    </button>
                    <button onClick={handleStartBroadcast} className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <Video size={14} /> Start Viewport
                    </button>
                </div>
            </div>

            {/* View Controls */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Live Tools</h4>
                
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={toggleZen}
                        className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${isZen ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-2xl' : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-4">
                            <Monitor size={18} />
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest">Zen Presentation</p>
                                <p className="text-[8px] mono text-zinc-600 uppercase">Immersive Review Mode</p>
                            </div>
                        </div>
                        <Zap size={14} className={isZen ? 'text-indigo-400' : 'opacity-20'} />
                    </button>

                    <button 
                        onClick={() => reviewManager.toggleMute()}
                        className="flex items-center justify-between p-5 rounded-3xl border border-white/5 bg-zinc-900/40 text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <EyeOff size={18} />
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest">Mute Feedback</p>
                                <p className="text-[8px] mono text-zinc-600 uppercase">Hide remote annotations</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Footer Security */}
            <div className="p-6 bg-indigo-600/5 border-t border-white/5 flex items-center justify-center gap-3">
                <Shield size={12} className="text-indigo-500" />
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">End-to-End Encrypted</span>
            </div>
        </div>
    );
});
