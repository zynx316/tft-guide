// Gemeinsame Helfer der Insights-Komponenten (Vertrieb, Trading, Fitness, Finanzen).
import { fmt } from '../../../lib/util.js';
import { fmtMoney } from '../../../lib/format.js';

/** Relative Zeitangabe ("vor 12 Minuten") bezogen auf ctx.today. */
export const rel = (d, today) => (d ? fmt.relative(d, today instanceof Date ? today : new Date(today)) : '–');

/** Euro-Betrag mit Vorzeichen: +1.234,50 € */
export const signed = (n, digits = 2) => fmtMoney(n, { sign: true, cents: digits > 0 });

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

// ---------------------------------------------------------------- Vertrieb: gemeinsame Kanal-Aktionen ---
import { html as _html } from '../../../lib/html.js';
import { Button as _Button } from '../../ui.js';

/** Kanal im geteilten channels-Slot ändern. */
export const patchChannel = (setData, id, p) => setData('channels', (all) => all.map((c) => (c.id === id ? { ...c, ...p } : c)));

/** „Neu verbinden“-Dialog (Simulation): stellt den Kanal nach Bestätigung wieder her. */
export function reconnectDialog(ctx, setData, ch) {
  ctx.emit('channel.reconnect', { id: ch.id });
  ctx.openDialog({
    title: `${ch.name} neu verbinden`,
    body: () => _html`<p class="tk-muted">Du wirst zur Anmeldung bei ${ch.name} weitergeleitet, um den Zugriff zu erneuern. (Simulation in der Vorschau)</p>`,
    footer: (close) => _html`<${_Button} onClick=${close}>Abbrechen<//><${_Button} variant="primary" icon="link-2" onClick=${() => { patchChannel(setData, ch.id, { status: 'connected', error: null, needsAuth: false, lastSync: ctx.today.toISOString() }); ctx.toast(`${ch.name} wieder verbunden`); close(); }}>Verbinden<//>`,
  });
}

/** Bestellstatus-Reihenfolge mit Beschriftungen (Pipeline, Detail, Attention). */
export const ORDER_STAGES = {
  new: { label: 'Neu', icon: 'inbox', tone: 'info', next: 'paid', action: 'Bezahlt markieren', done: 'bezahlt' },
  paid: { label: 'Bezahlt', icon: 'banknote', tone: 'accent', next: 'shipped', action: 'Versenden', done: 'versendet' },
  shipped: { label: 'Versendet', icon: 'truck', tone: 'warning', next: 'delivered', action: 'Zugestellt', done: 'zugestellt' },
  delivered: { label: 'Zugestellt', icon: 'check-circle-2', tone: 'success', next: null },
};
