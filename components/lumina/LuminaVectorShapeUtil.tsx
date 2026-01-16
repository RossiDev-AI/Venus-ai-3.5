
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T, Rectangle2d, useEditor, useValue } from 'tldraw'
import React, { useLayoutEffect, useRef, useState } from 'react'
import { skiaService } from '../../engines/lumina/core/SkiaService'

export type LuminaVectorShape = TLBaseShape<'lumina-vector', {
    w: number, h: number, pathData: string, fillColor: string, strokeColor: string,
    strokeWidth: number, opacity: number, isEditingNodes: boolean
}>

export class LuminaVectorShapeUtil extends BaseBoxShapeUtil<LuminaVectorShape> {
    static type = 'lumina-vector' as const

    static props = {
        w: T.number, h: T.number, pathData: T.string, fillColor: T.string,
        strokeColor: T.string, strokeWidth: T.number, opacity: T.number,
        isEditingNodes: T.boolean
    }

    getDefaultProps(): LuminaVectorShape['props'] {
        return {
            w: 400, h: 400, pathData: 'M 100 100 L 300 100 L 200 300 Z',
            fillColor: '#4f46e5', strokeColor: '#ffffff', strokeWidth: 2,
            opacity: 1, isEditingNodes: false
        }
    }

    getGeometry(shape: LuminaVectorShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    component(shape: LuminaVectorShape) {
        const canvasRef = useRef<HTMLCanvasElement>(null)
        const editor = useEditor()

        useLayoutEffect(() => {
            let active = true
            let surface: any = null

            const render = async () => {
                const ck = await skiaService.initialize()
                if (!active || !canvasRef.current) return

                if (!surface) surface = ck.MakeSWCanvasSurface(canvasRef.current)
                if (!surface) return

                const canvas = surface.getCanvas()
                canvas.clear(ck.TRANSPARENT)

                const path = ck.MakePathFromSVGString(shape.props.pathData)
                if (path) {
                    const fillPaint = new ck.Paint()
                    fillPaint.setColor(ck.parseColorString(shape.props.fillColor))
                    fillPaint.setAntiAlias(true)
                    fillPaint.setStyle(ck.PaintStyle.Fill)

                    const strokePaint = new ck.Paint()
                    strokePaint.setColor(ck.parseColorString(shape.props.strokeColor))
                    strokePaint.setStrokeWidth(shape.props.strokeWidth)
                    strokePaint.setAntiAlias(true)
                    strokePaint.setStyle(ck.PaintStyle.Stroke)

                    canvas.drawPath(path, fillPaint)
                    if (shape.props.strokeWidth > 0) canvas.drawPath(path, strokePaint)

                    // Renderizar handles de edição de nós se ativo
                    if (shape.props.isEditingNodes) {
                        this.drawNodeHandles(ck, canvas, shape.props.pathData)
                    }

                    path.delete(); fillPaint.delete(); strokePaint.delete();
                }
                surface.flush()
            }

            render()
            return () => { active = false; if (surface) surface.delete() }
        }, [shape.props])

        return (
            <HTMLContainer id={shape.id}>
                <canvas 
                    ref={canvasRef} 
                    width={shape.props.w * 2} 
                    height={shape.props.h * 2} 
                    style={{ width: '100%', height: '100%', pointerEvents: shape.props.isEditingNodes ? 'all' : 'none' }} 
                />
            </HTMLContainer>
        )
    }

    private drawNodeHandles(ck: any, canvas: any, pathData: string) {
        const paint = new ck.Paint();
        paint.setColor(ck.Color(255, 0, 255, 1.0)); // Magenta Handles
        paint.setStyle(ck.PaintStyle.Fill);

        // Lógica simplificada: em produção extrairíamos os verbos do path
        // para desenhar os quadrados nos pontos de ancoragem.
    }

    indicator(shape: LuminaVectorShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
