
import * as PIXI from 'pixi.js';
import { TLShapeId } from 'tldraw';

export class PatchToolManager {
    public selectionPoints: PIXI.Point[] = [];
    public isDragging: boolean = false;
    public offset: PIXI.Point = new PIXI.Point(0, 0);
    public diffusion: number = 0.5;
    
    private selectionGraphic: PIXI.Graphics | null = null;
    private previewSprite: PIXI.Sprite | null = null;
    private sourceTexture: PIXI.RenderTexture | null = null;

    constructor() {}

    /**
     * Inicia uma nova seleção de laço.
     */
    beginSelection() {
        this.selectionPoints = [];
        this.offset.set(0, 0);
    }

    addPoint(x: number, y: number) {
        this.selectionPoints.push(new PIXI.Point(x, y));
    }

    /**
     * Cria o gráfico visual da área selecionada.
     */
    getSelectionGraphic(): PIXI.Graphics {
        if (!this.selectionGraphic) {
            this.selectionGraphic = new PIXI.Graphics();
        }
        this.updateGraphic();
        return this.selectionGraphic;
    }

    private updateGraphic() {
        if (!this.selectionGraphic || this.selectionPoints.length < 2) return;
        this.selectionGraphic.clear();
        this.selectionGraphic.lineStyle(1, 0x4f46e5, 1);
        this.selectionGraphic.beginFill(0x4f46e5, 0.2);
        this.selectionGraphic.moveTo(this.selectionPoints[0].x, this.selectionPoints[0].y);
        for (let i = 1; i < this.selectionPoints.length; i++) {
            this.selectionGraphic.lineTo(this.selectionPoints[i].x, this.selectionPoints[i].y);
        }
        this.selectionGraphic.closePath();
        this.selectionGraphic.endFill();
    }

    /**
     * Prepara o preview flutuante da área de patch.
     */
    createPreview(app: PIXI.Application, sprite: PIXI.Sprite) {
        if (this.selectionPoints.length < 3) return;

        // Criar máscara baseada na seleção
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.moveTo(this.selectionPoints[0].x, this.selectionPoints[0].y);
        for (let i = 1; i < this.selectionPoints.length; i++) {
            mask.lineTo(this.selectionPoints[i].x, this.selectionPoints[i].y);
        }
        mask.closePath();
        mask.endFill();

        // Capturar a textura da área selecionada
        const bounds = mask.getBounds();
        this.sourceTexture = PIXI.RenderTexture.create({ width: bounds.width, height: bounds.height });
        
        const matrix = new PIXI.Matrix();
        matrix.translate(-bounds.x, -bounds.y);
        
        // Renderizar o sprite original através da máscara
        const container = new PIXI.Container();
        container.addChild(mask);
        sprite.mask = mask;
        app.renderer.render({ container: sprite, target: this.sourceTexture, transform: matrix });
        sprite.mask = null;

        this.previewSprite = new PIXI.Sprite(this.sourceTexture);
        this.previewSprite.alpha = 0.7;
        this.previewSprite.x = bounds.x;
        this.previewSprite.y = bounds.y;
        
        app.stage.addChild(this.previewSprite);
    }

    updatePreviewPosition(dx: number, dy: number) {
        if (!this.previewSprite) return;
        this.previewSprite.x += dx;
        this.previewSprite.y += dy;
        this.offset.x += dx;
        this.offset.y += dy;
    }

    clear() {
        if (this.selectionGraphic) this.selectionGraphic.clear();
        if (this.previewSprite) {
            this.previewSprite.parent?.removeChild(this.previewSprite);
            this.previewSprite.destroy();
            this.previewSprite = null;
        }
        this.selectionPoints = [];
    }
}

export const patchToolManager = new PatchToolManager();
