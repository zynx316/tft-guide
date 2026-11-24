// Modul "Finanzen" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Alle Daten kommen aus der gemeinsamen Finanzwelt (seed/world/finance.js) per '@world:' – Erfassen schreibt Buchungen und
// Salden in den Weltzustand, sodass Start, Sparpläne und Trading im Launcher dieselben Zahlen sehen.
// Rechnen: library/components/finance/_calc.js über core/finmath.js (Umbuchungen sind weder Einnahme noch Ausgabe).
// Referenzmodul: das bestehende TAKT-Finanzkonzept ist in Phase 1 abzugleichen (isReference bleibt gesetzt).

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const demoData = {
  accounts: '@world:accounts', transactions: '@world:transactions', budgets: '@world:budgets', subscriptions: '@world:subscriptions', plans: '@world:savingsPlans',
  categories: '@world:financeCategories', rules: '@world:financeRules', events: '@world:financeEvents', prefs: '@world:financePrefs', subMeta: '@world:financeSubMeta',
  months: '@world:financeMonths', history: '@world:financeNetWorthHistory', txMeta: '@world:financeTxMeta',
};
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Finanzen', primaryLabel: '', ...props } });
const LEGAL = (kind = 'keine-beratung', style = 'footer') => ({ id: 'legal', component: 'legal-notice', region: 'footer', props: { kind, style } });
const blk = (id, component, region, props = {}, extra = {}) => ({ id, component, region, props, ...extra });
const RULE_LEGAL = { text: 'Hinweis „keine Anlage- oder Steuerberatung“ ist über legal-notice im Fuß jeder Variante sichtbar', type: 'rule', priority: 'must' };
const RULE_NEUTRAL = { text: 'Umbuchungen (Sparplan, Privatentnahme, Kreditkarte begleichen) sind neutral: nie als Ausgabe gezählt, nie in Budgets, Cashflow oder Sparquote', type: 'rule', priority: 'must' };
const RULE_PRIVACY = { text: 'Privatmodus: Alle Beträge erscheinen als „••••“ in gleicher Breite, auch in Hinweisen und Beschriftungen', type: 'rule', priority: 'must' };

// ================================================================== Heute
const home = {
  id: 'finance.home', name: 'Heute', group: 'Übersicht', status: 'review', tier: 1, usage: 'täglich',
  purpose: 'Der Einstieg in Finanzen: in fünf Sekunden sehen, was bis Monatsende frei bleibt, was als Nächstes abgebucht wird, wie die Budgets stehen und wie sich das Vermögen zusammensetzt, und ohne Umweg eine Buchung erfassen.',
  requirements: [
    { text: '„Frei verfügbar bis Monatsende“ steht prominent und ist über „Wie berechnet?“ herleitbar (Girokonto, offene Kreditkarte, Abbuchungen zum Monatswechsel, Sparraten, Puffer)', type: 'info', priority: 'must' },
    { text: 'Anstehendes (Abos, Fixkosten, Sparraten, Kreditkartenabrechnung) nach Tag gruppiert mit Tagessumme', type: 'info', priority: 'must' },
    { text: 'Budget-Stand als Hüllen: Rest, Tagesbudget, Warnton ab 85 % und bei Überschreitung, sachlich ohne Alarm', type: 'info', priority: 'must' },
    { text: 'Vermögens-Brücke: Liquidität, Rücklagen und Anlage mit Gesamtvermögen; antippen öffnet die Vermögensansicht', type: 'info', priority: 'should' },
    { text: 'Letzte Buchungen mit Tippen zum Detail; „Erfassen“ ist in einem Tap erreichbar', type: 'action', priority: 'must' },
    { text: 'Hinweise nach Priorität (Budget über Plan, Kündigungsfrist, ungenutztes Abo, Deckung am Monatswechsel)', type: 'info', priority: 'should' },
    RULE_NEUTRAL, RULE_PRIVACY, RULE_LEGAL,
    { text: 'Zustände: Erststart (kein Konto: Konto anlegen), leer, lädt, Fehler; Stand „09:30, fiktive Demo-Daten“ benannt', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: '„Erfassen“ antippen', result: 'Schnell erfassen öffnet sich', event: 'header.primary', to: 'finance.quickadd' },
    { trigger: '„Buchungen“ antippen', result: 'Buchungsliste mit Suche und Filtern', event: 'header.secondary', to: 'finance.transactions' },
    { trigger: 'Buchung antippen', result: 'Buchungs-Detail öffnet sich', event: 'tx.open', to: 'finance.transaction' },
    { trigger: 'Budget antippen', result: 'Budgets mit allen Hüllen; Buchungen der Kategorie sind über die Liste erreichbar', event: 'budget.open', to: 'finance.budgets' },
    { trigger: 'Vermögen oder Kontoart antippen', result: 'Vermögen mit Verlauf und Aufteilung', event: 'wealth.open', to: 'finance.networth' },
    { trigger: 'Abo oder Fixkosten in „Anstehend“ antippen', result: 'Abos und Fixkosten öffnen sich', event: 'upcoming.open', to: 'finance.subscriptions' },
    { trigger: 'Sparrate in „Anstehend“ antippen', result: 'Sparpläne öffnen sich', event: 'upcoming.plan', to: 'savings.home' },
    { trigger: 'Kennzahl antippen', result: 'Cashflow und Auswertung öffnen sich', event: 'kpi.open', to: 'finance.cashflow' },
    { trigger: 'Hinweis „Budget“ antippen', result: 'Budgets öffnen sich', event: 'hint.budget', to: 'finance.budgets' },
    { trigger: 'Hinweis „Abos“ antippen', result: 'Abos und Fixkosten öffnen sich', event: 'hint.sub', to: 'finance.subscriptions' },
    { trigger: 'Hinweis „Sparpläne“ antippen', result: 'Sparpläne öffnen sich', event: 'hint.savings', to: 'savings.home' },
    { trigger: 'Hinweis „Konten“ antippen', result: 'Konten öffnen sich', event: 'hint.account', to: 'finance.accounts' },
    { trigger: 'Zeile in der Erfassen-Leiste eingeben und Enter', result: 'Buchung wird gespeichert, „frei verfügbar“ ändert sich, Rückgängig erscheint', event: 'capture.save' },
    { trigger: '„Wie berechnet?“ antippen', result: 'Herleitung klappt auf', event: 'safe.how' },
  ],
  acceptance: [
    'Bei 390 px zeigt der erste Bildschirm „Frei verfügbar bis Monatsende“ (1.305,78 €) und eine Erfassen-Aktion, ohne zu scrollen.',
    '„Wie berechnet?“ zeigt alle Posten; die Summe der Zeilen ergibt exakt den angezeigten Betrag.',
    'Eine in der Fokus-Variante erfasste Ausgabe senkt „frei verfügbar“ sofort und erscheint in Buchungen und Konten.',
    'Mit Privatmodus (env=privacy) enthält die Seite keinen sichtbaren Betrag, nur „••••“.',
    'Im Erststart-Szenario zeigt die Seite eine Einladung „Konto anlegen“ statt Nullwerten.',
    'Umbuchungen (Sparpläne) senken „frei verfügbar“, erscheinen aber nicht als Ausgabe in Budgets oder Sparquote.',
  ],
  flows: [
    { id: 'fl-erfassen', name: 'Ausgabe erfassen und Wirkung sehen', steps: [{ featureId: 'finance.home', action: 'Erfassen antippen' }, { featureId: 'finance.quickadd', action: '12,50 eintippen, Kategorie Lebensmittel, speichern' }, { featureId: 'finance.home', action: '„Frei verfügbar“ ist gesunken' }] },
    { id: 'fl-abo', name: 'Kündigungsfrist prüfen', steps: [{ featureId: 'finance.home', action: 'Hinweis Kfz-Versicherung antippen' }, { featureId: 'finance.subscriptions', action: 'Kündigung vormerken' }] },
    { id: 'fl-budget', name: 'Budget über Plan prüfen', steps: [{ featureId: 'finance.home', action: 'Budget Freizeit antippen' }, { featureId: 'finance.budgets', action: 'Hülle anpassen' }] },
  ],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Zahlen und Listen', direction: 'kompakt',
      concept: 'Eine Zeile „Frei verfügbar“ mit Herleitung, darunter Anstehendes und letzte Buchungen als dichte Listen. Die Seitenspalte hält Budgets, Vermögen und Monatskennzahlen.',
      description: '+ Alles auf einen Blick, Aktionen in der Zeile, Zahlen exakt  − Wenig Raum für Diagramme, Fortschritt nur als Balken',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Heute', subtitle: 'Di, 24.11. · Stand 09:30', primaryLabel: 'Erfassen', secondaryLabel: 'Buchungen', secondaryIcon: 'list' }),
        blk('safe', 'fin-safe-to-spend', 'main', { style: 'compact', title: 'Frei verfügbar' }),
        blk('up', 'fin-upcoming', 'main', { days: 14, density: 'compact', limit: 8, title: 'Anstehend' }),
        blk('tx', 'fin-tx-list', 'main', { limit: 6, density: 'compact', groupBy: 'day', title: 'Letzte Buchungen', respectFilter: false, followAccount: false }),
        blk('bud', 'fin-budget-envelopes', 'aside', { style: 'bars', limit: 5, editable: false, title: 'Budgets November' }),
        blk('kpi', 'fin-month-kpis', 'aside', { style: 'row', title: 'Dieser Monat' }),
        blk('w', 'fin-wealth-split', 'aside', { style: 'rows', title: 'Vermögen' }),
        LEGAL(),
      ],
    },
    {
      id: 'B', name: 'Hüllen und Ringe', direction: 'visuell',
      concept: 'Große Karte „Frei verfügbar“ mit Verteilungsbalken, daneben die Vermögens-Brücke. Darunter Budget-Hüllen, Anstehendes und der Cashflow der letzten Monate; jede Karte trägt eine Botschaft.',
      description: '+ Verteilung und Fortschritt sofort sichtbar, ruhige Wirkung  − Mehr Scrollen, weniger Detail pro Eintrag',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Heute', subtitle: 'Di, 24.11. · Stand 09:30', primaryLabel: 'Erfassen' }),
        blk('safe', 'fin-safe-to-spend', 'main', { style: 'hero', title: 'Frei verfügbar' }, { span: 7 }),
        blk('w', 'fin-wealth-split', 'main', { style: 'bridge', title: 'Vermögen' }, { span: 5 }),
        blk('bud', 'fin-budget-envelopes', 'main', { style: 'envelopes', limit: 4, editable: false, title: 'Budgets' }, { span: 7 }),
        blk('up', 'fin-upcoming', 'main', { days: 14, density: 'comfortable', limit: 5, title: 'Anstehend' }, { span: 5 }),
        blk('cf', 'fin-cashflow-bars', 'main', { style: 'stacked', months: 6, height: 150, showDetail: false, title: 'Wohin das Geld ging' }, { span: 7 }),
        blk('kpi', 'fin-month-kpis', 'main', { style: 'ring', title: 'Dieser Monat' }, { span: 5 }),
        blk('tx', 'fin-tx-list', 'main', { limit: 5, groupBy: 'day', title: 'Letzte Buchungen', respectFilter: false, followAccount: false }, { span: 12 }),
        LEGAL(),
      ],
    },
    {
      id: 'C', name: 'Was jetzt wichtig ist', direction: 'fokus',
      concept: 'Priorisierte Hinweise zuerst, darunter frei verfügbar, die nächsten sieben Tage und nur die Budgets, die Aufmerksamkeit brauchen. Unten fixiert: Erfassen in einer Zeile.',
      description: '+ Klare nächste Aktion, Erfassen ohne Umweg, wenig Ablenkung  − Kennzahlen und Verlauf erst auf Nachfrage',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Was jetzt wichtig ist', subtitle: 'Di, 24.11. · Stand 09:30', secondaryLabel: 'Buchungen', secondaryIcon: 'list' }),
        blk('hints', 'fin-hints', 'main', { limit: 3, title: 'Als Nächstes', style: 'list' }),
        blk('safe', 'fin-safe-to-spend', 'main', { style: 'compact', title: 'Frei verfügbar' }),
        blk('up', 'fin-upcoming', 'main', { days: 7, density: 'compact', limit: 4, title: 'In den nächsten 7 Tagen' }),
        blk('bud', 'fin-budget-envelopes', 'main', { style: 'attention', editable: false, title: 'Budgets mit Aufmerksamkeit' }),
        blk('bar', 'fin-quick-line', 'bottom', { style: 'bar' }),
        LEGAL(),
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['finance.quickadd', 'finance.transactions', 'finance.budgets', 'finance.networth', 'finance.subscriptions', 'finance.cashflow'],
  seedHistory: [{ kind: 'draft', note: 'Drei Richtungen: Zahlen und Listen, Hüllen und Ringe, Was jetzt wichtig ist' }, { kind: 'review', note: 'Alle Viewports und Themes geprüft, Herleitung „Wie berechnet?“ ergänzt' }],
};

// ================================================================== Konten
const accounts = {
  id: 'finance.accounts', name: 'Konten', group: 'Übersicht', status: 'review', tier: 1, usage: 'täglich',
  purpose: 'Alle Konten mit Saldo, Verlauf und Gesamtvermögen; ein Konto öffnet seine Buchungen. Konto anlegen ist der erste Schritt im Erststart.',
  requirements: [
    { text: 'Konten nach Art gruppiert (Liquidität, Rücklagen, Anlage, Kreditkarte) mit Saldo, Bank, maskierter IBAN und Mini-Verlauf', type: 'info', priority: 'must' },
    { text: 'Gesamtvermögen oben (netto, Kreditkarte abgezogen)', type: 'info', priority: 'must' },
    { text: 'Konto antippen zeigt dessen Buchungen (Filter Konto)', type: 'action', priority: 'must' },
    { text: 'Kreditkarte zeigt den genutzten Rahmen; Tagesgeld den Zinssatz; Depot den Wert aus Trading (nicht doppelt gepflegt)', type: 'info', priority: 'should' },
    { text: 'Konto anlegen (Name, Art, Bank, Kontostand), Kontostand lässt sich später korrigieren', type: 'action', priority: 'must' },
    { text: 'Negative Salden sachlich und mit Minus, nicht allein per Farbe markiert', type: 'rule', priority: 'should' },
    RULE_PRIVACY, RULE_LEGAL,
    { text: 'Erststart: Einladung „Konto anlegen“; Kontoanbindung (Bank, CSV) ist offene Entscheidung, bis dahin manuell', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Konto antippen', result: 'Buchungen des Kontos öffnen sich (Filter Konto)', event: 'account.open', to: 'finance.transactions' },
    { trigger: 'Konto in der Liste wählen (Auswahlmodus)', result: 'Daneben stehende Liste filtert auf das Konto', event: 'account.select' },
    { trigger: '„Konto“ antippen', result: 'Dialog zum Anlegen eines Kontos', event: 'account.add' },
    { trigger: 'Anstehende Zahlung antippen', result: 'Abos und Fixkosten öffnen sich', event: 'upcoming.open', to: 'finance.subscriptions' },
    { trigger: 'Sparrate antippen', result: 'Sparpläne öffnen sich', event: 'upcoming.plan', to: 'savings.home' },
    { trigger: 'Vermögen oder Kontoart antippen', result: 'Vermögen mit Verlauf öffnet sich', event: 'wealth.open', to: 'finance.networth' },
    { trigger: 'Hinweis „Konten“ oder „Sparpläne“ antippen', result: 'Ziel öffnet sich', event: 'hint.savings', to: 'savings.home' },
  ],
  acceptance: [
    'Die fünf Konten der Persona erscheinen gruppiert; das Gesamtvermögen entspricht der Summe der Salden (55.508,15 €).',
    'Ein Tipp auf „Girokonto“ öffnet die Buchungen mit gesetztem Kontofilter, andere Konten sind nicht sichtbar.',
    'Im Erststart führt „Konto anlegen“ in einen Dialog; nach dem Speichern erscheint das Konto in der Liste.',
    'Die Kreditkarte zeigt einen negativen Saldo mit Minuszeichen und den genutzten Rahmen als Balken mit Textalternative.',
  ],
  flows: [{ id: 'fl-konto', name: 'Buchungen eines Kontos ansehen', steps: [{ featureId: 'finance.accounts', action: 'Girokonto antippen' }, { featureId: 'finance.transactions', action: 'Liste zeigt nur das Girokonto' }, { featureId: 'finance.transaction', action: 'Buchung antippen' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Konten als Liste', direction: 'kompakt',
      concept: 'Kontenliste nach Art gruppiert mit Salden und Verlauf; in der Seitenspalte die Aufteilung und anstehende Zahlungen.',
      description: '+ Alle Konten und Summen auf einen Blick  − Wenig Bildhaftes',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Konten', subtitle: 'Stand 09:30, fiktive Demo-Daten' }),
        blk('acc', 'fin-account-list', 'main', { style: 'rows', tapMode: 'open', title: 'Konten' }),
        blk('w', 'fin-wealth-split', 'aside', { style: 'donut', title: 'Aufteilung' }),
        blk('up', 'fin-upcoming', 'aside', { days: 10, density: 'compact', limit: 5, title: 'Anstehend' }),
        LEGAL(),
      ],
    },
    {
      id: 'B', name: 'Konten als Karten', direction: 'visuell',
      concept: 'Vermögens-Brücke oben, darunter große Kontenkarten mit Verlauf und der Vermögensverlauf über sechs Monate.',
      description: '+ Verteilung und Entwicklung sichtbar  − Weniger Konten pro Bildschirm',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Konten', subtitle: 'Stand 09:30, fiktive Demo-Daten' }),
        blk('w', 'fin-wealth-split', 'main', { style: 'bridge', title: 'Vermögen' }, { span: 12 }),
        blk('acc', 'fin-account-list', 'main', { style: 'cards', tapMode: 'open', showTotal: false, title: 'Konten' }, { span: 12 }),
        blk('nw', 'fin-networth-chart', 'main', { range: '6', title: 'Verlauf' }, { span: 12 }),
        LEGAL(),
      ],
    },
    {
      id: 'C', name: 'Konten mit Hinweisen', direction: 'fokus',
      concept: 'Zuerst, was bei den Konten Aufmerksamkeit braucht (Deckung, Kreditkartenabrechnung), dann die Konten als schlanke Liste und die nächsten Abbuchungen.',
      description: '+ Klare nächste Schritte  − Weniger Überblick über Verläufe',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Konten', subtitle: 'Stand 09:30' }),
        blk('hints', 'fin-hints', 'main', { limit: 2, title: 'Zu den Konten', style: 'list', hide: ['hint.budget', 'hint.sub', 'hint.account'] }),
        blk('acc', 'fin-account-list', 'main', { style: 'rows', tapMode: 'open', title: 'Konten' }),
        blk('up', 'fin-upcoming', 'main', { days: 7, density: 'compact', limit: 4, title: 'Nächste Abbuchungen' }),
        LEGAL(),
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['finance.transactions', 'finance.networth', 'savings.home'],
};

// ================================================================== Buchungen
const transactions = {
  id: 'finance.transactions', name: 'Buchungen', group: 'Buchungen', status: 'design', tier: 2, usage: 'mehrmals pro Woche',
  purpose: 'Alle Buchungen durchsuchen und filtern, nach Tag gruppiert, mit Summen. Von hier geht es in das Detail und zum Erfassen.',
  requirements: [
    { text: 'Volltextsuche (Titel, Kategorie, Betrag) und Filter nach Art (Ausgaben, Einnahmen, Umbuchungen), Kategorie und Konto', type: 'action', priority: 'must' },
    { text: 'Gruppierung nach Tag mit Tagessumme; Umbuchungen neutral mit Pfeil-Symbol und ohne Vorzeichenfarbe', type: 'info', priority: 'must' },
    { text: 'Filter „Ohne Beleg“ für Ausgaben, Symbole für Beleg und Notiz in der Zeile', type: 'info', priority: 'should' },
    { text: 'Gefilterte Ansicht zeigt Summen der Auswahl (Ausgaben, Einnahmen)', type: 'info', priority: 'should' },
    { text: 'Leerzustände: keine Buchungen (mit „Buchung erfassen“) und keine Treffer (mit „Filter zurücksetzen“)', type: 'state', priority: 'must' },
    RULE_NEUTRAL, RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Buchung antippen', result: 'Buchungs-Detail öffnet sich', event: 'tx.open', to: 'finance.transaction' },
    { trigger: '„Erfassen“ oder „Buchung erfassen“ antippen', result: 'Schnell erfassen öffnet sich', event: 'header.primary', to: 'finance.quickadd' },
    { trigger: 'Leerzustand „Buchung erfassen“', result: 'Schnell erfassen öffnet sich', event: 'tx.add', to: 'finance.quickadd' },
    { trigger: 'Suchtext oder Filterchip', result: 'Liste und Summen passen sich an', event: 'filter.change' },
    { trigger: 'Kategorie in der Verteilung antippen', result: 'Liste filtert auf die Kategorie', event: 'category.open' },
  ],
  acceptance: [
    'Die Suche „rewe“ zeigt genau die zwei REWE-Buchungen; die Summe der Auswahl ist −122,59 €.',
    'Der Filter „Umbuchungen“ zeigt fünf Buchungen ohne Vorzeichenfarbe und ohne Wirkung auf Summen.',
    'Mit gesetztem Konto (aus der Kontenübersicht) steht ein Kontofilter-Chip mit „Alle Konten“ zum Aufheben.',
    'Ohne Treffer erscheint „Keine Treffer“ mit „Filter zurücksetzen“, ohne Layoutsprung.',
  ],
  flows: [{ id: 'fl-suche', name: 'Buchung suchen und prüfen', steps: [{ featureId: 'finance.transactions', action: 'Suche „etsy“' }, { featureId: 'finance.transaction', action: 'Beleg ansehen, Kategorie prüfen' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Liste mit Filtern', direction: 'kompakt',
      concept: 'Eine dichte, nach Tag gruppierte Liste mit Suche und Filterchips; die Seitenspalte zeigt die Ausgaben nach Kategorie als Filterhilfe.',
      description: '+ Schnell zu finden, viele Zeilen sichtbar  − Kaum Grafik',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Buchungen', subtitle: 'November 2026', primaryLabel: 'Erfassen' }),
        blk('tx', 'fin-tx-list', 'main', { showFilters: true, density: 'compact', groupBy: 'day', title: 'Alle Buchungen' }),
        blk('sp', 'fin-spend-breakdown', 'aside', { style: 'bars', limit: 6, showPrev: false, title: 'Nach Kategorie' }),
        LEGAL(),
      ],
    },
    {
      id: 'B', name: 'Monat im Überblick', direction: 'visuell',
      concept: 'Oben die Kennzahlen des Monats und der Ring der Ausgaben, darunter die Buchungen in ruhiger, großzügiger Liste.',
      description: '+ Erst verstehen, dann suchen  − Liste beginnt weiter unten',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Buchungen', subtitle: 'November 2026', primaryLabel: 'Erfassen' }),
        blk('kpi', 'fin-month-kpis', 'main', { style: 'tiles', title: 'Dieser Monat' }, { span: 12 }),
        blk('sp', 'fin-spend-breakdown', 'main', { style: 'donut', limit: 6, title: 'Ausgaben nach Kategorie' }, { span: 5 }),
        blk('tx', 'fin-tx-list', 'main', { showFilters: true, density: 'comfortable', groupBy: 'day', limit: 12, title: 'Buchungen' }, { span: 7 }),
        LEGAL(),
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['finance.transaction', 'finance.quickadd'],
};

// ================================================================== Buchungs-Detail
const transaction = {
  id: 'finance.transaction', name: 'Buchungs-Detail', group: 'Buchungen', status: 'design', tier: 2, usage: 'mehrmals pro Woche',
  purpose: 'Eine Buchung prüfen und ordnen: Kategorie ändern (auf Wunsch als Regel merken), Notiz, Beleg anhängen oder auf zwei Kategorien aufteilen.',
  requirements: [
    { text: 'Betrag, Titel, Zeitpunkt, Konto und Art (Ausgabe, Einnahme, Umbuchung) im Kopf', type: 'info', priority: 'must' },
    { text: 'Kategorie mit einem Tap ändern; Budgets und Auswertungen aktualisieren sich sofort', type: 'action', priority: 'must' },
    { text: 'Nach einer Änderung Angebot „Immer so einordnen“ als Regel', type: 'action', priority: 'should' },
    { text: 'Notiz speichern, Beleg anhängen (Foto oder Datei, Demo-Simulation) und entfernen', type: 'action', priority: 'should' },
    { text: 'Aufteilen auf zwei Kategorien mit Betrag; Aufteilung lässt sich aufheben', type: 'action', priority: 'could' },
    { text: 'Buchungen mit Vertrag (Abo) verlinken auf Abos und Fixkosten; Umbuchungen zeigen Quelle und Ziel', type: 'info', priority: 'should' },
    RULE_NEUTRAL, RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Kategorie wählen', result: 'Buchung ist neu eingeordnet, Toast bestätigt', event: 'tx.category' },
    { trigger: '„Regel anlegen“ antippen', result: 'Regel „Titel enthält …“ ist gespeichert', event: 'tx.rule' },
    { trigger: 'Vertrag antippen', result: 'Abos und Fixkosten öffnen sich', event: 'tx.sub', to: 'finance.subscriptions' },
    { trigger: 'Notiz speichern', result: 'Notiz ist an der Buchung gespeichert', event: 'tx.note' },
    { trigger: 'Beleg anhängen oder entfernen', result: 'Dateiname erscheint bzw. verschwindet', event: 'tx.receipt' },
    { trigger: 'Aufteilen', result: 'Betrag verteilt sich auf zwei Kategorien', event: 'tx.split' },
  ],
  acceptance: [
    'Aus der Liste geöffnet zeigt das Detail genau die angetippte Buchung (selectedId).',
    'Nach „Kategorie ändern“ steigt das Budget der neuen und sinkt das der alten Kategorie.',
    'Eine Umbuchung zeigt „Umbuchung (zählt nicht als Ausgabe)“ und keine Kategorie-Auswahl.',
    'Ohne Auswahl öffnet das Detail die neueste Buchung statt eines leeren Screens.',
  ],
  flows: [{ id: 'fl-umordnen', name: 'Buchung umordnen und Regel anlegen', steps: [{ featureId: 'finance.transactions', action: 'Buchung antippen' }, { featureId: 'finance.transaction', action: 'Kategorie wählen, „Regel anlegen“' }] }],
  viewports: ['desktop', 'tablet', 'mobile'], demoData,
  variants: [{
    id: 'A', name: 'Detail mit Aktionen', direction: 'kompakt',
    concept: 'Betrag und Konto im Kopf, darunter Kategorie-Chips, Notiz und Beleg als klar getrennte Abschnitte in einer schmalen Spalte.',
    description: '+ Alles an einer Stelle, wenig Navigation  − Lange Kategorieliste auf kleinen Geräten',
    layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Buchung' }), blk('det', 'fin-tx-detail', 'main', { title: 'Details' }), LEGAL()],
  }],
  selectedVariantId: 'A',
  links: ['finance.transactions', 'finance.categories'],
};

// ================================================================== Schnell erfassen
const quickadd = {
  id: 'finance.quickadd', name: 'Schnell erfassen', group: 'Buchungen', status: 'review', tier: 1, usage: 'täglich',
  purpose: 'Eine Buchung in unter fünf Sekunden erfassen: Betrag, Kategorie-Vorschlag, Speichern. Ausgabe, Einnahme oder Umbuchung; jede Eingabe lässt sich rückgängig machen und wirkt sofort auf „frei verfügbar“ und Budgets.',
  requirements: [
    { text: 'Numpad mit Komma, Löschen und großem Betrag; höchstens 7 Vorkomma- und 2 Nachkommastellen', type: 'action', priority: 'must' },
    { text: 'Kategorie-Vorschläge aus Regeln und der Nutzung der letzten 60 Tage; ein Tap wählt', type: 'action', priority: 'must' },
    { text: 'Umbuchung als eigener Modus mit Quell- und Zielkonto (nie eine Kategorie); Ziel Depot nur über Sparpläne', type: 'rule', priority: 'must' },
    { text: 'Eine Zeile mit Erkennung („−4,90 Café“, „+120 Etsy“, „umbuchen 150 Tagesgeld“) zeigt Art, Kategorie und Konto vor dem Speichern', type: 'action', priority: 'must' },
    { text: 'Wirkung vorab: „Frei verfügbar danach“ und Stand des Kategorie-Budgets', type: 'info', priority: 'should' },
    { text: '„Häufig“-Chips übernehmen Titel, Kategorie, Konto und letzten Betrag', type: 'action', priority: 'should' },
    { text: 'Rückgängig nach dem Speichern stellt Buchung und Salden wieder her', type: 'action', priority: 'must' },
    { text: 'Schreibt in den Weltzustand (Buchungen und Salden); Offline wird gespeichert und später abgeglichen', type: 'rule', priority: 'must' },
    RULE_PRIVACY,
  ],
  interactions: [
    { trigger: 'Betrag eintippen, Kategorie wählen, speichern', result: 'Buchung erscheint in Liste und Konten, Rückgängig wird angeboten', event: 'capture.save' },
    { trigger: 'Rückgängig', result: 'Buchung und Salden sind zurückgesetzt', event: 'capture.undo' },
    { trigger: 'Art wechseln (Ausgabe, Einnahme, Umbuchung)', result: 'Felder passen sich an (Kategorie bzw. Zielkonto)', event: 'capture.mode' },
    { trigger: 'Eingeblendete Buchung antippen', result: 'Buchungs-Detail öffnet sich', event: 'tx.open', to: 'finance.transaction' },
    { trigger: '„Mit Numpad erfassen“ antippen', result: 'Numpad-Variante öffnet sich', event: 'numpad.open' },
  ],
  acceptance: [
    '„12,50“ eintippen, „Lebensmittel“ und „Ausgabe speichern“ legt eine Buchung von −12,50 € an: 3 bis 4 Taps.',
    'Die Zeile „-4,90 Café Morgenrot“ wird als Ausgabe 4,90 € erkannt und mit Enter gespeichert.',
    '„Rückgängig“ entfernt die Buchung und stellt den Kontostand exakt wieder her.',
    'Eine Umbuchung Giro → Tagesgeld senkt „frei verfügbar“, erscheint aber nicht als Ausgabe im Budget.',
    'In der Fokus-Variante zeigt „Frei verfügbar danach“ die Wirkung, bevor gespeichert wird.',
  ],
  flows: [{ id: 'fl-schnell', name: 'Kaffee erfassen', steps: [{ featureId: 'finance.home', action: 'Erfassen antippen' }, { featureId: 'finance.quickadd', action: '4,90 tippen, Kategorie Lebensmittel, speichern' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Eine Zeile', direction: 'kompakt',
      concept: 'Eine Eingabezeile mit Live-Erkennung (Betrag, Kategorie, Konto), Beispiele als Chips und die zuletzt erfassten Buchungen darunter.',
      description: '+ Am schnellsten mit Tastatur, Ergebnis sofort in der Liste  − Erkennung muss man kennen',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Erfassen', subtitle: 'Eine Zeile genügt' }), blk('line', 'fin-quick-line', 'main', { style: 'card', title: 'Schnell erfassen' }),
        blk('tx', 'fin-tx-list', 'main', { limit: 5, density: 'compact', groupBy: 'none', title: 'Zuletzt', showMore: false, respectFilter: false, followAccount: false }), LEGAL()],
    },
    {
      id: 'B', name: 'Numpad', direction: 'visuell',
      concept: 'Großer Betrag, Kategorie-Chips und ein Numpad für den Daumen. Ausgabe, Einnahme und Umbuchung als Umschalter.',
      description: '+ Einhändig, klare Schritte, große Ziele  − Mehr Taps als die Zeile',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Erfassen' }), blk('pad', 'fin-numpad-capture', 'main', { title: 'Betrag', showImpact: false, showFrequent: true }), LEGAL()],
    },
    {
      id: 'C', name: 'Mit Wirkung', direction: 'fokus',
      concept: 'Frei verfügbar oben, darunter das Numpad mit Vorschau der Wirkung auf Budget und Monatsende, bevor gespeichert wird.',
      description: '+ Man sieht die Folgen vor dem Speichern  − Mehr Information, etwas länger',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Erfassen' }), blk('safe', 'fin-safe-to-spend', 'main', { style: 'formula', title: 'Frei verfügbar', showHow: false }),
        blk('pad', 'fin-numpad-capture', 'main', { title: 'Betrag', showImpact: true, showFrequent: true }), LEGAL()],
    },
  ],
  selectedVariantId: 'B',
  links: ['finance.transactions', 'finance.home'],
  seedHistory: [{ kind: 'draft', note: 'Zeile, Numpad und Numpad mit Wirkung' }, { kind: 'review', note: 'Rückgängig, Umbuchung und Privatmodus geprüft' }],
};

// ================================================================== Budgets
const budgets = {
  id: 'finance.budgets', name: 'Budgets', group: 'Planung', status: 'design', tier: 2, usage: 'wöchentlich',
  purpose: 'Monatsbudgets als Hüllen: je Kategorie Rest, Tagesbudget und Verlauf im Monat. Früh sehen, wo es eng wird, und Hüllen ohne Aufwand anpassen.',
  requirements: [
    { text: 'Budget je Kategorie mit Ist, Soll, Rest, Tagesbudget und Fortschrittsbalken (Prozentzahl auch als Text)', type: 'info', priority: 'must' },
    { text: 'Warnton ab 85 %, bei Überschreitung sachlich („14,50 € über dem Budget“), nie rot oder alarmierend', type: 'rule', priority: 'must' },
    { text: 'Marke für den Monatsverlauf: nach X % des Monats wären Y € üblich', type: 'info', priority: 'should' },
    { text: 'Hülle anpassen, hinzufügen und entfernen; Rest wird nicht in den nächsten Monat übertragen (Annahme)', type: 'action', priority: 'must' },
    { text: 'Ist-Werte berechnen sich live aus den Buchungen (Umbuchungen zählen nie); aufgeteilte Buchungen zählen anteilig', type: 'rule', priority: 'must' },
    { text: 'Summenzeile: zugeteilt, ausgegeben, übrig', type: 'info', priority: 'should' },
    { text: 'Erststart: „Budget anlegen“ als erste Aktion', type: 'state', priority: 'must' },
    RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Hülle antippen', result: 'Buchungen der Kategorie öffnen sich', event: 'budget.open', to: 'finance.transactions' },
    { trigger: 'Stift antippen', result: 'Dialog zum Anpassen des Monatsbudgets', event: 'budget.edit' },
    { trigger: '„Hülle“ antippen', result: 'Dialog zum Hinzufügen einer Hülle', event: 'budget.add' },
    { trigger: 'Kategorie in der Verteilung antippen', result: 'Buchungen der Kategorie öffnen sich', event: 'category.open', to: 'finance.transactions' },
    { trigger: 'Hinweis „Budget“ antippen', result: 'Buchungen der Kategorie öffnen sich', event: 'hint.budget', to: 'finance.transactions' },
  ],
  acceptance: [
    'Freizeit zeigt 164,50 € von 150 € mit „14,50 € über dem Budget“ im Warnton, Lebensmittel zeigt „Noch 187,10 €“.',
    'Eine neu erfasste Ausgabe in Lebensmittel erhöht das Ist sofort (gemeinsamer Weltzustand).',
    'Beim Anpassen ändert sich das Soll, die Prozentzahl und der Rest sofort; „Hülle entfernen“ lässt keine Buchung verschwinden.',
    'Die Summenzeile entspricht der Summe der angezeigten Hüllen.',
  ],
  flows: [{ id: 'fl-hülle', name: 'Hülle anpassen', steps: [{ featureId: 'finance.budgets', action: 'Stift bei Freizeit antippen' }, { featureId: 'finance.budgets', action: 'Budget auf 200 € setzen, speichern' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Hüllen als Zeilen', direction: 'kompakt',
      concept: 'Jede Hülle eine Zeile: Kategorie, Ist von Soll, Balken mit Monatsmarke und Rest. Daneben die Ausgabenverteilung.',
      description: '+ Alle Hüllen und Zahlen auf einen Blick  − Weniger Ruhe',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Budgets', subtitle: 'November 2026 · Tag 24 von 30' }), blk('bud', 'fin-budget-envelopes', 'main', { style: 'bars', title: 'Hüllen' }),
        blk('kpi', 'fin-month-kpis', 'aside', { style: 'tiles', title: 'Dieser Monat' }), blk('sp', 'fin-spend-breakdown', 'aside', { style: 'bars', limit: 5, showPrev: true, title: 'Ausgaben' }), LEGAL()],
    },
    {
      id: 'B', name: 'Hüllen als Karten', direction: 'visuell',
      concept: 'Große Hüllen-Karten mit Rest als Botschaft („Noch 187,10 €“), dazu frei verfügbar und der Ausgabenring.',
      description: '+ Die Aussage jeder Hülle ist sofort klar  − Weniger Zeilen pro Bildschirm',
      layout: { type: 'grid' },
      blocks: [hdr({ title: 'Budgets', subtitle: 'November 2026 · Tag 24 von 30' }), blk('bud', 'fin-budget-envelopes', 'main', { style: 'envelopes', title: 'Hüllen' }, { span: 12 }),
        blk('safe', 'fin-safe-to-spend', 'main', { style: 'hero', title: 'Frei verfügbar', showHow: true }, { span: 6 }), blk('sp', 'fin-spend-breakdown', 'main', { style: 'donut', limit: 5, title: 'Ausgaben' }, { span: 6 }), LEGAL()],
    },
    {
      id: 'C', name: 'Nur was zählt', direction: 'fokus',
      concept: 'Nur Hüllen, die über 85 % liegen oder überschritten sind, mit Hinweisen und der Erfassen-Zeile unten.',
      description: '+ Ruhig, nur Handlungsbedarf  − Die vollständige Liste braucht einen Wechsel',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Budgets', subtitle: 'Was Aufmerksamkeit braucht' }), blk('hints', 'fin-hints', 'main', { limit: 2, style: 'list', title: 'Hinweise', hide: ['hint.sub', 'hint.savings', 'hint.account'] }), blk('bud', 'fin-budget-envelopes', 'main', { style: 'attention', title: 'Hüllen im Warnbereich' }),
        blk('bar', 'fin-quick-line', 'bottom', { style: 'bar' }), LEGAL()],
    },
  ],
  selectedVariantId: 'B',
  links: ['finance.transactions', 'finance.categories'],
};

// ================================================================== Abos & Fixkosten
const subscriptions = {
  id: 'finance.subscriptions', name: 'Abos und Fixkosten', group: 'Planung', status: 'design', tier: 2, usage: 'monatlich',
  purpose: 'Laufende Kosten im Griff: was monatlich und jährlich abgeht, welche Kündigungsfristen anstehen und welche Abos nicht genutzt werden. Kündigen passiert beim Anbieter, TAKT merkt vor und erinnert.',
  requirements: [
    { text: 'Monats- und Jahressumme, getrennt nach Fixkosten, Abos und Betrieb', type: 'info', priority: 'must' },
    { text: 'Kündigungsfristen der nächsten 45 Tage mit Datum und Resttagen', type: 'info', priority: 'must' },
    { text: 'Ungenutzte Abos (30 Tage und mehr) mit Jahreskosten', type: 'info', priority: 'must' },
    { text: '„Kündigung vormerken“ erinnert rechtzeitig und lässt sich zurücknehmen; kein Versprechen, dass gekündigt ist', type: 'action', priority: 'must' },
    { text: 'Pro Vertrag Laufzeit und Frist, Betrag pro Monat und pro Jahr', type: 'info', priority: 'should' },
    { text: 'Verträge und Fristen gehören fachlich zu Dokumente; hier zählen Kosten und Summen (Ownership)', type: 'rule', priority: 'should' },
    RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Vertrag antippen', result: 'Details des Vertrags (Laufzeit, Frist)', event: 'sub.open' },
    { trigger: '„Kündigung vormerken“ antippen', result: 'Erinnerung gesetzt, Toast bestätigt', event: 'sub.cancel' },
    { trigger: '„Vorgemerkt“ antippen', result: 'Vormerkung zurückgenommen', event: 'sub.keep' },
    { trigger: '„Vorlage“ bei einer Frist', result: 'Vertrag in „Dokumente & Verträge“ mit Kündigungsvorlage und Unterlagen (Ziel kommt aus dem Event)', event: 'sub.contract' },
  ],
  acceptance: [
    'Die Jahressumme entspricht 12 × Monatssumme der privaten Verträge (16.703,52 €).',
    'Die Kfz-Versicherung zeigt „Kündigung bis 30.11. · in 6 Tagen“, Netflix „34 Tage nicht genutzt · 168 € im Jahr“.',
    'Nach „Kündigung vormerken“ steht „Vorgemerkt“ am Vertrag; ein zweiter Tipp nimmt es zurück.',
    'Betriebliche Verträge (Adobe) sind als „Betrieb“ getrennt und fließen nicht in die Privatsumme.',
  ],
  flows: [{ id: 'fl-frist', name: 'Frist wahrnehmen', steps: [{ featureId: 'finance.home', action: 'Hinweis zur Kfz-Versicherung' }, { featureId: 'finance.subscriptions', action: 'Kündigung vormerken' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Liste mit Fristen', direction: 'kompakt',
      concept: 'Summen oben, dann Hinweise zu Fristen und ungenutzten Abos, darunter alle Verträge gruppiert mit Betrag pro Monat und Jahr.',
      description: '+ Vollständig und ohne Umwege  − Viel Text',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Abos und Fixkosten', subtitle: 'Stand 24.11.2026' }), blk('sub', 'fin-subscription-overview', 'main', { style: 'list', title: 'Verträge' }), LEGAL()],
    },
    {
      id: 'B', name: 'Jahreskosten sichtbar', direction: 'visuell',
      concept: 'Eine große Jahreszahl mit Verteilung Fixkosten und Abos, Karten für Fristen und ungenutzte Abos, danach die Verträge.',
      description: '+ Die Größenordnung wird sofort greifbar  − Etwas länger',
      layout: { type: 'grid' },
      blocks: [hdr({ title: 'Abos und Fixkosten', subtitle: 'Stand 24.11.2026' }), blk('sub', 'fin-subscription-overview', 'main', { style: 'cards', title: 'Jahreskosten' }, { span: 7 }),
        blk('up', 'fin-upcoming', 'main', { days: 30, density: 'comfortable', limit: 7, title: 'Nächste Abbuchungen' }, { span: 5 }), LEGAL()],
    },
    {
      id: 'C', name: 'Was jetzt zu tun ist', direction: 'fokus',
      concept: 'Nur Fristen und ungenutzte Abos mit Ein-Tap-Vormerken, darunter die nächsten Abbuchungen.',
      description: '+ Klarer Handlungsbezug  − Gesamtübersicht nur über den Wechsel',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Abos prüfen', subtitle: 'Fristen und Ungenutztes' }), blk('sub', 'fin-subscription-overview', 'main', { style: 'callouts', title: 'Prüfen' }),
        blk('up', 'fin-upcoming', 'main', { days: 14, density: 'compact', limit: 6, title: 'Nächste Abbuchungen' }), LEGAL()],
    },
  ],
  selectedVariantId: 'A',
  links: ['finance.home', 'finance.cashflow'],
};

// ================================================================== Cashflow & Auswertung (früher finance.reports)
const cashflow = {
  id: 'finance.cashflow', name: 'Cashflow und Auswertung', group: 'Auswertung', status: 'design', tier: 2, usage: 'wöchentlich',
  purpose: 'Verstehen, wohin das Geld fließt: Einnahmen, Ausgaben und Sparen im Monat und über sechs Monate, mit Sparquote. Umbuchungen und die Privatentnahme zählen nicht mit.',
  requirements: [
    { text: 'Einnahmen, Ausgaben, Gespart und Sparquote des Monats mit Vormonats-Vergleich (laufender Monat benannt als nicht abgeschlossen)', type: 'info', priority: 'must' },
    { text: 'Geldfluss als Sankey-ähnliche Darstellung: Einnahmen → Kategorien, Gespartes, Übriges; Defizit als Quelle „Aus Guthaben“', type: 'info', priority: 'must' },
    { text: 'Sechs Monate als gestapelte Balken mit Einnahmen-Marke oder als Tabelle; Monat antippen für Details', type: 'info', priority: 'must' },
    { text: 'Ausgaben nach Kategorie mit Anteil und Vormonats-Marke; Tippen filtert die Buchungen', type: 'info', priority: 'should' },
    { text: 'Sparquote = (Einnahmen − Ausgaben) / Einnahmen, Umbuchungen und Privatentnahme zählen nicht (Gesamtsicht benannt)', type: 'rule', priority: 'must' },
    { text: 'Export als CSV oder PDF (später)', type: 'action', priority: 'could' },
    RULE_NEUTRAL, RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Monat in den Balken antippen', result: 'Details des Monats (Einnahmen, Ausgaben, Gespart, Quote)', event: 'cashflow.month' },
    { trigger: 'Kategorie oder Knoten im Geldfluss antippen', result: 'Buchungen der Kategorie öffnen sich', event: 'flow.open', to: 'finance.transactions' },
    { trigger: 'Kategorie in der Verteilung antippen', result: 'Buchungen der Kategorie öffnen sich', event: 'category.open', to: 'finance.transactions' },
    { trigger: 'Kennzahl antippen', result: 'Kennzahl wird hervorgehoben', event: 'kpi.open' },
  ],
  acceptance: [
    'Im November ergibt das Sankey: Einnahmen 2.952 € = Ausgaben 1.976 € + Gespart 575 € + Übrig 402 €.',
    'Die Sparquote zeigt 33 % (nicht 72 %): Die Privatentnahme von 4.200 € ist intern.',
    'Der laufende Monat ist mit * als „noch nicht abgeschlossen“ gekennzeichnet.',
    'Eine neue Ausgabe verändert Sankey, Balken und Quote sofort.',
    'Im Privatmodus bleiben die Formen sichtbar, alle Beträge sind „••••“.',
  ],
  flows: [{ id: 'fl-wohin', name: 'Wohin ging das Geld?', steps: [{ featureId: 'finance.cashflow', action: 'Knoten „Wohnen“ antippen' }, { featureId: 'finance.transactions', action: 'Liste zeigt Wohnen' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Tabelle und Verteilung', direction: 'kompakt',
      concept: 'Kennzahlen als Zeile, Monate als Tabelle mit Quote, rechts die Ausgaben nach Kategorie mit Vormonats-Marke.',
      description: '+ Exakte Zahlen, gut vergleichbar  − Wenig Anschaulichkeit',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Cashflow', subtitle: 'Gesamtsicht · bis 24.11.' }), blk('kpi', 'fin-month-kpis', 'main', { style: 'tiles', title: 'Dieser Monat' }), blk('cf', 'fin-cashflow-bars', 'main', { style: 'table', months: 6, title: 'Letzte 6 Monate' }),
        blk('sp', 'fin-spend-breakdown', 'aside', { style: 'bars', limit: 7, showPrev: true, title: 'Nach Kategorie' }), LEGAL()],
    },
    {
      id: 'B', name: 'Geldfluss', direction: 'visuell',
      concept: 'Der Geldfluss des Monats als Sankey mit Sparquote als Ring, darunter sechs Monate als gestapelte Balken mit Einnahmen-Marke.',
      description: '+ Die Verteilung wird sofort sichtbar  − Weniger exakt, mehr Platz nötig',
      layout: { type: 'grid' },
      blocks: [hdr({ title: 'Cashflow', subtitle: 'Gesamtsicht · bis 24.11.' }), blk('sk', 'fin-cashflow-sankey', 'main', { limit: 5, height: 300, title: 'Geldfluss im November' }, { span: 7 }),
        blk('kpi', 'fin-month-kpis', 'main', { style: 'ring', title: 'Sparquote' }, { span: 5 }), blk('cf', 'fin-cashflow-bars', 'main', { style: 'stacked', months: 6, height: 190, title: 'Letzte 6 Monate' }, { span: 12 }), LEGAL()],
    },
  ],
  selectedVariantId: 'B',
  links: ['finance.budgets', 'finance.networth'],
};

// ================================================================== Vermögen
const networth = {
  id: 'finance.networth', name: 'Vermögen', group: 'Auswertung', status: 'design', tier: 2, usage: 'monatlich',
  purpose: 'Das ganze Vermögen: Verlauf über zwölf Monate, Aufteilung nach Kontoart und ein nüchterner Finanz-Check mit Herleitung.',
  requirements: [
    { text: 'Gesamtvermögen netto (Kreditkarte abgezogen) mit Veränderung im Zeitraum', type: 'info', priority: 'must' },
    { text: 'Verlauf 6 oder 12 Monate, gestapelt nach Liquidität, Rücklagen, Depot; Punkt antippen zeigt den Monat', type: 'info', priority: 'must' },
    { text: 'Aufteilung nach Kontoart als Ring, Brücke oder Zeilen; Depot-Wert kommt aus Trading', type: 'info', priority: 'must' },
    { text: 'Finanz-Check: Rücklage in Monatsausgaben, Sparquote, Fixkostenquote, Kreditkarten-Auslastung, jeweils mit Herleitung', type: 'info', priority: 'should' },
    { text: 'Richtwerte sind markiert, nicht bewertet; keine Ampel, keine Empfehlung', type: 'rule', priority: 'must' },
    RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Punkt im Verlauf antippen', result: 'Aufteilung des Monats erscheint', event: 'networth.point' },
    { trigger: 'Zeitraum wählen', result: 'Verlauf zeigt 6 oder 12 Monate', event: 'networth.range' },
    { trigger: 'Kontoart antippen', result: 'Konten öffnen sich', event: 'wealth.open', to: 'finance.accounts' },
    { trigger: 'Kennzahl im Finanz-Check antippen', result: 'Herleitung klappt auf', event: 'check.open' },
  ],
  acceptance: [
    'Der letzte Verlaufspunkt entspricht der Summe der Kontostände (55.508,15 €).',
    'Die Rücklage zeigt „4,2 Monate“ mit markiertem Richtwert 3 bis 6 Monate und der Herleitung „9.500 € ÷ Ø Ausgaben“.',
    'Keine Kennzahl trägt eine Wertung wie „gut“ oder „zu wenig“; der Hinweis „Orientierung, keine Beratung“ ist sichtbar.',
    'Der Zeitraum 6 Monate zeigt genau sechs Punkte.',
  ],
  flows: [{ id: 'fl-vermoegen', name: 'Vermögen verstehen', steps: [{ featureId: 'finance.home', action: 'Vermögens-Brücke antippen' }, { featureId: 'finance.networth', action: 'Punkt im Verlauf antippen' }] }],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Verlauf und Ring', direction: 'visuell',
      concept: 'Große Verlaufsfläche, daneben der Ring der Aufteilung und der Finanz-Check als vier Karten.',
      description: '+ Entwicklung und Verteilung auf einen Blick  − Viel Fläche',
      layout: { type: 'grid' },
      blocks: [hdr({ title: 'Vermögen', subtitle: 'Stand 24.11.2026, fiktive Demo-Daten' }), blk('nw', 'fin-networth-chart', 'main', { range: '12', title: 'Verlauf' }, { span: 12 }),
        blk('w', 'fin-wealth-split', 'main', { style: 'donut', title: 'Aufteilung' }, { span: 5 }), blk('chk', 'fin-finance-check', 'main', { style: 'cards', title: 'Finanz-Check' }, { span: 7 }), LEGAL()],
    },
    {
      id: 'B', name: 'Zeilen und Check', direction: 'kompakt',
      concept: 'Kontoarten als Zeilen mit Summen und der Finanz-Check als Liste; der Verlauf steht kompakt in der Seitenspalte.',
      description: '+ Zahlen exakt, wenig Scrollen  − Verlauf kleiner',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Vermögen', subtitle: 'Stand 24.11.2026' }), blk('w', 'fin-wealth-split', 'main', { style: 'rows', title: 'Nach Kontoart' }), blk('chk', 'fin-finance-check', 'main', { style: 'list', title: 'Finanz-Check' }),
        blk('nw', 'fin-networth-chart', 'aside', { range: '6', height: 180, title: 'Verlauf' }), LEGAL()],
    },
  ],
  selectedVariantId: 'A',
  links: ['finance.accounts', 'savings.home'],
};

// ================================================================== Kategorien & Regeln
const categories = {
  id: 'finance.categories', name: 'Kategorien und Regeln', group: 'Einstellungen', status: 'design', tier: 3, usage: 'selten',
  purpose: 'Kategorien pflegen und Regeln anlegen, damit neue Buchungen automatisch richtig einsortiert werden.',
  requirements: [
    { text: 'Feste Taxonomie mit Art (fix, variabel, Sparen, Einnahme); eigene Kategorien anlegen, Name und Symbol ändern', type: 'action', priority: 'must' },
    { text: '„Umbuchung“ ist fest und zählt nie als Ausgabe', type: 'rule', priority: 'must' },
    { text: 'Regeln „Titel enthält … → Kategorie“ mit Trefferzahl und Ein/Aus-Schalter', type: 'action', priority: 'must' },
    { text: 'Beim Anlegen Vorschau der Treffer und „Auf bestehende Buchungen anwenden“', type: 'action', priority: 'should' },
    { text: 'Buchungen ohne Kategorie lassen sich per Regeln nacheinander prüfen', type: 'action', priority: 'could' },
    RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Kategorie antippen', result: 'Buchungen der Kategorie öffnen sich', event: 'category.open', to: 'finance.transactions' },
    { trigger: 'Regel anlegen und speichern', result: 'Regel ist aktiv, bestehende Buchungen werden auf Wunsch angepasst', event: 'rule.add' },
    { trigger: 'Schalter einer Regel', result: 'Regel pausiert bzw. aktiv', event: 'rule.toggle' },
  ],
  acceptance: [
    'Die Regel „rewe“ zeigt „2 Treffer“; eine neue Regel „apotheke“ zeigt vor dem Speichern die passenden Buchungen.',
    'Eine pausierte Regel wird bei neuen Buchungen nicht angewendet und ist als „pausiert“ markiert.',
    '„Umbuchung“ hat keinen Stift und lässt sich nicht umbenennen.',
  ],
  flows: [{ id: 'fl-regel', name: 'Regel anlegen', steps: [{ featureId: 'finance.categories', action: '„Regel“ antippen, Text „apotheke“, Kategorie Gesundheit' }, { featureId: 'finance.transactions', action: 'Neue Buchungen sind eingeordnet' }] }],
  viewports: ['desktop', 'tablet', 'mobile'], demoData,
  variants: [{
    id: 'A', name: 'Kategorien und Regeln', direction: 'kompakt',
    concept: 'Kategorien als Liste mit Nutzung im Monat, daneben die Regeln mit Schaltern.',
    description: '+ Beides in einem Blick  − Auf Mobile untereinander',
    layout: { type: 'split' },
    blocks: [hdr({ title: 'Kategorien und Regeln' }), blk('cat', 'fin-category-list', 'main', { title: 'Kategorien' }), blk('rules', 'fin-rule-list', 'aside', { title: 'Regeln' }), LEGAL()],
  }],
  selectedVariantId: 'A',
  links: ['finance.budgets', 'finance.transaction'],
};

// ================================================================== Privatsphäre & Sicherheit
const privacy = {
  id: 'finance.privacy', name: 'Privatsphäre und Sicherheit', group: 'Einstellungen', status: 'design', tier: 3, usage: 'selten',
  purpose: 'Finanzdaten schützen: Beträge ausblenden, eigene Sperre für Finanzen, Puffer festlegen und wissen, wo die Daten liegen.',
  requirements: [
    { text: 'Beträge ausblenden: wirkt sofort in allen Finanz-Screens, mit Vorschau der Maske', type: 'action', priority: 'must' },
    { text: 'Maske ist gleich breit und verrät keine Größenordnung; Tippen blendet einen Betrag kurz ein (Annahme, offen)', type: 'rule', priority: 'must' },
    { text: 'Finanzen separat sperren (Biometrie oder PIN, Zeitpunkt wählbar), Sperre testen als Simulation', type: 'action', priority: 'should' },
    { text: 'Puffer für „frei verfügbar“ einstellbar; Hinweis, dass der Betrag nie als frei zählt', type: 'action', priority: 'should' },
    { text: 'Hinweis „Alle Daten bleiben lokal“ (daten); Export als CSV und Löschen als Simulation, Löschen mit klarer Folge', type: 'info', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Schalter „Beträge ausblenden“', result: 'Alle Beträge im Modul sind maskiert', event: 'privacy.toggle' },
    { trigger: 'Schalter „Finanzen separat sperren“', result: 'Sperre aktiv, Optionen erscheinen', event: 'privacy.lock' },
    { trigger: '„Sperre testen“ antippen', result: 'Sperrbild als Simulation', event: 'privacy.test' },
    { trigger: 'Puffer ändern', result: '„Frei verfügbar“ rechnet mit dem neuen Puffer', event: 'privacy.reserve' },
  ],
  acceptance: [
    'Nach „Beträge ausblenden“ zeigen Heute, Konten und Buchungen nur „••••“; die Vorschau zeigt „ausgeblendet“.',
    'Ein geänderter Puffer verändert „Frei verfügbar“ auf Heute um genau diese Differenz.',
    '„Finanzdaten löschen“ erklärt die Folge und lässt sich mit „Behalten“ abbrechen.',
  ],
  flows: [{ id: 'fl-privat', name: 'Beträge verstecken', steps: [{ featureId: 'finance.privacy', action: 'Schalter „Beträge ausblenden“' }, { featureId: 'finance.home', action: 'Alle Beträge sind „••••“' }] }],
  viewports: ['desktop', 'tablet', 'mobile'], demoData,
  variants: [{
    id: 'A', name: 'Schalter und Hinweise', direction: 'fokus',
    concept: 'Vier Abschnitte untereinander: Anzeige, Sperre, Berechnung, Lokale Daten; die Maske ist sofort in der Vorschau zu sehen.',
    description: '+ Klar und ohne Verschachtelung  − Lang auf kleinen Geräten',
    layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Privatsphäre' }), blk('pv', 'fin-privacy-panel', 'main', { title: 'Einstellungen Finanzen' }), { ...LEGAL('daten', 'card'), id: 'legal-daten' }, LEGAL()],
  }],
  selectedVariantId: 'A',
  links: ['finance.home'],
};

// ================================================================== Skizzen (ohne Variante)
const importer = {
  id: 'finance.import', name: 'Import und Abgleich', group: 'Einstellungen', status: 'analyzed', tier: 3, usage: 'selten',
  purpose: 'Buchungen aus CSV oder CAMT.053 übernehmen und mit manuell erfassten abgleichen, Regeln greifen beim Import.',
  requirements: [
    { text: 'CSV und CAMT.053 wählen, Spalten zuordnen, Vorschau vor dem Import', type: 'action', priority: 'should' },
    { text: 'Dubletten erkennen (Datum, Betrag, Text) und zusammenführen statt doppelt anlegen', type: 'rule', priority: 'must' },
    { text: 'Kategorisierungsregeln laufen beim Import; unklare Buchungen landen in „Sonstiges“', type: 'rule', priority: 'should' },
    { text: 'Kontoanbindung per Bank-Aggregator ist nicht Teil von Basis v1 (offene Entscheidung)', type: 'info', priority: 'could' },
  ],
  interactions: [{ trigger: 'Datei wählen', result: 'Vorschau der erkannten Buchungen', event: 'import.preview' }],
  viewports: ['desktop', 'mobile'],
};
const business = {
  id: 'finance.business', name: 'Selbstständige: Rücklagen', group: 'Planung', status: 'not_analyzed', tier: 3, usage: 'monatlich',
  purpose: 'Für Selbstständige: Umsatzsteuer und Einkommensteuer-Vorauszahlungen zurücklegen, Einnahmen aus Shopify und Etsy dem Betrieb zuordnen. Orientierung, keine Steuerberatung.',
  requirements: [
    { text: 'Rücklage für Steuern aus den Einnahmen vorschlagen (Annahme mit Stand-Datum, nie als Beratung)', type: 'info', priority: 'could' },
    { text: 'Vorauszahlungstermine (10.03., 10.06., 10.09., 10.12.) als anstehende Zahlungen', type: 'info', priority: 'could' },
    { text: 'Betriebs- und Privatsicht getrennt benennen (Privatentnahme ist intern)', type: 'rule', priority: 'should' },
  ],
  interactions: [],
  viewports: ['desktop', 'mobile'],
};

export default {
  module: {
    id: 'finance', name: 'Finanzen', icon: 'wallet', status: 'active', area: 'Finanzen', theme: 'graphite', designVersion: '0.4', isReference: true, stage: 3,
    legal: ['keine-beratung'], // Pflichthinweis in jeder Variante (npm run check, QA-Sonde legal-present)
    description: 'Konten, Buchungen, Budgets, Abos, Cashflow und Vermögen: ruhig erfassen, jederzeit wissen, was frei ist. Anzeige, Planung und Auswertung, keine Anlage- oder Steuerberatung.',
    source: 'Auftrag 2026-11 (Ausbau Finanzen). Referenzmodul: mit bestehendem TAKT-Finanzkonzept in Phase 1 abgleichen',
    infoArchitecture: 'Heute (Frei verfügbar, Anstehendes, Budgets, Vermögen) → Konten → Buchungen → Buchungs-Detail; Erfassen (Zeile, Numpad) von überall; Planung: Budgets (Hüllen), Abos und Fixkosten; Auswertung: Cashflow, Vermögen; Einstellungen: Kategorien und Regeln, Privatsphäre; später Import und Selbstständige.',
    docs: [
      '## Grundsätze',
      '- Anzeige, Planung, Auswertung: TAKT führt keine Zahlungen aus und gibt keine Anlage- oder Steuerberatung. Hinweis über `legal-notice` in jeder Variante.',
      '- Umbuchungen (Sparplan, Privatentnahme, Kreditkarte begleichen) sind neutral: nie Ausgabe, nie in Budgets, Cashflow, Sparquote.',
      '- „Frei verfügbar bis Monatsende“ = Girokonto − offene Kreditkarte − Abbuchungen bis zum Monatswechsel − Sparraten − Puffer; jede Zahl ist herleitbar („Wie berechnet?“).',
      '- Gesamtsicht: Die Privatentnahme (Geschäftskonto → Girokonto) zählt als Umbuchung. Sparquote Nov. daher 33 %, nicht 72 %.',
      '- Alle Daten stammen aus der gemeinsamen Welt (fiktiv). Erfassen schreibt Buchungen und Salden dorthin; Depot bleibt Eigentum von Trading, Sparpläne von Sparpläne.',
      '',
      '## Offene Fragen',
      '- Kontoanbindung: nur manuell plus CSV/CAMT oder Bank-Aggregator?',
      '- Betrieb und Privat in einer Sicht oder getrennt (Privatentnahme)?',
      '- Beträge ausblenden: Antippen blendet einen Betrag 3 Sekunden ein?',
      '- Übertrag von Budget-Resten in den Folgemonat?',
    ].join('\n'),
    links: ['savings', 'trading', 'sales', 'home', 'calendar', 'documents'],
    homeFeatureId: 'finance.home',
  },
  features: [home, accounts, quickadd, transactions, transaction, budgets, subscriptions, cashflow, networth, categories, privacy, importer, business],
  decisions: [
    { featureId: 'finance.accounts', title: 'Konzept aus dem TAKT-Projekt abgleichen', decision: '', rationale: 'Das maßgebliche Finanzkonzept liegt beim Auftraggeber. In Phase 1 mit dem Workbench-Stand abgleichen (Kategorien, Begriffe, Kontoarten); bis dahin gilt dieser Entwurf.', tradeoffs: 'Abgleich später: bis dahin können sich Begriffe ändern. Sofort anpassen: würde den Entwurf ohne Vorlage binden.', status: 'open' },
    { featureId: 'finance.accounts', title: 'Kontoanbindung: manuell plus CSV oder Bank-Aggregator?', decision: '', rationale: 'Empfehlung: Basis v1 manuell und CSV/CAMT, ein Aggregator wäre ein eigenes Projekt (Backend, Lizenz, Haftung).', tradeoffs: 'Manuell: mehr Aufwand für die Person, volle Kontrolle und Datenschutz. Aggregator: bequem, aber Anbieter, Kosten und Zugriffe auf Bankdaten.', status: 'open' },
    { featureId: 'finance.cashflow', title: 'Privatentnahme zählt als Umbuchung (Gesamtsicht)', decision: 'In der Gesamtsicht ist die Privatentnahme zwischen Geschäfts- und Girokonto eine Umbuchung. Die Sparquote beruht auf den echten Einnahmen (Shop-Auszahlungen).', rationale: 'Sonst werden Einnahmen doppelt gezählt (Shop-Auszahlung und Privatentnahme) und die Sparquote steigt auf 72 %. Betriebs- und Privatsicht werden benannt.', tradeoffs: 'Eine getrennte Privatsicht (Entnahme als Einnahme) wäre für Angestellte intuitiver; sie bleibt als spätere Option.', status: 'decided' },
    { featureId: 'finance.home', title: '„Frei verfügbar“ rechnet den Monatswechsel mit', decision: 'Abbuchungen vom Ersten des Folgemonats (Miete, Fixkosten, Sparraten) sind bereits abgezogen; weitere Einnahmen werden nicht angenommen.', rationale: 'Am Monatsende ist das Konto sonst scheinbar voll, obwohl am Ersten die größten Posten abgehen. Die Herleitung nennt jede Zeile.', tradeoffs: 'Konservativ: der Betrag wirkt kleiner. Alternative „nur bis 30.11.“ wäre höher, aber irreführend.', status: 'decided' },
    { featureId: 'finance.quickadd', title: 'Erfassen: Zeile, Numpad oder Numpad mit Wirkung als Standard?', decision: '', rationale: 'Die Zeile ist am schnellsten mit Tastatur, das Numpad am besten einhändig, die Wirkungsvorschau schafft Vertrauen. Entscheidung nach Test mit echten Alltagsbuchungen auf dem Handy.', tradeoffs: 'Zeile: Erkennung muss gelernt werden. Numpad: mehr Taps. Mit Wirkung: etwas länger, dafür ohne Überraschung.', status: 'open' },
    { featureId: 'finance.privacy', title: 'Beträge ausblenden: Antippen blendet kurz ein', decision: '', rationale: 'Empfehlung der Leitlinien: ein Tipp zeigt einen Betrag 3 Sekunden. Der Test klärt, ob das in der Bahn als sicher genug empfunden wird.', tradeoffs: 'Mit Einblenden: bequem, aber ein Blick über die Schulter ist möglich. Ohne: sicherer, aber umständlich.', status: 'open' },
  ],
};
