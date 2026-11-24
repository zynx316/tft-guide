// Ernährung: Auswertungs-Bausteine – Makro-Verteilung, Top-Lebensmittel, Ballaststoffe/Zucker/Salz und Gewichtstrend (ohne Bewertung).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Segmented, EmptyState, Sparkline, Icon } from '../../ui.js';
import { num, avg, todayIso, MACROS, dayLabel, dayShort } from './_calc.js';
import { NU_CSS, arr, obj } from './_ui.js';

export const nutritionStats = {
  id: 'nutrition-stats',
  name: 'Auswertungs-Bausteine',
  category: 'Ernährung',
  description: 'Vier ruhige Auswertungen in einer Komponente: Makro-Verteilung, Top-5-Lebensmittel nach Kalorien oder Eiweiß, Ballaststoffe/Zucker/Salz gegen Orientierungswerte und Gewichtstrend neben der Ernährung. Nur erfasste Tage zählen; unter drei Tagen gibt es keine Statistik.',
  version: '1.1',
  props: [
    { name: 'mode', label: 'Inhalt', type: 'select', options: ['macros', 'top', 'micro', 'weight'], default: 'macros' },
    { name: 'title', label: 'Titel (leer = automatisch)', type: 'text', default: '' },
    { name: 'days', label: 'Tage', type: 'number', default: 7 },
  ],
  data: [
    { slot: 'history', label: 'Verlauf', default: 'history', shape: '{date,kcal,protein,carbs,fat,fiber,logged,partial}[]', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: true },
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{protein,carbs,fat,fiber}', required: false },
    { slot: 'profile', label: 'Profil', default: 'profile', shape: '{weightKg,goalWeightKg,weightTrend:[{date,kg}]}', required: false },
  ],
  events: ['stats.open', 'stats.basis'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-ns { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-ns__stack { display:flex; height:22px; border-radius:11px; overflow:hidden; gap:2px; } .tk-ns__stack i { display:block; min-width:10px; }
  .tk-ns__leg { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; } .tk-ns__leg div { padding:8px 10px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); min-width:0; } .tk-ns__leg strong { display:block; font-variant-numeric:tabular-nums; } .tk-ns__leg span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-muted); }
  .tk-ns__row { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 84px; align-items:center; gap:10px; min-height:40px; } .tk-ns__row strong { text-align:right; white-space:nowrap; } .tk-ns__row .n { min-width:0; } .tk-ns__bar { height:8px; border-radius:4px; background:var(--tk-c-surface3); overflow:hidden; } .tk-ns__bar i { display:block; height:100%; background:var(--tk-c-accent); opacity:.7; }
  .tk-ns__row strong { font-variant-numeric:tabular-nums; }
  .bp-mobile .tk-ns__row { grid-template-columns:minmax(0,1fr) auto; row-gap:4px; padding:6px 0; } .bp-mobile .tk-ns__row .n { grid-column:1 / -1; white-space:normal; overflow:visible; text-overflow:clip; }
  .tk-ns__w { display:flex; align-items:center; gap:16px; flex-wrap:wrap; } .tk-ns__w .tk-nu-big { font-size:var(--tk-nfs-2xl); }`,
  example: { data: {
    history: [{ date: '2026-11-18', kcal: 2444, protein: 161, carbs: 210, fat: 99, fiber: 44, logged: true }, { date: '2026-11-20', kcal: 2466, protein: 148, carbs: 256, fat: 87, fiber: 20, logged: true }, { date: '2026-11-21', kcal: 2089, protein: 125, carbs: 208, fat: 65, fiber: 33, logged: true }, { date: '2026-11-22', kcal: 2701, protein: 123, carbs: 254, fat: 103, fiber: 24, logged: true }],
    diary: [{ id: 'a', date: '2026-11-21', name: 'Lachs mit Ofengemüse', kcal: 636, protein: 38.9, fiber: 11, sugar: 12, salt: 0.3 }, { id: 'b', date: '2026-11-22', name: 'Rührei auf Vollkornbrot', kcal: 636, protein: 31, fiber: 14, sugar: 7, salt: 1.8 }, { id: 'c', date: '2026-11-21', name: 'Rührei auf Vollkornbrot', kcal: 636, protein: 31, fiber: 14, sugar: 7, salt: 1.8 }],
    goals: { protein: 140, carbs: 291, fat: 75, fiber: 30 },
    profile: { weightKg: 82.4, goalWeightKg: 79, weightTrend: [{ date: '2026-10-06', kg: 83.6 }, { date: '2026-10-20', kg: 83.1 }, { date: '2026-11-03', kg: 82.8 }, { date: '2026-11-24', kg: 82.4 }] },
  } },
  render: function NutritionStats({ props, data, ctx }) {
    const [basis, setBasis] = useState('kcal');
    const today = todayIso(ctx), n = props.days || 7;
    const hist = arr(data.history).filter((h) => h.logged && !h.partial && h.date < today).slice(-n);
    const enough = hist.length >= 3;
    const goals = obj(data.goals), prof = obj(data.profile);
    const titles = { macros: 'Makro-Verteilung', top: 'Häufigste Lebensmittel', micro: 'Ballaststoffe, Zucker, Salz', weight: 'Gewichtstrend' };
    const card = (b, icon) => html`<${Card} title=${props.title || titles[props.mode]} icon=${icon}>${b}<//>`;
    const few = html`<${EmptyState} icon="bar-chart-3" title="Noch zu wenig Daten" text="Ab drei erfassten Tagen zeigt TAKT Durchschnitte. Nicht erfasste Tage zählen nie als 0 kcal." />`;
    if (props.mode === 'weight') {
      const w = arr(prof.weightTrend);
      if (ctx.world?.get?.('prefs')?.health?.hideWeight) return card(html`<${EmptyState} icon="eye-off" title="Werte ausgeblendet" text="Du hast Gewichtswerte ausgeblendet. Einblenden kannst du sie in Fitness unter Körperwerte." />`, 'scale');
      if (w.length < 2) return card(html`<${EmptyState} icon="scale" title="Noch kein Gewichtstrend" text="Trage dein Gewicht ein, dann siehst du hier den Verlauf. Einzelne Tage sagen wenig, der Trend zählt." />`, 'scale');
      const d = w[w.length - 1].kg - w[0].kg;
      return card(html`<div class="tk-ns"><div class="tk-ns__w"><div><div class="tk-nu-big">${num(w[w.length - 1].kg, 1)} kg</div><div class="tk-nu-meta">${d <= 0 ? '−' : '+'}${num(Math.abs(d), 1)} kg seit ${dayShort(w[0].date)}</div></div>
        <${Sparkline} values=${w.map((x) => x.kg)} width=${160} height=${44} tone="accent2" /></div>
        <p class="tk-nu-meta" style="margin:0">${prof.goalWeightKg ? `Zielgewicht ${num(prof.goalWeightKg, 1)} kg. ` : ''}Das Gewicht schwankt täglich um bis zu 1,5 kg. Der Wochentrend ist aussagekräftiger.</p></div>`, 'scale');
    }
    if (!enough) return card(few, 'bar-chart-3');
    if (props.mode === 'macros') {
      const t = { protein: avg(hist, 'protein') * 4, carbs: avg(hist, 'carbs') * 4, fat: avg(hist, 'fat') * 9 }, sum = t.protein + t.carbs + t.fat || 1;
      const g = { protein: (goals.protein || 0) * 4, carbs: (goals.carbs || 0) * 4, fat: (goals.fat || 0) * 9 }, gs = g.protein + g.carbs + g.fat || 1;
      return card(html`<div class="tk-ns"><div class="tk-ns__stack" role="img" aria-label=${MACROS.map((m) => `${m.label} ${Math.round((t[m.id] / sum) * 100)} Prozent`).join(', ')}>${MACROS.map((m) => html`<i style=${`flex:${t[m.id] / sum};background:${m.color}`}></i>`)}</div>
        <div class="tk-ns__leg">${MACROS.map((m) => html`<div><strong>${m.short} · ${Math.round((t[m.id] / sum) * 100)} %</strong><span>Ø ${num(avg(hist, m.id))} g${gs > 1 ? ` · Ziel ${Math.round((g[m.id] / gs) * 100)} %` : ''}</span></div>`)}</div>
        <span class="tk-nu-meta">Durchschnitt über ${hist.length} erfasste Tage</span></div>`, 'pie-chart');
    }
    if (props.mode === 'top') {
      const days = new Set(hist.map((h) => h.date)), by = new Map();
      for (const e of arr(data.diary)) if (days.has(e.date) && !/geschätzt|Schätzung/.test(`${e.name} ${e.amount}`)) { const x = by.get(e.name) || { name: e.name, kcal: 0, protein: 0, n: 0 }; x.kcal += e.kcal; x.protein += e.protein; x.n += 1; by.set(e.name, x); }
      const rows = [...by.values()].sort((a, b) => b[basis] - a[basis]).slice(0, 5), max = rows[0]?.[basis] || 1;
      return card(html`<div class="tk-ns"><${Segmented} value=${basis} onChange=${(b) => { setBasis(b); ctx.emit('stats.basis', { basis: b }); }} label="Sortierung" options=${[{ value: 'kcal', label: 'Nach Kalorien' }, { value: 'protein', label: 'Nach Eiweiß' }]} />
        ${rows.map((r) => html`<div class="tk-ns__row"><span class="n tk-truncate">${r.name}<span class="tk-nu-meta"> · ${r.n}×</span></span><span class="tk-ns__bar"><i style=${`width:${(r[basis] / max) * 100}%`}></i></span><strong>${basis === 'kcal' ? `${num(r.kcal)} kcal` : `${num(r.protein)} g`}</strong></div>`)}</div>`, 'trophy');
    }
    const days = new Set(hist.map((h) => h.date)), per = [...days].map((d) => arr(data.diary).filter((e) => e.date === d)).filter((l) => l.length);
    const a = (k) => (per.length ? per.reduce((s, l) => s + l.reduce((x, e) => x + (Number(e[k]) || 0), 0), 0) / per.length : 0);
    const rows = [{ k: 'Ballaststoffe', v: a('fiber'), ref: goals.fiber || 30, unit: 'g', hint: 'Orientierung mindestens 30 g' }, { k: 'Zucker (gesamt)', v: a('sugar'), ref: 0, unit: 'g', hint: 'ohne Orientierungswert, zählt natürliche Zucker mit' }, { k: 'Salz', v: a('salt'), ref: 6, unit: 'g', hint: 'Orientierung höchstens 6 g' }];
    return card(html`<div class="tk-ns">${rows.map((r) => html`<div><div class="tk-row" style="justify-content:space-between"><span>${r.k}</span><strong class="tk-num">Ø ${num(r.v, 1)} ${r.unit}</strong></div>${r.ref > 0 && html`<div class="tk-ns__bar" style="margin-top:4px"><i style=${`width:${Math.min(100, (r.v / r.ref) * 100)}%`}></i></div>`}<span class="tk-nu-meta">${r.hint}</span></div>`)}
      <span class="tk-nu-meta">Geschätzte Einträge ohne Detailwerte sind nicht enthalten.</span></div>`, 'leaf');
  },
};
export default [nutritionStats];
