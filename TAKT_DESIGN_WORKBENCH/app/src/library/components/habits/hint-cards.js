// Start: Smart-Hinweise – regelbasiert, mit Quelle und Aktion; wegwischen oder später erinnern.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, EmptyState, Icon, toneColor } from '../../ui.js';

const EXAMPLE = [
  { id: 'h1', tone: 'warning', icon: 'wind', title: 'Sturmböen ab 14 Uhr', text: 'Lieferanten-Call um 15:00 läuft per Zoom – Wege vorher erledigen.', source: 'Wetter · Kalender', module: 'weather', actionLabel: 'Wetter ansehen' },
  { id: 'h2', tone: 'danger', icon: 'alert-circle', title: 'Angebot Müller GmbH heute 14:00 fällig', text: 'Noch offen: PDF erzeugen, an Kunden senden.', source: 'Aufgaben', module: 'tasks', actionLabel: 'Aufgabe öffnen' },
];

export const hintCards = {
  id: 'hint-cards',
  name: 'Smart-Hinweise',
  category: 'Start',
  description: 'Regelbasierte Hinweise aus mehreren Modulen („Sturmböen und Termin“, „Frist heute“, „Abo ungenutzt“) mit Quelle, Aktion, Wegwischen und „Später erinnern“. Stile: Liste, Karten, Banner (nur der wichtigste Hinweis).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Hinweise' },
    { name: 'style', label: 'Stil', type: 'select', options: ['list', 'cards', 'banner'], default: 'list' },
    { name: 'limit', label: 'Max. Hinweise (0 = alle)', type: 'number', default: 0 },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
  ],
  data: [{ slot: 'hints', label: 'Hinweise', default: 'hints', shape: '{id,tone,icon,title,text,source,module?,actionLabel?}[]', required: true }],
  events: ['hint.open', 'hint.dismiss', 'hint.snooze', 'hint.open.weather', 'hint.open.tasks', 'hint.open.calendar', 'hint.open.finance', 'hint.open.savings', 'hint.open.habits'],
  states: ['empty'],
  css: `
  .tk-hc__list { display:flex; flex-direction:column; } .tk-hc__item { display:flex; gap:12px; align-items:flex-start; padding:12px 12px 12px 16px; border-bottom:1px solid var(--tk-c-border); min-width:0; position:relative; } .tk-hc__item:last-child { border-bottom:0; }
  .tk-hc__item::before { content:''; position:absolute; left:0; top:12px; bottom:12px; width:3px; border-radius:2px; background:var(--tc); }
  .tk-hc__ic { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--tc) 15%, transparent); color:var(--tc); } .tk-hc__main { flex:1; min-width:0; } .tk-hc__main b { display:block; font-weight:var(--tk-fw-semibold); } .tk-hc__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; line-height:var(--tk-lh-snug); }
  .tk-hc__meta { display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap; } .tk-hc__src { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); } .tk-hc__x { display:flex; gap:2px; flex:none; margin:-2px 0; }
  .tk-hc__dense .tk-hc__item { padding-top:8px; padding-bottom:8px; } .tk-hc__dense .tk-hc__text { display:none; }
  .tk-hc__grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:var(--tk-space-3); } .tk-hc__card { display:flex; flex-direction:column; gap:10px; padding:16px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-top:3px solid var(--tc); min-width:0; }
  .tk-hc__card .tk-hc__main b { font-size:var(--tk-fs-lg); letter-spacing:var(--tk-ls-tight); }
  .tk-hc__banner { display:flex; gap:12px; align-items:center; padding:12px 14px; border-radius:var(--tk-radius-lg); background:color-mix(in srgb, var(--tc) 11%, var(--tk-c-surface)); border:1px solid color-mix(in srgb, var(--tc) 35%, var(--tk-c-border)); flex-wrap:wrap; }
  .bp-mobile .tk-hc__item { padding-right:6px; }`,
  example: { data: { hints: EXAMPLE } },
  render: ({ props, data, setData, ctx }) => {
    const all = Array.isArray(data.hints) ? data.hints : [];
    const hints = props.limit > 0 || props.style === 'banner' ? all.slice(0, props.style === 'banner' ? 1 : props.limit) : all;
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="sparkles" title="Keine Hinweise" text="Alles im Griff – hier erscheint etwas, sobald es wichtig wird." /><//>`;
    const act = (h) => ctx.emit(h.module ? `hint.open.${h.module}` : 'hint.open', { id: h.id });
    const dismiss = (h) => { setData('hints', (xs) => xs.filter((x) => x.id !== h.id)); ctx.emit('hint.dismiss', { id: h.id }); ctx.toast('Hinweis ausgeblendet'); };
    const snooze = (h) => { setData('hints', (xs) => xs.filter((x) => x.id !== h.id)); ctx.emit('hint.snooze', { id: h.id }); ctx.toast('Ich erinnere dich später'); };
    const actions = (h) => html`<div class="tk-hc__meta">${h.actionLabel && html`<${Button} size="sm" variant="primary" onClick=${() => act(h)}>${h.actionLabel}<//>`}<${Button} size="sm" variant="ghost" icon="clock" onClick=${() => snooze(h)}>Später<//><span class="tk-hc__src">Quelle: ${h.source}</span></div>`;
    const x = (h) => html`<div class="tk-hc__x"><${Button} size="sm" variant="ghost" icon="x" aria-label=${`Hinweis „${h.title}“ ausblenden`} onClick=${() => dismiss(h)} /></div>`;
    const body = (h) => html`<span class="tk-hc__ic"><${Icon} name=${h.icon || 'info'} size=${17} /></span><div class="tk-hc__main"><b>${h.title}</b>${h.text && html`<div class="tk-hc__text">${h.text}</div>`}${actions(h)}</div>`;
    if (props.style === 'banner') { const h = hints[0]; return html`<div class="tk-hc__banner" style=${`--tc:${toneColor(h.tone)}`} role="status">${body(h)}${x(h)}</div>`; }
    if (props.style === 'cards') return html`<div class="tk-hc__grid">${hints.map((h) => html`<div class="tk-hc__card" style=${`--tc:${toneColor(h.tone)}`}><div class="tk-row" style="align-items:flex-start;gap:12px">${body(h)}${x(h)}</div></div>`)}</div>`;
    return html`<${Card} flush title=${props.title} actions=${html`<${Badge}>${all.length}<//>`}><div class=${`tk-hc__list ${props.dense ? 'tk-hc__dense' : ''}`}>${hints.map((h) => html`<div class="tk-hc__item" style=${`--tc:${toneColor(h.tone)}`}>${body(h)}${x(h)}</div>`)}</div><//>`;
  },
};
export default hintCards;
