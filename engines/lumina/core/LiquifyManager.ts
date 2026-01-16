
import * as PIXI from 'pixi.js';

export type LiquifyMode = 'warp' | 'pinch' | 'bulge';

export class LiquifyManager {
    private mesh: PIXI.Mesh | null = null;
    private originalVertices: Float32Array | null = null;
    private vertices: Float32Array | null = null;
    private rows: number = 50;
    private cols: number = 50;

    constructor() {}

    /**
     * Cria uma malha deformável a partir de uma textura PixiJS.
     */
    createMesh(texture: PIXI.Texture, width: number, height: number): PIXI.Mesh {
        const geometry = new PIXI.PlaneGeometry(width, height, this.cols, this.rows);
        this.mesh = new PIXI.Mesh({
            geometry,
            texture,
            shader: PIXI.Shader.from({
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
                        void main() {
                            gl_FragColor = texture2D(uSampler, vUV);
                        }
                    `
                }
            })
        });

        // Armazenar referências para manipulação
        const posBuffer = geometry.getBuffer('aPosition');
        this.originalVertices = new Float32Array(posBuffer.data as Float32Array);
        this.vertices = posBuffer.data as Float32Array;

        return this.mesh;
    }

    /**
     * Aplica deformação baseada no movimento do cursor.
     */
    applyDeformation(
        mouseX: number, 
        mouseY: number, 
        prevX: number, 
        prevY: number, 
        radius: number, 
        strength: number, 
        mode: LiquifyMode
    ) {
        if (!this.vertices || !this.mesh) return;

        // Converter coordenadas globais para locais da malha
        const localMouse = this.mesh.worldTransform.applyInverse({ x: mouseX, y: mouseY });
        const localPrev = this.mesh.worldTransform.applyInverse({ x: prevX, y: prevY });
        const moveX = localMouse.x - localPrev.x;
        const moveY = localMouse.y - localPrev.y;

        const vertices = this.vertices;
        const radiusSq = radius * radius;

        for (let i = 0; i < vertices.length; i += 2) {
            const vx = vertices[i];
            const vy = vertices[i + 1];

            const dx = localMouse.x - vx;
            const dy = localMouse.y - vy;
            const distSq = dx * dx + dy * dy;

            if (distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                // Função de atenuação (Bell curve)
                const falloff = Math.pow(1.0 - dist / radius, 2);
                const effect = falloff * strength;

                if (mode === 'warp') {
                    vertices[i] += moveX * effect;
                    vertices[i + 1] += moveY * effect;
                } else if (mode === 'pinch') {
                    vertices[i] += dx * effect * 0.1;
                    vertices[i + 1] += dy * effect * 0.1;
                } else if (mode === 'bulge') {
                    vertices[i] -= dx * effect * 0.1;
                    vertices[i + 1] -= dy * effect * 0.1;
                }
            }
        }

        // Marcar buffer como sujo para upload na GPU
        this.mesh.geometry.getBuffer('aPosition').update();
    }

    reset() {
        if (this.vertices && this.originalVertices && this.mesh) {
            this.vertices.set(this.originalVertices);
            this.mesh.geometry.getBuffer('aPosition').update();
        }
    }

    getMesh() { return this.mesh; }
}

export const liquifyManager = new LiquifyManager();
