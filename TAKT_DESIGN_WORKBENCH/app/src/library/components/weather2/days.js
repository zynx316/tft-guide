// Wetter: 10-Tage-Vorhersage (wx-days) und Tagesdetail (wx-day-detail)
import { html } from '../../../lib/html.js';
import { Card, Icon, Button } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, cond, dkey, dayName, dateStr, isDate, NoPlace, CondIcon, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';

const selOf = (ctx, place) => { const v = [ctx.ui.selectedDate, ctx.ui.selectedId].find(isDate); return v ? dkey(v) : place.daily[0]?.date; };

export const wxDays = {
  id: 'wx-days',
  name: '10-Tage-Vorhersage',
  category: 'Wetter',
  description: 'Zehn Tage mit Symbol, Regenrisiko, Min/Max-Balken über den gesamten Zeitraum, Frost- und Sturm-Hinweis. Als Liste oder wischbare Kacheln. Antippen: Stundenverlauf des Tages öffnen (navigate), Tag nur auswählen (detail) oder zur 10-Tage-Ansicht springen (open).',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['list', 'tiles'], default: 'list' },
    { name: 'mode', label: 'Antippen', type: 'select', options: ['navigate', 'detail', 'open'], default: 'navigate' },
    { name: 'days', label: 'Anzahl Tage', type: 'number', default: 10 },
    { name: 'title', label: 'Titel', type: 'text', default: '10 Tage' },
    { name: 'linkLabel', label: 'Link-Text (leer = kein Link)', type: 'text', default: '' },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.day', 'weather.day.select', 'weather.daily.open'],
  states: ['empty'],
  css: `
  .tk-wxd__row { display:grid; grid-template-columns:78px 30px 64px minmax(0,1fr) 38px; align-items:center; gap:var(--tk-space-3); width:100%; min-height:56px; padding:6px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxd__row:last-child { border-bottom:0; } .tk-wxd__row:hover { background:var(--tk-c-surface2); } .tk-wxd__row[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-wxd__name { font-weight:var(--tk-fw-semibold); } .tk-wxd__date { display:block; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-regular); color:var(--tk-c-text-muted); }
  .tk-wxd__pop { display:inline-flex; align-items:center; gap:3px; font-size:var(--tk-fs-sm); color:var(--tk-c-info); font-variant-numeric:tabular-nums; min-height:18px; }
  .tk-wxd__range { display:grid; grid-template-columns:34px minmax(0,1fr) 34px; align-items:center; gap:10px; font-variant-numeric:tabular-nums; }
  .tk-wxd__min { color:var(--tk-c-text-muted); text-align:right; } .tk-wxd__max { font-weight:var(--tk-fw-semibold); }
  .tk-wxd__track { position:relative; height:7px; border-radius:4px; background:var(--tk-c-surface3); } .tk-wxd__fill { position:absolute; top:0; bottom:0; border-radius:4px; background:linear-gradient(90deg, var(--tk-c-info), var(--tk-c-warning)); }
  .tk-wxd__flags { display:flex; gap:4px; justify-content:flex-end; } .tk-wxd__flags span { display:inline-flex; }
  .bp-mobile .tk-wxd__row { grid-template-columns:54px 26px 50px minmax(0,1fr) 22px; gap:var(--tk-space-2); padding:6px var(--tk-space-3); min-height:58px; } .bp-mobile .tk-wxd__range { grid-template-columns:30px minmax(0,1fr) 30px; gap:8px; }
  .tk-wxd__scroll { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:thin; padding-bottom:6px; }
  .tk-wxd__tile { flex:none; width:82px; display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 6px; min-height:132px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; cursor:pointer; font-variant-numeric:tabular-nums; }
  .tk-wxd__tile:hover { border-color:var(--tk-c-border-strong); } .tk-wxd__tile[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-wxdd__grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-3); } .bp-mobile .tk-wxdd__grid { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-wxdd__cell { display:flex; flex-direction:column; align-items:center; gap:6px; padding:var(--tk-space-3); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); text-align:center; min-width:0; }
  .tk-wxdd__m { display:flex; flex-direction:column; gap:3px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); min-width:0; }
  .tk-wxdd__m small { font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); } .tk-wxdd__m strong { font-size:var(--tk-fs-lg); }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place || !place.daily?.length) return html`<${NoPlace} icon="calendar-days" title="Keine Vorhersage" text="Die Tagesvorhersage ist gerade nicht verfügbar." />`;
    const U = unitsOf(settingsOf(data)), days = place.daily.slice(0, props.days), sel = selOf(ctx, place);
    const lo = Math.min(...days.map((d) => d.min)), hi = Math.max(...days.map((d) => d.max)), rg = hi - lo || 1;
    const pick = (d) => {
      if (props.mode === 'navigate') ctx.emit('weather.day', { id: d.date, date: d.date });
      else if (props.mode === 'open') ctx.emit('weather.daily.open', { id: d.date, date: d.date });
      else { ctx.setUi('selectedDate', d.date); ctx.emit('weather.day.select', { date: d.date }); }
    };
    const link = props.linkLabel && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('weather.daily.open', { id: days[0].date })}>${props.linkLabel}<//>`;
    const aria = (d) => `${dayName(d.date, ctx.today, true)}, ${cond(d.code).label}, ${U.t(d.min)} bis ${U.t(d.max)}, Regenrisiko ${d.pop} Prozent`;
    if (props.layout === 'tiles') return html`<${Card} title=${props.title} icon="calendar-days" actions=${link}><div class="tk-wxd__scroll" data-scroll-x tabindex="0" role="group" aria-label="Tage, horizontal scrollbar">
      ${days.map((d) => html`<button type="button" class="tk-wxd__tile" aria-pressed=${d.date === sel && props.mode === 'detail' ? 'true' : 'false'} aria-label=${aria(d)} onClick=${() => pick(d)}>
        <strong>${dayName(d.date, ctx.today)}</strong><span class="tk-muted" style="font-size:var(--tk-fs-xs)">${dateStr(d.date).slice(4)}</span><${CondIcon} code=${d.code} size=${28} /><strong style="font-size:var(--tk-fs-lg)">${U.t(d.max)}</strong><span class="tk-muted">${U.t(d.min)}</span>
        <span class="tk-wxd__pop">${d.pop >= 20 ? html`<${Icon} name="droplets" size=${12} />${d.pop} %` : ''}</span></button>`)}</div><//>`;
    return html`<${Card} flush title=${props.title} icon="calendar-days" actions=${link}>${days.map((d) => { const l = ((d.min - lo) / rg) * 100, r = ((d.max - lo) / rg) * 100;
      return html`<button type="button" class="tk-wxd__row" aria-pressed=${d.date === sel && props.mode === 'detail' ? 'true' : 'false'} aria-label=${aria(d)} onClick=${() => pick(d)}>
        <span class="tk-wxd__name">${dayName(d.date, ctx.today)}<span class="tk-wxd__date">${dateStr(d.date).slice(4)}</span></span><${CondIcon} code=${d.code} size=${22} />
        <span class="tk-wxd__pop">${d.pop >= 20 ? html`<${Icon} name="droplets" size=${12} />${d.pop} %` : html`<span class="tk-subtle">–</span>`}</span>
        <span class="tk-wxd__range"><span class="tk-wxd__min">${U.t(d.min)}</span><span class="tk-wxd__track"><span class="tk-wxd__fill" style=${`left:${l}%;width:${Math.max(r - l, 8)}%`}></span></span><span class="tk-wxd__max">${U.t(d.max)}</span></span>
        <span class="tk-wxd__flags">${d.min < 0 && html`<span style="color:var(--tk-c-info)" title="Frost"><${Icon} name="snowflake" size=${15} /></span>`}${d.gust >= 60 && html`<span style="color:var(--tk-c-warning)" title="Sturmböen"><${Icon} name="wind" size=${15} /></span>`}</span></button>`; })}<//>`;
  },
};

export const wxDayDetail = {
  id: 'wx-day-detail',
  name: 'Tagesdetail',
  category: 'Wetter',
  description: 'Ein Tag im Detail: Zustand, Temperaturspanne, Tagesverlauf in vier Abschnitten, Regen, Wind, UV, Sonnenstunden, Auf- und Untergang. Der Tag kommt aus der 10-Tage-Auswahl (ctx.ui.selectedDate); Button öffnet den Stundenverlauf.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel (leer = Datum)', type: 'text', default: '' },
    { name: 'showAction', label: 'Button „Stundenverlauf“', type: 'boolean', default: true },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.day'],
  states: ['empty'],
  css: ``,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data), d = place && place.daily.find((x) => x.date === selOf(ctx, place));
    if (!d) return html`<${NoPlace} icon="calendar-days" title="Kein Tag gewählt" text="Wähle einen Tag in der Vorhersage." />`;
    const U = unitsOf(settingsOf(data)), w = cond(d.code);
    const m = [['Regen', 'umbrella', `${U.p(d.precip)}`, `Risiko ${d.pop} %`], ['Wind', 'wind', U.w(d.wind), `Böen bis ${U.w(d.gust)}`], ['Sonne', 'sun', `${String(d.sunHours).replace('.', ',')} Std.`, `${d.sunrise} – ${d.sunset} Uhr`], ['UV-Index', 'sun-medium', String(d.uv), d.uv <= 2 ? 'gering' : 'mäßig bis hoch']];
    return html`<${Card} title=${props.title || `${dayName(d.date, ctx.today, true)}, ${dateStr(d.date).slice(4)}`} icon="calendar-days" actions=${props.showAction && html`<${Button} size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('weather.day', { id: d.date, date: d.date })}>Stundenverlauf<//>`}>
      <div class="tk-row" style="gap:var(--tk-space-4);margin-bottom:var(--tk-space-4);align-items:center"><${CondIcon} code=${d.code} size=${34} box=${64} /><div class="tk-grow"><div style="font-size:var(--tk-fs-xl);font-weight:var(--tk-fw-semibold)">${w.label}</div><div class="tk-muted">${d.text}</div></div>
        <div style="text-align:right" class="tk-num"><strong style="font-size:var(--tk-fs-2xl)">${U.t(d.max)}</strong><div class="tk-muted">${U.t(d.min)}</div></div></div>
      <div class="tk-wxdd__grid">${d.parts.map((p) => html`<div class="tk-wxdd__cell"><span class="tk-muted" style="font-size:var(--tk-fs-sm)">${p.label}</span><${CondIcon} code=${p.code} size=${24} night=${p.id === 'nacht'} /><strong class="tk-num">${U.t(p.temp)}</strong></div>`)}</div>
      <div class="tk-wxdd__grid" style="margin-top:var(--tk-space-3)">${m.map(([l, ic, v, s]) => html`<div class="tk-wxdd__m"><small>${l}</small><strong class="tk-num">${v}</strong><span class="tk-muted" style="font-size:var(--tk-fs-sm)">${s}</span></div>`)}</div><//>`;
  },
};
export default [wxDays, wxDayDetail];
