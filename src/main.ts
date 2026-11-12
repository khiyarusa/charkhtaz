import { App } from './ui/app';

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('#app root element not found');
}

document.documentElement.lang = 'fa';
document.documentElement.dir = 'rtl';

// Wait for the bundled Persian font before the first paint so no screen ever
// shows fallback glyphs (offline-first: the file ships with the app).
const start = () => {
  new App(root);
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('is-done');
    window.setTimeout(() => splash.remove(), 320);
  }
};
const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
if (fonts?.ready) {
  fonts.ready.then(start).catch(start);
} else {
  start();
}
