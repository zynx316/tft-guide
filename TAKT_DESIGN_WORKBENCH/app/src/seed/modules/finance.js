// Modul "Finanzen" – REFERENZMODUL (Konzepte liegen im TAKT-Projekt; hier nur Platzhalter-Abbild)
const accounts = [
  { id: 'giro', name: 'Girokonto', type: 'Girokonto', iban: 'DE•• •••• •••• 4821', balance: 3482.16, delta: 2.1, spark: [3100, 3000, 3300, 3250, 3400, 3482], tone: 1 },
  { id: 'tg', name: 'Tagesgeld', type: 'Tagesgeld', iban: 'DE•• •••• •••• 9033', balance: 12500, delta: 0.3, spark: [12300, 12350, 12400, 12450, 12480, 12500], tone: 2 },
  { id: 'cc', name: 'Kreditkarte', type: 'Kreditkarte', iban: '•••• 7714', balance: -642.9, delta: -12, spark: [-200, -350, -420, -500, -600, -643], tone: 3 },
  { id: 'depot', name: 'Depot (Simulation)', type: 'Depot', iban: 'Verrechnungskonto', balance: 21480.4, delta: 4.6, spark: [19800, 20100, 20600, 20400, 21000, 21480], tone: 4 },
];
const T = (id, title, subtitle, amount, date, category, icon, tone, account) => ({ id, title, subtitle, amount, date, category, icon, tone, account });
const transactions = [
  T('t1', 'Rewe Markt', 'Kartenzahlung', -42.8, '2026-11-24T08:15:00', 'Lebensmittel', 'shopping-cart', 1, 'giro'),
  T('t2', 'Café Morgenrot', 'Kartenzahlung', -4.9, '2026-11-24T07:50:00', 'Lebensmittel', 'utensils', 1, 'cc'),
  T('t3', 'Gehalt November', 'Northnode GmbH', 3150, '2026-11-23T06:00:00', 'Einkommen', 'banknote', 'success', 'giro'),
  T('t4', 'Stadtwerke Strom', 'Abschlag', -78, '2026-11-23T05:30:00', 'Wohnen', 'zap', 'warning', 'giro'),
  T('t5', 'Streaming-Abo', 'Monatlich', -12.99, '2026-11-22T10:00:00', 'Abos', 'play', 4, 'cc'),
  T('t6', 'Kino Lichtspiele', 'Kartenzahlung', -24, '2026-11-21T20:10:00', 'Freizeit', 'party-popper', 4, 'cc'),
  T('t7', 'Tankstelle Nord', 'Kartenzahlung', -61.35, '2026-11-21T17:25:00', 'Mobilität', 'car', 5, 'giro'),
  T('t8', 'Miete Dezember', 'Dauerauftrag', -980, '2026-11-20T04:00:00', 'Wohnen', 'home', 'warning', 'giro'),
  T('t9', 'Shopify Auszahlung', 'Verkaufserlöse', 612.4, '2026-11-20T03:00:00', 'Einkommen', 'store', 'success', 'giro'),
  T('t10', 'Fitnessstudio', 'Monatsbeitrag', -39.9, '2026-11-19T09:00:00', 'Abos', 'dumbbell', 4, 'giro'),
  T('t11', 'Bäckerei Hofer', 'Kartenzahlung', -7.2, '2026-11-19T07:40:00', 'Lebensmittel', 'utensils', 1, 'cc'),
  T('t12', 'Zug nach Hamburg', 'Online-Ticket', -49.9, '2026-11-18T12:30:00', 'Mobilität', 'navigation', 5, 'cc'),
];
const budgets = [
  { id: 'b1', label: 'Lebensmittel', value: 412, target: 500, icon: 'utensils' },
  { id: 'b2', label: 'Freizeit', value: 236, target: 200, icon: 'party-popper' },
  { id: 'b3', label: 'Mobilität', value: 188, target: 250, icon: 'car' },
  { id: 'b4', label: 'Abos', value: 98.9, target: 110, icon: 'repeat' },
  { id: 'b5', label: 'Wohnen', value: 1058, target: 1100, icon: 'home' },
];
const spending = { segments: [{ label: 'Wohnen', value: 1058 }, { label: 'Lebensmittel', value: 412 }, { label: 'Freizeit', value: 236 }, { label: 'Mobilität', value: 188 }, { label: 'Abos', value: 99 }] };
const cashflow = { labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov'], series: [{ name: 'Einnahmen', values: [3420, 3150, 3980, 3150, 3150, 3762] }, { name: 'Ausgaben', values: [2610, 2890, 2740, 2480, 2790, 1993] }] };
const metrics = [
  { label: 'Einnahmen Nov.', value: '3.762', unit: '€', icon: 'banknote', tone: 'success', delta: 19 },
  { label: 'Ausgaben Nov.', value: '1.993', unit: '€', icon: 'credit-card', tone: 'danger', delta: -29, invert: true },
  { label: 'Sparquote', value: '47', unit: '%', icon: 'piggy-bank', tone: 'accent', delta: 12, suffix: ' PP' },
  { label: 'Verfügbar', value: '3.482', unit: '€', icon: 'wallet', tone: 'info', delta: 2.1, spark: [3100, 3000, 3300, 3250, 3400, 3482] },
];
const demoData = { accounts, transactions, budgets, spending, cashflow, metrics };
const REF = 'Referenzmodul – maßgebliche Konzepte liegen im TAKT-Projekt (Phase 1: importieren/verknüpfen), Workbench-Stand ist nur Platzhalter-Abbild.';

export default {
  module: {
    id: 'finance', name: 'Finanzen', icon: 'wallet', status: 'reference', theme: 'graphite', designVersion: '0.1', isReference: true,
    description: 'Konten, Budgets, Umsätze und Auswertungen – Referenzmodul für Kennzahlen, Diagramme und Fortschrittsanzeigen im Designsystem.',
    source: 'Referenzmodul aus dem TAKT-Projekt (Konzept liegt beim Auftraggeber) – hier nur Abbild, nicht auditiert',
    infoArchitecture: 'Kontenübersicht (Salden, Umsätze) → Budgets (Monatsziele je Kategorie) → Transaktionen (Suche, Filter) → Auswertungen (Cashflow, Kategorien).',
    docs: `${REF}\n\nDient dem Designsystem als Referenz für Kennzahlen, Diagramme und Fortschritt (Budgets). Beträge sind fiktiv. Verknüpfung zu Sales (Auszahlungen) und Trading (Depot) ist in Phase 1 zu klären.`,
    links: ['sales', 'trading', 'home'],
  },
  features: [
    {
      id: 'finance.accounts', name: 'Kontenübersicht', group: 'Übersicht', status: 'design',
      purpose: 'Salden aller Konten und die letzten Umsätze auf einen Blick; ein Konto filtert die Umsatzliste.',
      requirements: [
        { text: 'Konten mit Name, maskierter IBAN, Saldo und Mini-Verlauf; Gesamtvermögen oben', type: 'info', priority: 'must' },
        { text: 'Konto antippen filtert die Umsätze auf dieses Konto', type: 'action', priority: 'must' },
        { text: 'Umsätze nach Datum gruppiert, Einnahmen grün, Ausgaben rot', type: 'info', priority: 'must' },
        { text: 'Suche und Kategorie-Filter für Umsätze', type: 'action', priority: 'should' },
        { text: 'Negative Salden (Kreditkarte) deutlich markiert', type: 'rule', priority: 'should' },
        { text: 'Ohne Umsätze: Leerzustand', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Konto antippen', result: 'Umsatzliste zeigt nur dieses Konto', event: 'account.open' },
        { trigger: 'Umsatz antippen', result: 'Detaildialog', event: 'transaction.open' },
        { trigger: 'Filterchip wählen', result: 'Umsätze der Kategorie', event: 'filter.change' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Konten + Umsätze', concept: 'Kontenkarten, darunter Suche/Filter und gruppierte Umsatzliste; Budgets und Ausgabenring in der Seitenspalte.',
        description: '+ Alltagstauglich, Konto als Filter  − Placeholder-Stand',
        layout: { type: 'split' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Finanzen', subtitle: 'Referenzmodul – Platzhalter-Abbild', primaryLabel: 'Buchung', primaryIcon: 'plus' } },
          { id: 'acc', component: 'account-cards', region: 'main', bind: { accounts: 'accounts' }, props: { title: 'Konten', minWidth: 200 } },
          { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Umsatz suchen …', filters: 'Alle, Lebensmittel, Einkommen, Wohnen, Mobilität, Freizeit, Abos' } },
          { id: 'tx', component: 'transaction-list', region: 'main', bind: { transactions: 'transactions' }, props: { title: 'Umsätze', limit: 10 } },
          { id: 'bud', component: 'progress-list', region: 'aside', bind: { items: 'budgets' }, props: { title: 'Budgets November', format: 'currency' } },
          { id: 'ring', component: 'chart', region: 'aside', bind: { series: 'spending' }, props: { title: 'Ausgaben nach Kategorie', type: 'donut' } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'finance.budgets', name: 'Budgets', group: 'Planung', status: 'design',
      purpose: 'Monatsbudgets je Kategorie überwachen und frühzeitig bei Überschreitung gewarnt werden.',
      requirements: [
        { text: 'Budget je Kategorie mit Ist/Soll und Fortschrittsbalken', type: 'info', priority: 'must' },
        { text: 'Warnfarbe ab 85 %, Rot bei Überschreitung', type: 'rule', priority: 'must' },
        { text: 'Hinweis oben, wenn ein Budget überschritten ist', type: 'state', priority: 'should' },
        { text: 'Kennzahlen: Einnahmen, Ausgaben, Sparquote, Verfügbar', type: 'info', priority: 'should' },
      ],
      interactions: [{ trigger: 'Budget antippen', result: 'Umsätze der Kategorie', event: 'progress.open' }, { trigger: 'Kennzahl antippen', result: 'Aufschlüsselung', event: 'metric.open' }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Budget-Übersicht', concept: 'Warnhinweis, Kennzahlen, Budgetbalken neben Ausgabenring und Cashflow-Verlauf.',
        description: '+ Warnung zuerst  − Placeholder-Stand',
        layout: { type: 'grid' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Budgets', subtitle: 'November 2026 · Referenzmodul', primaryLabel: 'Budget anlegen' } },
          { id: 'n', component: 'notice-banner', region: 'main', span: 12, props: { tone: 'warning', title: 'Freizeit liegt 36 € über dem Budget', text: 'Noch 6 Tage im Monat.', actionLabel: 'Umsätze' } },
          { id: 'kpi', component: 'metric-row', region: 'main', span: 12, bind: { metrics: 'metrics' } },
          { id: 'bud', component: 'progress-list', region: 'main', span: 7, bind: { items: 'budgets' }, props: { title: 'Budgets', format: 'currency' } },
          { id: 'ring', component: 'chart', region: 'main', span: 5, bind: { series: 'spending' }, props: { title: 'Ausgaben', type: 'donut' } },
          { id: 'cf', component: 'chart', region: 'main', span: 12, bind: { series: 'cashflow' }, props: { title: 'Cashflow – 6 Monate', type: 'bar', height: 170, format: 'currency' } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'finance.transactions', name: 'Transaktionen', group: 'Umsätze', status: 'analyzed',
      purpose: 'Alle Umsätze durchsuchen, kategorisieren und belegen.',
      requirements: [
        { text: 'Volltextsuche und Filter nach Konto, Kategorie, Zeitraum', type: 'action', priority: 'must' },
        { text: 'Kategorie je Umsatz ändern, Belege anhängen', type: 'action', priority: 'should' },
        { text: 'Gruppierung nach Datum mit Tagessumme', type: 'info', priority: 'should' },
      ],
      interactions: [{ trigger: 'Umsatz antippen', result: 'Detaildialog', event: 'transaction.open' }],
      viewports: ['desktop', 'mobile'],
    },
    {
      id: 'finance.reports', name: 'Auswertungen', group: 'Auswertung', status: 'not_analyzed',
      purpose: 'Cashflow, Kategorien und Vermögensentwicklung über längere Zeiträume.',
      requirements: [
        { text: 'Cashflow pro Monat (Einnahmen/Ausgaben)', type: 'info', priority: 'should' },
        { text: 'Vermögensentwicklung über alle Konten', type: 'info', priority: 'could' },
        { text: 'Export als CSV/PDF', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Datenpunkt antippen', result: 'Tooltip', event: 'chart.point' }],
      viewports: ['desktop', 'mobile'],
    },
  ],
  decisions: [
    { featureId: 'finance.accounts', title: 'Konzept aus dem TAKT-Projekt übernehmen', decision: '', rationale: 'Das maßgebliche Finanzkonzept liegt beim Auftraggeber. In Phase 1 importieren/verknüpfen; die Workbench-Entwürfe sind nur Platzhalter für das Designsystem.', status: 'open' },
  ],
};
