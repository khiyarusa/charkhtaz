import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base is required so the built bundle works inside the
  // Capacitor Android WebView (file-based origin).
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    host: true,
  },
});
