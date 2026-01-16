
import { StateNode, TLEventHandlers, createShapeId } from 'tldraw'

export class LuminaMaskTool extends StateNode {
	static id = 'lumina-mask'

    private currentShapeId: any = null;

	onEnter = () => {
		(this as any).editor.setCursor({ type: 'cross', rotation: 0 })
	}

	onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
        const { x, y, z } = info.point; // z is pressure usually 0-1
        
        this.currentShapeId = createShapeId();
        
        (this as any).editor.createShape({
            id: this.currentShapeId,
            type: 'lumina-mask',
            x: 0, // We draw in absolute coordinates inside the SVG for simplicity in this demo
            y: 0, 
            props: {
                points: [[x, y, info.pressure || 0.5]],
                isPen: info.isPen
            }
        });
	}

	onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
        if (!this.currentShapeId) return;

        const shape = (this as any).editor.getShape(this.currentShapeId);
        if (!shape) return;

        const newPoint = [info.point.x, info.point.y, info.pressure || 0.5];
        
        (this as any).editor.updateShape({
            id: this.currentShapeId,
            type: 'lumina-mask',
            props: {
                points: [...shape.props.points, newPoint]
            }
        });
	}

	onPointerUp: TLEventHandlers['onPointerUp'] = () => {
        this.currentShapeId = null;
        // Optional: Switch back to select tool or stay in mask mode
        // this.editor.setCurrentTool('select'); 
	}
    
    onCancel = () => {
        if (this.currentShapeId) {
            (this as any).editor.deleteShape(this.currentShapeId);
            this.currentShapeId = null;
        }
        (this as any).editor.setCurrentTool('select');
    }
}
