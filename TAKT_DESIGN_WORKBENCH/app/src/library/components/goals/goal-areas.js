// Ziele: alle Ziele nach Lebensbereich gruppiert – dichte Liste oder Bereichskacheln mit Ring.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, Ring } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, useViews, openGoal, toggleFocusUi, FocusBtn, StateBadge, SourceChip, PlanBar, valueLine, dueLine, bigValue, toneColor } from './_goals.js';
import { groupByArea, isOk } from './_calc.js';
import { EXAMPLE } from './_example.js';

export const goalAreas = {
  id: 'goal-areas',
  name: 'Ziele nach Bereich',
  category: 'Ziele',
  description: 'Wenige, wichtige Ziele nach Lebensbereich (Gesundheit, Finanzen, Business, Persönlich). Liste (dicht, Quelle und Wochenfokus in der Zeile) oder Kacheln (ein Ring je Bereich). Fortschritt kommt aus den Fachmodulen, nichts wird doppelt erfasst.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Meine Ziele' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'tiles'], default: 'list' },
    { name: 'showSource', label: 'Quelle zeigen', type: 'boolean', default: true },
    { name: 'showFocus', label: 'Wochenfokus schaltbar', type: 'boolean', default: true },
  ],
  data: GOAL_SLOTS,
  events: ['goal.open', 'source.open', 'focus.toggle', 'focus.blocked', 'goal.create.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalAreas', propMap: { title: 'title', style: 'style', showSource: 'showSource', showFocus: 'showFocus' }, events: { 'goal.open': 'onOpenGoal', 'source.open': 'onOpenSource', 'focus.toggle': 'onToggleFocus' } },
  css: `${GL_CSS}
  .tk-gl-ar__grp { display:flex; align-items:center; gap:8px; padding:10px 16px 8px; background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); border-top:1px solid var(--tk-c-border); }
  .tk-gl-ar__grp:first-child { border-top:0; } .tk-gl-ar__grp .tk-gl-area { flex:1; } .tk-gl-ar__cnt { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-gl-ar__row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:10px 8px 10px 16px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-gl-ar__row:last-child { border-bottom:0; } .tk-gl-ar__src { flex-basis:100%; margin:-2px 0 0; padding-right:8px; display:flex; } .tk-gl-ar__main { all:unset; box-sizing:border-box; flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; cursor:pointer; padding:2px 0; min-height:44px; justify-content:center; }
  .tk-gl-ar__main:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:var(--tk-radius-sm); }
  .tk-gl-ar__top { display:flex; align-items:baseline; gap:10px; min-width:0; flex-wrap:wrap; } .tk-gl-ar__t { font-weight:var(--tk-fw-medium); min-width:0; overflow-wrap:anywhere; flex:1 1 180px; }
  .tk-gl-ar__v { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-gl-ar__meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-gl-ar__tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 250px), 1fr)); gap:var(--tk-space-3); }
  .tk-gl-ar__tile { display:flex; flex-direction:column; gap:12px; padding:16px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; }
  .tk-gl-ar__th { display:flex; align-items:center; gap:14px; } .tk-gl-ar__th b { display:block; font-size:var(--tk-fs-lg); letter-spacing:var(--tk-ls-tight); } .tk-gl-ar__th span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-gl-ar__mini { all:unset; box-sizing:border-box; display:flex; justify-content:space-between; gap:10px; align-items:center; min-height:44px; padding:0 4px; border-top:1px solid var(--tk-c-border); cursor:pointer; font-size:var(--tk-fs-sm); min-width:0; width:100%; }
  .tk-gl-ar__mini:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-gl-ar__mini span:first-child { min-width:0; overflow-wrap:anywhere; } .tk-gl-ar__mini span:last-child { color:var(--tk-c-text-muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .bp-mobile .tk-gl-ar__row { padding-left:12px; } [data-tk-large-text] .tk-gl-ar__t { flex-basis:100%; }`,
  example: { data: EXAMPLE },
  render: function GoalAreas({ props, data, setData, ctx }) {
    const { views, raw, areas } = useViews(data, ctx);
    const create = html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create.open')}>Erstes Ziel anlegen<//>`;
    if (!views.length) return html`<${Card} title=${props.title}><${EmptyState} icon="target" title="Noch keine Ziele" text="Wähle wenige, wichtige Ziele. Fortschritt kommt automatisch aus Fitness, Sparplänen oder Sales." action=${create} /><//>`;
    const groups = groupByArea(views, areas);
    const tog = (v) => toggleFocusUi(ctx, setData, raw, v.id);
    if (props.style === 'tiles') {
      return html`<div class="tk-gl-ar__tiles">${groups.map(({ area, items }) => { const avg = items.reduce((s, v) => s + v.progress, 0) / items.length; const ok = items.filter(isOk).length;
        return html`<section class="tk-gl-ar__tile" aria-label=${area.name}><div class="tk-gl-ar__th"><${Ring} value=${avg} size=${64} stroke=${7} tone=${area.tone} label=${`${area.name}: ${Math.round(avg * 100)} % im Schnitt`}><${Icon} name=${area.icon} size=${22} /><//>
          <div><b>${area.name}</b><span>${ok} von ${items.length} im Plan</span></div></div>
          <div>${items.map((v) => html`<button type="button" class="tk-gl-ar__mini" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}, ${v.stateLabel}. Öffnen`}><span>${v.title}</span><span>${bigValue(ctx, v)}</span></button>`)}</div></section>`; })}</div>`;
    }
    return html`<${Card} flush title=${props.title}>${groups.map(({ area, items }) => html`<div><div class="tk-gl-ar__grp"><span class="tk-gl-area" style=${`--gc:${toneColor(area.tone)}`}><${Icon} name=${area.icon} size=${14} />${area.name}</span><span class="tk-gl-ar__cnt">${items.filter(isOk).length} von ${items.length} im Plan</span></div>
      ${items.map((v) => html`<div class="tk-gl-ar__row"><button type="button" class="tk-gl-ar__main" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}: ${valueLine(ctx, v)}, ${v.stateLabel}. Öffnen`}>
        <span class="tk-gl-ar__top"><span class="tk-gl-ar__t">${v.title}</span><span class="tk-gl-ar__v tk-gl-num">${valueLine(ctx, v)}</span></span>
        <${PlanBar} v=${v} /><span class="tk-gl-ar__meta"><${StateBadge} v=${v} /><span>${dueLine(v)}</span></span></button>
        <div class="tk-col" style="align-items:flex-end;gap:2px">${props.showFocus && html`<${FocusBtn} v=${v} onToggle=${tog} />`}</div>${props.showSource && html`<div class="tk-gl-ar__src"><${SourceChip} v=${v} ctx=${ctx} /></div>`}</div>`)}</div>`)}
<//>`;
  },
};
export default goalAreas;
