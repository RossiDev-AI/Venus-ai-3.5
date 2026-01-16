
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { Sparkles, SlidersHorizontal, Wand2, Eraser, Zap } from 'lucide-react';
import { track } from 'tldraw';

interface LuminaMagicToolbarProps {
  onTransform: (prompt: string, strength: number) => void;
  isProcessing: boolean;
  onRemoveBG: () => void;
  props: any;
  onUpdate: (p: any) => void;
}

const LuminaMagicToolbar: React.FC<LuminaMagicToolbarProps> = track(({ onTransform, isProcessing, onRemoveBG, props, onUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'gen' | 'adjust' | 'fx'>('gen');

  const updateProp = (key: string, val: number) => {
    onUpdate({ ...props, [key]: val });
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute top-[-380px] left-1/2 -translate-x-1/2 z-[2000] w-[360px] pointer-events-auto"
      >
        <div className="bg-[#0e0e11]/95 backdrop-blur-2xl border border-white/10 p-1 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col gap-2">
          
          {/* Tab Switcher */}
          <div className="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/5 mx-4 mt-4">
             <button onClick={() => setActiveTab('gen')} className={`flex-1 flex items-center justify-center gap-2 text-[9px] font-black uppercase py-2.5 rounded-full transition-all ${activeTab === 'gen' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Sparkles size={12}/> Neural</button>
             <button onClick={() => setActiveTab('adjust')} className={`flex-1 flex items-center justify-center gap-2 text-[9px] font-black uppercase py-2.5 rounded-full transition-all ${activeTab === 'adjust' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><SlidersHorizontal size={12}/> Optics</button>
             <button onClick={() => setActiveTab('fx')} className={`flex-1 flex items-center justify-center gap-2 text-[9px] font-black uppercase py-2.5 rounded-full transition-all ${activeTab === 'fx' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Zap size={12}/> FX</button>
          </div>

          <div className="p-6 min-h-[220px]">
            {activeTab === 'gen' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1 flex justify-between">
                        <span>Generative Directive</span>
                        <span className="text-zinc-600">Gemini 2.5 Flash</span>
                     </label>
                     <textarea 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        placeholder="Describe the change (e.g. 'Add neon lights', 'Remove person')..." 
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-white text-[11px] outline-none focus:border-indigo-500/50 transition-all h-20 resize-none placeholder:text-zinc-700" 
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onTransform(prompt, 1.0)} 
                        disabled={isProcessing || !prompt.trim()} 
                        className="py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Wand2 size={14}/> {isProcessing ? 'Synthesizing...' : 'Generate Fill'}
                      </button>
                      <button 
                        onClick={onRemoveBG} 
                        disabled={isProcessing}
                        className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[9px] font-black uppercase text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border border-white/5"
                      >
                        <Eraser size={14}/> Remove BG
                      </button>
                   </div>
                   <p className="text-[8px] text-zinc-600 text-center uppercase tracking-widest">Draw mask on canvas to target specific areas</p>
                </div>
            )}

            {activeTab === 'adjust' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                   {[
                       { k: 'brightness', l: 'Exposure', min: 0, max: 2, def: 1, step: 0.01 },
                       { k: 'contrast', l: 'Contrast', min: 0, max: 2, def: 1, step: 0.01 },
                       { k: 'saturation', l: 'Saturation', min: 0, max: 2, def: 1, step: 0.01 },
                       { k: 'face_radius', l: 'Focus Radius', min: 0, max: 1, def: 0.2, step: 0.01 }
                   ].map(s => (
                       <div key={s.k} className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase px-1">
                            <span>{s.l}</span>
                            <span className="text-indigo-400 mono">{(props[s.k] ?? s.def).toFixed(2)}</span>
                          </div>
                          <input 
                            type="range" 
                            min={s.min} max={s.max} step={s.step} 
                            value={props[s.k] ?? s.def} 
                            onChange={e => updateProp(s.k, parseFloat(e.target.value))} 
                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer hover:accent-indigo-400" 
                          />
                       </div>
                   ))}
                </div>
            )}

            {activeTab === 'fx' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                   {[
                       { k: 'blur', l: 'Lens Blur', min: 0, max: 10, def: 0, step: 0.1 },
                       { k: 'grain', l: 'Film Grain', min: 0, max: 1, def: 0, step: 0.01 },
                       { k: 'bloom', l: 'Glow Strength', min: 0, max: 1, def: 0, step: 0.01 }
                   ].map(s => (
                       <div key={s.k} className="space-y-1.5">
                          <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase px-1">
                            <span>{s.l}</span>
                            <span className="text-amber-400 mono">{(props[s.k] ?? s.def).toFixed(2)}</span>
                          </div>
                          <input 
                            type="range" 
                            min={s.min} max={s.max} step={s.step} 
                            value={props[s.k] ?? s.def} 
                            onChange={e => updateProp(s.k, parseFloat(e.target.value))} 
                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-amber-500 cursor-pointer hover:accent-amber-400" 
                          />
                       </div>
                   ))}
                </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default LuminaMagicToolbar;
