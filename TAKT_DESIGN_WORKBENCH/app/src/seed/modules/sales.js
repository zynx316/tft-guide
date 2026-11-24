// Modul "Sales Channels" – Verkaufskanäle, Bestellungen, Listings, Auswertung
// Referenztag: Di, 24.11.2026 09:30. Die Zahlen sind rechnerisch konsistent: Summen entstehen aus den Positionen der Bestellungen.

const L = (...lines) => lines.join('\n');
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
// Kanäle, Bestellungen, Kennzahlen, Diagramme und Sync-Protokoll liegen in der gemeinsamen Datenwelt (world/sales.js, Eigentümer: sales).
const demo = {
  channels: '@world:channels', orders: '@world:orders', metrics: '@world:salesMetrics', revenue: '@world:salesRevenue', shares: '@world:salesShares', rows: '@world:salesRows',
  stageChart: '@world:salesStageChart', syncLog: '@world:salesSyncLog', tasks: '@world:tasks', events: '@world:events',
};
const metricsRevenue = '@world:salesMetricsRevenue';
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });
const filtersCh = 'Alle, Verbunden, Fehler, Pausiert';
const ORDER_CHIPS = 'Alle, Shopify, Amazon, Etsy, Eigener Shop, eBay';

export default {
  module: {
    id: 'sales', name: 'Sales Channels', icon: 'store', status: 'active', theme: 'graphite', designVersion: '0.4', isReference: false, homeFeatureId: 'sales.overview',
    description: 'Verkaufskanäle zentral verwalten: Shopify, Etsy, Amazon, eBay und eigener Shop – mit Bestellungen, Listings und Umsatzauswertung.',
    source: 'Workbench V2 (Bauplan, Brainstorm „alltag“) – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Übersicht“ (Kanäle, Kennzahlen, was heute zu tun ist). Von dort: Kanal → Kanal-Detail (Status, Sync, Bestellungen, Protokoll); Bestellung → Bestelldetail (Verlauf, nächster Schritt, Positionen); Bestellungen (Pipeline neu → bezahlt → versendet → zugestellt); Kanal verbinden; Auswertung Umsatz; Sync-Protokoll. Fehler und offene Bestellungen sind von der Übersicht mit einem Tipp erreichbar.',
    docs: L('## Leitidee', '- Händler wollen morgens in 10 Sekunden wissen: Läuft alles? Was muss ich heute tun? Die Übersicht beantwortet das, die Details liegen einen Tipp entfernt.', '- Kanäle werden per API angebunden, Synchronisation läuft automatisch (alle 15 Min.) und manuell. Bestellstatus „bezahlt“ kommt vom Kanal, „versendet“ setzt der Nutzer in TAKT (Paketdienst und Sendungsnummer).', '', '## Verbindung zu anderen Modulen', '- Kalender und Aufgaben: „Jetzt zu tun“ nennt Termine mit betroffenem Kanal und überfällige Buchungsaufgaben (Etsy-Gebühren); Erledigen schreibt in die Aufgaben der Datenwelt.', '- Finanzen: Auszahlungen der Kanäle erscheinen als Buchungen; Rechnungen sind zurückgestellt (nur Export).', '', '## Zahlen', '- Summen entstehen aus den Positionen der Bestellungen; „Umsatz heute“ ist die Summe der heutigen Bestellungen bis 09:30 Uhr.', '', '## Offene Fragen', '- Lagerbestand-Sync, Mehrwährung, Retouren-Workflow.', '- Anbindung je Kanal per OAuth oder API-Schlüssel.', '', '## Bekannte Grenze der Vorschau', '- Kanäle und Bestellungen liegen im Modul (noch nicht in der gemeinsamen Datenwelt): Änderungen wirken innerhalb eines Screens, nicht über Screens hinweg.'),
    links: ['tasks', 'finance', 'calendar'],
  },
  features: [
    // ------------------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'sales.overview', name: 'Übersicht', group: 'Übersicht', status: 'design', tier: 1,
      purpose: 'Auf einen Blick sehen, welche Verkaufskanäle laufen, wo Probleme sind, wie viel Umsatz heute und in 30 Tagen zusammenkommt und was jetzt zu tun ist – und Kanäle direkt synchronisieren.',
      requirements: [
        { text: 'Jeder Kanal zeigt Status (verbunden, Fehler, pausiert), letzten Sync relativ („vor 12 Min.“) sowie Umsatz und Bestellungen der letzten 30 Tage', type: 'info', priority: 'must' },
        { text: 'Kanal manuell synchronisieren, mit Ladezustand und Rückmeldung (neue Bestellungen)', type: 'action', priority: 'must' },
        { text: 'Fehlerkanäle sind sofort erkennbar (Text, nicht nur Farbe) und bieten „Neu verbinden“', type: 'state', priority: 'must' },
        { text: 'Pausierte Kanäle lassen sich mit einem Tipp fortsetzen', type: 'action', priority: 'should' },
        { text: 'Kennzahlen: Umsatz heute, Bestellungen heute, Zu bearbeiten, Retourenquote – Summen stimmen mit den Bestellungen überein', type: 'info', priority: 'must' },
        { text: '„Jetzt zu tun“ priorisiert Fehler, neue Bestellungen, Versand, Termine mit betroffenem Kanal und überfällige Buchungsaufgaben', type: 'info', priority: 'should' },
        { text: 'Kanäle nach Status filtern und nach Name durchsuchen', type: 'action', priority: 'should' },
        { text: 'Ohne Kanäle erscheint ein Leerzustand mit Hinweis „Kanal verbinden“; Offline: Warteschlange sichtbar', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ohne horizontales Scrollen, Aktionen ≥ 44 px', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Kanal-Karte antippen', result: 'Kanal-Detail mit Status, Sync und Bestellungen', event: 'channel.open', to: 'sales.channel' },
        { trigger: 'Bestellung antippen', result: 'Bestelldetail', event: 'order.open', to: 'sales.order' },
        { trigger: '„Kanal verbinden“', result: 'Formular zum Anbinden', event: 'channel.connect', to: 'sales.connect' },
        { trigger: 'Kennzahl antippen', result: 'Auswertung Umsatz', event: 'metric.open', to: 'sales.revenue' },
        { trigger: 'Zeile der Kanaltabelle antippen', result: 'Kurz-Detail des Kanals wechselt', event: 'channel.select' },
        { trigger: '„Bestellungen“', result: 'Bestell-Pipeline', event: 'header.secondary', to: 'sales.orders' },
        { trigger: 'Synchronisieren antippen', result: 'Button zeigt Ladezustand, danach Toast mit Anzahl neuer Bestellungen', event: 'channel.sync' },
        { trigger: 'Neu verbinden', result: 'Dialog zur erneuten Anmeldung (Simulation)', event: 'channel.reconnect' },
        { trigger: 'Pausierten Kanal fortsetzen', result: 'Status wechselt auf „Verbunden“', event: 'channel.resume' },
        { trigger: 'Filterchip wählen', result: 'Liste zeigt nur Kanäle mit diesem Status', event: 'filter.change' },
        { trigger: 'Aufgabe „Erledigt“', result: 'Aufgabe wird in der Datenwelt erledigt', event: 'task.toggle' },
      ],
      acceptance: [
        'Jeder Kanal zeigt Status als Text, letzten Sync und 30-Tage-Umsatz; der Etsy-Fehler nennt die Ursache und bietet „Neu verbinden“.',
        '„Umsatz heute“ entspricht der Summe der drei heutigen Bestellungen (281,89 €, Stand 09:30 Uhr).',
        'Ein Tipp auf einen Kanal öffnet das Kanal-Detail, ein Tipp auf eine Bestellung das Bestelldetail.',
        '„Neu verbinden“ stellt Etsy wieder her; die Fehlerzeile verschwindet aus „Jetzt zu tun“.',
        '„Erledigt“ bei „Etsy-Gebühren buchen“ setzt die Aufgabe in der gemeinsamen Datenwelt auf erledigt.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, auf 200 % Schrift wird nichts abgeschnitten.',
        'Im Szenario „Erster Start“ zeigt die kompakte Übersicht eine Einladung mit der einen Aktion „Kanal verbinden“ statt leerer Karten; der Untertitel ist vollständig lesbar.',
      ],
      flows: [
        { id: 'fl-fehler', name: 'Etsy-Fehler beheben', steps: [{ featureId: 'sales.overview', action: 'Fehlerzeile „Etsy ist nicht verbunden“ sehen, „Neu verbinden“' }, { featureId: 'sales.channel', action: 'Status „Alles in Ordnung“ prüfen, synchronisieren' }] },
        { id: 'fl-versand', name: 'Bestellung versenden', steps: [{ featureId: 'sales.overview', action: '„Versenden“ bei der ältesten bezahlten Bestellung' }, { featureId: 'sales.order', action: 'Paketdienst und Sendungsnummer eintragen' }] },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData: demo,
      variants: [
        {
          id: 'A', name: 'Kachel-Cockpit', direction: 'visuell', concept: 'Dashboard-Raster: Kennzahlen oben, darunter alle Kanäle als Karten, unten Umsatzverlauf und Anteile. Maximaler Überblick, Aktion direkt auf der Karte.',
          description: '+ Alles auf einen Blick, Sync pro Kanal  − Auf Mobile lange Seite, Fehler fallen nur über Farbe und Text der Karte auf',
          layout: { type: 'grid' },
          blocks: [
            // Erststart (keine Kanäle): Kopf ohne Aktion, eine Einladung „Kanal verbinden“, keine leeren Karten (hideWhenEmpty/showWhenEmpty, quietEmpty)
            { ...hdr({ eyebrow: 'Dienstag, 24. November', title: 'Übersicht', subtitle: 'Kanäle, Bestellungen und Umsatz', primaryLabel: 'Kanal verbinden', primaryIcon: 'plus', primaryEvent: 'channel.connect', secondaryLabel: 'Bestellungen', secondaryIcon: 'package' }), hideWhenEmpty: 'channels' },
            { ...hdr({ eyebrow: 'Sales Channels', title: 'Übersicht', subtitle: 'Noch kein Kanal verbunden', primaryLabel: '' }), id: 'hdr0', showWhenEmpty: 'channels' },
            { id: 'first', component: 'sales-firstrun', region: 'main', span: 12, bind: { channels: 'channels' } },
            { id: 'kpi', component: 'kpi-tiles', region: 'main', span: 12, bind: { metrics: 'metrics' }, hideWhenEmpty: 'channels' },
            { id: 'cards', component: 'channel-cards', region: 'main', span: 12, bind: { channels: 'channels' }, props: { title: 'Verkaufskanäle', minWidth: 250, quietEmpty: true } },
            { id: 'rev', component: 'chart', region: 'main', span: 7, spanTablet: 12, bind: { series: 'revenue' }, props: { title: 'Umsatz – letzte 7 Tage', type: 'bar', height: 190, format: 'currency' }, hideWhenEmpty: 'channels' },
            { id: 'share', component: 'chart', region: 'main', span: 5, spanTablet: 12, bind: { series: 'shares' }, props: { title: 'Umsatzanteil (30 Tage)', type: 'donut', format: 'currency' }, hideWhenEmpty: 'channels' },
          ],
        },
        {
          id: 'B', name: 'Tabelle & Detail', direction: 'kompakt', concept: 'Analytische Sicht: durchsuch- und sortierbare Kanaltabelle (Umsatz, Trend, Veränderung), rechts das Kurz-Detail des gewählten Kanals mit Sync und „Vollständige Ansicht“, darunter die offenen Bestellungen. Ohne Kanal erscheint nur eine Einladung mit „Kanal verbinden“.',
          description: '+ Sortieren/Vergleichen, Sync und Fehler im Detail  − Nüchtern, Mobile zeigt Karten statt Tabelle',
          layout: { type: 'split' },
          blocks: [
            { ...hdr({ eyebrow: 'Sales Channels', title: 'Übersicht', subtitle: 'Letzte 30 Tage', primaryLabel: 'Kanal verbinden', primaryEvent: 'channel.connect', secondaryLabel: 'Bestellungen', secondaryIcon: 'package' }), hideWhenEmpty: 'channels' },
            { ...hdr({ eyebrow: 'Sales Channels', title: 'Übersicht', subtitle: 'Noch kein Kanal verbunden', primaryLabel: '' }), id: 'hdr0', showWhenEmpty: 'channels' },
            { id: 'first', component: 'sales-firstrun', region: 'main', bind: { channels: 'channels' } },
            { id: 'tbl', component: 'channel-table', region: 'main', bind: { channels: 'channels' }, props: { title: '', quietEmpty: true } },
            { id: 'pipe', component: 'order-pipeline', region: 'main', bind: { orders: 'orders' }, props: { title: 'Offene Bestellungen', stages: 'new, paid', openIn: 'select', respectFilter: false, quietEmpty: true } },
            { id: 'det', component: 'channel-detail', region: 'aside', bind: { channels: 'channels', orders: 'orders' }, props: { layout: 'compact', quietEmpty: true } },
            { id: 'rev', component: 'revenue-strip', region: 'aside', bind: { series: 'revenue' }, props: { title: 'Umsatz 7 Tage' } },
          ],
        },
        {
          id: 'C', name: 'Aufmerksamkeit zuerst', direction: 'fokus', concept: 'Aufgabenorientiert: „Jetzt zu tun“ priorisiert Fehler, Bestellungen und Kontext aus Kalender und Aufgaben; darunter die offenen Bestellungen zum Weiterschalten, Kanäle schmal daneben mit Fehlerkanälen zuerst.',
          description: '+ Führt direkt zu Handlungen, wenig Rauschen  − Kein Gesamtüberblick über den Umsatz',
          layout: { type: 'split' },
          blocks: [
            hdr({ title: 'Heute zu tun', subtitle: 'Fehler beheben, Bestellungen bearbeiten', primaryLabel: '', secondaryLabel: 'Umsatz', secondaryIcon: 'bar-chart-3' }),
            { id: 'att', component: 'sales-attention', region: 'main', bind: { channels: 'channels', orders: 'orders', events: 'events', tasks: 'tasks' }, props: { title: 'Jetzt zu tun' } },
            { id: 'pipe', component: 'order-pipeline', region: 'main', bind: { orders: 'orders' }, props: { title: 'Offene Bestellungen', stages: 'new, paid', openIn: 'select', respectFilter: false, quietEmpty: true } },
            { id: 'cards', component: 'channel-cards', region: 'aside', bind: { channels: 'channels' }, props: { title: 'Kanäle', layout: 'rows', errorsFirst: true, quietEmpty: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['sales.channel', 'sales.order', 'sales.orders', 'sales.connect', 'sales.revenue', 'home.today'],
    },
    // ------------------------------------------------------------------ Bestellungen
    {
      id: 'sales.orders', name: 'Bestellungen', group: 'Bestellungen', status: 'design', tier: 1,
      purpose: 'Eingehende Bestellungen aller Kanäle in einer Pipeline sehen und Schritt für Schritt bis zur Zustellung weiterschalten.',
      requirements: [
        { text: 'Bestellungen nach Status gruppiert mit Zähler und Summe je Status', type: 'info', priority: 'must' },
        { text: 'Status per Aktion weiterschalten (Bezahlt markieren → Versenden → Zugestellt)', type: 'action', priority: 'must' },
        { text: 'Nach Kanal und Status filtern, nach Kunde oder Bestellnummer suchen', type: 'action', priority: 'should' },
        { text: 'Ein Tipp auf eine Bestellung öffnet das Bestelldetail (Kunde, Positionen, Summe, Kanal, Versand)', type: 'action', priority: 'should' },
        { text: 'Leere Status zeigen einen ruhigen Leerzustand', type: 'state', priority: 'must' },
        { text: 'Mobile: Status als Reiter, nie vier Spalten nebeneinander', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Bestellung antippen', result: 'Bestelldetail öffnet', event: 'order.open', to: 'sales.order' },
        { trigger: 'Aktion „Versenden“ tippen', result: 'Bestellung wandert in „Versendet“, Zähler aktualisieren sich', event: 'order.advance' },
        { trigger: 'Status-Kachel antippen', result: 'Liste zeigt diesen Status', event: 'pipeline.stage' },
        { trigger: 'Suchfeld eingeben', result: 'Liste filtert live', event: 'search.input' },
        { trigger: 'Kanalfilter wählen', result: 'Nur Bestellungen dieses Kanals', event: 'filter.change' },
      ],
      acceptance: ['Die Zähler je Status entsprechen der Zahl der Bestellungen (3 neu, 3 bezahlt, 2 versendet, 3 zugestellt).', '„Versenden“ verschiebt die Bestellung sofort in „Versendet“.', 'Ein Tipp auf eine Bestellung öffnet das Bestelldetail mit der richtigen Bestellung.', 'Auf Mobile erscheinen die Status als Kacheln mit Reiter-Verhalten.'],
      flows: [{ id: 'fl-versand2', name: 'Heute versenden', steps: [{ featureId: 'sales.orders', action: 'Reiter „Bezahlt“, Bestellung antippen' }, { featureId: 'sales.order', action: '„Versenden“, Sendungsnummer eintragen' }] }],
      viewports: ALL_VP,
      demoData: demo,
      variants: [
        {
          id: 'A', name: 'Pipeline-Spalten', direction: 'kompakt', concept: 'Vier Statusspalten (Kanban-artig) auf Desktop, Reiter mit Zählern auf Mobile. Suche und Kanalfilter oben.',
          description: '+ Fluss der Bestellungen sichtbar  − Viele Bestellungen verlängern die Spalten',
          layout: { type: 'stack' },
          blocks: [
            hdr({ title: 'Bestellungen', subtitle: 'Alle Bestellungen aus allen Kanälen', primaryLabel: '' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Kunde oder Nr. suchen …', filters: ORDER_CHIPS } },
            { id: 'pipe', component: 'order-pipeline', region: 'main', bind: { orders: 'orders' }, props: { title: 'Pipeline', mode: 'columns', openIn: 'select' } },
          ],
        },
        {
          id: 'B', name: 'Heute versenden', direction: 'fokus', concept: 'Nur das, was Aufmerksamkeit braucht: bezahlte Bestellungen zum Versenden zuerst, daneben neue zum Zahlungsabgleich. Große Aktion pro Zeile, Rest ausgeblendet.',
          description: '+ Abarbeiten ohne Rauschen  − Abgeschlossene Bestellungen sind nicht sichtbar',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Heute versenden', subtitle: 'Bezahlte Bestellungen zuerst', primaryLabel: '' }),
            { id: 'pipe', component: 'order-pipeline', region: 'main', bind: { orders: 'orders' }, props: { title: 'Zu bearbeiten', stages: 'paid, new', initial: 'paid', openIn: 'select' } },
          ],
        },
        {
          id: 'C', name: 'Überblick', direction: 'visuell', concept: 'Ring zeigt die Verteilung der Bestellungen auf die Status, daneben der Umsatz der letzten Tage; darunter die Pipeline als Reiter-Liste.',
          description: '+ Fluss auf einen Blick  − Weniger Bestellungen pro Bildschirm',
          layout: { type: 'grid' },
          blocks: [
            hdr({ title: 'Bestellungen', subtitle: 'Verteilung nach Status', primaryLabel: '' }),
            { id: 'stage', component: 'chart', region: 'main', span: 5, spanTablet: 12, bind: { series: 'stageChart' }, props: { title: 'Bestellungen nach Status', type: 'donut' } },
            { id: 'rev', component: 'chart', region: 'main', span: 7, spanTablet: 12, bind: { series: 'revenue' }, props: { title: 'Umsatz – letzte 7 Tage', type: 'bar', height: 170, format: 'currency' } },
            { id: 'pipe', component: 'order-pipeline', region: 'main', span: 12, bind: { orders: 'orders' }, props: { title: 'Pipeline', openIn: 'select' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['sales.order', 'sales.overview'],
    },
    // ------------------------------------------------------------------ Bestelldetail
    {
      id: 'sales.order', name: 'Bestellung', group: 'Bestellungen', status: 'design', tier: 1,
      purpose: 'Eine Bestellung vollständig verstehen und bearbeiten: Verlauf, nächster Schritt, Kunde, Positionen, Summe, Zahlung und Versand.',
      requirements: [
        { text: 'Status-Verlauf (neu → bezahlt → versendet → zugestellt) mit Zeitpunkten', type: 'info', priority: 'must' },
        { text: 'Nächster Schritt als primäre Aktion; „Versenden“ verlangt Paketdienst und Sendungsnummer', type: 'action', priority: 'must' },
        { text: 'Positionen mit Menge und Preis; Zwischensumme, Versand, enthaltene MwSt und Gesamtsumme stimmen rechnerisch überein', type: 'info', priority: 'must' },
        { text: 'Kunde mit Adresse und E-Mail; „Kunde kontaktieren“', type: 'info', priority: 'should' },
        { text: 'Kanal ist antippbar und führt zum Kanal-Detail', type: 'action', priority: 'should' },
        { text: 'Retoure anlegen und Rechnung exportieren (Rechnungen: nur Export)', type: 'action', priority: 'could' },
        { text: 'Beträge respektieren den Privatsphäre-Modus', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Nächster Schritt (z. B. „Versenden“)', result: 'Status wechselt, Verlauf bekommt einen Eintrag', event: 'order.advance' },
        { trigger: 'Kanal antippen', result: 'Kanal-Detail', event: 'channel.open', to: 'sales.channel' },
        { trigger: '„Retoure anlegen“', result: 'Hinweis, Retouren-Workflow folgt', event: 'order.return' },
        { trigger: '„Kunde kontaktieren“', result: 'E-Mail an den Kunden', event: 'order.contact' },
        { trigger: '„Rechnung exportieren“', result: 'PDF-Export', event: 'order.invoice' },
        { trigger: '„Zur Liste“', result: 'Bestell-Pipeline', event: 'header.secondary', to: 'sales.orders' },
      ],
      acceptance: ['Die Gesamtsumme entspricht Zwischensumme plus Versand, die enthaltene MwSt 19 % ist angegeben.', '„Versenden“ lässt sich ohne Sendungsnummer nicht bestätigen.', 'Nach dem Versenden zeigt der Verlauf „Versendet“ mit Zeitpunkt.', 'Der Kanal führt mit einem Tipp zum Kanal-Detail.'],
      flows: [{ id: 'fl-ship', name: 'Bestellung versenden', steps: [{ featureId: 'sales.order', action: '„Versenden“, Paketdienst DHL und Sendungsnummer eintragen' }, { featureId: 'sales.order', action: 'Verlauf zeigt „Versendet“' }] }],
      viewports: ALL_VP,
      demoData: { orders: '@world:orders' },
      variants: [
        {
          id: 'A', name: 'Vollständiges Detail', direction: 'kompakt', concept: 'Kopf mit Status und Kanal, Verlauf, nächster Schritt, danach Positionen mit Summen, Kunde sowie Zahlung und Versand nebeneinander. Alles in einer Ansicht.',
          description: '+ Vollständig, nichts versteckt  − Lang, besonders auf Mobile',
          layout: { type: 'stack' },
          blocks: [hdr({ eyebrow: 'Sales Channels', title: 'Bestellung', primaryLabel: '', secondaryLabel: 'Zur Liste', secondaryIcon: 'package' }), { id: 'ord', component: 'order-detail', region: 'main', props: { layout: 'full' } }],
        },
        {
          id: 'B', name: 'Nächster Schritt', direction: 'fokus', concept: 'Status und eine große Aktion zuerst, darunter nur Kunde und Gesamtsumme. Positionen sind weggelassen, die Bestellung lässt sich in Sekunden weiterschalten.',
          description: '+ Schnell abgearbeitet, einhändig  − Positionen nur in der vollständigen Ansicht',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Bestellung', primaryLabel: '', secondaryLabel: 'Zur Liste', secondaryIcon: 'package' }), { id: 'ord', component: 'order-detail', region: 'main', props: { layout: 'focus' } }],
        },
        {
          id: 'C', name: 'Reise der Bestellung', direction: 'visuell', concept: 'Große Gesamtsumme in einer getönten Kopfkarte, darunter der Weg durch die vier Status als senkrechte Reise mit der Aktion direkt am aktuellen Schritt, Positionen als Kacheln mit Summenband aus Waren und Versand.',
          description: '+ Stand und nächster Schritt auf einen Blick, Positionen anschaulich  − Länger als die Fokus-Ansicht, Zahlung und Versand nur im Verlauf',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Bestellung', subtitle: 'Vom Eingang bis zur Zustellung', primaryLabel: '', secondaryLabel: 'Zur Liste', secondaryIcon: 'package' }), { id: 'ord', component: 'order-journey', region: 'main', props: {} }],
        },
      ],
      selectedVariantId: 'A',
      links: ['sales.orders', 'sales.channel'],
    },
    // ------------------------------------------------------------------ Kanal-Detail
    {
      id: 'sales.channel', name: 'Kanal', group: 'Kanäle', status: 'design', tier: 1,
      purpose: 'Einen Kanal im Detail steuern: Status, Synchronisation, Fehler beheben, Kennzahlen, letzte Bestellungen, Protokoll und Einstellungen.',
      requirements: [
        { text: 'Status mit Ursache (Text, nicht nur Farbe), letzter Sync und nächster geplanter Lauf', type: 'info', priority: 'must' },
        { text: 'Aktion passend zum Zustand: Synchronisieren, Neu verbinden (Fehler) oder Fortsetzen (pausiert)', type: 'action', priority: 'must' },
        { text: 'Kennzahlen 30 Tage: Umsatz, Bestellungen, Ø Warenkorb, Veränderung; Verlauf über 6 Wochen', type: 'info', priority: 'should' },
        { text: 'Letzte Bestellungen des Kanals; ein Tipp öffnet das Bestelldetail', type: 'action', priority: 'must' },
        { text: 'Protokoll der letzten Läufe, Einstellungen (Auto-Sync, Fehlerbenachrichtigung) und Berechtigungen', type: 'info', priority: 'should' },
        { text: 'Zahlungsdaten werden nie gespeichert (Hinweis sichtbar)', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Jetzt synchronisieren', result: 'Ladezustand, danach Rückmeldung zu neuen Bestellungen', event: 'channel.sync' },
        { trigger: 'Neu verbinden', result: 'Dialog zur erneuten Anmeldung, Status wird „Verbunden“', event: 'channel.reconnect' },
        { trigger: 'Fortsetzen', result: 'Pausierter Kanal läuft wieder', event: 'channel.resume' },
        { trigger: 'Bestellung antippen', result: 'Bestelldetail', event: 'order.open', to: 'sales.order' },
        { trigger: 'Schalter Auto-Sync / Benachrichtigung', result: 'Einstellung wird gespeichert', event: 'channel.setting' },
        { trigger: '„Protokoll“', result: 'Sync-Protokoll aller Kanäle', event: 'header.secondary', to: 'sales.sync-log' },
        { trigger: 'Kanal im Vergleich antippen (Cockpit)', result: 'Das Cockpit zeigt den gewählten Kanal', event: 'channel.switch' },
      ],
      acceptance: ['Bei Etsy nennt die Statusbox die Ursache und bietet „Neu verbinden“; danach steht „Alles in Ordnung“.', 'Synchronisieren zeigt einen Ladezustand und meldet die Zahl neuer Bestellungen.', 'Ein Tipp auf eine Bestellung öffnet das Bestelldetail.', 'Pausierte Kanäle zeigen „Fortsetzen“ statt „Synchronisieren“.'],
      flows: [{ id: 'fl-etsy', name: 'Etsy wieder verbinden', steps: [{ featureId: 'sales.channel', action: '„Neu verbinden“ bestätigen' }, { featureId: 'sales.channel', action: 'Jetzt synchronisieren' }] }],
      viewports: ALL_VP,
      demoData: demo,
      variants: [
        {
          id: 'A', name: 'Vollständiges Detail', direction: 'kompakt', concept: 'Kopf, Statusbox mit Aktion, vier Kennzahlen, Verlauf, letzte Bestellungen, Protokoll und Einstellungen; in der Seitenspalte die Umsatzreihe aller Kanäle zum Vergleich.',
          description: '+ Alles zum Kanal an einem Ort  − Lang, auf Mobile viel Scrollen',
          layout: { type: 'split' },
          blocks: [hdr({ eyebrow: 'Sales Channels', title: 'Kanal', primaryLabel: '', secondaryLabel: 'Protokoll', secondaryIcon: 'history' }), { id: 'ch', component: 'channel-detail', region: 'main', props: { layout: 'full' } },
            { id: 'rev', component: 'chart', region: 'aside', bind: { series: 'revenue' }, props: { title: 'Umsatz 7 Tage (alle Kanäle)', type: 'area', height: 170, format: 'currency' } }],
        },
        {
          id: 'B', name: 'Status & nächste Aktion', direction: 'fokus', concept: 'Zuerst der Zustand mit der einen passenden Aktion (neu verbinden, fortsetzen oder synchronisieren), darunter Kennzahlen und die letzten drei Bestellungen. Protokoll und Einstellungen entfallen.',
          description: '+ Probleme sofort lösbar, übersichtlich  − Einstellungen nur in der vollständigen Ansicht',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Kanal', primaryLabel: '', secondaryLabel: 'Protokoll', secondaryIcon: 'history' }), { id: 'ch', component: 'channel-detail', region: 'main', props: { layout: 'focus' } }],
        },
        {
          id: 'C', name: 'Kanal-Cockpit', direction: 'visuell', concept: 'Großer Kopf mit 30-Tage-Umsatz, Verlaufsfläche und der einen passenden Aktion, darunter Umsatzanteil als Ring, alle Kanäle als Vergleichsbänder (Antippen wechselt den Kanal), Sync-Rhythmus als Punktleiste und letzte Bestellungen als wischbare Karten.',
          description: '+ Zustand, Entwicklung und Vergleich auf einen Blick  − Einstellungen und Berechtigungen nur in der vollständigen Ansicht',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Kanal', subtitle: 'Status, Umsatz und Vergleich', primaryLabel: '', secondaryLabel: 'Protokoll', secondaryIcon: 'history' }), { id: 'ch', component: 'channel-cockpit', region: 'main', props: {} }],
        },
      ],
      selectedVariantId: 'A',
      links: ['sales.overview', 'sales.order', 'sales.sync-log'],
    },
    // ------------------------------------------------------------------ Sync-Protokoll
    {
      id: 'sales.sync-log', name: 'Sync-Protokoll', group: 'Kanäle', status: 'design', tier: 2,
      purpose: 'Nachvollziehen, wann welcher Kanal synchronisiert wurde, was importiert wurde und wo Fehler auftraten – mit direkter Abhilfe.',
      requirements: [
        { text: 'Chronologische Liste aller Läufe mit Kanal, Ergebnis und Zeit', type: 'info', priority: 'must' },
        { text: 'Fehler heben sich durch Text und Symbol ab und bieten „Neu verbinden“ im Kanalbereich', type: 'state', priority: 'must' },
        { text: 'Fehlerkanäle stehen oben in der Kanalliste', type: 'rule', priority: 'should' },
        { text: 'Leerzustand „Noch keine Läufe“', type: 'state', priority: 'must' },
      ],
      interactions: [{ trigger: 'Kanal antippen', result: 'Kanal-Detail', event: 'channel.open', to: 'sales.channel' }, { trigger: 'Neu verbinden', result: 'Dialog zur erneuten Anmeldung', event: 'channel.reconnect' }],
      acceptance: ['Der Etsy-Fehler steht im Protokoll mit Zeit und Ursache.', '„Neu verbinden“ stellt Etsy wieder her.'],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: demo,
      variants: [{
        id: 'A', name: 'Protokoll & Kanäle', direction: 'kompakt', concept: 'Links das chronologische Protokoll, rechts die Kanäle mit Fehlerkanälen zuerst und „Neu verbinden“ direkt an der Zeile.',
        description: '+ Ursache und Abhilfe nebeneinander  − Auf Mobile untereinander',
        layout: { type: 'split' },
        blocks: [hdr({ eyebrow: 'Sales Channels', title: 'Sync-Protokoll', subtitle: 'Läufe der letzten Tage', primaryLabel: '' }), { id: 'feed', component: 'activity-feed', region: 'main', bind: { events: 'syncLog' }, props: { title: 'Läufe', limit: 12 } },
          { id: 'cards', component: 'channel-cards', region: 'aside', bind: { channels: 'channels' }, props: { title: 'Kanäle', errorsFirst: true, showStats: false, density: 'compact', minWidth: 400 } }],
      }],
      selectedVariantId: 'A',
      links: ['sales.channel'],
    },
    // ------------------------------------------------------------------ Listings
    {
      id: 'sales.listings', name: 'Produkte & Listings', group: 'Produkte', status: 'analyzed', tier: 2,
      purpose: 'Produkte einmal pflegen und sehen, auf welchen Kanälen sie gelistet sind – inklusive Bestand und Preisabweichungen.',
      requirements: [
        { text: 'Produktliste mit Bild, Titel, Bestand und Listing-Status je Kanal', type: 'info', priority: 'must' },
        { text: 'Preis- und Bestandsabweichungen zwischen Kanälen markieren', type: 'rule', priority: 'should' },
        { text: 'Produkt auf weiteren Kanälen veröffentlichen', type: 'action', priority: 'should' },
        { text: 'Mehrfachauswahl für Massenaktionen (pausieren, Preis anpassen)', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Produkt antippen', result: 'Detail mit Kanal-Listings', event: 'item.open' }, { trigger: 'Auf Kanal veröffentlichen', result: 'Listing wird angelegt', event: 'listing.publish' }],
      viewports: ['desktop', 'tablet', 'mobile'],
      notes: 'Offen: Wie werden Varianten (Größe/Farbe) kanalübergreifend abgebildet?',
    },
    // ------------------------------------------------------------------ Kanal verbinden
    {
      id: 'sales.connect', name: 'Kanal verbinden', group: 'Einrichtung', status: 'review', tier: 2,
      purpose: 'Einen neuen Verkaufskanal in wenigen Schritten anbinden und die erste Synchronisation anstoßen.',
      requirements: [
        { text: 'Kanal wählen (Shopify, Etsy, Amazon, eBay, eigener Shop)', type: 'action', priority: 'must' },
        { text: 'Pflichtfelder (Shop-URL, API-Schlüssel) werden vor dem Speichern geprüft', type: 'rule', priority: 'must' },
        { text: 'Hinweis, welche Berechtigungen TAKT benötigt', type: 'info', priority: 'should' },
        { text: 'Nach dem Speichern erscheint der Kanal in der Liste und kann sofort synchronisiert werden', type: 'state', priority: 'must' },
        { text: 'Fehler bei ungültigen Zugangsdaten verständlich anzeigen', type: 'state', priority: 'should' },
      ],
      interactions: [{ trigger: 'Formular absenden', result: 'Kanal erscheint in der Liste rechts', event: 'form.submit' }, { trigger: 'Absenden ohne Pflichtfelder', result: 'Fehler unter den Feldern', event: 'form.invalid' }, { trigger: 'Neuen Kanal synchronisieren', result: 'Ladezustand, danach Rückmeldung', event: 'channel.sync' }, { trigger: 'Kanal in der Liste antippen', result: 'Kanal-Detail', event: 'channel.open', to: 'sales.channel' }],
      acceptance: ['Ohne Shop-URL und API-Schlüssel meldet das Formular den Fehler am Feld.', 'Nach „Verbinden“ steht der neue Kanal in der Liste rechts.'],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { channels: '@world:channels' },
      variants: [{
        id: 'A', name: 'Formular + Bestand', direction: 'kompakt', concept: 'Links das Verbindungsformular, rechts bereits verbundene Kanäle zur Orientierung. Hinweis zu Berechtigungen oberhalb.',
        description: '+ Einfach, ein Schritt  − Kein geführter Assistent für komplexe OAuth-Kanäle',
        layout: { type: 'split', asideFirstOnMobile: false },
        blocks: [
          hdr({ title: 'Kanal verbinden', subtitle: 'Neuen Verkaufskanal anbinden', primaryLabel: '' }),
          { id: 'n', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Berechtigungen', text: 'TAKT liest Bestellungen und Produkte und schreibt Versandstatus zurück. Zahlungsdaten werden nie gespeichert.' } },
          { id: 'form', component: 'form-card', region: 'main', bind: { target: 'channels' }, props: { title: 'Zugangsdaten', fields: 'name*:Kanalname:text, platform:Plattform:select:Shopify|Etsy|Amazon|eBay|Eigener Shop, url*:Shop-URL:text, key*:API-Schlüssel:password', submitLabel: 'Verbinden', columns: 1 } },
          { id: 'cards', component: 'channel-cards', region: 'aside', bind: { channels: 'channels' }, props: { title: 'Verbundene Kanäle', minWidth: 400, showStats: false, density: 'compact' } },
        ],
      }],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf' }, { kind: 'review' }],
    },
    // ------------------------------------------------------------------ Umsatz
    {
      id: 'sales.revenue', name: 'Auswertung Umsatz', group: 'Auswertung', status: 'design', tier: 2,
      purpose: 'Umsatzentwicklung und Kanalanteile verstehen, um zu entscheiden, wo sich Aufwand lohnt.',
      requirements: [
        { text: 'Umsatz der letzten 7 Tage je Kanal als Diagramm', type: 'info', priority: 'must' },
        { text: 'Anteile der Kanäle am Gesamtumsatz (30 Tage)', type: 'info', priority: 'must' },
        { text: 'Kennzahlen: Umsatz, Bestellungen, Ø Warenkorb, Retourenquote mit Trend', type: 'info', priority: 'should' },
        { text: 'Tabelle der Kanäle sortierbar nach Umsatz, Bestellungen und Veränderung; Zeile öffnet das Kanal-Detail', type: 'action', priority: 'should' },
        { text: 'Zeitraum wechseln (7 Tage, 30 Tage, Quartal)', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Datenpunkt im Diagramm antippen', result: 'Tooltip mit Werten je Kanal', event: 'chart.point' }, { trigger: 'Spaltenkopf antippen', result: 'Tabelle sortiert neu', event: 'table.sort' }, { trigger: 'Kanalzeile antippen', result: 'Kanal-Detail', event: 'row.open', to: 'sales.channel' }, { trigger: 'Kennzahl antippen', result: 'Aufschlüsselung öffnet', event: 'metric.open' }],
      acceptance: ['Die Anteile im Ring entsprechen den 30-Tage-Umsätzen der Kanäle.', 'Die Tabelle lässt sich nach Umsatz sortieren.', 'Ein Tipp auf eine Kanalzeile öffnet das Kanal-Detail.'],
      viewports: ALL_VP,
      demoData: { ...demo, metrics: metricsRevenue },
      variants: [
        {
          id: 'A', name: 'Analyse-Raster', direction: 'kompakt', concept: 'Kennzahlen, großer Umsatzverlauf (Fläche), Anteile als Ring und sortierbare Kanaltabelle darunter.',
          description: '+ Vollständig, vergleichbar  − Viel Information, Mobile wird lang',
          layout: { type: 'grid' },
          blocks: [
            hdr({ title: 'Umsatz', subtitle: 'November 2026', primaryLabel: 'Export', primaryIcon: 'download' }),
            { id: 'kpi', component: 'kpi-tiles', region: 'main', span: 12, bind: { metrics: 'metrics' } },
            { id: 'rev', component: 'chart', region: 'main', span: 8, spanTablet: 12, bind: { series: 'revenue' }, props: { title: 'Umsatz je Kanal – 7 Tage', type: 'area', height: 220, format: 'currency' } },
            { id: 'share', component: 'chart', region: 'main', span: 4, spanTablet: 12, bind: { series: 'shares' }, props: { title: 'Anteile', type: 'donut', format: 'currency' } },
            { id: 'tbl', component: 'data-table', region: 'main', span: 12, bind: { rows: 'rows' }, props: { title: 'Kanäle im Vergleich', columns: 'title:Kanal:text, revenue:Umsatz:currency, orders:Bestellungen:number, change:Veränderung:percent, trend:Verlauf:spark' } },
          ],
        },
        {
          id: 'B', name: 'Große Diagramme', direction: 'visuell', concept: 'Ein großer Umsatzverlauf als Balken mit Zeitraum-Umschalter, daneben die Anteile; Kennzahlen ohne Rahmen darüber. Eine Botschaft: Wo kommt der Umsatz her?',
          description: '+ Ruhig, sofort lesbar  − Keine Tabelle, weniger exakte Zahlen',
          layout: { type: 'grid' },
          blocks: [
            hdr({ title: 'Umsatz', subtitle: 'Wo kommt der Umsatz her?', primaryLabel: '' }),
            { id: 'kpi', component: 'kpi-tiles', region: 'main', span: 12, bind: { metrics: 'metrics' }, props: { variant: 'plain', showSpark: false } },
            { id: 'rev', component: 'chart', region: 'main', span: 8, spanTablet: 12, bind: { series: 'revenue' }, props: { title: 'Umsatz je Kanal', type: 'bar', height: 280, format: 'currency', ranges: '7 Tage' } },
            { id: 'share', component: 'chart', region: 'main', span: 4, spanTablet: 12, bind: { series: 'shares' }, props: { title: 'Anteile (30 Tage)', type: 'donut', format: 'currency' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['sales.channel', 'sales.overview'],
    },
    {
      id: 'sales.returns', name: 'Retouren', group: 'Bestellungen', status: 'not_analyzed', tier: 3,
      purpose: 'Retouren erfassen und Erstattungen nachvollziehen.',
      requirements: [
        { text: 'Retourenliste mit Grund, Status und Erstattungsbetrag', type: 'info', priority: 'should' },
        { text: 'Retoure aus einer Bestellung heraus anlegen', type: 'action', priority: 'could' },
        { text: 'Retourenquote je Kanal und Produkt', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Retoure anlegen', result: 'Formular öffnet', event: 'form.open' }],
      viewports: ['desktop', 'mobile'],
    },
    // ------------------------------------------------------------------ Skelette (Tier 3)
    {
      id: 'sales.shipping', name: 'Versand & Tracking', group: 'Bestellungen', status: 'not_analyzed', tier: 3,
      purpose: 'Versandaufträge bündeln, Etiketten erzeugen und Sendungen verfolgen.',
      requirements: [{ text: 'Sammel-Etiketten für mehrere Bestellungen, Paketdienst und Sendungsnummer', type: 'action', priority: 'could' }, { text: 'Sendungsstatus (unterwegs, zugestellt) je Bestellung', type: 'info', priority: 'could' }],
      interactions: [], viewports: ['desktop', 'mobile'],
    },
    {
      id: 'sales.inventory', name: 'Lagerbestand', group: 'Produkte', status: 'not_analyzed', tier: 3,
      purpose: 'Bestand je Artikel über alle Kanäle, Mindestbestand mit Warnung und Nachbestellliste.',
      requirements: [{ text: 'Bestand je Artikel und Kanal; Warnung unter Mindestbestand', type: 'info', priority: 'could' }, { text: 'Nachbestellliste für Lieferanten', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop', 'mobile'],
    },
    {
      id: 'sales.customers', name: 'Kunden', group: 'Auswertung', status: 'not_analyzed', tier: 3,
      purpose: 'Kunden mit Bestellhistorie, Wiederkäufern und Notizen.',
      requirements: [{ text: 'Kundenliste mit Umsatz und Anzahl Bestellungen; Wiederkäufer markieren', type: 'info', priority: 'could' }, { text: 'Datenschutz: Löschen auf Anfrage', type: 'rule', priority: 'should' }],
      interactions: [], viewports: ['desktop', 'mobile'],
    },
    {
      id: 'sales.margin', name: 'Marge', group: 'Auswertung', status: 'not_analyzed', tier: 3,
      purpose: 'Marge je Produkt und Kanal aus Einkaufspreis, Gebühren, Versand und Retouren.',
      requirements: [{ text: 'Marge je Artikel und Kanal; Gebührenmodell je Plattform', type: 'info', priority: 'could' }, { text: 'Preisvorschlag bei Gebührenänderung (z. B. Januar)', type: 'info', priority: 'could' }],
      interactions: [], viewports: ['desktop'],
    },
  ],
  decisions: [
    { featureId: 'sales.overview', title: 'Erststart: Kopf-Aktion „Kanal verbinden“ zusätzlich zur Einladung?', decision: '',
      rationale: 'Empfehlung: ohne Kanal nur die Einladung mit einer Aktion zeigen und die Kopf-Aktion ausblenden (TEXT_STIL §4: genau eine Aktion). Das braucht eine Kopfzeile, die ohne Daten keine Aktion zeigt (Kern, `page-header`); bis dahin stehen beide.',
      tradeoffs: 'Mit Kopf-Aktion bleibt der Weg an derselben Stelle wie in der gefüllten Ansicht, die Einladung wirkt aber doppelt.', status: 'open' },
    { featureId: 'sales.channel', title: 'Kanal: Cockpit mit Vergleich oder Statusansicht als visuelle Version?', decision: '',
      rationale: 'Empfehlung: Cockpit (C) für die visuelle Version. Es zeigt Zustand, Entwicklung und Vergleich auf einen Blick; Einstellungen und Berechtigungen bleiben in der vollständigen Ansicht (A).',
      tradeoffs: 'Das Cockpit ist länger als die Fokus-Ansicht und zeigt keine Einstellungen.', status: 'open' },
    { featureId: 'sales.overview', title: 'Welche Variante für die Übersicht?', decision: '', rationale: 'A (Cockpit) bietet den besten Überblick, C (Aufmerksamkeit) ist im Alltag schneller. Idee: C als mobile Standardansicht, A ab Tablet.', tradeoffs: 'Zwei Ansichten bedeuten höheren Pflegeaufwand; eine Variante mit Umschalter wäre denkbar.', status: 'open' },
    { featureId: 'sales.overview', title: 'Synchronisation: automatisch und manuell', decision: 'Kanäle synchronisieren automatisch alle 15 Minuten; zusätzlich gibt es einen manuellen „Synchronisieren“-Button je Kanal.', rationale: 'Händler wollen nach einer Preisänderung sofort Gewissheit, ohne auf den Takt zu warten.', tradeoffs: 'Mehr API-Last (Rate-Limits der Kanäle); manueller Sync wird pro Kanal gedrosselt.', status: 'decided' },
    { featureId: 'sales.order', title: 'Versenden verlangt Sendungsnummer', decision: 'Der Schritt „Versenden“ öffnet einen Dialog für Paketdienst und Sendungsnummer; ohne Nummer lässt er sich nicht bestätigen.', rationale: 'Die Nummer wird an den Kanal zurückgeschrieben (Kunden sehen den Status) und vermeidet Rückfragen.', tradeoffs: 'Ein Schritt mehr; für Selbstabholer braucht es später eine Ausnahme.', status: 'decided' },
    { featureId: 'sales.connect', title: 'Anbindung per OAuth oder API-Schlüssel?', decision: '', rationale: 'Shopify, Etsy und Amazon bieten OAuth; kleinere Kanäle nur Schlüssel. Das Formular im Entwurf deckt nur den Schlüssel-Fall ab.', status: 'open' },
    { featureId: 'sales.channel', title: 'Fehler: Neu verbinden im Kanal oder in der Übersicht?', decision: 'Beides: „Neu verbinden“ steht an der Fehlerzeile in der Übersicht, im Kanal-Detail und im Sync-Protokoll, der Dialog ist derselbe.', rationale: 'Wer den Fehler sieht, soll ihn dort beheben können, ohne Umweg über Einstellungen.', tradeoffs: 'Mehrere Stellen mit derselben Aktion; ein gemeinsamer Dialog hält das Verhalten gleich.', status: 'decided' },
  ],
};
