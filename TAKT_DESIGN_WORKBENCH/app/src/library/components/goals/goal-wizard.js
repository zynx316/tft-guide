// Ziele: Ziel anlegen als Assistent – Bereich, messbar über Quelle oder selbst gezählt, Zieldatum, Wochenfokus. Ohne Fachbegriffe.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Field, Input, Switch, NumberStepper, Chip } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { GOAL_SLOTS, GL_CSS, useViews, setGoals, toneColor } from './_goals.js';
import { FOCUS_MAX, addDaysIso, addMonthsIso } from './_calc.js';
import { sourceOptions, buildGoal } from './_create.js';
import { EXAMPLE } from './_example.js';

const STEPS = ['Bereich', 'Messen', 'Zieldatum', 'Wochenfokus'];

export const goalWizard = {
  id: 'goal-assistant',
  name: 'Ziel anlegen',
  category: 'Ziele',
  description: 'Assistent in vier Fragen: Bereich, woran du den Fortschritt siehst (automatisch aus einem Modul oder selbst gezählt), Zieldatum, Wochenfokus. Sparziele, Gewichtstrend und Gewohnheiten werden verknüpft statt kopiert; zu einer Quelle gibt es nur ein Ziel.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['steps', 'sheet'], default: 'steps' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Neues Ziel' },
  ],
  data: GOAL_SLOTS,
  events: ['goal.create', 'wizard.step', 'form.invalid'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalWizard', propMap: { style: 'style', title: 'title' }, events: { 'goal.create': 'onCreate', 'wizard.step': 'onStep' } },
  css: `${GL_CSS}
  .tk-gl-wz { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-gl-wz__prog { display:flex; gap:6px; align-items:center; } .tk-gl-wz__prog i { flex:1; height:4px; border-radius:2px; background:var(--tk-c-surface3); } .tk-gl-wz__prog i[data-on="true"] { background:var(--tk-c-accent); }
  .tk-gl-wz__q { margin:0; font-size:var(--tk-fs-xl); letter-spacing:var(--tk-ls-tight); line-height:var(--tk-lh-tight); } .tk-gl-wz__sec { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-gl-wz__opts { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap:var(--tk-space-2); }
  .tk-gl-wz__opt { all:unset; box-sizing:border-box; display:flex; gap:12px; align-items:center; padding:12px 14px; min-height:60px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; min-width:0; }
  .tk-gl-wz__opt:hover { border-color:var(--tk-c-border-strong); } .tk-gl-wz__opt:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-gl-wz__opt[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); } .tk-gl-wz__opt[aria-disabled="true"] { opacity:.55; cursor:not-allowed; }
  .tk-gl-wz__opt > span:last-child { display:flex; flex-direction:column; gap:2px; min-width:0; } .tk-gl-wz__opt b { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-gl-wz__opt small { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-gl-wz__ic { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--gc) 15%, transparent); color:var(--gc); }
  .tk-gl-wz__row { display:flex; gap:8px; flex-wrap:wrap; } .tk-gl-wz__nav { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; } .tk-gl-wz__sum { padding:12px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); display:flex; flex-direction:column; gap:4px; font-size:var(--tk-fs-sm); }
  .tk-gl-wz__sum b { font-size:var(--tk-fs-md); overflow-wrap:anywhere; } .tk-gl-wz__err { color:var(--tk-c-danger); font-size:var(--tk-fs-sm); } .bp-mobile .tk-gl-wz__nav .tk-btn { min-height:44px; }`,
  example: { data: EXAMPLE },
  render: function GoalWizard({ props, data, setData, ctx }) {
    const { views, raw, areas, today, src } = useViews(data, ctx);
    const opts = sourceOptions(src, raw);
    const [step, setStep] = useState(0);
    const [d, setD] = useState({ area: null, key: null, title: '', why: '', target: null, unit: '', dueMode: 'none', custom: '', focus: false });
    const [err, setErr] = useState(null);
    const sheet = props.style === 'sheet';
    const o = opts.find((x) => x.key === d.key) || null;
    const set = (patch) => { setErr(null); setD((x) => ({ ...x, ...patch })); };
    const focusCount = views.filter((v) => v.focus).length, full = focusCount >= FOCUS_MAX;
    const dueOf = () => ({ source: null, none: null, year: `${today.slice(0, 4)}-12-31`, m3: addMonthsIso(today, 3), m6: addMonthsIso(today, 6), y1: addMonthsIso(today, 12), custom: d.custom || null })[d.dueMode] ?? null;
    const dueLabel = () => (d.dueMode === 'source' ? (o?.due ? `wie das Sparziel: ${fmtDate(o.due)}` : 'ohne festes Datum') : d.dueMode === 'none' ? 'ohne festes Datum' : dueOf() ? fmtDate(dueOf()) : 'noch offen');
    const title = d.title || o?.title || '';
    const problem = (s) => {
      if (s === 0 && !d.area) return 'Wähle zuerst einen Bereich.';
      if (s === 1 && !o) return 'Wähle, woran du den Fortschritt siehst.';
      if (s === 1 && o.needsTarget && !(d.target > 0)) return 'Ohne Zielwert lässt sich kein Fortschritt zeigen.';
      if (s === 1 && o.needsUnit && !d.unit.trim()) return 'Wie nennst du die Einheit, z. B. „Bücher“?';
      if (s === 1 && !title.trim()) return 'Ohne Titel kannst du das Ziel nicht speichern.';
      if (s === 2 && d.dueMode === 'custom' && !d.custom) return 'Wähle ein Datum oder „Ohne Datum“.';
      return null;
    };
    const next = () => { const p = problem(step); if (p) { setErr(p); ctx.emit('form.invalid', { step }); return; } setErr(null); setStep(step + 1); ctx.emit('wizard.step', { step: step + 1 }); };
    const create = () => {
      for (let s = 0; s < 4; s++) { const p = problem(s); if (p) { setErr(p); setStep(s); ctx.emit('form.invalid', { step: s }); return; } }
      const id = ctx.newId('g');
      const g = buildGoal({ ...d, title, option: o, due: dueOf(), focus: d.focus && !full }, { id, today, src });
      setGoals(setData, (xs) => [...xs, g]); ctx.setUi('selectedId', id); ctx.emit('goal.create', { id }); ctx.toast(`Ziel „${g.title}“ angelegt`);
    };
    const s0 = html`<div class="tk-gl-wz__sec"><h3 class="tk-gl-wz__q">Wobei möchtest du vorankommen?</h3><div class="tk-gl-wz__opts" role="group" aria-label="Bereich">${areas.map((a) => html`<button type="button" class="tk-gl-wz__opt" style=${`--gc:${toneColor(a.tone)}`} aria-pressed=${d.area === a.id} onClick=${() => set({ area: a.id })}><span class="tk-gl-wz__ic"><${Icon} name=${a.icon} size=${18} /></span><span><b>${a.name}</b><small>${a.hint}</small></span></button>`)}</div></div>`;
    const list = opts.filter((x) => !d.area || x.area === d.area || x.type === 'manual');
    const s1 = html`<div class="tk-gl-wz__sec"><h3 class="tk-gl-wz__q">Woran siehst du den Fortschritt?</h3><span class="tk-gl-note">Was TAKT schon weiß, musst du nicht noch einmal eintragen.</span>
      <div class="tk-gl-wz__opts" role="group" aria-label="Quelle">${list.map((x) => html`<button type="button" class="tk-gl-wz__opt" aria-pressed=${d.key === x.key} aria-disabled=${x.used} onClick=${() => !x.used && set({ key: x.key, target: x.suggest || null, unit: x.unit || '', title: d.title || x.title, dueMode: x.type === 'savings' ? 'source' : d.dueMode === 'source' ? 'none' : d.dueMode })}><span class="tk-gl-wz__ic" style="--gc:var(--tk-c-accent)"><${Icon} name=${x.type === 'manual' ? 'pencil' : 'link-2'} size=${18} /></span><span><b>${x.label}</b><small>${x.used ? 'Dazu gibt es schon ein Ziel' : x.sub}</small></span></button>`)}</div>
      ${o && html`<div class="tk-gl-wz__sec"><${Field} label="Name des Ziels"><${Input} value=${title} placeholder="z. B. 12 Bücher 2026" onInput=${(v) => set({ title: v })} /><//>
        ${o.needsTarget && html`<div class="tk-gl-wz__row" style="align-items:flex-end"><${Field} label=${o.type === 'manual' ? 'Zielwert' : o.type === 'sales' ? 'Zielwert in € pro Monat' : 'Zielwert in Tagen'}><${NumberStepper} value=${d.target || 0} min=${0} max=${o.type === 'sales' ? 1000000 : 10000} step=${o.type === 'sales' ? 500 : o.type === 'habit' ? 10 : 1} label="Zielwert" onChange=${(v) => set({ target: v })} /><//>
          ${o.needsUnit && html`<${Field} label="Einheit"><${Input} value=${d.unit} placeholder="z. B. Bücher" onInput=${(v) => set({ unit: v })} /><//>`}</div>`}</div>`}</div>`;
    const DUES = [['source', 'Wie das Sparziel'], ['year', 'Ende des Jahres'], ['m3', 'In 3 Monaten'], ['m6', 'In 6 Monaten'], ['y1', 'In einem Jahr'], ['custom', 'Eigenes Datum'], ['none', 'Ohne Datum']].filter(([k]) => k !== 'source' || o?.type === 'savings');
    const s2 = html`<div class="tk-gl-wz__sec"><h3 class="tk-gl-wz__q">Bis wann?</h3><div class="tk-gl-wz__row" role="group" aria-label="Zieldatum">${DUES.map(([k, l]) => html`<${Chip} active=${d.dueMode === k} onClick=${() => set({ dueMode: k })}>${l}<//>`)}</div>
      ${d.dueMode === 'custom' && html`<${Field} label="Datum"><${Input} type="date" value=${d.custom} min=${addDaysIso(today, 1)} onInput=${(v) => set({ custom: v })} /><//>`}<span class="tk-gl-note">Ein Datum ist ein Anhaltspunkt, kein Druck. Du kannst es später ändern.</span></div>`;
    const s3 = html`<div class="tk-gl-wz__sec"><h3 class="tk-gl-wz__q">Soll es diese Woche im Fokus stehen?</h3>
      <div class="tk-gl-wz__row" style="align-items:center"><${Switch} checked=${d.focus && !full} onChange=${() => !full && set({ focus: !d.focus })} label="Im Wochenfokus" /><span>Im Wochenfokus (${focusCount} von ${FOCUS_MAX} belegt)</span></div>
      ${full && html`<span class="tk-gl-note">Der Wochenfokus ist voll. Drei Ziele sind genug für eine Woche; tausche später unter „Wochenfokus“.</span>`}
      <${Field} label="Warum ist dir das wichtig? (optional)"><${Input} value=${d.why} placeholder="ein Satz für dich" onInput=${(v) => set({ why: v })} /><//>
      <div class="tk-gl-wz__sum"><span>Dein Ziel</span><b>${title || 'ohne Namen'}</b><span>${o ? o.label : '–'} · ${dueLabel()}</span></div></div>`;
    const secs = [s0, s1, s2, s3];
    const errEl = err && html`<div class="tk-gl-wz__err" role="alert">${err}</div>`;
    if (sheet) return html`<${Card} title=${props.title}><div class="tk-gl-wz">${secs.map((s) => html`<div>${s}</div>`)}${errEl}<div class="tk-gl-wz__nav"><span></span><${Button} variant="primary" icon="check" onClick=${create}>Ziel anlegen<//></div></div><//>`;
    return html`<${Card} title=${props.title}><div class="tk-gl-wz"><div class="tk-gl-wz__prog" aria-label=${`Schritt ${step + 1} von 4: ${STEPS[step]}`}>${STEPS.map((s, i) => html`<i data-on=${i <= step}></i>`)}</div>
      ${secs[step]}${errEl}<div class="tk-gl-wz__nav">${step > 0 ? html`<${Button} variant="ghost" icon="chevron-left" onClick=${() => { setErr(null); setStep(step - 1); }}>Zurück<//>` : html`<span></span>`}
        ${step < 3 ? html`<${Button} variant="primary" iconRight="chevron-right" onClick=${next}>Weiter<//>` : html`<${Button} variant="primary" icon="check" onClick=${create}>Ziel anlegen<//>`}</div></div><//>`;
  },
};
export default goalWizard;
