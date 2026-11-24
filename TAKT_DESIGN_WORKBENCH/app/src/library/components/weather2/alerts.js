// Wetter: amtliche Warnungen nach DWD-Stufen (wx-alerts) und Stufen-Erklärung (wx-alert-levels)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, EmptyState } from '../../ui.js';
import { placeOf, hm, dkey, dayName, diffMin, durText, stamp, LV, lvSoft, KIND_ICON, SLOT_PLACE, SLOT_EVENTS, EX } from './_weather2.js';

export const when = (a, today) => {
  const now = stamp(today), toTxt = dkey(a.to) === dkey(a.from) ? '' : `${dayName(a.to, today)} `;
  return `${dayName(a.from, today, true)} ${hm(a.from)} – ${toTxt}${hm(a.to)} Uhr`;
};
export const status = (a, today) => {
  const now = stamp(today);
  if (a.to <= now) return { label: 'Abgelaufen', tone: 'neutral' };
  if (a.from <= now) return { label: `Gilt seit ${durText(diffMin(now, a.from))}`, tone: LV[a.level].tone };
  return { label: `Beginnt in ${durText(diffMin(a.from, now))}`, tone: 'warning' };
};
export const Meter = ({ level }) => html`<span class="tk-wxa__meter" role="img" aria-label=${`Warnstufe ${level} von 4`}>${[1, 2, 3, 4].map((i) => html`<i style=${i <= level ? `background:${LV[level].color}` : ''}></i>`)}</span>`;
function Track({ a, today }) {
  const t0 = new Date(`${dkey(stamp(today))}T00:00:00`).getTime(), span = 72 * 3600000;
  const l = Math.max(0, (new Date(a.from) - t0) / span) * 100, r = Math.min(1, (new Date(a.to) - t0) / span) * 100, nowP = ((new Date(today) - t0) / span) * 100;
  return html`<div class="tk-wxa__track" aria-hidden="true"><span class="tk-wxa__fill" style=${`left:${l}%;width:${Math.max(2, r - l)}%;background:${LV[a.level].color}`}></span><span class="tk-wxa__now" style=${`left:${nowP}%`}></span>
    <span class="tk-wxa__d" style="left:0">Heute</span><span class="tk-wxa__d" style="left:33.3%">${dayName(new Date(t0 + 86400000), today)}</span><span class="tk-wxa__d" style="left:66.6%">${dayName(new Date(t0 + 2 * 86400000), today)}</span></div>`;
}
export function impact(a, events, venues) {
  return (events || []).filter((e) => !e.allDay && venues?.[e.location]?.outdoor && e.end > a.from && stamp(new Date(new Date(e.start).getTime() - 30 * 60000)) < a.to);
}

export const wxAlerts = {
  id: 'wx-alerts',
  name: 'Warnungen (DWD-Stufen)',
  category: 'Wetter',
  description: 'Amtliche Warnungen mit Stufe 1–4, Zeitraum und Zeitleiste, Status („beginnt in …“), Verhaltenstipps, betroffenen Terminen und Quelle. Modi: voll, kompakt (Zeilen) oder Banner (wichtigste Warnung). Optional Warnungen aller gemerkten Orte.',
  version: '1.1',
  props: [
    { name: 'mode', label: 'Modus', type: 'select', options: ['full', 'compact', 'banner'], default: 'full' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Warnungen' },
    { name: 'showTips', label: 'Verhaltenstipps', type: 'boolean', default: true },
    { name: 'showImpact', label: 'Betroffene Termine', type: 'boolean', default: true },
    { name: 'allowAllPlaces', label: 'Umschalter „Alle Orte“', type: 'boolean', default: false },
    { name: 'inlineExpand', label: 'Kompakt: Details inline aufklappen', type: 'boolean', default: false },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
  ],
  data: [SLOT_PLACE, SLOT_EVENTS, { slot: 'venues', label: 'Wege zu Orten', default: 'venues', shape: '{ [ort]: {mode,min,outdoor} }' }, { slot: 'places', label: 'Alle Orte', default: 'places', shape: 'Ortsbündel[]' }],
  events: ['weather.alert.open', 'weather.alert.dismiss', 'weather.alert.share'],
  states: ['empty'],
  css: `
  .tk-wxa { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-wxa__item .tk-badge, .tk-wxa__banner .tk-badge { white-space:normal; max-width:100%; text-align:left; height:auto; }
  .tk-wxa__item { border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); border-left:5px solid var(--wx-lv); background:var(--wx-soft); overflow:hidden; }
  .tk-wxa__head { display:flex; align-items:flex-start; gap:var(--tk-space-3); width:100%; padding:var(--tk-space-3) var(--tk-space-4); min-height:60px; border:0; background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxa__ic { flex:none; display:grid; place-items:center; width:40px; height:40px; border-radius:12px; color:var(--wx-lv); background:color-mix(in srgb, var(--wx-lv) 16%, transparent); }
  .tk-wxa__title { font-weight:var(--tk-fw-semibold); line-height:1.3; }
  .tk-wxa__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; }
  .tk-wxa__meter { display:inline-flex; gap:2px; vertical-align:middle; } .tk-wxa__meter i { width:10px; height:6px; border-radius:2px; background:var(--tk-c-surface3); }
  .tk-wxa__track { position:relative; height:22px; margin:12px 0 2px; border-radius:6px; background:var(--tk-c-surface3); }
  .tk-wxa__fill { position:absolute; top:0; bottom:0; border-radius:6px; opacity:.9; } .tk-wxa__now { position:absolute; top:-3px; bottom:-3px; width:2px; background:var(--tk-c-text); border-radius:1px; }
  .tk-wxa__d { position:absolute; top:24px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wxa__body { padding:0 var(--tk-space-4) var(--tk-space-4) calc(var(--tk-space-4) + 40px + var(--tk-space-3)); display:flex; flex-direction:column; gap:var(--tk-space-3); font-size:var(--tk-fs-md); line-height:1.55; }
  .bp-mobile .tk-wxa__body { padding-left:var(--tk-space-4); }
  .tk-wxa__tips { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; font-size:var(--tk-fs-sm); }
  .tk-wxa__tips li { display:flex; gap:8px; align-items:flex-start; } .tk-wxa__tips svg { flex:none; margin-top:2px; color:var(--wx-lv); }
  .tk-wxa__src { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wxa__row { display:flex; align-items:center; gap:var(--tk-space-3); width:100%; min-height:52px; padding:6px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxa__row:hover { background:var(--tk-c-surface2); } .tk-wxa__row:last-child { border-bottom:0; }
  .tk-wxa__dot { width:10px; height:10px; border-radius:50%; flex:none; background:var(--wx-lv); }
  .tk-wxa__banner { display:flex; align-items:center; gap:var(--tk-space-3); padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid color-mix(in srgb, var(--wx-lv) 45%, transparent); border-left:5px solid var(--wx-lv); background:var(--wx-soft); min-width:0; }
  .tk-wxa__lv { display:flex; gap:var(--tk-space-3); align-items:flex-start; width:100%; padding:var(--tk-space-3) var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; min-height:56px; }
  .tk-wxa__lv:last-child { border-bottom:0; } .tk-wxa__lv:hover { background:var(--tk-c-surface2); }`,
  example: { data: { place: EX.place, events: EX.events, venues: EX.venues, places: EX.places } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    const [hidden, setHidden] = useState([]);
    const [scope, setScope] = useState('place');
    const sel = ctx.ui.selectedId;
    const [open, setOpen] = useState(typeof sel === 'string' && sel.startsWith('wx-') ? sel : props.mode === 'full' ? 'first' : null);
    if (!place) return html`<${Card} title=${props.title} icon="alert-triangle"><${EmptyState} icon="cloud" title="Keine Wetterdaten" text="Für diesen Ort liegen gerade keine Daten vor." /><//>`;
    const now = stamp(ctx.today);
    const all = scope === 'all' ? (data.places || []).filter((p) => p.saved).flatMap((p) => (p.alerts || []).map((a) => ({ ...a, placeName: p.id === place.id ? null : p.name }))) : (place.alerts || []).map((a) => ({ ...a, placeName: null }));
    let list = all.filter((a) => a.to > now && !hidden.includes(a.id)).sort((a, b) => b.level - a.level || a.from.localeCompare(b.from));
    if (props.limit > 0) list = list.slice(0, props.limit);
    const openId = open === 'first' ? list[0]?.id : open;
    const toggle = (a) => { const o = openId === a.id; setOpen(o ? null : a.id); if (!o) ctx.emit('weather.alert.open', { id: a.id }); };
    const Body = ({ a }) => { const hit = props.showImpact ? impact(a, data.events, data.venues) : [];
      return html`<div class="tk-wxa__body"><${Track} a=${a} today=${ctx.today} /><span style="margin-top:8px">${a.text}</span>
        ${props.showTips && html`<ul class="tk-wxa__tips" aria-label="Verhaltenstipps">${a.tips.map((t) => html`<li><${Icon} name="check-circle-2" size=${15} /><span>${t}</span></li>`)}</ul>`}
        ${props.showImpact && html`<div class="tk-wxa__sub" style="display:flex;gap:8px;align-items:flex-start"><${Icon} name="calendar-clock" size=${14} /><span>${hit.length ? html`<strong>Betrifft:</strong> ${hit.map((e) => `${e.title} (${dayName(e.start, ctx.today)} ${hm(e.start)} Uhr)`).join(', ')}` : 'Keine deiner Termine mit Weg im Freien betroffen.'}</span></div>`}
        <div class="tk-row" style="flex-wrap:wrap;gap:8px"><span class="tk-wxa__src tk-grow">Quelle: ${a.source} · ausgegeben ${hm(a.issued)} Uhr · ${a.area}</span>
          <${Button} size="sm" icon="share-2" onClick=${() => { ctx.emit('weather.alert.share', { id: a.id }); ctx.toast('Warntext geteilt (Demo)'); }}>Teilen<//>
          <${Button} size="sm" onClick=${() => { setHidden([...hidden, a.id]); ctx.emit('weather.alert.dismiss', { id: a.id }); ctx.toast('Warnung ausgeblendet'); }}>Ausblenden<//></div></div>`; };
    const sty = (a) => `--wx-lv:${LV[a.level].color};--wx-soft:${lvSoft(a.level)}`;
    const filter = props.allowAllPlaces && html`<div class="tk-row" style="gap:6px;margin-bottom:var(--tk-space-3)">${[['place', place.name], ['all', 'Alle Orte']].map(([k, l]) => html`<button type="button" class="tk-chip" aria-pressed=${scope === k ? 'true' : 'false'} onClick=${() => setScope(k)}>${l}</button>`)}</div>`;
    if (!list.length) return html`<${Card} title=${props.title} icon="shield-check">${filter}<${EmptyState} icon="shield-check" title="Keine Warnungen" text=${`Für ${scope === 'all' ? 'deine gemerkten Orte' : place.name} liegen aktuell keine amtlichen Warnungen vor. Stand ${hm(place.updated)} Uhr.`} /><//>`;
    if (props.mode === 'banner') { const a = list[0]; const st = status(a, ctx.today);
      return html`<div class="tk-wxa__banner" style=${sty(a)} role="status"><span class="tk-wxa__ic"><${Icon} name=${KIND_ICON[a.kind] || 'alert-triangle'} size=${22} /></span>
        <div class="tk-grow"><div class="tk-wxa__title">${a.short}${a.placeName ? ` · ${a.placeName}` : ''}</div><div class="tk-wxa__sub">${LV[a.level].short} · ${when(a, ctx.today)} · ${st.label}</div></div>
        ${list.length > 1 && html`<${Badge}>+${list.length - 1}<//>`}<${Button} size="sm" onClick=${() => ctx.emit('weather.alert.open', { id: a.id })}>Details<//></div>`; }
    if (props.mode === 'compact') return html`<${Card} flush title=${props.title} icon="alert-triangle" actions=${html`<${Badge} tone=${LV[list[0].level].tone}>${list.length}<//>`}>${props.allowAllPlaces && html`<div style="padding:0 var(--tk-space-4) var(--tk-space-3)">${filter}</div>`}
      ${list.map((a) => { const st = status(a, ctx.today), o = props.inlineExpand && openId === a.id; return html`<div style=${sty(a)}><button type="button" class="tk-wxa__row" aria-expanded=${props.inlineExpand ? (o ? 'true' : 'false') : undefined} onClick=${() => (props.inlineExpand ? toggle(a) : ctx.emit('weather.alert.open', { id: a.id }))}><span class="tk-wxa__dot"></span>
        <span class="tk-grow"><span class="tk-wxa__title">${a.short}${a.placeName ? ` · ${a.placeName}` : ''}</span><span class="tk-wxa__sub" style="display:block">${LV[a.level].short} · ${when(a, ctx.today)}</span></span><span class="tk-wxa__sub">${st.label}</span><${Icon} name=${o ? 'chevron-up' : 'chevron-right'} size=${16} /></button>${o && html`${Body({ a })}`}</div>`; })}<//>`;
    return html`<div class="tk-wxa">${filter}
      ${list.map((a) => { const isOpen = openId === a.id, st = status(a, ctx.today);
        return html`<div class="tk-wxa__item" style=${sty(a)}>
          <button type="button" class="tk-wxa__head" aria-expanded=${isOpen ? 'true' : 'false'} onClick=${() => toggle(a)}>
            <span class="tk-wxa__ic"><${Icon} name=${KIND_ICON[a.kind] || 'alert-triangle'} size=${22} /></span>
            <span class="tk-grow"><span class="tk-wxa__title">${a.title}</span>
              <span class="tk-wxa__sub" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><${Meter} level=${a.level} /><span>${LV[a.level].short}</span></span>
              <span class="tk-wxa__sub" style="display:block">${when(a, ctx.today)}</span>
              <span style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><${Badge} tone=${st.tone}>${st.label}<//>${a.placeName && html`<${Badge} icon="map-pin">${a.placeName}<//>`}</span></span>
            <${Icon} name=${isOpen ? 'chevron-up' : 'chevron-down'} size=${18} /></button>
          ${isOpen && html`${Body({ a })}`}
        </div>`; })}</div>`;
  },
};

export const wxAlertLevels = {
  id: 'wx-alert-levels',
  name: 'Warnstufen erklärt',
  category: 'Wetter',
  description: 'Die vier Warnstufen nach DWD-Schema (Gelb, Orange, Rot, Violett) mit Bedeutung und Handlungsempfehlung. Zeilen klappen auf („Was bedeutet Stufe 2?“).',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Was bedeuten die Stufen?' }],
  data: [{ slot: 'levels', label: 'Warnstufen', default: 'levels', shape: '{level,name,color,meaning,action}[]', required: true }],
  events: ['weather.alert.level'],
  states: ['empty'],
  css: ``,
  example: { data: { levels: EX.levels } },
  render: ({ props, data, ctx }) => {
    const [open, setOpen] = useState(2);
    const list = data.levels || [];
    if (!list.length) return html`<${Card} title=${props.title} icon="info"><${EmptyState} icon="info" title="Keine Stufen hinterlegt" /><//>`;
    return html`<${Card} flush title=${props.title} icon="info">${list.map((l) => { const o = open === l.level;
      return html`<button type="button" class="tk-wxa__lv" style=${`--wx-lv:${LV[l.level].color}`} aria-expanded=${o ? 'true' : 'false'} onClick=${() => { setOpen(o ? null : l.level); ctx.emit('weather.alert.level', { level: l.level }); }}>
        <span class="tk-wxa__ic" style="width:34px;height:34px"><${Meter} level=${l.level} /></span>
        <span class="tk-grow"><span class="tk-wxa__title">Stufe ${l.level} · ${l.name}</span><span class="tk-wxa__sub" style="display:block">Farbe ${l.color}</span>
          ${o && html`<span style="display:block;margin-top:8px;font-size:var(--tk-fs-sm);line-height:1.5">${l.meaning}<br /><strong>${l.action}</strong></span>`}</span>
        <${Icon} name=${o ? 'chevron-up' : 'chevron-down'} size=${16} /></button>`; })}<//>`;
  },
};
export default [wxAlerts, wxAlertLevels];
