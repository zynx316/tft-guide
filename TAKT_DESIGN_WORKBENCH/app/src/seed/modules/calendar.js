// Modul "Kalender" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Die Demo-Daten (Termine, Aufgaben) werden auch vom Aufgaben-Modul genutzt (tasks.js importiert sie).

/** Termine: Einzeltermine + Serien (repeat) + Ganztags-/Mehrtagestermine rund um KW 48. */
export const demoEvents = [
  // Serien
  { id: 'e-standup', title: 'Daily Stand-up', start: '2026-11-02T09:45:00', end: '2026-11-02T10:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams', repeat: 'Werktags' },
  { id: 'e-planung', title: 'Wochenplanung', start: '2026-11-02T08:30:00', end: '2026-11-02T09:15:00', category: 'Fokus', tone: 'success', repeat: 'Wöchentlich', note: 'Prioritäten der Woche festlegen, Kalender und Aufgaben abgleichen.' },
  { id: 'e-fitness', title: 'Krafttraining Oberkörper', start: '2026-11-05T18:30:00', end: '2026-11-05T19:30:00', category: 'Fitness', tone: 'info', location: 'Studio Kraftwerk', repeat: 'Wöchentlich' },
  // Montag 23.11.
  { id: 'e1', title: 'Design-Review Kalender', start: '2026-11-23T11:00:00', end: '2026-11-23T12:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams' },
  { id: 'e2', title: 'Fokus: Angebotskalkulation', start: '2026-11-23T14:00:00', end: '2026-11-23T15:30:00', category: 'Fokus', tone: 'success' },
  // Dienstag 24.11. (heute)
  { id: 'e3', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00', category: 'Arbeit', tone: 'accent', location: 'Konferenzraum 2', note: 'Backlog-Priorisierung für Sprint 12.' },
  { id: 'e4', title: 'Fokus: Workbench-Review', start: '2026-11-24T10:30:00', end: '2026-11-24T12:00:00', category: 'Fokus', tone: 'success', note: 'Varianten Kalender und Aufgaben durchgehen.' },
  { id: 'e5', title: 'Mittag mit Jana', start: '2026-11-24T12:30:00', end: '2026-11-24T13:30:00', category: 'Privat', tone: 'accent2', location: 'Café Moll' },
  { id: 'e6', title: 'Lieferanten-Call Etsy', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00', category: 'Sales', tone: 'warning', location: 'Zoom', note: 'Konditionen Q1 besprechen.' },
  // Mittwoch 25.11.
  { id: 'e7', title: 'Kunden-Call Müller GmbH', start: '2026-11-25T09:00:00', end: '2026-11-25T10:00:00', category: 'Sales', tone: 'warning', location: 'Telefon' },
  { id: 'e8', title: 'Produktfoto-Shooting', start: '2026-11-25T13:00:00', end: '2026-11-25T16:00:00', category: 'Arbeit', tone: 'accent', location: 'Studio Ehrenfeld', note: 'Winterkollektion, 12 Artikel.' },
  { id: 'e9', title: 'Physiotherapie', start: '2026-11-25T16:30:00', end: '2026-11-25T17:30:00', category: 'Gesundheit', tone: 'danger', location: 'Praxis Lindner' },
  // Donnerstag 26.11.
  { id: 'e10', title: 'Zahnarzt', start: '2026-11-26T08:00:00', end: '2026-11-26T09:00:00', category: 'Gesundheit', tone: 'danger', location: 'Praxis Dr. Weber' },
  { id: 'e11', title: 'Workshop Preisstrategie', start: '2026-11-26T10:00:00', end: '2026-11-26T12:00:00', category: 'Sales', tone: 'warning', location: 'Teams' },
  { id: 'e12', title: '1:1 mit Lea', start: '2026-11-26T13:30:00', end: '2026-11-26T14:15:00', category: 'Arbeit', tone: 'accent' },
  { id: 'e13', title: 'Fokus: Newsletter schreiben', start: '2026-11-26T14:30:00', end: '2026-11-26T16:00:00', category: 'Fokus', tone: 'success' },
  // Freitag 27.11.
  { id: 'e14', title: 'Black Friday', start: '2026-11-27', end: '2026-11-27', allDay: true, category: 'Sales', tone: 'warning' },
  { id: 'e15', title: 'Shop-Wochenreview', start: '2026-11-27T09:30:00', end: '2026-11-27T10:30:00', category: 'Sales', tone: 'warning', location: 'Büro' },
  { id: 'e16', title: 'Team-Mittagessen', start: '2026-11-27T12:00:00', end: '2026-11-27T13:00:00', category: 'Privat', tone: 'accent2', location: 'Trattoria Bella' },
  { id: 'e17', title: 'Steuerberater', start: '2026-11-27T15:00:00', end: '2026-11-27T16:00:00', category: 'Arbeit', tone: 'accent', location: 'Kanzlei Brandt' },
  // Wochenende
  { id: 'e18', title: 'Wochenmarkt', start: '2026-11-28T10:00:00', end: '2026-11-28T11:30:00', category: 'Privat', tone: 'accent2', location: 'Markt am Dom' },
  { id: 'e19', title: '1. Advent', start: '2026-11-29', end: '2026-11-29', allDay: true, category: 'Privat', tone: 'accent2' },
  { id: 'e20', title: 'Wanderung Taunus', start: '2026-11-29T11:00:00', end: '2026-11-29T15:00:00', category: 'Fitness', tone: 'info', location: 'Feldberg' },
  // übriger November / Dezember
  { id: 'e21', title: 'Quartalsreview Q4', start: '2026-11-05T14:00:00', end: '2026-11-05T16:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams' },
  { id: 'e22', title: 'Messe Köln', start: '2026-11-10', end: '2026-11-12', allDay: true, category: 'Sales', tone: 'warning', location: 'Köln' },
  { id: 'e23', title: 'Fotograf: Produktshooting vorbereiten', start: '2026-11-16T10:00:00', end: '2026-11-16T11:00:00', category: 'Arbeit', tone: 'accent' },
  { id: 'e24', title: 'Janas Geburtstag', start: '2026-11-20', end: '2026-11-20', allDay: true, category: 'Privat', tone: 'accent2' },
  { id: 'e25', title: 'Zahnreinigung', start: '2026-11-18T16:00:00', end: '2026-11-18T17:00:00', category: 'Gesundheit', tone: 'danger' },
  { id: 'e26', title: 'Monatsabschluss Buchhaltung', start: '2026-11-30T10:00:00', end: '2026-11-30T12:00:00', category: 'Arbeit', tone: 'accent', location: 'Büro' },
  { id: 'e27', title: 'Jahresplanung 2027', start: '2026-12-01T09:00:00', end: '2026-12-01T12:00:00', category: 'Fokus', tone: 'success' },
  { id: 'e28', title: 'Nikolausfeier Team', start: '2026-12-04T17:00:00', end: '2026-12-04T20:00:00', category: 'Privat', tone: 'accent2', location: 'Brauhaus' },
];

/** Aufgaben (Referenz: heute Di 24.11.2026). status: Offen | In Arbeit | Review | Erledigt */
export const demoTasks = [
  { id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', project: 'Vertrieb', category: 'Arbeit', status: 'In Arbeit', estimate: 60, note: 'Kunde erwartet Rückmeldung bis 14:00 Uhr.', subtasks: [{ id: 't1s1', title: 'Preise prüfen', done: true }, { id: 't1s2', title: 'PDF erzeugen', done: false }, { id: 't1s3', title: 'An Kunden senden', done: false }] },
  { id: 't2', title: 'Belege Oktober hochladen', due: '2026-11-23', priority: 'mittel', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 30, repeat: 'Monatlich', subtasks: [] },
  { id: 't3', title: 'Produktfotos Winterkollektion auswählen', due: '2026-11-25', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'Offen', estimate: 90, subtasks: [{ id: 't3s1', title: 'Rohdaten sichten', done: true }, { id: 't3s2', title: 'Favoriten markieren', done: true }, { id: 't3s3', title: 'Retusche beauftragen', done: false }, { id: 't3s4', title: 'Bilder hochladen', done: false }] },
  { id: 't4', title: 'Steuerberater-Termin bestätigen', due: '2026-11-23', priority: 'niedrig', project: 'Finanzen', category: 'Finanzen', status: 'Erledigt', done: true, subtasks: [] },
  { id: 't5', title: 'Wireframes Kalender-Wochenansicht prüfen', due: '2026-11-24', priority: 'hoch', project: 'TAKT V2', category: 'Arbeit', status: 'Review', estimate: 45, subtasks: [{ id: 't5s1', title: 'Mobile 390 px testen', done: false }, { id: 't5s2', title: 'Kontraste prüfen', done: false }] },
  { id: 't6', title: 'Newsletter Black Friday planen', due: '2026-11-24T16:30:00', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'In Arbeit', estimate: 60, subtasks: [] },
  { id: 't7', title: 'Lieferantenkonditionen vergleichen', due: '2026-11-24', priority: 'mittel', project: 'Vertrieb', category: 'Arbeit', status: 'Offen', estimate: 45, subtasks: [] },
  { id: 't8', title: 'Etsy-Gebühren buchen', due: '2026-11-22', priority: 'hoch', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 20, subtasks: [] },
  { id: 't9', title: 'Retourenprozess dokumentieren', due: '2026-11-27', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'Offen', estimate: 60, subtasks: [{ id: 't9s1', title: 'Ablauf skizzieren', done: false }, { id: 't9s2', title: 'Vorlagen erstellen', done: false }] },
  { id: 't10', title: 'Jahresplanung 2027 vorbereiten', due: '2026-11-30', priority: 'niedrig', project: 'Vertrieb', category: 'Arbeit', status: 'Offen', estimate: 120, subtasks: [] },
  { id: 't11', title: 'Workbench: Varianten Aufgaben freigeben', due: '2026-11-26', priority: 'hoch', project: 'TAKT V2', category: 'Arbeit', status: 'Review', estimate: 30, subtasks: [] },
  { id: 't12', title: 'Geschenk für Jana besorgen', due: '2026-11-28', priority: 'mittel', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 60, subtasks: [] },
  { id: 't13', title: 'Wochenplanung schreiben', due: '2026-11-30', priority: 'mittel', project: 'TAKT V2', category: 'Arbeit', status: 'Offen', estimate: 30, repeat: 'Wöchentlich', subtasks: [] },
  { id: 't14', title: 'Backup-Festplatte prüfen', priority: 'niedrig', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 30, subtasks: [] },
  { id: 't15', title: 'Winterreifen wechseln lassen', due: '2026-12-05', priority: 'niedrig', project: 'Privat', category: 'Privat', status: 'Offen', subtasks: [] },
  { id: 't16', title: 'Lagerbestand Q4 zählen', due: '2026-12-02', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'Offen', estimate: 90, subtasks: [] },
  { id: 't17', title: 'Kundenfeedback auswerten', due: '2026-11-29', priority: 'mittel', project: 'Vertrieb', category: 'Arbeit', status: 'In Arbeit', estimate: 45, subtasks: [{ id: 't17s1', title: 'Bewertungen exportieren', done: true }, { id: 't17s2', title: 'Themen clustern', done: false }] },
  { id: 't18', title: 'Domain-Verlängerung bezahlen', due: '2026-11-23', priority: 'niedrig', project: 'Shop', category: 'Finanzen', status: 'Erledigt', done: true, subtasks: [] },
  { id: 't19', title: 'Fitnessplan Dezember anpassen', due: '2026-11-27', priority: 'niedrig', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 30, subtasks: [] },
  { id: 't20', title: 'Umsatzsteuer-Voranmeldung', due: '2026-12-10', priority: 'hoch', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 45, subtasks: [] },
  { id: 't21', title: 'Kassenbuch abgleichen', due: '2026-11-20', priority: 'mittel', project: 'Finanzen', category: 'Finanzen', status: 'Erledigt', done: true, subtasks: [] },
];

const metrics = [
  { label: 'Termine diese Woche', value: 27, icon: 'calendar', tone: 'accent', delta: 4, suffix: '' },
  { label: 'Fokuszeit', value: '5,3', unit: 'h', icon: 'target', tone: 'success', delta: 12, spark: [3, 4, 4.5, 4, 5, 5.3] },
  { label: 'Aufgaben diese Woche', value: 10, icon: 'list-checks', tone: 'warning', delta: -2, suffix: '', invert: true },
  { label: 'Freie Fenster', value: '14', unit: 'h', icon: 'timer', tone: 'info' },
];
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const demoData = { events: demoEvents, tasks: demoTasks, metrics };

export default {
  module: {
    id: 'calendar', name: 'Kalender', icon: 'calendar', status: 'active', theme: 'graphite', designVersion: '0.3',
    description: 'Termine planen, überblicken und mit Aufgaben verbinden: Tag, Woche und Monat, Wiederholungen, Kategorien und Filter.',
    source: 'Auftrag 2026-11 (Features aus dem Auftrag; in Phase 1 gegen das TAKT-Modulregister verifizieren)',
    infoArchitecture: 'Hauptansichten: Tag, Woche, Monat (Umschalter im Kopf). Navigation: Zurück/Heute/Weiter, Mini-Monat als Datumssprung. Termin antippen → Detail-Dialog (Bearbeiten/Löschen). Freie Zeit antippen → Termin anlegen. Kategorien als Farben + Filter, fällige Aufgaben als Ganztags-Chips bzw. Seitenspalte.',
    docs: [
      '## Annahmen',
      '- Termine haben genau eine Kategorie (Arbeit, Privat, Fokus, Sales, Fitness, Gesundheit); die Farbe wird aus der Kategorie abgeleitet.',
      '- Wiederholungen: täglich, werktags, wöchentlich, alle 2 Wochen, monatlich. Änderungen betreffen in V2.0 immer die ganze Serie.',
      '- Referenztag der Workbench ist Di, 24.11.2026 09:30 (alle Demo-Daten relativ dazu).',
      '',
      '## Offene Fragen',
      '- Gibt es im echten TAKT-Modul bereits Kalender-Synchronisation (Google/Outlook)? Wenn ja, brauchen Termine eine Quelle-Kennzeichnung.',
      '- Sollen Wochenenden standardmäßig sichtbar sein (Wochenansicht Mo–So vs. Mo–Fr)?',
      '- Wie viele Kategorien sind erlaubt – feste Liste oder frei definierbar?',
    ].join('\n'),
    links: ['tasks', 'home', 'fitness'],
  },
  features: [
    // ------------------------------------------------------------ Tagesansicht
    {
      id: 'calendar.day', name: 'Tagesansicht', group: 'Ansichten', status: 'design',
      purpose: 'Einen einzelnen Tag stundengenau planen: Termine, Lücken und der aktuelle Zeitpunkt auf einen Blick.',
      requirements: [
        { text: 'Zeitraster mit Terminen nach Uhrzeit, Überlappungen nebeneinander', type: 'info', priority: 'must' },
        { text: 'Jetzt-Linie am Referenztag sichtbar', type: 'info', priority: 'should' },
        { text: 'Navigation Zurück / Heute / Weiter und Datumssprung über Mini-Monat', type: 'action', priority: 'must' },
        { text: 'Termin antippen zeigt Details mit Bearbeiten und Löschen', type: 'action', priority: 'must' },
        { text: 'Freie Zeit antippen legt einen Termin mit vorbelegter Uhrzeit an', type: 'action', priority: 'should' },
        { text: 'Leerer Tag zeigt Hinweis statt leerer Fläche', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Termin antippen', result: 'Detail-Dialog öffnet sich', event: 'event.open' },
        { trigger: 'Freie Zeit antippen', result: 'Termin-Formular mit Uhrzeit öffnet sich', event: 'event.create.open' },
        { trigger: 'Pfeil Zurück/Weiter', result: 'Tag wechselt', event: 'calendar.navigate' },
        { trigger: 'Tag im Mini-Monat wählen', result: 'Raster springt zum Datum', event: 'date.select' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Zeitraster + Mini-Monat', concept: 'Klassisches Tagesraster im Hauptbereich, daneben Mini-Monat und „Als Nächstes“. Orientierung links, Detail rechts.',
          description: '+ Vertraut, präzise Zeitplanung  − Auf Mobile rutscht der Kontext unter das Raster',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Tag', subtitle: 'Termine und freie Zeit', primaryLabel: '' } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { view: 'Tag', density: 'comfortable', startHour: 7, endHour: 20 } },
            { id: 'mini', component: 'mini-month', region: 'aside', bind: { events: 'events' } },
            { id: 'next', component: 'focus-next', region: 'aside', props: { showOverdue: false, showSuggestions: false } },
          ],
        },
        {
          id: 'B', name: 'Agenda-Tag', concept: 'Der Tag als chronologische Liste mit freien Fenstern – schneller zu erfassen als ein Raster, ideal für Mobile.',
          description: '+ Sehr schnell lesbar, Lücken sichtbar  − Weniger Gefühl für Dauer und Überschneidungen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Heute', subtitle: 'Di, 24. November', primaryLabel: '' } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Tagesplan', days: 1, startFrom: 'today', showFree: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.week', 'tasks.overview'],
    },
    // --------------------------------------------------------- Wochenansicht
    {
      id: 'calendar.week', name: 'Wochenansicht', group: 'Ansichten', status: 'design',
      purpose: 'Die Woche überblicken und Termine nach Uhrzeit planen. Drei Konzepte: maximale Dichte, großzügige Struktur oder Termine + Aufgaben im Kontext.',
      requirements: [
        { text: 'Sieben Tage (Mo–So) im Zeitraster, Termine nach Uhrzeit positioniert', type: 'info', priority: 'must' },
        { text: 'Überlappende Termine werden nebeneinander dargestellt, nichts verdeckt', type: 'rule', priority: 'must' },
        { text: 'Jetzt-Linie und Hervorhebung des heutigen Tages', type: 'info', priority: 'should' },
        { text: 'Mobile: 3-Tage-Raster mit Tagesleiste statt sieben schmaler Spalten', type: 'rule', priority: 'must' },
        { text: 'Termin antippen → Details; freie Zeit antippen → Termin anlegen', type: 'action', priority: 'must' },
        { text: 'Kategorien farblich unterscheidbar und filterbar', type: 'info', priority: 'should' },
        { text: 'Ganztägige Termine in eigener Zeile über dem Raster', type: 'info', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Termin antippen', result: 'Detail-Dialog (Bearbeiten/Löschen)', event: 'event.open' },
        { trigger: 'Freie Zeit antippen', result: 'Termin-Formular mit Uhrzeit', event: 'event.create.open' },
        { trigger: 'Pfeile / Heute', result: 'Woche wechselt', event: 'calendar.navigate' },
        { trigger: 'Tagesüberschrift antippen', result: 'Tag wird ausgewählt', event: 'date.select' },
        { trigger: 'Aufgabe im Kontext abhaken', result: 'Aufgabe erledigt, Fokusliste aktualisiert', event: 'task.toggle' },
        { trigger: 'Aufgabe einplanen', result: 'Aufgabe wird als Fokus-Termin eingetragen', event: 'focus.schedule' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Kompakt', concept: 'Maximale Dichte: kleine Termine, Zeitraster füllt die Breite, Navigation und Filter in einer Seitenleiste mit Mini-Monat. Für Power-User mit vollem Kalender.',
          description: '+ Meiste Termine sichtbar, schnelle Datumsnavigation  − Kleine Texte, weniger Details je Termin',
          layout: { type: 'sidebar', panelLabel: 'Datum & Kategorien' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Woche', subtitle: 'KW 48 · 23.–29. November', primaryLabel: '' } },
            { id: 'mini', component: 'mini-month', region: 'panel', bind: { events: 'events' } },
            { id: 'search', component: 'search-filter', region: 'panel', props: { filters: [], placeholder: 'Termine suchen …' } },
            { id: 'legend', component: 'calendar-legend', region: 'panel', bind: { events: 'events' } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { density: 'compact', startHour: 8, endHour: 19, view: 'Woche' } },
          ],
        },
        {
          id: 'B', name: 'Visuell', concept: 'Große, farbige Termine mit Ort und Zeit, Tag/Woche per Umschalter, viel Weißraum. Eine ruhige, klar strukturierte Fläche ohne Nebenspalten.',
          description: '+ Sehr lesbar, klare Tagesstruktur, schöner Gesamteindruck  − Weniger Termine ohne Scrollen sichtbar',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Deine Woche', subtitle: 'KW 48 · 27 Termine, 5,3 h Fokuszeit', primaryLabel: '' } },
            { id: 'sw', component: 'view-switcher', region: 'main', props: { options: ['Tag', 'Woche'], initial: 'Woche', align: 'end' } },
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'warning', title: 'Überschneidung am Dienstag', text: 'Sprint-Planung (11:00) überlappt mit „Fokus: Workbench-Review“.', actionLabel: 'Ansehen', dismissible: true } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { density: 'spacious', startHour: 7, endHour: 21, showLocation: true, view: 'auto' } },
          ],
        },
        {
          id: 'C', name: 'Produktiv', concept: 'Termine und Aufgaben in einem Blick: Wochenraster (Mo–Fr) mit fälligen Aufgaben, daneben „Als Nächstes“ mit freien Fenstern und eine Prioritätenliste. Aufgaben lassen sich direkt einplanen.',
          description: '+ Kalender und To-dos verbunden, freie Zeit wird genutzt  − Mehr Informationen, höhere Dichte im Kopf',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender · Fokus', title: 'Woche im Griff', subtitle: 'Termine, Aufgaben und freie Zeit', primaryLabel: '' } },
            { id: 'kpi', component: 'metric-row', region: 'header', bind: { metrics: 'metrics' }, hideOn: ['mobile'] },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { density: 'comfortable', showWeekend: false, showTasks: true, startHour: 8, endHour: 19, view: 'Woche' } },
            { id: 'next', component: 'focus-next', region: 'aside', bind: { events: 'events', tasks: 'tasks' }, props: { title: 'Als Nächstes' } },
            { id: 'tasks', component: 'task-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Prioritäten', groupBy: 'priority', showDone: false, dense: true, limit: 6, showProject: false, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['calendar.tasks', 'calendar.day', 'tasks.overview'],
    },
    // ---------------------------------------------------------- Monatsansicht
    {
      id: 'calendar.month', name: 'Monatsansicht', group: 'Ansichten', status: 'released',
      purpose: 'Den Monat auf einen Blick: wo es voll ist, wo Luft ist – und von dort schnell zu Tag oder Woche springen.',
      requirements: [
        { text: 'Monatsraster Mo–So mit Termin-Chips (Mobile: Punkte)', type: 'info', priority: 'must' },
        { text: 'Heute und gewählter Tag sind klar markiert', type: 'info', priority: 'must' },
        { text: 'Tag antippen wählt das Datum und zeigt die Tagesliste', type: 'action', priority: 'must' },
        { text: 'Monat wechseln mit Pfeilen, „Heute“ springt zurück', type: 'action', priority: 'must' },
        { text: 'Mehr Termine als Platz: „+ n weitere“', type: 'state', priority: 'should' },
        { text: 'Mehrtägige und ganztägige Termine bleiben sichtbar', type: 'rule', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Tag antippen', result: 'Datum wird ausgewählt, Tagesliste aktualisiert', event: 'date.select' },
        { trigger: 'Termin-Chip antippen', result: 'Detail-Dialog', event: 'event.open' },
        { trigger: 'Pfeil Vor/Zurück', result: 'Monat wechselt', event: 'calendar.navigate' },
        { trigger: '„Termin“ antippen', result: 'Formular öffnet sich', event: 'event.create.open' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Raster + Tagesliste', concept: 'Monatsraster oben, darunter die Termine des gewählten Tages. Eine Spalte, auf allen Geräten gleich aufgebaut.',
          description: '+ Einfach, mobil perfekt  − Auf Desktop viel Weißraum neben dem Raster',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Monat', subtitle: 'November 2026', primaryLabel: '' } },
            { id: 'cal', component: 'calendar-month', region: 'main', bind: { events: 'events' }, props: { dayList: 'always', maxChips: 3 } },
          ],
        },
        {
          id: 'B', name: 'Monat + Tagesplan', concept: 'Großes Monatsraster links, rechts der Tagesplan mit freien Fenstern und Kategorien-Filter.',
          description: '+ Nutzt Desktop-Breite, Planung direkt neben dem Überblick  − Mobile fällt auf einspaltig zurück',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Monat', subtitle: 'November 2026', primaryLabel: '' } },
            { id: 'cal', component: 'calendar-month', region: 'main', bind: { events: 'events' }, props: { dayList: 'never', weekNumbers: true } },
            { id: 'day', component: 'agenda', region: 'aside', bind: { events: 'events' }, props: { title: 'Tagesplan', days: 1, showFree: true } },
            { id: 'legend', component: 'calendar-legend', region: 'aside', bind: { events: 'events' }, props: { scope: 'alle' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.week'],
      seedHistory: [
        { kind: 'draft', note: 'Erster Entwurf: Raster + Tagesliste (A), Monat + Tagesplan (B)' },
        { kind: 'review', note: 'Mobil: Punkte statt Chips; QA bestanden auf 360/390/768/1440 px' },
        { kind: 'release', note: 'Variante A freigegeben – einspaltig, mobil-first' },
      ],
    },
    // ---------------------------------------------------------- Termin erstellen
    {
      id: 'calendar.create', name: 'Termin erstellen', group: 'Termine', status: 'design',
      purpose: 'Einen Termin in unter 15 Sekunden anlegen – wahlweise per Formular oder direkt aus dem Kalender.',
      requirements: [
        { text: 'Pflichtfelder: Titel, Datum, Beginn; Ende standardmäßig +1 Stunde', type: 'rule', priority: 'must' },
        { text: 'Kategorie per Chip wählen, Dauer per Schnellwahl (30 Min. … 2 Std.)', type: 'action', priority: 'should' },
        { text: 'Validierung mit verständlichen Fehlermeldungen (Ende nach Beginn)', type: 'state', priority: 'must' },
        { text: 'Optional: Wiederholung, Ort, Notiz', type: 'info', priority: 'should' },
        { text: 'Neuer Termin erscheint sofort im Kalender und bestätigt per Hinweis', type: 'state', priority: 'must' },
        { text: 'Mobile: Formular als Bottom-Sheet mit großen Touch-Zielen', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Termin speichern', result: 'Termin erscheint, Hinweis „angelegt“', event: 'event.create' },
        { trigger: 'Ungültige Eingabe', result: 'Fehlermeldung am Feld', event: 'form.invalid' },
        { trigger: '„Neuer Termin“ im Kalender', result: 'Formular-Dialog öffnet sich', event: 'event.create.open' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Einfaches Formular', concept: 'Standard-Formularkarte mit allen Feldern in einer Spalte; darunter die kommenden Termine als Bestätigung.',
          description: '+ Sofort verständlich, wenig Aufwand  − Keine Kategorie-Chips/Dauer-Schnellwahl',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termin erstellen', primaryLabel: '' } },
            { id: 'form', component: 'form-card', region: 'main', bind: { target: 'events' }, props: { title: 'Neuer Termin', columns: 2, submitLabel: 'Termin anlegen', fields: ['title*:Titel:text', 'start*:Beginn:datetime-local', 'end:Ende:datetime-local', 'category:Kategorie:select:Arbeit|Privat|Fokus|Sales|Fitness|Gesundheit', 'location:Ort:text', 'note:Notiz:textarea'] } },
            { id: 'next', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Als Nächstes', days: 2, startFrom: 'today', showFree: false } },
          ],
        },
        {
          id: 'B', name: 'Geführtes Formular + Vorschau', concept: 'Kategorie-Chips, Dauer-Schnellwahl und Wiederholung im Formular; rechts sieht man sofort, wie sich der Tag füllt (Mini-Monat + Tagesplan).',
          description: '+ Schnell durch Chips, direkte Rückmeldung  − Mehr Bausteine, auf Mobile länger',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termin erstellen', primaryLabel: '' } },
            { id: 'form', component: 'event-form', region: 'main', bind: { events: 'events' }, props: { title: 'Neuer Termin' } },
            { id: 'mini', component: 'mini-month', region: 'aside', bind: { events: 'events' } },
            { id: 'day', component: 'agenda', region: 'aside', bind: { events: 'events' }, props: { title: 'Tagesplan', days: 1, showFree: true } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['calendar.edit'],
    },
    // ---------------------------------------------------------- Termin bearbeiten
    {
      id: 'calendar.edit', name: 'Termin bearbeiten', group: 'Termine', status: 'analyzed',
      purpose: 'Bestehende Termine ändern, verschieben oder löschen – ohne den Kalender zu verlassen.',
      requirements: [
        { text: 'Bearbeiten aus dem Detail-Dialog heraus (gleiche Felder wie Erstellen)', type: 'action', priority: 'must' },
        { text: 'Löschen mit Rückmeldung; bei Serien klar als „Serie löschen“ benannt', type: 'rule', priority: 'must' },
        { text: 'Verschieben per Drag & Drop im Zeitraster (Desktop)', type: 'action', priority: 'could' },
        { text: 'Änderungen sofort sichtbar, Rückgängig-Hinweis nach Löschen', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Termin → Bearbeiten', result: 'Formular mit vorbelegten Werten', event: 'event.open' },
        { trigger: 'Änderungen speichern', result: 'Termin aktualisiert', event: 'event.update' },
        { trigger: 'Löschen', result: 'Termin entfernt, Hinweis', event: 'event.delete' },
      ],
      viewports: ALL_VP, demoData: { events: demoEvents },
      variants: [],
      links: ['calendar.create', 'calendar.recurrence'],
    },
    // ---------------------------------------------------------- Wiederholungen
    {
      id: 'calendar.recurrence', name: 'Wiederholungen', group: 'Termine', status: 'not_analyzed',
      purpose: 'Regelmäßige Termine (Stand-up, Training, Wochenplanung) einmal anlegen und automatisch wiederholen.',
      requirements: [
        { text: 'Wiederholungen: täglich, werktags, wöchentlich, alle 2 Wochen, monatlich', type: 'rule', priority: 'must' },
        { text: 'Serientermine im Kalender erkennbar (Icon/Beschriftung)', type: 'info', priority: 'should' },
        { text: 'Bearbeiten/Löschen: nur dieser Termin oder ganze Serie (offen)', type: 'rule', priority: 'must' },
        { text: 'Enddatum oder Anzahl begrenzen die Serie', type: 'action', priority: 'could' },
      ],
      interactions: [],
      viewports: ALL_VP, demoData: { events: demoEvents },
      variants: [],
    },
    // ---------------------------------------------------------- Kategorien
    {
      id: 'calendar.categories', name: 'Kategorien', group: 'Organisation', status: 'design',
      purpose: 'Termine nach Lebensbereichen einfärben und gruppieren, damit der Kalender auf einen Blick lesbar bleibt.',
      requirements: [
        { text: 'Sechs Standardkategorien mit eigener Farbe (aus Theme-Tokens)', type: 'info', priority: 'must' },
        { text: 'Legende mit Anzahl der Termine je Kategorie', type: 'info', priority: 'should' },
        { text: 'Farbe darf nie der einzige Unterschied sein (Text/Badge im Detail)', type: 'rule', priority: 'must' },
        { text: 'Eigene Kategorien anlegen (später)', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Kategorie in der Legende antippen', result: 'Kalender zeigt nur diese Kategorie', event: 'filter.change' },
        { trigger: 'Termin antippen', result: 'Detail mit Kategorie-Badge', event: 'event.open' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Monat + Legende', concept: 'Monatsraster mit farbigen Chips; Legende und Mini-Monat in der Seitenspalte dienen zugleich als Filter.',
          description: '+ Farben sofort verständlich, Filter inklusive  − Seitenspalte nötig',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Kategorien', subtitle: 'Farben, Zählung und Filter', primaryLabel: '' } },
            { id: 'cal', component: 'calendar-month', region: 'main', bind: { events: 'events' }, props: { dayList: 'auto' } },
            { id: 'legend', component: 'calendar-legend', region: 'aside', bind: { events: 'events' }, props: { scope: 'alle' } },
            { id: 'mini', component: 'mini-month', region: 'aside', bind: { events: 'events' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.filter'],
    },
    // ---------------------------------------------------------- Filter
    {
      id: 'calendar.filter', name: 'Filter', group: 'Organisation', status: 'review',
      purpose: 'Termine nach Suchbegriff und Kategorie eingrenzen, ohne die Ansicht zu wechseln.',
      requirements: [
        { text: 'Volltextsuche über Titel, Ort und Notiz', type: 'action', priority: 'must' },
        { text: 'Kategorie-Filter (ein Klick, erneut klicken hebt auf)', type: 'action', priority: 'must' },
        { text: 'Leeres Ergebnis zeigt verständlichen Hinweis', type: 'state', priority: 'must' },
        { text: 'Aktiver Filter ist deutlich erkennbar', type: 'info', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Suchbegriff eingeben', result: 'Liste/Kalender filtert live', event: 'search.input' },
        { trigger: 'Kategorie wählen', result: 'Nur diese Kategorie sichtbar', event: 'filter.change' },
        { trigger: 'Termin antippen', result: 'Detail-Dialog', event: 'event.open' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Seitenleiste mit Suche + Legende', concept: 'Suche und Kategorien in der Seitenleiste; im Hauptbereich eine 14-Tage-Agenda, die live filtert.',
          description: '+ Filter jederzeit sichtbar  − Auf Mobile eingeklappt',
          layout: { type: 'sidebar', panelLabel: 'Suche & Kategorien' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termine filtern', subtitle: 'Nächste 14 Tage', primaryLabel: '' } },
            { id: 'search', component: 'search-filter', region: 'panel', props: { filters: [], placeholder: 'Titel, Ort, Notiz …' } },
            { id: 'legend', component: 'calendar-legend', region: 'panel', bind: { events: 'events' }, props: { scope: 'alle' } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Agenda', days: 14, startFrom: 'today', hideEmptyDays: true, showFree: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf mit Seitenleiste' }, { kind: 'review', note: 'Zur Prüfung: Suche + Kategorie-Filter' }],
    },
    // ---------------------------------------------------------- Aufgabenintegration
    {
      id: 'calendar.tasks', name: 'Aufgabenintegration', group: 'Organisation', status: 'design',
      purpose: 'Fällige Aufgaben im Kalender sichtbar machen und mit freien Zeitfenstern verbinden.',
      requirements: [
        { text: 'Aufgaben mit Fälligkeit erscheinen als Chips in der Ganztagszeile (Priorität farbig)', type: 'info', priority: 'must' },
        { text: 'Aufgabe antippen wählt sie aus (Detail im Aufgaben-Modul)', type: 'action', priority: 'should' },
        { text: 'Aufgabe lässt sich in ein freies Zeitfenster einplanen (wird Termin „Fokus“)', type: 'action', priority: 'should' },
        { text: 'Erledigte Aufgaben verschwinden aus dem Kalender', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Aufgaben-Chip antippen', result: 'Aufgabe wird ausgewählt', event: 'task.open' },
        { trigger: 'Aufgabe abhaken', result: 'Chip verschwindet', event: 'task.toggle' },
        { trigger: 'Aufgabe einplanen', result: 'Fokus-Termin im freien Fenster', event: 'focus.schedule' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Kalender + Aufgabenliste', concept: 'Wochenraster mit Aufgaben-Chips; rechts die offene Aufgabenliste (abhakbar) und „Als Nächstes“ zum Einplanen.',
          description: '+ Planen und Abhaken an einem Ort  − Dichte Seitenspalte',
          layout: { type: 'split', asideFirstOnMobile: false },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Aufgaben im Kalender', primaryLabel: '' } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { density: 'comfortable', showTasks: true, showWeekend: false, startHour: 8, endHour: 19 } },
            { id: 'focus', component: 'focus-next', region: 'aside', bind: { events: 'events', tasks: 'tasks' } },
            { id: 'tasks', component: 'task-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Offene Aufgaben', groupBy: 'due', showDone: false, dense: true, limit: 8, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.overview', 'calendar.week'],
    },
  ],
  decisions: [
    { featureId: 'calendar.week', title: 'Welche Wochenansicht wird Standard?', decision: '', rationale: 'Kompakt (A) ist am dichtesten, Visuell (B) am ruhigsten, Produktiv (C) verbindet Aufgaben. Entscheidung nach Test mit echten Terminlasten (ca. 20+ Termine/Woche) und auf Mobile.', tradeoffs: 'A: viel Information, kleine Schrift. B: gut lesbar, mehr Scrollen. C: stärkster Nutzen, aber mehr kognitive Last.', status: 'open' },
    { featureId: 'calendar.month', title: 'Monatsansicht: Punkte statt Chips auf Mobile', decision: 'Auf Mobile zeigen Tageszellen bis zu drei farbige Punkte, die Details stehen in der Tagesliste darunter.', rationale: 'Bei 390 px Breite ist eine Zelle ca. 52 px breit – Chip-Beschriftungen wären nicht lesbar und die Touch-Ziele zu klein.', tradeoffs: 'Terminnamen sind erst nach dem Antippen des Tages sichtbar; dafür ruhiges Raster und große Touch-Ziele.', status: 'decided' },
    { featureId: 'calendar.recurrence', title: 'Serien bearbeiten: nur dieser Termin oder ganze Serie?', decision: '', rationale: 'V2.0-Annahme: immer ganze Serie (einfach). Echte Kalender-Apps bieten „nur dieser Termin“. Klären, ob TAKT Ausnahmen speichern kann.', tradeoffs: 'Ganze Serie: einfach, aber unflexibel. Ausnahmen: flexibler, aber komplexere Datenhaltung und UI.', status: 'open' },
    { featureId: 'calendar.tasks', title: 'Aufgaben ohne Uhrzeit als Ganztags-Chips', decision: 'Aufgaben mit Fälligkeit, aber ohne Uhrzeit, erscheinen als gestrichelte Chips in der Ganztagszeile statt als Zeitblock.', rationale: 'Termine sind feste Zeiten, Aufgaben nicht. Gestrichelte Chips unterscheiden beides klar und blockieren keine Zeit.', tradeoffs: 'Aufgaben erscheinen nicht im Raster, solange sie nicht eingeplant sind; dafür bleibt der Kalender ehrlich.', status: 'decided' },
  ],
};
