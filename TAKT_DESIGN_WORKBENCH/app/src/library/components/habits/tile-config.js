// Start: Startseite anpassen – Kacheln ein-/ausblenden, sortieren, Größe wählen, Vorlagen; mit Live-Vorschau.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Switch, EmptyState, Icon, Segmented, toneColor } from '../../ui.js';

const EXAMPLE = [
  { id: 'hints', label: 'Hinweise', icon: 'sparkles', tone: 'accent', on: true, size: 'M' }, { id: 'agenda', label: 'Agenda', icon: 'calendar', tone: 'accent', on: true, size: 'L' },
  { id: 'tasks', label: 'Aufgaben', icon: 'list-checks', tone: 'warning', on: true, size: 'M' }, { id: 'habits', label: 'Gewohnheiten', icon: 'repeat', tone: 'success', on: false, size: 'M' },
];
const SIZES = [{ value: 'S', label: 'Klein' }, { value: 'M', label: 'Mittel' }, { value: 'L', label: 'Groß' }];
const PRESETS = [
  { id: 'min', label: 'Minimal', icon: 'leaf', on: ['agenda', 'tasks', 'habits'] },
  { id: 'work', label: 'Arbeit', icon: 'briefcase', on: ['hints', 'agenda', 'tasks', 'finance', 'quick'] },
  { id: 'fit', label: 'Fitness-Fokus', icon: 'dumbbell', on: ['rings', 'habits', 'training', 'nutrition', 'weather', 'tasks'] },
  { id: 'all', label: 'Alles', icon: 'layout-grid', on: null },
];

export const tileConfig = {
  id: 'tile-config',
  name: 'Startseite anpassen',
  category: 'Start',
  description: 'Kacheln der Startseite wählen, sortieren (Pfeile, auch per Tastatur) und in der Größe festlegen. Vorlagen („Minimal“, „Arbeit“, „Fitness-Fokus“) und eine Live-Vorschau der gewählten Reihenfolge.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Kacheln' },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['list', 'preview'], default: 'list' },
    { name: 'showPresets', label: 'Vorlagen zeigen', type: 'boolean', default: true },
    { name: 'showSizes', label: 'Größen wählbar', type: 'boolean', default: true },
  ],
  data: [{ slot: 'tiles', label: 'Kacheln', default: 'tiles', shape: '{id,label,icon,tone,on,size:S|M|L}[]', required: true }],
  events: ['customize.toggle', 'customize.move', 'customize.size', 'customize.preset', 'customize.reset', 'customize.save'],
  states: ['empty'],
  css: `
  .tk-tc { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-tc__presets { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding:2px 0; } .tk-tc__presets .tk-chip { flex:none; }
  .tk-tc__row { display:flex; align-items:center; gap:10px; padding:8px 12px 8px 16px; min-height:60px; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-tc__row:last-child { border-bottom:0; } .tk-tc__row[data-on="false"] .tk-tc__name { color:var(--tk-c-text-subtle); }
  .tk-tc__ic { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--tc) 15%, transparent); color:var(--tc); } .tk-tc__name { flex:1; min-width:0; font-weight:var(--tk-fw-medium); } .tk-tc__mv { display:flex; flex:none; } .tk-tc__mv .tk-btn--icon { width:36px; height:36px; } .bp-mobile .tk-tc__mv .tk-btn--icon { width:40px; height:40px; }
  .tk-tc__split { display:grid; gap:var(--tk-space-4); grid-template-columns:minmax(0, 1fr); } .bp-desktop .tk-tc__split--preview { grid-template-columns:minmax(0, 3fr) minmax(260px, 2fr); }
  .tk-tc__phone { border:1px solid var(--tk-c-border-strong); border-radius:28px; padding:14px 12px; background:var(--tk-c-bg); display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; max-width:340px; margin:0 auto; min-height:260px; align-content:start; width:100%; }
  .tk-tc__ph { border-radius:12px; border:1px solid var(--tk-c-border); background:var(--tk-c-surface); padding:10px; display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-medium); min-width:0; color:var(--tk-c-text); } .tk-tc__ph .tk-tc__ic { width:26px; height:26px; border-radius:8px; }
  .tk-tc__ph[data-size="S"] { grid-column:span 1; min-height:44px; } .tk-tc__ph[data-size="M"] { grid-column:span 2; min-height:52px; } .tk-tc__ph[data-size="L"] { grid-column:span 2; min-height:92px; align-items:flex-start; }
  .tk-tc__foot { display:flex; gap:8px; justify-content:space-between; align-items:center; flex-wrap:wrap; }
  [data-tk-large-text] .tk-tc__split--preview { grid-template-columns:minmax(0, 1fr); }
  [data-tk-large-text] .tk-tc__row { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-tc__name { flex:1 1 6em; white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:break-word; }
  [data-tk-large-text] .tk-tc__row > .tk-seg, [data-tk-large-text] .tk-tc__row > [role="radiogroup"], [data-tk-large-text] .tk-tc__row > [role="group"] { order:5; flex:1 1 100%; max-width:100%; }
  [data-tk-large-text] .tk-tc__phone { grid-template-columns:minmax(0, 1fr); } [data-tk-large-text] .tk-tc__ph[data-size] { grid-column:auto; } [data-tk-large-text] .tk-tc__ph .tk-truncate { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:break-word; }`,
  example: { data: { tiles: EXAMPLE } },
  render: ({ props, data, setData, ctx }) => {
    const tiles = Array.isArray(data.tiles) ? data.tiles : [];
    if (!tiles.length) return html`<${Card} title=${props.title}><${EmptyState} icon="layout-grid" title="Keine Kacheln" text="Sobald Module verbunden sind, kannst du hier deine Startseite zusammenstellen." /><//>`;
    const patch = (fn, ev, detail) => { setData('tiles', fn); ctx.emit(ev, detail); };
    const toggle = (t) => patch((xs) => xs.map((x) => (x.id === t.id ? { ...x, on: !x.on } : x)), 'customize.toggle', { id: t.id, on: !t.on });
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= tiles.length) return; patch((xs) => { const a = xs.slice(); [a[i], a[j]] = [a[j], a[i]]; return a; }, 'customize.move', { id: tiles[i].id, to: j }); };
    const size = (t, s) => patch((xs) => xs.map((x) => (x.id === t.id ? { ...x, size: s } : x)), 'customize.size', { id: t.id, size: s });
    const preset = (p) => { patch((xs) => xs.map((x) => ({ ...x, on: p.on ? p.on.includes(x.id) : true })), 'customize.preset', { id: p.id }); ctx.toast(`Vorlage „${p.label}“ angewendet`); };
    const on = tiles.filter((t) => t.on);
    const list = html`<${Card} flush title=${props.title} actions=${html`<${Badge} tone="accent">${on.length} von ${tiles.length} sichtbar<//>`}>${tiles.map((t, i) => html`<div class="tk-tc__row" data-on=${t.on} style=${`--tc:${toneColor(t.tone)}`}>
      <span class="tk-tc__ic"><${Icon} name=${t.icon} size=${17} /></span><span class="tk-tc__name tk-truncate">${t.label}</span>
      ${props.showSizes && t.on && ctx.bp !== 'mobile' && html`<${Segmented} label=${`Größe ${t.label}`} value=${t.size || 'M'} onChange=${(s) => size(t, s)} options=${SIZES} />`}
      <span class="tk-tc__mv"><${Button} variant="ghost" size="sm" icon="arrow-up" aria-label=${`${t.label} nach oben`} onClick=${() => move(i, -1)} disabled=${i === 0} /><${Button} variant="ghost" size="sm" icon="arrow-down" aria-label=${`${t.label} nach unten`} onClick=${() => move(i, 1)} disabled=${i === tiles.length - 1} /></span>
      <${Switch} checked=${t.on} onChange=${() => toggle(t)} label=${`${t.label} anzeigen`} /></div>`)}<//>`;
    const prev = html`<${Card} title="Vorschau" icon="smartphone"><div class="tk-tc__phone" aria-label="Vorschau der Startseite">${on.length ? on.map((t) => html`<div class="tk-tc__ph" data-size=${t.size || 'M'} style=${`--tc:${toneColor(t.tone)}`}><span class="tk-tc__ic"><${Icon} name=${t.icon} size=${14} /></span><span class="tk-truncate">${t.label}</span></div>`) : html`<div class="tk-subtle" style="grid-column:1 / -1;text-align:center;padding:24px 8px;font-size:var(--tk-fs-sm)">Keine Kachel gewählt – die Startseite bliebe leer.</div>`}</div><//>`;
    return html`<div class="tk-tc">${props.showPresets && html`<div class="tk-tc__presets" role="group" aria-label="Vorlagen">${PRESETS.map((p) => html`<button type="button" class="tk-chip" onClick=${() => preset(p)}><${Icon} name=${p.icon} size=${14} />${p.label}</button>`)}</div>`}
      <div class=${`tk-tc__split ${props.mode === 'preview' ? 'tk-tc__split--preview' : ''}`}>${list}${props.mode === 'preview' ? prev : null}</div>
      <div class="tk-tc__foot"><${Button} variant="ghost" icon="rotate-ccw" onClick=${() => { setData('tiles', (xs) => xs.map((x) => ({ ...x, on: true, size: 'M' }))); ctx.emit('customize.reset'); ctx.toast('Zurückgesetzt'); }}>Zurücksetzen<//>
        <${Button} variant="primary" icon="check" onClick=${() => { ctx.emit('customize.save', { visible: on.length }); ctx.toast('Startseite gespeichert'); }}>Speichern<//></div></div>`;
  },
};
export default tileConfig;
