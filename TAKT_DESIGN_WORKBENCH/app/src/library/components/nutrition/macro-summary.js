// Ernährung: Makros (Eiweiß, Kohlenhydrate, Fett) als Balken, Ringe oder Anteilsbalken – Farbe nie allein (Buchstabe + Zahl).
import { html } from '../../../lib/html.js';
import { Card, EmptyState, Icon } from '../../ui.js';
import { dayView, hasGoal, num, MACROS, macroShare } from './_calc.js';
import { Ring, NU_CSS, arr, obj } from './_ui.js';

export const macroSummary = {
  id: 'macro-summary',
  name: 'Makros',
  category: 'Ernährung',
  description: 'Eiweiß, Kohlenhydrate und Fett des Tages gegen das Ziel: als Balkenliste, konzentrische Ringe oder gestapelter Anteilsbalken. Jede Farbe trägt zusätzlich Buchstabe und Gramm.',
  version: '1.1',
  props: [
    { name: 'quietEmpty', label: 'Im Erststart (noch nichts erfasst) nichts anzeigen', type: 'boolean', default: false },
    { name: 'title', label: 'Titel', type: 'text', default: 'Makros' },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['bars', 'rings', 'stacked'], default: 'bars' },
    { name: 'showFiber', label: 'Ballaststoffe zeigen', type: 'boolean', default: true },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal,protein,carbs,fat,fiber}', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: '{date,kcal,protein,carbs,fat,fiber}[]', required: true },
  ],
  events: ['macro.open'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-nmac { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-nmac__row { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:10px; border:0; background:transparent; color:inherit; font:inherit; text-align:left; padding:6px 0; cursor:pointer; width:100%; min-height:40px; border-radius:var(--tk-radius-md); }
  .tk-nmac__row:hover { background:var(--tk-c-surface2); }
  .tk-nmac__lab { display:flex; align-items:center; gap:8px; min-width:92px; font-weight:var(--tk-fw-medium); }
  .tk-nmac__tag { width:24px; height:24px; border-radius:7px; display:grid; place-items:center; font-size:11px; font-weight:var(--tk-fw-bold); color:var(--tk-c-text); box-shadow:inset 0 0 0 2px var(--mc); background:color-mix(in srgb, var(--mc) 20%, var(--tk-c-surface)); }
  .tk-nmac__val { font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; } .tk-nmac__val small { color:var(--tk-c-text-subtle); }
  .tk-nmac__track { position:relative; height:10px; border-radius:5px; background:var(--tk-c-surface3); overflow:hidden; } .tk-nmac__track i { display:block; height:100%; border-radius:5px; }
  .tk-nmac--dense .tk-nmac__row { padding:2px 0; min-height:32px; } .tk-nmac--dense .tk-nmac__track { height:6px; }
  .tk-nmac__rings { display:flex; align-items:center; gap:var(--tk-space-5); flex-wrap:wrap; justify-content:center; }
  .tk-nmac__legend { flex:1 1 180px; display:flex; flex-direction:column; gap:6px; min-width:0; }
  .tk-nmac__stack { display:flex; height:22px; border-radius:11px; overflow:hidden; gap:2px; }
  .tk-nmac__stack i { display:block; min-width:10px; }
  .tk-nmac__leg3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .tk-nmac__leg3 div { padding:8px 10px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); } .tk-nmac__leg3 strong { display:block; font-variant-numeric:tabular-nums; } .tk-nmac__leg3 span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-muted); }
  .tk-nmac__fib { display:flex; align-items:center; gap:8px; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); padding-top:4px; border-top:1px dashed var(--tk-c-border); }`,
  example: { data: {
    goals: { kcal: 2400, protein: 140, carbs: 291, fat: 75, fiber: 30 },
    diary: [{ date: '2026-11-24', kcal: 1490, protein: 69, carbs: 134, fat: 71, fiber: 17 }],
  } },
  render: function MacroSummary({ props, data, ctx }) {
    const goals = obj(data.goals), v = dayView(ctx, { goals, diary: arr(data.diary) });
    if (props.quietEmpty && !arr(data.diary).length) return null;
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="pie-chart">${b}<//>` : b);
    if (!hasGoal(goals)) return wrap(html`<${EmptyState} icon="pie-chart" title="Keine Makro-Ziele" text="Sobald ein Ziel gesetzt ist, siehst du hier Eiweiß, Kohlenhydrate und Fett." />`);
    const hide = goals.showNumbers === false;
    const rows = MACROS.map((m) => ({ ...m, val: v.t[m.id], goal: v.goal[m.id] || 0 }));
    const open = (id) => ctx.emit('macro.open', { id });
    const fiber = props.showFiber && html`<div class="tk-nmac__fib"><${Icon} name="leaf" size=${15} />Ballaststoffe <strong class="tk-num" style="color:var(--tk-c-text)">${hide ? '–' : `${num(v.t.fiber)} von ${num(v.goal.fiber)} g`}</strong></div>`;
    let body;
    if (hide) body = html`<p class="tk-muted" style="margin:0">Zahlen sind ausgeblendet.</p>`;
    else if (props.mode === 'rings') {
      const S = 168, sw = 14;
      body = html`<div class="tk-nmac__rings"><div style=${`position:relative;width:${S}px;height:${S}px`} role="img" aria-label=${rows.map((r) => `${r.label} ${num(r.val)} von ${num(r.goal)} g`).join(', ')}>
        ${rows.map((r, i) => html`<div style=${`position:absolute;inset:${i * (sw + 4)}px`}><${Ring} size=${S - i * 2 * (sw + 4)} stroke=${sw} value=${r.val} max=${r.goal} color=${r.color} label=${r.label} /></div>`)}
        <div class="tk-nu-ring__in" style="position:absolute;inset:0"><span class="tk-nu-big" style="font-size:18px">${Math.round((v.t.protein / (v.goal.protein || 1)) * 100)} %</span><span class="tk-nu-meta" style="font-size:10px">E</span></div></div>
        <div class="tk-nmac__legend">${rows.map((r) => html`<button type="button" class="tk-nmac__row" style="grid-template-columns:auto 1fr" onClick=${() => open(r.id)}><span class="tk-nmac__lab"><span class="tk-nmac__tag" style=${`--mc:${r.color}`}>${r.short}</span>${r.label}</span><span class="tk-nmac__val"><strong>${num(r.val)}</strong> <small>/ ${num(r.goal)} g</small></span></button>`)}</div></div>`;
    } else if (props.mode === 'stacked') {
      const s = macroShare(v.t), none = v.t.protein + v.t.carbs + v.t.fat === 0;
      body = html`<div class="tk-nmac"><div class="tk-nmac__stack" role="img" aria-label=${rows.map((r) => `${r.label} ${Math.round(s[r.id] * 100)} Prozent`).join(', ')}>
        ${none ? html`<i style="flex:1;background:var(--tk-c-surface3)"></i>` : rows.map((r) => html`<i style=${`flex:${Math.max(s[r.id], 0.02)};background:${r.color}`}></i>`)}</div>
        <div class="tk-nmac__leg3">${rows.map((r) => html`<div><strong>${r.short} · ${num(r.val)} g</strong><span>${none ? 0 : Math.round(s[r.id] * 100)} % · Ziel ${num(r.goal)} g</span></div>`)}</div></div>`;
    } else {
      body = html`<div class=${`tk-nmac ${props.dense ? 'tk-nmac--dense' : ''}`}>${rows.map((r) => { const p = r.goal ? r.val / r.goal : 0; return html`<button type="button" class="tk-nmac__row" onClick=${() => open(r.id)} aria-label=${`${r.label}: ${num(r.val)} von ${num(r.goal)} Gramm`}>
        <span class="tk-nmac__lab"><span class="tk-nmac__tag" style=${`--mc:${r.color}`}>${r.short}</span>${props.dense ? r.short : r.label}</span>
        <span class="tk-nmac__track"><i style=${`width:${Math.min(100, p * 100)}%;background:${r.color}`}></i></span>
        <span class="tk-nmac__val"><strong>${num(r.val)}</strong> <small>/ ${num(r.goal)} g</small></span></button>`; })}</div>`;
    }
    return wrap(html`<div class="tk-nmac">${body}${fiber}</div>`);
  },
};
export default [macroSummary];
