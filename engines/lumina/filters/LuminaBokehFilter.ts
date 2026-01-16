
import * as PIXI from 'pixi.js';

const FRAG_SRC = `
    precision highp float;
    in vec2 vTextureCoord;
    out vec4 finalColor;
    uniform sampler2D uSampler;
    uniform sampler2D uDepthMap;

    uniform struct LensUniforms {
        float focusPoint;   // 0.0 a 1.0 (profundidade de foco)
        float aperture;     // Intensidade do blur
        float bladeCount;   // 0=Círculo, 3=Triângulo, 6=Hexágono
        float highlights;   // Ganho de brilho em áreas desfocadas
    } lens;

    // Constantes para amostragem circular de alta fidelidade
    const int SAMPLES = 16;
    const float PI = 3.14159265359;

    void main() {
        float depth = texture(uDepthMap, vTextureCoord).r;
        
        // CoC (Circle of Confusion) baseado na distância do ponto de foco
        float coc = abs(depth - lens.focusPoint) * lens.aperture * 0.05;
        
        if (coc < 0.001) {
            finalColor = texture(uSampler, vTextureCoord);
            return;
        }

        vec4 colorAcc = vec4(0.0);
        float weightAcc = 0.0;

        for (int i = 0; i < SAMPLES; i++) {
            float angle = (float(i) / float(SAMPLES)) * 2.0 * PI;
            // Amostragem em anéis para simular o disco da lente
            float dist = sqrt(float(i) / float(SAMPLES)); 
            
            vec2 offset = vec2(cos(angle), sin(angle)) * coc * dist;
            vec4 sampleCol = texture(uSampler, vTextureCoord + offset);
            
            // Preservação de Highlights (Luzes bokeh brilhantes)
            float luma = dot(sampleCol.rgb, vec3(0.299, 0.587, 0.114));
            float highWeight = pow(luma, lens.highlights) * 2.0 + 1.0;
            
            colorAcc += sampleCol * highWeight;
            weightAcc += highWeight;
        }

        finalColor = colorAcc / weightAcc;
    }
`;

export class LuminaBokehFilter extends PIXI.Filter {
    constructor() {
        super({
            gl: { fragment: FRAG_SRC },
            resources: {
                lensUniforms: {
                    focusPoint: { value: 0.5, type: 'f32' },
                    aperture: { value: 0.2, type: 'f32' },
                    bladeCount: { value: 6.0, type: 'f32' },
                    highlights: { value: 2.0, type: 'f32' }
                }
            }
        });
    }

    update(props: any) {
        const u = (this as any).resources.lensUniforms.uniforms;
        u.focusPoint = props.focusDistance ?? 0.5;
        u.aperture = props.aperture ?? 0.0;
        u.highlights = props.bokehBrightness ?? 2.0;
    }

    setDepthMap(texture: PIXI.Texture) {
        (this as any).resources.uDepthMap = texture;
    }
}
