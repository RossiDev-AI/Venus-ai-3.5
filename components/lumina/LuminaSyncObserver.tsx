
import React, { useEffect } from 'react';
import { useEditor } from 'tldraw';
import { useVenusStore } from '../../stores/useVenusStore';
import { saveSessionSnapshot } from '../../dbService';

const LuminaSyncObserver: React.FC = () => {
  const editor = useEditor();
  const updateLumina = useVenusStore(state => state.updateLumina);
  const saveStableSnapshot = useVenusStore(state => state.saveStableSnapshot);

  useEffect(() => {
    let timeout: any;

    const cleanup = editor.store.listen((event) => {
      // 1. Camera & Selection Sync
      const { x, y, z } = editor.getCamera();
      const selectedIds = editor.getSelectedShapeIds();
      
      updateLumina({
        camera: { x, y, z },
        editingShapeId: selectedIds.length === 1 ? selectedIds[0] : null
      });

      // 2. Snapshot Strategy (Autosave to IndexedDB)
      if (event.source === 'user') {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          // In tldraw v3, use store.getSnapshot()
          const snapshot = editor.store.getSnapshot();
          await saveSessionSnapshot('MASTER_BUFFER', snapshot);
          saveStableSnapshot(snapshot);
        }, 1000);
      }
    });

    return () => {
      cleanup();
      clearTimeout(timeout);
    };
  }, [editor, updateLumina, saveStableSnapshot]);

  return null;
};

export default LuminaSyncObserver;
