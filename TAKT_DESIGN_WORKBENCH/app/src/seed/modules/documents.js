// Modul „Dokumente & Verträge“ – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Daten kommen aus der gemeinsamen Datenwelt (seed/world/documents.js, Eigentümer: documents): Dokumente, Ordner, Garantien, Steuerordner.
// Verträge werden aus Finanzen abgeleitet (Abos und Fristen); Kosten und Summen gehören Finanzen und werden hier nur gelesen.
// Belege (Picture to Text) und Geschäftsbuchungen erscheinen im Steuerordner nur als Verweis.

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const W = (k) => `@world:${k}`;
const demoData = { contracts: W('contracts'), warranties: W('warranties'), documents: W('documents'), folders: W('documentFolders'), tax: W('taxFolder'), receipts: W('receipts'), transactions: W('transactions') };
const only = (...keys) => Object.fromEntries(keys.map((k) => [k, demoData[k]]));
const bind = (...keys) => Object.fromEntries(keys.map((k) => [k, k]));
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Dokumente', primaryLabel: '', ...props } });
const blk = (id, component, region, props = {}, extra = {}) => ({ id, component, region, props, ...extra });
const LEGAL = (text = '', kind = 'keine-beratung', style = 'footnote') => blk('legal', 'legal-notice', 'footer', { kind, style, text });
const RULE_LEGAL = { text: 'Hinweis „keine Steuer- oder Rechtsberatung“ ist über legal-notice in jeder Variante sichtbar; die Kündigung ist eine Textvorlage, TAKT versendet nichts', type: 'rule', priority: 'must' };
const RULE_PRIVACY = { text: 'Privatmodus: Kosten und Preise erscheinen als „••••“ in gleicher Breite; sensible Dokumente (Ausweise) bleiben verdeckt, bis du „Anzeigen“ tippst', type: 'rule', priority: 'must' };
const RULE_OWNER = { text: 'Beträge und Kündigungsfristen der Verträge kommen aus Finanzen (Abos) und werden hier nie doppelt gepflegt', type: 'rule', priority: 'must' };

// ================================================================== Startseite
const home = {
  id: 'documents.home', name: 'Übersicht', group: 'Übersicht', status: 'review', tier: 1, usage: 'wöchentlich',
  purpose: 'Der Einstieg: sehen, was bald abläuft (Kündigungsfristen, Garantien, Ausweise, Steuerordner), Dokumente per Suche sofort finden und ohne Umweg etwas ablegen. Ruhig und vertrauenswürdig, ohne Rechtsberatung.',
  requirements: [
    { text: 'Fristen-Streifen mit Stufen: bis 3 Tage „Dringend“, bis 14 Tage „Bald“, bis 30 Tage „Im Blick“; Erinnerung 30, 14 und 3 Tage vorher', type: 'info', priority: 'must' },
    { text: 'Jede Frist zeigt Art (Kündigung, Garantie, Ablauf, Steuer), Datum, Tage und Kosten; Antippen öffnet das passende Detail', type: 'action', priority: 'must' },
    { text: 'Ordner mit Anzahl; Antippen öffnet die Dokumentliste, gefiltert auf den Ordner', type: 'info', priority: 'must' },
    { text: 'Zuletzt hinzugefügte Dokumente und eine Suche über Titel, Auszug und Tags (Umlaute egal)', type: 'info', priority: 'must' },
    { text: 'Ablegen ist von der Startseite mit einem Tipp erreichbar (Scanner aus Picture to Text)', type: 'action', priority: 'must' },
    RULE_OWNER, RULE_PRIVACY, RULE_LEGAL,
    { text: 'Zustände: Erststart (nichts abgelegt: „Dokument scannen“ als einzige Aktion), keine Fristen (ruhiger Hinweis), lädt, Fehler, offline (alles lokal nutzbar)', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Frist „Kündigung“ antippen', result: 'Vertrag mit Frist und Kündigungsvorlage öffnet sich', event: 'deadline.contract', to: 'documents.contract' },
    { trigger: 'Frist „Garantie“ antippen', result: 'Garantien öffnen sich, die Garantie ist markiert', event: 'deadline.warranty', to: 'documents.warranties' },
    { trigger: 'Frist „Ablauf“ antippen', result: 'Dokument mit Ablaufdatum öffnet sich', event: 'deadline.document', to: 'documents.detail' },
    { trigger: 'Frist „Steuerordner“ antippen', result: 'Steuerordner mit offenen Einträgen öffnet sich', event: 'deadline.tax', to: 'documents.tax-folder' },
    { trigger: 'Ordner antippen', result: 'Dokumentliste, gefiltert auf den Ordner', event: 'folder.open', to: 'documents.list' },
    { trigger: 'Dokument antippen', result: 'Dokumentansicht mit Vorschau und Metadaten', event: 'doc.open', to: 'documents.detail' },
    { trigger: '„Scannen“ antippen', result: 'Dokument ablegen öffnet sich', event: 'header.primary', to: 'documents.scan-in' },
    { trigger: '„Dokument scannen“ im Leerzustand', result: 'Dokument ablegen öffnet sich', event: 'scan.start', to: 'documents.scan-in' },
    { trigger: '„Verträge“ antippen', result: 'Alle Verträge mit Laufzeit und Frist', event: 'header.secondary', to: 'documents.contracts' },
    { trigger: '„Aufbewahrung und Sperre“ antippen', result: 'Einstellungen: Modulsperre, Speicherort, Aufbewahrung', event: 'module.settings', to: 'documents.settings' },
    { trigger: '„Alle Dokumente zeigen“ bei leerer Suche', result: 'Vollständige Dokumentliste', event: 'doc.search.all', to: 'documents.list' },
    { trigger: '„Kündigung vorbereiten“ in „Nächste Frist“', result: 'Textvorlage öffnet sich, es wird nichts versendet', event: 'contract.cancel' },
  ],
  acceptance: [
    'Die Fristen sind nach Tagen sortiert; Stufe und Tage sind auch ohne Farbe lesbar (Wort und Zahl).',
    'Am Referenztag stehen Steuerordner (2 Tage), Etikettendrucker (3), Kfz-Versicherung (6), FitX (9), Kaffeevollautomat (11) und Telekom (21) in dieser Reihenfolge.',
    'Kündigungsfristen und Kosten stimmen mit Finanzen überein (Kfz bis 30.11., FitX bis 03.12., Mobilfunk bis 15.12.).',
    'Die Suche „Versicherung“ findet das Dokument „HUK-Coburg: Police Kfz-Versicherung 2026“; „xyz“ zeigt „Keine Treffer“ mit „Alle Dokumente zeigen“.',
    'Im Privatmodus sind alle Beträge maskiert; auf 360 px gibt es keinen horizontalen Überlauf, Ziele sind mindestens 44 px hoch.',
    'Erststart: keine leeren Listen, genau eine Hauptaktion „Dokument scannen“.',
  ],
  flows: [
    { id: 'fl-frist', name: 'Frist prüfen und kündigen vorbereiten', steps: [{ featureId: 'documents.home', action: 'Frist „Kfz-Versicherung“ antippen' }, { featureId: 'documents.contract', action: '„Kündigung vorbereiten“, Text kopieren' }] },
    { id: 'fl-finden', name: 'Dokument finden', steps: [{ featureId: 'documents.home', action: '„Mietvertrag“ suchen' }, { featureId: 'documents.detail', action: 'Vorschau und Metadaten ansehen' }] },
  ],
  viewports: ALL_VP, demoData,
  variants: [
    {
      id: 'A', name: 'Fristen-Liste & Ordner', direction: 'kompakt',
      concept: 'Dichte Fristenzeilen mit Tage-Zähler, darunter die Suche mit „Zuletzt hinzugefügt“. Seitenspalte: Ordner als Liste mit Anzahl. Alles auf einen Blick, Zahlen exakt.',
      description: '+ Viele Fristen und Dokumente ohne Scrollen, schnelle Suche  − Dichte Zeilen, auf Mobile lang',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Dokumente', subtitle: 'Fristen, Verträge und Belege', primaryLabel: 'Scannen', primaryIcon: 'scan', secondaryLabel: 'Verträge', secondaryIcon: 'scroll-text' }),
        blk('dl', 'dok-deadlines', 'main', { title: 'Fristen', style: 'rows', limit: 6 }, { bind: bind('contracts', 'warranties', 'documents', 'tax', 'receipts', 'transactions') }),
        blk('recent', 'dok-list', 'main', { title: 'Zuletzt hinzugefügt', style: 'rows', controls: 'full', limit: 6, quietEmpty: true }, { bind: bind('documents', 'folders') }),
        blk('folders', 'dok-folders', 'aside', { title: 'Ordner', style: 'list' }, { bind: bind('folders', 'documents') }),
        LEGAL(),
      ],
    },
    {
      id: 'B', name: 'Fristen-Streifen & Kacheln', direction: 'visuell',
      concept: 'Ein Streifen großer Fristenkarten zum Wischen mit Tage-Zähler und Stufe, darunter die Ordner als Kacheln und die zuletzt hinzugefügten Dokumente als Karten mit Vorschau. Eine Botschaft pro Karte.',
      description: '+ Dringendes sofort sichtbar, ruhig und aufgeräumt  − Weniger Einträge pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Dokumente', subtitle: 'Was bald abläuft, und wo alles liegt', primaryLabel: 'Scannen', primaryIcon: 'scan', secondaryLabel: 'Verträge', secondaryIcon: 'scroll-text' }),
        blk('dl', 'dok-deadlines', 'main', { title: 'Fristen', style: 'strip' }, { bind: bind('contracts', 'warranties', 'documents', 'tax', 'receipts', 'transactions') }),
        blk('search', 'search-filter', 'main', { placeholder: 'Dokumente durchsuchen', filters: [], layout: 'inline' }),
        blk('folders', 'dok-folders', 'main', { title: 'Ordner', style: 'tiles' }, { bind: bind('folders', 'documents') }),
        blk('recent', 'dok-list', 'main', { title: 'Zuletzt hinzugefügt', style: 'cards', controls: 'none', limit: 4, quietEmpty: true }, { bind: bind('documents', 'folders') }),
        LEGAL(),
      ],
    },
    {
      id: 'C', name: 'Nächste Frist', direction: 'fokus',
      concept: 'Eine Frist zuerst: die nächste mit großem Tage-Zähler und der passenden Hauptaktion („Kündigung vorbereiten“). Danach die übrigen Fristen, die Suche und die Ordner als Chips. Wenig Ablenkung.',
      description: '+ Klare nächste Aktion, ruhig  − Weniger Überblick über alle Dokumente',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Frist im Blick', subtitle: 'Das Nächste zuerst', primaryLabel: 'Scannen', primaryIcon: 'scan', secondaryLabel: 'Alle Verträge', secondaryIcon: 'scroll-text' }),
        blk('dl', 'dok-deadlines', 'main', { title: 'Fristen', style: 'next', limit: 4 }, { bind: bind('contracts', 'warranties', 'documents', 'tax', 'receipts', 'transactions') }),
        blk('search', 'search-filter', 'main', { placeholder: 'Dokument suchen', filters: [], layout: 'inline' }),
        blk('folders', 'dok-folders', 'main', { title: 'Ordner', style: 'chips', showSettings: false }, { bind: bind('folders', 'documents') }),
        blk('recent', 'dok-list', 'main', { title: 'Zuletzt hinzugefügt', style: 'rows', controls: 'none', limit: 3, quietEmpty: true }, { bind: bind('documents', 'folders') }),
        LEGAL(),
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['documents.contracts', 'documents.contract', 'documents.list', 'documents.detail', 'documents.warranties', 'documents.tax-folder', 'documents.scan-in', 'documents.settings', 'home.today'],
};

// ================================================================== Verträge
const contracts = {
  id: 'documents.contracts', name: 'Verträge', group: 'Verträge', status: 'design', tier: 2, usage: 'monatlich',
  purpose: 'Alle Verträge und Abos mit Laufzeit, Kündigungsfrist, Kosten und Erinnerung auf einen Blick. „Kündigung vorbereiten“ liefert eine Textvorlage, versendet wird nichts.',
  requirements: [
    { text: 'Je Vertrag: Name, Art, Laufzeit, Kündigungsfrist mit Stufe, Kosten, Erinnerung (30/14/3) und „Kündigung vorbereiten“', type: 'info', priority: 'must' },
    { text: 'Verträge werden aus Finanzen (Abos) abgeleitet; Kosten und Fristen sind dort Eigentum und stimmen exakt überein', type: 'rule', priority: 'must' },
    { text: 'Kosten sind im Privatmodus maskiert, Erinnerung je Vertrag ein- und ausschaltbar', type: 'rule', priority: 'must' },
    { text: 'Filter: Alle, Mit Frist, Privat, Geschäft', type: 'action', priority: 'should' },
    { text: 'Nicht kündbare Verträge (Miete) bieten keine Vorlage und sagen warum', type: 'state', priority: 'should' },
    RULE_LEGAL,
  ],
  interactions: [
    { trigger: 'Vertrag antippen', result: 'Vertrag im Detail: Fristen, Dokumente, Kosten', event: 'contract.open', to: 'documents.contract' },
    { trigger: '„Kündigung vorbereiten“', result: 'Textvorlage zum Kopieren oder als Aufgabe, nichts wird gesendet', event: 'contract.cancel' },
    { trigger: 'Erinnerung umschalten', result: 'Erinnerung 30, 14 und 3 Tage vorher an oder aus', event: 'contract.reminder' },
    { trigger: '„Vertrag“ in der Kopfzeile', result: 'Dokument ablegen öffnet sich', event: 'header.primary', to: 'documents.scan-in' },
    { trigger: '„Vertrag scannen“ im Leerzustand', result: 'Dokument ablegen öffnet sich', event: 'scan.start', to: 'documents.scan-in' },
  ],
  acceptance: [
    'Kfz-Versicherung zeigt „bis Mo, 30.11.“ mit Stufe „Bald“, FitX „bis Do, 03.12.“, Telekom „bis Di, 15.12.“ mit „Im Blick“.',
    'Die Kosten je Vertrag stimmen mit den Abos in Finanzen überein und sind im Privatmodus maskiert.',
    'Die Textvorlage nennt Vertrag, Kundennummer und Kündigungstermin und weist aus, dass nichts gesendet wird.',
  ],
  flows: [{ id: 'fl-kuend', name: 'Kündigung vorbereiten', steps: [{ featureId: 'documents.contracts', action: '„Kündigung vorbereiten“ bei FitX' }, { featureId: 'documents.contracts', action: 'Als Aufgabe merken' }] }],
  viewports: ALL_VP, demoData: only('contracts'),
  variants: [
    {
      id: 'A', name: 'Tabelle', direction: 'kompakt', concept: 'Eine Zeile je Vertrag mit Frist, Kosten, Erinnerungsschalter und Aktion. Filterchips oben.',
      description: '+ Alle Verträge vergleichbar  − Auf Mobile wird die Zeile hoch',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Verträge', subtitle: 'Laufzeit, Frist und Kosten', primaryLabel: 'Vertrag', primaryIcon: 'scan' }), blk('list', 'dok-contracts', 'main', { style: 'table' }, { bind: bind('contracts') }),
        LEGAL('Die Textvorlage ist ein Entwurf und keine Rechtsberatung. Frist und Anschrift prüfst du im Vertrag.', 'keine-beratung', 'inline')],
    },
    {
      id: 'B', name: 'Karten mit Laufzeit', direction: 'visuell', concept: 'Eine Karte je Vertrag mit Laufzeit-Balken, Frist und Kosten. Aktion und Erinnerung am Kartenfuß.',
      description: '+ Laufzeit sofort sichtbar  − Weniger Verträge pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Verträge', subtitle: 'Wie weit sind sie gelaufen?', primaryLabel: 'Vertrag', primaryIcon: 'scan' }), blk('list', 'dok-contracts', 'main', { style: 'cards' }, { bind: bind('contracts') }),
        LEGAL('Die Textvorlage ist ein Entwurf und keine Rechtsberatung. Frist und Anschrift prüfst du im Vertrag.', 'keine-beratung', 'inline')],
    },
  ],
  selectedVariantId: 'A', links: ['documents.contract', 'documents.home', 'finance.subscriptions'],
};

const contract = {
  id: 'documents.contract', name: 'Vertrag', group: 'Verträge', status: 'design', tier: 2, usage: 'monatlich',
  purpose: 'Ein Vertrag im Detail: Kündigungsfrist mit Tage-Zähler und Erinnerung, Laufzeit, zugehörige Dokumente und die Verknüpfung zu den Kosten in Finanzen.',
  requirements: [
    { text: 'Frist mit Tage-Zähler, Stufe und Erinnerung 30/14/3; Vertragsende bei Kündigung zur Frist', type: 'info', priority: 'must' },
    { text: 'Kosten-Verknüpfung: „Kosten in Finanzen“ öffnet das Abo, dort liegen Betrag und Rhythmus', type: 'action', priority: 'must' },
    { text: 'Dokumente zum Vertrag (Police, Vertrag, Schreiben); ohne Dokument: Leerzustand mit „Dokument scannen“', type: 'state', priority: 'must' },
    { text: 'Aktion „Kündigung vorbereiten“ (Textvorlage, Kopieren, Aufgabe), nichts wird gesendet', type: 'action', priority: 'must' },
    { text: 'Vertrag wechseln ohne Zurück (Auswahl)', type: 'action', priority: 'could' },
    RULE_OWNER, RULE_PRIVACY, RULE_LEGAL,
  ],
  interactions: [
    { trigger: '„Kosten in Finanzen“', result: 'Abos und Fixkosten öffnen sich beim passenden Abo', event: 'cost.open', to: 'finance.subscriptions' },
    { trigger: 'Dokument antippen', result: 'Dokumentansicht', event: 'doc.open', to: 'documents.detail' },
    { trigger: '„Dokument scannen“', result: 'Dokument ablegen öffnet sich', event: 'scan.start', to: 'documents.scan-in' },
    { trigger: '„Kündigung vorbereiten“', result: 'Textvorlage öffnet sich', event: 'contract.cancel' },
    { trigger: 'Vertrag wechseln', result: 'Frist, Laufzeit und Dokumente zeigen den anderen Vertrag', event: 'contract.select' },
    { trigger: 'Erinnerung umschalten', result: 'Erinnerung an oder aus', event: 'contract.reminder' },
  ],
  acceptance: [
    'Kfz-Versicherung: „Kündigung bis Mo, 30.11.“, „in 6 Tagen, Vertragsende Do, 31.12.“, Stufe „Bald“.',
    '„Kosten in Finanzen“ führt zum Abo „Kfz-Versicherung“ in Finanzen; der Betrag steht nur dort und hier im Privatmodus maskiert.',
    'Ein Vertrag ohne Dokument (Netflix) zeigt einen Leerzustand mit genau einer Aktion.',
    'Die Vorlage lässt sich kopieren und als Aufgabe „Kündigung senden“ vor der Frist merken.',
  ],
  flows: [{ id: 'fl-kfz', name: 'Kfz-Frist ansehen', steps: [{ featureId: 'documents.contract', action: 'Frist und Police ansehen' }, { featureId: 'finance.subscriptions', action: 'Beitrag in Finanzen prüfen' }] }],
  viewports: ALL_VP, demoData: only('contracts', 'documents'),
  variants: [
    {
      id: 'A', name: 'Faktenblatt', direction: 'kompakt', concept: 'Frist-Kopf, daneben Laufzeit und Kosten, Dokumente in der zweiten Spalte, Aktionen darunter.',
      description: '+ Alles sichtbar  − Viele Blöcke', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Vertrag', subtitle: 'Frist, Dokumente, Kosten' }), blk('cd', 'dok-contract-detail', 'main', { style: 'facts' }, { bind: bind('contracts', 'documents') }), LEGAL('Die Textvorlage ist ein Entwurf und keine Rechtsberatung. Frist und Anschrift prüfst du im Vertrag.', 'keine-beratung', 'inline')],
    },
    {
      id: 'B', name: 'Frist zuerst', direction: 'fokus', concept: 'Die Frist mit Tage-Zähler steht oben, direkt darunter die Hauptaktion; Dokumente und Fakten folgen.',
      description: '+ Klare nächste Aktion  − Fakten erst beim Scrollen', layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Vertrag', subtitle: 'Das Wichtigste zuerst' }), blk('cd', 'dok-contract-detail', 'main', { style: 'focus' }, { bind: bind('contracts', 'documents') }), LEGAL('Die Textvorlage ist ein Entwurf und keine Rechtsberatung. Frist und Anschrift prüfst du im Vertrag.', 'keine-beratung', 'inline')],
    },
  ],
  selectedVariantId: 'B', links: ['documents.contracts', 'documents.detail', 'finance.subscriptions'],
};

// ================================================================== Dokumente
const list = {
  id: 'documents.list', name: 'Alle Dokumente', group: 'Dokumente', status: 'design', tier: 3, usage: 'wöchentlich',
  purpose: 'Alle Dokumente mit Suche und Filtern nach Ordner und Tags, neueste zuerst.',
  requirements: [
    { text: 'Suche über Titel, Auszug, Tags und Ordner (Umlaute egal)', type: 'action', priority: 'must' },
    { text: 'Filterchips für Ordner und häufige Tags; ein Ordner aus der Startseite ist vorgewählt', type: 'action', priority: 'must' },
    { text: 'Hinweis „bis 18.02.“ bei Dokumenten, die bald ablaufen; sensible Dokumente sind gekennzeichnet', type: 'info', priority: 'should' },
    { text: 'Leerzustand mit „Dokument scannen“; „Keine Treffer“ mit „Alle Dokumente zeigen“', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Dokument antippen', result: 'Dokumentansicht', event: 'doc.open', to: 'documents.detail' },
    { trigger: '„Dokument scannen“', result: 'Dokument ablegen öffnet sich', event: 'scan.start', to: 'documents.scan-in' },
    { trigger: '„Scannen“ in der Kopfzeile', result: 'Dokument ablegen öffnet sich', event: 'header.primary', to: 'documents.scan-in' },
  ],
  acceptance: ['Der Filter „Garantien“ zeigt genau die fünf Kaufbelege.', 'Die Suche „ausweis“ findet Personalausweis und Reisepass.', 'Ohne Treffer erscheint „Keine Treffer für …“ mit einer Aktion.'],
  viewports: ALL_VP, demoData: only('documents', 'folders'),
  variants: [
    { id: 'A', name: 'Liste mit Filtern', direction: 'kompakt', concept: 'Zeilen mit Suche und Filterchips, neueste zuerst.', description: '+ Schnell zu filtern  − Wenig Vorschau', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Dokumente', subtitle: 'Alle Dokumente', primaryLabel: 'Scannen', primaryIcon: 'scan' }), blk('list', 'dok-list', 'main', { title: 'Alle Dokumente', style: 'rows', controls: 'full' }, { bind: bind('documents', 'folders') }), LEGAL('', 'daten')] },
    { id: 'B', name: 'Karten mit Vorschau', direction: 'visuell', concept: 'Karten mit Vorschau-Attrappe, Suche und Filter oben.', description: '+ Wiedererkennen am Aussehen  − Mehr Platz je Dokument', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Dokumente', subtitle: 'Mit Vorschau', primaryLabel: 'Scannen', primaryIcon: 'scan' }), blk('list', 'dok-list', 'main', { title: 'Alle Dokumente', style: 'cards', controls: 'full' }, { bind: bind('documents', 'folders') }), LEGAL('', 'daten')] },
  ],
  selectedVariantId: 'A', links: ['documents.detail', 'documents.home', 'documents.scan-in'],
};

const detail = {
  id: 'documents.detail', name: 'Dokument', group: 'Dokumente', status: 'design', tier: 2, usage: 'wöchentlich',
  purpose: 'Ein Dokument ansehen: Vorschau (Platzhalter), Metadaten, Ablaufdatum mit Erinnerung und Verknüpfungen zu Vertrag, Garantie, Beleg und Termin.',
  requirements: [
    { text: 'Vorschau-Attrappe mit Seitenwechsel und Zoom; sensible Dokumente sind bis „Anzeigen“ verdeckt', type: 'info', priority: 'must' },
    { text: 'Metadaten: Ordner (wechselbar), Typ, Datum, Format, Quelle, Tags, Aufbewahrung', type: 'info', priority: 'must' },
    { text: 'Ablaufdatum mit Stufe und Erinnerung 30/14/3, bei „abgelaufen“ ruhig benannt', type: 'info', priority: 'must' },
    { text: 'Verknüpfungen: Vertrag, Garantie, Beleg, Termin; Antippen öffnet das Ziel', type: 'action', priority: 'should' },
    { text: 'Löschen mit „Rückgängig“ (30 Tage im Papierkorb), Teilen ist in der Demo simuliert', type: 'action', priority: 'should' },
  ],
  interactions: [
    { trigger: 'Verknüpfung „Vertrag“', result: 'Vertrag mit Frist öffnet sich', event: 'link.contract', to: 'documents.contract' },
    { trigger: 'Verknüpfung „Garantie“', result: 'Garantien öffnen sich', event: 'link.warranty', to: 'documents.warranties' },
    { trigger: 'Verknüpfung „Termin“', result: 'Termin-Detail im Kalender', event: 'link.event', to: 'calendar.event' },
    { trigger: 'Ordner wechseln', result: 'Dokument liegt im neuen Ordner', event: 'doc.move' },
    { trigger: 'Seite wechseln', result: 'Vorschau zeigt die andere Seite', event: 'doc.page' },
    { trigger: '„Löschen“', result: 'Dokument entfernt, „Rückgängig“ erscheint', event: 'doc.delete' },
  ],
  acceptance: ['Beim Reisepass steht „Gültig bis Do, 18.02.2027“ mit Stufe „Später“ und ein Hinweis auf die Japan-Reise.', 'Eine Police zeigt die Verknüpfung „Vertrag“, die zum Vertrag mit Frist führt.', 'Löschen bietet „Rückgängig“; danach ist das Dokument wieder da.'],
  viewports: ALL_VP, demoData: only('documents', 'folders', 'contracts', 'warranties'),
  variants: [
    { id: 'A', name: 'Vorschau & Metadaten', direction: 'kompakt', concept: 'Vorschau links, Metadaten und Verknüpfungen in der Seitenspalte.', description: '+ Beides zugleich  − Auf Mobile untereinander', layout: { type: 'split' },
      blocks: [hdr({ title: 'Dokument', subtitle: 'Vorschau und Details' }), blk('view', 'dok-viewer', 'main'), blk('meta', 'dok-meta', 'aside', {}, { bind: bind('documents', 'folders', 'contracts', 'warranties') }), blk('undo', 'undo-toast', 'footer', { placement: 'sticky', demo: false }), LEGAL('', 'daten')] },
    { id: 'B', name: 'Metadaten zuerst', direction: 'fokus', concept: 'Erst Ablauf, Details und Verknüpfungen, die Vorschau darunter.', description: '+ Das Wichtigste oben  − Vorschau erst beim Scrollen', layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Dokument', subtitle: 'Das Wichtigste zuerst' }), blk('meta', 'dok-meta', 'main', {}, { bind: bind('documents', 'folders', 'contracts', 'warranties') }), blk('view', 'dok-viewer', 'main'), blk('undo', 'undo-toast', 'footer', { placement: 'sticky', demo: false }), LEGAL('', 'daten')] },
  ],
  selectedVariantId: 'A', links: ['documents.list', 'documents.contract', 'documents.warranties'],
};

// ================================================================== Garantien, Steuer, Ablegen, Einstellungen
const warranties = {
  id: 'documents.warranties', name: 'Garantien', group: 'Dokumente', status: 'design', tier: 3, usage: 'selten',
  purpose: 'Garantien und Gewährleistung im Blick: Ende, Fortschritt und der Kaufbeleg dazu – damit kein Anspruch ungenutzt abläuft.',
  requirements: [
    { text: 'Je Eintrag: Gewährleistung (gesetzlich) und Herstellergarantie mit Ende und Tagen, Stufe ab 30 Tagen vor dem Ende', type: 'info', priority: 'must' },
    { text: 'Kaufbeleg verknüpft; ohne Beleg „Kaufbeleg hinzufügen“', type: 'action', priority: 'must' },
    { text: 'Filter: Alle, Aktiv, Läuft ab, Abgelaufen; Preise im Privatmodus maskiert', type: 'action', priority: 'should' },
    { text: 'Hinweis: gesetzliche Gewährleistung und Herstellergarantie sind verschieden; keine Rechtsberatung', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: '„Kaufbeleg öffnen“', result: 'Dokumentansicht des Kaufbelegs', event: 'receipt.open', to: 'documents.detail' },
    { trigger: '„Kaufbeleg hinzufügen“', result: 'Dokument ablegen öffnet sich', event: 'scan.start', to: 'documents.scan-in' },
  ],
  acceptance: ['Etikettendrucker steht oben mit „Dringend“ (Gewährleistung endet Fr, 27.11.), die Waschmaschine unten als „abgelaufen“.', 'Der Kaufbeleg lässt sich mit einem Tipp öffnen.'],
  viewports: ALL_VP, demoData: only('warranties', 'documents'),
  variants: [
    { id: 'A', name: 'Liste', direction: 'kompakt', concept: 'Zeilen mit Fortschrittsbalken und Enden, sortiert nach dem nächsten Ende.', description: '+ Dicht  − Wenig Raum', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Garantien', subtitle: 'Gewährleistung und Hersteller' }), blk('w', 'dok-warranties', 'main', { style: 'rows' }, { bind: bind('warranties', 'documents') }), LEGAL('Gesetzliche Gewährleistung und Herstellergarantie sind verschieden. Maßgeblich sind Kaufvertrag und Garantiebedingungen. Keine Rechtsberatung.', 'keine-beratung', 'inline')] },
    { id: 'B', name: 'Karten', direction: 'visuell', concept: 'Eine Karte je Gerät mit Balken und Stufe.', description: '+ Übersichtlich  − Weniger Einträge je Bildschirm', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Garantien', subtitle: 'Was noch gilt' }), blk('w', 'dok-warranties', 'main', { style: 'cards' }, { bind: bind('warranties', 'documents') }), LEGAL('Gesetzliche Gewährleistung und Herstellergarantie sind verschieden. Maßgeblich sind Kaufvertrag und Garantiebedingungen. Keine Rechtsberatung.', 'keine-beratung', 'inline')] },
  ],
  selectedVariantId: 'A', links: ['documents.detail', 'documents.home'],
};

const tax = {
  id: 'documents.tax-folder', name: 'Steuerordner 2026', group: 'Steuer', status: 'design', tier: 3, usage: 'selten',
  purpose: 'Belege, Geschäftsbuchungen und Bescheide für die Steuerberatung gesammelt, mit Stand „bereit/offen“ und Export als Simulation. Keine Steuerberatung.',
  requirements: [
    { text: 'Kategorien: Einnahmen, Betriebsausgaben, Anschaffungen, Versicherungen, Bescheide; Einträge sind Verweise auf Belege, Buchungen, Abos und Dokumente', type: 'info', priority: 'must' },
    { text: 'Je Eintrag Stand „bereit“ oder „offen“ (Beleg noch nicht gebucht, Nachweis fehlt); Zusammenfassung „x von y bereit“ und Frist zum Steuerberater-Termin', type: 'info', priority: 'must' },
    { text: 'Export für die Steuerberatung als Simulation: Format und Kategorien wählen, nichts wird erzeugt oder gesendet', type: 'action', priority: 'must' },
    { text: 'Belege und Buchungen bleiben bei Picture to Text und Finanzen (Eigentümer), hier nur Verweis', type: 'rule', priority: 'must' },
    { text: 'Hinweis „keine Steuerberatung“ über legal-notice; Aufbewahrungsrichtwerte nennen den Einzelfall nicht', type: 'rule', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Eintrag antippen', result: 'Beleg, Buchung, Abo, Dokument oder Aufgabe öffnet sich (Ziel je Eintrag)', event: 'tax.item.open' },
    { trigger: 'Termin der Kanzlei antippen', result: 'Termin-Detail im Kalender', event: 'advisor.open', to: 'calendar.event' },
    { trigger: '„Beleg scannen“ im Leerzustand', result: 'Dokument ablegen öffnet sich', event: 'scan.start', to: 'documents.scan-in' },
    { trigger: '„Export simulieren“', result: 'Hinweis mit Zahl der Dateien, nichts wird gesendet', event: 'tax.export' },
  ],
  acceptance: ['Am Referenztag sind 3 Einträge offen: zwei Belege nicht gebucht und „Belege Oktober“.', 'Der Export nennt die Zahl der bereiten Dateien und weist aus, dass nichts gesendet wurde.', 'Beträge stammen aus den Quellen und sind im Privatmodus maskiert.'],
  viewports: ALL_VP, demoData: { ...only('tax', 'documents', 'receipts', 'transactions', 'contracts'), events: W('events') },
  variants: [
    { id: 'A', name: 'Kategorien', direction: 'kompakt', concept: 'Aufklappbare Kategorien mit Einträgen und Status, darunter der Export.', description: '+ Alles prüfbar  − Viel Text', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Steuerordner 2026', subtitle: 'Für die Steuerberatung', eyebrow: 'Steuer' }), LEGAL('', 'keine-beratung', 'inline'), blk('tx', 'dok-tax-folder', 'main', { style: 'categories' }, { bind: { ...bind('tax', 'documents', 'receipts', 'transactions', 'contracts'), events: 'events' } })] },
    { id: 'B', name: 'Überblick', direction: 'visuell', concept: 'Fortschrittsring, Kategorien als Kacheln, geöffnete Kategorie darunter.', description: '+ Stand sofort klar  − Ein Tipp mehr bis zum Eintrag', layout: { type: 'stack' },
      blocks: [hdr({ title: 'Steuerordner 2026', subtitle: 'Wie weit bist du?', eyebrow: 'Steuer' }), LEGAL('', 'keine-beratung', 'inline'), blk('tx', 'dok-tax-folder', 'main', { style: 'overview' }, { bind: { ...bind('tax', 'documents', 'receipts', 'transactions', 'contracts'), events: 'events' } })] },
  ],
  selectedVariantId: 'A', links: ['documents.home', 'documents.detail', 'picture-to-text.receipt', 'finance.transaction'],
};

const scanIn = {
  id: 'documents.scan-in', name: 'Dokument ablegen', group: 'Dokumente', status: 'analyzed', tier: 3, usage: 'wöchentlich',
  purpose: 'Ein neues Dokument ablegen: Art wählen, Ordner vorschlagen, Scanner (Picture to Text) öffnen oder eine Datei ablegen.',
  requirements: [
    { text: 'Art wählen (Vertrag, Kaufbeleg, Rechnung, Bescheid, Ausweis) und passenden Ordner vorschlagen, änderbar', type: 'action', priority: 'must' },
    { text: '„Scanner öffnen“ führt zu Picture to Text (Dokumenten-Scanner)', type: 'action', priority: 'must' },
    { text: 'Datei ablegen legt das Dokument an; die Erkennung läuft lokal', type: 'info', priority: 'should' },
  ],
  interactions: [
    { trigger: '„Scanner öffnen“', result: 'Dokumenten-Scanner in Picture to Text', event: 'scan.open', to: 'picture-to-text.scanner' },
    { trigger: '„Gerade abgelegt“ oder „Dokument öffnen“ antippen', result: 'Dokumentansicht', event: 'doc.open', to: 'documents.detail' },
    { trigger: '„Garantie ansehen“ (nur bei Kaufbeleg)', result: 'Garantien öffnen sich, die neue Garantie ist markiert', event: 'doc.warranty', to: 'documents.warranties' },
  ],
  acceptance: ['„Scanner öffnen“ erreicht den Scanner mit einem Tipp.', 'Eine abgelegte Datei erscheint sofort in der Liste „Zuletzt hinzugefügt“.'],
  viewports: ['mobile', 'tablet', 'desktop'], demoData: only('documents', 'folders', 'warranties'),
  variants: [{ id: 'A', name: 'Art, Ordner, Scanner', direction: 'fokus', concept: 'Art-Karten, Ordnerwahl, ein Haupt-Button.', description: '+ Wenige Schritte  − Nur ein Dokument zur Zeit', layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Dokument ablegen', subtitle: 'Scannen oder Datei wählen' }), blk('in', 'dok-scan-in', 'main', {}, { bind: bind('documents', 'folders', 'warranties') }), LEGAL('', 'daten', 'inline')] }],
  selectedVariantId: 'A', links: ['picture-to-text.scanner', 'documents.home'],
};

const settings = {
  id: 'documents.settings', name: 'Einstellungen', group: 'Einstellungen', status: 'analyzed', tier: 3, usage: 'selten',
  purpose: 'Modulsperre, Speicherort lokal, Erinnerungen und Aufbewahrungsfristen je Ordner (Richtwerte).',
  requirements: [
    { text: 'Modulsperre empfohlen (Ausweise, Verträge); Schalter wirkt über die gemeinsamen Einstellungen', type: 'rule', priority: 'must' },
    { text: 'Speicherort: nur auf diesem Gerät; Erkennung und Vorschau lokal, offline voll nutzbar', type: 'info', priority: 'must' },
    { text: 'Aufbewahrung je Ordner als Richtwert, ohne Rechtsberatung', type: 'rule', priority: 'should' },
  ],
  interactions: [], viewports: ['mobile', 'tablet', 'desktop'], demoData: { prefs: W('prefs'), folders: W('documentFolders') },
  variants: [{ id: 'A', name: 'Liste', direction: 'kompakt', concept: 'Einstellungszeilen mit Schalter und Auswahl.', description: '+ Vertraut  − Wenig Erklärung', layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Einstellungen', subtitle: 'Sperre, Speicherort, Aufbewahrung' }), blk('set', 'dok-settings', 'main', {}, { bind: bind('prefs', 'folders') }), LEGAL('Aufbewahrungsfristen sind Richtwerte. Gesetzliche Fristen hängen vom Einzelfall ab, keine Rechtsberatung.', 'keine-beratung', 'inline')] }],
  selectedVariantId: 'A', links: ['documents.home'],
};

const reminders = {
  id: 'documents.reminders', name: 'Fristenkalender', group: 'Verträge', status: 'not_analyzed', tier: 3, usage: 'selten',
  purpose: 'Alle Fristen als Kalenderansicht und Erinnerungsregeln je Vertrag, Garantie und Dokument (30/14/3 Tage oder eigene Stufen).',
  requirements: [
    { text: 'Fristen erscheinen als Termine im Kalender (nur lesend)', type: 'info', priority: 'should' },
    { text: 'Erinnerungsstufen je Frist anpassen (offen: Standard 30/14/3 oder frei wählbar)', type: 'rule', priority: 'should' },
    { text: 'Keine zweite Mitteilung zu Kündigungsfristen, die Finanzen schon meldet', type: 'rule', priority: 'must' },
  ],
  interactions: [], viewports: ALL_VP, demoData: {}, variants: [], links: ['documents.home', 'calendar.home'],
};
const sharing = {
  id: 'documents.sharing', name: 'Teilen und Export', group: 'Dokumente', status: 'not_analyzed', tier: 3, usage: 'selten',
  purpose: 'Dokumente sicher teilen oder als Sammelmappe exportieren, ohne dass sie das Gerät unverschlüsselt verlassen.',
  requirements: [
    { text: 'Teilen einzelner Dokumente über das System-Teilen-Blatt', type: 'action', priority: 'should' },
    { text: 'Sammelmappe als PDF oder ZIP mit Inhaltsverzeichnis (siehe Steuerordner)', type: 'action', priority: 'could' },
    { text: 'Sensible Dokumente nur nach Entsperren teilen', type: 'rule', priority: 'must' },
  ],
  interactions: [], viewports: ALL_VP, demoData: {}, variants: [], links: ['documents.tax-folder'],
};

export default {
  module: {
    id: 'documents', name: 'Dokumente & Verträge', icon: 'folder', status: 'active', area: 'Wissen & Inhalte', theme: 'graphite', designVersion: '0.1', stage: 4, assumption: true, homeFeatureId: 'documents.home',
    dataSource: 'lokal (Dokumente auf dem Gerät); Verträge aus Finanzen abgeleitet; Belege aus Picture to Text', offline: 'lokal', lockRecommended: true,
    legal: 'Keine Steuerberatung (Steuerordner) und keine Rechtsberatung (Kündigungsvorlage, Gewährleistung)',
    description: 'Verträge mit Fristen im Griff, wichtige Dokumente sofort finden, Garantien nicht verpassen, Steuerbelege gesammelt – ruhig, vertrauenswürdig, ohne Rechtsberatung.',
    source: 'Auftrag 2026-11 (Bauplan 5.12, 5.13, Modulkatalog „documents“) – Annahme, in Phase 1 mit dem Modulregister abzugleichen',
    infoArchitecture: 'Einstieg „Übersicht“ (Fristen, Ordner, zuletzt hinzugefügt, Suche). Von dort: Frist → Vertrag, Garantie, Dokument oder Steuerordner; Ordner → Dokumentliste → Dokument; „Verträge“ → Vertrag → Kosten in Finanzen; „Scannen“ → Dokument ablegen → Scanner (Picture to Text). Einstellungen: Modulsperre, Speicherort, Aufbewahrung.',
    docs: [
      '## Leitidee',
      '- Ruhig und vertrauenswürdig: Fristen sind das Herz. Stufen 30, 14 und 3 Tage vorher, benannt mit Wort und Zahl, nie nur mit Farbe.',
      '- Eigentum: Fristen und Dokumente gehören documents. Laufende Kosten und Summen gehören Finanzen (`subscriptions`, `financeSubMeta`). `contracts` wird abgeleitet (Import, nur lesen), Beträge und Fristen werden nie doppelt gepflegt.',
      '- Belege (Picture to Text) und Geschäftsbuchungen (Finanzen) erscheinen im Steuerordner nur als Verweis.',
      '- Keine Rechts- oder Steuerberatung: Kündigung ist eine Textvorlage zum Kopieren oder als Aufgabe, der Export ist eine Simulation. Hinweis über `legal-notice`.',
      '- Mitteilungen: Kündigungsfristen meldet Finanzen schon (Kfz-Versicherung). Dokumente meldet nur Garantie- und Dokumentfristen (Gewährleistung, Steuerordner).',
      '- Lokal: Dokumente, Vorschau und Texterkennung bleiben auf dem Gerät; Modulsperre empfohlen.',
      '',
      '## Offene Fragen',
      '- Erinnerungen: feste Stufen 30/14/3 oder je Frist frei wählbar?',
      '- Erkennung von Fristen und Daten aus dem Scan: automatisch vorschlagen oder immer manuell bestätigen?',
      '- Modulsperre standardmäßig an? Gehört „documents“ zu den sensiblen Modulen in den Einstellungen?',
      '- Aufbewahrungsrichtwerte: nur Hinweis oder automatische Erinnerung zum Löschen?',
    ].join('\n'),
    links: ['finance', 'picture-to-text', 'calendar', 'tasks', 'home', 'settings', 'trading'],
  },
  features: [home, contracts, contract, list, detail, warranties, tax, scanIn, settings, reminders, sharing],
  decisions: [
    { featureId: 'documents.contract', title: 'Verträge aus Finanzen ableiten, Kosten nie doppelt pflegen', decision: 'documents leitet Verträge aus den Abos und Fristen der Finanzwelt ab und ergänzt nur eigene Metadaten (Anbieter, Kundennummer, Erinnerung). Kosten bleiben in Finanzen, „Kosten in Finanzen“ verlinkt dorthin.', rationale: 'Eine Wahrheit je Ding: Betrag und Kündigungsfrist dürfen nirgends abweichen. Der Test prüft die Übereinstimmung mit Finanzen.', tradeoffs: 'Neue Verträge entstehen zuerst in Finanzen; documents ergänzt sie danach. Ein Vertrag ohne Abo (z. B. Haftpflicht ohne Beitrag) braucht später einen eigenen Weg.', status: 'decided' },
    { featureId: 'documents.contracts', title: 'Kündigung ist eine Textvorlage, kein Versand', decision: 'TAKT erzeugt einen Entwurf zum Kopieren oder als Aufgabe. Es wird nichts versendet und nichts rechtlich zugesichert; Frist und Anschrift prüft die Person im Vertrag.', rationale: 'Vertrauen und Haftung: eine versendete Kündigung wäre Rechtsberatung und Fehlerquelle. Die Vorlage spart trotzdem den Großteil der Arbeit.', tradeoffs: 'Ein Schritt mehr (selbst senden). Ein Versand per E-Mail oder Brief wäre später eine eigene Entscheidung.', status: 'decided' },
    { featureId: 'documents.contracts', title: 'Erinnerung: feste Stufen 30/14/3 oder frei wählbar?', decision: '', rationale: 'Empfehlung: feste Stufen 30, 14 und 3 Tage vorher, je Vertrag ein- und ausschaltbar. Das ist einfach zu erklären und deckt die meisten Fristen ab. Freie Stufen sind ein späterer Ausbau.', tradeoffs: 'Feste Stufen: weniger Einstellungen, passt nicht zu jeder Frist. Freie Stufen: flexibel, aber mehr Bedienung und mehr Mitteilungen.', status: 'open' },
    { featureId: 'documents.settings', title: 'Modulsperre standardmäßig an?', decision: '', rationale: 'Empfehlung: an. Ausweise und Verträge sind sensibel. In den gemeinsamen Einstellungen ist „documents“ noch kein sensibles Modul (Wunsch an den Kern).', tradeoffs: 'An: mehr Schutz, ein Schritt mehr beim Öffnen. Aus: schneller, aber Ausweiskopien liegen offen.', status: 'open' },
    { featureId: 'documents.contracts', title: 'Finanzen: „Kündigung vormerken“ auf Dokumente verweisen?', decision: '', rationale: 'Finanzen bietet „Kündigung vormerken“ (nur Erinnerung), Dokumente bietet „Kündigung vorbereiten“ (Textvorlage und Aufgabe). Empfehlung: In Finanzen die Schaltfläche beibehalten und zusätzlich „Vorlage in Dokumente“ anbieten, die zu documents.contract führt. Fristen und Vorlagen gehören Dokumente, Kosten gehören Finanzen.', tradeoffs: 'Verweis: ein klarer Weg, aber ein Wechsel des Moduls. Beides getrennt lassen: weniger Wege, aber zwei ähnliche Schaltflächen.', status: 'open' },
    { featureId: 'documents.scan-in', title: 'Fristen aus dem Scan vorschlagen oder manuell eintragen?', decision: '', rationale: 'Empfehlung: vorschlagen und bestätigen lassen, nie still übernehmen (wie bei Beträgen in Picture to Text). Datum und Frist sind Haftungsthemen.', tradeoffs: 'Vorschlag: schneller, braucht gute lokale Erkennung. Manuell: sicher, aber mühsam.', status: 'open' },
  ],
};
