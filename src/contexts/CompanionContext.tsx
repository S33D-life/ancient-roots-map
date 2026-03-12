import { createContext, useContext, type ReactNode } from "react";
import { useCompanionDisplay, type RoomHandlers } from "@/hooks/use-companion-commands";
import type { CompanionRoomState, CompanionCommand } from "@/lib/companion-types";
import type { CompanionSession } from "@/lib/companion-types";

interface CompanionContextValue {
  session: CompanionSession | null;
  paired: boolean;
  roomState: CompanionRoomState | null;
  startSession: () => void;
  disconnect: () => void;
  broadcastRoomState: (state: CompanionRoomState) => void;
  registerHandlers: (handlers: RoomHandlers) => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const companion = useCompanionDisplay();

  return (
    <CompanionContext.Provider
      value={{
        session: companion.session,
        paired: companion.paired,
        roomState: companion.roomState,
        startSession: companion.startSession,
        disconnect: companion.disconnect,
        broadcastRoomState: companion.broadcastRoomState,
        registerHandlers: companion.registerHandlers,
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
