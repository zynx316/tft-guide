// Modul "Kalender" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Demo-Daten kommen aus der gemeinsamen Datenwelt ('@world:events' …): Anlegen, Verschieben, Quellen ein-/ausblenden wirkt in allen Screens.

import { events as demoEvents, tasks as demoTasks, legacyEvents, legacyTasks } from '../world/organisation.js';
export { demoEvents, demoTasks };

const metrics = [
  { label: 'Termine diese Woche', value: 27, icon: 'calendar', tone: 'accent', delta: 4, suffix: '' },
  { label: 'Fokuszeit', value: '5,3', unit: 'h', icon: 'target', tone: 'success', delta: 12, spark: [3, 4, 4.5, 4, 5, 5.3] },
  { label: 'Aufgaben diese Woche', value: 10, icon: 'list-checks', tone: 'warning', delta: -2, suffix: '', invert: true },
  { label: 'Freie Fenster', value: '14', unit: 'h', icon: 'timer', tone: 'info' },
];
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];

/** Freigegebene Monatsansicht: unveränderte Demo-Daten (Stand vor der Welt-Bindung). Neue Arbeitsversion → Weltbindung. */
const monthData = { events: legacyEvents(), tasks: legacyTasks(), metrics };
/** Alle übrigen Features: gemeinsame Datenwelt. */
const demoData = { events: '@world:events', tasks: '@world:tasks' };
const withWorld = (extra = {}) => ({ ...demoData, ...extra });
const sourceData = withWorld({ sources: '@world:calSources', holidays: '@world:calHolidays', birthdays: '@world:calBirthdays', prefs: '@world:calPrefs' });
const NAV = 'navigate';
const I = (trigger, result, event, to) => ({ trigger, result, event, ...(to ? { to } : {}) });
const SHORTCUTS = ['Tag|calendar-days|day.open', 'Woche|calendar-range|week.open', 'Monat|calendar|month.open', 'Agenda|list|agenda.open', 'Quellen|layers|sources.open'];

export default {
  module: {
    id: 'calendar', name: 'Kalender', icon: 'calendar', area: 'Tag & Organisation', status: 'active', theme: 'graphite', designVersion: '0.4', homeFeatureId: 'calendar.home',
    description: 'Termine planen, überblicken und mit Aufgaben verbinden: Übersicht, Tag, Woche, Monat und Agenda, Termin-Detail mit Teilnehmern und Erinnerungen, Quellen, Feiertage und Geburtstage.',
    source: 'Auftrag 2026-11 (Features aus dem Auftrag; in Phase 1 gegen das TAKT-Modulregister verifizieren)',
    infoArchitecture: 'Einstieg: Übersicht (heute, Wochenlast, nächste Feiertage und Geburtstage). Von dort: Tag, Woche, Monat, Agenda, Kalender & Quellen, „Neuer Termin“. Termin antippen (überall) → Termin-Detail mit Teilnehmern, Erinnerungen, Konfliktwarnung und Bearbeiten. Datum antippen (Wochenlast) → Tag. Freie Zeit antippen → Termin anlegen. Kategorien als Farben + Filter, fällige Aufgaben als Chips bzw. Seitenspalte; Aufgabe antippen → Aufgaben-Detail.',
    docs: [
      '## Annahmen',
      '- Termine haben genau eine Kategorie (Arbeit, Privat, Fokus, Sales, Fitness, Gesundheit) und gehören zu einer Kalenderquelle; die Farbe kommt aus der Kategorie, die Quelle bestimmt die Sichtbarkeit.',
      '- Wiederholungen: täglich, werktags, wöchentlich, alle 2 Wochen, monatlich. Änderungen betreffen in V2.0 immer die ganze Serie (Entscheidung offen).',
      '- Feiertage gelten für NRW (Bielefeld), Geburtstage kommen aus den Kontakten. Beides sind schreibgeschützte Zusatzkalender und lassen sich ausblenden.',
      '- Ausblenden einer Quelle wirkt sofort in allen Ansichten (Tag, Woche, Monat, Agenda, Übersicht).',
      '- Referenztag der Workbench ist Di, 24.11.2026 09:30 (alle Demo-Daten relativ dazu).',
      '',
      '## Offene Fragen',
      '- Echte Synchronisation (Google, Microsoft, iCloud, CalDAV): in V2.0 nur Lesen oder auch Schreiben? Beeinflusst Fehlerbilder („Anmeldung abgelaufen“).',
      '- Serien: „nur dieser Termin / dieser und folgende / alle“ – braucht Ausnahmen im Datenmodell.',
      '- Sollen Wochenenden standardmäßig sichtbar sein (Wochenansicht Mo–So vs. Mo–Fr)?',
      '- Fahrzeit und „Losgehen um …“: aus Standort berechnet oder manuell je Termin?',
      '',
      '## Daten & Grenzen der Demo',
      '- Die freigegebene Monatsansicht nutzt noch ihre ursprünglichen Demo-Daten und zeigt neue Termine und Feiertage erst nach einer neuen Arbeitsversion.',
      '- Einstellungen (Wochenstart, Dauer, Zeitraster) werden gespeichert, steuern die Ansichten in der Demo aber noch nicht.',
    ].join('\n'),
    links: ['tasks', 'home', 'fitness', 'weather'],
  },
  features: [
    // ------------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'calendar.home', name: 'Übersicht', group: 'Übersicht', status: 'review', tier: 1,
      purpose: 'Der Einstieg in den Kalender: Was steht heute an, wie voll ist die Woche, was kommt als Nächstes (Feiertage, Geburtstage) – und von hier mit einem Tipp in Tag, Woche, Monat, Agenda oder zum einzelnen Termin.',
      requirements: [
        { text: 'Heute: Termine mit Uhrzeit, laufender bzw. nächster Termin hervorgehoben, freie Fenster sichtbar', type: 'info', priority: 'must' },
        { text: 'Wochenlast: gebuchte Zeit je Tag, Überschneidungen markiert, volle Tage auffällig', type: 'info', priority: 'should' },
        { text: 'Kennzahlen (Termine heute, gebucht, Woche, Fokuszeit, frei) werden berechnet, nie von Hand gepflegt', type: 'rule', priority: 'must' },
        { text: 'Nächste Feiertage (NRW) und Geburtstage mit Countdown; ausgeblendete Quellen verschwinden auch hier', type: 'info', priority: 'should' },
        { text: 'Termin antippen öffnet das Termin-Detail; Tag, Woche, Monat, Agenda und Quellen sind mit einem Tipp erreichbar', type: 'action', priority: 'must' },
        { text: 'Neuen Termin ohne Umweg anlegen: Formular oder ein Satz („Zahnarzt morgen 14 Uhr“)', type: 'action', priority: 'must' },
        { text: 'Hinweise bei Überschneidungen und freien Fenstern; Aufgaben lassen sich direkt einplanen', type: 'info', priority: 'should' },
        { text: 'Leerzustand: kein Termin heute = ruhiger Tag mit nächstem Termin; Erstnutzung bietet „Kalender verbinden“ an', type: 'state', priority: 'must' },
        { text: 'Mobile: eine Spalte, Touch-Ziele ≥ 44 px, kein horizontales Scrollen', type: 'rule', priority: 'must' },
      ],
      interactions: [
        I('Termin antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
        I('Tag in der Wochenlast oder Kennzahl „heute“ antippen', 'Tagesansicht für dieses Datum', 'day.open', 'calendar.day'),
        I('„Woche“ antippen', 'Wochenansicht', 'week.open', 'calendar.week'),
        I('„Monat“ antippen', 'Monatsansicht', 'month.open', 'calendar.month'),
        I('„Agenda“ antippen', 'Terminliste der nächsten Tage', 'agenda.open', 'calendar.agenda'),
        I('„Quellen“ antippen', 'Kalender & Quellen, Feiertage', 'sources.open', 'calendar.sources'),
        I('„Termin“ (Kopfzeile) antippen', 'Termin-Formular', 'create.open', 'calendar.create'),
        I('Aufgabe im Hinweis antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Satz eingeben + Enter', 'Termin erscheint in der Agenda, Hinweis „angelegt“', 'event.create'),
        I('Hinweis „Einplanen“', 'Aufgabe wird als Fokus-Termin ins freie Fenster gelegt', 'focus.schedule'),
      ],
      acceptance: [
        'Die Startseite zeigt den laufenden oder nächsten Termin, die Terminliste von heute und die Wochenlast ohne Seitenwechsel.',
        'Von der Startseite führt jeder Termin mit einem Tipp zum Termin-Detail, Tag, Woche, Monat, Agenda und Quellen sind mit höchstens einem Tipp erreichbar.',
        'Ein Termin, der per Ein-Satz-Eingabe angelegt wird, erscheint sofort in der Terminliste und in allen anderen Ansichten.',
        'Überschneidungen am selben Tag werden als Hinweis genannt und führen zum betroffenen Termin.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, alle Ziele sind mindestens 36 px hoch.',
      ],
      flows: [
        { id: 'fl-heute', name: 'Nächsten Termin prüfen', steps: [{ featureId: 'calendar.home', action: 'Nächsten Termin auf der Karte lesen, „Details“ antippen' }, { featureId: 'calendar.event', action: 'Teilnehmer und Erinnerung ansehen' }] },
        { id: 'fl-konflikt', name: 'Überschneidung auflösen', steps: [{ featureId: 'calendar.home', action: 'Hinweis „Überschneidung um 11:00“ ansehen' }, { featureId: 'calendar.event', action: 'Freies Fenster wählen, „Verschieben“' }, { featureId: 'calendar.home', action: 'Hinweis ist verschwunden' }] },
        { id: 'fl-woche', name: 'Vollen Tag finden', steps: [{ featureId: 'calendar.home', action: 'In der Wochenlast den vollsten Tag antippen' }, { featureId: 'calendar.day', action: 'Tagesraster ansehen' }] },
      ],
      viewports: ALL_VP, demoData: sourceData,
      variants: [
        {
          id: 'A', name: 'Heute & Woche kompakt', direction: 'kompakt', concept: 'Dichte Übersicht: Kennzahlen in einer Reihe, Agenda für heute und morgen in der Hauptspalte, Wochenlast und nächste Feiertage/Geburtstage als Zeilen in der Seitenspalte. Alles mit exakten Zahlen.',
          description: '+ Viel Information, schnell zu scannen, Aktionen in der Zeile  − Viele Elemente, auf Mobile lang',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Heute', subtitle: 'Di, 24. November · KW 48', primaryLabel: 'Termin', primaryEvent: 'create.open' } },
            { id: 'stats', component: 'cal-stats', region: 'header', bind: { events: 'events' }, props: { style: 'tiles', items: ['today', 'booked', 'week', 'free'] } },
            { id: 'nav', component: 'shortcut-bar', region: 'main', props: { style: 'chips', items: SHORTCUTS } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Heute & morgen', days: 2, startFrom: 'today', showFree: true, openMode: NAV } },
            { id: 'load', component: 'week-load', region: 'aside', bind: { events: 'events' }, props: { title: 'Wochenlast', style: 'rows' } },
            { id: 'special', component: 'special-days', region: 'aside', bind: { holidays: 'holidays', birthdays: 'birthdays', events: 'events' }, props: { title: 'Feiertage & Geburtstage', limit: 4, style: 'list' } },
          ],
        },
        {
          id: 'B', name: 'Tag als Band, Woche als Säulen', direction: 'visuell', concept: 'Eine Botschaft je Karte: der nächste Termin groß, der Tag als farbiger Zeitstreifen mit freien Fenstern, die Woche als Säulen, Feiertage und Geburtstage als Karten. Große Kacheln führen in die Ansichten.',
          description: '+ Ruhig, sofort verständlich, schöner Gesamteindruck  − Weniger Termine ohne Scrollen, Details erst nach dem Antippen',
          layout: { type: 'grid', stretch: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Dein Tag', subtitle: 'Di, 24. November · KW 48', primaryLabel: 'Termin', primaryEvent: 'create.open' } },
            { id: 'next', component: 'next-event', region: 'main', span: 5, spanTablet: 12, bind: { events: 'events' }, props: { style: 'hero', openMode: NAV } },
            { id: 'band', component: 'day-band', region: 'main', span: 7, spanTablet: 12, bind: { events: 'events' }, props: { title: 'Heute im Überblick', showList: true, listLimit: 3, openMode: NAV } },
            { id: 'load', component: 'week-load', region: 'main', span: 7, spanTablet: 12, bind: { events: 'events' }, props: { title: 'Wochenlast', style: 'bars' } },
            { id: 'special', component: 'special-days', region: 'main', span: 5, spanTablet: 12, bind: { holidays: 'holidays', birthdays: 'birthdays', events: 'events' }, props: { title: 'Als Nächstes im Jahr', limit: 3, style: 'cards' } },
            { id: 'nav', component: 'shortcut-bar', region: 'main', span: 12, props: { style: 'tiles', items: SHORTCUTS } },
          ],
        },
        {
          id: 'C', name: 'Als Nächstes', direction: 'fokus', concept: 'Der nächste Termin zuerst, darunter Erfassen in einem Satz und sachliche Hinweise (Überschneidung, freies Fenster mit passender Aufgabe, Frist). Die Agenda von heute ist ruhig dahinter, Ansichten nur als Chips.',
          description: '+ Klare nächste Aktion, Erfassen ohne Umweg, Kontext aus Aufgaben  − Weniger Gesamtüberblick über die Woche',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Jetzt', subtitle: 'Di, 24. November · 09:30', primaryLabel: 'Termin', primaryEvent: 'create.open' } },
            { id: 'next', component: 'next-event', region: 'main', bind: { events: 'events' }, props: { style: 'hero', openMode: NAV } },
            { id: 'quick', component: 'event-quick-add', region: 'main', bind: { events: 'events' }, props: { title: 'Termin erfassen', showExamples: true } },
            { id: 'hints', component: 'cal-hints', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { title: 'Hinweise', limit: 3 } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Heute noch', days: 1, startFrom: 'today', showFree: false, openMode: NAV } },
            { id: 'nav', component: 'shortcut-bar', region: 'main', props: { style: 'chips', items: SHORTCUTS } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.day', 'calendar.week', 'calendar.month', 'calendar.agenda', 'calendar.event', 'calendar.sources', 'tasks.home', 'home.today'],
    },
    // ------------------------------------------------------------ Tagesansicht
    {
      id: 'calendar.day', name: 'Tagesansicht', group: 'Ansichten', status: 'design', tier: 1,
      purpose: 'Einen einzelnen Tag stundengenau planen: Termine, Lücken und der aktuelle Zeitpunkt auf einen Blick – als Zeitraster, als Liste oder als Tagesband.',
      requirements: [
        { text: 'Zeitraster mit Terminen nach Uhrzeit, Überlappungen nebeneinander', type: 'info', priority: 'must' },
        { text: 'Jetzt-Linie am Referenztag sichtbar', type: 'info', priority: 'should' },
        { text: 'Navigation Zurück / Heute / Weiter und Datumssprung über Mini-Monat', type: 'action', priority: 'must' },
        { text: 'Termin antippen öffnet das Termin-Detail', type: 'action', priority: 'must' },
        { text: 'Freie Zeit antippen legt einen Termin mit vorbelegter Uhrzeit an', type: 'action', priority: 'should' },
        { text: 'Aus der Wochenlast der Übersicht geöffnet zeigt die Ansicht genau dieses Datum', type: 'rule', priority: 'must' },
        { text: 'Leerer Tag zeigt Hinweis statt leerer Fläche', type: 'state', priority: 'should' },
      ],
      interactions: [
        I('Termin antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
        I('Freie Zeit antippen', 'Termin-Formular mit Uhrzeit öffnet sich', 'event.create.open'),
        I('Pfeil Zurück/Weiter', 'Tag wechselt', 'calendar.navigate'),
        I('Tag im Mini-Monat wählen', 'Raster springt zum Datum', 'date.select'),
      ],
      acceptance: [
        'Die Tagesansicht zeigt alle Termine des gewählten Tages ohne verdeckte Überlappungen.',
        'Aus der Übersicht geöffnet steht das angetippte Datum im Kopf der Ansicht.',
        'Ein Tipp auf einen Termin öffnet das Termin-Detail (im Launcher als eigener Screen).',
        'Freie Fenster sind als solche erkennbar und lassen sich zum Anlegen nutzen.',
      ],
      flows: [{ id: 'fl-tag', name: 'Tag planen', steps: [{ featureId: 'calendar.day', action: 'Freies Fenster antippen und Termin anlegen' }, { featureId: 'calendar.day', action: 'Neuen Termin im Raster sehen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Zeitraster + Mini-Monat', direction: 'kompakt', concept: 'Klassisches Tagesraster im Hauptbereich, daneben Mini-Monat und „Als Nächstes“. Orientierung links, Detail rechts.',
          description: '+ Vertraut, präzise Zeitplanung  − Auf Mobile rutscht der Kontext unter das Raster',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Tag', subtitle: 'Termine und freie Zeit', primaryLabel: '' } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { view: 'Tag', density: 'comfortable', startHour: 7, endHour: 20, openMode: NAV } },
            { id: 'mini', component: 'mini-month', region: 'aside', bind: { events: 'events' } },
            { id: 'next', component: 'focus-next', region: 'aside', props: { showOverdue: false, showSuggestions: false, openMode: NAV } },
          ],
        },
        {
          id: 'B', name: 'Agenda-Tag', direction: 'fokus', concept: 'Der Tag als chronologische Liste mit freien Fenstern – schneller zu erfassen als ein Raster, ideal für Mobile.',
          description: '+ Sehr schnell lesbar, Lücken sichtbar  − Weniger Gefühl für Dauer und Überschneidungen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Heute', subtitle: 'Di, 24. November', primaryLabel: '' } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Tagesplan', days: 1, startFrom: 'today', showFree: true, openMode: NAV } },
          ],
        },
        {
          id: 'C', name: 'Tagesband', direction: 'visuell', concept: 'Der Tag als farbiger Zeitstreifen mit freien Fenstern und Jetzt-Marke, darunter das großzügige Tagesraster mit Ort. Ein Blick zeigt, wo Luft ist.',
          description: '+ Dichte und freie Zeit sofort sichtbar, schön  − Zwei Darstellungen desselben Tages, mehr Scrollen',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Tag', subtitle: 'Dichte, Lücken und Details', primaryLabel: '' } },
            { id: 'band', component: 'day-band', region: 'main', bind: { events: 'events' }, props: { title: 'Tagesband', day: 'selectedDate', showList: false } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { view: 'Tag', density: 'spacious', startHour: 7, endHour: 20, showLocation: true, openMode: NAV } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.week', 'calendar.event', 'tasks.overview'],
    },
    // --------------------------------------------------------- Wochenansicht
    {
      id: 'calendar.week', name: 'Wochenansicht', group: 'Ansichten', status: 'design', tier: 1,
      purpose: 'Die Woche überblicken und Termine nach Uhrzeit planen. Drei Konzepte: maximale Dichte, großzügige Struktur oder Termine + Aufgaben im Kontext.',
      requirements: [
        { text: 'Sieben Tage (Mo–So) im Zeitraster, Termine nach Uhrzeit positioniert', type: 'info', priority: 'must' },
        { text: 'Überlappende Termine werden nebeneinander dargestellt, nichts verdeckt', type: 'rule', priority: 'must' },
        { text: 'Jetzt-Linie und Hervorhebung des heutigen Tages', type: 'info', priority: 'should' },
        { text: 'Mobile: 3-Tage-Raster mit Tagesleiste statt sieben schmaler Spalten', type: 'rule', priority: 'must' },
        { text: 'Termin antippen → Termin-Detail; freie Zeit antippen → Termin anlegen', type: 'action', priority: 'must' },
        { text: 'Kategorien farblich unterscheidbar und filterbar', type: 'info', priority: 'should' },
        { text: 'Ganztägige Termine (auch Feiertage und Geburtstage) in eigener Zeile über dem Raster', type: 'info', priority: 'should' },
      ],
      interactions: [
        I('Termin antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
        I('Freie Zeit antippen', 'Termin-Formular mit Uhrzeit', 'event.create.open'),
        I('Pfeile / Heute', 'Woche wechselt', 'calendar.navigate'),
        I('Tagesüberschrift antippen', 'Tag wird ausgewählt', 'date.select'),
        I('Aufgabe im Kontext antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Aufgabe einplanen', 'Aufgabe wird als Fokus-Termin eingetragen', 'focus.schedule'),
        I('„Aufgaben“ (Kopfzeile, Variante C)', 'Aufgaben im Kalender: Raster mit Aufgabenliste', 'header.secondary', 'calendar.tasks'),
      ],
      acceptance: [
        'Alle Termine der Woche erscheinen an der richtigen Uhrzeit, überlappende Termine liegen nebeneinander.',
        'Auf Mobile zeigt die Ansicht drei Tage mit Tagesleiste und hat keinen horizontalen Überlauf.',
        'Ein Tipp auf einen Termin öffnet das Termin-Detail; ein Tipp auf freie Zeit öffnet das Formular mit Uhrzeit.',
        'Feiertage und Geburtstage stehen in der Ganztagszeile und verschwinden, wenn ihre Quelle ausgeblendet wird.',
        'Variante C zeigt fällige Aufgaben als gestrichelte Chips und erlaubt das Einplanen in freie Fenster.',
      ],
      flows: [{ id: 'fl-woche', name: 'Woche prüfen und Termin öffnen', steps: [{ featureId: 'calendar.week', action: 'Dienstag ansehen, Überschneidung erkennen' }, { featureId: 'calendar.event', action: 'Termin öffnen und verschieben' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Kompakt', direction: 'kompakt', concept: 'Maximale Dichte: kleine Termine, Zeitraster füllt die Breite, Navigation und Filter in einer Seitenleiste mit Mini-Monat. Für Power-User mit vollem Kalender.',
          description: '+ Meiste Termine sichtbar, schnelle Datumsnavigation  − Kleine Texte, weniger Details je Termin',
          layout: { type: 'sidebar', panelLabel: 'Datum & Kategorien' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Woche', subtitle: 'KW 48 · 23.–29. November', primaryLabel: '' } },
            { id: 'mini', component: 'mini-month', region: 'panel', bind: { events: 'events' } },
            { id: 'search', component: 'search-filter', region: 'panel', props: { filters: [], placeholder: 'Termine suchen …' } },
            { id: 'legend', component: 'calendar-legend', region: 'panel', bind: { events: 'events' } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { density: 'compact', startHour: 8, endHour: 19, view: 'Woche', openMode: NAV } },
          ],
        },
        {
          id: 'B', name: 'Visuell', direction: 'visuell', concept: 'Große, farbige Termine mit Ort und Zeit, Tag/Woche per Umschalter, viel Weißraum. Eine ruhige, klar strukturierte Fläche ohne Nebenspalten.',
          description: '+ Sehr lesbar, klare Tagesstruktur, schöner Gesamteindruck  − Weniger Termine ohne Scrollen sichtbar',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Deine Woche', subtitle: 'KW 48 · 23.–29. November', primaryLabel: '' } },
            { id: 'sw', component: 'view-switcher', region: 'main', props: { options: ['Tag', 'Woche'], initial: 'Woche', align: 'end' } },
            { id: 'note', component: 'cal-hints', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { title: '', limit: 2 } },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { density: 'spacious', startHour: 7, endHour: 21, showLocation: true, view: 'auto', openMode: NAV } },
          ],
        },
        {
          id: 'C', name: 'Produktiv', direction: 'fokus', concept: 'Termine und Aufgaben in einem Blick: Wochenraster (Mo–Fr) mit fälligen Aufgaben, daneben „Als Nächstes“ mit freien Fenstern und eine Prioritätenliste. Aufgaben lassen sich direkt einplanen.',
          description: '+ Kalender und To-dos verbunden, freie Zeit wird genutzt  − Mehr Informationen, höhere Dichte im Kopf',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender · Fokus', title: 'Woche im Griff', subtitle: 'Termine, Aufgaben und freie Zeit', primaryLabel: '', secondaryLabel: 'Aufgaben', secondaryIcon: 'list-checks' } },
            { id: 'kpi', component: 'cal-stats', region: 'header', bind: { events: 'events' }, props: { style: 'tiles', items: ['week', 'focus', 'booked', 'free'] }, hideOn: ['mobile'] },
            { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { density: 'comfortable', showWeekend: false, showTasks: true, startHour: 8, endHour: 19, view: 'Woche', openMode: NAV } },
            { id: 'next', component: 'focus-next', region: 'aside', bind: { events: 'events', tasks: 'tasks' }, props: { title: 'Als Nächstes', openMode: NAV } },
            { id: 'tasks', component: 'task-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Prioritäten', groupBy: 'priority', showDone: false, dense: true, limit: 6, showProject: false, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['calendar.tasks', 'calendar.day', 'calendar.event', 'tasks.overview'],
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
      viewports: ALL_VP, demoData: monthData,
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
    // ---------------------------------------------------------- Agenda
    {
      id: 'calendar.agenda', name: 'Agenda', group: 'Ansichten', status: 'design', tier: 2,
      purpose: 'Kommende Termine als chronologische Liste – die schnellste Ansicht auf dem Handy: durchsuchbar, nach Kategorie filterbar, mit freien Fenstern und Feiertagen.',
      requirements: [
        { text: 'Termine der nächsten 14 Tage nach Tag gruppiert, Tage ohne Termin ausgeblendet', type: 'info', priority: 'must' },
        { text: 'Suche über Titel, Ort und Notiz; Kategorie-Filter mit einem Tipp', type: 'action', priority: 'must' },
        { text: 'Termin antippen öffnet das Termin-Detail', type: 'action', priority: 'must' },
        { text: 'Freie Fenster ≥ 45 Min. sichtbar und mit einem Tipp nutzbar', type: 'action', priority: 'could' },
        { text: 'Feiertage und Geburtstage erscheinen als Ganztags-Zeilen', type: 'info', priority: 'should' },
        { text: 'Kein Treffer: verständlicher Hinweis mit „Filter zurücksetzen“', type: 'state', priority: 'must' },
      ],
      interactions: [
        I('Termin antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
        I('Suchbegriff eingeben', 'Liste filtert live', 'search.input'),
        I('Kategorie wählen', 'Nur diese Kategorie sichtbar', 'filter.change'),
        I('„Nutzen“ im freien Fenster', 'Termin-Formular mit Uhrzeit', 'agenda.free.use'),
        I('„Filter“ (Kopfzeile)', 'Filter-Ansicht mit Seitenleiste', 'header.secondary', 'calendar.filter'),
      ],
      acceptance: [
        'Die Agenda zeigt jeden Termin der nächsten 14 Tage genau einmal, nach Tag gruppiert und chronologisch.',
        'Die Suche reduziert die Liste live; bei keinem Treffer erscheint ein Hinweis.',
        'Ein Tipp auf einen Termin öffnet das Termin-Detail.',
        'Auf Mobile ist die Liste einspaltig und alle Zeilen sind mindestens 44 px hoch.',
      ],
      viewports: ALL_VP, demoData: sourceData,
      variants: [
        {
          id: 'A', name: 'Liste mit Suche', direction: 'kompakt', concept: 'Suche und Kategorien in der Seitenleiste, im Hauptbereich eine 14-Tage-Agenda, die live filtert. Ohne leere Tage.',
          description: '+ Filter jederzeit sichtbar, sehr dicht  − Seitenleiste auf Mobile eingeklappt',
          layout: { type: 'sidebar', panelLabel: 'Suche & Kategorien' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Agenda', subtitle: 'Nächste 14 Tage', primaryLabel: '', secondaryLabel: 'Filter', secondaryIcon: 'sliders-horizontal' } },
            { id: 'search', component: 'search-filter', region: 'panel', props: { filters: [], placeholder: 'Titel, Ort, Notiz …' } },
            { id: 'legend', component: 'calendar-legend', region: 'panel', bind: { events: 'events' }, props: { scope: 'alle' } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Agenda', days: 14, startFrom: 'today', hideEmptyDays: true, showFree: false, openMode: NAV } },
          ],
        },
        {
          id: 'B', name: 'Agenda mit Monat', direction: 'visuell', concept: 'Eine Woche Agenda mit freien Fenstern, daneben Mini-Monat als Datumssprung und die nächsten Feiertage und Geburtstage als Karten.',
          description: '+ Ruhiger, Feiertage im Blick, Datumssprung  − Weniger Tage gleichzeitig sichtbar',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Agenda', subtitle: 'Die nächsten Tage', primaryLabel: '', secondaryLabel: 'Filter', secondaryIcon: 'sliders-horizontal' } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Diese Woche', days: 7, startFrom: 'today', hideEmptyDays: false, showFree: true, openMode: NAV } },
            { id: 'mini', component: 'mini-month', region: 'aside', bind: { events: 'events' } },
            { id: 'special', component: 'special-days', region: 'aside', bind: { holidays: 'holidays', birthdays: 'birthdays', events: 'events' }, props: { title: 'Feiertage & Geburtstage', limit: 3, style: 'list' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.filter', 'calendar.event', 'calendar.sources'],
    },
    // ---------------------------------------------------------- Termin-Detail
    {
      id: 'calendar.event', name: 'Termin-Detail', group: 'Termine', status: 'design', tier: 1,
      purpose: 'Ein Termin vollständig: Zeit mit Countdown, Ort mit Fahrzeit, Teilnehmer mit Zusage-Status, Erinnerungen, Konfliktwarnung mit Vorschlag für ein freies Fenster – und Bearbeiten, Duplizieren, Löschen.',
      requirements: [
        { text: 'Zeit (Datum, Beginn–Ende, Dauer), Kategorie, Wiederholung und Quelle auf einen Blick; Countdown „in 1 Std. 30 Min.“', type: 'info', priority: 'must' },
        { text: 'Ort mit Fahrzeit und Losgehzeit am selben Tag, Kartenvorschau, Online-Link mit „Beitreten“', type: 'info', priority: 'should' },
        { text: 'Teilnehmer mit Zusage-Status (Zugesagt, Offen, Vielleicht, Abgesagt); Personen hinzufügen und entfernen', type: 'action', priority: 'must' },
        { text: 'Mehrere Erinnerungen relativ zum Beginn („15 Min. vorher“, „1 Tag vorher“) mit ausgerechneter Uhrzeit', type: 'action', priority: 'must' },
        { text: 'Konfliktwarnung bei Überschneidung mit Namen der Termine und Vorschlag freier Fenster; „Verschieben“ setzt um', type: 'rule', priority: 'must' },
        { text: 'Bearbeiten (Formular), Duplizieren, Löschen; bei Serien klar als „Serie“ benannt', type: 'action', priority: 'must' },
        { text: 'Ohne Auswahl zeigt die Ansicht den nächsten Termin; gelöschter Termin → Hinweis statt leerer Fläche', type: 'state', priority: 'should' },
      ],
      interactions: [
        I('Bearbeiten', 'Formular mit vorbelegten Werten', 'event.update'),
        I('Duplizieren', 'Kopie für morgen, Hinweis', 'event.duplicate'),
        I('Löschen', 'Termin entfernt, Hinweis', 'event.delete'),
        I('Teilnehmerstatus antippen', 'Status wechselt (Offen → Zugesagt → …)', 'attendee.status'),
        I('Person einladen', 'Teilnehmer erscheint mit Status „Offen“', 'attendee.add'),
        I('Erinnerung hinzufügen', 'Neue Erinnerung mit Uhrzeit', 'reminder.add'),
        I('„Verschieben“ bei Konflikt', 'Termin liegt im freien Fenster, Warnung verschwindet', 'conflict.move'),
        I('Kollidierenden Termin antippen', 'Der andere Termin wird angezeigt', 'event.open'),
        I('„Beitreten“', 'Online-Besprechung öffnet sich (Demo: Hinweis)', 'event.join'),
      ],
      acceptance: [
        'Aus Übersicht, Woche, Tag oder Agenda geöffnet zeigt das Detail genau den angetippten Termin (auch bei Serientermin mit dem richtigen Datum).',
        'Bei einer Überschneidung nennt die Konfliktwarnung die kollidierenden Termine und bietet mindestens ein freies Fenster zum Verschieben an.',
        'Nach „Verschieben“ ist die Warnung verschwunden und der Termin steht in allen Ansichten an der neuen Zeit.',
        'Erinnerungen und Teilnehmer lassen sich ändern; die Änderung bleibt beim Wechsel der Ansicht erhalten.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, alle Aktionen sind mindestens 36 px hoch.',
      ],
      flows: [
        { id: 'fl-verschieben', name: 'Überschneidung auflösen', steps: [{ featureId: 'calendar.event', action: 'Sprint-Planung öffnen, Warnung lesen' }, { featureId: 'calendar.event', action: 'Freies Fenster „13:30–14:15“ wählen' }, { featureId: 'calendar.week', action: 'Neue Position im Raster sehen' }] },
        { id: 'fl-erinnerung', name: 'Erinnerung ergänzen', steps: [{ featureId: 'calendar.event', action: '„1 Tag vorher“ hinzufügen' }, { featureId: 'calendar.event', action: 'Uhrzeit der Erinnerung prüfen' }] },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Abschnitte untereinander', direction: 'kompakt', concept: 'Eine Spalte: Termin kompakt, Konflikt nur bei Überschneidung, dann Teilnehmer und Erinnerungen. Alles bearbeitbar, nichts versteckt.',
          description: '+ Kurz, schnell zu bedienen, vertraut  − Lange Spalte bei vielen Teilnehmern',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termin', subtitle: 'Details, Teilnehmer, Erinnerungen', primaryLabel: '' } },
            { id: 'detail', component: 'event-detail', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3', showMap: false, compact: true } },
            { id: 'conflict', component: 'event-conflicts', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3', hideWhenClear: true } },
            { id: 'people', component: 'event-attendees', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3' } },
            { id: 'rem', component: 'event-reminders', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3' } },
          ],
        },
        {
          id: 'B', name: 'Detail mit Karte und Seitenspalte', direction: 'visuell', concept: 'Große Terminkarte mit Kartenvorschau, Fahrzeit und Online-Link; Teilnehmer, Erinnerungen und Konflikt als ruhige Karten daneben.',
          description: '+ Viel Raum für Ort und Personen, schön  − Auf Mobile gestapelt, länger',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termin', subtitle: 'Alles zu diesem Termin', primaryLabel: '' } },
            { id: 'detail', component: 'event-detail', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3', showMap: true } },
            { id: 'conflict', component: 'event-conflicts', region: 'aside', bind: { events: 'events' }, props: { previewId: 'e3' } },
            { id: 'people', component: 'event-attendees', region: 'aside', bind: { events: 'events' }, props: { previewId: 'e3' } },
            { id: 'rem', component: 'event-reminders', region: 'aside', bind: { events: 'events' }, props: { previewId: 'e3' } },
          ],
        },
        {
          id: 'C', name: 'Konflikt zuerst', direction: 'fokus', concept: 'Das Wichtigste zuerst: ist der Termin sicher? Konfliktwarnung und freie Fenster oben, darunter Zeit und Ort, Erinnerungen und Teilnehmer.',
          description: '+ Probleme werden zuerst gelöst, klare Reihenfolge  − Ohne Konflikt wirkt der erste Block überflüssig',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Termin prüfen', subtitle: 'Passt alles?', primaryLabel: '' } },
            { id: 'conflict', component: 'event-conflicts', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3', title: 'Passt der Termin?' } },
            { id: 'detail', component: 'event-detail', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3', showMap: false, compact: true } },
            { id: 'rem', component: 'event-reminders', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3' } },
            { id: 'people', component: 'event-attendees', region: 'main', bind: { events: 'events' }, props: { previewId: 'e3' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.create', 'calendar.edit', 'calendar.recurrence', 'tasks.detail'],
    },
    // ---------------------------------------------------------- Termin erstellen
    {
      id: 'calendar.create', name: 'Termin erstellen', group: 'Termine', status: 'design', tier: 1,
      purpose: 'Einen Termin in unter 15 Sekunden anlegen – per Formular, mit Chips und Vorschau oder in einem einzigen Satz.',
      requirements: [
        { text: 'Pflichtfelder: Titel, Datum, Beginn; Ende standardmäßig +1 Stunde', type: 'rule', priority: 'must' },
        { text: 'Kategorie per Chip wählen, Dauer per Schnellwahl (30 Min. … 2 Std.)', type: 'action', priority: 'should' },
        { text: 'Validierung mit verständlichen Fehlermeldungen (Ende nach Beginn)', type: 'state', priority: 'must' },
        { text: 'Optional: Wiederholung, Ort, Notiz', type: 'info', priority: 'should' },
        { text: 'Ein-Satz-Eingabe erkennt Datum, Uhrzeit und Dauer („Zahnarzt morgen 14 Uhr“) und warnt bei Überschneidung', type: 'action', priority: 'should' },
        { text: 'Neuer Termin erscheint sofort im Kalender und bestätigt per Hinweis', type: 'state', priority: 'must' },
        { text: 'Mobile: Formular als Bottom-Sheet mit großen Touch-Zielen', type: 'rule', priority: 'must' },
      ],
      interactions: [
        I('Termin speichern', 'Termin erscheint, Hinweis „angelegt“', 'event.create'),
        I('Ungültige Eingabe', 'Fehlermeldung am Feld', 'form.invalid'),
        I('„Neuer Termin“ im Kalender', 'Formular-Dialog öffnet sich', 'event.create.open'),
        I('Termin in „Als Nächstes“ antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
      ],
      acceptance: [
        'Ein Termin mit Titel, Datum und Beginn lässt sich in höchstens drei Eingaben anlegen und erscheint danach in der Liste „Als Nächstes“.',
        'Fehlt der Titel oder liegt das Ende vor dem Beginn, erscheint eine verständliche Meldung am Feld.',
        'Die Ein-Satz-Eingabe erkennt „morgen 14 Uhr“ und zeigt Datum und Zeit vor dem Speichern an.',
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Einfaches Formular', direction: 'kompakt', concept: 'Standard-Formularkarte mit allen Feldern in einer Spalte; darunter die kommenden Termine als Bestätigung.',
          description: '+ Sofort verständlich, wenig Aufwand  − Keine Kategorie-Chips/Dauer-Schnellwahl',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termin erstellen', primaryLabel: '' } },
            { id: 'form', component: 'form-card', region: 'main', bind: { target: 'events' }, props: { title: 'Neuer Termin', columns: 2, submitLabel: 'Termin anlegen', fields: ['title*:Titel:text', 'start*:Beginn:datetime-local', 'end:Ende:datetime-local', 'category:Kategorie:select:Arbeit|Privat|Fokus|Sales|Fitness|Gesundheit', 'location:Ort:text', 'note:Notiz:textarea'] } },
            { id: 'next', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Als Nächstes', days: 2, startFrom: 'today', showFree: false, openMode: NAV } },
          ],
        },
        {
          id: 'B', name: 'Geführtes Formular + Vorschau', direction: 'visuell', concept: 'Kategorie-Chips, Dauer-Schnellwahl und Wiederholung im Formular; rechts sieht man sofort, wie sich der Tag füllt (Mini-Monat + Tagesplan).',
          description: '+ Schnell durch Chips, direkte Rückmeldung  − Mehr Bausteine, auf Mobile länger',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termin erstellen', primaryLabel: '' } },
            { id: 'form', component: 'event-form', region: 'main', bind: { events: 'events' }, props: { title: 'Neuer Termin' } },
            { id: 'mini', component: 'mini-month', region: 'aside', bind: { events: 'events' } },
            { id: 'day', component: 'agenda', region: 'aside', bind: { events: 'events' }, props: { title: 'Tagesplan', days: 1, showFree: true, openMode: NAV } },
          ],
        },
        {
          id: 'C', name: 'Ein Satz genügt', direction: 'fokus', concept: 'Ein Eingabefeld statt Formular: Datum, Uhrzeit und Dauer werden erkannt und vor dem Speichern gezeigt, Überschneidungen sofort genannt. Darunter die Agenda als Bestätigung.',
          description: '+ Schnellster Weg, passt zur Tastatur und zum Handy  − Erkennung kann falsch liegen, Zusatzfelder fehlen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Termin erfassen', subtitle: 'Ein Satz genügt', primaryLabel: '' } },
            { id: 'quick', component: 'event-quick-add', region: 'main', bind: { events: 'events' }, props: { title: 'Was steht an?', elevated: true } },
            { id: 'next', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Als Nächstes', days: 3, startFrom: 'today', showFree: false, hideEmptyDays: true, openMode: NAV } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['calendar.edit', 'calendar.event'],
    },
    // ---------------------------------------------------------- Termin bearbeiten
    {
      id: 'calendar.edit', name: 'Termin bearbeiten', group: 'Termine', status: 'analyzed', tier: 2,
      purpose: 'Bestehende Termine ändern, verschieben oder löschen – ohne den Kalender zu verlassen.',
      requirements: [
        { text: 'Bearbeiten aus dem Termin-Detail heraus (gleiche Felder wie Erstellen)', type: 'action', priority: 'must' },
        { text: 'Löschen mit Rückmeldung; bei Serien klar als „Serie löschen“ benannt', type: 'rule', priority: 'must' },
        { text: 'Verschieben per Drag & Drop im Zeitraster (Desktop)', type: 'action', priority: 'could' },
        { text: 'Änderungen sofort sichtbar, Rückgängig-Hinweis nach Löschen', type: 'state', priority: 'should' },
      ],
      interactions: [
        I('Termin → Bearbeiten', 'Formular mit vorbelegten Werten', 'event.open'),
        I('Änderungen speichern', 'Termin aktualisiert', 'event.update'),
        I('Löschen', 'Termin entfernt, Hinweis', 'event.delete'),
      ],
      viewports: ALL_VP, demoData: withWorld(),
      variants: [],
      links: ['calendar.create', 'calendar.event', 'calendar.recurrence'],
    },
    // ---------------------------------------------------------- Wiederholungen
    {
      id: 'calendar.recurrence', name: 'Wiederholungen', group: 'Termine', status: 'not_analyzed', tier: 3,
      purpose: 'Regelmäßige Termine (Stand-up, Training, Wochenplanung) einmal anlegen und automatisch wiederholen.',
      requirements: [
        { text: 'Wiederholungen: täglich, werktags, wöchentlich, alle 2 Wochen, monatlich', type: 'rule', priority: 'must' },
        { text: 'Serientermine im Kalender erkennbar (Icon/Beschriftung)', type: 'info', priority: 'should' },
        { text: 'Bearbeiten/Löschen: nur dieser Termin, dieser und folgende oder ganze Serie (offen)', type: 'rule', priority: 'must' },
        { text: 'Enddatum oder Anzahl begrenzen die Serie', type: 'action', priority: 'could' },
      ],
      interactions: [],
      viewports: ALL_VP, demoData: withWorld(),
      variants: [],
    },
    // ---------------------------------------------------------- Kategorien
    {
      id: 'calendar.categories', name: 'Kategorien', group: 'Organisation', status: 'design', tier: 3,
      purpose: 'Termine nach Lebensbereichen einfärben und gruppieren, damit der Kalender auf einen Blick lesbar bleibt.',
      requirements: [
        { text: 'Sechs Standardkategorien mit eigener Farbe (aus Theme-Tokens)', type: 'info', priority: 'must' },
        { text: 'Legende mit Anzahl der Termine je Kategorie', type: 'info', priority: 'should' },
        { text: 'Farbe darf nie der einzige Unterschied sein (Text/Badge im Detail)', type: 'rule', priority: 'must' },
        { text: 'Eigene Kategorien anlegen (später)', type: 'action', priority: 'could' },
      ],
      interactions: [
        I('Kategorie in der Legende antippen', 'Kalender zeigt nur diese Kategorie', 'filter.change'),
        I('Termin antippen', 'Detail mit Kategorie-Badge', 'event.open'),
      ],
      viewports: ALL_VP, demoData: withWorld(),
      variants: [
        {
          id: 'A', name: 'Monat + Legende', direction: 'visuell', concept: 'Monatsraster mit farbigen Chips; Legende und Mini-Monat in der Seitenspalte dienen zugleich als Filter.',
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
      id: 'calendar.filter', name: 'Filter', group: 'Organisation', status: 'review', tier: 3,
      purpose: 'Termine nach Suchbegriff und Kategorie eingrenzen, ohne die Ansicht zu wechseln.',
      requirements: [
        { text: 'Volltextsuche über Titel, Ort und Notiz', type: 'action', priority: 'must' },
        { text: 'Kategorie-Filter (ein Klick, erneut klicken hebt auf)', type: 'action', priority: 'must' },
        { text: 'Leeres Ergebnis zeigt verständlichen Hinweis', type: 'state', priority: 'must' },
        { text: 'Aktiver Filter ist deutlich erkennbar', type: 'info', priority: 'should' },
      ],
      interactions: [
        I('Suchbegriff eingeben', 'Liste/Kalender filtert live', 'search.input'),
        I('Kategorie wählen', 'Nur diese Kategorie sichtbar', 'filter.change'),
        I('Termin antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
      ],
      viewports: ALL_VP, demoData: withWorld(),
      variants: [
        {
          id: 'A', name: 'Seitenleiste mit Suche + Legende', direction: 'kompakt', concept: 'Suche und Kategorien in der Seitenleiste; im Hauptbereich eine 14-Tage-Agenda, die live filtert.',
          description: '+ Filter jederzeit sichtbar  − Auf Mobile eingeklappt',
          layout: { type: 'sidebar', panelLabel: 'Suche & Kategorien' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Termine filtern', subtitle: 'Nächste 14 Tage', primaryLabel: '' } },
            { id: 'search', component: 'search-filter', region: 'panel', props: { filters: [], placeholder: 'Titel, Ort, Notiz …' } },
            { id: 'legend', component: 'calendar-legend', region: 'panel', bind: { events: 'events' }, props: { scope: 'alle' } },
            { id: 'agenda', component: 'agenda', region: 'main', bind: { events: 'events' }, props: { title: 'Agenda', days: 14, startFrom: 'today', hideEmptyDays: true, showFree: false, openMode: NAV } },
          ],
        },
      ],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf mit Seitenleiste' }, { kind: 'review', note: 'Zur Prüfung: Suche + Kategorie-Filter' }],
    },
    // ---------------------------------------------------------- Aufgabenintegration
    {
      id: 'calendar.tasks', name: 'Aufgabenintegration', group: 'Organisation', status: 'design', tier: 2,
      purpose: 'Fällige Aufgaben im Kalender sichtbar machen und mit freien Zeitfenstern verbinden.',
      requirements: [
        { text: 'Aufgaben mit Fälligkeit erscheinen als Chips in der Ganztagszeile (Priorität farbig)', type: 'info', priority: 'must' },
        { text: 'Aufgabe antippen öffnet das Aufgaben-Detail', type: 'action', priority: 'should' },
        { text: 'Aufgabe lässt sich in ein freies Zeitfenster einplanen (wird Termin „Fokus“)', type: 'action', priority: 'should' },
        { text: 'Erledigte Aufgaben verschwinden aus dem Kalender', type: 'rule', priority: 'must' },
      ],
      interactions: [
        I('Aufgaben-Chip antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Aufgabe abhaken', 'Chip verschwindet', 'task.toggle'),
        I('Aufgabe einplanen', 'Fokus-Termin im freien Fenster', 'focus.schedule'),
      ],
      viewports: ALL_VP, demoData: withWorld(),
      variants: [
        {
          id: 'A', name: 'Kalender + Aufgabenliste', direction: 'fokus', concept: 'Wochenraster mit Aufgaben-Chips; rechts die offene Aufgabenliste (abhakbar) und „Als Nächstes“ zum Einplanen.',
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
    // ---------------------------------------------------------- Kalender & Feiertage (Quellen)
    {
      id: 'calendar.sources', name: 'Kalender & Feiertage', group: 'Einstellungen', status: 'design', tier: 3,
      purpose: 'Welche Kalender sieht TAKT? Konten und Abos mit Sync-Status, Feiertage NRW, Geburtstage und die Grundeinstellungen – Ausblenden wirkt sofort in allen Ansichten.',
      requirements: [
        { text: 'Quellen nach Konten, Abos und Zusatzkalendern mit Farbe, Terminzahl und Schalter „anzeigen“', type: 'info', priority: 'must' },
        { text: 'Sync-Status je Quelle: zuletzt synchronisiert, Fehler („Anmeldung abgelaufen“ → „Neu anmelden“), Berechtigung fehlt → „Zugriff erlauben“', type: 'state', priority: 'must' },
        { text: 'Ausblenden einer Quelle blendet ihre Termine in Tag, Woche, Monat, Agenda und Übersicht aus', type: 'rule', priority: 'must' },
        { text: 'Gesetzliche Feiertage NRW und Geburtstage aus Kontakten als eigene, schreibgeschützte Kalender', type: 'info', priority: 'must' },
        { text: 'Kalender hinzufügen: Google, Microsoft 365, iCloud, Nextcloud/CalDAV, ICS-Abo, Gerätekalender', type: 'action', priority: 'should' },
        { text: 'Standardkalender für neue Termine festlegen; Einstellungen für Wochenstart, Dauer, Erinnerung, Zeitraster', type: 'action', priority: 'should' },
        { text: 'Leerzustand: Noch kein Kalender verbunden – „Kalender hinzufügen“', type: 'state', priority: 'must' },
      ],
      interactions: [
        I('Schalter „anzeigen“', 'Quelle ein-/ausgeblendet, Termine verschwinden bzw. erscheinen', 'source.toggle'),
        I('„Neu anmelden“ / „Zugriff erlauben“', 'Quelle synchronisiert wieder, Fehler weg', 'source.reauth'),
        I('„Hinzufügen“', 'Dialog mit Kontotypen, Quelle erscheint', 'source.add'),
        I('„Sync“', 'Alle Quellen synchronisiert, Zeitstempel aktualisiert', 'source.sync'),
        I('„Als Standard“', 'Standardkalender gewechselt', 'source.default'),
        I('Einstellung ändern', 'Wert gespeichert, Hinweis', 'prefs.change'),
        I('Feiertag oder Geburtstag antippen', 'Termin-Detail öffnet sich', 'event.open', 'calendar.event'),
      ],
      acceptance: [
        'Mindestens vier Beispielquellen mit unterschiedlichem Sync-Status (ok, Fehler, Berechtigung fehlt) sind sichtbar.',
        'Das Ausblenden von „Feiertage NRW“ lässt die Feiertage in Wochen-, Monats- und Agenda-Ansicht verschwinden, Einblenden bringt sie zurück.',
        'Die Quelle mit Fehler zeigt „Neu anmelden“; nach dem Tipp steht dort „Synchronisiert“.',
        'Eine neu hinzugefügte Quelle erscheint in der Liste mit Status „Synchronisiert“.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, Schalter und Buttons sind mindestens 32 px hoch.',
      ],
      flows: [
        { id: 'fl-feiertage', name: 'Feiertage ausblenden', steps: [{ featureId: 'calendar.sources', action: 'Schalter „Feiertage NRW“ ausschalten' }, { featureId: 'calendar.week', action: 'Weihnachtswoche: keine Feiertage mehr in der Ganztagszeile' }] },
        { id: 'fl-anmelden', name: 'Fehlerhaftes Abo reparieren', steps: [{ featureId: 'calendar.sources', action: '„Etsy-Versandfristen“: „Neu anmelden“ antippen' }, { featureId: 'calendar.sources', action: 'Status „Synchronisiert“ prüfen' }] },
      ],
      viewports: ALL_VP, demoData: sourceData,
      variants: [
        {
          id: 'A', name: 'Reiter: Kalender, Feiertage, Einstellungen', direction: 'kompakt', concept: 'Drei Reiter in einer Spalte: Kalender und Konten, Feiertage und Geburtstage, Einstellungen. Wenig Fläche, alles an einem Ort.',
          description: '+ Kompakt, gut für Mobile  − Kein direkter Vergleich, Wirkung erst in den Ansichten sichtbar',
          layout: { type: 'tabs' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Kalender & Feiertage', subtitle: 'Quellen, Sichtbarkeit, Einstellungen', primaryLabel: '' } },
            { id: 'src', component: 'calendar-sources', region: 'main', tab: 'Kalender', bind: { sources: 'sources', events: 'events' }, props: { title: 'Kalender & Konten' } },
            { id: 'hol', component: 'holiday-list', region: 'main', tab: 'Feiertage', bind: { holidays: 'holidays', birthdays: 'birthdays', sources: 'sources', events: 'events' }, props: { title: 'Feiertage & Geburtstage' } },
            { id: 'prefs', component: 'calendar-prefs', region: 'main', tab: 'Einstellungen', bind: { prefs: 'prefs' }, props: { title: 'Einstellungen' } },
          ],
        },
        {
          id: 'B', name: 'Quellen mit Monatsvorschau', direction: 'visuell', concept: 'Quellen und Feiertage links, rechts eine Monatsvorschau, die sofort zeigt, was das Ein- und Ausblenden bewirkt. Einstellungen als Karte.',
          description: '+ Wirkung direkt sichtbar, ruhig  − Braucht Breite, auf Mobile lang',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Kalender', title: 'Kalender & Feiertage', subtitle: 'Was du siehst, bestimmst du', primaryLabel: '' } },
            { id: 'src', component: 'calendar-sources', region: 'main', span: 5, spanTablet: 12, bind: { sources: 'sources', events: 'events' }, props: { title: 'Kalender & Konten' } },
            { id: 'cal', component: 'calendar-month', region: 'main', span: 7, spanTablet: 12, bind: { events: 'events' }, props: { dayList: 'never', maxChips: 2, weekNumbers: false } },
            { id: 'hol', component: 'holiday-list', region: 'main', span: 7, spanTablet: 12, bind: { holidays: 'holidays', birthdays: 'birthdays', sources: 'sources', events: 'events' }, props: { title: 'Feiertage & Geburtstage' } },
            { id: 'prefs', component: 'calendar-prefs', region: 'main', span: 5, spanTablet: 12, bind: { prefs: 'prefs' }, props: { title: 'Einstellungen' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['calendar.home', 'calendar.month', 'calendar.week'],
    },
  ],
  decisions: [
    { featureId: 'calendar.home', title: 'Welche Startseite für den Kalender?', decision: '', rationale: 'Kompakt (A) zeigt am meisten auf einmal, Visuell (B) beantwortet „wie voll ist es?“ mit Band und Säulen, Fokus (C) stellt den nächsten Termin und Erfassen in den Mittelpunkt. Entscheidung nach Test auf dem Handy mit einem echten Terminvolumen (20+ Termine pro Woche).', tradeoffs: 'A: dicht, auf Mobile lang. B: ruhig, weniger Termine sichtbar. C: handlungsorientiert, wenig Wochenüberblick.', status: 'open' },
    { featureId: 'calendar.week', title: 'Welche Wochenansicht wird Standard?', decision: '', rationale: 'Kompakt (A) ist am dichtesten, Visuell (B) am ruhigsten, Produktiv (C) verbindet Aufgaben. Entscheidung nach Test mit echten Terminlasten (ca. 20+ Termine/Woche) und auf Mobile.', tradeoffs: 'A: viel Information, kleine Schrift. B: gut lesbar, mehr Scrollen. C: stärkster Nutzen, aber mehr kognitive Last.', status: 'open' },
    { featureId: 'calendar.month', title: 'Monatsansicht: Punkte statt Chips auf Mobile', decision: 'Auf Mobile zeigen Tageszellen bis zu drei farbige Punkte, die Details stehen in der Tagesliste darunter.', rationale: 'Bei 390 px Breite ist eine Zelle ca. 52 px breit – Chip-Beschriftungen wären nicht lesbar und die Touch-Ziele zu klein.', tradeoffs: 'Terminnamen sind erst nach dem Antippen des Tages sichtbar; dafür ruhiges Raster und große Touch-Ziele.', status: 'decided' },
    { featureId: 'calendar.event', title: 'Termin-Detail als eigener Screen, nicht nur als Dialog', decision: 'In der App öffnet jeder Termin (Übersicht, Tag, Woche, Agenda) das Termin-Detail als eigenen Screen. Der Dialog bleibt als Schnellansicht in der Feature-Vorschau.', rationale: 'Teilnehmer, Erinnerungen und Konfliktwarnung brauchen Platz und Rückweg; ein Dialog wäre auf dem Handy zu eng und nicht verlinkbar (Aufgaben, Notizen, Wetter).', tradeoffs: 'Ein Screen mehr in der Navigation; dafür ein stabiler Anker für Verknüpfungen und Erinnerungen.', status: 'decided' },
    { featureId: 'calendar.recurrence', title: 'Serien bearbeiten: nur dieser Termin oder ganze Serie?', decision: '', rationale: 'V2.0-Annahme: immer ganze Serie (einfach). Echte Kalender-Apps bieten „nur dieser Termin“ und „dieser und folgende“. Klären, ob TAKT Ausnahmen speichern kann; der Serien-Dialog existiert bereits als Querschnitt-Baustein.', tradeoffs: 'Ganze Serie: einfach, aber unflexibel. Ausnahmen: flexibler, aber komplexere Datenhaltung und UI.', status: 'open' },
    { featureId: 'calendar.sources', title: 'Ausblenden einer Quelle wirkt sofort überall', decision: 'Der Schalter „anzeigen“ blendet die Termine einer Quelle in allen Ansichten sofort aus (Übersicht, Tag, Woche, Agenda, Monat); die Termine bleiben gespeichert.', rationale: 'Wer ein Abo oder die Feiertage ausblendet, erwartet ein sofort sichtbares Ergebnis – sonst wirkt der Schalter kaputt.', tradeoffs: 'Statistiken (Wochenlast, Fokuszeit) zählen ausgeblendete Quellen nicht mit; das muss in der Oberfläche erklärt werden.', status: 'decided' },
    { featureId: 'calendar.sources', title: 'Ein Standardkalender global oder je Konto?', decision: '', rationale: 'Die Demo kennt einen globalen Standardkalender für neue Termine. Bei mehreren Konten (Privat, Firma) könnte die Kategorie den Zielkalender bestimmen.', tradeoffs: 'Global: einfach. Je Kategorie: weniger Nacharbeit, aber komplexere Einstellung und mögliche Überraschungen.', status: 'open' },
    { featureId: 'calendar.tasks', title: 'Aufgaben ohne Uhrzeit als Ganztags-Chips', decision: 'Aufgaben mit Fälligkeit, aber ohne Uhrzeit, erscheinen als gestrichelte Chips in der Ganztagszeile statt als Zeitblock.', rationale: 'Termine sind feste Zeiten, Aufgaben nicht. Gestrichelte Chips unterscheiden beides klar und blockieren keine Zeit.', tradeoffs: 'Aufgaben erscheinen nicht im Raster, solange sie nicht eingeplant sind; dafür bleibt der Kalender ehrlich.', status: 'decided' },
  ],
};
