
import React, { useEffect, useState, useRef } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import ImageEditor from '@uppy/image-editor';
// Removed Compressor to preserve 100% original quality as requested
import { VaultItem } from '../../types';
import { saveNode } from '../../dbService';

const UPPY_DARK_THEME = `
  .uppy-Dashboard-inner { background-color: #0e0e11 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 2rem !important; }
  .uppy-Dashboard-AddFiles-title { color: #e5e5e5 !important; font-family: 'Inter', sans-serif !important; font-weight: 700 !important; }
  .uppy-StatusBar { background-color: #0e0e11 !important; border-top: 1px solid rgba(255,255,255,0.1) !important; }
  .uppy-StatusBar-progress { background-color: #4f46e5 !important; }
  .uppy-c-btn-primary { background-color: #4f46e5 !important; color: white !important; font-weight: 800 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; border-radius: 0.75rem !important; }
  .uppy-Dashboard-Item-name { color: #d4d4d8 !important; font-family: 'JetBrains Mono', monospace !important; }
`;

interface LuminaUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (node: VaultItem) => void;
}

const LuminaUploaderModal: React.FC<LuminaUploaderModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  // Ref to track if we are already handling a file to prevent race conditions/duplicates
  const processingRef = useRef(false);

  const [uppy] = useState(() => {
    const u = new Uppy({
      restrictions: {
        maxFileSize: 50 * 1024 * 1024, // Increased to 50MB for high-res
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
      allowMultipleUploadBatches: false,
    });

    u.use(ImageEditor, {
      quality: 1.0, // Max quality
      cropperOptions: { viewMode: 1, background: false, autoCropArea: 1, responsive: true },
    });

    // Removed Compressor plugin usage to fix "low quality" issue
    
    return u;
  });

  useEffect(() => {
    // Reset processing state when modal opens
    if (isOpen) {
      processingRef.current = false;
      setIsProcessing(false);
      uppy.cancelAll();
    }
  }, [isOpen, uppy]);

  useEffect(() => {
    const handleComplete = async (result: any) => {
      if (processingRef.current) return; // Guard clause
      
      if (result.successful.length > 0) {
        processingRef.current = true;
        setIsProcessing(true);
        
        const file = result.successful[0];
        const blob = file.data;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            
            const newItem: VaultItem = {
                id: crypto.randomUUID(),
                shortId: `UP-${Math.floor(Math.random() * 10000)}`,
                name: file.name ? file.name.split('.')[0] : 'Uploaded_Asset',
                imageUrl: base64,
                originalImageUrl: base64,
                prompt: 'User Upload - Manual Injection',
                agentHistory: [],
                params: {
                    z_anatomy: 1, z_structure: 1, z_lighting: 1, z_texture: 1,
                    hz_range: 'Manual',
                    neural_metrics: { loss_mse: 0, ssim_index: 1, tensor_vram: 0, iteration_count: 0, consensus_score: 1 },
                    structural_fidelity: 1, scale_factor: 1
                },
                rating: 5,
                timestamp: Date.now(),
                usageCount: 0,
                neuralPreferenceScore: 50,
                isFavorite: false,
                vaultDomain: 'X'
            };

            try {
                await saveNode(newItem);
                onUploadComplete(newItem);
                uppy.cancelAll(); // Clear for next time
                onClose();
            } catch (e) {
                console.error("Vault injection failed", e);
                processingRef.current = false;
                setIsProcessing(false);
            }
        };
      }
    };

    uppy.on('complete', handleComplete);

    return () => {
      uppy.off('complete', handleComplete);
    };
  }, [uppy, onUploadComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <style>{UPPY_DARK_THEME}</style>
      <div className="relative w-full max-w-4xl animate-in zoom-in-95 duration-300">
         {isProcessing && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Injecting High-Res Asset...</span>
                </div>
            </div>
         )}
         <div className="absolute -top-12 left-0 flex items-center gap-3">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">V-nus Asset Pipeline</h3>
            <span className="px-2 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase rounded">Editor Active</span>
         </div>
         <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-zinc-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg>
         </button>
         <div className="shadow-[0_0_50px_rgba(79,70,229,0.15)] rounded-[2rem] overflow-hidden bg-[#0e0e11]">
            <Dashboard
                uppy={uppy}
                plugins={['ImageEditor']}
                theme="dark"
                width="100%"
                height={550}
                showProgressDetails={true}
                proudlyDisplayPoweredByUppy={false}
                note="High-Res Original Quality • Auto-Vault Indexing"
            />
         </div>
      </div>
    </div>
  );
};

export default LuminaUploaderModal;
