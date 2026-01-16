
import React, { useState } from 'react';
import { Editor, createShapeId, track, exportToBlob } from 'tldraw';
import { Sparkles, Wind, Wand2, Maximize2, RefreshCw, ChevronRight, Loader2, Eraser, Check, X, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { performGenerativeFill } from '../LuminaGeminiService';
import { luminaEngine } from '../../../engines/lumina/core/LuminaEngine';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

export const NeuralCore = track(({ editor }: { editor: Editor }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState<number | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');

  const selectedShapes = editor.getSelectedShapes();
  const selection = selectedShapes.length === 1 ? selectedShapes[0] : null;

  const handleGenerativeFill = async () => {
    if (!selection || selection.type !== 'lumina-image' || !prompt.trim()) {
        return toast.error("Selecione uma imagem e digite um prompt.");
    }
    
    setIsProcessing(true);
    const tid = toast.loading("Iniciando Pipeline Generativa...");

    try {
        // 1. Extrair Máscara (Traços de desenho sobre a imagem)
        const imageBounds = editor.getShapePageBounds(selection.id)!;
        const maskShapes = editor.getCurrentPageShapes().filter(s => 
            s.type === 'lumina-mask' && editor.getShapePageBounds(s.id)?.collides(imageBounds)
        );

        if (maskShapes.length === 0) {
            throw new Error("Pinte uma máscara sobre a imagem primeiro.");
        }

        const maskBlob = await exportToBlob({
            editor,
            ids: maskShapes.map(s => s.id),
            format: 'png',
            opts: { background: false, bounds: imageBounds, padding: 0, scale: 1 }
        });

        const maskBase64 = await new Promise<string>(r => {
            const rd = new FileReader(); rd.onloadend = () => r(rd.result as string); rd.readAsDataURL(maskBlob);
        });

        // 2. Extrair Imagem Base
        const imageBase64 = (selection.props as any).url;

        // 3. Chamar Serviço Gemini com suporte a variações
        const results = await performGenerativeFill(imageBase64, maskBase64, prompt);
        setVariations(results);
        setSelectedVariation(0);
        
        toast.success(`${results.length} variações geradas!`, { id: tid });
    } catch (e: any) {
        toast.error(`Erro: ${e.message}`, { id: tid });
    } finally {
        setIsProcessing(false);
    }
  };

  const applyVariation = () => {
    if (selectedVariation === null || !selection) return;
    
    editor.updateShape({
        id: selection.id,
        props: { url: variations[selectedVariation] }
    });

    // Limpar máscaras após aplicar
    const imageBounds = editor.getShapePageBounds(selection.id)!;
    const maskShapes = editor.getCurrentPageShapes().filter(s => 
        s.type === 'lumina-mask' && editor.getShapePageBounds(s.id)?.collides(imageBounds)
    );
    editor.deleteShapes(maskShapes.map(s => s.id));

    setVariations([]);
    setPrompt('');
    toast.success("Imagem atualizada com a nova síntese.");
  };

  return (
    <div className="p-8 space-y-10 pb-32 animate-in fade-in slide-in-from-right-4 h-full overflow-y-auto custom-scrollbar">
        {/* Generative Fill Tool */}
        <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500 rounded-xl">
                    <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Generative Fill</span>
            </div>
            
            <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Descreva o que deseja adicionar ou alterar na área pintada..."
                className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-[12px] text-zinc-200 outline-none focus:border-indigo-500/40 transition-all resize-none placeholder:text-zinc-700"
            />

            <button 
                onClick={handleGenerativeFill}
                disabled={isProcessing || !prompt.trim() || !selection}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
            >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                Synthesize Variations
            </button>
        </div>

        {/* Variations Gallery */}
        <AnimatePresence>
            {variations.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6"
                >
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neural Variations</span>
                        <span className="text-[8px] mono text-zinc-600 uppercase">Pick one to commit</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {variations.map((v, i) => (
                            <button 
                                key={i}
                                onClick={() => setSelectedVariation(i)}
                                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedVariation === i ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={v} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={applyVariation}
                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                        >
                            <Check size={14} /> Commit Change
                        </button>
                        <button 
                            onClick={() => setVariations([])}
                            className="p-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl flex items-center justify-center"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-4 opacity-40">
            <div className="p-4 border border-white/5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center"><Wind size={18}/></div>
                <div>
                    <p className="text-[10px] font-black text-white uppercase">Background Removal</p>
                    <p className="text-[8px] mono text-zinc-600 uppercase">Transformers.js active</p>
                </div>
            </div>
            <div className="p-4 border border-white/5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center"><Maximize2 size={18}/></div>
                <div>
                    <p className="text-[10px] font-black text-white uppercase">Super Resolution</p>
                    <p className="text-[8px] mono text-zinc-600 uppercase">Wait for build v4.0</p>
                </div>
            </div>
        </div>
    </div>
  );
});
