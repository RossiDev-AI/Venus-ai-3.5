
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T, Rectangle2d } from 'tldraw'
import React, { useLayoutEffect, useRef, useEffect } from 'react'
import * as PIXI from 'pixi.js'
import { LuminaShaderEngine } from './LuminaShaderEngine';

export type LuminaImageShape = TLBaseShape<'lumina-image', {
    w: number, h: number, url: string, vaultId: string,
    brightness: number, contrast: number, saturation: number, grain: number,
    blur: number, opacity: number, blendMode: string, isScanning: boolean,
    twirl: number, bulge: number, rgbSplit: number, vignette: number,
    sharpness: number, face_radius: number, face_center_x: number, face_center_y: number,
    temperature: number, tint: number, exposure: number, bloom: number, chromatic: number,
    hue: number, vibrance: number, gamma: number, maskColor: string
}>

export class LuminaImageShapeUtil extends BaseBoxShapeUtil<LuminaImageShape> {
	static type = 'lumina-image' as const
	
	static props = {
		w: T.number, h: T.number, url: T.string, vaultId: T.string,
        brightness: T.number, contrast: T.number, saturation: T.number,
        grain: T.number, blur: T.number, opacity: T.number,
        blendMode: T.string, isScanning: T.boolean,
        twirl: T.number, bulge: T.number, rgbSplit: T.number, vignette: T.number,
        sharpness: T.number, face_radius: T.number, face_center_x: T.number,
        face_center_y: T.number, temperature: T.number, tint: T.number,
        exposure: T.number, bloom: T.number, chromatic: T.number,
        hue: T.number, vibrance: T.number, gamma: T.number,
        maskColor: T.string
	}

	getDefaultProps(): LuminaImageShape['props'] {
		return { 
            w: 800, h: 500, url: '', vaultId: '', 
            brightness: 1, contrast: 1, saturation: 1, grain: 0, blur: 0,
            opacity: 1, blendMode: 'normal', isScanning: false,
            twirl: 0, bulge: 0, rgbSplit: 0, vignette: 0, sharpness: 0,
            face_radius: 0.2, face_center_x: 0.5, face_center_y: 0.5,
            temperature: 0, tint: 0, exposure: 0, bloom: 0, chromatic: 0,
            hue: 0, vibrance: 1, gamma: 1, maskColor: '#4f46e5'
        }
	}

	getGeometry(shape: LuminaImageShape) {
		return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
	}

	component(shape: LuminaImageShape) {
		const containerRef = useRef<HTMLDivElement>(null);
		const appRef = useRef<PIXI.Application | null>(null);
		const spriteRef = useRef<PIXI.Sprite | null>(null);
        const textureCacheRef = useRef<string | null>(null);

        // 1. Initialize Pixi App (Run Once)
		useLayoutEffect(() => {
			if (!containerRef.current) return;
            let active = true;

			const app = new PIXI.Application();
			
            const init = async () => {
                await app.init({
                    width: shape.props.w,
                    height: shape.props.h,
                    backgroundAlpha: 0,
                    antialias: true,
                    preference: 'webgl', // Ensure WebGL for shader compatibility
                    resolution: window.devicePixelRatio || 2
                });

                if (!active) { app.destroy(); return; }
				containerRef.current?.appendChild(app.canvas);
				appRef.current = app;
                
                // Add ticker for animations
                app.ticker.add(() => {
                    // Force re-render if needed, though Pixi auto-renders usually
                    // We update time uniform here for grain/scanlines
                    if (spriteRef.current && spriteRef.current.filters) {
                        const filter = spriteRef.current.filters[0] as any;
                        if (filter?.resources?.cinemaUniforms?.uniforms) {
                            filter.resources.cinemaUniforms.uniforms.uTime = performance.now() / 1000;
                        }
                    }
                });
			};

			init();

			return () => { 
                active = false;
                if (appRef.current) {
                    appRef.current.destroy(true, { children: true, texture: false });
                    appRef.current = null;
                }
            };
		}, []);

        // 2. Load Texture & Handle Updates
        // We separate texture loading to avoid reloading when only sliders change
        useEffect(() => {
            const app = appRef.current;
            if (!app || !shape.props.url) return;
            
            if (textureCacheRef.current === shape.props.url && spriteRef.current) {
                // Just update props if URL hasn't changed
                updateVisuals(app, shape.props);
                return;
            }

            const loadTexture = async () => {
                try {
                    const texture = await PIXI.Assets.load(shape.props.url);
                    if (!app.renderer) return;

                    // Clean old sprite
                    if (spriteRef.current) {
                        app.stage.removeChild(spriteRef.current);
                        spriteRef.current.destroy();
                    }

                    const sprite = new PIXI.Sprite(texture);
                    sprite.anchor.set(0.5);
                    sprite.x = shape.props.w / 2;
                    sprite.y = shape.props.h / 2;
                    
                    app.stage.addChild(sprite);
                    spriteRef.current = sprite;
                    textureCacheRef.current = shape.props.url;
                    
                    updateVisuals(app, shape.props);
                } catch (e) {
                    console.error("Texture Load Error", e);
                }
            };
            
            loadTexture();
        }, [shape.props.url, appRef.current]);

        // 3. Slider Updates (Fast Path)
        useEffect(() => {
            if (appRef.current && spriteRef.current) {
                updateVisuals(appRef.current, shape.props);
            }
        }, [shape.props]); // React to ANY prop change

        const updateVisuals = (app: PIXI.Application, props: any) => {
            if (!spriteRef.current) return;
            const sprite = spriteRef.current;

            // Resize handling
            if (app.renderer.width !== props.w || app.renderer.height !== props.h) {
                app.renderer.resize(props.w, props.h);
                sprite.x = props.w / 2;
                sprite.y = props.h / 2;
            }

            // Omni-Scale V2: Letterbox/Contain logic to avoid clipping
            // We calculate scale to fit the container bounds
            if (sprite.texture) {
                const scaleX = props.w / sprite.texture.width;
                const scaleY = props.h / sprite.texture.height;
                const scale = Math.min(scaleX, scaleY); // Contain
                sprite.scale.set(scale);
            }

            // Apply Shader Props
            LuminaShaderEngine.applyStack(sprite, props);
        };

        return (
            <HTMLContainer 
                id={shape.id} 
                style={{ 
                    pointerEvents: 'all', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    backgroundColor: '#050505', 
                    opacity: shape.props.opacity ?? 1,
                    mixBlendMode: (shape.props.blendMode as any) || 'normal'
                }}
            >
                <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            </HTMLContainer>
        );
    }
    
    indicator(shape: LuminaImageShape) { return <rect width={shape.props.w} height={shape.props.h} /> }
}
