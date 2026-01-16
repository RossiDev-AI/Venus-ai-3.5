import React, { useState } from 'react';
import { executeGroundedSynth, optimizeVisualPrompt, fetchCinematicIntel } from '../../geminiService';
import { LatentParams, AgentStatus, VaultItem, ScoutData, LatentGrading, VisualAnchor, AgentAuthority, DeliberationStep, AppSettings } from '../../types';
import AgentFeed from '../shared/AgentFeed';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { Sparkles, Search, Newspaper, Link as LinkIcon, Info } from 'lucide-react';
import { toast } from 'sonner';

// Subcomponents
import CreationHeader from '../creationLab/CreationHeader';
import CreationInputs from '../creationLab/CreationInputs';
import CreationAuthority from '../creationLab/CreationAuthority';
import CreationZMatrix from '../creationLab/CreationZMatrix';
import CreationAction from '../creationLab/CreationAction';
import CreationScoutView from '../creationLab/CreationScoutView';

interface CreationLabProps {
  onResult: (imageUrl: string, params: LatentParams, prompt: string, links: any[], grading?: LatentGrading, visualAnchor?: VisualAnchor) => void;
  params: LatentParams;
  setParams: (p: LatentParams) => void;
  onReset: () => void;
  vault?: VaultItem[];
  settings?: AppSettings;
}

const CreationLab: React.FC<CreationLabProps> = ({ onResult, params, setParams, onReset, vault = [], settings }) => {
  const [prompt, setPrompt] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [logs, setLogs] = useState<AgentStatus[]>([]);
  const [deliberationFlow, setDeliberationFlow] = useState<DeliberationStep[]>([]);
  const [scoutData, setScoutData] = useState<ScoutData | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [agentAuthority, setAgentAuthority] = useState<AgentAuthority>({ lighting: 50, texture: 50, structure: 50, anatomy: 50 });
  const [intel, setIntel] = useState<{ text: string, links: { title: string, uri: string }[] } | null>(null);
  
  const [zAnatomy, setZAnatomy] = useState(1.0);
  const [zStructure, setZStructure] = useState(1.0);
  const [zLighting, setZLighting] = useState(0.5);
  const [zTexture, setZTexture] = useState(0.5);

  const handleMagicWand = async () => {
    if (!prompt.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setLogs(prev => [...prev, { type: 'Meta-Prompt Translator', status: 'processing', message: 'Upleveling user intent to Industrial Meta-Prompt...', timestamp: Date.now(), department: 'Advanced' }]);
    try {
      const optimized = await optimizeVisualPrompt(prompt, settings);
      setRefinedPrompt(optimized);
      setLogs(prev => [...prev, { type: 'Meta-Prompt Translator', status: 'completed', message: 'Visual refinement successfully mapped to technical directives.', timestamp: Date.now(), department: 'Advanced' }]);
      toast.success("Prompt otimizado com sucesso.");
    } catch (e) { 
      console.error(e); 
      toast.error("Falha ao otimizar prompt.");
    } finally { setIsOptimizing(false); }
  };

  const handleResearchIntel = async () => {
    if (!prompt.trim() || isResearching) return;
    setIsResearching(true);
    const toastId = toast.loading("Pesquisando contexto em tempo real...");
    try {
      const result = await fetchCinematicIntel(prompt, settings);
      setIntel(result);
      setLogs(prev => [...prev, { type: 'Visual Scout', status: 'completed', message: `Real-time intel gathered: ${result.links.length} sources linked.`, timestamp: Date.now(), department: 'Advanced' }]);
      toast.success("Pesquisa concluída.", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Erro na pesquisa em tempo real.", { id: toastId });
    } finally {
      setIsResearching(false);
    }
  };

  const handleHardReset = () => {
    setPrompt('');
    setRefinedPrompt('');
    setZAnatomy(1.0);
    setZStructure(1.0);
    setZLighting(0.5);
    setZTexture(0.5);
    setAgentAuthority({ lighting: 50, texture: 50, structure: 50, anatomy: 50 });
    setScoutData(null);
    setGroundingLinks([]);
    setLogs([]);
    setDeliberationFlow([]);
    setIntel(null);
    onReset();
    toast("Sistema resetado.");
  };

  const handleProcess = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setScoutData(null);
    setDeliberationFlow([]);
    setLogs([{ type: 'Director', status: 'processing', message: `Kernel Job Initialized. Executing MAD Consensus V12.5...`, timestamp: Date.now() }]);
    
    try {
      const weights = { X: 50, Y: 50, Z: 50 };
      const result = await executeGroundedSynth(prompt, weights, vault, agentAuthority, settings);
      
      if (result.imageUrl) {
        setScoutData(result.scoutData || null);
        setGroundingLinks(result.groundingLinks || []);
        setDeliberationFlow(result.deliberation_flow || []);
        setLogs(result.logs);
        setRefinedPrompt(result.enhancedPrompt);

        const finalParams: LatentParams = {
            ...params,
            z_anatomy: zAnatomy,
            z_structure: zStructure,
            z_lighting: zLighting,
            z_texture: zTexture,
            agent_authority: agentAuthority,
            neural_metrics: result.params.neural_metrics
        };

        onResult(result.imageUrl, finalParams, prompt, result.groundingLinks || [], result.grading, result.visual_anchor);
        toast.success("Síntese visual completa.");
      }
    } catch (e) { 
        console.error(e); 
        setLogs(prev => [...prev, { type: 'Director', status: 'error', message: 'Critical Kernel Failure during synthesis.', timestamp: Date.now() }]);
        toast.error("Falha crítica no Kernel de Síntese.");
    } finally { 
        setIsProcessing(false); 
    }
  };

  const handleAuthorityChange = (key: keyof AgentAuthority, val: number) => {
    setAgentAuthority(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-hidden min-h-full">
      <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 lg:p-12 overflow-y-auto pb-32 custom-scrollbar">
        <div className="flex-1 space-y-10 max-w-5xl">
          <CreationHeader onReset={handleHardReset} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-8">
                <CreationInputs 
                  prompt={prompt} 
                  setPrompt={setPrompt} 
                  refinedPrompt={refinedPrompt} 
                  isOptimizing={isOptimizing} 
                  onMagicWand={handleMagicWand} 
                />
                
                {prompt.trim() && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <button 
                      onClick={handleResearchIntel}
                      disabled={isResearching}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      {isResearching ? (
                        <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search size={12} />
                      )}
                      Cinematic Intel (Google Search)
                    </button>
                  </motion.div>
                )}

                <CreationAuthority 
                  authority={agentAuthority} 
                  onChange={handleAuthorityChange} 
                />
             </div>

             <div className="space-y-8 flex flex-col">
                <CreationZMatrix 
                  zAnatomy={zAnatomy} setZAnatomy={setZAnatomy}
                  zStructure={zStructure} setZStructure={setZStructure}
                  zLighting={zLighting} setZLighting={setZLighting}
                  zTexture={zTexture} setZTexture={setZTexture}
                />
                <CreationAction 
                  isProcessing={isProcessing} 
                  onProcess={handleProcess} 
                  prompt={prompt} 
                />
             </div>
          </div>

          <AnimatePresence>
            {intel && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-indigo-600/5 border border-indigo-500/20 rounded-[3rem] p-8 space-y-6 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper className="text-indigo-400" size={16} />
                    <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Inpiração em Tempo Real</h3>
                  </div>
                  <button onClick={() => setIntel(null)} className="text-zinc-600 hover:text-white">
                    <Search size={14} className="rotate-45" />
                  </button>
                </div>
                <p className="text-[12px] text-zinc-300 leading-relaxed italic">{intel.text}</p>
                {intel.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {intel.links.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[9px] font-bold text-indigo-400 hover:bg-white/10 transition-all"
                      >
                        <LinkIcon size={10} />
                        {link.title}
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <CreationScoutView 
            scoutData={scoutData} 
            groundingLinks={groundingLinks} 
          />
        </div>
        
        <div className="w-full lg:w-[400px] flex flex-col gap-6 lg:sticky lg:top-12 h-[calc(100vh-160px)]">
           <AgentFeed logs={logs} isProcessing={isProcessing} deliberation_flow={deliberationFlow} />
        </div>
      </div>
    </div>
  );
};

export default CreationLab;