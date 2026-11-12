import { GAME_NAME_FA, GAME_NAME_LATIN, GAME_TAGLINE, versionLabel } from './core/build-info';

/**
 * CHARKHTAZ bootstrap entry.
 *
 * Scaffold stage: renders the brand boot screen only. The full game
 * (engine boot, asset pipeline, first scene) mounts here as modules
 * land — see docs/SPEC-V1.md for the complete V1 scope.
 */
function renderBootScreen(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) {
    throw new Error('#app root element not found');
  }

  root.innerHTML = `
    <main style="
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: #16181c;
      color: #f2efe9;
      font-family: system-ui, sans-serif;
      direction: rtl;
    ">
      <p style="margin: 0; letter-spacing: 0.35em; color: #d9a441; font-size: 13px;">
        ${GAME_NAME_LATIN} &middot; ${versionLabel()}
      </p>
      <h1 style="margin: 0; font-size: 64px; line-height: 1.1;">${GAME_NAME_FA}</h1>
      <p style="margin: 0; letter-spacing: 0.5em; font-size: 12px; color: #9aa0a8;">
        ${GAME_TAGLINE}
      </p>
      <p style="margin: 24px 0 0; font-size: 14px; color: #6f767f;">
        در حال ساخت — داربست اولیهٔ پروژه
      </p>
    </main>
  `;
}

renderBootScreen();
