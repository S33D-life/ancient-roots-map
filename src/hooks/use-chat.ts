import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChatRoom {
  id: string;
  type: string;
  name: string;
  tree_id: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

export interface OnlineUser {
  user_id: string;
  display_name: string | null;
  is_online: boolean;
  last_seen: string;
}

export function useChat() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("Ancient Friend");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Fetch display name
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
          .then(({ data }) => {
            if (data?.full_name) setUserDisplayName(data.full_name);
          });
        // Upsert presence
        supabase.from("user_presence").upsert({
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString(),
          display_name: null, // will update after profile fetch
        }, { onConflict: "user_id" });
      }
    });

    // Set offline on unmount
    return () => {
      if (userId) {
        supabase.from("user_presence").update({ is_online: false, last_seen: new Date().toISOString() }).eq("user_id", userId);
      }
    };
  }, []);

  // Update presence display name when fetched
  useEffect(() => {
    if (userId && userDisplayName !== "Ancient Friend") {
      supabase.from("user_presence").update({ display_name: userDisplayName }).eq("user_id", userId);
    }
  }, [userId, userDisplayName]);

  // Fetch rooms
  useEffect(() => {
    supabase.from("chat_rooms").select("*").order("created_at").then(({ data }) => {
      if (data) {
        setRooms(data);
        // Auto-select global room
        const global = data.find(r => r.type === "global");
        if (global && !activeRoom) setActiveRoom(global);
      }
    });
  }, []);

  // Fetch online users
  useEffect(() => {
    const fetchOnline = () => {
      supabase.from("user_presence").select("*").eq("is_online", true).then(({ data }) => {
        if (data) setOnlineUsers(data);
      });
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);

    // Subscribe to presence changes
    const presenceChannel = supabase
      .channel("presence-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchOnline();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      presenceChannel.unsubscribe();
    };
  }, []);

  // Heartbeat presence
  useEffect(() => {
    if (!userId) return;
    const heartbeat = setInterval(() => {
      supabase.from("user_presence").update({ last_seen: new Date().toISOString(), is_online: true }).eq("user_id", userId);
    }, 60000);
    return () => clearInterval(heartbeat);
  }, [userId]);

  // Fetch messages and subscribe when active room changes
  useEffect(() => {
    if (!activeRoom) return;

    // Fetch existing messages (last 50)
    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", activeRoom.id)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(async ({ data }) => {
        if (data) {
          // Enrich with display names
          const userIds = [...new Set(data.map(m => m.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          
          const enriched = data.map(m => ({
            ...m,
            display_name: profileMap.get(m.user_id)?.full_name || "Ancient Friend",
            avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
          }));
          setMessages(enriched);
        }
      });

    // Subscribe to new messages
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    channelRef.current = supabase
      .channel(`room-${activeRoom.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${activeRoom.id}` },
        async (payload) => {
          const msg = payload.new as ChatMessage;
          // Enrich with profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", msg.user_id)
            .maybeSingle();
          
          setMessages(prev => [...prev, {
            ...msg,
            display_name: profile?.full_name || "Ancient Friend",
            avatar_url: profile?.avatar_url || null,
          }]);
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [activeRoom?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId || !activeRoom || !content.trim()) return;
    
    const trimmed = content.trim().substring(0, 2000); // Max 2000 chars
    
    const { error } = await supabase.from("chat_messages").insert({
      room_id: activeRoom.id,
      user_id: userId,
      content: trimmed,
    });

    if (error) {
      toast({ title: "Message failed", description: error.message, variant: "destructive" });
    }
  }, [userId, activeRoom, toast]);

  return {
    rooms,
    activeRoom,
    setActiveRoom,
    messages,
    onlineUsers,
    sendMessage,
    userId,
    userDisplayName,
  };
}
