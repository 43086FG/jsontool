import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri v1 expects a fixed dev port
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    target: 'chrome105',
    minify: 'esbuild',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
