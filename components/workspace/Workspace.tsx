import React, { useState, useRef, useEffect } from 'react';
import { AgentStatus, LatentParams, VaultItem, VaultDomain, LatentGrading, VisualAnchor, DeliberationStep, AgentAuthority, PoseData, AppSettings } from '../../types';
import { extractDeepDNA, executeGroundedSynth } from '../../geminiService';
import AgentFeed from '../shared/AgentFeed';
import ZModeModal from '../modals/ZModeModal';
import LGNEditor from '../modals/LGNEditor';
import MetricsDashboard from '../shared/MetricsDashboard';
import ProcessingControl from '../shared/ProcessingControl';
import PoseControlPanel from '../PoseControlPanel';

// Subcomponents - Fixing paths to relative
import StudioPreview from '../workspaceLab/StudioPreview';
import StudioSidebarHeader from '../workspaceLab/StudioSidebarHeader';
import StudioAuthorityPanel from '../workspaceLab/StudioAuthorityPanel';
import StudioConsensusReport from '../workspaceLab/StudioConsensusReport';
import StudioActionPanel from '../workspaceLab/StudioActionPanel';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';

interface WorkspaceProps {
  onSave: (item: VaultItem) => Promise<void>;
  vault: VaultItem[];
  prompt: string;
  setPrompt: (val: string) => void;
  currentImage: string | null;
  setCurrentImage: (val: string | null) => void;
  originalSource: string | null;
  setOriginalSource: (val: string | null) => void;
  logs: AgentStatus[];
  setLogs: React.Dispatch<React.SetStateAction<AgentStatus[]>>;
  params: LatentParams;
  setParams: React.Dispatch<React.SetStateAction<LatentParams>>;
  onReloadApp: () => void;
  grading?: LatentGrading;
  visualAnchor?: VisualAnchor;
  settings?: AppSettings;
}

const Workspace: React.FC<WorkspaceProps> = ({ 
  onSave, vault, prompt, setPrompt, currentImage, setCurrentImage,
  originalSource, setOriginalSource, logs, setLogs, params, setParams,
  onReloadApp, grading: initialGrading, settings
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isZModeOpen, setIsZModeOpen] = useState(false);
  const [isLGNOpen, setIsLGNOpen] = useState(false);
  const [isPoseOpen, setIsPoseOpen] = useState(false);
  const [isBiopsyActive, setIsBiopsyActive] = useState(false);
  const [collisionReport, setCollisionReport] = useState<{logic: string, prompt: string} | null>(null);
  const [localGrading, setLocalGrading] = useState<LatentGrading | undefined>(initialGrading);
  const [deliberationFlow, setDeliberationFlow] = useState<DeliberationStep[]>([]);
  
  // Mobile Sheet State
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Kernel Initiating: Calling Meta-Prompt Translator...", 
    "Consulting Visual Scout for Optical Truth...", 
    "Lighting Architect calculating photon bounce...", 
    "Texture Master biopsying material surfaces...",
    "Merging consensus into Final Directive..."
  ];

  useEffect(() => {
    setLocalGrading(initialGrading);
  }, [initialGrading]);

  useEffect(() => {
    let interval: any;
    if (isProcessing || isBiopsyActive) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isProcessing, isBiopsyActive]);

  const handleProcess = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setLogs([]);
    setDeliberationFlow([]);
    setIsMobileSheetOpen(false); 
    
    try {
      const weights = { X: 50, Y: 50, Z: 50 };
      const auth = params.agent_authority || { lighting: 50, texture: 50, structure: 50, anatomy: 50 };
      const poseContext = params.pose_control?.enabled ? `\n[POSE_RIG_ACTIVE]: ${params.pose_control.technicalDescription || 'Follow skeleton structure.'}` : '';
      const contextPrompt = prompt + poseContext;

      let result = await executeGroundedSynth(contextPrompt, weights, vault, auth, settings);
      
      if (result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setLogs(result.logs);
        setDeliberationFlow(result.deliberation_flow || []);
        setParams(prev => ({ ...prev, agent_authority: auth }));
        setCollisionReport({ logic: result.collision_logic || 'Multi-Agent Consensus (V12.2)', prompt: result.consolidated_prompt || '' });
        if (result.grading) setLocalGrading(result.grading);
      }
    } catch (error: any) { console.error(error); } finally { setIsProcessing(false); }
  };

  const handleCommit = async () => {
    if (!currentImage || isSaving) return;
    setIsSaving(true);
    try {
      const item: VaultItem = {
        id: crypto.randomUUID(),
        shortId: `LCP-${Math.floor(10000 + Math.random() * 90000)}`,
        name: prompt.split(' ').slice(0, 3).join('_'),
        imageUrl: currentImage,
        originalImageUrl: originalSource || currentImage,
        prompt: prompt,
        agentHistory: logs,
        params: { ...params },
        dna: params.dna,
        rating: 5,
        timestamp: Date.now(),
        usageCount: 0,
        neuralPreferenceScore: 50,
        isFavorite: false,
        vaultDomain: params.vault_domain || 'X',
        grading: localGrading
      };
      await onSave(item);
    } catch (e: any) { console.error(e); } finally { setIsSaving(false); }
  };

  const renderSidebarContent = () => (
    <>
      <StudioSidebarHeader 
        onPurge={onReloadApp} 
        onZMode={() => setIsZModeOpen(true)} 
        onPose={() => setIsPoseOpen(!isPoseOpen)} 
        onLGN={() => setIsLGNOpen(true)} 
        isPoseOpen={isPoseOpen} 
        hasGrading={!!localGrading} 
      />

      <AnimatePresence mode="wait">
        {isPoseOpen ? (
          <motion.div
            key="pose"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PoseControlPanel 
              poseControl={params.pose_control} 
              setPoseControl={(pose) => setParams(prev => ({ ...prev, pose_control: pose }))} 
              vault={vault} 
              sourceImage={currentImage} 
              onExecuteSurgical={handleProcess}
              settings={settings}
            />
          </motion.div>
        ) : (
          <motion.div
            key="standard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <StudioAuthorityPanel 
              authority={params.agent_authority || { lighting: 50, texture: 50, structure: 50, anatomy: 50 }} 
              onChange={(key, val) => setParams(prev => ({ ...prev, agent_authority: { ...(prev.agent_authority || { lighting: 50, texture: 50, structure: 50, anatomy: 50 }), [key]: val } }))} 
            />
            <StudioConsensusReport report={collisionReport} />
            <ProcessingControl speed={params.processing_speed || 'Balanced'} setSpeed={(val) => setParams(prev => ({ ...prev, processing_speed: val }))} />
            <AgentFeed logs={logs} isProcessing={isProcessing} deliberation_flow={deliberationFlow} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] relative overflow-hidden min-h-full">
      <div className="hidden md:block">
        <MetricsDashboard params={params} />
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        <StudioPreview 
          currentImage={currentImage} 
          isProcessing={isProcessing} 
          isBiopsyActive={isBiopsyActive} 
          loadingMessage={loadingMessages[loadingStep]} 
          localGrading={localGrading} 
          params={params} 
          vault={vault} 
          onUploadClick={() => fileInputRef.current?.click()} 
          onSlotClick={() => {}} 
        />
        
        <div className="hidden md:flex w-[380px] lg:w-[440px] flex-col bg-[#0e0e11] border-l border-white/5 shadow-2xl relative overflow-hidden h-full">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-40 custom-scrollbar">
            {renderSidebarContent()}
          </div>
          <StudioActionPanel 
            prompt={prompt} 
            setPrompt={setPrompt} 
            onProcess={handleProcess} 
            onCommit={handleCommit} 
            isProcessing={isProcessing} 
            isSaving={isSaving} 
            hasImage={!!currentImage} 
          />
        </div>

        <AnimatePresence>
          {isMobileSheetOpen && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden absolute inset-x-0 bottom-0 top-20 bg-[#0e0e11] rounded-t-[2rem] shadow-2xl border-t border-white/10 z-50 flex flex-col overflow-hidden"
            >
               <div className="flex justify-center p-3 bg-zinc-900/50 cursor-pointer" onClick={() => setIsMobileSheetOpen(false)}>
                  <div className="w-12 h-1.5 bg-zinc-700 rounded-full opacity-50" />
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-20">
                  {renderSidebarContent()}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Workspace;