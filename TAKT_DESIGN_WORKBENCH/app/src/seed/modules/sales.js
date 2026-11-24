// Modul "Sales Channels" – Verkaufskanäle, Bestellungen, Listings, Auswertung
const channels = [
  { id: 'shopify', name: 'Shopify', icon: 'shopping-cart', status: 'connected', lastSync: '2026-11-24T09:18:00', revenue: 6240.5, orders: 78, delta: 8.2, pending: 3 },
  { id: 'etsy', name: 'Etsy', icon: 'store', status: 'error', lastSync: '2026-11-23T21:40:00', revenue: 1980, orders: 31, delta: -4.1, error: 'Zugriffstoken abgelaufen – Bestellungen werden nicht importiert.', needsAuth: true },
  { id: 'amazon', name: 'Amazon', icon: 'package', status: 'connected', lastSync: '2026-11-24T08:45:00', revenue: 4310.2, orders: 52, delta: 3.4, pending: 1 },
  { id: 'ebay', name: 'eBay', icon: 'tag', status: 'paused', lastSync: '2026-11-18T10:00:00', revenue: 410, orders: 9, delta: -22 },
  { id: 'shop', name: 'Eigener Shop', icon: 'globe', status: 'connected', lastSync: '2026-11-24T09:25:00', revenue: 2875, orders: 24, delta: 12.5 },
];
const orders = [
  { id: 'o1', number: '#4185', customer: 'Anna Berger', channel: 'Shopify', items: 2, total: 64.9, date: '2026-11-24T09:12:00', status: 'new' },
  { id: 'o2', number: '#4184', customer: 'Markus Lindner', channel: 'Eigener Shop', items: 4, total: 189.5, date: '2026-11-24T08:40:00', status: 'new' },
  { id: 'o3', number: '#4183', customer: 'Sophie Krämer', channel: 'Amazon', items: 1, total: 29.99, date: '2026-11-24T07:55:00', status: 'new' },
  { id: 'o4', number: '#4181', customer: 'Jonas Weber', channel: 'Etsy', items: 1, total: 38, date: '2026-11-23T19:20:00', status: 'paid' },
  { id: 'o5', number: '#4180', customer: 'Fatma Yıldız', channel: 'Shopify', items: 3, total: 97.4, date: '2026-11-23T16:05:00', status: 'paid' },
  { id: 'o6', number: '#4179', customer: 'Lukas Hartmann', channel: 'Eigener Shop', items: 2, total: 72.8, date: '2026-11-22T12:30:00', status: 'paid' },
  { id: 'o7', number: '#4176', customer: 'Lena Roth', channel: 'Amazon', items: 3, total: 112.4, date: '2026-11-22T11:05:00', status: 'shipped' },
  { id: 'o8', number: '#4174', customer: 'Paul Schneider', channel: 'Shopify', items: 1, total: 45, date: '2026-11-21T17:45:00', status: 'shipped' },
  { id: 'o9', number: '#4170', customer: 'Tim Fuchs', channel: 'Shopify', items: 1, total: 24.5, date: '2026-11-20T14:30:00', status: 'delivered' },
  { id: 'o10', number: '#4168', customer: 'Marie Vogel', channel: 'Etsy', items: 2, total: 56, date: '2026-11-19T10:15:00', status: 'delivered' },
  { id: 'o11', number: '#4165', customer: 'Daniel Keller', channel: 'eBay', items: 1, total: 19.9, date: '2026-11-18T09:40:00', status: 'delivered' },
];
const metrics = [
  { label: 'Umsatz heute', value: '1.284', unit: '€', icon: 'banknote', tone: 'success', delta: 12, spark: [640, 820, 710, 980, 1100, 1020, 1284] },
  { label: 'Bestellungen heute', value: 11, icon: 'shopping-cart', tone: 'accent', delta: 4, suffix: '', spark: [6, 8, 7, 9, 12, 10, 11] },
  { label: 'Zu bearbeiten', value: 6, icon: 'inbox', tone: 'warning', delta: 2, suffix: '', invert: true },
  { label: 'Retourenquote', value: '2,8', unit: '%', icon: 'rotate-ccw', tone: 'info', delta: -0.4, suffix: ' PP', invert: true },
];
const revenue = { labels: ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'], series: [
  { name: 'Shopify', values: [820, 910, 1040, 760, 640, 980, 1120] }, { name: 'Amazon', values: [540, 620, 580, 710, 480, 650, 690] }, { name: 'Eigener Shop', values: [310, 280, 420, 390, 350, 410, 470] }] };
const shares = { segments: [{ label: 'Shopify', value: 6240.5 }, { label: 'Amazon', value: 4310.2 }, { label: 'Eigener Shop', value: 2875 }, { label: 'Etsy', value: 1980 }, { label: 'eBay', value: 410 }] };
const rows = channels.map((c) => ({ id: c.id, title: c.name, icon: c.icon, status: { connected: 'Verbunden', error: 'Fehler', paused: 'Pausiert' }[c.status], tone: { connected: 'success', error: 'danger', paused: 'neutral' }[c.status],
  revenue: c.revenue, orders: c.orders, change: c.delta / 100,
  trend: { shopify: [5200, 5400, 5800, 5700, 6100, 6240], etsy: [2300, 2250, 2100, 2050, 2000, 1980], amazon: [3900, 4000, 4100, 4150, 4250, 4310], ebay: [620, 580, 520, 470, 430, 410], shop: [2100, 2300, 2450, 2600, 2750, 2875] }[c.id],
  subtitle: c.error || `${c.orders} Bestellungen in 30 Tagen`, meta: { shopify: 'vor 12 Min.', etsy: 'gestern 21:40', amazon: 'vor 45 Min.', ebay: '18.11.', shop: 'vor 5 Min.' }[c.id],
  revenueText: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.revenue) }));
const activity = [
  { id: 'a1', title: 'Shopify synchronisiert', time: '2026-11-24T09:18:00', icon: 'refresh-cw', tone: 'success', text: '3 neue Bestellungen importiert' },
  { id: 'a2', title: 'Etsy: Verbindung unterbrochen', time: '2026-11-23T21:40:00', icon: 'alert-triangle', tone: 'danger', text: 'Zugriffstoken abgelaufen' },
  { id: 'a3', title: 'eBay pausiert', time: '2026-11-18T10:00:00', icon: 'circle-pause', tone: 'neutral' },
];
const demoData = { channels, orders, metrics, revenue, shares, rows, activity };

const filtersCh = 'Alle, Verbunden, Fehler, Pausiert';

export default {
  module: {
    id: 'sales', name: 'Sales Channels', icon: 'store', status: 'active', theme: 'graphite', designVersion: '0.3', isReference: false,
    description: 'Verkaufskanäle zentral verwalten: Shopify, Etsy, Amazon, eBay und eigener Shop – mit Bestellungen, Listings und Umsatzauswertung.',
    source: 'Auftrag 2026-11 (in Phase 1 gegen das TAKT-Modulregister verifizieren)',
    infoArchitecture: '1) Kanalübersicht (Status, Umsatz, Sync) → 2) Bestellungen (Pipeline neu → bezahlt → versendet → zugestellt) → 3) Produkte/Listings je Kanal → 4) Kanal verbinden → 5) Auswertung Umsatz. Einstieg ist die Kanalübersicht; Fehler und offene Bestellungen sind von dort mit einem Tipp erreichbar.',
    docs: 'Annahmen: Kanäle werden per API angebunden, Synchronisation läuft automatisch (alle 15 Min.) und manuell. Bestellstatus „bezahlt“ kommt vom Kanal, „versendet“ setzt der Nutzer in TAKT. Offene Fragen: Lagerbestand-Sync, Mehrwährung, Retouren-Workflow.',
    links: ['tasks', 'finance', 'calendar'],
  },
  features: [
    {
      id: 'sales.overview', name: 'Kanalübersicht', group: 'Übersicht', status: 'design',
      purpose: 'Auf einen Blick sehen, welche Verkaufskanäle laufen, wo Probleme sind und wie viel Umsatz jeder Kanal bringt – und Kanäle direkt synchronisieren.',
      requirements: [
        { text: 'Jeder Kanal zeigt Status (verbunden, Fehler, pausiert), letzten Sync relativ („vor 12 Min.“) sowie Umsatz und Bestellungen der letzten 30 Tage', type: 'info', priority: 'must' },
        { text: 'Kanal manuell synchronisieren, mit Ladezustand und Rückmeldung (neue Bestellungen)', type: 'action', priority: 'must' },
        { text: 'Fehlerkanäle sind sofort erkennbar und bieten „Neu verbinden“', type: 'state', priority: 'must' },
        { text: 'Pausierte Kanäle lassen sich mit einem Tipp fortsetzen', type: 'action', priority: 'should' },
        { text: 'Kanäle nach Status filtern und nach Name durchsuchen', type: 'action', priority: 'should' },
        { text: 'Ohne Kanäle erscheint ein Leerzustand mit Hinweis „Kanal verbinden“', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ohne horizontales Scrollen, Aktionen ≥ 44 px', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Synchronisieren antippen', result: 'Button zeigt Ladezustand, danach Toast mit Anzahl neuer Bestellungen', event: 'channel.sync' },
        { trigger: 'Kanal-Karte antippen', result: 'Kanal wird ausgewählt / Detail', event: 'channel.open' },
        { trigger: 'Neu verbinden', result: 'Dialog zur erneuten Anmeldung (Simulation)', event: 'channel.reconnect' },
        { trigger: 'Pausierten Kanal fortsetzen', result: 'Status wechselt auf „Verbunden“', event: 'channel.resume' },
        { trigger: 'Filterchip wählen', result: 'Liste zeigt nur Kanäle mit diesem Status', event: 'filter.change' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [
        {
          id: 'A', name: 'Kachel-Cockpit', concept: 'Dashboard-Raster: Kennzahlen oben, darunter alle Kanäle als Karten, unten Umsatzverlauf und Anteile. Maximaler Überblick, Aktion direkt auf der Karte.',
          description: '+ Alles auf einen Blick, Sync pro Kanal  − Auf Mobile lange Seite, Fehler fallen nur über Farbe auf',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Dienstag, 24. November', title: 'Kanalübersicht', subtitle: '3 von 5 Kanälen laufen · 1 Fehler', primaryLabel: 'Kanal verbinden', primaryIcon: 'plus', primaryEvent: 'channel.connect' } },
            { id: 'kpi', component: 'metric-row', region: 'main', span: 12, bind: { metrics: 'metrics' } },
            { id: 'cards', component: 'channel-cards', region: 'main', span: 12, bind: { channels: 'channels' }, props: { title: 'Verkaufskanäle', minWidth: 250 } },
            { id: 'rev', component: 'chart', region: 'main', span: 7, bind: { series: 'revenue' }, props: { title: 'Umsatz – letzte 7 Tage', type: 'bar', height: 190, format: 'currency' } },
            { id: 'share', component: 'chart', region: 'main', span: 5, bind: { series: 'shares' }, props: { title: 'Umsatzanteil (30 Tage)', type: 'donut' } },
          ],
        },
        {
          id: 'B', name: 'Tabelle & Detail', concept: 'Analytische Sicht: durchsuch- und sortierbare Kanaltabelle (Umsatz, Trend, Veränderung), Detailspalte rechts für den gewählten Kanal. Für Vergleich und Auswertung statt Bedienung.',
          description: '+ Sortieren/Vergleichen, viele Kanäle skalieren  − Sync-Aktion nur über Detail, wirkt nüchtern',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Kanäle', subtitle: 'Vergleich der Verkaufskanäle', primaryLabel: 'Kanal verbinden', primaryEvent: 'channel.connect' } },
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Kanal suchen …', filters: filtersCh } },
            { id: 'tbl', component: 'data-table', region: 'main', bind: { rows: 'rows' }, props: { title: '', columns: 'title:Kanal:text, status:Status:badge, revenue:Umsatz 30 T.:currency, orders:Bestellungen:number, change:Veränderung:percent, trend:Verlauf:spark' } },
            { id: 'det', component: 'detail-panel', region: 'aside', bind: { items: 'rows' }, props: { fields: 'status:Status, meta:Letzter Sync, revenueText:Umsatz 30 Tage, orders:Bestellungen', allowDelete: false, autoSelectFirst: true } },
            { id: 'rev', component: 'chart', region: 'aside', bind: { series: 'revenue' }, props: { title: 'Umsatz 7 Tage', type: 'area', height: 150, format: 'currency', showLegend: false } },
          ],
        },
        {
          id: 'C', name: 'Aufmerksamkeit zuerst', concept: 'Aufgabenorientiert: „Was braucht jetzt Aufmerksamkeit?“ – Hinweise zu Fehlern, darunter offene Bestellungen (neu/bezahlt) mit Weiterschalten; Kanäle schmal daneben, Fehlerkanäle zuerst.',
          description: '+ Führt direkt zu Handlungen, wenig Rauschen  − Kein Gesamtüberblick über Umsatz',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Heute zu tun', subtitle: '1 Kanal mit Fehler · 6 Bestellungen offen', primaryLabel: '' } },
            { id: 'n1', component: 'notice-banner', region: 'main', props: { tone: 'danger', title: 'Etsy ist nicht verbunden', text: 'Das Zugriffstoken ist abgelaufen. Seit gestern 21:40 werden keine Bestellungen importiert.', actionLabel: 'Neu verbinden', dismissible: false } },
            { id: 'n2', component: 'notice-banner', region: 'main', props: { tone: 'warning', title: '3 neue Bestellungen warten auf Zahlungsabgleich', text: 'Älteste Bestellung ist seit 1,5 Std. offen.', actionLabel: 'Prüfen' } },
            { id: 'pipe', component: 'order-pipeline', region: 'main', bind: { orders: 'orders' }, props: { title: 'Offene Bestellungen', stages: 'new, paid' } },
            { id: 'cards', component: 'channel-cards', region: 'aside', bind: { channels: 'channels' }, props: { title: 'Kanäle', minWidth: 400, errorsFirst: true, showStats: false, density: 'compact' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['sales.orders', 'sales.connect'],
    },
    {
      id: 'sales.orders', name: 'Bestellungen', group: 'Bestellungen', status: 'design',
      purpose: 'Eingehende Bestellungen aller Kanäle in einer Pipeline sehen und Schritt für Schritt bis zur Zustellung weiterschalten.',
      requirements: [
        { text: 'Bestellungen nach Status gruppiert mit Zähler und Summe je Status', type: 'info', priority: 'must' },
        { text: 'Status per Aktion weiterschalten (Bezahlt markieren → Versenden → Zugestellt)', type: 'action', priority: 'must' },
        { text: 'Nach Kanal und Status filtern, nach Kunde oder Bestellnummer suchen', type: 'action', priority: 'should' },
        { text: 'Bestelldetails im Dialog (Kunde, Positionen, Summe, Kanal)', type: 'info', priority: 'should' },
        { text: 'Leere Status zeigen einen ruhigen Leerzustand', type: 'state', priority: 'must' },
        { text: 'Mobile: Status als Reiter, nie vier Spalten nebeneinander', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Aktion „Versenden“ tippen', result: 'Bestellung wandert in „Versendet“, Zähler aktualisieren sich', event: 'order.advance' },
        { trigger: 'Bestellung antippen', result: 'Detail-Dialog öffnet', event: 'order.open' },
        { trigger: 'Status-Kachel antippen', result: 'Liste zeigt diesen Status', event: 'pipeline.stage' },
        { trigger: 'Suchfeld eingeben', result: 'Liste filtert live', event: 'search.input' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Pipeline-Spalten', concept: 'Vier Statusspalten (Kanban-artig) auf Desktop, Reiter mit Zählern auf Mobile. Suche und Kanalfilter oben.',
        description: '+ Fluss der Bestellungen sichtbar  − Viele Bestellungen verlängern die Spalten',
        layout: { type: 'stack' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Bestellungen', subtitle: '11 Bestellungen · 5 Kanäle', primaryLabel: 'Manuell erfassen' } },
          { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Kunde oder Nr. suchen …', filters: 'Alle, Shopify, Amazon, Etsy, Eigener Shop' } },
          { id: 'pipe', component: 'order-pipeline', region: 'main', bind: { orders: 'orders' }, props: { title: 'Pipeline', mode: 'columns' } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'sales.listings', name: 'Produkte & Listings', group: 'Produkte', status: 'analyzed',
      purpose: 'Produkte einmal pflegen und sehen, auf welchen Kanälen sie gelistet sind – inklusive Bestand und Preisabweichungen.',
      requirements: [
        { text: 'Produktliste mit Bild, Titel, Bestand und Listing-Status je Kanal', type: 'info', priority: 'must' },
        { text: 'Preis- und Bestandsabweichungen zwischen Kanälen markieren', type: 'rule', priority: 'should' },
        { text: 'Produkt auf weiteren Kanälen veröffentlichen', type: 'action', priority: 'should' },
        { text: 'Mehrfachauswahl für Massenaktionen (pausieren, Preis anpassen)', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Produkt antippen', result: 'Detail mit Kanal-Listings', event: 'item.open' },
        { trigger: 'Auf Kanal veröffentlichen', result: 'Listing wird angelegt', event: 'listing.publish' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      notes: 'Offen: Wie werden Varianten (Größe/Farbe) kanalübergreifend abgebildet?',
    },
    {
      id: 'sales.connect', name: 'Kanal verbinden', group: 'Einrichtung', status: 'review',
      purpose: 'Einen neuen Verkaufskanal in wenigen Schritten anbinden und die erste Synchronisation anstoßen.',
      requirements: [
        { text: 'Kanal wählen (Shopify, Etsy, Amazon, eBay, eigener Shop)', type: 'action', priority: 'must' },
        { text: 'Pflichtfelder (Shop-URL, API-Schlüssel) werden vor dem Speichern geprüft', type: 'rule', priority: 'must' },
        { text: 'Hinweis, welche Berechtigungen TAKT benötigt', type: 'info', priority: 'should' },
        { text: 'Nach dem Speichern erscheint der Kanal in der Liste und kann sofort synchronisiert werden', type: 'state', priority: 'must' },
        { text: 'Fehler bei ungültigen Zugangsdaten verständlich anzeigen', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Formular absenden', result: 'Kanal erscheint in der Liste rechts', event: 'form.submit' },
        { trigger: 'Absenden ohne Pflichtfelder', result: 'Fehler unter den Feldern', event: 'form.invalid' },
        { trigger: 'Neuen Kanal synchronisieren', result: 'Ladezustand, danach Rückmeldung', event: 'channel.sync' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { channels: channels.slice(0, 3) },
      variants: [{
        id: 'A', name: 'Formular + Bestand', concept: 'Links das Verbindungsformular, rechts bereits verbundene Kanäle zur Orientierung. Hinweis zu Berechtigungen oberhalb.',
        description: '+ Einfach, ein Schritt  − Kein geführter Assistent für komplexe OAuth-Kanäle',
        layout: { type: 'split', asideFirstOnMobile: false },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Kanal verbinden', subtitle: 'Neuen Verkaufskanal anbinden', primaryLabel: '' } },
          { id: 'n', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Berechtigungen', text: 'TAKT liest Bestellungen und Produkte und schreibt Versandstatus zurück. Zahlungsdaten werden nie gespeichert.' } },
          { id: 'form', component: 'form-card', region: 'main', bind: { target: 'channels' }, props: { title: 'Zugangsdaten', fields: 'name*:Kanalname:text, platform:Plattform:select:Shopify|Etsy|Amazon|eBay|Eigener Shop, url*:Shop-URL:text, key*:API-Schlüssel:password', submitLabel: 'Verbinden', columns: 1 } },
          { id: 'cards', component: 'channel-cards', region: 'aside', bind: { channels: 'channels' }, props: { title: 'Verbundene Kanäle', minWidth: 400, showStats: false, density: 'compact' } },
        ],
      }],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf' }, { kind: 'review' }],
    },
    {
      id: 'sales.revenue', name: 'Auswertung Umsatz', group: 'Auswertung', status: 'design',
      purpose: 'Umsatzentwicklung und Kanalanteile verstehen, um zu entscheiden, wo sich Aufwand lohnt.',
      requirements: [
        { text: 'Umsatz der letzten 7 Tage je Kanal als Diagramm', type: 'info', priority: 'must' },
        { text: 'Anteile der Kanäle am Gesamtumsatz (30 Tage)', type: 'info', priority: 'must' },
        { text: 'Kennzahlen: Umsatz, Bestellungen, Ø Warenkorb, Retourenquote mit Trend', type: 'info', priority: 'should' },
        { text: 'Tabelle der Kanäle sortierbar nach Umsatz, Bestellungen und Veränderung', type: 'action', priority: 'should' },
        { text: 'Zeitraum wechseln (7 Tage, 30 Tage, Quartal)', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Datenpunkt im Diagramm antippen', result: 'Tooltip mit Werten je Kanal', event: 'chart.point' },
        { trigger: 'Spaltenkopf antippen', result: 'Tabelle sortiert neu', event: 'table.sort' },
        { trigger: 'Kennzahl antippen', result: 'Aufschlüsselung öffnet', event: 'metric.open' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Analyse-Raster', concept: 'Kennzahlen, großer Umsatzverlauf (Fläche), Anteile als Ring und sortierbare Kanaltabelle darunter.',
        description: '+ Vollständig, vergleichbar  − Viel Information, Mobile wird lang',
        layout: { type: 'grid' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Umsatz', subtitle: 'November 2026', primaryLabel: 'Export', primaryIcon: 'download' } },
          { id: 'kpi', component: 'metric-row', region: 'main', span: 12, bind: { metrics: 'metrics' } },
          { id: 'rev', component: 'chart', region: 'main', span: 8, bind: { series: 'revenue' }, props: { title: 'Umsatz je Kanal – 7 Tage', type: 'area', height: 220, format: 'currency' } },
          { id: 'share', component: 'chart', region: 'main', span: 4, bind: { series: 'shares' }, props: { title: 'Anteile', type: 'donut' } },
          { id: 'tbl', component: 'data-table', region: 'main', span: 12, bind: { rows: 'rows' }, props: { title: 'Kanäle im Vergleich', columns: 'title:Kanal:text, revenue:Umsatz:currency, orders:Bestellungen:number, change:Veränderung:percent, trend:Verlauf:spark' } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'sales.returns', name: 'Retouren', group: 'Bestellungen', status: 'not_analyzed',
      purpose: 'Retouren erfassen und Erstattungen nachvollziehen.',
      requirements: [
        { text: 'Retourenliste mit Grund, Status und Erstattungsbetrag', type: 'info', priority: 'should' },
        { text: 'Retoure aus einer Bestellung heraus anlegen', type: 'action', priority: 'could' },
        { text: 'Retourenquote je Kanal und Produkt', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Retoure anlegen', result: 'Formular öffnet', event: 'form.open' }],
      viewports: ['desktop', 'mobile'],
    },
  ],
  decisions: [
    { featureId: 'sales.overview', title: 'Welche Variante für die Kanalübersicht?', decision: '', rationale: 'A (Cockpit) bietet den besten Überblick, C (Aufmerksamkeit) ist im Alltag schneller. Idee: C als mobile Standardansicht, A ab Tablet.', tradeoffs: 'Zwei Ansichten bedeuten höheren Pflegeaufwand; eine Variante mit Umschalter wäre denkbar.', status: 'open' },
    { featureId: 'sales.overview', title: 'Synchronisation: automatisch und manuell', decision: 'Kanäle synchronisieren automatisch alle 15 Minuten; zusätzlich gibt es einen manuellen „Synchronisieren“-Button je Kanal.', rationale: 'Händler wollen nach einer Preisänderung sofort Gewissheit, ohne auf den Takt zu warten.', tradeoffs: 'Mehr API-Last (Rate-Limits der Kanäle); manueller Sync wird pro Kanal gedrosselt.', status: 'decided' },
    { featureId: 'sales.connect', title: 'Anbindung per OAuth oder API-Schlüssel?', decision: '', rationale: 'Shopify, Etsy und Amazon bieten OAuth; kleinere Kanäle nur Schlüssel. Das Formular im Entwurf deckt nur den Schlüssel-Fall ab.', status: 'open' },
  ],
};
