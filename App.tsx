
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "https://esm.sh/@tanstack/react-query@5.28.4";
import { Toaster } from 'sonner';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Workspace from './components/workspace/Workspace';
import Vault from './components/vault/Vault';
import ManualNode from './components/manual/ManualNode';
import FusionLab from './components/fusion/FusionLab';
import CinemaLab from './components/cinema/CinemaLab';
import CreationLab from './components/creation/CreationLab';
import GradingLab from './components/grading/GradingLab';
import SettingsLab from './components/settings/SettingsLab';
import DocsLab from './components/docs/DocsLab';
import { WarmupUI } from './components/shared/WarmupUI';
import { warmupManager } from './engines/lumina/core/WarmupManager';
import { VaultItem, AgentStatus, LatentParams, LatentGrading, VisualAnchor, CinemaProject, SubtitleSettings, AppSettings } from './types';
import { getAllNodes, saveNode, deleteNode } from './dbService';

const queryClient = new QueryClient();

const LuminaStudio = React.lazy(() => import('./components/lumina/LuminaStudio'));

const DEFAULT_PARAMS: LatentParams = {
  z_anatomy: 1.0,
  z_structure: 1.0, 
  z_lighting: 0.5, 
  z_texture: 0.5,
  hz_range: 'Standard', 
  structural_fidelity: 1.0, 
  scale_factor: 1.0,
  auto_tune_active: true,
  neural_metrics: { 
    loss_mse: 0, 
    ssim_index: 1, 
    tensor_vram: 6.2, 
    iteration_count: 0, 
    consensus_score: 1 
  }
};

const DEFAULT_SUBTITLES: SubtitleSettings = {
  fontSize: 16,
  fontColor: '#ffffff',
  backgroundColor: '#000000',
  fontFamily: 'Inter',
  bgOpacity: 0.7,
  textAlign: 'center',
  paddingHMult: 1.2,
  paddingVMult: 1.2,
  radiusMult: 0.8,
  marginMult: 2.5
};

const DEFAULT_SETTINGS: AppSettings = {
  pexelsApiKey: '',
  unsplashAccessKey: '',
  pixabayApiKey: ''
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'creation' | 'workspace' | 'vault' | 'manual' | 'fusion' | 'cinema' | 'grading' | 'lumina' | 'settings' | 'docs'>('creation');
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('venus_app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioCurrentImage, setStudioCurrentImage] = useState<string | null>(null);
  const [studioOriginalSource, setStudioOriginalSource] = useState<string | null>(null);
  const [studioLogs, setStudioLogs] = useState<AgentStatus[]>([]);
  const [studioParams, setStudioParams] = useState<LatentParams>({ ...DEFAULT_PARAMS });
  const [studioGroundingLinks, setStudioGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  const [studioGrading, setStudioGrading] = useState<LatentGrading | undefined>(undefined);
  const [studioVisualAnchor, setStudioVisualAnchor] = useState<VisualAnchor | undefined>(undefined);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [hasInitError, setHasInitError] = useState(false);

  const [cinemaProject, setCinemaProject] = useState<CinemaProject>({
    id: crypto.randomUUID(),
    title: 'Venus Documentary',
    beats: [],
    audioUrl: null,
    fps: 30,
    aspectRatio: '16:9',
    subtitleSettings: DEFAULT_SUBTITLES
  });
  const [cinemaScript, setCinemaScript] = useState('');
  const [cinemaTitle, setCinemaTitle] = useState('');
  const [cinemaCredits, setCinemaCredits] = useState('');
  const [cinemaLogs, setCinemaLogs] = useState<AgentStatus[]>([]);
  const [cinemaActiveBeatIndex, setCinemaActiveBeatIndex] = useState(0);

  useEffect(() => {
    warmupManager.ignite();
    
    // File Handler Integration (PWA)
    if ('launchQueue' in window) {
      // @ts-ignore
      window.launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files.length) return;
        const fileHandle = launchParams.files[0];
        const file = await fileHandle.getFile();
        const reader = new FileReader();
        reader.onload = (e) => {
            setStudioCurrentImage(e.target?.result as string);
            setActiveTab('workspace');
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('venus_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const fetchVault = useCallback(async () => {
    try {
      const items = await getAllNodes();
      setVaultItems(Array.isArray(items) ? items.sort((a, b) => b.timestamp - a.timestamp) : []);
    } catch (err) {
      console.error("Critical Database Error:", err);
      setVaultItems([]);
    } finally {
      setIsDbLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchVault().catch(e => {
      console.error("Init Error", e);
      setHasInitError(true);
    });
  }, [fetchVault]);

  const handleCreationResult = (imageUrl: string, params: LatentParams, prompt: string, links: any[], grading?: LatentGrading, visualAnchor?: VisualAnchor) => {
    setStudioCurrentImage(imageUrl);
    setStudioParams(params);
    setStudioPrompt(prompt);
    setStudioGroundingLinks(links);
    setStudioGrading(grading);
    setStudioVisualAnchor(visualAnchor);
    setStudioOriginalSource(null);
    setActiveTab('workspace');
  };

  const handleSaveToVault = useCallback(async (item: VaultItem) => {
    try {
      await saveNode(item);
      setVaultItems(prev => {
        const index = prev.findIndex(i => i.id === item.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = item;
          return updated;
        }
        return [item, ...prev];
      });
    } catch (e) {
      console.error("Failed to index node:", e);
    }
  }, []);

  const handleDeleteFromVault = useCallback(async (id: string) => {
    try {
      await deleteNode(id);
      setVaultItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }, []);

  const handleReloadFromVault = (item: VaultItem) => {
    setStudioCurrentImage(item.imageUrl);
    setStudioOriginalSource(item.originalImageUrl);
    setStudioParams(item.params);
    setStudioPrompt(item.prompt);
    setStudioLogs(item.agentHistory || []);
    setStudioGrading(item.grading);
    setStudioVisualAnchor(undefined);
    setActiveTab('workspace');
  };

  const executeHardReset = useCallback(() => {
    setStudioPrompt('');
    setStudioCurrentImage(null);
    setStudioOriginalSource(null);
    setStudioLogs([]);
    setStudioParams({ ...DEFAULT_PARAMS });
    setStudioGroundingLinks([]);
    setStudioGrading(undefined);
    setStudioVisualAnchor(undefined);
  }, []);

  if (hasInitError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-white uppercase">Venus AI Kernel Failure</h1>
          <p className="text-zinc-500 text-sm mono">Check API configuration environment.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-xs">Reload Venus</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      <WarmupUI />
      <Toaster 
        theme="dark" 
        position="bottom-center" 
        toastOptions={{
          style: {
            background: '#0e0e11',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e5e5e5',
            fontFamily: 'Inter, sans-serif'
          }
        }}
      />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} vaultCount={vaultItems.length} />

      <main className="flex-1 overflow-auto bg-[#020202] relative custom-scrollbar">
        {!isDbLoaded ? (
          <div className="flex h-full items-center justify-center">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-600/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             </div>
          </div>
        ) : (
          <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-[10px] mono animate-pulse">LATENT_BUFFER_LOADING...</div>}>
            <div className={`h-full ${activeTab !== 'lumina' ? 'pb-28 lg:pb-0' : ''}`}>
              {activeTab === 'creation' && (
                <CreationLab 
                  onResult={handleCreationResult}
                  params={studioParams}
                  setParams={setStudioParams}
                  onReset={executeHardReset}
                  vault={vaultItems}
                  settings={appSettings}
                />
              )}
              {activeTab === 'workspace' && (
                <Workspace 
                  onSave={handleSaveToVault} vault={vaultItems} prompt={studioPrompt} setPrompt={setStudioPrompt}
                  currentImage={studioCurrentImage} setCurrentImage={setStudioCurrentImage} 
                  originalSource={studioOriginalSource} setOriginalSource={setStudioOriginalSource}
                  logs={studioLogs} setLogs={setStudioLogs} params={studioParams} setParams={setStudioParams}
                  onReloadApp={executeHardReset} grading={studioGrading} visualAnchor={studioVisualAnchor}
                  settings={appSettings}
                />
              )}
              {activeTab === 'grading' && <GradingLab vault={vaultItems} onSave={handleSaveToVault} />}
              {activeTab === 'lumina' && <LuminaStudio />}
              {activeTab === 'cinema' && (
                <CinemaLab 
                  vault={vaultItems} 
                  onSave={handleSaveToVault} 
                  currentSourceImage={studioCurrentImage}
                  project={cinemaProject}
                  setProject={setCinemaProject}
                  script={cinemaScript}
                  setScript={setCinemaScript}
                  title={cinemaTitle}
                  setTitle={setCinemaTitle}
                  credits={cinemaCredits}
                  setCredits={setCinemaCredits}
                  logs={cinemaLogs}
                  setLogs={setCinemaLogs}
                  activeBeatIndex={cinemaActiveBeatIndex}
                  setActiveBeatIndex={setCinemaActiveBeatIndex}
                  onReset={() => {}}
                  settings={appSettings}
                />
              )}
              {activeTab === 'fusion' && <FusionLab vault={vaultItems} onResult={(img, p, l) => {
                  setStudioCurrentImage(img);
                  setStudioParams(p);
                  setStudioLogs(l);
                  setActiveTab('workspace');
              }} settings={appSettings} />}
              {activeTab === 'manual' && <ManualNode onSave={handleSaveToVault} settings={appSettings} />}
              {activeTab === 'vault' && <Vault items={vaultItems} onDelete={handleDeleteFromVault} onClearAll={() => {}} onRefresh={fetchVault} onReload={handleReloadFromVault} />}
              {activeTab === 'docs' && <DocsLab />}
              {activeTab === 'settings' && <SettingsLab settings={appSettings} setSettings={setAppSettings} />}
            </div>
          </Suspense>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
