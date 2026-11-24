// Ernährung: Tagesleiste – Woche als Streifen mit Tageswahl (steuert die Übersicht), neutrale Kalorien-Füllung.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState } from '../../ui.js';
import { dayOf, wdOf, todayIso, viewDay, shiftDay, dayLabel, num, inCorridor } from './_calc.js';
import { NU_CSS, arr, obj } from './_ui.js';

export const dayStrip = {
  id: 'day-strip',
  name: 'Tagesleiste',
  category: 'Ernährung',
  description: 'Sieben Tage als Streifen mit Vor/Zurück. Ein Tap wählt den Tag für alle Ernährungs-Blöcke der Seite (ctx.ui.day). Die Füllung zeigt die Kalorien ohne Wertung; nicht erfasste Tage bleiben leer.',
  version: '1.0',
  props: [
    { name: 'days', label: 'Anzahl Tage', type: 'number', default: 7 },
    { name: 'showKcal', label: 'Kalorien-Füllung', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'history', label: 'Verlauf', default: 'history', shape: '{date,kcal,logged}[]', required: true },
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal}', required: false },
  ],
  events: ['day.select'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-ds { display:flex; align-items:center; gap:4px; min-width:0; }
  .tk-ds__days { flex:1; display:grid; grid-auto-flow:column; grid-auto-columns:minmax(0,1fr); gap:4px; min-width:0; }
  .tk-ds__day { display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 2px 7px; border-radius:var(--tk-radius-md); border:1px solid transparent; background:transparent; color:var(--tk-c-text-muted); font:inherit; cursor:pointer; min-height:56px; min-width:0; }
  .tk-ds__day:hover { background:var(--tk-c-surface2); } .tk-ds__day[aria-pressed="true"] { background:var(--tk-c-accent-soft); color:var(--tk-c-accent); border-color:transparent; }
  .tk-ds__wd { font-size:var(--tk-nfs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); } .tk-ds__n { font-size:var(--tk-nfs-lg); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text); font-variant-numeric:tabular-nums; } .tk-ds__day[aria-pressed="true"] .tk-ds__n { color:var(--tk-c-accent); }
  .tk-ds__fill { width:70%; height:4px; border-radius:2px; background:var(--tk-c-surface3); overflow:hidden; } .tk-ds__fill i { display:block; height:100%; background:var(--tk-c-text-subtle); } .tk-ds__day[aria-pressed="true"] .tk-ds__fill i { background:var(--tk-c-accent); }
  .tk-ds__today { font-size:10px; color:var(--tk-c-text-muted); line-height:1; min-height:10px; }
  .bp-mobile .tk-ds > .tk-btn { display:none; }`,
  example: { data: { history: [-6, -5, -4, -3, -2, -1, 0].map((n, i) => ({ date: `2026-11-${24 + n}`, kcal: [2444, 0, 2466, 2089, 2701, 2273, 1490][i], logged: i !== 1 })), goals: { kcal: 2400 } } },
  render: function DayStrip({ props, data, ctx }) {
    const hist = arr(data.history), today = todayIso(ctx), sel = viewDay(ctx), goal = obj(data.goals).kcal || 2400;
    const n = Math.max(3, Math.min(10, props.days));
    const days = Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
    if (!hist.length) return html`<${EmptyState} icon="calendar-days" title="Noch kein Verlauf" text="Sobald du Mahlzeiten erfasst, erscheint hier die Woche." />`;
    const pick = (d) => { ctx.setUi('day', d === today ? null : d); ctx.emit('day.select', { day: d }); };
    const step = (dir) => { const next = shiftDay(sel, dir); if (next <= today && next >= days[0]) pick(next); };
    const strip = html`<div class="tk-ds"><${Button} variant="ghost" size="sm" icon="chevron-left" aria-label="Vorheriger Tag" onClick=${() => step(-1)} disabled=${sel <= days[0]} />
      <div class="tk-ds__days" role="group" aria-label="Tag wählen">${days.map((d) => { const h = hist.find((x) => x.date === d); const p = h?.logged ? Math.min(1, h.kcal / goal) : 0;
        return html`<button type="button" class="tk-ds__day" aria-pressed=${String(d === sel)} onClick=${() => pick(d)} aria-label=${`${dayLabel(d)}${h?.logged ? `, ${num(h.kcal)} Kilokalorien` : ', nicht erfasst'}`}>
          <span class="tk-ds__wd">${wdOf(d)}</span><span class="tk-ds__n">${dayOf(d).getDate()}</span>${props.showKcal && html`<span class="tk-ds__fill"><i style=${`width:${p * 100}%`}></i></span>`}<span class="tk-ds__today">${d === today ? 'heute' : h?.logged ? '' : '–'}</span></button>`; })}</div>
      <${Button} variant="ghost" size="sm" icon="chevron-right" aria-label="Nächster Tag" onClick=${() => step(1)} disabled=${sel >= today} /></div>`;
    return props.framed ? html`<${Card}>${strip}<//>` : strip;
  },
};
export default [dayStrip];
