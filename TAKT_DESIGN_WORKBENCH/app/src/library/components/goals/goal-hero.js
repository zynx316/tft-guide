// Ziele: Kopf des Ziel-Details – Warum, Stand mit Ring, Zustand in Worten, Frist und Prognose-Satz.
import { html } from '../../../lib/html.js';
import { Card, Button, Chip, Icon, EmptyState, Ring } from '../../ui.js';
import { pushUndo } from '../crosscut/_crosscut.js';
import { GOAL_SLOTS, GL_CSS, useViews, patchGoal, StateBadge, PlanBar, SourceChip, AreaTag, valueLine, dueLine, forecastLine, toneColor } from './_goals.js';
import { EXAMPLE } from './_example.js';

/** Gewähltes Ziel: ctx.ui.selectedId, sonst das erste im Wochenfokus, sonst das erste. */
export const pickGoal = (views, ctx) => views.find((v) => v.id === ctx.ui.selectedId) || views.find((v) => v.focus) || views[0] || null;

export const goalHero = {
  id: 'goal-hero',
  name: 'Ziel-Kopf',
  category: 'Ziele',
  description: 'Kopf eines Ziels: Bereich, Titel, „Warum?“, Fortschrittsring mit Stand, Zustand in Worten, Frist, ruhiger Prognose-Satz (Annahme genannt) und Quelle mit Link. Bei Körperzielen lassen sich die Zahlen ausblenden. Ziele lassen sich pausieren statt zu verlieren.',
  version: '1.2',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['ring', 'compact'], default: 'ring' },
    { name: 'showPicker', label: 'Ziel per Chip wechseln', type: 'boolean', default: true },
    { name: 'showWhy', label: '„Warum?“ zeigen', type: 'boolean', default: true },
  ],
  data: GOAL_SLOTS,
  events: ['goal.select', 'goal.hide', 'goal.pause', 'goal.archive', 'goal.restore', 'source.open', 'goal.create.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalHero', propMap: { style: 'style', showPicker: 'showPicker', showWhy: 'showWhy' }, events: { 'goal.select': 'onSelect', 'goal.hide': 'onHideNumbers', 'goal.pause': 'onPause', 'goal.archive': 'onArchive', 'source.open': 'onOpenSource' } },
  css: `${GL_CSS}
  .tk-gl-hr { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-gl-hr__pick { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; } .tk-gl-hr__pick > * { flex:none; }
  [data-tk-large-text] .tk-gl-hr__pick > .tk-chip { white-space:nowrap; max-width:none; } /* Scrollreihe einzeilig */
  .tk-gl-hr__main { display:flex; gap:20px; align-items:center; flex-wrap:wrap; padding:18px; } .tk-gl-hr__txt { flex:1 1 240px; min-width:0; display:flex; flex-direction:column; gap:8px; }
  .tk-gl-hr__txt h2 { margin:0; font-size:var(--tk-fs-2xl); letter-spacing:var(--tk-ls-tight); line-height:var(--tk-lh-tight); overflow-wrap:anywhere; }
  .tk-gl-hr__ring { display:flex; flex-direction:column; align-items:center; gap:6px; flex:none; } .tk-gl-hr__big { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; }
  .tk-gl-hr__why { margin:0; padding:10px 12px; border-left:3px solid var(--gc); background:var(--tk-c-surface2); border-radius:0 var(--tk-radius-md) var(--tk-radius-md) 0; font-size:var(--tk-fs-md); color:var(--tk-c-text-muted); } .tk-gl-hr__why b { display:block; font-size:var(--tk-fs-xs); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); margin-bottom:2px; }
  .tk-gl-hr__facts { display:flex; gap:6px 14px; flex-wrap:wrap; align-items:center; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-gl-hr__foot { display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding:0 18px 16px; }
  .bp-mobile .tk-gl-hr__main { padding:14px; gap:14px; } .bp-mobile .tk-gl-hr__txt h2 { font-size:var(--tk-fs-xl); } .bp-mobile .tk-gl-hr__foot .tk-btn { min-height:44px; }`,
  example: { data: EXAMPLE },
  render: function GoalHero({ props, data, setData, ctx }) {
    const { views } = useViews(data, ctx);
    const v = pickGoal(views, ctx);
    if (!v) return html`<${Card}><${EmptyState} icon="target" title="Noch keine Ziele" text="Lege dein erstes Ziel an, dann erscheint es hier." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create.open')}>Erstes Ziel anlegen<//>`} /><//>`;
    const paused = v.status === 'paused' || v.paused;
    const pause = () => { patchGoal(setData, v.id, { status: v.status === 'paused' ? null : 'paused' }); ctx.emit('goal.pause', { id: v.id }); ctx.toast(v.status === 'paused' ? 'Ziel läuft wieder' : 'Ziel pausiert, dein Stand bleibt erhalten'); };
    const archive = () => {
      const wasFocus = !!v.focus;
      patchGoal(setData, v.id, { archived: true, focus: false }); ctx.emit('goal.archive', { id: v.id });
      pushUndo(ctx, { text: `Ziel archiviert: ${v.title}`, restore: () => { patchGoal(setData, v.id, { archived: false, focus: wasFocus }); ctx.emit('goal.restore', { id: v.id }); } });
    };
    const hide = () => { patchGoal(setData, v.id, { hideNumbers: !v.hideNumbers }); ctx.emit('goal.hide', { id: v.id, hidden: !v.hideNumbers }); };
    return html`<div class="tk-gl-hr" style=${`--gc:${toneColor(v.areaTone)}`}>
      ${props.showPicker && views.length > 1 && html`<div class="tk-gl-hr__pick" role="group" aria-label="Ziel wählen" ref=${(el) => { const a = el && el.querySelector('[aria-pressed="true"]'); if (a && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2); }}>${views.map((x) => html`<${Chip} active=${x.id === v.id} icon=${x.areaIcon} onClick=${() => { ctx.setUi('selectedId', x.id); ctx.emit('goal.select', { id: x.id }); }}>${x.title}<//>`)}</div>`}
      <${Card} flush><div class="tk-gl-hr__main">
        ${props.style === 'ring' && html`<div class="tk-gl-hr__ring"><${Ring} value=${v.progress} size=${112} stroke=${11} tone=${v.areaTone} label=${`${Math.round(v.progress * 100)} % erreicht`}><span class="tk-gl-hr__big">${Math.round(v.progress * 100)}%</span><//></div>`}
        <div class="tk-gl-hr__txt"><${AreaTag} v=${v} /><h2>${v.title}</h2>
          <div class="tk-gl-hr__facts"><${StateBadge} v=${v} /><strong class="tk-gl-num" style="color:var(--tk-c-text)">${valueLine(ctx, v)}</strong><span>${dueLine(v)}</span></div>
          <${PlanBar} v=${v} /><p class="tk-gl-note" style="margin:0">${forecastLine(ctx, v)}</p></div></div>
        ${props.showWhy && v.why && html`<div style="padding:0 18px 14px"><p class="tk-gl-hr__why"><b>Warum?</b>${v.why}</p></div>`}
        <div class="tk-gl-hr__foot"><${SourceChip} v=${v} ctx=${ctx} />
          ${v.kind === 'weight' && html`<${Button} size="sm" variant="ghost" icon=${v.hideNumbers ? 'eye' : 'eye-off'} onClick=${hide}>${v.hideNumbers ? 'Zahlen einblenden' : 'Zahlen ausblenden'}<//>`}
          ${v.state !== 'done' && v.source.type !== 'savings' && html`<${Button} size="sm" variant="ghost" icon=${v.status === 'paused' ? 'play' : 'pause'} onClick=${pause}>${v.status === 'paused' ? 'Fortsetzen' : 'Pausieren'}<//>`}
          <${Button} size="sm" variant="ghost" icon="archive" onClick=${archive}>Archivieren<//></div><//></div>`;
  },
};
export default goalHero;
