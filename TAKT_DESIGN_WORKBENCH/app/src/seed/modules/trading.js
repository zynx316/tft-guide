// Modul "Trading" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today). ALLES IST SIMULATION: Kurse fiktiv, keine Orderausführung.
// Depot, Watchlist, Dividenden und Sparpläne kommen aus der gemeinsamen Finanzwelt (seed/world/finance.js, Eigentümer: Finanzen) per '@world:'.
// Kursalarme, simulierte Orders, gebuchte Käufe/Verkäufe, Soll-Anteile und der Vergleichsindex liegen in seed/world/trading.js (`@world:trading…`).
// Lokal im Modul liegen nur die Kursverläufe (fiktiv, auf den Welt-Kursen verankert). Rechnen: library/components/trading/_calc.js über core/finmath.js.
import { buildInstruments } from '../../library/components/trading/_seeddata.js';

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const FULL = buildInstruments();
/** Kursverläufe auf die nötigen Zeiträume kürzen (hält den gespeicherten Stand klein). */
const slim = (keep = []) => FULL.map((i) => ({ ...i, ranges: Object.fromEntries(keep.filter((k) => i.ranges[k]).map((k) => [k, i.ranges[k]])) }));
const WORLD = {
  positions: '@world:positions', cash: '@world:depotCash', history: '@world:depotHistory', watchlist: '@world:watchlist', dividends: '@world:dividends',
  plans: '@world:savingsPlans', transactions: '@world:transactions', accounts: '@world:accounts', allowance: '@world:taxAllowance',
};
const TRD = { alerts: '@world:tradingAlerts', orders: '@world:tradingOrders', trades: '@world:tradingTrades', targets: '@world:tradingTargets', benchmark: '@world:tradingBenchmark' };
const demo = (keep = []) => ({ ...WORLD, ...TRD, instruments: slim(keep) });

const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Trading', primaryLabel: '', ...props } });
const blk = (id, component, region, props = {}, extra = {}) => ({ id, component, region, props, ...extra });
// Pflicht-Hinweise (docs/FINANCE_GUIDELINES.md 2.3): Simulation (nicht wegklickbar), Kursdaten, keine Beratung
const SIM = (region = 'main') => blk('l-sim', 'legal-notice', region, { kind: 'simulation', style: 'banner' });
const KURS = (region = 'main') => blk('l-kurs', 'legal-notice', region, { kind: 'kursdaten', style: 'inline', stand: 'fiktiv, 24.11.2026 09:30' });
const FOOT = blk('l-foot', 'legal-notice', 'footer', { kind: 'keine-beratung', style: 'footer' });
const STEUER = (region = 'main') => blk('l-steuer', 'legal-notice', region, { kind: 'steuer', style: 'inline' });
const MODELL = (region = 'main') => blk('l-modell', 'legal-notice', region, { kind: 'modellrechnung', style: 'inline' });
const R_LEGAL = { text: 'Simulation (Banner, nicht wegklickbar), Kursdaten (inline) und „keine Anlageberatung“ (Fuß) sind in jeder Variante sichtbar (legal-notice)', type: 'rule', priority: 'must' };
const R_PRIVACY = { text: 'Privatmodus: Beträge des Depots (Werte, Gewinne, Guthaben, Orders) erscheinen als „••••“; öffentliche Kurse bleiben sichtbar', type: 'rule', priority: 'must' };
const R_SIGN = { text: 'Gewinn und Verlust tragen Vorzeichen und Pfeil (▲ ▼), Farbe ist nie das einzige Merkmal', type: 'rule', priority: 'must' };
const STATES = { text: 'Zustände: Erststart (Einladung „Wertpapier beobachten“, „Order simulieren“), leer, lädt, Fehler; Stress mit langen Namen', type: 'state', priority: 'must' };

// ============================================================ Übersicht (Startseite)
const home = {
  id: 'trading.home', name: 'Übersicht', group: 'Übersicht', status: 'review', tier: 1, usage: 'täglich',
  purpose: 'Der Einstieg in Trading: Depotwert und Tagesveränderung, was sich bewegt, Watchlist im Blick, nächste Sparplan-Ausführungen und Dividenden, Kursalarme. Alles Anzeige und Simulation, ohne Empfehlung.',
  requirements: [
    { text: 'Depotwert mit Tagesveränderung (€ und %) und Gesamtgewinn seit Kauf ohne Scrollen; identisch mit dem Depot-Konto in Finanzen', type: 'info', priority: 'must' },
    { text: 'Top-Bewegungen des Tages aus Depot und Watchlist, antippen öffnet das Wertpapier', type: 'info', priority: 'must' },
    { text: 'Watchlist-Auszug mit Kurs, Tagesveränderung und Mini-Verlauf; Link zur ganzen Watchlist', type: 'info', priority: 'should' },
    { text: 'Nächste Termine mit Geldwirkung: Sparplan-Ausführungen (mit Deckungs-Hinweis) und erwartete Dividenden', type: 'info', priority: 'must' },
    { text: 'Kursalarme: aktive mit Abstand zur Marke, „nah“ bei höchstens 3 %; Alarm anlegen ohne Umweg (Fokus)', type: 'action', priority: 'should' },
    { text: 'Hinweise nach Priorität, sachlich ohne Handlungsempfehlung (Alarm nah, offene simulierte Orders, Sparplan-Abbuchung, Abweichung vom Zielwert)', type: 'info', priority: 'should' },
    R_LEGAL, R_PRIVACY, R_SIGN, STATES,
  ],
  interactions: [
    { trigger: 'Depot-Kopf antippen', result: 'Depot mit Positionen und Aufteilung', event: 'depot.open', to: 'trading.portfolio' },
    { trigger: '„Alle Positionen“ antippen', result: 'Depot mit Positionen und Aufteilung', event: 'portfolio.open', to: 'trading.portfolio' },
    { trigger: 'Position antippen', result: 'Wertpapier mit Kursverlauf', event: 'position.open', to: 'trading.detail' },
    { trigger: 'Wertpapier in Bewegungen oder Watchlist antippen', result: 'Wertpapier mit Kursverlauf', event: 'security.open', to: 'trading.detail' },
    { trigger: '„Alle anzeigen“ in der Watchlist', result: 'Watchlist mit Suche und Filter', event: 'watchlist.open', to: 'trading.watchlist' },
    { trigger: '„Watchlist“ im Kopf antippen', result: 'Watchlist mit Suche und Filter', event: 'header.secondary', to: 'trading.watchlist' },
    { trigger: '„Order (Simulation)“ antippen', result: 'Order-Ticket öffnet sich', event: 'order.new', to: 'trading.order' },
    { trigger: 'Order-Knopf in der Positionszeile', result: 'Order-Ticket mit dem Wertpapier', event: 'position.trade', to: 'trading.order' },
    { trigger: '„Alle Alarme“ antippen', result: 'Kursalarme mit Formular', event: 'alerts.open', to: 'trading.alerts' },
    { trigger: 'Alarm antippen', result: 'Wertpapier mit Kursverlauf', event: 'alert.open', to: 'trading.detail' },
    { trigger: 'Dividende antippen', result: 'Dividenden mit Kalender und Prognose', event: 'dividends.open', to: 'trading.dividends' },
    { trigger: 'Sparplan-Ausführung antippen', result: 'Sparplan-Detail im Modul Sparpläne', event: 'plan.open', to: 'savings.plan' },
    { trigger: 'Alarm in der Watchlist-Zeile', result: 'Kursalarme mit dem Wertpapier', event: 'alert.new', to: 'trading.alerts' },
    { trigger: 'Hinweis antippen', result: 'Passender Bereich: Wertpapier, Order, Sparplan-Kalender oder Wertentwicklung', event: 'hint.alert' },
    { trigger: 'Schnell-Alarm eintippen (Fokus)', result: 'Alarm entsteht, Liste und Hinweise ändern sich', event: 'alert.create' },
  ],
  acceptance: [
    'Bei 390 px stehen Depotwert, Tagesveränderung und die erste Aktion ohne Scrollen im sichtbaren Bereich; der Depotwert ist 30.097,70 € wie in Finanzen.',
    'Gewinn und Verlust tragen Vorzeichen und Pfeil; mit Privatmodus enthält die Seite keinen Betrag des Depots, nur „••••“.',
    'Ein Tipp auf eine Position oder ein Wertpapier öffnet das Wertpapier-Detail mit dem richtigen Papier.',
    'In der Fokus-Variante legt ein Alarm ohne Wechsel des Screens eine neue Kursmarke an; sie erscheint sofort in der Liste.',
    'Simulations-Banner, Kursdaten-Zeile und „keine Anlageberatung“ sind in jeder Variante sichtbar.',
    'Im Szenario „Erster Start“ zeigt die Seite Einladungen („Wertpapier beobachten“, „Order simulieren“) statt Nullwerten.',
  ],
  flows: [
    { id: 'fl-papier', name: 'Wertpapier prüfen', steps: [{ featureId: 'trading.home', action: 'Position in „Positionen“ antippen' }, { featureId: 'trading.detail', action: 'Zeitraum wechseln, Kennzahlen lesen' }, { featureId: 'trading.order', action: '„Kauf simulieren“ und Ticket prüfen' }] },
    { id: 'fl-alarm', name: 'Alarm setzen', steps: [{ featureId: 'trading.home', action: 'Im Fokus-Rahmen Wertpapier, Richtung und Marke eintippen' }, { featureId: 'trading.alerts', action: 'Alarm in der Liste sehen' }] },
    { id: 'fl-termine', name: 'Termine prüfen', steps: [{ featureId: 'trading.home', action: '„Als Nächstes“ antippen' }, { featureId: 'savings.plan', action: 'Sparplan ansehen' }] },
  ],
  viewports: ALL_VP, demoData: demo(['1M']),
  variants: [
    {
      id: 'A', name: 'Depot und Termine', direction: 'kompakt',
      concept: 'Dichte Arbeitsansicht: Depot-Streifen, Positionstabelle mit Order-Knopf in der Zeile und Watchlist-Auszug im Hauptbereich; in der Seitenspalte Bewegungen, nächste Termine und Alarme.',
      description: '+ Alles gleichzeitig, Zahlen exakt, Aktionen in der Zeile  − Viele Blöcke, auf dem Handy eine lange Seite',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Trading', subtitle: 'Di, 24.11. · Simulation, Kurse fiktiv', primaryLabel: 'Order (Simulation)', primaryIcon: 'trending-up', primaryEvent: 'order.new', secondaryLabel: 'Watchlist', secondaryIcon: 'star' }),
        SIM(),
        blk('hero', 'trd-depot-hero', 'main', { style: 'strip' }),
        blk('pos', 'trd-positions', 'main', { style: 'table', limit: 5 }),
        blk('watch', 'trd-watchlist', 'main', { style: 'compact', limit: 4, showTools: false, showAdd: false, showAll: true }),
        blk('mv', 'trd-movers', 'aside', { style: 'list', limit: 4 }),
        blk('up', 'trd-upcoming', 'aside', { style: 'list', limit: 4 }),
        blk('al', 'trd-alerts', 'aside', { style: 'list', limit: 3, showForm: false, showAll: true }),
        KURS('aside'), FOOT,
      ],
    },
    {
      id: 'B', name: 'Depot im Bild', direction: 'visuell',
      concept: 'Große Depotkarte mit Verlauf, daneben Gewinner und Verlierer als Balken. Watchlist als Karten mit Verlauf, der nächste Termin als eine Karte, Alarme mit Abstandsbalken. Eine Botschaft pro Karte.',
      description: '+ Entwicklung und Bewegung sofort sichtbar, ruhige Wirkung  − Weniger Zahlen pro Bildschirm, mehr Scrollen',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Dein Depot', subtitle: 'Simulation · Kurse fiktiv, Stand 09:30', primaryLabel: 'Order (Simulation)', primaryIcon: 'trending-up', primaryEvent: 'order.new' }),
        SIM('main'),
        blk('hero', 'trd-depot-hero', 'main', { style: 'hero' }, { span: 7 }),
        blk('mv', 'trd-movers', 'main', { style: 'bars', limit: 6, title: 'Gewinner und Verlierer' }, { span: 5 }),
        blk('watch', 'trd-watchlist', 'main', { style: 'cards', limit: 3, showTools: false, showAdd: false, showAll: true }, { span: 12 }),
        blk('up', 'trd-upcoming', 'main', { style: 'next' }, { span: 5 }),
        blk('al', 'trd-alerts', 'main', { style: 'cards', limit: 2, showForm: false, showAll: true }, { span: 7 }),
        KURS('main'), FOOT,
      ],
    },
    {
      id: 'C', name: 'Was ist wichtig?', direction: 'fokus',
      concept: 'Zuerst wenige priorisierte Hinweise (Alarm nah, Sparplan-Abbuchung, offene Orders), dann der Depotwert als eine Zeile, der nächste Termin und ein Schnell-Alarm zum direkten Anlegen. Watchlist nur mit drei Zeilen.',
      description: '+ Klare nächste Handlung, Alarm anlegen ohne Umweg, wenig Ablenkung  − Positionen und Verlauf erst über „Depot“',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Was ist wichtig?', subtitle: 'Di, 24.11. · Simulation', primaryLabel: 'Order (Simulation)', primaryIcon: 'trending-up', primaryEvent: 'order.new' }),
        SIM(),
        blk('hints', 'trd-hints', 'main', { limit: 3, title: 'Wichtig' }),
        blk('hero', 'trd-depot-hero', 'main', { style: 'focus' }),
        blk('up', 'trd-upcoming', 'main', { style: 'next', title: 'Als Nächstes' }),
        blk('al', 'trd-alerts', 'main', { style: 'quick', limit: 2, title: 'Kursalarme', showAll: true }),
        blk('mv', 'trd-movers', 'main', { style: 'chips', limit: 4 }),
        blk('watch', 'trd-watchlist', 'main', { style: 'compact', limit: 3, showTools: false, showAdd: false, showAll: true }),
        KURS('main'), FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['trading.portfolio', 'trading.watchlist', 'trading.alerts', 'trading.dividends', 'trading.order'],
  seedHistory: [{ kind: 'draft', note: 'Drei Richtungen: Depot und Termine, Depot im Bild, Was ist wichtig?' }, { kind: 'review', note: 'Alle Varianten in drei Themes und vier Breiten geprüft' }],
};

// ============================================================ Watchlist
const watchlist = {
  id: 'trading.watchlist', name: 'Watchlist', group: 'Märkte', status: 'design', tier: 2, usage: 'täglich',
  purpose: 'Beobachtete Wertpapiere mit Kurs, Tagesveränderung und Mini-Verlauf scannen, suchen, filtern und per Tipp das Wertpapier öffnen. Kurse sind fiktiv.',
  requirements: [
    { text: 'Je Wertpapier: Name, Typ, Kurs, Veränderung heute (mit Pfeil und Vorzeichen), Mini-Verlauf, Alarm-Markierung', type: 'info', priority: 'must' },
    { text: 'Suchen, nach Typ filtern (ETF, Aktie, Krypto, Rohstoff) und sortieren (eigene Reihenfolge, Name, Heute, Kurs)', type: 'action', priority: 'should' },
    { text: 'Wertpapier hinzufügen (Dialog mit Suche über Name, Kürzel, ISIN) und entfernen mit Rückgängig', type: 'action', priority: 'must' },
    { text: 'Antippen öffnet das Wertpapier; in der Zeile: Alarm anlegen, entfernen (Desktop)', type: 'action', priority: 'must' },
    { text: 'Krypto-Einträge tragen den Hinweis „Hochspekulativ, Totalverlust möglich“ direkt am Eintrag', type: 'rule', priority: 'must' },
    { text: 'Börsenstatus und Datenstand („Kurse fiktiv, Stand 09:30“) in einer Zeile; offline mit Stand der letzten Aktualisierung', type: 'info', priority: 'should' },
    R_LEGAL, R_PRIVACY, STATES,
  ],
  interactions: [
    { trigger: 'Wertpapier antippen', result: 'Wertpapier mit Kursverlauf', event: 'security.open', to: 'trading.detail' },
    { trigger: 'Glocke in der Zeile', result: 'Kursalarme mit dem Wertpapier', event: 'alert.new', to: 'trading.alerts' },
    { trigger: '„Hinzufügen“ antippen', result: 'Dialog mit Suche; Auswahl nimmt das Papier auf', event: 'watch.add' },
    { trigger: 'Kreuz in der Zeile', result: 'Papier entfernt, Rückgängig erscheint', event: 'watch.remove' },
    { trigger: 'Sortierung wechseln', result: 'Reihenfolge ändert sich', event: 'watch.sort' },
    { trigger: 'Filterchip wählen', result: 'Nur der gewählte Typ ist sichtbar', event: 'watch.filter' },
  ],
  acceptance: [
    'Die Suche „sap“ zeigt nur SAP SE; „Keine Treffer“ erscheint mit Hinweis, wenn nichts passt.',
    'Ein hinzugefügtes Wertpapier erscheint sofort oben; Entfernen bietet „Rückgängig“.',
    'Jede Veränderung trägt Pfeil und Vorzeichen; Bitcoin zeigt den Krypto-Hinweis am Eintrag.',
    'Im Szenario „Erster Start“ lädt „Wertpapier hinzufügen“ zum ersten Eintrag ein.',
  ],
  flows: [{ id: 'fl-watch', name: 'Wertpapier aufnehmen und ansehen', steps: [{ featureId: 'trading.watchlist', action: '„Hinzufügen“, „Nordwind“ suchen und wählen' }, { featureId: 'trading.detail', action: 'Zeile antippen, Verlauf ansehen' }] }],
  viewports: ALL_VP, demoData: demo(['1T', '1W', '1M', '1J', '5J']),
  variants: [
    {
      id: 'A', name: 'Tabelle und Verlauf', direction: 'kompakt',
      concept: 'Master-Detail: links die durchsuchbare Watchlist als Tabelle mit Aktionen in der Zeile, rechts der Kursverlauf des gewählten Papiers. Auf dem Handy folgt der Verlauf unter der Liste.',
      description: '+ Vergleichen und hineinzoomen ohne Seitenwechsel  − Auf dem Handy Scrollen zwischen Liste und Verlauf',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Watchlist', subtitle: 'Simulation · Kurse fiktiv' }),
        SIM(), blk('ms', 'trd-market-status', 'main'),
        blk('wl', 'trd-watchlist', 'main', { style: 'table' }),
        blk('chart', 'price-chart', 'aside', { type: 'area', initialRange: '1M', height: 240, showCost: false }),
        KURS('aside'), FOOT,
      ],
    },
    {
      id: 'B', name: 'Karten', direction: 'visuell',
      concept: 'Jede Beobachtung als Karte mit Verlauf, Kurs und Veränderung. Darüber Gewinner und Verlierer des Tages als Balken.',
      description: '+ Bewegung auf einen Blick, gut auf dem Handy  − Weniger Papiere pro Bildschirm, kein Sortieren per Spalte',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Beobachtet', subtitle: 'Simulation · Kurse fiktiv' }),
        SIM(), blk('mv', 'trd-movers', 'main', { style: 'bars', limit: 6, title: 'Heute in Bewegung' }, { span: 12 }),
        blk('wl', 'trd-watchlist', 'main', { style: 'cards' }, { span: 12 }),
        KURS(), FOOT,
      ],
    },
  ],
  selectedVariantId: 'A', links: ['trading.detail', 'trading.alerts'],
};

// ============================================================ Depot
const portfolio = {
  id: 'trading.portfolio', name: 'Depot', group: 'Portfolio', status: 'review', tier: 1, usage: 'täglich',
  purpose: 'Den Wert des Depots, Gewinn und Verlust und die Aufteilung erfassen und einzelne Positionen prüfen. Anzeige und Simulation, keine Anlageberatung.',
  requirements: [
    { text: 'Depotwert (Positionen plus Verrechnungskonto), Tagesveränderung und Gesamtgewinn seit Kauf prominent; Summe stimmt mit Finanzen überein', type: 'info', priority: 'must' },
    { text: 'Positionen mit Stück, Kurs, Wert, Tagesveränderung, Gewinn/Verlust (€ und %) und Anteil; sortierbar; Sparplan-Bezug sichtbar', type: 'info', priority: 'must' },
    { text: 'Aufteilung nach Anlageklasse (und Baustein, Region, Sektor in „Aufteilung Soll und Ist“)', type: 'info', priority: 'must' },
    { text: 'Depotverlauf der letzten zwölf Monate mit Einzahlungen als Vergleichslinie', type: 'info', priority: 'should' },
    { text: 'Antippen einer Position öffnet das Wertpapier, „Order“ in der Zeile bereitet ein Ticket (Simulation) vor', type: 'action', priority: 'must' },
    { text: 'Leeres Depot zeigt Einstiegshinweis statt Nullwerten', type: 'state', priority: 'must' },
    R_LEGAL, R_PRIVACY, R_SIGN,
  ],
  interactions: [
    { trigger: 'Position antippen', result: 'Wertpapier mit Kursverlauf', event: 'position.open', to: 'trading.detail' },
    { trigger: 'Order-Symbol in der Zeile', result: 'Order-Ticket mit dem Wertpapier', event: 'position.trade', to: 'trading.order' },
    { trigger: '„Order (Simulation)“ im Kopf', result: 'Order-Ticket öffnet sich', event: 'order.new', to: 'trading.order' },
    { trigger: 'Spaltenkopf antippen', result: 'Sortierung wechselt', event: 'positions.sort' },
    { trigger: 'Aufteilung umschalten', result: 'Baustein, Klasse, Region oder Sektor', event: 'alloc.view' },
    { trigger: 'Zurück, Weiter oder Chip', result: 'Die Karte zeigt die gewählte Position', event: 'position.focus' },
  ],
  acceptance: [
    'Der Depotwert (30.097,70 €) ist die Summe aus Positionen (28.847,70 €) und Verrechnungskonto (1.250,00 €) und stimmt mit dem Depot-Konto in Finanzen überein.',
    'Sortieren nach „Gewinn/Verlust“ ordnet die Positionen nach dem Prozentwert; die Summenzeile bleibt unten.',
    'Mit Privatmodus zeigt die Seite keinen Betrag, Kurse bleiben sichtbar.',
    'Ein Tipp auf eine Position öffnet im Launcher das Wertpapier-Detail mit dem gewählten Papier.',
  ],
  flows: [{ id: 'fl-depot', name: 'Position prüfen', steps: [{ featureId: 'trading.portfolio', action: 'Nach Gewinn sortieren, Position antippen' }, { featureId: 'trading.detail', action: 'Einstand und Sparplan ansehen' }] }],
  viewports: ALL_VP, demoData: demo(),
  variants: [
    {
      id: 'A', name: 'Cockpit', direction: 'kompakt',
      concept: 'Depot-Streifen mit allen Summen, darunter die sortierbare Positionstabelle mit Order-Symbol in der Zeile, daneben die Aufteilung nach Klasse und der Verlauf.',
      description: '+ Alles gleichzeitig, sortierbar, Zahlen exakt  − Auf dem Handy eine lange Seite',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Depot', subtitle: 'Simulation · Kurse fiktiv', primaryLabel: 'Order (Simulation)', primaryIcon: 'trending-up', primaryEvent: 'order.new' }),
        SIM(), blk('hero', 'trd-depot-hero', 'main', { style: 'strip', interactive: false }),
        blk('pos', 'trd-positions', 'main', { style: 'table' }),
        blk('al', 'trd-allocation', 'aside', { style: 'bars', by: 'class', title: 'Aufteilung' }),
        blk('perf', 'trd-performance', 'aside', { part: 'chart', title: 'Verlauf' }),
        KURS('aside'), FOOT,
      ],
    },
    {
      id: 'B', name: 'Wert und Aufteilung', direction: 'visuell',
      concept: 'Großer Depotwert mit Verlaufsfläche, Aufteilung als gestapelter Balken, Positionen als Karten mit Mini-Verlauf und Anteil.',
      description: '+ Entwicklung und Verteilung sofort verständlich, gut auf dem Handy  − Weniger Positionen pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Dein Depot', subtitle: 'Simulation · Kurse fiktiv', primaryLabel: 'Order (Simulation)', primaryIcon: 'trending-up', primaryEvent: 'order.new' }),
        SIM(), blk('hero', 'trd-depot-hero', 'main', { style: 'hero', interactive: false }),
        blk('al', 'trd-allocation', 'main', { style: 'bars', by: 'class', title: 'Aufteilung nach Klasse' }),
        blk('pos', 'trd-positions', 'main', { style: 'cards' }),
        KURS(), FOOT,
      ],
    },
    {
      id: 'C', name: 'Position für Position', direction: 'fokus',
      concept: 'Eine schlanke Depot-Zeile (Wert, Tag, gesamt), darunter eine große Karte für eine einzelne Position mit zwei klaren Aktionen (Wertpapier ansehen, Order simulieren). Blättern über Zurück/Weiter oder Chips, die größte Tagesbewegung steht zuerst. Dazu höchstens zwei Hinweise.',
      description: '+ Eine Position nach der anderen, wenig Ablenkung, Aktionen direkt erreichbar  − Kein Vergleich aller Positionen und keine Aufteilung auf einen Blick',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Depot', subtitle: 'Simulation · Kurse fiktiv' }),
        SIM(), blk('hero', 'trd-depot-hero', 'main', { style: 'focus', interactive: false }),
        blk('pf', 'trd-position-focus', 'main', { title: 'Positionen' }),
        blk('hints', 'trd-hints', 'main', { title: 'Wichtig', limit: 2 }),
        KURS(), FOOT,
      ],
    },
  ],
  selectedVariantId: 'A', links: ['trading.detail', 'trading.performance', 'trading.order'],
};

// ============================================================ Wertpapier
const detail = {
  id: 'trading.detail', name: 'Wertpapier', group: 'Märkte', status: 'review', tier: 2, usage: 'täglich',
  purpose: 'Ein Wertpapier genau ansehen: Kursverlauf in mehreren Zeiträumen, Kennzahlen, die eigene Position mit Sparplan-Bezug und der direkte Weg zur simulierten Order oder zum Kursalarm.',
  requirements: [
    { text: 'Kursdiagramm als Fläche oder Kerzen mit Zeiträumen Heute, 1W, 1M, 1J, 5J; Crosshair mit Datum und Kurs per Maus, Touch und Pfeiltasten', type: 'info', priority: 'must' },
    { text: 'Kennzahlen: Tageshoch und -tief, Spanne 52 Wochen mit Lage des Kurses, Wertentwicklung je Zeitraum, bei ETFs Kosten und Ausschüttung', type: 'info', priority: 'must' },
    { text: 'Eigene Position: Stück, Ø-Einstand, Wert, Gewinn/Verlust, Anteil am Depot; Ø-Einstand als Linie im Diagramm', type: 'info', priority: 'must' },
    { text: 'Sparplan-Bezug: Rate, nächste Ausführung und Weg zum Sparplan-Detail (nur wenn ein Plan besteht)', type: 'info', priority: 'should' },
    { text: 'Aktionen: Kauf simulieren und Verkauf simulieren, Alarm anlegen, Beobachten ein/aus', type: 'action', priority: 'must' },
    { text: 'Krypto: Hinweis „Hochspekulativ, Totalverlust möglich“ am Kopf', type: 'rule', priority: 'must' },
    { text: 'Ohne Kursdaten zeigt das Diagramm einen Leerzustand', type: 'state', priority: 'must' },
    R_LEGAL, R_PRIVACY,
  ],
  interactions: [
    { trigger: '„Kauf simulieren“ oder „Verkauf simulieren“', result: 'Order-Ticket mit dem Wertpapier und der Richtung', event: 'order.new', to: 'trading.order' },
    { trigger: '„Alarm“ antippen', result: 'Kursalarme mit dem Wertpapier', event: 'alert.new', to: 'trading.alerts' },
    { trigger: 'Sparplan in „Meine Position“', result: 'Sparplan-Detail im Modul Sparpläne', event: 'plan.open', to: 'savings.plan' },
    { trigger: 'Zeitraum wechseln', result: 'Diagramm zeigt den Zeitraum', event: 'chart.range' },
    { trigger: 'Darstellung wechseln', result: 'Fläche oder Kerzen', event: 'chart.type' },
    { trigger: 'Diagramm antippen', result: 'Punkt wird fixiert, Kurs und Datum erscheinen', event: 'chart.point' },
    { trigger: '„Beobachten“ antippen', result: 'Wertpapier steht auf der Watchlist oder wird entfernt', event: 'watch.add' },
  ],
  acceptance: [
    'Mit Pfeiltasten lässt sich im Diagramm ein Punkt wählen; die Zeile darüber nennt Datum, Kurs und Veränderung.',
    'Für All-World zeigt „Meine Position“ 152,31 Stück, Ø-Einstand 96,10 € und den Sparplan über 300 € mit nächster Ausführung am 01.12.',
    'Für ein Wertpapier ohne Bestand ist „Verkauf simulieren“ deaktiviert und „Meine Position“ lädt zur simulierten Order ein.',
    '„Kauf simulieren“ öffnet das Ticket mit dem Papier und der Richtung Kauf.',
  ],
  flows: [{ id: 'fl-detail', name: 'Vom Papier zur simulierten Order', steps: [{ featureId: 'trading.detail', action: 'Zeitraum 1J, Kennzahlen lesen' }, { featureId: 'trading.order', action: '„Kauf simulieren“, Stückzahl 5, prüfen' }] }],
  viewports: ALL_VP, demoData: demo(['1T', '1W', '1M', '1J', '5J']),
  variants: [
    {
      id: 'A', name: 'Analyse mit Seitenspalte', direction: 'kompakt',
      concept: 'Kopf mit Kurs und Aktionen, großes Kursdiagramm und Kennzahlen im Hauptbereich; in der Seitenspalte die eigene Position mit Sparplan-Bezug und die Alarme dieses Wertpapiers.',
      description: '+ Analyse und Aktion zusammen, Position immer im Blick  − Seitenspalte rutscht auf dem Handy unter den Inhalt',
      layout: { type: 'split' },
      blocks: [
        SIM('header'), blk('head', 'trd-security-head', 'main'),
        blk('chart', 'price-chart', 'main', { type: 'area', initialRange: '1M', height: 300, showHeader: false }),
        blk('facts', 'trd-facts', 'main'),
        blk('hold', 'trd-holding', 'aside'),
        blk('al', 'trd-alerts', 'aside', { style: 'list', scope: 'selected', showForm: false, title: 'Alarme für dieses Papier' }),
        KURS('aside'), FOOT,
      ],
    },
    {
      id: 'B', name: 'Chart zuerst', direction: 'visuell',
      concept: 'Großes Kursdiagramm mit Kerzen als Standard über die volle Breite, darunter die eigene Position und die Kennzahlen als zwei Karten.',
      description: '+ Verlauf steht im Mittelpunkt, ruhige Gliederung  − Alarme nicht direkt sichtbar',
      layout: { type: 'grid' },
      blocks: [
        SIM('main'), blk('head', 'trd-security-head', 'main', {}, { span: 12 }),
        blk('chart', 'price-chart', 'main', { type: 'candles', initialRange: '1M', height: 340, showHeader: false }, { span: 12 }),
        blk('hold', 'trd-holding', 'main', {}, { span: 5 }), blk('facts', 'trd-facts', 'main', {}, { span: 7 }),
        KURS('main'), FOOT,
      ],
    },
  ],
  selectedVariantId: 'A', links: ['trading.order', 'trading.alerts', 'savings.plan'],
};

// ============================================================ Order (Simulation)
const order = {
  id: 'trading.order', name: 'Order (Simulation)', group: 'Orders', status: 'review', tier: 1, usage: 'wöchentlich',
  purpose: 'Eine Kauf- oder Verkaufsorder durchspielen: Markt, Limit oder Stop, mit Kostenvorschau, Plausibilitätsprüfung und Bestätigung. Es wird nichts an einen Broker gesendet, das Depot bleibt unverändert.',
  requirements: [
    { text: 'Kauf oder Verkauf wählen, Wertpapier, Stückzahl und Ordertyp (Markt, Limit, Stop) mit Gültigkeit (Tag, 30 Tage) erfassen', type: 'action', priority: 'must' },
    { text: 'Kostenvorschau live: Kurs, Wert, Gebühr (Annahme mit Stand), Gesamtkosten oder Erlös; beim Verkauf realisierter Gewinn und Steuer-Orientierung; Wirkung auf Guthaben und Anteil', type: 'info', priority: 'must' },
    { text: 'Prüfung: Stückzahl größer 0, erlaubte Nachkommastellen, Verkauf nur bis Bestand, Kauf nur bis Guthaben, Limit und Stop sinnvoll zum Kurs', type: 'rule', priority: 'must' },
    { text: 'Plausibilitätsschutz: Limit weit vom Kurs, Order größer als ein Viertel des Depots, Stop weit entfernt verlangen „Eingabe geprüft“; Hinweise zu Börsenzeiten und doppelten Orders', type: 'rule', priority: 'must' },
    { text: 'Bestätigung vor dem Vormerken; Simulation durchgängig gekennzeichnet (Banner nicht wegklickbar, Badge, Dialog)', type: 'rule', priority: 'must' },
    { text: 'Vorgemerkte Orders erscheinen sofort in der Orderliste, offene lassen sich stornieren und wiederherstellen', type: 'state', priority: 'should' },
    { text: 'Drei Bedienkonzepte: Ticket, vier Schritte, Schnell-Sheet', type: 'info', priority: 'should' },
    R_LEGAL, R_PRIVACY,
  ],
  interactions: [
    { trigger: 'Richtung oder Ordertyp wechseln', result: 'Felder und Kostenvorschau passen sich an', event: 'order.side' },
    { trigger: '„Order prüfen“ / „Weiter“', result: 'Prüfung; bei Erfolg Bestätigung oder nächster Schritt', event: 'order.review' },
    { trigger: 'Ungültige Eingabe', result: 'Fehlermeldung unter dem Feld', event: 'order.invalid' },
    { trigger: '„Order simulieren“', result: 'Order erscheint in der Liste, Toast, Depot unverändert', event: 'order.confirm' },
    { trigger: 'Abbrechen im Dialog', result: 'Dialog schließt, Eingaben bleiben', event: 'order.cancel' },
    { trigger: '„Zum Wertpapier“ nach dem Vormerken', result: 'Wertpapier mit Kursverlauf', event: 'order.done', to: 'trading.detail' },
    { trigger: 'Order in der Liste antippen', result: 'Wertpapier mit Kursverlauf', event: 'order.open', to: 'trading.detail' },
    { trigger: 'Stornieren / Wiederherstellen', result: 'Status der offenen Order wechselt', event: 'order.storno' },
  ],
  acceptance: [
    'Verkauf von 200 Stück All-World ergibt „Im Depot sind nur 152,31 Stück“; „Alles“ trägt den Bestand ein.',
    'Ein Kauf von 5 Stück All-World zeigt Gesamtkosten 593,10 € (592,10 € plus 1,00 € Gebühr); das Guthaben danach beträgt 656,90 €.',
    'Ein Limit 20 % über dem Kurs verlangt „Ich habe die Eingabe geprüft“, bevor die Bestätigung öffnet.',
    'Nach „Order simulieren“ erscheint die Order oben in der Liste, das Depot bleibt unverändert.',
    'Banner „Simulation“ ist in allen drei Bedienkonzepten sichtbar und nicht wegklickbar.',
  ],
  flows: [{ id: 'fl-order', name: 'Order durchspielen', steps: [{ featureId: 'trading.order', action: 'Wertpapier wählen, 5 Stück, Markt' }, { featureId: 'trading.order', action: 'Kostenvorschau prüfen, „Order prüfen“' }, { featureId: 'trading.order', action: '„Order simulieren“, Order in der Liste' }] }],
  viewports: ALL_VP, demoData: demo(),
  variants: [
    {
      id: 'A', name: 'Ticket und Orderliste', direction: 'kompakt',
      concept: 'Ein Formular mit allen Feldern und lebender Kostenvorschau links, rechts die simulierten Orders mit Stornieren.',
      description: '+ Schnell für Geübte, alles sichtbar  − Viele Felder auf einmal',
      layout: { type: 'split', even: true },
      blocks: [hdr({ title: 'Order (Simulation)', subtitle: 'Es wird nichts ausgeführt' }), SIM(), blk('ticket', 'order-ticket', 'main', { mode: 'ticket', showNote: false }), blk('ms', 'trd-market-status', 'aside', { compact: true }), blk('list', 'trd-order-list', 'aside'), KURS('aside'), FOOT],
    },
    {
      id: 'B', name: 'Vier Schritte', direction: 'visuell',
      concept: 'Geführt in drei Schritten plus Ergebnis: Wertpapier und Richtung, Menge und Ordertyp, Prüfen mit Kostenvorschau; danach eine ruhige Bestätigung.',
      description: '+ Übersichtlich für Einsteiger, ein Gedanke pro Schritt  − Mehr Taps',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Order (Simulation)', subtitle: 'Schritt für Schritt' }), SIM(), blk('ticket', 'order-ticket', 'main', { mode: 'steps', title: 'Neue Order' }), blk('list', 'trd-order-list', 'main', { limit: 3 }), KURS(), FOOT],
    },
    {
      id: 'C', name: 'Schnell-Sheet', direction: 'fokus',
      concept: 'Ein Wertpapier, Kauf oder Verkauf, Stückzahl mit Plus und Minus, Summe groß darunter, eine Taste „Order simulieren“. Für die Order „nach der Karte“ in wenigen Taps.',
      description: '+ In unter fünf Taps erledigt, Summe immer sichtbar  − Nur Marktorder, Limit und Stop im Ticket',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Schnell-Order', subtitle: 'Simulation' }), SIM(), blk('ticket', 'order-ticket', 'main', { mode: 'quick', title: 'Marktorder', showNote: false }), blk('list', 'trd-order-list', 'main', { limit: 2, title: 'Zuletzt' }), KURS(), FOOT],
    },
  ],
  selectedVariantId: 'A', links: ['trading.detail', 'trading.history'],
  seedHistory: [{ kind: 'draft', note: 'Ticket 2.0 mit Markt, Limit, Stop und Plausibilitätsschutz' }, { kind: 'review' }],
};

// ============================================================ Kursalarme
const alerts = {
  id: 'trading.alerts', name: 'Kursalarme', group: 'Märkte', status: 'design', tier: 2, usage: 'wöchentlich',
  purpose: 'Informiert werden, wenn ein Wertpapier eine Kursmarke über- oder unterschreitet. Alarme anlegen, pausieren, löschen und sehen, wie weit der Kurs noch entfernt ist.',
  requirements: [
    { text: 'Alarm je Wertpapier mit Richtung (über, unter) und Kursmarke; Abstand zum aktuellen Kurs in Prozent', type: 'action', priority: 'must' },
    { text: 'Prüfung beim Anlegen: Marke auf der richtigen Seite des Kurses, größer 0, keine Dublette', type: 'rule', priority: 'must' },
    { text: 'Liste aktiver (mit „nah“ ab höchstens 3 %), pausierter und ausgelöster Alarme mit Zeitpunkt', type: 'info', priority: 'must' },
    { text: 'Pausieren, fortsetzen und löschen mit Rückgängig', type: 'action', priority: 'should' },
    { text: 'Benachrichtigung per Push und im TAKT-Verlauf (im Entwurf nur beschrieben, nicht aktiv)', type: 'info', priority: 'could' },
    R_LEGAL, STATES,
  ],
  interactions: [
    { trigger: '„Alarm anlegen“', result: 'Alarm erscheint oben in der Liste, Toast', event: 'alert.create' },
    { trigger: 'Marke auf der falschen Seite', result: 'Fehlermeldung unter dem Feld', event: 'alert.invalid' },
    { trigger: 'Pause oder Fortsetzen in der Zeile', result: 'Status wechselt', event: 'alert.toggle' },
    { trigger: 'Papierkorb in der Zeile', result: 'Alarm gelöscht, Rückgängig erscheint', event: 'alert.delete' },
    { trigger: 'Alarm antippen', result: 'Wertpapier mit Kursverlauf', event: 'alert.open', to: 'trading.detail' },
  ],
  acceptance: [
    'Ein Alarm „unter 130 €“ für Nvidia (Kurs 128,30 €) wird abgelehnt: „Der Kurs liegt bereits bei 128,30 €“.',
    'Der Alarm für MSCI World über 100 € trägt „nah“ (1,6 % Abstand).',
    'Gelöschte Alarme lassen sich über „Rückgängig“ wiederherstellen.',
    'Kommt man über „Alarm“ aus der Watchlist oder dem Wertpapier, ist das Papier im Formular vorgewählt.',
  ],
  flows: [{ id: 'fl-al', name: 'Alarm anlegen', steps: [{ featureId: 'trading.detail', action: '„Alarm“ antippen' }, { featureId: 'trading.alerts', action: 'Richtung und Marke eintragen, anlegen' }] }],
  viewports: ALL_VP, demoData: demo(),
  variants: [
    {
      id: 'A', name: 'Liste und Formular', direction: 'kompakt',
      concept: 'Aktive und ausgelöste Alarme als Liste mit Aktionen in der Zeile, darunter das Formular. Seitenspalte mit Hinweisen und Marktstatus.',
      description: '+ Alles in einer Spalte, Aktionen direkt in der Zeile  − Formular unter der Liste',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Kursalarme', subtitle: 'Simulation · Kurse fiktiv' }), blk('al', 'trd-alerts', 'main', { style: 'list' }), blk('ms', 'trd-market-status', 'aside', { compact: true }), blk('hints', 'trd-hints', 'aside', { limit: 3, title: 'Auch wichtig' }), KURS('aside'), FOOT],
    },
    {
      id: 'B', name: 'Abstand im Blick', direction: 'visuell',
      concept: 'Jeder Alarm als Karte mit Abstandsbalken zur Marke. Formular als eigene Karte daneben.',
      description: '+ Nähe zur Marke sofort sichtbar  − Weniger Alarme pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Kursalarme', subtitle: 'Wie weit ist der Kurs noch entfernt?' }), blk('al', 'trd-alerts', 'main', { style: 'cards' }), KURS(), FOOT],
    },
  ],
  selectedVariantId: 'A', links: ['trading.detail', 'trading.watchlist'],
};

// ============================================================ Dividenden
const dividends = {
  id: 'trading.dividends', name: 'Dividenden', group: 'Auswertung', status: 'design', tier: 2, usage: 'monatlich',
  purpose: 'Wann kommen welche Dividenden? Zahlungskalender über zwölf Monate, erhaltene und erwartete Zahlungen, Prognose mit Annahme und Steuer-Orientierung mit Freistellungsauftrag.',
  requirements: [
    { text: 'Kalender über zwölf Monate mit Summe je Monat; Prognose schraffiert und als Annahme („gleichbleibende Ausschüttung“) benannt', type: 'info', priority: 'must' },
    { text: 'Kennzahlen: nächste zwölf Monate, erhalten 2026, nächste Zahlung', type: 'info', priority: 'must' },
    { text: 'Kommende Zahlungen mit Datum, relativer Angabe, Dividende je Aktie mal Stück und Status (Erhalten, Erwartet, Prognose)', type: 'info', priority: 'must' },
    { text: 'Steuer-Orientierung inline: voraussichtlich steuerfrei, solange der Freistellungsauftrag reicht; ohne Quellensteuer; Annahmen mit Stand', type: 'rule', priority: 'must' },
    { text: 'Thesaurierende ETFs zahlen nichts aus; Leerzustand erklärt das', type: 'state', priority: 'should' },
    { text: 'Hinweise „Steuer“ und „Kursdaten“ inline (docs/FINANCE_GUIDELINES.md 2.3)', type: 'rule', priority: 'must' },
    R_PRIVACY,
  ],
  interactions: [
    { trigger: 'Zahlung antippen', result: 'Wertpapier mit Kursverlauf', event: 'dividend.open', to: 'trading.detail' },
    { trigger: 'Monat im Kalender antippen', result: 'Zahlungen des Monats klappen auf', event: 'dividend.month' },
    { trigger: '„Steuer-Orientierung“ antippen', result: 'Freibetrag und Steuern', event: 'tax.open', to: 'trading.tax' },
  ],
  acceptance: [
    'Die Prognose der nächsten zwölf Monate beträgt 100,08 € (Allianz 92,40 €, Apple 4 × 1,92 €) und ist als Annahme benannt.',
    'Im Mai 2027 liegen zwei Zahlungen (Allianz und Apple-Prognose), der Balken ist vorhanden und antippbar.',
    'Die Steuer-Zeile nennt den noch freien Betrag (687,60 €) und „ohne Quellensteuer, keine Steuerberatung“.',
  ],
  flows: [{ id: 'fl-div', name: 'Dividenden prüfen', steps: [{ featureId: 'trading.dividends', action: 'Mai im Kalender antippen' }, { featureId: 'trading.tax', action: '„Steuer-Orientierung“ antippen' }] }],
  viewports: ALL_VP, demoData: demo(),
  variants: [
    {
      id: 'A', name: 'Liste', direction: 'kompakt',
      concept: 'Kennzahlen, kommende Zahlungen und erhaltene Zahlungen als Liste, Steuer-Orientierung als Zeile darunter.',
      description: '+ Dicht und exakt  − Der Jahresverlauf ist nicht sichtbar',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Dividenden', subtitle: 'Prognose als Annahme' }), blk('dv', 'trd-dividends', 'main', { style: 'list' }), KURS(), STEUER(), FOOT],
    },
    {
      id: 'B', name: 'Kalender', direction: 'visuell',
      concept: 'Zwölf Monatsbalken als Kalender, Monat antippen zeigt die Zahlungen; Prognose schraffiert. Darunter die kommenden Zahlungen.',
      description: '+ Jahresrhythmus sofort sichtbar  − Kleine Beträge fallen neben großen kaum auf',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Dividenden-Kalender', subtitle: 'Nächste zwölf Monate' }), blk('dv', 'trd-dividends', 'main', { style: 'calendar' }), KURS(), STEUER(), FOOT],
    },
  ],
  selectedVariantId: 'B', links: ['trading.tax', 'trading.detail'],
};

// ============================================================ Transaktionen
const history = {
  id: 'trading.history', name: 'Transaktionen', group: 'Auswertung', status: 'design', tier: 3, usage: 'selten',
  purpose: 'Nachvollziehen, was im Depot passiert ist: Käufe, Verkäufe, Sparplan-Ausführungen, Dividenden und simulierte Orders, nach Monat gruppiert, mit CSV-Ausgabe.',
  requirements: [
    { text: 'Chronologisch nach Monat gruppiert mit Monatssumme; Filter (Käufe, Verkäufe, Sparplan, Dividenden, Simulation) und Suche', type: 'info', priority: 'must' },
    { text: 'Kennzahlen: realisierter Gewinn des Jahres, erhaltene Dividenden, per Sparplan investiert', type: 'info', priority: 'should' },
    { text: 'Detail je Eintrag: Datum, Stück, Kurs, Gebühr, Betrag; bei Verkäufen realisierter Gewinn und Steuer-Orientierung', type: 'info', priority: 'should' },
    { text: 'Simulierte Orders sind als „Simulation“ gekennzeichnet und nie mit gebuchten Bewegungen verwechselbar', type: 'rule', priority: 'must' },
    { text: 'CSV-Ausgabe für die Steuer (Demo)', type: 'action', priority: 'could' },
    R_LEGAL, R_PRIVACY,
  ],
  interactions: [
    { trigger: 'Eintrag antippen', result: 'Detail mit Gebühr, Gewinn und Steuer-Orientierung', event: 'history.open' },
    { trigger: 'Filter wählen', result: 'Nur die gewählte Art sichtbar', event: 'history.filter' },
    { trigger: '„CSV“ antippen', result: 'Datei mit den sichtbaren Zeilen (Demo)', event: 'history.export' },
    { trigger: '„Wertpapier öffnen“ im Detail', result: 'Wertpapier mit Kursverlauf', event: 'security.open', to: 'trading.detail' },
  ],
  acceptance: [
    'Der Verkauf von 5 SAP im August zeigt einen realisierten Gewinn von 284,50 € nach Gebühr und eine Steuer-Schätzung.',
    'Sparplan-Ausführungen der letzten Monate stehen mit Stück und Kurs, die vom November stammen aus den Umbuchungen in Finanzen.',
    'Der Filter „Simulation“ zeigt nur simulierte Orders.',
  ],
  flows: [{ id: 'fl-hist', name: 'Verkauf nachvollziehen', steps: [{ featureId: 'trading.history', action: 'Filter „Verkäufe“, Eintrag antippen' }] }],
  viewports: ['desktop', 'tablet', 'mobile'], demoData: demo(['1M', '1J']),
  variants: [{
    id: 'A', name: 'Monatsliste', direction: 'kompakt',
    concept: 'Kennzahlen oben, Filter und Suche, darunter alle Bewegungen nach Monat mit Summe.',
    description: '+ Vollständig und filterbar  − Keine Grafik',
    layout: { type: 'stack' },
    blocks: [hdr({ title: 'Transaktionen', subtitle: 'Seit Juni 2026 · Auszug' }), blk('hs', 'trd-history', 'main'), KURS(), blk('l-sim', 'legal-notice', 'main', { kind: 'simulation', style: 'inline' }), FOOT],
  }],
  selectedVariantId: 'A', links: ['trading.detail', 'trading.order'],
};

// ============================================================ Performance & Aufteilung
const performance = {
  id: 'trading.performance', name: 'Performance & Aufteilung', group: 'Auswertung', status: 'design', tier: 3, usage: 'monatlich',
  purpose: 'Wie hat sich das Depot entwickelt und wie weit liegt die Aufteilung von den eigenen Zielwerten? Vergleich mit einem fiktiven Index (gleiche Einzahlungen), Rendite und Soll/Ist.',
  requirements: [
    { text: 'Verlauf Depot gegen Vergleichsindex mit denselben Einzahlungen, wahlweise in Euro oder Rendite in Prozent; Hover, Touch und Pfeiltasten', type: 'info', priority: 'must' },
    { text: 'Kennzahlen: Gewinn seit Kauf, Wertzuwachs 12 Monate, Abstand zum Index in Prozentpunkten, Dividenden, realisierte Gewinne, Rendite pro Jahr der Einzelaktien (vereinfacht)', type: 'info', priority: 'must' },
    { text: 'Soll/Ist-Aufteilung nach Baustein, Klasse, Region und Sektor; Zielwerte anpassen (Summe 100 %), Abweichung in Prozentpunkten mit Toleranzband', type: 'action', priority: 'must' },
    { text: 'Abweichungen sind rechnerisch benannt, nie als Handlungsempfehlung formuliert', type: 'rule', priority: 'must' },
    { text: 'Modellrechnung inline: Index fiktiv, ohne Kosten und Steuern; Vergangenheit ist kein verlässlicher Indikator', type: 'rule', priority: 'must' },
    R_LEGAL, R_PRIVACY,
  ],
  interactions: [
    { trigger: 'Darstellung wechseln (Euro, Prozent)', result: 'Diagramm zeigt Wert oder Rendite', event: 'perf.mode' },
    { trigger: 'Aufteilung umschalten', result: 'Baustein, Klasse, Region oder Sektor', event: 'alloc.view' },
    { trigger: '„Ziele anpassen“', result: 'Dialog mit Soll-Anteilen, Summe 100 %', event: 'alloc.edit' },
    { trigger: 'Ziele speichern', result: 'Abweichungen berechnen sich neu', event: 'alloc.save' },
  ],
  acceptance: [
    'Die Zielwerte lassen sich nur mit der Summe 100 % speichern; die Summe wird live angezeigt.',
    'Der Vergleichsindex nennt ausdrücklich „fiktiv“ und „mit denselben Einzahlungen“.',
    'Abweichungen größer als die Toleranz (2 PP) sind mit Pfeil und Betrag markiert, sonst „im Toleranzband“.',
  ],
  flows: [{ id: 'fl-soll', name: 'Zielwerte setzen', steps: [{ featureId: 'trading.performance', action: '„Ziele anpassen“, Tech-ETF auf 8 %' }, { featureId: 'trading.performance', action: 'Abweichungen prüfen' }] }],
  viewports: ALL_VP, demoData: demo(),
  variants: [
    {
      id: 'A', name: 'Zahlen und Soll/Ist', direction: 'kompakt',
      concept: 'Kennzahlen und Rendite pro Jahr als Zahlenblock, darunter die Soll/Ist-Tabelle mit Abweichung in Prozentpunkten.',
      description: '+ Exakt, Zielwerte im Blick  − Kein Verlauf im Hauptbereich',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Performance und Aufteilung', subtitle: 'Modellrechnung auf Demo-Daten' }), blk('kpi', 'trd-performance', 'main', { part: 'kpis', title: 'Kennzahlen' }), blk('al', 'trd-allocation', 'main', { style: 'table', by: 'position' }), blk('chart', 'trd-performance', 'aside', { part: 'chart', title: 'Verlauf' }), MODELL('aside'), KURS('aside'), FOOT],
    },
    {
      id: 'B', name: 'Verlauf und Aufteilung', direction: 'visuell',
      concept: 'Großer Verlauf Depot gegen Index mit Rendite-Umschalter, darunter die Aufteilung als Balken Ist gegen Soll.',
      description: '+ Entwicklung und Verteilung auf einen Blick  − Zielwerte erst über „Ziele anpassen“',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Wie läuft das Depot?', subtitle: 'Modellrechnung auf Demo-Daten' }), blk('perf', 'trd-performance', 'main', { part: 'both' }), blk('al', 'trd-allocation', 'main', { style: 'bars', by: 'class' }), MODELL(), KURS(), FOOT],
    },
  ],
  selectedVariantId: 'B', links: ['trading.portfolio'],
};

// ============================================================ Steuer-Orientierung
const tax = {
  id: 'trading.tax', name: 'Steuer-Orientierung', group: 'Auswertung', status: 'analyzed', tier: 2, usage: 'jährlich',
  purpose: 'Freistellungsauftrag und Sparer-Pauschbetrag im Blick behalten und für einen Verkauf eine Steuer-Schätzung sehen. Orientierung mit Annahmen und Stand, keine Steuerberatung.',
  requirements: [
    { text: 'Sparer-Pauschbetrag und Freistellungsauftrag mit Auslastung; Teilfreistellung Aktienfonds; Beispielrechnung je Position „wenn verkauft würde“', type: 'info', priority: 'must' },
    { text: 'Annahmen kommen aus dem Rechenkern mit Stand (01/2026) und sind vor Veröffentlichung zu prüfen', type: 'rule', priority: 'must' },
    { text: 'Hinweis „Steuer“ inline, „keine Anlageberatung“ im Fuß', type: 'rule', priority: 'must' },
  ],
  interactions: [{ trigger: 'Position in der Schätzung antippen', result: 'Wertpapier mit Kursverlauf', event: 'position.open', to: 'trading.detail' }],
  viewports: ['desktop', 'tablet', 'mobile'], demoData: demo(),
  variants: [{
    id: 'A', name: 'Freibetrag und Schätzung', direction: 'kompakt',
    concept: 'Die Komponente „Freibetrag und Steuern“ aus Sparpläne mit denselben Daten (Freistellungsauftrag, Sparpläne, Positionen).',
    description: '+ Eine Quelle für Annahmen  − Ohne Bezug zu simulierten Verkäufen',
    layout: { type: 'stack' },
    blocks: [hdr({ title: 'Steuer-Orientierung', subtitle: 'Annahmen Stand 01/2026' }), blk('tax', 'tax-allowance', 'main'), STEUER(), FOOT],
  }],
  selectedVariantId: 'A', links: ['trading.dividends'],
};

export default {
  module: {
    id: 'trading', name: 'Trading', icon: 'candlestick-chart', area: 'Finanzen', status: 'active', theme: 'graphite', designVersion: '0.3', isReference: false,
    legal: ['simulation', 'keine-beratung', 'kursdaten'], // Pflichthinweise in jeder Variante (npm run check, QA-Sonde legal-present)
    description: 'Depot, Watchlist, Wertpapiere, simulierte Orders, Kursalarme, Dividenden und Auswertung: Märkte beobachten und das eigene Depot verstehen, ohne echte Orderausführung.',
    source: 'Auftrag 2026-11 (Ausbau Trading), Leitplanken docs/FINANCE_GUIDELINES.md. Referenz: in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Übersicht (Depotwert, Bewegungen, Watchlist, Termine, Alarme) → Depot (Positionen, Aufteilung) → Wertpapier (Verlauf, Kennzahlen, Position, Sparplan) → Order (Simulation) mit Orderliste; Märkte: Watchlist, Kursalarme; Auswertung: Dividenden, Transaktionen, Performance und Aufteilung, Steuer-Orientierung. Die Auswahl eines Papiers steuert Diagramm, Position, Alarm und Ticket.',
    docs: [
      '## Grundsätze',
      '- Alles ist Simulation und Anzeige: Kurse fiktiv, keine Orderausführung, keine Anlageberatung. Hinweise über `legal-notice` (Simulation als Banner, Kursdaten inline, keine Beratung im Fuß) in jeder Variante.',
      '- Der Depotwert kommt aus der Welt (positions plus depotCash) und ist in Finanzen, Sparpläne und Trading identisch. Simulierte Orders verändern das Depot nicht.',
      '- Rechnen nur über core/finmath.js: Rendite (positionReturn, cagr), Steuer-Orientierung (estimateTax), Sparplan-Termine (nextExecutions). Annahmen tragen ein Stand-Datum.',
      '- Öffentliche Kurse bleiben im Privatmodus sichtbar (Marktdaten), alle Beträge des Depots werden maskiert.',
      '',
      '## Datenwelt',
      '- Gebunden: positions, depotCash, depotHistory, watchlist, dividends, savingsPlans, transactions, accounts, taxAllowance. Hinzufügen und Entfernen in der Watchlist schreibt in die Welt.',
      '- Lokal im Modul (je Screen): Kursverläufe (fiktiv, auf Welt-Kursen verankert), Kursalarme, simulierte Orders, gebuchte Käufe und Verkäufe, Soll-Anteile, Vergleichsindex. Wunsch: Welt-Datei world/trading.js, damit Orders und Alarme über Screens hinweg geteilt werden.',
      '',
      '## Offene Fragen',
      '- Datenquelle und Aktualität der Kurse (Verzögerung, Aktualisierungsrhythmus).',
      '- Papierhandel: Soll eine simulierte Order ein getrenntes Übungsdepot verändern?',
      '- Benachrichtigung bei Alarmen: Push, Verlauf, beides?',
    ].join('\n'),
    links: ['finance', 'savings', 'tasks', 'home'],
    homeFeatureId: 'trading.home',
  },
  features: [home, portfolio, watchlist, detail, order, alerts, dividends, history, performance, tax],
  decisions: [
    { featureId: 'trading.order', title: 'Nur Simulation und Anzeige, keine echte Orderausführung', decision: 'Das Trading-Modul zeigt Kurse und Depot an und bietet ein simuliertes Order-Ticket. Echte Orders an einen Broker werden nicht ausgeführt, simulierte Orders verändern das Depot nicht.', rationale: 'Vermeidet regulatorische Risiken (Anlageberatung, Zulassung) und Haftung bei Fehlbedienung; der Nutzen liegt im Überblick, im Üben und im Plausibilitätsschutz. Das Depot bleibt in allen Modulen identisch.', tradeoffs: 'Weniger Alltagswert als ein echter Broker; eine spätere Anbindung ist ein eigenes Projekt mit Sicherheits- und Rechtsprüfung.', status: 'decided' },
    { featureId: 'trading.order', title: 'Gebühren und Steuerparameter sind Annahmen mit Stand', decision: 'Gebühr 1,00 € je Order (Krypto 1 %), Steuer nach TAX_DE (Stand 01/2026). Jede Anzeige nennt „Annahme“ und das Stand-Datum.', rationale: 'Echte Konditionen hängen vom Broker ab; die Vorschau soll ein Gefühl für Größenordnungen geben, ohne Genauigkeit vorzutäuschen.', tradeoffs: 'Abweichung zur echten Abrechnung möglich; dafür ehrlich benannt.', status: 'decided' },
    { featureId: 'trading.watchlist', title: 'Datenquelle und Aktualität der Kurse', decision: '', rationale: 'Offen: Kostenlose Kursquellen sind oft 15 Minuten verzögert. Zu entscheiden ist, ob die Verzögerung offen im Interface genannt wird und wie oft aktualisiert wird.', tradeoffs: 'Echtzeitdaten sind kostenpflichtig; Polling erhöht den Akkuverbrauch auf dem Handy.', status: 'open' },
    { featureId: 'trading.order', title: 'Soll eine simulierte Order ein Übungsdepot verändern?', decision: '', rationale: 'Heute bleibt das Depot unverändert. Ein getrenntes Übungsdepot (Papierhandel) würde Orders spürbar machen, bräuchte aber eine zweite Welt mit eigenem Bestand und Verlauf.', tradeoffs: 'Mit Übungsdepot: lehrreicher, mehr Aufwand und Verwechslungsgefahr mit dem echten Depot. Ohne: einfach und eindeutig.', status: 'open' },
    { featureId: 'trading.portfolio', title: 'Welche Depot-Variante?', decision: '', rationale: 'A (Cockpit) für Analyse am Laptop, B (Wert und Aufteilung) für das Handy. Möglicherweise nach Richtung automatisch.', tradeoffs: 'Eine Variante ist einfacher zu pflegen, zwei passen besser zu den Geräten.', status: 'open' },
    { featureId: 'trading.alerts', title: 'Wie werden Alarme zugestellt?', decision: '', rationale: 'Push, Eintrag im TAKT-Verlauf oder beides. Push braucht Berechtigung und eine Kursquelle im Hintergrund.', tradeoffs: 'Push ist unmittelbar, aber akkuhungrig und datenschutzrelevant; Verlauf ist ruhiger.', status: 'open' },
    { featureId: 'trading.portfolio', title: 'Depot Position für Position (Fokus) oder als Gesamtbild?', decision: '', rationale: 'C zeigt eine einzelne Position groß mit zwei Aktionen und blättert durch das Depot, geordnet nach der größten Tagesbewegung. Empfehlung: für die Fokus-Version beibehalten, aber die Aufteilung als eine Zeile ergänzen, damit das Gesamtbild nicht ganz fehlt. Die Reihenfolge nach Tagesbewegung ist eine reine Information, keine Empfehlung.', tradeoffs: 'C: ruhig, aktionsnah, aber kein Vergleich. A und B zeigen das Ganze. Je nach Test mit mehr als fünf Positionen kann das Blättern lästig werden.', status: 'open' },
  ],
};
