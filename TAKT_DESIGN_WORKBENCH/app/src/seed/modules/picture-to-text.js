// Modul "Picture to Text" – Text aus Bildern erkennen (OCR) (Annahme, in Phase 1 gegen Modulregister verifizieren)
const L = (...lines) => lines.join('\n');

const cap = (id, title, source, when, text, lang, confidence, uncertain = []) => ({
  id, title, source, text, lang, confidence, uncertain, created: when.iso, meta: when.label,
  subtitle: text.split('\n').join(' · ').slice(0, 70),
  badge: `${Math.round(confidence * 100)} %`, tone: confidence > 0.9 ? 'success' : 'warning',
  icon: { camera: 'camera', file: 'image', clipboard: 'clipboard' }[source], group: { camera: 'Kamera', file: 'Datei', clipboard: 'Zwischenablage' }[source],
});

const captures = [
  cap('c1', 'Quittung Bäckerei Hoffmann', 'camera', { iso: '2026-11-24T08:12:00', label: 'Heute, 08:12' }, L('Bäckerei Hoffmann', 'Bahnhofstraße 12, 33602 Bielefeld', '24.11.2026 08:05 Uhr', '2 × Brötchen 1,60 €', '1 × Kaffee 2,90 €', 'Summe 4,50 €', 'Vielen Dank für Ihren Besuch!'), 'Deutsch', 0.97),
  cap('c2', 'Whiteboard Sprint-Planung', 'camera', { iso: '2026-11-23T16:40:00', label: 'Gestern' }, L('Sprint 23 – Planung', 'Ziel: Workbench-Beta', 'Offen: Kaiender-Varianten', 'Demo am Freitag 14:00 Uhr'), 'Deutsch', 0.91, [{ word: 'Kaiender-Varianten', alt: 'Kalender-Varianten', conf: 0.58 }]),
  cap('c3', 'Visitenkarte Dr. Müller', 'file', { iso: '2026-11-22T10:05:00', label: 'Sonntag' }, L('Dr. Anna Müiler', 'Steuerberaterin', 'Müller & Partner mbB', 'Tel. +49 521 555 0142', 'anna.mueller@mueller-partner.example'), 'Deutsch', 0.88, [{ word: 'Müiler', alt: 'Müller', conf: 0.61 }]),
  cap('c4', 'Screenshot Fehlermeldung', 'clipboard', { iso: '2026-11-20T14:22:00', label: '20.11.' }, L('Error 503: Service Unavailable', 'The server is temporarily unable to handle your request.', 'Please try again later.'), 'Englisch', 0.99),
  cap('c5', 'Buchseite „Deep Work“', 'file', { iso: '2026-11-17T21:30:00', label: '17.11.' }, L('Konzentratlon ist eine Fähigkeit,', 'die man trainieren kann – wie einen Muskel.', 'Jede Ablenkunq schwächt das Training.'), 'Deutsch', 0.84, [{ word: 'Konzentratlon', alt: 'Konzentration', conf: 0.55 }, { word: 'Ablenkunq', alt: 'Ablenkung', conf: 0.52 }]),
  cap('c6', 'Handschriftliche Einkaufsliste', 'camera', { iso: '2026-11-15T09:10:00', label: '15.11.' }, L('Einkauf Samstag', 'Hafermilch', 'Tomaten (Strauch)', 'Basilikurn', 'Kaffee Bohnen'), 'Deutsch', 0.72, [{ word: 'Basilikurn', alt: 'Basilikum', conf: 0.49 }, { word: '(Strauch)', alt: '(Roma)', conf: 0.42 }]),
];

const samples = [
  { title: 'Rechnung Buchhandlung Neumann', source: 'camera', lang: 'Deutsch', confidence: 0.96, text: L('Buchhandlung Neumann', 'Rechnung Nr. 20418', '2 × Fachbuch Typografle 49,80 €', 'Summe inkl. 7 % MwSt. 49,80 €', 'Zahlbar innerhalb von 14 Tagen'), uncertain: [{ word: 'Typografle', alt: 'Typografie', conf: 0.61 }] },
  { title: 'Vertrag Stromanbieter (Seite 1)', source: 'file', lang: 'Deutsch', confidence: 0.93, text: L('Stromliefervertrag', 'Vertragsnummer 7741-2209', 'Laufzeit 12 Monate ab 01.01.2027', 'Arbeitspreis 31,4 ct/kWh', 'Kündigungsfrist 4 Wochen zum Laufzeitende'), uncertain: [{ word: '31,4', alt: '31,9', conf: 0.66 }] },
  { title: 'Screenshot Terminbestätigung', source: 'clipboard', lang: 'Deutsch', confidence: 0.98, text: L('Terminbestätigung', 'Zahnarztpraxis Dr. Keller', 'Donnerstag, 03.12.2026 um 10:30 Uhr', 'Bitte 10 Minuten früher erscheinen.'), uncertain: [] },
  { title: 'Notizzettel Telefonat', source: 'camera', lang: 'Deutsch', confidence: 0.79, text: L('Rückruf Herr Schmidt', 'Angebot 4182 prüfen', 'Lieferzeit bis Mitte Januar?', 'Tel. 0521 / 555 0199'), uncertain: [{ word: '4182', alt: '4132', conf: 0.57 }, { word: 'Schmidt', alt: 'Schmitt', conf: 0.63 }] },
];

const notes = [
  { id: 'n1', title: 'Ideen TAKT V2', body: '## Fokus\n- Modulweise Entwicklung', tags: ['Projekt'], updated: '2026-11-24T07:40:00' },
];

const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });

export default {
  module: {
    id: 'picture-to-text', name: 'Picture to Text', icon: 'scan-text', status: 'concept', theme: 'graphite', designVersion: '0.1',
    description: 'Text aus Fotos, Screenshots und Dokumenten erkennen, prüfen und weiterverwenden.',
    source: 'Annahme der Workbench – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Drei Schritte: 1) Erfassen (Kamera, Datei, Zwischenablage), 2) Erkennen mit sichtbarem Fortschritt, 3) Ergebnis prüfen (unsichere Wörter markiert) und weiterverwenden (Kopieren, Als Notiz, Teilen). Verlauf aller Erfassungen als eigene Liste.',
    docs: L('**Annahmen**', '- Die Erkennung läuft in der App; in der Workbench wird sie mit Testergebnissen simuliert.', '- Unsichere Wörter werden nicht automatisch korrigiert, sondern mit Korrekturvorschlag markiert.', '- Ergebnisse landen als Notiz mit Tag „OCR“ im Notizen-Modul.', '', '**Offene Fragen**', '- Welche Engine nutzt TAKT bereits (lokal oder Cloud)? Datenschutz bei Quittungen und Verträgen klären.', '- Sollen mehrseitige PDFs unterstützt werden?', '- Wie lange werden Originalbilder aufbewahrt?'),
    links: ['notes', 'knowledge', 'finance'],
  },
  features: [
    {
      id: 'picture-to-text.capture', name: 'Bild erfassen', group: 'Erkennen', status: 'design',
      purpose: 'Ein Bild in wenigen Sekunden aufnehmen oder wählen und sehen, dass die Erkennung läuft und fertig wird.',
      requirements: [
        { text: 'Quelle wählbar: Kamera, Datei, Zwischenablage; Dropzone für Bilder per Drag & Drop', type: 'action', priority: 'must' },
        { text: 'Verarbeitung zeigt Schritte (Bild laden → Text erkennen → aufbereiten) mit Fortschritt', type: 'state', priority: 'must' },
        { text: 'Laufende Erkennung lässt sich abbrechen', type: 'action', priority: 'should' },
        { text: 'Nach Abschluss wird das Ergebnis automatisch geöffnet', type: 'rule', priority: 'must' },
        { text: 'Sprache wählbar oder automatisch; Layout optional beibehalten', type: 'action', priority: 'could' },
        { text: 'Auf Mobile ist die Hauptaktion (Foto aufnehmen) ein großes Touch-Ziel ≥ 44 px', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Quelle wechseln', result: 'Dropzone passt Text und Aktion an', event: 'capture.source' },
        { trigger: 'Foto aufnehmen / Datei wählen', result: 'Erkennung startet, Fortschritt erscheint', event: 'capture.start' },
        { trigger: 'Erkennung beendet', result: 'Ergebnis wird ausgewählt und angezeigt', event: 'capture.done' },
        { trigger: 'Abbrechen antippen', result: 'Verarbeitung stoppt', event: 'capture.cancel' },
        { trigger: 'Eintrag im Verlauf antippen', result: 'Ergebnis der Erfassung öffnet', event: 'item.open' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { captures, samples, notes },
      variants: [
        {
          id: 'A', name: 'Arbeitsplatz', concept: 'Desktop-Arbeitsplatz: links Erfassen und direkt darunter das Ergebnis, rechts der Verlauf als schneller Zugriff auf frühere Erfassungen.',
          description: '+ Alles in einem Blick, Ergebnis ohne Seitenwechsel  − Auf Mobile lange Seite mit Verlauf unten',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Picture to Text', title: 'Text aus Bildern', subtitle: 'Foto aufnehmen, Datei wählen oder Bild einfügen', primaryLabel: '' }),
            { id: 'cap', component: 'capture-panel', region: 'main', props: { title: 'Bild erfassen', compact: true } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true } },
            { id: 'hist', component: 'item-list', region: 'aside', bind: { items: 'captures' }, props: { title: 'Verlauf', limit: 6, emptyTitle: 'Noch keine Erfassungen' } },
          ],
        },
        {
          id: 'B', name: 'Schritt für Schritt', concept: 'Mobile-first Assistent in einer schmalen Spalte: erst erfassen, dann Ergebnis. Optionen und Bildvorschau entfallen, ein Tipp-Banner hilft beim ersten Mal.',
          description: '+ Klarer Ablauf, sehr gut mit dem Daumen bedienbar  − Weniger Kontext (kein Verlauf neben dem Ergebnis)',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Bild erfassen', subtitle: 'In drei Schritten zum Text', primaryLabel: '' }),
            { id: 'tip', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Tipp für bessere Ergebnisse', text: 'Dokument flach legen, gleichmäßig ausleuchten und möglichst formatfüllend fotografieren.' } },
            { id: 'cap', component: 'capture-panel', region: 'main', props: { title: 'Schritt 1 · Erfassen', showOptions: false } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.result'],
    },
    {
      id: 'picture-to-text.result', name: 'Texterkennung & Ergebnis', group: 'Erkennen', status: 'review',
      purpose: 'Das erkannte Ergebnis prüfen, unsichere Stellen korrigieren und den Text weiterverwenden.',
      requirements: [
        { text: 'Erkannter Text mit Sprache, Konfidenz und Wortanzahl', type: 'info', priority: 'must' },
        { text: 'Unsichere Wörter sind markiert; Tippen übernimmt den Korrekturvorschlag', type: 'action', priority: 'must' },
        { text: 'Bildvorschau neben dem Text, damit Original und Ergebnis vergleichbar sind', type: 'info', priority: 'should' },
        { text: 'Text direkt bearbeiten', type: 'action', priority: 'should' },
        { text: 'Aktionen Kopieren, Als Notiz speichern und Teilen', type: 'action', priority: 'must' },
        { text: 'Leerzustand, solange noch nichts erfasst wurde', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Unsicheres Wort antippen', result: 'Korrekturvorschlag wird übernommen', event: 'ocr.correct' },
        { trigger: 'Bearbeiten wählen', result: 'Text wird editierbar', event: 'ocr.edit' },
        { trigger: 'Kopieren antippen', result: 'Text in der Zwischenablage, Toast', event: 'ocr.copy' },
        { trigger: 'Als Notiz speichern antippen', result: 'Notiz mit Tag „OCR“ angelegt', event: 'ocr.save-note' },
        { trigger: 'Teilen antippen', result: 'Dialog mit Teilen-Optionen', event: 'ocr.share' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { captures, notes },
      variants: [{
        id: 'A', name: 'Ergebnis im Fokus', concept: 'Bildvorschau und Text nebeneinander, darunter die Aktionen. Seitenspalte mit den letzten Erfassungen zum schnellen Wechsel.',
        description: '+ Direkter Vergleich Bild/Text  − Auf kleinen Geräten steht die Vorschau über dem Text',
        layout: { type: 'split' },
        blocks: [
          hdr({ eyebrow: 'Picture to Text', title: 'Ergebnis', primaryLabel: '' }),
          { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true, showConfidence: true, allowEdit: true } },
          { id: 'hist', component: 'item-list', region: 'aside', bind: { items: 'captures' }, props: { title: 'Letzte Erfassungen', limit: 5, dense: true } },
        ],
      }],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Bild/Text-Vergleich' }, { kind: 'review', note: 'Zur Prüfung: Korrektur unsicherer Wörter' }],
    },
    {
      id: 'picture-to-text.history', name: 'Verlauf', group: 'Verwalten', status: 'design',
      purpose: 'Frühere Erfassungen wiederfinden, durchsuchen und erneut verwenden.',
      requirements: [
        { text: 'Liste aller Erfassungen mit Titel, Auszug, Quelle und Konfidenz', type: 'info', priority: 'must' },
        { text: 'Suche im erkannten Text; Filter nach Quelle', type: 'action', priority: 'must' },
        { text: 'Auswahl zeigt das Ergebnis rechts (Master-Detail)', type: 'action', priority: 'must' },
        { text: 'Leerzustand für Suche ohne Treffer', type: 'state', priority: 'must' },
        { text: 'Erfassungen löschen', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Suchbegriff eingeben', result: 'Verlauf filtert live', event: 'search.input' },
        { trigger: 'Quelle als Filter wählen', result: 'Nur Erfassungen dieser Quelle', event: 'filter.change' },
        { trigger: 'Eintrag antippen', result: 'Ergebnis öffnet', event: 'item.open' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { captures, notes },
      variants: [{
        id: 'A', name: 'Liste + Ergebnis', concept: 'Seitenleiste mit Suche, Quellenfilter und Verlaufsliste; im Hauptbereich das Ergebnis der gewählten Erfassung.',
        description: '+ Schnell durchblättern  − Auf Mobile ist die Liste einklappbar',
        layout: { type: 'sidebar', panelLabel: 'Verlauf & Suche' },
        blocks: [
          { id: 'flt', component: 'search-filter', region: 'panel', props: { placeholder: 'Erkannten Text suchen …', filters: ['Alle', 'Kamera', 'Datei', 'Zwischenablage'], layout: 'stacked' } },
          { id: 'hist', component: 'item-list', region: 'panel', bind: { items: 'captures' }, props: { title: 'Erfassungen', emptyTitle: 'Keine Erfassungen gefunden' } },
          { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'picture-to-text.export', name: 'Export', group: 'Verwalten', status: 'analyzed',
      purpose: 'Erkannten Text als Notiz speichern, kopieren oder teilen.',
      requirements: [
        { text: 'Als Notiz speichern legt eine Notiz mit Titel und Tag „OCR“ an', type: 'action', priority: 'must' },
        { text: 'Kopieren mit Rückmeldung', type: 'action', priority: 'must' },
        { text: 'Teilen als Textdatei oder per E-Mail', type: 'action', priority: 'should' },
      ],
      interactions: [{ trigger: 'Als Notiz speichern', result: 'Notiz angelegt', event: 'ocr.save-note' }, { trigger: 'Kopieren', result: 'Text in Zwischenablage', event: 'ocr.copy' }, { trigger: 'Teilen', result: 'Teilen-Dialog', event: 'ocr.share' }],
      viewports: ['desktop', 'mobile'],
      demoData: { captures, notes },
    },
    {
      id: 'picture-to-text.multipage', name: 'Mehrseitige Dokumente', group: 'Erkennen', status: 'not_analyzed',
      purpose: 'Mehrere Seiten oder ein PDF in einem Durchgang erkennen.',
      requirements: [
        { text: 'Mehrere Bilder zu einem Dokument bündeln', type: 'action', priority: 'could' },
        { text: 'Seitenreihenfolge ändern', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Weitere Seite hinzufügen', result: 'Seite wird angehängt', event: 'capture.start' }],
      viewports: ['mobile', 'tablet'],
      demoData: { captures, samples, notes },
    },
  ],
  decisions: [
    { featureId: 'picture-to-text.result', title: 'Unsichere Wörter markieren oder automatisch korrigieren?', decision: 'Unsichere Wörter werden markiert und mit Vorschlag angeboten, nie stillschweigend geändert.',
      rationale: 'Bei Beträgen, Nummern und Namen ist eine falsche automatische Korrektur schlimmer als ein sichtbarer Zweifel. Das Antippen übernimmt den Vorschlag mit einem Klick.',
      tradeoffs: 'Etwas mehr Interaktion bei schlechten Scans; bei sehr vielen Zweifeln wirkt der Text unruhig.', status: 'decided' },
    { featureId: 'picture-to-text.capture', title: 'Erkennung lokal auf dem Gerät oder in der Cloud?', decision: '', rationale: 'Quittungen und Verträge sind sensibel. Lokal schützt Daten, Cloud liefert oft bessere Qualität. Abhängig von der Engine des bestehenden TAKT.', status: 'open' },
    { featureId: 'picture-to-text.multipage', title: 'Mehrseitige PDFs in der ersten Version?', decision: '', rationale: 'Nutzen hoch bei Verträgen, Aufwand deutlich größer (Seitenverwaltung, Fortschritt). Erst nach Feedback zur Einzelseite entscheiden.', status: 'open' },
  ],
};
