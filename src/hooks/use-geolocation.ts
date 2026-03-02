/**
 * useGeolocation — single source of truth for all location requests.
 *
 * Every component that needs the user's position should use this hook
 * instead of calling navigator.geolocation directly.
 *
 * Features:
 * - Permission state monitoring (granted/denied/prompt)
 * - Debounced requests (prevents duplicate geolocation calls)
 * - Lightweight logging (source, timing, success/failure)
 * - Cancellation on unmount
 * - Offline detection
 * - Graceful error handling with typed states
 */
import { useState, useEffect, useCallback, useRef } from "react";

export type GeoPermission = "prompt" | "granted" | "denied" | "unavailable";
export type GeoStatus = "idle" | "requesting" | "success" | "error";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeoError {
  code: "denied" | "unavailable" | "timeout" | "offline" | "unknown";
  message: string;
}

interface GeoLog {
  source: string;
  permission: GeoPermission;
  status: "start" | "success" | "error";
  error?: string;
  durationMs?: number;
  timestamp: string;
}

const GEO_LOG_KEY = "s33d-geo-log";
const DEBOUNCE_MS = 600;

function logGeoEvent(entry: GeoLog) {
  try {
    const existing: GeoLog[] = JSON.parse(sessionStorage.getItem(GEO_LOG_KEY) || "[]");
    existing.push(entry);
    sessionStorage.setItem(GEO_LOG_KEY, JSON.stringify(existing.slice(-20)));
  } catch {
    // Never let logging crash anything
  }
}

export function getGeoLogs(): GeoLog[] {
  try {
    return JSON.parse(sessionStorage.getItem(GEO_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Error messages for each failure code */
export const GEO_ERROR_CONFIG: Record<GeoError["code"], { title: string; message: string; help: string }> = {
  denied: {
    title: "Location Access Blocked",
    message: "Your browser is blocking location access for this site.",
    help: "To enable: open your browser settings → Privacy/Site Settings → Location → allow this site. Then try again.",
  },
  unavailable: {
    title: "Location Unavailable",
    message: "We couldn't determine your position. This can happen indoors or with weak GPS signal.",
    help: "Try moving outdoors or near a window, or use the manual entry options.",
  },
  timeout: {
    title: "Location Timed Out",
    message: "Getting your position took too long.",
    help: "This often happens with weak GPS. Try again or use search.",
  },
  offline: {
    title: "You're Offline",
    message: "Location services need a network connection.",
    help: "Reconnect and try again.",
  },
  unknown: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred getting your location.",
    help: "Please try again.",
  },
};

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<GeoError | null>(null);
  const [permission, setPermission] = useState<GeoPermission>("prompt");
  const debounceRef = useRef(false);
  const mountedRef = useRef(true);

  // Monitor permission state
  useEffect(() => {
    mountedRef.current = true;

    if (!("geolocation" in navigator)) {
      setPermission("unavailable");
      return;
    }

    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (!mountedRef.current) return;
          setPermission(result.state as GeoPermission);
          const onChange = () => {
            if (mountedRef.current) setPermission(result.state as GeoPermission);
          };
          result.addEventListener("change", onChange);
        })
        .catch(() => {});
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const locate = useCallback(
    (source: string = "unknown"): Promise<GeoPosition | null> => {
      // Debounce guard
      if (debounceRef.current) {
        return Promise.resolve(position);
      }

      // Offline guard
      if (!navigator.onLine) {
        const geoError: GeoError = { code: "offline", message: "Device is offline" };
        setError(geoError);
        setStatus("error");
        logGeoEvent({ source, permission, status: "error", error: "offline", timestamp: new Date().toISOString() });
        return Promise.resolve(null);
      }

      if (!("geolocation" in navigator)) {
        const geoError: GeoError = { code: "unavailable", message: "Geolocation not supported" };
        setError(geoError);
        setStatus("error");
        return Promise.resolve(null);
      }

      debounceRef.current = true;
      setTimeout(() => { debounceRef.current = false; }, DEBOUNCE_MS);

      setStatus("requesting");
      setError(null);

      const startTime = Date.now();
      logGeoEvent({ source, permission, status: "start", timestamp: new Date().toISOString() });

      return new Promise<GeoPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mountedRef.current) { resolve(null); return; }
            const geo: GeoPosition = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            };
            setPosition(geo);
            setStatus("success");
            setError(null);
            setPermission("granted");
            logGeoEvent({
              source,
              permission: "granted",
              status: "success",
              durationMs: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            });
            resolve(geo);
          },
          (err) => {
            if (!mountedRef.current) { resolve(null); return; }
            let code: GeoError["code"] = "unknown";
            if (err.code === err.PERMISSION_DENIED) code = "denied";
            else if (err.code === err.POSITION_UNAVAILABLE) code = "unavailable";
            else if (err.code === err.TIMEOUT) code = "timeout";

            const geoError: GeoError = { code, message: err.message || GEO_ERROR_CONFIG[code].message };
            setError(geoError);
            setStatus("error");
            if (code === "denied") setPermission("denied");

            logGeoEvent({
              source,
              permission: code === "denied" ? "denied" : permission,
              status: "error",
              error: code,
              durationMs: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            });
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
        );
      });
    },
    [permission, position]
  );

  return {
    position,
    status,
    error,
    permission,
    locate,
    isLocating: status === "requesting",
  };
}
