// Fitness: Meilensteine – erreichte und kommende Etappen mit ruhiger Würdigung (kein Konfetti, keine Rangliste).
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Progress, EmptyState, toneColor } from '../../ui.js';
import { num, dayShort } from './_calc.js';
import { FIT_CSS } from './_ui.js';

export const milestoneList = {
  id: 'milestone-list',
  name: 'Meilensteine',
  category: 'Fitness',
  description: 'Erreichte und kommende Meilensteine (z. B. 100. Einheit, −3 kg Trend, 10-km-Lauf) als Karten oder Liste. Erreichtes wird einmalig und ruhig gewürdigt, Offenes zeigt den Fortschritt.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Meilensteine' },
    { name: 'view', label: 'Darstellung', type: 'select', options: ['grid', 'list'], default: 'grid' },
  ],
  data: [{ slot: 'items', label: 'Meilensteine', default: 'milestones', shape: '{id,title,text,icon,tone,value,target,unit,done,date?}[]', required: true }],
  events: ['milestone.open'],
  states: ['empty'],
  css: `
  .tk-ms__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, 250px), 1fr)); } .bp-mobile .tk-ms__grid { grid-template-columns:minmax(0,1fr); }
  .tk-ms__card { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; cursor:pointer; text-align:left; min-width:0; } .tk-ms__card:hover { border-color:var(--tk-c-border-strong); }
  .tk-ms__card[data-done="true"] { border-color:color-mix(in srgb, var(--tk-c-success) 45%, transparent); background:linear-gradient(180deg, var(--tk-c-success-soft), var(--tk-c-surface) 70%); }
  .tk-ms__card .tk-badge { align-self:flex-start; } .tk-ms__ico { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; flex:none; } .tk-ms__row { display:flex; align-items:center; gap:var(--tk-space-3); padding:10px 0; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; width:100%; text-align:left; cursor:pointer; min-height:60px; } .tk-ms__row:last-child { border-bottom:0; }`,
  example: { data: { items: [{ id: 'm1', title: '12 Wochen in Folge', text: 'Zwölf Wochen mit erreichtem Wochenziel.', icon: 'flame', tone: 'warning', value: 12, target: 12, unit: 'Wochen', done: true, date: '2026-11-22' }, { id: 'm2', title: '100. Einheit', text: 'Noch vier Einheiten.', icon: 'dumbbell', tone: 'accent', value: 96, target: 100, unit: 'Einheiten', done: false }] } },
  render: function MilestoneList({ props, data, ctx }) {
    const items = [...(data.items || [])].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
    if (!items.length) return html`<${Card} title=${props.title}><${EmptyState} icon="medal" title="Noch keine Meilensteine" text="Sobald du Ziele hast, erscheinen hier deine Etappen." /><//>`;
    const open = (m) => { ctx.setUi('selectedId', m.id); ctx.emit('milestone.open', { id: m.id }); };
    const ico = (m) => html`<span class="tk-ms__ico" style=${`color:${toneColor(m.tone)};background:color-mix(in srgb, ${toneColor(m.tone)} 16%, transparent)`}><${Icon} name=${m.done ? 'trophy' : m.icon} size=${22} /></span>`;
    const prog = (m) => html`<div class="tk-col" style="gap:6px"><${Progress} value=${Math.min(1, m.value / m.target)} tone=${m.done ? 'success' : undefined} /><span class="tk-subtle tk-num" style="font-size:var(--tk-fs-xs)">${num(m.value, m.value % 1 ? 1 : 0)} von ${num(m.target)} ${m.unit}</span></div>`;
    const status = (m) => (m.done ? html`<${Badge} tone="success" icon="check">Erreicht${m.date ? ` · ${dayShort(m.date)}` : ''}<//>` : html`<${Badge}>${Math.round((m.value / m.target) * 100)} %<//>`);
    if (props.view === 'list') return html`<${Card} flush title=${props.title}>${items.map((m) => html`<button type="button" class="tk-ms__row" style="padding-left:var(--tk-space-4);padding-right:var(--tk-space-4)" onClick=${() => open(m)}>${ico(m)}<div class="tk-grow"><div style="font-weight:600">${m.title}</div>${prog(m)}</div></button>`)}<//>`;
    return html`<div class="tk-col" style="gap:var(--tk-space-3)"><h3 class="tk-h3">${props.title}</h3><div class="tk-ms__grid">${items.map((m) => html`<button type="button" class="tk-ms__card" data-done=${String(!!m.done)} onClick=${() => open(m)} aria-label=${`${m.title}: ${m.done ? 'erreicht' : `${Math.round((m.value / m.target) * 100)} Prozent`}`}>
      <div class="tk-row" style="gap:12px;align-items:flex-start">${ico(m)}<div class="tk-grow" style="min-width:0"><div style="font-weight:600">${m.title}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm);margin-top:2px">${m.text}</div></div></div>${prog(m)}${status(m)}</button>`)}</div></div>`;
  },
};
export default [milestoneList];
