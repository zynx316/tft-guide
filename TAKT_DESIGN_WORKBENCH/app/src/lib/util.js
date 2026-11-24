// Kleine, abhaengigkeitsfreie Helfer – von Workbench, Preview und QA gemeinsam genutzt.

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const slug = (s) => String(s || '').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'item';

export const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

export const nowIso = () => new Date().toISOString();

const dtf = (opts) => new Intl.DateTimeFormat('de-DE', opts);
export const fmt = {
  date: (d) => dtf({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)),
  dateShort: (d) => dtf({ day: '2-digit', month: '2-digit' }).format(new Date(d)),
  dateLong: (d) => dtf({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d)),
  weekday: (d) => dtf({ weekday: 'short' }).format(new Date(d)),
  weekdayLong: (d) => dtf({ weekday: 'long' }).format(new Date(d)),
  month: (d) => dtf({ month: 'long', year: 'numeric' }).format(new Date(d)),
  time: (d) => dtf({ hour: '2-digit', minute: '2-digit' }).format(new Date(d)),
  dateTime: (d) => dtf({ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)),
  relative: (d, base = new Date()) => {
    const diff = (new Date(d) - base) / 1000;
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' });
    if (abs < 60) return 'gerade eben';
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    return fmt.date(d);
  },
  number: (n, digits = 0) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n),
  currency: (n, cur = 'EUR') => new Intl.NumberFormat('de-DE', { style: 'currency', currency: cur }).format(n),
  percent: (n, digits = 1) => new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n),
};

/** Lokales Datum als YYYY-MM-DD (nicht toISOString – das wäre UTC und ab UTC+x um einen Tag verschoben). */
export const isoDay = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

export const sameDay = (a, b) => {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};
export const startOfWeek = (d) => { // Montag
  const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x;
};
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

export const cx = (...parts) => parts.flat().filter(Boolean).join(' ');

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function moveItem(arr, from, to) {
  const a = arr.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
}
