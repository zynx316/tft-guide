// Einstieg der Workbench: Zustand laden (Datei/Browser/Seed) und App rendern.
import { html, render } from '../lib/html.js';
import { initStore } from './store.js';
import { App } from './app.js';

const root = document.getElementById('wb-root');
initStore()
  .then(() => { render(html`<${App} />`, root); document.body.dataset.ready = 'true'; })
  .catch((e) => {
    console.error(e);
    root.innerHTML = `<div style="padding:40px;font-family:system-ui"><h2>Workbench konnte nicht starten</h2><pre style="white-space:pre-wrap">${String(e.stack || e)}</pre>
      <p>Tipp: Daten exportieren/zurücksetzen über <code>localStorage.removeItem('takt-workbench-state-v1')</code> in der Browser-Konsole (vorher sichern!).</p></div>`;
  });
