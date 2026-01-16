
import React, { useState } from 'react';
import { useEditor, track } from 'tldraw';
import { 
    Cpu, Upload, Search, ChevronDown, 
    Camera, Zap, FlaskConical, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { toast } from 'sonner';

const COLLECTIONS = [
    { 
        id: 'LENS', label: 'Optics', icon: Camera, 
        items: [
            { label: 'Leica Summilux 35mm', props: { sharpness: 1.2, vignette: 0.15, temperature: 5, brightness: 1.02 } },
            { label: 'Arri Master Prime', props: { sharpness: 1.8, contrast: 1.15, grain: 0.05 } },
            { label: 'Anamorphic 2X Blue Flare', props: { bulge: 0.25, rgbSplit: 1.5, bloom: 0.4, contrast: 0.95 } },
            { label: 'Zeiss Vintage 1970', props: { grain: 0.4, saturation: 0.85, tint: 8, brightness: 0.95 } },
            { label: 'Split-Diopter Rig', props: { blur: 4, face_radius: 0.4, brightness: 1.1 } },
        ] 
    },
    { 
        id: 'GAFFER', label: 'Light', icon: Zap, 
        items: [
            { label: 'Golden Hour Rim', props: { bloom: 0.65, temperature: 18, tint: 4, contrast: 1.1 } },
            { label: 'Cyber Neon Purple', props: { saturation: 1.7, rgbSplit: 1.8, tint: 35, contrast: 1.2 } },
            { label: 'Moonlight HMI 12K', props: { temperature: -45, brightness: 0.85, contrast: 1.3, bloom: 0.2 } },
            { label: 'Cinematic High Key', props: { brightness: 1.35, contrast: 0.85, bloom: 0.4, sharpness: 0.8 } },
            { label: 'Noir Low Key', props: { brightness: 0.65, contrast: 1.9, saturation: 0, grain: 0.3 } },
        ] 
    },
    { 
        id: 'ALCHEMY', label: 'Neural', icon: FlaskConical, 
        items: [
            { label: 'Skin Pores 8K', props: { sharpness: 2.1, grain: 0.12, contrast: 1.05 } },
            { label: 'Material Albedo Fix', props: { contrast: 1.12, saturation: 1.05, brightness: 1.02 } },
            { label: 'Anatomical DNA Lock', props: { contrast: 1.2, sharpness: 1.5 }, action: 'dna-lock' },
            { label: 'Fluid Motion Flow', props: { blur: 2, bloom: 0.3 }, action: 'flow' }
        ] 
    }
];

export const LuminaSuperBar = track(({ onImportClick }: { onImportClick: () => void }) => {
    const editor = useEditor();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const handleToolAction = (item: any) => {
        const selected = editor.getSelectedShapes();
        if (selected.length === 0) return toast.error("Select a node to apply parameters");
        
        selected.forEach(shape => {
            if (shape.type === 'lumina-image') {
                const currentProps = (shape.props as any);
                editor.updateShape({ 
                    id: shape.id, 
                    props: { 
                        ...currentProps,
                        ...item.props 
                    } 
                });
                toast.success(`Matrix Applied: ${item.label}`);
            }
        });
        setActiveDropdown(null);
    };

    return (
        <div className="w-full h-full flex items-center justify-between px-2 md:px-6 bg-[#0e0e11] relative select-none">
            <div className="hidden md:flex items-center gap-4 pr-10 border-r border-white/5 h-10 shrink-0">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                    <Cpu size={18} className="text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white uppercase tracking-tighter leading-none">Lumina Studio</span>
                    <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Titanium v9.0</span>
                </div>
            </div>

            <div className="flex-1 flex items-center gap-1 px-2 md:px-8 overflow-x-auto no-scrollbar mask-gradient">
                {COLLECTIONS.map(group => (
                    <div key={group.id} className="relative shrink-0">
                        <button 
                            onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}
                            className={`flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeDropdown === group.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <group.icon size={12} />
                            {group.label}
                            <ChevronDown size={10} className="opacity-30" />
                        </button>

                        <AnimatePresence>
                            {activeDropdown === group.id && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="fixed md:absolute top-16 md:top-full left-4 md:left-0 right-4 md:right-auto mt-1 md:w-64 bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl p-2 grid grid-cols-1 gap-1 z-[3000]"
                                >
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                        <div className="px-3 py-2 text-[7px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 mb-1 flex justify-between">
                                            <span>{group.label} Catalog</span>
                                            <button onClick={() => setActiveDropdown(null)} className="md:hidden text-white">X</button>
                                        </div>
                                        {group.items.map(item => (
                                            <button 
                                                key={item.label}
                                                onClick={() => handleToolAction(item)}
                                                className="w-full text-left px-4 py-3 rounded-lg text-[9px] font-bold text-zinc-400 hover:bg-indigo-600/10 hover:text-white transition-all uppercase tracking-tighter flex items-center justify-between group/item"
                                            >
                                                {item.label}
                                                <Sparkles size={10} className="opacity-0 group-hover/item:opacity-100 text-indigo-500" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                
                <div className="w-[1px] h-6 bg-white/5 mx-2 md:mx-4 shrink-0" />
                
                <div className="hidden md:flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-full border border-white/5 group shrink-0">
                    <Search size={14} className="text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    <input 
                        placeholder="Search Engine..." 
                        className="bg-transparent border-none outline-none text-[10px] text-white w-40 font-bold uppercase tracking-widest placeholder:text-zinc-800"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 pl-2 md:pl-10 border-l border-white/5 h-10 shrink-0">
                <button 
                    onClick={onImportClick}
                    className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-[0_5px_15px_rgba(79,70,229,0.3)]"
                >
                    <Upload size={12} /> <span className="hidden md:inline">Import RAW</span> <span className="md:hidden">Import</span>
                </button>
            </div>
        </div>
    );
});
