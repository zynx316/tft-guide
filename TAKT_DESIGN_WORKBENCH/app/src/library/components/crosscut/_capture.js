// Erfassen: Erkennung eines Satzes (simuliert, regelbasiert) und Anlegen in der gemeinsamen Datenwelt.
import { isoDay, addDays } from '../../../lib/util.js';
import { fmtDate, fmtTime, fmtMoney, fmtNumber } from '../../../lib/format.js';
import { cap } from './_system.js';
import { guessAisle, parseQuick } from '../shopping/_logic.js'; // Gang und Menge wie in der Schnelleingabe von „Einkauf & Haushalt“

/** Zielarten: Beschriftung, Icon, Ziel-Feature zum Ansehen (Event `open:<to>`). */
export const KINDS = {
  task: { label: 'Aufgabe', icon: 'list-checks', to: 'tasks.list', view: 'In Aufgaben ansehen', placeholder: 'z. B. !Angebot Müller schicken' },
  event: { label: 'Termin', icon: 'calendar', to: 'calendar.agenda', view: 'In der Agenda ansehen', placeholder: 'z. B. morgen 14 Uhr Zahnarzt' },
  note: { label: 'Notiz', icon: 'sticky-note', to: 'notes.inbox', view: 'Im Notizen-Eingang ansehen', placeholder: 'z. B. Notiz: Idee für Newsletter-Betreff' },
  expense: { label: 'Buchung', icon: 'wallet', to: 'finance.transactions', view: 'In den Umsätzen ansehen', placeholder: 'z. B. −12,50 Rewe' },
  meal: { label: 'Mahlzeit', icon: 'utensils', to: 'nutrition.log', view: 'Im Tagebuch ansehen', placeholder: 'z. B. Mittag Linsensuppe 450 kcal' },
  shopping: { label: 'Einkauf', icon: 'shopping-basket', to: 'shopping.list', view: 'Auf der Einkaufsliste ansehen', placeholder: 'z. B. Milch kaufen' },
  inbox: { label: 'Eingang', icon: 'inbox', to: 'tasks.inbox', view: 'Im Eingang ansehen', placeholder: 'Alles andere landet im Eingang' },
};
export const KIND_ORDER = ['task', 'event', 'note', 'expense', 'meal', 'shopping'];
export const EXAMPLES = ['morgen 14 Uhr Zahnarzt', '!Angebot Müller schicken', '−12,50 Rewe', 'Milch kaufen', 'Mittag Linsensuppe 450 kcal', 'Notiz: Idee Newsletter-Betreff'];
export const NAV_TARGETS = [...new Set(Object.values(KINDS).map((k) => k.to))];

const WD = { sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6 };
const VERBS = /\b(schicken|senden|prüfen|anrufen|bestellen|buchen|erledigen|vorbereiten|planen|bezahlen|abholen|klären|überweisen|fertigstellen|finalisieren|schreiben|zahlen|beantworten|erstellen|kündigen|absagen)\b/i;
const GROCERY = /\b(milch|brot|eier|butter|käse|joghurt|skyr|äpfel|bananen|nudeln|reis|spülmittel|toilettenpapier|müllbeutel|haferflocken|tomaten|gurke|kaffee|hafermilch|olivenöl)\b/i;
const SHOP = { Lebensmittel: /rewe|edeka|aldi|lidl|netto|bäcker|markt/i, Haushalt: /\bdm\b|rossmann|ikea|baumarkt/i, Mobilität: /tank|aral|shell|esso|bahn|ticket|parken/i, 'Essen gehen': /café|cafe|restaurant|mittag|lieferando|kaffee/i, Abos: /netflix|spotify|abo/i };
const MEALS = [[/\b(frühstück|morgens)\b/i, 'breakfast', 'Frühstück'], [/\bmittagessen\b|^mittag\b/i, 'lunch', 'Mittagessen'], [/\babendessen\b|^abend\b/i, 'dinner', 'Abendessen'], [/\b(snack|zwischendurch)\b/i, 'snack', 'Snack']];

/** Datum aus dem Satz: heute, morgen, übermorgen, Wochentag, 24.12. – gibt Datum und den Text ohne Datumswort zurück. */
function readDate(text, today) {
  let m;
  if ((m = text.match(/\bübermorgen\b/i))) return { date: addDays(today, 2), rest: text.replace(m[0], ' ') };
  if ((m = text.match(/\bmorgen\b/i))) return { date: addDays(today, 1), rest: text.replace(m[0], ' ') };
  if ((m = text.match(/\bheute\b/i))) return { date: new Date(today), rest: text.replace(m[0], ' ') };
  if ((m = text.match(/\b(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/i))) {
    const diff = ((WD[m[1].toLowerCase()] - today.getDay() + 7) % 7) || 7;
    return { date: addDays(today, diff), rest: text.replace(m[0], ' ') };
  }
  if ((m = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})?(?!\d)/))) {
    const y = m[3] ? Number(m[3]) : today.getFullYear(); const d = new Date(y, Number(m[2]) - 1, Number(m[1]));
    if (!m[3] && d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) d.setFullYear(y + 1);
    if (d.getMonth() === Number(m[2]) - 1) return { date: d, rest: text.replace(m[0], ' ') };
  }
  return { date: null, rest: text };
}
function readTime(text) {
  const m = text.match(/\b(?:um\s+)?(\d{1,2})(?::(\d{2}))?\s*uhr\b/i) || text.match(/\b(?:um\s+)?(\d{1,2}):(\d{2})\b/);
  if (!m || Number(m[1]) > 23) return { h: null, rest: text };
  return { h: Number(m[1]), min: Number(m[2] || 0), rest: text.replace(m[0], ' ') };
}
const readAmount = (s) => { const m = s.match(/([+\-−–])?\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|eur\b)?/i); return m ? { sign: m[1], value: Number(m[2].replace('.', '').replace(',', '.')), raw: m[0] } : null; };
const clean = (s) => cap(s.replace(/\b(um|am|für|bis|ab)\s*$/i, '').replace(/^\s*(um|am|für|bis|ab)\b/i, '').replace(/\s+/g, ' ').replace(/^[\s:,–-]+|[\s:,–-]+$/g, ''));
const at = (d, h, min) => { const x = new Date(d); x.setHours(h, min, 0, 0); return x; };
const iso = (d) => `${isoDay(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

/**
 * Erkennt, was ein Satz ist. Rückgabe { kind, title, fields[], why, sure, data } oder null bei leerem Text.
 * Regeln (in dieser Reihenfolge): Betrag → Buchung · Mahlzeit mit kcal → Mahlzeit · Uhrzeit → Termin ·
 * „!“, Datum oder Verb → Aufgabe · Einkaufswort → Einkauf · „Notiz:“ → Notiz · sonst Eingang.
 */
export function parseCapture(raw, today, foods = []) {
  const text = String(raw || '').trim();
  if (!text) return null;
  let m;
  const out = (kind, title, fields, why, sure, data = {}) => ({ kind, title: title || text, fields, why, sure, data });
  // Buchung
  const amount = /^[+\-−–]\s*\d/.test(text) || /\d[,.]\d{2}\s*(€|eur)\b/i.test(text) || /\d\s*(€|eur)\b/i.test(text) ? readAmount(text) : null;
  if (amount && !/kcal/i.test(text)) {
    const income = amount.sign === '+';
    const title = clean(text.replace(amount.raw, ' ')) || 'Buchung';
    const cat = income ? 'Einnahmen' : Object.entries(SHOP).find(([, re]) => re.test(text))?.[0] || 'Sonstiges';
    return out('expense', title, [{ k: income ? 'Einnahme' : 'Ausgabe', v: fmtMoney(amount.value) }, { k: 'Kategorie', v: cat }, { k: 'Konto', v: 'Girokonto' }, { k: 'Datum', v: 'heute' }],
      amount.sign ? 'Betrag mit Vorzeichen erkannt' : 'Betrag in Euro erkannt', true, { amount: income ? amount.value : -amount.value, category: cat });
  }
  // Mahlzeit
  const meal = MEALS.find(([re]) => re.test(text));
  const kcal = (m = text.match(/(\d{2,4})\s*kcal/i)) ? Number(m[1]) : null;
  if (meal || kcal) {
    const title = clean(text.replace(/(\d{2,4})\s*kcal/i, ' ').replace(meal ? meal[0] : /$^/, ' ')) || 'Mahlzeit';
    const food = foods.find((f) => text.toLowerCase().includes(String(f.name).toLowerCase().split(' ')[0]));
    const k = kcal ?? (food ? Math.round((food.kcal * (food.portions?.[0]?.g || 100)) / 100) : null);
    if (k != null) return out('meal', food && !kcal ? food.name : title, [{ k: 'Mahlzeit', v: meal ? meal[2] : 'Snack' }, { k: 'Energie', v: fmtNumber(k, { unit: 'kcal' }) }, { k: 'Zeit', v: fmtTime(today) }],
      kcal ? 'kcal-Angabe erkannt' : 'Lebensmittel aus deiner Liste erkannt', true, { meal: meal ? meal[1] : 'snack', kcal: k, foodId: food?.id || null });
    return out('inbox', text, [{ k: 'Hinweis', v: 'Ohne kcal gespeichert, ergänze sie später' }], 'Mahlzeit ohne Mengenangabe', false);
  }
  // Notiz (ausdrücklich)
  if ((m = text.match(/^(notiz|idee|merke|#)\s*:?\s*/i))) return out('note', clean(text.slice(m[0].length)), [{ k: 'Ablage', v: 'Eingang' }], 'Stichwort „Notiz“ erkannt', true);
  // Termin (Uhrzeit)
  const t1 = readTime(text), d1 = readDate(t1.rest, today);
  if (t1.h != null) {
    const day = d1.date || today; const start = at(day, t1.h, t1.min); const end = new Date(+start + 60 * 60000);
    return out('event', clean(d1.rest), [{ k: 'Wann', v: `${fmtDate(start, { style: 'weekday' })}, ${fmtTime(start)}–${fmtTime(end)}` }, { k: 'Kalender', v: 'Privat' }, { k: 'Erinnerung', v: '15 Min. vorher' }],
      d1.date ? 'Datum und Uhrzeit erkannt' : 'Uhrzeit erkannt, Datum = heute', true, { start: iso(start), end: iso(end) });
  }
  // Aufgabe
  const urgent = /^!+\s*/.test(text), verb = VERBS.test(text), due = d1.date;
  if (urgent || verb || due || /^(aufgabe|todo|to-do)\s*:/i.test(text)) {
    const title = clean(d1.rest.replace(/^!+\s*/, '').replace(/^(aufgabe|todo|to-do)\s*:/i, ''));
    return out('task', title, [{ k: 'Fällig', v: due ? fmtDate(due, { style: 'weekday' }) : 'ohne Datum' }, { k: 'Priorität', v: urgent ? 'hoch' : 'mittel' }, { k: 'Projekt', v: 'Eingang' }],
      urgent ? '„!“ am Anfang = wichtig' : verb ? 'Tätigkeit erkannt' : 'Datum erkannt', true, { due: due ? isoDay(due) : null, priority: urgent ? 'hoch' : 'mittel' });
  }
  // Einkauf
  const words = text.split(/\s+/).length;
  if (/^(kaufen|einkauf|einkaufen)\s*:/i.test(text) || /\b(kaufen|besorgen|einkaufen)\b/i.test(text) || (GROCERY.test(text) && words <= 3)) {
    const title = clean(text.replace(/^(kaufen|einkauf|einkaufen)\s*:/i, '').replace(/\b(kaufen|besorgen|einkaufen)\b/i, ''));
    const q = parseQuick(title) || { name: title, qty: '' }; const aisle = guessAisle(q.name);
    return out('shopping', q.name, [{ k: 'Liste', v: 'Lebensmittel' }, { k: 'Gang', v: aisle }, ...(q.qty ? [{ k: 'Menge', v: q.qty }] : [])], 'Einkaufswort erkannt', true, { aisle, qty: q.qty || '' });
  }
  if (words >= 8) return out('note', text, [{ k: 'Ablage', v: 'Eingang' }], 'Längerer Text ohne Termin oder Betrag', false);
  return out('inbox', text, [{ k: 'Ablage', v: 'Eingang' }], 'Nichts Eindeutiges erkannt. Sortiere später oder wähle eine Art', false);
}

const nextN = (list, prefix) => `${prefix}${(list?.length || 0) + 1}`;
const obj = (v) => (Array.isArray(v) ? {} : v || {});

/** Legt den erkannten Eintrag in der Welt an. Rückgabe { id, restore } – restore macht es rückgängig. */
export function commitCapture(p, { setData, ctx, kind = p.kind }) {
  const today = ctx.today, d = p.data || {};
  const n = (ctx.ui.capCount || 0) + 1; const id = `cap-${kind}-${n}`;
  ctx.setUi('capCount', n);
  const add = (slot, item) => { setData(slot, (l) => [item, ...(Array.isArray(l) ? l : [])]); return () => setData(slot, (l) => (Array.isArray(l) ? l : []).filter((x) => x.id !== id)); };
  let restore;
  if (kind === 'task') restore = add('tasks', { id, title: p.title, due: d.due || isoDay(today), priority: d.priority || 'mittel', project: 'Eingang', category: 'Eingang', status: 'Offen', subtasks: [] });
  else if (kind === 'event') restore = add('events', { id, title: p.title, start: d.start || iso(at(today, today.getHours() + 1, 0)), end: d.end || iso(at(today, today.getHours() + 2, 0)), category: 'Privat', tone: 'accent2', reminders: ['15 Min. vorher'] });
  else if (kind === 'expense') restore = add('transactions', { id, date: iso(today), title: p.title, category: d.category || 'Sonstiges', amount: d.amount ?? 0, account: 'acc-giro', type: (d.amount ?? 0) >= 0 ? 'income' : 'expense', icon: 'receipt' });
  else if (kind === 'meal') restore = add('meals', { id, date: isoDay(today), meal: d.meal || 'snack', time: fmtTime(today), foodId: d.foodId || null, name: p.title, amount: '1 Portion', grams: null, kcal: d.kcal || 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0, source: 'Erfassen' });
  else if (kind === 'shopping') {
    const item = { id, name: p.title, aisle: d.aisle || guessAisle(p.title), qty: d.qty || '' };
    setData('shopping', (s) => ({ ...obj(s), manual: [...(obj(s).manual || []), item] }));
    restore = () => setData('shopping', (s) => ({ ...obj(s), manual: (obj(s).manual || []).filter((x) => x.id !== id) }));
  } else if (kind === 'note') {
    // Notizen legt „Erfassen“ als eigenes Objekt in `notes` an (Eingang der Notizen), nicht im Aufgaben-Eingang.
    const full = String(p.title || '').trim(), short = full.length > 60 ? `${full.slice(0, 60).replace(/\s+\S*$/, '')} …` : full;
    restore = add('notes', { id, title: short, body: full.length > 60 ? full : '', tags: [], inbox: true, updated: iso(today) });
  } else restore = add('inbox', { id, title: p.title, source: 'Erfassen', at: iso(today), suggest: {} });
  return { id, restore, label: `${KINDS[kind].label}: ${p.title}` };
}

/** Zielart von Hand wechseln: bisherige Erkennung übernehmen, Felder der neuen Art setzen; `missing` nennt, was noch fehlt. */
export function asKind(p, kind, today) {
  if (!p || p.kind === kind) return p;
  const base = { ...p, kind, sure: true, why: 'Von dir gewählt', missing: null };
  if (kind === 'task') return { ...base, fields: [{ k: 'Fällig', v: 'ohne Datum' }, { k: 'Priorität', v: 'mittel' }, { k: 'Projekt', v: 'Eingang' }], data: { due: null, priority: 'mittel' } };
  if (kind === 'event') { const s = at(today, Math.min(22, today.getHours() + 1), 0), e = new Date(+s + 3600000); return { ...base, fields: [{ k: 'Wann', v: `${fmtDate(s, { style: 'weekday' })}, ${fmtTime(s)}–${fmtTime(e)}` }, { k: 'Kalender', v: 'Privat' }], data: { start: iso(s), end: iso(e) } }; }
  if (kind === 'expense') { const a = readAmount(p.title); return a ? { ...base, title: clean(p.title.replace(a.raw, ' ')) || p.title, fields: [{ k: 'Ausgabe', v: fmtMoney(a.value) }, { k: 'Konto', v: 'Girokonto' }], data: { amount: -a.value, category: 'Sonstiges' } } : { ...base, fields: [{ k: 'Betrag', v: 'fehlt' }], data: {}, missing: 'Betrag fehlt, z. B. −12,50' }; }
  if (kind === 'meal') return { ...base, fields: [{ k: 'Mahlzeit', v: 'Snack' }, { k: 'Energie', v: 'fehlt' }], data: { meal: 'snack' }, missing: 'kcal fehlen, z. B. 450 kcal' };
  if (kind === 'shopping') return { ...base, fields: [{ k: 'Liste', v: 'Einkauf' }], data: {} };
  return { ...base, fields: [{ k: 'Ablage', v: 'Eingang' }], data: {} };
}
