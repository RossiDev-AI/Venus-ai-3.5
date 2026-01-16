
import {
	ShapeUtil,
	TLBaseShape,
	HTMLContainer,
	Rectangle2d,
} from 'tldraw'
import { getStroke } from 'perfect-freehand'
import { getSvgPathFromStroke } from '../../utils/maskUtils'
import React from 'react'

export type LuminaMaskShape = TLBaseShape<
	'lumina-mask',
	{
		points: number[][],
		color: string,
		isPen: boolean
	}
>

export class LuminaMaskShapeUtil extends ShapeUtil<LuminaMaskShape> {
	static type = 'lumina-mask' as const

	getDefaultProps(): LuminaMaskShape['props'] {
		return {
			points: [],
			color: '#f43f5e',
			isPen: false
		}
	}

	getGeometry(shape: LuminaMaskShape) {
		const points = shape.props.points
		if (points.length < 1) return new Rectangle2d({ width: 1, height: 1, isFilled: true })
		
		// Calcular bounds manualmente para a geometria de colisão
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
		for (const [x, y] of points) {
			if (x < minX) minX = x; if (y < minY) minY = y;
			if (x > maxX) maxX = x; if (y > maxY) maxY = y;
		}

		return new Rectangle2d({
			x: minX,
			y: minY,
			width: Math.max(1, maxX - minX),
			height: Math.max(1, maxY - minY),
			isFilled: true,
		})
	}

	component(shape: LuminaMaskShape) {
		const { points, color } = shape.props
		if (points.length < 2) return null

		const stroke = getStroke(points, {
			size: 16,
			thinning: 0.5,
			smoothing: 0.5,
			streamline: 0.5,
			easing: (t) => t,
			simulatePressure: !shape.props.isPen,
			last: true,
			start: { cap: true, taper: 0 },
			end: { cap: true, taper: 0 },
		})

		const d = getSvgPathFromStroke(stroke)

		return (
			<HTMLContainer
				id={shape.id}
				style={{ pointerEvents: 'none', overflow: 'visible' }}
			>
				<svg style={{ position: 'absolute', top: 0, left: 0, width: '10000px', height: '10000px', overflow: 'visible' }}>
					<path
						d={d}
						fill={color}
						stroke="none"
						fillOpacity="0.5"
					/>
				</svg>
			</HTMLContainer>
		)
	}

	indicator(shape: LuminaMaskShape) {
		return null
	}
}
