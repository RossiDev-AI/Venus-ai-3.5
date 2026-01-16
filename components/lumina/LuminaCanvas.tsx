
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Tldraw, Editor, TLShapeId, createShapeId } from 'tldraw';
import { luminaEngine } from '../../engines/lumina/core/LuminaEngine';
import { LuminaImageShapeUtil } from './LuminaImageShapeUtil';
import { LuminaMaskShapeUtil } from './LuminaMaskShapeUtil';
import { SkiaTextShapeUtil } from './SkiaTextShapeUtil';
import { LuminaAdjustmentShapeUtil } from './LuminaAdjustmentShapeUtil';
import { snappingManager, AlignmentGuide } from '../../engines/lumina/core/SnappingManager';
import { LuminaSnappingOverlay } from './LuminaSnappingOverlay';
import { LuminaReviewOverlay } from './LuminaReviewOverlay';
import { skiaService } from '../../engines/lumina/core/SkiaService';
import { storageManager } from '../../engines/lumina/core/StorageManager';
import { toast } from 'sonner';

interface LuminaCanvasProps {
    onMount?: (editor: Editor) => void;
    onImportClick?: () => void;
    children?: React.ReactNode;
}

export const LuminaCanvas: React.FC<LuminaCanvasProps> = ({ onMount, onImportClick, children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
    
    const shapeUtils = useMemo(() => [
        LuminaImageShapeUtil, 
        LuminaMaskShapeUtil,
        SkiaTextShapeUtil,
        LuminaAdjustmentShapeUtil
    ], []);

    useEffect(() => {
        if (containerRef.current) {
            luminaEngine.initialize(containerRef.current);
        }
        skiaService.loadFont('Inter', 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2');
    }, []);

    useEffect(() => {
        if (!editor) return;

        // Snapping Logic Integration
        const cleanup = editor.store.listen((event) => {
            const selectedIds = editor.getSelectedShapeIds();
            
            if (selectedIds.length === 1 && editor.getInstanceState().isChangingStyle === false) {
                const isBypassed = editor.inputs.ctrlKey || editor.inputs.metaKey;
                const { snappedPagePoint, guides } = snappingManager.calculateSnap(
                    editor, 
                    selectedIds[0],
                    isBypassed
                );
                setActiveGuides(guides);
            } else if (activeGuides.length > 0) {
                setActiveGuides([]);
            }
        });

        const handleCameraChange = () => {
            const camera = editor.getCamera();
            luminaEngine.syncCamera(camera.x, camera.y, camera.z);
        };
        
        editor.on('change-camera', handleCameraChange);

        return () => {
            editor.off('change-camera', handleCameraChange);
            cleanup();
        };
    }, [editor, activeGuides]);

    const handleMount = (editorInstance: Editor) => {
        setEditor(editorInstance);
        editorInstance.user.updateUserPreferences({ colorScheme: 'dark' });
        if (onMount) onMount(editorInstance);
    };

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full relative overflow-hidden bg-[#050505]"
        >
            <style>{`
                .tl-container { background: transparent !important; }
                .tl-canvas { z-index: 1 !important; }
                .tl-background { display: none !important; }
            `}</style>
            
            <Tldraw 
                persistenceKey="vnus-lumina-v4"
                shapeUtils={shapeUtils}
                darkMode={true}
                onMount={handleMount}
                overrides={{
                    uiOverrides: {
                        isShowMenu: false,
                        isShowPages: false,
                    }
                }}
            >
                {children}
                {editor && (
                    <>
                        <LuminaSnappingOverlay guides={activeGuides} />
                        <LuminaReviewOverlay />
                    </>
                )}
            </Tldraw>
        </div>
    );
};
