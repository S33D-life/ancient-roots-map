import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { listTreeInscriptions, type TreeInscription } from '@/repositories/grove-roots';
/** Server-filtered active marks; scope cached responses to the current viewer. */
export function useTreeInscriptions(treeId: string, previewMarks?: TreeInscription[], enabled = true) {
  const { userId } = useCurrentUser();
  return useQuery({
    queryKey: ['tree-inscriptions', treeId, userId],
    queryFn: () => listTreeInscriptions(treeId),
    enabled: enabled && !!treeId && previewMarks === undefined,
    ...(previewMarks !== undefined ? { initialData: previewMarks } : {}),
  });
}
