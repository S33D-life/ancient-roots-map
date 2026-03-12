import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useCompanionDisplay, type RoomHandlers } from "@/hooks/use-companion-commands";
import type { CompanionRoomState } from "@/lib/companion-types";
import type { CompanionSession } from "@/lib/companion-types";

interface PointerState {
  x: number;
  y: number;
  visible: boolean;
}

interface CompanionContextValue {
  session: CompanionSession | null;
  paired: boolean;
  roomState: CompanionRoomState | null;
  pointer: PointerState;
  startSession: () => void;
  disconnect: () => void;
  broadcastRoomState: (state: CompanionRoomState) => void;
  registerHandlers: (handlers: RoomHandlers) => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [pointer, setPointer] = useState<PointerState>({ x: 0.5, y: 0.5, visible: false });

  const companion = useCompanionDisplay();

  // Register pointer handlers globally
  const registerHandlersWrapped = useCallback(
    (handlers: RoomHandlers) => {
      companion.registerHandlers({
        ...handlers,
        onPointerMove: (x, y) => {
          setPointer({ x, y, visible: true });
          handlers.onPointerMove?.(x, y);
        },
        onPointerHide: () => {
          setPointer((p) => ({ ...p, visible: false }));
          handlers.onPointerHide?.();
        },
      });
    },
    [companion.registerHandlers],
  );

  return (
    <CompanionContext.Provider
      value={{
        session: companion.session,
        paired: companion.paired,
        roomState: companion.roomState,
        pointer,
        startSession: companion.startSession,
        disconnect: companion.disconnect,
        broadcastRoomState: companion.broadcastRoomState,
        registerHandlers: registerHandlersWrapped,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error("useCompanion must be used within CompanionProvider");
  return ctx;
}
