/**
 * DevDiagnosticsOverlay — lightweight always-visible diagnostics strip.
 * Shows build ID, auth state, env "set/not set", last auth error.
 * Only rendered in dev/preview builds.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

declare const __BUILD_ID__: string;

const DevDiagnosticsOverlay = () => {
  const [authState, setAuthState] = useState<"loading" | "authed" | "unauth" | "error">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState("authed");
        setUserId(session.user.id.slice(0, 8));
        setEmail(session.user.email ?? null);
      } else {
        setAuthState("unauth");
        setUserId(null);
        setEmail(null);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthState("error");
        setLastError(error.message.slice(0, 80));
      } else if (data.session?.user) {
        setAuthState("authed");
        setUserId(data.session.user.id.slice(0, 8));
        setEmail(data.session.user.email ?? null);
      } else {
        setAuthState("unauth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "unknown";
  const envUrl = import.meta.env.VITE_SUPABASE_URL ? "✓" : "✗";
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✓" : "✗";

  const authColor =
    authState === "authed" ? "#4ade80" :
    authState === "error" ? "#f87171" :
    authState === "loading" ? "#fbbf24" : "#94a3b8";

  return (
    <div
      onClick={() => setCollapsed(!collapsed)}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 99999,
        background: "hsla(0,0%,0%,0.75)",
        color: "#e2e8f0",
        fontFamily: "ui-monospace, monospace",
        fontSize: "9px",
        lineHeight: 1.4,
        padding: collapsed ? "2px 6px" : "4px 8px",
        borderBottomLeftRadius: 6,
        cursor: "pointer",
        maxWidth: collapsed ? "auto" : "260px",
        backdropFilter: "blur(4px)",
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {collapsed ? (
        <span style={{ color: authColor }}>● {buildId.slice(0, 8)}</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div>🔧 <strong>{buildId}</strong></div>
          <div>
            Auth: <span style={{ color: authColor }}>{authState}</span>
            {userId && <> · {userId}</>}
          </div>
          {email && <div style={{ color: "#94a3b8" }}>{email}</div>}
          {lastError && <div style={{ color: "#f87171" }}>⚠ {lastError}</div>}
          <div>
            URL: {envUrl} · KEY: {envKey}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevDiagnosticsOverlay;
