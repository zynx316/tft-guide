// Modul "TAKT Kern" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Querschnitt der App: Mitteilungen (Glocke), Suche (Lupe), Schnell erfassen, Willkommen, Papierkorb, App-Sperre, Zustandskatalog.
// Demo-Daten kommen aus der gemeinsamen Datenwelt ('@world:…'): Erfassen schreibt in Aufgaben, Termine, Buchungen, Mahlzeiten und Einkauf,
// Mitteilungen werden aus Aufgaben und Terminen abgeleitet, die Suche liest alle Sammlungen. Einstellungen (`prefs`) sind gemeinsamer Zustand.

import { WORLD } from '../world/index.js';

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const I = (trigger, result, event, to) => ({ trigger, result, event, ...(to ? { to } : {}) });
/** Navigation per `open:<Ziel>`: die Komponente meldet genau dieses Event, die Runtime öffnet das Ziel. */
const go = (to, trigger, result) => I(trigger, result || 'Zielscreen öffnet sich', `open:${to}`, to);

// ------------------------------------------------------------------ Demo-Daten (lokal) ---
// Mitteilungen aller Module (`@world:allNotifications`) und der Papierkorb (`@world:trash`) kommen aus der gemeinsamen Datenwelt (world/index.js, world/system.js).
const OFFLINE_QUEUE = [
  { id: 'q1', label: 'Aufgabe „Angebot Müller“ abgehakt', time: '09:12' },
  { id: 'q2', label: 'Buchung „REWE“ erfasst', time: '09:08' },
  { id: 'q3', label: 'Wasser +250 ml', time: '08:55' },
];
const TIPS = [
  { id: 'tip1', title: 'Erfassen in einem Satz', text: 'Schreibe „morgen 14 Uhr Zahnarzt“ oder „−12,50 Rewe“. TAKT erkennt Termin, Aufgabe und Buchung selbst.', icon: 'zap', tone: 'accent', tags: ['Erfassen'] },
  { id: 'tip2', title: 'Alles finden', text: 'Die Lupe durchsucht alle Module. Tippe „Neue Aufgabe“, um Befehle auszuführen.', icon: 'search', tone: 'info', tags: ['Suche'] },
  { id: 'tip3', title: 'Beträge ausblenden', text: 'Der Privatmodus zeigt „••••“ statt Geldbeträge. Praktisch in der Bahn.', icon: 'eye-off', tone: 'success', tags: ['Datenschutz'] },
  { id: 'tip4', title: 'Rückgängig statt Nachfrage', text: 'Gelöschtes landet 30 Tage im Papierkorb. Der Hinweis „Rückgängig“ holt es sofort zurück.', icon: 'undo-2', tone: 'warning', tags: ['Papierkorb'] },
];
const SHORTCUTS = [
  { id: 'sc1', title: 'Suche öffnen', subtitle: 'Lupe oben rechts oder Strg+K', meta: 'Strg+K', icon: 'search' },
  { id: 'sc2', title: 'Schnell erfassen', subtitle: 'Plus-Knopf oder Strg+N', meta: 'Strg+N', icon: 'plus' },
  { id: 'sc3', title: 'Zurück', subtitle: 'Pfeil oben links, Wischen vom Rand oder Rücktaste', meta: 'Alt+←', icon: 'arrow-left' },
  { id: 'sc4', title: 'Mitteilungen', subtitle: 'Glocke oben rechts', meta: '', icon: 'bell' },
];

const LOCK_GROUPS = [
  { id: 'lock', title: 'App-Sperre', rows: [
    { id: 'lock-on', type: 'switch', label: 'App-Sperre', hint: 'TAKT fragt beim Öffnen nach PIN oder Biometrie', icon: 'lock', pref: 'privacy.lock' },
    { id: 'lock-method', type: 'choice', label: 'Entsperren mit', icon: 'fingerprint', options: [{ value: 'pin', label: 'PIN' }, { value: 'biometric', label: 'Biometrie' }], pref: 'privacy.method', disabledIf: 'privacy.lock' },
    { id: 'lock-auto', type: 'select', label: 'Automatisch sperren', icon: 'timer', options: ['Sofort', 'Nach 1 Minute', 'Nach 5 Minuten', 'Nach 15 Minuten'], pref: 'privacy.autoLock', disabledIf: 'privacy.lock' },
    { id: 'lock-pin', type: 'action', label: 'PIN ändern', hint: '4 Ziffern', icon: 'key-round', toast: 'PIN ändern (Demo)' },
  ] },
  { id: 'privacy', title: 'Privatsphäre', rows: [
    { id: 'priv-amounts', type: 'switch', label: 'Beträge ausblenden', hint: 'Geldbeträge zeigen „••••“, bis du sie einblendest', icon: 'eye-off', pref: 'privacy.hideAmounts' },
    { id: 'priv-preview', type: 'switch', label: 'Vorschau im App-Wechsler verbergen', icon: 'smartphone', pref: 'privacy.hidePreview' },
    { id: 'priv-shots', type: 'switch', label: 'Screenshots blockieren', icon: 'shield', pref: 'privacy.blockScreenshots' },
  ] },
  { id: 'sensitive', title: 'Sensible Module', footer: 'Diese Module verlangen die Entsperrung, auch wenn TAKT schon offen ist.', rows: [
    { id: 'sens-finance', type: 'switch', label: 'Finanzen', icon: 'wallet', pref: 'privacy.sensitive', member: 'finance' },
    { id: 'sens-savings', type: 'switch', label: 'Sparpläne', icon: 'piggy-bank', pref: 'privacy.sensitive', member: 'savings' },
    { id: 'sens-trading', type: 'switch', label: 'Trading', icon: 'candlestick-chart', pref: 'privacy.sensitive', member: 'trading' },
    { id: 'sens-fitness', type: 'switch', label: 'Fitness', hint: 'Körperdaten und Gewicht', icon: 'dumbbell', pref: 'privacy.sensitive', member: 'fitness' },
    { id: 'sens-notes', type: 'switch', label: 'Notizen', icon: 'sticky-note', pref: 'privacy.sensitive', member: 'notes' },
  ] },
  { id: 'where', title: 'Wo liegen deine Daten?', rows: [
    { id: 'where-store', type: 'info', label: 'Speicherort', value: 'Nur auf diesem Gerät', icon: 'smartphone' },
    { id: 'where-weather', type: 'info', label: 'Wetterdienst', value: 'Ort, ohne Namen', icon: 'cloud-sun' },
  ] },
];

const baseModuleHome = ['calendar.home', 'tasks.home', 'weather.home', 'sales.overview', 'fitness.home', 'savings.home', 'habits.home', 'trading.portfolio', 'nutrition.home', 'settings.home', 'home.today', 'finance.home'];
// Ziele der Mitteilungen und Suchtreffer aus den Aggregaten der Datenwelt (jede Navigation braucht eine Regel mit `to`), dazu die abgeleiteten Ziele
const targetsOf = (list) => list.map((x) => x.to).filter(Boolean);
const NOTIF_TARGETS = [...new Set([...targetsOf(WORLD.allNotifications), 'tasks.list', 'tasks.detail', 'calendar.event'])];
const SEARCH_TARGETS = [...new Set([...targetsOf(WORLD.searchIndex), 'tasks.detail', 'calendar.event', 'finance.transaction', 'finance.accounts', 'savings.plan', 'trading.detail', 'nutrition.recipe', 'nutrition.foods', 'system.capture', 'calendar.create', 'finance.quickadd', 'nutrition.log', 'settings.appearance', 'system.lock', 'system.trash', 'settings.data', 'settings.home',
  'home.today', 'calendar.home', 'tasks.home', 'habits.home', 'notes.home', 'knowledge.home', 'picture-to-text.home', 'finance.home', 'savings.home', 'trading.portfolio', 'fitness.home', 'nutrition.home', 'weather.home', 'sales.overview',
  'settings.region', 'settings.modules', 'settings.notifications', 'settings.accounts', 'system.help', 'settings.about'])];

const worldData = { tasks: '@world:tasks', events: '@world:events' };

export default {
  module: {
    id: 'system', name: 'TAKT Kern', icon: 'sparkles', area: 'System', status: 'active', theme: 'graphite', designVersion: '0.3', stage: 1, homeFeatureId: 'system.notifications',
    dataSource: 'Datenwelt der App (lokal)', offline: 'voll',
    description: 'Der Querschnitt der App: Mitteilungen (Glocke), globale Suche (Lupe), Schnell erfassen mit Erkennung, Willkommen beim ersten Start, Papierkorb, App-Sperre und der Zustandskatalog für Offline, Konflikt, Berechtigung und Fehler.',
    source: 'Workbench V2 (Bauplan Brainstorming 24.11.2026); Abgleich mit dem echten TAKT-Konzept in Phase 1',
    infoArchitecture: 'Kein Eintrag in der Navigationsleiste. Erreichbar über die App-Rahmen: Lupe → Suche, Glocke → Mitteilungen, Plus/Erfassen → Schnell erfassen. Einstieg (Modul-Startseite) ist „Mitteilungen“. Suche öffnet jeden Treffer im Zielmodul, Befehle führen Aktionen aus („Neue Aufgabe“, „App sperren“). Mitteilung antippen → Zielscreen im Modul. Erfassen legt Aufgaben, Termine, Buchungen, Mahlzeiten und Einkäufe in der Datenwelt an, Unerkanntes landet im Eingang. Papierkorb und App-Sperre erreichst du über Einstellungen und Suche. Der Zustandskatalog ist Referenz für alle Module.',
    docs: [
      '## Annahmen',
      '- Suche, Mitteilungen und Erfassen sind in jeder Version der App ohne Umweg erreichbar (Rahmen: Tab-Leiste und Launchpad über die Kopfleiste, Fokus über „Erfassen“ und die Leiste).',
      '- Erkennung beim Erfassen ist regelbasiert und zeigt vor dem Speichern, was erkannt wurde. Die Art lässt sich mit einem Tipp ändern. Unklares landet im Eingang, nichts geht verloren.',
      '- Mitteilungen aus Aufgaben und Terminen werden live aus der Datenwelt abgeleitet. Erledigt man die Aufgabe, verschwindet die Mitteilung. Die übrigen Module liefern ihre Mitteilungen im gemeinsamen Format (`<modul>Notifications`).',
      '- Ruhezeiten (Standard 22:00–07:00) dämpfen Ton und Vibration. Wichtiges (Unwetter, Fristen, Sync-Fehler) kommt durch, wenn die Ausnahme aktiv ist.',
      '- Papierkorb: 30 Tage Aufbewahrung, kein Bestätigungsdialog beim Löschen, sondern „Rückgängig“. Endgültig löschen und „Papierkorb leeren“ fragen nach.',
      '- App-Sperre mit PIN (Demo-PIN 1234) oder Biometrie; sensible Module können zusätzlich verlangen, entsperrt zu sein.',
      '',
      '## Offene Fragen',
      '- Welche Such-Darstellung wird Standard: gruppierte Liste, Karten oder Befehlspalette?',
      '- Gruppierung der Mitteilungen: nach Zeit oder nach Dringlichkeit?',
      '- PIN mit 4 oder 6 Stellen, Biometrie als Standard?',
      '- Spracheingabe: lokal erkannt oder über den Dienst des Geräts (Datenschutz)?',
      '',
      '## Grenzen der Demo',
      '- Erkennung, Sprache, Biometrie, Sicherung und Export sind simuliert. Schreibwege in die Datenwelt (Aufgabe, Termin, Buchung, Mahlzeit, Einkauf) sind echt und wirken in allen Screens.',
      '- Das Theme, die Favoriten der Navigationsleiste und der Privatmodus lassen sich hier einstellen, wirken in der Demo aber über die Schalter des Launchers.',
    ].join('\n'),
    links: ['settings', 'tasks', 'calendar', 'finance', 'nutrition', 'home'],
  },
  features: [
    // ------------------------------------------------------------ Mitteilungen (Startseite)
    {
      id: 'system.notifications', name: 'Mitteilungen', group: 'Übersicht', status: 'review', tier: 1, usage: 'täglich mehrfach',
      purpose: 'Alle Hinweise der App an einem Ort: was ist dringend, was kann warten. Nach Zeit, Modul oder Dringlichkeit gruppiert, mit Erledigt, Schlummern und Ruhezeiten. Ein Tipp öffnet das passende Ziel im Modul.',
      requirements: [
        { text: 'Mitteilungen aller Module in einer Liste, neueste zuerst; Ungelesenes ist erkennbar (Punkt und Schrift), „Alle gelesen“ mit einem Tipp', type: 'info', priority: 'must' },
        { text: 'Aufgaben (fällig, überfällig) und Termine (beginnen bald) werden live aus der Datenwelt abgeleitet, nicht doppelt gepflegt', type: 'rule', priority: 'must' },
        { text: 'Gruppieren nach Zeit (Heute, Gestern, Früher), Modul oder Dringlichkeit (Wichtig, Normal, Leise)', type: 'info', priority: 'must' },
        { text: 'Je Mitteilung: öffnen (Ziel im Modul), erledigt (mit Rückgängig, bei Aufgaben wird sie wirklich erledigt), schlummern (10 Min., 1 Std., morgen früh)', type: 'action', priority: 'must' },
        { text: 'Hinweis auf aktive Ruhezeiten mit Link zu den Regeln; Wichtiges bleibt hörbar', type: 'state', priority: 'should' },
        { text: 'Filter: Alle, Wichtig, Ungelesen; Leerzustand „Keine Mitteilungen“ mit Weg zu den Regeln', type: 'state', priority: 'must' },
        { text: 'Beträge in Texten respektieren den Privatmodus', type: 'rule', priority: 'must' },
        { text: 'Mobile: Touch-Ziele ≥ 44 px, Aktionen ohne Wischen erreichbar, kein horizontaler Überlauf', type: 'rule', priority: 'must' },
      ],
      interactions: [
        ...NOTIF_TARGETS.map((to) => go(to, `Mitteilung antippen (Ziel ${to})`, 'Das Ziel im Modul öffnet sich, Mitteilung gilt als gelesen')),
        ...baseModuleHome.map((to) => go(to, `Modulkarte „Öffnen“ (${to})`, 'Modul-Startseite öffnet sich')),
        go('settings.notifications', '„Regeln“ im Ruhezeiten-Hinweis antippen', 'Regeln und Ruhezeiten öffnen sich'),
        I('„Regeln“ (Kopfzeile) antippen', 'Regeln und Ruhezeiten öffnen sich', 'header.secondary', 'settings.notifications'),
        go('system.capture', '„Erfassen“ (Kopfzeile) antippen', 'Schnell erfassen öffnet sich'),
        I('„Erledigt“ antippen', 'Mitteilung verschwindet, Rückgängig-Hinweis erscheint', 'notification.done'),
        I('Uhr-Symbol → Zeitraum wählen', 'Mitteilung schlummert und kommt wieder', 'notification.snooze'),
        I('„Alle gelesen“', 'Ungelesen-Zähler springt auf 0', 'notification.readall'),
        I('Filterchip wählen', 'Liste zeigt nur Wichtiges oder Ungelesenes', 'notification.filter'),
      ],
      acceptance: [
        'Die Liste zeigt Mitteilungen aller Module und ist nach Zeit gruppiert; ungelesene sind ohne Farbe allein erkennbar.',
        '„Erledigt“ bei „Fällig um 14:00 Uhr“ erledigt die Aufgabe wirklich, sie verschwindet danach auch aus Aufgaben und Start; „Rückgängig“ stellt beides wieder her.',
        'Ein Tipp auf eine Mitteilung öffnet das Ziel (Aufgaben-Detail, Termin, Warnungen …) und „Zurück“ führt wieder zur Liste.',
        'Schlummern verschiebt die Mitteilung in „Schlummert“ mit Uhrzeit; „Jetzt“ holt sie zurück.',
        'Ohne Mitteilungen (Erster Start) erscheint „Keine Mitteilungen“ mit genau einer Aktion; im Privatmodus ist kein Betrag lesbar.',
      ],
      flows: [
        { id: 'fl-frist', name: 'Frist erledigen', steps: [{ featureId: 'system.notifications', action: 'Mitteilung „Fällig um 14:00 Uhr“ ansehen' }, { featureId: 'tasks.detail', action: 'Aufgabe öffnen und abschließen' }, { featureId: 'system.notifications', action: 'Mitteilung ist verschwunden' }] },
        { id: 'fl-warnung', name: 'Warnung prüfen', steps: [{ featureId: 'system.notifications', action: 'Böen-Warnung antippen' }, { featureId: 'weather.alerts', action: 'Details und Empfehlung lesen' }] },
        { id: 'fl-ruhe', name: 'Ruhezeiten anpassen', steps: [{ featureId: 'system.notifications', action: '„Regeln“ im Ruhezeiten-Hinweis' }, { featureId: 'settings.notifications', action: 'Von und Bis ändern' }] },
      ],
      viewports: ALL_VP,
      demoData: { ...worldData, notifications: '@world:allNotifications', prefs: '@world:prefs' },
      variants: [
        {
          id: 'A', name: 'Liste nach Zeit', direction: 'kompakt',
          concept: 'Dichte Liste, nach Heute, Gestern und Früher gruppiert. Erledigt und Schlummern in der Zeile, Filterchips oben. In der Seitenspalte die Ruhezeiten.',
          description: '+ Viel auf einmal, alles in der Zeile bedienbar  − Auf Mobile lang, Dringlichkeit nur als Zusatz',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Mitteilungen', subtitle: 'Alles Neue aus deinen Modulen', primaryLabel: 'Erfassen', primaryEvent: 'open:system.capture', secondaryLabel: 'Regeln', secondaryIcon: 'sliders-horizontal' } },
            { id: 'list', component: 'notification-list', region: 'main', props: { title: 'Alle Mitteilungen', groupBy: 'time', layout: 'list' } },
            { id: 'quiet', component: 'quiet-hours', region: 'aside', props: { title: 'Ruhezeiten' } },
            { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
          ],
        },
        {
          id: 'B', name: 'Karten nach Modul', direction: 'visuell',
          concept: 'Jedes Modul bekommt eine Karte mit Anzahl und den neuesten Mitteilungen. Ein Tipp auf „Öffnen“ führt ins Modul. Ruhezeiten als Band.',
          description: '+ Ruhig, sofort sichtbar, welches Modul etwas will  − Ältere Mitteilungen sind eine Ebene tiefer',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Mitteilungen', subtitle: 'Nach Modul sortiert', primaryLabel: 'Erfassen', primaryEvent: 'open:system.capture', secondaryLabel: 'Regeln' } },
            { id: 'cards', component: 'notification-list', region: 'main', span: 12, props: { title: 'Nach Modul', groupBy: 'module', layout: 'cards', showQuiet: false } },
            { id: 'quiet', component: 'quiet-hours', region: 'main', span: 6, spanTablet: 12, props: { title: 'Ruhezeiten' } },
            { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
          ],
        },
        {
          id: 'C', name: 'Wichtig zuerst', direction: 'fokus',
          concept: 'Die wichtigste ungelesene Mitteilung als große Karte mit „Öffnen“ und „In 1 Std.“. Darunter Erfassen in einem Satz und der Rest nach Dringlichkeit.',
          description: '+ Klare nächste Aktion, Erfassen ohne Umweg  − Weniger Gesamtüberblick über alle Module',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Jetzt wichtig', subtitle: 'Di, 24. November · 09:30', primaryLabel: '', secondaryLabel: 'Regeln' } },
            { id: 'cap', component: 'capture-field', region: 'main', props: { mode: 'line', placeholder: 'Etwas festhalten …', showExamples: false, showRecent: false } },
            { id: 'list', component: 'notification-list', region: 'main', props: { title: 'Mitteilungen', groupBy: 'priority', layout: 'focus' } },
            { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['settings.notifications', 'tasks.detail', 'calendar.event', 'weather.alerts', 'system.capture'],
    },
    // ------------------------------------------------------------ Suche
    {
      id: 'system.search', name: 'Suche', group: 'Suchen & Erfassen', status: 'design', tier: 1, usage: 'täglich',
      purpose: 'Eine Suche für alles: Aufgaben, Termine, Buchungen, Konten, Sparpläne, Depot, Rezepte und Module finden und mit einem Tipp im Zielmodul öffnen. Dazu Befehle wie „Neue Aufgabe“ oder „App sperren“.',
      requirements: [
        { text: 'Ein Suchfeld über alle Module; Ergebnisse nach Modul bzw. Art gruppiert, mit Anzahl und „Alle anzeigen“', type: 'info', priority: 'must' },
        { text: 'Treffer hervorheben (Teilwort, Umlaute egal: „uber“ findet „Über“), Titel vor Untertitel gewichten', type: 'rule', priority: 'must' },
        { text: 'Einstellungsseiten sind Treffer (Gruppe „Einstellungen“: „Darstellung“, „Datenschutz“, „Über TAKT“) und öffnen die passende Seite', type: 'info', priority: 'should' },
        { text: 'Treffer öffnen das Zielobjekt im Modul (Aufgaben-Detail, Termin, Buchung, Konto, Sparplan …)', type: 'action', priority: 'must' },
        { text: 'Befehle: „Neue Aufgabe“, „Neuer Termin“, „Buchung erfassen“, „Theme wechseln“, „App sperren“, „Papierkorb öffnen“, „Daten exportieren“', type: 'action', priority: 'must' },
        { text: 'Leere Suche zeigt „Zuletzt gesucht“ (löschbar), Befehle und Vorschläge', type: 'info', priority: 'should' },
        { text: 'Filter-Chips begrenzen auf einen Bereich (Aufgaben, Termine, Finanzen …)', type: 'action', priority: 'should' },
        { text: 'Keine Treffer: „Keine Treffer für …“ mit „In allen Modulen suchen“ oder „Als Aufgabe erfassen“', type: 'state', priority: 'must' },
        { text: 'Beträge in Treffern respektieren den Privatmodus; Offline durchsucht TAKT nur lokale Daten', type: 'rule', priority: 'should' },
        { text: 'Befehlspalette: Pfeiltasten wählen, Enter öffnet, Esc leert (Desktop)', type: 'action', priority: 'could' },
      ],
      interactions: [
        ...SEARCH_TARGETS.map((to) => go(to, `Treffer oder Befehl antippen (${to})`, 'Das Ziel öffnet sich')),
        I('Text eingeben', 'Ergebnisse aktualisieren sich bei jeder Eingabe', 'search.input'),
        I('Filter-Chip wählen', 'Ergebnisse auf einen Bereich begrenzen', 'search.scope'),
        I('Zuletzt gesucht antippen', 'Begriff wird erneut gesucht', 'search.recent'),
        I('„Verlauf löschen“', 'Zuletzt gesucht ist leer', 'search.clear'),
        I('Befehl ohne Ziel ausführen', 'Aktion läuft an Ort und Stelle (Hinweis)', 'command.run'),
      ],
      acceptance: [
        'Die Eingabe „Müller“ findet die Aufgabe „Angebot Müller GmbH finalisieren“ gruppiert unter „Aufgaben“, der Treffer ist hervorgehoben.',
        'Antippen eines Treffers öffnet das Zielobjekt im Modul, „Zurück“ führt zur Suche mit unverändertem Begriff.',
        'Die Eingabe „uber“ findet Einträge mit „Über“ (Umlaute egal), „xyz“ zeigt „Keine Treffer für „xyz““ mit genau einer Hauptaktion.',
        'Befehle erscheinen vor Treffern; „App sperren“ öffnet die Sperre, „Theme wechseln“ die Darstellung.',
        'Im Privatmodus ist in Treffern kein Betrag lesbar, auf 360 px gibt es keinen horizontalen Überlauf.',
      ],
      flows: [
        { id: 'fl-finden', name: 'Aufgabe finden', steps: [{ featureId: 'system.search', action: '„Müller“ eingeben' }, { featureId: 'tasks.detail', action: 'Treffer öffnen' }] },
        { id: 'fl-befehl', name: 'Befehl ausführen', steps: [{ featureId: 'system.search', action: '„Neue Aufgabe“ wählen' }, { featureId: 'system.capture', action: 'Aufgabe erfassen' }] },
      ],
      viewports: ALL_VP,
      demoData: { events: '@world:events', tasks: '@world:tasks', transactions: '@world:transactions', accounts: '@world:accounts', savingsPlans: '@world:savingsPlans', positions: '@world:positions', nutRecipes: '@world:nutRecipes', nutFoods: '@world:nutFoods', notes: '@world:notes', articles: '@world:articles', habits: '@world:habits', orders: '@world:orders', channels: '@world:channels', captures: '@world:captures', searchIndex: '@world:searchIndex', recents: ['Müller', 'Rewe', 'Sparplan'] },
      variants: [
        {
          id: 'A', name: 'Volltext mit Gruppen', direction: 'kompakt',
          concept: 'Suchfeld, Filter-Chips, Treffer nach Art gruppiert mit Anzahl. Leer: zuletzt gesucht, Befehle, Vorschläge. Alles in einer Spalte, Treffer exakt mit Datum und Betrag.',
          description: '+ Viele Treffer auf einmal, klare Gruppen  − Auf Mobile lang, wenig Orientierung ohne Begriff',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Suche', subtitle: 'Aufgaben, Termine, Buchungen und mehr', primaryLabel: '' } },
            { id: 'search', component: 'global-search', region: 'main', props: { mode: 'list', placeholder: 'Suchen oder Befehl eingeben' } },
          ],
        },
        {
          id: 'B', name: 'Karten und Vorschläge', direction: 'visuell',
          concept: 'Großes Suchfeld, darunter „Gerade relevant“ (nächster Termin, offene Aufgabe, letzte Buchung) und Modulkacheln. Mit Begriff: bester Treffer groß, der Rest als Karten.',
          description: '+ Einladend, schnell ins Modul, auch ohne Begriff nützlich  − Weniger Treffer sichtbar',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Suche', subtitle: 'Finde, was du suchst', primaryLabel: '' } },
            { id: 'search', component: 'global-search', region: 'main', props: { mode: 'cards', placeholder: 'Wonach suchst du?', limitPerGroup: 3 } },
          ],
        },
        {
          id: 'C', name: 'Befehlspalette', direction: 'fokus',
          concept: 'Aktionen zuerst: „Als Aufgabe erfassen“, Befehle, dann die besten Treffer. Mit Pfeiltasten und Enter bedienbar, eine Liste statt Gruppen.',
          description: '+ Schnellster Weg zur Aktion, ersetzt Navigation  − Treffer ohne Gruppenüberblick, braucht Gewöhnung',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Was möchtest du tun?', primaryLabel: '' } },
            { id: 'search', component: 'global-search', region: 'main', props: { mode: 'palette', placeholder: 'Befehl oder Suchbegriff' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['system.capture', 'tasks.detail', 'calendar.event', 'finance.transaction'],
    },
    // ------------------------------------------------------------ Schnell erfassen
    {
      id: 'system.capture', name: 'Schnell erfassen', group: 'Suchen & Erfassen', status: 'review', tier: 1, usage: 'täglich mehrfach',
      purpose: 'Ein Eingabefeld für alles, per Text oder Sprache. TAKT erkennt Aufgabe, Termin, Notiz, Buchung, Mahlzeit oder Einkauf, zeigt vor dem Speichern, was erkannt wurde, und legt es an. Unklares landet im Eingang.',
      requirements: [
        { text: 'Ein Feld, in jedem Rahmen erreichbar (Erfassen-Knopf, Plus, Strg+N); Sprachaufnahme als Alternative zum Tippen', type: 'action', priority: 'must' },
        { text: 'Live-Erkennung: „morgen 14 Uhr Zahnarzt“ = Termin, „!Angebot Müller schicken“ = Aufgabe (hoch), „−12,50 Rewe“ = Buchung, „Mittag Linsensuppe 450 kcal“ = Mahlzeit, „Milch kaufen“ = Einkauf, „Notiz: …“ = Notiz', type: 'rule', priority: 'must' },
        { text: 'Vorschau vor dem Speichern: Art, Titel, Felder (Wann, Betrag, Priorität …) und Grund der Erkennung', type: 'info', priority: 'must' },
        { text: 'Art lässt sich mit einem Tipp ändern; fehlen Pflichtangaben (Betrag, kcal), sagt TAKT es, statt zu raten', type: 'action', priority: 'must' },
        { text: 'Anlegen schreibt in die Datenwelt (Aufgaben, Termine, Buchungen, Mahlzeiten, Einkauf, Eingang) und wirkt sofort in allen Modulen', type: 'rule', priority: 'must' },
        { text: 'Rückgängig-Hinweis nach jedem Erfassen; „Zuletzt erfasst“ mit „Ansehen“ führt ins Zielmodul', type: 'action', priority: 'must' },
        { text: 'Unerkanntes landet im Eingang und lässt sich dort sortieren', type: 'state', priority: 'must' },
        { text: 'Mehrfach erfassen ohne Schließen (Feld leert sich, Fokus bleibt)', type: 'action', priority: 'should' },
        { text: 'Leerer Eingang und Erststart: Beispiele zum Ausprobieren statt leerer Fläche', type: 'state', priority: 'should' },
      ],
      interactions: [
        go('tasks.list', '„Ansehen“ bei einer erfassten Aufgabe', 'Aufgabenliste öffnet sich'),
        go('calendar.agenda', '„Ansehen“ bei einem erfassten Termin', 'Agenda öffnet sich'),
        go('tasks.inbox', '„Ansehen“ bei Eingang', 'Eingang öffnet sich'),
        go('notes.inbox', '„Ansehen“ bei Notiz', 'Notizen-Eingang öffnet sich'),
        go('finance.transactions', '„Ansehen“ bei einer erfassten Buchung', 'Umsätze öffnen sich'),
        go('nutrition.log', '„Ansehen“ bei einer erfassten Mahlzeit', 'Tagebuch öffnet sich'),
        go('nutrition.shopping', '„Ansehen“ bei einem Einkauf', 'Einkaufsliste öffnet sich'),
        I('Satz eingeben', 'Vorschau zeigt erkannte Art und Felder', 'capture.input'),
        I('Art-Chip wählen', 'Erkannte Art wird ersetzt', 'capture.kind'),
        I('Mikrofon antippen', 'Aufnahme läuft, erkannter Satz erscheint im Feld', 'capture.voice'),
        I('Enter oder „Erfassen“', 'Eintrag wird angelegt, Rückgängig-Hinweis erscheint', 'capture.save'),
        I('Rückgängig', 'Eintrag verschwindet wieder aus der Datenwelt', 'capture.undo'),
      ],
      acceptance: [
        '„morgen 14 Uhr Zahnarzt“ wird als Termin Mi, 25.11., 14:00–15:00 erkannt, nach „Erfassen“ steht er im Kalender (Agenda, Tag, Woche).',
        '„!Angebot Müller schicken“ wird zur Aufgabe mit hoher Priorität und erscheint in Aufgaben und Start.',
        '„−12,50 Rewe“ wird zur Buchung (Lebensmittel, Girokonto) und erscheint in den Umsätzen; im Privatmodus ist der Betrag maskiert.',
        'Ein unklarer Satz („Rückruf Spedition“) landet im Eingang, die Art lässt sich vor dem Speichern wechseln, „Rückgängig“ entfernt den Eintrag wieder.',
        'Fehlt der Betrag oder die kcal-Angabe, bleibt „Erfassen“ gesperrt und ein Hinweis nennt, was fehlt.',
      ],
      flows: [
        { id: 'fl-termin', name: 'Termin per Satz', steps: [{ featureId: 'system.capture', action: '„morgen 14 Uhr Zahnarzt“ eingeben' }, { featureId: 'system.capture', action: 'Vorschau prüfen, „Erfassen“' }, { featureId: 'calendar.agenda', action: '„Ansehen“: Termin steht in der Agenda' }] },
        { id: 'fl-buchung', name: 'Ausgabe festhalten', steps: [{ featureId: 'system.capture', action: '„−12,50 Rewe“ eingeben' }, { featureId: 'system.capture', action: '„Erfassen“' }, { featureId: 'finance.transactions', action: 'Buchung in den Umsätzen sehen' }] },
        { id: 'fl-eingang', name: 'Unklares sortieren', steps: [{ featureId: 'system.capture', action: '„Rückruf Spedition“ eingeben, Art „Aufgabe“ wählen' }, { featureId: 'tasks.list', action: 'Aufgabe prüfen' }] },
      ],
      viewports: ALL_VP,
      demoData: { ...worldData, transactions: '@world:transactions', nutDiary: '@world:nutDiary', nutShopping: '@world:nutShopping', taskInbox: '@world:taskInbox', notes: '@world:notes', nutFoods: '@world:nutFoods' },
      variants: [
        {
          id: 'A', name: 'Eine Zeile mit Erkennung', direction: 'kompakt',
          concept: 'Eine Zeile mit Mikrofon und Erfassen-Knopf, darunter die erkannte Art mit allen Feldern und Art-Chips zum Korrigieren. Rechts der Eingang zum Sortieren, unten „Zuletzt erfasst“.',
          description: '+ Schnell, transparent, alles auf einem Screen  − Braucht Breite für den Eingang, Chips sind klein',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Schnell erfassen', subtitle: 'Ein Satz genügt', primaryLabel: '' } },
            { id: 'cap', component: 'capture-field', region: 'main', props: { mode: 'line', showExamples: true, showRecent: true } },
            { id: 'inbox', component: 'task-inbox', region: 'aside', bind: { inbox: 'taskInbox', tasks: 'tasks' }, props: { title: 'Eingang', style: 'steps' } },
            { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
          ],
        },
        {
          id: 'B', name: 'Typ-Raster', direction: 'visuell',
          concept: 'Sechs große Kacheln für die Art (Aufgabe, Termin, Notiz, Buchung, Mahlzeit, Einkauf), darunter ein großes Feld mit Beispiel je Art und eine Vorschau-Karte. Erst wählen, dann schreiben.',
          description: '+ Selbsterklärend, ideal für Einsteiger, große Ziele  − Ein Tipp mehr als die Zeile',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Was erfassen?', subtitle: 'Wähle eine Art oder schreib einfach los', primaryLabel: '' } },
            { id: 'cap', component: 'capture-field', region: 'main', props: { mode: 'tiles', showExamples: false, showRecent: true } },
            { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
          ],
        },
        {
          id: 'C', name: 'Mit Vorschlägen aus dem Tag', direction: 'fokus',
          concept: 'Großes Feld, darunter Vorschläge aus deinem Tag (Notiz zum nächsten Termin, letzte Ausgabe wiederholen, Einkauf ergänzen). Der Knopf nennt die Art („Als Termin“), der Eingang ist eine Zeile.',
          description: '+ Weniger Tippen, passt zum Tageskontext  − Vorschläge brauchen gute Daten, weniger Korrekturmöglichkeiten sichtbar',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Festhalten', subtitle: 'Di, 24. November · 09:30', primaryLabel: '' } },
            { id: 'cap', component: 'capture-field', region: 'main', props: { mode: 'smart', showExamples: true, showRecent: true, showInbox: true, placeholder: 'Was ist dir eingefallen?' } },
            { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['system.search', 'tasks.inbox', 'notes.inbox', 'calendar.create', 'finance.quickadd', 'nutrition.log'],
    },
    // ------------------------------------------------------------ Willkommen (Onboarding)
    {
      id: 'system.onboarding', name: 'Willkommen', group: 'Einstieg', status: 'design', tier: 2, usage: 'einmalig',
      purpose: 'Der Erststart in wenigen Schritten: Module wählen, Favoriten für die Navigation, Theme, Datenschutz und ob mit Beispieldaten gestartet wird. Danach landet man auf „Start“.',
      requirements: [
        { text: 'Sechs kurze Schritte: Willkommen, Module, Navigation, Darstellung, Datenschutz, Fertig; Fortschritt sichtbar, jederzeit „Zurück“ und „Überspringen“', type: 'info', priority: 'must' },
        { text: 'Vorlagen für die Modulwahl (Alltag, Alltag & Gesundheit, Alltag & Geld, Alles) und einzelne Module an- und abwählbar', type: 'action', priority: 'must' },
        { text: 'Bis zu vier Favoriten für die Navigationsleiste, Vorschau der Leiste', type: 'action', priority: 'must' },
        { text: 'Theme wählen (Graphite, Horizon, Intensiv); Themes ändern nur Farben', type: 'action', priority: 'should' },
        { text: 'Datenschutz: App-Sperre, Beträge ausblenden, Mitteilungen; Kamera und Standort erst, wenn sie gebraucht werden (mit Erklärung)', type: 'rule', priority: 'must' },
        { text: 'Start mit Beispieldaten oder leer; Beispieldaten sind jederzeit löschbar', type: 'action', priority: 'should' },
        { text: 'Alles lässt sich später in den Einstellungen ändern; Abschluss führt zu „Start“', type: 'rule', priority: 'must' },
      ],
      interactions: [
        go('home.today', '„TAKT öffnen“ im letzten Schritt', 'Start öffnet sich'),
        go('home.today', '„Überspringen“', 'Start öffnet sich mit Standardwerten'),
        I('Vorlage oder Modul wählen', 'Auswahl ändert sich, Zähler aktualisiert', 'onboarding.preset'),
        I('Favorit tippen', 'Stern, Vorschau der Leiste', 'onboarding.favorite'),
        I('Weiter / Zurück', 'Nächster oder vorheriger Schritt', 'onboarding.step'),
      ],
      acceptance: [
        'Ein Durchlauf von „Willkommen“ bis „TAKT öffnen“ braucht höchstens sechs Tipps ohne Eingabe.',
        'Die Vorlage „Alltag“ schaltet Fitness, Ernährung und Finanzen aus; einzelne Module lassen sich danach anpassen.',
        'Mehr als vier Favoriten sind nicht möglich, TAKT sagt, warum.',
        '„Überspringen“ ist in jedem Schritt außer dem letzten erreichbar und führt zu „Start“.',
        'Auf 360 px gibt es keinen horizontalen Überlauf, alle Ziele sind mindestens 44 px hoch.',
      ],
      flows: [{ id: 'fl-erst', name: 'Erststart', steps: [{ featureId: 'system.onboarding', action: 'Vorlage „Alltag & Gesundheit“ wählen' }, { featureId: 'system.onboarding', action: 'Favoriten wählen, Theme, Datenschutz' }, { featureId: 'home.today', action: '„TAKT öffnen“: Start' }] }],
      viewports: ALL_VP,
      demoData: { prefs: '@world:prefs' },
      variants: [
        {
          id: 'A', name: 'Alles auf einer Seite', direction: 'kompakt',
          concept: 'Alle Entscheidungen untereinander auf einer Seite: Module, Favoriten, Theme, Datenschutz, Abschluss. Wer es eilig hat, scrollt durch und tippt „TAKT öffnen“.',
          description: '+ Schnell, Überblick über alles, keine Navigation  − Lang, wirkt weniger einladend',
          layout: { type: 'stack', narrow: true },
          blocks: [{ id: 'ob', component: 'onboarding-steps', region: 'main', props: { flow: 'single', allowSkip: true } }],
        },
        {
          id: 'C', name: 'Eine Frage pro Schritt', direction: 'fokus',
          concept: 'Ein Schritt pro Bildschirm mit klarer Frage und „Weiter“. Fortschrittsbalken oben, der Abschluss fasst zusammen und öffnet Start.',
          description: '+ Ruhig, geführt, wenig Last je Schritt  − Mehr Tipps bis zum Ziel',
          layout: { type: 'stack', narrow: true },
          blocks: [{ id: 'ob', component: 'onboarding-steps', region: 'main', props: { flow: 'steps', allowSkip: true } }],
        },
      ],
      selectedVariantId: 'C',
      links: ['settings.modules', 'settings.appearance', 'system.lock', 'home.today'],
    },
    // ------------------------------------------------------------ Papierkorb
    {
      id: 'system.trash', name: 'Papierkorb', group: 'Sicherheit & Daten', status: 'design', tier: 3, usage: 'selten',
      purpose: 'Gelöschtes ist 30 Tage wiederherstellbar. Hier holst du Einträge zurück, löschst einzeln endgültig oder leerst den Papierkorb.',
      requirements: [
        { text: 'Alle gelöschten Einträge aller Module mit Modul, Löschzeitpunkt und Restzeit (30 Tage)', type: 'info', priority: 'must' },
        { text: 'Wiederherstellen mit einem Tipp; Aufgaben und Termine kehren in die Datenwelt zurück; Rückgängig-Hinweis', type: 'action', priority: 'must' },
        { text: 'Endgültig löschen und „Papierkorb leeren“ fragen nach und nennen die Folge', type: 'rule', priority: 'must' },
        { text: 'Einträge, die in 7 Tagen oder weniger verschwinden, sind hervorgehoben (Text, nicht nur Farbe)', type: 'state', priority: 'should' },
        { text: 'Filter nach Modul; Leerzustand „Papierkorb ist leer“', type: 'state', priority: 'must' },
        { text: 'Beträge in Details respektieren den Privatmodus', type: 'rule', priority: 'must' },
      ],
      interactions: [
        I('„Wiederherstellen“ antippen', 'Eintrag verschwindet aus dem Papierkorb, kehrt ins Modul zurück, Rückgängig-Hinweis', 'trash.restore'),
        I('Papierkorb-Symbol antippen', 'Nachfrage, danach endgültig gelöscht', 'trash.delete'),
        I('„Papierkorb leeren“', 'Nachfrage mit Anzahl, danach leer', 'trash.empty'),
      ],
      acceptance: [
        'Wiederherstellen einer gelöschten Aufgabe bringt sie in die Aufgabenliste zurück; „Rückgängig“ legt sie wieder in den Papierkorb.',
        'Endgültiges Löschen und „Papierkorb leeren“ zeigen eine Nachfrage mit der Folge („lässt sich nicht rückgängig machen“).',
        'Einträge mit weniger als 8 Tagen Restzeit stehen in „Läuft bald ab“ mit Text „noch 1 Tag“.',
        'Ein leerer Papierkorb zeigt „Papierkorb ist leer“ mit Erklärung, im Privatmodus ist kein Betrag lesbar.',
      ],
      flows: [{ id: 'fl-wieder', name: 'Aus Versehen gelöscht', steps: [{ featureId: 'system.trash', action: 'Aufgabe „Altes Angebot Schmidt prüfen“ wiederherstellen' }, { featureId: 'tasks.list', action: 'Aufgabe ist wieder in der Liste' }] }],
      viewports: ALL_VP,
      demoData: { trash: '@world:trash', ...worldData },
      variants: [{
        id: 'A', name: 'Liste nach Restzeit', direction: 'kompakt',
        concept: 'Liste nach Restzeit gruppiert („Läuft bald ab“ zuerst), Filter nach Modul, Wiederherstellen und Löschen in der Zeile, Hinweis zur Aufbewahrung.',
        description: '+ Das Wichtigste (bald weg) steht oben, alles in der Zeile  − Nur Liste, kein Vorschau-Detail',
        layout: { type: 'stack', narrow: true },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Papierkorb', subtitle: '30 Tage wiederherstellbar', primaryLabel: '' } },
          { id: 'trash', component: 'trash-list', region: 'main', props: { groupBy: 'age', showInfo: true } },
          { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['settings.data', 'system.search'],
    },
    // ------------------------------------------------------------ App-Sperre & Datenschutz
    {
      id: 'system.lock', name: 'App-Sperre & Datenschutz', group: 'Sicherheit & Daten', status: 'design', tier: 2, usage: 'selten',
      purpose: 'TAKT mit PIN oder Biometrie schützen, Beträge ausblenden und sensible Module extra absichern. Zeigt offen, wo die Daten liegen.',
      requirements: [
        { text: 'App-Sperre an/aus; Entsperren mit PIN oder Biometrie; automatisch sperren nach Sofort, 1, 5 oder 15 Minuten', type: 'action', priority: 'must' },
        { text: 'Sperrbildschirm mit Uhr, Datum und Ziffernblock; Fehlversuche zählen, nach drei Versuchen Wartezeit; „PIN vergessen“ erklärt die Folgen', type: 'state', priority: 'must' },
        { text: 'Privatmodus: Geldbeträge zeigen „••••“; Vorschau im App-Wechsler verbergen; Screenshots blockieren', type: 'action', priority: 'should' },
        { text: 'Sensible Module (Finanzen, Sparpläne, Trading, Fitness, Notizen) verlangen die Entsperrung einzeln', type: 'rule', priority: 'should' },
        { text: 'Transparenz: Speicherort und Weitergabe (Wetterdienst bekommt nur den Ort ohne Namen)', type: 'info', priority: 'must' },
        { text: 'Abhängige Einstellungen sind ausgegraut, wenn die Sperre aus ist', type: 'state', priority: 'should' },
      ],
      interactions: [
        I('Ziffer tippen', 'Punkte füllen sich, nach der letzten Stelle wird geprüft', 'pin.digit'),
        I('Fingerabdruck antippen', 'Prüfung läuft, danach entsperrt', 'pin.biometric'),
        I('Schalter umlegen', 'Einstellung wirkt sofort', 'settings.change'),
      ],
      acceptance: [
        'Die Demo-PIN 1234 entsperrt, eine falsche PIN schüttelt die Punkte und nennt die verbleibenden Versuche; nach drei Fehlern sind die Tasten gesperrt.',
        'Ist die App-Sperre aus, sind „Entsperren mit“ und „Automatisch sperren“ ausgegraut und nicht bedienbar.',
        'Jeder Schalter hat einen Namen für Screenreader, Ziffern haben Beschriftung, alle Ziele sind mindestens 44 px.',
        'Die Seite sagt, wo die Daten liegen („Nur auf diesem Gerät“).',
      ],
      flows: [{ id: 'fl-sperre', name: 'Sperre einrichten', steps: [{ featureId: 'settings.home', action: '„App-Sperre & Datenschutz“ öffnen' }, { featureId: 'system.lock', action: 'Sperre an, Biometrie wählen, Finanzen als sensibel markieren' }] }],
      viewports: ALL_VP,
      demoData: { groups: LOCK_GROUPS, prefs: '@world:prefs' },
      variants: [
        {
          id: 'A', name: 'Einstellungen', direction: 'kompakt',
          concept: 'Gruppierte Einstellungen: Sperre, Privatsphäre, sensible Module, Datenspeicherort. Abhängiges wird ausgegraut.',
          description: '+ Alles auf einen Blick, schnell zu ändern  − Der Sperrbildschirm selbst ist nicht zu sehen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'App-Sperre & Datenschutz', subtitle: 'Deine Daten bleiben bei dir', primaryLabel: '' } },
            { id: 'set', component: 'settings-list', region: 'main', props: { style: 'inset' } },
            { id: 'note', component: 'legal-notice', region: 'main', props: { kind: 'daten' } },
          ],
        },
        {
          id: 'B', name: 'Sperrbildschirm mit Einstellungen', direction: 'visuell',
          concept: 'Links der Sperrbildschirm mit Uhr und Ziffernblock zum Ausprobieren, rechts die Einstellungen. Man sieht sofort, was man einstellt.',
          description: '+ Wirkung direkt erlebbar, Demo-PIN testbar  − Braucht Breite, auf Mobile zwei Blöcke untereinander',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'App-Sperre & Datenschutz', subtitle: 'Probiere die Sperre gleich aus', primaryLabel: '' } },
            { id: 'pin', component: 'pin-field', region: 'main', span: 5, spanTablet: 12, props: { mode: 'unlock', lockScreen: true, length: 4, biometric: true } },
            { id: 'set', component: 'settings-list', region: 'main', span: 7, spanTablet: 12, props: { style: 'inset' } },
            { id: 'note', component: 'legal-notice', region: 'main', span: 12, props: { kind: 'daten' } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['settings.home', 'finance.privacy'],
    },
    // ------------------------------------------------------------ Zustandskatalog
    {
      id: 'system.states', name: 'Zustandskatalog', group: 'Referenz', status: 'review', tier: 3, usage: 'Referenz',
      purpose: 'Referenz-Screens für alle Sonderfälle, die jedes Modul kennen muss: Erstnutzung, Offline, Sync-Konflikt, Berechtigung verweigert und Fehler. Gleiche Bausteine, gleicher Ton überall.',
      requirements: [
        { text: 'Erstnutzung: Einladung mit Nutzen in einem Satz, einer Aktion und „Beispieldaten laden“; nie eine leere Fläche', type: 'state', priority: 'must' },
        { text: 'Offline: Banner „Offline, Stand 09:15“ mit Warteschlange der Änderungen; Sync-Chip in drei Zuständen (synchron, wartet, Fehler)', type: 'state', priority: 'must' },
        { text: 'Sync-Konflikt: beide Stände nebeneinander, Unterschiede markiert, Auswahl (dieses Gerät, anderes Gerät, beide); Rückgängig', type: 'state', priority: 'must' },
        { text: 'Berechtigung: erst erklären, dann fragen; bei Ablehnung Folgen, Alternative und Weg in die Systemeinstellungen', type: 'state', priority: 'must' },
        { text: 'Fehler: Ursache in einem Satz plus Ausweg, ohne Schuld und ohne Code (Speichern, Laden, Speicher voll, Anmeldung, nicht gefunden, Dienst)', type: 'state', priority: 'must' },
        { text: 'Texte folgen docs/TEXT_STIL.md (du, ruhig, ohne Ausrufezeichen)', type: 'rule', priority: 'must' },
      ],
      interactions: [
        go('system.trash', '„Papierkorb öffnen“ in „Speicher fast voll“', 'Papierkorb öffnet sich'),
        go('settings.data', '„Daten exportieren“ in „Speicher fast voll“', 'Daten & Backup öffnet sich'),
        I('„Erneut versuchen“', 'Ladeindikator, danach Hinweis', 'error.retry'),
        I('Konfliktlösung wählen und „Übernehmen“', 'Konflikt gilt als gelöst, Rückgängig möglich', 'conflict.resolve'),
      ],
      acceptance: [
        'Jede der fünf Zustandsarten hat einen Referenz-Screen mit Titel, einem erklärenden Satz und höchstens einer Hauptaktion.',
        'Kein Fehlertext enthält „Ups“, „Leider“, Fehlercodes oder Schuldzuweisung.',
        'Der Konflikt lässt sich lösen und mit „Rückgängig“ wieder öffnen.',
        'Auf 360 px gibt es keinen horizontalen Überlauf, auch nicht bei Schrift 200 %.',
      ],
      viewports: ALL_VP,
      demoData: { offlineQueue: OFFLINE_QUEUE },
      variants: [
        {
          id: 'A', name: 'Katalog in Reitern', direction: 'kompakt',
          concept: 'Ein Reiter je Zustand: Erstnutzung, Offline, Konflikt, Berechtigung, Fehler. Jeder Reiter zeigt die fertigen Bausteine untereinander.',
          description: '+ Übersichtlich als Nachschlagewerk, gleiche Bausteine wie in den Modulen  − Immer nur ein Zustand sichtbar',
          layout: { type: 'tabs' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Zustandskatalog', subtitle: 'Referenz für alle Module', primaryLabel: '' } },
            { id: 'first', component: 'firstrun-card', region: 'main', tab: 'Erstnutzung', props: { icon: 'list-todo', title: 'Starte mit deiner ersten Aufgabe', primaryLabel: 'Aufgabe anlegen' } },
            { id: 'off', component: 'offline-banner', region: 'main', tab: 'Offline', props: { show: 'immer', minutesAgo: 15, details: true } },
            { id: 'sync1', component: 'sync-status', region: 'main', tab: 'Offline', props: { status: 'synced', minutesAgo: 3 } },
            { id: 'sync2', component: 'sync-status', region: 'main', tab: 'Offline', props: { status: 'pending', count: 3 } },
            { id: 'sync3', component: 'sync-status', region: 'main', tab: 'Offline', props: { status: 'error' } },
            { id: 'conf', component: 'sync-conflict', region: 'main', tab: 'Konflikt', props: { state: 'offen' } },
            { id: 'perm1', component: 'permission-card', region: 'main', tab: 'Berechtigung', props: { kind: 'kamera', state: 'verweigert' } },
            { id: 'perm2', component: 'permission-card', region: 'main', tab: 'Berechtigung', props: { kind: 'standort', state: 'fragen' } },
            { id: 'perm3', component: 'permission-card', region: 'main', tab: 'Berechtigung', props: { kind: 'mitteilungen', state: 'erteilt' } },
            { id: 'err1', component: 'error-card', region: 'main', tab: 'Fehler', props: { kind: 'save' } },
            { id: 'err2', component: 'error-card', region: 'main', tab: 'Fehler', props: { kind: 'storage' } },
            { id: 'err3', component: 'error-card', region: 'main', tab: 'Fehler', props: { kind: 'expired' } },
          ],
        },
        {
          id: 'B', name: 'Alle Zustände im Raster', direction: 'visuell',
          concept: 'Alle Zustände gleichzeitig als Karten im Raster. Man sieht auf einen Blick, wie Erstnutzung, Berechtigung, Fehler und Konflikt zusammenpassen.',
          description: '+ Konsistenz sofort prüfbar, schöner Gesamteindruck  − Lang, viel auf einmal',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Zustandskatalog', subtitle: 'Alles, was schiefgehen oder leer sein kann', primaryLabel: '' } },
            { id: 'first', component: 'firstrun-card', region: 'main', span: 6, spanTablet: 12, props: { icon: 'sparkles', title: 'Noch nichts hier', text: 'Halte fest, was ansteht. TAKT erinnert dich rechtzeitig.', primaryLabel: 'Erste Aufgabe' } },
            { id: 'perm', component: 'permission-card', region: 'main', span: 6, spanTablet: 12, props: { kind: 'standort', state: 'verweigert' } },
            { id: 'off', component: 'offline-banner', region: 'main', span: 12, props: { show: 'immer', minutesAgo: 15, details: false, pending: 3 } },
            { id: 'conf', component: 'sync-conflict', region: 'main', span: 12, props: { state: 'offen' } },
            { id: 'err1', component: 'error-card', region: 'main', span: 6, spanTablet: 12, props: { kind: 'load' } },
            { id: 'err2', component: 'error-card', region: 'main', span: 6, spanTablet: 12, props: { kind: 'unavailable' } },
            { id: 'err3', component: 'error-card', region: 'main', span: 6, spanTablet: 12, props: { kind: 'notfound' } },
            { id: 'err4', component: 'error-card', region: 'main', span: 6, spanTablet: 12, props: { kind: 'storage' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['settings.accounts', 'system.trash', 'settings.data'],
    },
    // ------------------------------------------------------------ Hilfe & Tipps
    {
      id: 'system.help', name: 'Hilfe & Tipps', group: 'Einstieg', status: 'design', tier: 3, usage: 'selten',
      purpose: 'Kurze Tipps und Kurzbefehle, damit man TAKT schnell beherrscht, ohne ein Handbuch zu lesen.',
      requirements: [
        { text: 'Tipps-Karten je Thema (Erfassen, Suche, Datenschutz, Papierkorb)', type: 'info', priority: 'must' },
        { text: 'Kurzbefehle und Gesten (Suche, Erfassen, Zurück, Mitteilungen)', type: 'info', priority: 'should' },
        { text: '„Neu in TAKT“ und Feedback senden', type: 'action', priority: 'could' },
      ],
      interactions: [I('Tipp antippen', 'Tipp öffnet sich', 'card.open'), I('Kurzbefehl antippen', 'Beispiel wird gezeigt', 'item.open')],
      viewports: ALL_VP,
      demoData: { tips: TIPS, shortcuts: SHORTCUTS },
      variants: [{
        id: 'A', name: 'Tipps und Kurzbefehle', direction: 'kompakt',
        concept: 'Karten mit vier Tipps, darunter die wichtigsten Kurzbefehle als Liste.',
        description: '+ Knapp, sofort nützlich  − Kein Suchfeld, keine Tiefe',
        layout: { type: 'stack', narrow: true },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'TAKT Kern', title: 'Hilfe & Tipps', subtitle: 'Kurz und nützlich', primaryLabel: '' } },
          { id: 'tips', component: 'card-grid', region: 'main', bind: { items: 'tips' }, props: { title: 'Gut zu wissen', minWidth: 220, showExcerpt: true, respectFilter: false } },
          { id: 'keys', component: 'item-list', region: 'main', bind: { items: 'shortcuts' }, props: { title: 'Kurzbefehle', selectable: false, respectFilter: false } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['settings.home'],
    },
    // ------------------------------------------------------------ Skelette (Ebene 2, ohne Design)
    {
      id: 'system.links', name: 'Verknüpfungen', group: 'Integration', status: 'analyzed', tier: 3,
      purpose: 'Objekte verschiedener Module miteinander verbinden (Aufgabe ↔ Termin ↔ Notiz ↔ Buchung) und die Rückverweise sehen. Der Baustein „Verknüpfungen“ (link-chips) existiert, der Auswahl-Dialog fehlt noch.',
      requirements: [
        { text: 'Verknüpfen: Suche über alle Module als Auswahl, mehrere Objekte in einem Zug', type: 'action', priority: 'must' },
        { text: 'Rückverweise: zeigt, wo ein Objekt überall verwendet wird', type: 'info', priority: 'should' },
        { text: 'Verknüpfung lösen ohne das Objekt zu löschen; Rückgängig', type: 'action', priority: 'must' },
        { text: 'Verknüpfungen bleiben beim Verschieben in den Papierkorb erhalten', type: 'rule', priority: 'could' },
      ],
      interactions: [], viewports: ALL_VP, demoData: {}, variants: [], links: ['system.search', 'system.trash'],
    },
    {
      id: 'system.widgets', name: 'Widgets & Startbildschirm', group: 'Integration', status: 'not_analyzed', tier: 3,
      purpose: 'Home-Widgets (Heute, Erfassen, Wasser +250 ml, Wetter) und App-Verknüpfungen für das Android-Startbildschirm; Vorschau in Hell und Dunkel.',
      requirements: [
        { text: 'Widget „Heute“: nächster Termin und fällige Aufgaben, Tipp öffnet das Detail', type: 'info', priority: 'should' },
        { text: 'Widget „Erfassen“: öffnet das Erfassen-Feld mit Tastatur', type: 'action', priority: 'should' },
        { text: 'App-Verknüpfungen per Langdruck: Neue Aufgabe, Neue Notiz', type: 'action', priority: 'could' },
        { text: 'Leerzustände und Privatmodus in Widgets (keine Beträge auf dem Sperrbildschirm)', type: 'rule', priority: 'must' },
      ],
      interactions: [], viewports: ['mobile'], demoData: {}, variants: [], links: ['system.capture'],
    },
    {
      id: 'system.share', name: 'Teilen', group: 'Integration', status: 'not_analyzed', tier: 3,
      purpose: 'Eingehend: Text, Link oder Bild aus anderen Apps an TAKT teilen und das Ziel wählen (Aufgabe, Notiz, Wissen, Scan, Einkauf). Ausgehend: Termin, Notiz oder Auswertung als Text oder PDF teilen.',
      requirements: [
        { text: 'Eingehend: Ziel-Auswahl mit Vorschau, Unerkanntes landet im Eingang', type: 'action', priority: 'must' },
        { text: 'Ausgehend: Termin, Notiz, Auswertung als Text oder PDF', type: 'action', priority: 'should' },
        { text: 'Datenschutz: nichts wird ohne Auswahl geteilt, Beträge optional maskiert', type: 'rule', priority: 'must' },
      ],
      interactions: [], viewports: ['mobile'], demoData: {}, variants: [], links: ['system.capture', 'picture-to-text.home'],
    },
  ],
  decisions: [
    { featureId: 'system.search', title: 'Welche Such-Darstellung wird Standard?', decision: '', rationale: 'Kompakt (A) zeigt am meisten Treffer in Gruppen, Visuell (B) hilft auch ohne Begriff (Vorschläge, Modulkacheln), Fokus (C) macht die Suche zur Befehlspalette und ersetzt Navigation. Entscheidung nach Test mit echtem Datenvolumen und auf dem Handy.', tradeoffs: 'A: dicht, auf Mobile lang. B: einladend, weniger Treffer sichtbar. C: schnellster Weg zur Aktion, braucht Gewöhnung.', status: 'open' },
    { featureId: 'system.capture', title: 'Erkennung: sofort speichern oder erst bestätigen?', decision: 'TAKT zeigt vor dem Speichern, was erkannt wurde (Art, Felder, Grund). Gespeichert wird erst mit „Erfassen“ oder Enter, die Art lässt sich mit einem Tipp ändern. Nach dem Speichern gibt es „Rückgängig“.', rationale: 'Erkennung ist nie fehlerfrei. Eine sichtbare Vorschau kostet einen Blick, verhindert aber falsch einsortierte Einträge und stärkt das Vertrauen in die Automatik.', tradeoffs: 'Ein Tipp mehr als blindes Speichern. Dafür keine Überraschungen, und Unklares geht in den Eingang statt verloren.', status: 'decided' },
    { featureId: 'system.notifications', title: 'Mitteilungen nach Zeit oder nach Dringlichkeit gruppieren?', decision: '', rationale: 'Nach Zeit (A) ist vertraut und vollständig, nach Dringlichkeit (C) stellt das Wichtigste voran und senkt die Last. Ein Modus-Schalter in den Einstellungen wäre möglich (`notify.groupBy`).', tradeoffs: 'Zeit: Wichtiges kann untergehen. Dringlichkeit: Reihenfolge wirkt weniger chronologisch, Einstufung muss stimmen.', status: 'open' },
    { featureId: 'system.trash', title: 'Löschen: Rückgängig statt Nachfrage', decision: 'Löschen passiert sofort mit Hinweis „Rückgängig“ und landet 30 Tage im Papierkorb. Nachfragen gibt es nur bei Unumkehrbarem: endgültig löschen, Papierkorb leeren, alle Daten löschen.', rationale: 'Nachfragen vor jedem Löschen nerven und werden weggeklickt. Rückgängig plus Papierkorb schützt besser und bleibt schnell (Empfehlung der Pflichtfrage pattern-delete).', tradeoffs: 'Der Papierkorb belegt Speicher bis zu 30 Tage. Dafür selten echte Datenverluste.', status: 'decided' },
    { featureId: 'system.lock', title: 'PIN-Länge und Biometrie als Standard?', decision: '', rationale: 'Vier Stellen sind schnell, sechs sicherer. Biometrie ist bequem, braucht aber die PIN als Rückfall. Mit sensiblen Modulen (Finanzen) wäre eine zweite Hürde denkbar.', tradeoffs: '4 Stellen: schnell, leichter zu erraten. 6 Stellen: sicherer, etwas lästiger. Biometrie als Standard: bequem, Rückfall nötig.', status: 'open' },
    { featureId: 'system.onboarding', title: 'Mit Beispieldaten starten anbieten', decision: 'Am Ende des Onboardings wählt man „Mit Beispieldaten“ oder „Leer starten“. Beispieldaten sind als solche erkennbar und mit einem Tipp löschbar.', rationale: 'Leere Apps wirken tot, Beispiele zeigen sofort den Nutzen. Wer lieber leer startet, behält die Kontrolle.', tradeoffs: 'Beispieldaten müssen sauber trennbar sein, sonst bleibt Müll zurück.', status: 'decided' },
  ],
};
