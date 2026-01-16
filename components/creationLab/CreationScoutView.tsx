import React from 'react';
import { ScoutData } from '../../types';
import ScoutDashboard from '../ScoutDashboard';

interface CreationScoutViewProps {
  scoutData: ScoutData | null;
  groundingLinks: any[];
}

const CreationScoutView: React.FC<CreationScoutViewProps> = ({ scoutData, groundingLinks }) => {
  if (!scoutData) return null;

  return (
    <div className="col-span-1 md:col-span-2 space-y-4">
      <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-4">Visual Scout Intelligence</h3>
      <ScoutDashboard scoutData={scoutData} />
      
      {groundingLinks && groundingLinks.length > 0 && (
        <div className="bg-zinc-950/50 border border-white/10 p-6 rounded-[2rem] flex flex-wrap gap-4 items-center">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Grounding Sources:</span>
          {groundingLinks.map((link, idx) => {
            // CRITICAL: Ensure link is valid and has a title to prevent rendering an object directly.
            if (!link || typeof link !== 'object') return null;
            
            // Extract primitive title string
            const title = typeof link.title === 'string' ? link.title : (link.uri ? String(link.uri) : 'Source');
            const uri = typeof link.uri === 'string' ? link.uri : '#';
            
            return (
                <a 
                    key={idx} 
                    href={uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-indigo-400 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2}/></svg>
                    {String(title)}
                </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CreationScoutView;