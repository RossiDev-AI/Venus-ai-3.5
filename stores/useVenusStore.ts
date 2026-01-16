import { create } from 'https://esm.sh/zustand@4.5.2';
import { produce } from 'https://esm.sh/immer@10.0.3';
import { temporal } from 'https://esm.sh/zundo@2.1.0';
import { LatentGrading } from '../types';

export type ProcessStatus = 'idle' | 'running' | 'completed' | 'error';

export interface AIJob {
  id: string;
  type: 'generation' | 'inpainting' | 'analysis';
  progress: number;
  status: ProcessStatus;
  startTime: number;
}

export interface LuminaState {
  activePresetId: string | null;
  editingShapeId: string | null;
  camera: { x: number; y: number; z: number };
  lastStableSnapshot: any | null; 
}

export interface VenusState {
  vaultStatus: 'idle' | 'syncing' | 'offline';
  setVaultStatus: (status: 'idle' | 'syncing' | 'offline') => void;

  lumina: LuminaState;
  updateLumina: (updates: Partial<LuminaState>) => void;
  saveStableSnapshot: (snapshot: any) => void;
  
  detectedSceneText: string;
  setDetectedSceneText: (text: string) => void;
  detectedSceneKeywords: string[];
  setDetectedSceneKeywords: (keywords: string[]) => void;

  activeGrading: null | LatentGrading;
  setActiveGrading: (grading: LatentGrading | null) => void;

  aiQueue: AIJob[];
  addJob: (job: Omit<AIJob, 'progress' | 'status' | 'startTime'>) => void;
  updateJob: (id: string, updates: Partial<AIJob>) => void;
  
  error: string | null;
  setError: (msg: string | null) => void;
  recoverState: () => any | null;
}

export const useVenusStore = create<VenusState>()(
  temporal(
    (set, get) => ({
      vaultStatus: 'idle',
      setVaultStatus: (status) => set({ vaultStatus: status }),

      lumina: {
        activePresetId: null,
        editingShapeId: null,
        camera: { x: 0, y: 0, z: 1 },
        lastStableSnapshot: null,
      },

      updateLumina: (updates) => set(produce((state: VenusState) => {
        Object.assign(state.lumina, updates);
      })),

      saveStableSnapshot: (snapshot) => set(produce((state: VenusState) => {
        state.lumina.lastStableSnapshot = snapshot;
        state.error = null;
      })),

      detectedSceneText: '',
      setDetectedSceneText: (text) => set({ detectedSceneText: text }),
      detectedSceneKeywords: [],
      setDetectedSceneKeywords: (keywords) => set({ detectedSceneKeywords: keywords }),

      activeGrading: null,
      setActiveGrading: (grading) => set({ activeGrading: grading }),

      aiQueue: [],

      addJob: (job) => set(produce((state: VenusState) => {
        state.aiQueue.push({
          ...job,
          progress: 0,
          status: 'running',
          startTime: Date.now(),
        });
      })),

      updateJob: (id, updates) => set(produce((state: VenusState) => {
        const job = state.aiQueue.find(j => j.id === id);
        if (job) {
          Object.assign(job, updates);
        }
      })),

      error: null,
      setError: (msg) => set({ error: msg }),

      recoverState: () => {
        const { lumina } = get();
        if (lumina.lastStableSnapshot) {
          console.warn("Venus Core: Recovering from stable snapshot...");
          return lumina.lastStableSnapshot;
        }
        return null;
      }
    }),
    {
      partialize: (state) => ({ 
        lumina: state.lumina,
        activeGrading: state.activeGrading,
        detectedSceneText: state.detectedSceneText,
        detectedSceneKeywords: state.detectedSceneKeywords
      }), 
      limit: 50,
    }
  )
);

const dummyTemporalHook = (selector?: any) => {
  const state = { 
    undo: () => {}, 
    redo: () => {}, 
    pastStates: [], 
    futureStates: [],
    clear: () => {}
  };
  return typeof selector === 'function' ? selector(state) : state;
};

export const useVenusHistory = () => {
  const store = useVenusStore as any;
  if (store && typeof store.temporal === 'function') {
    return store.temporal;
  }
  return dummyTemporalHook;
};