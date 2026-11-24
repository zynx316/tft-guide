// Modul "Aufgaben" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Demo-Daten kommen aus der gemeinsamen Datenwelt ('@world:tasks' …): Abhaken, Anlegen, Eingang sortieren und Fokus-Blöcke wirken in allen Screens.

const FILTERS = ['Alle', 'Heute', 'Überfällig', 'Hoch'];
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const demoData = {
  tasks: '@world:tasks', events: '@world:events', inbox: '@world:taskInbox', activity: '@world:taskActivity', log: '@world:taskFocusLog', goal: '@world:taskFocusGoal',
};
const NAV = 'navigate';
const I = (trigger, result, event, to) => ({ trigger, result, event, ...(to ? { to } : {}) });
const SHORTCUTS = ['Liste|list-checks|list.open', 'Board|kanban|board.open', 'Projekte|folder|projects.open', 'Fokus|timer|focus.open', 'Eingang|inbox|inbox.open'];

export default {
  module: {
    id: 'tasks', name: 'Aufgaben', icon: 'list-checks', area: 'Tag & Organisation', status: 'active', theme: 'graphite', designVersion: '0.4', homeFeatureId: 'tasks.home',
    description: 'Aufgaben erfassen, sortieren und abarbeiten: Übersicht, Eingang, Liste, Kanban, Detail und Fokus-Timer mit Fälligkeiten, Projekten und Unteraufgaben.',
    source: 'Auftrag 2026-11 (Features aus dem Auftrag; in Phase 1 gegen das TAKT-Modulregister verifizieren)',
    infoArchitecture: 'Einstieg: Übersicht (heute fällig, überfällig, Eingang, Fokus). Von dort: Liste, Board, Projekte, Eingang, Fokus-Timer. Aufgabe antippen (überall) → Detail (Unteraufgaben, Wiederholung, Notiz) → „Fokus starten“ → Fokus-Timer. Erfassen: ein Satz in die Liste oder in den Eingang, später mit einem Tipp sortieren (Heute, Morgen, Diese Woche, Irgendwann). Verknüpfung zum Kalender: fällige Aufgaben als Chips, Einplanen in freie Zeitfenster; Termine in „Als Nächstes“ führen zum Termin-Detail.',
    docs: [
      '## Annahmen',
      '- Aufgaben haben Priorität (hoch/mittel/niedrig), optionale Fälligkeit (Datum oder Datum + Uhrzeit), Projekt, Kategorie, Zeitschätzung und Unteraufgaben.',
      '- Status für Kanban: Offen, In Arbeit, Review, Erledigt (fest, in V2.0 nicht konfigurierbar).',
      '- Wiederkehrende Aufgaben springen nach dem Abhaken zur nächsten Fälligkeit statt zu verschwinden.',
      '- Der Eingang nimmt alles auf, was schnell erfasst wird (Sprache, Notiz, Teilen, Scan); Sortieren erzeugt eine Aufgabe und leert den Eintrag.',
      '- Fokus-Timer: Pomodoro 25/5 (Presets 50/10 und 15/3), nach vier Blöcken lange Pause; abgeschlossene Blöcke werden protokolliert und der Aufgabe zugerechnet.',
      '',
      '## Offene Fragen',
      '- Existiert im echten TAKT-Modul bereits ein Projekt-Konzept oder nur Kategorien/Tags?',
      '- Sollen Unteraufgaben eigene Fälligkeiten haben?',
      '- Wie sollen überfällige Aufgaben behandelt werden – automatisch auf heute verschieben oder sichtbar rot bleiben?',
      '- Läuft der Fokus-Timer im Hintergrund weiter (Benachrichtigung) oder nur bei geöffneter App?',
      '',
      '## Daten & Grenzen der Demo',
      '- Die Zeit im Fokus-Timer läuft in echten Sekunden; „Zeitraffer“ macht aus einer Sekunde eine Minute, damit ein Block in der Demo sichtbar abläuft.',
      '- Wochenstatistik: archivierte Erledigungen (Welt) plus Aufgaben mit Erledigungstag.',
    ].join('\n'),
    links: ['calendar', 'home', 'sales', 'habits'],
  },
  features: [
    // ------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'tasks.home', name: 'Übersicht', group: 'Übersicht', status: 'review', tier: 1,
      purpose: 'Der Einstieg in die Aufgaben: Was ist heute fällig, was überfällig, was liegt im Eingang – und was ist als Nächstes zu tun. Von hier mit einem Tipp in Liste, Board, Projekte, Eingang oder Fokus.',
      requirements: [
        { text: 'Heute fällig und überfällig auf einen Blick, Zeitbedarf des Tages (Summe der Schätzungen)', type: 'info', priority: 'must' },
        { text: 'Kennzahlen (heute, überfällig, Eingang, Woche erledigt, Fokus-Blöcke) werden berechnet, nie von Hand gepflegt', type: 'rule', priority: 'must' },
        { text: 'Aufgabe mit einem Tipp abhaken, Eingang und Fokus-Timer mit einem Tipp erreichbar', type: 'action', priority: 'must' },
        { text: 'Erfassen ohne Umweg: ein Satz genügt (Datum, Priorität, Projekt, Dauer werden erkannt)', type: 'action', priority: 'must' },
        { text: 'Aufgabe antippen öffnet das Aufgaben-Detail; Überfälliges führt in die Fälligkeits-Ansicht', type: 'action', priority: 'must' },
        { text: 'Variante Fokus: die eine nächste Aufgabe mit nächstem Schritt, Fokus starten und Erledigt', type: 'info', priority: 'should' },
        { text: 'Hinweise sachlich und mit Aktion: überfällig, Eingang unsortiert, Tagesplan passt oder ist überlastet (mit freier Zeit aus dem Kalender)', type: 'info', priority: 'should' },
        { text: 'Leerzustand: „Alles erledigt“ motiviert und bietet Erfassen an; Erstnutzung erklärt Eingang und Fokus', type: 'state', priority: 'must' },
        { text: 'Mobile: eine Spalte, Touch-Ziele ≥ 44 px, kein horizontales Scrollen', type: 'rule', priority: 'must' },
      ],
      interactions: [
        I('Aufgabe antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Checkbox antippen', 'Aufgabe erledigt, Kennzahlen aktualisieren sich', 'task.toggle'),
        I('Kachel „Heute fällig“ oder „Liste“', 'Aufgabenübersicht', 'list.open', 'tasks.overview'),
        I('Kachel „Überfällig“', 'Fälligkeits-Ansicht mit Überfälligem zuerst', 'overdue.open', 'tasks.due'),
        I('Kachel „Eingang“ oder „Eingang sortieren“', 'Eingang öffnet sich', 'inbox.open', 'tasks.inbox'),
        I('Kachel „Fokus“ oder „Fokus starten“', 'Fokus-Timer mit der gewählten Aufgabe', 'focus.open', 'tasks.focus'),
        I('„Board“ antippen', 'Kanban-Board', 'board.open', 'tasks.kanban'),
        I('„Projekte“ antippen', 'Projektübersicht', 'projects.open', 'tasks.projects'),
        I('Aufgabe in einem Satz erfassen + Enter', 'Aufgabe erscheint (Liste oder Eingang), Hinweis', 'task.create'),
        I('Gedanken in den Eingang legen', 'Eintrag im Eingang, Zähler steigt', 'inbox.add'),
        I('Hinweis wegwischen', 'Hinweis verschwindet', 'hint.dismiss'),
      ],
      acceptance: [
        'Die Startseite zeigt die Zahl der heute fälligen und überfälligen Aufgaben; beide Zahlen stimmen mit den Listen der Aufgabenübersicht überein.',
        'Eine abgehakte Aufgabe verschwindet sofort aus der Liste, die Kennzahlen aktualisieren sich ohne Seitenwechsel.',
        'Aus der Startseite sind Eingang, Fokus-Timer, Board und Aufgabenübersicht mit höchstens einem Tipp erreichbar.',
        'Ein Satz wie „Rechnung prüfen morgen !!“ wird als Aufgabe mit Datum und hoher Priorität angelegt und erscheint danach in der Übersicht.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, alle Ziele sind mindestens 36 px hoch.',
      ],
      flows: [
        { id: 'fl-morgen', name: 'Tag starten', steps: [{ featureId: 'tasks.home', action: 'Hinweise lesen: 2 überfällig, 7 im Eingang' }, { featureId: 'tasks.inbox', action: 'Eingang sortieren (Heute, Morgen)' }, { featureId: 'tasks.home', action: 'Zähler „Heute fällig“ ist gestiegen' }] },
        { id: 'fl-fokus', name: 'Wichtigstes starten', steps: [{ featureId: 'tasks.home', action: '„Fokus starten“ bei der nächsten Aufgabe' }, { featureId: 'tasks.focus', action: '25-Minuten-Block starten' }, { featureId: 'tasks.home', action: 'Fokus-Block im Zähler sehen' }] },
        { id: 'fl-detail', name: 'Aufgabe bearbeiten', steps: [{ featureId: 'tasks.home', action: 'Aufgabe antippen' }, { featureId: 'tasks.detail', action: 'Unteraufgabe abhaken' }] },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Liste & Kennzahlen', direction: 'kompakt', concept: 'Kennzahlen als Kachelreihe, darunter Schnellzugriffe und die Aufgabenliste (nach Fälligkeit, mit Eingabezeile). Seitenspalte: Projekte mit Fortschritt und das Fokus-Protokoll. Aktionen direkt in der Zeile.',
          description: '+ Alles auf einmal, schnell abgearbeitet  − Viele Elemente, auf Mobile lang',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Heute', subtitle: 'Di, 24. November', primaryLabel: '' } },
            { id: 'stats', component: 'task-stats', region: 'header', bind: { tasks: 'tasks', inbox: 'inbox', activity: 'activity', log: 'log' }, props: { style: 'tiles', items: ['today', 'overdue', 'inbox', 'done'] } },
            { id: 'nav', component: 'shortcut-bar', region: 'main', props: { style: 'chips', items: SHORTCUTS } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Aufgaben', groupBy: 'due', showDone: false, dense: true, inlineAdd: true, limit: 10, selectable: false } },
            { id: 'proj', component: 'project-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Projekte' } },
            { id: 'log', component: 'focus-log', region: 'aside', bind: { log: 'log', goal: 'goal' }, props: { title: 'Fokus heute', scope: 'today', limit: 3 } },
          ],
        },
        {
          id: 'B', name: 'Fortschritt & Verlauf', direction: 'visuell', concept: 'Eine Botschaft je Karte: der Tagesfortschritt als Ring, die Woche als Säulen, Kennzahlen als Kacheln, Projekte mit Balken, der Fokus der Woche. Große Kacheln führen in die Bereiche.',
          description: '+ Motivierend, sofort verständlich, ruhig  − Weniger Aufgaben ohne Scrollen sichtbar',
          layout: { type: 'grid', stretch: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Dein Tag', subtitle: 'Di, 24. November', primaryLabel: '' } },
            { id: 'ring', component: 'task-day-ring', region: 'main', span: 5, spanTablet: 12, bind: { tasks: 'tasks', activity: 'activity' }, props: { title: 'Heute' } },
            { id: 'week', component: 'task-week-chart', region: 'main', span: 7, spanTablet: 12, bind: { tasks: 'tasks', activity: 'activity', log: 'log' }, props: { title: 'Letzte 7 Tage' } },
            { id: 'stats', component: 'task-stats', region: 'main', span: 12, bind: { tasks: 'tasks', inbox: 'inbox', activity: 'activity', log: 'log' }, props: { style: 'tiles', items: ['overdue', 'inbox', 'focus', 'done'] } },
            { id: 'proj', component: 'project-list', region: 'main', span: 6, spanTablet: 12, bind: { tasks: 'tasks' }, props: { title: 'Projekte' } },
            { id: 'log', component: 'focus-log', region: 'main', span: 6, spanTablet: 12, bind: { log: 'log', goal: 'goal' }, props: { title: 'Fokus der letzten 7 Tage', scope: 'week' } },
            { id: 'nav', component: 'shortcut-bar', region: 'main', span: 12, props: { style: 'tiles', items: SHORTCUTS } },
          ],
        },
        {
          id: 'C', name: 'Jetzt dran', direction: 'fokus', concept: 'Die eine nächste Aufgabe zuerst – mit nächstem Schritt, „Fokus starten“ und „Erledigt“. Darunter Erfassen in den Eingang, sachliche Hinweise (überfällig, Eingang, Tagesplan gegen freie Zeit) und der Rest der Liste.',
          description: '+ Klare nächste Aktion, wenig Ablenkung, Erfassen ohne Umweg  − Weniger Gesamtüberblick über Projekte',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Jetzt', subtitle: 'Was ist als Nächstes dran?', primaryLabel: '' } },
            { id: 'next', component: 'next-task', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Jetzt dran' } },
            { id: 'cap', component: 'task-capture', region: 'main', bind: { tasks: 'tasks', inbox: 'inbox' }, props: { title: 'Erfassen', target: 'inbox', showExamples: false } },
            { id: 'hints', component: 'task-hints', region: 'main', bind: { tasks: 'tasks', inbox: 'inbox', events: 'events' }, props: { title: 'Hinweise', limit: 3 } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Danach', skipNext: true, groupBy: 'none', showDone: false, dense: true, limit: 4, selectable: false } },
            { id: 'nav', component: 'shortcut-bar', region: 'main', props: { style: 'chips', items: SHORTCUTS } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.overview', 'tasks.inbox', 'tasks.focus', 'tasks.kanban', 'tasks.detail', 'tasks.due', 'calendar.home', 'home.today'],
    },
    // ------------------------------------------------------ Aufgabenübersicht
    {
      id: 'tasks.overview', name: 'Aufgabenübersicht', group: 'Ansichten', status: 'design', tier: 1,
      purpose: 'Auf einen Blick erfassen, was zu tun ist, und sofort handeln: abhaken, priorisieren, nächste Aufgabe starten. Drei Konzepte: Liste, Kanban oder Tagesplanung.',
      requirements: [
        { text: 'Offene Aufgaben nach Fälligkeit gruppiert (Überfällig, Heute, Morgen …)', type: 'info', priority: 'must' },
        { text: 'Aufgabe mit einem Tipp abhaken; erledigte werden durchgestrichen', type: 'action', priority: 'must' },
        { text: 'Priorität und Fälligkeit je Aufgabe erkennbar, überfällig rot', type: 'info', priority: 'must' },
        { text: 'Suche und Filter (Heute, Überfällig, Priorität, Projekt)', type: 'action', priority: 'should' },
        { text: 'Neue Aufgabe in einem Schritt erfassen', type: 'action', priority: 'must' },
        { text: 'Aufgabe antippen öffnet das Aufgaben-Detail', type: 'action', priority: 'must' },
        { text: 'Leerer Zustand motiviert statt leer zu wirken', type: 'state', priority: 'should' },
        { text: 'Mobile: eine Spalte, Touch-Ziele ≥ 44 px, kein horizontales Scrollen der Seite', type: 'rule', priority: 'must' },
      ],
      interactions: [
        I('Checkbox antippen', 'Aufgabe erledigt (wiederkehrende springen weiter)', 'task.toggle'),
        I('Aufgabe antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Eingabe + Enter', 'Neue Aufgabe erscheint oben', 'task.create'),
        I('Filter wählen', 'Liste zeigt nur passende Aufgaben', 'filter.change'),
        I('Karte verschieben', 'Status wechselt', 'kanban.move'),
        I('Aufgabe einplanen', 'Fokus-Termin im freien Fenster', 'focus.schedule'),
        I('Termin in „Als Nächstes“ antippen', 'Termin-Detail im Kalender', 'event.open', 'calendar.event'),
        I('„Board“ (Kopfzeile)', 'Kanban-Board', 'header.secondary', 'tasks.kanban'),
      ],
      acceptance: [
        'Die Liste gruppiert offene Aufgaben nach Fälligkeit; Überfälliges steht zuerst und ist rot.',
        'Abhaken wirkt mit einem Tipp, wiederkehrende Aufgaben springen zur nächsten Fälligkeit.',
        'Ein Tipp auf eine Aufgabe öffnet das Aufgaben-Detail (im Launcher als eigener Screen).',
        'Die Zählung „offen“ im Kopf entspricht den sichtbaren offenen Aufgaben.',
      ],
      flows: [{ id: 'fl-abarbeiten', name: 'Liste abarbeiten', steps: [{ featureId: 'tasks.overview', action: 'Überfällige Aufgabe abhaken' }, { featureId: 'tasks.overview', action: 'Neue Aufgabe in der Eingabezeile erfassen' }, { featureId: 'tasks.overview', action: 'Aufgabe antippen' }, { featureId: 'tasks.detail', action: 'Unteraufgaben ergänzen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Liste kompakt', direction: 'kompakt', concept: 'Eine Spalte, nach Fälligkeit gruppiert, mit Eingabezeile oben und Filterchips. Maximale Geschwindigkeit beim Abarbeiten.',
          description: '+ Schnell, vertraut, mobil ideal  − Wenig Überblick über Projekte und Status',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Meine Aufgaben', subtitle: 'Offene Aufgaben nach Fälligkeit', primaryLabel: '', secondaryLabel: 'Board', secondaryIcon: 'kanban' } },
            { id: 'filter', component: 'search-filter', region: 'main', props: { filters: FILTERS, placeholder: 'Aufgaben suchen …' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: '', groupBy: 'due', showDone: true, dense: false, inlineAdd: true, selectable: false } },
          ],
        },
        {
          id: 'B', name: 'Kanban-zentriert', direction: 'visuell', concept: 'Status steht im Mittelpunkt: Spalten Offen → In Arbeit → Review → Erledigt. Projekte und Suche in der Seitenleiste filtern das Board.',
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
          id: 'C', name: 'Fokus-Tagesplanung', direction: 'fokus', concept: 'Der Tag zuerst: „Als Nächstes“ verbindet Termine, überfällige Aufgaben und freie Fenster mit Vorschlägen zum Einplanen. Rechts die Prioritätenliste.',
          description: '+ Plant realistisch, nutzt freie Zeit  − Weniger Gesamtüberblick, abhängig von Kalenderdaten',
          layout: { type: 'split', asideFirstOnMobile: false },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben · Fokus', title: 'Heute planen', subtitle: 'Di, 24. November', primaryLabel: '', secondaryLabel: 'Board', secondaryIcon: 'kanban' } },
            { id: 'kpi', component: 'task-stats', region: 'header', bind: { tasks: 'tasks', inbox: 'inbox', activity: 'activity', log: 'log' }, props: { style: 'tiles', items: ['today', 'overdue', 'done', 'focus'] }, hideOn: ['mobile'] },
            { id: 'focus', component: 'focus-next', region: 'main', bind: { events: 'events', tasks: 'tasks' }, props: { title: 'Tagesplan', openMode: NAV } },
            { id: 'prio', component: 'task-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Nach Priorität', groupBy: 'priority', showDone: false, dense: true, showProject: true, selectable: false, limit: 9 } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.kanban', 'tasks.list', 'tasks.detail', 'calendar.tasks'],
    },
    // ---------------------------------------------------------- Kanban
    {
      id: 'tasks.kanban', name: 'Kanban', group: 'Ansichten', status: 'design', tier: 2,
      purpose: 'Aufgaben nach Arbeitsstatus organisieren und per Drag & Drop (oder Menü) weiterschieben.',
      requirements: [
        { text: 'Vier Spalten: Offen, In Arbeit, Review, Erledigt – mit Zähler je Spalte', type: 'info', priority: 'must' },
        { text: 'Karten per Drag & Drop verschieben (Desktop)', type: 'action', priority: 'must' },
        { text: 'Alternative ohne Drag: Menü „Verschieben nach …“ (Touch, Tastatur)', type: 'action', priority: 'must' },
        { text: 'Karte zeigt Titel, Priorität, Fälligkeit, Projekt, Unteraufgaben-Fortschritt', type: 'info', priority: 'should' },
        { text: 'Mobile: Spalten horizontal wischbar (Scroll-Snap), Seite selbst scrollt nicht seitwärts', type: 'rule', priority: 'must' },
        { text: 'Karte direkt in einer Spalte anlegen', type: 'action', priority: 'should' },
        { text: 'Karte antippen öffnet das Aufgaben-Detail', type: 'action', priority: 'must' },
      ],
      interactions: [
        I('Karte in andere Spalte ziehen', 'Status wechselt, Hinweis', 'kanban.move'),
        I('Menü „Verschieben“', 'Status-Auswahl, Karte wandert', 'kanban.move'),
        I('Karte antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Karte in Spalte anlegen', 'Neue Karte oben', 'task.create'),
        I('Unteraufgabe abhaken', 'Fortschritt aktualisiert', 'subtask.toggle'),
      ],
      acceptance: [
        'Jede Spalte zeigt die Zahl ihrer Karten; die Summe aller Spalten entspricht der Zahl der Aufgaben.',
        'Eine Karte lässt sich per Menü (und am Desktop per Ziehen) in eine andere Spalte verschieben; Erledigt setzt den Haken.',
        'Auf 360 px Breite wischt man zwischen den Spalten, die Seite selbst scrollt nicht seitwärts.',
        'Ein Tipp auf eine Karte öffnet das Aufgaben-Detail (im Launcher als eigener Screen).',
      ],
      flows: [{ id: 'fl-board', name: 'Karte weiterschieben', steps: [{ featureId: 'tasks.kanban', action: '„Etsy-Gebühren buchen“ nach „In Arbeit“ verschieben' }, { featureId: 'tasks.kanban', action: 'Karte antippen' }, { featureId: 'tasks.detail', action: 'Status und Unteraufgaben prüfen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Board + Detailpanel', direction: 'kompakt', concept: 'Board nutzt die volle Breite, die gewählte Karte öffnet rechts ein Detailpanel – kein Dialog nötig.',
          description: '+ Bearbeiten ohne Kontextwechsel  − Detail rutscht auf Mobile unter das Board',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Kanban', subtitle: 'Karten ziehen oder über „⋯“ verschieben', primaryLabel: '' } },
            { id: 'board', component: 'kanban-board', region: 'main', bind: { tasks: 'tasks' }, props: { showProject: true } },
            { id: 'detail', component: 'task-detail', region: 'aside', bind: { tasks: 'tasks' }, props: { fallbackFirst: true } },
          ],
        },
        {
          id: 'B', name: 'Board mit Fortschritt', direction: 'visuell', concept: 'Das Board im Mittelpunkt, daneben der Tagesfortschritt als Ring und Projekte mit Balken – man sieht, wie weit alles ist, nicht nur, was wo liegt.',
          description: '+ Fortschritt auf einen Blick, schön  − Kein Detailpanel, Antippen führt auf einen eigenen Screen',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Board', subtitle: 'Status und Fortschritt', primaryLabel: '' } },
            { id: 'board', component: 'kanban-board', region: 'main', bind: { tasks: 'tasks' }, props: { showProject: true, compact: false } },
            { id: 'ring', component: 'task-day-ring', region: 'aside', bind: { tasks: 'tasks', activity: 'activity' }, props: { title: 'Heute' } },
            { id: 'proj', component: 'project-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Projekte' } },
          ],
        },
        {
          id: 'C', name: 'In Arbeit', direction: 'fokus', concept: 'Nur, was gerade läuft: Spalten „In Arbeit“ und „Review“, darüber die eine nächste Aufgabe mit „Fokus starten“. Neues landet über die Eingabe im Eingang.',
          description: '+ Weniger Ablenkung, klare nächste Aktion  − Offene und erledigte Karten sind ausgeblendet',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben · Fokus', title: 'In Arbeit', subtitle: 'Was läuft gerade?', primaryLabel: '' } },
            { id: 'next', component: 'next-task', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Als Nächstes', showAlternatives: true } },
            { id: 'board', component: 'kanban-board', region: 'main', bind: { tasks: 'tasks' }, props: { columns: ['In Arbeit', 'Review'], showProject: true, quickAdd: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.overview', 'tasks.detail'],
    },
    // ---------------------------------------------------------- Listenansicht
    {
      id: 'tasks.list', name: 'Listenansicht', group: 'Ansichten', status: 'design', tier: 2,
      purpose: 'Alle Aufgaben als ruhige Liste – wahlweise nach Priorität oder Projekt gruppiert.',
      requirements: [
        { text: 'Gruppierung wählbar: Fälligkeit, Priorität, Projekt', type: 'action', priority: 'must' },
        { text: 'Jede Zeile: Checkbox, Titel, Fälligkeit, Projekt, Priorität, Unteraufgaben-Zähler', type: 'info', priority: 'must' },
        { text: 'Erledigte Aufgaben ein-/ausblendbar', type: 'action', priority: 'should' },
        { text: 'Leere Gruppen werden nicht angezeigt', type: 'rule', priority: 'should' },
        { text: 'Zeile antippen öffnet das Aufgaben-Detail', type: 'action', priority: 'must' },
      ],
      interactions: [
        I('Checkbox antippen', 'Aufgabe erledigt', 'task.toggle'),
        I('Zeile antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
        I('Projekt wählen', 'Liste zeigt nur dieses Projekt', 'project.select'),
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Nach Priorität', direction: 'kompakt', concept: 'Eine Spalte, gruppiert nach Priorität (Hoch → Niedrig) mit ausgeschriebenem Prioritätslabel.',
          description: '+ Wichtiges oben, sehr klar  − Fälligkeit rückt in den Hintergrund',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Liste', subtitle: 'Nach Priorität', primaryLabel: '' } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Alle Aufgaben', groupBy: 'priority', showPriorityLabel: true, showDone: false, selectable: false } },
          ],
        },
        {
          id: 'B', name: 'Nach Projekt', direction: 'visuell', concept: 'Projektliste in der Seitenleiste filtert; Hauptliste gruppiert nach Projekt mit Fortschritt je Projekt.',
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
    // ---------------------------------------------------------- Detailansicht
    {
      id: 'tasks.detail', name: 'Detailansicht', group: 'Ansichten', status: 'review', tier: 1,
      purpose: 'Eine Aufgabe vollständig bearbeiten: Titel, Priorität, Fälligkeit, Status, Projekt, Wiederholung, Unteraufgaben, Notiz – und von hier den Fokus-Timer starten.',
      requirements: [
        { text: 'Master-Detail: Liste wählt Aufgabe, Detail zeigt alle Felder; aus anderen Screens geöffnet zeigt es die angetippte Aufgabe', type: 'info', priority: 'must' },
        { text: 'Änderungen wirken sofort in Liste und Board', type: 'rule', priority: 'must' },
        { text: 'Unteraufgaben abhaken/hinzufügen mit Fortschrittsbalken', type: 'action', priority: 'must' },
        { text: '„Fokus starten“ öffnet den Fokus-Timer mit dieser Aufgabe', type: 'action', priority: 'must' },
        { text: 'Aufgabe löschen mit Rückmeldung', type: 'action', priority: 'should' },
        { text: 'Mobile: Detail unter der Liste bzw. als eigene Ansicht', type: 'rule', priority: 'must' },
        { text: 'Ohne Auswahl: Hinweis statt leerer Fläche', type: 'state', priority: 'should' },
      ],
      interactions: [
        I('Aufgabe in Liste antippen', 'Detail zeigt die Aufgabe', 'task.open'),
        I('Feld ändern', 'Aufgabe aktualisiert', 'task.update'),
        I('Unteraufgabe abhaken', 'Fortschritt wächst', 'subtask.toggle'),
        I('Unteraufgabe hinzufügen', 'Eintrag erscheint', 'subtask.add'),
        I('„Fokus starten“', 'Fokus-Timer mit dieser Aufgabe', 'focus.open', 'tasks.focus'),
        I('Papierkorb', 'Aufgabe gelöscht', 'task.delete'),
      ],
      acceptance: [
        'Aus Übersicht, Liste, Board oder Startseite geöffnet zeigt das Detail genau die angetippte Aufgabe.',
        'Titel, Priorität, Fälligkeit, Status und Unteraufgaben lassen sich ändern; die Änderung ist danach in der Liste sichtbar.',
        '„Fokus starten“ führt in den Fokus-Timer, die Aufgabe ist dort vorgewählt.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, alle Ziele sind mindestens 36 px hoch.',
      ],
      flows: [{ id: 'fl-fokusstart', name: 'Aus dem Detail in den Fokus', steps: [{ featureId: 'tasks.detail', action: 'Unteraufgabe „Preise prüfen“ abhaken' }, { featureId: 'tasks.detail', action: '„Fokus starten“' }, { featureId: 'tasks.focus', action: 'Block starten' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Master-Detail', direction: 'kompakt', concept: 'Liste links (zwei Drittel Breite → Hauptspalte), Detailpanel rechts. Auswahl wechselt das Detail ohne Seitenwechsel.',
          description: '+ Schnelles Durchklicken, Kontext bleibt  − Auf Mobile steht das Detail oben, die Liste verkürzt darunter',
          layout: { type: 'split', even: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Aufgaben bearbeiten', primaryLabel: '' } },
            { id: 'list', component: 'task-list', region: 'main', hideOn: ['mobile', 'tablet'], bind: { tasks: 'tasks' }, props: { title: 'Aufgaben', groupBy: 'due', showDone: false, dense: true } },
            { id: 'detail', component: 'task-detail', region: 'aside', bind: { tasks: 'tasks' }, props: {} },
            { id: 'switch', component: 'task-list', region: 'aside', hideOn: ['desktop'], bind: { tasks: 'tasks' }, props: { title: 'Andere Aufgabe wählen', groupBy: 'due', showDone: false, dense: true, limit: 6 } },
          ],
        },
        {
          id: 'B', name: 'Detail zuerst', direction: 'fokus', concept: 'Detailpanel oben (mobil: direkt sichtbar), darunter kompakte Liste zum Wechseln. Eine Spalte.',
          description: '+ Bearbeiten steht im Fokus  − Lange Seite',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Detail', primaryLabel: '' } },
            { id: 'detail', component: 'task-detail', region: 'main', bind: { tasks: 'tasks' }, props: {} },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Weitere Aufgaben', groupBy: 'none', showDone: false, dense: true, limit: 6 } },
          ],
        },
        {
          id: 'C', name: 'Große Karte', direction: 'visuell', concept: 'Die Aufgabe als große Karte mit Unteraufgaben und Fokus-Start; daneben der Tagesfortschritt als Ring und der Wochenverlauf. Darunter wenige Karten zum Wechseln.',
          description: '+ Aufgabe und Tagesbild zusammen, ruhig  − Weniger Aufgaben gleichzeitig sichtbar',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Aufgabe', primaryLabel: '' } },
            { id: 'detail', component: 'task-detail', region: 'main', span: 7, spanTablet: 12, bind: { tasks: 'tasks' }, props: {} },
            { id: 'ring', component: 'task-day-ring', region: 'main', span: 5, spanTablet: 12, bind: { tasks: 'tasks', activity: 'activity' }, props: { title: 'Dein Tag' } },
            { id: 'week', component: 'task-week-chart', region: 'main', span: 5, spanTablet: 12, bind: { tasks: 'tasks', activity: 'activity', log: 'log' }, props: { title: 'Letzte 7 Tage' } },
            { id: 'list', component: 'task-list', region: 'main', span: 12, spanTablet: 12, bind: { tasks: 'tasks' }, props: { title: 'Andere Aufgabe wählen', groupBy: 'none', showDone: false, dense: true, limit: 5 } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.kanban', 'tasks.list', 'tasks.focus'],
      seedHistory: [{ kind: 'draft', note: 'Master-Detail (A) und Detail-zuerst (B)' }, { kind: 'review', note: 'Zur Prüfung: Unteraufgaben-Interaktion und „Fokus starten“' }],
    },
    // ---------------------------------------------------------- Eingang
    {
      id: 'tasks.inbox', name: 'Eingang', group: 'Erfassen & Fokus', status: 'design', tier: 1,
      purpose: 'Schnell erfassen, später sortieren: alles, was per Sprache, Notiz, Teilen oder Scan hereinkommt, landet im Eingang und wird mit einem Tipp zur Aufgabe (Heute, Morgen, Diese Woche, Irgendwann).',
      requirements: [
        { text: 'Eingang listet unsortierte Einträge mit Quelle (Sprache, Notiz, Teilen, Scan, Erfassen) und Alter', type: 'info', priority: 'must' },
        { text: 'Triage mit einem Tipp: Heute, Morgen, Diese Woche, Irgendwann – der Eintrag wird zur Aufgabe und verschwindet aus dem Eingang', type: 'action', priority: 'must' },
        { text: 'Vorschlag (Projekt, Datum, Priorität) mit einem Tipp übernehmen', type: 'action', priority: 'should' },
        { text: 'Erfassen in einem Satz direkt im Eingang (Datum, Priorität und Projekt werden erkannt)', type: 'action', priority: 'must' },
        { text: 'Eintrag löschen mit Rückmeldung', type: 'action', priority: 'should' },
        { text: 'Variante Fokus: ein Eintrag nach dem anderen mit großen Tasten und Fortschritt „noch n übrig“', type: 'info', priority: 'should' },
        { text: 'Leerzustand „Eingang leer“ als Erfolgserlebnis; der Zähler auf der Startseite stimmt mit dem Eingang überein', type: 'state', priority: 'must' },
      ],
      interactions: [
        I('„Heute“, „Morgen“, „Diese Woche“, „Irgendwann“', 'Eintrag wird Aufgabe mit passender Fälligkeit und verschwindet', 'inbox.triage'),
        I('Vorschlag antippen', 'Eintrag wird mit Projekt, Datum und Priorität übernommen', 'inbox.triage'),
        I('Papierkorb', 'Eintrag gelöscht', 'inbox.delete'),
        I('Satz eingeben + Enter', 'Neuer Eintrag oben im Eingang', 'inbox.add'),
        I('Aufgabe in „Heute“ antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
      ],
      acceptance: [
        'Der Eingang zeigt mindestens fünf Einträge mit Quelle und Alter; nach einem Tipp auf „Heute“ verschwindet der Eintrag und erscheint als Aufgabe mit heutigem Datum.',
        'Der Zähler im Kopf (offen) und der Eingangs-Zähler der Startseite stimmen überein.',
        'Der Vorschlag setzt Projekt, Datum und Priorität mit einem Tipp.',
        'Ein Satz wie „Lieferant anrufen Freitag 10 Uhr“ landet mit Datum im Eingang.',
        'Auf 360 px Breite sind alle Triage-Tasten mindestens 36 px hoch und brechen sauber um.',
      ],
      flows: [{ id: 'fl-sortieren', name: 'Eingang sortieren', steps: [{ featureId: 'tasks.inbox', action: '„Rückruf Spedition“ → Heute' }, { featureId: 'tasks.inbox', action: '„Rechnung Fotograf“ → Vorschlag übernehmen' }, { featureId: 'tasks.inbox', action: 'Idee → Irgendwann' }, { featureId: 'tasks.home', action: 'Zähler „Eingang“ ist gesunken' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Liste mit Triage-Tasten', direction: 'kompakt', concept: 'Eingabezeile oben (Eingang), darunter alle Einträge mit Quelle, Alter und Triage-Tasten in der Zeile. Rechts: wohin es führt (Heute-Liste).',
          description: '+ Viele Einträge schnell sortiert, Wirkung sichtbar  − Dichte Zeilen, auf Mobile mehrere Tasten je Zeile',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Eingang', subtitle: 'Erfasst, noch nicht sortiert', primaryLabel: '' } },
            { id: 'cap', component: 'task-capture', region: 'main', bind: { tasks: 'tasks', inbox: 'inbox' }, props: { title: 'In den Eingang legen', target: 'inbox', showExamples: true } },
            { id: 'inbox', component: 'task-inbox', region: 'main', bind: { inbox: 'inbox', tasks: 'tasks' }, props: { title: 'Eingang', style: 'list' } },
            { id: 'today', component: 'task-list', region: 'aside', bind: { tasks: 'tasks' }, props: { title: 'Heute & überfällig', groupBy: 'due', showDone: false, dense: true, limit: 6, selectable: false, showProject: false } },
          ],
        },
        {
          id: 'B', name: 'Karte für Karte', direction: 'fokus', concept: 'Ein Eintrag nach dem anderen, groß, mit Vorschlag und vier Tasten (Heute, Morgen, Diese Woche, Irgendwann). Der Rest wartet; am Ende steht „Eingang leer“.',
          description: '+ Konzentriert, hohe Trefferquote, ein Daumen reicht  − Kein Überblick über alle Einträge',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Eingang', subtitle: 'Sortiere einen nach dem anderen', primaryLabel: '' } },
            { id: 'inbox', component: 'task-inbox', region: 'main', bind: { inbox: 'inbox', tasks: 'tasks' }, props: { title: 'Nächster Eintrag', style: 'steps' } },
            { id: 'cap', component: 'task-capture', region: 'main', bind: { tasks: 'tasks', inbox: 'inbox' }, props: { title: 'Neuer Gedanke', target: 'inbox', showExamples: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.home', 'tasks.overview', 'tasks.detail'],
    },
    // ---------------------------------------------------------- Fokus-Timer
    {
      id: 'tasks.focus', name: 'Fokus-Timer', group: 'Erfassen & Fokus', status: 'design', tier: 2,
      purpose: 'Eine Aufgabe in Ruhe abarbeiten: Pomodoro mit Fokusblock und Pause an der gewählten Aufgabe, Tagesziel in Blöcken und ein Protokoll der geschafften Zeit.',
      requirements: [
        { text: 'Timer mit Fokusblock (25 Min.), kurzer Pause (5 Min.), nach vier Blöcken langer Pause (15 Min.); Presets 25/5, 50/10, 15/3', type: 'rule', priority: 'must' },
        { text: 'Start, Pause/Weiter, Zurücksetzen und Überspringen; Phase und verbleibende Zeit gut lesbar (auch aus der Distanz)', type: 'action', priority: 'must' },
        { text: 'Aufgabe wählbar (vorbelegt aus Detail oder Startseite); zeigt Fälligkeit, Schätzung, bisherige Fokuszeit und den nächsten Schritt', type: 'info', priority: 'must' },
        { text: 'Abgeschlossene Blöcke landen im Protokoll („Fokus heute“) und zählen zur Aufgabe', type: 'rule', priority: 'must' },
        { text: 'Tagesziel als Punkte (z. B. 6 Blöcke) und Wochenverlauf', type: 'info', priority: 'should' },
        { text: 'Demo: Zeitraffer (1 Sekunde = 1 Minute), damit ein Block sichtbar abläuft; ohne Echtzeit-Abhängigkeit im Ruhezustand', type: 'rule', priority: 'should' },
        { text: 'Leerzustand: ohne offene Aufgabe Hinweis „Aufgabe anlegen“; Pause-Phase freundlich, nicht fordernd', type: 'state', priority: 'must' },
      ],
      interactions: [
        I('„Start“', 'Timer läuft, Phase „Fokus“', 'focus.start'),
        I('„Pause“', 'Timer hält an', 'focus.pause'),
        I('Zurücksetzen', 'Phase beginnt von vorn', 'focus.reset'),
        I('Überspringen', 'Nächste Phase (Pause oder Fokus), nichts wird protokolliert', 'focus.skip'),
        I('Block läuft ab', 'Eintrag im Protokoll, Aufgabe erhält Fokuszeit, Hinweis, Pause beginnt', 'focus.complete'),
        I('Aufgabe wählen', 'Timer bezieht sich auf die gewählte Aufgabe', 'focus.task'),
        I('Eintrag im Protokoll antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
      ],
      acceptance: [
        'Mit „Zeitraffer“ läuft ein 25-Minuten-Block in etwa 25 Sekunden ab; danach steht ein neuer Eintrag im Protokoll und die Pause beginnt.',
        'Aus dem Aufgaben-Detail geöffnet ist die Aufgabe im Timer vorgewählt.',
        'Nach vier abgeschlossenen Blöcken folgt eine lange Pause.',
        'Die Punkte des Tagesziels und die Zahl im Protokoll stimmen überein.',
        'Der Timer ist im Ruhezustand deterministisch (zeigt 25:00) und hat keine Echtzeit-Abhängigkeit in Screenshots.',
      ],
      flows: [{ id: 'fl-block', name: 'Einen Block arbeiten', steps: [{ featureId: 'tasks.focus', action: 'Aufgabe wählen, Zeitraffer aktivieren, „Start“' }, { featureId: 'tasks.focus', action: 'Block läuft ab, Eintrag im Protokoll sehen' }, { featureId: 'tasks.focus', action: 'Pause überspringen, nächsten Block beginnen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Großer Ring', direction: 'fokus', concept: 'Ein Ring mit der Zeit in der Mitte, die Aufgabe darunter, ein großer Start-Knopf, Tagesziel als Punkte. Das Protokoll sitzt ruhig daneben.',
          description: '+ Ruhig, aus der Distanz lesbar, ein Knopf  − Wenig Überblick über andere Aufgaben',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Fokus', subtitle: 'Ein Block nach dem anderen', primaryLabel: '' } },
            { id: 'timer', component: 'focus-timer', region: 'main', bind: { tasks: 'tasks', log: 'log', goal: 'goal' }, props: { style: 'ring', preset: '25 / 5' } },
            { id: 'log', component: 'focus-log', region: 'aside', bind: { log: 'log', goal: 'goal' }, props: { title: 'Fokus heute', scope: 'today' } },
          ],
        },
        {
          id: 'B', name: 'Timer & Aufgabenliste', direction: 'kompakt', concept: 'Kompakter Timer in einer Zeile, darunter die Aufgabenliste zum Wechseln der Aufgabe und das Protokoll. Für Power-User, die zwischen Aufgaben springen.',
          description: '+ Schneller Wechsel zwischen Aufgaben, alles sichtbar  − Weniger meditativ, mehr Ablenkung',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Fokus', subtitle: 'Aufgabe wählen, Block starten', primaryLabel: '' } },
            { id: 'timer', component: 'focus-timer', region: 'main', bind: { tasks: 'tasks', log: 'log', goal: 'goal' }, props: { style: 'compact', preset: '25 / 5', showPicker: false } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Aufgaben', groupBy: 'due', showDone: false, dense: true, limit: 8, showProject: false } },
            { id: 'log', component: 'focus-log', region: 'aside', bind: { log: 'log', goal: 'goal' }, props: { title: 'Fokus heute', scope: 'today' } },
          ],
        },
        {
          id: 'C', name: 'Ring & Wochenverlauf', direction: 'visuell', concept: 'Der Ring groß, daneben der Wochenverlauf (erledigt je Tag mit Fokus-Punkten) und die Fokus-Woche als Balken. Zeigt Rhythmus statt Zahlenkolonnen.',
          description: '+ Motivierend, Rhythmus sichtbar  − Viel Raum für wenig Funktion',
          layout: { type: 'grid', stretch: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Fokus', subtitle: 'Dein Rhythmus', primaryLabel: '' } },
            { id: 'timer', component: 'focus-timer', region: 'main', span: 7, spanTablet: 12, bind: { tasks: 'tasks', log: 'log', goal: 'goal' }, props: { style: 'ring', preset: '25 / 5' } },
            { id: 'week', component: 'task-week-chart', region: 'main', span: 5, spanTablet: 12, bind: { tasks: 'tasks', activity: 'activity', log: 'log' }, props: { title: 'Letzte 7 Tage' } },
            { id: 'log', component: 'focus-log', region: 'main', span: 5, spanTablet: 12, bind: { log: 'log', goal: 'goal' }, props: { title: 'Fokus der letzten 7 Tage', scope: 'week' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['tasks.detail', 'tasks.home', 'calendar.tasks'],
    },
    // ---------------------------------------------------------- Prioritäten
    {
      id: 'tasks.priority', name: 'Prioritäten', group: 'Organisation', status: 'analyzed', tier: 2,
      purpose: 'Wichtiges von Dringendem trennen: drei Prioritätsstufen, die überall konsistent dargestellt werden.',
      requirements: [
        { text: 'Drei Stufen: Hoch (rot), Mittel (orange), Niedrig (neutral) – nie nur Farbe, immer Flagge + Text', type: 'rule', priority: 'must' },
        { text: 'Priorität im Detail per Segment-Auswahl änderbar', type: 'action', priority: 'must' },
        { text: 'Sortierung innerhalb einer Gruppe: Priorität, dann Fälligkeit', type: 'rule', priority: 'should' },
      ],
      interactions: [I('Priorität im Detail ändern', 'Liste sortiert neu', 'task.update')],
      viewports: ALL_VP, demoData,
      variants: [],
    },
    // ---------------------------------------------------------- Fälligkeit
    {
      id: 'tasks.due', name: 'Fälligkeit', group: 'Organisation', status: 'design', tier: 2,
      purpose: 'Fälligkeit relativ und menschlich anzeigen („Heute · 14:00“, „Seit 2 Tagen überfällig“) und Überfälliges sofort sichtbar machen.',
      requirements: [
        { text: 'Relative Texte: Heute, Morgen, Wochentag, Datum; überfällig mit Anzahl Tage', type: 'info', priority: 'must' },
        { text: 'Überfällige Aufgaben rot und ganz oben gruppiert', type: 'rule', priority: 'must' },
        { text: 'Hinweis-Banner, wenn Überfälliges existiert', type: 'state', priority: 'should' },
        { text: 'Datum im Detail per Datumsfeld änderbar', type: 'action', priority: 'must' },
      ],
      interactions: [
        I('Hinweis „Überfällige ansehen“', 'Aufgabenliste öffnet sich', 'overdue.open', 'tasks.list'),
        I('Hinweis ausblenden', 'Hinweis verschwindet', 'hint.dismiss'),
        I('Filter „Überfällig“', 'Nur überfällige Aufgaben', 'filter.change'),
        I('Aufgabe abhaken', 'Überfällig-Zähler sinkt', 'task.toggle'),
        I('Aufgabe antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Überfällig zuerst', direction: 'fokus', concept: 'Banner mit Zusammenfassung, Filterchips (Heute/Überfällig/Diese Woche) und nach Fälligkeit gruppierte Liste.',
          description: '+ Dringendes nie übersehen  − Banner kann nerven, wenn dauerhaft überfällig',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Aufgaben', title: 'Fälligkeiten', primaryLabel: '' } },
            { id: 'note', component: 'task-hints', region: 'main', bind: { tasks: 'tasks', inbox: 'inbox', events: 'events' }, props: { title: '', limit: 2 } },
            { id: 'filter', component: 'search-filter', region: 'main', props: { filters: ['Alle', 'Überfällig', 'Heute', 'Diese Woche'], showSearch: false } },
            { id: 'list', component: 'task-list', region: 'main', bind: { tasks: 'tasks' }, props: { title: 'Nach Fälligkeit', groupBy: 'due', showDone: false, selectable: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
    },
    // ---------------------------------------------------------- Wiederholungen
    {
      id: 'tasks.repeat', name: 'Wiederholungen', group: 'Organisation', status: 'not_analyzed', tier: 3,
      purpose: 'Wiederkehrende Aufgaben (Belege, Wochenplanung) automatisch neu fällig stellen.',
      requirements: [
        { text: 'Rhythmen: täglich, werktags, wöchentlich, monatlich', type: 'rule', priority: 'must' },
        { text: 'Abhaken springt zur nächsten Fälligkeit und setzt Unteraufgaben zurück', type: 'rule', priority: 'must' },
        { text: 'Wiederholung in der Liste durch Symbol erkennbar', type: 'info', priority: 'should' },
      ],
      interactions: [],
      viewports: ALL_VP, demoData,
      variants: [],
    },
    // ---------------------------------------------------------- Kategorien
    {
      id: 'tasks.categories', name: 'Kategorien', group: 'Organisation', status: 'analyzed', tier: 3,
      purpose: 'Aufgaben nach Lebensbereich (Arbeit, Privat, Finanzen) einordnen und filtern.',
      requirements: [
        { text: 'Jede Aufgabe hat höchstens eine Kategorie, unabhängig vom Projekt', type: 'rule', priority: 'must' },
        { text: 'Kategorie als Filterchip und Gruppierung wählbar', type: 'action', priority: 'should' },
        { text: 'Kategorien teilen sich Farben mit dem Kalender', type: 'rule', priority: 'could' },
      ],
      interactions: [I('Kategorie-Chip wählen', 'Liste filtert', 'filter.change')],
      viewports: ALL_VP, demoData,
      variants: [],
    },
    // ---------------------------------------------------------- Projekte
    {
      id: 'tasks.projects', name: 'Projekte', group: 'Organisation', status: 'design', tier: 2,
      purpose: 'Aufgaben zu Projekten bündeln, Fortschritt sehen und gezielt in ein Projekt eintauchen.',
      requirements: [
        { text: 'Projektliste mit Fortschrittsbalken (erledigt/gesamt) und nächster Fälligkeit', type: 'info', priority: 'must' },
        { text: 'Überfällige Aufgaben je Projekt als Badge', type: 'info', priority: 'should' },
        { text: 'Projekt antippen filtert die Aufgabenliste', type: 'action', priority: 'must' },
        { text: 'Aufgabe antippen öffnet das Aufgaben-Detail', type: 'action', priority: 'should' },
      ],
      interactions: [
        I('Projekt antippen', 'Aufgabenliste zeigt nur dieses Projekt', 'project.select'),
        I('Aufgabe antippen', 'Aufgaben-Detail öffnet sich', 'task.open', 'tasks.detail'),
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Projekte + Aufgaben', direction: 'visuell', concept: 'Projektübersicht links als Filter, rechts die zugehörigen Aufgaben als Liste.',
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
  ],
  decisions: [
    { featureId: 'tasks.home', title: 'Welche Startseite für die Aufgaben?', decision: '', rationale: 'Kompakt (A) zeigt Liste und Kennzahlen zugleich, Visuell (B) erzählt den Tag als Ring und Wochenverlauf, Fokus (C) stellt die eine nächste Aufgabe und das Erfassen in den Mittelpunkt. Entscheidung nach einer Woche echter Nutzung: Wird mehr abgearbeitet oder mehr sortiert?', tradeoffs: 'A: dicht, auf Mobile lang. B: motivierend, weniger Aufgaben sichtbar. C: klare Handlung, wenig Projektüberblick.', status: 'open' },
    { featureId: 'tasks.overview', title: 'Standardansicht der Aufgabenübersicht', decision: '', rationale: 'Liste (A) ist am schnellsten, Kanban (B) zeigt Status, Tagesplanung (C) verbindet mit dem Kalender. Entscheidung nach Nutzungsgewohnheit: Wie oft wird nach Status statt nach Fälligkeit gearbeitet?', tradeoffs: 'A: einfach, aber ohne Statuskontext. B: Status klar, braucht Platz. C: planerisch stark, hängt vom Kalender ab.', status: 'open' },
    { featureId: 'tasks.repeat', title: 'Wiederkehrende Aufgaben springen zur nächsten Fälligkeit', decision: 'Beim Abhaken einer wiederkehrenden Aufgabe bleibt sie bestehen, die Fälligkeit springt zum nächsten Termin und Unteraufgaben werden zurückgesetzt.', rationale: 'Verhindert Duplikate und hält die Historie schlank; entspricht dem erwarteten Verhalten gängiger To-do-Apps.', tradeoffs: 'Erledigungs-Historie je Durchlauf geht verloren, sofern sie nicht separat protokolliert wird.', status: 'decided' },
    { featureId: 'tasks.kanban', title: 'Kanban-Spalten fest oder frei konfigurierbar?', decision: '', rationale: 'Die Library-Komponente unterstützt beliebige Spalten (Prop „columns“). Offen ist, ob TAKT V2.0 eigene Status zulässt.', tradeoffs: 'Fest: einfach, konsistent mit Filter und Statistik. Frei: flexibel, aber komplexere Datenmodelle und Berichte.', status: 'open' },
    { featureId: 'tasks.inbox', title: 'Erfassen ohne Datum landet im Eingang', decision: 'Alles, was schnell per Sprache, Notiz, Teilen oder Scan erfasst wird, landet zunächst im Eingang. Erst das Sortieren (Heute, Morgen, Diese Woche, Irgendwann) macht daraus eine Aufgabe.', rationale: 'Erfassen darf keine Entscheidungen verlangen, sonst wird weniger erfasst. Ein Eingang trennt „festhalten“ von „einplanen“ und hält die Liste sauber.', tradeoffs: 'Ein zusätzlicher Schritt; ohne Erinnerung wächst der Eingang. Gegenmittel: Zähler auf der Startseite und Hinweis ab fünf Einträgen.', status: 'decided' },
    { featureId: 'tasks.focus', title: 'Fokus-Timer: Rhythmus und Verhalten im Hintergrund', decision: '', rationale: 'Die Demo kennt 25/5 (Standard), 50/10 und 15/3 sowie eine lange Pause nach vier Blöcken. Offen ist, ob der Timer im Hintergrund weiterläuft (Benachrichtigung, Vordergrunddienst) und ob die Länge je Aufgabe aus der Zeitschätzung vorgeschlagen wird.', tradeoffs: 'Hintergrund: nützlich, aber Berechtigungen und Akku. Nur im Vordergrund: einfach, bricht bei App-Wechsel ab.', status: 'open' },
  ],
};
