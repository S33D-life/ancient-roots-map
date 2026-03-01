import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GroveQuote {
  offering_id: string;
  quote_text: string;
  quote_author: string | null;
  quote_source: string | null;
  created_by: string | null;
  created_at: string;
  tree_id: string;
  like_count: number;
  influence_score: number;
  computed_score: number;
  creator_name: string | null;
  creator_avatar: string | null;
  liked_by_me?: boolean;
}

export interface ExternalWisdom {
  quote_text: string;
  author_name: string | null;
  source_title: string | null;
}

export function useGroveQuotes(timeframe: "moon_cycle" | "7d" | "all_time" = "moon_cycle") {
  const [quotes, setQuotes] = useState<GroveQuote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase.rpc("get_top_grove_quotes", {
      p_timeframe: timeframe,
      p_limit: 5,
    });

    if (error || !data) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    // Check which ones the current user has liked
    let likedIds = new Set<string>();
    if (userId && data.length > 0) {
      const offeringIds = data.map((q: any) => q.offering_id);
      const { data: likes } = await supabase
        .from("quote_likes")
        .select("offering_id")
        .eq("user_id", userId)
        .in("offering_id", offeringIds);
      likedIds = new Set((likes || []).map((l: any) => l.offering_id));
    }

    setQuotes(
      data.map((q: any) => ({
        ...q,
        liked_by_me: likedIds.has(q.offering_id),
      }))
    );
    setLoading(false);
  }, [timeframe]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const toggleLike = async (offeringId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return;

    const quote = quotes.find((q) => q.offering_id === offeringId);
    if (!quote) return;

    if (quote.liked_by_me) {
      await supabase
        .from("quote_likes")
        .delete()
        .eq("offering_id", offeringId)
        .eq("user_id", userData.user.id);
    } else {
      await supabase.from("quote_likes").insert({
        offering_id: offeringId,
        user_id: userData.user.id,
      });
    }

    // Optimistic update
    setQuotes((prev) =>
      prev.map((q) =>
        q.offering_id === offeringId
          ? {
              ...q,
              liked_by_me: !q.liked_by_me,
              like_count: q.liked_by_me ? q.like_count - 1 : q.like_count + 1,
            }
          : q
      )
    );
  };

  return { quotes, loading, toggleLike, refetch: fetchQuotes };
}

export function useExternalWisdom() {
  const [wisdom, setWisdom] = useState<ExternalWisdom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWisdom = async () => {
      // Check cache first
      const { data: cached } = await supabase
        .from("external_wisdom_cache")
        .select("*")
        .gte("expires_at", new Date().toISOString())
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        setWisdom({
          quote_text: cached.quote_text,
          author_name: cached.author_name,
          source_title: cached.source_title,
        });
        setLoading(false);
        return;
      }

      // Fetch from Quotable API
      try {
        const res = await fetch("https://api.quotable.io/quotes/random?limit=1", {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const [quote] = await res.json();
          const wisdom: ExternalWisdom = {
            quote_text: quote.content,
            author_name: quote.author,
            source_title: null,
          };
          setWisdom(wisdom);

          // Cache it
          await supabase.from("external_wisdom_cache").insert({
            provider: "quotable",
            quote_text: wisdom.quote_text,
            author_name: wisdom.author_name,
            source_title: wisdom.source_title,
          });
        }
      } catch {
        // Fallback static quote if API fails
        setWisdom({
          quote_text: "The clearest way into the Universe is through a forest wilderness.",
          author_name: "John Muir",
          source_title: null,
        });
      }
      setLoading(false);
    };

    fetchWisdom();
  }, []);

  return { wisdom, loading };
}
