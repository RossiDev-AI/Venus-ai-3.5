import React, { useEffect, useRef, useState } from 'react';
import { AgentStatus, DeliberationStep } from '../../types';

interface AgentFeedProps {
  logs: AgentStatus[];
  isProcessing: boolean;
  deliberation_flow?: DeliberationStep[];
}

const AgentFeed: React.FC<AgentFeedProps> = ({ logs, isProcessing, deliberation_flow }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'terminal' | 'flow'>('terminal');

  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isProcessing]);

  const getDeptColor = (dept?: string) => {
    switch(dept) {
      case 'Direction': return 'text-blue-400';
      case 'Advanced': return 'text-indigo-400';
      case 'Texture': return 'text-emerald-400';
      case 'Casting': return 'text-pink-400';
      default: return 'text-zinc-500';
    }
  };

  const getLogStyle = (type: string) => {
    if (type === 'Director') return 'bg-blue-500/5 border-blue-500/20';
    if (type === 'Lighting Architect') return 'bg-amber-500/5 border-amber-500/20';
    if (type === 'Texture Master') return 'bg-emerald-500/5 border-emerald-500/20';
    if (type === 'Visual Archivist') return 'bg-indigo-600/10 border-indigo-500/30';
    if (type === 'Meta-Prompt Translator') return 'bg-purple-500/10 border-purple-500/30';
    return 'bg-zinc-900/40 border-white/5';
  };

  const formatMessage = (msg: any): string => {
    if (typeof msg === 'string') return msg;
    if (msg === null || msg === undefined) return '';
    try {
        return JSON.stringify(msg);
    } catch(e) {
        return 'Data Fragment Error';
    }
  };

  return (
    <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col h-full min-h-[400px]">
      <div className="bg-zinc-900/80 px-4 py-2 border-b border-white/5 flex items-center justify-between sticky top-0 z-20">
         <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
         </div>
         <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button onClick={() => setViewMode('terminal')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${viewMode === 'terminal' ? 'bg-zinc-700 text-white' : 'text-zinc-600'}`}>Log</button>
            <button onClick={() => setViewMode('flow')} className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${viewMode === 'flow' ? 'bg-zinc-700 text-white' : 'text-zinc-600'}`}>Flow</button>
         </div>
         <span className="hidden md:inline text-[7px] mono text-zinc-600 font-bold uppercase tracking-widest">MAD_KERNEL_v12.2</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-5 space-y-3 mono text-[10px] scroll-smooth custom-scrollbar relative bg-[#020202]">
        <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        {viewMode === 'terminal' ? (
          <>
            {logs.length === 0 && !isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-900">
                <p className="text-[9px] uppercase tracking-[0.8em] font-black animate-pulse">KERNEL_STANDBY_</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`animate-in fade-in slide-in-from-left-2 duration-300 p-3 rounded-xl border ${getLogStyle(log.type)}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-zinc-800 shrink-0 font-bold">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center w-full">
                          <span className={`font-black shrink-0 ${getDeptColor(log.department)} uppercase tracking-tighter`}>{log.type.replace(/\s/g, '_')}</span>
                          {log.status === 'processing' && <span className="text-[6px] px-1 bg-white/5 rounded text-zinc-600 animate-pulse">ANALYZING</span>}
                      </div>
                      <p className="text-zinc-400 leading-relaxed break-words border-l border-white/5 pl-3 py-1 mt-1">
                        {formatMessage(log.message)}
                        {i === logs.length - 1 && isProcessing && <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse" />}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <div className="space-y-6 py-4">
             {deliberation_flow && deliberation_flow.length > 0 ? deliberation_flow.map((step, i) => (
                <div key={i} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-[-20px] before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:to-transparent">
                   <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-black z-10 flex items-center justify-center" />
                   <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{step.from} → {step.to}</span>
                         <span className="text-[7px] text-zinc-600 mono">{new Date(step.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] font-black text-white uppercase">{formatMessage(step.action)}</p>
                      <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg">
                         <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                         <span className="text-[8px] text-zinc-400 mono italic">{formatMessage(step.impact)}</span>
                      </div>
                   </div>
                </div>
             )) : <div className="text-zinc-800 text-center py-20 uppercase font-black tracking-widest text-[9px]">Awaiting decision trace</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFeed;