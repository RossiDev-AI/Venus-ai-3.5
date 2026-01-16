import * as PIXI from 'pixi.js';

const FRAG_SRC = `
    precision highp float;
    in vec2 vTextureCoord;
    out vec4 finalColor;
    uniform sampler2D uSampler;

    uniform struct AdjustmentUniforms {
        float brightness;
        float contrast;
        float saturation;
        float hue;
        vec3 levels; // x: inMin, y: inMax, z: gamma
    } adjustments;

    // Helper: RGB to HSL
    vec3 rgb2hsl(vec3 c) {
        float maxC = max(max(c.r, c.g), c.b);
        float minC = min(min(c.r, c.g), c.b);
        float delta = maxC - minC;
        float l = (maxC + minC) * 0.5;
        float s = 0.0;
        if (delta > 0.0) s = delta / (l < 0.5 ? (maxC + minC) : (2.0 - maxC - minC));
        float h = 0.0;
        if (delta > 0.0) {
            if (maxC == c.r) h = mod((c.g - c.b) / delta, 6.0);
            else if (maxC == c.g) h = (c.b - c.r) / delta + 2.0;
            else h = (c.r - c.g) / delta + 4.0;
            h /= 6.0;
        }
        return vec3(h, s, l);
    }

    // Helper: HSL to RGB
    float hue2rgb(float p, float q, float t) {
        if (t < 0.0) t += 1.0;
        if (t > 1.0) t -= 1.0;
        if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.2) return q;
        if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
        return p;
    }

    vec3 hsl2rgb(vec3 hsl) {
        float h = hsl.x; float s = hsl.y; float l = hsl.z;
        if (s == 0.0) return vec3(l);
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        return vec3(hue2rgb(p, q, h + 1.0/3.0), hue2rgb(p, q, h), hue2rgb(p, q, h - 1.0/3.0));
    }

    void main() {
        vec4 tex = texture(uSampler, vTextureCoord);
        vec3 color = tex.rgb;

        // 1. Levels / Curves Simulation
        color = clamp((color - adjustments.levels.x) / (adjustments.levels.y - adjustments.levels.x), 0.0, 1.0);
        color = pow(color, vec3(1.0 / adjustments.levels.z));

        // 2. Brightness & Contrast
        color = (color - 0.5) * adjustments.contrast + 0.5 + (adjustments.brightness - 1.0);

        // 3. HSL (Hue & Saturation)
        vec3 hsl = rgb2hsl(color);
        hsl.x = mod(hsl.x + adjustments.hue, 1.0);
        hsl.y *= adjustments.saturation;
        color = hsl2rgb(hsl);

        finalColor = vec4(color, tex.a);
    }
`;

export class LuminaAdjustmentFilter extends PIXI.Filter {
    constructor() {
        super({
            gl: { fragment: FRAG_SRC },
            resources: {
                adjustmentUniforms: {
                    brightness: { value: 1.0, type: 'f32' },
                    contrast: { value: 1.0, type: 'f32' },
                    saturation: { value: 1.0, type: 'f32' },
                    hue: { value: 0.0, type: 'f32' },
                    levels: { value: [0.0, 1.0, 1.0], type: 'vec3<f32>' },
                }
            }
        });
    }

    // Fix: Accessing resources via any cast to satisfy TS compiler in Pixi v8 environments
    update(props: any) {
        const u = (this as any).resources.adjustmentUniforms.uniforms;
        u.brightness = props.brightness ?? 1.0;
        u.contrast = props.contrast ?? 1.0;
        u.saturation = props.saturation ?? 1.0;
        u.hue = (props.hue || 0) / 360;
        u.levels = [props.blackPoint ?? 0, props.whitePoint ?? 1, props.gamma ?? 1];
    }
}