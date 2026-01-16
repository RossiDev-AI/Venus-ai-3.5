
import React, { useState } from 'react';
import { motion } from 'https://esm.sh/framer-motion@10.16.4';
import { useEditor } from 'tldraw';
import { Sparkles, Zap, Aperture, Eye, FlaskConical, Palette, Search } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'CAST', label: 'Casting', icon: Eye, color: 'text-pink-500' },
  { id: 'LIGHT', label: 'Gaffer', icon: Zap, color: 'text-amber-500' },
  { id: 'LENS', label: 'Lens', icon: Aperture, color: 'text-cyan-500' },
  { id: 'VFX', label: 'Alchemy', icon: FlaskConical, color: 'text-indigo-500' }
];

const TOOLS = Array.from({ length: 150 }).map((_, i) => ({
    id: `tool-${i}`,
    cat: CATEGORIES[i % CATEGORIES.length].id,
    label: ['Cinematic Fog', 'Flare v2', 'Skin Fix', 'Rim Light', 'Identity Lock', 'Raytrace', 'Kodak 5219', '35mm Grain', 'Anamorphic'][i % 9] + ` ${Math.floor(i/9)+1}`,
    prompt: `Industrial cinema grade, ${['heavy fog', 'optical flare', 'perfect skin', 'golden rim lighting', 'dna lock', 'raytraced shadows'][i % 6]}, photorealistic 8k.`
}));

const ToolbeltOverlay: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const editor = useEditor();
  const [activeCat, setActiveCat] = useState('CAST');
  const [search, setSearch] = useState('');

  const handleApplyTool = async (tool: any) => {
     const selected = editor.getSelectedShapes();
     if (selected.length === 0) return toast.error("Select a node first");
     
     const shape = selected[0] as any;
     if (shape.type !== 'lumina-image') return toast.error("Select an image node");

     onClose();
     const tid = toast.loading(`Applying ${tool.label}...`);
     
     try {
        // Invocamos a transformação via inpainting enviando um prompt de "full image override"
        const PIXI = (window as any).PIXI;
        const app = (document.querySelector('.vnus-studio-canvas canvas') as any)?._pixiApp; // Heurística de acesso
        
        // Como o editor está desacoplado do app interno do shape, usamos a URL direta para este prompt global
        const { performInpainting } = await import('./LuminaGeminiService');
        const result = await performInpainting(shape.props.url, "", tool.prompt);
        
        if (result) {
            editor.updateShape({ id: shape.id, props: { url: result } });
            toast.success(`${tool.label} Synthesized`, { id: tid });
        }
     } catch (e) {
        toast.error("Bridge Failure", { id: tid });
     }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-5xl h-[80vh] bg-[#0e0e11] border border-white/10 rounded-[3rem] shadow-2xl flex overflow-hidden">
        <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-6 gap-2">
           {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setActiveCat(c.id)} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeCat === c.id ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>
                 <c.icon size={16} className={activeCat === c.id ? 'text-white' : c.color} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
              </button>
           ))}
        </div>
        <div className="flex-1 flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center gap-4">
               <Search size={20} className="text-zinc-600" />
               <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search 150+ Operations..." className="flex-1 bg-transparent text-xl font-black text-white outline-none" />
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
                {TOOLS.filter(t => t.cat === activeCat && t.label.toLowerCase().includes(search.toLowerCase())).map(t => (
                    <button key={t.id} onClick={() => handleApplyTool(t)} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] text-left hover:border-indigo-500 hover:bg-indigo-600/5 transition-all">
                        <span className="text-[11px] font-black text-white uppercase block mb-1">{t.label}</span>
                        <p className="text-[7px] text-zinc-600 uppercase font-bold tracking-widest leading-relaxed">Neural Cinema Recipe v10.2</p>
                    </button>
                ))}
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ToolbeltOverlay;
