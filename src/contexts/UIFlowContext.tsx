/**
 * UIFlowContext — centralised popup suppression for high-focus flows.
 *
 * Popups (ProximityNudge, ContextualWhisper, MapOnboardingRitual, etc.)
 * render ONLY when `popupsAllowed` is true.
 *
 * Any component entering a focus flow calls `enterFlow("offering")` and
 * `exitFlow()` on unmount. Additionally, the provider auto-detects open
 * Radix dialogs/drawers/sheets via MutationObserver on `[data-state="open"]`.
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

export type FlowContext =
  | "browse"
  | "offering"
  | "editTree"
  | "addTree"
  | "mint"
  | "whisper"
  | "timeTree"
  | "form"
  | "details"
  | string;

interface UIFlowState {
  /** Current logical context */
  context: FlowContext;
  /** Number of active overlay/flow layers (supports nesting) */
  flowDepth: number;
  /** Computed: are popups allowed right now? */
  popupsAllowed: boolean;
  /** Enter a focus flow — increments depth */
  enterFlow: (ctx?: FlowContext) => void;
  /** Exit a focus flow — decrements depth */
  exitFlow: () => void;
}

const UIFlowContext = createContext<UIFlowState>({
  context: "browse",
  flowDepth: 0,
  popupsAllowed: true,
  enterFlow: () => {},
  exitFlow: () => {},
});

export const useUIFlow = () => useContext(UIFlowContext);

/**
 * Convenience hook — returns true only when popups may render.
 * Components can just: `if (!usePopupGate()) return null;`
 */
export const usePopupGate = (): boolean => useContext(UIFlowContext).popupsAllowed;

export const UIFlowProvider = ({ children }: { children: ReactNode }) => {
  const [context, setContext] = useState<FlowContext>("browse");
  const [flowDepth, setFlowDepth] = useState(0);
  const [overlayDetected, setOverlayDetected] = useState(false);
  const depthRef = useRef(0);

  const enterFlow = useCallback((ctx: FlowContext = "form") => {
    depthRef.current += 1;
    setFlowDepth(depthRef.current);
    setContext(ctx);
  }, []);

  const exitFlow = useCallback(() => {
    depthRef.current = Math.max(0, depthRef.current - 1);
    setFlowDepth(depthRef.current);
    if (depthRef.current === 0) setContext("browse");
  }, []);

  // Auto-detect open Radix overlays (Dialog, Drawer, Sheet, AlertDialog)
  useEffect(() => {
    const check = () => {
      const hasOpen = document.querySelector(
        '[role="dialog"][data-state="open"], [data-vaul-drawer][data-state="open"], [data-radix-dialog-overlay]'
      );
      setOverlayDetected(!!hasOpen);
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
    check();
    return () => observer.disconnect();
  }, []);

  const popupsAllowed = flowDepth === 0 && !overlayDetected;

  return (
    <UIFlowContext.Provider value={{ context, flowDepth, popupsAllowed, enterFlow, exitFlow }}>
      {children}
    </UIFlowContext.Provider>
  );
};
