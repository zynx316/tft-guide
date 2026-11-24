// Modul "Trading" – Watchlist, Depot, Wertpapier-Detail, Order (Simulation), Kursalarme
// ALLE Kurse und Wertpapiere sind fiktive Demo-Werte (deterministisch erzeugt), keine realen Marktdaten.
const rng = (seed) => { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pad = (n) => String(n).padStart(2, '0');
const TODAY = Date.UTC(2026, 10, 24); // Di, 24.11.2026
const dayLabel = (off, yy) => { const d = new Date(TODAY + off * 86400000); return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${yy ? String(d.getUTCFullYear()).slice(2) : ''}`; };
const tradingDays = (n) => { const out = []; let off = 0; while (out.length < n) { const wd = new Date(TODAY + off * 86400000).getUTCDay(); if (wd !== 0 && wd !== 6) out.unshift(off); off--; } return out; };

function candles(labels, last, vol, drift, seed, dec) {
  const r = rng(seed); const n = labels.length; const raw = [1];
  for (let i = 1; i < n; i++) raw.push(raw[i - 1] * (1 + drift + (r() - 0.5) * 2 * vol));
  const k = last / raw[n - 1]; const round = (v) => +v.toFixed(dec);
  return labels.map((t, i) => { const c = raw[i] * k; const o = i ? raw[i - 1] * k : c * (1 - drift); return { t, o: round(o), h: round(Math.max(o, c) * (1 + r() * vol * 0.6)), l: round(Math.min(o, c) * (1 - r() * vol * 0.6)), c: round(c) }; });
}
const days = tradingDays(22);
const wk = ['Mo', 'Di', 'Mi', 'Do', 'Fr'].flatMap((d) => ['09:00', '11:30', '14:00', '16:30'].map((h) => `${d} ${h}`));
const intraday = Array.from({ length: 18 }, (_, i) => `${pad(9 + Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);
const year = Array.from({ length: 52 }, (_, i) => dayLabel(-7 * (51 - i), true));
function instrument(id, symbol, name, type, last, vol, drift, seed, dec = 2) {
  return { id, symbol, name, type, currency: 'EUR', price: last, ranges: {
    '1T': candles(intraday, last, vol * 0.25, drift / 18, seed + 1, dec), '1W': candles(wk, last, vol * 0.4, drift / 5, seed + 2, dec),
    '1M': candles(days.map((o) => dayLabel(o)), last, vol, drift, seed + 3, dec), '1J': candles(year, last, vol * 2.4, drift * 1.6, seed + 4, dec) } };
}
const instruments = [
  instrument('msci', 'MSCW', 'Welt-Aktien ETF (fiktiv)', 'ETF', 98.42, 0.006, 0.0014, 11),
  instrument('sapx', 'SOFT', 'Softwarehaus AG (fiktiv)', 'Aktie', 164.2, 0.011, -0.0016, 23),
  instrument('btc', 'BTCD', 'Bitcoin (Demo-Kurs)', 'Krypto', 84120, 0.024, 0.0028, 37, 0),
  instrument('nwen', 'NWEN', 'Nordwind Energie AG (fiktiv)', 'Aktie', 23.76, 0.014, 0.0021, 41),
  instrument('eugb', 'EUGB', 'Euro-Staatsanleihen ETF (fiktiv)', 'Anleihe', 101.18, 0.0025, 0.0003, 53),
  instrument('pharm', 'PHMA', 'Pharma Holding SE (fiktiv)', 'Aktie', 88.9, 0.012, -0.0009, 67),
];
const last = (i, r = '1T') => i.ranges[r][i.ranges[r].length - 1].c;
const dayChg = (i) => +(last(i) / i.ranges['1T'][0].o - 1).toFixed(4);
const closes = (i) => i.ranges['1M'].map((c) => c.c);
const rows = instruments.map((i) => ({ id: i.id, title: i.name, symbol: i.symbol, type: i.type, price: last(i), change: dayChg(i), trend: closes(i) }));

const holdings = { msci: [42, 88.4], sapx: [15, 171], btc: [0.08, 61000], nwen: [120, 21.8], eugb: [30, 102.4] };
const positions = Object.entries(holdings).map(([id, [qty, avgPrice]]) => { const i = instruments.find((x) => x.id === id);
  return { id, symbol: i.symbol, name: i.name, type: i.type, qty, avgPrice, price: last(i), dayChange: dayChg(i), spark: closes(i) }; });
const eur = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
const positionRows = positions.map((p) => ({ id: p.id, title: p.name, qty: p.qty, price: p.price, value: +(p.qty * p.price).toFixed(2), pl: +(p.price / p.avgPrice - 1).toFixed(4), type: p.type, trend: p.spark }));
const sumBy = (fn) => positions.filter(fn).reduce((a, p) => a + p.qty * p.price, 0);
const allocation = { segments: ['ETF', 'Aktie', 'Krypto', 'Anleihe'].map((label) => ({ label, value: Math.round(sumBy((p) => p.type === label)) })).sort((x, y) => y.value - x.value) };
const total = positions.reduce((a, p) => a + p.qty * p.price, 0) + 5000;
const performance = { labels: ['KW 41', 'KW 42', 'KW 43', 'KW 44', 'KW 45', 'KW 46', 'KW 47', 'KW 48'], series: [{ name: 'Depotwert', values: [0.905, 0.93, 0.915, 0.955, 0.97, 0.96, 0.99, 1].map((f) => Math.round(total * f)) }] };
const orders = [
  { id: 'ord1', title: 'Kauf 5 × Welt-Aktien ETF', subtitle: 'Marktorder · Gesamt 493,10 €', meta: 'Mo 23.11.', badge: 'Simulation', tone: 'info', icon: 'trending-up' },
  { id: 'ord2', title: 'Verkauf 10 × Softwarehaus AG', subtitle: 'Limit 170,00 € · offen', meta: 'Fr 20.11.', badge: 'Simulation', tone: 'info', icon: 'trending-down' },
  { id: 'ord3', title: 'Kauf 0,05 × Bitcoin (Demo)', subtitle: 'Marktorder · Gesamt 4.207,00 €', meta: '12.11.', badge: 'Simulation', tone: 'info', icon: 'trending-up' },
];
const alerts = [
  { id: 'al1', title: 'Softwarehaus AG fällt unter 160 €', subtitle: 'Aktuell 164,20 € · ca. 2,6 % Abstand', meta: 'aktiv', badge: 'Kurs', tone: 'warning', icon: 'bell' },
  { id: 'al2', title: 'Bitcoin (Demo) über 90.000 €', subtitle: 'Aktuell 84.120 €', meta: 'aktiv', badge: 'Kurs', tone: 'accent', icon: 'bell' },
];
const facts = [
  { label: 'Tageshoch', value: '98,71', unit: '€', icon: 'arrow-up', tone: 'success' }, { label: 'Tagestief', value: '97,48', unit: '€', icon: 'arrow-down', tone: 'danger' },
  { label: 'Volumen', value: '184 Tsd.', icon: 'bar-chart-3', tone: 'info' }, { label: 'Spanne 52 Wochen', value: '81–99', unit: '€', icon: 'gauge', tone: 'accent' },
];
const demoData = { instruments, rows, positions, positionRows, allocation, performance, orders, alerts, facts };
const cols = 'title:Wertpapier:text, price:Kurs:currency, change:Heute:percent, trend:Verlauf 1M:spark';

export default {
  module: {
    id: 'trading', name: 'Trading', icon: 'candlestick-chart', status: 'active', theme: 'graphite', designVersion: '0.2', isReference: false,
    description: 'Märkte beobachten und das eigene Depot im Blick behalten: Watchlist, Kursverläufe, Portfolio und simulierte Orders – ohne echte Orderausführung.',
    source: 'Auftrag 2026-11 (in Phase 1 gegen das TAKT-Modulregister verifizieren)',
    infoArchitecture: '1) Watchlist (Kurse, Tagesveränderung, Mini-Verlauf) → 2) Wertpapier-Detail (Kursdiagramm, Kennzahlen, Order) → 3) Depot (Wert, Gewinn/Verlust, Allokation) → 4) Order erfassen (Simulation) → 5) Kursalarme. Auswahl in der Watchlist steuert Diagramm und Order-Ticket.',
    docs: 'Wichtig: Alle Kurse in der Workbench sind fiktiv. Das Modul ist in Phase 1 reine Anzeige plus Simulation; echte Orderausführung ist ausdrücklich nicht Teil des Entwurfs (siehe Entscheidung). Offen: Datenquelle und Aktualität der Kurse, Verzögerungshinweise, Rechtstext „keine Anlageberatung“.',
    links: ['finance', 'tasks'],
  },
  features: [
    {
      id: 'trading.watchlist', name: 'Watchlist', group: 'Märkte', status: 'design',
      purpose: 'Beobachtete Wertpapiere mit Kurs, Tagesveränderung und Mini-Verlauf scannen und per Tipp den Kursverlauf öffnen.',
      requirements: [
        { text: 'Je Wertpapier: Name, Kurs, Veränderung heute (farbig), Mini-Verlauf', type: 'info', priority: 'must' },
        { text: 'Nach Name suchen und nach Typ (ETF, Aktie, Krypto, Anleihe) filtern', type: 'action', priority: 'should' },
        { text: 'Antippen wählt das Wertpapier und zeigt Kursdiagramm', type: 'action', priority: 'must' },
        { text: 'Sortierbar nach Name, Kurs und Veränderung', type: 'action', priority: 'should' },
        { text: 'Gewinn grün, Verlust rot – zusätzlich mit Vorzeichen (nicht nur Farbe)', type: 'rule', priority: 'must' },
        { text: 'Leere Watchlist zeigt Hinweis „Wertpapier hinzufügen“', type: 'state', priority: 'must' },
        { text: 'Kennzeichnung, dass Kurse verzögert/fiktiv sein können', type: 'info', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Zeile antippen', result: 'Wertpapier gewählt, Kursdiagramm aktualisiert', event: 'row.open' },
        { trigger: 'Zeitraum im Diagramm wechseln', result: 'Diagramm zeigt 1T/1W/1M/1J', event: 'chart.range' },
        { trigger: 'Spaltenkopf antippen', result: 'Sortierung wechselt', event: 'table.sort' },
        { trigger: 'Filterchip wählen', result: 'Nur gewählter Typ sichtbar', event: 'filter.change' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Liste + Diagramm', concept: 'Master-Detail: links durchsuchbare Watchlist, rechts Kursdiagramm des gewählten Papiers. Auf Mobile folgt das Diagramm unter der Liste.',
        description: '+ Schnell vergleichen und hineinzoomen  − Auf Mobile Scrollen zwischen Liste und Diagramm',
        layout: { type: 'split' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Watchlist', subtitle: 'Kurse fiktiv · Stand 24.11.2026 09:30', primaryLabel: 'Hinzufügen' } },
          { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Wertpapier suchen …', filters: 'Alle, ETF, Aktie, Krypto, Anleihe' } },
          { id: 'tbl', component: 'data-table', region: 'main', bind: { rows: 'rows' }, props: { columns: cols } },
          { id: 'chart', component: 'price-chart', region: 'aside', bind: { instruments: 'instruments' }, props: { type: 'area', initialRange: '1M', height: 240 } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'trading.portfolio', name: 'Depot', group: 'Portfolio', status: 'design',
      purpose: 'Den Wert des Depots, Gewinn/Verlust und die Verteilung auf einen Blick erfassen und Positionen im Detail prüfen.',
      requirements: [
        { text: 'Depotwert, Gesamt-G/V (€ und %) und Tagesveränderung prominent', type: 'info', priority: 'must' },
        { text: 'Allokation nach Anlageklasse (ETF, Aktie, Krypto, Anleihe)', type: 'info', priority: 'must' },
        { text: 'Positionen mit Stückzahl, Marktwert und G/V; Detaildialog je Position', type: 'info', priority: 'must' },
        { text: 'Aus der Position heraus eine simulierte Order erfassen', type: 'action', priority: 'should' },
        { text: 'Depotverlauf der letzten Wochen', type: 'info', priority: 'should' },
        { text: 'Leeres Depot zeigt Einstiegshinweis statt Nullwerten', type: 'state', priority: 'must' },
        { text: 'Deutlicher Hinweis „Simulation/Anzeige“, keine Anlageberatung', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Position antippen', result: 'Detaildialog mit Einstand, Kurs und G/V', event: 'position.open' },
        { trigger: '„Order erfassen“ im Dialog', result: 'Order-Ticket (Simulation) wird vorbereitet', event: 'position.trade' },
        { trigger: 'Zeile in Tabelle antippen', result: 'Position wird gewählt', event: 'row.open' },
        { trigger: 'Segment im Ring antippen', result: 'Anteil wird in der Mitte angezeigt', event: 'chart.point' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [
        {
          id: 'A', name: 'Cockpit', concept: 'Dashboard: großer Depot-Kopf mit Allokationsband, darunter Positionstabelle neben Ringdiagramm und Verlaufsfläche. Für Desktop und Analyse.',
          description: '+ Alles gleichzeitig, sortierbare Tabelle  − Mobile wird zu einer langen Seite',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Depot', subtitle: 'Simulation · Kurse fiktiv', primaryLabel: 'Order erfassen', primaryIcon: 'plus', primaryEvent: 'order.new' } },
            { id: 'sum', component: 'portfolio-summary', region: 'main', span: 12, bind: { positions: 'positions' }, props: { layout: 'summary', cash: 5000 } },
            { id: 'tbl', component: 'data-table', region: 'main', span: 7, bind: { rows: 'positionRows' }, props: { title: 'Positionen', columns: 'title:Position:text, qty:Stück:number, value:Wert:currency, pl:G/V:percent, trend:Verlauf:spark' } },
            { id: 'ring', component: 'chart', region: 'main', span: 5, bind: { series: 'allocation' }, props: { title: 'Allokation', type: 'donut' } },
            { id: 'perf', component: 'chart', region: 'main', span: 12, bind: { series: 'performance' }, props: { title: 'Depotverlauf – 8 Wochen', type: 'area', height: 180, format: 'currency', showLegend: false } },
          ],
        },
        {
          id: 'B', name: 'Positionen zuerst', concept: 'Mobile-first: kompakter Depotwert oben, darunter Reiter Positionen / Allokation / Verlauf. Positionen als tippbare Liste mit Detaildialog; Suche über der Liste.',
          description: '+ Eine Spalte, schnell auf dem Handy  − Weniger Überblick auf großen Bildschirmen',
          layout: { type: 'tabs', narrow: true },
          blocks: [
            { id: 'sum', component: 'portfolio-summary', region: 'header', bind: { positions: 'positions' }, props: { title: 'Mein Depot', layout: 'summary', allocationBy: 'position' } },
            { id: 'flt', component: 'search-filter', region: 'main', tab: 'Positionen', props: { placeholder: 'Position suchen …', filters: '' } },
            { id: 'pos', component: 'portfolio-summary', region: 'main', tab: 'Positionen', bind: { positions: 'positions' }, props: { layout: 'positions' } },
            { id: 'ring', component: 'chart', region: 'main', tab: 'Allokation', bind: { series: 'allocation' }, props: { title: 'Nach Anlageklasse', type: 'donut' } },
            { id: 'perf', component: 'chart', region: 'main', tab: 'Verlauf', bind: { series: 'performance' }, props: { title: 'Depotwert', type: 'area', height: 200, format: 'currency', showLegend: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
    },
    {
      id: 'trading.detail', name: 'Wertpapier-Detail', group: 'Märkte', status: 'design',
      purpose: 'Ein Wertpapier genau ansehen: Kursverlauf in verschiedenen Zeiträumen, Kennzahlen und direkter Weg zur simulierten Order.',
      requirements: [
        { text: 'Kursdiagramm als Linie, Fläche oder Kerzen mit Zeiträumen 1T, 1W, 1M, 1J', type: 'info', priority: 'must' },
        { text: 'Crosshair/Tooltip mit Datum, Kurs und Veränderung beim Überfahren oder Tippen', type: 'action', priority: 'must' },
        { text: 'Kennzahlen: Tageshoch/-tief, Volumen, Spanne 52 Wochen', type: 'info', priority: 'should' },
        { text: 'Order-Ticket (Simulation) direkt neben dem Diagramm', type: 'action', priority: 'should' },
        { text: 'Ohne Kursdaten zeigt das Diagramm einen Leerzustand', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Zeitraum wählen', result: 'Diagramm lädt Zeitraum neu', event: 'chart.range' },
        { trigger: 'Darstellung wechseln', result: 'Linie ⇄ Kerzen', event: 'chart.type' },
        { trigger: 'Diagramm antippen', result: 'Punkt wird fixiert', event: 'chart.point' },
        { trigger: 'Order prüfen', result: 'Bestätigungsdialog (Simulation)', event: 'order.review' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData: { ...demoData, instruments: instruments.slice(0, 1) },
      variants: [{
        id: 'A', name: 'Chart-Fokus', concept: 'Großes Kursdiagramm mit Kerzen als Standard, Kennzahlen darunter, Order-Ticket in der Seitenspalte.',
        description: '+ Analyse und Aktion zusammen  − Seitenspalte rutscht auf Mobile unter den Inhalt',
        layout: { type: 'split' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Wertpapier', subtitle: 'Kurse fiktiv', primaryLabel: 'Alarm', primaryIcon: 'bell', primaryEvent: 'alert.new' } },
          { id: 'chart', component: 'price-chart', region: 'main', bind: { instruments: 'instruments' }, props: { type: 'candles', initialRange: '1M', height: 300 } },
          { id: 'facts', component: 'metric-row', region: 'main', bind: { metrics: 'facts' }, props: { showSpark: false } },
          { id: 'ticket', component: 'order-ticket', region: 'aside', bind: { instruments: 'instruments', positions: 'positions', target: 'orders' }, props: { cash: 5000 } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'trading.order', name: 'Order erfassen (Simulation)', group: 'Orders', status: 'review',
      purpose: 'Eine Kauf- oder Verkaufsorder durchspielen – mit Prüfung und Bestätigung, aber ohne echte Ausführung.',
      requirements: [
        { text: 'Kauf/Verkauf, Wertpapier, Stückzahl und Ordertyp (Markt/Limit) erfassen', type: 'action', priority: 'must' },
        { text: 'Validierung: Stückzahl > 0, ganze Stücke, Verkauf nur bis Bestand, Kauf nur bis Guthaben, Limit > 0', type: 'rule', priority: 'must' },
        { text: 'Vorschau mit geschätztem Wert, Gebühr und Gesamtkosten', type: 'info', priority: 'must' },
        { text: 'Bestätigungsdialog vor dem Platzieren', type: 'action', priority: 'must' },
        { text: 'Durchgängig als „Simulation“ gekennzeichnet (Banner, Badge, Dialog)', type: 'rule', priority: 'must' },
        { text: 'Platzierte Orders erscheinen sofort in der Orderliste', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Order prüfen', result: 'Validierung; bei Erfolg Bestätigungsdialog', event: 'order.review' },
        { trigger: 'Ungültige Eingabe', result: 'Fehlermeldung unter dem Feld', event: 'order.invalid' },
        { trigger: '„Simuliert platzieren“', result: 'Order erscheint in der Liste, Toast', event: 'order.confirm' },
        { trigger: 'Abbrechen im Dialog', result: 'Dialog schließt, Eingaben bleiben', event: 'order.cancel' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Ticket + Orderliste', concept: 'Links das Order-Ticket mit Validierung, rechts die bisherigen simulierten Orders. Hinweisbanner oberhalb.',
        description: '+ Schnell, klar als Simulation erkennbar  − Kein Mehrschritt-Assistent',
        layout: { type: 'split', even: true },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Order erfassen', subtitle: 'Simulation – keine echte Ausführung', primaryLabel: '' } },
          { id: 'n', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Nur Simulation', text: 'Orders werden nicht an einen Broker gesendet. Gebühren sind eine Annahme.', dismissible: false } },
          { id: 'ticket', component: 'order-ticket', region: 'main', bind: { instruments: 'instruments', positions: 'positions', target: 'orders' }, props: { cash: 5000 } },
          { id: 'list', component: 'item-list', region: 'aside', bind: { items: 'orders' }, props: { title: 'Simulierte Orders', selectable: false, emptyTitle: 'Noch keine Orders' } },
        ],
      }],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf' }, { kind: 'review' }],
    },
    {
      id: 'trading.alerts', name: 'Kursalarme', group: 'Märkte', status: 'analyzed',
      purpose: 'Benachrichtigt werden, wenn ein Wertpapier eine Kursmarke über- oder unterschreitet.',
      requirements: [
        { text: 'Alarm je Wertpapier mit Richtung (über/unter) und Kursmarke', type: 'action', priority: 'must' },
        { text: 'Liste aktiver und ausgelöster Alarme', type: 'info', priority: 'must' },
        { text: 'Benachrichtigung per Push und im TAKT-Verlauf', type: 'rule', priority: 'should' },
        { text: 'Alarm pausieren oder löschen', type: 'action', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Alarm anlegen', result: 'Formular, danach Eintrag in der Liste', event: 'form.submit' },
        { trigger: 'Alarm antippen', result: 'Detail/Bearbeiten', event: 'item.open' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { alerts },
    },
    {
      id: 'trading.history', name: 'Orderhistorie', group: 'Orders', status: 'not_analyzed',
      purpose: 'Vergangene (simulierte) Orders nachvollziehen und exportieren.',
      requirements: [
        { text: 'Chronologische Liste mit Filter nach Wertpapier und Zeitraum', type: 'info', priority: 'should' },
        { text: 'Export als CSV für die Steuer', type: 'action', priority: 'could' },
        { text: 'Realisierte Gewinne je Verkauf', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Eintrag antippen', result: 'Orderdetail', event: 'item.open' }],
      viewports: ['desktop', 'mobile'],
    },
  ],
  decisions: [
    { featureId: 'trading.order', title: 'Nur Simulation und Anzeige – keine echte Orderausführung', decision: 'Das Trading-Modul zeigt Kurse und Depot an und bietet ein simuliertes Order-Ticket. Echte Orders an Broker werden nicht ausgeführt.', rationale: 'Vermeidet regulatorische Risiken (Anlageberatung, Zulassung) und Haftung bei Fehlbedienung; der Nutzen liegt im Überblick und Üben.', tradeoffs: 'Weniger „App-Alltagswert“ als ein echter Broker; spätere Anbindung erfordert neuen Entwurf mit Sicherheits- und Rechtsprüfung.', status: 'decided' },
    { featureId: 'trading.watchlist', title: 'Datenquelle und Aktualität der Kurse', decision: '', rationale: 'Offen: Kostenlose Kursquellen sind oft 15 Minuten verzögert. Entscheidung nötig, ob Verzögerung offen im Interface genannt wird und wie oft aktualisiert wird.', tradeoffs: 'Echtzeitdaten sind kostenpflichtig; Polling erhöht Akkuverbrauch auf Mobile.', status: 'open' },
    { featureId: 'trading.portfolio', title: 'Welche Depot-Variante?', decision: '', rationale: 'A (Cockpit) für Desktop-Analyse, B (Positionen zuerst) für Mobile. Möglicherweise nach Viewport automatisch wählen.', status: 'open' },
  ],
};
