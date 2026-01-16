
import React, { useState, useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { TimelineBeat, CinemaProject, AgentStatus, VaultItem, SubtitleSettings, AppSettings, LatentGrading } from '../../types';
import { scriptToTimeline, scoutMediaForBeat, generateImageForBeat, matchVaultForBeat, getGlobalVisualPrompt } from '../../geminiService';
import CinemaPreview from '../cinemaLab/CinemaPreview';
import CinemaTimeline from '../cinemaLab/CinemaTimeline';
import CinemaControls from '../cinemaLab/CinemaControls';
import CinemaAssetModal from '../cinemaLab/CinemaAssetModal';
import CinemaVaultModal from '../cinemaLab/CinemaVaultModal';
import { LuminaShaderEngine } from '../lumina/LuminaShaderEngine';
import CinemaGradingOverlay from './CinemaGradingOverlay';
import { FFmpegService } from '../../services/FFmpegService';
import { FaceDetectionService } from '../../services/FaceDetectionService';
import { toast } from 'sonner';
import Vibrant from 'node-vibrant';
import { 
  Layers, ScanText, Palette as PaletteIcon, ChevronRight, 
  FlaskConical, Sparkles, Wand2, Info, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { useVenusStore } from '../../stores/useVenusStore';

interface CinemaLabProps {
  vault: VaultItem[];
  onSave: (item: VaultItem) => Promise<void>;
  currentSourceImage?: string | null;
  project: CinemaProject;
  setProject: React.Dispatch<React.SetStateAction<CinemaProject>>;
  script: string;
  setScript: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  credits: string;
  setCredits: (val: string) => void;
  logs: AgentStatus[];
  setLogs: React.Dispatch<React.SetStateAction<AgentStatus[]>>;
  activeBeatIndex: number;
  setActiveBeatIndex: (idx: number) => void;
  onReset: () => void;
  settings?: AppSettings;
}

const DEFAULT_GRADING: LatentGrading = {
  preset_name: 'NEUTRAL',
  css_filter_string: 'none',
  exposure: 0, contrast: 1, pivot: 0.5, brightness: 1, saturation: 1, vibrance: 1,
  temperature: 0, tint: 0, hueRotate: 0, gamma: 1, offset: 0, lift: 0, gain: 1,
  invert: 0, opacity: 1,
  lift_r: 0, lift_g: 0, lift_b: 0,
  gamma_r: 1, gamma_g: 1, gamma_b: 1,
  gain_r: 1, gain_g: 1, gain_b: 1,
  offset_r: 0, offset_g: 0, offset_b: 0,
  mix_red_red: 1, mix_red_green: 0, mix_red_blue: 0,
  mix_green_red: 0, mix_green_green: 1, mix_green_blue: 0,
  mix_blue_red: 0, mix_blue_green: 0, mix_blue_blue: 1,
  hue_red: 0, sat_red: 0, hue_orange: 0, sat_orange: 0,
  hue_yellow: 0, sat_yellow: 0, hue_green: 0, sat_green: 0,
  hue_cyan: 0, sat_cyan: 0, hue_blue: 0, sat_blue: 0,
  hue_magenta: 0, sat_magenta: 0, hue_purple: 0, sat_purple: 0,
  split_shadow_hue: 240, split_shadow_sat: 0,
  split_highlight_hue: 45, split_highlight_sat: 0,
  split_mid_hue: 45, split_mid_sat: 0, split_balance: 0,
  grain: 0, grain_size: 1, grain_roughness: 0.5, grain_color: 0,
  grain_shadows: 1.0, grain_highlights: 0.2,
  halation: 0, halation_threshold: 0.8, halation_radius: 0,
  film_breath: 0, lens_distortion: 0, chromatic_aberration: 0,
  vignette: 0, vignette_roundness: 0, vignette_feather: 0.5,
  vignette_center_x: 0, vignette_center_y: 0,
  bloom: 0, bloom_threshold: 0.8, bloom_radius: 0,
  diffusion: 0, anamorphic_squeeze: 1, sharpness: 0,
  unsharp_mask: 0, structure: 0, clarity: 0, dehaze: 0,
  denoise: 0, denoise_chroma: 0, blur: 0, noise_gate: 0, texture: 0,
  skin_protect: 0, skin_hue: 0, skin_sat: 0, skin_smooth: 0,
  feature_pop: 0, eye_clarity: 0, face_warp: 0, teeth_whitening: 0,
  crop_zoom: 0, pan_x: 0, pan_y: 0, rotate: 0, perspective_x: 0, perspective_y: 0,
  tint_r: 1, tint_g: 1, tint_b: 1, sepia: 0, grayscale: 0,
  tonal_value: 1, highlight_rolloff: 0, shadow_rolloff: 0,
  whites: 1, blacks: 0, shadows: 0, midtones: 1, highlights: 1,
  selective_hue: 0, selective_threshold: 40, selective_mix: 0, selective_target_sat: 0,
  hue_vs_hue_curve: 0, hue_vs_sat_curve: 0, sat_vs_sat_curve: 0, lum_vs_sat_curve: 0,
  lens_center_x: 0, lens_center_y: 0, polar_coordinates: 0, lip_saturation: 0,
  halation_hue: 0, skin_smoothing: 0, blemish_removal: 0,
  skin_hue_legacy: 0, skin_saturation: 0,
  face_center_x: 0.5, face_center_y: 0.5, face_radius: 0.2,
  geometry_y: 1,
  bokeh: 0,
  // Fix: Added missing chromatic property to satisfy LatentGrading interface
  chromatic: 0
};

const proHtmlToText = (html: string): string => {
  if (!html) return "";
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '');
  return text.trim();
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const sections = text.split('\n');
  const lines: string[] = [];
  sections.forEach(section => {
    const words = section.split(' ');
    let currentLine = '';
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
  });
  return lines;
};

const CinemaLab: React.FC<CinemaLabProps> = (props) => {
  const [globalDuration, setGlobalDuration] = useState(5);
  const [fidelityMode, setFidelityMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [showAssetOrchestrator, setShowAssetOrchestrator] = useState<number | null>(null);
  const [showVaultGallery, setShowVaultGallery] = useState(false);
  const [exportRes, setExportRes] = useState('1080p');
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [loadingBeats, setLoadingBeats] = useState<Record<string, boolean>>({});
  const [globalGrading, setGlobalGrading] = useState<LatentGrading>(DEFAULT_GRADING);
  const [minimalMode, setMinimalMode] = useState(false);
  const [showAdvancedLabs, setShowAdvancedLabs] = useState(false);
  const [swatches, setSwatches] = useState<string[]>([]);
  const [ocrActive, setOcrActive] = useState(false);
  
  const setDetectedSceneText = useVenusStore(state => state.setDetectedSceneText);
  const currentBeat = props.project.beats[props.activeBeatIndex];

  // Extração de cores automática ao mudar de cena
  useEffect(() => {
    if (currentBeat?.assetUrl) {
        Vibrant.from(currentBeat.assetUrl).getPalette()
            .then(palette => {
                const colors = [
                    palette.Vibrant?.hex,
                    palette.Muted?.hex,
                    palette.DarkVibrant?.hex,
                    palette.LightVibrant?.hex,
                    palette.DarkMuted?.hex,
                    palette.LightMuted?.hex
                ].filter(Boolean) as string[];
                setSwatches(colors);
            });
    }
  }, [currentBeat?.assetUrl]);

  const handleOcrAnalyze = async () => {
    if (!currentBeat?.assetUrl || ocrActive) return;
    setOcrActive(true);
    const tid = toast.loading("Extraindo semântica textual...");
    try {
        // Lazy load Tesseract.js
        const { createWorker } = await import('https://esm.sh/tesseract.js@5.0.3');
        const worker = await createWorker('por+eng');
        const ret = await worker.recognize(currentBeat.assetUrl);
        const text = ret.data.text.trim();
        await worker.terminate();

        if (text) {
            setDetectedSceneText(text);
            props.setLogs(prev => [...prev, { 
                type: 'Visual Scout', 
                status: 'completed', 
                message: `OCR Detectado: "${text.substring(0, 50)}..."`, 
                timestamp: Date.now() 
            }]);
            toast.success("Texto indexado ao contexto da cena.", { id: tid });
            
            // Smart Labeling: Rename current beat if it was generic
            if (currentBeat.caption.length < 5) {
               props.setProject(prev => {
                  const updated = [...prev.beats];
                  updated[props.activeBeatIndex] = { 
                     ...updated[props.activeBeatIndex], 
                     caption: text.split('\n')[0].substring(0, 50) 
                  };
                  return { ...prev, beats: updated };
               });
            }
        } else {
            toast.error("Nenhum texto detectado.", { id: tid });
        }
    } catch (e) {
        console.error(e);
        toast.error("Falha no motor OCR.", { id: tid });
    } finally {
        setOcrActive(false);
    }
  };

  const handleAnalyzeScript = async () => {
    const plainScript = proHtmlToText(props.script);
    if (!plainScript.trim()) return;
    setIsGenerating(true);
    props.setLogs([{ type: 'Script Analyzer', status: 'processing', message: `Iniciando orquestração narrativa...`, timestamp: Date.now() }]);
    try {
      let beats = await scriptToTimeline(plainScript, 30, fidelityMode, props.settings);
      if (proHtmlToText(props.title).trim()) {
        const globalScout = await getGlobalVisualPrompt(plainScript, props.settings);
        beats = [{ id: 'title-' + crypto.randomUUID(), timestamp: Date.now(), duration: globalDuration, assetUrl: null, caption: props.title, assetType: 'IMAGE', scoutQuery: globalScout, yOffset: 0 }, ...beats];
      }
      beats.push({ id: 'credits-' + crypto.randomUUID(), timestamp: Date.now(), duration: globalDuration, assetUrl: null, caption: props.credits, assetType: 'IMAGE', scoutQuery: 'Cinema credits background', yOffset: 0 });
      props.setProject(prev => ({ ...prev, beats: beats.map(b => ({ ...b, duration: globalDuration, yOffset: 0 })) }));
      props.setLogs(prev => [...prev, { type: 'Director', status: 'completed', message: 'Timeline gerada.', timestamp: Date.now() }]);
    } catch (e: any) { 
        props.setLogs(prev => [...prev, { type: 'Director', status: 'error', message: `Falha na orquestração: ${e.message || String(e)}`, timestamp: Date.now() }]); 
    } finally { setIsGenerating(false); }
  };

  const handleAssetAction = async (index: number, mode: string, provider?: any, forcedVaultItem?: VaultItem) => {
    const beat = props.project.beats[index];
    if (!beat) return;
    setLoadingBeats(prev => ({ ...prev, [beat.id]: true }));
    try {
      let assetUrl: string | null = null;
      let sourceLink = "";
      if (mode === 'SCOUT') {
        const res = await scoutMediaForBeat(beat.scoutQuery || '', proHtmlToText(beat.caption), props.settings, provider);
        assetUrl = res.assetUrl; sourceLink = res.source;
      } else if (mode === 'AI') {
        // Prompt enrichment with OCR context if available for this specific session
        const ocrContext = useVenusStore.getState().detectedSceneText;
        const enrichedCaption = ocrContext ? `${proHtmlToText(beat.caption)}. Incorporate visual keywords: ${ocrContext.substring(0, 100)}` : proHtmlToText(beat.caption);
        
        assetUrl = await generateImageForBeat(enrichedCaption, beat.scoutQuery || '', props.settings);
        
        if (assetUrl) {
            const face = await FaceDetectionService.detectFace(assetUrl);
            if (face) {
                setGlobalGrading(prev => ({
                    ...prev,
                    face_center_x: face.x + face.width/2,
                    face_center_y: face.y + face.height/2,
                    face_radius: Math.max(face.width, face.height) * 0.8,
                    bokeh: 0.5 
                }));
                toast.success("Foco inteligente ativado para o personagem.");
            }
        }
      } else if (mode === 'VAULT_AUTO') {
        const match = await matchVaultForBeat(proHtmlToText(beat.caption), props.vault, props.settings);
        if (match) assetUrl = match.imageUrl;
      } else if (mode === 'VAULT_MANUAL' && forcedVaultItem) {
        assetUrl = forcedVaultItem.imageUrl;
      }
      
      props.setProject(prev => {
        const updated = [...prev.beats];
        updated[index] = { ...updated[index], assetUrl, assetType: 'IMAGE', sourceLink };
        return { ...prev, beats: updated };
      });
    } catch (e) { console.error(e); }
    finally { setLoadingBeats(prev => ({ ...prev, [beat.id]: false })); }
  };

  const handleLocalRender = async () => {
    if (props.project.beats.length === 0) return;
    setIsRendering(true); setRenderProgress(0); setRenderStatus('Kernel de Exportação Iniciado...');
    try {
      await FFmpegService.load((msg) => console.log('FFmpeg:', msg));
      const subs = props.project.subtitleSettings!;
      let width = 1920, height = 1080;
      if (exportRes === '4K') { width = 3840; height = 2160; }
      else if (exportRes === '2K') { width = 2560; height = 1440; }
      const FPS = 30;
      const frames: Blob[] = [];
      const bakeApp = new PIXI.Application();
      await bakeApp.init({ width, height, backgroundAlpha: 1 });
      for (let i = 0; i < props.project.beats.length; i++) {
        const beat = props.project.beats[i];
        if (!beat.assetUrl) continue;
        setRenderStatus(`Processando Cena ${i + 1} de ${props.project.beats.length}...`);
        const texture = await PIXI.Assets.load(beat.assetUrl);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5); sprite.x = width / 2; sprite.y = height / 2;
        const containerAspect = width / height; const textureAspect = texture.width / texture.height;
        if (textureAspect > containerAspect) { sprite.height = height; sprite.scale.x = sprite.scale.y; } else { sprite.width = width; sprite.scale.y = sprite.scale.x; }
        bakeApp.stage.addChild(sprite);
        const duration = beat.duration || globalDuration;
        const totalBeatFrames = duration * FPS;
        for (let f = 0; f < totalBeatFrames; f++) {
          const fp = f / totalBeatFrames;
          sprite.scale.x *= (1 + fp * 0.1); sprite.scale.y *= (1 + fp * 0.1);
          LuminaShaderEngine.applyStack(sprite, globalGrading);
          bakeApp.render();
          const bakeCanvas = bakeApp.canvas;
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = width; finalCanvas.height = height;
          const ctx = finalCanvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(bakeCanvas, 0, 0);
              const scaleFactor = width / 800; const adjFS = Math.max(Math.round(subs.fontSize * scaleFactor), 40);
              ctx.font = `600 ${adjFS}px ${subs.fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = "middle";
              const text = beat.caption;
              const wrapped = wrapText(ctx, proHtmlToText(text), width - (adjFS * subs.marginMult * 2));
              const lineH = adjFS * 1.4; const bH = (wrapped.length * lineH) + (adjFS * subs.paddingVMult * 2);
              const bY = height - (height * 0.15) - bH;
              let maxW = 0; wrapped.forEach(l => { const w = ctx.measureText(l).width; if (w > maxW) maxW = w; });
              const bW = maxW + (adjFS * subs.paddingHMult * 2); const bX = (width - bW) / 2;
              ctx.fillStyle = subs.backgroundColor; ctx.globalAlpha = subs.bgOpacity;
              ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, Math.round(adjFS * subs.radiusMult)); ctx.fill();
              ctx.globalAlpha = 1.0; ctx.fillStyle = subs.fontColor;
              wrapped.forEach((l, idx) => ctx.fillText(l, width/2, bY + (adjFS * subs.paddingVMult) + (idx * lineH) + (adjFS * 0.5)));
              const frameBlob = await new Promise<Blob>((res) => finalCanvas.toBlob((b) => res(b!), 'image/png'));
              frames.push(frameBlob);
          }
          setRenderProgress(Math.round(((i / props.project.beats.length) + (fp / props.project.beats.length)) * 50));
        }
        bakeApp.stage.removeChild(sprite);
      }
      setRenderStatus(`Sintetizando ${exportFormat.toUpperCase()}...`);
      const outputData = await FFmpegService.transcode(frames, FPS, exportFormat, (p) => setRenderProgress(Math.round(50 + p/2)));
      const videoBlob = new Blob([outputData.buffer], { type: `video/${exportFormat}` });
      const videoUrl = URL.createObjectURL(videoBlob);
      const a = document.createElement('a'); a.href = videoUrl; a.download = `Vnus_Render_${Date.now()}.${exportFormat}`; a.click();
      toast.success("Exportação concluída com sucesso.");
      bakeApp.destroy(true);
    } catch (e: any) { 
      toast.error(`Falha Crítica: ${e.message || String(e)}`);
    } finally { setIsRendering(false); }
  };

  return (
    <div className={`h-full flex flex-col bg-[#050505] overflow-hidden min-h-full ${minimalMode ? 'minimal-ui' : ''}`}>
      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 bg-black flex flex-col relative border-r border-white/5 overflow-hidden">
          <CinemaPreview 
            currentBeat={currentBeat} 
            aspectRatio={props.project.aspectRatio} 
            subtitleSettings={props.project.subtitleSettings!} 
            title={props.title} 
            credits={props.credits} 
            isRendering={isRendering} 
            renderProgress={renderProgress} 
            renderStatus={renderStatus} 
            globalGrading={globalGrading}
            isScanning={ocrActive}
          />
          
          <AnimatePresence>
            {!minimalMode && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
              >
                <CinemaTimeline 
                    beats={props.project.beats} 
                    activeIndex={props.activeBeatIndex} 
                    onSelect={props.setActiveBeatIndex} 
                    onOpenOrchestrator={setShowAssetOrchestrator} 
                    loadingBeats={loadingBeats} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced Labs Toolbar */}
          <div className="absolute top-20 left-6 z-[1001] flex flex-col gap-2">
             <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAdvancedLabs(!showAdvancedLabs)}
                className={`p-3 rounded-full border backdrop-blur-xl transition-all ${showAdvancedLabs ? 'bg-indigo-600 border-indigo-400' : 'bg-black/60 border-white/10 text-zinc-500 hover:text-white'}`}
                title="Advanced Labs"
             >
                <FlaskConical size={18} />
             </motion.button>
             
             <AnimatePresence>
             {showAdvancedLabs && (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-2"
                >
                    <button 
                        onClick={handleOcrAnalyze}
                        disabled={ocrActive || !currentBeat?.assetUrl}
                        className="p-3 bg-black/60 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-all group relative"
                        title="Extrair Texto (OCR)"
                    >
                        <ScanText size={18} className={ocrActive ? 'animate-spin' : ''} />
                    </button>
                    
                    <div className="bg-black/80 border border-white/10 p-2 rounded-2xl flex flex-col gap-1 shadow-2xl">
                        <div className="flex items-center justify-center mb-1">
                            <PaletteIcon size={12} className="text-indigo-500" />
                        </div>
                        {swatches.map((c, i) => (
                            <motion.button 
                                key={i} 
                                whileHover={{ scale: 1.2 }}
                                style={{ backgroundColor: c, '--swatch-color': c } as any}
                                onClick={() => {
                                    setGlobalGrading(prev => ({ ...prev, lift_r: (prev.lift_r || 0) + 0.05 }));
                                    toast.info(`Harmonizando cena com o tom ${c}`);
                                }}
                                className="w-6 h-6 rounded-md shadow-lg relative group"
                            />
                        ))}
                    </div>
                </motion.div>
             )}
             </AnimatePresence>
          </div>
          
          <CinemaGradingOverlay 
            grading={globalGrading}
            onChange={(updates) => setGlobalGrading(prev => ({ ...prev, ...updates }))}
            minimalMode={minimalMode}
            onToggleMinimal={setMinimalMode}
          />
        </div>
        
        <AnimatePresence>
            {!minimalMode && (
                <motion.div 
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="h-full"
                >
                    <CinemaControls 
                      {...props} 
                      aspectRatio={props.project.aspectRatio}
                      setAspectRatio={(val) => props.setProject(prev => ({ ...prev, aspectRatio: val }))}
                      exportRes={exportRes} setExportRes={setExportRes} 
                      globalDuration={globalDuration} setGlobalDuration={setGlobalDuration} 
                      subtitleSettings={props.project.subtitleSettings!} 
                      onUpdateSubtitle={(k, v) => props.setProject(prev => ({ ...prev, subtitleSettings: { ...prev.subtitleSettings!, [k]: v } }))} 
                      fidelityMode={fidelityMode} setFidelityMode={setFidelityMode} 
                      isGenerating={isGenerating} isRendering={isRendering} 
                      onAnalyze={handleAnalyzeScript} onRender={handleLocalRender} 
                      onBatch={() => {}} 
                      logs={props.logs}
                    />
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      {showAssetOrchestrator !== null && (
        <CinemaAssetModal 
          beat={props.project.beats[showAssetOrchestrator]} 
          index={showAssetOrchestrator} 
          onClose={() => setShowAssetOrchestrator(null)} 
          onUpdateCaption={(val) => {
            const updated = [...props.project.beats];
            updated[showAssetOrchestrator] = { ...updated[showAssetOrchestrator], caption: val };
            props.setProject(prev => ({ ...prev, beats: updated }));
          }}
          onUpdateYOffset={(val) => {
            const updated = [...props.project.beats];
            updated[showAssetOrchestrator] = { ...updated[showAssetOrchestrator], yOffset: val };
            props.setProject(prev => ({ ...prev, beats: updated }));
          }}
          onAction={(mode, provider) => handleAssetAction(showAssetOrchestrator, mode, provider)}
          onOpenVault={() => setShowVaultGallery(true)}
        />
      )}

      {showVaultGallery && (
        <CinemaVaultModal 
          items={props.vault} 
          onClose={() => setShowVaultGallery(false)} 
          onSelect={(item) => {
            handleAssetAction(showAssetOrchestrator || 0, 'VAULT_MANUAL', undefined, item);
            setShowVaultGallery(false); setShowAssetOrchestrator(null);
          }} 
        />
      )}

      <div className="absolute top-4 left-4 flex gap-1 z-[1001] bg-black/40 p-1 rounded-lg border border-white/5 hide-in-minimal">
          <button onClick={() => setExportFormat('mp4')} className={`px-3 py-1 text-[8px] font-black uppercase rounded ${exportFormat === 'mp4' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>MP4</button>
          <button onClick={() => setExportFormat('webm')} className={`px-3 py-1 text-[8px] font-black uppercase rounded ${exportFormat === 'webm' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>WEBM</button>
      </div>

      <style>{`
        @keyframes ken-burns { from { transform: scale(1); } to { transform: scale(1.15) translate(1%, 1%); } }
        .animate-ken-burns { animation: ken-burns 15s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
};

export default CinemaLab;
