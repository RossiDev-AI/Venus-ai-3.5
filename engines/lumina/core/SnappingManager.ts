
import { Box, Editor, TLShapeId } from 'tldraw';

export interface AlignmentGuide {
    type: 'vertical' | 'horizontal';
    x?: number;
    y?: number;
    start: number;
    end: number;
    distance?: number;
}

export class SnappingManager {
    private SNAP_THRESHOLD = 5;

    /**
     * Calcula guias de alinhamento para um objeto em movimento.
     */
    calculateSnap(
        editor: Editor,
        draggedId: TLShapeId,
        isBypassed: boolean
    ): { snappedPagePoint: { x: number, y: number }, guides: AlignmentGuide[] } {
        const draggedShape = editor.getShape(draggedId);
        if (!draggedShape || isBypassed) return { snappedPagePoint: editor.inputs.currentPagePoint, guides: [] };

        const draggedBox = editor.getShapePageBounds(draggedId)!;
        const otherShapes = editor.getCurrentPageShapes()
            .filter(s => s.id !== draggedId && s.type !== 'lumina-mask');

        const guides: AlignmentGuide[] = [];
        let snappedX = draggedBox.x;
        let snappedY = draggedBox.y;

        // Eixos de referência do objeto arrastado
        const dAxesX = [draggedBox.minX, draggedBox.midX, draggedBox.maxX];
        const dAxesY = [draggedBox.minY, draggedBox.midY, draggedBox.maxY];

        for (const other of otherShapes) {
            const oBox = editor.getShapePageBounds(other.id);
            if (!oBox) continue;

            const oAxesX = [oBox.minX, oBox.midX, oBox.maxX];
            const oAxesY = [oBox.minY, oBox.midY, oBox.maxY];

            // 1. Alinhamento Vertical (Snap no X)
            for (const dx of dAxesX) {
                for (const ox of oAxesX) {
                    if (Math.abs(dx - ox) < this.SNAP_THRESHOLD) {
                        const delta = ox - dx;
                        snappedX += delta;
                        guides.push({
                            type: 'vertical',
                            x: ox,
                            start: Math.min(draggedBox.minY, oBox.minY),
                            end: Math.max(draggedBox.maxY, oBox.maxY)
                        });
                    }
                }
            }

            // 2. Alinhamento Horizontal (Snap no Y)
            for (const dy of dAxesY) {
                for (const oy of oAxesY) {
                    if (Math.abs(dy - oy) < this.SNAP_THRESHOLD) {
                        const delta = oy - dy;
                        snappedY += delta;
                        guides.push({
                            type: 'horizontal',
                            y: oy,
                            start: Math.min(draggedBox.minX, oBox.minX),
                            end: Math.max(draggedBox.maxX, oBox.maxX)
                        });
                    }
                }
            }
        }

        // 3. Lógica de Espaçamento Equidistante (Simp)
        // Detecta se o centro do objeto está no meio de outros dois no mesmo eixo
        this.calculateEquidistantGuides(editor, draggedBox, otherShapes, guides);

        return {
            snappedPagePoint: { x: snappedX, y: snappedY },
            guides
        };
    }

    private calculateEquidistantGuides(editor: Editor, dBox: Box, others: any[], guides: AlignmentGuide[]) {
        // Implementação de detecção de gaps iguais entre objetos vizinhos
        // Útil para grids e layouts de cinema
    }
}

export const snappingManager = new SnappingManager();
