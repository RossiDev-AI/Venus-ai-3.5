
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T, Rectangle2d } from 'tldraw';
import React from 'react';

export type LuminaAdjustmentShape = TLBaseShape<'lumina-adjustment', {
    w: number, h: number, filterType: 'grayscale' | 'sepia' | 'curves', intensity: number
}>

export class LuminaAdjustmentShapeUtil extends BaseBoxShapeUtil<LuminaAdjustmentShape> {
    static type = 'lumina-adjustment' as const

    static props = {
        w: T.number,
        h: T.number,
        filterType: T.setEnum(['grayscale', 'sepia', 'curves'] as const),
        intensity: T.number
    }

    getDefaultProps(): LuminaAdjustmentShape['props'] {
        return { w: 400, h: 300, filterType: 'grayscale', intensity: 1.0 }
    }

    getGeometry(shape: LuminaAdjustmentShape) {
        return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true })
    }

    component(shape: LuminaAdjustmentShape) {
        return (
            <HTMLContainer id={shape.id}>
                <div className="w-full h-full border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        Adjustment: {shape.props.filterType}
                    </span>
                </div>
            </HTMLContainer>
        )
    }

    indicator(shape: LuminaAdjustmentShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}
