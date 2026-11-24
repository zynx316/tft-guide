// Gemeinsame Kalender-Helfer: Datum, Wiederholungen, Überlappungslayout, Termin-Dialoge, Termin-Formular.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Badge, Chip, Field, Input, Select, Textarea, Icon, toneColor } from '../../ui.js';
import { startOfWeek, addDays } from '../../../lib/util.js';
import { WEEKDAYS_LONG, MONTHS_LONG } from '../../../lib/date.js';
import { fmtDate } from '../../../lib/format.js';

export { startOfWeek, addDays };
export const CATEGORY_TONES = { Arbeit: 'accent', Privat: 'accent2', Fokus: 'success', Sales: 'warning', Fitness: 'info', Gesundheit: 'danger' };
export const REPEATS = ['Keine', 'Täglich', 'Werktags', 'Wöchentlich', 'Alle 2 Wochen', 'Monatlich'];
export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const monthName = (d) => MONTHS[new Date(d).getMonth()];

export const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const toIso = (d) => `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
export const parseDay = (s) => (s instanceof Date ? new Date(s) : /^\d{4}-\d\d-\d\d$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s));
export const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const timeStr = (d) => `${pad(new Date(d).getHours())}:${pad(new Date(d).getMinutes())}`;
export const minutesOf = (d) => new Date(d).getHours() * 60 + new Date(d).getMinutes();
export const hm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
export const durLabel = (min) => (min < 60 ? `${min} Min.` : `${Math.floor(min / 60)} Std.${min % 60 ? ` ${min % 60} Min.` : ''}`);
export const sameKey = (a, b) => dayKey(a) === dayKey(b);
const wdIdx = (d) => (new Date(d).getDay() + 6) % 7;
/** „Dienstag“ */
export const weekdayName = (d) => WEEKDAYS_LONG[wdIdx(d)];
/** „24. November“ */
export const dayMonth = (d) => `${new Date(d).getDate()}. ${MONTHS_LONG[new Date(d).getMonth()]}`;
/** „Dienstag, 24. November“ */
export const longDay = (d) => `${weekdayName(d)}, ${dayMonth(d)}`;
/** „Di, 24.11.“ */
export const shortDay = (d) => fmtDate(d, { style: 'weekday' });
/** „Dienstag, 24. November 2026“ (auch für Screenreader-Beschriftungen) */
export const fullDay = (d) => `${longDay(d)} ${new Date(d).getFullYear()}`;
/**
 * Große Schrift (Einstellung „Schriftgröße“ ab 150 %): Texte, die sonst mit „…“ abgeschnitten werden, umbrechen stattdessen.
 * Wird über die Bereichs-Indexdateien (calendar, tasks, habits) an jede Komponente angehängt und gilt nur in deren Blöcken.
 */
export const withBigText = (list) => list.map((c) => {
  const scoped = ['1.5', '1.75', '2'].map((v) => `:root[style*="--tk-text-scale: ${v}"] .tk-block[data-component="${c.id}"] .tk-truncate`).join(',\n');
  return { ...c, css: `${c.css || ''}\n${scoped} { white-space:normal; text-overflow:clip; overflow-wrap:anywhere; }` };
});
/** Neue Termin-ID: deterministisch über ctx.newId (kein Zufall, keine Uhrzeit). */
export const newEventId = (ctx) => (ctx && ctx.newId ? ctx.newId('ev') : 'ev-neu');
export const monthStart = (d) => { const x = dayStart(d); x.setDate(1); return x; };
export function isoWeek(d) {
  const x = dayStart(d); x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
  const w1 = new Date(x.getFullYear(), 0, 4);
  return 1 + Math.round(((x - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}
export const selDate = (ctx) => (ctx.ui.selectedDate ? dayStart(parseDay(ctx.ui.selectedDate)) : dayStart(ctx.today));
export const catTone = (ev) => ev.tone || CATEGORY_TONES[ev.category] || 'accent';
export const catColor = (ev) => toneColor(catTone(ev));

/** Wiederholungen + mehrtägige Ganztags-Termine in Einzelvorkommen für [from, to) auflösen. */
export function occurrences(events, from, to) {
  const out = [];
  const mk = (ev, st, durMs, extra = {}) => {
    const en = new Date(+st + durMs);
    const series = ev.repeat && ev.repeat !== 'Keine';
    return { ...ev, ...extra, id: series ? `${ev.id}@${dayKey(st)}` : ev.id, seriesId: series ? ev.id : undefined, start: toIso(st), end: toIso(en), _s: st, _e: en };
  };
  for (const ev of Array.isArray(events) ? events : []) {
    if (!ev || !ev.start || ev.hidden) continue; // ausgeblendete Quelle (Kalender & Feiertage)
    const s = parseDay(ev.start);
    if (ev.allDay) {
      const e = ev.end ? parseDay(ev.end) : s;
      for (let d = dayStart(s); d <= e; d = addDays(d, 1)) if (d >= from && d < to) out.push({ ...ev, id: +e > +dayStart(s) ? `${ev.id}@${dayKey(d)}` : ev.id, seriesId: +e > +dayStart(s) ? ev.id : undefined, _s: d, _e: addDays(d, 1), allDay: true });
      continue;
    }
    const dur = (ev.end ? +parseDay(ev.end) : +s + 36e5) - +s;
    const rep = ev.repeat || 'Keine';
    if (rep === 'Keine') { if (s < to && new Date(+s + dur) > from) out.push(mk(ev, s, dur)); continue; }
    const base = dayStart(s), until = ev.until ? addDays(dayStart(parseDay(ev.until)), 1) : null;
    for (let d = dayStart(from); d < to; d = addDays(d, 1)) {
      const diff = Math.round((d - base) / 864e5);
      if (diff < 0 || (until && d >= until)) continue;
      const ok = rep === 'Täglich' || (rep === 'Werktags' && d.getDay() % 6 !== 0) || (rep === 'Wöchentlich' && diff % 7 === 0) || (rep === 'Alle 2 Wochen' && diff % 14 === 0) || (rep === 'Monatlich' && d.getDate() === s.getDate());
      if (!ok) continue;
      const st = new Date(d); st.setHours(s.getHours(), s.getMinutes(), 0, 0);
      out.push(mk(ev, st, dur));
    }
  }
  return out.sort((a, b) => a._s - b._s || b._e - a._e);
}
export const onDay = (occs, day) => occs.filter((o) => sameKey(o._s, day));

/** Überlappende Termine nebeneinander anordnen: liefert [{ev, col, cols}].
 *  minDur: sichtbare Mindestdauer in Minuten (aus der Mindesthöhe), damit kurze Termine nicht optisch überlappen. */
export function layoutDay(evs, minDur = 15) {
  const items = evs.map((ev) => ({ ev, s: minutesOf(ev._s), e: Math.max(minutesOf(ev._s) + minDur, +ev._e > +dayStart(addDays(ev._s, 1)) ? 1440 : minutesOf(ev._e)) }))
    .sort((a, b) => a.s - b.s || b.e - a.e);
  const out = []; let cluster = [], end = -1;
  const flush = () => {
    const cols = [];
    for (const it of cluster) {
      let c = cols.findIndex((last) => last <= it.s);
      if (c < 0) { c = cols.length; cols.push(0); }
      cols[c] = it.e; it.col = c;
    }
    cluster.forEach((it) => out.push({ ev: it.ev, col: it.col, cols: cols.length, s: it.s, e: it.e }));
    cluster = []; end = -1;
  };
  for (const it of items) { if (cluster.length && it.s >= end) flush(); cluster.push(it); end = Math.max(end, it.e); }
  if (cluster.length) flush();
  return out;
}

/** Freie Lücken zwischen Terminen eines Tages innerhalb [fromMin, toMin]. */
export function freeSlots(dayOccs, fromMin, toMin, minLen = 45) {
  const busy = dayOccs.filter((o) => !o.allDay).map((o) => [minutesOf(o._s), Math.max(minutesOf(o._s) + 5, minutesOf(o._e))]).sort((a, b) => a[0] - b[0]);
  const slots = []; let cur = fromMin;
  for (const [s, e] of busy) { if (s - cur >= minLen) slots.push([cur, Math.min(s, toMin)]); cur = Math.max(cur, e); }
  if (toMin - cur >= minLen) slots.push([cur, toMin]);
  return slots.filter(([a, b]) => b > a);
}

export const eventsFiltered = (events, ui, respect = true) => {
  const list = Array.isArray(events) ? events : [];
  if (!respect) return list;
  const q = String(ui.query || '').trim().toLowerCase();
  const f = ui.filter && !/^alle?$/i.test(ui.filter) ? String(ui.filter).toLowerCase() : '';
  return list.filter((e) => (!q || [e.title, e.location, e.note, e.category].some((x) => String(x || '').toLowerCase().includes(q)))
    && (!f || String(e.category || '').toLowerCase() === f || String(e.tone || '').toLowerCase() === f));
};

// ------------------------------------------------------------ Formular ---
const addMin = (t, m) => { const [h, mi] = t.split(':').map(Number); const x = Math.min(1439, Math.max(0, h * 60 + mi + m)); return hm(x); };

export function EventForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Speichern', lockDate, dateHint, onInvalid }) {
  const cats = Object.keys(CATEGORY_TONES);
  const [v, setV] = useState({ title: initial.title || '', date: initial.date || '', start: initial.start || '09:00', end: initial.end || '10:00', category: initial.category || 'Arbeit', repeat: initial.repeat || 'Keine', location: initial.location || '', note: initial.note || '' });
  const [err, setErr] = useState({});
  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }));
  const submit = (e) => {
    e && e.preventDefault();
    const er = {};
    if (!v.title.trim()) er.title = 'Bitte einen Titel eingeben';
    if (!v.date) er.date = 'Bitte ein Datum wählen';
    if (v.end <= v.start) er.end = 'Ende muss nach dem Beginn liegen';
    setErr(er);
    if (Object.keys(er).length) { onInvalid && onInvalid(er); return; }
    onSubmit({ ...v, title: v.title.trim() });
  };
  return html`<form class="tk-eventform" onSubmit=${submit} novalidate>
    <${Field} label="Titel *" error=${err.title}><${Input} value=${v.title} onInput=${set('title')} placeholder="z. B. Team-Abstimmung" invalid=${!!err.title} /><//>
    <div class="tk-eventform__row">
      <div class="tk-eventform__wide"><${Field} label=${lockDate ? 'Serie beginnt am' : 'Datum *'} error=${err.date} hint=${dateHint}><${Input} type="date" value=${v.date} onInput=${set('date')} disabled=${lockDate} invalid=${!!err.date} /><//></div>
      <${Field} label="Beginn"><${Input} type="time" value=${v.start} onInput=${(val) => { const dur = Math.max(15, (Number(v.end.slice(0, 2)) * 60 + Number(v.end.slice(3)) - Number(v.start.slice(0, 2)) * 60 - Number(v.start.slice(3))) || 60); setV((o) => ({ ...o, start: val, end: addMin(val, dur) })); }} /><//>
      <${Field} label="Ende" error=${err.end}><${Input} type="time" value=${v.end} onInput=${set('end')} invalid=${!!err.end} /><//>
    </div>
    <div class="tk-row" style="flex-wrap:wrap">${[['30 Min.', 30], ['1 Std.', 60], ['90 Min.', 90], ['2 Std.', 120]].map(([l, m]) => html`<${Chip} onClick=${() => set('end')(addMin(v.start, m))}>${l}<//>`)}</div>
    <div class="tk-field"><span class="tk-field__label">Kategorie</span><div class="tk-row" style="flex-wrap:wrap">${cats.map((c) => html`<${Chip} active=${v.category === c} onClick=${() => set('category')(c)}><span class="tk-dot" style=${`color:${toneColor(CATEGORY_TONES[c])}`}></span>${c}<//>`)}</div></div>
    <div class="tk-eventform__row tk-eventform__row--2">
      <${Field} label="Wiederholung"><${Select} value=${v.repeat} onChange=${set('repeat')} options=${REPEATS} /><//>
      <${Field} label="Ort"><${Input} value=${v.location} onInput=${set('location')} placeholder="Optional" /><//>
    </div>
    <${Field} label="Notiz"><${Textarea} value=${v.note} onInput=${set('note')} rows="2" placeholder="Optional" /><//>
    <div class="tk-eventform__actions">${onCancel && html`<${Button} onClick=${onCancel}>Abbrechen<//>`}<${Button} variant="primary" type="submit" icon="check">${submitLabel}<//></div>
  </form>`;
}

export const formToEvent = (v, id) => ({
  id, title: v.title, start: `${v.date}T${v.start}:00`, end: `${v.date}T${v.end}:00`, category: v.category, tone: CATEGORY_TONES[v.category] || 'accent',
  repeat: v.repeat === 'Keine' ? undefined : v.repeat, location: v.location || undefined, note: v.note || undefined,
});

export const EVENT_CSS = `
.tk-eventform { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
.tk-eventform__row { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); }
.tk-eventform__row .tk-eventform__wide { grid-column:1 / -1; }
.tk-eventform__actions { display:flex; justify-content:flex-end; gap:8px; padding-top:4px; }
.bp-mobile .tk-eventform__actions .tk-btn { flex:1; }
.tk-evdetail { display:flex; flex-direction:column; gap:var(--tk-space-3); }
.tk-evdetail__row { display:flex; gap:var(--tk-space-3); align-items:flex-start; color:var(--tk-c-text-muted); font-size:var(--tk-fs-md); }
.tk-evdetail__row > .icon { flex:none; margin-top:2px; color:var(--tk-c-text-subtle); }
.tk-evdetail__row strong { color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); }
`;

/** Neuen Termin anlegen (Dialog). pre: {date,start,end,title?} */
export function openCreateDialog(ctx, setData, pre = {}) {
  ctx.emit('event.create.open', pre);
  ctx.openDialog({
    title: 'Neuer Termin',
    body: (close) => html`<${EventForm} initial=${{ date: dayKey(ctx.ui.selectedDate ? parseDay(ctx.ui.selectedDate) : ctx.today), ...pre }} submitLabel="Termin anlegen" onCancel=${close}
      onInvalid=${(er) => ctx.emit('form.invalid', er)}
      onSubmit=${(v) => { const ev = formToEvent(v, newEventId(ctx)); setData('events', (all) => [ev, ...(Array.isArray(all) ? all : [])]); ctx.emit('event.create', { id: ev.id, title: ev.title }); ctx.toast(`„${ev.title}“ angelegt`); close(); }} />`,
  });
}

export function openEditDialog(ctx, setData, ev, events) {
  const baseId = ev.seriesId || ev.id;
  const base = (events || []).find((e) => e.id === baseId) || ev;
  ctx.openDialog({
    title: 'Termin bearbeiten',
    body: (close) => html`<${EventForm} lockDate=${!!ev.seriesId} dateHint=${undefined}
      initial=${{ title: base.title, date: dayKey(ev.seriesId ? base.start : ev.start), start: timeStr(base.start), end: timeStr(base.end), category: base.category, repeat: base.repeat, location: base.location, note: base.note }}
      submitLabel="Änderungen speichern" onCancel=${close}
      onSubmit=${(v) => { const nv = formToEvent(v, baseId); setData('events', (all) => all.map((e) => (e.id === baseId ? { ...e, ...nv, repeat: nv.repeat } : e))); ctx.emit('event.update', { id: baseId }); ctx.toast('Termin aktualisiert'); close(); }} />`,
  });
}

export function openEventDialog(ctx, setData, ev, events) {
  ctx.emit('event.open', { id: ev.id });
  const mins = Math.round((ev._e - ev._s) / 60000);
  const baseId = ev.seriesId || ev.id;
  ctx.openDialog({
    title: ev.title,
    body: () => html`<div class="tk-evdetail">
      <div class="tk-row"><${Badge} tone=${catTone(ev)} dot>${ev.category || 'Termin'}<//>${ev.repeat && ev.repeat !== 'Keine' && html`<${Badge} icon="repeat">${ev.repeat}<//>`}</div>
      <div class="tk-evdetail__row"><${Icon} name="clock" size=${17} /><div><strong>${longDay(ev._s)}</strong><br />${ev.allDay ? 'Ganztägig' : `${timeStr(ev._s)} – ${timeStr(ev._e)} Uhr · ${durLabel(mins)}`}</div></div>
      ${ev.location && html`<div class="tk-evdetail__row"><${Icon} name="map-pin" size=${17} /><div>${ev.location}</div></div>`}
      ${ev.note && html`<div class="tk-evdetail__row"><${Icon} name="file-text" size=${17} /><div>${ev.note}</div></div>`}
    </div>`,
    footer: (close) => html`<${Button} variant="danger" icon="trash-2" onClick=${() => { setData('events', (all) => all.filter((e) => e.id !== baseId)); ctx.emit('event.delete', { id: baseId }); ctx.toast(ev.seriesId ? 'Terminserie gelöscht' : 'Termin gelöscht'); close(); }}>${ev.seriesId ? 'Serie löschen' : 'Löschen'}<//>
      <${Button} variant="primary" icon="pencil" onClick=${() => { close(); openEditDialog(ctx, setData, ev, events); }}>Bearbeiten<//>`,
  });
}
