
import React, { useState } from 'react';
import { Editor, createShapeId, track } from 'tldraw';
import LuminaUploaderModal from './LuminaUploaderModal';
import { LuminaSidebar } from './LuminaSidebar';
import { LuminaSuperBar } from './LuminaSuperBar';
import { LuminaCanvasHUD } from './LuminaCanvasHUD';
import { LuminaCanvas } from './LuminaCanvas';
import { LuminaVectorShapeUtil } from './LuminaVectorShapeUtil';
import { VaultItem } from '../../types';
import { toast } from 'sonner';
import { MousePointer2, PenTool, Eraser, Sparkles, X, Layout, Type, Shapes } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

const LuminaInnerUI = track(({ onImportClick, isMobileSidebarOpen, setMobileSidebarOpen, onCreateText, onCreateVector }: { onImportClick: () => void, isMobileSidebarOpen: boolean, setMobileSidebarOpen: (v: boolean) => void, onCreateText: () => void, onCreateVector: () => void }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-[1000] flex flex-col overflow-hidden">
            <div className="h-16 w-full bg-[#0e0e11]/90 backdrop-blur-xl border-b border-white/10 flex-shrink-0 pointer-events-auto flex items-center shadow-2xl z-[1002]">
                <LuminaSuperBar onImportClick={onImportClick} />
                <button 
                    onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="md:hidden mr-4 p-2 text-white bg-white/10 rounded-lg border border-white/10 active:scale-95 transition-all"
                >
                    {isMobileSidebarOpen ? <X size={20} /> : <Layout size={20} />}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="hidden md:flex w-16 h-full bg-[#0e0e11]/80 backdrop-blur-md border-r border-white/5 flex-col items-center py-8 gap-6 pointer-events-auto shadow-xl z-[1001]">
                    <ToolbarItems onCreateText={onCreateText} onCreateVector={onCreateVector} />
                </div>

                <div className="flex-1 relative overflow-hidden">
                    <LuminaCanvasHUD />
                </div>

                <div className="hidden md:flex w-[420px] h-full bg-[#0c0c0e]/98 backdrop-blur-3xl border-l border-white/10 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] pointer-events-auto relative overflow-hidden flex-col z-[1001]">
                    <LuminaSidebar />
                </div>

                <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] pointer-events-auto">
                    <div className="flex items-center gap-4 bg-[#0e0e11]/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
                        <ToolbarItems isMobile onCreateText={onCreateText} onCreateVector={onCreateVector} />
                    </div>
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

const ToolbarItems = track(({ isMobile = false, onCreateText, onCreateVector }: { isMobile?: boolean, onCreateText: () => void, onCreateVector: () => void }) => (
    <>
        {[
            { id: 'select', icon: MousePointer2, label: 'Selection' },
            { id: 'draw', icon: PenTool, label: 'Neural Mask' },
            { id: 'vector', icon: Shapes, label: 'Vector Engine', action: onCreateVector },
            { id: 'text', icon: Type, label: 'Skia Typography', action: onCreateText },
            { id: 'eraser', icon: Eraser, label: 'Wipe' },
        ].map(t => (
            <button 
                key={t.id} 
                onClick={t.action}
                className={`p-3.5 rounded-2xl text-zinc-500 hover:text-white hover:bg-indigo-600/20 transition-all group relative ${isMobile ? 'p-2.5' : ''}`} title={t.label}><t.icon size={isMobile ? 18 : 20} /></button>
        ))}
        <div className={`flex flex-col gap-4 ${isMobile ? 'border-l border-white/10 pl-4 ml-2 flex-row' : 'mt-auto mb-6'}`}>
             <button className={`p-3.5 rounded-2xl text-indigo-500 hover:bg-indigo-500/10 transition-all group relative ${isMobile ? 'p-2.5' : ''}`}><Sparkles size={isMobile ? 18 : 20} /></button>
        </div>
    </>
));

const LuminaStudio: React.FC = () => {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
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
    toast.success("Industrial Buffer: High-Res Asset Injected 100%");
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
            />
        </LuminaCanvas>

        <LuminaUploaderModal 
            isOpen={isUploaderOpen} 
            onClose={() => setIsUploaderOpen(false)} 
            onUploadComplete={handleUploadComplete}
        />
      </div>
  );
};

export default LuminaStudio;
