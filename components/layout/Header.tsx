
import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-[500] h-14 md:h-20 flex items-center justify-between px-4 md:px-12 bg-black/40 backdrop-blur-2xl border-b border-white/5">
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="relative group cursor-pointer" onClick={() => setActiveTab('creation')}>
          <div className="absolute inset-0 bg-indigo-600 rounded-lg blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
          <div className="relative w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-2xl border border-white/10">
             <span className="text-white font-black text-xs md:text-sm">V</span>
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm md:text-xl font-black tracking-tighter uppercase leading-none text-white whitespace-nowrap">Venus <span className="text-indigo-500">AI</span></h1>
          <span className="text-[7px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-60 hidden sm:block">Neural Studio v2.0</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[6px] md:text-[8px] font-black text-indigo-500 uppercase tracking-widest">System Load</span>
              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '42%' }} />
              </div>
          </div>
          <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[7px] md:text-[9px] mono text-emerald-400 uppercase font-black">Online</div>
      </div>
    </header>
  );
};

export default Header;
