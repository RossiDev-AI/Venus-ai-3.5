
import React, { useState, useEffect, useRef } from 'react';
import { VaultItem, LatentGrading } from '../../types';
import { applyGrading } from '../../gradingProcessor';
import { useVenusStore } from '../../stores/useVenusStore';

// Subcomponents
import GradingPreview from '../gradingLab/GradingPreview';
import GradingToolbar from '../gradingLab/GradingToolbar';
import GradingNavigation from '../gradingLab/GradingNavigation';
import GradingControls from '../gradingLab/GradingControls';
import GradingQueue from '../gradingLab/GradingQueue';
import HistoryControls from '../shared/HistoryControls';

// Fix: Defined missing GradingLabProps interface
interface GradingLabProps {
  vault: VaultItem[];
  onSave: (item: VaultItem) => Promise<void>;
}

/**
 * Fix: Fulfilled LatentGrading interface requirements with missing properties and added explicit casting.
 */
const INITIAL_GRADING: LatentGrading = {
  // --- KERNEL META ---
  preset_name: 'LINEAR_RAW',
  css_filter_string: 'none',

  // --- PRIMARY CORRECTION (15) ---
  exposure: 0, contrast: 1, pivot: 0.5, brightness: 1, saturation: 1, vibrance: 1,
  temperature: 0, tint: 0, hueRotate: 0, gamma: 1, offset: 0, lift: 0, gain: 1,
  invert: 0, opacity: 1,

  // --- LOG WHEELS (LGG) (12) ---
  lift_r: 0, lift_g: 0, lift_b: 0, gamma_r: 1, gamma_g: 1, gamma_b: 1, gain_r: 1, gain_g: 1, gain_b: 1, offset_r: 0, offset_g: 0, offset_b: 0,

  // --- CHANNEL MIXER (Matrix 3x3) (9) ---
  mix_red_red: 1, mix_red_green: 0, mix_red_blue: 0, mix_green_red: 0, mix_green_green: 1, mix_green_blue: 0, mix_blue_red: 0, mix_blue_green: 0, mix_blue_blue: 1,

  // --- HSL VECTOR SCOPE (Specific Hue Shifts) (16) ---
  hue_red: 0, sat_red: 0, hue_orange: 0, sat_orange: 0, hue_yellow: 0, sat_yellow: 0, hue_green: 0, sat_green: 0, hue_cyan: 0, sat_cyan: 0, hue_blue: 0, sat_blue: 0, hue_magenta: 0, sat_magenta: 0, hue_purple: 0, sat_purple: 0,

  // --- SPLIT TONING (6) ---
  split_shadow_hue: 240, split_shadow_sat: 0, split_mid_hue: 45, split_mid_sat: 0, split_highlight_hue: 45, split_highlight_sat: 0, split_balance: 0,

  // --- FILM EMULSION SYNTHESIS (10) ---
  grain: 0, grain_size: 1, grain_roughness: 0.5, grain_color: 0, grain_shadows: 0, grain_highlights: 0,

  // --- OPTICAL PHYSICS (Lens Engine) (13) ---
  halation: 0, halation_threshold: 0.8, halation_radius: 0, film_breath: 0,
  lens_distortion: 0, chromatic_aberration: 0, vignette: 0, vignette_roundness: 0, vignette_feather: 0.5, vignette_center_x: 0, vignette_center_y: 0, bloom: 0, bloom_threshold: 0.8, bloom_radius: 0, diffusion: 0, anamorphic_squeeze: 1, geometry_y: 1,

  // --- DETAIL & TEXTURE (Spatial) (10) ---
  sharpness: 0, unsharp_mask: 0, structure: 0, clarity: 0, dehaze: 0, denoise: 0, denoise_chroma: 0, blur: 0, noise_gate: 0, texture: 0,

  // --- SKIN & BEAUTY (Face Engine) (8) ---
  skin_protect: 0, skin_hue: 0, skin_sat: 0, skin_smooth: 0, feature_pop: 0, eye_clarity: 0, face_warp: 0, teeth_whitening: 0,

  // --- COMPOSITION (Transform) (6) ---
  crop_zoom: 0, pan_x: 0, pan_y: 0, rotate: 0, perspective_x: 0, perspective_y: 0,

  // --- FACE AWARENESS (3) ---
  face_center_x: 0.5, face_center_y: 0.5, face_radius: 0.2,

  // --- LEGACY/COMPATIBILITY (17) ---
  tint_r: 1, tint_g: 1, tint_b: 1, sepia: 0, grayscale: 0, tonal_value: 1, highlight_rolloff: 0, shadow_rolloff: 0, whites: 1, blacks: 0, shadows: 0, midtones: 1, highlights: 1,
  selective_hue: 0, selective_threshold: 40, selective_mix: 0, selective_target_sat: 0, hue_vs_hue_curve: 0, hue_vs_sat_curve: 0, sat_vs_sat_curve: 0, lum_vs_sat_curve: 0,
  lens_center_x: 0, lens_center_y: 0, polar_coordinates: 0, lip_saturation: 0, halation_hue: 0, skin_smoothing: 0, blemish_removal: 0, skin_hue_legacy: 0, skin_saturation: 0,
  
  // Added fix: Required property 'chromatic' missing in type object but required in interface
  chromatic: 0,
  // Added fix: Required property 'bokeh' missing in type object but required in interface
  bokeh: 0
} as LatentGrading;

const CAMERA_PROFILES = [
  { name: 'KODAK_VISION3_500T', contrast: 1.1, saturation: 1.2, grain: 0.15, halation: 0.2, bloom: 0.1, tint: -5 },
  { name: 'FUJI_ETERNA_250D', contrast: 0.95, saturation: 0.9, grain: 0.05, shadows: 0.02, midtones: 1.05 },
  { name: 'CINESTILL_800T', halation: 0.6, bloom: 0.4, temperature: -20, split_shadow_hue: 210, split_shadow_sat: 0.2 },
  { name: 'ILFORD_HP5_BW', grayscale: 1, contrast: 1.3, grain: 0.4, grain_roughness: 0.8 },
  { name: 'BLEACH_BYPASS', saturation: 0.4, contrast: 1.5, structure: 0.5, grain: 0.2 },
  { name: 'TEAL_ORANGE_BLOCK', split_shadow_hue: 210, split_shadow_sat: 0.5, split_highlight_hue: 35, split_highlight_sat: 0.5, split_balance: -0.2 }
];

const GradingLab: React.FC<GradingLabProps> = ({ vault, onSave }) => {
  const [selectedNode, setSelectedNode] = useState<VaultItem | null>(null);
  const [grading, setGrading] = useState<LatentGrading>(INITIAL_GRADING);
  const [customLuts, setCustomLuts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeCategory, setActiveCategory] = useState<string>('MASTER');
  const [newLutName, setNewLutName] = useState('');
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  
  // Zundo Global State Sync
  const setActiveGrading = useVenusStore(state => state.setActiveGrading);
  const activeGrading = useVenusStore(state => state.activeGrading);

  const containerRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = 'studio_master_luts_v15_pro';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCustomLuts(JSON.parse(saved));
  }, []);

  // Sync Global History back to Local State (Undo/Redo)
  useEffect(() => {
    if (activeGrading) {
        setGrading(activeGrading);
    }
  }, [activeGrading]);

  useEffect(() => {
    if (selectedNode) {
      const startGrading = selectedNode.grading || INITIAL_GRADING;
      setGrading(startGrading);
      setActiveGrading(startGrading); // Initialize history
    }
  }, [selectedNode, setActiveGrading]);

  const updateParam = (key: keyof LatentGrading, val: any) => {
    const next = { ...grading, [key]: val };
    const baseFilters = [
      `brightness(${next.brightness})`,
      `contrast(${next.contrast})`,
      `saturate(${next.saturation})`,
      `blur(${next.blur}px)`,
      `sepia(${next.sepia})`,
      `hue-rotate(${next.hueRotate}deg)`,
      `grayscale(${next.grayscale})`,
    ].join(' ');
    
    const proFilter = `url(#pro-grading-${selectedNode?.shortId || 'global'})`;
    next.css_filter_string = `${baseFilters} ${proFilter}`;
    
    setGrading(next);
    setActiveGrading(next); // Push to Zundo
  };

  const applyPreset = (preset: any) => {
    const next = { ...INITIAL_GRADING, ...preset, preset_name: preset.name || preset.preset_name };
    setGrading(next);
    setActiveGrading(next);
  };

  const handleSaveLut = () => {
    if (!newLutName.trim()) return;
    const newLut = { ...grading, name: newLutName.toUpperCase() };
    const updated = [...customLuts, newLut];
    setCustomLuts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewLutName('');
    alert("LUT PROFILE REGISTERED IN KERNEL V15.");
  };

  const handleRemoveLut = (name: string) => {
    const updated = customLuts.filter(l => l.name !== name);
    setCustomLuts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const bakeImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
       if (!selectedNode) return reject();
       const img = new Image();
       img.crossOrigin = "anonymous";
       img.src = selectedNode.originalImageUrl || selectedNode.imageUrl;
       img.onload = async () => {
           const canvas = document.createElement('canvas');
           canvas.width = img.width;
           canvas.height = img.height;
           await applyGrading(canvas, img, grading);
           resolve(canvas.toDataURL('image/png', 0.95));
       };
       img.onerror = reject;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        setSelectedNode({
          id: crypto.randomUUID(),
          shortId: `UP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'RAW_SIGNAL',
          imageUrl: res, originalImageUrl: res, prompt: 'Raw imported signal',
          agentHistory: [], params: { z_anatomy: 1, z_structure: 1, z_lighting: 1, z_texture: 1, hz_range: "Manual", neural_metrics: { loss_mse: 0, ssim_index: 1, tensor_vram: 0, iteration_count: 0, consensus_score: 1.0 }, structural_fidelity: 1.0, scale_factor: 1.0 },
          rating: 5, timestamp: Date.now(), usageCount: 0, neuralPreferenceScore: 50, isFavorite: true, vaultDomain: 'X',
          grading: INITIAL_GRADING
        });
        const init = INITIAL_GRADING;
        setGrading(init);
        setActiveGrading(init);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    { id: 'MASTER', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth={2}/></svg>, label: 'Master' },
    { id: 'LGG', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>, label: 'Wheels' },
    { id: 'MIXER', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeWidth={2}/></svg>, label: 'Mixer' },
    { id: 'HSL', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343" strokeWidth={2}/></svg>, label: 'HSL' },
    { id: 'FX', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg>, label: 'FX / Skin' },
    { id: 'PHYSICS', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth={2}/></svg>, label: 'Lens' },
    { id: 'FILM', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" strokeWidth={2}/></svg>, label: 'Film' },
    { id: 'LUT', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>, label: 'Profile' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#010101] overflow-hidden min-h-full">
      {/* History Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500]">
         <HistoryControls />
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 relative flex flex-col overflow-hidden bg-black">
          <GradingPreview 
            selectedNode={selectedNode} 
            grading={grading} 
            sliderPosition={sliderPosition} 
            onSliderMove={(e) => {
                if (!containerRef.current) return;
                const r = containerRef.current.getBoundingClientRect();
                const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
                setSliderPosition(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)));
            }} 
            containerRef={containerRef} 
            onUploadClick={() => uploadInputRef.current?.click()} 
            onOpenVault={() => setShowVaultPicker(true)}
          />
        </div>

        <div className="w-full md:w-[400px] lg:w-[460px] bg-[#08080a] border-l border-white/5 flex flex-col shadow-2xl z-20 overflow-hidden relative text-zinc-100">
          <GradingToolbar 
            onCommit={async () => {
                if(!selectedNode) return;
                setIsSaving(true); 
                try { 
                    const b = await bakeImage(); 
                    await onSave({ ...selectedNode, imageUrl: b, grading }); 
                    alert("MASTER GRADE LOCKED."); 
                } catch(e){ alert("Render Error"); } finally { setIsSaving(false); }
            }} 
            onDownload={async () => { 
                try {
                  const b = await bakeImage(); 
                  const a = document.createElement('a'); a.href = b; a.download = `Studio_Master_V15.png`; a.click(); 
                } catch(e) { alert("Download failed: No buffer"); }
            }} 
            onReset={() => {
                const reset = INITIAL_GRADING;
                setGrading(reset);
                setActiveGrading(reset);
            }} 
            isSaving={isSaving} disabled={!selectedNode} 
          />

          <GradingNavigation categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          
          <div className="flex-1 overflow-hidden">
            <GradingControls 
              activeCategory={activeCategory} 
              grading={grading} 
              updateParam={updateParam} 
              applyPreset={applyPreset} 
              filmStocks={CAMERA_PROFILES} 
              customLuts={customLuts} 
              handleSaveLut={handleSaveLut} 
              handleRemoveLut={handleRemoveLut} 
              newLutName={newLutName} 
              setNewLutName={setNewLutName} 
            />
          </div>

          <GradingQueue favoriteNodes={vault.filter(i => i.isFavorite)} selectedNodeId={selectedNode?.id} onSelectNode={setSelectedNode} />
        </div>
      </div>

      {showVaultPicker && (
        <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl flex flex-col p-10 animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-12 max-w-7xl mx-auto w-full">
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Vault Engine</h3>
              <button onClick={() => setShowVaultPicker(false)} className="px-10 py-4 bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700">Exit</button>
           </div>
           <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-8 custom-scrollbar pb-40 max-w-7xl mx-auto w-full">
              {vault.map(i => (
                <div key={i.id} onClick={() => { setSelectedNode(i); setShowVaultPicker(false); }} className="aspect-[3/4] bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-indigo-500 cursor-pointer transition-all group relative">
                   <img src={i.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 px-6 py-2 rounded-full">Inject Signal</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
      <input ref={uploadInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
    </div>
  );
};

export default GradingLab;
