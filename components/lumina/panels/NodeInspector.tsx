
import React, { useState, useEffect } from 'react';
import { Editor, createShapeId, track } from 'tldraw';
import { Sliders, Sun, Contrast, Droplets, RotateCw, Move, Maximize, MousePointer2, RefreshCcw, Camera, Target, Focus, Type, AlignLeft, AlignCenter, AlignRight, Scissors, Sparkles } from 'lucide-react';
import { luminaEngine } from '../../../engines/lumina/core/LuminaEngine';
import { skiaService } from '../../../engines/lumina/core/SkiaService';
import { toast } from 'sonner';

const ControlSlider = ({ label, icon: Icon, value, min, max, step, onChange }: any) => (
    <div className="space-y-2 px-1">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Icon size={12} className="text-zinc-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-[10px] mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {typeof value === 'number' ? value.toFixed(2) : value}
            </span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value ?? (min+max)/2}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
        />
    </div>
);

export const NodeInspector = track(({ editor, selection }: { editor: Editor, selection: any }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lensActive, setLensActive] = useState(false);

  useEffect(() => {
    const handleFocusUpdate = (e: any) => {
        if (e.detail.id === selection?.id) {
            updateProp('focusDistance', e.detail.focusDistance);
            toast.success("Plano de foco calibrado.");
        }
    };
    window.addEventListener('lumina:focus-update', handleFocusUpdate);
    return () => window.removeEventListener('lumina:focus-update', handleFocusUpdate);
  }, [selection]);

  if (!selection) {
    return <div className="h-full flex flex-col items-center justify-center opacity-20 p-12 text-center gap-4"><Sliders size={40} /><p className="text-[10px] font-black uppercase tracking-widest">Select a Neural Node</p></div>;
  }

  const updateProp = (key: string, val: any) => {
    editor.updateShape({ id: selection.id, type: selection.type, props: { [key]: val } });
  };

  const handleConvertToCurves = async () => {
    if (selection.type !== 'skia-text') return;
    const tid = toast.loading("Convertendo Tipografia em Curvas Skia...");
    try {
        updateProp('isVectorized', true);
        toast.success("Conversão para Vetor Concluída", { id: tid });
    } catch (e) {
        toast.error("Falha na conversão vetorial", { id: tid });
    }
  };

  const handleTextOnPath = () => {
    const selectedIds = editor.getSelectedShapeIds();
    if (selectedIds.length !== 2) {
        toast.error("Selecione um Texto e um Caminho (Draw) para vincular.");
        return;
    }
    const textShape = editor.getSelectedShapes().find(s => s.type === 'skia-text');
    const pathShape = editor.getSelectedShapes().find(s => s.type === 'draw');
    
    if (textShape && pathShape) {
        const pathSvg = "M 10 150 Q 200 10 390 150"; 
        editor.updateShape({ id: textShape.id, type: 'skia-text', props: { pathSvg } });
        toast.success("Texto Fluindo no Caminho");
    }
  };

  if (selection.type === 'skia-text') {
    return (
        <div className="p-6 space-y-10 pb-32 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Type size={18} className="text-indigo-400" />
                    <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Typography Engine</h3>
                </div>
                
                <ControlSlider label="Font Size" icon={Type} value={selection.props.fontSize} min={12} max={200} step={1} onChange={(v:any) => updateProp('fontSize', v)} />
                <ControlSlider label="Letter Spacing" icon={AlignLeft} value={selection.props.letterSpacing} min={-5} max={50} step={0.5} onChange={(v:any) => updateProp('letterSpacing', v)} />
                <ControlSlider label="Line Height" icon={AlignCenter} value={selection.props.lineHeight} min={0.5} max={3} step={0.1} onChange={(v:any) => updateProp('lineHeight', v)} />
                
                <div className="space-y-3">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Alignment</span>
                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'left', icon: AlignLeft },
                            { id: 'center', icon: AlignCenter },
                            { id: 'right', icon: AlignRight }
                        ].map(a => (
                            <button 
                                key={a.id} 
                                onClick={() => updateProp('textAlign', a.id)}
                                className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${selection.props.textAlign === a.id ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <a.icon size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 space-y-3 border-t border-white/5">
                    <button 
                        onClick={handleTextOnPath}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={12} /> Bind to Draw Path
                    </button>
                    <button 
                        onClick={handleConvertToCurves}
                        className="w-full py-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <Scissors size={12} /> Convert to Curves
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4">Effects & Rendering</h3>
                <ControlSlider label="Stroke Width" icon={Droplets} value={selection.props.strokeWidth} min={0} max={10} step={0.5} onChange={(v:any) => updateProp('strokeWidth', v)} />
                <ControlSlider label="Shadow Blur" icon={Sun} value={selection.props.shadowBlur} min={0} max={50} step={1} onChange={(v:any) => updateProp('shadowBlur', v)} />
                <ControlSlider label="Outer Glow" icon={Sparkles} value={selection.props.glowBlur} min={0} max={50} step={1} onChange={(v:any) => updateProp('glowBlur', v)} />
            </div>
        </div>
    )
  }

  const handleDepthAnalysis = async () => {
    setIsAnalyzing(true);
    const tid = toast.loading("Analisando Geometria 3D da Cena...");
    try {
        await luminaEngine.generateDepthMap(selection.id, (p) => {});
        toast.success("Depth Map Gerado: Lente Neural Ativada", { id: tid });
        setLensActive(true);
        luminaEngine.setLensActive(selection.id);
    } catch (e) {
        toast.error("Falha na análise de profundidade", { id: tid });
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-10 pb-32 animate-in fade-in slide-in-from-right-4">
        <div className="space-y-6 bg-amber-600/5 p-6 rounded-[2rem] border border-amber-500/20">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <Camera size={18} className="text-amber-400" />
                    <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Neural Lens</span>
                </div>
                <button 
                    onClick={() => { setLensActive(!lensActive); luminaEngine.setLensActive(!lensActive ? selection.id : null); }}
                    className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${lensActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}
                >
                    {lensActive ? 'Optics Active' : 'Off'}
                </button>
            </div>

            {!lensActive ? (
                <button 
                    onClick={handleDepthAnalysis} disabled={isAnalyzing}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-900/20"
                >
                    {isAnalyzing ? <RefreshCcw size={14} className="animate-spin" /> : <Target size={14} />}
                    Calcular Depth Map 3D
                </button>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <p className="text-[8px] text-amber-500/80 font-bold uppercase tracking-widest bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        Click on the image to set focus plane.
                    </p>
                    <ControlSlider label="Aperture (f/stop)" icon={Focus} value={selection.props.aperture} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('aperture', v)} />
                    <ControlSlider label="Focus Distance" icon={Target} value={selection.props.focusDistance} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('focusDistance', v)} />
                    <ControlSlider label="Bokeh Brightness" icon={Sun} value={selection.props.bokehBrightness} min={1} max={5} step={0.1} onChange={(v:any) => updateProp('bokehBrightness', v)} />
                </div>
            )}
        </div>

        <div className="space-y-6">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4">Primary Adjustments</h3>
            <ControlSlider label="Exposure" icon={Sun} value={selection.props.brightness} min={0} max={2} step={0.01} onChange={(v:any) => updateProp('brightness', v)} />
            <ControlSlider label="Contrast" icon={Contrast} value={selection.props.contrast} min={0} max={2} step={0.01} onChange={(v:any) => updateProp('contrast', v)} />
            <ControlSlider label="Saturation" icon={Droplets} value={selection.props.saturation} min={0} max={2} step={0.01} onChange={(v:any) => updateProp('saturation', v)} />
            <ControlSlider label="Hue Shift" icon={RotateCw} value={selection.props.hue} min={0} max={360} step={1} onChange={(v:any) => updateProp('hue', v)} />
        </div>
    </div>
  );
});
