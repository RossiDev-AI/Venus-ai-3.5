
import { StateNode, TLEventHandlers, Editor } from 'tldraw';
import { samBridge } from '../../../services/samBridge';
import { LuminaImageShape } from '../LuminaImageShapeUtil';

export class SmartSelectorTool extends StateNode {
  static id = 'smart-selector';

  onEnter = () => {
    (this as any).editor.setCursor({ type: 'cross', rotation: 0 });
  };

  onPointerDown: TLEventHandlers['onPointerDown'] = async (info) => {
    const editor = (this as any).editor as Editor;
    
    // 1. Raycast to find the shape under cursor
    const hitShape = editor.getShapeAtPoint(editor.inputs.currentPagePoint);
    
    if (hitShape && hitShape.type === 'lumina-image') {
      const shape = hitShape as LuminaImageShape;
      const bounds = editor.getShapePageBounds(shape.id);
      if (!bounds) return;

      // 2. UI Feedback: Show Scanning
      editor.updateShape({
        id: shape.id,
        type: 'lumina-image',
        props: { isScanning: true }
      });

      try {
        // 3. Load Embedding (if not cached)
        // We pass the URL or ID. The bridge handles caching.
        await samBridge.loadImage(shape.props.url, shape.id);

        // 4. Calculate relative coordinates
        // Tldraw point is page space. Map to shape local space [0, w], [0, h]
        const relativeX = info.point.x - bounds.x;
        const relativeY = info.point.y - bounds.y;

        // Scale to intrinsic image size if needed, but SAM bridge handles logic usually.
        // Assuming visual size matches logical size for simplified math:
        
        // 5. Run Segmentation
        const maskBitmap = await samBridge.segmentPoint(
            shape.id, 
            relativeX, 
            relativeY, 
            shape.props.w, 
            shape.props.h
        );

        // 6. Convert Bitmap to Data URL for persistence/display
        const canvas = document.createElement('canvas');
        canvas.width = maskBitmap.width;
        canvas.height = maskBitmap.height;
        canvas.getContext('2d')?.drawImage(maskBitmap, 0, 0);
        const maskUrl = canvas.toDataURL();

        // 7. Update Shape with Mask
        editor.updateShape({
            id: shape.id,
            type: 'lumina-image',
            props: { 
                activeMask: maskUrl,
                isScanning: false 
            }
        });

      } catch (e) {
        console.error("Smart Select Failed:", e);
        editor.updateShape({
            id: shape.id,
            type: 'lumina-image',
            props: { isScanning: false }
        });
      }
    } else {
        // Deselect if clicking empty space
        editor.selectNone();
    }
  };
}
