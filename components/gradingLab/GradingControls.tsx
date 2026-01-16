import React from 'react';
import { LatentGrading } from '../../types';

interface GradingControlsProps {
  activeCategory: string;
  grading: LatentGrading;
  updateParam: (key: keyof LatentGrading, val: any) => void;
  applyPreset: (preset: any) => void;
  filmStocks: any[];
  customLuts: any[];
  handleSaveLut: () => void;
  handleRemoveLut: (name: string) => void;
  newLutName: string;
  setNewLutName: (val: string) => void;
  controls?: any[];
}

const GradingControls: React.FC<GradingControlsProps> = ({
  activeCategory, grading, updateParam, applyPreset, filmStocks, customLuts, handleSaveLut, handleRemoveLut, newLutName, setNewLutName, controls
}) => {
  const renderSlider = (key: keyof LatentGrading | string, label: string, min: number, max: number, step: number = 0.01) => {
    const rawVal = (grading as any)[key];
    const displayVal = typeof rawVal === 'number' ? rawVal.toFixed(3) : (typeof rawVal === 'string' ? rawVal : '0');

    return (
      <div key={key} className="space-y-3 group/item">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover/item:text-indigo-400 transition-colors">{label}</span>
          <span className="text-[11px] mono text-white font-black bg-white/5 px-3 py-0.5 rounded border border-white/5">
            {displayVal}
          </span>
        </div>
        <div className="relative h-8 flex items-center px-1">
            <div className="absolute inset-x-1 h-0.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                {min < 0 && max > 0 && (
                   <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-white/20 z-0" />
                )}
                <div 
                  className="h-full bg-indigo-500 transition-all opacity-40 shadow-[0_0_10px_rgba(99,102,241,0.5)] relative z-10" 
                  style={{ 
                      left: min < 0 ? '0%' : '0',
                      width: `${Math.min(100, Math.max(0, (( (Number(rawVal) || 0) - min) / (max - min)) * 100))}%` 
                  }} 
                />
            </div>
            <input 
              type="range" min={min} max={max} step={step} value={Number(rawVal) || 0} 
              onChange={(e) => updateParam(key as keyof LatentGrading, parseFloat(e.target.value))} 
              className="w-full h-full bg-transparent appearance-none accent-white cursor-pointer relative z-20" 
            />
        </div>
      </div>
    );
  };

  const getCategoryContent = () => {
    switch(activeCategory) {
      case 'MASTER': return [
        <div key="basic_exp" className="p-3 bg-zinc-900/50 rounded-xl mb-4 border border-white/5"><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Base Exposure (15 Params)</span></div>,
        renderSlider('exposure', 'Exposure EV', -3, 3, 0.1),
        renderSlider('contrast', 'Contrast', 0, 3, 0.01),
        renderSlider('pivot', 'Contrast Pivot', 0, 1, 0.01),
        renderSlider('brightness', 'Brightness', 0, 2, 0.01),
        renderSlider('offset', 'Black Offset', -0.2, 0.2, 0.001),
        renderSlider('gamma', 'Gamma Power', 0.1, 3, 0.01),
        
        <div key="sat_vib" className="p-3 bg-zinc-900/50 rounded-xl mb-4 mt-6 border border-white/5"><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Color Science</span></div>,
        renderSlider('saturation', 'Global Saturation', 0, 3, 0.01),
        renderSlider('vibrance', 'Vibrance (Smart)', 0, 3, 0.01),
        renderSlider('hueRotate', 'Hue Rotation', -180, 180, 1),
        
        <div key="wb" className="p-3 bg-zinc-900/50 rounded-xl mb-4 mt-6 border border-white/5"><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">White Balance</span></div>,
        renderSlider('temperature', 'Temperature (K)', -100, 100, 1),
        renderSlider('tint', 'Tint (M/G)', -100, 100, 1),
      ];
      
      case 'LGG': return [
         <div key="lgg_r" className="space-y-4 mb-6 pb-6 border-b border-white/5">
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-900/20 px-2 py-1 rounded">Red Channel Wheels</span>
            {renderSlider('lift_r', 'Red Lift (Shadows)', -0.5, 0.5, 0.01)}
            {renderSlider('gamma_r', 'Red Gamma (Midtones)', 0.1, 3, 0.01)}
            {renderSlider('gain_r', 'Red Gain (Highlights)', 0.1, 3, 0.01)}
            {renderSlider('offset_r', 'Red Offset', -0.2, 0.2, 0.001)}
         </div>,
         <div key="lgg_g" className="space-y-4 mb-6 pb-6 border-b border-white/5">
            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest bg-green-900/20 px-2 py-1 rounded">Green Channel Wheels</span>
            {renderSlider('lift_g', 'Green Lift', -0.5, 0.5, 0.01)}
            {renderSlider('gamma_g', 'Green Gamma', 0.1, 3, 0.01)}
            {renderSlider('gain_g', 'Green Gain', 0.1, 3, 0.01)}
            {renderSlider('offset_g', 'Green Offset', -0.2, 0.2, 0.001)}
         </div>,
         <div key="lgg_b" className="space-y-4">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-900/20 px-2 py-1 rounded">Blue Channel Wheels</span>
            {renderSlider('lift_b', 'Blue Lift', -0.5, 0.5, 0.01)}
            {renderSlider('gamma_b', 'Blue Gamma', 0.1, 3, 0.01)}
            {renderSlider('gain_b', 'Blue Gain', 0.1, 3, 0.01)}
            {renderSlider('offset_b', 'Blue Offset', -0.2, 0.2, 0.001)}
         </div>
      ];

      case 'MIXER': return [
        <div key="mixer_header" className="p-3 bg-cyan-900/10 border border-cyan-500/20 rounded-xl mb-6">
            <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest block">RGB Channel Matrix (Signal Processing)</span>
        </div>,
        
        <div key="mix_red" className="mb-8 space-y-4">
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"/> <span className="text-[8px] font-bold text-red-400 uppercase">Red Output Channel</span></div>
           {renderSlider('mix_red_red', 'Red -> Red', -2, 2, 0.05)}
           {renderSlider('mix_red_green', 'Green -> Red', -2, 2, 0.05)}
           {renderSlider('mix_red_blue', 'Blue -> Red', -2, 2, 0.05)}
        </div>,

        <div key="mix_green" className="mb-8 space-y-4">
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"/> <span className="text-[8px] font-bold text-green-400 uppercase">Green Output Channel</span></div>
           {renderSlider('mix_green_red', 'Red -> Green', -2, 2, 0.05)}
           {renderSlider('mix_green_green', 'Green -> Green', -2, 2, 0.05)}
           {renderSlider('mix_green_blue', 'Blue -> Green', -2, 2, 0.05)}
        </div>,

        <div key="mix_blue" className="space-y-4">
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"/> <span className="text-[8px] font-bold text-blue-400 uppercase">Blue Output Channel</span></div>
           {renderSlider('mix_blue_red', 'Red -> Blue', -2, 2, 0.05)}
           {renderSlider('mix_blue_green', 'Green -> Blue', -2, 2, 0.05)}
           {renderSlider('mix_blue_blue', 'Blue -> Blue', -2, 2, 0.05)}
        </div>
      ];

      case 'HSL': return [
        <div key="hsl_header" className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-xl mb-6">
            <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest block">Vector Scope Saturation (8-Axis)</span>
        </div>,
        
        <div key="hsl_grid" className="grid grid-cols-2 gap-x-6 gap-y-4">
            <span className="col-span-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Primary Hue Shifts</span>
            {renderSlider('sat_red', 'Red Sat', -1, 2, 0.05)}
            {renderSlider('sat_orange', 'Orange Sat', -1, 2, 0.05)}
            {renderSlider('sat_yellow', 'Yellow Sat', -1, 2, 0.05)}
            {renderSlider('sat_green', 'Green Sat', -1, 2, 0.05)}
            {renderSlider('sat_cyan', 'Cyan Sat', -1, 2, 0.05)}
            {renderSlider('sat_blue', 'Blue Sat', -1, 2, 0.05)}
            {renderSlider('sat_purple', 'Purple Sat', -1, 2, 0.05)}
            {renderSlider('sat_magenta', 'Magenta Sat', -1, 2, 0.05)}
        </div>,

        <div key="split_toning" className="mt-8 pt-8 border-t border-white/5">
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block mb-4">3-Way Split Toning</span>
            {renderSlider('split_shadow_hue', 'Shadow Hue', 0, 360, 1)}
            {renderSlider('split_shadow_sat', 'Shadow Sat', 0, 2, 0.01)}
            
            <div className="h-4" />
            {renderSlider('split_mid_hue', 'Midtone Hue', 0, 360, 1)}
            {renderSlider('split_mid_sat', 'Midtone Sat', 0, 2, 0.01)}

            <div className="h-4" />
            {renderSlider('split_highlight_hue', 'Highlight Hue', 0, 360, 1)}
            {renderSlider('split_highlight_sat', 'Highlight Sat', 0, 2, 0.01)}
            
            <div className="h-4" />
            {renderSlider('split_balance', 'Split Balance', -1, 1, 0.01)}
        </div>
      ];

      case 'PHYSICS': return [
        <div key="optics_header" className="p-3 bg-indigo-900/20 rounded-xl mb-4"><span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Lens & Geometry Engine</span></div>,
        
        renderSlider('lens_distortion', 'Inflate / Deflate (Bulge)', -1, 1, 0.01),
        renderSlider('anamorphic_squeeze', 'Stretch X (Achatar X)', 0.5, 2.0, 0.01),
        renderSlider('geometry_y', 'Stretch Y (Achatar Y)', 0.5, 2.0, 0.01),
        
        <div key="perspective" className="mt-6 mb-4 border-t border-white/5 pt-4">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Virtual Camera Shift</span>
            {renderSlider('perspective_x', 'Tilt X', -1, 1, 0.01)}
            {renderSlider('perspective_y', 'Tilt Y', -1, 1, 0.01)}
            {renderSlider('pan_x', 'Pan X', -0.5, 0.5, 0.01)}
            {renderSlider('pan_y', 'Pan Y', -0.5, 0.5, 0.01)}
            {renderSlider('rotate', 'Roll', -45, 45, 0.1)}
            {renderSlider('crop_zoom', 'Sensor Crop', 0, 1, 0.01)}
        </div>,
        
        <div key="lens_fx" className="p-3 bg-indigo-900/20 rounded-xl mb-4 mt-6"><span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Optical Phenomena</span></div>,
        renderSlider('chromatic_aberration', 'Lateral Dispersion', 0, 2, 0.01),
        renderSlider('diffusion', 'ProMist Diffusion', 0, 1, 0.01),
        renderSlider('bloom', 'Glow Strength', 0, 1, 0.01),
        renderSlider('bloom_radius', 'Glow Radius', 0, 2, 0.01),
        renderSlider('halation', 'Film Halation (Red)', 0, 1, 0.01),
        renderSlider('halation_radius', 'Halation Spread', 0, 5, 0.1),
        
        <div key="vignette" className="mt-6 mb-4 border-t border-white/5 pt-4">
             <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Vignette Control</span>
             {renderSlider('vignette', 'Amount', 0, 1, 0.01)}
             {renderSlider('vignette_roundness', 'Roundness (-1 sq, 1 cir)', -1, 1, 0.01)}
             {renderSlider('vignette_feather', 'Feather', 0, 2, 0.01)}
        </div>
      ];

      case 'FILM': return [
        <div key="texture_header" className="p-3 bg-zinc-800 rounded-xl mb-4"><span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Film Emulsion & Texture</span></div>,
        renderSlider('grain', 'Grain Amount', 0, 1, 0.01),
        renderSlider('grain_size', 'Grain Size', 0.5, 3, 0.1),
        renderSlider('grain_roughness', 'Roughness', 0, 1, 0.01),
        renderSlider('grain_color', 'Color Noise', 0, 1, 0.01),
        
        <div key="detail_header" className="p-3 bg-zinc-800 rounded-xl mb-4 mt-6"><span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Spatial Detail</span></div>,
        renderSlider('sharpness', 'Sharpness', 0, 2, 0.01),
        renderSlider('structure', 'Structure', 0, 2, 0.01),
        renderSlider('clarity', 'Clarity (Midtone)', 0, 2, 0.01),
        renderSlider('dehaze', 'Dehaze', -1, 1, 0.01),
        renderSlider('denoise', 'Denoise (Luma)', 0, 1, 0.01),
        renderSlider('blur', 'Lens Blur', 0, 10, 0.1),
      ];

      case 'FX': return [
        <div key="selective_header" className="p-3 bg-red-900/20 border border-red-500/20 rounded-xl mb-6">
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Selective Color (Sin City Mode)</span>
        </div>,
        renderSlider('selective_hue', 'Target Hue (0=Red, 240=Blue)', 0, 360, 1),
        renderSlider('selective_threshold', 'Hue Threshold', 0, 100, 1),
        renderSlider('selective_mix', 'Desaturate Others', 0, 1, 0.01),
        renderSlider('selective_target_sat', 'Boost Target', 0, 1, 0.01),

        <div key="beauty_header" className="p-3 bg-pink-900/20 border border-pink-500/20 rounded-xl mb-6 mt-8">
            <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block">Portrait / Beauty</span>
        </div>,
        renderSlider('skin_smooth', 'Skin Smoothing', 0, 1, 0.01),
        renderSlider('face_warp', 'Face Slim (Pincushion)', -1, 1, 0.01),
        renderSlider('eye_clarity', 'Eye Clarity', 0, 1, 0.01),
        renderSlider('teeth_whitening', 'Teeth Whitening', 0, 1, 0.01),
        renderSlider('feature_pop', 'Feature Pop', 0, 1, 0.01),
      ];

      case 'LUT': return (
        <div className="space-y-12 pb-24">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Save Global Profile</label>
              <div className="flex gap-3 bg-black/60 p-5 rounded-3xl border border-white/5 group">
                  <input type="text" value={newLutName} onChange={(e) => setNewLutName(e.target.value.toUpperCase())} placeholder="PROFILE NAME..." className="flex-1 bg-transparent text-[11px] mono text-white outline-none font-black px-2" />
                  <button onClick={handleSaveLut} disabled={!newLutName.trim()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Store</button>
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Professional Emulations</label>
               <div className="grid grid-cols-2 gap-3">
                  {filmStocks.map(s => (
                    <button key={s.name} onClick={() => applyPreset(s)} className={`relative h-24 rounded-3xl border transition-all flex flex-col items-center justify-center group overflow-hidden ${grading.preset_name === s.name ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'border-white/5 bg-zinc-900/40 hover:border-white/20'}`}>
                      <div className="absolute top-2 left-3 opacity-20">
                        <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth={2}/></svg>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest text-center px-4 ${grading.preset_name === s.name ? 'text-white' : 'text-zinc-500'}`}>{s.name.replace('_', ' ')}</span>
                    </button>
                  ))}
               </div>
            </div>

            {customLuts.length > 0 && (
              <div className="space-y-4 pt-8 border-t border-white/5">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Stored Profiles</label>
                <div className="grid grid-cols-2 gap-3">
                    {customLuts.map((l, i) => (
                      <div key={i} className="relative group">
                        <button onClick={() => applyPreset(l)} className={`w-full h-16 rounded-3xl border transition-all flex items-center justify-center bg-zinc-900/60 ${grading.preset_name === l.name ? 'border-indigo-500' : 'border-white/5 hover:border-white/20'}`}>
                           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{l.name}</span>
                        </button>
                        <button onClick={() => handleRemoveLut(l.name)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      );
      default: return controls ? controls.map((ctrl) => {
          const val = (grading as any)[ctrl.key];
          const displayVal = typeof val === 'number' ? val.toFixed(2) : (typeof val === 'string' ? val : '0');
          return (
            <div key={ctrl.key} className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{ctrl.label}</span>
                <span className="text-[10px] mono text-indigo-400 font-bold">{displayVal}</span>
              </div>
              <input 
                type="range" 
                min={ctrl.min} 
                max={ctrl.max} 
                step={ctrl.step} 
                value={Number(val) || 0} 
                onChange={(e) => updateParam(ctrl.key as keyof LatentGrading, parseFloat(e.target.value))} 
                className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer" 
              />
            </div>
          );
        }) : [];
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#08080a]">
       <div className="flex flex-col gap-y-8">
          {getCategoryContent()}
       </div>
    </div>
  );
};

export default GradingControls;