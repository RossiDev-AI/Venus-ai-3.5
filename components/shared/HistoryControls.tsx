
import React, { useEffect } from 'react';
import { useVenusHistory } from '../../stores/useVenusStore';
import { Undo2, Redo2 } from 'lucide-react';

interface HistoryControlsProps {
  className?: string;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({ className }) => {
  // Get the temporal hook factory (guaranteed to be a function now)
  const useTemporal = useVenusHistory();
  
  // Use the hook to get state. 
  // We use a selector to get the whole state object.
  const temporalState = useTemporal((state: any) => state) || {};
  
  const { undo, redo, pastStates = [], futureStates = [] } = temporalState;

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if input is focused to avoid conflict
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (redo) redo();
        } else {
          if (undo) undo();
        }
        e.preventDefault();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        if (redo) redo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className={`flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 ${className}`}>
      <button 
        onClick={() => undo && undo()}
        disabled={!canUndo}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all group relative"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
        {canUndo && (
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        )}
      </button>
      
      <div className="w-[1px] h-4 bg-white/10" />
      
      <button 
        onClick={() => redo && redo()}
        disabled={!canRedo}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
};

export default HistoryControls;
