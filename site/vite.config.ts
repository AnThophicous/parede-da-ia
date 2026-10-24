import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// GitHub Pages serves from /parede-da-ia/; the repository library/ is imported directly
// (the landing uses the same recipes the agents receive).
export default defineConfig({
  base: '/parede-da-ia/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@library': fileURLToPath(new URL('../library', import.meta.url)),
    },
  },
  server: { fs: { allow: ['..'] } },
  build: {
    target: 'es2022',
    // three (~750 kB) gets its own chunk: it downloads in parallel while the intro is being written.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
