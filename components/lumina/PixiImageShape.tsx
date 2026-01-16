
import {
	BaseBoxShapeUtil,
	HTMLContainer,
	TLBaseShape,
    T,
} from 'tldraw'
import * as PIXI from 'pixi.js'
import React, { useLayoutEffect, useRef } from 'react'

// --- Shape Definition ---
export type PixiImageShape = TLBaseShape<
	'pixi-image',
	{
		w: number
		h: number
        url: string
        filters: {
            brightness: number
            contrast: number
            blur: number
        }
	}
>

// --- Shape Util ---
export class PixiImageShapeUtil extends BaseBoxShapeUtil<PixiImageShape> {
	static type = 'pixi-image' as const
    
    getDefaultProps(): PixiImageShape['props'] {
		return {
			w: 600,
			h: 400,
            url: '',
            filters: { brightness: 1, contrast: 1, blur: 0 }
		}
	}

    component(shape: PixiImageShape) {
        const containerRef = useRef<HTMLDivElement>(null);
        const appRef = useRef<PIXI.Application | null>(null);
        const spriteRef = useRef<PIXI.Sprite | null>(null);

        // --- Pixi Lifecycle ---
        useLayoutEffect(() => {
            if (!containerRef.current) return;
            let mounted = true;

            const app = new PIXI.Application();

            const init = async () => {
                await app.init({
                    width: shape.props.w,
                    height: shape.props.h,
                    backgroundAlpha: 0,
                    preference: 'webgpu', // V-nus 2.0 standard
                    antialias: true,
                });

                if (!mounted) {
                    app.destroy(true);
                    return;
                }

                containerRef.current?.appendChild(app.canvas);
                appRef.current = app;

                if (shape.props.url) {
                    try {
                        const texture = await PIXI.Assets.load(shape.props.url);
                        if (!mounted) return;
                        
                        const sprite = new PIXI.Sprite(texture);
                        sprite.width = shape.props.w;
                        sprite.height = shape.props.h;
                        
                        // Add Filters
                        const colorMatrix = new PIXI.ColorMatrixFilter();
                        const blurFilter = new PIXI.BlurFilter();
                        sprite.filters = [colorMatrix, blurFilter];

                        app.stage.addChild(sprite);
                        spriteRef.current = sprite;
                        
                        // Apply initial props
                        updateVisuals(shape.props, colorMatrix, blurFilter);
                    } catch (err) {
                        console.error("Pixi Texture Load Error", err);
                    }
                }
            };

            init();

            return () => {
                mounted = false;
                if (appRef.current) {
                    appRef.current.destroy(true, { children: true, texture: false }); // Keep texture in cache for speed
                    appRef.current = null;
                }
            };
        }, []);

        // --- Reactive Updates ---
        useLayoutEffect(() => {
            const app = appRef.current;
            const sprite = spriteRef.current;
            
            if (app && sprite) {
                // Resize
                if (app.renderer.width !== shape.props.w || app.renderer.height !== shape.props.h) {
                    app.renderer.resize(shape.props.w, shape.props.h);
                    sprite.width = shape.props.w;
                    sprite.height = shape.props.h;
                }

                // Update Filters
                if (sprite.filters && sprite.filters.length >= 2) {
                    const cm = sprite.filters[0] as PIXI.ColorMatrixFilter;
                    const bf = sprite.filters[1] as PIXI.BlurFilter;
                    updateVisuals(shape.props, cm, bf);
                }
            }
        }, [shape.props]);

        const updateVisuals = (props: PixiImageShape['props'], cm: PIXI.ColorMatrixFilter, bf: PIXI.BlurFilter) => {
            cm.reset();
            cm.brightness(props.filters.brightness, false);
            cm.contrast(props.filters.contrast, true);
            bf.strength = props.filters.blur;
        };

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    pointerEvents: 'all',
                    overflow: 'hidden',
                    display: 'flex',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: '#050505'
                }}
            >
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            </HTMLContainer>
        );
    }

	indicator(shape: PixiImageShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}
