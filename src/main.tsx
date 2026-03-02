import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare const __BUILD_ID__: string;

// ── Build version logging ──
if (typeof __BUILD_ID__ !== "undefined") {
  console.info(
    `%c🌳 S33D v${__BUILD_ID__}`,
    "color: hsl(42 65% 55%); font-weight: bold; font-size: 12px;"
  );
}

// ── Global error capture → stores last errors for bug report pre-fill ──
const MAX_CAPTURED = 5;
const errorQueue: Array<{
  message: string;
  source?: string;
  line?: number;
  col?: number;
  timestamp: string;
}> = [];

function pushError(entry: (typeof errorQueue)[0]) {
  errorQueue.push(entry);
  if (errorQueue.length > MAX_CAPTURED) errorQueue.shift();
  try {
    sessionStorage.setItem("s33d-error-log", JSON.stringify(errorQueue));
  } catch {}
}

window.addEventListener("error", (e) => {
  pushError({
    message: e.message || String(e.error),
    source: e.filename,
    line: e.lineno,
    col: e.colno,
    timestamp: new Date().toISOString(),
  });
});

window.addEventListener("unhandledrejection", (e) => {
  pushError({
    message: e.reason?.message || String(e.reason),
    source: e.reason?.stack?.split("\n")[1]?.trim(),
    timestamp: new Date().toISOString(),
  });
});

// Register service worker (vite-plugin-pwa prompt mode)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // SW registration failed — app still works without it
    });
  });
}

const root = document.getElementById("root")!;
createRoot(root).render(<App />);
