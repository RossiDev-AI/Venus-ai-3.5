import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { Zap, Database, Wand2 } from 'lucide-react';

interface CreationActionProps {
  isProcessing: boolean;
  onProcess: () => void;
  prompt: string;
}

const CreationAction: React.FC<CreationActionProps> = ({ isProcessing, onProcess, prompt }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3rem] space-y-5 shadow-2xl flex-1 flex flex-col transition-all hover:border-indigo-500/20 overflow-hidden relative">
      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Synthesis Anchor</label>
      <div onClick={() => fileRef.current?.click()} className="flex-1 min-h-[140px] bg-black/40 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all relative overflow-hidden group">
        <div className="text-center space-y-3 opacity-30 group-hover:opacity-60 transition-opacity">
          <Database className="w-12 h-12 mx-auto" strokeWidth={1}/>
          <p className="text-[9px] font-black uppercase tracking-widest">Inject Base DNA</p>
        </div>
        <input type="file" ref={fileRef} className="hidden" accept="image/*" />
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onProcess}
        disabled={isProcessing || !prompt.trim()}
        className={`w-full py-10 rounded-[2rem] font-black uppercase tracking-[0.8em] text-[11px] shadow-2xl transition-all relative overflow-hidden group
          ${isProcessing ? 'bg-zinc-800 text-zinc-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
      >
        {/* Added AnimatePresence to handle processing state transitions */}
        <AnimatePresence>
          {isProcessing ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20"
            >
               <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
               <span className="text-[8px] tracking-[0.4em] font-black animate-pulse">SYNAPSING...</span>
            </motion.div>
          ) : (
            <div className="relative z-10 flex items-center justify-center gap-3">
              <Wand2 size={16} />
              EXECUTE MAD SYNTH V12.5
            </div>
          )}
        </AnimatePresence>
        
        {!isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        )}
      </motion.button>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default CreationAction;