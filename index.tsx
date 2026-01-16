
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global Diagnostic Engine para infraestrutura de baixo nível
window.addEventListener('error', (event) => {
  const isResourceError = event.target instanceof HTMLElement && 
    (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK');
  
  if (isResourceError) {
    console.error(`[VENUS_DIAGNOSTIC]: Falha crítica ao carregar recurso binário: ${(event.target as any).src || (event.target as any).href}`);
    console.warn("DICA: Verifique se o Isolamento de Origem (COI) foi bloqueado pelo navegador.");
  }
}, true);

// Verificação de SharedArrayBuffer
if (typeof SharedArrayBuffer === 'undefined') {
    console.warn("[VENUS_DIAGNOSTIC]: SharedArrayBuffer INDISPONÍVEL. O motor FFmpeg operará em modo Single-Thread (Fallback).");
} else if (!window.crossOriginIsolated) {
    console.warn("[VENUS_DIAGNOSTIC]: crossOriginIsolated é FALSE. Recursos de IA podem ser bloqueados por segurança.");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
