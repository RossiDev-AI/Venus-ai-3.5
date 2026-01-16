
import * as faceapi from 'face-api';

export class FaceDetectionService {
  private static isLoaded = false;
  private static MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

  static async load() {
    if (this.isLoaded) return;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
    ]);
    this.isLoaded = true;
  }

  static async detectFace(imageElement: HTMLImageElement | string): Promise<{x: number, y: number, width: number, height: number} | null> {
    await this.load();
    
    let el: HTMLImageElement;
    if (typeof imageElement === 'string') {
        el = new Image();
        el.crossOrigin = 'anonymous';
        el.src = imageElement;
        await new Promise(r => el.onload = r);
    } else {
        el = imageElement;
    }

    const detections = await faceapi.detectSingleFace(el, new faceapi.TinyFaceDetectorOptions());
    
    if (!detections) return null;

    const { x, y, width, height } = detections.box;
    // Normalize coordinates to 0-1
    return {
      x: x / el.width,
      y: y / el.height,
      width: width / el.width,
      height: height / el.height
    };
  }
}
