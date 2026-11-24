// Ziele: Karten mit Fortschrittsring, Quelle und Zustand – eine Botschaft pro Karte.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, Ring } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, useViews, openGoal, toggleFocusUi, FocusBtn, StateBadge, SourceChip, valueLine, dueLine, forecastLine, AreaTag, toneColor } from './_goals.js';
import { EXAMPLE } from './_example.js';

export const goalCards = {
  id: 'goal-cards',
  name: 'Zielkarten',
  category: 'Ziele',
  description: 'Jedes Ziel als Karte: Ring mit Fortschritt, Titel, Stand, Zustand in Worten (nie Alarmfarbe) und Quelle mit Link in das Fachmodul. Optional nach Bereich gruppiert. Der Stern setzt das Ziel in den Wochenfokus (höchstens 3).',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Alle Ziele' },
    { name: 'groupByArea', label: 'Nach Bereich gruppieren', type: 'boolean', default: true },
    { name: 'showForecast', label: 'Prognose-Satz', type: 'boolean', default: false },
    { name: 'limit', label: 'Max. Karten (0 = alle)', type: 'number', default: 0 },
  ],
  data: GOAL_SLOTS,
  events: ['goal.open', 'source.open', 'focus.toggle', 'focus.blocked', 'goal.create.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalCards', propMap: { title: 'title', groupByArea: 'groupByArea', showForecast: 'showForecast', limit: 'limit' }, events: { 'goal.open': 'onOpenGoal', 'source.open': 'onOpenSource', 'focus.toggle': 'onToggleFocus' } },
  css: `${GL_CSS}
  .tk-gl-cd__grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, max(280px, calc((100% - 2 * var(--tk-space-3)) / 3))), 1fr)); gap:var(--tk-space-3); }
  .tk-gl-cd__wrap { display:flex; flex-direction:column; gap:var(--tk-space-6); } .tk-gl-cd__h { display:flex; align-items:center; gap:8px; margin:0 0 var(--tk-space-2); }
  .tk-gl-cd { display:flex; flex-direction:column; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; overflow:hidden; }
  .tk-gl-cd[data-state="done"] { border-color:color-mix(in srgb, var(--tk-c-success) 45%, var(--tk-c-border)); }
  .tk-gl-cd__open { all:unset; box-sizing:border-box; display:flex; gap:14px; align-items:center; padding:16px 12px 12px 16px; cursor:pointer; min-width:0; }
  .tk-gl-cd__open:hover { background:var(--tk-c-surface2); } .tk-gl-cd__open:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-gl-cd__b { display:flex; flex-direction:column; gap:5px; min-width:0; flex:1; } .tk-gl-cd__t { font-size:var(--tk-fs-md); font-weight:var(--tk-fw-semibold); line-height:var(--tk-lh-snug); overflow-wrap:anywhere; }
  .tk-gl-cd__pct { font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; font-size:var(--tk-fs-md); }
  .tk-gl-cd__f { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 6px 10px 16px; flex-wrap:wrap; min-width:0; }
  .tk-gl-cd__fc { padding:0 16px 12px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .bp-mobile .tk-gl-cd__grid { grid-template-columns:1fr; } [data-tk-large-text] .tk-gl-cd__open { flex-direction:column; align-items:flex-start; } .tk-gl-cd__b { overflow-wrap:anywhere; }`,
  example: { data: EXAMPLE },
  render: function GoalCards({ props, data, setData, ctx }) {
    const { views, raw, areas } = useViews(data, ctx);
    if (!views.length) return html`<${Card} title=${props.title}><${EmptyState} icon="target" title="Noch keine Ziele" text="Ein Ziel mit Quelle zeigt seinen Fortschritt automatisch." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create.open')}>Erstes Ziel anlegen<//>`} /><//>`;
    const shown = props.limit > 0 ? views.slice(0, props.limit) : views;
    const tog = (v) => toggleFocusUi(ctx, setData, raw, v.id);
    const card = (v) => html`<article class="tk-gl-cd" data-state=${v.state}>
      <button type="button" class="tk-gl-cd__open" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}: ${valueLine(ctx, v)}, ${v.stateLabel}. Öffnen`}>
        <${Ring} value=${v.progress} size=${68} stroke=${7} tone=${v.areaTone} label=${`${Math.round(v.progress * 100)} % erreicht`}><span class="tk-gl-cd__pct">${Math.round(v.progress * 100)}%</span><//>
        <span class="tk-gl-cd__b"><${AreaTag} v=${v} /><span class="tk-gl-cd__t">${v.title}</span><span class="tk-gl-note tk-gl-num">${valueLine(ctx, v)}</span><span><${StateBadge} v=${v} /></span></span></button>
      ${props.showForecast && html`<div class="tk-gl-cd__fc">${forecastLine(ctx, v)}</div>`}
      <div class="tk-gl-cd__f"><${SourceChip} v=${v} ctx=${ctx} /><span style="display:flex;align-items:center;gap:2px"><span class="tk-gl-note">${dueLine(v)}</span><${FocusBtn} v=${v} onToggle=${tog} /></span></div></article>`;
    if (!props.groupByArea) return html`<${Card} title=${props.title}><div class="tk-gl-cd__grid">${shown.map(card)}</div><//>`;
    return html`<div class="tk-gl-cd__wrap">${areas.map((a) => { const items = shown.filter((v) => v.area === a.id); if (!items.length) return null;
      return html`<section aria-label=${a.name}><div class="tk-gl-cd__h"><span class="tk-gl-area" style=${`--gc:${toneColor(a.tone)}`}><${Icon} name=${a.icon} size=${14} />${a.name}</span></div><div class="tk-gl-cd__grid">${items.map(card)}</div></section>`; })}</div>`;
  },
};
export default goalCards;
