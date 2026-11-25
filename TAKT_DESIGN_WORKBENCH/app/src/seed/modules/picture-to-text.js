// Modul "Picture to Text" – Text, Belege, Visitenkarten und Dokumente aus Fotos erkennen (Erkennung in der Vorschau simuliert).
// Referenztag: Di, 24.11.2026 09:30. Buchungen kommen aus der gemeinsamen Datenwelt (@world:transactions).

const L = (...lines) => lines.join('\n');
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];

// Erfassungen, Belege, Visitenkarten und Beispielbilder liegen in der gemeinsamen Datenwelt (world/scans.js, Eigentümer: picture-to-text);
// Notizen gehören Wissen (`@world:notes`), Buchungen Finanzen (`@world:transactions`).
const W = {
  captures: '@world:captures', samples: '@world:captureSamples', notes: '@world:notes', receipts: '@world:receipts', cards: '@world:businessCards',
  toReview: '@world:capturesToReview', metrics: '@world:capturesMetrics', bySource: '@world:capturesBySource', transactions: '@world:transactions',
};
const demoAll = W;

const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });
const SRC = ['Alle', 'Kamera', 'Datei', 'Zwischenablage'];
const SCAN_NAV = [
  { trigger: '„Dokument scannen“', result: 'Dokumenten-Scanner', event: 'scan.document', to: 'picture-to-text.scanner' },
  { trigger: '„Beleg erkennen“', result: 'Beleg prüfen und buchen', event: 'scan.receipt', to: 'picture-to-text.receipt' },
  { trigger: '„Visitenkarte“', result: 'Kontakt aus Visitenkarte', event: 'scan.card', to: 'picture-to-text.card' },
  { trigger: '„Text erkennen“', result: 'Bild erfassen', event: 'scan.text', to: 'picture-to-text.capture' },
];

export default {
  module: {
    id: 'picture-to-text', name: 'Picture to Text', icon: 'scan-text', status: 'active', theme: 'graphite', designVersion: '0.3', homeFeatureId: 'picture-to-text.home',
    description: 'Text, Belege, Visitenkarten und Dokumente aus Fotos erkennen, prüfen und weiterverwenden.',
    source: 'Workbench V2 (Bauplan, Brainstorm „alltag“) – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Übersicht“ mit vier Wegen: Dokument scannen (mehrere Seiten, PDF), Beleg erkennen (Betrag/Händler/Datum, als Ausgabe in Finanzen), Visitenkarte (Kontakt), Text erkennen (Foto, Datei, Zwischenablage). Danach immer derselbe Dreischritt: Erfassen, Erkennen mit Fortschritt, Prüfen (unsichere Stellen markiert) und Weiterverwenden (Kopieren, Notiz, Buchung, Kontakt). Verlauf aller Erfassungen als eigene Liste.',
    docs: L('## Leitidee', '- Die Erkennung läuft auf dem Gerät; in der Workbench wird sie mit Testergebnissen simuliert.', '- Unsichere Stellen werden nie still korrigiert, sondern markiert und mit Vorschlag angeboten.', '- Beträge werden nie ungeprüft gebucht: Die Buchung wird vorgeschlagen und erst nach „Als Ausgabe buchen“ angelegt.', '', '## Verbindung zu anderen Modulen', '- Finanzen: „Als Ausgabe buchen“ schreibt eine Buchung in die gemeinsame Datenwelt; Dubletten werden gegen vorhandene Buchungen geprüft.', '- Notizen: erkannter Text landet als Notiz mit Tag „OCR“ im Eingang.', '- Kamera: Berechtigung mit Alternative (Datei wählen), siehe permission-card.', '', '## Offene Fragen', '- Welche Engine nutzt TAKT bereits (lokal oder Cloud)? Datenschutz bei Quittungen und Verträgen klären.', '- Wie lange werden Originalbilder aufbewahrt?', '- Kontakte: eigenes Modul oder nur Export ins Adressbuch?', '', '## Bekannte Grenze der Vorschau', '- Erfassungen liegen im Modul (noch nicht in der gemeinsamen Datenwelt): Der Verlauf wirkt innerhalb eines Screens, nicht über Screens hinweg.'),
    links: ['notes', 'knowledge', 'finance', 'documents'],
  },
  features: [
    // ------------------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'picture-to-text.home', name: 'Übersicht', group: 'Übersicht', status: 'design', tier: 2,
      purpose: 'Der Einstieg: mit einem Tipp scannen, Belege buchen, Karten übernehmen oder Text erkennen – und sehen, was noch geprüft werden muss.',
      requirements: [
        { text: 'Vier Wege sind sofort erreichbar: Dokument scannen, Beleg erkennen, Visitenkarte, Text erkennen', type: 'action', priority: 'must' },
        { text: 'Verlauf der letzten Erfassungen mit Quelle und Konfidenz; ein Tipp öffnet das Ergebnis', type: 'info', priority: 'must' },
        { text: '„Zu prüfen“ listet Erfassungen mit unsicheren Wörtern und nennt die Anzahl', type: 'info', priority: 'must' },
        { text: 'Offene Belege (noch nicht gebucht) mit Betrag; Prüfen und Buchen in zwei Tipps', type: 'info', priority: 'should' },
        { text: 'Kamera ohne Berechtigung: Hinweis mit Alternative „Aus Datei wählen“', type: 'state', priority: 'should' },
        { text: 'Leerzustand (erster Start): erklärt die vier Wege, keine leeren Listen', type: 'state', priority: 'must' },
      ],
      interactions: [
        ...SCAN_NAV,
        { trigger: 'Eintrag im Verlauf antippen', result: 'Ergebnis der Erfassung', event: 'item.open', to: 'picture-to-text.result' },
        { trigger: 'Erfassungs-Karte antippen', result: 'Ergebnis der Erfassung', event: 'card.open', to: 'picture-to-text.result' },
        { trigger: 'Beleg antippen', result: 'Beleg prüfen und buchen', event: 'receipt.open', to: 'picture-to-text.receipt' },
        { trigger: '„Verlauf“', result: 'Alle Erfassungen mit Suche', event: 'header.secondary', to: 'picture-to-text.history' },
        { trigger: '„Alle (n)“ an Verlauf oder „Zu prüfen“', result: 'Alle Erfassungen mit Suche', event: 'list.all.open', to: 'picture-to-text.history' },
        { trigger: 'Kennzahl antippen', result: 'Verlauf', event: 'metric.open', to: 'picture-to-text.history' },
      ],
      acceptance: [
        'Jeder der vier Wege ist mit einem Tipp von der Startseite erreichbar.',
        '„Zu prüfen“ zeigt je Erfassung die unsicheren Wörter und führt zum Ergebnis.',
        'Ein offener Beleg zeigt Betrag und Händler; „Prüfen und buchen“ öffnet das Formular.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, Hauptaktionen sind mindestens 44 px hoch.',
      ],
      flows: [
        { id: 'fl-beleg', name: 'Beleg buchen', steps: [{ featureId: 'picture-to-text.home', action: 'Beleg „Bäckerei Hoffmann“ antippen' }, { featureId: 'picture-to-text.receipt', action: 'Betrag prüfen, „Als Ausgabe buchen“' }] },
        { id: 'fl-scan', name: 'Dokument scannen', steps: [{ featureId: 'picture-to-text.home', action: '„Dokument scannen“' }, { featureId: 'picture-to-text.scanner', action: 'Zwei Seiten aufnehmen, als PDF speichern' }] },
      ],
      viewports: ALL_VP, demoData: demoAll,
      variants: [
        {
          id: 'A', name: 'Wege & Verlauf', direction: 'kompakt', concept: 'Vier Wege als Knopfreihe, darunter der durchsuchbare Verlauf; in der Seitenspalte „Zu prüfen“ und offene Belege. Alles Wichtige ohne Seitenwechsel.',
          description: '+ Dicht, viele Erfassungen im Blick  − Auf Mobile lang',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Picture to Text', title: 'Übersicht', subtitle: 'Erfassungen prüfen, Belege buchen', primaryLabel: '', secondaryLabel: 'Verlauf', secondaryIcon: 'history' }),
            { id: 'launch', component: 'capture-launcher', region: 'main', props: { style: 'row' } },
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Erkannten Text suchen …', filters: SRC } },
            { id: 'hist', component: 'count-list', region: 'main', bind: { items: 'captures' }, props: { title: 'Verlauf', limit: 6, link: 'Alle', emptyTitle: 'Noch keine Erfassungen', emptyText: 'Wähle oben einen der vier Wege, um den ersten Text zu erkennen.' } },
            { id: 'rev', component: 'count-list', region: 'aside', bind: { items: 'toReview' }, props: { title: 'Zu prüfen', dense: true, emptyTitle: 'Nichts zu prüfen', emptyText: 'Erfassungen mit unsicheren Wörtern erscheinen hier.' } },
            { id: 'rcp', component: 'receipt-review', region: 'aside', props: { mode: 'list', title: 'Belege', limit: 3 } },
          ],
        },
        {
          id: 'B', name: 'Kacheln & Galerie', direction: 'visuell', concept: 'Vier große Kacheln als Einstieg, darunter Kennzahlen, die Herkunft der Erfassungen als Ring und eine Galerie der letzten Ergebnisse mit Textvorschau.',
          description: '+ Einladend, Ergebnisse auf einen Blick  − Weniger Erfassungen ohne Scrollen',
          layout: { type: 'grid' },
          blocks: [
            hdr({ eyebrow: 'Picture to Text', title: 'Übersicht', subtitle: 'Was möchtest du erkennen?', primaryLabel: '', secondaryLabel: 'Verlauf', secondaryIcon: 'history' }),
            { id: 'launch', component: 'capture-launcher', region: 'main', span: 12, props: { style: 'tiles' } },
            { id: 'kpi', component: 'kpi-tiles', region: 'main', span: 8, spanTablet: 12, bind: { metrics: 'metrics' }, props: { columns: 4, showSpark: false } },
            { id: 'src', component: 'chart', region: 'main', span: 4, spanTablet: 12, bind: { series: 'bySource' }, props: { title: 'Quellen', type: 'donut', quietEmpty: true } },
            { id: 'gal', component: 'card-grid', region: 'main', span: 12, bind: { items: 'captures' }, props: { title: 'Zuletzt erkannt', cover: true, minWidth: 230 } },
          ],
        },
        {
          id: 'C', name: 'Scannen & Prüfen', direction: 'fokus', concept: 'Eine Hauptaktion „Dokument scannen“ mit zwei Alternativen, darunter der nächste Beleg zum Buchen und was geprüft werden muss. Danach nur noch drei Zeilen Verlauf.',
          description: '+ Direkt handeln, wenig Ablenkung  − Kein Gesamtüberblick',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Erkennen', subtitle: 'Di, 24. November', primaryLabel: '', secondaryLabel: 'Verlauf', secondaryIcon: 'history' }),
            { id: 'launch', component: 'capture-launcher', region: 'main', props: { style: 'hero' } },
            { id: 'next', component: 'receipt-review', region: 'main', props: { mode: 'next', quietEmpty: true } },
            { id: 'rev', component: 'count-list', region: 'main', bind: { items: 'toReview' }, props: { title: 'Zu prüfen', dense: true, limit: 3, link: 'Alle', quietEmpty: true, emptyTitle: 'Nichts zu prüfen', emptyText: 'Erfassungen mit unsicheren Wörtern erscheinen hier.' } },
            { id: 'hist', component: 'count-list', region: 'main', bind: { items: 'captures' }, props: { title: 'Zuletzt', dense: true, limit: 3, link: 'Alle', emptyTitle: 'Noch keine Erfassungen', emptyText: 'Starte oben mit „Dokument scannen“.' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.scanner', 'picture-to-text.receipt', 'picture-to-text.card', 'picture-to-text.capture', 'picture-to-text.result', 'picture-to-text.history', 'home.today'],
    },
    // ------------------------------------------------------------------ Bild erfassen
    {
      id: 'picture-to-text.capture', name: 'Bild erfassen', group: 'Erkennen', status: 'design', tier: 2,
      purpose: 'Ein Bild in wenigen Sekunden aufnehmen oder wählen und sehen, dass die Erkennung läuft und fertig wird.',
      requirements: [
        { text: 'Quelle wählbar: Kamera, Datei, Zwischenablage; Dropzone für Bilder per Drag & Drop', type: 'action', priority: 'must' },
        { text: 'Verarbeitung zeigt Schritte (Bild laden → Text erkennen → aufbereiten) mit Fortschritt', type: 'state', priority: 'must' },
        { text: 'Laufende Erkennung lässt sich abbrechen', type: 'action', priority: 'should' },
        { text: 'Nach Abschluss wird das Ergebnis angezeigt', type: 'rule', priority: 'must' },
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
      acceptance: ['Während der Erkennung sind alle drei Schritte mit Fortschritt sichtbar und abbrechbar.', 'Nach „Fertig“ steht die Zahl erkannter Zeilen und unsicherer Wörter.', 'Ohne Treffer in der Quelle nutzt die Simulation die nächste Testdatei.'],
      flows: [{ id: 'fl-erfassen', name: 'Foto erkennen', steps: [{ featureId: 'picture-to-text.capture', action: 'Quelle „Kamera“ wählen, Foto aufnehmen' }, { featureId: 'picture-to-text.capture', action: 'Fortschritt abwarten, Ergebnis prüfen' }, { featureId: 'picture-to-text.result', action: 'Unsicheres Wort übernehmen, „Als Notiz speichern“' }] }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { captures: W.captures, samples: W.samples, notes: W.notes },
      variants: [
        {
          id: 'A', name: 'Arbeitsplatz', direction: 'kompakt', concept: 'Desktop-Arbeitsplatz: links Erfassen und direkt darunter das Ergebnis, rechts der Verlauf als schneller Zugriff auf frühere Erfassungen.',
          description: '+ Alles in einem Blick, Ergebnis ohne Seitenwechsel  − Auf Mobile lange Seite mit Verlauf unten',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Picture to Text', title: 'Text aus Bildern', subtitle: 'Foto aufnehmen, Datei wählen oder Bild einfügen', primaryLabel: '' }),
            { id: 'cap', component: 'capture-panel', region: 'main', props: { title: 'Bild erfassen', compact: true } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true } },
            { id: 'hist', component: 'count-list', region: 'aside', bind: { items: 'captures' }, props: { title: 'Verlauf', limit: 6, emptyTitle: 'Noch keine Erfassungen', emptyText: 'Das erste erkannte Bild erscheint hier.' } },
          ],
        },
        {
          id: 'B', name: 'Schritt für Schritt', direction: 'fokus', concept: 'Mobile-first Assistent in einer schmalen Spalte: erst erfassen, dann Ergebnis. Optionen und Bildvorschau entfallen, ein Tipp-Banner hilft beim ersten Mal.',
          description: '+ Klarer Ablauf, sehr gut mit dem Daumen bedienbar  − Weniger Kontext (kein Verlauf neben dem Ergebnis)',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Bild erfassen', subtitle: 'In drei Schritten zum Text', primaryLabel: '' }),
            { id: 'tip', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Tipp für bessere Ergebnisse', text: 'Dokument flach legen, gleichmäßig ausleuchten und möglichst formatfüllend fotografieren.' } },
            { id: 'cap', component: 'capture-panel', region: 'main', props: { title: 'Schritt 1 · Erfassen', showOptions: false } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: false } },
          ],
        },
        {
          id: 'C', name: 'Große Dropzone & Galerie', direction: 'visuell', concept: 'Große Dropzone mit Quellenwahl, darunter die letzten Erfassungen als Karten mit Textvorschau. Ein Tipp auf eine Karte zeigt das Ergebnis.',
          description: '+ Einladend, frühere Ergebnisse sofort sichtbar  − Ergebnis erscheint unterhalb der Galerie',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Picture to Text', title: 'Text aus Bildern', primaryLabel: '' }),
            { id: 'cap', component: 'capture-panel', region: 'main', props: { title: 'Bild erfassen' } },
            { id: 'gal', component: 'card-grid', region: 'main', bind: { items: 'captures' }, props: { title: 'Zuletzt erkannt', cover: true, minWidth: 220 } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.result', 'picture-to-text.home'],
    },
    // ------------------------------------------------------------------ Dokumenten-Scanner
    {
      id: 'picture-to-text.scanner', name: 'Dokumenten-Scanner', group: 'Erkennen', status: 'design', tier: 2,
      purpose: 'Mehrseitige Dokumente mit der Kamera aufnehmen, Kanten erkennen lassen, Seiten bearbeiten und als PDF speichern.',
      requirements: [
        { text: 'Kamera-Ansicht mit Kantenerkennung; der Auslöser wartet, bis das Dokument erkannt ist', type: 'state', priority: 'must' },
        { text: 'Mehrere Seiten zu einem Stapel bündeln; Reihenfolge ändern, Seite entfernen', type: 'action', priority: 'must' },
        { text: 'Je Seite drehen, zuschneiden und Filter wählen (Dokument, Foto, S/W)', type: 'action', priority: 'should' },
        { text: 'Als PDF speichern (Name, Text durchsuchbar) oder nur Text erkennen', type: 'action', priority: 'must' },
        { text: 'Kamera ohne Berechtigung: Erklärung und Alternative „Aus Datei wählen“', type: 'state', priority: 'must' },
        { text: 'Leerer Stapel zeigt „Noch keine Seite“; nach dem Speichern „Neuer Scan“', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Auslöser antippen', result: 'Seite wird aufgenommen und dem Stapel angehängt', event: 'scan.capture' },
        { trigger: 'Seite bearbeiten (Drehen, Zuschneiden, Filter, Umordnen)', result: 'Vorschau der Seite ändert sich', event: 'scan.edit' },
        { trigger: '„Als PDF speichern“', result: 'Fortschritt, dann Erfassung „PDF“ im Verlauf', event: 'scan.export' },
        { trigger: '„Text erkennen“', result: 'Text des Stapels als Erfassung', event: 'scan.ocr' },
        { trigger: '„Aus Datei wählen“', result: 'Seite aus Datei statt Kamera', event: 'permission.alternative' },
      ],
      acceptance: ['Der Auslöser meldet „Noch keine Kanten erkannt“, solange die Kantenerkennung läuft.', 'Nach dem Speichern erscheint das PDF im Verlauf mit der Seitenzahl.', 'Ohne Kamerazugriff bleibt „Aus Datei wählen“ nutzbar.', 'Alle Bedienelemente sind auf Mobile mindestens 44 px hoch.'],
      flows: [{ id: 'fl-vertrag', name: 'Vertrag scannen', steps: [{ featureId: 'picture-to-text.scanner', action: 'Drei Seiten aufnehmen' }, { featureId: 'picture-to-text.scanner', action: 'Filter „Dokument“, als PDF speichern' }] }],
      viewports: ['mobile', 'tablet', 'desktop'],
      demoData: { captures: W.captures, samples: W.samples },
      variants: [
        {
          id: 'A', name: 'Kamera zuerst', direction: 'fokus', concept: 'Vollbild-Kamera wie in einer Scanner-App: Auslöser unten, „Fertig (n)“ führt zur Bearbeitung der Seiten. Ein Schritt nach dem anderen.',
          description: '+ Vertraut, einhändig bedienbar  − Seiten sieht man erst nach „Fertig“',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Dokument scannen', subtitle: 'Seite für Seite, dann als PDF', primaryLabel: '' }), { id: 'scan', component: 'doc-scanner', region: 'main', props: { layout: 'smartphone' } }],
        },
        {
          id: 'B', name: 'Kamera & Seiten nebeneinander', direction: 'kompakt', concept: 'Auf großen Bildschirmen steht die Kamera links, rechts der Seitenstapel mit Filter, Drehen, Zuschneiden und PDF-Export. Bereits zwei Seiten im Stapel.',
          description: '+ Aufnehmen und Bearbeiten ohne Wechsel  − Auf Mobile identisch mit Variante A',
          layout: { type: 'stack' },
          blocks: [hdr({ eyebrow: 'Picture to Text', title: 'Dokument scannen', primaryLabel: '' }), { id: 'scan', component: 'doc-scanner', region: 'main', props: { title: 'Kamera und Seiten', layout: 'bench', startPages: 2 } },
            { id: 'perm', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Kein Zugriff auf die Kamera?', text: 'Wähle „Datei“, um Seiten aus Fotos oder PDFs zu übernehmen.', dismissible: true } }],
        },
        {
          id: 'C', name: 'Ohne Kamerazugriff', direction: 'visuell', concept: 'Zustand „Kamera nicht erlaubt“: Erklärung, Weg zu den Einstellungen und die Alternative „Aus Datei wählen“, die sofort funktioniert.',
          description: '+ Kein Sackgassen-Gefühl  − Nur als Zustand sinnvoll, nicht als Standard',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Dokument scannen', primaryLabel: '' }), { id: 'scan', component: 'doc-scanner', region: 'main', props: { layout: 'smartphone', permission: 'verweigert' } }],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.history', 'picture-to-text.home'],
    },
    // ------------------------------------------------------------------ Beleg erkennen
    {
      id: 'picture-to-text.receipt', name: 'Beleg erkennen', group: 'Erkennen', status: 'design', tier: 1,
      purpose: 'Kassenbons und Rechnungen fotografieren, Händler, Datum und Betrag prüfen und als Ausgabe in Finanzen vorschlagen – ohne Abtippen.',
      requirements: [
        { text: 'Händler, Datum, Betrag, MwSt, Kategorie und Konto stehen in einem prüfbaren Formular', type: 'info', priority: 'must' },
        { text: 'Unsichere Felder tragen den Hinweis „Bitte prüfen“ (nicht nur Farbe)', type: 'rule', priority: 'must' },
        { text: 'Eingaben werden geprüft: Betrag größer 0, Datum nicht in der Zukunft, Händler nicht leer', type: 'rule', priority: 'must' },
        { text: 'Dublettenprüfung: gleicher Betrag in den letzten Tagen weist auf eine vorhandene Buchung hin', type: 'rule', priority: 'should' },
        { text: '„Als Ausgabe buchen“ legt die Buchung an (Betrag mit Privatsphäre-Maske), „In Finanzen prüfen“ öffnet Finanzen', type: 'action', priority: 'must' },
        { text: 'Positionen und enthaltene MwSt sind einsehbar', type: 'info', priority: 'should' },
        { text: 'Hinweis: Beträge stammen aus der Erkennung und sind mit dem Beleg zu vergleichen', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: '„Als Ausgabe buchen“', result: 'Buchung wird in Finanzen angelegt, Beleg gilt als gebucht', event: 'receipt.book' },
        { trigger: '„In Finanzen prüfen“', result: 'Schnell erfassen in Finanzen öffnet; Händler, Betrag, Datum, Kategorie und Konto stehen als Vorschlag bereit (ctx.ui.prefill)', event: 'receipt.finance', to: 'finance.quickadd' },
        { trigger: 'Beleg in der Liste antippen', result: 'Beleg im Formular', event: 'receipt.open' },
        { trigger: 'Feld ändern', result: 'Eingabe wird geprüft; ein ungültiger Wert (Betrag 0, Datum in der Zukunft, Händler leer) meldet sich am Feld und sperrt das Buchen', event: 'form.invalid' },
        { trigger: '„Beleg fotografieren“ (Leerzustand)', result: 'Bild erfassen öffnet', event: 'receipt.capture', to: 'picture-to-text.capture' },
      ],
      acceptance: [
        'Ein Betrag von 0 oder ein Datum in der Zukunft sperrt „Als Ausgabe buchen“ und nennt den Grund am Feld.',
        'Der Beleg „Thalia Bücher“ zeigt „Möglicherweise schon gebucht“ mit Betrag und Datum.',
        'Nach dem Buchen steht „Gebucht“ und die Buchung erscheint in Finanzen.',
        'Der Hinweis zur Prüfung des Betrags ist in jeder Variante sichtbar.',
      ],
      flows: [{ id: 'fl-buchen', name: 'Beleg buchen', steps: [{ featureId: 'picture-to-text.receipt', action: 'Betrag und Kategorie prüfen' }, { featureId: 'picture-to-text.receipt', action: '„Als Ausgabe buchen“' }, { featureId: 'finance.transactions', action: 'Buchung in der Liste sehen' }] }],
      viewports: ['mobile', 'tablet', 'desktop'],
      demoData: { receipts: W.receipts, transactions: W.transactions },
      variants: [
        {
          id: 'A', name: 'Prüfen & Buchen', direction: 'fokus', concept: 'Ein Beleg im Fokus: Vorschau und Formular, darunter die zwei Aktionen. Seitenspalte mit weiteren offenen Belegen zum Weiterschalten.',
          description: '+ Klarer Ablauf bis zur Buchung  − Positionen nur bei Bedarf',
          layout: { type: 'split' },
          blocks: [hdr({ eyebrow: 'Picture to Text', title: 'Beleg prüfen', primaryLabel: '' }), { id: 'rcp', component: 'receipt-review', region: 'main', props: { mode: 'review', title: 'Erkannte Angaben', showItems: false } },
            { id: 'list', component: 'receipt-review', region: 'aside', props: { mode: 'list', title: 'Alle Belege', quietEmpty: true } }],
        },
        {
          id: 'B', name: 'Belegliste & Detail', direction: 'kompakt', concept: 'Liste aller Belege mit Betrag und Status, darunter Formular mit Positionen und MwSt. Für viele Belege auf einmal.',
          description: '+ Überblick über alle Belege, Positionen sichtbar  − Mehr Fläche, auf Mobile lang',
          layout: { type: 'stack' },
          blocks: [hdr({ eyebrow: 'Picture to Text', title: 'Belege', subtitle: 'Prüfen und buchen', primaryLabel: '' }), { id: 'list', component: 'receipt-review', region: 'main', props: { mode: 'list', title: 'Belege', quietEmpty: true } },
            { id: 'rcp', component: 'receipt-review', region: 'main', props: { mode: 'review', title: 'Erkannte Angaben', showItems: true, showImage: false } }],
        },
        {
          id: 'C', name: 'Beleg-Karte', direction: 'visuell', concept: 'Der Beleg als gestalteter Kassenzettel mit Farbanteilen je Position und großem Gesamtbetrag, daneben die Prüfung: Erkennungs-Ring, Betrag groß, Kategorie als Kacheln, Konto. Eine Leiste oben wechselt den Beleg.',
          description: '+ Beleg und Prüfung auf einen Blick, Kategorie mit einem Tipp  − Mehr Fläche als das reine Formular',
          layout: { type: 'stack' },
          blocks: [hdr({ eyebrow: 'Picture to Text', title: 'Beleg prüfen', subtitle: 'Vergleiche die Angaben mit dem Beleg', primaryLabel: '' }),
            { id: 'slip', component: 'receipt-slip', region: 'main', props: { title: 'Beleg', showItems: true } }],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.home', 'picture-to-text.result'],
    },
    // ------------------------------------------------------------------ Visitenkarte
    {
      id: 'picture-to-text.card', name: 'Visitenkarte', group: 'Erkennen', status: 'design', tier: 3,
      purpose: 'Eine Visitenkarte fotografieren und Name, Firma und Kontaktdaten als Kontakt übernehmen.',
      requirements: [
        { text: 'Felder Name, Funktion, Firma, Telefon, E-Mail, Website, Adresse sind prüfbar und änderbar', type: 'info', priority: 'must' },
        { text: 'Unsichere Felder tragen „Bitte prüfen“; E-Mail und Telefon werden auf Form geprüft', type: 'rule', priority: 'must' },
        { text: 'Aktionen: Kontakt speichern, E-Mail schreiben, Anrufen, Termin vorschlagen', type: 'action', priority: 'should' },
        { text: 'Kontakte-Modul ist offen: bis dahin wird der Kontakt in der Vorschau nur bestätigt', type: 'rule', priority: 'could' },
      ],
      interactions: [{ trigger: '„Kontakt speichern“', result: 'Hinweis „Kontakt gespeichert“', event: 'card.save' }, { trigger: '„E-Mail“ / „Anrufen“', result: 'Aktion der Plattform', event: 'card.mail' }, { trigger: '„Termin“', result: 'Termin mit Kontakt vorschlagen', event: 'card.event' }],
      acceptance: ['Eine ungültige E-Mail-Adresse sperrt „Kontakt speichern“ und nennt den Grund.', 'Nach dem Speichern bleibt die Karte sichtbar mit „Kontakt gespeichert“.'],
      viewports: ['mobile', 'tablet', 'desktop'],
      demoData: { cards: W.cards },
      variants: [{
        id: 'A', name: 'Kontaktkarte', direction: 'fokus', concept: 'Oben die erkannte Karte als Kontaktkarte mit Initialen, darunter prüfbare Felder und vier Aktionen. Eine Sache pro Bildschirm.',
        description: '+ Schnell übernommen  − Kein Vergleich mit dem Originalfoto',
        layout: { type: 'stack', narrow: true },
        blocks: [hdr({ title: 'Visitenkarte', subtitle: 'Prüfen und als Kontakt speichern', primaryLabel: '' }), { id: 'card', component: 'business-card', region: 'main' }],
      }],
      selectedVariantId: 'A',
      links: ['picture-to-text.home'],
    },
    // ------------------------------------------------------------------ Ergebnis
    {
      id: 'picture-to-text.result', name: 'Texterkennung & Ergebnis', group: 'Erkennen', status: 'review', tier: 1,
      purpose: 'Das erkannte Ergebnis prüfen, unsichere Stellen korrigieren und den Text weiterverwenden.',
      requirements: [
        { text: 'Erkannter Text mit Sprache, Konfidenz und Wortanzahl', type: 'info', priority: 'must' },
        { text: 'Unsichere Wörter sind markiert; Tippen übernimmt den Korrekturvorschlag', type: 'action', priority: 'must' },
        { text: 'Bildvorschau neben dem Text, damit Original und Ergebnis vergleichbar sind', type: 'info', priority: 'should' },
        { text: 'Text direkt bearbeiten; unsichere Stellen auch Wort für Wort prüfen (Assistent)', type: 'action', priority: 'should' },
        { text: 'Aktionen Kopieren, Als Notiz speichern (Eingang, Tag „OCR“) und Teilen', type: 'action', priority: 'must' },
        { text: 'Belege und Visitenkarten werden erkannt und mit „Als Beleg auswerten“ weitergeführt', type: 'info', priority: 'should' },
        { text: 'Leerzustand, solange noch nichts erfasst wurde', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Unsicheres Wort antippen', result: 'Korrekturvorschlag wird übernommen', event: 'ocr.correct' },
        { trigger: 'Bearbeiten wählen', result: 'Text wird editierbar', event: 'ocr.edit' },
        { trigger: 'Kopieren antippen', result: 'Text in der Zwischenablage, Toast', event: 'ocr.copy' },
        { trigger: 'Als Notiz speichern antippen', result: 'Notiz mit Tag „OCR“ im Eingang angelegt', event: 'ocr.save-note' },
        { trigger: 'Teilen antippen', result: 'Dialog mit Teilen-Optionen', event: 'ocr.share' },
        { trigger: '„Als Beleg auswerten“', result: 'Beleg prüfen und buchen', event: 'ocr.receipt', to: 'picture-to-text.receipt' },
        { trigger: '„Als Visitenkarte“', result: 'Kontakt prüfen', event: 'ocr.card', to: 'picture-to-text.card' },
        { trigger: '„So lassen“', result: 'Wort bleibt, Markierung verschwindet', event: 'ocr.keep' },
      ],
      acceptance: ['Jede Korrektur ändert den Text sofort und senkt die Zahl unsicherer Stellen.', 'Der Assistent nennt „x von y“ und endet mit „Alle Stellen geprüft“.', 'Bei einem erkannten Beleg erscheint das Angebot „Als Beleg auswerten“.'],
      flows: [{ id: 'fl-check', name: 'Unsichere Stellen prüfen', steps: [{ featureId: 'picture-to-text.result', action: 'Markiertes Wort antippen' }, { featureId: 'picture-to-text.result', action: '„Als Notiz speichern“' }] }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { captures: W.captures, notes: W.notes },
      variants: [
        {
          id: 'A', name: 'Ergebnis im Fokus', direction: 'kompakt', concept: 'Bildvorschau und Text nebeneinander, darunter die Aktionen. Seitenspalte mit den letzten Erfassungen zum schnellen Wechsel.',
          description: '+ Direkter Vergleich Bild/Text  − Auf kleinen Geräten steht die Vorschau über dem Text',
          layout: { type: 'split' },
          blocks: [hdr({ eyebrow: 'Picture to Text', title: 'Ergebnis', primaryLabel: '' }), { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true, showConfidence: true, allowEdit: true } }, { id: 'hist', component: 'item-list', region: 'aside', bind: { items: 'captures' }, props: { title: 'Letzte Erfassungen', limit: 5, dense: true } }],
        },
        {
          id: 'B', name: 'Wort für Wort prüfen', direction: 'fokus', concept: 'Assistent durch alle unsicheren Stellen: ein Wort im Satz, Vorschlag übernehmen, so lassen oder selbst schreiben. Am Ende „Alle Stellen geprüft“ mit Kopieren und Notiz.',
          description: '+ Nichts wird übersehen, einhändig bedienbar  − Langsamer als Antippen im Text',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Prüfen', subtitle: 'Unsichere Stellen nacheinander', primaryLabel: '' }), { id: 'res', component: 'ocr-result', region: 'main', props: { layout: 'review', showImage: false } }],
        },
        {
          id: 'C', name: 'Großes Bild & Text', direction: 'visuell', concept: 'Bild oben groß, darunter der Text mit markierten Stellen; wenig Beiwerk. Gut zum Vergleichen auf Tablet.',
          description: '+ Original gut sichtbar  − Weniger Verlaufskontext',
          layout: { type: 'stack' },
          blocks: [hdr({ eyebrow: 'Picture to Text', title: 'Ergebnis', primaryLabel: '' }), { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true, showConfidence: true, allowEdit: false } }],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.receipt', 'picture-to-text.card', 'picture-to-text.history'],
      seedHistory: [{ kind: 'draft', note: 'Bild/Text-Vergleich' }, { kind: 'review', note: 'Zur Prüfung: Korrektur unsicherer Wörter' }],
    },
    // ------------------------------------------------------------------ Verlauf
    {
      id: 'picture-to-text.history', name: 'Verlauf', group: 'Verwalten', status: 'design', tier: 2,
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
      acceptance: ['Die Suche findet Wörter im erkannten Text, nicht nur im Titel.', 'Der Filter „Datei“ zeigt nur Erfassungen aus Dateien.'],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { captures: W.captures, notes: W.notes },
      variants: [
        {
          id: 'A', name: 'Liste + Ergebnis', direction: 'kompakt', concept: 'Seitenleiste mit Suche, Quellenfilter und Verlaufsliste; im Hauptbereich das Ergebnis der gewählten Erfassung.',
          description: '+ Schnell durchblättern  − Auf Mobile erst die Liste, nach dem Antippen das Ergebnis mit Zurück-Schritt',
          layout: { type: 'sidebar', panelLabel: 'Verlauf & Suche', masterDetail: true, backLabel: 'Zurück zum Verlauf' },
          blocks: [
            { id: 'flt', component: 'search-filter', region: 'panel', props: { placeholder: 'Erkannten Text suchen …', filters: SRC, layout: 'stacked' } },
            { id: 'hist', component: 'count-list', region: 'panel', bind: { items: 'captures' }, props: { title: 'Erfassungen', emptyTitle: 'Keine Erfassungen gefunden', emptyText: 'Wähle oben einen Weg, um den ersten Text zu erkennen.' } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true } },
          ],
        },
        {
          id: 'B', name: 'Galerie', direction: 'visuell', concept: 'Erfassungen als Karten mit Textvorschau und Konfidenz; das Ergebnis der gewählten Karte darunter.',
          description: '+ Erkennbar am Bild, einladend  − Weniger Einträge pro Bildschirm',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Picture to Text', title: 'Verlauf', primaryLabel: '' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Erkannten Text suchen …', filters: SRC } },
            { id: 'gal', component: 'card-grid', region: 'main', bind: { items: 'captures' }, props: { cover: true, minWidth: 220 } },
            { id: 'res', component: 'ocr-result', region: 'main', props: { showImage: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['picture-to-text.result'],
    },
    // ------------------------------------------------------------------ Export
    {
      id: 'picture-to-text.export', name: 'Export', group: 'Verwalten', status: 'analyzed', tier: 3,
      purpose: 'Erkannten Text als Notiz speichern, kopieren oder teilen.',
      requirements: [
        { text: 'Als Notiz speichern legt eine Notiz mit Titel und Tag „OCR“ im Eingang der Notizen an', type: 'action', priority: 'must' },
        { text: 'Kopieren mit Rückmeldung', type: 'action', priority: 'must' },
        { text: 'Teilen als Textdatei oder per E-Mail; Dokumente als PDF', type: 'action', priority: 'should' },
      ],
      interactions: [{ trigger: 'Als Notiz speichern', result: 'Notiz angelegt', event: 'ocr.save-note' }, { trigger: 'Kopieren', result: 'Text in Zwischenablage', event: 'ocr.copy' }, { trigger: 'Teilen', result: 'Teilen-Dialog', event: 'ocr.share' }],
      viewports: ['desktop', 'mobile'], demoData: { captures: W.captures, notes: W.notes },
    },
    {
      id: 'picture-to-text.multipage', name: 'Mehrseitige Dokumente', group: 'Erkennen', status: 'analyzed', tier: 3,
      purpose: 'Mehrere Seiten oder ein PDF in einem Durchgang erkennen. Wird vom Dokumenten-Scanner abgedeckt (Seitenstapel, PDF).',
      requirements: [
        { text: 'Mehrere Bilder zu einem Dokument bündeln, Seitenreihenfolge ändern (im Scanner umgesetzt)', type: 'action', priority: 'could' },
        { text: 'Vorhandene PDFs importieren und erkennen (offen)', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Weitere Seite hinzufügen', result: 'Seite wird angehängt', event: 'scan.capture', to: 'picture-to-text.scanner' }],
      viewports: ['mobile', 'tablet'], demoData: { captures: W.captures, samples: W.samples, notes: W.notes }, links: ['picture-to-text.scanner'],
    },
    {
      id: 'picture-to-text.settings', name: 'Einstellungen', group: 'Verwalten', status: 'not_analyzed', tier: 3,
      purpose: 'Erkennung lokal oder in der Cloud, Standardsprache, Aufbewahrung der Originalbilder.',
      requirements: [{ text: 'Auswahl lokal oder Cloud mit Erklärung zum Datenschutz (Entscheidung offen)', type: 'rule', priority: 'must' }, { text: 'Originalbilder nach X Tagen löschen', type: 'rule', priority: 'could' }],
      interactions: [], viewports: ['mobile', 'desktop'],
    },
  ],
  decisions: [
    { featureId: 'picture-to-text.result', title: 'Unsichere Wörter markieren oder automatisch korrigieren?', decision: 'Unsichere Wörter werden markiert und mit Vorschlag angeboten, nie stillschweigend geändert.',
      rationale: 'Bei Beträgen, Nummern und Namen ist eine falsche automatische Korrektur schlimmer als ein sichtbarer Zweifel. Das Antippen übernimmt den Vorschlag mit einem Klick.',
      tradeoffs: 'Etwas mehr Interaktion bei schlechten Scans; bei sehr vielen Zweifeln wirkt der Text unruhig.', status: 'decided' },
    { featureId: 'picture-to-text.receipt', title: 'Beleg: sofort buchen oder nur vorschlagen?', decision: 'Die Buchung wird vorgeschlagen und erst nach „Als Ausgabe buchen“ angelegt; Betrag, Datum und Händler sind prüfbar, Dubletten werden gemeldet.',
      rationale: 'Ein falsch erkannter Betrag in der Buchhaltung ist teurer als ein zusätzlicher Tipp. Die Dublettenprüfung schützt vor doppelten Ausgaben.', tradeoffs: 'Ein Tipp mehr pro Beleg; ein Schnellmodus für sichere Belege (Konfidenz ≥ 95 %) ist denkbar.', status: 'decided' },
    { featureId: 'picture-to-text.capture', title: 'Erkennung lokal auf dem Gerät oder in der Cloud?', decision: '', rationale: 'Quittungen und Verträge sind sensibel. Lokal schützt Daten, Cloud liefert oft bessere Qualität. Abhängig von der Engine des bestehenden TAKT.', status: 'open' },
    { featureId: 'picture-to-text.home', title: 'Welche Richtung für die Startseite?', decision: '', rationale: 'Kompakt (A) für viele Erfassungen, Visuell (B) mit Kacheln einladend, Fokus (C) führt mit einer Hauptaktion. Entscheiden nach Test, wie oft Belege gegenüber Text erkannt werden.', tradeoffs: 'A: Dichte. B: Platzbedarf. C: weniger Überblick.', status: 'open' },
    { featureId: 'picture-to-text.scanner', title: 'Eigener Scanner oder Systemscanner?', decision: '', rationale: 'Der Systemscanner (Android/iOS) liefert Kantenerkennung und Filter ohne Aufwand, ein eigener Scanner erlaubt durchgängiges Design und Offline-Kontrolle.', status: 'open' },
    { featureId: 'picture-to-text.receipt', title: 'Beleg visuell: Kategorie als Kacheln oder als Auswahlliste?', decision: '', rationale: 'Empfehlung: Kacheln (Variante C) mit Symbol für die sechs Standardkategorien, weil sie mit einem Tipp gewählt sind; bei vielen eigenen Kategorien wäre eine Auswahlliste (A, B) besser. Entscheiden, sobald die Kategorienliste in Finanzen feststeht.', tradeoffs: 'Kacheln brauchen mehr Fläche und tragen höchstens zehn Kategorien.', status: 'open' },
  ],
};
