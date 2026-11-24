// Wetter: Warn-Zeitstrahl (wx-alert-timeline) und Warngebiet-Karte (wx-alert-map) – Warnungen als Zeiträume auf 72 Stunden und als Gebiet statt als Liste.
import { html } from '../../../lib/html.js';
import { useState, useRef } from 'preact/hooks';
import { Card, Badge, Button, Icon, EmptyState, Segmented } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, hm, dkey, dayName, stamp, curve, useWidth, LV, lvSoft, KIND_ICON, DIR_DEG, NoPlace, SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, EX } from './_weather2.js';
import { when, status, impact } from './alerts.js';
import { GW, GH, HOME, BaseMap, HomeMarker } from './_radar.js';

const H = 3600000, SPAN = 72;
const METRIC = { gust: 'Böen', temp: 'Temperatur', precip: 'Regen' };
const AUTO = { wind: 'gust', frost: 'temp', rain: 'precip', snow: 'precip', thunder: 'precip', fog: 'temp', heat: 'temp' };
const COLOR_NAME = { 1: 'Gelb', 2: 'Orange', 3: 'Rot', 4: 'Violett' };
const sty = (a) => `--wx-lv:${LV[a.level].color};--wx-soft:${lvSoft(a.level)}`;
const Meter = ({ level }) => html`<span class="tk-wxal__meter" role="img" aria-label=${`Warnstufe ${level} von 4`}>${[1, 2, 3, 4].map((i) => html`<i style=${i <= level ? `background:${LV[level].color}` : ''}></i>`)}</span>`;
/** Offene Warnungen (nicht abgelaufen), optional aller gemerkten Orte, nach Stufe sortiert. */
const alertsOf = (place, places, scope, now) => (scope === 'all' ? (places || []).filter((p) => p.saved).flatMap((p) => (p.alerts || []).map((a) => ({ ...a, placeId: p.id, placeName: p.id === place.id ? null : p.name })))
  : (place.alerts || []).map((a) => ({ ...a, placeId: place.id, placeName: null }))).filter((a) => a.to > now).sort((a, b) => b.level - a.level || a.from.localeCompare(b.from));
const pick = (list, ctx) => { const id = ctx.ui.alertSel ?? (typeof ctx.ui.selectedId === 'string' && ctx.ui.selectedId.startsWith('wx-') ? ctx.ui.selectedId : null); return list.find((a) => a.id === id) || list[0] || null; };

export const wxAlertTimeline = {
  id: 'wx-alert-timeline',
  name: 'Warn-Zeitstrahl (72 Stunden)',
  category: 'Wetter',
  description: 'Warnungen als Zeiträume auf einer 72-Stunden-Achse, hinterlegt mit dem Verlauf von Böen, Temperatur oder Regen und der Jetzt-Marke. Jede Warnung ist ein Balken in einer eigenen Spur; ein Tipp zeigt darunter Stufe, Beginn, Tipps und betroffene Termine. Die Auswahl wird in ctx.ui.alertSel geteilt (Warngebiet-Karte folgt).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wann gilt was?' },
    { name: 'metric', label: 'Verlauf im Hintergrund', type: 'select', options: ['auto', 'gust', 'temp', 'precip'], default: 'auto' },
    { name: 'allowAllPlaces', label: 'Umschalter „Alle Orte“', type: 'boolean', default: true },
    { name: 'showTips', label: 'Verhaltenstipps', type: 'boolean', default: true },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, { slot: 'venues', label: 'Wege zu Orten', default: 'venues', shape: '{ [ort]: {mode,min,outdoor} }' }, { slot: 'places', label: 'Alle Orte', default: 'places', shape: 'Ortsbündel[]' }],
  events: ['weather.alert.open', 'weather.alert.share', 'weather.alert.metric'],
  states: ['empty'],
  flutter: { widget: 'WxAlertTimeline', propMap: { metric: 'metric', allowAllPlaces: 'showAllPlaces', showTips: 'showTips' }, events: ['weather.alert.open', 'weather.alert.share'] },
  css: `
  .tk-wxal__chart { display:block; width:100%; } .tk-wxal__chart text { font-family:inherit; fill:var(--tk-c-text-muted); font-size:12px; font-variant-numeric:tabular-nums; paint-order:stroke; stroke:var(--tk-c-surface); stroke-width:3px; stroke-linejoin:round; }
  .tk-wxal__lane { position:relative; display:block; width:100%; min-height:48px; padding:0; border:0; border-radius:var(--tk-radius-md); background:transparent; color:var(--tk-c-text); font:inherit; cursor:pointer; text-align:left; }
  .tk-wxal__lane[aria-pressed="true"] { background:var(--wx-soft); } .tk-wxal__lane:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-wxal__bar { position:absolute; left:var(--bl); top:8px; height:32px; min-width:44px; border-radius:var(--tk-radius-pill); background:var(--wx-lv); display:flex; align-items:center; justify-content:center; color:var(--tk-c-text-on-accent); }
  .tk-wxal__lbl { position:absolute; top:0; bottom:0; display:flex; flex-direction:column; justify-content:center; max-width:70%; line-height:1.2; pointer-events:none; }
  .tk-wxal__lbl strong { font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); overflow-wrap:break-word; } .tk-wxal__lbl span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); overflow-wrap:break-word; }
  .tk-wxal__meter { display:inline-flex; gap:2px; vertical-align:middle; } .tk-wxal__meter i { width:10px; height:6px; border-radius:2px; background:var(--tk-c-surface3); }
  .tk-wxal__detail { display:flex; flex-direction:column; gap:var(--tk-space-3); margin-top:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid color-mix(in srgb, var(--wx-lv) 40%, transparent); background:var(--wx-soft); }
  .tk-wxal__dh { display:flex; align-items:flex-start; gap:var(--tk-space-3); } .tk-wxal__ic { flex:none; display:grid; place-items:center; width:44px; height:44px; border-radius:14px; color:var(--wx-lv); background:color-mix(in srgb, var(--wx-lv) 16%, transparent); }
  .tk-wxal__t { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-bold); line-height:1.25; overflow-wrap:break-word; } .tk-wxal__s { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-wxal__tips { margin:0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); gap:8px; }
  .tk-wxal__tips li { display:flex; gap:8px; align-items:flex-start; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); line-height:1.4; } .tk-wxal__tips svg { flex:none; margin-top:2px; color:var(--wx-lv); }
  .tk-wxal__chips { display:flex; gap:6px; margin-bottom:var(--tk-space-3); flex-wrap:wrap; }
  .tk-wxam { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-wxam__map { position:relative; width:100%; aspect-ratio:3 / 2; border-radius:var(--tk-radius-lg); overflow:hidden; border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-wxam__map > svg { position:absolute; inset:0; width:100%; height:100%; display:block; } .tk-wxam__chip { position:absolute; display:inline-flex; align-items:center; gap:6px; max-width:calc(100% - 20px); padding:4px 10px; border-radius:var(--tk-radius-pill); background:color-mix(in srgb, var(--tk-c-surface) 92%, transparent); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); }
  .tk-wxam__legend { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 11rem), 1fr)); gap:6px; margin:0; padding:0; list-style:none; } .tk-wxam__legend li { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); padding:6px 8px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); }
  .tk-wxam__legend li[data-on="true"] { border-color:var(--wx-lv); color:var(--tk-c-text); background:var(--wx-soft); font-weight:var(--tk-fw-semibold); }
  [data-tk-large-text] .tk-wxal__lbl { position:static; max-width:none; padding:2px 0 6px; } [data-tk-large-text] .tk-wxal__lane { display:flex; flex-direction:column; } [data-tk-large-text] .tk-wxal__bar { position:relative; top:auto; margin:6px 0 0; }`,
  example: { data: { place: EX.place, settings: EX.settings, events: EX.events, venues: EX.venues, places: EX.places } },
  render: function WxAlertTimeline({ props, data, ctx }) {
    const place = placeOf(data), ref = useRef(null), w = useWidth(ref, 320);
    const [scope, setScope] = useState('place'), [metric, setMetric] = useState(null);
    if (!place) return html`<${Card} title=${props.title} icon="alert-triangle"><${EmptyState} icon="cloud" title="Keine Wetterdaten" text="Für diesen Ort liegen gerade keine Daten vor." /><//>`;
    const now = stamp(ctx.today), list = alertsOf(place, data.places, scope, now), sel = pick(list, ctx), U = unitsOf(settingsOf(data));
    const filter = props.allowAllPlaces && html`<div class="tk-wxal__chips" role="group" aria-label="Orte">${[['place', place.name], ['all', 'Alle Orte']].map(([k, l]) => html`<button type="button" class="tk-chip" aria-pressed=${scope === k ? 'true' : 'false'} onClick=${() => setScope(k)}>${l}</button>`)}</div>`;
    if (!list.length) return html`<${Card} title=${props.title} icon="shield-check">${filter}<${EmptyState} icon="shield-check" title="Keine Warnungen" text=${`Für ${scope === 'all' ? 'deine gemerkten Orte' : place.name} liegen aktuell keine amtlichen Warnungen vor. Stand ${hm(place.updated)} Uhr.`} /><//>`;
    const t0 = new Date(`${dkey(now)}T00:00:00`).getTime(), pos = (iso) => Math.min(1, Math.max(0, (new Date(iso).getTime() - t0) / (SPAN * H)));
    const m = metric || (props.metric !== 'auto' ? props.metric : AUTO[(sel || list[0]).kind] || 'gust');
    const hrs = place.hours.filter((h) => h.time >= stamp(new Date(t0)) && new Date(h.time).getTime() < t0 + SPAN * H);
    const val = (h) => (m === 'gust' ? U.wn(h.gust) : m === 'temp' ? U.tn(h.temp) : h.precip || 0);
    const unit = m === 'gust' ? U.wu : m === 'temp' ? U.tUnit : 'mm';
    const CH = 150, top = 22, vals = hrs.map(val), lo = m === 'precip' ? 0 : Math.min(...vals), hi = Math.max(...vals, lo + 1), y = (v) => top + (CH - top - 10) * (1 - (v - lo) / (hi - lo));
    const pts = vals.map((v, i) => [((i + 0.5) / SPAN) * w, y(v)]), peak = vals.indexOf(Math.max(...vals)), px = pts[peak]?.[0] ?? 0;
    const path = curve(pts), nowX = pos(now) * w, day = (n) => dayName(new Date(t0 + n * 24 * H), ctx.today);
    const pick1 = (a) => { ctx.setUi('alertSel', a.id); ctx.emit('weather.alert.open', { id: a.id }); };
    const hit = sel ? impact(sel, data.events, data.venues) : [], st = sel && status(sel, ctx.today);
    return html`<${Card} title=${props.title} icon="alert-triangle">${filter}<div style="margin-bottom:var(--tk-space-3)"><${Segmented} label="Verlauf im Hintergrund" value=${m} onChange=${(v) => { setMetric(v); ctx.emit('weather.alert.metric', { metric: v }); }} options=${Object.entries(METRIC).map(([value, label]) => ({ value, label }))} /></div>
      <div ref=${ref}><svg class="tk-wxal__chart" width=${w} height=${CH} viewBox=${`0 0 ${w} ${CH}`} role="img" aria-label=${`Warnzeiträume der nächsten 72 Stunden mit Verlauf ${METRIC[m]}. Höchstwert ${vals[peak]} ${unit}.`}>
        <rect x=${w / 3} y="0" width=${w / 3} height=${CH} fill="var(--tk-c-surface2)" />
        ${list.map((a) => html`<rect x=${pos(a.from) * w} y="0" width=${Math.max(3, (pos(a.to) - pos(a.from)) * w)} height=${CH} fill=${LV[a.level].color} opacity=${a.id === sel?.id ? 0.24 : 0.1} />`)}
        <path d=${`${path} L${pts[pts.length - 1][0].toFixed(1)},${CH} L${pts[0][0].toFixed(1)},${CH} Z`} fill="var(--tk-c-accent)" opacity=".13" /><path d=${path} fill="none" stroke="var(--tk-c-accent)" stroke-width="2" stroke-linejoin="round" />
        ${[1, 2].map((n) => html`<line x1=${(w / 3) * n} x2=${(w / 3) * n} y1="0" y2=${CH} stroke="var(--tk-c-border-strong)" stroke-dasharray="3 3" />`)}
        ${[0, 1, 2].map((n) => html`<text x=${(w / 3) * n + 6} y="14" font-weight="600">${day(n)}</text>`)}
        <circle cx=${px} cy=${pts[peak]?.[1] ?? 0} r="4" fill="var(--tk-c-accent)" stroke="var(--tk-c-surface)" stroke-width="2" /><text x=${px} y=${Math.max(top + 12, (pts[peak]?.[1] ?? 0) - 9)} text-anchor=${px < w * 0.18 ? 'start' : px > w * 0.82 ? 'end' : 'middle'} font-weight="600" style="fill:var(--tk-c-text)">${vals[peak]} ${unit}</text>
        <line x1=${nowX} x2=${nowX} y1="0" y2=${CH} stroke="var(--tk-c-text)" stroke-width="2" /><circle cx=${nowX} cy="4" r="3.5" fill="var(--tk-c-text)" /></svg>
        <div style="margin-top:6px" role="group" aria-label="Warnungen">${list.map((a) => { const l = pos(a.from) * 100, r = pos(a.to) * 100, wd = Math.max(r - l, 0.1), right = l + wd / 2 > 55;
          return html`<button type="button" class="tk-wxal__lane" style=${`${sty(a)};--bl:min(${l}%, calc(100% - 44px))`} aria-pressed=${a.id === sel?.id ? 'true' : 'false'} aria-label=${`${a.short}, ${LV[a.level].short}, ${when(a, ctx.today)}`} onClick=${() => pick1(a)}>
            <span class="tk-wxal__bar" style=${`width:${wd}%`}><${Icon} name=${KIND_ICON[a.kind] || 'alert-triangle'} size=${18} /></span>
            <span class="tk-wxal__lbl" style=${right ? 'right:calc(100% - var(--bl) + 8px);text-align:right;align-items:flex-end' : `left:calc(var(--bl) + max(${wd}%, 44px) + 8px)`}><strong>${a.short}${a.placeName ? ` · ${a.placeName}` : ''}</strong><span>${LV[a.level].short} · ${hm(a.from)}–${hm(a.to)} Uhr</span></span></button>`; })}</div></div>
      ${sel && html`<div class="tk-wxal__detail" style=${sty(sel)} aria-live="polite"><div class="tk-wxal__dh"><span class="tk-wxal__ic"><${Icon} name=${KIND_ICON[sel.kind] || 'alert-triangle'} size=${24} /></span>
          <div class="tk-grow" style="min-width:0"><div class="tk-wxal__t">${sel.title}</div><div class="tk-wxal__s" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><${Meter} level=${sel.level} /><span>${LV[sel.level].name}</span></div></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><${Badge} tone=${st.tone}>${st.label}<//><${Badge} icon="clock">${when(sel, ctx.today)}<//>${sel.placeName && html`<${Badge} icon="map-pin">${sel.placeName}<//>`}</div>
        <div style="font-size:var(--tk-fs-md);line-height:1.5">${sel.text}</div>
        ${props.showTips && html`<ul class="tk-wxal__tips" aria-label="Verhaltenstipps">${sel.tips.map((t) => html`<li><${Icon} name="check-circle-2" size=${15} /><span>${t}</span></li>`)}</ul>`}
        <div class="tk-wxal__s" style="display:flex;gap:8px;align-items:flex-start"><${Icon} name="calendar-clock" size=${14} /><span>${hit.length ? html`<strong>Betrifft:</strong> ${hit.map((e) => `${e.title} (${dayName(e.start, ctx.today)} ${hm(e.start)} Uhr)`).join(', ')}` : 'Keine deiner Termine mit Weg im Freien betroffen.'}</span></div>
        <div class="tk-row" style="flex-wrap:wrap;gap:8px"><span class="tk-wxal__s tk-grow">Quelle: ${sel.source} · ausgegeben ${hm(sel.issued)} Uhr · ${sel.area}</span><${Button} size="sm" icon="share-2" onClick=${() => { ctx.emit('weather.alert.share', { id: sel.id }); ctx.toast('Warntext geteilt (Demo)'); }}>Teilen<//></div></div>`}<//>`;
  },
};

// Pfeil in Windrichtung (Rasterkoordinaten); deg = Herkunftsrichtung
const Arrow = ({ x, y, deg, color }) => html`<g transform=${`translate(${x} ${y}) rotate(${(deg + 180) % 360 - 90})`}><path d="M-1.2,0 H1.2 M.4,-.65 L1.2,0 L.4,.65" fill="none" stroke=${color} stroke-width=".24" stroke-linecap="round" stroke-linejoin="round" /></g>`;
const AREA = 'M12.5,8.2 L19,6.6 L24.6,8.8 L25.4,13.4 L22.2,17.6 L15.6,18 L11.8,14 Z';

export const wxAlertMap = {
  id: 'wx-alert-map',
  name: 'Warngebiet (Karte)',
  category: 'Wetter',
  description: 'Schematische Regionskarte mit dem Warngebiet der gewählten Warnung (ctx.ui.alertSel, sonst die wichtigste), Windpfeilen bei Sturm und einer Stufenleiste mit Text. Warnungen an anderen Orten erscheinen als Randmarke außerhalb des Ausschnitts.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Wo gilt es?' }],
  data: [SLOT_PLACE, { slot: 'places', label: 'Alle Orte', default: 'places', shape: 'Ortsbündel[]' }],
  events: ['weather.alert.open'],
  states: ['empty'],
  flutter: { widget: 'WxAlertMap', propMap: {}, events: ['weather.alert.open'] },
  css: ``,
  example: { data: { place: EX.place, places: EX.places } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} icon="map" title="Keine Karte" text="Für diesen Ort liegen keine Wetterdaten vor." />`;
    const now = stamp(ctx.today), list = alertsOf(place, data.places, 'all', now), own = list.filter((x) => !x.placeName), a0 = pick(list, ctx);
    const a = a0 && (own.includes(a0) || ctx.ui.alertSel === a0.id) ? a0 : own[0] || a0;
    if (!a) return html`<${Card} title=${props.title} icon="map"><${EmptyState} icon="shield-check" title="Keine Warnungen" text=${`Für ${place.name} liegen aktuell keine Warngebiete vor.`} /><//>`;
    const local = !a.placeName, col = LV[a.level].color, h = place.hours.find((x) => x.time >= a.from.slice(0, 13)) || place.hours[0], deg = DIR_DEG[h?.windDir] ?? 225;
    return html`<${Card} title=${props.title} icon="map" actions=${html`<${Badge}>${LV[a.level].short}<//>`}><div class="tk-wxam" style=${sty(a)}>
      <div class="tk-wxam__map" role="img" aria-label=${`Warngebiet ${a.area}, ${LV[a.level].short}, ${a.short}`}><svg viewBox=${`0 0 ${GW} ${GH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><${BaseMap} named=${place.id === 'bielefeld'} />
        ${local && html`<path d=${AREA} fill=${col} opacity=".22" /><path d=${AREA} fill="none" stroke=${col} stroke-width=".28" stroke-dasharray=".8 .5" />`}
        ${local && a.kind === 'wind' && [[15, 10.5], [19.5, 9.4], [23, 11.6], [17, 14.6], [21.4, 14.4]].map(([x, y]) => html`<${Arrow} x=${x} y=${y} deg=${deg} color=${col} />`)}
        <${HomeMarker} name=${place.name} /></svg>
        <span class="tk-wxam__chip" style="left:10px;top:10px"><${Icon} name=${KIND_ICON[a.kind] || 'alert-triangle'} size=${14} />${local ? a.area : `${a.placeName}: außerhalb des Ausschnitts`}</span>
        ${!local && html`<span class="tk-wxam__chip" style="right:10px;bottom:10px;border-color:var(--wx-lv)"><${Icon} name="arrow-up" size=${14} />${a.placeName}, ${LV[a.level].short}</span>`}</div>
      <div class="tk-wxal__s">${a.short} · ${local && a.kind === 'wind' ? `Wind aus ${h?.windDir || 'SW'}, ` : ''}Schematische Karte, Gebiet nicht maßstäblich.</div>
      <ul class="tk-wxam__legend" aria-label="Warnstufen">${[1, 2, 3, 4].map((l) => html`<li style=${`--wx-lv:${LV[l].color};--wx-soft:${lvSoft(l)}`} data-on=${l === a.level ? 'true' : 'false'}><${Meter} level=${l} /><span>Stufe ${l} · ${COLOR_NAME[l]}</span></li>`)}</ul></div><//>`;
  },
};
export default [wxAlertTimeline, wxAlertMap];
