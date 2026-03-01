import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
