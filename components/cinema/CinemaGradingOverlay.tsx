import React, { useEffect, useRef } from 'react';
import { Pane } from 'tweakpane';
import { LatentGrading } from '../../types';
import { Palette, EyeOff, FileBox } from 'lucide-react';
import * as PIXI from 'pixi.js';
import { LuminaShaderEngine } from '../lumina/LuminaShaderEngine';

interface CinemaGradingOverlayProps {
  grading: LatentGrading;
  onChange: (updates: Partial<LatentGrading>) => void;
  minimalMode: boolean;
  onToggleMinimal: (v: boolean) => void;
}

const CinemaGradingOverlay: React.FC<CinemaGradingOverlayProps> = ({ grading, onChange, minimalMode, onToggleMinimal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<Pane | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const pane = new Pane({
      container: containerRef.current,
      title: 'Grade de Diretor',
      expanded: true,
    });
    paneRef.current = pane;

    const sys = pane.addFolder({ title: 'Sistema' });
    sys.addBinding({ minimalMode }, 'minimalMode', { label: 'Modo Minimalista' }).on('change', (v) => onToggleMinimal(v.value));

    const focus = pane.addFolder({ title: 'Focus & Bokeh' });
    focus.addBinding(grading as any, 'bokeh', { label: 'Bokeh Strength', min: 0, max: 1 }).on('change', (v) => onChange({ bokeh: v.value } as any));
    focus.addBinding(grading, 'face_radius', { label: 'Focal Radius', min: 0.05, max: 0.8 }).on('change', (v) => onChange({ face_radius: v.value }));

    const fx = pane.addFolder({ title: 'Cinematic Shaders' });
    fx.addBinding(grading, 'bloom', { label: 'Bloom Intensity', min: 0, max: 1 }).on('change', (v) => onChange({ bloom: v.value }));
    fx.addBinding(grading, 'bloom_threshold', { label: 'Bloom Threshold', min: 0, max: 1 }).on('change', (v) => onChange({ bloom_threshold: v.value }));
    
    const grain = fx.addFolder({ title: 'Dynamic Grain' });
    grain.addBinding(grading, 'grain', { label: 'Amount', min: 0, max: 1 }).on('change', (v) => onChange({ grain: v.value }));
    grain.addBinding(grading, 'grain_shadows', { label: 'Shadow Density', min: 0, max: 2 }).on('change', (v) => onChange({ grain_shadows: v.value }));
    grain.addBinding(grading, 'grain_highlights', { label: 'Highlight Density', min: 0, max: 2 }).on('change', (v) => onChange({ grain_highlights: v.value }));

    const primary = pane.addFolder({ title: 'Correção Primária' });
    primary.addBinding(grading, 'exposure', { label: 'Exposição', min: -3, max: 3 }).on('change', (v) => onChange({ exposure: v.value }));
    primary.addBinding(grading, 'contrast', { label: 'Contraste', min: 0.5, max: 1.5 }).on('change', (v) => onChange({ contrast: v.value }));
    primary.addBinding(grading, 'saturation', { label: 'Saturação', min: 0, max: 2 }).on('change', (v) => onChange({ saturation: v.value }));
    
    const wb = pane.addFolder({ title: 'Balanço de Branco' });
    wb.addBinding(grading, 'temperature', { label: 'Temperatura', min: -100, max: 100 }).on('change', (v) => onChange({ temperature: v.value }));
    wb.addBinding(grading, 'tint', { label: 'Tint', min: -100, max: 100 }).on('change', (v) => onChange({ tint: v.value }));

    const lgg = pane.addFolder({ title: 'Lift / Gamma / Gain' });
    const lift = lgg.addFolder({ title: 'Lift (Shadows)', expanded: false });
    lift.addBinding(grading, 'lift_r', { label: 'R', min: -0.2, max: 0.2 }).on('change', (v) => onChange({ lift_r: v.value }));
    lift.addBinding(grading, 'lift_g', { label: 'G', min: -0.2, max: 0.2 }).on('change', (v) => onChange({ lift_g: v.value }));
    lift.addBinding(grading, 'lift_b', { label: 'B', min: -0.2, max: 0.2 }).on('change', (v) => onChange({ lift_b: v.value }));

    const gamma = lgg.addFolder({ title: 'Gamma (Midtones)', expanded: false });
    gamma.addBinding(grading, 'gamma_r', { label: 'R', min: 0.5, max: 2 }).on('change', (v) => onChange({ gamma_r: v.value }));
    gamma.addBinding(grading, 'gamma_g', { label: 'G', min: 0.5, max: 2 }).on('change', (v) => onChange({ gamma_g: v.value }));
    gamma.addBinding(grading, 'gamma_b', { label: 'B', min: 0.5, max: 2 }).on('change', (v) => onChange({ gamma_b: v.value }));

    const gain = lgg.addFolder({ title: 'Gain (Highlights)', expanded: false });
    gain.addBinding(grading, 'gain_r', { label: 'R', min: 0.5, max: 1.5 }).on('change', (v) => onChange({ gain_r: v.value }));
    gain.addBinding(grading, 'gain_g', { label: 'G', min: 0.5, max: 1.5 }).on('change', (v) => onChange({ gain_g: v.value }));
    gain.addBinding(grading, 'gain_b', { label: 'B', min: 0.5, max: 1.5 }).on('change', (v) => onChange({ gain_b: v.value }));

    return () => { pane.dispose(); };
  }, []);

  useEffect(() => {
    if (paneRef.current) paneRef.current.refresh();
  }, [grading, minimalMode]);

  return (
    <div className={`absolute top-24 right-6 pointer-events-auto w-64 flex flex-col gap-2 transition-opacity duration-500 ${minimalMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600/20 rounded-t-xl border-x border-t border-white/10">
            <Palette size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Director Scopes</span>
        </div>
        <div ref={containerRef} className="rounded-b-xl overflow-hidden shadow-2xl border border-white/10" />
    </div>
  );
};

export default CinemaGradingOverlay;