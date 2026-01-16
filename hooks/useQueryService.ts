
import { useQuery, useMutation, useQueryClient } from "https://esm.sh/@tanstack/react-query@5.28.4";
import { getAllNodes, saveNode, deleteNode, getSessionSnapshot, saveSessionSnapshot, getAssetUrl } from '../dbService';
import { VaultItem } from '../types';

// --- Vault Queries ---

export const useVault = () => {
  return useQuery({
    queryKey: ['vault'],
    queryFn: getAllNodes,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useVaultMutation = () => {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: saveNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    }
  });

  const remove = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    }
  });

  return { save, remove };
};

// --- Session Queries ---

export const useLuminaSession = (sessionId: string) => {
  const queryClient = useQueryClient();

  const session = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSessionSnapshot(sessionId),
    staleTime: Infinity, // Manually invalidated
  });

  const save = useMutation({
    mutationFn: (data: { id: string, snapshot: any }) => saveSessionSnapshot(data.id, data.snapshot),
    onSuccess: (_, variables) => {
      // Optimistic updates handled by Tldraw, this confirms sync
    }
  });

  return { session, save };
};

// --- Asset Queries ---

export const useAssetUrl = (id: string | undefined, type: 'thumbnail' | 'original' = 'original') => {
  return useQuery({
    queryKey: ['asset', id, type],
    queryFn: () => id ? getAssetUrl(id, type) : null,
    enabled: !!id,
    staleTime: Infinity // Assets are immutable usually
  });
};
