/**
 * useGroveAuthority — who am I to this grove?
 *
 * The answer always comes from the database. The UI uses it only to decide
 * what to show; every action is independently enforced server-side.
 */
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  isGroveContributor,
  isGrovePrimarySteward,
  isGroveSteward,
} from "@/repositories/life-grove-stewardship";

export interface GroveAuthority {
  userId: string | null;
  isPrimarySteward: boolean;
  isSteward: boolean;
  isContributor: boolean;
  isLoading: boolean;
}

export function useGroveAuthority(groveId: string | undefined): GroveAuthority {
  const { userId } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["grove-authority", groveId, userId],
    enabled: !!groveId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!groveId || !userId) {
        return { primary: false, steward: false, contributor: false };
      }
      const [primary, steward, contributor] = await Promise.all([
        isGrovePrimarySteward(groveId, userId),
        isGroveSteward(groveId, userId),
        isGroveContributor(groveId, userId),
      ]);
      return { primary, steward, contributor };
    },
  });

  return {
    userId,
    isPrimarySteward: !!data?.primary,
    isSteward: !!data?.steward,
    isContributor: !!data?.contributor,
    isLoading,
  };
}
