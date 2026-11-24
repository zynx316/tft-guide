// Trading – fiktive Marktdaten und Demo-Bestände. Alle Kurse sind deterministisch erzeugt und fiktiv (keine realen Marktdaten).
// Die Kurse der Welt (positions, watchlist) sind der Anker: letzter Schlusskurs = Welt-Kurs, Tagesstart = Vortagesschluss.
import * as W from '../../../seed/world/finance.js';

const rng = (seed) => { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const pad = (n) => String(n).padStart(2, '0');
const TODAY = Date.UTC(2026, 10, 24); // Di, 24.11.2026
const at = (off) => new Date(TODAY + off * 86400000);
const isoOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const tradingDays = (n) => { const out = []; for (let off = 0; out.length < n; off--) { const wd = at(off).getUTCDay(); if (wd !== 0 && wd !== 6) out.unshift(at(off)); } return out; };

/** n+1 Kurspunkte von start nach end (Brückenpfad, bleibt positiv). */
function path(r, n, start, end, vol) {
  const l = [0]; for (let i = 1; i <= n; i++) l.push(l[i - 1] + (r() - 0.5) * 3.4 * vol);
  return l.map((x, i) => start * Math.pow(end / start, i / n) * Math.exp(x - (i / n) * l[n]));
}
function candles(r, labels, dates, start, end, vol, dec) {
  const p = path(r, labels.length, start, end, vol), rd = (v) => +v.toFixed(dec);
  return labels.map((t, i) => { const o = p[i], c = p[i + 1]; return { t, ...(dates ? { d: dates[i] } : {}), o: rd(o), h: rd(Math.max(o, c) * (1 + r() * vol * 0.8)), l: rd(Math.min(o, c) * (1 - r() * vol * 0.8)), c: rd(c) }; });
}

// Je Wertpapier: Ticker, Jahresentwicklung (Annahme für den Kursverlauf), Tagesschwankung, Stellen. Werte sind erfunden.
const META = {
  'p-allworld': ['ALLW', 0.14, 0.006], 'p-em': ['EMKT', 0.07, 0.008], 'p-tech': ['WITX', 0.28, 0.011], 'p-allianz': ['ALV', 0.17, 0.010], 'p-apple': ['AAPL', 0.09, 0.013],
  'w-msci': ['MWRD', 0.12, 0.006], 'w-sap': ['SAP', -0.04, 0.012], 'w-nvidia': ['NVDA', 0.45, 0.024], 'w-gold': ['GOLD', 0.19, 0.007], 'w-btc': ['BTC', 0.38, 0.026],
  'c-bund': ['EUGB', 0.015, 0.0025], 'c-nwen': ['NWEN', 0.21, 0.014], 'c-phma': ['PHMA', -0.05, 0.012], 'c-eu': ['MEUR', 0.09, 0.007], 'c-eth': ['ETH', 0.22, 0.03],
};
const ISIN = { 'w-msci': 'IE00B4L5Y983', 'w-sap': 'DE0007164600', 'w-nvidia': 'US67066G1040', 'w-gold': 'DE000A0S9GB0' };
const CATALOG = [
  { id: 'c-bund', name: 'Euro-Staatsanleihen ETF (fiktiv)', short: 'Euro-Anleihen', type: 'Anleihe', price: 101.18, prevClose: 101.05, region: 'Euroraum', sector: 'Staatsanleihen', ter: 0.0015 },
  { id: 'c-nwen', name: 'Nordwind Energie AG (fiktiv)', short: 'Nordwind Energie', type: 'Aktie', price: 23.76, prevClose: 23.41, region: 'Deutschland', sector: 'Energie' },
  { id: 'c-phma', name: 'Pharma Holding SE (fiktiv)', short: 'Pharma Holding', type: 'Aktie', price: 88.9, prevClose: 89.62, region: 'Europa', sector: 'Gesundheit' },
  { id: 'c-eu', name: 'MSCI Europe ETF (fiktiv)', short: 'MSCI Europe', type: 'ETF', price: 74.3, prevClose: 74.12, region: 'Europa', sector: 'Breit gestreut', ter: 0.0012 },
  { id: 'c-eth', name: 'Ethereum (Demo-Kurs)', short: 'Ethereum', type: 'Krypto', price: 3184.5, prevClose: 3122.1, region: 'Global', sector: 'Kryptowert' },
];

function build(base, kind) {
  const [symbol, yr, dv] = META[base.id], dec = base.price >= 5000 ? 0 : 2, r = rng(hash(base.id)), price = base.price, prev = base.prevClose;
  const trend = base.spark || base.trend || [price * 0.97, price];
  const crypto = base.type === 'Krypto';
  const intra = crypto ? Array.from({ length: 10 }, (_, i) => (i === 9 ? '09:30' : `${pad(i)}:00`)) : ['09:00', '09:05', '09:10', '09:15', '09:20', '09:25', '09:30'];
  const days = tradingDays(22), wk = days.slice(-6), yearD = Array.from({ length: 52 }, (_, i) => at(-7 * (51 - i))), monD = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 10 - (59 - i), 24)));
  const lab = (d) => `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.`;
  const ranges = {
    '1T': candles(r, intra, null, prev, price, dv * 0.28, dec),
    '1W': candles(r, wk.map(lab), wk.map(isoOf), trend[Math.max(0, trend.length - 5)], price, dv * 0.8, dec),
    '1M': candles(r, days.map(lab), days.map(isoOf), trend[0], price, dv * 0.9, dec),
    '1J': candles(r, yearD.map((d) => `${lab(d)}${String(d.getUTCFullYear()).slice(2)}`), yearD.map(isoOf), price / (1 + yr), price, dv * 2.2, dec),
    '5J': candles(r, monD.map((d) => `${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`), monD.map(isoOf), price / Math.pow(1 + yr, 3.4) * (yr < 0 ? 1 : 0.92), price, dv * 4.4, dec),
  };
  return { id: base.id, symbol, name: base.name || base.title, short: base.short || base.title, type: base.type, isin: base.isin || ISIN[base.id] || null, currency: 'EUR', price, prevClose: prev,
    ter: base.ter ?? null, distribution: base.distribution || (base.type === 'ETF' ? 'thesaurierend' : null), region: base.region || null, sector: base.sector || null,
    volume: Math.round((60 + r() * 900) * (base.type === 'Aktie' ? 1000 : 100)), kind, ranges };
}

/** Alle handelbaren Wertpapiere: Positionen, Watchlist und ein kleiner Katalog (zum Hinzufügen). */
export function buildInstruments() {
  return [
    ...W.positions.map((p) => build({ ...p, price: p.price, prevClose: p.prevClose }, 'position')),
    ...W.watchlist.map((w) => build({ ...w, prevClose: +(w.price / (1 + w.change)).toFixed(w.price >= 5000 ? 0 : 2), name: w.title, region: w.type === 'Krypto' ? 'Global' : w.type === 'Rohstoff' ? 'Global' : w.type === 'ETF' ? 'Welt' : 'Deutschland', sector: w.type === 'Rohstoff' ? 'Edelmetall' : w.type === 'ETF' ? 'Breit gestreut' : 'Technologie' }, 'watchlist')),
    ...CATALOG.map((c) => build(c, 'catalog')),
  ];
}

/** Katalog-Einträge, die noch nicht in Watchlist/Depot stehen, als Watchlist-Zeile (Weltformat). */
export const watchRow = (i) => ({ id: i.id, title: i.name, type: i.type, price: i.price, change: +(i.price / i.prevClose - 1).toFixed(4), trend: i.ranges['1M'].slice(-8).map((c) => c.c) });

// Demo-Bestände (lokal je Screen, bis eine Welt-Datei für Trading vorhanden ist).
const day = (off, h = 10, m = 0) => `${isoOf(at(off))}T${pad(h)}:${pad(m)}:00`;
export const SEED = {
  alerts: [
    { id: 'al1', securityId: 'w-nvidia', dir: 'below', price: 115, status: 'aktiv', created: '2026-11-09' },
    { id: 'al2', securityId: 'w-msci', dir: 'above', price: 100, status: 'aktiv', created: '2026-11-02' },
    { id: 'al3', securityId: 'p-apple', dir: 'below', price: 205, status: 'aktiv', created: '2026-11-16' },
    { id: 'al4', securityId: 'w-btc', dir: 'above', price: 90000, status: 'aktiv', created: '2026-11-12' },
    { id: 'al5', securityId: 'p-allianz', dir: 'above', price: 285, status: 'ausgelöst', created: '2026-11-05', triggeredAt: day(-5, 10, 12) },
    { id: 'al6', securityId: 'w-sap', dir: 'below', price: 225, status: 'pausiert', created: '2026-10-28' },
  ],
  trades: [
    { id: 'tr-apple', date: '2023-02-20', side: 'buy', securityId: 'p-apple', qty: 8, price: 158.2, fee: 1 },
    { id: 'tr-allianz', date: '2024-03-12', side: 'buy', securityId: 'p-allianz', qty: 6, price: 228.4, fee: 1 },
    { id: 'tr-sap-k', date: '2025-04-02', side: 'buy', securityId: 'w-sap', qty: 5, price: 181, fee: 1 },
    { id: 'tr-sap-v', date: '2026-08-14', side: 'sell', securityId: 'w-sap', qty: 5, price: 238.1, buyPrice: 181, fee: 1 },
  ],
  orders: [
    { id: 'o1', securityId: 'p-allianz', side: 'buy', type: 'limit', qty: 2, limit: 280, price: 280, fee: 1, total: 561, status: 'offen', validity: '30 Tage', created: day(-1, 18, 40) },
    { id: 'o2', securityId: 'p-apple', side: 'sell', type: 'stop', qty: 4, stop: 198, price: 198, fee: 1, total: 791, status: 'offen', validity: '30 Tage', created: day(-3, 11, 5) },
    { id: 'o3', securityId: 'p-em', side: 'buy', type: 'markt', qty: 10, price: 33.85, fee: 1, total: 339.5, status: 'simuliert', validity: 'Tag', created: day(-4, 10, 20) },
  ],
  // Soll-Anteile je Baustein in Prozent (Summe 100); „cash“ = Verrechnungskonto
  targets: { 'p-allworld': 60, 'p-em': 15, 'p-tech': 8, 'p-allianz': 6, 'p-apple': 6, cash: 5 },
  // Fiktiver Vergleichsindex (Welt-Aktien), Monatsstände Dez–Nov, Start = 100
  benchmark: { name: 'Welt-Index (fiktiv)', labels: W.depotHistory.labels, values: [100, 102.4, 103.9, 102.6, 106.1, 108.4, 109.9, 111.6, 110.2, 114.1, 116.3, 118.2] },
};
