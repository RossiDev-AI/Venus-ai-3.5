import React, { useState, useEffect } from 'react';
import { Editor, track } from 'tldraw';
import { Sliders, Sun, Contrast, Droplets, RotateCw, Camera, Target, Focus, Aperture, Wind, Sparkles, Scan, Zap } from 'lucide-react';
import { luminaEngine } from '../../../engines/lumina/core/LuminaEngine';
import { toast } from 'sonner';

const ControlSlider = ({ label, icon: Icon, value, min, max, step, onChange, color = "text-zinc-500" }: any) => (
    <div className="space-y-2 px-1">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Icon size={12} className={color} />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-[10px] mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {typeof value === 'number' ? value.toFixed(2) : String(value ?? '')}
            </span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={typeof value === 'number' ? value : (min+max)/2}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
        />
    </div>
);

export const NodeInspector = track(({ editor, selection }: { editor: Editor, selection: any }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lensActive, setLensActive] = useState(false);

  if (!selection) {
    return (
        <div className="h-full flex flex-col items-center justify-center opacity-20 p-12 text-center gap-4">
            <Sliders size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">Select a Neural Node</p>
        </div>
    );
  }

  const updateProp = (key: string, val: any) => {
    editor.updateShape({ id: selection.id, type: selection.type, props: { [key]: val } });
  };

  return (
    <div className="p-6 space-y-10 pb-32 animate-in fade-in slide-in-from-right-4 h-full overflow-y-auto custom-scrollbar">
        
        {/* Lente e Foco */}
        <div className="space-y-6 bg-amber-600/5 p-6 rounded-[2rem] border border-amber-500/20 shadow-xl">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <Camera size={18} className="text-amber-400" />
                    <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Neural Optics</span>
                </div>
            </div>
            <ControlSlider label="Aperture (f/stop)" icon={Focus} value={selection.props.aperture} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('aperture', v)} color="text-amber-500" />
            <ControlSlider label="Focus Distance" icon={Target} value={selection.props.focusDistance} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('focusDistance', v)} color="text-amber-500" />
        </div>

        {/* LuminaFX: Cinema Library */}
        <div className="space-y-6 bg-indigo-600/5 p-6 rounded-[2.5rem] border border-indigo-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <Zap size={18} className="text-indigo-400" />
                <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">LuminaFX Library</span>
            </div>

            <div className="space-y-8">
                <ControlSlider label="Chromatic Aberration" icon={Aperture} value={selection.props.chromatic} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('chromatic', v)} color="text-indigo-400" />
                <ControlSlider label="Analog Film Grain" icon={Wind} value={selection.props.grain} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('grain', v)} color="text-indigo-400" />
                <ControlSlider label="Optical Bloom" icon={Sparkles} value={selection.props.bloom} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('bloom', v)} color="text-indigo-400" />
                <ControlSlider label="Edge Vignette" icon={Scan} value={selection.props.vignette} min={0} max={1} step={0.01} onChange={(v:any) => updateProp('vignette', v)} color="text-indigo-400" />
                <ControlSlider label="Adaptive Sharpness" icon={Zap} value={selection.props.sharpness} min={0} max={2} step={0.05} onChange={(v:any) => updateProp('sharpness', v)} color="text-indigo-400" />
            </div>
        </div>

        {/* Primary Grading */}
        <div className="space-y-6">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4">Digital Grading</h3>
            <ControlSlider label="Exposure" icon={Sun} value={selection.props.brightness} min={0} max={2} step={0.01} onChange={(v:any) => updateProp('brightness', v)} />
            <ControlSlider label="Contrast" icon={Contrast} value={selection.props.contrast} min={0} max={2} step={0.01} onChange={(v:any) => updateProp('contrast', v)} />
            <ControlSlider label="Saturation" icon={Droplets} value={selection.props.saturation} min={0} max={2} step={0.01} onChange={(v:any) => updateProp('saturation', v)} />
            <ControlSlider label="White Balance" icon={RotateCw} value={selection.props.temperature} min={-100} max={100} step={1} onChange={(v:any) => updateProp('temperature', v)} />
        </div>
    </div>
  );
});