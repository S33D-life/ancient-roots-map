import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Build-time version stamp
const BUILD_ID = new Date().toISOString().slice(0, 16).replace("T", ".").replace(":", "");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // "prompt" mode gives us control — we show the banner ourselves
      registerType: "prompt",
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Never precache version.json — always fetch fresh
        globIgnores: ["**/version.json"],
        runtimeCaching: [
          {
            // Auth & user endpoints — never cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Supabase API — short TTL, network-first
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 }, // 5 min (was 1 hour)
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Tree images — long cache, CacheFirst is fine for immutable uploads
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tree-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            // Map tiles
            urlPattern: /^https:\/\/.*tile.*\.(png|jpg|pbf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: "Ancient Friends — A Living Map of Ancient Trees",
        short_name: "S33D",
        description: "Map and honor ancient trees worldwide. Connect with sacred groves.",
        theme_color: "#1a1f14",
        background_color: "#1a1f14",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "framer-motion"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["maplibre-gl", "leaflet", "react", "react-dom", "react-router-dom"],
    esbuildOptions: {
      target: "es2022",
    },
  },
  build: {
    target: "es2022",
  },
}));
