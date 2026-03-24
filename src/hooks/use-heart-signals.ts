/**
 * useHeartSignals — reactive hook for the Heart Signal notification system.
 * Fetches, subscribes via realtime, marks read, dismisses.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { HeartSignal, HeartSignalType, HeartSignalFilter } from "@/lib/heart-signal-types";

export function useHeartSignals(userId: string | null) {
  const [signals, setSignals] = useState<HeartSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HeartSignalFilter>("all");

  const fetchSignals = useCallback(async () => {
    if (!userId) { setSignals([]); setLoading(false); return; }
    const { data } = await supabase
      .from("heart_signals")
      .select("*")
      .eq("user_id", userId)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(50);
    setSignals((data || []) as unknown as HeartSignal[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`heart-signals-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'heart_signals',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const newSignal = payload.new as unknown as HeartSignal;
        setSignals(prev => [newSignal, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unreadCount = useMemo(() => signals.filter(s => !s.is_read).length, [signals]);

  const unreadByType = useMemo(() => {
    const counts: Partial<Record<HeartSignalType, number>> = {};
    signals.forEach(s => {
      if (!s.is_read) {
        counts[s.signal_type] = (counts[s.signal_type] || 0) + 1;
      }
    });
    return counts;
  }, [signals]);

  // Dominant unread signal type for orb color
  const dominantType = useMemo<HeartSignalType | null>(() => {
    if (unreadCount === 0) return null;
    let max = 0;
    let dominant: HeartSignalType = "heart";
    for (const [type, count] of Object.entries(unreadByType)) {
      if ((count || 0) > max) {
        max = count || 0;
        dominant = type as HeartSignalType;
      }
    }
    return dominant;
  }, [unreadByType, unreadCount]);

  const filteredSignals = useMemo(() => {
    if (filter === "all") return signals;
    return signals.filter(s => s.signal_type === filter);
  }, [signals, filter]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from("heart_signals").update({ is_read: true } as any).eq("id", id);
    setSignals(prev => prev.map(s => s.id === id ? { ...s, is_read: true } : s));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from("heart_signals").update({ is_read: true } as any).eq("user_id", userId).eq("is_read", false);
    setSignals(prev => prev.map(s => ({ ...s, is_read: true })));
  }, [userId]);

  const dismiss = useCallback(async (id: string) => {
    await supabase.from("heart_signals").update({ dismissed: true } as any).eq("id", id);
    setSignals(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    signals: filteredSignals,
    allSignals: signals,
    unreadCount,
    unreadByType,
    dominantType,
    loading,
    filter,
    setFilter,
    markRead,
    markAllRead,
    dismiss,
    refetch: fetchSignals,
  };
}
