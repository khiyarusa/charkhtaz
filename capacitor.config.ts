import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android shell for the web build.
 *
 * The game is fully offline: every engine, font and asset is bundled into
 * `dist`, and the WebView loads it from the app package (no remote origin).
 */
const config: CapacitorConfig = {
  appId: 'ir.charkhtaz.game',
  appName: 'چرخ‌تاز',
  webDir: 'dist',
  backgroundColor: '#0d0f13',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
