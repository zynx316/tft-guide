// Wetter: kompakter Stundenüberblick (wx-hourly-strip) – Karten zum Wischen oder dichte Tabelle
import { html } from '../../../lib/html.js';
import { Card, Icon, Button } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, cond, hm, dkey, dayName, hoursFrom, DIR_DEG, NoPlace, CondIcon, WindArrow, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';

export const wxHourlyStrip = {
  id: 'wx-hourly-strip',
  name: 'Nächste Stunden (kompakt)',
  category: 'Wetter',
  description: 'Die nächsten Stunden auf einen Blick: wischbare Karten (Zeit, Symbol, Temperatur, Regenrisiko) oder dichte Tabelle mit gefühlter Temperatur, Regen und Wind. Antippen öffnet den vollständigen Stundenverlauf.',
  version: '1.2',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['cards', 'table'], default: 'cards' },
    { name: 'count', label: 'Anzahl Stunden', type: 'number', default: 12 },
    { name: 'title', label: 'Titel', type: 'text', default: 'Nächste Stunden' },
    { name: 'linkLabel', label: 'Link-Text (leer = kein Link)', type: 'text', default: 'Stündlich' },
    { name: 'followDay', label: 'Tag aus 10 Tage übernehmen (nur Tabelle)', type: 'boolean', default: false },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.hourly.open'],
  states: ['empty'],
  css: `
  .tk-wxhs__scroll { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:thin; padding-bottom:6px; margin:0 calc(var(--tk-space-1) * -1); padding-left:var(--tk-space-1); }
  .tk-wxhs__card { flex:none; width:68px; display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 4px; min-height:112px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; cursor:pointer; font-variant-numeric:tabular-nums; }
  .tk-wxhs__card:hover { border-color:var(--tk-c-border-strong); } .tk-wxhs__card[data-now="true"] { background:var(--tk-c-accent-soft); border-color:transparent; }
  .tk-wxhs__t { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-wxhs__temp { font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-lg); }
  .tk-wxhs__pop { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); color:var(--tk-c-info); min-height:15px; }
  .tk-wxhs__row { display:grid; grid-template-columns:52px 28px 54px minmax(0,1fr) minmax(0,1.1fr); align-items:center; gap:var(--tk-space-3); width:100%; min-height:44px; padding:4px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; font-variant-numeric:tabular-nums; }
  .tk-wxhs__row:hover { background:var(--tk-c-surface2); } .tk-wxhs__row:last-child { border-bottom:0; }
  .tk-wxhs__day { padding:6px var(--tk-space-4); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); }
  .tk-wxhs__chips { display:flex; gap:6px; overflow-x:auto; padding:var(--tk-space-3) var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); scrollbar-width:thin; }
  .tk-wxhs__w { display:inline-flex; align-items:center; gap:5px; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .bp-mobile .tk-wxhs__row { grid-template-columns:44px 26px 44px minmax(0,1fr) minmax(0,1fr); gap:var(--tk-space-2); padding:4px var(--tk-space-3); min-height:48px; }
  [data-tk-large-text] .tk-wxhs__row, [data-tk-large-text].bp-mobile .tk-wxhs__row, [data-tk-large-text] .bp-mobile .tk-wxhs__row { grid-template-columns:6ch 24px minmax(0,1fr); row-gap:2px; padding-top:8px; padding-bottom:8px; } [data-tk-large-text] .tk-wxhs__row > :nth-child(4) { grid-column:1 / 3; grid-row:2; } [data-tk-large-text] .tk-wxhs__row > :nth-child(5) { grid-column:3; grid-row:2; }`,
  example: { props: { layout: 'table' }, data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} />`;
    const U = unitsOf(settingsOf(data));
    const picked = props.followDay && props.layout === 'table' ? [ctx.ui.selectedDate, ctx.ui.selectedId].find((v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) : null;
    const dayHours = picked ? place.hours.filter((h) => dkey(h.time) === dkey(picked)) : [];
    const byDay = dayHours.length >= 12 && dkey(picked) !== dkey(ctx.today);
    const hrs = byDay ? dayHours : hoursFrom(place, ctx.today, props.count);
    const chips = props.followDay && props.layout === 'table' && html`<div class="tk-wxhs__chips" data-scroll-x role="group" aria-label="Tag wählen"><button type="button" class="tk-chip" aria-pressed=${byDay ? 'false' : 'true'} onClick=${() => ctx.setUi('selectedDate', null)}>Ab jetzt</button>
      ${place.daily.filter((d) => place.hours.some((h) => dkey(h.time) === d.date)).slice(1).map((d) => html`<button type="button" class="tk-chip" aria-pressed=${byDay && dkey(picked) === d.date ? 'true' : 'false'} onClick=${() => { ctx.setUi('selectedDate', d.date); ctx.emit('weather.hourly.day', { date: d.date }); }}>${dayName(d.date, ctx.today)}</button>`)}</div>`;
    const open = (h) => ctx.emit('weather.hourly.open', { time: h?.time, id: h ? dkey(h.time) : undefined });
    const link = props.linkLabel && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => open(hrs[0])}>${props.linkLabel}<//>`;
    if (!hrs.length) return html`<${NoPlace} icon="clock" title="Keine Stundenwerte" text="Für diesen Zeitraum liegen keine Stundenwerte vor." />`;
    if (props.layout === 'table') {
      let last = '';
      return html`<${Card} flush title=${byDay ? `${dayName(dayHours[0].time, ctx.today, true)}, ${dkey(dayHours[0].time).slice(8)}.${dkey(dayHours[0].time).slice(5, 7)}.` : props.title} icon="clock" actions=${link}>${chips}${hrs.map((h, i) => { const d = dkey(h.time), head = d !== last && (i > 0 || false) ? html`<div class="tk-wxhs__day">${dayName(h.time, ctx.today, true)}</div>` : null; last = d; const w = cond(h.code, h.night);
        return html`${head}<button type="button" class="tk-wxhs__row" aria-label=${`${hm(h.time)} Uhr, ${w.label}, ${U.t(h.temp)}`} onClick=${() => open(h)}>
          <span class="tk-muted">${i === 0 && !byDay ? 'Jetzt' : hm(h.time)}</span><${CondIcon} code=${h.code} night=${h.night} size=${20} />
          <span><strong>${U.t(h.temp)}</strong> <span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${U.t(h.feels)}</span></span>
          <span class="tk-wxhs__w" style=${h.pop >= 20 ? 'color:var(--tk-c-info)' : ''}>${h.pop >= 20 ? html`<${Icon} name="droplets" size=${13} />${h.pop} %${ctx.bp === 'mobile' ? '' : ` · ${U.p(h.precip)}`}` : '–'}</span>
          <span class="tk-wxhs__w"><${WindArrow} deg=${DIR_DEG[h.windDir] ?? 225} size=${13} />${U.wn(h.wind)} <span class="tk-subtle">(${U.wn(h.gust)})</span></span></button>`; })}<//>`;
    }
    return html`<${Card} title=${props.title} icon="clock" actions=${link}><div class="tk-wxhs__scroll" data-scroll-x tabindex="0" role="group" aria-label="Nächste Stunden, horizontal scrollbar">
      ${hrs.map((h, i) => html`<button type="button" class="tk-wxhs__card" data-now=${i === 0 ? 'true' : 'false'} aria-label=${`${hm(h.time)} Uhr, ${cond(h.code, h.night).label}, ${U.t(h.temp)}`} onClick=${() => open(h)}>
        <span class="tk-wxhs__t">${i === 0 ? 'Jetzt' : hm(h.time)}</span><${CondIcon} code=${h.code} night=${h.night} size=${24} /><span class="tk-wxhs__temp">${U.t(h.temp)}</span><span class="tk-wxhs__pop">${h.pop >= 20 ? `${h.pop} %` : ''}</span></button>`)}</div><//>`;
  },
};
export default [wxHourlyStrip];
