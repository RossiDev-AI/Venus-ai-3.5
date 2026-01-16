
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T, Rectangle2d, useEditor, useValue } from 'tldraw'
import React, { useLayoutEffect, useRef } from 'react'
import { skiaService } from '../../engines/lumina/core/SkiaService'
import { type CanvasKit, type Canvas, type Paint, type Font } from 'canvaskit-wasm'

export type SkiaTextShape = TLBaseShape<'skia-text', {
    w: number, h: number, text: string, fontFamily: string, fontSize: number,
    letterSpacing: number, lineHeight: number, color: string,
    strokeWidth: number, strokeColor: string, shadowBlur: number,
    shadowColor: string, glowBlur: number, glowColor: string,
    pathSvg: string, textAlign: 'left' | 'center' | 'right',
    isVectorized: boolean
}>

export class SkiaTextShapeUtil extends BaseBoxShapeUtil<SkiaTextShape> {
    static type = 'skia-text' as const

    static props = {
        w: T.number, h: T.number, text: T.string, fontFamily: T.string,
        fontSize: T.number, letterSpacing: T.number, lineHeight: T.number,
        color: T.string, strokeWidth: T.number, strokeColor: T.string,
        shadowBlur: T.number, shadowColor: T.string, glowBlur: T.number,
        glowColor: T.string, pathSvg: T.string,
        textAlign: T.setEnum(['left', 'center', 'right'] as const),
        isVectorized: T.boolean
    }

    getDefaultProps(): SkiaTextShape['props'] {
        return {
            w: 400, h: 200, text: 'LUMINA TYPOGRAPHY', fontFamily: 'Inter',
            fontSize: 48, letterSpacing: 0, lineHeight: 1.2, color: '#ffffff',
            strokeWidth: 0, strokeColor: '#000000', shadowBlur: 0,
            shadowColor: 'rgba(0,0,0,0.5)', glowBlur: 0, glowColor: '#4f46e5',
            pathSvg: '', textAlign: 'center', isVectorized: false
        }
    }

    getGeometry(shape: SkiaTextShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    component(shape: SkiaTextShape) {
        const editor = useEditor()
        const containerRef = useRef<HTMLDivElement>(null)
        const canvasRef = useRef<HTMLCanvasElement>(null)

        useLayoutEffect(() => {
            let active = true
            let surface: any = null

            const render = async () => {
                const ck = await skiaService.initialize()
                if (!active || !canvasRef.current) return

                if (!surface) {
                    // Use Software Renderer to avoid WebGL context limit crashes
                    surface = ck.MakeSWCanvasSurface(canvasRef.current)
                }

                if (!surface) return

                const canvas = surface.getCanvas()
                canvas.clear(ck.TRANSPARENT)

                const typeface = skiaService.getTypeface(shape.props.fontFamily) || ck.Typeface.GetDefault()
                const font = new ck.Font(typeface, shape.props.fontSize)
                
                const paint = new ck.Paint()
                paint.setColor(ck.parseColorString(shape.props.color))
                paint.setAntiAlias(true)

                if (shape.props.pathSvg) {
                    const path = ck.MakePathFromSVGString(shape.props.pathSvg)
                    if (path) {
                        this.drawTextOnPath(ck, canvas, shape.props, font, paint, path)
                    }
                } else {
                    canvas.drawText(shape.props.text, 10, shape.props.fontSize, paint, font)
                }

                surface.flush()
            }

            render()
            return () => { active = false; if (surface) surface.delete() }
        }, [shape.props])

        // Safely check editing state with useValue
        const isEditing = useValue(
            'isEditing',
            () => editor.getEditingShapeId() === shape.id,
            [editor, shape.id]
        )

        return (
            <HTMLContainer id={shape.id}>
                <canvas 
                    ref={canvasRef} 
                    width={shape.props.w * 2} 
                    height={shape.props.h * 2} 
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }} 
                />
                {isEditing && (
                    <textarea 
                        className="absolute inset-0 bg-transparent text-transparent border-none outline-none resize-none caret-white"
                        style={{ 
                            fontSize: shape.props.fontSize, 
                            fontFamily: shape.props.fontFamily, 
                            lineHeight: shape.props.lineHeight,
                            width: shape.props.w,
                            height: shape.props.h,
                            padding: '10px'
                        }}
                        autoFocus
                        value={shape.props.text}
                        onChange={(e) => editor.updateShape({ id: shape.id, type: 'skia-text', props: { text: e.target.value } })}
                        onBlur={() => editor.setEditingShape(null)}
                    />
                )}
            </HTMLContainer>
        )
    }

    private drawTextOnPath(ck: CanvasKit, canvas: Canvas, props: any, font: Font, paint: Paint, path: any) {
        const text = props.text
        const pathIter = new ck.PathMeasure(path, false)
        const totalLen = pathIter.getLength()
        
        let currentPos = 0
        if (props.textAlign === 'center') {
            const textWidth = font.getGlyphWidths(font.getGlyphIDs(text)).reduce((a, b) => a + b, 0)
            currentPos = (totalLen - textWidth) / 2
        }

        for (let i = 0; i < text.length; i++) {
            const char = text[i]
            const charWidth = font.getGlyphWidths(font.getGlyphIDs(char))[0]
            
            if (currentPos + charWidth / 2 > totalLen) break

            const posTan = pathIter.getPosTan(currentPos + charWidth / 2)
            if (posTan) {
                canvas.save()
                canvas.translate(posTan[0], posTan[1])
                canvas.rotate((Math.atan2(posTan[3], posTan[2]) * 180) / Math.PI, 0, 0)
                canvas.drawText(char, -charWidth / 2, 0, paint, font)
                canvas.restore()
            }
            currentPos += charWidth + props.letterSpacing
        }
    }

    indicator(shape: SkiaTextShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
