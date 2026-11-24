// Wetter: Tagesverlauf mit Terminen (wx-day-timeline) – Wetter je Stunde neben dem Kalender des Tages
import { html } from '../../../lib/html.js';
import { Card, Icon, Badge } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, hoursOfDay, dkey, hm, stamp, LV, lvSoft, KIND_ICON, NoPlace, CondIcon, SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, EX } from './_weather2.js';
import { tripAdvice, modeIcon } from './_advice.js';

export const wxDayTimeline = {
  id: 'wx-day-timeline',
  name: 'Tag mit Terminen & Wetter',
  category: 'Wetter',
  description: 'Der Tag Stunde für Stunde: Wetter (Symbol, Temperatur, Regen, Böen) neben den Terminen aus dem Kalender. Warnzeiträume sind hinterlegt, Termine mit Weg zeigen Hinweise („vor dem Sturm erledigt“). Zeigt, wann draußen was geht.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dein Tag mit Wetter' },
    { name: 'fromHour', label: 'Von (Uhr)', type: 'number', default: 8 },
    { name: 'toHour', label: 'Bis (Uhr)', type: 'number', default: 22 },
    { name: 'gustFrom', label: 'Böen anzeigen ab (km/h)', type: 'number', default: 45 },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, { slot: 'venues', label: 'Wege zu Orten', default: 'venues', shape: '{ [ort]: {mode,min,outdoor} }' }],
  events: ['weather.advice.open', 'weather.hourly.open'],
  states: ['empty'],
  css: `
  .tk-wxt { position:relative; } .tk-wxt__row { position:relative; display:grid; grid-template-columns:44px 104px minmax(0,1fr); gap:var(--tk-space-3); align-items:stretch; min-height:56px; border-top:1px solid var(--tk-c-border); padding:6px 0; }
  .tk-wxt__row[data-alert="true"] { background:var(--wx-soft); margin:0 calc(var(--tk-space-4) * -1); padding-left:var(--tk-space-4); padding-right:var(--tk-space-4); }
  .tk-wxt__time { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; padding-top:6px; }
  .tk-wxt__wx { display:flex; align-items:center; gap:8px; font-variant-numeric:tabular-nums; } .tk-wxt__wx strong { font-size:var(--tk-fs-md); }
  .tk-wxt__sub { display:flex; flex-direction:column; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); line-height:1.3; }
  .tk-wxt__ev { display:flex; flex-direction:column; gap:3px; padding:8px 12px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); border-left:4px solid var(--wx-ev); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; width:100%; min-height:44px; }
  .tk-wxt__ev:hover { border-color:var(--tk-c-border-strong); border-left-color:var(--wx-ev); } .tk-wxt__evt { font-weight:var(--tk-fw-semibold); }
  .tk-wxt__tip { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:flex; gap:6px; align-items:flex-start; }
  .tk-wxt__now { position:absolute; left:0; right:0; height:0; border-top:2px solid var(--tk-c-accent); z-index:2; pointer-events:none; } .tk-wxt__now span { position:absolute; right:0; top:-11px; padding:2px 8px; border-radius:var(--tk-radius-pill); background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); }
  .tk-wxt__alert { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); }
  .bp-mobile .tk-wxt__row { grid-template-columns:38px 92px minmax(0,1fr); gap:var(--tk-space-2); }`,
  example: { data: { place: EX.place, settings: EX.settings, events: EX.events, venues: EX.venues } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} />`;
    const U = unitsOf(settingsOf(data)), date = dkey(stamp(ctx.today)), hrs = hoursOfDay(place, date);
    if (hrs.length < 24) return html`<${NoPlace} icon="clock" title="Kein Tagesverlauf" text="Für diesen Tag liegen keine Stundenwerte vor." />`;
    const evs = (data.events || []).filter((e) => !e.allDay && dkey(e.start) === date).sort((a, b) => a.start.localeCompare(b.start));
    const allDay = (data.events || []).filter((e) => e.allDay && e.start <= date && (e.end || e.start) >= date);
    const trips = Object.fromEntries(tripAdvice(evs, [], data.venues, place, ctx.today, 24, place.alerts).map((t) => [t.id, t]));
    const alerts = (place.alerts || []).filter((a) => a.level >= 2 && dkey(a.from) <= date && dkey(a.to) >= date);
    const nowH = ctx.today.getHours(), nowFrac = ctx.today.getMinutes() / 60;
    const rows = hrs.filter((h) => +hm(h.time).slice(0, 2) >= props.fromHour && +hm(h.time).slice(0, 2) < props.toHour);
    const open = (id) => ctx.emit('weather.advice.open', { id });
    return html`<${Card} title=${props.title} icon="calendar-clock" actions=${html`<${Badge}>${evs.length} Termine<//>`}>
      ${allDay.length > 0 && html`<div class="tk-row" style="gap:6px;margin-bottom:var(--tk-space-3);flex-wrap:wrap">${allDay.map((e) => html`<${Badge} tone="accent" icon="calendar">${e.title}<//>`)}</div>`}
      <div class="tk-wxt" role="list">${rows.map((h) => { const H = +hm(h.time).slice(0, 2), here = evs.filter((e) => +hm(e.start).slice(0, 2) === H);
        const rs = `${date}T${String(H).padStart(2, '0')}:00:00`, re = H >= 23 ? `${date}T23:59:59` : `${date}T${String(H + 1).padStart(2, '0')}:00:00`;
        const al = alerts.find((a) => a.from < re && a.to > rs);
        const first = al && (H === +hm(al.from).slice(0, 2) || H === props.fromHour);
        return html`<div class="tk-wxt__row" role="listitem" data-alert=${al ? 'true' : 'false'} style=${al ? `--wx-soft:${lvSoft(al.level)}` : ''}>
          ${H === nowH && html`<div class="tk-wxt__now" style=${`top:${nowFrac * 100}%`}><span>Jetzt ${hm(stamp(ctx.today))}</span></div>`}
          <div class="tk-wxt__time">${String(H).padStart(2, '0')}:00</div>
          <div class="tk-wxt__wx"><${CondIcon} code=${h.code} night=${h.night} size=${22} /><div><strong>${U.t(h.temp)}</strong><span class="tk-wxt__sub">${h.precip >= 0.1 ? html`<span style="color:var(--tk-c-info)">${U.p(h.precip)}</span>` : ''}${h.gust >= props.gustFrom ? html`<span style="color:var(--tk-c-warning)">Böen ${U.wn(h.gust)}</span>` : ''}</span></div></div>
          <div class="tk-col" style="gap:6px;min-width:0">${first && html`<div class="tk-wxt__alert" style=${`color:${LV[al.level].color}`}><${Icon} name=${KIND_ICON[al.kind] || 'alert-triangle'} size=${16} /><span style="color:var(--tk-c-text)">${al.short}${H === +hm(al.from).slice(0, 2) ? ` ab ${hm(al.from)}` : ' (läuft)'}</span></div>`}
            ${here.map((e) => { const t = trips[e.id]; const tone = !t ? 'accent' : t.verdict === 'bad' ? 'danger' : t.verdict === 'warn' ? 'warning' : 'success';
              return html`<button type="button" class="tk-wxt__ev" style=${`--wx-ev:var(--tk-c-${tone})`} onClick=${() => open(e.id)}><span class="tk-wxt__evt">${e.title}</span><span class="tk-muted" style="font-size:var(--tk-fs-sm)">${hm(e.start)}–${hm(e.end)}${e.location ? ` · ${e.location}` : ''}</span>
                ${t && html`<span class="tk-wxt__tip"><${Icon} name=${modeIcon(t.mode)} size=${14} /><span>${t.tips[0]}</span></span>`}</button>`; })}</div></div>`; })}</div><//>`;
  },
};
export default [wxDayTimeline];
