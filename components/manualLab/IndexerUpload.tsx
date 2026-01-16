import React, { useState } from 'react';
import UppyUploader from '../shared/UppyUploader';
import { Upload, Scan, FileImage, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

interface IndexerUploadProps {
  image: string | null;
  isScanning: boolean;
  scanProgress: number;
  onUploadClick: () => void;
  onFileSelect: (url: string) => void;
}

const IndexerUpload: React.FC<IndexerUploadProps> = ({ image, isScanning, scanProgress, onFileSelect }) => {
  const [showUploader, setShowUploader] = useState(!image);

  const handleUppyComplete = (url: string, blob: Blob) => {
    onFileSelect(url);
    setShowUploader(false);
  };

  if (showUploader && !image) {
      return (
          <div className="h-full min-h-[400px]">
              <UppyUploader onUploadComplete={handleUppyComplete} height={400} />
          </div>
      );
  }

  return (
    <div 
      className={`group relative aspect-square rounded-[3rem] md:rounded-[4rem] border-2 border-dashed transition-all duration-700 overflow-hidden cursor-pointer ${image ? 'border-transparent' : 'border-white/5 hover:border-indigo-500/30 bg-black/40'}`}
    >
      {image ? (
        <>
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ 
              scale: isScanning ? 1.05 : 1.0, 
              opacity: 1,
              filter: isScanning ? 'grayscale(1) contrast(1.2)' : 'grayscale(0) contrast(1.0)' 
            }}
            src={image} 
            className="w-full h-full object-cover" 
            alt="Reference" 
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center"
              >
                <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[2px]" />
                <div className="w-full h-[3px] bg-indigo-500 shadow-[0_0_30px_#6366f1] animate-scan-y absolute top-0 z-30" />
                
                <div className="relative z-40 flex flex-col items-center gap-6">
                  <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-indigo-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3">
                        <Scan size={16} className="text-indigo-400 animate-pulse" />
                        <span className="text-[12px] font-black text-white mono uppercase tracking-widest">
                          Biopsy: {Math.floor(scanProgress)}%
                        </span>
                      </div>
                      <div className="w-40 h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
                        <motion.div 
                          className="h-full bg-indigo-500" 
                          style={{ width: `${scanProgress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] mono text-indigo-400/60 uppercase tracking-[0.6em] animate-pulse">LCP_v11.11 Protocol</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => setShowUploader(true)}
                className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full text-[9px] font-black text-white uppercase border border-white/10 flex items-center gap-3 hover:bg-white hover:text-black transition-all shadow-2xl"
            >
                <Upload size={12} /> Replace Frame
            </button>
          </div>

          <div className="absolute top-10 left-10 flex items-center gap-2 bg-indigo-600/20 backdrop-blur-md px-4 py-2 rounded-xl border border-indigo-500/30">
            <ShieldCheck size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Validated DNA</span>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center space-y-6" onClick={() => setShowUploader(true)}>
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:border-indigo-500/30 transition-all duration-500">
            <FileImage className="w-8 h-8 text-zinc-700 group-hover:text-indigo-400 transition-colors" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600 group-hover:text-zinc-400 transition-colors">Inject Reference Frame</p>
            <p className="text-[8px] mono text-zinc-800 uppercase tracking-widest">TIFF / PNG / WEBP / RAW</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan-y {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-y {
          animation: scan-y 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default IndexerUpload;