
import * as PIXI from 'pixi.js';

export class LuminaBaseFilter extends PIXI.Filter {
  constructor() {
    super({
      gl: {
        vertex: PIXI.Filter.defaultVertex,
        fragment: `
          precision highp float;
          in vec2 vTextureCoord;
          out vec4 finalColor;
          uniform sampler2D uSampler;
          void main() {
            finalColor = texture(uSampler, vTextureCoord);
          }
        `
      }
    });
  }
}
