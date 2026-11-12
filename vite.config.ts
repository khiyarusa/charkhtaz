import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base is required so the built bundle works inside the
  // Capacitor Android WebView (file-based origin).
  base: './',
  build: {
    target: 'es2022',
    // Source maps are useful in dev but must not ship inside the Android
    // package: they add ~1 MB and expose the bundle layout for no user benefit.
    sourcemap: false,
  },
  server: {
    host: true,
  },
});
