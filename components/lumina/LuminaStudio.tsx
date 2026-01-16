
import React, { useState } from 'react';
import { Editor, createShapeId, track } from 'tldraw';
import LuminaUploaderModal from './LuminaUploaderModal';
import { LuminaSidebar } from './LuminaSidebar';
import { LuminaSuperBar } from './LuminaSuperBar';
import { LuminaCanvasHUD } from './LuminaCanvasHUD';
import { LuminaCanvas } from './LuminaCanvas';
import { warmupManager } from '../../engines/lumina/core/WarmupManager';
import { Capabilities } from '../../utils/Capabilities';
import { VaultItem } from '../../types';
import { toast } from 'sonner';
import { MousePointer2, PenTool, Eraser, Sparkles, X, Layout, Type, Shapes, AlertCircle, Lock, ShieldAlert, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

const CompatibilityModal = ({ isOpen, onClose, feature }: { isOpen: boolean, onClose: () => void, feature: string }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="max-w-md w-full bg-[#0e0e11] border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-3xl text-center"
                >
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full mx-auto flex items-center justify-center text-amber-500">
                        <ShieldAlert size={40} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Acesso Restrito: {feature}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed uppercase">
                            Para utilizar ferramentas de {feature} em alta performance, o navegador exige isolamento de memória (COOP/COEP).
                        </p>
                    </div>
                    
                    <div className="bg-black/40 rounded-2xl p-6 text-left space-y-4 border border-white/5">
                        <div className="flex items-start gap-4">
                            <Chrome size={18} className="text-indigo-400 shrink-0" />
                            <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">
                                Recomendado: Utilize **Google Chrome** ou **Microsoft Edge** v120+.
                            </p>
                        </div>
                        {!Capabilities.isIsolated && (
                            <div className="flex items-start gap-4">
                                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">
                                    Firefox detectado: Verifique se `privacy.resistFingerprinting` está desativado em `about:config`.
                                </p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all"
                    >
                        Entendido
                    </button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const LuminaInnerUI = track(({ onImportClick, isMobileSidebarOpen, setMobileSidebarOpen, onCreateText, onCreateVector, onShowCompat }: { onImportClick: () => void, isMobileSidebarOpen: boolean, setMobileSidebarOpen: (v: boolean) => void, onCreateText: () => void, onCreateVector: () => void, onShowCompat: (f: string) => void }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-[1000] flex flex-col overflow-hidden">
            <div className="h-16 w-full bg-[#0e0e11]/90 backdrop-blur-xl border-b border-white/10 flex-shrink-0 pointer-events-auto flex items-center shadow-2xl z-[1002]">
                <LuminaSuperBar onImportClick={onImportClick} />
                
                {/* Performance Badge */}
                <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-black/40 border border-white/5 rounded-full mr-4">
                   <div className={`w-1.5 h-1.5 rounded-full ${Capabilities.canUseMultithreading ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                   <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">{Capabilities.engineType}</span>
                </div>

                <button 
                    onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="md:hidden mr-4 p-2 text-white bg-white/10 rounded-lg border border-white/10 active:scale-95 transition-all"
                >
                    {isMobileSidebarOpen ? <X size={20} /> : <Layout size={20} />}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="hidden md:flex w-16 h-full bg-[#0e0e11]/80 backdrop-blur-md border-r border-white/5 flex-col items-center py-8 gap-6 pointer-events-auto shadow-xl z-[1001]">
                    <ToolbarItems onCreateText={onCreateText} onCreateVector={onCreateVector} onShowCompat={onShowCompat} />
                </div>

                <div className="flex-1 relative overflow-hidden">
                    <LuminaCanvasHUD />
                </div>

                <div className="hidden md:flex w-[420px] h-full bg-[#0c0c0e]/98 backdrop-blur-3xl border-l border-white/10 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] pointer-events-auto relative overflow-hidden flex-col z-[1001]">
                    <LuminaSidebar />
                </div>

                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="md:hidden absolute inset-0 z-[1005] bg-[#0c0c0e] pointer-events-auto flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0e0e11]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Station Controls</span>
                                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <LuminaSidebar />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

const ToolbarItems = track(({ isMobile = false, onCreateText, onCreateVector, onShowCompat }: { isMobile?: boolean, onCreateText: () => void, onCreateVector: () => void, onShowCompat: (f: string) => void }) => {
    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Selection' },
        { id: 'draw', icon: PenTool, label: 'Neural Mask', restricted: !Capabilities.canUseMultithreading, feature: 'IA Generativa' },
        { id: 'vector', icon: Shapes, label: 'Vector Engine', action: onCreateVector },
        { id: 'text', icon: Type, label: 'Skia Typography', action: onCreateText },
        { id: 'eraser', icon: Eraser, label: 'Wipe' },
    ];

    return (
        <>
            {tools.map(t => (
                <button 
                    key={t.id} 
                    onClick={t.restricted ? () => onShowCompat(t.feature!) : t.action}
                    className={`p-3.5 rounded-2xl transition-all group relative ${isMobile ? 'p-2.5' : ''} ${t.restricted ? 'text-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-indigo-600/20'}`} 
                    title={t.label}
                >
                    {t.restricted && (
                        <div className="absolute top-0 right-0 p-1 bg-amber-500 text-black rounded-full shadow-lg">
                            <Lock size={8} strokeWidth={4} />
                        </div>
                    )}
                    <t.icon size={isMobile ? 18 : 20} />
                </button>
            ))}
            <div className={`flex flex-col gap-4 ${isMobile ? 'border-l border-white/10 pl-4 ml-2 flex-row' : 'mt-auto mb-6'}`}>
                <button 
                    onClick={!Capabilities.canUseMultithreading ? () => onShowCompat('IA Avançada') : undefined}
                    className={`p-3.5 rounded-2xl transition-all group relative ${isMobile ? 'p-2.5' : ''} ${!Capabilities.canUseMultithreading ? 'text-zinc-800' : 'text-indigo-500 hover:bg-indigo-500/10'}`}
                >
                    {!Capabilities.canUseMultithreading && <Lock size={10} className="absolute top-1 right-1 text-amber-500" />}
                    <Sparkles size={isMobile ? 18 : 20} />
                </button>
            </div>
        </>
    );
});

const LuminaStudio: React.FC = () => {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [compatModal, setCompatModal] = useState<{ open: boolean, feature: string }>({ open: false, feature: '' });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleUploadComplete = (node: VaultItem) => {
    if (!editor) return;
    const viewport = editor.getViewportPageBounds();
    editor.createShape({
        id: createShapeId(),
        type: 'lumina-image',
        x: viewport.center.x - 400,
        y: viewport.center.y - 250,
        props: {
            url: node.imageUrl,
            vaultId: node.shortId,
            w: 800, h: 500,
            brightness: 1, contrast: 1, saturation: 1, 
            opacity: 1, blendMode: 'normal', isScanning: false,
            twirl: 0, bulge: 0, rgbSplit: 0, vignette: 0, sharpness: 0,
            temperature: 0, tint: 0, grain: 0, blur: 0, bloom: 0, chromatic: 0, exposure: 0,
            hue: 0, vibrance: 1, gamma: 1, maskColor: '#4f46e5'
        }
    });
    toast.success("Ativo Injetado via Buffer Industrial");
  };

  const handleCreateText = () => {
    if (!editor) return;
    const viewport = editor.getViewportPageBounds();
    editor.createShape({
        id: createShapeId(),
        type: 'skia-text',
        x: viewport.center.x - 200,
        y: viewport.center.y - 100,
        props: {
            w: 400, h: 100,
            text: 'NEW_CINEMA_LINE',
            fontFamily: 'Inter',
            fontSize: 48,
            color: '#ffffff'
        }
    });
  };

  const handleCreateVector = () => {
    if (!editor) return;
    const viewport = editor.getViewportPageBounds();
    editor.createShape({
        id: createShapeId(),
        type: 'lumina-vector',
        x: viewport.center.x - 200,
        y: viewport.center.y - 200,
        props: {
            w: 400, h: 400,
            pathData: 'M 100 100 L 300 100 L 300 300 L 100 300 Z',
            fillColor: '#4f46e5'
        }
    });
  };

  return (
      <div className="w-full h-full bg-[#050505] flex overflow-hidden relative">
        <LuminaCanvas 
            onMount={setEditor} 
            onImportClick={() => setIsUploaderOpen(true)} 
        >
            <LuminaInnerUI 
                onImportClick={() => setIsUploaderOpen(true)} 
                isMobileSidebarOpen={isMobileSidebarOpen}
                setMobileSidebarOpen={setMobileSidebarOpen}
                onCreateText={handleCreateText}
                onCreateVector={handleCreateVector}
                onShowCompat={(f) => setCompatModal({ open: true, feature: f })}
            />
        </LuminaCanvas>

        <LuminaUploaderModal 
            isOpen={isUploaderOpen} 
            onClose={() => setIsUploaderOpen(false)} 
            onUploadComplete={handleUploadComplete}
        />

        <CompatibilityModal 
            isOpen={compatModal.open} 
            onClose={() => setCompatModal({ ...compatModal, open: false })}
            feature={compatModal.feature}
        />
      </div>
  );
};

export default LuminaStudio;
