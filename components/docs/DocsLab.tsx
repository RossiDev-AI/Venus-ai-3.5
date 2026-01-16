
import React from 'react';

const DocsLab: React.FC = () => {
  const sections = [
    { title: "1. The Venus Pipeline", content: "Venus is a multi-agent latent space orchestrator using Gemini 3 intelligence." },
    { title: "2. DNA Components", content: "PEP (Identity), POP (Pose), POV (Lens), AMB (Ambient)." },
    { title: "3. Fusion Reactor", content: "Advanced identity migration system for consistency." }
  ];

  return (
    <div className="min-h-full bg-[#050505] p-6 md:p-16 overflow-y-auto flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-16">
        <header className="space-y-4 border-b border-white/5 pb-12">
           <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Venus Protocol</h2>
           <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs">V2.0 Industrial Documentation</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-4 p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
               <h3 className="text-lg font-black text-white uppercase tracking-tight">{sec.title}</h3>
               <p className="text-zinc-500 text-xs mono">{sec.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocsLab;
