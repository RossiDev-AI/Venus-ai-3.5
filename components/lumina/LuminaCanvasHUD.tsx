
import React, { useState } from 'react';
import { useEditor, track } from 'tldraw';
import { 
    Aperture, Shapes, FlaskConical, Cpu, 
    ChevronDown, Activity, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

const HUD_TOOLS = [
    { cat: 'Optics', icon: Aperture, items: ['Twirl Master', 'Bulge 4K', 'Pinch Pro', 'Anamorphic Fix', 'RGB Aberration', 'Lens Flare Pro', 'God Ray Engine', 'Bokeh Depth'] },
    { cat: 'Neural', icon: Cpu, items: ['Smart Fill', 'Object Erase', 'Relight AI', 'Character Fix', 'Face Warp Pro', 'Style Transfer', 'Upscale 8K', 'Temporal Lock'] },
    { cat: 'Material', icon: FlaskConical, items: ['Carbon Fiber', 'Wet Surface', 'Brushed Metal', 'Hologram FX', 'Biolume', 'Silk Flow', 'Rough Concrete', 'Skin Pores'] },
    { cat: 'Geometry', icon: Shapes, items: ['Smart Perspective', 'Auto Crop', 'Center Pivot', 'Mirror X/Y', 'Mesh Warp', 'Depth Map', 'Normal Map', 'Shadow Rig'] }
];

export const LuminaCanvasHUD = track(() => {
    const editor = useEditor();
    const [activeCat, setActiveCat] = useState<string | null>(null);

    const applyHUDOp = (op: string) => {
        const selected = editor.getSelectedShapes();
        if (selected.length === 0) return;
        
        selected.forEach(shape => {
            if (shape.type === 'lumina-image') {
                const props = { ...shape.props } as any;
                if (op === 'Twirl Master') props.twirl = 2.0;
                if (op === 'Bulge 4K') props.bulge = 0.5;
                if (op === 'RGB Aberration') props.rgbSplit = 1.0;
                if (op === 'Anamorphic Fix') props.w *= 1.5;
                
                editor.updateShape({ id: shape.id, props });
            }
        });
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[502] pointer-events-none">
            <div className="flex items-center gap-1 bg-[#0e0e11]/80 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                <div className="px-3 border-r border-white/10 py-1 mr-1">
                    <Activity size={14} className="text-emerald-500 animate-pulse" />
                </div>
                
                {HUD_TOOLS.map(group => (
                    <div key={group.cat} className="relative group">
                        <button 
                            onMouseEnter={() => setActiveCat(group.cat)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeCat === group.cat ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <group.icon size={12} />
                            {group.cat}
                            <ChevronDown size={10} className="opacity-30" />
                        </button>
                        
                        <AnimatePresence>
                            {activeCat === group.cat && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    onMouseLeave={() => setActiveCat(null)}
                                    className="absolute top-full left-0 mt-2 w-48 bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl p-2 grid grid-cols-1 gap-1"
                                >
                                    {group.items.map(item => (
                                        <button 
                                            key={item}
                                            onClick={() => applyHUDOp(item)}
                                            className="w-full text-left px-4 py-2.5 rounded-lg text-[9px] font-bold text-zinc-400 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-tighter"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                <div className="w-[1px] h-4 bg-white/10 mx-2" />
                
                <div className="relative group">
                    <Search size={14} className="text-zinc-600 mx-3 cursor-pointer hover:text-indigo-400 transition-colors" />
                </div>
            </div>
        </div>
    );
});
