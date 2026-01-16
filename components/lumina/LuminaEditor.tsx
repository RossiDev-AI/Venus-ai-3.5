
import React, { useMemo, useState, useCallback } from 'react';
import { Tldraw, useEditor, createShapeId, Editor, TLShapeId, exportToBlob } from 'tldraw';
import { PixiImageShapeUtil, PixiImageShape } from './PixiImageShape';
import { executeGenerativeFill } from '../../services/geminiBridge';

const LuminaEditor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Register custom shapes
  const shapeUtils = useMemo(() => [PixiImageShapeUtil], []);

  // --- Magic Refine Workflow ---
  const handleMagicRefine = async (editor: Editor) => {
    const selected = editor.getSelectedShapes();
    if (selected.length === 0) return;

    // 1. Find the target image (Pixi shape)
    const imageShape = selected.find(s => s.type === 'pixi-image') as PixiImageShape | undefined;
    if (!imageShape) {
        alert("Select the Lumina Image to refine.");
        return;
    }

    // 2. Find the mask strokes (Draw shapes overlapping the image)
    const imageBounds = editor.getShapePageBounds(imageShape.id);
    if (!imageBounds) return;

    const maskShapes = editor.getCurrentPageShapes().filter(s => 
        s.type === 'draw' && 
        editor.getShapePageBounds(s.id)?.collides(imageBounds)
    );

    if (maskShapes.length === 0) {
        alert("Draw over the image with the pen to create a mask.");
        return;
    }

    const userPrompt = window.prompt("Lumina Directive (Prompt):", "Remove this object and fill naturally");
    if (!userPrompt) return;

    setIsProcessing(true);

    try {
        // 3. Extract Binary Mask (Rasterize Tldraw strokes)
        const maskBlob = await exportToBlob({
            editor,
            ids: maskShapes.map(s => s.id),
            format: 'png',
            opts: { background: false, bounds: imageBounds, padding: 0, scale: 1 }
        });

        // Convert Blob to Base64 for processing
        const reader = new FileReader();
        const maskBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(maskBlob);
        });

        // 4. (Optional) Local AI Refinement
        // We use the original image to guide the mask (Smart Select) via Worker
        // For now, we assume the user drew a coarse mask and we refine it or send it directly.
        // await refineMask(imageShape.props.url, maskBase64); // Implemented in hook

        // 5. Prepare Image Data
        // Fetch raw image data (proxy via canvas if needed to avoid CORS or get current filter state)
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageShape.props.url;
        await new Promise(r => img.onload = r);
        
        const canvas = document.createElement('canvas');
        canvas.width = imageShape.props.w;
        canvas.height = imageShape.props.h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, imageShape.props.w, imageShape.props.h);
        const imageBase64 = canvas.toDataURL('image/png');

        // 6. Execute Gemini Cloud Inpainting
        const resultImage = await executeGenerativeFill({
            imageBase64,
            maskBase64,
            prompt: userPrompt
        });

        if (resultImage) {
            // 7. Update Canvas
            editor.updateShape({
                id: imageShape.id,
                type: 'pixi-image',
                props: { url: resultImage }
            });
            // Clean up mask strokes
            editor.deleteShapes(maskShapes.map(s => s.id));
        }

    } catch (e) {
        console.error("Magic Refine Failed", e);
        alert("Refinement failed. See console.");
    } finally {
        setIsProcessing(false);
    }
  };

  const overrides = {
    actions: (editor: any, actions: any) => {
        return {
            ...actions,
            'lumina-refine': {
                id: 'lumina-refine',
                label: 'Magic Refine',
                icon: 'magic',
                onSelect: () => handleMagicRefine(editor)
            }
        }
    },
    toolbar: (editor: any, toolbar: any, { tools }: any) => {
      toolbar.splice(4, 0, {
        id: 'lumina-refine',
        type: 'item',
        action: 'lumina-refine',
      });
      return toolbar;
    },
  };

  return (
    <div className="w-full h-full relative bg-[#050505]">
      <div className="absolute inset-0 z-0">
        <Tldraw 
          persistenceKey="vnus-lumina-v2"
          shapeUtils={shapeUtils}
          overrides={overrides}
          darkMode={true}
          onMount={(editor) => {
             // Spawn a demo image if empty
             if (editor.getCurrentPageShapes().length === 0) {
                 editor.createShape({
                     id: createShapeId(),
                     type: 'pixi-image',
                     x: 200, y: 200,
                     props: {
                         w: 500, h: 500,
                         url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                     }
                 });
             }
          }}
        />
      </div>
      
      {isProcessing && (
          <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Neural Processing...</h3>
              <p className="text-xs text-indigo-400 mono mt-2">Gemini 1.5 Pro via V-nus Bridge</p>
          </div>
      )}
    </div>
  );
};

export default LuminaEditor;
