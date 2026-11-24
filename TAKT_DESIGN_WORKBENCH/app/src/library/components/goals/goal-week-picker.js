// Ziele: Wochenfokus wählen – höchstens drei, bei mehr mit Begründung und Tausch statt stiller Ablehnung.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Switch } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, setGoals, useViews, StateBadge, valueLine, AreaTag, toneColor } from './_goals.js';
import { FOCUS_MAX, toggleFocus, swapFocus } from './_calc.js';
import { EXAMPLE } from './_example.js';

export const goalWeekPicker = {
  id: 'goal-week-picker',
  name: 'Wochenfokus wählen',
  category: 'Ziele',
  description: `Wähle höchstens ${FOCUS_MAX} Ziele für diese Woche. Ein viertes Ziel wird nicht still verworfen: TAKT erklärt, warum, und bietet an, es gegen eines der drei zu tauschen. Liste mit Schaltern oder drei Plätze.`,
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenfokus' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'slots'], default: 'list' },
    { name: 'doneLabel', label: 'Abschluss-Button', type: 'text', default: 'Fertig' },
  ],
  data: GOAL_SLOTS,
  events: ['focus.toggle', 'focus.blocked', 'focus.swap', 'week.save', 'goal.create.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalWeekPicker', propMap: { title: 'title', style: 'style', doneLabel: 'doneLabel' }, events: { 'focus.toggle': 'onToggle', 'focus.swap': 'onSwap', 'week.save': 'onSave' } },
  css: `${GL_CSS}
  .tk-gl-wk { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-gl-wk__meter { display:flex; align-items:center; gap:10px; flex-wrap:wrap; } .tk-gl-wk__dots { display:flex; gap:6px; } .tk-gl-wk__dots i { width:14px; height:14px; border-radius:50%; border:2px solid var(--tk-c-border-strong); } .tk-gl-wk__dots i[data-on="true"] { background:var(--tk-c-accent2); border-color:var(--tk-c-accent2); }
  .tk-gl-wk__row { display:flex; align-items:center; gap:12px; padding:10px 14px; min-height:64px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; } .tk-gl-wk__row[data-on="true"] { border-color:color-mix(in srgb, var(--tk-c-accent2) 55%, var(--tk-c-border)); background:color-mix(in srgb, var(--tk-c-accent2) 7%, var(--tk-c-surface)); }
  .tk-gl-wk__b { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; } .tk-gl-wk__b b { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; }
  [data-tk-large-text] .tk-gl-wk__row { flex-wrap:wrap; row-gap:6px; } [data-tk-large-text] .tk-gl-wk__b { flex:1 1 100%; } [data-tk-large-text] .tk-gl-wk__row > :last-child { margin-left:auto; }
  .tk-gl-wk__why { padding:12px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-info-soft); border:1px solid color-mix(in srgb, var(--tk-c-info) 35%, var(--tk-c-border)); font-size:var(--tk-fs-sm); display:flex; flex-direction:column; gap:8px; }
  .tk-gl-wk__sw { display:flex; flex-wrap:wrap; gap:8px; }
  .tk-gl-wk__slots { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap:var(--tk-space-3); }
  .tk-gl-wk__slot { display:flex; flex-direction:column; gap:8px; padding:14px; min-height:112px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; } .tk-gl-wk__slot[data-empty="true"] { border-style:dashed; justify-content:center; align-items:center; color:var(--tk-c-text-subtle); text-align:center; }
  .tk-gl-wk__slot b { overflow-wrap:anywhere; } .tk-gl-wk__foot { display:flex; justify-content:flex-end; }`,
  example: { data: EXAMPLE },
  render: function GoalWeekPicker({ props, data, setData, ctx }) {
    const { views, raw } = useViews(data, ctx);
    const [blocked, setBlocked] = useState(null);
    if (!views.length) return html`<${Card} title=${props.title}><${EmptyState} icon="star" title="Noch keine Ziele" text="Lege zuerst ein Ziel an, dann wählst du hier deinen Wochenfokus." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create.open')}>Erstes Ziel anlegen<//>`} /><//>`;
    const on = views.filter((v) => v.focus);
    const toggle = (v) => {
      const r = toggleFocus(raw, v.id);
      if (r.blocked) { setBlocked({ id: v.id, reason: r.blocked.reason, focused: r.blocked.focused }); ctx.emit('focus.blocked', { id: v.id }); return; }
      setBlocked(null); setGoals(setData, () => r.goals); ctx.emit('focus.toggle', { id: v.id, focus: !v.focus });
    };
    const swap = (outId) => { setGoals(setData, (xs) => swapFocus(xs, outId, blocked.id)); ctx.emit('focus.swap', { out: outId, in: blocked.id }); ctx.toast('Getauscht'); setBlocked(null); };
    const target = blocked && views.find((v) => v.id === blocked.id);
    const why = blocked && html`<div class="tk-gl-wk__why" role="status"><div><strong>„${target?.title}“ passt nur, wenn ein Ziel Platz macht.</strong> Höchstens ${FOCUS_MAX} Ziele zählen pro Woche, so bleibt jedes greifbar. Welches soll weichen?</div>
      <div class="tk-gl-wk__sw">${blocked.focused.map((id) => html`<${Button} size="sm" onClick=${() => swap(id)}>Statt „${views.find((v) => v.id === id)?.title}“<//>`)}<${Button} size="sm" variant="ghost" onClick=${() => setBlocked(null)}>Behalten wie es ist<//></div></div>`;
    const meter = html`<div class="tk-gl-wk__meter"><span class="tk-gl-wk__dots" aria-hidden="true">${Array.from({ length: FOCUS_MAX }, (_, i) => html`<i data-on=${i < on.length}></i>`)}</span><strong>${on.length} von ${FOCUS_MAX} Plätzen belegt</strong></div>`;
    const done = html`<div class="tk-gl-wk__foot"><${Button} variant="primary" icon="check" onClick=${() => { ctx.emit('week.save', { ids: on.map((v) => v.id) }); ctx.toast(on.length ? `Wochenfokus gespeichert: ${on.length} ${on.length === 1 ? 'Ziel' : 'Ziele'}` : 'Wochenfokus gespeichert: diese Woche ohne Fokus'); }}>${props.doneLabel}<//></div>`;
    if (props.style === 'slots') {
      const slots = Array.from({ length: FOCUS_MAX }, (_, i) => on[i] || null); const rest = views.filter((v) => !v.focus);
      return html`<div class="tk-gl-wk">${meter}<div class="tk-gl-wk__slots">${slots.map((v, i) => v ? html`<div class="tk-gl-wk__slot" style=${`border-top:3px solid ${toneColor(v.areaTone)}`}><${AreaTag} v=${v} /><b>${v.title}</b><span class="tk-gl-note tk-gl-num">${valueLine(ctx, v)}</span><${Button} size="sm" variant="ghost" icon="x" onClick=${() => toggle(v)} aria-label=${`${v.title} aus dem Fokus nehmen`}>Herausnehmen<//></div>`
        : html`<div class="tk-gl-wk__slot" data-empty="true"><${Icon} name="plus" size=${20} /><span>Platz ${i + 1} ist frei</span></div>`)}</div>${why}
        <div role="group" aria-label="Weitere Ziele" class="tk-gl-wk"><strong style="font-size:var(--tk-fs-sm)">Weitere Ziele</strong>${rest.map((v) => html`<div class="tk-gl-wk__row"><span class="tk-gl-wk__b"><b>${v.title}</b><span class="tk-gl-note">${v.areaName} · ${v.stateLabel}</span></span><${Button} size="sm" icon="plus" onClick=${() => toggle(v)} aria-label=${`${v.title} in den Fokus`}>In den Fokus<//></div>`)}</div>${done}</div>`;
    }
    return html`<div class="tk-gl-wk">${meter}${why}<div role="group" aria-label="Ziele" class="tk-gl-wk">${views.map((v) => html`<div class="tk-gl-wk__row" data-on=${!!v.focus}><span class="tk-gl-wk__b"><${AreaTag} v=${v} /><b>${v.title}</b><span class="tk-gl-note tk-gl-num">${valueLine(ctx, v)}</span></span><${StateBadge} v=${v} /><${Switch} checked=${!!v.focus} onChange=${() => toggle(v)} label=${`${v.title} im Wochenfokus`} /></div>`)}</div>${done}</div>`;
  },
};
export default goalWeekPicker;
