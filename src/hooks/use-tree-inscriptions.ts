import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-current-user';
import { listTreeInscriptions, type TreeInscription } from '@/repositories/grove-roots';
/** Server-filtered active marks; scope cached responses to the current viewer. */
export function useTreeInscriptions(treeId: string, previewMarks?: TreeInscription[], enabled = true) {
  const { userId } = useCurrentUser();
  const query = useQuery({
    queryKey: ['tree-inscriptions', treeId, userId],
    queryFn: () => listTreeInscriptions(treeId),
    refetchOnMount: 'always',
    enabled: enabled && !!treeId && previewMarks === undefined,
    ...(previewMarks !== undefined ? { initialData: previewMarks } : {}),
  });
  return { ...query, data: previewMarks ?? (query.isFetching || query.isError ? undefined : query.data) };
}
