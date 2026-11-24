// Gewohnheiten: Statistik – Quoten (7/30/90 Tage), Wochentags-Muster, Serien; oder Vergleich aller Gewohnheiten.
import { html } from '../../../lib/html.js';
import { Card, EmptyState, Icon, toneColor, Badge } from '../../ui.js';
import { list, todayKey, rateOf, weekdayRates, streakOf, totalDone, WD, WD_LONG, HABIT_CSS, Ring, Bar } from './_habits.js';

const pct = (v) => `${Math.round(v * 100)} %`;
const sample = { id: 'a', name: 'Dehnen', icon: 'activity', tone: 2, daypart: 'morgens', rhythm: { type: 'daily' }, since: '2026-08-01',
  log: Object.fromEntries(Array.from({ length: 100 }, (_, i) => { const d = new Date(2026, 10, 23 - i); return [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, (i * 5) % 7 < 5 ? 1 : 0]; }).filter(([, v]) => v)) };

export const habitInsights = {
  id: 'habit-insights',
  name: 'Gewohnheits-Statistik',
  category: 'Gewohnheiten',
  description: 'Erfüllungsquote über 7, 30 und 90 Tage, Wochentags-Muster mit verständlichem Fazit und Serien. Umfang „alle“ vergleicht alle Gewohnheiten. Zahlen statt Bewertung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Statistik' },
    { name: 'scope', label: 'Umfang', type: 'select', options: ['selected', 'all'], default: 'selected' },
    { name: 'days', label: 'Zeitraum für Muster (Tage)', type: 'number', default: 90 },
  ],
  data: [{ slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: true }],
  events: ['insight.open', 'habit.open'],
  states: ['empty'],
  css: `${HABIT_CSS}
  .tk-hi { padding:0 16px 16px; display:flex; flex-direction:column; gap:16px; } .tk-hi__rings { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; }
  .tk-hi__ring { display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 6px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); text-align:center; }
  .tk-hi__ring .tk-hb-ring__in { font-size:var(--tk-fs-sm); } .tk-hi__lab { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); margin-bottom:8px; }
  .tk-hi__bars { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:8px; align-items:end; height:112px; } .tk-hi__b { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:4px; height:100%; min-width:0; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-hi__b i { display:block; width:100%; max-width:34px; border-radius:6px 6px 3px 3px; background:color-mix(in srgb, var(--hc) 38%, transparent); min-height:4px; } .tk-hi__b[data-top="true"] i { background:var(--hc); } .tk-hi__b[data-low="true"] i { background:repeating-linear-gradient(135deg, color-mix(in srgb, var(--hc) 55%, transparent) 0 3px, transparent 3px 6px); border:1px solid var(--hc); }
  .tk-hi__b b { font-variant-numeric:tabular-nums; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); font-weight:var(--tk-fw-semibold); } .tk-hi__fazit { display:flex; gap:10px; align-items:flex-start; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-accent-soft); font-size:var(--tk-fs-sm); color:var(--tk-c-text); }
  .tk-hi__row { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-hi__row:last-child { border-bottom:0; } .tk-hi__row .tk-progress { flex:1; min-width:40px; } .tk-hi__nm { width:38%; min-width:0; display:flex; align-items:center; gap:8px; font-weight:var(--tk-fw-medium); } .tk-hi__v { width:46px; text-align:right; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); }
  .bp-mobile .tk-hi { padding:0 12px 14px; } .bp-mobile .tk-hi__nm { width:42%; } .bp-mobile .tk-hi__bars { gap:5px; }
  [data-tk-large-text] .tk-hi__row { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-hi__nm, .bp-mobile[data-tk-large-text] .tk-hi__nm { width:auto; flex:1 1 60%; } [data-tk-large-text] .tk-hi__v { width:auto; min-width:4ch; white-space:nowrap; } [data-tk-large-text] .tk-hi__row .tk-progress { flex:1 0 100%; order:5; }`,
  example: { data: { habits: [sample] } },
  render: function HabitInsights({ props, data, ctx }) {
    const all = list(data.habits), today = todayKey(ctx);
    const head = (t) => html`<div class="tk-card__head" style="padding:14px 16px 10px;margin:0"><h3 class="tk-card__title">${t}</h3></div>`;
    if (!all.length) return html`<${Card} flush>${head(props.title)}<${EmptyState} icon="chart-bar-big" title="Noch keine Statistik" text="Nach den ersten Tagen siehst du hier deine Quote und deine stärksten Wochentage." /><//>`;
    if (props.scope === 'all') {
      const rows = all.map((h) => ({ h, r30: rateOf(h, today, 30), r7: rateOf(h, today, 7), s: streakOf(h, today) })).sort((a, b) => b.r30 - a.r30);
      const avg = rows.reduce((a, r) => a + r.r30, 0) / rows.length;
      return html`<${Card} flush>${head(props.title)}<div class="tk-hi"><div class="tk-hi__fazit"><${Icon} name="sparkles" size=${16} /><span>Im Schnitt <strong>${pct(avg)}</strong> der geplanten Tage in den letzten 30 Tagen. ${rows[0] && `Am besten: ${rows[0].h.name} (${pct(rows[0].r30)}).`}</span></div>
        <div><div class="tk-hi__lab">Quote 30 Tage</div>${rows.map(({ h, r30, r7 }) => html`<button type="button" class="tk-hi__row" style="width:100%;border:0;border-bottom:1px solid var(--tk-c-border);background:none;color:inherit;font:inherit;cursor:pointer;min-height:48px" onClick=${() => { ctx.setUi('selectedId', h.id); ctx.emit('habit.open', { id: h.id }); }}>
          <span class="tk-hi__nm"><span style=${`color:${toneColor(h.tone || 1)}`}><${Icon} name=${h.icon || 'repeat'} size=${15} /></span><span class="tk-truncate">${h.name}</span></span><${Bar} value=${r30} color=${toneColor(h.tone || 1)} /><span class="tk-hi__v">${pct(r30)}</span>
          ${ctx.bp !== 'mobile' && html`<${Badge} tone=${r7 >= r30 ? 'success' : 'neutral'}>${pct(r7)} / 7 T.<//>`}</button>`)}</div></div><//>`;
    }
    const h = all.find((x) => x.id === ctx.ui.selectedId) || all[0], hc = toneColor(h.tone || 1);
    const rates = weekdayRates(h, today, props.days), known = rates.map((v, i) => ({ v, i })).filter((x) => x.v != null);
    const top = known.length ? known.reduce((a, b) => (b.v > a.v ? b : a)) : null, low = known.length > 1 ? known.reduce((a, b) => (b.v < a.v ? b : a)) : null;
    const s = streakOf(h, today);
    return html`<${Card} flush style=${`--hc:${hc}`}>${head(`${props.title} · ${h.name}`)}<div class="tk-hi">
      <div class="tk-hi__rings">${[7, 30, 90].map((n) => { const r = rateOf(h, today, n); return html`<div class="tk-hi__ring"><${Ring} value=${r} size=${64} stroke=${6} color=${hc} label=${`${pct(r)} in ${n} Tagen`}>${pct(r)}<//><span>${n} Tage</span></div>`; })}</div>
      <div><div class="tk-hi__lab">Wochentags-Muster (${props.days} Tage)</div><div class="tk-hi__bars" role="img" aria-label=${known.map((x) => `${WD_LONG[x.i]} ${pct(x.v)}`).join(', ')}>${rates.map((v, i) => html`<div class="tk-hi__b" data-top=${top?.i === i} data-low=${low?.i === i && low.v < (top?.v ?? 0)}><b>${v == null ? '–' : Math.round(v * 100)}</b><i style=${`height:${Math.max(4, (v || 0) * 80)}px`}></i><span>${WD[i]}</span></div>`)}</div></div>
      ${top && html`<div class="tk-hi__fazit"><${Icon} name="lightbulb" size=${16} /><span>${WD_LONG[top.i]} läuft am besten (${pct(top.v)}).${low && low.i !== top.i ? ` ${WD_LONG[low.i]} ist am schwersten (${pct(low.v)}) – vielleicht ein kleinerer Schritt oder eine Erinnerung?` : ''}</span></div>`}
      <div class="tk-hi__rings"><div class="tk-hi__ring"><strong style="font-size:var(--tk-fs-xl);color:var(--tk-c-text)">${s.current}</strong>${s.unit} aktuell</div><div class="tk-hi__ring"><strong style="font-size:var(--tk-fs-xl);color:var(--tk-c-text)">${s.best}</strong>beste Serie</div><div class="tk-hi__ring"><strong style="font-size:var(--tk-fs-xl);color:var(--tk-c-text)">${totalDone(h)}</strong>Mal erledigt</div></div></div><//>`;
  },
};
export default habitInsights;
