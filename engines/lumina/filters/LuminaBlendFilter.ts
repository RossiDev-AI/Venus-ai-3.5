
import * as PIXI from 'pixi.js';

const BLEND_FRAG = `
    precision highp float;
    in vec2 vTextureCoord;
    out vec4 finalColor;
    uniform sampler2D uSampler; // Camada superior (Blend)
    uniform sampler2D uBackdrop; // Camada inferior (Base)
    uniform int uMode; // 1: Overlay, 2: Soft, 3: Hard, 4: Vivid, 5: Difference
    uniform float uAlpha;

    float blendOverlay(float base, float blend) {
        return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
    }

    float blendVividLight(float base, float blend) {
        if (blend < 0.5) {
            // Color Burn
            return 1.0 - (1.0 - base) / (2.0 * blend + 0.00001);
        } else {
            // Color Dodge
            return base / (2.0 * (1.0 - blend) + 0.00001);
        }
    }

    void main() {
        vec4 top = texture(uSampler, vTextureCoord);
        vec4 base = texture(uBackdrop, vTextureCoord);
        
        vec3 result;
        
        if (uMode == 1) { // Overlay
            result = vec3(blendOverlay(base.r, top.r), blendOverlay(base.g, top.g), blendOverlay(base.b, top.b));
        } else if (uMode == 4) { // Vivid Light
            result = vec3(blendVividLight(base.r, top.r), blendVividLight(base.g, top.g), blendVividLight(base.b, top.b));
        } else if (uMode == 5) { // Difference
            result = abs(base.rgb - top.rgb);
        } else {
            result = top.rgb;
        }

        finalColor = vec4(mix(base.rgb, clamp(result, 0.0, 1.0), uAlpha * top.a), base.a);
    }
`;

export class LuminaBlendFilter extends PIXI.Filter {
    constructor() {
        super({
            gl: { fragment: BLEND_FRAG },
            resources: {
                uBackdrop: PIXI.Texture.EMPTY,
                uMode: 0,
                uAlpha: 1.0
            }
        });
    }

    setMode(mode: string) {
        const modes: Record<string, number> = { 
            'overlay': 1, 'soft-light': 2, 'hard-light': 3, 
            'vivid-light': 4, 'difference': 5 
        };
        (this as any).resources.uMode = modes[mode] || 0;
    }

    setBackdrop(texture: PIXI.Texture) {
        (this as any).resources.uBackdrop = texture;
    }
}
