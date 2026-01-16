import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'sonner';

// Imports de Layout
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';

// Imports de Labs
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
import { getAllNodes, saveNode, deleteNode } from './dbService';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const LuminaStudio = React.lazy(() => import('./components/lumina/LuminaStudio'));

const DEFAULT_PARAMS = {
  z_anatomy: 1.0, z_structure: 1.0, z_lighting: 0.5, z_texture: 0.5,
  hz_range: 'Standard', structural_fidelity: 1.0, scale_factor: 1.0,
  auto_tune_active: true,
  neural_metrics: { loss_mse: 0, ssim_index: 1, tensor_vram: 6.2, iteration_count: 0, consensus_score: 1 }
};

const DEFAULT_SETTINGS = { pexelsApiKey: '', unsplashAccessKey: '', pixabayApiKey: '' };

function AppContent() {
  const [activeTab, setActiveTab] = useState('creation');
  const [vaultItems, setVaultItems] = useState([]);
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('venus_app_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioCurrentImage, setStudioCurrentImage] = useState(null);
  const [studioOriginalSource, setStudioOriginalSource] = useState(null);
  const [studioLogs, setStudioLogs] = useState([]);
  const [studioParams, setStudioParams] = useState({ ...DEFAULT_PARAMS });
  const [studioGroundingLinks, setStudioGroundingLinks] = useState([]);
  const [studioGrading, setStudioGrading] = useState(undefined);
  const [studioVisualAnchor, setStudioVisualAnchor] = useState(undefined);
  
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [hasInitError, setHasInitError] = useState(false);

  const [cinemaProject, setCinemaProject] = useState({
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(),
    title: 'Venus Documentary', beats: [], audioUrl: null, fps: 30, aspectRatio: '16:9',
    subtitleSettings: { fontSize: 16, fontColor: '#ffffff', backgroundColor: '#000000', fontFamily: 'Inter', bgOpacity: 0.8, textAlign: 'center', paddingHMult: 1, paddingVMult: 1, radiusMult: 1, marginMult: 1 }
  });
  const [cinemaScript, setCinemaScript] = useState('');
  const [cinemaTitle, setCinemaTitle] = useState('<h1>VENUS_PROT_V1</h1>');
  const [cinemaCredits, setCinemaCredits] = useState('<h1>THANKS_FOR_WATCHING</h1>');
  const [cinemaLogs, setCinemaLogs] = useState([]);
  const [activeBeatIndex, setActiveBeatIndex] = useState(0);

  useEffect(() => { warmupManager.ignite(); }, []);

  useEffect(() => {
    localStorage.setItem('venus_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const fetchVault = useCallback(async () => {
    try {
      const items = await getAllNodes();
      setVaultItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Database Error:", err);
      setVaultItems([]);
    } finally { setIsDbLoaded(true); }
  }, []);

  useEffect(() => { fetchVault(); }, [fetchVault]);

  const handleCreationResult = (imageUrl, params, prompt, links, grading, visualAnchor) => {
    setStudioCurrentImage(imageUrl);
    setStudioParams(params);
    setStudioPrompt(prompt);
    setStudioGroundingLinks(Array.isArray(links) ? links : []);
    setStudioGrading(grading);
    setStudioVisualAnchor(visualAnchor);
    setActiveTab('workspace');
  };

  const handleSaveToVault = useCallback(async (item) => {
    try {
      await saveNode(item);
      await fetchVault(); 
    } catch (e) { console.error("Vault Save Error:", e); }
  }, [fetchVault]);

  const handleDeleteFromVault = useCallback(async (id) => {
    try {
      await deleteNode(id);
      setVaultItems(prev => prev.filter(item => item.id !== id));
    } catch (e) { console.error("Delete Error:", e); }
  }, []);

  const handleResetStudio = () => {
    setStudioPrompt(''); setStudioCurrentImage(null); setStudioOriginalSource(null);
    setStudioLogs([]); setStudioParams({ ...DEFAULT_PARAMS }); setStudioGroundingLinks([]);
    setStudioGrading(undefined); setStudioVisualAnchor(undefined);
  };

  if (hasInitError) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><h1 className="text-white">Venus Kernel Error</h1></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 overflow-hidden relative">
      <WarmupUI />
      <Toaster theme="dark" position="bottom-center" />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} vaultCount={vaultItems?.length || 0} />

      <main className="flex-1 overflow-auto bg-[#020202] relative custom-scrollbar">
        {!isDbLoaded ? (
          <div className="flex h-full items-center justify-center">
             <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Suspense fallback={<div className="p-12 text-center text-indigo-500 font-black animate-pulse">SYSTEM_LOADING...</div>}>
            <div className={`h-full ${activeTab !== 'lumina' ? 'pb-24 lg:pb-0' : ''}`}>
              {activeTab === 'creation' && (
                <CreationLab onResult={handleCreationResult} params={studioParams} setParams={setStudioParams} settings={appSettings} onReset={handleResetStudio} vault={vaultItems} />
              )}
              {activeTab === 'workspace' && (
                <Workspace onSave={handleSaveToVault} vault={vaultItems} prompt={studioPrompt} setPrompt={setStudioPrompt} currentImage={studioCurrentImage} setCurrentImage={setStudioCurrentImage} originalSource={studioOriginalSource} setOriginalSource={setStudioOriginalSource} logs={studioLogs} setLogs={setStudioLogs} params={studioParams} setParams={setStudioParams} onReloadApp={handleResetStudio} grading={studioGrading} visualAnchor={studioVisualAnchor} settings={appSettings} />
              )}
              {activeTab === 'grading' && <GradingLab vault={vaultItems} onSave={handleSaveToVault} />}
              {activeTab === 'lumina' && <LuminaStudio />}
              {activeTab === 'cinema' && (
                <CinemaLab vault={vaultItems} onSave={handleSaveToVault} project={cinemaProject} setProject={setCinemaProject} script={cinemaScript} setScript={setCinemaScript} title={cinemaTitle} setTitle={setCinemaTitle} credits={cinemaCredits} setCredits={setCinemaCredits} logs={cinemaLogs} setLogs={setCinemaLogs} activeBeatIndex={activeBeatIndex} setActiveBeatIndex={setActiveBeatIndex} onReset={() => {}} settings={appSettings} />
              )}
              {activeTab === 'fusion' && (
                <FusionLab vault={vaultItems} onResult={(img, p, logs) => { setStudioCurrentImage(img); setStudioParams(p); setStudioLogs(logs); setActiveTab('workspace'); }} settings={appSettings} />
              )}
              {activeTab === 'vault' && (
                <Vault items={vaultItems} onDelete={handleDeleteFromVault} onRefresh={fetchVault} onClearAll={() => {}} onReload={(item) => { setStudioCurrentImage(item.imageUrl); setStudioParams(item.params); setActiveTab('workspace'); }} />
              )}
              {activeTab === 'settings' && <SettingsLab settings={appSettings} setSettings={setAppSettings} />}
              {activeTab === 'docs' && <DocsLab />}
              {activeTab === 'manual' && <ManualNode onSave={handleSaveToVault} settings={appSettings} />}
            </div>
          </Suspense>
        )}
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;