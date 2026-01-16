
import React from 'react';
import { track, useEditor } from 'tldraw';
import { AlignmentGuide } from '../../engines/lumina/core/SnappingManager';

interface LuminaSnappingOverlayProps {
    guides: AlignmentGuide[];
}

export const LuminaSnappingOverlay = track(({ guides }: LuminaSnappingOverlayProps) => {
    const editor = useEditor();
    const zoom = editor.getZoomLevel();

    if (guides.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[1500]">
            <svg className="w-full h-full">
                {guides.map((guide, i) => {
                    // Converter coordenadas de página para coordenadas de tela (conforme zoom/pan)
                    if (guide.type === 'vertical') {
                        const screenX = (guide.x! - editor.getCamera().x) * zoom;
                        const screenStart = (guide.start - editor.getCamera().y) * zoom;
                        const screenEnd = (guide.end - editor.getCamera().y) * zoom;

                        return (
                            <g key={`v-${i}`}>
                                <line 
                                    x1={screenX} y1={screenStart}
                                    x2={screenX} y2={screenEnd}
                                    stroke="#ff00ff"
                                    strokeWidth={1 / zoom + 1}
                                    strokeDasharray="4 2"
                                    className="drop-shadow-[0_0_2px_rgba(255,0,255,0.5)]"
                                />
                                <circle cx={screenX} cy={screenStart} r={3} fill="#ff00ff" />
                                <circle cx={screenX} cy={screenEnd} r={3} fill="#ff00ff" />
                            </g>
                        );
                    } else {
                        const screenY = (guide.y! - editor.getCamera().y) * zoom;
                        const screenStart = (guide.start - editor.getCamera().x) * zoom;
                        const screenEnd = (guide.end - editor.getCamera().x) * zoom;

                        return (
                            <g key={`h-${i}`}>
                                <line 
                                    x1={screenStart} y1={screenY}
                                    x2={screenEnd} y2={screenY}
                                    stroke="#ff00ff"
                                    strokeWidth={1 / zoom + 1}
                                    strokeDasharray="4 2"
                                    className="drop-shadow-[0_0_2px_rgba(255,0,255,0.5)]"
                                />
                                <circle cx={screenStart} cy={screenY} r={3} fill="#ff00ff" />
                                <circle cx={screenEnd} cy={screenY} r={3} fill="#ff00ff" />
                            </g>
                        );
                    }
                })}
            </svg>
        </div>
    );
});
