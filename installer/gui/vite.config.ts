import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),]as any,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
