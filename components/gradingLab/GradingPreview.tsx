
import React, { useRef, useEffect } from 'react';
import { VaultItem, LatentGrading } from '../../types';
import { applyGrading } from '../../gradingProcessor';

interface GradingPreviewProps {
  selectedNode: VaultItem | null;
  grading: LatentGrading;
  sliderPosition: number;
  onSliderMove: (e: React.MouseEvent | React.TouchEvent) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUploadClick?: () => void;
  onOpenVault?: () => void;
}

const GradingPreview: React.FC<GradingPreviewProps> = ({
  selectedNode, grading, sliderPosition, onSliderMove, containerRef, onUploadClick, onOpenVault
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!selectedNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // We use a temporary image to ensure we always have the raw source
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedNode.originalImageUrl || selectedNode.imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Execute the shared grading kernel
      applyGrading(canvas, img, grading);
      
      // Apply Final CSS Polish (fast post-process filters) if any remain outside the kernel
      // Note: Most logic is now in the kernel, but CSS filters can add a final layer of cheap effects
      canvas.style.filter = `
        sepia(${grading.sepia || 0})
        grayscale(${grading.grayscale || 0})
        hue-rotate(${grading.hueRotate || 0}deg)
        invert(${grading.invert || 0})
        blur(${grading.blur || 0}px)
      `;
    };
  }, [grading, selectedNode]);

  if (!selectedNode) {
    return (
      <div className="flex-1 min-h-[60vh] md:min-h-[75vh] bg-[#020202] flex flex-col items-center justify-center border-b border-white/5 space-y-12 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
        <div className="w-40 h-40 rounded-[4rem] bg-zinc-900 flex items-center justify-center border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600/10 animate-pulse" />
            <svg className="w-16 h-16 text-zinc-700 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" strokeWidth={0.5}/></svg>
        </div>
        <div className="text-center space-y-6 max-w-xl relative z-10">
            <h3 className="text-3xl font-black uppercase tracking-[0.8em] text-white">Signal Master</h3>
            <p className="text-[11px] text-zinc-500 uppercase font-bold leading-relaxed tracking-widest px-10">Industrial Color Engineering. Inject a node from the vault or raw buffer to begin modulation.</p>
            <div className="flex gap-4 justify-center pt-8">
               <button onClick={onUploadClick} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl">Import RAW</button>
               <button onClick={onOpenVault} className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Vault Archive</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[60vh] md:min-h-[75vh] bg-[#030303] flex flex-col items-center justify-center relative p-6 md:p-12 border-b border-white/5 overflow-hidden">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div 
          ref={containerRef}
          className="relative group max-w-full max-h-full cursor-ew-resize select-none overflow-hidden rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/5 bg-black"
          onMouseMove={(e) => e.buttons === 1 && onSliderMove(e)}
          onTouchMove={(e) => onSliderMove(e)}
        >
          <img src={selectedNode.imageUrl} className="max-w-full max-h-[55vh] md:max-h-[78vh] w-auto h-auto block opacity-0 pointer-events-none" alt="Ref" />
          
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
          />

          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
             <div className="absolute inset-0 bg-[#030303]">
                <img 
                    src={selectedNode.originalImageUrl || selectedNode.imageUrl} 
                    className="w-full h-full object-contain opacity-100" 
                    alt="Original"
                />
                <div className="absolute top-10 left-10 px-4 py-2 bg-black/60 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                    RAW SIGNAL
                </div>
             </div>
          </div>

          <div className="absolute inset-y-0 w-[1px] bg-white/50 backdrop-blur-3xl z-50 pointer-events-none shadow-[0_0_30px_rgba(255,255,255,0.8)]" style={{ left: `${sliderPosition}%` }}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl">
                <div className="flex gap-1.5"><div className="w-0.5 h-3 bg-white/20 rounded-full"/><div className="w-0.5 h-6 bg-white/80 rounded-full"/><div className="w-0.5 h-3 bg-white/20 rounded-full"/></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPreview;
