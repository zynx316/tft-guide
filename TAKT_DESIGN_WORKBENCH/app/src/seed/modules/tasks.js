// Modul "Aufgaben" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Demo-Daten (Termine/Aufgaben) teilt sich das Modul mit dem Kalender.
import { demoEvents, demoTasks } from './calendar.js';

const metrics = [
  { label: 'Heute fällig', value: 4, icon: 'list-checks', tone: 'warning', delta: 1, suffix: '', invert: true },
  { label: 'Überfällig', value: 2, icon: 'alert-circle', tone: 'danger', delta: -1, suffix: '', invert: true },
  { label: 'Diese Woche erledigt', value: 9, icon: 'check-circle-2', tone: 'success', delta: 18, spark: [3, 5, 4, 6, 8, 9] },
  { label: 'Fokuszeit geplant', value: '3,5', unit: 'h', icon: 'timer', tone: 'info' },
];
const FILTERS = ['Alle', 'Heute', 'Überfällig', 'Hoch'];
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const demoData = { tasks: demoTasks, events: demoEvents, metrics };

export default {
  module: {
    id: 'tasks', name: 'Aufgaben', icon: 'list-checks', status: 'active', theme: 'graphite', designVersion: '0.3',
    description: 'Aufgaben erfassen, priorisieren und abarbeiten: Liste, Kanban und Tagesfokus mit Fälligkeiten, Projekten und Unteraufgaben.',
    source: 'Auftrag 2026-11 (Features aus dem Auftrag; in Phase 1 gegen das TAKT-Modulregister verifizieren)',
    infoArchitecture: 'Einstieg: Aufgabenübersicht (Liste, Kanban oder Tagesfokus). Filter: Alle / Heute / Überfällig / Priorität / Projekt. Aufgabe antippen → Detail (Unteraufgaben, Wiederholung, Notiz). Schnelles Erfassen oben bzw. am unteren Rand. Verknüpfung zum Kalender: fällige Aufgaben als Chips, Einplanen in freie Zeitfenster.',
    docs: [
      '## Annahmen',
      '- Aufgaben haben Priorität (hoch/mittel/niedrig), optionale Fälligkeit (Datum oder Datum + Uhrzeit), Projekt, Kategorie und Unteraufgaben.',
      '- Status für Kanban: Offen, In Arbeit, Review, Erledigt (fest, in V2.0 nicht konfigurierbar).',
      '- Wiederkehrende Aufgaben springen nach dem Abhaken zur nächsten Fälligkeit statt zu verschwinden.',
      '',
      '## Offene Fragen',
      '- Existiert im echten TAKT-Modul bereits ein Projekt-Konzept oder nur Kategorien/Tags?',
      '- Sollen Unteraufgaben eigene Fälligkeiten haben?',
      '- Wie sollen überfällige Aufgaben behandelt werden – automatisch auf heute verschieben oder sichtbar rot bleiben?',
    ].join('\n'),
    links: ['calendar', 'home', 'sales'],
  },
  features: [
    // ------------------------------------------------------ Aufgabenübersicht
    {
      id: 'tasks.overview', name: 'Aufgabenübersicht', group: 'Ansichten', status: 'design',
      purpose: 'Auf einen Blick erfassen, was zu tun ist, und sofort handeln: abhaken, priorisieren, nächste Aufgabe starten. Drei Konzepte: Liste, Kanban oder Tagesplanung.',
      requirements: [
        { text: 'Offene Aufgaben nach Fälligkeit gruppiert (Überfällig, Heute, Morgen …)', type: 'info', priority: 'must' },
        { text: 'Aufgabe mit einem Tipp abhaken; erledigte werden durchgestrichen', type: 'action', priority: 'must' },
        { text: 'Priorität und Fälligkeit je Aufgabe erkennbar, überfällig rot', type: 'info', priority: 'must' },
        { text: 'Suche und Filter (Heute, Überfällig, Priorität, Projekt)', type: 'action', priority: 'should' },
        { text: 'Neue Aufgabe in einem Schritt erfassen', type: 'action', priority: 'must' },
        { text: 'Leerer Zustand motiviert statt leer zu wirken', type: 'state', priority: 'should' },
        { text: 'Mobile: eine Spalte, Touch-Ziele ≥ 44 px, kein horizontales Scrollen der Seite', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Checkbox antippen', result: 'Aufgabe erledigt (wiederkehrende springen weiter)', event: 'task.toggle' },
        { trigger: 'Aufgabe antippen', result: 'Aufgabe wird ausgewählt / Detail', event: 'task.open' },
        { trigger: 'Eingabe + Enter', result: 'Neue Aufgabe erscheint oben', event: 'task.create' },
        { trigger: 'Filter wählen', result: 'Liste zeigt nur passende Aufgaben', event: 'filter.change' },
        { trigger: 'Karte verschieben', result: 'Status wechselt', event: 'kanban.move' },
        { trigger: 'Aufgabe einplanen', result: 'Fokus-Termin im freien Fenster', event: 'focus.schedule' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Liste kompakt', concept: 'Eine Spalte, nach Fälligkeit gruppiert, mit Eingabezeile oben und Filterchips. Maximale Geschwindigkeit beim Abarbeiten.',
          description: '+ Schnell, vertraut, mobil ideal  − Wenig Überblick über Projekte und Status',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Meine Aufgaben', subtitle: '18 offen · 2 überfällig', primaryLabel: '' } },
            { id: 'filter', component: 'search-filter', region: 'main', props: { filters: FILTERS, placeholder: 'Aufgaben suchen …' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: '', groupBy: 'due', showDone: true, dense: false, inlineAdd: true, selectable: false } },
          ],
        },
        {
          id: 'B', name: 'Kanban-zentriert', concept: 'Status steht im Mittelpunkt: Spalten Offen → In Arbeit → Review → Erledigt. Projekte und Suche in der Seitenleiste filtern das Board.',
          description: '+ Fortschritt sichtbar, Karten per Drag & Drop  − Viel Fläche, Mobile nur wischbar',
          layout: { type: 'sidebar', panelLabel: 'Projekte & Suche' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Board', subtitle: 'Status im Überblick', primaryLabel: '' } },
            { id: 'search', component: 'search-filter', region: 'panel', props: { filters: [], placeholder: 'Aufgaben suchen …' } },
            { id: 'proj', component: 'project-list', region: 'panel', bind: { tasks: 'tasks' } },
            { id: 'board', component: 'kanban-board', region: 'main', bind: { tasks: 'tasks' }, props: { quickAdd: true, showProject: true } },
          ],
        },
        {
          id: 'C', name: 'Fokus-Tagesplanung', concept: 'Der Tag zuerst: „Als Nächstes“ verbindet Termine, überfällige Aufgaben und freie Fenster mit Vorschlägen zum Einplanen. Rechts die Prioritätenliste.',
          description: '+ Plant realistisch, nutzt freie Zeit  − Weniger Gesamtüberblick, abhängig von Kalenderdaten',
          layout: { type: 'split', asideFirstOnMobile: false },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben · Fokus', title: 'Heute planen', subtitle: 'Di, 24. November', primaryLabel: '' } },
            { id: 'kpi', component: 'metric-row', region: 'header', bind: { metrics: 'metrics' }, hideOn: ['mobile'] },
            { id: 'focus', component: 'focus-next', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { title: 'Tagesplan' } },
            { id: 'prio', component: 'task-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Nach Priorität', groupBy: 'priority', showDone: false, dense: true, showProject: true, selectable: false, limit: 9 } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.kanban', 'tasks.list', 'calendar.tasks'],
    },
    // ---------------------------------------------------------- Kanban
    {
      id: 'tasks.kanban', name: 'Kanban', group: 'Ansichten', status: 'design',
      purpose: 'Aufgaben nach Arbeitsstatus organisieren und per Drag & Drop (oder Menü) weiterschieben.',
      requirements: [
        { text: 'Vier Spalten: Offen, In Arbeit, Review, Erledigt – mit Zähler je Spalte', type: 'info', priority: 'must' },
        { text: 'Karten per Drag & Drop verschieben (Desktop)', type: 'action', priority: 'must' },
        { text: 'Alternative ohne Drag: Menü „Verschieben nach …“ (Touch, Tastatur)', type: 'action', priority: 'must' },
        { text: 'Karte zeigt Titel, Priorität, Fälligkeit, Projekt, Unteraufgaben-Fortschritt', type: 'info', priority: 'should' },
        { text: 'Mobile: Spalten horizontal wischbar (Scroll-Snap), Seite selbst scrollt nicht seitwärts', type: 'rule', priority: 'must' },
        { text: 'Karte direkt in einer Spalte anlegen', type: 'action', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Karte in andere Spalte ziehen', result: 'Status wechselt, Hinweis', event: 'kanban.move' },
        { trigger: 'Menü „Verschieben“', result: 'Status-Auswahl, Karte wandert', event: 'kanban.move' },
        { trigger: 'Karte antippen', result: 'Detail rechts zeigt Aufgabe', event: 'task.open' },
        { trigger: 'Karte in Spalte anlegen', result: 'Neue Karte oben', event: 'task.create' },
        { trigger: 'Unteraufgabe abhaken', result: 'Fortschritt aktualisiert', event: 'subtask.toggle' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Board + Detailpanel', concept: 'Board nutzt die volle Breite, die gewählte Karte öffnet rechts ein Detailpanel – kein Dialog nötig.',
          description: '+ Bearbeiten ohne Kontextwechsel  − Detail rutscht auf Mobile unter das Board',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Kanban', subtitle: 'Karten ziehen oder über „⋯“ verschieben', primaryLabel: '' } },
            { id: 'board', component: 'kanban-board', region: 'main', bind: { tasks: 'tasks' }, props: { showProject: true } },
            { id: 'detail', component: 'task-detail', region: 'aside', bind: { tasks: 'tasks' }, props: { fallbackFirst: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.overview'],
    },
    // ---------------------------------------------------------- Listenansicht
    {
      id: 'tasks.list', name: 'Listenansicht', group: 'Ansichten', status: 'design',
      purpose: 'Alle Aufgaben als ruhige Liste – wahlweise nach Priorität oder Projekt gruppiert.',
      requirements: [
        { text: 'Gruppierung wählbar: Fälligkeit, Priorität, Projekt', type: 'action', priority: 'must' },
        { text: 'Jede Zeile: Checkbox, Titel, Fälligkeit, Projekt, Priorität, Unteraufgaben-Zähler', type: 'info', priority: 'must' },
        { text: 'Erledigte Aufgaben ein-/ausblendbar', type: 'action', priority: 'should' },
        { text: 'Leere Gruppen werden nicht angezeigt', type: 'rule', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Checkbox antippen', result: 'Aufgabe erledigt', event: 'task.toggle' },
        { trigger: 'Zeile antippen', result: 'Aufgabe ausgewählt', event: 'task.open' },
        { trigger: 'Projekt wählen', result: 'Liste zeigt nur dieses Projekt', event: 'project.select' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Nach Priorität', concept: 'Eine Spalte, gruppiert nach Priorität (Hoch → Niedrig) mit ausgeschriebenem Prioritätslabel.',
          description: '+ Wichtiges oben, sehr klar  − Fälligkeit rückt in den Hintergrund',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Liste', subtitle: 'Nach Priorität', primaryLabel: '' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Alle Aufgaben', groupBy: 'priority', showPriorityLabel: true, showDone: false, selectable: false } },
          ],
        },
        {
          id: 'B', name: 'Nach Projekt', concept: 'Projektliste in der Seitenleiste filtert; Hauptliste gruppiert nach Projekt mit Fortschritt je Projekt.',
          description: '+ Projektdenken, gute Orientierung  − Seitenleiste nötig',
          layout: { type: 'sidebar', panelLabel: 'Projekte' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Liste', subtitle: 'Nach Projekt', primaryLabel: '' } },
            { id: 'proj', component: 'project-list', region: 'panel', bind: { tasks: 'tasks' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Aufgaben', groupBy: 'project', showProject: false, showDone: false, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
    },
    // ---------------------------------------------------------- Prioritäten
    {
      id: 'tasks.priority', name: 'Prioritäten', group: 'Organisation', status: 'analyzed',
      purpose: 'Wichtiges von Dringendem trennen: drei Prioritätsstufen, die überall konsistent dargestellt werden.',
      requirements: [
        { text: 'Drei Stufen: Hoch (rot), Mittel (orange), Niedrig (neutral) – nie nur Farbe, immer Flagge + Text', type: 'rule', priority: 'must' },
        { text: 'Priorität im Detail per Segment-Auswahl änderbar', type: 'action', priority: 'must' },
        { text: 'Sortierung innerhalb einer Gruppe: Priorität, dann Fälligkeit', type: 'rule', priority: 'should' },
      ],
      interactions: [{ trigger: 'Priorität im Detail ändern', result: 'Liste sortiert neu', event: 'task.update' }],
      viewports: ALL_VP, demoData: { tasks: demoTasks },
      variants: [],
    },
    // ---------------------------------------------------------- Fälligkeit
    {
      id: 'tasks.due', name: 'Fälligkeit', group: 'Organisation', status: 'design',
      purpose: 'Fälligkeit relativ und menschlich anzeigen („Heute · 14:00“, „Seit 2 Tagen überfällig“) und Überfälliges sofort sichtbar machen.',
      requirements: [
        { text: 'Relative Texte: Heute, Morgen, Wochentag, Datum; überfällig mit Anzahl Tage', type: 'info', priority: 'must' },
        { text: 'Überfällige Aufgaben rot und ganz oben gruppiert', type: 'rule', priority: 'must' },
        { text: 'Hinweis-Banner, wenn Überfälliges existiert', type: 'state', priority: 'should' },
        { text: 'Datum im Detail per Datumsfeld änderbar', type: 'action', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Banner „Ansehen“', result: 'Banner-Aktion wird ausgelöst (Prototyp: Hinweis)', event: 'notice.action' },
        { trigger: 'Filter „Überfällig“', result: 'Nur überfällige Aufgaben', event: 'filter.change' },
        { trigger: 'Aufgabe abhaken', result: 'Überfällig-Zähler sinkt', event: 'task.toggle' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Überfällig zuerst', concept: 'Banner mit Zusammenfassung, Filterchips (Heute/Überfällig/Diese Woche) und nach Fälligkeit gruppierte Liste.',
          description: '+ Dringendes nie übersehen  − Banner kann nerven, wenn dauerhaft überfällig',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Fälligkeiten', primaryLabel: '' } },
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'danger', title: '2 Aufgaben sind überfällig', text: 'Belege Oktober hochladen und Etsy-Gebühren buchen warten seit gestern bzw. 2 Tagen.', actionLabel: 'Ansehen' } },
            { id: 'filter', component: 'search-filter', region: 'main', props: { filters: ['Alle', 'Überfällig', 'Heute', 'Diese Woche'], showSearch: false } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Nach Fälligkeit', groupBy: 'due', showDone: false, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
    },
    // ---------------------------------------------------------- Wiederholungen
    {
      id: 'tasks.repeat', name: 'Wiederholungen', group: 'Organisation', status: 'not_analyzed',
      purpose: 'Wiederkehrende Aufgaben (Belege, Wochenplanung) automatisch neu fällig stellen.',
      requirements: [
        { text: 'Rhythmen: täglich, werktags, wöchentlich, monatlich', type: 'rule', priority: 'must' },
        { text: 'Abhaken springt zur nächsten Fälligkeit und setzt Unteraufgaben zurück', type: 'rule', priority: 'must' },
        { text: 'Wiederholung in der Liste durch Symbol erkennbar', type: 'info', priority: 'should' },
      ],
      interactions: [],
      viewports: ALL_VP, demoData: { tasks: demoTasks },
      variants: [],
    },
    // ---------------------------------------------------------- Kategorien
    {
      id: 'tasks.categories', name: 'Kategorien', group: 'Organisation', status: 'analyzed',
      purpose: 'Aufgaben nach Lebensbereich (Arbeit, Privat, Finanzen) einordnen und filtern.',
      requirements: [
        { text: 'Jede Aufgabe hat höchstens eine Kategorie, unabhängig vom Projekt', type: 'rule', priority: 'must' },
        { text: 'Kategorie als Filterchip und Gruppierung wählbar', type: 'action', priority: 'should' },
        { text: 'Kategorien teilen sich Farben mit dem Kalender', type: 'rule', priority: 'could' },
      ],
      interactions: [{ trigger: 'Kategorie-Chip wählen', result: 'Liste filtert', event: 'filter.change' }],
      viewports: ALL_VP, demoData: { tasks: demoTasks },
      variants: [],
    },
    // ---------------------------------------------------------- Projekte
    {
      id: 'tasks.projects', name: 'Projekte', group: 'Organisation', status: 'design',
      purpose: 'Aufgaben zu Projekten bündeln, Fortschritt sehen und gezielt in ein Projekt eintauchen.',
      requirements: [
        { text: 'Projektliste mit Fortschrittsbalken (erledigt/gesamt) und nächster Fälligkeit', type: 'info', priority: 'must' },
        { text: 'Überfällige Aufgaben je Projekt als Badge', type: 'info', priority: 'should' },
        { text: 'Projekt antippen filtert die Aufgabenliste', type: 'action', priority: 'must' },
      ],
      interactions: [{ trigger: 'Projekt antippen', result: 'Aufgabenliste zeigt nur dieses Projekt', event: 'project.select' }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Projekte + Aufgaben', concept: 'Projektübersicht links als Filter, rechts die zugehörigen Aufgaben als Liste.',
          description: '+ Klare Zuordnung, Fortschritt sichtbar  − Zwei Spalten, auf Mobile gestapelt',
          layout: { type: 'sidebar', panelLabel: 'Projekte' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Projekte', primaryLabel: '' } },
            { id: 'proj', component: 'project-list', region: 'panel', bind: { tasks: 'tasks' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Aufgaben im Projekt', groupBy: 'due', showProject: false, showDone: true, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
    },
    // ---------------------------------------------------------- Detailansicht
    {
      id: 'tasks.detail', name: 'Detailansicht', group: 'Ansichten', status: 'review',
      purpose: 'Eine Aufgabe vollständig bearbeiten: Titel, Priorität, Fälligkeit, Status, Projekt, Wiederholung, Unteraufgaben, Notiz.',
      requirements: [
        { text: 'Master-Detail: Liste wählt Aufgabe, Detail zeigt alle Felder', type: 'info', priority: 'must' },
        { text: 'Änderungen wirken sofort in Liste und Board', type: 'rule', priority: 'must' },
        { text: 'Unteraufgaben abhaken/hinzufügen mit Fortschrittsbalken', type: 'action', priority: 'must' },
        { text: 'Aufgabe löschen mit Rückmeldung', type: 'action', priority: 'should' },
        { text: 'Mobile: Detail unter der Liste bzw. als eigene Ansicht', type: 'rule', priority: 'must' },
        { text: 'Ohne Auswahl: Hinweis statt leerer Fläche', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Aufgabe in Liste antippen', result: 'Detail zeigt die Aufgabe', event: 'task.open' },
        { trigger: 'Feld ändern', result: 'Aufgabe aktualisiert', event: 'task.update' },
        { trigger: 'Unteraufgabe abhaken', result: 'Fortschritt wächst', event: 'subtask.toggle' },
        { trigger: 'Unteraufgabe hinzufügen', result: 'Eintrag erscheint', event: 'subtask.add' },
        { trigger: 'Papierkorb', result: 'Aufgabe gelöscht', event: 'task.delete' },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Master-Detail', concept: 'Liste links (zwei Drittel Breite → Hauptspalte), Detailpanel rechts. Auswahl wechselt das Detail ohne Seitenwechsel.',
          description: '+ Schnelles Durchklicken, Kontext bleibt  − Auf Mobile Detail unter der Liste',
          layout: { type: 'split', even: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Aufgaben bearbeiten', primaryLabel: '' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Aufgaben', groupBy: 'due', showDone: false, dense: true } },
            { id: 'detail', component: 'task-detail', region: 'aside', bind: { tasks: 'tasks' } },
          ],
        },
        {
          id: 'B', name: 'Detail zuerst', concept: 'Detailpanel oben (mobil: direkt sichtbar), darunter kompakte Liste zum Wechseln. Eine Spalte.',
          description: '+ Bearbeiten steht im Fokus  − Lange Seite',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Detail', primaryLabel: '' } },
            { id: 'detail', component: 'task-detail', region: 'main', bind: { tasks: 'tasks' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Weitere Aufgaben', groupBy: 'none', showDone: false, dense: true, limit: 6 } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.kanban', 'tasks.list'],
      seedHistory: [{ kind: 'draft', note: 'Master-Detail (A) und Detail-zuerst (B)' }, { kind: 'review', note: 'Zur Prüfung: Unteraufgaben-Interaktion' }],
    },
  ],
  decisions: [
    { featureId: 'tasks.overview', title: 'Standardansicht der Aufgabenübersicht', decision: '', rationale: 'Liste (A) ist am schnellsten, Kanban (B) zeigt Status, Tagesplanung (C) verbindet mit dem Kalender. Entscheidung nach Nutzungsgewohnheit: Wie oft wird nach Status statt nach Fälligkeit gearbeitet?', tradeoffs: 'A: einfach, aber ohne Statuskontext. B: Status klar, braucht Platz. C: planerisch stark, hängt vom Kalender ab.', status: 'open' },
    { featureId: 'tasks.repeat', title: 'Wiederkehrende Aufgaben springen zur nächsten Fälligkeit', decision: 'Beim Abhaken einer wiederkehrenden Aufgabe bleibt sie bestehen, die Fälligkeit springt zum nächsten Termin und Unteraufgaben werden zurückgesetzt.', rationale: 'Verhindert Duplikate und hält die Historie schlank; entspricht dem erwarteten Verhalten gängiger To-do-Apps.', tradeoffs: 'Erledigungs-Historie je Durchlauf geht verloren, sofern sie nicht separat protokolliert wird.', status: 'decided' },
    { featureId: 'tasks.kanban', title: 'Kanban-Spalten fest oder frei konfigurierbar?', decision: '', rationale: 'Die Library-Komponente unterstützt beliebige Spalten (Prop „columns“). Offen ist, ob TAKT V2.0 eigene Status zulässt.', tradeoffs: 'Fest: einfach, konsistent mit Filter und Statistik. Frei: flexibel, aber komplexere Datenmodelle und Berichte.', status: 'open' },
  ],
};
