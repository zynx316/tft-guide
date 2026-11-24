// Gemeinsame Datenwelt: Trading (ALLES IST SIMULATION, Kurse fiktiv, keine Orderausführung, keine Anlageberatung).
// Depot, Watchlist, Dividenden und Steuerrahmen stehen bis zum Umzug (Befund B9) in finance.js (Schlüsselnamen unverändert).
// Hier liegen die Daten, die vorher im Trading-Manifest lokal waren: Kursalarme, simulierte Orders, gebuchte Käufe/Verkäufe,
// Soll-Anteile und der Vergleichsindex (Ausgangswerte aus der Bibliothek `trading/_seeddata.js`), plus die abgeleiteten Kennzahlen.
import { SEED } from '../../library/components/trading/_seeddata.js';
import { positions, watchlist, depotCash, taxAllowance } from './finance.js';
import { eur, triple, r2 } from './_util.js';
import { fmtPercent } from '../../lib/format.js';

export const tradingAlerts = SEED.alerts.map((a) => ({ ...a }));
export const tradingOrders = SEED.orders.map((o) => ({ ...o }));
export const tradingTrades = SEED.trades.map((t) => ({ ...t }));
export const tradingTargets = { ...SEED.targets };
export const tradingBenchmark = { ...SEED.benchmark, labels: [...SEED.benchmark.labels], values: [...SEED.benchmark.values] };

const priceOf = (id) => positions.find((p) => p.id === id) || watchlist.find((w) => w.id === id);
const nameOf = (id) => { const x = priceOf(id); return x ? (x.short || x.title || x.name) : id; };
const dirText = (a) => (a.dir === 'above' ? 'über' : 'unter');

function tradingSummaryOf(pos, active) {
  const value = pos.reduce((s, p) => s + p.value, 0), prev = pos.reduce((s, p) => s + p.quantity * p.prevClose, 0);
  const day = prev ? value / prev - 1 : 0;
  return { kpis: pos.length ? [
    { label: 'Positionen im Depot', value: pos.length, icon: 'candlestick-chart', tone: 'accent', to: 'trading.portfolio' },
    { label: 'aktive Kursalarme', value: active, icon: 'bell', tone: 'info', to: 'trading.alerts' },
    { label: 'Depot heute', value: fmtPercent(day, { sign: true }), icon: day >= 0 ? 'trending-up' : 'trending-down', tone: 'neutral', to: 'trading.performance' },
    { label: 'Depotwert (Simulation)', value: eur(r2(value + depotCash)), icon: 'wallet', tone: 'info', to: 'trading.portfolio' },
  ] : [{ label: 'Wertpapiere beobachten', value: 0, icon: 'candlestick-chart', tone: 'neutral', to: 'trading.watchlist' }] };
}
export const tradingSummary = tradingSummaryOf(positions, tradingAlerts.filter((a) => a.status === 'aktiv').length);

const near = tradingAlerts.filter((a) => a.status === 'aktiv').map((a) => { const p = priceOf(a.securityId); return p ? { a, gap: Math.abs(p.price / a.price - 1) } : null; }).filter((x) => x && x.gap <= 0.03);
export const tradingHints = [
  ...near.map(({ a, gap }) => ({ id: `h-trd-near-${a.id}`, text: `Kursalarm nah: ${nameOf(a.securityId)} liegt ${fmtPercent(gap)} von der Marke ${dirText(a)} ${eur(a.price, true)} entfernt (Simulation).`, source: `tradingAlerts[${a.id}]`, module: 'trading', tone: 'info', to: 'trading.alerts' })),
  ...tradingOrders.filter((o) => o.status === 'offen').map((o) => ({ id: `h-trd-order-${o.id}`, text: `Offene simulierte Order: ${nameOf(o.securityId)}, ${o.type === 'stop' ? `Stop ${eur(o.stop, true)}` : `Limit ${eur(o.limit, true)}`} (aktuell ${eur(priceOf(o.securityId).price, true)}).`, source: `tradingOrders[${o.id}]`, module: 'trading', tone: 'neutral', to: 'trading.order', carry: { selectedId: o.id } })),
];
export const tradingSearch = [
  ...watchlist.map((w) => ({ id: `watch:${w.id}`, type: 'Watchlist', title: w.title, subtitle: `${w.type} · ${eur(w.price, true)} (Simulation)`, module: 'trading', to: 'trading.detail', params: { id: w.id } })),
  ...tradingAlerts.map((a) => ({ id: `alert:${a.id}`, type: 'Kursalarm', title: `${nameOf(a.securityId)} ${dirText(a)} ${eur(a.price, true)}`, subtitle: `Alarm ${a.status}`, module: 'trading', to: 'trading.alerts', params: { id: a.id } })),
];
const fired = tradingAlerts.filter((a) => a.status === 'ausgelöst').sort((x, y) => String(y.triggeredAt).localeCompare(String(x.triggeredAt)));
export const tradingNotifications = fired.slice(0, 1).map((a) => ({ id: `n-trade-${a.id}`, title: `Kursalarm: ${nameOf(a.securityId)} ${dirText(a)} ${eur(a.price, true)}`, text: 'Watchlist, Simulation. Der Alarm wurde ausgelöst, die Marke gilt als erledigt.', module: 'trading', tone: 'info', priority: 'normal', time: a.triggeredAt, to: 'trading.alerts' }));

// Erster Start: nichts beobachtet, kein Depot; Referenzdaten (Vergleichsindex, Freibetrag) bleiben. Stress: Positionen und Alarme verdreifacht.
export const scenarios = {
  erststart: {
    tradingBenchmark, taxAllowance: { ...taxAllowance, used: 0 },
    tradingSummary: tradingSummaryOf([], 0), tradingHints: [], tradingSearch: [], tradingNotifications: [],
  },
  stress: { tradingSummary: tradingSummaryOf(triple(positions), triple(tradingAlerts).filter((a) => a.status === 'aktiv').length) },
};
