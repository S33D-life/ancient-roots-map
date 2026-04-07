/**
 * signalNavigation — guides users from a signal to the relevant tree.
 *
 * If already on /map → dispatches a map command to fly + open popup (no re-mount).
 * If elsewhere → navigates to /map with correct deep-link params.
 *
 * Preserves signal context: whispers arrive whisper-aware, hearts arrive heart-aware.
 */
import type { HeartSignal } from "@/lib/heart-signal-types";
import { buildTreeMapUrl } from "@/utils/mapNavigation";

type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

/** Check if we're currently on the map page */
function isOnMapPage(): boolean {
  return window.location.pathname === "/map";
}

/**
 * Navigate to a signal's tree in the most contextual way possible.
 *
 * @param signal - The heart signal to navigate to
 * @param navigate - React Router navigate function
 * @param onBeforeNavigate - Called before navigation (e.g. close panel)
 */
export function navigateToSignalTree(
  signal: HeartSignal,
  navigate: NavigateFn,
  onBeforeNavigate?: () => void,
) {
  const treeId = signal.related_tree_id;
  if (!treeId) {
    // No tree — fall back to deep_link or do nothing
    if (signal.deep_link) {
      onBeforeNavigate?.();
      setTimeout(() => navigate(signal.deep_link!), 120);
    }
    return;
  }

  onBeforeNavigate?.();

  if (isOnMapPage()) {
    // Already on map — fly to tree in-place, no re-mount
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("s33d-signal-fly-to", {
          detail: {
            treeId,
            signalType: signal.signal_type,
            openPopup: true,
          },
        })
      );
    }, 120);
  } else {
    // Navigate to map with tree focus params
    const arrival = signal.signal_type === "whisper" ? "search" : "search";
    const url = buildTreeMapUrl({
      treeId,
      zoom: 17,
      source: arrival,
      journey: true,
    });

    // Add signal context as a quiet param
    const sep = url.includes("?") ? "&" : "?";
    const contextUrl = signal.signal_type === "whisper"
      ? `${url}${sep}whisper=1`
      : url;

    setTimeout(() => navigate(contextUrl), 120);
  }
}
