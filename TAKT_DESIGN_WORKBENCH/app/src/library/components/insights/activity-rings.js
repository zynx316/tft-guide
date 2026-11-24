// Fitness (Referenz): Aktivitätsringe für Bewegung, Training, Schritte
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Icon, EmptyState, toneColor } from '../../ui.js';
import { fmt } from '../../../lib/util.js';

export const activityRings = {
  id: 'activity-rings',
  name: 'Aktivitätsringe',
  category: 'Fitness',
  description: 'Konzentrische Ziel-Ringe (z. B. Bewegung, Training, Schritte) mit Wert/Ziel-Legende. Antippen eines Rings zeigt Details in der Mitte. Referenzbaustein für Fortschrittsdarstellung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Heute' },
    { name: 'size', label: 'Durchmesser (px)', type: 'number', default: 168 },
    { name: 'layout', label: 'Anordnung', type: 'select', options: ['side', 'stacked'], default: 'side' },
    { name: 'showLegend', label: 'Legende zeigen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'rings', label: 'Ringe', default: 'rings', shape: '{id,label,value,goal,unit?,tone?,icon?}[]', required: true }],
  events: ['ring.open'],
  states: ['empty'],
  css: `
  .tk-rings { display:flex; align-items:center; gap:var(--tk-space-6); flex-wrap:wrap; }
  .tk-rings--stacked { flex-direction:column; align-items:stretch; }
  .tk-rings__svg { flex:none; margin:0 auto; }
  .tk-rings__legend { flex:1 1 200px; display:flex; flex-direction:column; gap:var(--tk-space-2); min-width:0; }
  .tk-rings__item { display:flex; align-items:center; gap:var(--tk-space-3); padding:8px 10px; border-radius:var(--tk-radius-md); border:1px solid transparent; background:transparent; text-align:left; color:inherit; cursor:pointer; min-height:48px; min-width:0; }
  .tk-rings__item:hover, .tk-rings__item[aria-pressed="true"] { background:var(--tk-c-surface2); border-color:var(--tk-c-border); }
  .tk-rings__dot { width:32px; height:32px; border-radius:10px; display:grid; place-items:center; flex:none; }
  .tk-rings__val { font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; }
  .tk-rings__val strong { display:block; }
  .tk-rings__val small { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); }`,
  example: { data: { rings: [
    { id: 'move', label: 'Bewegung', value: 420, goal: 600, unit: 'kcal', tone: 1, icon: 'flame' },
    { id: 'train', label: 'Training', value: 35, goal: 45, unit: 'min', tone: 2, icon: 'dumbbell' },
    { id: 'steps', label: 'Schritte', value: 8400, goal: 10000, unit: '', tone: 3, icon: 'footprints' },
  ] } },
  render: function ActivityRings({ props, data, ctx }) {
    const rings = data.rings || [];
    const [sel, setSel] = useState(null);
    if (!rings.length) return html`<${Card} title=${props.title}><${EmptyState} icon="activity" title="Noch keine Aktivität" text="Sobald du dich bewegst, füllen sich hier deine Ringe." /><//>`;
    const S = Math.min(props.size, Math.max(120, (ctx.width || 400) - 96)), cx = S / 2, sw = Math.max(10, S * 0.075), gap = 4;
    const cur = rings.find((r) => r.id === sel);
    const avg = rings.reduce((a, r) => a + Math.min(r.value / r.goal, 1), 0) / rings.length;
    const choose = (r) => { setSel(sel === r.id ? null : r.id); ctx.emit('ring.open', { id: r.id }); };
    return html`<${Card} title=${props.title}><div class=${`tk-rings tk-rings--${props.layout}`}>
      <svg class="tk-rings__svg" width=${S} height=${S} viewBox=${`0 0 ${S} ${S}`} role="img" aria-label=${`Tagesziele zu ${fmt.percent(avg, 0)} erreicht`}>
        ${rings.slice(0, 4).map((r, i) => { const R = cx - sw / 2 - i * (sw + gap) - 2; const C = 2 * Math.PI * R; const p = Math.min(r.value / r.goal, 1); const col = toneColor(r.tone || i + 1);
          return html`<g style="cursor:pointer" onClick=${() => choose(r)} opacity=${cur && cur.id !== r.id ? 0.4 : 1}>
            <circle cx=${cx} cy=${cx} r=${R} fill="none" stroke=${col} stroke-opacity=".18" stroke-width=${sw} />
            <circle cx=${cx} cy=${cx} r=${R} fill="none" stroke=${col} stroke-width=${sw} stroke-linecap="round" stroke-dasharray=${`${Math.max(p * C, 0.01)} ${C}`} transform=${`rotate(-90 ${cx} ${cx})`} /></g>`; })}
        <text x=${cx} y=${cx - 2} text-anchor="middle" fill="var(--tk-c-text)" style="font-size:22px;font-weight:700">${cur ? fmt.percent(Math.min(cur.value / cur.goal, 9.99), 0) : fmt.percent(avg, 0)}</text>
        <text x=${cx} y=${cx + 16} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">${cur ? cur.label : 'Tagesziele'}</text>
      </svg>
      ${props.showLegend && html`<div class="tk-rings__legend">${rings.map((r, i) => { const col = toneColor(r.tone || i + 1); const done = r.value >= r.goal;
        return html`<button type="button" class="tk-rings__item" aria-pressed=${String(sel === r.id)} onClick=${() => choose(r)}>
          <span class="tk-rings__dot" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${done ? 'check' : r.icon || 'activity'} size=${16} /></span>
          <span class="tk-grow tk-truncate" style="font-weight:500">${r.label}</span>
          <span class="tk-rings__val"><strong>${fmt.number(r.value)} ${r.unit || ''}</strong><small>von ${fmt.number(r.goal)} ${r.unit || ''}</small></span></button>`; })}</div>`}
    </div><//>`;
  },
};

export default [activityRings];
