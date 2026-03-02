/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Build-time version stamp — ISO timestamp + random suffix for uniqueness
const BUILD_TIMESTAMP = new Date().toISOString().slice(0, 16).replace("T", ".").replace(":", "");
const BUILD_ID = `${BUILD_TIMESTAMP}-${Math.random().toString(36).slice(2, 6)}`;

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
            // Trees table — stale-while-revalidate (trees rarely change, great offline)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/trees.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-trees",
              expiration: { maxEntries: 300, maxAgeSeconds: 24 * 60 * 60 }, // 24h
            },
          },
          {
            // Food cycles, bio_regions — mostly static reference data
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(food_cycles|bio_regions|book_catalog|song_catalog).*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-reference",
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 days
            },
          },
          {
            // Other Supabase API — short TTL, network-first
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 150, maxAgeSeconds: 5 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Tree images — long cache, CacheFirst is fine for immutable uploads
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tree-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 14 * 24 * 60 * 60 }, // 14 days
            },
          },
          {
            // Map tiles — aggressive cache
            urlPattern: /^https:\/\/.*tile.*\.(png|jpg|pbf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Google Fonts — long cache
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
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
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
}));
