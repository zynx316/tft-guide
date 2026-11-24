// Gemeinsame Helfer der Kalender-Startseite, des Termin-Details und der Quellen:
// Termin-Auflösung, Konflikte, Wochenlast, Schnell-Eingabe (Text → Termin), Navigation (Dialog oder Screen).
import { addDays, dayStart, dayKey, parseDay, occurrences, onDay, minutesOf, hm, durLabel, freeSlots, startOfWeek, openEventDialog, WEEKDAYS } from './_cal.js';

/** Standard-Quelle je Kategorie (Termine ohne eigene `source`). */
export const SOURCE_BY_CATEGORY = { Arbeit: 'work', Sales: 'work', Fokus: 'work', Privat: 'family', Fitness: 'personal', Gesundheit: 'personal', Feiertag: 'holidays', Geburtstag: 'birthdays' };
export const sourceOf = (ev) => ev.source || SOURCE_BY_CATEGORY[ev.category] || 'personal';

/** Läuft die Vorschau im App-Modus (Demo-Launcher)? Dort führen Events über `interaction.to` zu eigenen Screens. */
export const inApp = () => typeof document !== 'undefined' && !!document.querySelector('.tk-app');

/**
 * Termin öffnen: im Dialog (Feature-Vorschau) oder – bei openMode „navigate“ im App-Modus – nur melden,
 * damit die Navigation (event.open → Termin-Detail) greift. `props.openMode`: dialog | navigate.
 */
export function openEvent(ctx, setData, occ, events, props = {}) {
  if (props.openMode === 'navigate' && inApp()) { ctx.setUi('selectedId', occ.id); ctx.emit('event.open', { id: occ.id }); return; }
  openEventDialog(ctx, setData, occ, events);
}
export const OPEN_MODE_PROP = { name: 'openMode', label: 'Termin öffnen', type: 'select', options: ['dialog', 'navigate'], default: 'dialog' };

/** Vorkommen zu einer (ggf. zusammengesetzten) Termin-ID `serie@2026-11-24` finden; ohne Tag: das nächste. */
export function findOccurrence(events, id, today) {
  if (!id) return null;
  const list = Array.isArray(events) ? events : [];
  const [baseId, dayStr] = String(id).split('@');
  const base = list.find((e) => e.id === baseId);
  if (!base) return null;
  const s = dayStart(parseDay(base.start));
  const from = dayStr ? dayStart(parseDay(dayStr)) : (base.repeat && base.repeat !== 'Keine' ? dayStart(today) : s);
  const limit = base.repeat && base.repeat !== 'Keine' && !dayStr ? 62 : 1;
  const occ = occurrences([base], from, addDays(from, limit))[0] || (dayStr ? occurrences([base], s, addDays(s, 1))[0] : null);
  return occ || null;
}
/** Nächster Termin ab `now` (ohne Ganztägige); `skip` = laufende Termine mitzählen. */
export function nextOccurrences(events, now, days = 14) {
  const from = dayStart(now);
  return occurrences(events, from, addDays(from, days)).filter((o) => !o.allDay && +o._e > +now);
}

/** Überschneidungen eines Vorkommens mit anderen (nur Termine mit Uhrzeit). */
export const overlapsWith = (occ, occs) => (occ.allDay ? [] : occs.filter((o) => o.id !== occ.id && !o.allDay && o._s < occ._e && o._e > occ._s));
/** Alle Überschneidungs-Paare in einer Terminliste. */
export function conflictPairs(occs) {
  const timed = occs.filter((o) => !o.allDay).sort((a, b) => a._s - b._s);
  const out = [];
  for (let i = 0; i < timed.length; i++) for (let j = i + 1; j < timed.length && timed[j]._s < timed[i]._e; j++) out.push([timed[i], timed[j]]);
  return out;
}

/** Gebuchte Minuten eines Tages (Überlappungen nur einmal gezählt). */
export function bookedMinutes(dayOccs) {
  const iv = dayOccs.filter((o) => !o.allDay).map((o) => [minutesOf(o._s), Math.max(minutesOf(o._s) + 5, minutesOf(o._e))]).sort((a, b) => a[0] - b[0]);
  let total = 0, end = -1;
  for (const [s, e] of iv) { if (s >= end) { total += e - s; end = e; } else if (e > end) { total += e - end; end = e; } }
  return total;
}
/** Wochenlast Mo–So: { day, key, n, booked, free, over, conflicts }. */
export function weekLoad(events, anyDay, workFrom = 8, workTo = 18) {
  const from = startOfWeek(anyDay), occs = occurrences(events, from, addDays(from, 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(from, i), list = onDay(occs, day), booked = bookedMinutes(list);
    const work = (workTo - workFrom) * 60;
    return { day, key: dayKey(day), label: WEEKDAYS[i], n: list.filter((o) => !o.allDay).length, allDay: list.filter((o) => o.allDay), booked, free: Math.max(0, work - booked), over: booked > work * 0.7, conflicts: conflictPairs(list).length };
  });
}
export const hoursLabel = (min) => `${(Math.round(min / 6) / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`;
export const inLabel = (min) => (min <= 0 ? 'jetzt' : `in ${durLabel(min)}`);
export { freeSlots, hm };

// ---------------------------------------------------------------- Text → Termin ---
const DAYWORDS = { montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6, sonntag: 0 };
const CAT_WORDS = [[/zahnarzt|arzt|physio|praxis/i, 'Gesundheit'], [/training|laufen|studio|wanderung|yoga/i, 'Fitness'], [/fokus|schreiben|konzept/i, 'Fokus'], [/kunde|lieferant|etsy|angebot|shop/i, 'Sales'], [/mittag|essen|geburtstag|jana|abendessen|kaffee/i, 'Privat'], [/call|meeting|review|planung|workshop|abstimmung/i, 'Arbeit']];

/** Ermittelt Datum, Uhrzeit und Dauer aus freiem Text („Zahnarzt morgen 14 Uhr 45 min“). */
export function parseWhen(text, today) {
  let t = ` ${String(text || '')} `, date = null, start = null, mins = null; const hints = [];
  const base = dayStart(today);
  const cut = (re) => { const m = t.match(re); if (m) t = t.replace(re, ' '); return m; };
  let m;
  if ((m = cut(/\s(\d{1,2})\.(\d{1,2})\.(\d{4})?(?=\s|$)/))) { const y = m[3] ? +m[3] : base.getFullYear(); let d = new Date(y, +m[2] - 1, +m[1]); if (!m[3] && d < base) d = new Date(y + 1, +m[2] - 1, +m[1]); date = d; }
  else if ((m = cut(/\s(heute|morgen|übermorgen)(?=\s|$)/i))) date = addDays(base, { heute: 0, morgen: 1, übermorgen: 2 }[m[1].toLowerCase()]);
  else if ((m = cut(/\s(?:am\s+|nächsten\s+)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)(?=\s|$)/i))) {
    const wd = DAYWORDS[m[1].toLowerCase()]; let diff = (wd - base.getDay() + 7) % 7; if (diff === 0) diff = 7; date = addDays(base, diff);
  }
  if ((m = cut(/\s(\d+(?:,\d)?)\s*(?:h|std\.?|stunden?)(?=\s|$)/i))) mins = Math.round(parseFloat(m[1].replace(',', '.')) * 60);
  else if ((m = cut(/\s(\d{1,3})\s*(?:min\.?|minuten)(?=\s|$)/i))) mins = +m[1];
  if ((m = cut(/\s(?:um\s+|ab\s+)?(\d{1,2})[:.](\d{2})(?:\s*uhr)?(?=\s|$)/i)) || (m = cut(/\s(?:um\s+|ab\s+)?(\d{1,2})\s*uhr(?=\s|$)/i)) || (m = cut(/\sum\s+(\d{1,2})(?=\s|$)/i))) start = hm(Math.min(23, +m[1]) * 60 + (m[2] ? Math.min(59, +m[2]) : 0));
  const title = t.replace(/\s+(am|um|für|dauer)(?=\s|$)/gi, ' ').replace(/\s+/g, ' ').trim();
  const cat = (CAT_WORDS.find(([re]) => re.test(title)) || [])[1];
  if (date) hints.push(new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(date));
  if (start) hints.push(`${start} Uhr`);
  if (mins) hints.push(durLabel(mins));
  return { title: title ? title[0].toUpperCase() + title.slice(1) : '', date, start, mins, category: cat, hints };
}

// ---------------------------------------------------------------- Auswahl & Änderungen (Termin-Detail) ---
/** Gewählter Termin (ctx.ui.selectedId, z. B. per Navigation) – sonst, wenn erlaubt, der nächste Termin. */
export function pickEvent(ctx, events, fallbackNext = true, previewId = '') {
  const sel = findOccurrence(events, ctx.ui.selectedId, ctx.today) || (previewId ? findOccurrence(events, previewId, ctx.today) : null);
  if (sel) return sel;
  return fallbackNext ? nextOccurrences(events, ctx.today, 14)[0] || null : null;
}
export const PREVIEW_ID_PROP = { name: 'previewId', label: 'Termin ohne Auswahl (ID)', type: 'text', default: '' };
export const baseIdOf = (occ) => occ.seriesId || occ.id;
/** Felder des Ausgangstermins (bei Serien: der ganzen Serie) ändern. */
export const patchEvent = (setData, occ, patch) => setData('events', (all) => (Array.isArray(all) ? all : []).map((e) => (e.id === baseIdOf(occ) ? { ...e, ...patch } : e)));
export const baseOf = (events, occ) => (events || []).find((e) => e.id === baseIdOf(occ)) || occ;

/** Quelle ein-/ausblenden: Sichtbarkeit in calSources und `hidden` an allen Terminen der Quelle (wirkt in allen Ansichten). */
export function setSourceVisible(setData, sourceId, visible) {
  setData('sources', (all) => (Array.isArray(all) ? all : []).map((s) => (s.id === sourceId ? { ...s, visible } : s)));
  setData('events', (all) => (Array.isArray(all) ? all : []).map((e) => (sourceOf(e) === sourceId ? { ...e, hidden: !visible } : e)));
}
export const STATUS_TONE = { Zugesagt: 'success', Offen: 'neutral', Vielleicht: 'warning', Abgesagt: 'danger' };
