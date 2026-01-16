
import * as PIXI from 'pixi.js';

export class CloneStampManager {
    public sourcePoint: PIXI.Point | null = null;
    public size: number = 50;
    public hardness: number = 0.5;
    public opacity: number = 1.0;
    
    // Shader de Preview
    private previewMesh: PIXI.Mesh | null = null;

    constructor() {}

    /**
     * Define o ponto de origem para o carimbo (Amostragem)
     */
    setSource(x: number, y: number) {
        this.sourcePoint = new PIXI.Point(x, y);
    }

    /**
     * Cria ou atualiza o cursor de preview que mostra o que será carimbado
     */
    getPreviewMesh(texture: PIXI.Texture): PIXI.Mesh {
        if (this.previewMesh) return this.previewMesh;

        const geometry = new PIXI.PlaneGeometry(1, 1, 1, 1);
        const shader = PIXI.Shader.from({
            gl: {
                vertex: `
                    precision highp float;
                    attribute vec2 aPosition;
                    attribute vec2 aUV;
                    uniform mat3 projectionMatrix;
                    uniform mat3 worldTransformMatrix;
                    varying vec2 vUV;
                    void main() {
                        vUV = aUV;
                        gl_Position = vec4((projectionMatrix * worldTransformMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
                    }
                `,
                fragment: `
                    precision highp float;
                    varying vec2 vUV;
                    uniform sampler2D uSampler;
                    uniform vec2 uSourceOffset; // Offset UV
                    uniform float uHardness;
                    uniform float uOpacity;

                    void main() {
                        vec2 sampleUV = vUV + uSourceOffset;
                        vec4 color = texture2D(uSampler, sampleUV);
                        
                        // Máscara circular com hardness
                        float dist = distance(vUV, vec2(0.5));
                        float alpha = smoothstep(0.5, 0.5 - uHardness * 0.5, dist);
                        
                        gl_FragColor = color * alpha * uOpacity;
                    }
                `
            }
        });

        this.previewMesh = new PIXI.Mesh({ geometry, shader, texture });
        return this.previewMesh;
    }

    updatePreview(mouseX: number, mouseY: number, sprite: PIXI.Sprite) {
        if (!this.previewMesh || !this.sourcePoint) return;

        this.previewMesh.width = this.size;
        this.previewMesh.height = this.size;
        this.previewMesh.x = mouseX;
        this.previewMesh.y = mouseY;

        // Calcular offset UV relativo à textura
        const dx = (this.sourcePoint.x - mouseX) / sprite.width;
        const dy = (this.sourcePoint.y - mouseY) / sprite.height;

        const uniforms = (this.previewMesh.shader as any).resources.uniforms || (this.previewMesh.shader as any).uniformGroup.uniforms;
        uniforms.uSourceOffset = [dx, dy];
        uniforms.uHardness = this.hardness;
        uniforms.uOpacity = this.opacity;
    }
}

export const cloneStampManager = new CloneStampManager();
