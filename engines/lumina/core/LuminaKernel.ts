
import * as PIXI from 'pixi.js';
import { type CanvasKit } from 'canvaskit-wasm';

export class LuminaKernel {
  private pixiApp: PIXI.Application;
  private canvasKit: CanvasKit | null = null;

  constructor() {
    this.pixiApp = new PIXI.Application();
  }

  async initialize(container: HTMLElement) {
    await this.pixiApp.init({
      resizeTo: container,
      backgroundAlpha: 0,
      antialias: true,
      preference: 'webgpu'
    });
    container.appendChild(this.pixiApp.canvas);
    console.log('Lumina Kernel: PixiJS v8 Initialized (WebGPU preferred)');
  }

  destroy() {
    this.pixiApp.destroy(true, { children: true, texture: true });
  }
}
