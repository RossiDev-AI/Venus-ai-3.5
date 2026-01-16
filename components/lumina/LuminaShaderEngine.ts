
import * as PIXI from 'pixi.js';

// GLSL 300 ES Fragment Shader for WebGL 2 (Pixi v8 Standard)
const INDUSTRIAL_FRAG = `
    precision highp float;
    in vec2 vTextureCoord;
    out vec4 finalColor;
    
    uniform sampler2D uSampler;
    
    // Uniform Block Definition matches Pixi v8 Resource Structure
    uniform CinemaUniforms {
        vec3 uLift;
        vec3 uGamma_Wheel;
        vec3 uGain;
        float uExposure;
        float uContrast;
        float uSaturation;
        vec2 uTempTint;
        float uGrain;
        float uBlur;
        float uTime;
        float uTwirl;
        float uBulge;
        float uRGBSplit;
        float uVignette;
        float uSharpness;
        float uBloom;
        float uHue;
        float uVibrance;
        float uGlobalGamma;
        vec2 uCenter;
        float uMaskAlpha;
        vec3 uMaskColor;
    } cinema;
    
    // Pseudo-random generator
    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec3 hueShift(vec3 color, float hue) {
        const vec3 k = vec3(0.57735, 0.57735, 0.57735);
        float cosAngle = cos(hue);
        return color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle);
    }

    void main(void) {
        vec2 uv = vTextureCoord;
        vec2 center = vec2(0.5, 0.5); // Default center if uniform fails
        
        // 1. Vortex Twirl (PhysX Engine)
        if (cinema.uTwirl != 0.0) {
            vec2 rel = uv - center;
            float dist = length(rel);
            if (dist < 0.5) {
                float angle = cinema.uTwirl * (1.0 - (dist / 0.5));
                float s = sin(angle);
                float c = cos(angle);
                uv = vec2(c * rel.x - s * rel.y, s * rel.x + c * rel.y) + center;
            }
        }

        // 2. Anamorphic Bulge (Lens Optics)
        if (cinema.uBulge != 0.0) {
            vec2 rel = uv - center;
            float dist = length(rel);
            uv -= center;
            float bulge = 1.0 - dist * 2.0;
            if (bulge > 0.0) {
                uv /= (1.0 + bulge * bulge * cinema.uBulge);
            }
            uv += center;
        }

        // 3. RGB Aberration (Chromatic Drift)
        vec4 texColor;
        if (cinema.uRGBSplit > 0.0) {
            float shift = cinema.uRGBSplit * 0.005;
            float r = texture(uSampler, uv + vec2(shift, 0.0)).r;
            float g = texture(uSampler, uv).g;
            float b = texture(uSampler, uv - vec2(shift, 0.0)).b;
            float a = texture(uSampler, uv).a;
            texColor = vec4(r, g, b, a);
        } else {
            texColor = texture(uSampler, uv);
        }

        vec3 color = texColor.rgb;

        // 4. Industrial Sharpen Kernel (Simplified for perf)
        if (cinema.uSharpness > 0.0) {
            vec3 neighbor = texture(uSampler, uv + vec2(0.002, 0.002)).rgb;
            color += (color - neighbor) * cinema.uSharpness;
        }

        // 5. Advanced Grading Pipeline
        // Exposure
        color *= pow(2.0, cinema.uExposure);
        
        // Contrast
        color = (color - 0.5) * cinema.uContrast + 0.5;
        
        // Hue Shift
        if (cinema.uHue != 0.0) {
            color = hueShift(color, cinema.uHue);
        }

        // Temp / Tint
        color.r += cinema.uTempTint.x * 0.1;
        color.b -= cinema.uTempTint.x * 0.1;
        color.g += cinema.uTempTint.y * 0.1;
        
        // Lift Gamma Gain
        color = cinema.uGain * (color + cinema.uLift * (1.0 - color));
        color = pow(max(color, vec3(0.0)), 1.0 / max(cinema.uGamma_Wheel * cinema.uGlobalGamma, vec3(0.01)));
        
        // Saturation & Vibrance
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        float satFactor = cinema.uSaturation;
        if (cinema.uVibrance != 1.0) {
            float maxColor = max(color.r, max(color.g, color.b));
            float minColor = min(color.r, min(color.g, color.b));
            float colorSat = (maxColor - minColor) / (maxColor + 0.01);
            satFactor *= (1.0 + (cinema.uVibrance - 1.0) * (1.0 - colorSat));
        }
        color = mix(vec3(luma), color, satFactor);

        // 6. Post-Processing
        // Vignette
        float d = distance(uv, center);
        color *= smoothstep(0.8, 0.8 - cinema.uVignette, d);
        
        // Bloom (Simulated via localized brightness boost)
        if (cinema.uBloom > 0.0) {
            vec3 glow = max(vec3(0.0), color - 0.7) * cinema.uBloom * 2.0;
            color += glow;
        }

        // Grain
        if (cinema.uGrain > 0.0) {
            float noise = (rand(uv + cinema.uTime) - 0.5);
            color += noise * cinema.uGrain * 0.2;
        }

        // Scanline / Mask Overlay (UI Feedback)
        if (cinema.uMaskAlpha > 0.0) {
             float scan = sin(uv.y * 100.0 + cinema.uTime * 10.0) * 0.05;
             color = mix(color, cinema.uMaskColor, cinema.uMaskAlpha + scan);
        }

        finalColor = vec4(color, texColor.a);
    }
`;

export class LuminaShaderEngine {
  static createFilter() {
    // Pixi v8 Filter Construction
    return new PIXI.Filter({
        gl: {
            fragment: INDUSTRIAL_FRAG
        },
        resources: {
            cinemaUniforms: {
                uLift: { value: [0, 0, 0], type: 'vec3<f32>' },
                uGamma_Wheel: { value: [1, 1, 1], type: 'vec3<f32>' },
                uGain: { value: [1, 1, 1], type: 'vec3<f32>' },
                uExposure: { value: 0, type: 'f32' },
                uContrast: { value: 1, type: 'f32' },
                uSaturation: { value: 1, type: 'f32' },
                uTempTint: { value: [0, 0], type: 'vec2<f32>' },
                uGrain: { value: 0, type: 'f32' },
                uBlur: { value: 0, type: 'f32' },
                uTime: { value: 0, type: 'f32' },
                uTwirl: { value: 0, type: 'f32' },
                uBulge: { value: 0, type: 'f32' },
                uRGBSplit: { value: 0, type: 'f32' },
                uVignette: { value: 0, type: 'f32' },
                uSharpness: { value: 0, type: 'f32' },
                uBloom: { value: 0, type: 'f32' },
                uHue: { value: 0, type: 'f32' },
                uVibrance: { value: 1, type: 'f32' },
                uGlobalGamma: { value: 1, type: 'f32' },
                uCenter: { value: [0.5, 0.5], type: 'vec2<f32>' },
                uMaskAlpha: { value: 0, type: 'f32' },
                uMaskColor: { value: [0.3, 0.3, 1.0], type: 'vec3<f32>' }
            }
        }
    });
  }

  static applyStack(sprite: PIXI.Sprite, props: any) {
    if (!sprite) return;

    // Check if filter already exists on sprite
    let filter = sprite.filters?.[0] as any;
    
    // Lazy init
    if (!filter || !filter.resources || !filter.resources.cinemaUniforms) {
        filter = this.createFilter();
        sprite.filters = [filter];
    }

    // Update Uniforms safely
    const uniforms = filter.resources.cinemaUniforms.uniforms;
    
    if (uniforms) {
        // Mapping Props to Shader Uniforms
        uniforms.uLift = [0, 0, 0]; // Simpler mapping for now
        uniforms.uGamma_Wheel = [1, 1, 1];
        uniforms.uGain = [1, 1, 1];
        
        uniforms.uExposure = (props.brightness - 1) + (props.exposure || 0); // Center at 0
        uniforms.uContrast = props.contrast ?? 1;
        uniforms.uSaturation = props.saturation ?? 1;
        
        uniforms.uTempTint = [props.temperature || 0, props.tint || 0];
        
        uniforms.uGrain = props.grain || 0;
        uniforms.uTwirl = props.twirl || 0;
        uniforms.uBulge = props.bulge || 0;
        uniforms.uRGBSplit = props.rgbSplit || 0;
        uniforms.uVignette = props.vignette || 0;
        uniforms.uSharpness = props.sharpness || 0;
        uniforms.uBloom = props.bloom || 0;
        uniforms.uHue = ((props.hue || 0) * Math.PI) / 180;
        uniforms.uVibrance = props.vibrance ?? 1;
        uniforms.uGlobalGamma = props.gamma ?? 1;
        
        // Handling Scan Effect
        if (props.isScanning) {
            uniforms.uMaskAlpha = 0.3;
            // Convert hex string to vec3 if needed, default mostly blue for now
            uniforms.uMaskColor = [0.2, 0.4, 1.0]; 
        } else {
            uniforms.uMaskAlpha = 0.0;
        }

        // Time update is handled by the Ticker in the ShapeUtil, but we can sync here if manual
        uniforms.uTime = performance.now() / 1000;
    }
  }
}
