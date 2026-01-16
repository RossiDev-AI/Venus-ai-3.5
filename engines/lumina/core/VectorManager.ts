
import { skiaService } from './SkiaService';
import { type CanvasKit, type Path } from 'canvaskit-wasm';

export enum PathfinderOp {
    UNION,
    INTERSECT,
    DIFFERENCE,
    XOR,
    REVERSE_DIFFERENCE
}

export class VectorManager {
    /**
     * Executa operações booleanas entre dois caminhos Skia.
     */
    async combinePaths(pathAStr: string, pathBStr: string, op: PathfinderOp): Promise<string | null> {
        const ck = await skiaService.initialize();
        const path1 = ck.MakePathFromSVGString(pathAStr);
        const path2 = ck.MakePathFromSVGString(pathBStr);

        if (!path1 || !path2) return null;

        let skOp;
        switch (op) {
            case PathfinderOp.UNION: skOp = ck.PathOp.Union; break;
            case PathfinderOp.INTERSECT: skOp = ck.PathOp.Intersect; break;
            case PathfinderOp.DIFFERENCE: skOp = ck.PathOp.Difference; break;
            case PathfinderOp.XOR: skOp = ck.PathOp.XOR; break;
            default: skOp = ck.PathOp.Union;
        }

        const resultPath = ck.MakePathOp(path1, path2, skOp);
        if (!resultPath) return null;

        const svgData = resultPath.toSVGString();
        
        path1.delete();
        path2.delete();
        resultPath.delete();

        return svgData;
    }

    /**
     * Converte formas básicas de SVG (rect, circle) em Path puro para edição de nós.
     */
    async normalizeToPath(svgElement: string): Promise<string> {
        const ck = await skiaService.initialize();
        // Lógica de conversão interna do Skia
        return svgElement; // Simplificado para o exemplo
    }
}

export const vectorManager = new VectorManager();
