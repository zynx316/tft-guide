// Wetter: Aktivitätsfenster (wx-activity) und Termine & Wege (wx-commute)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Icon, EmptyState } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, hm, dkey, dayName, dateStr, stamp, NoPlace, CondIcon, SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, EX, toneVar, softVar } from './_weather2.js';
import { activityAdvice, ratingOf, scoreTone, tripAdvice, modeIcon } from './_advice.js';

const Strip = ({ cells, today }) => html`<div class="tk-wxac__strip" role="img" aria-label="Eignung für die nächsten 48 Stunden, dunkel = schlecht, hell = gut">${cells.map((c) => html`<i title=${`${hm(c.time)} Uhr · ${c.score}`} style=${`background:color-mix(in srgb, var(--tk-c-${scoreTone(c.score)}) ${Math.max(14, c.score)}%, var(--tk-c-surface3))`}></i>`)}</div>
  <div class="tk-wxac__axis"><span>Jetzt</span><span>+24 Std.</span><span>+48 Std.</span></div>`;

export const wxActivity = {
  id: 'wx-activity',
  name: 'Aktivitätsfenster & Training',
  category: 'Wetter',
  description: 'Wann ist das Wetter wofür gut? Laufen, Radfahren, Spaziergang, Auto waschen, Wäsche trocknen – mit bestem Zeitfenster, Begründung, Eignungsband für 48 Stunden und freien Fenstern ohne Termin. Dazu die geplanten Trainingseinheiten (Fitness) mit Wetter dazu.',
  version: '1.1',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['full', 'compact'], default: 'full' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Aktivitätsfenster' },
    { name: 'showTraining', label: 'Trainingseinheiten zeigen', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Aktivitäten (kompakt)', type: 'number', default: 3 },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, { slot: 'training', label: 'Training', default: 'training', shape: '{id,date,start,end,title,where,outdoor}[]' }],
  events: ['weather.activity.open', 'weather.training.open'],
  states: ['empty'],
  css: `
  .tk-wxac__row { display:flex; align-items:center; gap:var(--tk-space-3); width:100%; min-height:64px; padding:var(--tk-space-3) var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxac__row:hover { background:var(--tk-c-surface2); } .tk-wxac__row[aria-expanded="true"] { background:var(--tk-c-surface2); }
  .tk-wxac__score { flex:none; width:46px; height:46px; border-radius:50%; display:grid; place-items:center; font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; }
  .tk-wxac__t { display:flex; align-items:center; gap:6px; font-weight:var(--tk-fw-semibold); } .tk-wxac__t svg { flex:none; color:var(--tk-c-text-muted); } .tk-wxac__s { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; line-height:1.4; }
  .tk-wxac__more { padding:var(--tk-space-3) var(--tk-space-4) var(--tk-space-4); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-wxac__strip { display:flex; gap:2px; height:22px; } .tk-wxac__strip i { flex:1; border-radius:3px; min-width:2px; }
  .tk-wxac__axis { display:flex; justify-content:space-between; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wxac__days { display:flex; flex-wrap:wrap; gap:6px; } .tk-wxac__day { padding:5px 10px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); font-size:var(--tk-fs-sm); }
  .tk-wxac__tr { display:flex; gap:var(--tk-space-3); align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border-top:1px solid var(--tk-c-border); width:100%; background:transparent; border-left:0; border-right:0; border-bottom:0; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; min-height:56px; }
  .tk-wxac__tr:hover { background:var(--tk-c-surface2); }
  .tk-wxcm__leg { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-wxcm__legs { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-3); }
  .bp-mobile .tk-wxcm__legs { grid-template-columns:1fr; gap:6px; }
  .tk-wxcm__card { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-left:4px solid var(--wx-v); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); width:100%; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxcm__card:hover { border-color:var(--tk-c-border-strong); border-left-color:var(--wx-v); }`,
  example: { data: { place: EX.place, settings: EX.settings, events: EX.events, training: EX.training } },
  render: ({ props, data, ctx }) => {
    const [open, setOpen] = useState(props.layout === 'full' ? 'run' : null);
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} icon="footprints" />`;
    const U = unitsOf(settingsOf(data)), now = stamp(ctx.today);
    const busy = (data.events || []).filter((e) => !e.allDay).map((e) => ({ start: e.start, end: e.end }));
    let acts = activityAdvice(place, ctx.today, U, busy).filter((a) => a.best);
    if (props.layout === 'compact') acts = [...acts].sort((a, b) => b.best.score - a.best.score).slice(0, props.limit);
    if (!acts.length) return html`<${Card} title=${props.title} icon="footprints"><${EmptyState} icon="footprints" title="Keine Fenster" text="Für die nächsten Stunden liegen keine Daten vor." /><//>`;
    const winTxt = (b) => `${dayName(b.start, ctx.today, true)} ${hm(b.start)}–${hm(b.end)} Uhr`;
    const run = acts.find((a) => a.id === 'run') || activityAdvice(place, ctx.today, U, busy)[0];
    const tr = (data.training || []).filter((t) => t.date >= dkey(now)).slice(0, 4).map((t) => {
      if (t.outdoor && !t.start) { const d = run.days.find((x) => x.date === t.date); return { t, text: d ? `Bestes Fenster ${hm(d.best.start)}–${hm(d.best.end)} Uhr: ${d.best.reason}` : 'Noch keine Stundenwerte für diesen Tag', tone: d ? scoreTone(d.best.score) : 'neutral', icon: 'footprints' }; }
      if (t.externalPlace) return { t, text: `Wetter für ${t.where} ist nicht gespeichert. Ort hinzufügen, um die Prognose zu sehen.`, tone: 'neutral', icon: 'mountain' };
      const trip = tripAdvice([], [t], data.venues || EX.venues, place, ctx.today, 168, place.alerts)[0];
      return { t, text: trip ? trip.tips[0] : 'Indoor – Wetter egal', tone: trip ? (trip.verdict === 'ok' ? 'success' : 'warning') : 'neutral', icon: 'dumbbell' };
    });
    const rows = acts.map((a) => { const b = a.best, tone = scoreTone(b.score), o = open === a.id;
      return html`<button type="button" class="tk-wxac__row" aria-expanded=${o ? 'true' : 'false'} onClick=${() => { setOpen(o ? null : a.id); ctx.emit('weather.activity.open', { id: a.id }); }}>
        <span class="tk-wxac__score" style=${`background:${softVar(tone)};color:${toneVar(tone)}`}>${b.score}</span>
        <span class="tk-grow"><span class="tk-wxac__t"><${Icon} name=${a.icon} size=${15} /> ${a.label}</span><span class="tk-wxac__s" style="display:block">${winTxt(b)}${props.layout === 'full' ? ` · ${b.reason}` : ''}</span></span>
        <${Badge} tone=${tone}>${ratingOf(b.score)}<//><${Icon} name=${o ? 'chevron-up' : 'chevron-down'} size=${16} /></button>
        ${o && props.layout === 'full' && html`<div class="tk-wxac__more"><${Strip} cells=${a.strip} today=${ctx.today} />
          <div class="tk-wxac__days">${a.days.map((d) => html`<span class="tk-wxac__day"><strong>${dayName(d.date, ctx.today)}</strong> ${hm(d.best.start)}–${hm(d.best.end)} · <span style=${`color:${toneVar(scoreTone(d.best.score))}`}>${d.best.score}</span></span>`)}</div>
          <span class="tk-wxac__s">Bewertung 0–100 aus gefühlter Temperatur, Regen, Wind, Tageslicht${a.id === 'run' || a.id === 'bike' ? ' und Luftqualität' : ''}. Freie Zeit ohne Termin wird bevorzugt.</span></div>`}`; });
    return html`<${Card} flush title=${props.title} icon="footprints" actions=${html`<${Badge}>${dateStr(now)}<//>`}>${rows}
      ${props.showTraining && props.layout === 'full' && tr.length > 0 && html`<div class="tk-label" style="padding:var(--tk-space-3) var(--tk-space-4) 6px">Geplantes Training (Fitness)</div>${tr.map((x) => html`<button type="button" class="tk-wxac__tr" onClick=${() => ctx.emit('weather.training.open', { id: x.t.id })}>
        <span style=${`color:${toneVar(x.tone)};display:inline-flex;margin-top:2px`}><${Icon} name=${x.icon} size=${18} /></span><span class="tk-grow"><span class="tk-wxac__t">${x.t.title}</span><span class="tk-wxac__s" style="display:block">${dayName(x.t.date, ctx.today)}, ${dateStr(x.t.date).slice(4)}${x.t.start ? ` · ${x.t.start} Uhr` : ''} · ${x.t.where}</span><span class="tk-wxac__s" style="display:block">${x.text}</span></span></button>`)}`}<//>`;
  },
};

export const wxCommute = {
  id: 'wx-commute',
  name: 'Termine & Wege',
  category: 'Wetter',
  description: 'Wetter auf dem Hin- und Rückweg zu Terminen und Training (aus dem Kalender): Verkehrsmittel, Abfahrtszeit, Regen, Böen, Frost – mit klarer Empfehlung („Rückweg Regen: Regenjacke mitnehmen“) und Hinweis auf kommende Warnungen.',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['cards', 'rows'], default: 'cards' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Termine & Wege' },
    { name: 'hours', label: 'Zeitraum (Stunden)', type: 'number', default: 72 },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, { slot: 'venues', label: 'Wege zu Orten', default: 'venues', shape: '{ [ort]: {mode,min,outdoor} }' }, { slot: 'training', label: 'Training', default: 'training', shape: '{id,date,start,end,title,where}[]' }],
  events: ['weather.commute.open'],
  states: ['empty'],
  css: ``,
  example: { data: { place: EX.place, settings: EX.settings, events: EX.events, venues: EX.venues, training: EX.training } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} icon="calendar-clock" />`;
    const U = unitsOf(settingsOf(data));
    let trips = tripAdvice(data.events, data.training, data.venues, place, ctx.today, props.hours, place.alerts);
    if (props.limit > 0) trips = trips.slice(0, props.limit);
    if (!trips.length) return html`<${Card} title=${props.title} icon="calendar-clock"><${EmptyState} icon="calendar-check" title="Keine Wege geplant" text=${`In den nächsten ${Math.round(props.hours / 24)} Tagen stehen keine Termine mit Weg an.`} /><//>`;
    const leg = (label, l, time) => l.h ? html`<div class="tk-wxcm__leg"><${CondIcon} code=${l.h.code} night=${l.h.night} size=${18} /><span><strong style="color:var(--tk-c-text)">${label} ${time}</strong> · ${U.t(l.h.temp)}${l.h.precip >= 0.2 ? ` · ${U.p(l.h.precip)}` : ''}${l.h.gust >= 40 ? ` · Böen ${U.w(l.h.gust)}` : ''}</span></div>` : null;
    const VT = { ok: ['success', 'Passt'], warn: ['warning', 'Beachten'], bad: ['danger', 'Besser ändern'] };
    const one = (t) => { const [tone, vl] = VT[t.verdict];
      return html`<button type="button" class="tk-wxcm__card" style=${`--wx-v:var(--tk-c-${tone})`} onClick=${() => ctx.emit('weather.commute.open', { id: t.id })}>
        <div class="tk-row" style="gap:var(--tk-space-3);align-items:flex-start"><span style=${`color:var(--tk-c-${tone});display:inline-flex;margin-top:2px`}><${Icon} name=${modeIcon(t.mode)} size=${20} /></span>
          <div class="tk-grow"><div style="font-weight:var(--tk-fw-semibold)">${t.title}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${dayName(t.start, ctx.today)} ${hm(t.start)}–${hm(t.end)} Uhr · ${t.venue} · ${t.mode} ${t.minutes} Min.</div></div><${Badge} tone=${tone}>${vl}<//></div>
        <div class="tk-wxcm__legs">${leg('Hinweg', t.out, hm(t.depart))}${leg('Rückweg', t.back, hm(t.end))}</div>
        <div class="tk-col" style="gap:4px">${t.tips.map((x) => html`<span style="font-size:var(--tk-fs-sm);display:flex;gap:6px;align-items:flex-start"><${Icon} name=${t.verdict === 'ok' ? 'check-circle-2' : 'info'} size=${14} /><span>${x}</span></span>`)}</div></button>`; };
    if (props.layout === 'rows') return html`<${Card} flush title=${props.title} icon="calendar-clock">${trips.map((t) => { const [tone] = VT[t.verdict];
      return html`<button type="button" class="tk-wxac__row" onClick=${() => ctx.emit('weather.commute.open', { id: t.id })}><span style=${`color:var(--tk-c-${tone});display:inline-flex`}><${Icon} name=${modeIcon(t.mode)} size=${20} /></span>
        <span class="tk-grow"><span class="tk-wxac__t">${t.title}</span><span class="tk-wxac__s" style="display:block">${dayName(t.start, ctx.today)} ${hm(t.start)} · ${t.tips[0]}</span></span><${Badge} tone=${tone}>${VT[t.verdict][1]}<//></button>`; })}<//>`;
    return html`<div class="tk-col" style="gap:var(--tk-space-3)"><div class="tk-row"><h3 class="tk-card__title" style="flex:1">${props.title}</h3><${Badge}>${trips.length}<//></div>${trips.map(one)}</div>`;
  },
};
export default [wxActivity, wxCommute];
