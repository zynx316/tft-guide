// Ernährung: Wasser-Tracker – 1-Tap-Erfassung, eigene Gefäße, Glas-Raster, Tagesverlauf und Wochenbalken. Ohne Druck.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Input, Field, Chip } from '../../ui.js';
import { num, viewDay, todayIso, hhmm, eid, shiftDay, wdOf } from './_calc.js';
import { Stepper, NU_CSS, obj, arr } from './_ui.js';

const WATER = 'var(--tk-chart-5)';

export const waterTracker = {
  id: 'water-tracker',
  name: 'Wasser-Tracker',
  category: 'Ernährung',
  description: 'Trinken mit einem Tap erfassen: Schnelltasten (+150/+250/+500 ml), eigene Gefäße, Glas-Raster oder Fortschrittsbalken, Rückgängig und Wochenbalken. Ziel erreicht wird dezent gezeigt, ohne Animation.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wasser' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['glasses', 'bar', 'compact', 'timeline'], default: 'bar' },
    { name: 'quick', label: 'Schnelltasten (ml)', type: 'list', default: ['150', '250', '500'] },
    { name: 'showVessels', label: 'Eigene Gefäße', type: 'boolean', default: true },
    { name: 'showWeek', label: 'Wochenbalken', type: 'boolean', default: false },
    { name: 'openable', label: 'Link „Details“ (Event water.open)', type: 'boolean', default: false },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'water', label: 'Wasser-Log', default: 'water', shape: '{goal,vessels:[{id,label,ml,icon}],entries:[{id,date,time,ml,vessel}],week:[{date,ml}]}', required: true },
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{water}', required: false },
  ],
  events: ['water.add', 'water.undo', 'water.remove', 'water.vessel', 'water.open'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-nwat { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-nwat__top { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; } .tk-nwat__top .tk-nu-big { color:var(--tk-c-text); }
  .tk-nwat__glasses { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; }
  .tk-nwat__glass { position:relative; height:64px; width:100%; max-width:50px; justify-self:center; border-radius:6px 6px 14px 14px; border:2px solid var(--tk-c-border-strong); background:var(--tk-c-surface); overflow:hidden; cursor:pointer; padding:0; }
  .tk-nwat__glass i { position:absolute; left:0; right:0; bottom:0; background:${WATER}; opacity:.85; } .tk-nwat__glass:hover { border-color:${WATER}; }
  .tk-nwat__quick { display:flex; gap:8px; flex-wrap:wrap; } .tk-nwat__quick .tk-btn { flex:1 1 0; min-width:0; padding:0 8px; justify-content:center; }
  .tk-nwat__ves { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .tk-nwat__undo { display:flex; align-items:center; gap:8px; padding:6px 6px 6px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-nfs-sm); }
  .tk-nwat__note { margin:0; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); display:flex; gap:6px; align-items:center; }
  .tk-nwat__week { display:flex; align-items:flex-end; gap:6px; height:64px; } .tk-nwat__wcol { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; min-width:0; }
  .tk-nwat__wbar { width:100%; max-width:28px; border-radius:5px 5px 2px 2px; background:${WATER}; opacity:.55; min-height:3px; } .tk-nwat__wcol[data-today="true"] .tk-nwat__wbar { opacity:1; } .tk-nwat__wcol span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); }
  .tk-nwat__line { display:flex; align-items:center; gap:10px; min-height:44px; border-bottom:1px solid var(--tk-c-border); } .tk-nwat__line:last-child { border-bottom:0; }
  .tk-nwat__compact { display:flex; align-items:center; gap:12px; min-width:0; } .tk-nwat__compact .tk-progress > span { background:${WATER}; }
  .tk-nwat .tk-progress { height:10px; } .tk-nwat .tk-progress > span { background:${WATER}; }`,
  example: { data: {
    water: { goal: 2500, vessels: [{ id: 'v1', label: 'Glas', ml: 250, icon: 'glass-water' }, { id: 'v2', label: 'Meine Flasche', ml: 750, icon: 'cup-soda' }],
      entries: [{ id: 'w1', date: '2026-11-24', time: '07:20', ml: 250, vessel: 'Glas' }, { id: 'w2', date: '2026-11-24', time: '08:05', ml: 500, vessel: 'Flasche' }], week: [{ date: '2026-11-23', ml: 2300 }, { date: '2026-11-22', ml: 2750 }] },
    goals: { water: 2500 },
  } },
  render: function WaterTracker({ props, data, setData, ctx }) {
    const [last, setLast] = useState(null);
    const w = obj(data.water), goals = obj(data.goals);
    const iso = viewDay(ctx), isToday = iso === todayIso(ctx);
    const goal = goals.water || w.goal || 0;
    const entries = arr(w.entries).filter((e) => e.date === iso);
    const total = isToday || entries.length ? entries.reduce((a, e) => a + e.ml, 0) : arr(w.week).find((x) => x.date === iso)?.ml || 0;
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="droplets" actions=${props.openable && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('water.open')}>Details<//>`}>${b}<//>` : b);
    if (!goal) return wrap(html`<${EmptyState} icon="droplets" title="Kein Wasserziel" text="Lege im Ziele-Assistenten ein Tagesziel fest, zum Beispiel 2.500 ml." />`);
    const add = (ml, vessel = 'Wasser') => { const e = { id: eid('w'), date: iso, time: hhmm(ctx.today), ml, vessel }; setData('water', (x) => ({ ...obj(x), entries: [...arr(obj(x).entries), e] })); setLast(e); ctx.emit('water.add', { ml, vessel }); };
    const undo = () => { if (!last) return; setData('water', (x) => ({ ...obj(x), entries: arr(obj(x).entries).filter((e) => e.id !== last.id) })); ctx.emit('water.undo', { id: last.id }); setLast(null); };
    const remove = (e) => { setData('water', (x) => ({ ...obj(x), entries: arr(obj(x).entries).filter((y) => y.id !== e.id) })); ctx.emit('water.remove', { id: e.id }); };
    const newVessel = () => ctx.openDialog({ title: 'Eigenes Gefäß', body: (close) => html`<${VesselForm} onSave=${(v) => { setData('water', (x) => ({ ...obj(x), vessels: [...arr(obj(x).vessels), v] })); ctx.emit('water.vessel', { label: v.label }); close(); }} />` });
    const p = total / goal, done = total >= goal;
    const quick = (Array.isArray(props.quick) ? props.quick : String(props.quick).split(',')).map((q) => Number(q)).filter(Boolean);
    const alt = `${num(total)} von ${num(goal)} Millilitern getrunken`;
    const note = done ? html`<p class="tk-nwat__note"><${Icon} name="check-circle-2" size=${15} />Tagesziel erreicht${total > goal * 1.3 ? '. Das Ziel ist eine Orientierung, du musst nicht mehr trinken.' : '.'}</p>` : null;
    const quickRow = html`<div class="tk-nwat__quick">${quick.map((q) => html`<${Button} icon="plus" onClick=${() => add(q)} aria-label=${`${q} Milliliter hinzufügen`}>${q} ml<//>`)}</div>`;
    const vessels = props.showVessels && html`<div class="tk-nwat__ves"><span class="tk-nu-meta">Gefäße</span>${arr(w.vessels).map((v) => html`<${Chip} icon=${v.icon || 'glass-water'} onClick=${() => add(v.ml, v.label)}>${v.label} · ${v.ml} ml<//>`)}<${Chip} icon="plus" onClick=${newVessel}>Eigenes<//></div>`;
    const undoBar = last && html`<div class="tk-nwat__undo" role="status"><span class="tk-grow">+${last.ml} ml erfasst</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${undo}>Rückgängig<//></div>`;
    const week = props.showWeek && (() => { const days = [-6, -5, -4, -3, -2, -1, 0].map((n) => shiftDay(todayIso(ctx), n)); const ml = (d) => (d === todayIso(ctx) ? arr(w.entries).filter((e) => e.date === d).reduce((a, e) => a + e.ml, 0) : arr(w.week).find((x) => x.date === d)?.ml || 0);
      return html`<div class="tk-nwat__week" role="img" aria-label="Wasser der letzten sieben Tage">${days.map((d) => html`<div class="tk-nwat__wcol" data-today=${String(d === todayIso(ctx))}><div class="tk-nwat__wbar" style=${`height:${Math.min(100, (ml(d) / goal) * 100)}%`} title=${`${num(ml(d))} ml`}></div><span>${wdOf(d)}</span></div>`)}</div>`; })();

    if (props.style === 'compact') {
      return wrap(html`<div class="tk-nwat__compact"><span class="tk-nu-icon" style=${`background:color-mix(in srgb, ${WATER} 18%, transparent);color:${WATER}`}><${Icon} name="droplets" size=${18} /></span>
        <div class="tk-grow" style="min-width:0"><div class="tk-row" style="justify-content:space-between"><strong class="tk-num">${num(total)} ml</strong><span class="tk-nu-meta">von ${num(goal)}</span></div><div class="tk-progress" role="progressbar" aria-valuenow=${Math.round(p * 100)} aria-valuemin="0" aria-valuemax="100" aria-label=${alt} style="margin-top:6px"><span style=${`width:${Math.min(100, p * 100)}%`}></span></div></div>
        <${Button} variant="primary" icon="plus" onClick=${() => add(250, 'Glas')} aria-label="250 Milliliter hinzufügen">250<//></div>`);
    }
    if (props.style === 'timeline') {
      return wrap(html`<div class="tk-nwat"><div class="tk-nwat__top"><span class="tk-nu-big">${num(total)}</span><span class="tk-muted">von ${num(goal)} ml</span></div>
        <div class="tk-progress" role="progressbar" aria-valuenow=${Math.round(p * 100)} aria-valuemin="0" aria-valuemax="100" aria-label=${alt}><span style=${`width:${Math.min(100, p * 100)}%`}></span></div>${note}${quickRow}${undoBar}
        <div>${entries.length ? [...entries].sort((a, b) => (a.time < b.time ? 1 : -1)).map((e) => html`<div class="tk-nwat__line"><span class="tk-nu-meta tk-num" style="width:44px">${e.time}</span><span class="tk-grow">${e.vessel}</span><strong class="tk-num">+${e.ml} ml</strong><${Button} variant="ghost" size="sm" icon="x" aria-label=${`${e.ml} ml um ${e.time} entfernen`} onClick=${() => remove(e)} /></div>`) : html`<p class="tk-nu-meta">Heute noch nichts getrunken. Ein Glas zum Start?</p>`}</div>${vessels}${week}</div>`);
    }
    const glasses = Math.max(5, Math.ceil(goal / 250 / 5) * 5);
    return wrap(html`<div class="tk-nwat"><div class="tk-nwat__top"><span class="tk-nu-big">${num(total)}</span><span class="tk-muted">von ${num(goal)} ml</span></div>
      ${props.style === 'glasses' ? html`<div class="tk-nwat__glasses" role="img" aria-label=${alt}>${Array.from({ length: glasses }, (_, i) => { const fill = Math.max(0, Math.min(1, total / 250 - i)); return html`<button type="button" class="tk-nwat__glass" aria-label=${`Glas ${i + 1}: 250 Milliliter hinzufügen`} onClick=${() => add(250, 'Glas')}><i style=${`height:${fill * 100}%`}></i></button>`; })}</div>`
        : html`<div class="tk-progress" role="progressbar" aria-valuenow=${Math.round(p * 100)} aria-valuemin="0" aria-valuemax="100" aria-label=${alt}><span style=${`width:${Math.min(100, p * 100)}%`}></span></div>`}
      ${note}${quickRow}${undoBar}${vessels}${week}</div>`);
  },
};

function VesselForm({ onSave }) {
  const [label, setLabel] = useState('Große Tasse');
  const [ml, setMl] = useState(400);
  return html`<div style="display:flex;flex-direction:column;gap:14px"><${Field} label="Name"><${Input} value=${label} onInput=${setLabel} /><//><${Stepper} value=${ml} onChange=${setMl} step=${50} min=${50} max=${2000} unit="ml" label="Inhalt" />
    <${Button} variant="primary" icon="check" onClick=${() => onSave({ id: eid('v'), label: label.trim() || 'Gefäß', ml, icon: 'cup-soda' })}>Gefäß speichern<//></div>`;
}
export default [waterTracker];
