import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
/** Separate local review artifact. No app shell, environment, public assets or service worker. */
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  envPrefix: 'CIRCLE237_UNUSED_',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { host: '127.0.0.1', port: 4238, strictPort:true },
  preview: { host: '127.0.0.1', port: 4238, strictPort:true, headers: {
    'Content-Security-Policy': "default-src 'self'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'",
    'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
  } },
  build: { outDir: 'dist-circle237', rollupOptions: { input: 'review/circle237.html' } },
});
