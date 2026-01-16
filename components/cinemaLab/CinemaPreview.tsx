import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { TimelineBeat, SubtitleSettings, LatentGrading } from '../../types';
import { LuminaShaderEngine } from '../lumina/LuminaShaderEngine';

interface CinemaPreviewProps {
  currentBeat: TimelineBeat | null;
  aspectRatio: '16:9' | '9:16' | '1:1';
  subtitleSettings: SubtitleSettings;
  title: string;
  credits: string;
  isRendering: boolean;
  renderProgress: number;
  renderStatus: string;
  globalGrading?: LatentGrading;
  isScanning?: boolean;
}

const CinemaPreview: React.FC<CinemaPreviewProps> = ({
  currentBeat, aspectRatio, subtitleSettings, title, credits, isRendering, renderProgress, renderStatus, globalGrading, isScanning
}) => {
  const subs = subtitleSettings;
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const blurFilterRef = useRef<PIXI.BlurFilter | null>(null);
  const laserRef = useRef<PIXI.Graphics | null>(null);
  
  // Calculate stroke-dasharray for circular progress
  const circleRadius = 60;
  const circumference = 2 * Math.PI * circleRadius;
  const offset = circumference - (renderProgress / 100) * circumference;

  useEffect(() => {
    const initPixi = async () => {
        if (!containerRef.current) return;
        const app = new PIXI.Application();
        await app.init({
            resizeTo: containerRef.current,
            backgroundAlpha: 0,
            antialias: true,
            preference: 'webgl',
            resolution: window.devicePixelRatio || 2
        });
        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        // Initialize blur for bokeh
        const blur = new PIXI.BlurFilter();
        blur.strength = 0;
        blurFilterRef.current = blur;

        // Initialize Laser Scan Graphic
        const laser = new PIXI.Graphics();
        app.stage.addChild(laser);
        laserRef.current = laser;
    };

    initPixi();
    return () => {
        if (appRef.current) {
            appRef.current.destroy(true, { children: true });
            appRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
    const updateAsset = async () => {
        if (!appRef.current || !currentBeat?.assetUrl) return;
        const app = appRef.current;

        try {
            const texture = await PIXI.Assets.load(currentBeat.assetUrl);
            if (spriteRef.current) {
                app.stage.removeChild(spriteRef.current);
            }
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            sprite.x = app.screen.width / 2;
            sprite.y = app.screen.height / 2;
            
            // Handle scaling to cover container while maintaining aspect
            const containerAspect = app.screen.width / app.screen.height;
            const textureAspect = texture.width / texture.height;
            if (textureAspect > containerAspect) {
                sprite.height = app.screen.height;
                sprite.scale.x = sprite.scale.y;
            } else {
                sprite.width = app.screen.width;
                sprite.scale.y = sprite.scale.x;
            }

            app.stage.addChildAt(sprite, 0); // Background layer
            spriteRef.current = sprite;
        } catch (e) {
            console.error("Asset load error", e);
        }
    };
    updateAsset();
  }, [currentBeat?.assetUrl]);

  // Real-time grading and scanning update loop
  useEffect(() => {
    if (!appRef.current) return;
    const app = appRef.current;
    
    const ticker = (time: PIXI.Ticker) => {
        if (spriteRef.current && globalGrading) {
            LuminaShaderEngine.applyStack(spriteRef.current, globalGrading);
            
            if (blurFilterRef.current) {
                const bokehStr = (globalGrading as any).bokeh || 0;
                blurFilterRef.current.strength = bokehStr * 15;
                if (bokehStr > 0) {
                   if (!spriteRef.current.filters?.includes(blurFilterRef.current)) {
                       spriteRef.current.filters = [...(spriteRef.current.filters || []), blurFilterRef.current];
                   }
                }
            }
        }

        if (laserRef.current) {
            const laser = laserRef.current;
            laser.clear();
            if (isScanning) {
                const y = (Math.sin(performance.now() / 400) + 1) / 2 * app.screen.height;
                laser.lineStyle(4, 0x6366f1, 0.8);
                laser.moveTo(0, y);
                laser.lineTo(app.screen.width, y);
                
                // Laser Glow
                laser.lineStyle(20, 0x6366f1, 0.1);
                laser.moveTo(0, y);
                laser.lineTo(app.screen.width, y);

                laser.visible = true;
            } else {
                laser.visible = false;
            }
        }
    };
    
    app.ticker.add(ticker);
    return () => {
        app.ticker.remove(ticker);
    };
  }, [globalGrading, isScanning]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
      <div 
        ref={containerRef}
        className={`relative bg-zinc-950 shadow-2xl overflow-hidden rounded-[2.5rem] border border-white/5 transition-all duration-700 ${aspectRatio === '16:9' ? 'w-full max-w-5xl aspect-video' : aspectRatio === '1:1' ? 'h-full max-h-[80vh] aspect-square' : 'h-full max-h-[80vh] aspect-[9/16]'}`}
      >
        {/* Pixi Canvas will be injected here */}

        {currentBeat && (
            <div className={`absolute left-0 right-0 px-10 flex justify-center pointer-events-none ${currentBeat.id.startsWith('title') || currentBeat.id.startsWith('credits') ? 'inset-0 items-center' : 'bottom-[15%]'}`}>
              <div 
                style={{ 
                  fontSize: `${(currentBeat.id.startsWith('credits') || currentBeat.id.startsWith('title')) ? subs.fontSize * 0.85 : subs.fontSize}px`, 
                  color: subs.fontColor, 
                  backgroundColor: subs.backgroundColor, 
                  opacity: subs.bgOpacity, 
                  borderRadius: `${subs.fontSize * subs.radiusMult}px`, 
                  padding: `${subs.fontSize * subs.paddingVMult}px ${subs.fontSize * subs.paddingHMult}px`, 
                  textAlign: subs.textAlign, 
                  maxWidth: '90%', 
                  lineHeight: '1.4', 
                  fontWeight: 600, 
                  fontFamily: subs.fontFamily,
                  border: '1px solid rgba(255,255,255,0.1)',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
                dangerouslySetInnerHTML={{ __html: currentBeat.id.startsWith('title') ? title : currentBeat.id.startsWith('credits') ? credits : currentBeat.caption }}
              />
            </div>
        )}

        {isScanning && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[101] bg-indigo-600/20 backdrop-blur-xl px-6 py-2 rounded-full border border-indigo-500/40 flex items-center gap-3">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
             <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">OCR Contextual Scan Active</span>
          </div>
        )}

        {isRendering && (
          <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96" cy="96" r={circleRadius}
                  stroke="rgba(79, 70, 229, 0.1)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="96" cy="96" r={circleRadius}
                  stroke="#4f46e5"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.3s' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white mono">{renderProgress}%</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400/60">FFMPEG GRID</span>
              </div>
            </div>
            <h4 className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 max-w-sm leading-relaxed">{renderStatus}</h4>
            <p className="mt-2 text-[7px] mono text-zinc-600 uppercase tracking-widest animate-pulse">LCP Neural Frame Capture Active</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CinemaPreview;