/**
 * UpdateAppButton — small "Update app" control for the signed-out sign-in screen.
 *
 * Reuses the existing Hearth update mechanism (useAppUpdate): the same version
 * check, cache clear and reload used by the update banner. It never touches auth
 * storage, and it stays out of the way while a sign-in callback is still being
 * processed (recovery hash/query params or a pending installed-app handoff).
 */
import { useState } from "react";
import { RefreshCw, Check, Loader2 } from "lucide-react";
import { useAppUpdate } from "@/hooks/use-app-update";
import { readPendingHandoff } from "@/lib/auth/pwaHandoff";

type State = "idle" | "checking" | "up-to-date" | "available" | "applying";

const callbackInProgress = () => {
  try {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (/access_token|code=|type=recovery|error_code/.test(hash + search)) return true;
    return !!readPendingHandoff();
  } catch {
    return false;
  }
};

const UpdateAppButton = () => {
  const { manualCheck, applyUpdate } = useAppUpdate();
  const [state, setState] = useState<State>("idle");

  const busy = state === "checking" || state === "applying";

  const onClick = async () => {
    if (busy) return;
    if (callbackInProgress()) {
      setState("idle");
      return;
    }
    if (state === "available") {
      setState("applying");
      await applyUpdate(); // clears caches and reloads; auth storage is untouched
      return;
    }
    setState("checking");
    try {
      const found = await manualCheck();
      setState(found ? "available" : "up-to-date");
    } catch {
      setState("up-to-date");
    }
  };

  const label =
    state === "checking" ? "Checking for updates…"
    : state === "applying" ? "Updating…"
    : state === "available" ? "Update available — tap to update"
    : state === "up-to-date" ? "You're up to date"
    : "Update app";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || callbackInProgress()}
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === "up-to-date" ? (
        <Check className="h-3 w-3" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      {label}
    </button>
  );
};

export default UpdateAppButton;
