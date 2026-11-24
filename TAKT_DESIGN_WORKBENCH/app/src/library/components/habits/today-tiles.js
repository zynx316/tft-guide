// Start: Modul-Kacheln – Termine, Aufgaben, Gewohnheiten, Wetter, Finanzen, Sparplan, Training, Ernährung, Ziele, Einkauf, Fristen (live aus den Daten).
import { html } from '../../../lib/html.js';
import { Card, EmptyState, Icon, toneColor } from '../../ui.js';
import { toList } from '../../helpers.js';
import { dayData, buildTiles, TILE_KEYS } from './_today.js';
import { Ring, Bar } from './_habits.js';

const SAMPLE = { weather: { temp: 6, cond: 'Leicht bewölkt', icon: 'cloud-sun', warn: 'Sturmböen ab 14 Uhr', location: 'Bielefeld' }, finance: { expenses: 1284.3, savingsRate: 0.34, depotValue: 28640 }, plans: [{ id: 'p', name: 'All-World', monthly: 300, day: 1, active: true }],
  training: { next: 'Mi, 25.11.', nextName: 'Oberkörper' }, nutrition: { kcal: 612, kcalGoal: 2400, protein: 41, proteinGoal: 140 },
  events: [{ id: 'e', title: 'Daily Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00' }], tasks: [{ id: 't', title: 'Angebot Müller GmbH', due: '2026-11-24T14:00:00' }], habits: [] };

export const todayTiles = {
  id: 'today-tiles',
  name: 'Tageskacheln',
  category: 'Start',
  description: 'Modulübergreifende Kacheln für den Tag: Termine, Aufgaben, Gewohnheiten, Wetter, Finanzen, nächste Sparplan-Ausführung, Training und Ernährung. Stile: Streifen (Kennzahlen), Liste (dicht), Karten (eine Botschaft je Kachel). Jede Kachel öffnet ihr Modul.',
  version: '1.3',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dein Tag im Überblick' },
    { name: 'layout', label: 'Stil', type: 'select', options: ['strip', 'list', 'cards'], default: 'list' },
    { name: 'tiles', label: 'Kacheln (Reihenfolge)', type: 'list', default: TILE_KEYS },
    { name: 'columns', label: 'Spalten Karten (Desktop)', type: 'number', default: 3 },
  ],
  data: [
    { slot: 'events', label: 'Termine', default: 'events', shape: 'Termine (Welt)', required: false },
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben (Welt)', required: false },
    { slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: false },
    { slot: 'weather', label: 'Wetter', default: 'weather', shape: '{temp,cond,icon,warn?,location}', required: false },
    { slot: 'finance', label: 'Finanzkennzahlen', default: 'finance', shape: '{expenses,savingsRate,depotValue}', required: false },
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{name,monthly,day,active}[]', required: false },
    { slot: 'training', label: 'Training', default: 'training', shape: '{next,nextName}', required: false },
    { slot: 'nutrition', label: 'Ernährung', default: 'nutrition', shape: '{kcal,kcalGoal,protein,proteinGoal}', required: false },
    { slot: 'goalsSummary', label: 'Ziele (Kennzahlen)', default: 'goalsSummary', shape: '{kpis:[{label,value}]}', required: false },
    { slot: 'shoppingSummary', label: 'Einkauf & Haushalt (Kennzahlen)', default: 'shoppingSummary', shape: '{kpis:[{label,value}]}', required: false },
    { slot: 'documentsSummary', label: 'Dokumente & Verträge (Kennzahlen)', default: 'documentsSummary', shape: '{kpis:[{label,value}]}', required: false },
  ],
  events: ['tile.open.calendar', 'tile.open.tasks', 'tile.open.habits', 'tile.open.weather', 'tile.open.finance', 'tile.open.savings', 'tile.open.training', 'tile.open.nutrition', 'tile.open.goals', 'tile.open.shopping', 'tile.open.documents'],
  states: ['empty'],
  css: `
  .tk-tt__strip { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:var(--tk-space-3); } .bp-mobile .tk-tt__strip { grid-template-columns:repeat(2, minmax(0, 1fr)); gap:var(--tk-space-2); }
  .tk-tt__k { display:flex; flex-direction:column; gap:4px; padding:12px 14px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; min-height:44px; } .tk-tt__k:hover { border-color:var(--tk-c-border-strong); }
  .tk-tt__kl { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-width:0; } .tk-tt__kv { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.15; } .tk-tt__ks { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-tt__row { display:flex; align-items:center; gap:12px; width:100%; padding:9px 16px; min-height:60px; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; } .tk-tt__row:last-child { border-bottom:0; } .tk-tt__row:hover { background:var(--tk-c-surface2); }
  .tk-tt__ic { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--tc) 15%, transparent); color:var(--tc); } .tk-tt__main { flex:1; min-width:0; } .tk-tt__main b { display:block; font-weight:var(--tk-fw-medium); } .tk-tt__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); } .tk-tt__sub, .tk-tt__ks { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
  .tk-tt__val { text-align:right; font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; white-space:nowrap; } .tk-tt__val small { display:block; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-regular, 400); }
  .tk-tt__cards { display:grid; grid-template-columns:repeat(var(--cols, 3), minmax(0, 1fr)); gap:var(--tk-space-3); } .bp-tablet .tk-tt__cards { grid-template-columns:repeat(2, minmax(0, 1fr)); } .bp-mobile .tk-tt__cards { grid-template-columns:repeat(2, minmax(0, 1fr)); gap:var(--tk-space-2); }
  .tk-tt__c { display:flex; flex-direction:column; gap:10px; padding:16px; min-height:150px; border-radius:var(--tk-radius-xl, 16px); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; transition:border-color var(--tk-motion-fast); } .tk-tt__c:hover { border-color:var(--tk-c-border-strong); }
  .tk-tt__c[data-alert="true"] { border-color:color-mix(in srgb, var(--tk-c-warning) 55%, var(--tk-c-border)); } .tk-tt__cv { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; margin-top:auto; } .tk-tt__cs { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tk-tt__ch { display:flex; align-items:center; gap:8px; color:var(--tc); font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); } .tk-tt__chl { color:var(--tk-c-text-muted); flex:1; min-width:0; } .tk-tt__ch .tk-hb-ring { margin-left:auto; color:var(--tc); }
  .bp-mobile .tk-tt__c { padding:12px; min-height:140px; } .bp-mobile .tk-tt__cv { font-size:var(--tk-fs-xl); }
  [data-tk-large-text] .tk-tt__strip, .bp-mobile[data-tk-large-text] .tk-tt__strip, [data-tk-large-text] .tk-tt__cards, .bp-mobile[data-tk-large-text] .tk-tt__cards { grid-template-columns:minmax(0, 1fr); }
  [data-tk-large-text] .tk-tt__row { flex-wrap:wrap; row-gap:0; } [data-tk-large-text] .tk-tt__main { flex:1 1 8em; }
  [data-tk-large-text] .tk-tt__val { order:2; flex:1 0 100%; text-align:left; white-space:normal; padding-left:calc(36px + 12px); }
  [data-tk-large-text] .tk-tt__sub, [data-tk-large-text] .tk-tt__ks, [data-tk-large-text] .tk-tt__cs { -webkit-line-clamp:unset; display:block; overflow:visible; overflow-wrap:break-word; }`,
  example: { props: { layout: 'cards' }, data: SAMPLE },
  render: ({ props, data, ctx }) => {
    const keys = toList(props.tiles).filter((k) => TILE_KEYS.includes(k));
    const dd = dayData(data, ctx), tiles = buildTiles(data, ctx, dd);
    const shown = keys.map((k) => tiles.find((t) => t.key === k)).filter(Boolean);
    const blank = !(data.events?.length || data.tasks?.length || data.habits?.length || Object.keys(data.weather || {}).length || Object.keys(data.finance || {}).length || data.plans?.length);
    if (!shown.length || blank) return html`<${Card} title=${props.title}><${EmptyState} icon="layout-grid" title="Noch nichts angebunden" text="Verbinde Kalender, Aufgaben und Gewohnheiten, dann erscheint hier dein Tag." /><//>`;
    const open = (t) => ctx.emit(`tile.open.${t.key}`, { id: t.key });
    const col = (t) => toneColor(t.tone);
    if (props.layout === 'strip') return html`<div class="tk-tt__strip">${shown.map((t) => html`<button type="button" class="tk-tt__k" onClick=${() => open(t)} aria-label=${`${t.label}: ${t.value}. ${t.sub}`}>
      <span class="tk-tt__kl"><span style=${`color:${col(t)}`}><${Icon} name=${t.icon} size=${15} /></span><span class="tk-truncate">${t.label}</span></span><span class="tk-tt__kv">${t.value}</span>
      ${t.progress != null ? html`<${Bar} value=${t.progress} color=${col(t)} />` : html`<span class="tk-tt__ks">${t.sub}</span>`}</button>`)}</div>`;
    if (props.layout === 'cards') return html`<div class="tk-tt__cards" style=${`--cols:${props.columns}`}>${shown.map((t) => html`<button type="button" class="tk-tt__c" style=${`--tc:${col(t)}`} data-alert=${!!t.alert} onClick=${() => open(t)}>
      <span class="tk-tt__ch"><${Icon} name=${t.icon} size=${18} /><span class="tk-tt__chl tk-truncate">${t.label}</span>${t.progress != null && html`<${Ring} value=${t.progress} size=${34} stroke=${4} color=${col(t)} label=${`${Math.round(t.progress * 100)} Prozent`}><small style="font-size:10px">${Math.round(t.progress * 100)}</small><//>`}</span>
      <span class="tk-tt__cv">${t.value}</span><span class="tk-tt__cs">${t.sub}</span></button>`)}</div>`;
    return html`<${Card} flush title=${props.title}>${shown.map((t) => html`<button type="button" class="tk-tt__row" style=${`--tc:${col(t)}`} onClick=${() => open(t)}>
      <span class="tk-tt__ic"><${Icon} name=${t.icon} size=${18} /></span><span class="tk-tt__main"><b>${t.label}</b><span class="tk-tt__sub">${t.sub}</span></span>
      <span class="tk-tt__val">${t.value}${t.meta && ctx.bp !== 'mobile' && html`<small>${t.meta}</small>`}</span><span class="tk-subtle"><${Icon} name="chevron-right" size=${16} /></span></button>`)}<//>`;
  },
};
export default todayTiles;
