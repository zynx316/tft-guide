// Gemeinsame Helfer der Insights-Komponenten (Vertrieb, Trading, Fitness, Finanzen).
import { fmt } from '../../../lib/util.js';

/** Relative Zeitangabe ("vor 12 Minuten") bezogen auf ctx.today. */
export const rel = (d, today) => (d ? fmt.relative(d, today instanceof Date ? today : new Date(today)) : '–');

/** Euro-Betrag mit Vorzeichen: +1.234,50 € */
export const signed = (n, digits = 2) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(n))}`;

/** Prozent mit Vorzeichen (Eingabe als Anteil, 0.0123 -> +1,23 %) */
export const signedPct = (n, digits = 2) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt.percent(Math.abs(n), digits)}`;

export const gainColor = (n) => (n > 0 ? 'var(--tk-c-success)' : n < 0 ? 'var(--tk-c-danger)' : 'var(--tk-c-text-muted)');

/** Filter-/Suchlogik mit Zusatz-Zuordnung (Filterchip-Label -> Prädikat). */
export function filterItems(items, ui = {}, fields = [], chipMap = {}) {
  let out = items || [];
  const q = String(ui.query || '').trim().toLowerCase();
  if (q) out = out.filter((it) => fields.some((f) => String(it[f] ?? '').toLowerCase().includes(q)));
  const f = ui.filter;
  if (f && !/^alle?$/i.test(f)) {
    const key = String(f).toLowerCase();
    const pred = chipMap[key];
    out = out.filter((it) => (pred ? pred(it) : fields.some((k) => String(it[k] ?? '').toLowerCase() === key)));
  }
  return out;
}

export const SPIN_CSS = `@keyframes tk-spin { to { transform: rotate(360deg); } } .tk-spin { animation: tk-spin .9s linear infinite; } @media (prefers-reduced-motion: reduce) { .tk-spin { animation: none; } }`;
