
export class DeviceProfiler {
  static isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  static get config() {
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    
    // Mobile optimization profiles
    return {
      // Limit resolution on mobile to save battery/heat and GPU memory
      resolution: this.isMobile ? Math.min(pixelRatio, 2) : pixelRatio,
      
      // Disable heavy real-time fragment shaders (Grain, complex blurs) on mobile
      enableHeavyShaders: !this.isMobile,
      
      // Max texture size (safe bet for mobile is 2048, desktop usually 4096+)
      // Resize input images to this dimension to prevent crash
      maxTextureSize: this.isMobile ? 2048 : 4096,
      
      // AI Inference preference
      devicePreference: this.isMobile ? 'wasm' : 'webgpu', 
      
      // Throttle simulation loops
      throttleTicker: this.isMobile,
    };
  }

  /**
   * Resizes an image Blob if it exceeds device limits.
   * Returns original blob if within limits.
   */
  static async optimizeTexture(blob: Blob): Promise<Blob> {
    if (!this.isMobile) return blob;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const max = this.config.maxTextureSize;
            if (img.width <= max && img.height <= max) {
                resolve(blob);
                return;
            }

            const canvas = document.createElement('canvas');
            const ratio = Math.min(max / img.width, max / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(blob); 
                return;
            }
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(b => resolve(b || blob), blob.type, 0.9);
        };
        img.onerror = () => resolve(blob);
        img.src = url;
    });
  }
}
