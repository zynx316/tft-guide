// Kalender: Feiertage (NRW) und Geburtstage der nächsten Wochen – mit Countdown, respektiert ausgeblendete Quellen.
import { html } from '../../../lib/html.js';
import { Card, Icon, Badge, EmptyState } from '../../ui.js';
import { dayStart, dayKey, parseDay } from './_cal.js';

const DAYS = (a, b) => Math.round((dayStart(a) - dayStart(b)) / 864e5);
export const inDays = (n) => (n === 0 ? 'heute' : n === 1 ? 'morgen' : `in ${n} Tagen`);
const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export const specialDays = {
  id: 'special-days',
  name: 'Feiertage & Geburtstage',
  category: 'Kalender',
  description: 'Die nächsten gesetzlichen Feiertage (NRW) und Geburtstage aus den Kontakten mit Countdown. Ausgeblendete Quellen verschwinden auch hier. Antippen öffnet den zugehörigen Termin.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Feiertage & Geburtstage' },
    { name: 'days', label: 'Zeitraum (Tage)', type: 'number', default: 60 },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 5 },
    { name: 'showHolidays', label: 'Feiertage', type: 'boolean', default: true },
    { name: 'showBirthdays', label: 'Geburtstage', type: 'boolean', default: true },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards'], default: 'list' },
  ],
  data: [
    { slot: 'holidays', label: 'Feiertage', default: 'holidays', shape: '{id,name,date,type,eventId?}[]', required: false },
    { slot: 'birthdays', label: 'Geburtstage', default: 'birthdays', shape: '{id,name,date,relation,turns?,eventId?}[]', required: false },
    { slot: 'events', label: 'Termine (für Sichtbarkeit)', default: 'events', shape: '{id,hidden?}[]', required: false },
  ],
  events: ['event.open'],
  states: ['empty'],
  css: `
  .tk-cal-special__row { display:flex; align-items:center; gap:12px; width:100%; min-height:56px; padding:8px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-cal-special__row:last-child { border-bottom:0; } .tk-cal-special__row:hover { background:var(--tk-c-surface2); }
  .tk-cal-special__date { width:44px; flex:none; text-align:center; border-radius:var(--tk-radius-md); background:var(--tk-c-surface3); padding:4px 0; line-height:1.15; }
  .tk-cal-special__date b { display:block; font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; } .tk-cal-special__date small { font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); color:var(--tk-c-text-muted); }
  .tk-cal-special__date[data-kind="birthday"] { background:color-mix(in srgb, var(--tk-c-accent2) 16%, var(--tk-c-surface)); }
  .tk-cal-special__cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:var(--tk-space-3); }
  .tk-cal-special__card { display:flex; flex-direction:column; gap:6px; align-items:flex-start; min-height:112px; padding:var(--tk-space-3) var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-cal-special__card:hover { border-color:var(--tk-c-border-strong); }
  .tk-cal-special__card[data-kind="birthday"] { background:color-mix(in srgb, var(--tk-c-accent2) 9%, var(--tk-c-surface)); }
  .tk-cal-special__big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); line-height:1; font-variant-numeric:tabular-nums; }
  [data-tk-large-text] .tk-cal-special__row { flex-wrap:wrap; row-gap:4px; align-items:flex-start; padding-block:10px; }
  [data-tk-large-text] .tk-cal-special__row > .tk-grow { flex:1 1 6em; min-width:0; }
  [data-tk-large-text] .tk-cal-special__row .tk-truncate, [data-tk-large-text] .tk-cal-special__card .tk-truncate { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:break-word; }
  [data-tk-large-text] .tk-cal-special__row > .tk-badge { margin-left:calc(44px + 12px); }
  [data-tk-large-text] .tk-cal-special__cards { grid-template-columns:repeat(auto-fill, minmax(min(100%, 9em), 1fr)); }
  .bp-mobile .tk-cal-special__row { min-height:60px; } .bp-mobile .tk-cal-special__cards { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }`,
  example: { data: {
    holidays: [{ id: 'h1', name: '1. Weihnachtstag', date: '2026-12-25', type: 'gesetzlich' }, { id: 'h2', name: 'Heiligabend', date: '2026-12-24', type: 'Brauchtum' }],
    birthdays: [{ id: 'b1', name: 'Timo', date: '2026-11-28', relation: 'Bruder', turns: 36 }], events: [],
  } },
  render: ({ props, data, ctx }) => {
    const hidden = new Set((Array.isArray(data.events) ? data.events : []).filter((e) => e.hidden).map((e) => e.id));
    const list = [
      ...(props.showHolidays ? (data.holidays || []).map((h) => ({ id: h.eventId || h.id, kind: 'holiday', name: h.name, date: h.date, sub: h.type === 'gesetzlich' ? 'Gesetzlicher Feiertag NRW' : h.type })) : []),
      ...(props.showBirthdays ? (data.birthdays || []).map((b) => ({ id: b.eventId || b.id, kind: 'birthday', name: `Geburtstag ${b.name.split(' (')[0]}`, date: b.date, sub: `${b.relation}${b.turns ? ` · wird ${b.turns}` : ''}` })) : []),
    ].map((x) => ({ ...x, n: DAYS(parseDay(x.date), ctx.today) })).filter((x) => x.n >= 0 && x.n <= Number(props.days) && !hidden.has(x.id)).sort((a, b) => a.n - b.n).slice(0, Number(props.limit) || 5);
    if (!list.length) return html`<${Card} title=${props.title} icon="party-popper"><${EmptyState} icon="party-popper" title="Nichts in Sicht" text=${`In den nächsten ${props.days} Tagen stehen keine Feiertage oder Geburtstage an.`} /><//>`;
    const open = (x) => ctx.emit('event.open', { id: x.id });
    const dt = (x) => { const d = parseDay(x.date); return { day: d.getDate(), mon: MON[d.getMonth()] }; };
    if (props.style === 'cards') return html`<div class="tk-col" style="gap:var(--tk-space-2)">${props.title && html`<span class="tk-label">${props.title}</span>`}<div class="tk-cal-special__cards">${list.map((x) => html`<button type="button" class="tk-cal-special__card" data-kind=${x.kind} onClick=${() => open(x)}>
      <${Icon} name=${x.kind === 'birthday' ? 'gift' : 'flag'} size=${18} /><span class="tk-cal-special__big">${dt(x).day}. ${dt(x).mon}</span><b>${x.name}</b><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${x.sub} · ${inDays(x.n)}</span></button>`)}</div></div>`;
    return html`<${Card} flush=${true} title=${props.title} icon="party-popper">${list.map((x) => html`<button type="button" class="tk-cal-special__row" onClick=${() => open(x)}>
      <span class="tk-cal-special__date" data-kind=${x.kind}><b>${dt(x).day}</b><small>${dt(x).mon}</small></span>
      <span class="tk-grow"><div class="tk-truncate" style="font-weight:var(--tk-fw-medium)">${x.name}</div><div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)">${x.sub}</div></span>
      <${Badge} tone=${x.n <= 3 ? 'accent' : 'neutral'}>${inDays(x.n)}<//></button>`)}<//>`;
  },
};
export default specialDays;
