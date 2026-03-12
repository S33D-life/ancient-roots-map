import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type CompanionCommand,
  type CompanionRoomState,
  type CompanionSession,
  type CompanionRoom,
  generatePairingCode,
  channelFromCode,
  SESSION_TTL_MS,
} from "@/lib/companion-types";

type RealtimeChannel = ReturnType<typeof supabase.channel>;

interface UseCompanionSessionOptions {
  role: "display" | "controller";
  /** Callback when a command is received (display side) */
  onCommand?: (cmd: CompanionCommand) => void;
  /** Callback when room state is received (controller side) */
  onRoomState?: (state: CompanionRoomState) => void;
}

export function useCompanionSession(options: UseCompanionSessionOptions) {
  const { role, onCommand, onRoomState } = options;
  const [session, setSession] = useState<CompanionSession | null>(null);
  const [roomState, setRoomState] = useState<CompanionRoomState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommandRef = useRef(onCommand);
  const onRoomStateRef = useRef(onRoomState);
  onCommandRef.current = onCommand;
  onRoomStateRef.current = onRoomState;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (expiryRef.current) {
      clearTimeout(expiryRef.current);
      expiryRef.current = null;
    }
    setSession(null);
    setRoomState(null);
  }, []);

  /** Display: start a session and wait for controller */
  const startSession = useCallback(() => {
    cleanup();
    const code = generatePairingCode();
    const channelName = channelFromCode(code);

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "pair" }, () => {
        setSession((s) => s ? { ...s, paired: true, connectedAt: Date.now() } : s);
        // Acknowledge pairing
        channel.send({ type: "broadcast", event: "pair_ack", payload: {} });
      })
      .on("broadcast", { event: "command" }, ({ payload }) => {
        onCommandRef.current?.(payload as CompanionCommand);
      })
      .on("broadcast", { event: "disconnect" }, () => {
        cleanup();
      })
      .subscribe();

    channelRef.current = channel;
    setSession({ code, channelName, role: "display", paired: false });

    // Auto-expire
    expiryRef.current = setTimeout(cleanup, SESSION_TTL_MS);
  }, [cleanup]);

  /** Controller: join a session by code */
  const joinSession = useCallback(
    (code: string) => {
      cleanup();
      const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (normalized.length !== 6) return false;

      const channelName = channelFromCode(normalized);
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "pair_ack" }, () => {
          setSession((s) => s ? { ...s, paired: true, connectedAt: Date.now() } : s);
        })
        .on("broadcast", { event: "room_state" }, ({ payload }) => {
          const state = payload as CompanionRoomState;
          setRoomState(state);
          onRoomStateRef.current?.(state);
        })
        .on("broadcast", { event: "disconnect" }, () => {
          cleanup();
        })
        .subscribe(() => {
          // Once subscribed, send pair request
          channel.send({ type: "broadcast", event: "pair", payload: {} });
        });

      channelRef.current = channel;
      setSession({ code: normalized, channelName, role: "controller", paired: false });

      expiryRef.current = setTimeout(cleanup, SESSION_TTL_MS);
      return true;
    },
    [cleanup],
  );

  /** Send a command (controller → display) */
  const sendCommand = useCallback((cmd: CompanionCommand) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "command",
      payload: cmd,
    });
  }, []);

  /** Broadcast room state (display → controller) */
  const broadcastRoomState = useCallback((state: CompanionRoomState) => {
    setRoomState(state);
    channelRef.current?.send({
      type: "broadcast",
      event: "room_state",
      payload: state,
    });
  }, []);

  /** Disconnect gracefully */
  const disconnect = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "disconnect",
      payload: {},
    });
    // Small delay so message sends before channel cleanup
    setTimeout(cleanup, 100);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return {
    session,
    roomState,
    paired: session?.paired ?? false,
    startSession,
    joinSession,
    sendCommand,
    broadcastRoomState,
    disconnect,
  };
}
