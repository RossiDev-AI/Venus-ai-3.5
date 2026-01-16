
import React, { useEffect, useState, useRef } from 'react';
import { useLuminaAI } from '../../hooks/useLuminaAI';
import { useEditor } from 'tldraw';
import { Activity } from 'lucide-react';

const LuminaScopesOverlay: React.FC = () => {
  const editor = useEditor();
  const { analyzeSignal } = useLuminaAI();
  const [histogram, setHistogram] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Debounce the analysis to avoid freezing UI during rapid selection changes
    let timeout: any;
    const update = async () => {
      const selected = editor.getSelectedShapes();
      if (selected.length === 1 && (selected[0] as any).type === 'lumina-image' && (selected[0] as any).props.url) {
          try {
            const res = await analyzeSignal((selected[0] as any).props.url);
            if (res) setHistogram(res);
          } catch (e) {
            console.warn("Scope analysis skipped");
          }
      } else {
          setHistogram(null);
      }
    };

    const unsub = editor.store.listen(() => {
        clearTimeout(timeout);
        timeout = setTimeout(update, 500);
    }, { scope: 'document' });
    
    return () => { unsub(); clearTimeout(timeout); };
  }, [editor]);

  useEffect(() => {
    if (!histogram || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const w = 200;
    const h = 80;
    ctx.clearRect(0, 0, w, h);
    
    const drawChannel = (data: number[], color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        const max = Math.max(...data);
        const scale = max > 0 ? h / max : 0;
        
        ctx.moveTo(0, h);
        data.forEach((val, x) => {
            const barH = val * scale;
            const xPos = (x / 255) * w;
            ctx.lineTo(xPos, h - barH);
        });
        ctx.stroke();
    };

    ctx.globalCompositeOperation = 'screen';
    drawChannel(histogram.r, '#ef4444');
    drawChannel(histogram.g, '#22c55e');
    drawChannel(histogram.b, '#3b82f6');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.5;
    drawChannel(histogram.l, '#ffffff');
    ctx.globalAlpha = 1;

  }, [histogram]);

  if (!histogram) return null;

  return (
    <div className="absolute right-4 bottom-32 w-60 bg-black/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 z-[1001] shadow-2xl pointer-events-none animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-2 mb-3">
            <Activity size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Signal Scopes (RGB Parade)</span>
        </div>
        <canvas ref={canvasRef} width={200} height={80} className="w-full h-20 opacity-90" />
        <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
            <span className="text-[7px] font-black text-zinc-600 uppercase">Shadows (0)</span>
            <span className="text-[7px] font-black text-zinc-600 uppercase">Highlights (255)</span>
        </div>
    </div>
  );
};

export default LuminaScopesOverlay;
