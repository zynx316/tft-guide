// Modul "Notizen" – persönliche Notizen mit Markdown, Tags, Checklisten (Annahme, in Phase 1 gegen Modulregister verifizieren)
const L = (...lines) => lines.join('\n');

const notes = [
  { id: 'n1', title: 'Ideen TAKT V2', pinned: true, tags: ['Projekt', 'Ideen'], updated: '2026-11-24T07:40:00',
    body: L('## Fokus', '- Modulweise Entwicklung mit der Workbench', '- Design vor Code: Varianten vergleichen, dann freigeben', '- Ein Token-Set für alle drei Themes', '', '## Offene Fragen', '- Wie viel Markdown braucht eine Notiz wirklich?', '- Sollen Checklisten mit Aufgaben verknüpft werden?', '', '> Tipp: Erst die Mobile-Variante entwerfen, dann auf Desktop erweitern.') },
  { id: 'n2', title: 'Einkaufsliste Wochenende', tags: ['Privat'], updated: '2026-11-23T18:20:00',
    body: L('- [x] Hafermilch', '- [x] Tomaten', '- [ ] Basilikum', '- [ ] Kaffee (Bohnen)', '- [ ] Parmesan', '- [ ] Spülmittel') },
  { id: 'n3', title: 'Meeting Sales-Review', tags: ['Arbeit', 'Sales'], updated: '2026-11-23T11:05:00',
    body: L('## Ergebnisse', '- Q4-Umsatz liegt **8 %** über Plan', '- Etsy-Kanal wächst am stärksten', '- Marktplatz-Gebühren steigen ab Januar', '', '## Aufgaben', '- [ ] Preisstrategie für Januar vorbereiten', '- [ ] Lieferanten-Call bestätigen', '- [x] Zahlen aus Shopify exportieren') },
  { id: 'n4', title: 'Reiseplanung Lissabon', pinned: true, tags: ['Privat', 'Reisen'], updated: '2026-11-20T21:10:00',
    body: L('## Eckdaten', '- 12.–16. Dezember, 4 Nächte', '- Flug ab Düsseldorf, 07:15 Uhr', '- Unterkunft in der Alfama', '', '## Ideen', '- Tram 28 früh am Morgen nehmen', '- Pastéis de Belém', '- Tagesausflug nach Sintra', '', '> Hinweis: Reisepass bis Mai 2027 gültig – passt.') },
  { id: 'n5', title: 'Rezept: Linsen-Dal', tags: ['Rezepte'], updated: '2026-11-18T19:30:00',
    body: L('Cremig, schnell und perfekt für kalte Abende.', '', '## Zutaten', '- 250 g rote Linsen', '- 1 Dose Kokosmilch', '- 1 Zwiebel, 2 Knoblauchzehen', '- Kurkuma, Kreuzkümmel, Garam Masala', '', '## Zubereitung', '1. Zwiebel und Knoblauch anschwitzen', '2. Gewürze kurz mitrösten', '3. Linsen und Kokosmilch zugeben, 20 Minuten köcheln') },
  { id: 'n6', title: 'Lesenotizen: Deep Work', tags: ['Lernen'], updated: '2026-11-15T20:00:00',
    body: L('## Kernideen', '- Konzentrierte Arbeit braucht **geschützte Zeitblöcke**', '- Rituale senken die Einstiegshürde', '- Ablenkung ist teurer als sie aussieht', '', '> Wichtig: 90 Minuten am Stück sind für mich die Obergrenze.') },
  { id: 'n7', title: 'Geschenkideen Weihnachten', tags: ['Privat'], updated: '2026-11-12T09:15:00',
    body: L('- [ ] Jana: Kochbuch „Plenty“', '- [ ] Papa: Wanderkarte Teutoburger Wald', '- [x] Oma: Handschuhe', '- [ ] Team: Adventskalender (Kaffee)') },
  { id: 'n8', title: 'Steuer 2026 – To-do', tags: ['Finanzen'], updated: '2026-11-09T16:40:00',
    body: L('- [x] Spendenquittungen sammeln', '- [ ] Belege Homeoffice-Pauschale', '- [ ] Fahrtenbuch abschließen', '- [ ] Termin Steuerberater bestätigen') },
  { id: 'n9', title: 'Podcast-Ideen', tags: ['Ideen'], updated: '2026-11-02T22:05:00',
    body: L('Kurze Folgen (15 Minuten) zu persönlicher Produktivität.', '', '- Folge 1: Warum To-do-Listen scheitern', '- Folge 2: Wochenplanung in 10 Minuten', '- Folge 3: Notizen, die man wiederfindet') },
  { id: 'n10', title: 'Packliste Wochenende Harz', archived: true, tags: ['Reisen'], updated: '2026-10-30T08:00:00',
    body: L('- [x] Wanderschuhe', '- [x] Regenjacke', '- [x] Thermoskanne', '- [x] Ladekabel') },
];

const history = [
  { id: 'h1', title: 'Notiz bearbeitet', time: '2026-11-24T07:40:00', icon: 'pencil', tone: 'accent', text: 'Abschnitt „Offene Fragen“ ergänzt' },
  { id: 'h2', title: 'Tag „Ideen“ hinzugefügt', time: '2026-11-23T21:12:00', icon: 'tag', tone: 'info' },
  { id: 'h3', title: 'Notiz angeheftet', time: '2026-11-22T08:30:00', icon: 'pin', tone: 'warning' },
  { id: 'h4', title: 'Notiz angelegt', time: '2026-11-20T18:05:00', icon: 'sticky-note', tone: 'success' },
];

const FILTERS = ['Alle', 'Angeheftet', 'Arbeit', 'Privat', 'Projekt', 'Archiv'];
const TAG_FILTERS = ['Alle', 'Angeheftet', 'Arbeit', 'Privat', 'Projekt', 'Ideen', 'Reisen', 'Rezepte', 'Archiv'];
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });

export default {
  module: {
    id: 'notes', name: 'Notizen', icon: 'sticky-note', status: 'concept', theme: 'graphite', designVersion: '0.1',
    description: 'Gedanken, Listen und Ideen schnell festhalten, mit Tags ordnen und jederzeit wiederfinden.',
    source: 'Annahme der Workbench – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg: Notizübersicht (angeheftete zuerst, danach nach Aktualität) mit Suche und Tag-Filtern. Von dort in den Editor (Titel, Markdown-Text mit Formatierungsleiste, Tags). Checklisten sind Notizen mit abhakbaren Punkten. Archiv als Filter, nicht als eigener Bereich.',
    docs: L('**Annahmen**', '- Notizen sind Markdown-Text; Checklisten entstehen über `- [ ]`.', '- Anheften und Archivieren genügen als Ordnungsmittel, keine Ordnerstruktur.', '- Speichern erfolgt automatisch (Autosave), kein expliziter Speichern-Button.', '', '**Offene Fragen**', '- Gibt es im bestehenden TAKT bereits Notiz-Ordner oder -Farben?', '- Werden Notizen geräteübergreifend synchronisiert (Konfliktbehandlung)?', '- Sollen Checklistenpunkte als Aufgaben im Modul „Aufgaben“ auftauchen?'),
    links: ['tasks', 'knowledge', 'picture-to-text'],
  },
  features: [
    {
      id: 'notes.overview', name: 'Notizübersicht', group: 'Notizen', status: 'design',
      purpose: 'Alle Notizen auf einen Blick, schnell filtern, anheften und in den Editor springen – ohne Umwege zum Schreiben.',
      requirements: [
        { text: 'Notizen mit Titel, Auszug, Tags und relativem Datum anzeigen', type: 'info', priority: 'must' },
        { text: 'Angeheftete Notizen stehen oben, danach nach zuletzt bearbeitet', type: 'rule', priority: 'must' },
        { text: 'Neue Notiz mit einem Tipp anlegen', type: 'action', priority: 'must' },
        { text: 'Suche in Titel und Inhalt sowie Filter nach Tag, „Angeheftet“ und „Archiv“', type: 'action', priority: 'must' },
        { text: 'Anheften direkt aus der Liste, ohne die Notiz zu öffnen', type: 'action', priority: 'should' },
        { text: 'Leerzustand mit Aufforderung zur ersten Notiz; bei Suche ohne Treffer ein eigener Hinweis', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ist alles ohne horizontales Scrollen und mit Touch-Zielen ≥ 44 px bedienbar', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Notiz antippen', result: 'Notiz wird geöffnet (Editor oder Dialog)', event: 'note.open' },
        { trigger: 'Pin-Symbol antippen', result: 'Notiz wird angeheftet bzw. gelöst', event: 'note.pin' },
        { trigger: 'Neu antippen', result: 'Leere Notiz entsteht und wird geöffnet', event: 'note.create' },
        { trigger: 'Suchbegriff eingeben', result: 'Liste filtert live', event: 'search.input' },
        { trigger: 'Filterchip wählen', result: 'Liste zeigt nur passende Notizen', event: 'filter.change' },
        { trigger: 'Im Editor tippen', result: 'Änderung wird automatisch gespeichert', event: 'note.autosave' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData: { notes },
      variants: [
        {
          id: 'A', name: 'Karten-Raster', concept: 'Visueller Überblick: Notizen als Karten mit Auszug im Raster, Bearbeiten in einem Dialog (Bottom-Sheet auf Mobile). Die Übersicht bleibt immer sichtbar.',
          description: '+ Starker Überblick, gut für wenige bis mittlere Notizmengen  − Wechsel zwischen Notizen kostet jeweils Dialog öffnen/schließen',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Notizen', title: 'Alle Notizen', subtitle: '9 Notizen · 2 angeheftet', primaryLabel: '' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Notizen durchsuchen …', filters: FILTERS } },
            { id: 'grid', component: 'note-list', region: 'main', props: { title: 'Notizen', layout: 'grid', openIn: 'dialog', showCreate: true } },
          ],
        },
        {
          id: 'B', name: 'Master-Detail', concept: 'Zwei-Spalten-Arbeitsplatz: links Suche und kompakte Liste, rechts der Editor der gewählten Notiz. Schnelles Springen zwischen Notizen ohne Kontextverlust.',
          description: '+ Effizient für Vielschreiber, Bearbeiten direkt in der Übersicht  − Auf Mobile ist die Liste einklappbar und der Editor füllt den Bildschirm',
          layout: { type: 'sidebar', panelLabel: 'Notizen & Suche' },
          blocks: [
            { id: 'flt', component: 'search-filter', region: 'panel', props: { placeholder: 'Suchen …', filters: FILTERS, layout: 'stacked' } },
            { id: 'list', component: 'note-list', region: 'panel', props: { title: 'Notizen', layout: 'list' } },
            { id: 'ed', component: 'note-editor', region: 'main', props: { showToolbar: true, showTags: true, allowPreview: true } },
          ],
        },
        {
          id: 'C', name: 'Fokus-Editor', concept: 'Schreiben zuerst: ein ruhiger, breiter Editor ohne Liste. Zwischen Notizen wechselt man über eine Auswahl, neue Notizen entstehen in der Schnelleingabe unten.',
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
      links: ['notes.editor', 'notes.search'],
    },
    {
      id: 'notes.editor', name: 'Notiz-Editor', group: 'Notizen', status: 'review',
      purpose: 'Notizen komfortabel schreiben und formatieren – mit minimaler Technik: Markdown-Einfügung per Knopfdruck, Tags, Autosave und Vorschau.',
      requirements: [
        { text: 'Titel und Textbereich; Text wächst mit dem Inhalt', type: 'info', priority: 'must' },
        { text: 'Formatierungsleiste: Überschrift, fett, kursiv, Liste, Checkliste, Zitat, Code', type: 'action', priority: 'must' },
        { text: 'Autosave mit sichtbarer Statusanzeige („Speichert …“ / „Gespeichert“)', type: 'state', priority: 'must' },
        { text: 'Tags hinzufügen (Enter) und per Tipp entfernen', type: 'action', priority: 'should' },
        { text: 'Vorschau-Modus mit abhakbaren Checklisten', type: 'action', priority: 'should' },
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
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { notes, history },
      variants: [{
        id: 'A', name: 'Editor mit Verlauf', concept: 'Der Editor steht im Mittelpunkt, rechts (auf Mobile darunter) zeigt ein Verlauf die letzten Änderungen der Notiz.',
        description: '+ Vertrauen durch sichtbare Historie  − Mehr Fläche für Nebensächliches auf kleinen Geräten',
        layout: { type: 'split' },
        blocks: [
          hdr({ eyebrow: 'Notizen', title: 'Notiz bearbeiten', primaryLabel: '' }),
          { id: 'ed', component: 'note-editor', region: 'main', props: { showToolbar: true, showTags: true, allowPreview: true } },
          { id: 'feed', component: 'activity-feed', region: 'aside', bind: { events: 'history' }, props: { title: 'Verlauf', limit: 4 } },
        ],
      }],
      selectedVariantId: 'A',
      links: ['notes.overview'],
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf mit Toolbar und Vorschau' }, { kind: 'review', note: 'Zur Prüfung: Autosave-Anzeige und Tag-Bedienung' }],
    },
    {
      id: 'notes.search', name: 'Suche & Tags', group: 'Notizen', status: 'design',
      purpose: 'Notizen über Volltextsuche und Tags schnell wiederfinden.',
      requirements: [
        { text: 'Volltextsuche über Titel, Inhalt und Tags mit Live-Ergebnissen', type: 'action', priority: 'must' },
        { text: 'Tag-Chips als Schnellfilter; aktiver Filter ist klar erkennbar', type: 'action', priority: 'must' },
        { text: 'Treffer zeigen Auszug und Datum; Suchbegriff wird im Leerzustand genannt', type: 'state', priority: 'should' },
        { text: 'Zuletzt genutzte Suchbegriffe merken', type: 'info', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Suchbegriff eingeben', result: 'Trefferliste aktualisiert sich live', event: 'search.input' },
        { trigger: 'Tag-Chip wählen', result: 'Liste zeigt nur Notizen mit diesem Tag', event: 'filter.change' },
        { trigger: 'Treffer antippen', result: 'Notiz öffnet', event: 'note.open' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { notes },
      variants: [{
        id: 'A', name: 'Tag-Leiste + Treffer', concept: 'Suchfeld und scrollbare Tag-Chips oben, darunter eine kompakte Trefferliste ohne Ablenkung.',
        description: '+ Sehr schnell erlernbar  − Keine Vorschau der Notiz neben den Treffern',
        layout: { type: 'stack', narrow: true },
        blocks: [
          hdr({ title: 'Notizen finden', subtitle: 'Titel, Inhalt und Tags durchsuchen', primaryLabel: '' }),
          { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Suchen …', filters: TAG_FILTERS, layout: 'stacked' } },
          { id: 'res', component: 'note-list', region: 'main', props: { title: 'Treffer', showCreate: false, groupPinned: false } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'notes.checklists', name: 'Checklisten', group: 'Notizen', status: 'analyzed',
      purpose: 'Listen mit abhakbaren Punkten (Einkauf, Packliste) direkt in Notizen.',
      requirements: [
        { text: 'Checklistenpunkte lassen sich in Vorschau und Liste abhaken', type: 'action', priority: 'must' },
        { text: 'Fortschritt (z. B. 3 von 5) in der Notizliste sichtbar', type: 'info', priority: 'should' },
        { text: 'Erledigte Punkte wandern optional ans Ende', type: 'rule', priority: 'could' },
      ],
      interactions: [{ trigger: 'Punkt abhaken', result: 'Punkt wird durchgestrichen', event: 'note.checklist.toggle' }],
      viewports: ['mobile', 'tablet', 'desktop'],
      demoData: { notes },
    },
    {
      id: 'notes.pin-archive', name: 'Anheften & Archiv', group: 'Organisation', status: 'not_analyzed',
      purpose: 'Wichtige Notizen oben halten, erledigte aus dem Weg räumen, ohne sie zu löschen.',
      requirements: [
        { text: 'Notizen anheften und lösen', type: 'action', priority: 'must' },
        { text: 'Archivierte Notizen über Filter „Archiv“ erreichbar und wiederherstellbar', type: 'action', priority: 'should' },
      ],
      interactions: [{ trigger: 'Pin antippen', result: 'Notiz wandert nach oben', event: 'note.pin' }, { trigger: 'Archivieren antippen', result: 'Notiz verschwindet aus der Übersicht', event: 'note.archive' }],
      viewports: ['desktop', 'mobile'],
      demoData: { notes },
    },
  ],
  decisions: [
    { featureId: 'notes.overview', title: 'Master-Detail als Standard auf Desktop?', decision: 'Variante B (Master-Detail) ist Standard auf Desktop und Tablet; auf Mobile öffnet die Liste den Editor im Vollbild.',
      rationale: 'Wer viel schreibt, wechselt oft zwischen Notizen. Die Zwei-Spalten-Ansicht spart jeden Dialog-Wechsel und hält Suche und Liste griffbereit.',
      tradeoffs: 'Weniger visueller Überblick als das Karten-Raster; Raster bleibt als umschaltbare Ansicht denkbar.', status: 'decided' },
    { featureId: 'notes.overview', title: 'Ansichtsumschalter Liste/Raster anbieten?', decision: '', rationale: 'Variante A und B bedienen unterschiedliche Vorlieben. Ein Umschalter erhöht die Komplexität, vermeidet aber eine Entweder-oder-Entscheidung.', status: 'open' },
    { featureId: 'notes.editor', title: 'Markdown oder Rich-Text?', decision: 'Markdown mit Formatierungsleiste.', rationale: 'Einfach zu speichern, zu synchronisieren und zu durchsuchen; die Leiste nimmt Einsteigern die Syntaxhürde.', tradeoffs: 'Keine WYSIWYG-Darstellung im Schreibmodus; Vorschau ist ein separater Modus.', status: 'decided' },
    { featureId: 'notes.checklists', title: 'Checklisten mit Aufgaben verknüpfen?', decision: '', rationale: 'Punkte könnten als Aufgaben mit Fälligkeit erscheinen. Klären, ob das Aufgaben-Modul das erwartet.', status: 'open' },
  ],
};
