// Offline-Hinweis: Stand-Zeit, Anzahl wartender Änderungen, Aktion „Erneut versuchen“.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Button, Icon, EmptyState } from '../../ui.js';
import { fmtTime } from '../../../lib/format.js';
import { minutesBefore } from './_crosscut.js';

export const offlineBanner = {
  id: 'offline-banner',
  name: 'Offline-Banner',
  category: 'Querschnitt',
  description: 'Zeigt „Offline, Stand 09:15“ und wie viele Änderungen auf den Abgleich warten. Auf Wunsch mit Liste der wartenden Änderungen und „Erneut versuchen“.',
  version: '1.0',
  props: [
    { name: 'show', label: 'Anzeigen', type: 'select', options: ['immer', 'nur offline'], default: 'immer' },
    { name: 'minutesAgo', label: 'Stand vor (Minuten)', type: 'number', default: 15 },
    { name: 'pending', label: 'Wartende Änderungen (ohne Liste)', type: 'number', default: 0 },
    { name: 'details', label: 'Liste der wartenden Änderungen', type: 'boolean', default: true },
    { name: 'retryLabel', label: 'Aktion', type: 'text', default: 'Erneut versuchen' },
  ],
  data: [{ slot: 'offlineQueue', label: 'Wartende Änderungen', default: 'offlineQueue', shape: '{id,label,time?}[]', required: false }],
  events: ['offline.retry', 'offline.details'],
  states: ['empty'],
  flutter: {
    widget: 'TaktOfflineBanner',
    propMap: { minutesAgo: 'staleSince', pending: 'pendingCount', details: 'showQueue', retryLabel: 'retryLabel', offlineQueue: 'queue' },
    events: { 'offline.retry': 'onRetry', 'offline.details': 'onToggleDetails' },
  },
  a11y: { role: 'status', nameFrom: 'Offline-Hinweis' },
  css: `
  .tk-offline { border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-border); background: var(--tk-c-warning-soft); display: flex; flex-direction: column; min-width: 0; }
  .tk-offline__main { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); flex-wrap: wrap; }
  .tk-offline__icon { width: 36px; height: 36px; border-radius: var(--tk-radius-md); display: grid; place-items: center; flex: none; background: var(--tk-c-surface); color: var(--tk-c-warning); }
  .tk-offline__text { flex: 1 1 200px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .tk-offline__title { font-weight: var(--tk-fw-semibold); color: var(--tk-c-text); font-size: var(--tk-fs-md); }
  .tk-offline__sub { color: var(--tk-c-text-muted); font-size: var(--tk-fs-sm); line-height: var(--tk-lh-snug); }
  .tk-offline__toggle { border: 0; background: none; color: var(--tk-c-text-muted); font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); display: inline-flex; align-items: center; gap: 6px; padding: 0 var(--tk-space-4); min-height: 36px; cursor: pointer; align-self: flex-start; }
  .bp-mobile .tk-offline__toggle { min-height: var(--tk-size-touch); }
  .tk-offline__list { margin: 0; padding: 0 var(--tk-space-4) var(--tk-space-3); list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .tk-offline__item { display: flex; gap: var(--tk-space-2); align-items: center; font-size: var(--tk-fs-sm); color: var(--tk-c-text); padding: 6px 10px; border-radius: var(--tk-radius-sm); background: var(--tk-c-surface); border: 1px solid var(--tk-c-border); }
  .tk-offline__item time { margin-left: auto; color: var(--tk-c-text-subtle); font-variant-numeric: tabular-nums; flex: none; }
  .bp-mobile .tk-offline__main > .tk-btn { flex: 1 1 100%; min-height: var(--tk-size-touch); }`,
  example: {
    props: { minutesAgo: 15, details: true },
    data: { offlineQueue: [
      { id: 'q1', label: 'Aufgabe „Versandetiketten drucken“ erledigt', time: '09:21' },
      { id: 'q2', label: 'Buchung „Verpackungsmaterial“ ergänzt', time: '09:24' },
      { id: 'q3', label: 'Notiz „Lieferanten-Call“ geändert', time: '09:27' },
    ] },
  },
  render: function OfflineBanner({ props, data, ctx }) {
    const [trying, setTrying] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => { if (!trying) return undefined; const t = setTimeout(() => { setTrying(false); ctx.toast('Noch keine Verbindung – die Änderungen bleiben gespeichert'); }, 1200); return () => clearTimeout(t); }, [trying]);
    if (props.show === 'nur offline' && !ctx.env?.offline) return null;
    const queue = Array.isArray(data.offlineQueue) ? data.offlineQueue : [];
    const n = Array.isArray(data.offlineQueue) ? queue.length : Number(props.pending) || 0;
    const stand = fmtTime(minutesBefore(ctx.today, Number(props.minutesAgo) || 0));
    const retry = () => { setTrying(true); ctx.emit('offline.retry', { pending: n }); };
    const sub = n === 0 ? 'Keine Änderungen wartend – alles ist gesichert.' : `${n} ${n === 1 ? 'Änderung wartet' : 'Änderungen warten'} auf den Abgleich, sobald du wieder online bist.`;
    if (ctx.state === 'empty' && Array.isArray(data.offlineQueue) && !queue.length) return html`<${EmptyState} icon="wifi" title="Keine wartenden Änderungen" text="Alles ist abgeglichen." />`;
    return html`<div class="tk-offline" role="status" data-qa="offline-banner">
      <div class="tk-offline__main">
        <span class="tk-offline__icon"><${Icon} name="wifi-off" size=${19} /></span>
        <div class="tk-offline__text"><span class="tk-offline__title">Offline · Stand ${stand}</span><span class="tk-offline__sub">${sub}</span></div>
        <${Button} size="sm" icon=${trying ? 'loader-2' : 'refresh-cw'} disabled=${trying} onClick=${retry}>${trying ? 'Prüfe Verbindung …' : props.retryLabel || 'Erneut versuchen'}<//>
      </div>
      ${props.details && queue.length > 0 && html`<button type="button" class="tk-offline__toggle" aria-expanded=${String(open)} onClick=${() => { setOpen(!open); ctx.emit('offline.details', { open: !open }); }}>
        Wartende Änderungen ${open ? 'ausblenden' : 'anzeigen'}<${Icon} name=${open ? 'chevron-up' : 'chevron-down'} size=${14} /></button>
        ${open && html`<ul class="tk-offline__list">${queue.map((q) => html`<li class="tk-offline__item" key=${q.id}><${Icon} name="cloud-upload" size=${14} /><span class="tk-grow">${q.label}</span>${q.time && html`<time>${q.time}</time>`}</li>`)}</ul>`}`}
    </div>`;
  },
};
export default offlineBanner;
