/**
 * HearthLocationSettings — Location diagnostics & guidance for the Hearth.
 * Helps wanderers understand, test, and fix location access.
 */
import { useState, useCallback } from "react";
import { MapPin, Crosshair, ShieldCheck, ShieldAlert, ShieldQuestion, WifiOff, Loader2, CheckCircle2, XCircle, Info, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGeolocation, GEO_ERROR_CONFIG, type GeoPermission, type GeoPosition, type GeoError } from "@/hooks/use-geolocation";

/* ── Status helpers ── */

interface StatusDisplay {
  icon: React.ReactNode;
  label: string;
  color: string; // tailwind text color token
  bg: string;
}

const STATUS_MAP: Record<GeoPermission, StatusDisplay> = {
  granted: {
    icon: <ShieldCheck className="w-5 h-5" />,
    label: "Active",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  prompt: {
    icon: <ShieldQuestion className="w-5 h-5" />,
    label: "Not yet granted",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  denied: {
    icon: <ShieldAlert className="w-5 h-5" />,
    label: "Blocked",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  unavailable: {
    icon: <WifiOff className="w-5 h-5" />,
    label: "Unavailable",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
};

/* ── Recovery guidance ── */

const RECOVERY_STEPS: Record<string, string[]> = {
  denied: [
    "Open your browser's site settings (tap the lock icon in the address bar)",
    "Find \"Location\" and change it to \"Allow\"",
    "On iOS Safari: Settings → Safari → Location → Allow",
    "Refresh this page and try again",
  ],
  unavailable: [
    "Make sure your device's location services are turned on",
    "On iPhone: Settings → Privacy → Location Services → On",
    "On Android: Settings → Location → Turn on",
    "Move outdoors or near a window for better signal",
  ],
  timeout: [
    "Your device took too long to find your position",
    "Try moving to an area with better signal",
    "Close other apps using location in the background",
    "Try again in a moment",
  ],
  offline: [
    "Location services need an internet connection",
    "Check your Wi-Fi or mobile data",
    "Reconnect and try again",
  ],
};

/* ── Component ── */

const HearthLocationSettings = () => {
  const geo = useGeolocation();
  const [testResult, setTestResult] = useState<{
    success: boolean;
    position?: GeoPosition;
    error?: GeoError;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const result = await geo.locate("hearth-location-test");
    if (result) {
      setTestResult({ success: true, position: result });
    } else {
      setTestResult({ success: false, error: geo.error ?? undefined });
    }
    setTesting(false);
  }, [geo]);

  const status = STATUS_MAP[geo.permission];
  const showRecovery = geo.permission === "denied" || testResult?.error;
  const recoveryKey = testResult?.error?.code || (geo.permission === "denied" ? "denied" : null);

  return (
    <div className="space-y-6">
      {/* ── Status Card ── */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: "hsl(var(--card) / 0.4)",
          border: "1px solid hsl(var(--border) / 0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.bg} ${status.color}`}>
            {status.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground tracking-wide">Location Status</p>
            <p className={`text-xs font-mono ${status.color}`}>{status.label}</p>
          </div>
        </div>

        {geo.permission === "granted" && geo.position && (
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono bg-secondary/20 rounded-lg px-3 py-2">
            <span>
              {geo.position.lat.toFixed(4)}°, {geo.position.lng.toFixed(4)}°
            </span>
            <span>±{Math.round(geo.position.accuracy)}m</span>
          </div>
        )}
      </div>

      {/* ── Test Button ── */}
      <div className="space-y-3">
        <Button
          onClick={handleTest}
          disabled={testing}
          variant="outline"
          className="w-full gap-2 font-serif text-sm border-border/40"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          {testing ? "Testing…" : "Test my location"}
        </Button>

        {/* Test result */}
        {testResult && (
          <div
            className="rounded-lg p-3 space-y-2 animate-fade-in"
            style={{
              background: testResult.success
                ? "hsl(142, 40%, 15% / 0.3)"
                : "hsl(0, 40%, 15% / 0.3)",
              border: `1px solid ${testResult.success ? "hsl(142, 40%, 40% / 0.3)" : "hsl(0, 40%, 40% / 0.3)"}`,
            }}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <p className="text-sm font-serif text-foreground">
                {testResult.success ? "Location received" : "Could not get location"}
              </p>
            </div>

            {testResult.success && testResult.position && (
              <div className="text-[11px] text-muted-foreground font-mono space-y-0.5 pl-6">
                <p>Lat: {testResult.position.lat.toFixed(5)}</p>
                <p>Lng: {testResult.position.lng.toFixed(5)}</p>
                <p>
                  Accuracy: ±{Math.round(testResult.position.accuracy)}m
                  {testResult.position.accuracy > 100 && (
                    <span className="text-amber-400 ml-1">(weak signal — try outdoors)</span>
                  )}
                </p>
              </div>
            )}

            {!testResult.success && testResult.error && (
              <div className="pl-6 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {GEO_ERROR_CONFIG[testResult.error.code].message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Recovery guidance ── */}
      {showRecovery && recoveryKey && RECOVERY_STEPS[recoveryKey] && (
        <>
          <Separator className="bg-border/20" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary/60" />
              <h3 className="text-sm font-serif tracking-wider text-foreground/80">
                How to fix
              </h3>
            </div>
            <ol className="space-y-2 pl-1">
              {RECOVERY_STEPS[recoveryKey].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[10px] font-mono text-primary/50 mt-0.5 shrink-0 w-4 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      <Separator className="bg-border/20" />

      {/* ── Why location matters ── */}
      <div
        className="rounded-lg p-3 flex items-start gap-2.5"
        style={{
          background: "hsl(var(--primary) / 0.04)",
          border: "1px solid hsl(var(--primary) / 0.1)",
        }}
      >
        <Info className="w-4 h-4 text-primary/50 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-serif text-foreground/70 leading-relaxed">
            Location helps S33D connect you with nearby Ancient Friends and supports features like
            encounters, offerings, whispers, and verification.
          </p>
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
            Your location is only used while S33D is open and is never stored or shared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HearthLocationSettings;
