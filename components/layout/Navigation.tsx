import React from 'react';
import { 
  Sparkles, 
  Layout, 
  Database, 
  Cpu, 
  FlaskConical, 
  Video, 
  Palette, 
  Box, 
  Settings, 
  FileText 
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  vaultCount: number;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, vaultCount }) => {
  const navItems = [
    { id: 'creation', label: 'Creation', icon: Sparkles },
    { id: 'workspace', label: 'Workspace', icon: Layout },
    { id: 'lumina', label: 'Lumina Engine', icon: Box },
    { id: 'fusion', label: 'Fusion Lab', icon: FlaskConical },
    { id: 'cinema', label: 'Cinema Studio', icon: Video },
    { id: 'grading', label: 'Grading', icon: Palette },
    { id: 'vault', label: 'Vault', icon: Database, count: vaultCount },
    { id: 'manual', label: 'Kernel', icon: Cpu },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto bg-[#0e0e11] border-t border-white/5 px-4 py-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between lg:justify-start lg:gap-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          // CORREÇÃO CRÍTICA PARA O ERRO #31:
          // Extraímos o componente de ícone para uma constante com inicial MAIÚSCULA.
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex flex-col lg:flex-row items-center gap-1 lg:gap-2 px-3 py-2 rounded-lg transition-all duration-200 min-w-[70px] lg:min-w-0
                ${isActive 
                  ? 'bg-indigo-600/10 text-indigo-400' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
              `}
            >
              <div className="relative">
                {/* Renderizamos como TAG, nunca como {item.icon} */}
                {IconComponent && <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />}
                
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border border-[#0e0e11]">
                    {item.count}
                  </span>
                )}
              </div>
              
              <span className="text-[10px] lg:text-xs font-medium uppercase tracking-wider">
                {item.label}
              </span>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 lg:hidden" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;