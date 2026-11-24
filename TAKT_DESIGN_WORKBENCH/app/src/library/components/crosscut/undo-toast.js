// Rückgängig-Hinweis: Text + „Rückgängig“, blendet sich nach 6 s mit sichtbarem Fortschritt aus.
// Andere Komponenten lösen ihn mit pushUndo(ctx, { text, restore }) aus (siehe _crosscut.js); im Demo-Modus bringt er eine eigene Liste mit.
import { html } from '../../../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon, EmptyState } from '../../ui.js';

let demoCounter = 0;

export const undoToast = {
  id: 'undo-toast',
  name: 'Rückgängig-Hinweis',
  category: 'Querschnitt',
  description: 'Bestätigt eine Aktion („Aufgabe gelöscht“) und bietet „Rückgängig“ an. Blendet sich nach 6 Sekunden aus, der Fortschrittsbalken zeigt die Restzeit; Hover und Fokus halten ihn an. Der Demo-Modus bringt eine Liste zum Ausprobieren mit.',
  version: '1.0',
  props: [
    { name: 'seconds', label: 'Dauer (Sekunden)', type: 'number', default: 6 },
    { name: 'label', label: 'Aktion', type: 'text', default: 'Rückgängig' },
    { name: 'placement', label: 'Platzierung', type: 'select', options: ['inline', 'sticky'], default: 'inline' },
    { name: 'hold', label: 'Nicht ausblenden (Vorschau)', type: 'boolean', default: false },
    { name: 'demo', label: 'Demo-Liste zeigen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'undoItems', label: 'Einträge (Demo)', default: 'undoItems', shape: '{id,title}[]', required: false }],
  events: ['undo', 'undo.expire', 'undo.dismiss', 'undo.demo.delete'],
  states: ['empty'],
  flutter: {
    widget: 'TaktUndoSnackBar',
    propMap: { seconds: 'duration', label: 'actionLabel', placement: 'behavior', hold: 'persistent' },
    events: { undo: 'onUndo', 'undo.expire': 'onDismissed', 'undo.dismiss': 'onClosed' },
  },
  a11y: { role: 'status', nameFrom: 'Text' },
  css: `
  .tk-undo-wrap { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-undo-wrap--sticky .tk-undo { position: sticky; bottom: var(--tk-space-3); z-index: 2; }
  .tk-undo-wrap--idle { min-height: 8px; }
  .tk-undo { position: relative; overflow: hidden; display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4) calc(var(--tk-space-3) + 4px); border-radius: var(--tk-radius-md); background: var(--tk-c-text); color: var(--tk-c-bg); box-shadow: var(--tk-shadow-md); min-width: 0; }
  .tk-undo__text { flex: 1 1 auto; min-width: 0; font-size: var(--tk-fs-md); font-weight: var(--tk-fw-medium); line-height: var(--tk-lh-snug); }
  .tk-undo__btn { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; border-radius: var(--tk-radius-pill); border: 1.5px solid currentColor; background: transparent; color: inherit; font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-semibold); cursor: pointer; }
  .tk-undo__btn:hover { background: color-mix(in srgb, currentColor 14%, transparent); }
  .tk-undo__x { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border: 0; background: none; color: inherit; opacity: .8; cursor: pointer; border-radius: var(--tk-radius-sm); }
  .tk-undo__bar { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: color-mix(in srgb, currentColor 20%, transparent); }
  .tk-undo__bar i { display: block; height: 100%; background: currentColor; opacity: .75; border-radius: 0 2px 2px 0; }
  .bp-mobile .tk-undo__btn { min-height: var(--tk-size-touch); }
  .bp-mobile .tk-undo__x { width: var(--tk-size-touch); height: var(--tk-size-touch); margin: -6px -10px -6px 0; }
  .tk-undo-demo { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .tk-undo-demo li { display: flex; align-items: center; gap: var(--tk-space-2); min-height: 44px; padding: 4px 4px 4px var(--tk-space-3); border: 1px solid var(--tk-c-border); border-radius: var(--tk-radius-md); background: var(--tk-c-surface); color: var(--tk-c-text); }
  .tk-undo-demo .tk-btn { flex: none; }`,
  example: { props: { hold: true }, data: { undoItems: [{ id: 'u1', title: 'Newsletter-Entwurf finalisieren' }, { id: 'u2', title: 'Versandetiketten drucken' }, { id: 'u3', title: 'Lieferanten-Call vorbereiten' }] } },
  render: function UndoToast({ props, data, setData, ctx }) {
    const items = Array.isArray(data.undoItems) ? data.undoItems : [];
    const startEntry = () => (props.demo && ctx.state !== 'empty' ? makeEntry(`„Rechnung 1142 prüfen“ gelöscht`, () => setData('undoItems', (l) => (l.some((x) => x.id === 'u0') ? l : [{ id: 'u0', title: 'Rechnung 1142 prüfen' }, ...l]))) : null);
    const [local, setLocal] = useState(startEntry);
    const [paused, setPaused] = useState(false);
    const [left, setLeft] = useState(1);
    const entry = ctx.ui?.undo || local;
    const total = Math.max(1, Number(entry?.seconds || props.seconds) || 6) * 1000;
    const elapsed = useRef(0);
    const key = entry?.id;
    const close = () => { if (ctx.ui?.undo) ctx.setUi('undo', null); setLocal(null); };

    useEffect(() => { elapsed.current = 0; setLeft(1); }, [key, total]);   // neuer Hinweis: Zeit beginnt von vorn
    useEffect(() => {                                                      // Hover/Fokus hält nur an, setzt nicht zurück
      if (!entry || props.hold) return undefined;
      const t = setInterval(() => {
        if (paused) return;
        elapsed.current += 100;
        setLeft(Math.max(0, 1 - elapsed.current / total));
        if (elapsed.current >= total) { clearInterval(t); ctx.emit('undo.expire', { text: entry.text }); close(); }
      }, 100);
      return () => clearInterval(t);
    }, [key, props.hold, paused, total]);

    const undo = () => { entry.restore && entry.restore(); ctx.emit('undo', { text: entry.text }); ctx.toast('Wiederhergestellt'); close(); };
    const del = (it) => {
      const idx = items.findIndex((x) => x.id === it.id);
      setData('undoItems', (l) => l.filter((x) => x.id !== it.id));
      ctx.emit('undo.demo.delete', { id: it.id });
      setLocal(makeEntry(`„${it.title}“ gelöscht`, () => setData('undoItems', (l) => (l.some((x) => x.id === it.id) ? l : [...l.slice(0, idx), it, ...l.slice(idx)]))));
    };
    const toast = entry && html`<div class="tk-undo" role="status" aria-live="polite" data-qa="undo-toast" onMouseEnter=${() => setPaused(true)} onMouseLeave=${() => setPaused(false)} onFocusIn=${() => setPaused(true)} onFocusOut=${() => setPaused(false)}>
      <${Icon} name="check-circle-2" size=${18} /><span class="tk-undo__text">${entry.text}</span>
      <button type="button" class="tk-undo__btn" onClick=${undo}><${Icon} name="undo-2" size=${15} />${props.label || 'Rückgängig'}</button>
      <button type="button" class="tk-undo__x" aria-label="Hinweis schließen" onClick=${() => { ctx.emit('undo.dismiss', { text: entry.text }); close(); }}><${Icon} name="x" size=${15} /></button>
      <div class="tk-undo__bar" role="progressbar" aria-label="Verbleibende Zeit" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(left * 100)}><i style=${`width:${left * 100}%`}></i></div></div>`;
    if (!props.demo && !entry) return html`<div class="tk-undo-wrap tk-undo-wrap--idle" role="status" aria-live="polite" data-qa="undo-idle"></div>`;
    return html`<div class=${`tk-undo-wrap tk-undo-wrap--${props.placement}`}>
      ${props.demo && (items.length
        ? html`<ul class="tk-undo-demo" aria-label="Beispiel-Einträge">${items.map((it) => html`<li key=${it.id}><span class="tk-grow tk-truncate">${it.title}</span>
          <button type="button" class="tk-btn tk-btn--ghost tk-btn--icon" aria-label=${`„${it.title}“ löschen`} onClick=${() => del(it)}><${Icon} name="trash-2" size=${16} /></button></li>`)}</ul>`
        : html`<${EmptyState} icon="check-circle-2" title="Alles erledigt" text="Gelöschte Einträge lassen sich über den Hinweis zurückholen." />`)}
      ${toast}</div>`;
  },
};
const makeEntry = (text, restore) => { demoCounter += 1; return { id: `demo${demoCounter}`, text, restore }; };
export default undoToast;
