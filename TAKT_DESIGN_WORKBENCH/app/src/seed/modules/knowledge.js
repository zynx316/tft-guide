// Modul "Wissensdatenbank" – strukturierte Artikel in Bereichen und Kategorien (Annahme, in Phase 1 gegen Modulregister verifizieren)
const L = (...lines) => lines.join('\n');

const areas = [
  { id: 'Technik', name: 'Technik', icon: 'laptop', tone: 'accent' },
  { id: 'Arbeit & Prozesse', name: 'Arbeit & Prozesse', icon: 'briefcase', tone: 'warning' },
  { id: 'Persönlich', name: 'Persönlich', icon: 'heart-pulse', tone: 'success' },
];

const articles = [
  { id: 'kb1', area: 'Technik', category: 'Entwicklung', title: 'Git-Workflow im Team', author: 'Jana Weber', tags: ['Git', 'Team'], updated: '2026-11-20T10:15:00', related: ['kb2', 'kb4'],
    body: L('Dieser Leitfaden beschreibt, wie wir mit **Feature-Branches** arbeiten und Änderungen sauber in `main` bringen.', '', '## Grundregeln', '- `main` ist immer lauffähig und wird nie direkt bearbeitet', '- Jeder Branch hat ein Thema: `feat/<thema>` oder `fix/<thema>`', '- Commits sind klein und beschreiben das *Warum*', '', '> Hinweis: Direkte Pushes auf `main` sind per Branch-Schutz gesperrt.', '', '## Ablauf', '1. Branch vom aktuellen `main` anlegen', '2. Änderungen in kleinen Commits sichern', '3. Pull Request öffnen und Review anfordern', '4. Nach Freigabe per Squash-Merge zusammenführen', '', '```', 'git switch main && git pull', 'git switch -c feat/neues-modul', 'git push -u origin feat/neues-modul', '```', '', '## Häufige Fehler', '- Zu große Pull Requests – besser in Etappen aufteilen', '- Veraltete Branches nicht aufräumen', '', '> Warnung: Niemals `git push --force` auf geteilte Branches ausführen.') },
  { id: 'kb2', area: 'Technik', category: 'Entwicklung', title: 'Code-Review Checkliste', author: 'Jana Weber', tags: ['Qualität'], updated: '2026-11-14T14:30:00', related: ['kb1'],
    body: L('Eine gute Review dauert selten länger als **30 Minuten**. Diese Punkte decken das Wichtigste ab.', '', '## Vor dem Review', '- [ ] Beschreibung erklärt Ziel und Vorgehen', '- [ ] Tests laufen lokal durch', '- [ ] Keine unbeabsichtigten Dateien im Diff', '', '## Während des Reviews', '- Verständlichkeit vor Cleverness prüfen', '- Fehlerfälle und Leerzustände ansehen', '- Fragen stellen statt Befehle erteilen', '', '> Tipp: Lob ist erlaubt – ein kurzer Hinweis auf eine gute Lösung motiviert.') },
  { id: 'kb3', area: 'Technik', category: 'Betrieb', title: 'Backup-Strategie (3-2-1)', author: 'Markus Lange', tags: ['Sicherheit', 'Betrieb'], updated: '2026-11-12T09:00:00', related: ['kb4'],
    body: L('Die **3-2-1-Regel** schützt vor Datenverlust durch Defekt, Diebstahl und Fehlbedienung.', '', '## Die Regel', '- **3** Kopien aller wichtigen Daten', '- **2** verschiedene Speichermedien', '- **1** Kopie an einem anderen Ort', '', '## Unsere Umsetzung', '1. Laufende Daten auf dem Arbeitsgerät', '2. Nächtliche Sicherung auf das NAS', '3. Wöchentliche verschlüsselte Kopie in die Cloud', '', '> Wichtig: Ein Backup gilt erst als gut, wenn die Wiederherstellung getestet wurde.') },
  { id: 'kb4', area: 'Technik', category: 'Betrieb', title: 'Server-Wartung monatlich', author: 'Markus Lange', tags: ['Betrieb'], updated: '2026-10-28T16:45:00', related: ['kb3'],
    body: L('Kurzer Wartungsplan für den ersten Montag im Monat.', '', '## Checkliste', '- [x] Updates einspielen und Neustart planen', '- [x] Speicherplatz und Logs prüfen', '- [ ] Zertifikate auf Ablauf kontrollieren', '- [ ] Backup-Wiederherstellung stichprobenartig testen', '', '> Hinweis: Wartungsfenster vorher im Team-Kalender eintragen.') },
  { id: 'kb5', area: 'Arbeit & Prozesse', category: 'Vertrieb', title: 'Angebot erstellen – Schritt für Schritt', author: 'Jana Weber', tags: ['Angebot', 'Vertrieb'], updated: '2026-11-22T11:20:00', related: ['kb6', 'kb7'],
    body: L('Ein Angebot soll in unter 20 Minuten versendbar sein. Diese Struktur hat sich bewährt.', '', '## Vorbereitung', '- Anforderungen des Kunden aus dem Gespräch zusammenfassen', '- Preisliste und Rabattgrenzen prüfen', '', '## Aufbau des Angebots', '1. Kurzer Einstieg mit dem Kundenziel', '2. Leistungen als nummerierte Positionen', '3. Preis, Zahlungsziel und Gültigkeit', '4. Nächster Schritt mit konkretem Datum', '', '> Tipp: Angebote mit einem klaren nächsten Schritt werden doppelt so oft beantwortet.', '', '## Nach dem Versand', '- Nachfassen nach 3 Werktagen', '- Status im Vertriebsmodul pflegen') },
  { id: 'kb6', area: 'Arbeit & Prozesse', category: 'Vertrieb', title: 'Preisgestaltung auf Marktplätzen', author: 'Jana Weber', tags: ['Preise', 'Sales'], updated: '2026-11-17T13:10:00', related: ['kb5'],
    body: L('Marktplätze erheben Gebühren, die in den Preis einkalkuliert werden müssen.', '', '## Kalkulation', '- Einkaufspreis plus Versand und Verpackung', '- Plattformgebühr (Etsy ca. 6,5 %, Amazon je nach Kategorie)', '- Gewünschte Marge von mindestens 25 %', '', '## Beispiel', '```', 'Einkauf        12,00 €', 'Versand         4,50 €', 'Gebühren (8 %)  2,40 €', 'Marge (25 %)    7,20 €', 'Verkaufspreis  26,10 €', '```', '', '> Warnung: Gebühren ändern sich zum Jahreswechsel – Preise im Januar neu prüfen.') },
  { id: 'kb7', area: 'Arbeit & Prozesse', category: 'Meetings', title: 'Vorlage: Sprint-Review', author: 'Markus Lange', tags: ['Meeting'], updated: '2026-11-06T15:00:00', related: ['kb5'],
    body: L('Ein Sprint-Review dauert **45 Minuten** und folgt immer demselben Ablauf.', '', '## Agenda', '1. Ziel des Sprints (5 Min.)', '2. Demo der Ergebnisse (20 Min.)', '3. Feedback und offene Punkte (15 Min.)', '4. Ausblick auf den nächsten Sprint (5 Min.)', '', '> Hinweis: Entscheidungen direkt im Protokoll festhalten, nicht erst nachträglich.') },
  { id: 'kb8', area: 'Persönlich', category: 'Produktivität', title: 'Wochenplanung nach GTD', author: 'Ich', tags: ['Planung', 'GTD'], updated: '2026-11-23T20:30:00', related: ['kb9'],
    body: L('Jeden **Sonntagabend** zehn Minuten für die kommende Woche.', '', '## Schritte', '1. Posteingang leeren (Notizen, Mails, Zettel)', '2. Kalender der Woche durchgehen', '3. Drei wichtigste Ergebnisse der Woche festlegen', '4. Aufgaben den Tagen zuordnen', '', '## Wochenrückblick', '- Was lief gut?', '- Was hat Zeit gefressen?', '- Was lasse ich nächste Woche weg?', '', '> Tipp: Weniger als fünf Aufgaben pro Tag einplanen – der Rest ist Puffer.') },
  { id: 'kb9', area: 'Persönlich', category: 'Produktivität', title: 'Fokuszeit schützen', author: 'Ich', tags: ['Fokus'], updated: '2026-11-10T08:45:00', related: ['kb8'],
    body: L('Tiefe Arbeit braucht Blöcke ohne Unterbrechung.', '', '## Regeln', '- Zwei Fokusblöcke à 90 Minuten pro Tag, vormittags', '- Benachrichtigungen aus, Status auf „Fokus“', '- Pause von 15 Minuten nach jedem Block', '', '> Wichtig: Fokuszeit wird im Kalender wie ein Termin behandelt.') },
  { id: 'kb10', area: 'Persönlich', category: 'Gesundheit', title: 'Trainingsplan Grundlagen', author: 'Ich', tags: ['Fitness'], updated: '2026-11-08T18:00:00', related: ['kb8'],
    body: L('Drei Einheiten pro Woche, jeweils etwa 60 Minuten.', '', '## Wochenplan', '- Montag: Oberkörper', '- Mittwoch: Beine und Rumpf', '- Freitag: Ganzkörper und Mobilität', '', '## Progression', '1. Gewicht erst steigern, wenn alle Wiederholungen sauber gelingen', '2. Alle vier Wochen eine leichte Deload-Woche') },
  { id: 'kb11', area: 'Persönlich', category: 'Finanzen', title: 'Budget-Regel 50/30/20', author: 'Ich', tags: ['Budget'], updated: '2026-11-03T19:10:00', related: [],
    body: L('Eine einfache Faustregel für die monatliche Aufteilung des Nettoeinkommens.', '', '## Aufteilung', '- **50 %** Fixkosten (Miete, Versicherungen, Mobilität)', '- **30 %** Lebensstil (Essen, Freizeit, Reisen)', '- **20 %** Sparen und Vorsorge', '', '> Hinweis: Die Prozente sind ein Startpunkt – wichtiger ist, dass das Sparen automatisch passiert.') },
  { id: 'kb12', area: 'Persönlich', category: 'Gesundheit', title: 'Schlafroutine', author: 'Ich', tags: ['Gesundheit'], updated: '2026-10-25T21:00:00', related: ['kb9'],
    body: L('Gute Tage beginnen am Vorabend.', '', '## Routine', '- Feste Schlafenszeit um 22:30 Uhr', '- Bildschirme eine Stunde vorher aus', '- Zimmer kühl und dunkel halten') },
];

const toneOf = Object.fromEntries(areas.map((a) => [a.id, a]));
const strip = (s) => s.replace(/```[\s\S]*?```/g, '').split('\n').map((l) => l.replace(/^#{1,6}\s*|^\s*[-*]\s+(\[[ x]\]\s*)?|^\s*\d+\.\s+|^>\s*|[*`]/g, '').trim()).filter(Boolean).join(' · ');
const articleCards = articles.map((a) => ({ id: a.id, title: a.title, text: strip(a.body).slice(0, 140), tags: a.tags, icon: toneOf[a.area].icon, tone: toneOf[a.area].tone, category: a.area, meta: a.category }));
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });

export default {
  module: {
    id: 'knowledge', name: 'Wissensdatenbank', icon: 'library', status: 'concept', theme: 'graphite', designVersion: '0.1',
    description: 'Dauerhaftes Wissen in Bereichen, Kategorien und Artikeln – gut auffindbar, lesbar und leicht zu pflegen.',
    source: 'Annahme der Workbench – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Dreistufige Hierarchie: Bereich › Kategorie › Artikel. Navigation über Wissensbaum oder Karten-Einstieg, Volltextsuche über alles. Artikel zeigen Metadaten, Inhaltsverzeichnis (Desktop) und verwandte Artikel. Bearbeiten erfolgt im Artikel selbst (Markdown).',
    docs: L('**Annahmen**', '- Artikel sind Markdown; Hinweise entstehen über `> Hinweis:`, `> Tipp:`, `> Warnung:`.', '- Maximal drei Ebenen, damit die Navigation überschaubar bleibt.', '- Verwandte Artikel werden manuell verknüpft.', '', '**Offene Fragen**', '- Gibt es im bestehenden TAKT bereits Tags oder eine Volltextsuche über mehrere Module?', '- Sollen Notizen zu Wissensartikeln „befördert“ werden können?', '- Versionierung von Artikeln – nötig oder reicht „zuletzt geändert“?'),
    links: ['notes', 'picture-to-text', 'tasks'],
  },
  features: [
    {
      id: 'knowledge.browse', name: 'Wissensbaum & Navigation', group: 'Navigation', status: 'design',
      purpose: 'Das richtige Wissen schnell finden – entweder über die Struktur (Bereiche und Kategorien) oder über Suche und Karten.',
      requirements: [
        { text: 'Hierarchische Navigation Bereich › Kategorie › Artikel, auf- und zuklappbar', type: 'action', priority: 'must' },
        { text: 'Aktiver Artikel ist in der Navigation hervorgehoben und bleibt beim Klappen sichtbar', type: 'state', priority: 'must' },
        { text: 'Suche über Titel und Inhalt; Treffer werden im Baum aufgeklappt', type: 'action', priority: 'must' },
        { text: 'Artikelanzahl je Bereich und Kategorie sichtbar', type: 'info', priority: 'should' },
        { text: 'Leerzustand bei Suche ohne Treffer mit Hinweis auf den Suchbegriff', type: 'state', priority: 'must' },
        { text: 'Auf Mobile ist die Navigation einklappbar und mit Touch-Zielen ≥ 44 px bedienbar', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Bereich/Kategorie antippen', result: 'Ebene klappt auf oder zu', event: 'kb.toggle' },
        { trigger: 'Artikel im Baum antippen', result: 'Artikel öffnet rechts', event: 'kb.open' },
        { trigger: 'Karte antippen', result: 'Artikel öffnet darunter', event: 'card.open' },
        { trigger: 'Suchbegriff eingeben', result: 'Baum zeigt nur Treffer', event: 'search.input' },
        { trigger: 'Filterchip wählen (Bereich)', result: 'Karten zeigen nur den Bereich', event: 'filter.change' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData: { articles, areas, articleCards },
      variants: [
        {
          id: 'A', name: 'Baum + Artikel', concept: 'Klassische Dokumentations-Navigation: links Suche und Wissensbaum, rechts der gewählte Artikel mit Inhaltsverzeichnis. Struktur ist immer sichtbar.',
          description: '+ Orientierung durch Struktur, schnelles Blättern  − Auf Mobile verschwindet der Baum hinter einem Umschalter',
          layout: { type: 'sidebar', panelLabel: 'Wissensbaum' },
          blocks: [
            { id: 'flt', component: 'search-filter', region: 'panel', props: { placeholder: 'Wissen durchsuchen …', filters: [], layout: 'stacked' } },
            { id: 'tree', component: 'kb-tree', region: 'panel', props: { title: 'Wissensbasis' } },
            { id: 'art', component: 'kb-article', region: 'main', props: { showToc: true, editable: true } },
          ],
        },
        {
          id: 'B', name: 'Karten-Einstieg', concept: 'Einstieg über Themenkarten mit Bereichsfilter. Der gewählte Artikel erscheint direkt darunter – keine Baum-Navigation, dafür sofort Inhalt.',
          description: '+ Einladend, gut für Mobile, Entdecken statt Suchen  − Struktur (Kategorien) ist nur über Filter sichtbar',
          layout: { type: 'stack' },
          blocks: [
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Was möchtest du nachschlagen?', subtitle: '12 Artikel in 3 Bereichen', primaryLabel: 'Neuer Artikel', primaryEvent: 'kb.edit' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Artikel suchen …', filters: ['Alle', 'Technik', 'Arbeit & Prozesse', 'Persönlich'] } },
            { id: 'cards', component: 'card-grid', region: 'main', bind: { items: 'articleCards' }, props: { minWidth: 230, cover: true } },
            { id: 'art', component: 'kb-article', region: 'main', props: { autoSelectFirst: false, scrollOnSelect: true, showToc: false, placeholder: 'Wähle oben eine Karte, um den Artikel zu lesen.' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['knowledge.article'],
    },
    {
      id: 'knowledge.article', name: 'Artikelansicht & Bearbeiten', group: 'Artikel', status: 'review',
      purpose: 'Artikel angenehm lesen, schnell zu Abschnitten springen und bei Bedarf direkt korrigieren.',
      requirements: [
        { text: 'Markdown-Darstellung: Überschriften, Listen, Code, Hinweise (Info/Tipp/Warnung/Wichtig)', type: 'info', priority: 'must' },
        { text: 'Inhaltsverzeichnis auf Desktop mit Sprungmarken', type: 'action', priority: 'should' },
        { text: 'Metadaten: Bereich, Kategorie, Autor, letzte Änderung, Lesezeit, Tags', type: 'info', priority: 'must' },
        { text: 'Verwandte Artikel am Ende, Wechsel per Tipp', type: 'action', priority: 'should' },
        { text: 'Direkt bearbeiten (Markdown), Speichern aktualisiert das Änderungsdatum', type: 'action', priority: 'must' },
        { text: 'Lesezeichen setzen und entfernen', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Eintrag im Inhaltsverzeichnis antippen', result: 'Seite scrollt zum Abschnitt', event: 'kb.toc' },
        { trigger: 'Verwandten Artikel antippen', result: 'Artikel wechselt', event: 'kb.related' },
        { trigger: 'Stift antippen', result: 'Textbereich zum Bearbeiten erscheint', event: 'kb.edit' },
        { trigger: 'Speichern antippen', result: 'Änderungen übernommen, Toast „Artikel gespeichert“', event: 'kb.save' },
        { trigger: 'Lesezeichen antippen', result: 'Artikel wird gemerkt', event: 'kb.bookmark' },
      ],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { articles, areas },
      variants: [{
        id: 'A', name: 'Lesen mit Inhaltsverzeichnis', concept: 'Der Artikel füllt die Breite, rechts klebt ein Inhaltsverzeichnis (nur Desktop). Ein Hinweisbanner zeigt den Bearbeitungsstatus.',
        description: '+ Lesefluss, schneller Abschnittssprung  − Ohne Baum keine Navigation zwischen Themen (nur verwandte Artikel)',
        layout: { type: 'stack' },
        blocks: [
          hdr({ eyebrow: 'Wissensdatenbank', title: 'Artikel', primaryLabel: '' }),
          { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'Dieser Artikel wurde diese Woche aktualisiert', text: 'Änderungen sind direkt im Artikel möglich (Stift-Symbol).', dismissible: true } },
          { id: 'art', component: 'kb-article', region: 'main', props: { showToc: true, showRelated: true, editable: true } },
        ],
      }],
      selectedVariantId: 'A',
      seedHistory: [{ kind: 'draft', note: 'Lesen mit Inhaltsverzeichnis' }, { kind: 'review', note: 'Zur Prüfung: Bearbeiten im Artikel' }],
    },
    {
      id: 'knowledge.search', name: 'Suche', group: 'Navigation', status: 'analyzed',
      purpose: 'Über alle Artikel hinweg Begriffe finden, inklusive Tags und Treffer-Vorschau.',
      requirements: [
        { text: 'Volltextsuche mit Hervorhebung des Suchbegriffs im Auszug', type: 'action', priority: 'must' },
        { text: 'Filter nach Bereich und Tag', type: 'action', priority: 'should' },
        { text: 'Zuletzt gelesene Artikel als Einstieg bei leerem Suchfeld', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Suchbegriff eingeben', result: 'Trefferliste aktualisiert sich', event: 'search.input' }],
      viewports: ['desktop', 'mobile'],
      demoData: { articles, areas },
    },
    {
      id: 'knowledge.links', name: 'Verknüpfungen', group: 'Artikel', status: 'not_analyzed',
      purpose: 'Artikel miteinander und mit Notizen oder Aufgaben verknüpfen.',
      requirements: [
        { text: 'Verwandte Artikel manuell hinzufügen und entfernen', type: 'action', priority: 'should' },
        { text: 'Rückverweise („Wird erwähnt in …“) anzeigen', type: 'info', priority: 'could' },
      ],
      interactions: [{ trigger: 'Verwandten Artikel antippen', result: 'Artikel wechselt', event: 'kb.related' }],
      viewports: ['desktop', 'mobile'],
      demoData: { articles, areas },
    },
  ],
  decisions: [
    { featureId: 'knowledge.browse', title: 'Maximale Tiefe der Hierarchie', decision: 'Drei Ebenen: Bereich › Kategorie › Artikel.', rationale: 'Tiefere Bäume sind auf Mobile schwer bedienbar und verleiten dazu, Struktur statt Suche zu nutzen. Drei Ebenen decken persönliche und kleine Team-Wissensbasen ab.', tradeoffs: 'Sehr große Bestände brauchen zusätzlich Tags und Suche.', status: 'decided' },
    { featureId: 'knowledge.browse', title: 'Baum oder Karten als Standard-Einstieg?', decision: '', rationale: 'Der Baum gibt Orientierung für Wiederkehrer, Karten laden Einsteiger ein. Mit echten Nutzungsdaten (Suche vs. Navigation) entscheiden; ein Umschalter ist denkbar.', status: 'open' },
    { featureId: 'knowledge.article', title: 'Bearbeiten im Artikel oder eigener Editor-Bildschirm?', decision: '', rationale: 'Direktes Bearbeiten senkt die Hürde für kleine Korrekturen. Ein eigener Editor bietet Platz für Toolbar und Vorschau, wie im Notizen-Modul.', status: 'open' },
  ],
};
