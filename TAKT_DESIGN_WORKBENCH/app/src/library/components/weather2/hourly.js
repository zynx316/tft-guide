// Wetter: stündlicher Verlauf (wx-hourly) – Temperatur, Niederschlag oder Wind, 48 Stunden, Tageswahl
import { html } from '../../../lib/html.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Card, Icon, Badge } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, cond, hm, dkey, dayName, dateStr, hoursFrom, hoursOfDay, isDate, curve, DIR_DEG, NoPlace, CondIcon, WindArrow, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';

const CH = 128, PAD_T = 30, PAD_B = 10;
const METRICS = [{ value: 'temp', label: 'Temperatur' }, { value: 'precip', label: 'Regen' }, { value: 'wind', label: 'Wind' }];

export const wxHourly = {
  id: 'wx-hourly',
  name: 'Stundenverlauf (Diagramm)',
  category: 'Wetter',
  description: 'Stündlicher Verlauf über 48 Stunden oder für einen gewählten Tag: Temperaturkurve, Niederschlagsbalken oder Windverlauf, mit Symbolen, Regenrisiko, Wind und Tagesgrenzen. Horizontal wischbar, Stunde antippen für Details. Tage ohne Stundenwerte zeigen das Tagesprofil. Liest den Tag aus ctx.ui.selectedId/selectedDate.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Stündlich' },
    { name: 'count', label: 'Stunden ab jetzt', type: 'number', default: 48 },
    { name: 'metric', label: 'Start-Ansicht', type: 'select', options: ['temp', 'precip', 'wind'], default: 'temp' },
    { name: 'showMetricTabs', label: 'Umschalter Temperatur/Regen/Wind', type: 'boolean', default: true },
    { name: 'showDayChips', label: 'Tageswahl', type: 'boolean', default: true },
    { name: 'showDetail', label: 'Detailzeile', type: 'boolean', default: true },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.hour', 'weather.hourly.day', 'weather.hourly.metric'],
  states: ['empty'],
  css: `
  .tk-wxh__chips { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; margin-bottom:var(--tk-space-3); }
  .tk-wxh__detail { display:flex; align-items:center; gap:6px 14px; flex-wrap:wrap; padding:10px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-bottom:var(--tk-space-3); min-height:46px; }
  .tk-wxh__detail strong { color:var(--tk-c-text); } .tk-wxh__detail span { display:inline-flex; align-items:center; gap:5px; }
  .tk-wxh__scroll { overflow-x:auto; scrollbar-width:thin; margin:0 calc(var(--tk-space-2) * -1); padding-bottom:6px; }
  .tk-wxh__inner { position:relative; width:calc(var(--n) * var(--w) * 1px); }
  .tk-wxh__row { display:flex; } .tk-wxh__cell { width:calc(var(--w) * 1px); flex:none; display:flex; flex-direction:column; align-items:center; justify-content:center; font-variant-numeric:tabular-nums; }
  .tk-wxh__cell[data-day="1"] { box-shadow:inset 1px 0 0 var(--tk-c-border-strong); }
  .tk-wxh__band { height:22px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); }
  .tk-wxh__band > span { position:sticky; left:var(--tk-space-2); white-space:nowrap; }
  .tk-wxh__time { height:24px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-wxh__icon { height:34px; } .tk-wxh__pop { height:22px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); color:var(--tk-c-info); }
  .tk-wxh__wind { height:44px; gap:2px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-wxh__wind small { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wxh__svg { display:block; position:absolute; left:0; top:0; }
  .tk-wxh__cols { position:absolute; inset:0; display:flex; pointer-events:none; }
  .tk-wxh__col { width:calc(var(--w) * 1px); flex:none; border:0; background:transparent; padding:0; cursor:pointer; pointer-events:auto; border-radius:var(--tk-radius-md); }
  .tk-wxh__col:hover { background:color-mix(in srgb, var(--tk-c-text) 5%, transparent); }
  .tk-wxh__col[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-wxh__parts { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-wxh__part { display:flex; flex-direction:column; align-items:center; gap:6px; padding:var(--tk-space-4) var(--tk-space-2); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); }
  .bp-mobile .tk-wxh__parts { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-wxh__legend { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); margin-top:6px; }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    const fromUi = [ctx.ui.selectedDate, ctx.ui.selectedId].find(isDate);
    const [day, setDay] = useState(fromUi ? dkey(fromUi) : 'now');
    const [metric, setMetric] = useState(props.metric);
    const [sel, setSel] = useState(0);
    const sc = useRef(null);
    useEffect(() => { if (sc.current) sc.current.scrollLeft = 0; setSel(0); }, [day]);
    if (!place) return html`<${NoPlace} />`;
    const U = unitsOf(settingsOf(data)), W = ctx.bp === 'mobile' ? 48 : 54;
    const hrs = day === 'now' ? hoursFrom(place, ctx.today, props.count) : hoursOfDay(place, day);
    const dayInfo = place.daily.find((d) => d.date === day);
    const chips = props.showDayChips && html`<div class="tk-wxh__chips" data-scroll-x role="group" aria-label="Tag wählen"><button type="button" class="tk-chip" aria-pressed=${day === 'now' ? 'true' : 'false'} onClick=${() => { setDay('now'); ctx.setUi('selectedDate', null); }}>Ab jetzt</button>
      ${place.daily.map((d) => html`<button type="button" class="tk-chip" aria-pressed=${day === d.date ? 'true' : 'false'} onClick=${() => { setDay(d.date); ctx.setUi('selectedDate', d.date); ctx.emit('weather.hourly.day', { date: d.date }); }}>${dayName(d.date, ctx.today)}</button>`)}</div>`;
    const tabs = props.showMetricTabs && html`<div class="tk-seg" role="tablist" aria-label="Darstellung" style="margin-bottom:var(--tk-space-3)">${METRICS.map((m) => html`<button type="button" role="tab" aria-selected=${metric === m.value ? 'true' : 'false'} onClick=${() => { setMetric(m.value); ctx.emit('weather.hourly.metric', { metric: m.value }); }}>${m.label}</button>`)}</div>`;
    if (!hrs.length) {
      if (!dayInfo) return html`<${Card} title=${props.title} icon="clock">${chips}<${NoPlace} card=${false} icon="clock" title="Keine Stundenwerte" text="Für diesen Zeitraum liegen keine Stundenwerte vor." /><//>`;
      return html`<${Card} title=${props.title} icon="clock">${chips}<p class="tk-muted" style="margin:0 0 var(--tk-space-3)"><strong style="color:var(--tk-c-text)">${dateStr(dayInfo.date)}</strong> · ${dayInfo.text}</p>
        <div class="tk-wxh__parts">${dayInfo.parts.map((p) => html`<div class="tk-wxh__part"><span class="tk-muted" style="font-size:var(--tk-fs-sm)">${p.label}</span><${CondIcon} code=${p.code} size=${26} /><strong class="tk-num" style="font-size:var(--tk-fs-xl)">${U.t(p.temp)}</strong></div>`)}</div>
        <div class="tk-wxh__legend">Für diesen Tag gibt es noch keine Stundenwerte (verfügbar: 5 Tage). Das Tagesprofil zeigt Morgen, Mittag, Abend und Nacht.</div><//>`;
    }
    const n = hrs.length, temps = hrs.map((h) => h.temp), tmin = Math.min(...temps), tmax = Math.max(...temps);
    const cur = hrs[Math.min(sel, n - 1)], cw = cond(cur.code, cur.night);
    const x = (i) => i * W + W / 2;
    const yT = (t) => PAD_T + (1 - (t - tmin) / (tmax - tmin || 1)) * (CH - PAD_T - PAD_B);
    const maxMm = Math.max(1, ...hrs.map((h) => h.precip)), maxW = Math.max(30, ...hrs.map((h) => h.gust));
    let svg;
    if (metric === 'temp') {
      const pts = hrs.map((h, i) => [x(i), yT(h.temp)]), line = curve(pts);
      svg = html`<path d=${`${line} L${x(n - 1)},${CH} L${x(0)},${CH} Z`} fill="color-mix(in srgb, var(--tk-c-accent) 14%, transparent)" /><path d=${line} fill="none" stroke="var(--tk-c-accent)" stroke-width="2.4" stroke-linecap="round" />
        ${hrs.map((h, i) => html`<circle cx=${x(i)} cy=${yT(h.temp)} r=${i === sel ? 5 : 3} fill=${i === sel ? 'var(--tk-c-accent)' : 'var(--tk-c-surface)'} stroke="var(--tk-c-accent)" stroke-width="2" /><text x=${x(i)} y=${yT(h.temp) - 11} text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--tk-c-text)">${U.tn(h.temp)}°</text>`)}`;
    } else if (metric === 'precip') {
      svg = html`${hrs.map((h, i) => { const bh = (h.precip / maxMm) * (CH - PAD_T - PAD_B); return html`<rect x=${x(i) - 11} y=${CH - PAD_B - Math.max(h.precip > 0 ? 3 : 0, bh)} width="22" height=${Math.max(h.precip > 0 ? 3 : 0, bh)} rx="4" fill="var(--tk-c-info)" opacity=${h.precip >= 0.2 ? 0.95 : 0.55} />${h.precip > 0 && html`<text x=${x(i)} y=${CH - PAD_B - Math.max(3, bh) - 6} text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--tk-c-text)">${fmtMm(U, h.precip)}</text>`}`; })}
        <line x1="0" x2=${n * W} y1=${CH - PAD_B} y2=${CH - PAD_B} stroke="var(--tk-c-border)" />`;
    } else {
      const yW = (v) => PAD_T + (1 - v / maxW) * (CH - PAD_T - PAD_B), pts = hrs.map((h, i) => [x(i), yW(h.wind)]), line = curve(pts);
      svg = html`<path d=${`${line} L${x(n - 1)},${CH - PAD_B} L${x(0)},${CH - PAD_B} Z`} fill="color-mix(in srgb, var(--tk-c-accent2) 14%, transparent)" /><path d=${line} fill="none" stroke="var(--tk-c-accent2)" stroke-width="2.4" />
        ${hrs.map((h, i) => html`<circle cx=${x(i)} cy=${yW(h.gust)} r="3" fill="var(--tk-c-warning)" /><text x=${x(i)} y=${yW(h.wind) + 15} text-anchor="middle" font-size="12" font-weight="600" fill="var(--tk-c-text)">${U.wn(h.wind)}</text>`)}`;
    }
    const groups = []; hrs.forEach((h, i) => { const k = dkey(h.time); if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, i, n: 0 }); groups[groups.length - 1].n++; });
    const cell = (h, i, inner, cls = '') => html`<div class=${`tk-wxh__cell ${cls}`} data-day=${hm(h.time) === '00:00' && i ? '1' : '0'}>${inner}</div>`;
    return html`<${Card} title=${props.title} icon="clock" actions=${day === 'now' ? html`<${Badge}>${n} Std.<//>` : dayInfo && html`<${Badge}>${dateStr(day)}<//>`}>${chips}${tabs}
      ${props.showDetail && html`<div class="tk-wxh__detail" aria-live="polite"><strong>${dayName(cur.time, ctx.today)} ${hm(cur.time)} Uhr</strong><span><${Icon} name=${cw.icon} size=${15} />${cw.label}</span><strong>${U.t(cur.temp)}</strong><span>gefühlt ${U.t(cur.feels)}</span>
        <span><${WindArrow} deg=${DIR_DEG[cur.windDir] ?? 225} size=${13} />${U.w(cur.wind)} · Böen ${U.w(cur.gust)}</span><span><${Icon} name="umbrella" size=${14} />${U.p(cur.precip)} · ${cur.pop} %</span><span><${Icon} name="droplets" size=${14} />${cur.humidity} %</span></div>`}
      <div class="tk-wxh__scroll" data-scroll-x tabindex="0" ref=${sc} role="group" aria-label="Stundenverlauf, horizontal scrollbar">
        <div class="tk-wxh__inner" style=${`--n:${n};--w:${W}`}>
          <div class="tk-wxh__row tk-wxh__band">${groups.map((g) => html`<div style=${`width:${g.n * W}px;flex:none;box-shadow:${g.i ? 'inset 1px 0 0 var(--tk-c-border-strong)' : 'none'};padding-left:var(--tk-space-2)`}><span>${dayName(g.k, ctx.today)} · ${dateStr(g.k)}</span></div>`)}</div>
          <div class="tk-wxh__row">${hrs.map((h, i) => cell(h, i, day === 'now' && i === 0 ? html`<strong style="color:var(--tk-c-text)">Jetzt</strong>` : hm(h.time).slice(0, 2), 'tk-wxh__time'))}</div>
          <div class="tk-wxh__row">${hrs.map((h, i) => cell(h, i, html`<${CondIcon} code=${h.code} night=${h.night} size=${22} />`, 'tk-wxh__icon'))}</div>
          <div style=${`position:relative;height:${CH}px`}><svg class="tk-wxh__svg" width=${n * W} height=${CH} viewBox=${`0 0 ${n * W} ${CH}`} aria-hidden="true">${svg}</svg></div>
          <div class="tk-wxh__row">${hrs.map((h, i) => cell(h, i, h.pop >= 20 ? `${h.pop} %` : '', 'tk-wxh__pop'))}</div>
          <div class="tk-wxh__row">${hrs.map((h, i) => cell(h, i, html`<${WindArrow} deg=${DIR_DEG[h.windDir] ?? 225} size=${13} /><span>${U.wn(h.wind)}</span>`, 'tk-wxh__wind'))}</div>
          <div class="tk-wxh__cols">${hrs.map((h, i) => html`<button type="button" class="tk-wxh__col" aria-pressed=${i === sel ? 'true' : 'false'} aria-label=${`${hm(h.time)} Uhr, ${cond(h.code, h.night).label}, ${U.t(h.temp)}`} onClick=${() => { setSel(i); ctx.emit('weather.hour', { time: h.time }); }}></button>`)}</div>
        </div></div>
      <div class="tk-wxh__legend">${metric === 'temp' ? `Temperatur in ${U.tUnit}` : metric === 'precip' ? `Niederschlag je Stunde (${U.raw.precip === 'in' ? 'in' : 'mm'})` : `Wind in ${U.wu}, orange Punkte = Böen`} · % = Regenrisiko · Wind: Richtung und Geschwindigkeit</div><//>`;
  },
};
const fmtMm = (U, v) => (U.raw.precip === 'in' ? (v / 25.4).toFixed(2).replace('.', ',') : v >= 1 || v % 1 === 0 ? String(Math.round(v * 10) / 10).replace('.', ',') : v.toFixed(1).replace('.', ','));
export default [wxHourly];
