// Modul "Wissensdatenbank" – strukturierte Artikel in Bereichen und Kategorien (Annahme, in Phase 1 gegen Modulregister verifizieren)

const L = (...lines) => lines.join('\n');

// Artikel und Bereiche liegen in der gemeinsamen Datenwelt (world/knowledge.js, Eigentümer: knowledge); Karten, Listen, Diagramm und Kennzahlen sind dort abgeleitet.
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });
const AREA_CHIPS = ['Alle', 'Technik', 'Arbeit & Prozesse', 'Persönlich'];
const demo = {
  articles: '@world:articles', areas: '@world:knowledgeAreas', articleCards: '@world:articleCards', articleItems: '@world:articleItems', recent: '@world:articleRecent',
  bookmarkItems: '@world:articleBookmarkItems', bookmarkCards: '@world:articleBookmarkCards', drafts: '@world:articleDrafts', areaChart: '@world:knowledgeAreaChart', metrics: '@world:knowledgeMetrics',
};
const worldEvents = { events: '@world:events' };

export default {
  module: {
    id: 'knowledge', name: 'Wissensdatenbank', icon: 'library', status: 'active', theme: 'graphite', designVersion: '0.3', homeFeatureId: 'knowledge.home',
    description: 'Dauerhaftes Wissen in Bereichen, Kategorien und Artikeln – gut auffindbar, lesbar und leicht zu pflegen.',
    source: 'Workbench V2 (Bauplan, Brainstorm „alltag“) – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Übersicht“ (weiterlesen, Lesezeichen, Entwürfe, Bereiche). Dreistufige Hierarchie Bereich › Kategorie › Artikel; Navigation über Wissensbaum oder Karten, Volltextsuche über alles. Artikel zeigen Metadaten, Inhaltsverzeichnis (Desktop) und verwandte Artikel; Bearbeiten erfolgt im Artikel (Markdown). Aktualität: Artikel, die länger als 21 Tage unverändert sind, erscheinen unter „Zu prüfen“.',
    docs: L('## Leitidee', '- Wissen ist nur nützlich, wenn man es im richtigen Moment findet: weiterlesen, Lesezeichen und „Passend zu heute“ bringen es zum Nutzer.', '- Artikel sind Markdown; Hinweise entstehen über `> Hinweis:`, `> Tipp:`, `> Warnung:`.', '- Maximal drei Ebenen, damit die Navigation überschaubar bleibt.', '', '## Verbindung zu anderen Modulen', '- Kalender: „Passend zu heute“ schlägt zum nächsten Termin einen Artikel vor (Stichwort und Tag).', '- Notizen: Notizen sollen sich zu Artikeln befördern lassen (offen).', '', '## Offene Fragen', '- Gibt es im bestehenden TAKT bereits Tags oder eine Volltextsuche über mehrere Module?', '- Versionierung von Artikeln – nötig oder reicht „zuletzt geändert“?', '', '## Bekannte Grenze der Vorschau', '- Artikel liegen im Modul (noch nicht in der gemeinsamen Datenwelt): Lesezeichen und Änderungen wirken innerhalb eines Screens.'),
    links: ['notes', 'picture-to-text', 'tasks', 'calendar'],
  },
  features: [
    // ------------------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'knowledge.home', name: 'Übersicht', group: 'Übersicht', status: 'design', tier: 2,
      purpose: 'Der Einstieg ins Wissen: dort weiterlesen, wo man aufgehört hat, Lesezeichen und Entwürfe im Blick, Bereiche zum Stöbern – und das Passende zum nächsten Termin.',
      requirements: [
        { text: 'Zuletzt gelesene Artikel mit Fortschritt; „Weiterlesen“ führt an die letzte Stelle (Artikel)', type: 'info', priority: 'must' },
        { text: 'Lesezeichen und Entwürfe sind ohne Suche erreichbar', type: 'info', priority: 'should' },
        { text: 'Bereiche mit Artikelzahl und Lesefortschritt; ein Tipp wechselt in die Navigation des Bereichs', type: 'action', priority: 'must' },
        { text: 'Suche über Titel und Inhalt direkt auf der Startseite', type: 'action', priority: 'must' },
        { text: '„Passend zu heute“: Artikel zum nächsten Termin aus dem Kalender', type: 'info', priority: 'should' },
        { text: '„Zu prüfen“: Artikel, die länger als 21 Tage unverändert sind, mit „Als aktuell markieren“', type: 'rule', priority: 'should' },
        { text: 'Leerzustand (erster Start): erster Artikel, Import-Hinweis; keine leeren Kacheln', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Artikel im Baum antippen', result: 'Artikel öffnet', event: 'kb.open', to: 'knowledge.article' },
        { trigger: 'Eintrag in „Zuletzt gelesen“ antippen', result: 'Artikel öffnet', event: 'item.open', to: 'knowledge.article' },
        { trigger: 'Lesezeichen-Karte antippen', result: 'Artikel öffnet', event: 'card.open', to: 'knowledge.article' },
        { trigger: 'Bereich antippen', result: 'Wissensbaum zeigt nur diesen Bereich', event: 'kb.area', to: 'knowledge.browse' },
        { trigger: '„Alle Artikel“', result: 'Navigation mit Baum und Suche', event: 'header.secondary', to: 'knowledge.browse' },
        { trigger: 'Kennzahl antippen', result: 'Navigation', event: 'metric.open', to: 'knowledge.browse' },
        { trigger: '„Als aktuell markieren“', result: 'Änderungsdatum wird heute, Eintrag verschwindet aus „Zu prüfen“', event: 'kb.review.done' },
        { trigger: 'Suchbegriff eingeben', result: 'Listen filtern live', event: 'search.input' },
      ],
      acceptance: [
        'Jede Variante führt mit höchstens einem Tipp zu einem Artikel.',
        '„Weiterlesen“ zeigt den Fortschritt in Prozent und die geschätzte Restzeit.',
        '„Als aktuell markieren“ entfernt den Artikel sofort aus „Zu prüfen“ und senkt die Kennzahl.',
        'Ein Tipp auf einen Bereich zeigt in der Navigation nur dessen Artikel.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf, Ziele sind mindestens 36 px hoch.',
      ],
      flows: [
        { id: 'fl-weiter', name: 'Weiterlesen', steps: [{ featureId: 'knowledge.home', action: '„Weiterlesen“ bei „Wochenplanung nach GTD“' }, { featureId: 'knowledge.article', action: 'Artikel lesen, verwandten Artikel öffnen' }] },
        { id: 'fl-bereich', name: 'Bereich durchsuchen', steps: [{ featureId: 'knowledge.home', action: 'Bereich „Technik“ antippen' }, { featureId: 'knowledge.browse', action: 'Kategorie aufklappen, Artikel wählen' }] },
      ],
      viewports: ALL_VP, demoData: { ...demo, ...worldEvents },
      variants: [
        {
          id: 'A', name: 'Listen & Baum', direction: 'kompakt', concept: 'Suche und Bereichsfilter oben, links die Listen „Zuletzt gelesen“, „Lesezeichen“ und „Entwürfe“, rechts der Wissensbaum zum direkten Springen.',
          description: '+ Alles ohne Umweg erreichbar, Zahlen exakt  − Viele Listen, auf Mobile lang',
          layout: { type: 'split' },
          blocks: [
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Übersicht', subtitle: 'Artikel, Entwürfe und Lesezeichen', primaryLabel: '', secondaryLabel: 'Alle Artikel', secondaryIcon: 'library' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Wissen durchsuchen …', filters: AREA_CHIPS } },
            { id: 'recent', component: 'count-list', region: 'main', bind: { items: 'recent' }, props: { title: 'Zuletzt gelesen', dense: true, limit: 5, emptyTitle: 'Noch nichts gelesen', emptyText: 'Gelesene Artikel erscheinen hier.' } },
            { id: 'marks', component: 'count-list', region: 'main', bind: { items: 'bookmarkItems' }, props: { title: 'Lesezeichen', dense: true, quietEmpty: true, emptyTitle: 'Keine Lesezeichen', emptyText: 'Markiere einen Artikel mit dem Lesezeichen.' } },
            { id: 'drafts', component: 'count-list', region: 'main', bind: { items: 'drafts' }, props: { title: 'Entwürfe', dense: true, quietEmpty: true, emptyTitle: 'Keine Entwürfe', emptyText: 'Angefangene Artikel erscheinen hier.' } },
            { id: 'tree', component: 'kb-tree', region: 'aside', props: { title: 'Wissensbasis' } },
          ],
        },
        {
          id: 'B', name: 'Bereiche & Lesezeichen', direction: 'visuell', concept: 'Große Bereichskarten mit Lesefortschritt, daneben „Weiterlesen“ und die Verteilung der Artikel als Ring, darunter die Lesezeichen als Karten. Eine Botschaft pro Karte.',
          description: '+ Einladend, Orientierung auf einen Blick  − Struktur unterhalb der Bereiche nur über den Tipp erreichbar',
          layout: { type: 'grid' },
          blocks: [
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Übersicht', subtitle: 'Was möchtest du nachschlagen?', primaryLabel: '', secondaryLabel: 'Alle Artikel', secondaryIcon: 'library' }),
            { id: 'areas', component: 'kb-areas', region: 'main', span: 12, props: { title: 'Bereiche' } },
            { id: 'resume', component: 'kb-next', region: 'main', span: 7, spanTablet: 12, props: { mode: 'resume' } },
            { id: 'ring', component: 'chart', region: 'main', span: 5, spanTablet: 12, bind: { series: 'areaChart' }, props: { title: 'Artikel nach Bereich', type: 'donut' } },
            { id: 'marks', component: 'card-grid', region: 'main', span: 12, bind: { items: 'bookmarkCards' }, props: { title: 'Lesezeichen', cover: true, minWidth: 220 } },
          ],
        },
        {
          id: 'C', name: 'Weiterlesen & Passendes', direction: 'fokus', concept: 'Eine Spalte nach Nutzen: weiterlesen, dann der Artikel zum nächsten Termin, dann was geprüft werden sollte; „Zuletzt gelesen“ als kurze Liste. Suche immer oben.',
          description: '+ Wissen kommt zum Nutzer, kaum Entscheidungen  − Wenig Überblick über die Struktur',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr({ title: 'Wissen', subtitle: 'Di, 24. November', primaryLabel: '', secondaryLabel: 'Alle Artikel', secondaryIcon: 'library' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Wissen durchsuchen …', filters: [], layout: 'stacked' } },
            { id: 'resume', component: 'kb-next', region: 'main', props: { mode: 'resume' } },
            { id: 'ctx', component: 'kb-next', region: 'main', bind: { events: 'events' }, props: { mode: 'context', quietEmpty: true } },
            { id: 'review', component: 'kb-next', region: 'main', props: { mode: 'review', limit: 2, quietEmpty: true } },
            { id: 'recent', component: 'count-list', region: 'main', bind: { items: 'recent' }, props: { title: 'Zuletzt gelesen', dense: true, limit: 3, quietEmpty: true, emptyTitle: 'Noch nichts gelesen', emptyText: 'Gelesene Artikel erscheinen hier.' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['knowledge.browse', 'knowledge.article', 'knowledge.review', 'home.today'],
    },
    // ------------------------------------------------------------------ Navigation
    {
      id: 'knowledge.browse', name: 'Wissensbaum & Navigation', group: 'Navigation', status: 'design', tier: 2,
      purpose: 'Das richtige Wissen schnell finden – entweder über die Struktur (Bereiche und Kategorien) oder über Suche und Karten.',
      requirements: [
        { text: 'Hierarchische Navigation Bereich › Kategorie › Artikel, auf- und zuklappbar', type: 'action', priority: 'must' },
        { text: 'Aktiver Artikel ist in der Navigation hervorgehoben und bleibt beim Klappen sichtbar', type: 'state', priority: 'must' },
        { text: 'Suche über Titel und Inhalt; Treffer werden im Baum aufgeklappt; Bereichsfilter per Chip', type: 'action', priority: 'must' },
        { text: 'Artikelanzahl je Bereich und Kategorie sichtbar', type: 'info', priority: 'should' },
        { text: 'Leerzustand bei Suche ohne Treffer mit Hinweis auf den Suchbegriff', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ist die Navigation einklappbar und mit Touch-Zielen ≥ 44 px bedienbar', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Bereich/Kategorie antippen', result: 'Ebene klappt auf oder zu', event: 'kb.toggle' },
        { trigger: 'Artikel im Baum antippen', result: 'Artikel öffnet rechts', event: 'kb.open' },
        { trigger: 'Karte antippen', result: 'Artikel öffnet darunter', event: 'card.open' },
        { trigger: 'Suchbegriff eingeben', result: 'Baum zeigt nur Treffer', event: 'search.input' },
        { trigger: 'Filterchip wählen (Bereich)', result: 'Baum/Karten zeigen nur den Bereich', event: 'filter.change' },
      ],
      acceptance: ['Der Filterchip „Technik“ blendet alle anderen Bereiche im Baum aus.', 'Eine Suche klappt alle Treffer im Baum auf.', 'Im Baum ist der aktive Artikel mit Balken markiert.'],
      flows: [{ id: 'fl-bereich', name: 'Im Bereich stöbern', steps: [{ featureId: 'knowledge.browse', action: 'Bereich „Arbeit & Prozesse“ wählen' }, { featureId: 'knowledge.browse', action: 'Kategorie „Vertrieb“ öffnen, Artikel antippen' }] }],
      viewports: ALL_VP, demoData: demo,
      variants: [
        {
          id: 'A', name: 'Baum + Artikel', direction: 'kompakt', concept: 'Klassische Dokumentations-Navigation: links Suche, Bereichsfilter und Wissensbaum, rechts der gewählte Artikel mit Inhaltsverzeichnis. Struktur ist immer sichtbar.',
          description: '+ Orientierung durch Struktur, schnelles Blättern  − Auf Mobile verschwindet der Baum hinter einem Umschalter',
          layout: { type: 'sidebar', panelLabel: 'Wissensbaum', panelOpen: true },
          blocks: [
            { id: 'flt', component: 'search-filter', region: 'panel', props: { placeholder: 'Wissen durchsuchen …', filters: AREA_CHIPS, layout: 'stacked' } },
            { id: 'tree', component: 'kb-tree', region: 'panel', props: { title: 'Wissensbasis' } },
            { id: 'art', component: 'kb-article', region: 'main', props: { showToc: true, editable: true } },
          ],
        },
        {
          id: 'B', name: 'Karten-Einstieg', direction: 'visuell', concept: 'Einstieg über Themenkarten mit Bereichsfilter. Der gewählte Artikel erscheint direkt darunter – keine Baum-Navigation, dafür sofort Inhalt.',
          description: '+ Einladend, gut für Mobile, Entdecken statt Suchen  − Struktur (Kategorien) ist nur über Filter sichtbar',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Was möchtest du nachschlagen?', subtitle: 'Suchen oder nach Bereich stöbern', primaryLabel: '' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Artikel suchen …', filters: AREA_CHIPS } },
            { id: 'cards', component: 'card-grid', region: 'main', bind: { items: 'articleCards' }, props: { minWidth: 230, cover: true } },
            { id: 'art', component: 'kb-article', region: 'main', props: { autoSelectFirst: false, scrollOnSelect: true, showToc: false, placeholder: 'Wähle oben eine Karte, um den Artikel zu lesen.' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['knowledge.article', 'knowledge.home'],
    },
    // ------------------------------------------------------------------ Artikel
    {
      id: 'knowledge.article', name: 'Artikelansicht & Bearbeiten', group: 'Artikel', status: 'review', tier: 1,
      purpose: 'Artikel angenehm lesen, schnell zu Abschnitten springen und bei Bedarf direkt korrigieren.',
      requirements: [
        { text: 'Markdown-Darstellung: Überschriften, Listen, Code, Hinweise (Info/Tipp/Warnung/Wichtig)', type: 'info', priority: 'must' },
        { text: 'Inhaltsverzeichnis auf Desktop mit Sprungmarken', type: 'action', priority: 'should' },
        { text: 'Metadaten: Bereich, Kategorie, Autor, letzte Änderung, Lesezeit, Tags', type: 'info', priority: 'must' },
        { text: 'Verwandte Artikel am Ende, Wechsel per Tipp (Zurück führt zum vorigen Artikel)', type: 'action', priority: 'should' },
        { text: 'Direkt bearbeiten (Markdown), Speichern aktualisiert das Änderungsdatum', type: 'action', priority: 'must' },
        { text: 'Lesezeichen setzen und entfernen', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Eintrag im Inhaltsverzeichnis antippen', result: 'Seite scrollt zum Abschnitt', event: 'kb.toc' },
        { trigger: 'Verwandten Artikel antippen', result: 'Artikel wechselt, Zurück führt zurück', event: 'kb.related', to: 'knowledge.article' },
        { trigger: 'Stift antippen', result: 'Textbereich zum Bearbeiten erscheint', event: 'kb.edit' },
        { trigger: 'Speichern antippen', result: 'Änderungen übernommen, Toast „Artikel gespeichert“', event: 'kb.save' },
        { trigger: 'Lesezeichen antippen', result: 'Artikel wird gemerkt', event: 'kb.bookmark' },
      ],
      acceptance: ['Speichern setzt „Aktualisiert“ auf heute und zeigt „Artikel gespeichert“.', 'Ein verwandter Artikel öffnet sich in einem neuen Schritt, Zurück zeigt den vorigen.', 'Hinweisblöcke zeigen ihre Art auch ohne Farbe (Beschriftung „Hinweis:“, „Tipp:“).'],
      flows: [{ id: 'fl-lesen', name: 'Artikel lesen und vertiefen', steps: [{ featureId: 'knowledge.article', action: 'Inhaltsverzeichnis nutzen, zum Abschnitt springen' }, { featureId: 'knowledge.article', action: 'Verwandten Artikel antippen' }, { featureId: 'knowledge.article', action: 'Zurück zeigt den vorigen Artikel' }] }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { articles: '@world:articles', areas: '@world:knowledgeAreas' },
      variants: [
        {
          id: 'A', name: 'Lesen mit Inhaltsverzeichnis', direction: 'kompakt', concept: 'Der Artikel füllt die Breite, rechts klebt ein Inhaltsverzeichnis (nur Desktop). Ein Hinweisbanner zeigt den Bearbeitungsstatus.',
          description: '+ Lesefluss, schneller Abschnittssprung  − Ohne Baum keine Navigation zwischen Themen (nur verwandte Artikel)',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Artikel', primaryLabel: '' }),
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Dieser Artikel wurde diese Woche aktualisiert', text: 'Änderungen sind direkt im Artikel möglich (Stift-Symbol).', dismissible: true } },
            { id: 'art', component: 'kb-article', region: 'main', props: { showToc: true, showRelated: true, editable: true } },
          ],
        },
        {
          id: 'B', name: 'Ruhige Leseansicht', direction: 'fokus', concept: 'Schmale Textspalte mit großer Schrift, ohne Inhaltsverzeichnis und ohne Banner; darunter „Weiterlesen“ und verwandte Artikel. Gedacht für das Handy.',
          description: '+ Beste Lesbarkeit, kaum Ablenkung  − Kein Inhaltsverzeichnis',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'art', component: 'kb-article', region: 'main', props: { reading: true, showToc: false, showRelated: true, editable: false } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['knowledge.browse'],
      seedHistory: [{ kind: 'draft', note: 'Lesen mit Inhaltsverzeichnis' }, { kind: 'review', note: 'Zur Prüfung: Bearbeiten im Artikel' }],
    },
    // ------------------------------------------------------------------ Suche
    {
      id: 'knowledge.search', name: 'Suche', group: 'Navigation', status: 'design', tier: 2,
      purpose: 'Über alle Artikel hinweg Begriffe finden, inklusive Tags und Treffer-Vorschau.',
      requirements: [
        { text: 'Volltextsuche mit Auszug zu jedem Treffer', type: 'action', priority: 'must' },
        { text: 'Filter nach Bereich', type: 'action', priority: 'should' },
        { text: 'Zuletzt gelesene Artikel als Einstieg bei leerem Suchfeld', type: 'info', priority: 'could' },
        { text: 'Keine Treffer: Suchbegriff nennen und „Neuer Artikel“ anbieten', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Suchbegriff eingeben', result: 'Trefferliste aktualisiert sich', event: 'search.input' },
        { trigger: 'Treffer antippen', result: 'Artikel öffnet', event: 'item.open', to: 'knowledge.article' },
        { trigger: 'Treffer-Karte antippen', result: 'Artikel öffnet', event: 'card.open', to: 'knowledge.article' },
      ],
      acceptance: ['Die Trefferliste reagiert ohne Verzögerung auf jede Eingabe.', 'Jeder Treffer zeigt einen Auszug aus dem Text.'],
      viewports: ['desktop', 'mobile'],
      demoData: { articleItems: '@world:articleItems', articleCards: '@world:articleCards' },
      variants: [
        {
          id: 'A', name: 'Trefferliste', direction: 'kompakt', concept: 'Suchfeld und Bereichschips oben, darunter eine dichte Liste mit Titel, Auszug und Bereich.',
          description: '+ Schnell, viele Treffer pro Bildschirm  − Wenig Kontext',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr({ title: 'Wissen durchsuchen', primaryLabel: '' }), { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Suchbegriff …', filters: AREA_CHIPS, layout: 'stacked' } }, { id: 'res', component: 'item-list', region: 'main', bind: { items: 'articleItems' }, props: { title: 'Treffer', emptyTitle: 'Keine Artikel gefunden' } }],
        },
        {
          id: 'B', name: 'Treffer als Karten', direction: 'visuell', concept: 'Treffer als Themenkarten mit Bereichsfarbe, Auszug und Tags.',
          description: '+ Erkennbar am Bild  − Weniger Treffer pro Bildschirm',
          layout: { type: 'stack' },
          blocks: [hdr({ title: 'Wissen durchsuchen', primaryLabel: '' }), { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Suchbegriff …', filters: AREA_CHIPS } }, { id: 'res', component: 'card-grid', region: 'main', bind: { items: 'articleCards' }, props: { cover: true, minWidth: 230 } }],
        },
      ],
      selectedVariantId: 'A',
      links: ['knowledge.article'],
    },
    // ------------------------------------------------------------------ Aktualität
    {
      id: 'knowledge.review', name: 'Aktualität prüfen', group: 'Pflege', status: 'design', tier: 2,
      purpose: 'Artikel, die lange nicht angefasst wurden, regelmäßig prüfen, damit das Wissen verlässlich bleibt.',
      requirements: [
        { text: 'Liste der Artikel, die älter als 21 Tage sind, mit Alter in Tagen', type: 'info', priority: 'must' },
        { text: '„Prüfen“ öffnet den Artikel, „Als aktuell markieren“ setzt das Änderungsdatum auf heute', type: 'action', priority: 'must' },
        { text: 'Leerzustand „Alles aktuell“ ist ein ruhiger Erfolgszustand', type: 'state', priority: 'must' },
        { text: 'Schwelle (Tage) ist einstellbar (offen)', type: 'rule', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Prüfen antippen', result: 'Artikel öffnet', event: 'kb.open', to: 'knowledge.article' },
        { trigger: 'Als aktuell markieren', result: 'Artikel verlässt die Liste', event: 'kb.review.done' },
      ],
      acceptance: ['Nach „Als aktuell markieren“ verschwindet der Eintrag sofort, ein Hinweis bestätigt.', 'Sind alle Artikel aktuell, erscheint „Alles aktuell“.'],
      viewports: ['desktop', 'mobile'],
      demoData: { articles: '@world:articles' },
      variants: [{
        id: 'A', name: 'Prüfliste', direction: 'kompakt', concept: 'Älteste Artikel zuerst, je Zeile Alter, „Prüfen“ und ein Haken zum schnellen Bestätigen.',
        description: '+ Schnell abgearbeitet  − Kein Überblick über alle Artikel',
        layout: { type: 'stack', narrow: true },
        blocks: [hdr({ title: 'Aktualität prüfen', subtitle: 'Artikel ohne Änderung seit 21 Tagen', primaryLabel: '' }), { id: 'rev', component: 'kb-next', region: 'main', props: { mode: 'review', title: 'Zu prüfen', limit: 0 } }],
      }],
      selectedVariantId: 'A',
      links: ['knowledge.article'],
    },
    // ------------------------------------------------------------------ Skelette
    {
      id: 'knowledge.links', name: 'Verknüpfungen', group: 'Artikel', status: 'analyzed', tier: 3,
      purpose: 'Artikel miteinander und mit Notizen oder Aufgaben verknüpfen.',
      requirements: [
        { text: 'Verwandte Artikel manuell hinzufügen und entfernen', type: 'action', priority: 'should' },
        { text: 'Rückverweise („Wird erwähnt in …“) anzeigen', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Verwandten Artikel antippen', result: 'Artikel wechselt', event: 'kb.related' }],
      viewports: ['desktop', 'mobile'], demoData: { articles: '@world:articles', areas: '@world:knowledgeAreas' },
    },
    {
      id: 'knowledge.inbox', name: 'Leseliste', group: 'Pflege', status: 'not_analyzed', tier: 3,
      purpose: 'Links und Texte aus dem Teilen-Menü sammeln und später lesen oder in einen Artikel überführen.',
      requirements: [{ text: 'Link oder Text per Teilen-Menü speichern, Lesestatus, Hervorhebungen', type: 'action', priority: 'could' }, { text: 'Aus der Leseliste einen Artikel anlegen', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['mobile'], demoData: { articles: '@world:articles' },
    },
    {
      id: 'knowledge.sources', name: 'Quellen & Verlauf', group: 'Pflege', status: 'not_analyzed', tier: 3,
      purpose: 'Quellenangaben je Artikel und Versionsverlauf mit Wiederherstellen.',
      requirements: [{ text: 'Quellen mit Link, Prüfung auf tote Links', type: 'info', priority: 'could' }, { text: 'Frühere Stände ansehen und wiederherstellen', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop'], demoData: { articles: '@world:articles' },
    },
    {
      id: 'knowledge.import', name: 'Import', group: 'Pflege', status: 'not_analyzed', tier: 3,
      purpose: 'Markdown-Dateien importieren und Notizen in Artikel umwandeln.',
      requirements: [{ text: 'Markdown-Ordner importieren, Notiz in Artikel umwandeln', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop'], demoData: { articles: '@world:articles' },
    },
  ],
  decisions: [
    { featureId: 'knowledge.browse', title: 'Maximale Tiefe der Hierarchie', decision: 'Drei Ebenen: Bereich › Kategorie › Artikel.', rationale: 'Tiefere Bäume sind auf Mobile schwer bedienbar und verleiten dazu, Struktur statt Suche zu nutzen. Drei Ebenen decken persönliche und kleine Team-Wissensbasen ab.', tradeoffs: 'Sehr große Bestände brauchen zusätzlich Tags und Suche.', status: 'decided' },
    { featureId: 'knowledge.browse', title: 'Baum oder Karten als Standard-Einstieg?', decision: '', rationale: 'Der Baum gibt Orientierung für Wiederkehrer, Karten laden Einsteiger ein. Mit echten Nutzungsdaten (Suche vs. Navigation) entscheiden; ein Umschalter ist denkbar.', status: 'open' },
    { featureId: 'knowledge.article', title: 'Bearbeiten im Artikel oder eigener Editor-Bildschirm?', decision: '', rationale: 'Direktes Bearbeiten senkt die Hürde für kleine Korrekturen. Ein eigener Editor bietet Platz für Toolbar und Vorschau, wie im Notizen-Modul.', status: 'open' },
    { featureId: 'knowledge.home', title: 'Startseite: Struktur oder „Weiterlesen“ zuerst?', decision: '', rationale: 'Kompakt (A) zeigt Listen und Baum, Visuell (B) Bereiche, Fokus (C) beginnt mit dem nächsten Nutzen. Entscheidung nach Test mit 30+ Artikeln und echtem Leseverhalten.', tradeoffs: 'A: viel Information. B: Struktur ohne Tiefe. C: wenig Überblick, dafür sofort nützlich.', status: 'open' },
    { featureId: 'knowledge.review', title: 'Aktualität: feste Schwelle von 21 Tagen', decision: 'Artikel erscheinen unter „Zu prüfen“, wenn sie länger als 21 Tage unverändert sind; „Als aktuell markieren“ genügt ohne Änderung des Textes.', rationale: 'Eine einfache Regel ist erklärbar. Der Haken bestätigt „gelesen und weiterhin richtig“, ohne zum Bearbeiten zu zwingen.', tradeoffs: 'Zeitlose Artikel (z. B. Faustregeln) werden unnötig markiert; eine Schwelle je Artikel ist später denkbar.', status: 'decided' },
  ],
};
