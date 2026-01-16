
import * as PIXI from 'pixi.js';

const LUMINA_FX_FRAG = `
    precision highp float;
    in vec2 vTextureCoord;
    out vec4 finalColor;
    
    uniform sampler2D uSampler;
    
    uniform CinemaUniforms {
        float uTime;
        float uExposure;
        float uContrast;
        float uSaturation;
        float uChromatic;    // Aberração Cromática
        float uGrain;        // Intensidade do Grão
        float uGrainSize;    // Tamanho do Grão
        float uVignette;     // Escurecimento de bordas
        float uBloom;        // Intensidade do Glow
        float uSharpness;    // Nitidez adaptativa
        float uTemperature;  // Equilíbrio de Branco
        vec2 uCenter;
    } fx;

    // Gerador de ruído para grão de filme
    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main(void) {
        vec2 uv = vTextureCoord;
        vec2 distToCenter = uv - fx.uCenter;
        float d = length(distToCenter);

        // 1. Aberração Cromática (Radial)
        vec4 texColor;
        if (fx.uChromatic > 0.0) {
            float shift = fx.uChromatic * 0.01 * d;
            float r = texture(uSampler, uv + vec2(shift, 0.0)).r;
            float g = texture(uSampler, uv).g;
            float b = texture(uSampler, uv - vec2(shift, 0.0)).b;
            texColor = vec4(r, g, b, texture(uSampler, uv).a);
        } else {
            texColor = texture(uSampler, uv);
        }

        vec3 color = texColor.rgb;

        // 2. Correção Primária (Exp/Cont/Sat)
        color *= pow(2.0, fx.uExposure);
        color = (color - 0.5) * fx.uContrast + 0.5;
        
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luma), color, fx.uSaturation);

        // 3. White Balance (Temperature)
        color.r += fx.uTemperature * 0.1;
        color.b -= fx.uTemperature * 0.1;

        // 4. Bloom (Simulado via Threshold e Expansão)
        if (fx.uBloom > 0.0) {
            vec3 highLights = max(vec3(0.0), color - 0.75);
            color += highLights * fx.uBloom * 2.0;
        }

        // 5. Film Grain (Animado)
        if (fx.uGrain > 0.0) {
            float noise = (rand(uv * fx.uGrainSize + fx.uTime) - 0.5);
            color += noise * fx.uGrain * 0.15;
        }

        // 6. Vignette Dinâmico
        float vignette = smoothstep(0.8, 0.5 - fx.uVignette, d);
        color *= mix(1.0, vignette, fx.uVignette);

        // 7. Sharpness Kernel (Simples)
        if (fx.uSharpness > 0.0) {
            vec3 neighbor = texture(uSampler, uv + vec2(0.001)).rgb;
            color += (color - neighbor) * fx.uSharpness * 0.5;
        }

        finalColor = vec4(color, texColor.a);
    }
`;

export class LuminaShaderEngine {
  static createFilter() {
    return new PIXI.Filter({
        gl: {
            fragment: LUMINA_FX_FRAG
        },
        resources: {
            cinemaUniforms: {
                uTime: { value: 0, type: 'f32' },
                uExposure: { value: 0, type: 'f32' },
                uContrast: { value: 1, type: 'f32' },
                uSaturation: { value: 1, type: 'f32' },
                uChromatic: { value: 0, type: 'f32' },
                uGrain: { value: 0, type: 'f32' },
                uGrainSize: { value: 1, type: 'f32' },
                uVignette: { value: 0, type: 'f32' },
                uBloom: { value: 0, type: 'f32' },
                uSharpness: { value: 0, type: 'f32' },
                uTemperature: { value: 0, type: 'f32' },
                uCenter: { value: [0.5, 0.5], type: 'vec2<f32>' }
            }
        }
    });
  }

  static applyStack(sprite: PIXI.Sprite, props: any) {
    if (!sprite) return;

    let filter = sprite.filters?.[0] as any;
    
    if (!filter || !filter.resources || !filter.resources.cinemaUniforms) {
        filter = this.createFilter();
        sprite.filters = [filter];
    }

    const u = filter.resources.cinemaUniforms.uniforms;
    
    if (u) {
        u.uTime = performance.now() / 1000;
        u.uExposure = (props.brightness || 1) - 1 + (props.exposure || 0);
        u.uContrast = props.contrast ?? 1;
        u.uSaturation = props.saturation ?? 1;
        u.uChromatic = props.chromatic ?? 0;
        u.uGrain = props.grain ?? 0;
        u.uGrainSize = props.grainSize ?? 1.0;
        u.uVignette = props.vignette ?? 0;
        u.uBloom = props.bloom ?? 0;
        u.uSharpness = props.sharpness ?? 0;
        u.uTemperature = (props.temperature || 0) / 100;
        u.uCenter = [0.5, 0.5];
    }
  }
}
