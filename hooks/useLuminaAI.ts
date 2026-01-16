import { useState, useEffect, useRef } from 'react';
import * as Comlink from 'https://esm.sh/comlink@4.4.1';

export const useLuminaAI = () => {
  const workerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Caminho absoluto para workers/ia.worker.ts na raiz
    const workerUrl = new URL('/workers/ia.worker.ts', import.meta.url);
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