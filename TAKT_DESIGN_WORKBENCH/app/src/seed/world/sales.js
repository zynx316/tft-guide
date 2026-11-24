// Gemeinsame Datenwelt: Sales (Eigentümer: sales) – Verkaufskanäle, Bestellungen, Kennzahlen, Sync-Protokoll.
// Referenztag: Di, 24.11.2026 09:30. Die Zahlen sind rechnerisch konsistent: Summen entstehen aus den Positionen der Bestellungen,
// Kennzahlen, Diagramme und Zeilen werden aus `orders` und `channels` berechnet (auch in den Szenarien).
import { triple, eur, at } from './_util.js';

const REF = '2026-11-24T09:30:00';
const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const plus = (iso, min) => local(new Date(new Date(iso).getTime() + min * 60000));
const r2 = (n) => Math.round(n * 100) / 100;

// ---- Katalog „Nordlicht Studio“ und Bestellungen ----------------------------------------------------------
const PROD = { kissen: ['Leinen-Kissenhülle Fjord 45×45', 24.9], kerze: ['Bienenwachskerzen-Set (3)', 19.9], vase: ['Keramikvase Skagen', 38], decke: ['Wolldecke Skagen', 89], licht: ['Duftlicht Birke', 14.5], ablage: ['Holzablage Eiche', 29.99], korb: ['Jutekorb-Set (2)', 34.5], brett: ['Servierbrett Esche', 32] };
const SEQ = ['new', 'paid', 'shipped', 'delivered'];
const mk = (id, number, customer, ch, date, status, items, ship, payment, address, extra = {}) => {
  const lines = items.map(([k, q]) => ({ sku: k.toUpperCase(), name: PROD[k][0], qty: q, price: PROD[k][1] }));
  const total = r2(lines.reduce((s, l) => s + l.qty * l.price, 0) + ship);
  const at = { new: date, paid: plus(date, 22), shipped: plus(date, 24 * 60 + 40), delivered: plus(date, 3 * 24 * 60) };
  const history = SEQ.slice(0, SEQ.indexOf(status) + 1).map((s) => ({ status: s, at: at[s] }));
  const names = { shopify: 'Shopify', etsy: 'Etsy', amazon: 'Amazon', ebay: 'eBay', shop: 'Eigener Shop' };
  const [first, ...rest] = customer.split(' ');
  return { id, number, customer, channel: names[ch], channelId: ch, items: lines.reduce((s, l) => s + l.qty, 0), total, date, status, lines, shipping: ship, payment, address,
    email: `${first.toLowerCase().replace(/ı/g, 'i')}.${rest.join('').toLowerCase().replace(/ü/g, 'ue').replace(/ı/g, 'i')}@example.org`, history, ...extra };
};
/** Bestellungen der letzten Tage (Summen entstehen aus den Positionen). Status: new | paid | shipped | delivered. */
export const orders = [
  mk('o1', '#4185', 'Anna Berger', 'shopify', '2026-11-24T09:12:00', 'new', [['kissen', 1], ['kerze', 2]], 4.9, 'PayPal', 'Lutterstraße 7, 33602 Bielefeld'),
  mk('o2', '#4184', 'Markus Lindner', 'shop', '2026-11-24T08:40:00', 'new', [['decke', 1], ['kissen', 2], ['licht', 3]], 0, 'Kreditkarte', 'Lindenstraße 14, 30159 Hannover'),
  mk('o3', '#4183', 'Sophie Krämer', 'amazon', '2026-11-24T07:55:00', 'new', [['ablage', 1]], 0, 'Amazon Pay', 'Hammer Straße 31, 48153 Münster'),
  mk('o4', '#4181', 'Jonas Weber', 'etsy', '2026-11-23T19:20:00', 'paid', [['vase', 1]], 4.9, 'PayPal', 'Venloer Straße 88, 50823 Köln'),
  mk('o5', '#4180', 'Fatma Yıldız', 'shopify', '2026-11-23T16:05:00', 'paid', [['korb', 1], ['kerze', 1], ['licht', 2]], 4.9, 'Klarna', 'Eppendorfer Weg 5, 20259 Hamburg'),
  mk('o6', '#4179', 'Lukas Hartmann', 'shop', '2026-11-22T12:30:00', 'paid', [['brett', 2]], 4.9, 'Vorkasse', 'Kaiserstraße 40, 44135 Dortmund'),
  mk('o7', '#4176', 'Lena Roth', 'amazon', '2026-11-22T11:05:00', 'shipped', [['decke', 1], ['kissen', 1]], 0, 'Amazon Pay', 'Torstraße 112, 10119 Berlin', { carrier: 'DHL', tracking: '00340434129876543210' }),
  mk('o8', '#4174', 'Paul Schneider', 'shopify', '2026-11-21T17:45:00', 'shipped', [['vase', 1]], 4.9, 'PayPal', 'Karl-Heine-Straße 9, 04229 Leipzig', { carrier: 'DPD', tracking: '01426012345678' }),
  mk('o9', '#4170', 'Tim Fuchs', 'shopify', '2026-11-20T14:30:00', 'delivered', [['kerze', 1]], 4.9, 'Karte', 'Schwachhauser Heerstraße 21, 28211 Bremen', { carrier: 'DHL', tracking: '00340434129812345678' }),
  mk('o10', '#4168', 'Marie Vogel', 'etsy', '2026-11-19T10:15:00', 'delivered', [['kissen', 2]], 4.9, 'PayPal', 'Bilker Allee 150, 40217 Düsseldorf', { carrier: 'DHL', tracking: '00340434129855555555' }),
  mk('o11', '#4165', 'Daniel Keller', 'ebay', '2026-11-18T09:40:00', 'delivered', [['licht', 1]], 4.9, 'PayPal', 'Böblinger Straße 60, 70199 Stuttgart', { carrier: 'Hermes', tracking: 'H1234567890' }),
];
/** Verkaufskanäle (Umsatz und Bestellungen der letzten 30 Tage). Etsy hat bewusst einen Fehlerzustand: Zugriffstoken abgelaufen. */
export const channels = [
  { id: 'shopify', name: 'Shopify', icon: 'shopping-cart', status: 'connected', lastSync: '2026-11-24T09:18:00', revenue: 6240.5, orders: 78, delta: 8.2, pending: 3, url: 'nordlicht-studio.myshopify.com', trend: [5200, 5400, 5800, 5700, 6100, 6240], autoSync: true, notify: true,
    log: [{ at: '2026-11-24T09:18:00', text: '3 neue Bestellungen importiert', tone: 'success' }, { at: '2026-11-24T09:03:00', text: 'Bestand abgeglichen (84 Artikel)', tone: 'info' }, { at: '2026-11-24T08:48:00', text: 'Synchronisation ohne Änderungen', tone: 'info' }] },
  { id: 'etsy', name: 'Etsy', icon: 'store', status: 'error', lastSync: '2026-11-23T21:40:00', revenue: 1980, orders: 31, delta: -4.1, url: 'etsy.com/shop/NordlichtStudio', trend: [2300, 2250, 2100, 2050, 2000, 1980], autoSync: true, notify: true,
    error: 'Zugriffstoken abgelaufen – Bestellungen werden nicht importiert.', needsAuth: true,
    log: [{ at: '2026-11-23T21:40:00', text: 'Zugriffstoken abgelaufen – Import gestoppt', tone: 'danger' }, { at: '2026-11-23T21:25:00', text: '1 neue Bestellung importiert', tone: 'success' }, { at: '2026-11-23T19:10:00', text: 'Bestand abgeglichen (61 Artikel)', tone: 'info' }] },
  { id: 'amazon', name: 'Amazon', icon: 'package', status: 'connected', lastSync: '2026-11-24T08:45:00', revenue: 4310.2, orders: 52, delta: 3.4, pending: 1, url: 'sellercentral.amazon.de', trend: [3900, 4000, 4100, 4150, 4250, 4310], autoSync: true, notify: true,
    log: [{ at: '2026-11-24T08:45:00', text: '1 neue Bestellung importiert', tone: 'success' }, { at: '2026-11-24T07:30:00', text: 'Versandstatus zurückgeschrieben (2 Bestellungen)', tone: 'info' }] },
  { id: 'ebay', name: 'eBay', icon: 'tag', status: 'paused', lastSync: '2026-11-18T10:00:00', revenue: 410, orders: 9, delta: -22, url: 'ebay.de/usr/nordlicht-studio', trend: [620, 580, 520, 470, 430, 410], autoSync: false, notify: true,
    log: [{ at: '2026-11-18T10:00:00', text: 'Kanal pausiert', tone: 'info' }, { at: '2026-11-18T09:40:00', text: '1 neue Bestellung importiert', tone: 'success' }] },
  { id: 'shop', name: 'Eigener Shop', icon: 'globe', status: 'connected', lastSync: '2026-11-24T09:25:00', revenue: 2875, orders: 24, delta: 12.5, url: 'nordlicht-studio.de', trend: [2100, 2300, 2450, 2600, 2750, 2875], autoSync: true, notify: false,
    log: [{ at: '2026-11-24T09:25:00', text: 'Synchronisation ohne Änderungen', tone: 'info' }, { at: '2026-11-24T08:40:00', text: '1 neue Bestellung importiert', tone: 'success' }] },
];

function deriveSales(orders, channels) {
  const today = orders.filter((o) => o.date.startsWith('2026-11-24'));
  const todayRevenue = r2(today.reduce((s, o) => s + o.total, 0));
  const todayBy = (id) => r2(today.filter((o) => o.channelId === id).reduce((s, o) => s + o.total, 0));
  const totalRevenue = r2(channels.reduce((s, c) => s + c.revenue, 0));
  const totalOrders = channels.reduce((s, c) => s + c.orders, 0);
  const toDo = orders.filter((o) => o.status === 'new' || o.status === 'paid').length;
  const has = channels.length > 0;
  // 7-Tage-Reihen je Kanal (Mi 18.11. bis Di 24.11., heute bis 09:30); der heutige Wert entsteht aus den Bestellungen
  // Ohne Kanal gibt es keine Reihen: das Diagramm zeigt seinen Leerzustand statt einer Nulllinie mit Achse „1 · 1 · 0“
  const revenue = { labels: ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'], series: !has ? [] : [
    { name: 'Shopify', values: [212, 246, 301, 188, 163, 229, todayBy('shopify')] },
    { name: 'Amazon', values: [141, 162, 138, 187, 126, 152, todayBy('amazon')] },
    { name: 'Eigener Shop', values: [88, 74, 121, 96, 85, 103, todayBy('shop')] },
    { name: 'Etsy', values: [59, 71, 64, 38, 47, 52, 0] }] };
  const sumDay = (i) => r2(revenue.series.reduce((s, x) => s + x.values[i], 0));
  const dayTotals = revenue.labels.map((_, i) => sumDay(i));
  const shares = { segments: channels.map((c) => ({ label: c.name, value: c.revenue })).sort((a, b) => b.value - a.value) };
  const stageChart = { segments: !orders.length ? [] : ['new', 'paid', 'shipped', 'delivered'].map((k) => ({ label: { new: 'Neu', paid: 'Bezahlt', shipped: 'Versendet', delivered: 'Zugestellt' }[k], value: orders.filter((o) => o.status === k).length })) };
  // Kennzahlen als Rohwerte mit Art (kind): die Komponente formatiert und maskiert sie im Privatsphäre-Modus. Ohne Datenbasis `raw: null` → „–“, keine Veränderung.
  const metrics = [
    { label: 'Umsatz heute', raw: todayRevenue, kind: 'money', icon: 'banknote', tone: 'success', ...(has ? { spark: dayTotals } : {}) },
    { label: 'Bestellungen heute', raw: today.length, icon: 'shopping-cart', tone: 'accent', ...(has ? { spark: [6, 8, 7, 9, 12, 10, today.length] } : {}) },
    { label: 'Zu bearbeiten', raw: toDo, icon: 'inbox', tone: 'warning' },
    { label: 'Retourenquote', raw: has ? 2.8 : null, kind: 'percent', digits: 1, icon: 'rotate-ccw', tone: 'info', ...(has ? { delta: -0.4 } : {}), suffix: ' PP', invert: true },
  ];
  const aov = totalOrders ? r2(totalRevenue / totalOrders) : null;
  const metricsRevenue = [
    { label: 'Umsatz 30 Tage', raw: has ? totalRevenue : null, kind: 'money', digits: 0, sensitive: true, icon: 'banknote', tone: 'success', ...(has ? { delta: 6.1 } : {}) },
    { label: 'Bestellungen', raw: totalOrders, sensitive: true, icon: 'shopping-cart', tone: 'accent', ...(has ? { delta: 4.3 } : {}) },
    { label: 'Ø Warenkorb', raw: aov, kind: 'money', sensitive: true, icon: 'package', tone: 'info', ...(has ? { delta: 1.8 } : {}) },
    { label: 'Retourenquote', raw: has ? 2.8 : null, kind: 'percent', digits: 1, icon: 'rotate-ccw', tone: 'warning', ...(has ? { delta: -0.4 } : {}), suffix: ' PP', invert: true },
  ];
  const rows = channels.map((c) => ({ id: c.id, title: c.name, icon: c.icon, status: { connected: 'Verbunden', error: 'Fehler', paused: 'Pausiert' }[c.status], tone: { connected: 'success', error: 'danger', paused: 'neutral' }[c.status],
    revenue: c.revenue, orders: c.orders, change: c.delta / 100, trend: c.trend, subtitle: c.error || `${c.orders} Bestellungen in 30 Tagen`, meta: { shopify: 'vor 12 Min.', etsy: 'gestern 21:40', amazon: 'vor 45 Min.', ebay: '18.11.', shop: 'vor 5 Min.' }[String(c.id).split('~')[0]]}));
  const syncLog = channels.flatMap((c) => c.log.map((l, i) => ({ id: `${c.id}-${i}`, title: `${c.name}: ${l.text}`, time: l.at, icon: l.tone === 'danger' ? 'alert-triangle' : l.tone === 'success' ? 'refresh-cw' : 'info', tone: l.tone === 'info' ? 'accent' : l.tone }))).sort((a, b) => b.time.localeCompare(a.time));
  return { today, todayRevenue, totalRevenue, totalOrders, toDo, revenue, shares, stageChart, metrics, metricsRevenue, rows, syncLog };
}

const D = deriveSales(orders, channels);
export const salesMetrics = D.metrics;
export const salesMetricsRevenue = D.metricsRevenue;
export const salesRevenue = D.revenue;
export const salesShares = D.shares;
export const salesRows = D.rows;
export const salesStageChart = D.stageChart;
export const salesSyncLog = D.syncLog;

const summaryOf = (d, chs) => ({ kpis: chs.length ? [
  { label: 'Bestellungen offen', value: d.toDo, icon: 'inbox', tone: d.toDo ? 'warning' : 'success', to: 'sales.orders' },
  { label: 'Bestellungen heute', value: d.today.length, icon: 'shopping-cart', tone: 'accent', to: 'sales.overview' },
  { label: 'Verbindungsfehler', value: chs.filter((c) => c.status === 'error').length, icon: 'alert-triangle', tone: chs.some((c) => c.status === 'error') ? 'danger' : 'success', to: 'sales.connect' },
  { label: 'Umsatz heute', value: eurText(d.todayRevenue), icon: 'banknote', tone: 'success', to: 'sales.revenue' },
] : [{ label: 'Kanäle verbunden', value: 0, icon: 'store', tone: 'neutral', to: 'sales.connect' }] });
function eurText(v) { return eur(v, true); }
export const salesSummary = summaryOf(D, channels);

const errCh = channels.filter((c) => c.status === 'error');
export const salesHints = [
  ...errCh.map((c) => ({ id: `h-sales-${c.id}`, text: `${c.name}: ${c.error} Neu verbinden stellt den Abgleich wieder her.`, source: `channels[${c.id}]`, module: 'sales', tone: 'warning', to: 'sales.connect', carry: { selectedId: c.id } })),
  ...(D.toDo ? [{ id: 'h-sales-todo', text: `${D.toDo} Bestellungen warten auf Zahlung oder Versand.`, source: 'orders', module: 'sales', tone: 'info', to: 'sales.orders' }] : []),
];
export const salesSearch = [
  ...orders.map((o) => ({ id: `order:${o.id}`, type: 'Bestellung', title: `${o.number} ${o.customer}`, subtitle: `${o.channel} · ${eurText(o.total)} · ${({ new: 'neu', paid: 'bezahlt', shipped: 'versendet', delivered: 'zugestellt' })[o.status]}`, module: 'sales', to: 'sales.order', params: { id: o.id } })),
  ...channels.map((c) => ({ id: `channel:${c.id}`, type: 'Kanal', title: c.name, subtitle: c.error || `${c.orders} Bestellungen in 30 Tagen`, module: 'sales', to: 'sales.channel', params: { id: c.id } })),
];
export const salesNotifications = errCh.map((c) => ({ id: `n-sales-${c.id}`, title: `${c.name}: Anmeldung abgelaufen`, text: 'Bestellungen werden nicht mehr abgeglichen. Verbinde den Kanal neu.', module: 'sales', tone: 'danger', priority: 'wichtig', time: at(0, '07:48'), to: 'sales.connect' }));

// Erster Start: noch kein Kanal verbunden. Stress: Bestellungen und Kanäle verdreifacht, Kennzahlen folgen.
const zero = deriveSales([], []);
const sOrders = triple(orders), sChannels = triple(channels), S = deriveSales(sOrders, sChannels);
export const scenarios = {
  erststart: { salesMetrics: zero.metrics, salesMetricsRevenue: zero.metricsRevenue, salesRevenue: zero.revenue, salesShares: zero.shares, salesStageChart: zero.stageChart, salesSummary: summaryOf(zero, []) },
  stress: { salesMetrics: S.metrics, salesMetricsRevenue: S.metricsRevenue, salesStageChart: S.stageChart, salesRows: S.rows, salesShares: S.shares, salesSyncLog: S.syncLog, salesSummary: summaryOf(S, sChannels) },
};
