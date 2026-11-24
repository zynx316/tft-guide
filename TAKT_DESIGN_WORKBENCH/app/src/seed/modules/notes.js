// Modul "Notizen" – Gedanken, Listen und Ideen festhalten, einsortieren und wiederfinden.
// Referenztag: Di, 24.11.2026 09:30 (ctx.today). Termine und Aufgaben kommen aus der gemeinsamen Datenwelt (@world:).
const L = (...lines) => lines.join('\n');
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];

// Notizen, Verlauf, Verknüpfungen, Kennzahlen und Diagramm liegen in der gemeinsamen Datenwelt (world/knowledge.js, Eigentümer: knowledge):
// Erfassen, Suche und Bildtext-Erkennung legen Notizen in derselben Liste an.
const notesW = '@world:notes';

const FILTERS = ['Alle', 'Angeheftet', 'Eingang', 'Arbeit', 'Privat', 'Projekt', 'Archiv'];
const TAG_FILTERS = ['Alle', 'Angeheftet', 'Arbeit', 'Privat', 'Projekt', 'Ideen', 'Reisen', 'Rezepte', 'Eingang', 'Archiv'];
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });
const demo = { notes: notesW, metrics: '@world:notesMetrics', tagChart: '@world:notesTagChart', history: '@world:notesHistory' };
const worldCtx = { notes: notesW, tasks: '@world:tasks', events: '@world:events' };

export default {
  module: {
    id: 'notes', name: 'Notizen', icon: 'sticky-note', status: 'active', theme: 'graphite', designVersion: '0.3', homeFeatureId: 'notes.home',
    description: 'Gedanken, Listen und Ideen in Sekunden festhalten, im Eingang einsortieren und jederzeit wiederfinden.',
    source: 'Workbench V2 (Bauplan, Brainstorm „alltag“) – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Übersicht“ (zuletzt, angeheftet, Eingang, offene Checklisten). Von dort: Notiz antippen → Editor; „Alle Notizen“ → Notizübersicht mit Suche und Filtern; Eingang → Einsortieren (Tag, Aufgabe, Archiv); Checklisten → alle offenen Punkte. Der Eingang ist ein Zustand, kein Ordner: Neues landet dort, bis es abgelegt wird. Anheften und Archivieren genügen als Ordnungsmittel, Tags sind die einzige Struktur.',
    docs: L('## Leitidee', '- Erfassen in unter drei Sekunden, Ordnen später. Der Eingang nimmt alles auf, ohne Pflichtfelder.', '- Notizen sind Markdown-Text; Checklisten entstehen über `- [ ]` und zählen als offene Punkte.', '- Autosave statt Speichern-Knopf; Anheften und Archivieren statt Ordnerbaum.', '', '## Verbindung zu anderen Modulen', '- Termine (Kalender): „Notiz zum Termin“ legt eine Notiz mit Agenda-Vorlage an.', '- Aufgaben: Eingang → „Als Aufgabe“ legt eine Aufgabe für heute in der gemeinsamen Datenwelt an.', '- Picture to Text: erkannter Text landet als Notiz mit Tag „OCR“ im Eingang.', '', '## Offene Fragen', '- Gibt es im bestehenden TAKT bereits Notiz-Ordner oder -Farben?', '- Sollen Checklistenpunkte dauerhaft mit Aufgaben verknüpft sein (zwei Wege) oder nur einmal übernommen werden?', '- Synchronisierung über Geräte: Konfliktbehandlung bei gleichzeitiger Bearbeitung.', '', '## Bekannte Grenze der Vorschau', '- Notizen liegen im Modul (noch nicht in der gemeinsamen Datenwelt): Änderungen wirken innerhalb eines Screens, nicht über Screens hinweg. Neue Notizen werden beim Öffnen des Editors übernommen.'),
    links: ['tasks', 'calendar', 'knowledge', 'picture-to-text'],
  },
  features: [
    // ------------------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'notes.home', name: 'Übersicht', group: 'Übersicht', status: 'design', tier: 1,
      purpose: 'Der Einstieg in Notizen: weiterschreiben, Neues festhalten, den Eingang leeren und offene Listen abhaken – ohne zu suchen.',
      requirements: [
        { text: 'Zuletzt bearbeitete und angeheftete Notizen sind sofort erreichbar; ein Tipp öffnet den Editor', type: 'info', priority: 'must' },
        { text: 'Neue Notiz mit einem Tipp; Schnellnotiz im Eingang ohne Titel- oder Tag-Pflicht', type: 'action', priority: 'must' },
        { text: 'Eingang zeigt Anzahl und lässt sich direkt einsortieren (Tag, Aufgabe, Archiv)', type: 'action', priority: 'must' },
        { text: 'Offene Checklistenpunkte aller Notizen sind abhakbar und zeigen den Fortschritt je Liste', type: 'info', priority: 'should' },
        { text: 'Kontext aus dem Kalender: zum nächsten Termin die passende Notiz öffnen oder eine Notiz zum Termin anlegen', type: 'info', priority: 'should' },
        { text: 'Leerzustand (erster Start) erklärt die Idee und bietet „Erste Notiz“ an; keine leeren Kacheln', type: 'state', priority: 'must' },
        { text: 'Mobile: keine zweite Navigation, Touch-Ziele ≥ 44 px, kein horizontaler Überlauf', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Notiz antippen', result: 'Editor mit der gewählten Notiz', event: 'note.open', to: 'notes.editor' },
        { trigger: 'Neue Notiz', result: 'Leere Notiz wird angelegt und im Editor geöffnet', event: 'note.create', to: 'notes.editor' },
        { trigger: '„Alle Notizen“', result: 'Notizübersicht mit Suche und Filtern', event: 'header.secondary', to: 'notes.overview' },
        { trigger: 'Eingang antippen / „Einsortieren“', result: 'Eingang mit Sortier-Assistent', event: 'note.inbox.open', to: 'notes.inbox' },
        { trigger: 'Checklisten-Kopf antippen', result: 'Alle Checklisten', event: 'note.checklists.open', to: 'notes.checklists' },
        { trigger: 'Kennzahl antippen', result: 'Notizübersicht', event: 'metric.open', to: 'notes.overview' },
        { trigger: 'Punkt abhaken', result: 'Punkt wird erledigt und in der Notiz gespeichert', event: 'note.checklist.toggle' },
        { trigger: 'Notiz anheften', result: 'Notiz wandert nach oben', event: 'note.pin' },
        { trigger: 'Eingang: Tag wählen', result: 'Notiz verlässt den Eingang', event: 'note.inbox.sort' },
      ],
      acceptance: [
        'Jede Variante öffnet eine Notiz mit höchstens einem Tipp im Editor.',
        'Der Eingang lässt sich ohne Wechsel des Screens leeren (Tag, Aufgabe oder Archiv in der Zeile).',
        'Ein abgehakter Punkt verschwindet aus „Offene Punkte“ und die Zahl sinkt sofort.',
        'Der Fokus-Rahmen zeigt zum nächsten Termin eine passende Notiz oder „Notiz zum Termin“.',
        'Im Szenario „erststart“ erscheinen Leerzustände mit klarer erster Aktion statt leerer Karten.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, auf 200 % Schrift wird nichts abgeschnitten.',
      ],
      flows: [
        { id: 'fl-weiter', name: 'Weiterschreiben', steps: [{ featureId: 'notes.home', action: 'Notiz „Ideen TAKT V2“ antippen' }, { featureId: 'notes.editor', action: 'Text ergänzen, Autosave zeigt „Gespeichert“' }] },
        { id: 'fl-eingang', name: 'Eingang leeren', steps: [{ featureId: 'notes.home', action: 'Eingang prüfen, „Rückruf Frau Weber“ als Aufgabe übernehmen' }, { featureId: 'notes.inbox', action: 'Rest einsortieren' }] },
      ],
      viewports: ALL_VP, demoData: { ...demo, ...worldCtx },
      variants: [
        {
          id: 'A', name: 'Liste & Eingang', direction: 'kompakt', concept: 'Dichte Notizliste mit Filterchips und Checklisten-Fortschritt in der Zeile; daneben der Eingang mit Einsortieren in einem Tipp und die offenen Listenpunkte zum Abhaken.',
          description: '+ Alles in einem Blick, Aktionen in der Zeile  − Viele Elemente, auf Mobile lang',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Übersicht', subtitle: 'Festhalten, einsortieren, wiederfinden', primaryLabel: '', secondaryLabel: 'Alle Notizen', secondaryIcon: 'layout-list' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Notizen durchsuchen …', filters: FILTERS } },
            { id: 'list', component: 'note-list', region: 'main', props: { title: 'Notizen', layout: 'compact', openIn: 'select', autoSelect: false, showCreate: true } },
            { id: 'inbox', component: 'note-inbox', region: 'aside', bind: { notes: 'notes', tasks: 'tasks' }, props: { title: 'Eingang', limit: 3, link: 'Einsortieren' } },
            { id: 'checks', component: 'note-checklists', region: 'aside', props: { title: 'Offene Punkte', limit: 2, link: 'Alle' } },
          ],
        },
        {
          id: 'B', name: 'Karten & Fortschritt', direction: 'visuell', concept: 'Angeheftete Notizen als große Karten, daneben Tags als Ring und Checklisten als Fortschrittskarten, darunter „Zuletzt bearbeitet“. Eine Botschaft pro Karte, viel Raum.',
          description: '+ Ruhig, sofort verständlich, motivierend  − Weniger Notizen ohne Scrollen sichtbar',
          layout: { type: 'grid' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Übersicht', subtitle: 'Dein Denkraum auf einen Blick', primaryLabel: '', secondaryLabel: 'Alle Notizen', secondaryIcon: 'layout-list' }),
            { id: 'kpi', component: 'kpi-tiles', region: 'main', span: 12, bind: { metrics: 'metrics' }, props: { showSpark: false } },
            { id: 'pinned', component: 'note-list', region: 'main', span: 7, spanTablet: 12, props: { title: 'Angeheftet', layout: 'grid', scope: 'angeheftet', cardSize: 'large', autoSelect: false, showCreate: false, minWidth: 220 } },
            { id: 'tags', component: 'chart', region: 'main', span: 5, spanTablet: 12, bind: { series: 'tagChart' }, props: { title: 'Notizen nach Tag', type: 'donut' } },
            { id: 'checks', component: 'note-checklists', region: 'main', span: 12, props: { title: 'Listen im Fortschritt', mode: 'progress', limit: 4, link: 'Alle Listen' } },
            { id: 'recent', component: 'note-list', region: 'main', span: 12, props: { title: 'Zuletzt bearbeitet', layout: 'grid', scope: 'zuletzt', limit: 6, autoSelect: false, showCreate: true } },
          ],
        },
        {
          id: 'C', name: 'Weiterschreiben & Eingang', direction: 'fokus', concept: 'Eine Spalte, Reihenfolge nach Dringlichkeit: weiterschreiben mit dem Termin-Kontext, dann der Eingang als Sortier-Assistent, zuletzt die nächsten offenen Listenpunkte. Schnellnotiz ist Teil des Eingangs.',
          description: '+ Klarer nächster Schritt, Erfassen ohne Umweg  − Weniger Überblick über alle Notizen',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Notizen', subtitle: 'Di, 24. November', primaryLabel: '', secondaryLabel: 'Alle Notizen', secondaryIcon: 'layout-list' }),
            { id: 'focus', component: 'note-focus', region: 'main', bind: { notes: 'notes', events: 'events' } },
            { id: 'inbox', component: 'note-inbox', region: 'main', bind: { notes: 'notes', tasks: 'tasks' }, props: { title: 'Eingang', mode: 'triage' } },
            { id: 'checks', component: 'note-checklists', region: 'main', props: { title: 'Als Nächstes abhaken', limit: 2, link: 'Alle' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['notes.overview', 'notes.editor', 'notes.inbox', 'notes.checklists', 'home.today'],
    },
    // ------------------------------------------------------------------ Notizübersicht
    {
      id: 'notes.overview', name: 'Notizübersicht', group: 'Notizen', status: 'design', tier: 1,
      purpose: 'Alle Notizen auf einen Blick, schnell filtern, anheften und in den Editor springen – ohne Umwege zum Schreiben.',
      requirements: [
        { text: 'Notizen mit Titel, Auszug, Tags und relativem Datum anzeigen', type: 'info', priority: 'must' },
        { text: 'Angeheftete Notizen stehen oben, danach nach zuletzt bearbeitet; der Eingang ist ein eigener Filter', type: 'rule', priority: 'must' },
        { text: 'Neue Notiz mit einem Tipp anlegen', type: 'action', priority: 'must' },
        { text: 'Suche in Titel und Inhalt sowie Filter nach Tag, „Angeheftet“, „Eingang“ und „Archiv“', type: 'action', priority: 'must' },
        { text: 'Anheften direkt aus der Liste, ohne die Notiz zu öffnen; Checklisten zeigen „2/6“ in der Zeile', type: 'action', priority: 'should' },
        { text: 'Leerzustand mit Aufforderung zur ersten Notiz; bei Suche ohne Treffer ein eigener Hinweis', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ist alles ohne horizontales Scrollen und mit Touch-Zielen ≥ 44 px bedienbar', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Notiz antippen', result: 'Notiz wird geöffnet (Editor rechts oder Dialog)', event: 'note.open' },
        { trigger: 'Pin-Symbol antippen', result: 'Notiz wird angeheftet bzw. gelöst', event: 'note.pin' },
        { trigger: 'Neu antippen', result: 'Leere Notiz entsteht und wird geöffnet', event: 'note.create' },
        { trigger: 'Suchbegriff eingeben', result: 'Liste filtert live', event: 'search.input' },
        { trigger: 'Filterchip wählen', result: 'Liste zeigt nur passende Notizen', event: 'filter.change' },
        { trigger: 'Im Editor tippen', result: 'Änderung wird automatisch gespeichert', event: 'note.autosave' },
      ],
      acceptance: [
        'Angeheftete Notizen stehen immer vor den übrigen, unabhängig vom Datum.',
        'Der Filter „Eingang“ zeigt nur Notizen, die noch nicht einsortiert wurden.',
        'Eine Suche ohne Treffer nennt den Suchbegriff und bietet „Neue Notiz“ an.',
        'In der Master-Detail-Variante bleibt die Liste beim Bearbeiten sichtbar.',
      ],
      flows: [{ id: 'fl-finden', name: 'Notiz finden und ergänzen', steps: [{ featureId: 'notes.overview', action: 'Filter „Arbeit“ wählen, Notiz antippen' }, { featureId: 'notes.overview', action: 'Im Editor ergänzen' }] }],
      viewports: ALL_VP,
      demoData: { notes: notesW },
      variants: [
        {
          id: 'A', name: 'Karten-Raster', direction: 'visuell', nav: [{ event: 'note.open', to: 'notes.editor' }, { event: 'note.create', to: 'notes.editor' }], concept: 'Visueller Überblick: Notizen als Karten mit Farbstreifen, Auszug und Listen-Fortschritt im Raster, Bearbeiten in einem Dialog (Bottom-Sheet auf Mobile). Die Übersicht bleibt immer sichtbar.',
          description: '+ Starker Überblick, gut für wenige bis mittlere Notizmengen  − Wechsel zwischen Notizen kostet jeweils Dialog öffnen/schließen',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Alle Notizen', subtitle: 'Angeheftete zuerst, dann zuletzt bearbeitet', primaryLabel: '' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Notizen durchsuchen …', filters: FILTERS } },
            { id: 'grid', component: 'note-list', region: 'main', props: { title: 'Notizen', layout: 'grid', openIn: 'dialog', showCreate: true } },
          ],
        },
        {
          id: 'B', name: 'Master-Detail', direction: 'kompakt', concept: 'Zwei-Spalten-Arbeitsplatz: links Suche und kompakte Liste, rechts der Editor der gewählten Notiz. Schnelles Springen zwischen Notizen ohne Kontextverlust.',
          description: '+ Effizient für Vielschreiber, Bearbeiten direkt in der Übersicht  − Auf Mobile ist die Liste einklappbar und der Editor füllt den Bildschirm',
          layout: { type: 'sidebar', panelLabel: 'Notizen & Suche', panelOpen: true },
          blocks: [
            { id: 'flt', component: 'search-filter', region: 'panel', props: { placeholder: 'Suchen …', filters: FILTERS, layout: 'stacked' } },
            { id: 'list', component: 'note-list', region: 'panel', props: { title: 'Notizen', layout: 'list' } },
            { id: 'ed', component: 'note-editor', region: 'main', props: { showToolbar: true, showTags: true, allowPreview: true } },
          ],
        },
        {
          id: 'C', name: 'Fokus-Editor', direction: 'fokus', concept: 'Schreiben zuerst: ein ruhiger, breiter Editor ohne Liste. Zwischen Notizen wechselt man über eine Auswahl, neue Notizen entstehen in der Schnelleingabe unten.',
          description: '+ Maximale Konzentration, ideal für Mobile  − Überblick über alle Notizen fehlt, Suche nur über den Wechsler',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Schreiben', subtitle: 'Di, 24. November', primaryLabel: '' }),
            { id: 'ed', component: 'note-editor', region: 'main', props: { focusMode: true, noteSwitcher: true, showToolbar: true, showTags: true, allowPreview: true } },
            { id: 'add', component: 'quick-add', region: 'bottom', bind: { target: 'notes' }, props: { placeholder: 'Neue Notiz … (Enter)', defaults: ['body=', 'updated=2026-11-24T09:30:00'], elevated: true } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['notes.editor', 'notes.search', 'notes.home'],
    },
    // ------------------------------------------------------------------ Editor
    {
      id: 'notes.editor', name: 'Notiz-Editor', group: 'Notizen', status: 'review', tier: 1,
      purpose: 'Notizen komfortabel schreiben und formatieren – mit minimaler Technik: Markdown-Einfügung per Knopfdruck, Tags, Autosave und Vorschau.',
      requirements: [
        { text: 'Titel und Textbereich; Text wächst mit dem Inhalt', type: 'info', priority: 'must' },
        { text: 'Formatierungsleiste: Überschrift, fett, kursiv, Liste, Checkliste, Zitat, Code', type: 'action', priority: 'must' },
        { text: 'Autosave mit sichtbarer Statusanzeige („Speichert …“ / „Gespeichert“)', type: 'state', priority: 'must' },
        { text: 'Tags hinzufügen (Enter) und per Tipp entfernen', type: 'action', priority: 'should' },
        { text: 'Vorschau-Modus mit abhakbaren Checklisten; Fortschritt „3 von 5 erledigt“ in der Fußzeile', type: 'action', priority: 'should' },
        { text: 'Verknüpfungen zu Aufgaben, Terminen und Artikeln als Chips (Variante „Lesen“)', type: 'info', priority: 'could' },
        { text: 'Löschen nur nach Bestätigung, Archivieren ist ohne Rückfrage umkehrbar', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Text oder Titel ändern', result: 'Statusanzeige wechselt auf „Speichert …“, danach „Gespeichert“', event: 'note.edit' },
        { trigger: 'Format-Knopf antippen', result: 'Markdown wird an der Cursorposition eingefügt', event: 'note.format' },
        { trigger: 'Tag eingeben + Enter', result: 'Tag erscheint als Chip', event: 'note.tag.add' },
        { trigger: 'Tag-Chip antippen', result: 'Tag wird entfernt', event: 'note.tag.remove' },
        { trigger: 'Vorschau wählen', result: 'Formatierte Ansicht mit abhakbaren Punkten', event: 'note.preview' },
        { trigger: 'Checklistenpunkt abhaken', result: 'Punkt wird durchgestrichen und gespeichert', event: 'note.checklist.toggle' },
        { trigger: 'Papierkorb antippen', result: 'Bestätigungsdialog, dann Notiz entfernt', event: 'note.delete' },
        { trigger: 'Verknüpfung antippen', result: 'Ziel öffnet sich (Aufgabe, Termin, Artikel)', event: 'open' },
      ],
      acceptance: [
        'Nach jeder Änderung zeigt die Statusanzeige binnen einer Sekunde „Gespeichert“.',
        'Der Format-Knopf „Checkliste“ fügt „- [ ] “ an der Cursorposition ein und setzt den Cursor dahinter.',
        'In der Vorschau lässt sich ein Punkt abhaken und die Markdown-Quelle ändert sich entsprechend.',
        'Löschen verlangt eine Bestätigung, Archivieren nicht.',
        'Eine im Launcher neu angelegte Notiz öffnet sich im Editor mit leerem Titel und Cursor im Titel.',
      ],
      flows: [{ id: 'fl-schreiben', name: 'Notiz schreiben', steps: [{ featureId: 'notes.editor', action: 'Titel eintippen, Tag „Arbeit“ hinzufügen' }, { featureId: 'notes.editor', action: '„Checkliste“ antippen und Punkte schreiben' }, { featureId: 'notes.editor', action: 'Vorschau öffnen, Punkt abhaken' }] }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { notes: notesW, history: '@world:notesHistory', links: '@world:notesLinks' },
      variants: [
        {
          id: 'A', name: 'Editor mit Verlauf', direction: 'kompakt', concept: 'Der Editor steht im Mittelpunkt, rechts (auf Mobile darunter) zeigt ein Verlauf die letzten Änderungen der Notiz.',
          description: '+ Vertrauen durch sichtbare Historie  − Mehr Fläche für Nebensächliches auf kleinen Geräten',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Notiz bearbeiten', primaryLabel: '' }),
            { id: 'ed', component: 'note-editor', region: 'main', props: { showToolbar: true, showTags: true, allowPreview: true } },
            { id: 'feed', component: 'activity-feed', region: 'aside', bind: { events: 'history' }, props: { title: 'Verlauf', limit: 4 } },
          ],
        },
        {
          id: 'B', name: 'Ruhiges Schreiben', direction: 'fokus', concept: 'Breiter Editor ohne Rand und Ablenkung, Formatierungsleiste nur bei Bedarf; Wechsel zwischen Notizen über eine Auswahl im Kopf. Maximale Konzentration, ideal auf dem Handy.',
          description: '+ Nichts lenkt ab, große Schrift  − Kein Verlauf, keine Verknüpfungen sichtbar',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'ed', component: 'note-editor', region: 'main', props: { focusMode: true, noteSwitcher: true, showToolbar: true, showTags: false, allowPreview: true } },
          ],
        },
        {
          id: 'C', name: 'Lesen & Verknüpfen', direction: 'visuell', concept: 'Die Notiz startet als gesetzte Vorschau (Überschriften, abhakbare Listen); darunter Verknüpfungen zu Aufgaben, Terminen und Artikeln und der Verlauf. Zum Schreiben genügt ein Tipp.',
          description: '+ Gut lesbar, Zusammenhänge sichtbar  − Schreiben braucht einen zusätzlichen Tipp',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Notiz', primaryLabel: '' }),
            { id: 'ed', component: 'note-editor', region: 'main', props: { startMode: 'preview', showToolbar: true, showTags: true, allowPreview: true } },
            { id: 'links', component: 'link-chips', region: 'aside', bind: { links: 'links' }, props: { title: 'Verknüpft', layout: 'list', showModule: true } },
            { id: 'feed', component: 'activity-feed', region: 'aside', bind: { events: 'history' }, props: { title: 'Verlauf', limit: 3 } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['notes.overview', 'notes.checklists'],
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf mit Toolbar und Vorschau' }, { kind: 'review', note: 'Zur Prüfung: Autosave-Anzeige und Tag-Bedienung' }],
    },
    // ------------------------------------------------------------------ Eingang
    {
      id: 'notes.inbox', name: 'Schnellnotiz & Eingang', group: 'Notizen', status: 'design', tier: 1,
      purpose: 'Gedanken ohne Nachdenken festhalten und später in Ruhe einsortieren: Tag vergeben, als Aufgabe übernehmen, behalten oder archivieren.',
      requirements: [
        { text: 'Schnellnotiz mit einer Zeile Text, ohne Titel-, Tag- oder Ordnerpflicht; Enter speichert', type: 'action', priority: 'must' },
        { text: 'Neue Notizen landen im Eingang, bis sie einsortiert, übernommen oder archiviert werden', type: 'rule', priority: 'must' },
        { text: 'Einsortieren mit einem Tipp auf einen Tag; „Als Aufgabe“ legt eine Aufgabe für heute an', type: 'action', priority: 'must' },
        { text: 'Sortier-Assistent zeigt eine Notiz nach der anderen mit „x von y“', type: 'action', priority: 'should' },
        { text: 'Leerer Eingang ist ein ruhiger Erfolgszustand („Alles einsortiert“)', type: 'state', priority: 'must' },
        { text: 'Nichts geht endgültig verloren: Archivieren statt Löschen, Rückholen über den Filter „Archiv“', type: 'rule', priority: 'should' },
        { text: 'Offline nutzbar: Schnellnotizen werden gespeichert und später abgeglichen', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Schnellnotiz eintippen + Enter', result: 'Notiz erscheint oben im Eingang, Hinweis „Im Eingang gespeichert“', event: 'note.inbox.add' },
        { trigger: 'Tag antippen', result: 'Notiz verlässt den Eingang und erhält den Tag', event: 'note.inbox.sort' },
        { trigger: '„Als Aufgabe“ antippen', result: 'Aufgabe für heute entsteht, Notiz wird archiviert', event: 'note.to-task' },
        { trigger: '„Behalten“ antippen', result: 'Notiz bleibt ohne Tag bei den Notizen', event: 'note.inbox.keep' },
        { trigger: 'Archivieren antippen', result: 'Notiz verschwindet aus dem Eingang', event: 'note.archive' },
        { trigger: 'Titel antippen', result: 'Notiz im Editor', event: 'note.open', to: 'notes.editor' },
      ],
      acceptance: [
        'Eine Schnellnotiz ist nach Enter in unter einer Sekunde im Eingang sichtbar und der Zähler steigt.',
        '„Als Aufgabe“ legt eine Aufgabe mit Fälligkeit heute in der gemeinsamen Datenwelt an; sie erscheint in Aufgaben und Kalender.',
        'Nach dem Einsortieren sinkt die Zahl im Eingang um eins; der leere Eingang zeigt „Alles einsortiert“.',
        'Alle Aktionen sind auf Mobile mit mindestens 40 px hohen Zielen bedienbar.',
      ],
      flows: [{ id: 'fl-triage', name: 'Eingang in 30 Sekunden leeren', steps: [{ featureId: 'notes.inbox', action: 'Erste Notiz „Rückruf“ als Aufgabe übernehmen' }, { featureId: 'notes.inbox', action: 'Zweite Notiz mit „Arbeit“ einsortieren' }, { featureId: 'notes.inbox', action: 'Dritte archivieren' }] }],
      viewports: ALL_VP,
      demoData: { notes: notesW, tagChart: '@world:notesTagChart', tasks: '@world:tasks' },
      variants: [
        {
          id: 'A', name: 'Liste mit Aktionen', direction: 'kompakt', concept: 'Schnellnotiz-Zeile oben, darunter alle Notizen im Eingang als Liste; Tags, Aufgabe und Archiv sind Knöpfe in der Zeile. Rechts die Verteilung nach Tags.',
          description: '+ Alles auf einmal, mehrere Notizen schnell abarbeiten  − Mehr visuelles Rauschen als der Assistent',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Eingang', subtitle: 'Erst festhalten, später ordnen', primaryLabel: '' }),
            { id: 'inbox', component: 'note-inbox', region: 'main', bind: { notes: 'notes', tasks: 'tasks' }, props: { title: 'Im Eingang' } },
            { id: 'tags', component: 'chart', region: 'aside', bind: { series: 'tagChart' }, props: { title: 'Bereits abgelegt', type: 'donut' } },
          ],
        },
        {
          id: 'B', name: 'Sortier-Assistent', direction: 'fokus', concept: 'Eine Notiz nach der anderen, groß dargestellt, mit vier klaren Entscheidungen: einsortieren, Aufgabe, behalten, archivieren. Fortschritt „1 von 3“, am Ende ein ruhiger Leerzustand.',
          description: '+ Entscheidung ohne Ablenkung, ideal einhändig  − Kein Überblick über alle Notizen im Eingang',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Eingang', subtitle: 'Eins nach dem anderen', primaryLabel: '' }),
            { id: 'inbox', component: 'note-inbox', region: 'main', bind: { notes: 'notes', tasks: 'tasks' }, props: { title: 'Jetzt sortieren', mode: 'triage' } },
          ],
        },
        {
          id: 'C', name: 'Pinnwand', direction: 'visuell', concept: 'Große Schnellnotiz-Zeile, darunter der Eingang als Pinnwand aus Karten. Eine Karte antippen öffnet die Ablagen als Kacheln (Tags mit Farbpunkt, Aufgabe, Behalten, Archiv); die letzte Ablage lässt sich zurücknehmen.',
          description: '+ Überblick über alles Unsortierte, Ablegen mit einem Tipp auf eine farbige Kachel, Rückgängig  − Weniger Notizen pro Bildschirm als die Liste',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Eingang', subtitle: 'Anpinnen, antippen, ablegen', primaryLabel: '' }),
            { id: 'board', component: 'note-board', region: 'main', bind: { notes: 'notes', tasks: 'tasks' }, props: { title: 'Pinnwand', showCapture: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['notes.home', 'notes.editor', 'tasks.overview'],
    },
    // ------------------------------------------------------------------ Suche & Tags
    {
      id: 'notes.search', name: 'Suche & Tags', group: 'Notizen', status: 'design', tier: 2,
      purpose: 'Notizen über Volltextsuche und Tags schnell wiederfinden.',
      requirements: [
        { text: 'Volltextsuche über Titel, Inhalt und Tags mit Live-Ergebnissen; auch Notizen im Eingang werden gefunden', type: 'action', priority: 'must' },
        { text: 'Tag-Chips als Schnellfilter; aktiver Filter ist klar erkennbar', type: 'action', priority: 'must' },
        { text: 'Treffer zeigen Auszug und Datum; Suchbegriff wird im Leerzustand genannt', type: 'state', priority: 'should' },
        { text: 'Zuletzt genutzte Suchbegriffe merken', type: 'info', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Suchbegriff eingeben', result: 'Trefferliste aktualisiert sich live', event: 'search.input' },
        { trigger: 'Tag-Chip wählen', result: 'Liste zeigt nur Notizen mit diesem Tag', event: 'filter.change' },
        { trigger: 'Treffer antippen', result: 'Notiz öffnet im Editor', event: 'note.open', to: 'notes.editor' },
      ],
      acceptance: ['Die Trefferliste reagiert ohne Verzögerung auf jede Eingabe.', 'Ohne Treffer nennt der Hinweis den Suchbegriff und bietet „Neue Notiz“ an.'],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { notes: notesW },
      variants: [{
        id: 'A', name: 'Tag-Leiste + Treffer', direction: 'kompakt', concept: 'Suchfeld und scrollbare Tag-Chips oben, darunter eine kompakte Trefferliste ohne Ablenkung.',
        description: '+ Sehr schnell erlernbar  − Keine Vorschau der Notiz neben den Treffern',
        layout: { type: 'stack', narrow: true },
        blocks: [
          hdr({ title: 'Notizen finden', subtitle: 'Titel, Inhalt und Tags durchsuchen', primaryLabel: '' }),
          { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Suchen …', filters: TAG_FILTERS, layout: 'stacked' } },
          { id: 'res', component: 'note-list', region: 'main', props: { title: 'Treffer', layout: 'compact', showCreate: false, groupPinned: false } },
        ],
      }, {
        id: 'B', name: 'Treffer als Karten', direction: 'visuell', concept: 'Große Suchzeile, darunter Treffer als Karten mit Farbstreifen je Tag und Listen-Fortschritt. Gut zum Stöbern, wenn man den Titel nicht mehr weiß.',
        description: '+ Erkennbar am Bild, auch ohne Stichwort  − Weniger Treffer pro Bildschirm',
        layout: { type: 'stack' },
        blocks: [
          hdr({ title: 'Notizen finden', subtitle: 'Stöbern nach Tag oder Stichwort', primaryLabel: '' }),
          { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Wonach suchst du?', filters: TAG_FILTERS } },
          { id: 'res', component: 'note-list', region: 'main', props: { title: 'Treffer', layout: 'grid', autoSelect: false, showCreate: false, groupPinned: false } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['notes.editor'],
    },
    // ------------------------------------------------------------------ Checklisten
    {
      id: 'notes.checklists', name: 'Checklisten', group: 'Notizen', status: 'design', tier: 2,
      purpose: 'Listen mit abhakbaren Punkten (Einkauf, Packliste, To-dos) aus allen Notizen an einem Ort sehen und abhaken.',
      requirements: [
        { text: 'Offene Punkte aller Notizen, gruppiert nach Notiz, direkt abhakbar', type: 'action', priority: 'must' },
        { text: 'Fortschritt (z. B. 3 von 5) je Liste sichtbar, auch in der Notizliste', type: 'info', priority: 'should' },
        { text: 'Erledigte Punkte optional einblenden', type: 'rule', priority: 'could' },
        { text: 'Leerzustand „Keine offenen Punkte“ mit Hinweis, wie Checklisten entstehen', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Punkt abhaken', result: 'Punkt wird erledigt, Zähler sinkt, Notiz wird aktualisiert', event: 'note.checklist.toggle' },
        { trigger: 'Listenkopf / Karte antippen', result: 'Notiz im Editor', event: 'note.open', to: 'notes.editor' },
      ],
      acceptance: ['Ein abgehakter Punkt verschwindet sofort aus der Liste (erledigte Punkte ausgeblendet).', 'Die Karten zeigen „x von y erledigt“ und den nächsten offenen Punkt.'],
      viewports: ['mobile', 'tablet', 'desktop'],
      demoData: { notes: notesW },
      variants: [{
        id: 'A', name: 'Offene Punkte', direction: 'kompakt', concept: 'Alle offenen Punkte nach Liste gruppiert, mit Häkchen in der Zeile. Zeigt, was jetzt zu tun ist.',
        description: '+ Direkt abarbeiten  − Kein Überblick über erledigte Listen',
        layout: { type: 'stack', narrow: true },
        blocks: [hdr({ title: 'Checklisten', subtitle: 'Offene Punkte aus allen Notizen', primaryLabel: '' }), { id: 'checks', component: 'note-checklists', region: 'main', props: { title: 'Offen', showDone: false } }],
      }, {
        id: 'B', name: 'Fortschritt je Liste', direction: 'visuell', concept: 'Eine Karte je Liste mit großem Fortschritt und dem nächsten offenen Punkt; erledigte Listen bleiben als „Alles erledigt“ sichtbar.',
        description: '+ Motivierend, Überblick über alle Listen  − Abhaken nur nach Öffnen der Notiz',
        layout: { type: 'stack' },
        blocks: [hdr({ title: 'Checklisten', subtitle: 'Fortschritt auf einen Blick', primaryLabel: '' }), { id: 'checks', component: 'note-checklists', region: 'main', props: { title: '', mode: 'progress' } }],
      }],
      selectedVariantId: 'A',
      links: ['notes.editor'],
    },
    // ------------------------------------------------------------------ Anheften & Archiv
    {
      id: 'notes.pin-archive', name: 'Anheften & Archiv', group: 'Organisation', status: 'design', tier: 3,
      purpose: 'Wichtige Notizen oben halten, erledigte aus dem Weg räumen, ohne sie zu löschen.',
      requirements: [
        { text: 'Notizen anheften und lösen', type: 'action', priority: 'must' },
        { text: 'Archivierte Notizen über Filter „Archiv“ erreichbar und wiederherstellbar', type: 'action', priority: 'should' },
        { text: 'Archivieren ist ohne Rückfrage umkehrbar; Löschen nur aus dem Archiv', type: 'rule', priority: 'should' },
      ],
      interactions: [{ trigger: 'Pin antippen', result: 'Notiz wandert nach oben', event: 'note.pin' }, { trigger: 'Archivieren antippen', result: 'Notiz verschwindet aus der Übersicht', event: 'note.archive' }],
      viewports: ['desktop', 'mobile'],
      demoData: { notes: notesW },
      variants: [{
        id: 'A', name: 'Angeheftet & Archiv', direction: 'kompakt', concept: 'Liste mit den Filtern „Angeheftet“ und „Archiv“; Anheften direkt in der Zeile, Wiederherstellen im Editor.',
        description: '+ Einfach, nutzt die Notizliste  − Archiv ist nur ein Filter',
        layout: { type: 'stack', narrow: true },
        blocks: [hdr({ title: 'Angeheftet & Archiv', primaryLabel: '' }), { id: 'flt', component: 'search-filter', region: 'main', props: { filters: ['Angeheftet', 'Archiv', 'Alle'], showSearch: false } }, { id: 'list', component: 'note-list', region: 'main', props: { title: 'Notizen', layout: 'list', showCreate: false, showArchive: true } }],
      }],
      selectedVariantId: 'A',
    },
    // ------------------------------------------------------------------ Skelette (Tier 3)
    {
      id: 'notes.attachments', name: 'Anhänge & Sprachnotiz', group: 'Erweiterungen', status: 'analyzed', tier: 3,
      purpose: 'Bilder, Dateien und Sprachnotizen direkt in einer Notiz festhalten.',
      requirements: [
        { text: 'Bilder und Dateien einfügen; Sprachnotiz mit Wellenform und automatischem Text', type: 'action', priority: 'should' },
        { text: 'Kamerazugriff und Mikrofon nur nach Erlaubnis, mit Alternative', type: 'rule', priority: 'must' },
        { text: 'Bilder mit Text lassen sich über Picture to Text in die Notiz übernehmen', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Anhang hinzufügen', result: 'Datei erscheint in der Notiz', event: 'note.attach' }],
      viewports: ['mobile', 'tablet'], demoData: { notes: notesW },
    },
    {
      id: 'notes.notebooks', name: 'Notizbücher', group: 'Erweiterungen', status: 'not_analyzed', tier: 3,
      purpose: 'Notizen zusätzlich zu Tags in Notizbüchern bündeln (Projekt, Privat, Reise).',
      requirements: [{ text: 'Notizbuch mit Name und Farbe; Notizen verschieben', type: 'action', priority: 'could' }, { text: 'Entscheidung offen, ob Tags genügen', type: 'rule', priority: 'should' }],
      interactions: [], viewports: ['desktop', 'mobile'], demoData: { notes: notesW },
    },
    {
      id: 'notes.templates', name: 'Vorlagen', group: 'Erweiterungen', status: 'not_analyzed', tier: 3,
      purpose: 'Wiederkehrende Notizen aus Vorlagen anlegen (Meeting, Tagesplan, Packliste, Rezept).',
      requirements: [{ text: 'Vorlagenauswahl bei „Neue Notiz“; eigene Vorlagen speichern', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop', 'mobile'], demoData: { notes: notesW },
    },
    {
      id: 'notes.history', name: 'Versionsverlauf', group: 'Erweiterungen', status: 'not_analyzed', tier: 3,
      purpose: 'Frühere Stände einer Notiz ansehen und wiederherstellen.',
      requirements: [{ text: 'Liste der Stände mit Zeit, Vergleich und „Wiederherstellen“', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop', 'tablet'], demoData: { notes: notesW, history: '@world:notesHistory' },
    },
  ],
  decisions: [
    { featureId: 'notes.overview', title: 'Master-Detail als Standard auf Desktop?', decision: 'Variante B (Master-Detail) ist Standard auf Desktop und Tablet; auf Mobile öffnet die Liste den Editor im Vollbild.',
      rationale: 'Wer viel schreibt, wechselt oft zwischen Notizen. Die Zwei-Spalten-Ansicht spart jeden Dialog-Wechsel und hält Suche und Liste griffbereit.',
      tradeoffs: 'Weniger visueller Überblick als das Karten-Raster; Raster bleibt als umschaltbare Ansicht denkbar.', status: 'decided' },
    { featureId: 'notes.overview', title: 'Ansichtsumschalter Liste/Raster anbieten?', decision: '', rationale: 'Variante A und B bedienen unterschiedliche Vorlieben. Ein Umschalter erhöht die Komplexität, vermeidet aber eine Entweder-oder-Entscheidung.', status: 'open' },
    { featureId: 'notes.editor', title: 'Markdown oder Rich-Text?', decision: 'Markdown mit Formatierungsleiste.', rationale: 'Einfach zu speichern, zu synchronisieren und zu durchsuchen; die Leiste nimmt Einsteigern die Syntaxhürde.', tradeoffs: 'Keine WYSIWYG-Darstellung im Schreibmodus; Vorschau ist ein separater Modus.', status: 'decided' },
    { featureId: 'notes.inbox', title: 'Eingang als Zustand statt als Ordner', decision: 'Neue Notizen tragen das Merkmal „Eingang“, bis sie einsortiert, übernommen oder archiviert werden. Der Eingang ist kein Ordner und kein Tag.',
      rationale: 'Erfassen darf nichts kosten. Ein Zustand lässt sich in jeder Ansicht zählen und leeren, ohne dass eine zweite Ordnerstruktur entsteht.', tradeoffs: 'Notizen im Eingang tauchen nicht in der normalen Liste auf (nur in der Suche), damit der Eingang nicht doppelt erscheint.', status: 'decided' },
    { featureId: 'notes.home', title: 'Welche Richtung für die Notizen-Startseite?', decision: '', rationale: 'Kompakt (A) ist am schnellsten für Vielschreiber, Visuell (B) am einladendsten, Fokus (C) führt direkt zum nächsten Schritt. Entscheidung nach Test mit echtem Eingang (10+ Notizen) und auf Mobile.', tradeoffs: 'A: viel Information. B: mehr Scrollen. C: weniger Überblick, dafür kaum Entscheidungslast.', status: 'open' },
    { featureId: 'notes.checklists', title: 'Checklisten mit Aufgaben verknüpfen?', decision: '', rationale: 'Punkte könnten als Aufgaben mit Fälligkeit erscheinen. Klären, ob das Aufgaben-Modul das erwartet und ob Änderungen in beide Richtungen gelten.', status: 'open' },
  ],
};
