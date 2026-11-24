// Gewohnheiten: Routinen als Abfolge – Liste, Zeitstrahl oder geführt (ein Schritt nach dem anderen). Schritte hängen an Gewohnheiten.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Check, EmptyState, Icon, Badge } from '../../ui.js';
import { list, todayKey, isDone, setCount, target, HABIT_CSS, Ring } from './_habits.js';

const clock = (t, add) => { const [h, m] = String(t || '07:00').split(':').map(Number); const x = h * 60 + m + add; return `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const sample = { routines: [{ id: 'r1', name: 'Morgenroutine', icon: 'sunrise', time: '06:45', steps: [{ id: 's1', title: 'Glas Wasser', minutes: 2, habitId: 'a' }, { id: 's2', title: 'Dehnen', minutes: 10, habitId: 'b' }, { id: 's3', title: 'Tag planen', minutes: 10 }], log: { '2026-11-24': ['s3'] } }],
  habits: [{ id: 'a', name: 'Wasser trinken', icon: 'droplet', tone: 3, rhythm: { type: 'daily' }, since: '2026-09-01', log: { '2026-11-24': 1 } }, { id: 'b', name: 'Dehnen', icon: 'activity', tone: 2, rhythm: { type: 'daily' }, since: '2026-09-01', log: {} }] };

export const routineFlow = {
  id: 'routine-flow',
  name: 'Routine-Abfolge',
  category: 'Gewohnheiten',
  description: 'Morgen- und Abendroutine als Folge von Schritten mit Uhrzeit und Dauer. Schritte können an Gewohnheiten hängen (Haken zählt dort mit). Stile: Liste, Zeitstrahl, geführt (ein Schritt nach dem anderen).',
  version: '1.1',
  props: [
    { name: 'style', label: 'Stil', type: 'select', options: ['list', 'timeline', 'guided'], default: 'list' },
    { name: 'routineId', label: 'Nur Routine (ID, leer = alle)', type: 'text', default: '' },
    { name: 'compact', label: 'Kompakt (nur Fortschritt)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'routines', label: 'Routinen', default: 'routines', shape: '{id,name,icon,time,steps:[{id,title,minutes,habitId?}],log:{}}[]', required: true },
    { slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: false },
  ],
  events: ['routine.step', 'routine.start', 'routine.complete', 'routine.open', 'habit.open'],
  states: ['empty'],
  css: `${HABIT_CSS}
  .tk-rf { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-rf__head { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid var(--tk-c-border); } .tk-rf__head > div { flex:1; min-width:0; } .tk-rf__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-rf__ic { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); flex:none; }
  .tk-rf__step { display:flex; align-items:center; gap:12px; padding:8px 16px; min-height:56px; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-rf__step:last-child { border-bottom:0; } .tk-rf__step[data-done="true"] .tk-rf__t { color:var(--tk-c-text-muted); text-decoration:line-through; text-decoration-color:var(--tk-c-text-subtle); }
  .tk-rf__step[data-now="true"] { background:var(--tk-c-accent-soft); } .tk-rf__no { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; flex:none; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); background:var(--tk-c-surface3); color:var(--tk-c-text-muted); }
  .tk-rf__t { flex:1; min-width:0; font-weight:var(--tk-fw-medium); } .tk-rf__m { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .tk-rf__tl { position:relative; padding:14px 16px 8px 16px; } .tk-rf__node { display:grid; grid-template-columns:48px 28px 1fr; gap:10px; position:relative; min-height:64px; } .tk-rf__node:not(:last-child) .tk-rf__dot::after { content:''; position:absolute; left:13px; top:30px; bottom:-34px; width:2px; background:var(--tk-c-border-strong); }
  .tk-rf__time { font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; color:var(--tk-c-text-muted); padding-top:5px; text-align:right; } .tk-rf__dot { position:relative; } .tk-rf__dot button { width:28px; height:28px; border-radius:50%; border:2px solid var(--tk-c-border-strong); background:var(--tk-c-surface); color:var(--tk-c-text-on-accent); display:grid; place-items:center; cursor:pointer; padding:0; position:relative; z-index:1; }
  .tk-rf__node[data-done="true"] .tk-rf__dot button { background:var(--tk-c-success); border-color:var(--tk-c-success); } .tk-rf__node[data-now="true"] .tk-rf__dot button { border-color:var(--tk-c-accent); box-shadow:0 0 0 4px var(--tk-c-accent-soft); }
  .tk-rf__card { padding:6px 0 16px; min-width:0; } .tk-rf__card b { display:block; font-weight:var(--tk-fw-medium); } .tk-rf__node[data-done="true"] .tk-rf__card b { color:var(--tk-c-text-muted); text-decoration:line-through; } .tk-rf__card span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); }
  .tk-rf__guide { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; padding:28px 20px 22px; } .tk-rf__guide h3 { font-size:var(--tk-fs-2xl); letter-spacing:var(--tk-ls-tight); margin:0; } .tk-rf__pips { display:flex; gap:6px; } .tk-rf__pips i { width:22px; height:5px; border-radius:3px; background:var(--tk-c-surface3); } .tk-rf__pips i[data-on="true"] { background:var(--tk-c-success); } .tk-rf__pips i[data-now="true"] { background:var(--tk-c-accent); }
  .tk-rf__acts { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; } .tk-rf__acts .tk-btn--primary { min-width:200px; }
  .bp-mobile .tk-rf__node { grid-template-columns:42px 34px 1fr; } .bp-mobile .tk-rf__dot button { width:34px; height:34px; } .bp-mobile .tk-rf__node:not(:last-child) .tk-rf__dot::after { left:16px; top:34px; bottom:-30px; } .bp-mobile .tk-rf__time { padding-top:8px; } .bp-mobile .tk-rf__step { min-height:60px; padding:8px 12px; } .bp-mobile .tk-rf__guide h3 { font-size:var(--tk-fs-xl); }
  [data-tk-large-text] .tk-rf__head { flex-wrap:wrap; row-gap:8px; } [data-tk-large-text] .tk-rf__head > div { flex:1 1 8em; }
  [data-tk-large-text] .tk-rf__step { flex-wrap:wrap; row-gap:0; column-gap:10px; } [data-tk-large-text] .tk-rf__no { width:1.9em; height:1.9em; }
  [data-tk-large-text] .tk-rf__t { flex:1 1 8em; } [data-tk-large-text] .tk-rf__m { flex:1 0 100%; white-space:normal; padding-left:calc(2.9em + 44px); }
  [data-tk-large-text] .tk-rf__node, .bp-mobile[data-tk-large-text] .tk-rf__node { grid-template-columns:auto 34px minmax(0,1fr); } [data-tk-large-text] .tk-rf__time { text-align:left; }
  [data-tk-large-text] .tk-rf__acts .tk-btn--primary { min-width:0; }`,
  example: { data: sample },
  render: function RoutineFlow({ props, data, setData, ctx }) {
    const routines = (Array.isArray(data.routines) ? data.routines : []).filter((r) => !props.routineId || r.id === props.routineId), habits = list(data.habits), today = todayKey(ctx);
    const [cur, setCur] = useState(null);
    if (!routines.length) return html`<${Card} title="Routinen"><${EmptyState} icon="repeat-2" title="Noch keine Routine" text="Bündle Gewohnheiten zu einer Morgen- oder Abendroutine – Schritt für Schritt." /><//>`;
    const stepDone = (r, st) => (st.habitId ? (() => { const h = habits.find((x) => x.id === st.habitId); return h ? isDone(h, today) : false; })() : (r.log?.[today] || []).includes(st.id));
    const toggle = (r, st) => {
      const was = stepDone(r, st);
      if (st.habitId) { const h = habits.find((x) => x.id === st.habitId); if (h) setCount(setData, h.id, today, was ? 0 : target(h)); }
      else setData('routines', (all) => all.map((x) => (x.id !== r.id ? x : { ...x, log: { ...(x.log || {}), [today]: was ? (x.log?.[today] || []).filter((i) => i !== st.id) : [...(x.log?.[today] || []), st.id] } })));
      ctx.emit('routine.step', { id: r.id, step: st.id, done: !was });
      if (!was && r.steps.every((s) => s.id === st.id || stepDone(r, s))) { ctx.emit('routine.complete', { id: r.id }); ctx.toast(`${r.name} geschafft – guter Start`); }
    };
    const total = (r) => r.steps.reduce((a, s) => a + (s.minutes || 0), 0);
    const clockAt = (r, i) => clock(r.time, r.steps.slice(0, i).reduce((a, s) => a + (s.minutes || 0), 0));
    const card = (r) => {
      const dn = r.steps.filter((s) => stepDone(r, s)).length, first = r.steps.findIndex((s) => !stepDone(r, s)), complete = dn === r.steps.length;
      const headIn = html`<span class="tk-rf__ic"><${Icon} name=${r.icon || 'repeat-2'} size=${19} /></span><div><div class="tk-card__title">${r.name}</div><div class="tk-rf__sub">ab ${r.time} Uhr · ca. ${total(r)} Min. · ${dn} von ${r.steps.length} erledigt</div></div>
        ${complete ? html`<${Badge} tone="success" icon="check">Geschafft<//>` : html`<${Ring} value=${dn / r.steps.length} size=${40} stroke=${4} color="var(--tk-c-success)" label=${`${dn} von ${r.steps.length}`}>${dn}<//>`}`;
      const head = html`<div class="tk-rf__head">${headIn}</div>`;
      if (props.compact) return html`<${Card} flush><button type="button" class="tk-rf__head" style="width:100%;border:0;border-bottom:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer" onClick=${() => ctx.emit('routine.open', { id: r.id })}>${headIn}<${Icon} name="chevron-right" size=${16} /></button><//>`;
      if (props.style === 'timeline') return html`<${Card} flush>${head}<div class="tk-rf__tl">${r.steps.map((st, i) => { const d = stepDone(r, st);
        return html`<div class="tk-rf__node" data-done=${d} data-now=${i === first}><span class="tk-rf__time">${clockAt(r, i)}</span><span class="tk-rf__dot"><button type="button" role="checkbox" aria-checked=${d} aria-label=${`${st.title} ${d ? 'zurücknehmen' : 'erledigt'}`} onClick=${() => toggle(r, st)}>${d && html`<${Icon} name="check" size=${14} stroke=${3} />`}</button></span>
          <div class="tk-rf__card"><b>${st.title}</b><span>${st.minutes} Min.${i === first ? ' · jetzt dran' : ''}</span></div></div>`; })}</div><//>`;
      if (props.style === 'guided') {
        const idx = cur != null && cur >= 0 && cur < r.steps.length ? cur : first;
        if (complete || idx < 0) return html`<${Card} flush>${head}<div class="tk-rf__guide"><${Ring} value=${1} size=${84} stroke=${7} color="var(--tk-c-success)"><${Icon} name="check" size=${32} /><//><h3>${r.name} geschafft</h3><div class="tk-rf__sub">Alle ${r.steps.length} Schritte erledigt – ein guter Start in den Tag.</div>
          <div class="tk-rf__acts"><${Button} variant="primary" iconRight="chevron-right" onClick=${() => ctx.emit('routine.open', { id: r.id })}>Weiter<//><${Button} variant="ghost" icon="rotate-ccw" onClick=${() => setCur(0)}>Noch einmal ansehen<//></div></div><//>`;
        const st = r.steps[idx], d = stepDone(r, st);
        return html`<${Card} flush>${head}<div class="tk-rf__guide"><div class="tk-rf__pips" aria-label=${`Schritt ${idx + 1} von ${r.steps.length}`}>${r.steps.map((s, i) => html`<i data-on=${stepDone(r, s)} data-now=${i === idx}></i>`)}</div>
          <span class="tk-rf__ic" style="width:64px;height:64px;border-radius:20px"><${Icon} name=${st.icon || (st.habitId && habits.find((x) => x.id === st.habitId)?.icon) || 'circle-dot'} size=${30} /></span>
          <div><div class="tk-label">Schritt ${idx + 1} von ${r.steps.length} · ${clockAt(r, idx)}</div><h3>${st.title}</h3><div class="tk-rf__sub">${st.minutes} Minuten${st.habitId ? ' · zählt als Gewohnheit' : ''}</div></div>
          <div class="tk-rf__acts"><${Button} variant="primary" icon=${d ? 'rotate-ccw' : 'check'} onClick=${() => { toggle(r, st); if (!d) setCur(Math.min(idx + 1, r.steps.length)); }}>${d ? 'Zurücknehmen' : 'Erledigt – weiter'}<//>
            <${Button} variant="ghost" onClick=${() => { ctx.emit('routine.start', { id: r.id, skip: st.id }); setCur((idx + 1) % r.steps.length); }}>Überspringen<//></div></div><//>`;
      }
      return html`<${Card} flush>${head}${r.steps.map((st, i) => { const d = stepDone(r, st); return html`<div class="tk-rf__step" data-done=${d} data-now=${i === first}>
        <${Check} checked=${d} onChange=${() => toggle(r, st)} label=${`${st.title} ${d ? 'zurücknehmen' : 'erledigt'}`} /><span class="tk-rf__no" aria-hidden="true">${i + 1}</span><span class="tk-rf__t tk-truncate">${st.title}</span>${st.habitId && ctx.bp !== 'mobile' && html`<${Badge} icon="link-2">Gewohnheit<//>`}<span class="tk-rf__m">${clockAt(r, i)} · ${st.minutes} Min.</span></div>`; })}<//>`;
    };
    return html`<div class="tk-rf">${routines.map(card)}</div>`;
  },
};
export default routineFlow;
