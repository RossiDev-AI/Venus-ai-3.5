
import React from 'react';
import { ProcessingSpeed } from '../../types';

interface ProcessingControlProps {
  speed: ProcessingSpeed;
  setSpeed: (speed: ProcessingSpeed) => void;
}

const ProcessingControl: React.FC<ProcessingControlProps> = ({ speed, setSpeed }) => {
  const modes: { id: ProcessingSpeed; label: string; desc: string; icon: string; color: string }[] = [
    { id: 'Fast', label: 'Fast', desc: 'Minimal.', icon: '⚡', color: 'text-amber-400' },
    { id: 'Balanced', label: 'Balanced', desc: 'Standard.', icon: '⚖️', color: 'text-indigo-400' },
    { id: 'Deliberate', label: 'Deliberate', desc: 'Deep.', icon: '🎯', color: 'text-emerald-400' },
    { id: 'Debug', label: 'Debug', desc: 'Full.', icon: '🐛', color: 'text-pink-400' },
  ];

  return (
    <div className="bg-[#111114] border border-white/5 rounded-2xl p-3 md:p-6 space-y-3">
      <h3 className="text-[8px] md:text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">🧠 Pacing Engine</h3>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSpeed(mode.id)}
            className={`flex flex-col gap-1 p-2 rounded-xl border transition-all text-left ${speed === mode.id ? 'bg-zinc-800/50 border-white/20' : 'bg-black/20 border-white/5'}`}
          >
            <span className={`text-[8px] font-black uppercase tracking-widest ${speed === mode.id ? mode.color : 'text-zinc-600'}`}>{mode.label}</span>
            <span className="text-[6px] text-zinc-700 uppercase">{mode.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProcessingControl;
