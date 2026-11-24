// Modul "Sparpläne" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Daten kommen aus der gemeinsamen Finanzwelt (seed/world/finance.js): Sparpläne, Sparziele, Positionen, Konten, Buchungen,
// Fixkosten, Freistellungsauftrag, Depotverlauf. Komponenten schreiben in den Weltzustand (Pausieren, Rate ändern, Ausführung
// bestätigen, Plan anlegen), sodass sich alle Screens im Launcher mitändern. Rechnen: core/finmath.js.

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
/** Welt-Bindungen für alle Features (Schlüssel = Datenslots der Komponenten). */
const WORLD = {
  plans: '@world:savingsPlans', goals: '@world:savingsGoals', positions: '@world:positions', accounts: '@world:accounts',
  transactions: '@world:transactions', subscriptions: '@world:subscriptions', allowance: '@world:taxAllowance', history: '@world:depotHistory',
};
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Sparpläne', primaryLabel: '', ...props } });
const FOOT = { id: 'legal', component: 'legal-notice', region: 'footer', props: { kind: 'keine-beratung', style: 'footer' } };
const MODEL = (region = 'main', style = 'inline', extra = {}) => ({ id: 'legal-m', component: 'legal-notice', region, props: { kind: 'modellrechnung', style }, ...extra });
const TAXN = (region = 'main', style = 'inline') => ({ id: 'legal-t', component: 'legal-notice', region, props: { kind: 'steuer', style } });

// ================================================================ Übersicht
const home = {
  id: 'savings.home', name: 'Übersicht', group: 'Übersicht', status: 'review', tier: 1,
  purpose: 'Der Einstieg in Sparpläne: auf einen Blick, wie viel monatlich fließt, was die Sparpläne wert sind, wann die nächste Ausführung ansteht und ob die Ziele auf Kurs sind. Ruhig und ohne Bewertungsdruck. Sparpläne sind Plan-Tracker: TAKT erinnert und gleicht ab, die Ausführung passiert beim Broker.',
  requirements: [
    { text: 'Kennzahlen ohne Scrollen: Sparrate pro Monat (Summe aktiver Pläne), Wert der Sparpläne mit Ertrag, nächste Ausführung, Ziele im Plan', type: 'info', priority: 'must' },
    { text: 'Plan-Liste mit Rate, Rhythmus, nächster Ausführung, Wert und Status; Pausieren und Fortsetzen direkt in der Zeile, mit Rückgängig', type: 'action', priority: 'must' },
    { text: 'Nächste Ausführungen mit Handelstag-Verschiebung (Wochenende, Feiertag) und Deckungs-Check für das Girokonto', type: 'info', priority: 'must' },
    { text: 'Sparziele mit Fortschritt und ehrlicher Prognose („voraussichtlich im …“, „nötig wären etwa …“)', type: 'info', priority: 'must' },
    { text: 'Pflichtsatz Plan-Tracker sichtbar: „Dieser Sparplan wird nicht von TAKT ausgeführt …“; Hinweis „keine Anlageberatung“ als Fuß', type: 'rule', priority: 'must' },
    { text: 'Beträge nur über den Privatsphäre-Standard (maskierbar), Gewinne mit Vorzeichen und Pfeil zusätzlich zur Farbe', type: 'rule', priority: 'must' },
    { text: 'Zustände: Erststart (Einladung „Sparplan anlegen“), leere Ziele, Ausführung bestätigt (Rückgängig), Stress-Szenario mit langen Namen', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Sparplan antippen', result: 'Sparplan-Detail öffnet sich', event: 'plan.open', to: 'savings.plan' },
    { trigger: '„Neuer Plan“ antippen', result: 'Assistent „Sparplan anlegen“ öffnet sich', event: 'plan.create', to: 'savings.create' },
    { trigger: '„Rechner“ antippen', result: 'Rechner mit Reglern und Spanne', event: 'header.secondary', to: 'savings.calculator' },
    { trigger: 'Sparrate oder Wert antippen', result: 'Alle Sparpläne mit Filter', event: 'summary.rate', to: 'savings.plans' },
    { trigger: 'Wert der Sparpläne antippen', result: 'Alle Sparpläne mit Filter', event: 'summary.value', to: 'savings.plans' },
    { trigger: 'Nächste Ausführung antippen', result: 'Ausführungskalender öffnet sich', event: 'summary.next', to: 'savings.calendar' },
    { trigger: 'Ziele im Plan antippen', result: 'Sparziele öffnen sich', event: 'summary.goals', to: 'savings.goals' },
    { trigger: '„Alle Ausführungen“ antippen', result: 'Ausführungskalender öffnet sich', event: 'calendar.open', to: 'savings.calendar' },
    { trigger: '„Alle Ziele“ antippen', result: 'Sparziele öffnen sich', event: 'goals.open', to: 'savings.goals' },
    { trigger: '„Alle Pläne“ antippen', result: 'Alle Sparpläne mit Filter', event: 'plans.open', to: 'savings.plans' },
    { trigger: 'Ausführung antippen', result: 'Sparplan-Detail öffnet sich', event: 'execution.open', to: 'savings.plan' },
    { trigger: 'Hinweis „Deckung ansehen“', result: 'Ausführungskalender mit Deckungs-Check', event: 'hint.coverage', to: 'savings.calendar' },
    { trigger: 'Hinweis „Ziele ansehen“', result: 'Sparziele öffnen sich', event: 'hint.goal', to: 'savings.goals' },
    { trigger: 'Hinweis „Ausführungen“', result: 'Ausführungskalender öffnet sich', event: 'hint.execution', to: 'savings.calendar' },
    { trigger: 'Hinweis „Plan ansehen“', result: 'Sparplan-Detail öffnet sich', event: 'hint.plan', to: 'savings.plan' },
    { trigger: 'Hinweis „Steuern ansehen“', result: 'Freibetrag und Steuern öffnen sich', event: 'hint.tax', to: 'savings.tax' },
    { trigger: 'Ziel antippen', result: 'Dialog mit Prognose und „Rate anpassen“', event: 'goal.open' },
    { trigger: 'Pause-Symbol in der Zeile', result: 'Plan pausiert, Rückgängig erscheint', event: 'plan.toggle' },
    { trigger: 'Haken bei einer Ausführung', result: 'Umbuchung entsteht, Wert und Kontostand aktualisieren sich', event: 'execution.confirm' },
  ],
  acceptance: [
    'Bei 390 px stehen Sparrate, Wert der Sparpläne und nächste Ausführung ohne Scrollen im sichtbaren Bereich.',
    'Pausieren in der Plan-Zeile senkt die Sparrate sofort um die Rate des Plans, „Rückgängig“ stellt sie wieder her.',
    'Eine Ausführung zu bestätigen erzeugt eine Umbuchung (kein Ausgaben-Eintrag) und erhöht Wert und Einstand der Position.',
    'Im Szenario „Erster Start“ erscheint eine Einladung mit „Sparplan anlegen“ statt leerer Flächen.',
    'Mit aktivem Privatmodus enthält die Seite keinen lesbaren Betrag.',
    'Der Plan-Tracker-Satz und der Hinweis „keine Anlageberatung“ sind in jeder Variante sichtbar.',
  ],
  flows: [
    { id: 'fl-plan', name: 'Sparplan prüfen', steps: [{ featureId: 'savings.home', action: 'Plan antippen' }, { featureId: 'savings.plan', action: 'Rate ändern oder pausieren' }, { featureId: 'savings.calculator', action: 'Was wäre wenn?' }] },
    { id: 'fl-neu', name: 'Neuen Sparplan anlegen', steps: [{ featureId: 'savings.home', action: '„Neuer Plan“ antippen' }, { featureId: 'savings.create', action: 'Ziel, Betrag, Anlage wählen und speichern' }, { featureId: 'savings.plan', action: 'Neuen Plan im Detail sehen' }] },
    { id: 'fl-ausfuehrung', name: 'Ausführung bestätigen', steps: [{ featureId: 'savings.home', action: 'Nächste Ausführung antippen' }, { featureId: 'savings.calendar', action: 'Haken bei der Ausführung setzen' }] },
  ],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Pläne und Termine', direction: 'kompakt',
      concept: 'Kennzahlen-Zeile, darunter die Sparpläne als Tabelle mit Rate, nächstem Termin, Wert und Pause-Taste in der Zeile. Seitenspalte mit den nächsten Ausführungen, dem Deckungs-Check und den Zielen.',
      description: '+ Alles auf einen Blick, Aktionen direkt in der Zeile, Zahlen exakt  − Wenig Raum für Diagramme, viele Informationen gleichzeitig',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Sparpläne', subtitle: 'Di, 24.11. · Werte fiktiv, Stand 09:30', primaryLabel: 'Neuer Plan', primaryEvent: 'plan.create', secondaryLabel: 'Rechner', secondaryIcon: 'calculator' }),
        { id: 'sum', component: 'savings-summary', region: 'main', props: { style: 'strip', title: 'Sparen im Überblick' } },
        { id: 'list', component: 'savings-plan-list', region: 'main', props: { style: 'table', title: 'Sparpläne', showTracker: true } },
        { id: 'cal', component: 'execution-calendar', region: 'aside', props: { view: 'list', title: 'Nächste Ausführungen', limit: 3, showTracker: false } },
        { id: 'cov', component: 'coverage-check', region: 'aside', props: { limit: 2, showDetails: false } },
        { id: 'goals', component: 'savings-goal-card', region: 'aside', props: { style: 'list', limit: 3, title: 'Sparziele' } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Vermögen wächst', direction: 'visuell',
      concept: 'Große Karte mit dem Wert der Sparpläne und dem Verhältnis Eingezahlt zu Ertrag, daneben der Depotverlauf. Darunter die nächste Ausführung, die Ziele als Ringe und die Pläne als Karten mit Anteilsbalken. Eine Botschaft pro Karte.',
      description: '+ Fortschritt und Wachstum sofort sichtbar, ruhige Gesamtwirkung  − Mehr Scrollen, weniger Detail pro Plan',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Dein Sparen', subtitle: 'Fiktive Werte, Stand 09:30', primaryLabel: 'Neuer Plan', primaryEvent: 'plan.create' }),
        { id: 'hero', component: 'savings-summary', region: 'main', span: 7, props: { style: 'hero', title: 'Wert deiner Sparpläne' } },
        { id: 'chart', component: 'growth-chart', region: 'main', span: 5, props: { source: 'depot', title: 'Depot, zwölf Monate', height: 220, compact: true } },
        { id: 'next', component: 'execution-calendar', region: 'main', span: 5, props: { view: 'next', title: 'Als Nächstes' } },
        { id: 'goals', component: 'savings-goal-card', region: 'main', span: 7, props: { style: 'cards', title: 'Sparziele' } },
        { id: 'plans', component: 'savings-plan-list', region: 'main', span: 12, props: { style: 'cards', title: 'Deine Pläne', showActions: false } },
        FOOT,
      ],
    },
    {
      id: 'C', name: 'Was steht an?', direction: 'fokus',
      concept: 'Zuerst die nächste Ausführung mit Bestätigung in einem Tap, darunter wenige priorisierte Hinweise (Deckung, Ziele, Termine), das Ziel, das Aufmerksamkeit braucht, und die Kennzahlen schlank.',
      description: '+ Klare nächste Aktion, wenig Ablenkung, Bestätigen ohne Umweg  − Pläne und Verlauf erst über „Alle Pläne“',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Was steht an?', subtitle: 'Di, 24.11.' }),
        { id: 'next', component: 'execution-calendar', region: 'main', props: { view: 'next', title: 'Als Nächstes' } },
        { id: 'hints', component: 'savings-hints', region: 'main', props: { limit: 3, title: 'Wichtig', skip: ['goal'] } },
        { id: 'goal', component: 'savings-goal-card', region: 'main', props: { style: 'hero', title: 'Ziel im Blick' } },
        { id: 'sum', component: 'savings-summary', region: 'main', props: { style: 'strip', title: 'Sparen im Überblick' } },
        { id: 'list', component: 'savings-plan-list', region: 'main', props: { style: 'compact', limit: 4, title: 'Pläne', showTracker: false } },
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.plan', 'savings.goals', 'savings.calendar', 'savings.create', 'savings.calculator'],
  seedHistory: [{ kind: 'draft', note: 'Drei Richtungen: Pläne und Termine, Vermögen wächst, Was steht an?' }, { kind: 'review', note: 'Alle Varianten in drei Themes und vier Breiten geprüft' }],
};

// ================================================================ Alle Sparpläne
const plans = {
  id: 'savings.plans', name: 'Alle Sparpläne', group: 'Pläne', status: 'design', tier: 1,
  purpose: 'Alle Sparpläne an einem Ort: aktiv, pausiert und beendet, mit Filter und Suche. Pausieren, öffnen, neu anlegen.',
  requirements: [
    { text: 'Filter Alle, Aktiv, Pausiert und Suche über Name und Anlage', type: 'action', priority: 'must' },
    { text: 'Je Plan: Rate, Rhythmus, nächste Ausführung, Wert, Ertrag mit Vorzeichen und Pfeil, Status als Text', type: 'info', priority: 'must' },
    { text: 'Pausieren mit Dauer (1, 3, 6 Monate, unbefristet) und Rückgängig; Fortsetzen mit einem Tap', type: 'action', priority: 'must' },
    { text: 'Summenzeile: Anzahl, Sparrate pro Monat, Gesamtwert', type: 'info', priority: 'should' },
    { text: 'Keine Treffer und Erststart haben eigene Zustände mit nächster Aktion', type: 'state', priority: 'must' },
    { text: 'Plan-Tracker-Satz am Ende der Liste', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Plan antippen', result: 'Sparplan-Detail öffnet sich', event: 'plan.open', to: 'savings.plan' },
    { trigger: '„Neu“ antippen', result: 'Assistent „Sparplan anlegen“', event: 'plan.create', to: 'savings.create' },
    { trigger: 'Filterchip wählen', result: 'Liste zeigt nur diesen Status', event: 'filter.change' },
    { trigger: 'Pause-Symbol', result: 'Dauer wählen, Plan pausiert', event: 'plan.toggle' },
  ],
  acceptance: ['Der Filter „Pausiert“ zeigt nur den E-Bike-Plan mit Datum der Wiederaufnahme.', 'Die Summenzeile passt zu den sichtbaren Zeilen.', 'Ohne Treffer erscheint „Kein Sparplan passt zum Filter“.'],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Tabelle mit Filter', direction: 'kompakt',
      concept: 'Filterchips und Suche über einer dichten Tabelle mit Summenzeile. Pausieren in der Zeile.',
      description: '+ Schnell zu finden, Summe sichtbar  − Wenig Visualisierung',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Alle Sparpläne', subtitle: 'Aktiv, pausiert und beendet', primaryLabel: 'Neuer Plan', primaryEvent: 'plan.create' }),
        { id: 'filter', component: 'search-filter', region: 'main', props: { filters: ['Alle', 'Aktiv', 'Pausiert'], placeholder: 'Plan oder Anlage suchen …' } },
        { id: 'list', component: 'savings-plan-list', region: 'main', props: { style: 'table', title: 'Sparpläne', respectFilter: true } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Karten mit Anteilen', direction: 'visuell',
      concept: 'Pläne als Karten mit großer Rate; ein Balken zeigt, wie sich der Monatsbetrag verteilt.',
      description: '+ Verteilung auf einen Blick, ruhig  − Weniger Pläne pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Deine Sparpläne', subtitle: 'So verteilt sich dein Monatsbetrag', primaryLabel: 'Neuer Plan', primaryEvent: 'plan.create' }),
        { id: 'filter', component: 'search-filter', region: 'main', props: { filters: ['Alle', 'Aktiv', 'Pausiert'], showSearch: false } },
        { id: 'list', component: 'savings-plan-list', region: 'main', props: { style: 'cards', title: 'Sparpläne', respectFilter: true, showActions: false } },
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.home', 'savings.plan', 'savings.create'],
};

// ================================================================ Sparplan-Detail
const plan = {
  id: 'savings.plan', name: 'Sparplan-Detail', group: 'Pläne', status: 'design', tier: 2,
  purpose: 'Ein Sparplan im Detail: Einzahlungen gegen Wert, Rendite, kommende und ausgeführte Ausführungen, und die Aktionen Pausieren, Rate ändern, Dynamik. Von hier geht es in den Rechner und zum Wertpapier.',
  requirements: [
    { text: 'Eingezahlt, Wert, Ertrag (mit Vorzeichen und Pfeil) und geschätzte Rendite p. a. (Modell) sind sichtbar', type: 'info', priority: 'must' },
    { text: 'Diagramm Einzahlungen gegen Wert seit Start; Ausblick +5, +10, +20 Jahre mit Spanne Annahme ± 2 PP, Annahme genannt', type: 'info', priority: 'must' },
    { text: 'Kommende Ausführungen mit Hinweis bei Verschiebung (Wochenende, Feiertag); ausgeführte als Umbuchungen', type: 'info', priority: 'must' },
    { text: 'Rate ändern (gilt ab nächster Ausführung), Pausieren mit Dauer, Dynamik 0/2/3/5 % mit Rückmeldung', type: 'action', priority: 'must' },
    { text: 'Ratensteigerung angekündigt: „Die Rate steigt am 01.03. von 300 € auf 309 €“', type: 'info', priority: 'should' },
    { text: 'Von Wertpapier-Plänen führt „Wertpapier“ zum Detail im Trading; „Was wäre wenn?“ übergibt Rate und Wert an den Rechner', type: 'action', priority: 'must' },
    { text: 'Hinweise: „Modellrechnung“ am Diagramm, „keine Anlageberatung“ als Fuß, Plan-Tracker-Satz', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: '„Was wäre wenn?“ antippen', result: 'Rechner öffnet sich mit Rate, Wert und Rendite des Plans', event: 'calculator.open', to: 'savings.calculator' },
    { trigger: 'Wertpapier antippen', result: 'Wertpapier-Detail im Trading', event: 'position.open', to: 'trading.detail' },
    { trigger: 'Rate ändern', result: 'Dialog mit Schritten, Rate gilt ab nächster Ausführung', event: 'plan.rate' },
    { trigger: 'Pausieren oder Fortsetzen', result: 'Plan pausiert mit Dauer, Rückmeldung', event: 'plan.toggle' },
    { trigger: 'Dynamik wählen', result: 'Ratensteigerung gesetzt', event: 'plan.dynamic' },
    { trigger: 'Ausblick wählen', result: 'Diagramm zeigt +5, +10 oder +20 Jahre mit Spanne', event: 'chart.outlook' },
    { trigger: 'Anderen Plan in der Liste wählen', result: 'Detail wechselt zum gewählten Plan', event: 'plan.open' },
    { trigger: '„Sparplan anlegen“ ohne Plan', result: 'Assistent öffnet sich', event: 'plan.create', to: 'savings.create' },
  ],
  acceptance: [
    'Rate ändern aktualisiert Liste, Übersicht und nächste Ausführung ohne Neuladen.',
    'Beim Ausblick sind Annahme und Spanne im Diagramm beschriftet; der Wert wird nie als einzelne Zahl versprochen.',
    'Bei einem Plan mit Wertpapier öffnet „Wertpapier“ das Detail im Trading.',
    'Pausieren zeigt das Datum der Wiederaufnahme im Status.',
  ],
  flows: [{ id: 'fl-rate', name: 'Rate anpassen', steps: [{ featureId: 'savings.plan', action: 'Rate ändern' }, { featureId: 'savings.calculator', action: 'Was wäre wenn?' }, { featureId: 'savings.plan', action: 'Zurück, Rate speichern' }] }],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Detail mit Planliste', direction: 'kompakt',
      concept: 'Master-Detail: links Kennzahlen als Liste, Verlaufsdiagramm und Ausführungen, rechts die Planliste zum Wechseln.',
      description: '+ Schnell zwischen Plänen wechseln, Zahlen exakt  − Mobil rutscht die Liste unter den Inhalt',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Sparplan', subtitle: 'Einzahlungen, Wert und Ausführungen' }),
        { id: 'det', component: 'savings-plan-detail', region: 'main', props: { style: 'dense' } },
        { id: 'chart', component: 'growth-chart', region: 'main', props: { source: 'plan', title: 'Einzahlungen und Wert', outlook: 0, height: 240 } },
        MODEL('main', 'inline'),
        { id: 'exec', component: 'execution-list', region: 'main', props: { upcoming: 4, past: 3 } },
        { id: 'list', component: 'savings-plan-list', region: 'aside', props: { style: 'compact', title: 'Pläne', selectable: true, showTracker: false } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Wert im Mittelpunkt', direction: 'visuell',
      concept: 'Große Karte mit Wert, Ertrag und Ring, darunter das Diagramm mit Ausblick und Spanne, daneben die Ausführungen.',
      description: '+ Wachstum und Ausblick auf einen Blick  − Aktionen weiter unten',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Dein Sparplan', subtitle: 'Wie er sich entwickelt' }),
        { id: 'det', component: 'savings-plan-detail', region: 'main', span: 12, props: { style: 'hero' } },
        { id: 'chart', component: 'growth-chart', region: 'main', span: 8, props: { source: 'plan', title: 'Verlauf und Ausblick', outlook: 10, height: 280 } },
        { id: 'exec', component: 'execution-list', region: 'main', span: 4, props: { upcoming: 4, past: 3 } },
        MODEL('main', 'inline', { span: 12 }),
        FOOT,
      ],
    },
    {
      id: 'C', name: 'Was kann ich tun?', direction: 'fokus',
      concept: 'Nächste Ausführung und Wert oben, dann die Aktionen als Liste (Rate, Pause, Dynamik, Was wäre wenn?), darunter ein kleines Diagramm und die Termine.',
      description: '+ Aktionen sofort erreichbar  − Verlauf nur klein',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Sparplan', subtitle: 'Was möchtest du tun?' }),
        { id: 'det', component: 'savings-plan-detail', region: 'main', props: { style: 'actions' } },
        { id: 'chart', component: 'growth-chart', region: 'main', props: { source: 'plan', title: 'Verlauf', outlook: 0, height: 180, switcher: false, compact: true } },
        MODEL('main', 'inline'),
        { id: 'exec', component: 'execution-list', region: 'main', props: { upcoming: 3, past: 2 } },
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.home', 'savings.calculator', 'trading.detail'],
};

// ================================================================ Sparplan anlegen
const create = {
  id: 'savings.create', name: 'Sparplan anlegen', group: 'Pläne', status: 'design', tier: 2,
  purpose: 'Einen Sparplan in vier Schritten anlegen: Ziel, Betrag und Rhythmus, Anlage, Übersicht. Mit Prüfung, Deckungs-Hinweis und Modellrechnung. TAKT führt den Plan nicht aus, es erinnert und gleicht ab.',
  requirements: [
    { text: 'Schritte Ziel, Betrag und Rhythmus, Anlage, Übersicht; „Weiter“ erst nach gültigen Angaben, „Zurück“ verliert nichts', type: 'rule', priority: 'must' },
    { text: 'Ziel: vorhandenes wählen, neues anlegen (Name, Betrag, Datum) oder ohne Ziel', type: 'action', priority: 'must' },
    { text: 'Betrag ab 10 €, Rhythmus monatlich bis jährlich, Ausführungstag 1 bis 28, Start nicht in der Vergangenheit, optional Ratensteigerung', type: 'rule', priority: 'must' },
    { text: 'Deckungs-Hinweis, wenn das Konto für die erste Ausführung nicht reicht (ruhig, kein Alarm)', type: 'state', priority: 'should' },
    { text: 'Anlage: Wertpapiere und Konten alphabetisch, mit Kosten und Risikoklasse als Information, ohne Empfehlung', type: 'info', priority: 'must' },
    { text: 'Übersicht mit Termin, Kosten und Modellrechnung als Spanne; Pflichtsatz Plan-Tracker; „keine Anlageberatung“', type: 'rule', priority: 'must' },
    { text: 'Gespeicherter Plan erscheint sofort in Übersicht, Liste und Ausführungskalender', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Plan speichern', result: 'Sparplan-Detail des neuen Plans öffnet sich', event: 'plan.created', to: 'savings.plan' },
    { trigger: '„Zum Sparplan“ antippen', result: 'Sparplan-Detail öffnet sich', event: 'plan.open', to: 'savings.plan' },
    { trigger: '„Weiter“ mit ungültiger Eingabe', result: 'Fehlermeldung am Feld, kein Wechsel', event: 'form.invalid' },
    { trigger: 'Schritt wechseln', result: 'Schritt wird gezeigt, Eingaben bleiben', event: 'wizard.step' },
  ],
  acceptance: [
    '„Weiter“ ohne Namen beim neuen Ziel zeigt „Gib dem Ziel einen Namen …“ am Feld und bleibt im Schritt.',
    'Nach dem Speichern steht der Plan in „Alle Sparpläne“ und im Ausführungskalender mit korrektem Termin.',
    'Die Übersicht zeigt eine Spanne („zwischen … und …“) mit genannter Annahme, nie einen Einzelwert.',
    'Das Ergebnis enthält den Satz „Dieser Sparplan wird nicht von TAKT ausgeführt …“.',
  ],
  flows: [{ id: 'fl-anlegen', name: 'Plan für ein neues Ziel', steps: [{ featureId: 'savings.goals', action: '„Ziel“ antippen' }, { featureId: 'savings.create', action: 'Neues Ziel, Rate, Anlage, speichern' }, { featureId: 'savings.plan', action: 'Plan im Detail' }] }],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Eine Seite mit Übersicht', direction: 'kompakt',
      concept: 'Alle Abschnitte untereinander, die Übersicht mit Modellrechnung steht daneben und rechnet live mit.',
      description: '+ Alles sichtbar, schnell für Geübte  − Auf Mobile länger',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Sparplan anlegen', subtitle: 'Ziel, Betrag, Anlage' }),
        { id: 'wiz', component: 'savings-wizard', region: 'main', props: { mode: 'single', title: 'Neuer Sparplan' } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Schritt für Schritt', direction: 'fokus',
      concept: 'Vier Schritte mit je einer Frage, Prüfung vor „Weiter“ und einer Übersicht zum Schluss.',
      description: '+ Eine Entscheidung pro Schritt, klare Führung  − Mehr Taps',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Sparplan anlegen', subtitle: 'In vier Schritten' }),
        { id: 'wiz', component: 'savings-wizard', region: 'main', props: { mode: 'steps', title: 'Neuer Sparplan' } },
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'B',
  links: ['savings.plan', 'savings.goals'],
};

// ================================================================ Rechner
const calculator = {
  id: 'savings.calculator', name: 'Rechner & Szenarien', group: 'Werkzeuge', status: 'review', tier: 1,
  purpose: 'Verstehen, was regelmäßiges Sparen über die Zeit bewirkt und welche Rate ein Ziel braucht. Regler für Rate, Dauer, Rendite-Annahme, Kosten und Ratensteigerung; das Ergebnis immer als Spanne (Annahme ± 2 Prozentpunkte), nie als Versprechen.',
  requirements: [
    { text: 'Regler und Direkteingabe für Startbetrag, Monatsrate, Laufzeit, Rendite-Annahme, Kosten (TER) und Ratensteigerung; Ergebnis aktualisiert sich sofort', type: 'action', priority: 'must' },
    { text: 'Kurve „Eingezahlt gegen Wert“ mit Ertrag als Fläche und Spanne vorsichtig, Annahme, zuversichtlich; Tooltip mit Werten je Zeitpunkt', type: 'info', priority: 'must' },
    { text: 'Ergebnis als Bereich („zwischen … und …“) im Konjunktiv, Einzahlungen und Erträge getrennt, Meilensteine („100.000 € nach …“)', type: 'rule', priority: 'must' },
    { text: 'Konvention und Stand genannt: „Rendite p. a. nach Kosten, monatlich umgerechnet, Einzahlung am Monatsende, Stand 24.11.2026“', type: 'rule', priority: 'must' },
    { text: 'Optionen: heutige Kaufkraft (Inflation 2 %) und Steuer-Schätzung (vereinfacht)', type: 'action', priority: 'should' },
    { text: 'Zielrechner rückwärts: Zielbetrag, Zeit, vorhandenes Geld → nötige Rate als Spanne, Alternativen mit mehr oder weniger Zeit', type: 'action', priority: 'must' },
    { text: 'Hinweise „Modellrechnung“ direkt am Ergebnis und „keine Anlageberatung“ als Fuß', type: 'rule', priority: 'must' },
    { text: 'Von hier zu „Szenarien vergleichen“ und „Als Sparplan anlegen“ mit übernommener Rate', type: 'action', priority: 'should' },
  ],
  interactions: [
    { trigger: 'Regler verschieben oder Wert eingeben', result: 'Diagramm, Ergebnis und Tabelle rechnen neu', event: 'calc.change' },
    { trigger: 'Rendite-Annahme 3, 5 oder 7 % wählen', result: 'Annahme gesetzt, Spanne ± 2 PP', event: 'calc.preset' },
    { trigger: 'Optionen Inflation oder Steuer', result: 'Ergebnis in heutiger Kaufkraft bzw. nach Steuern (Schätzung)', event: 'calc.option' },
    { trigger: 'Werte aus Sparplan übernehmen', result: 'Rate, Wert, Rendite und Dynamik des Plans', event: 'calc.source' },
    { trigger: '„Szenarien vergleichen“ antippen', result: 'Vergleich öffnet sich mit den aktuellen Werten', event: 'compare.open', to: 'savings.compare' },
    { trigger: '„Als Sparplan anlegen“ antippen', result: 'Assistent öffnet sich mit der Rate', event: 'calc.create', to: 'savings.create' },
    { trigger: 'Ziel eingeben oder übernehmen', result: 'Nötige Rate wird berechnet', event: 'goalcalc.change' },
    { trigger: 'Jahre der Tabelle aufklappen', result: 'Alle Jahre sichtbar', event: 'table.expand' },
  ],
  acceptance: [
    'Mit Startbetrag 10.000 €, Rate 300 €, Annahme 5 % und 20 Jahren zeigt der Rechner einen Bereich und nennt die drei Annahmen 3, 5 und 7 %.',
    'Bei 0 % Rendite und 0 % Kosten ist der Wert exakt die Summe der Einzahlungen.',
    'Das Ergebnis nennt Einzahlungen und Ertrag getrennt und enthält „Kein Versprechen, keine Prognose“.',
    'Alle Regler sind auf 360 px bedienbar (Touch-Fläche mindestens 44 px).',
    'Der Zielrechner nennt für 50.000 € in 10 Jahren bei 5 % eine Rate als Spanne und die Alternativen „ohne Rendite“ sowie ±2 Jahre.',
  ],
  flows: [
    { id: 'fl-rechner', name: 'Wachstum verstehen', steps: [{ featureId: 'savings.calculator', action: 'Regler bewegen' }, { featureId: 'savings.compare', action: 'Szenarien vergleichen' }] },
    { id: 'fl-ziel', name: 'Rate für ein Ziel finden', steps: [{ featureId: 'savings.calculator', action: 'Zielrechner nutzen' }, { featureId: 'savings.create', action: 'Als Sparplan anlegen' }] },
  ],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Regler-Cockpit', direction: 'kompakt',
      concept: 'Regler in der Seitenleiste, rechts Ergebnis-Tabelle, Kurve und Jahrestabelle. Alles gleichzeitig sichtbar.',
      description: '+ Ursache und Wirkung nebeneinander, Zahlen exakt  − Auf Mobile klappen die Regler auf',
      layout: { type: 'sidebar', panelLabel: 'Eingaben' },
      blocks: [
        hdr({ title: 'Rechner', subtitle: 'Modellrechnung mit Spanne' }),
        { id: 'sl', component: 'savings-sliders', region: 'panel', props: { title: 'Eingaben' } },
        { id: 'res', component: 'savings-result', region: 'main', props: { style: 'compact' } },
        { id: 'chart', component: 'growth-chart', region: 'main', props: { source: 'calc', height: 240 } },
        MODEL('main', 'inline'),
        { id: 'tbl', component: 'savings-table', region: 'main', props: { maxRows: 8 } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Kurve zuerst', direction: 'visuell',
      concept: 'Die große Wachstumskurve mit Spanne oben, darunter das Ergebnis in drei Karten und die Regler als ruhige Karte.',
      description: '+ Wirkung sofort sichtbar, eine Botschaft pro Karte  − Regler liegen unter der Kurve',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'So könnte es wachsen', subtitle: 'Annahme mit Spanne, kein Versprechen' }),
        { id: 'chart', component: 'growth-chart', region: 'main', props: { source: 'calc', title: 'Eingezahlt und Wert', height: 320 } },
        MODEL('main', 'inline'),
        { id: 'res', component: 'savings-result', region: 'main', props: { style: 'cards' } },
        { id: 'sl', component: 'savings-sliders', region: 'main', props: { title: 'Eingaben anpassen', columns: '2' } },
        FOOT,
      ],
    },
    {
      id: 'C', name: 'Zielrechner', direction: 'fokus',
      concept: 'Rückwärts gedacht: „Ich möchte X in Y Jahren“. Die nötige Rate steht groß oben, Alternativen darunter, die Kurve zeigt den Weg.',
      description: '+ Beantwortet die eigentliche Frage direkt  − Weniger Feinjustierung',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Was brauche ich?', subtitle: 'Vom Ziel zur Monatsrate' }),
        { id: 'goalcalc', component: 'goal-calculator', region: 'main', props: { title: 'Mein Ziel' } },
        { id: 'chart', component: 'growth-chart', region: 'main', props: { source: 'calc', title: 'Der Weg dorthin', height: 220, compact: true } },
        MODEL('main', 'inline'),
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.compare', 'savings.create', 'savings.plan'],
};

// ================================================================ Sparziele
const goals = {
  id: 'savings.goals', name: 'Sparziele', group: 'Pläne', status: 'design', tier: 1,
  purpose: 'Ziele mit Betrag und Datum, Fortschritt und ehrlicher Prognose: wann wird das Ziel erreicht, wie viel Rate wäre nötig. Rate anpassen und neue Ziele anlegen.',
  requirements: [
    { text: 'Je Ziel: Fortschritt als Balken oder Ring mit Prozent und Betrag, Zieldatum, Rate, Status als Text (Im Plan, Hinterher, Ohne Rate, Erreicht)', type: 'info', priority: 'must' },
    { text: 'Prognose als Satz: „Voraussichtlich erreicht im …“ bzw. „Bis … wären etwa … pro Monat nötig“, im Konjunktiv und mit Annahme', type: 'rule', priority: 'must' },
    { text: 'Dialog mit Dauer bis zum Ziel in drei Annahmen und Meilensteinen 25, 50, 75, 100 %', type: 'info', priority: 'should' },
    { text: 'Rate anpassen mit Live-Prognose; bei genau einem aktiven Plan wird dessen Rate mitgeführt', type: 'action', priority: 'must' },
    { text: 'Pausierte Ziele nennen das Datum der Wiederaufnahme', type: 'state', priority: 'should' },
    { text: 'Neues Ziel führt in den Assistenten; Erststart zeigt eine Einladung', type: 'action', priority: 'must' },
    { text: 'Hinweis „Modellrechnung“ und „keine Anlageberatung“', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: '„Ziel“ oder „Neues Ziel“ antippen', result: 'Assistent öffnet sich mit neuem Ziel', event: 'goal.create', to: 'savings.create' },
    { trigger: 'Ziel antippen', result: 'Dialog mit Prognose und „Rate anpassen“', event: 'goal.open' },
    { trigger: 'Rate speichern', result: 'Rate und Prognose aktualisieren sich', event: 'goal.rate' },
    { trigger: '„Sparplan anlegen“ beim Ziel ohne Rate', result: 'Assistent öffnet sich mit nötiger Rate', event: 'plan.create', to: 'savings.create' },
    { trigger: 'Hinweis „Ziele ansehen“', result: 'Ziele bleiben im Blick', event: 'hint.goal' },
    { trigger: 'Hinweis „Plan ansehen“', result: 'Sparplan-Detail öffnet sich', event: 'hint.plan', to: 'savings.plan' },
    { trigger: 'Hinweis „Deckung ansehen“', result: 'Ausführungskalender öffnet sich', event: 'hint.coverage', to: 'savings.calendar' },
  ],
  acceptance: [
    'Das Ziel „Japan-Reise 2027“ ohne Rate zeigt den Status „Ohne Rate“ und die nötige Rate bis 01.09.2027.',
    'Rate anpassen zeigt die neue Prognose, bevor gespeichert wird.',
    'Der Status ist nie nur Farbe: Text und Symbol stehen dabei.',
    'Im Szenario „Erster Start“ erscheint „Noch kein Sparziel“ mit „Ziel anlegen“.',
  ],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Liste mit Prognose', direction: 'kompakt',
      concept: 'Zeilen mit Balken, Betrag, Datum, Status und Prognose; daneben Hinweise.',
      description: '+ Alle Ziele vergleichbar, Zahlen exakt  − Wenig Emotion',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Sparziele', subtitle: 'Fortschritt und Prognose', primaryLabel: 'Neues Ziel', primaryEvent: 'goal.create' }),
        { id: 'goals', component: 'savings-goal-card', region: 'main', props: { style: 'list', title: 'Ziele' } },
        MODEL('main', 'inline'),
        { id: 'hints', component: 'savings-hints', region: 'aside', props: { limit: 3, title: 'Hinweise' } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Ringe und Verlauf', direction: 'visuell',
      concept: 'Jedes Ziel als Karte mit Ring und einem Satz Prognose, darunter der Depotverlauf und Hinweise.',
      description: '+ Fortschritt auf einen Blick  − Weniger Details pro Ziel',
      layout: { type: 'grid' },
      blocks: [
        hdr({ title: 'Deine Sparziele', subtitle: 'Wie weit du bist', primaryLabel: 'Neues Ziel', primaryEvent: 'goal.create' }),
        { id: 'goals', component: 'savings-goal-card', region: 'main', span: 12, props: { style: 'cards', title: 'Ziele' } },
        { id: 'chart', component: 'growth-chart', region: 'main', span: 7, props: { source: 'depot', title: 'Depot, zwölf Monate', height: 220, compact: true } },
        { id: 'hints', component: 'savings-hints', region: 'main', span: 5, props: { limit: 3, title: 'Hinweise' } },
        MODEL('main', 'inline', { span: 12 }),
        FOOT,
      ],
    },
    {
      id: 'C', name: 'Ziel im Fokus', direction: 'fokus',
      concept: 'Das Ziel, das Aufmerksamkeit braucht, groß mit Satz und einer Aktion; die übrigen Ziele darunter als Liste.',
      description: '+ Klare nächste Handlung  − Übrige Ziele treten zurück',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Ziele', subtitle: 'Was braucht Aufmerksamkeit?' }),
        { id: 'hero', component: 'savings-goal-card', region: 'main', props: { style: 'hero', title: 'Im Fokus' } },
        { id: 'goals', component: 'savings-goal-card', region: 'main', props: { style: 'list', title: 'Alle Ziele' } },
        MODEL('main', 'inline'),
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.create', 'savings.plan', 'savings.calculator'],
};

// ================================================================ Ausführungskalender
const calendar = {
  id: 'savings.calendar', name: 'Ausführungen', group: 'Pläne', status: 'design', tier: 2,
  purpose: 'Wann wird welcher Sparplan ausgeführt, und reicht das Girokonto dafür? Termine mit Verschiebung auf Handelstage, Deckungs-Check mit Puffer und manuelles Bestätigen (daraus entsteht eine Umbuchung).',
  requirements: [
    { text: 'Kommende Ausführungen nach Tagen (Liste) oder im Monatsraster mit Markern; heute, geplant und ausgeführt unterscheidbar ohne Farbe allein', type: 'info', priority: 'must' },
    { text: 'Fällt ein Termin auf Wochenende oder Feiertag, wird auf den nächsten Handelstag verschoben und der Hinweis „verschoben vom …“ gezeigt', type: 'rule', priority: 'must' },
    { text: 'Deckungs-Check je Ausführungstag: Gedeckt, Knapp, Deckung fehlt mit Betrag; Puffer wählbar; „Wie berechnet?“ zeigt Kontostand, Fixkosten, Sparraten, Einkommen', type: 'info', priority: 'must' },
    { text: 'Ausführung manuell bestätigen: Umbuchung Konto → Depot/Tagesgeld, Position und Kontostände aktualisieren sich; Rückgängig', type: 'action', priority: 'must' },
    { text: 'Pflichtsatz Plan-Tracker und „keine Anlageberatung“; im Leerzustand Einladung zum ersten Plan', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Ausführung antippen', result: 'Sparplan-Detail öffnet sich', event: 'execution.open', to: 'savings.plan' },
    { trigger: 'Haken bei einer Ausführung', result: 'Umbuchung, Hinweis mit Rückgängig', event: 'execution.confirm' },
    { trigger: 'Tag im Raster wählen', result: 'Ausführungen des Tages darunter', event: 'calendar.day' },
    { trigger: 'Puffer wählen', result: 'Deckungs-Check rechnet neu', event: 'coverage.buffer' },
    { trigger: 'Hinweis „Plan ansehen“', result: 'Sparplan-Detail öffnet sich', event: 'hint.plan', to: 'savings.plan' },
    { trigger: '„Sparplan anlegen“ im Leerzustand', result: 'Assistent öffnet sich', event: 'plan.create', to: 'savings.create' },
  ],
  acceptance: [
    'Der 01.01.2027 (Neujahr) wird für alle Pläne auf Montag, 04.01.2027 verschoben und mit „verschoben vom 01.01.“ gekennzeichnet.',
    'Mit Puffer 2.500 € zeigt der Deckungs-Check am 01.12. „Deckung fehlt“ mit dem fehlenden Betrag, mit 1.000 € „Gedeckt“.',
    'Eine bestätigte Ausführung verschwindet aus „geplant“, erscheint als „ausgeführt“ und „Rückgängig“ stellt alles wieder her.',
    'Das Monatsraster ist auf 360 px ohne Überlauf bedienbar, Marker sind Punkte statt Text.',
  ],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Liste mit Deckung', direction: 'kompakt',
      concept: 'Ausführungen als Liste nach Tagen mit Deckungs-Badge und Haken in der Zeile; daneben der Deckungs-Check mit Herleitung.',
      description: '+ Termine, Deckung und Bestätigen zusammen  − Kein Gefühl für den Monat',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Ausführungen', subtitle: 'Nächste 6 Monate · Handelstage' }),
        { id: 'cal', component: 'execution-calendar', region: 'main', props: { view: 'list', title: 'Termine', months: 6, showPast: true } },
        { id: 'cov', component: 'coverage-check', region: 'aside', props: { limit: 4, title: 'Deckung Girokonto' } },
        { id: 'hints', component: 'savings-hints', region: 'aside', props: { limit: 2, title: 'Hinweise' } },
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Monatsraster', direction: 'visuell',
      concept: 'Monatsraster mit Punkten je Ausführung (ausgeführt als Ring), Tagesliste darunter, Deckung im Anschluss.',
      description: '+ Verteilung über den Monat sichtbar  − Weniger Text pro Termin',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Ausführungen', subtitle: 'Monat für Monat' }),
        { id: 'cal', component: 'execution-calendar', region: 'main', props: { view: 'month', title: 'Kalender' } },
        { id: 'cov', component: 'coverage-check', region: 'main', props: { limit: 3, title: 'Deckung Girokonto' } },
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.plan', 'savings.home'],
};

// ================================================================ Steuern
const tax = {
  id: 'savings.tax', name: 'Steuern & Freistellungsauftrag', group: 'Werkzeuge', status: 'design', tier: 2,
  purpose: 'Orientierung zu Sparer-Pauschbetrag, Freistellungsauftrag und Teilfreistellung: wie viel ist noch frei und was würde auf einen Gewinn anfallen. Annahmen mit Stand, keine Steuerberatung.',
  requirements: [
    { text: 'Sparer-Pauschbetrag (Einzeln 1.000 €, Zusammen 2.000 €) mit Auslastung und „noch frei“; Stand der Annahmen genannt', type: 'info', priority: 'must' },
    { text: 'Freistellungsauftrag ändern mit Prüfung: nicht über dem Pauschbetrag, nicht unter dem bereits genutzten Betrag', type: 'rule', priority: 'must' },
    { text: 'Schätzung: Gewinn und Art der Anlage eingeben, Herleitung Gewinn → Teilfreistellung 30 % → freier Betrag → 26,375 % sichtbar', type: 'action', priority: 'must' },
    { text: 'Beispielrechnung je Position „wenn verkauft würde“, ausdrücklich ohne Verkauf', type: 'info', priority: 'should' },
    { text: 'Hinweis Steuer: „Steuer-Orientierung, keine Steuerberatung“ und „Annahme, vor Veröffentlichung prüfen“; Parameter nur aus dem Rechenkern', type: 'rule', priority: 'must' },
    { text: 'Vorabpauschale, Kirchensteuer und Verlusttöpfe sind nicht berechnet und im Hinweis benannt', type: 'rule', priority: 'should' },
  ],
  interactions: [
    { trigger: 'Veranlagung wählen', result: 'Pauschbetrag 1.000 € oder 2.000 €', event: 'tax.kind' },
    { trigger: 'Freistellungsauftrag ändern', result: 'Auftrag gespeichert, Auslastung aktualisiert', event: 'tax.order' },
    { trigger: 'Gewinn eingeben', result: 'Steuer-Schätzung rechnet neu', event: 'tax.estimate' },
  ],
  acceptance: [
    'Referenz: Für 1.500 € Gewinn bei einem Aktienfonds, 30 % Teilfreistellung und 1.000 € freiem Betrag wären es 13,19 € Steuer; mit den 687,60 € der Demo-Welt zeigt die Schätzung 95,58 €.',
    'Ein Freistellungsauftrag über dem Pauschbetrag blockiert das Speichern mit klarer Meldung.',
    'Der Hinweis „keine Steuerberatung“ und der Stand der Annahmen sind ohne Scrollen am Ergebnis erreichbar.',
  ],
  viewports: ALL_VP, demoData: { ...WORLD },
  variants: [
    {
      id: 'A', name: 'Freibetrag und Schätzung', direction: 'visuell',
      concept: 'Eine Karte mit Ring für den Freibetrag, darunter die Schätzung mit Herleitung und die Beispielrechnung je Position.',
      description: '+ Ein Blick, klare Herleitung  − Lang auf Mobile',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Steuern', subtitle: 'Freibetrag und Schätzung' }),
        { id: 'tax', component: 'tax-allowance', region: 'main', props: { part: 'all', title: 'Sparer-Pauschbetrag' } },
        TAXN('main', 'card'),
        FOOT,
      ],
    },
    {
      id: 'B', name: 'Schätzung zuerst', direction: 'kompakt',
      concept: 'Hauptspalte mit Schätzung und Beispielrechnung, Seitenspalte mit dem Freibetrag.',
      description: '+ Rechnen und Freibetrag nebeneinander  − Auf Mobile untereinander',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Steuern', subtitle: 'Orientierung, keine Beratung' }),
        { id: 'est', component: 'tax-allowance', region: 'main', props: { part: 'estimate', title: 'Schätzung' } },
        { id: 'pos', component: 'tax-allowance', region: 'main', props: { part: 'positions', title: 'Beispielrechnung je Position' } },
        { id: 'allow', component: 'tax-allowance', region: 'aside', props: { part: 'allowance', title: 'Sparer-Pauschbetrag' } },
        TAXN('main', 'card'),
        FOOT,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['savings.home', 'trading.detail'],
};

// ================================================================ Szenarien vergleichen
const compare = {
  id: 'savings.compare', name: 'Szenarien vergleichen', group: 'Werkzeuge', status: 'design', tier: 3,
  purpose: 'Bis zu vier Szenarien nebeneinander: mehr Rate, längere Laufzeit, Ratensteigerung. Linien, Tabelle und der Unterschied zum ersten Szenario.',
  requirements: [
    { text: 'Bis zu vier Szenarien mit Name, Rate, Startbetrag, Laufzeit, Rendite-Annahme, Ratensteigerung; Bearbeiten ausklappbar', type: 'action', priority: 'must' },
    { text: 'Gemeinsames Diagramm mit je einer Linie; Unterscheidung nicht nur über Farbe (Linienart und Legende)', type: 'info', priority: 'must' },
    { text: 'Je Szenario Eingezahlt, Spanne und Wert bei der Annahme; Unterschied zum ersten Szenario mit Vorzeichen und Pfeil', type: 'info', priority: 'must' },
    { text: 'Duplizieren, Entfernen mit Rückgängig; Übernahme der Rechner-Werte als Szenario', type: 'action', priority: 'should' },
    { text: 'Hinweis „Modellrechnung, kein Versprechen“', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Szenario hinzufügen', result: 'Neues Szenario als Kopie des ersten', event: 'compare.add' },
    { trigger: 'Wert ändern', result: 'Linie, Tabelle und Unterschied aktualisieren sich', event: 'compare.change' },
    { trigger: 'Szenario entfernen', result: 'Szenario weg, Rückgängig erscheint', event: 'compare.remove' },
  ],
  acceptance: ['Ein Szenario mit 450 € Rate zeigt gegenüber 300 € den Unterschied in Euro mit Pfeil.', 'Maximal vier Szenarien, „Szenario“ ist danach deaktiviert.', 'Linien sind auch in Graustufen über Strichart unterscheidbar.'],
  viewports: ALL_VP,
  demoData: { scenarios: [
    { id: 'sc1', name: 'Basis', monthly: 300, initial: 10000, years: 20, ratePa: 0.05, costPa: 0.002, dynamicPa: 0 },
    { id: 'sc2', name: 'Mehr sparen', monthly: 450, initial: 10000, years: 20, ratePa: 0.05, costPa: 0.002, dynamicPa: 0 },
    { id: 'sc3', name: 'Mit Ratensteigerung', monthly: 300, initial: 10000, years: 20, ratePa: 0.05, costPa: 0.002, dynamicPa: 0.03 },
  ] },
  variants: [{
    id: 'A', name: 'Linien und Karten', direction: 'visuell',
    concept: 'Gemeinsames Diagramm oben, darunter je Szenario eine Karte mit Zahlen und ausklappbarem Editor.',
    description: '+ Vergleich auf einen Blick, direkt bearbeitbar  − Viel Inhalt auf Mobile',
    layout: { type: 'stack' },
    blocks: [
      hdr({ title: 'Szenarien vergleichen', subtitle: 'Was ändert sich, wenn …?' }),
      { id: 'cmp', component: 'savings-compare', region: 'main', props: { title: 'Szenarien im Vergleich', height: 260 } },
      MODEL('main', 'inline'),
      FOOT,
    ],
  }],
  selectedVariantId: 'A',
  links: ['savings.calculator'],
};

// ================================================================ Skizzen (noch ohne Design)
const withdrawal = {
  id: 'savings.withdrawal', name: 'Entnahmeplan', group: 'Werkzeuge', status: 'not_analyzed', tier: 3,
  purpose: 'Rechnen, wie lange ein Kapital bei einer monatlichen Entnahme reicht (Modellrechnung). Kein Ersatz für Beratung.',
  requirements: [
    { text: 'Eingaben: Kapital, monatliche Entnahme, Rendite-Annahme mit Spanne, Inflation, Dauer', type: 'action', priority: 'must' },
    { text: 'Ergebnis: Kapitalverlauf mit Ende-Zeitpunkt oder „reicht dauerhaft“; Spanne vorsichtig bis zuversichtlich', type: 'info', priority: 'must' },
    { text: 'Zustände: Kapital reicht nicht, Kapital reicht dauerhaft; Hinweise „Modellrechnung“ und „keine Anlageberatung“', type: 'state', priority: 'must' },
    { text: 'Nutzt das Wachstumsdiagramm und den Rechenkern; Referenzfall 0 % Rendite endet nach Kapital geteilt durch Entnahme', type: 'rule', priority: 'should' },
  ],
  interactions: [], viewports: ALL_VP, demoData: { ...WORLD }, variants: [], links: ['savings.calculator'],
};
const assumptions = {
  id: 'savings.assumptions', name: 'Annahmen & Einstellungen', group: 'Werkzeuge', status: 'not_analyzed', tier: 3,
  purpose: 'Standard-Annahmen des Moduls an einer Stelle: Rendite-Spanne, Inflation, Steuerparameter mit Stand, Erinnerungen vor Ausführungen.',
  requirements: [
    { text: 'Rendite-Annahme und Spannweite (Standard 5 % ± 2 PP) änderbar, mit Stand-Datum', type: 'action', priority: 'must' },
    { text: 'Steuerparameter (Stand) lesbar, Änderung nur über Update des Rechenkerns', type: 'rule', priority: 'must' },
    { text: 'Erinnerung vor Ausführung (Tage vorher) und Deckungs-Puffer festlegen', type: 'action', priority: 'should' },
    { text: 'Verzinsungs-Konvention (nominal oder effektiv) sichtbar benannt', type: 'info', priority: 'should' },
  ],
  interactions: [], viewports: ALL_VP, demoData: { ...WORLD }, variants: [], links: ['savings.calculator', 'savings.tax'],
};

export default {
  module: {
    id: 'savings', name: 'Sparpläne', icon: 'piggy-bank', status: 'active', area: 'Finanzen', theme: 'graphite', designVersion: '0.2',
    description: 'ETF- und Konto-Sparpläne planen, überblicken und mit Zielen verbinden: Rate, Rhythmus, Ausführungstermine, Deckung, Rechner mit Spanne, Sparziele und Steuer-Orientierung. Plan-Tracker, keine Ausführung beim Broker.',
    source: 'Workbench V2 (Bauplan Brainstorming 24.11.2026), Leitplanken docs/FINANCE_GUIDELINES.md',
    infoArchitecture: 'Startseite Übersicht (Kennzahlen, Pläne, nächste Ausführungen, Ziele). Von dort: Sparplan-Detail (Rate, Pause, Dynamik, Ausblick) → Rechner (Was wäre wenn?) → Szenarien vergleichen; Alle Sparpläne; Sparziele; Ausführungskalender mit Deckungs-Check; Sparplan anlegen (Assistent); Steuern und Freistellungsauftrag. Sparplan-Detail verweist auf das Wertpapier im Trading.',
    docs: [
      '## Grundsatz',
      '- Sparpläne sind Plan-Tracker: TAKT erinnert, gleicht ab und rechnet. Die Ausführung passiert beim Broker oder bei der Bank. Der Satz „Dieser Sparplan wird nicht von TAKT ausgeführt …“ steht in jedem Plan-Screen.',
      '- Ausführung bestätigen erzeugt eine Umbuchung (weder Einnahme noch Ausgabe) und schreibt Position und Kontostände fort.',
      '- Prognosen sind immer Spannen (Annahme ± 2 Prozentpunkte, Standard 3 / 5 / 7 %), im Konjunktiv und mit genannter Annahme und Stand.',
      '',
      '## Datenwelt',
      '- Gebunden werden savingsPlans, savingsGoals, positions, accounts, transactions, subscriptions, taxAllowance und depotHistory. Die Sparrate wird aus den aktiven Plänen berechnet (nicht aus savingsMonthlyTotal), damit Pausieren und neue Pläne sofort wirken.',
      '- Rechnen nur über core/finmath.js: projectSavings, savingsScenarios, monthsToGoal, requiredMonthly, nextExecutions, estimateTax, TAX_DE.',
      '',
      '## Offene Fragen',
      '- Verzinsungskonvention im Kern: effektiver Monatszins (Ist) oder nominal /12 (Referenzwert 150.436,50 € für 10.000 €, 300 €, 5 %, 20 Jahre)?',
      '- Feiertage für die Handelstag-Verschiebung: eigener Parameter im Kern statt lokaler Liste.',
      '- Wie wird ein Plan für ein Wertpapier angelegt, das noch nicht im Depot liegt (Position erst nach der ersten bestätigten Ausführung)?',
    ].join('\n'),
    links: ['finance', 'trading', 'calendar', 'tasks', 'home', 'goals'],
    homeFeatureId: 'savings.home',
  },
  features: [home, plans, plan, create, calculator, goals, calendar, tax, compare, withdrawal, assumptions],
  decisions: [
    { featureId: 'savings.home', title: 'Welche Startseite des Moduls?', decision: '', rationale: 'A zeigt Pläne und Termine in einer dichten Ansicht, B das Wachstum mit Karten, C stellt die nächste Ausführung und die Hinweise voran. Entscheidung nach Test mit 3 bis 8 Plänen und auf dem Handy.', tradeoffs: 'A: schnell, aber dicht. B: ruhig, aber lang. C: klare Handlung, Verlauf erst auf Nachfrage.', status: 'open' },
    { featureId: 'savings.calculator', title: 'Rendite-Annahmen: feste Szenarien oder freie Eingabe?', decision: '', rationale: 'Der Rechner zeigt eine Annahme mit Spanne ± 2 Prozentpunkte (Standard 3 / 5 / 7 %). Alternativ nur freie Eingabe ohne Spanne oder beides mit Voreinstellungen. Empfehlung: Annahme frei wählbar, Spanne immer sichtbar.', tradeoffs: 'Feste Werte: einfach, aber starr. Freie Eingabe: flexibel, aber leichter missverständlich. Beides: mehr Oberfläche.', status: 'open' },
    { featureId: 'savings.plan', title: 'Verzinsungskonvention im Rechenkern', decision: '', rationale: 'Der Kern rechnet mit effektivem Monatszins; Sparplan-Anbieter und der Referenzwert im Bauplan nutzen nominal /12. Bis zur Entscheidung nennt jede Anzeige die Konvention.', tradeoffs: 'Effektiv: mathematisch sauber, weicht von Anbieter-Rechnern ab. Nominal: vertraut, leicht höhere Werte.', status: 'open' },
    { featureId: 'savings.create', title: 'Sparpläne als Plan-Tracker statt Ausführung', decision: 'TAKT führt keine Sparpläne aus. Es erinnert, gleicht ab und rechnet; der Plan wird beim Broker oder der Bank eingetragen.', rationale: 'Eine Broker-Anbindung wäre ein eigenes Projekt mit Lizenz und Haftung. Der Plan-Tracker liefert den Nutzen (Überblick, Erinnerung, Deckung) ohne dieses Risiko.', tradeoffs: 'Mehr manuelle Schritte für Nutzer; dafür keine regulatorische Last und volle Kontrolle beim Anbieter.', status: 'decided' },
    { featureId: 'savings.calendar', title: 'Deckung mit Puffer statt Prognose aller Ausgaben', decision: 'Der Deckungs-Check rechnet Kontostand, Fixkosten, Sparraten und erwartetes Einkommen und zieht einen wählbaren Puffer für variable Ausgaben ab.', rationale: 'Variable Ausgaben lassen sich nicht seriös vorhersagen. Ein sichtbarer Puffer ist ehrlicher und leicht erklärbar („Wie berechnet?“).', tradeoffs: 'Weniger präzise als eine Ausgabenprognose, dafür nachvollziehbar und ruhig formuliert.', status: 'decided' },
    { featureId: 'savings.tax', title: 'Steuerparameter fest im Kern oder einstellbar?', decision: '', rationale: 'Parameter stehen mit Stand im Rechenkern. Offen ist, ob Nutzer Kirchensteuer und Freibetrag selbst einstellen dürfen oder nur per App-Update ändern.', tradeoffs: 'Fest: eine geprüfte Quelle. Einstellbar: passt zu mehr Fällen, aber Fehlerrisiko und Prüfaufwand.', status: 'open' },
  ],
};
