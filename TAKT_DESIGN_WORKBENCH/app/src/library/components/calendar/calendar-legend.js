// Kalender: Kategorien-Legende mit Filterfunktion (setzt ctx.ui.filter).
import { html } from '../../../lib/html.js';
import { Card, EmptyState, toneColor } from '../../ui.js';
import { CATEGORY_TONES, occurrences, addDays, selDate, startOfWeek } from './_cal.js';

export const calendarLegend = {
  id: 'calendar-legend',
  name: 'Kategorien-Legende',
  category: 'Kalender',
  description: 'Kategorien mit Farbe und Anzahl der Termine der gewählten Woche. Antippen filtert alle Kalenderblöcke (ctx.ui.filter), erneutes Antippen hebt den Filter auf.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Kategorien' },
    { name: 'scope', label: 'Zählung', type: 'select', options: ['Woche', 'alle'], default: 'Woche' },
  ],
  data: [{ slot: 'events', label: 'Termine', default: 'events', shape: '{id,start,end,category?,tone?}[]', required: true }],
  events: ['filter.change'],
  states: ['empty'],
  css: `
  .tk-legend__row { display:flex; align-items:center; gap:10px; width:100%; border:0; background:transparent; font:inherit; color:var(--tk-c-text); padding:8px 10px; border-radius:var(--tk-radius-md); cursor:pointer; min-height:40px; text-align:left; }
  .tk-legend__row:hover { background:var(--tk-c-surface2); }
  .tk-legend__row[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-legend__sw { width:12px; height:12px; border-radius:4px; background:var(--c); flex:none; }
  .tk-legend__n { font-variant-numeric:tabular-nums; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); }
  .bp-mobile .tk-legend__row { min-height:44px; }`,
  example: { data: { events: [
    { id: 'a', title: 'Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit' },
    { id: 'b', title: 'Training', start: '2026-11-26T18:30:00', end: '2026-11-26T19:30:00', category: 'Fitness' },
  ] } },
  render: ({ props, data, ctx }) => {
    const all = Array.isArray(data.events) ? data.events : [];
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="tags" title="Keine Kategorien" text="Sobald Termine existieren, erscheinen hier ihre Kategorien." /><//>`;
    const from = props.scope === 'Woche' ? startOfWeek(selDate(ctx)) : new Date(2000, 0, 1), to = props.scope === 'Woche' ? addDays(from, 7) : new Date(2100, 0, 1);
    const occ = props.scope === 'Woche' ? occurrences(all, from, to) : all;
    const cats = [...new Set([...Object.keys(CATEGORY_TONES), ...all.map((e) => e.category).filter(Boolean)])];
    const active = ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter) ? ctx.ui.filter : null;
    const toggle = (c) => { const v = active === c ? 'Alle' : c; ctx.setUi('filter', v); ctx.emit('filter.change', { filter: v }); };
    return html`<${Card} title=${props.title} icon="tags"><div class="tk-col" style="gap:2px;margin:-4px -6px">
      ${cats.map((c) => { const n = occ.filter((e) => e.category === c).length; const tone = CATEGORY_TONES[c] || all.find((e) => e.category === c)?.tone || 'accent';
        return html`<button type="button" class="tk-legend__row" aria-pressed=${active === c} onClick=${() => toggle(c)}><span class="tk-legend__sw" style=${`--c:${toneColor(tone)}`}></span><span class="tk-grow tk-truncate">${c}</span><span class="tk-legend__n">${n}</span></button>`; })}
    </div><//>`;
  },
};
export default calendarLegend;
