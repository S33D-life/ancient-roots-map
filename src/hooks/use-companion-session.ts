import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type CompanionCommand,
  type CompanionRoomState,
  type CompanionSession,
  generatePairingCode,
  channelFromCode,
  SESSION_TTL_MS,
  VALID_COMMAND_TYPES,
} from "@/lib/companion-types";

type RealtimeChannel = ReturnType<typeof supabase.channel>;

/** How long to wait for pair_ack before giving up (ms) */
const PAIR_TIMEOUT_MS = 12_000;

/**
 * Minimum interval between outgoing commands (ms).
 * Reduced from 60ms to 16ms (~60fps) so continuous pointer/scroll feels smooth.
 */
const COMMAND_THROTTLE_MS = 16;

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
  const [pairTimedOut, setPairTimedOut] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommandAt = useRef(0);
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
    if (pairTimeoutRef.current) {
      clearTimeout(pairTimeoutRef.current);
      pairTimeoutRef.current = null;
    }
    setSession(null);
    setRoomState(null);
    setPairTimedOut(false);
  }, []);

  const clearPairTimeout = useCallback(() => {
    if (pairTimeoutRef.current) {
      clearTimeout(pairTimeoutRef.current);
      pairTimeoutRef.current = null;
    }
    setPairTimedOut(false);
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
        clearPairTimeout();
        channel.send({ type: "broadcast", event: "pair_ack", payload: {} });
      })
      .on("broadcast", { event: "command" }, ({ payload }) => {
        const cmd = payload as CompanionCommand;
        if (cmd && VALID_COMMAND_TYPES.has(cmd.type)) {
          onCommandRef.current?.(cmd);
        }
      })
      .on("broadcast", { event: "disconnect" }, () => {
        cleanup();
      })
      .subscribe();

    channelRef.current = channel;
    setSession({ code, channelName, role: "display", paired: false });
    expiryRef.current = setTimeout(cleanup, SESSION_TTL_MS);
  }, [cleanup, clearPairTimeout]);

  /** Controller: join a session by code */
  const joinSession = useCallback(
    (code: string): boolean => {
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
          clearPairTimeout();
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
          channel.send({ type: "broadcast", event: "pair", payload: {} });
        });

      channelRef.current = channel;
      setSession({ code: normalized, channelName, role: "controller", paired: false });
      setPairTimedOut(false);

      pairTimeoutRef.current = setTimeout(() => {
        setPairTimedOut(true);
      }, PAIR_TIMEOUT_MS);

      expiryRef.current = setTimeout(cleanup, SESSION_TTL_MS);
      return true;
    },
    [cleanup, clearPairTimeout],
  );

  /** Send a command (controller → display) with throttling */
  const sendCommand = useCallback((cmd: CompanionCommand) => {
    const now = Date.now();
    if (now - lastCommandAt.current < COMMAND_THROTTLE_MS) return;
    lastCommandAt.current = now;

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
    setTimeout(cleanup, 100);
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return {
    session,
    roomState,
    paired: session?.paired ?? false,
    pairTimedOut,
    startSession,
    joinSession,
    sendCommand,
    broadcastRoomState,
    disconnect,
  };
}
