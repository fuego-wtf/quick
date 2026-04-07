import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: No Tailwind plugin — the host window provides all Tailwind utilities.
// Lens bundles should NOT ship their own Tailwind; they consume the host's CSS.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    cssCodeSplit: false,
  },
});
