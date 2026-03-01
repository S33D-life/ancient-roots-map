/**
 * InfluenceTokenContext — lifts influence_transactions query to page level.
 * Provides token aggregates to all InfluenceUpvoteButtons via context,
 * eliminating N redundant queries per tree page.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TokenAggregates {
  /** Raw transactions for the user */
  byTreeId: Map<string, number>;
  bySpecies: Map<string, number>;
  byScope: Map<string, number>;
  loaded: boolean;
}

interface InfluenceTokenContextValue {
  tokens: TokenAggregates;
  refreshTokens: () => Promise<void>;
  getTreeTotal: (treeId: string) => number;
  getSpeciesTotal: (species: string) => number;
  getPlaceTotal: (nation: string) => number;
}

const defaultTokens: TokenAggregates = {
  byTreeId: new Map(),
  bySpecies: new Map(),
  byScope: new Map(),
  loaded: false,
};

const InfluenceTokenContext = createContext<InfluenceTokenContextValue>({
  tokens: defaultTokens,
  refreshTokens: async () => {},
  getTreeTotal: () => 0,
  getSpeciesTotal: () => 0,
  getPlaceTotal: () => 0,
});

export const useInfluenceTokens = () => useContext(InfluenceTokenContext);

export const InfluenceTokenProvider = ({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) => {
  const [tokens, setTokens] = useState<TokenAggregates>(defaultTokens);

  const refreshTokens = useCallback(async () => {
    if (!userId) {
      setTokens(defaultTokens);
      return;
    }

    const { data: txns } = await supabase
      .from("influence_transactions")
      .select("tree_id, species_family, scope, amount")
      .eq("user_id", userId);

    const rows = txns || [];
    const byTreeId = new Map<string, number>();
    const bySpecies = new Map<string, number>();
    const byScope = new Map<string, number>();

    for (const t of rows) {
      if (t.tree_id) {
        byTreeId.set(t.tree_id, (byTreeId.get(t.tree_id) || 0) + t.amount);
      }
      if (t.species_family) {
        bySpecies.set(t.species_family, (bySpecies.get(t.species_family) || 0) + t.amount);
      }
      byScope.set(t.scope, (byScope.get(t.scope) || 0) + t.amount);
    }

    setTokens({ byTreeId, bySpecies, byScope, loaded: true });
  }, [userId]);

  useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  const getTreeTotal = useCallback(
    (treeId: string) => tokens.byTreeId.get(treeId) || 0,
    [tokens]
  );

  const getSpeciesTotal = useCallback(
    (species: string) => tokens.bySpecies.get(species) || 0,
    [tokens]
  );

  const getPlaceTotal = useCallback(
    (nation: string) => {
      const globalTotal = tokens.byScope.get("global") || 0;
      const nationTotal = tokens.byScope.get(nation) || 0;
      return Math.round((globalTotal + nationTotal) * 0.1);
    },
    [tokens]
  );

  return (
    <InfluenceTokenContext.Provider
      value={{ tokens, refreshTokens, getTreeTotal, getSpeciesTotal, getPlaceTotal }}
    >
      {children}
    </InfluenceTokenContext.Provider>
  );
};
