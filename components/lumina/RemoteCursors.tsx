
import React, { useEffect, useState } from 'react';
import { Editor, track } from 'tldraw';
import { collabManager } from '../../engines/lumina/core/CollabManager';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { MousePointer2 } from 'lucide-react';

export const RemoteCursors: React.FC<{ editor: Editor }> = track(({ editor }) => {
    const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!collabManager.provider) return;

        const updateAwareness = () => {
            const states = Array.from(collabManager.provider!.awareness.getStates().entries())
                .filter(([id]) => id !== collabManager.provider!.awareness.clientID)
                .map(([id, state]) => ({ id, ...state.user }));
            setRemoteUsers(states);
        };

        collabManager.provider.awareness.on('change', updateAwareness);
        return () => collabManager.provider?.awareness.off('change', updateAwareness);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-[2000] overflow-hidden">
            <AnimatePresence>
                {remoteUsers.map(user => {
                    if (!user.cursor) return null;
                    // Converte coordenadas de página para tela conforme zoom do tldraw
                    const screenPos = editor.pageToScreen(user.cursor);

                    return (
                        <motion.div 
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, x: screenPos.x, y: screenPos.y }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="absolute top-0 left-0 flex flex-col items-start"
                        >
                            <MousePointer2 
                                size={18} 
                                style={{ color: user.color, fill: user.color }} 
                                className="drop-shadow-lg"
                            />
                            <div 
                                style={{ backgroundColor: user.color }}
                                className="px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest mt-1 shadow-xl"
                            >
                                {user.name}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
});
