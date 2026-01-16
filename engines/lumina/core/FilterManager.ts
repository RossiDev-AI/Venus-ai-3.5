
import * as PIXI from 'pixi.js';
import { TLShapeId } from 'tldraw';
import { LuminaAdjustmentFilter } from '../filters/LuminaAdjustmentFilter';

export class FilterManager {
    private filterCache: Map<TLShapeId, any> = new Map();

    applyFilters(sprite: PIXI.Sprite, id: TLShapeId, props: any) {
        let filter = this.filterCache.get(id);

        if (!filter) {
            filter = new LuminaAdjustmentFilter();
            this.filterCache.set(id, filter);
        }

        // Se for uma camada de ajuste, podemos adicionar lógica específica
        if (props.filterType === 'grayscale') {
            const matrix = new PIXI.ColorMatrixFilter();
            matrix.greyscale(props.intensity || 1, false);
            sprite.filters = [matrix];
            return;
        }

        filter.update(props);
        sprite.filters = [filter];
    }
}

export const filterManager = new FilterManager();
