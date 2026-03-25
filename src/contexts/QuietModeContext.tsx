/**
 * QuietModeContext — provides notification/UI preferences to all components.
 * Wraps useNotificationPreferences so any component can check whether
 * pop-ups, nudges, celebrations, whispers, etc. should render.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useNotificationPreferences, type NotificationPreferences } from "@/hooks/use-notification-preferences";

interface QuietModeState {
  /** Master quiet mode — suppresses all non-essential overlays */
  quietMode: boolean;
  /** TEOTAG contextual guidance whispers (FireflyGuidance) */
  showTeotagWhispers: boolean;
  /** Journey nudges, seed nudges, ensō nudge */
  showOnboardingNudges: boolean;
  /** Floating contextual pop-ups and whisper banners */
  showFloatingPrompts: boolean;
  /** Companion controller suggestions */
  showCompanionSuggestions: boolean;
  /** Heart-earned celebrations and reward overlays */
  showCelebrations: boolean;
  /** Whisper thread messages */
  whispersEnabled: boolean;
  /** Raw prefs loading state */
  loading: boolean;
}

const DEFAULTS: QuietModeState = {
  quietMode: false,
  showTeotagWhispers: true,
  showOnboardingNudges: true,
  showFloatingPrompts: true,
  showCompanionSuggestions: true,
  showCelebrations: true,
  whispersEnabled: true,
  loading: true,
};

const QuietModeCtx = createContext<QuietModeState>(DEFAULTS);

export function useQuietMode() {
  return useContext(QuietModeCtx);
}

interface Props {
  userId: string | null;
  children: ReactNode;
}

export function QuietModeProvider({ userId, children }: Props) {
  const { prefs, loading } = useNotificationPreferences(userId);

  const state = useMemo<QuietModeState>(() => {
    const q = prefs.quiet_mode;
    return {
      quietMode: q,
      showTeotagWhispers: !q && (prefs as any).show_teotag_whispers !== false,
      showOnboardingNudges: !q && prefs.show_onboarding_nudges,
      showFloatingPrompts: !q && prefs.show_floating_prompts,
      showCompanionSuggestions: !q && prefs.show_companion_suggestions,
      showCelebrations: !q && (prefs as any).show_celebrations !== false,
      whispersEnabled: !q && prefs.whispers_enabled,
      loading,
    };
  }, [prefs, loading]);

  return <QuietModeCtx.Provider value={state}>{children}</QuietModeCtx.Provider>;
}
