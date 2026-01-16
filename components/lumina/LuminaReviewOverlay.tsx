import React, { useEffect, useState, useRef } from 'react';
import { track, useEditor } from 'tldraw';
import { reviewManager, ReviewComment, ReviewStroke } from '../../engines/lumina/core/ReviewManager';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { MessageSquare, User, X } from 'lucide-react';

export const LuminaReviewOverlay = track(() => {
    const editor = useEditor();
    const [strokes, setStrokes] = useState<ReviewStroke[]>([]);
    const [comments, setComments] = useState<ReviewComment[]>([]);
    const zoom = editor.getZoomLevel();

    useEffect(() => {
        const updateStrokes = (s: ReviewStroke[]) => setStrokes(s);
        const updateComments = (c: ReviewComment[]) => setComments(c);

        // Added fix: on method is now correctly defined in the ReviewManager instance to handle custom events
        reviewManager.on('strokes-updated', updateStrokes);
        // Added fix: on method is now correctly defined in the ReviewManager instance to handle custom events
        reviewManager.on('comments-updated', updateComments);

        return () => {
            // Added fix: off method is now correctly defined in the ReviewManager instance to clean up listeners
            reviewManager.off('strokes-updated', updateStrokes);
            // Added fix: off method is now correctly defined in the ReviewManager instance to clean up listeners
            reviewManager.off('comments-updated', updateComments);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-[1600] overflow-hidden">
            {/* 1. Ghost Strokes Engine */}
            <svg className="w-full h-full">
                {strokes.map((stroke, i) => (
                    <motion.polyline
                        key={i}
                        points={stroke.points.map(p => {
                            const screen = editor.pageToScreen(p);
                            return `${screen.x},${screen.y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#ff00ff"
                        strokeWidth={4 * zoom}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        className="drop-shadow-[0_0_10px_#ff00ff]"
                    />
                ))}
            </svg>

            {/* 2. Spatial Review Pins */}
            <AnimatePresence>
                {comments.map(comment => {
                    const screen = editor.pageToScreen({ x: comment.x, y: comment.y });
                    
                    return (
                        <motion.div
                            key={comment.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ left: screen.x, top: screen.y }}
                            className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 group"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white cursor-pointer hover:scale-110 transition-all">
                                    <MessageSquare size={14} className="text-white" />
                                </div>
                                
                                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-[#0e0e11] border border-white/10 p-4 rounded-2xl shadow-3xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xl pointer-events-none">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User size={10} className="text-zinc-500" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{comment.author}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-100 leading-relaxed font-medium italic">"{comment.text}"</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
});