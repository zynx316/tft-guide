// Ernährung: Kalorien-Bilanz (Ziel − gegessen = übrig) als Ring, Balken oder Formel. Überschreitung bleibt neutral.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Icon } from '../../ui.js';
import { dayView, hasGoal, num, dayLabel } from './_calc.js';
import { Ring, NU_CSS, arr, obj } from './_ui.js';

export const calorieBudget = {
  id: 'calorie-budget',
  name: 'Kalorien-Bilanz',
  category: 'Ernährung',
  description: 'Tagesbilanz aus Ziel, Gegessen und Übrig als Ring, Balken oder Formel. Geplante Mahlzeiten werden heller ergänzt. Über dem Ziel bleibt die Darstellung neutral, ohne Rot und ohne Wertung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Kalorien' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['ring', 'bar', 'formula'], default: 'ring' },
    { name: 'size', label: 'Ring-Durchmesser (px)', type: 'number', default: 180 },
    { name: 'showPlanned', label: 'Geplantes anzeigen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
    { name: 'quietEmpty', label: 'Ohne eigenen Leerhinweis (wenn eine Einladung daneben steht)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal,protein,carbs,fat,fiber,water,showNumbers?}', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: '{id,date,meal,kcal,protein,carbs,fat}[]', required: true },
    { slot: 'plan', label: 'Wochenplan', default: 'plan', shape: '{date,meal,status,kcal,protein}[]', required: false },
  ],
  events: ['budget.open'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-cb { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-cb--ring { align-items:center; }
  .tk-cb__stats { display:flex; flex-wrap:wrap; gap:var(--tk-space-3); width:100%; text-align:center; } .tk-cb__stats > .tk-cb__stat { flex:1 1 0; min-width:min-content; }
  .tk-cb__stat strong { display:block; font-size:var(--tk-nfs-xl); font-variant-numeric:tabular-nums; } .tk-cb__stat span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); }
  .tk-cb__msg { margin:0; text-align:center; color:var(--tk-c-text-muted); font-size:var(--tk-nfs-sm); display:flex; gap:6px; align-items:center; justify-content:center; }
  .tk-cb__open { border:0; background:transparent; color:inherit; font:inherit; cursor:pointer; padding:0; border-radius:var(--tk-radius-md); }
  .tk-cb__bar { position:relative; height:14px; border-radius:7px; background:var(--tk-c-surface3); overflow:hidden; display:flex; }
  .tk-cb__bar i { display:block; height:100%; } .tk-cb__bar i + i { opacity:.45; }
  .tk-cb__formula { display:flex; align-items:flex-end; justify-content:space-between; gap:8px; flex-wrap:wrap; }
  .tk-cb__term { display:flex; flex-direction:column; align-items:center; gap:2px; min-width:0; } .tk-cb__op { color:var(--tk-c-text-subtle); font-size:var(--tk-nfs-2xl); padding-bottom:18px; }
  .tk-cb__term strong { font-size:var(--tk-nfs-2xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; line-height:1.1; } .tk-cb__term span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); }
  .tk-cb__term--main strong { font-size:var(--tk-nfs-3xl); color:var(--tk-c-accent); }
  .bp-mobile .tk-cb__open { min-height:44px; } .bp-mobile .tk-cb__term strong { font-size:var(--tk-nfs-xl); } .bp-mobile .tk-cb__term--main strong { font-size:var(--tk-nfs-2xl); }`,
  example: { data: {
    goals: { kcal: 2400, protein: 140, carbs: 291, fat: 75, fiber: 30, water: 2500 },
    diary: [{ id: 'a', date: '2026-11-24', meal: 'breakfast', kcal: 520, protein: 38, carbs: 56, fat: 15 }, { id: 'b', date: '2026-11-24', meal: 'lunch', kcal: 720, protein: 26, carbs: 52, fat: 44 }],
    plan: [{ date: '2026-11-24', meal: 'dinner', status: 'planned', kcal: 636, protein: 39 }],
  } },
  render: function CalorieBudget({ props, data, ctx }) {
    const goals = obj(data.goals), v = dayView(ctx, { goals, diary: arr(data.diary), plan: arr(data.plan) });
    const wrap = (body) => (props.framed ? html`<${Card} title=${props.title}>${body}<//>` : body);
    if (!hasGoal(goals)) return wrap(html`<${EmptyState} icon="target" title="Noch kein Kalorienziel" text="Mit dem Assistenten legst du ein Ziel fest, das zu dir passt." action=${html`<${Button} size="sm" variant="primary" onClick=${() => ctx.emit('goals.open')}>Ziel festlegen<//>`} />`);
    const hide = goals.showNumbers === false;
    const g = v.goal.kcal, eaten = v.t.kcal, left = v.left, planned = props.showPlanned ? v.planned.kcal : 0;
    const open = () => ctx.emit('budget.open', { day: v.iso });
    const msg = hide ? 'Zahlen sind ausgeblendet. Mahlzeiten zählen trotzdem mit.' : v.over ? 'Heute etwas über dem Ziel – der Wochenschnitt zählt.' : v.reached ? 'Ziel erreicht. Schön, dass es passt.' : planned ? `Mit dem Plan: etwa ${num(eaten + planned)} kcal.` : v.entries.length || props.quietEmpty ? null : 'Noch nichts erfasst. Tippe auf Erfassen, wenn du magst.';
    const alt = `${num(eaten)} von ${num(g)} Kilokalorien gegessen${left >= 0 ? `, ${num(left)} übrig` : `, ${num(-left)} darüber`}`;
    const word = left >= 0 ? 'übrig' : 'darüber';
    let body;
    if (props.style === 'formula') {
      body = html`<div class="tk-cb"><div class="tk-cb__formula" aria-label=${alt}>
        <div class="tk-cb__term"><strong>${hide ? '–' : num(g)}</strong><span>Ziel</span></div><span class="tk-cb__op" aria-hidden="true">−</span>
        <div class="tk-cb__term"><strong>${hide ? '–' : num(eaten)}</strong><span>Gegessen</span></div><span class="tk-cb__op" aria-hidden="true">=</span>
        <div class="tk-cb__term tk-cb__term--main"><strong>${hide ? '–' : num(Math.abs(left))}</strong><span>${word}</span></div></div>
        <div class="tk-cb__bar" role="img" aria-label=${alt}><i style=${`width:${Math.min(100, (eaten / g) * 100)}%;background:var(--tk-c-accent)`}></i>${planned > 0 && html`<i style=${`width:${Math.min(100 - Math.min(100, (eaten / g) * 100), (planned / g) * 100)}%;background:var(--tk-c-accent)`}></i>`}</div>
        ${msg && html`<p class="tk-cb__msg">${msg}</p>`}</div>`;
    } else if (props.style === 'bar') {
      body = html`<div class="tk-cb"><div class="tk-row" style="align-items:baseline;justify-content:space-between;gap:12px"><button type="button" class="tk-cb__open" onClick=${open} aria-label="Bilanz öffnen"><span class="tk-nu-big">${hide ? '–' : num(Math.abs(left))}</span> <span class="tk-muted">kcal ${word}</span></button><span class="tk-nu-meta tk-num">${hide ? '' : `${num(eaten)} von ${num(g)}`}</span></div>
        <div class="tk-cb__bar" role="img" aria-label=${alt}><i style=${`width:${Math.min(100, (eaten / g) * 100)}%;background:var(--tk-c-accent)`}></i>${planned > 0 && html`<i style=${`width:${Math.min(100 - Math.min(100, (eaten / g) * 100), (planned / g) * 100)}%;background:var(--tk-c-accent)`}></i>`}</div>
        ${msg && html`<p class="tk-cb__msg" style="justify-content:flex-start;text-align:left">${msg}</p>`}</div>`;
    } else {
      const S = props.size;
      body = html`<div class="tk-cb tk-cb--ring"><button type="button" class="tk-cb__open" onClick=${open} aria-label="Bilanz öffnen">
        <${Ring} size=${S} stroke=${Math.round(S * 0.085)} value=${eaten} max=${g} label=${alt}>
          <span class="tk-nu-big" style=${`font-size:${Math.round(S * 0.19)}px`}>${hide ? '–' : num(Math.abs(left))}</span><span class="tk-nu-meta">kcal ${word}</span><//></button>
        <div class="tk-cb__stats"><div class="tk-cb__stat"><strong>${hide ? '–' : num(g)}</strong><span>Ziel</span></div><div class="tk-cb__stat"><strong>${hide ? '–' : num(eaten)}</strong><span>Gegessen</span></div><div class="tk-cb__stat"><strong>${hide ? '–' : planned ? num(planned) : '0'}</strong><span>Geplant</span></div></div>
        ${msg && html`<p class="tk-cb__msg">${msg}</p>`}</div>`;
    }
    if (!props.framed) return body;
    return html`<${Card} title=${props.title} icon="flame" actions=${!v.isToday && html`<span class="tk-nu-meta">${dayLabel(v.iso)}</span>`}>${body}<//>`;
  },
};
export default [calorieBudget];
