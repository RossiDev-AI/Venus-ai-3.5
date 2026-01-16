
import React from 'react';

const DocsLab: React.FC = () => {
  const sections = [
    {
      title: "1. The Venus Pipeline",
      content: "Venus is a multi-agent latent space orchestrator. It uses a swarm of specialized AI agents (Director, Scriptwriter, Alchemist) to transform abstract prompts into cohesive visual documentaries."
    },
    {
      title: "2. DNA Components (PEP, POP, POV, AMB)",
      content: "Our system categorizes visual assets into four domains:\n- PEP: Personal Identity (Character DNA)\n- POP: Position & Pose (Kinetic DNA)\n- POV: Point of View (Lens & Optics)\n- AMB: Ambient/Environment (Spatial DNA)"
    },
    {
      title: "3. Creation & Studio",
      content: "Use the Creation Hub to generate high-fidelity frames. The Studio allows you to biopsy these frames, extracting their latent DNA for reuse in the Fusion Reactor or Cinema Timeline."
    },
    {
      title: "4. Fusion Reactor",
      content: "Merge identity from one node with a pose from another. The Fusion Reactor performs 'identity migration', ensuring your character stays consistent across different skeletal projections."
    },
    {
      title: "5. Cinema Master",
      content: "Convert a script into a full-length documentary. The Cinema Lab orchestrates search agents to find visual references (Pexels/Unsplash) or generates them using AI synth to match your narrative beats."
    },
    {
      title: "6. LGN Mastering",
      content: "Post-production is handled via Low-Level Latent Grading. Adjust lift, gamma, gain, and apply film-stock emulations (Kodak/Fuji) directly on the neural output."
    }
  ];

  return (
    <div className="min-h-full bg-[#050505] p-6 md:p-16 lg:p-24 overflow-y-auto custom-scrollbar flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-16">
        <header className="space-y-4 border-b border-white/5 pb-12">
           <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Venus Protocol</h2>
           <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs">V2.0 Industrial Documentation</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-4 p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] hover:border-indigo-500/30 transition-all group">
               <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{sec.title}</h3>
               <p className="text-zinc-500 text-xs leading-relaxed whitespace-pre-wrap mono font-medium">
                 {sec.content}
               </p>
            </div>
          ))}
        </div>

        <div className="p-12 bg-indigo-600/5 border border-indigo-500/20 rounded-[3rem] space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Advanced Tip: DNA Locking</h4>
           </div>
           <p className="text-sm text-zinc-400 leading-relaxed uppercase">
             To achieve perfect character consistency, generate a 'Base Character' in the Creation Hub, save it to your Vault, and then use it as the PEP node in the Fusion Reactor. Set Z_ANATOMY to > 1.2 for strict identity preservation.
           </p>
        </div>

        <footer className="pt-20 pb-12 text-center opacity-20">
           <p className="text-[10px] mono uppercase text-white font-bold tracking-[1em]">Venus v2.0 // Latent Cinema Systems</p>
        </footer>
      </div>
    </div>
  );
};

export default DocsLab;
