
import { useState, useEffect, useRef } from 'react';
import * as Comlink from 'https://esm.sh/comlink@4.4.1';

export const useLuminaAI = () => {
  const workerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Robust Path Resolution: Usa window.location.origin para garantir caminho absoluto
    // Isso evita problemas com import.meta.url em subdiretórios ou ambientes de preview
    const workerPath = '/workers/ia.worker.ts'; 
    const workerUrl = new URL(workerPath, window.location.origin);
    
    const worker = new Worker(workerUrl, { type: 'module' });
    workerRef.current = Comlink.wrap(worker);
    
    return () => worker.terminate();
  }, []);

  const removeBackground = async (url: string) => {
    if (!workerRef.current) return null;
    setLoading(true);
    try {
      const bitmap = await workerRef.current.segmentImage(url);
      return bitmap;
    } catch (error) {
      console.error("AI Kernel Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeSignal = async (base64: string) => {
    if (!workerRef.current) return null;
    return await workerRef.current.analyzeLuminance(base64);
  };

  return { removeBackground, analyzeSignal, loading };
};
