// Modul "Wissensdatenbank" – strukturierte Artikel in Bereichen und Kategorien (Annahme, in Phase 1 gegen Modulregister verifizieren)
const L = (...lines) => lines.join('\n');

const areas = [
  { id: 'Technik', name: 'Technik', icon: 'laptop', tone: 'accent' },
  { id: 'Arbeit & Prozesse', name: 'Arbeit & Prozesse', icon: 'briefcase', tone: 'warning' },
  { id: 'Persönlich', name: 'Persönlich', icon: 'heart-pulse', tone: 'success' },
];

const articles = [
  { id: 'kb1', bookmarked: true, lastRead: '2026-11-22T16:20:00', readProgress: 1, area: 'Technik', category: 'Entwicklung', title: 'Git-Workflow im Team', author: 'Jana Weber', tags: ['Git', 'Team'], updated: '2026-11-20T10:15:00', related: ['kb2', 'kb4'],
    body: L('Dieser Leitfaden beschreibt, wie wir mit **Feature-Branches** arbeiten und Änderungen sauber in `main` bringen.', '', '## Grundregeln', '- `main` ist immer lauffähig und wird nie direkt bearbeitet', '- Jeder Branch hat ein Thema: `feat/<thema>` oder `fix/<thema>`', '- Commits sind klein und beschreiben das *Warum*', '', '> Hinweis: Direkte Pushes auf `main` sind per Branch-Schutz gesperrt.', '', '## Ablauf', '1. Branch vom aktuellen `main` anlegen', '2. Änderungen in kleinen Commits sichern', '3. Pull Request öffnen und Review anfordern', '4. Nach Freigabe per Squash-Merge zusammenführen', '', '```', 'git switch main && git pull', 'git switch -c feat/neues-modul', 'git push -u origin feat/neues-modul', '```', '', '## Häufige Fehler', '- Zu große Pull Requests – besser in Etappen aufteilen', '- Veraltete Branches nicht aufräumen', '', '> Warnung: Niemals `git push --force` auf geteilte Branches ausführen.') },
  { id: 'kb2', area: 'Technik', category: 'Entwicklung', title: 'Code-Review Checkliste', author: 'Jana Weber', tags: ['Qualität'], updated: '2026-11-14T14:30:00', related: ['kb1'],
    body: L('Eine gute Review dauert selten länger als **30 Minuten**. Diese Punkte decken das Wichtigste ab.', '', '## Vor dem Review', '- [ ] Beschreibung erklärt Ziel und Vorgehen', '- [ ] Tests laufen lokal durch', '- [ ] Keine unbeabsichtigten Dateien im Diff', '', '## Während des Reviews', '- Verständlichkeit vor Cleverness prüfen', '- Fehlerfälle und Leerzustände ansehen', '- Fragen stellen statt Befehle erteilen', '', '> Tipp: Lob ist erlaubt – ein kurzer Hinweis auf eine gute Lösung motiviert.') },
  { id: 'kb3', lastRead: '2026-11-18T19:40:00', readProgress: 1, area: 'Technik', category: 'Betrieb', title: 'Backup-Strategie (3-2-1)', author: 'Markus Lange', tags: ['Sicherheit', 'Betrieb'], updated: '2026-11-12T09:00:00', related: ['kb4'],
    body: L('Die **3-2-1-Regel** schützt vor Datenverlust durch Defekt, Diebstahl und Fehlbedienung.', '', '## Die Regel', '- **3** Kopien aller wichtigen Daten', '- **2** verschiedene Speichermedien', '- **1** Kopie an einem anderen Ort', '', '## Unsere Umsetzung', '1. Laufende Daten auf dem Arbeitsgerät', '2. Nächtliche Sicherung auf das NAS', '3. Wöchentliche verschlüsselte Kopie in die Cloud', '', '> Wichtig: Ein Backup gilt erst als gut, wenn die Wiederherstellung getestet wurde.') },
  { id: 'kb4', area: 'Technik', category: 'Betrieb', title: 'Server-Wartung monatlich', author: 'Markus Lange', tags: ['Betrieb'], updated: '2026-10-28T16:45:00', related: ['kb3'],
    body: L('Kurzer Wartungsplan für den ersten Montag im Monat.', '', '## Checkliste', '- [x] Updates einspielen und Neustart planen', '- [x] Speicherplatz und Logs prüfen', '- [ ] Zertifikate auf Ablauf kontrollieren', '- [ ] Backup-Wiederherstellung stichprobenartig testen', '', '> Hinweis: Wartungsfenster vorher im Team-Kalender eintragen.') },
  { id: 'kb5', bookmarked: true, lastRead: '2026-11-23T14:05:00', readProgress: 1, area: 'Arbeit & Prozesse', category: 'Vertrieb', title: 'Angebot erstellen – Schritt für Schritt', author: 'Jana Weber', tags: ['Angebot', 'Vertrieb'], updated: '2026-11-22T11:20:00', related: ['kb6', 'kb7'],
    body: L('Ein Angebot soll in unter 20 Minuten versendbar sein. Diese Struktur hat sich bewährt.', '', '## Vorbereitung', '- Anforderungen des Kunden aus dem Gespräch zusammenfassen', '- Preisliste und Rabattgrenzen prüfen', '', '## Aufbau des Angebots', '1. Kurzer Einstieg mit dem Kundenziel', '2. Leistungen als nummerierte Positionen', '3. Preis, Zahlungsziel und Gültigkeit', '4. Nächster Schritt mit konkretem Datum', '', '> Tipp: Angebote mit einem klaren nächsten Schritt werden doppelt so oft beantwortet.', '', '## Nach dem Versand', '- Nachfassen nach 3 Werktagen', '- Status im Vertriebsmodul pflegen') },
  { id: 'kb6', bookmarked: true, lastRead: '2026-11-20T11:30:00', readProgress: 0.4, area: 'Arbeit & Prozesse', category: 'Vertrieb', title: 'Preisgestaltung auf Marktplätzen', author: 'Jana Weber', tags: ['Preise', 'Sales'], updated: '2026-11-17T13:10:00', related: ['kb5'],
    body: L('Marktplätze erheben Gebühren, die in den Preis einkalkuliert werden müssen.', '', '## Kalkulation', '- Einkaufspreis plus Versand und Verpackung', '- Plattformgebühr (Etsy ca. 6,5 %, Amazon je nach Kategorie)', '- Gewünschte Marge von mindestens 25 %', '', '## Beispiel', '```', 'Einkauf        12,00 €', 'Versand         4,50 €', 'Gebühren (8 %)  2,40 €', 'Marge (25 %)    7,20 €', 'Verkaufspreis  26,10 €', '```', '', '> Warnung: Gebühren ändern sich zum Jahreswechsel – Preise im Januar neu prüfen.') },
  { id: 'kb7', area: 'Arbeit & Prozesse', category: 'Meetings', title: 'Vorlage: Sprint-Review', author: 'Markus Lange', tags: ['Meeting'], updated: '2026-11-06T15:00:00', related: ['kb5'],
    body: L('Ein Sprint-Review dauert **45 Minuten** und folgt immer demselben Ablauf.', '', '## Agenda', '1. Ziel des Sprints (5 Min.)', '2. Demo der Ergebnisse (20 Min.)', '3. Feedback und offene Punkte (15 Min.)', '4. Ausblick auf den nächsten Sprint (5 Min.)', '', '> Hinweis: Entscheidungen direkt im Protokoll festhalten, nicht erst nachträglich.') },
  { id: 'kb8', bookmarked: true, lastRead: '2026-11-24T08:10:00', readProgress: 0.6, area: 'Persönlich', category: 'Produktivität', title: 'Wochenplanung nach GTD', author: 'Ich', tags: ['Planung', 'GTD'], updated: '2026-11-23T20:30:00', related: ['kb9'],
    body: L('Jeden **Sonntagabend** zehn Minuten für die kommende Woche.', '', '## Schritte', '1. Posteingang leeren (Notizen, Mails, Zettel)', '2. Kalender der Woche durchgehen', '3. Drei wichtigste Ergebnisse der Woche festlegen', '4. Aufgaben den Tagen zuordnen', '', '## Wochenrückblick', '- Was lief gut?', '- Was hat Zeit gefressen?', '- Was lasse ich nächste Woche weg?', '', '> Tipp: Weniger als fünf Aufgaben pro Tag einplanen – der Rest ist Puffer.') },
  { id: 'kb9', lastRead: '2026-11-21T09:00:00', readProgress: 1, area: 'Persönlich', category: 'Produktivität', title: 'Fokuszeit schützen', author: 'Ich', tags: ['Fokus'], updated: '2026-11-10T08:45:00', related: ['kb8'],
    body: L('Tiefe Arbeit braucht Blöcke ohne Unterbrechung.', '', '## Regeln', '- Zwei Fokusblöcke à 90 Minuten pro Tag, vormittags', '- Benachrichtigungen aus, Status auf „Fokus“', '- Pause von 15 Minuten nach jedem Block', '', '> Wichtig: Fokuszeit wird im Kalender wie ein Termin behandelt.') },
  { id: 'kb10', area: 'Persönlich', category: 'Gesundheit', title: 'Trainingsplan Grundlagen', author: 'Ich', tags: ['Fitness'], updated: '2026-11-08T18:00:00', related: ['kb8'],
    body: L('Drei Einheiten pro Woche, jeweils etwa 60 Minuten.', '', '## Wochenplan', '- Montag: Oberkörper', '- Mittwoch: Beine und Rumpf', '- Freitag: Ganzkörper und Mobilität', '', '## Progression', '1. Gewicht erst steigern, wenn alle Wiederholungen sauber gelingen', '2. Alle vier Wochen eine leichte Deload-Woche') },
  { id: 'kb11', area: 'Persönlich', category: 'Finanzen', title: 'Budget-Regel 50/30/20', author: 'Ich', tags: ['Budget'], updated: '2026-11-03T19:10:00', related: [],
    body: L('Eine einfache Faustregel für die monatliche Aufteilung des Nettoeinkommens.', '', '## Aufteilung', '- **50 %** Fixkosten (Miete, Versicherungen, Mobilität)', '- **30 %** Lebensstil (Essen, Freizeit, Reisen)', '- **20 %** Sparen und Vorsorge', '', '> Hinweis: Die Prozente sind ein Startpunkt – wichtiger ist, dass das Sparen automatisch passiert.') },
  { id: 'kb12', area: 'Persönlich', category: 'Gesundheit', title: 'Schlafroutine', author: 'Ich', tags: ['Gesundheit'], updated: '2026-10-25T21:00:00', related: ['kb9'],
    body: L('Gute Tage beginnen am Vorabend.', '', '## Routine', '- Feste Schlafenszeit um 22:30 Uhr', '- Bildschirme eine Stunde vorher aus', '- Zimmer kühl und dunkel halten') },
  { id: 'kb13', area: 'Arbeit & Prozesse', category: 'Vertrieb', title: 'Retourenprozess Online-Shop (Entwurf)', author: 'Ich', tags: ['Retoure', 'Sales'], status: 'draft', updated: '2026-11-24T08:30:00', related: ['kb5'],
    body: L('Ablauf, wenn ein Kunde eine Bestellung zurücksenden möchte.', '', '## Schritte', '1. Retoure im Shop-System bestätigen', '2. Rücksendeetikett senden', '3. Ware prüfen und Erstattung auslösen', '', '> Hinweis: Offen sind Fristen je Kanal (Etsy, Amazon).') },
  { id: 'kb14', area: 'Technik', category: 'Betrieb', title: 'Zertifikate erneuern (Entwurf)', author: 'Markus Lange', tags: ['Betrieb'], status: 'draft', updated: '2026-11-19T17:10:00', related: ['kb4'],
    body: L('Kurzanleitung für die jährliche Erneuerung der TLS-Zertifikate.', '', '## Checkliste', '- [ ] Ablaufdatum prüfen', '- [ ] Neues Zertifikat anfordern', '- [ ] Auf dem Server einspielen und testen') },
];


const REF = new Date('2026-11-24T09:30:00');
const dayDiff = (iso) => Math.round((new Date(REF).setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 864e5);
const relLabel = (iso) => { const d = dayDiff(iso); return d === 0 ? 'Heute' : d === 1 ? 'Gestern' : d < 7 ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(iso).getDay()] : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(new Date(iso)); };
const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];

const toneOf = Object.fromEntries(areas.map((a) => [a.id, a]));
const strip = (s) => s.replace(/```[\s\S]*?```/g, '').split('\n').map((l) => l.replace(/^#{1,6}\s*|^\s*[-*]\s+(\[[ x]\]\s*)?|^\s*\d+\.\s+|^>\s*|[*`]/g, '').trim()).filter(Boolean).join(' · ');
const published = articles.filter((a) => a.status !== 'draft');
const item = (a, extra = {}) => ({ id: a.id, title: a.title, subtitle: `${a.area} › ${a.category}`, badge: a.area, tone: toneOf[a.area].tone, icon: toneOf[a.area].icon, category: a.area, ...extra });
const articleCards = published.map((a) => ({ id: a.id, title: a.title, text: strip(a.body).slice(0, 140), tags: a.tags, icon: toneOf[a.area].icon, tone: toneOf[a.area].tone, category: a.area, meta: a.category }));
const articleItems = published.map((a) => item(a, { subtitle: strip(a.body).slice(0, 90), meta: relLabel(a.updated) }));
const recent = published.filter((a) => a.lastRead).sort((a, b) => b.lastRead.localeCompare(a.lastRead)).map((a) => item(a, { meta: relLabel(a.lastRead) }));
const bookmarkCards = published.filter((a) => a.bookmarked).map((a) => ({ ...articleCards.find((c) => c.id === a.id), meta: relLabel(a.updated) }));
const bookmarkItems = published.filter((a) => a.bookmarked).map((a) => item(a, { meta: relLabel(a.updated) }));
const drafts = articles.filter((a) => a.status === 'draft').map((a) => item(a, { subtitle: `Entwurf · ${a.author}`, meta: relLabel(a.updated), badge: 'Entwurf', tone: 'warning' }));
const areaChart = { segments: areas.map((a) => ({ label: a.name, value: published.filter((x) => x.area === a.id).length })) };
const metrics = [
  { label: 'Artikel', value: published.length, icon: 'library', tone: 'accent' },
  { label: 'Lesezeichen', value: published.filter((a) => a.bookmarked).length, icon: 'bookmark', tone: 'warning' },
  { label: 'Entwürfe', value: drafts.length, icon: 'pencil', tone: 'info' },
  { label: 'Zu prüfen', value: published.filter((a) => dayDiff(a.updated) > 21).length, icon: 'clock', tone: 'danger' },
];
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props });
const AREA_CHIPS = ['Alle', 'Technik', 'Arbeit & Prozesse', 'Persönlich'];
const demo = { articles, areas, articleCards, articleItems, recent, bookmarkItems, bookmarkCards, drafts, areaChart, metrics };
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
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Übersicht', subtitle: `${published.length} Artikel · ${drafts.length} Entwürfe`, primaryLabel: '', secondaryLabel: 'Alle Artikel', secondaryIcon: 'library' }),
            { id: 'flt', component: 'search-filter', region: 'main', props: { placeholder: 'Wissen durchsuchen …', filters: AREA_CHIPS } },
            { id: 'recent', component: 'item-list', region: 'main', bind: { items: 'recent' }, props: { title: 'Zuletzt gelesen', dense: true, limit: 5, emptyTitle: 'Noch nichts gelesen' } },
            { id: 'marks', component: 'item-list', region: 'main', bind: { items: 'bookmarkItems' }, props: { title: 'Lesezeichen', dense: true, emptyTitle: 'Keine Lesezeichen' } },
            { id: 'drafts', component: 'item-list', region: 'main', bind: { items: 'drafts' }, props: { title: 'Entwürfe', dense: true, emptyTitle: 'Keine Entwürfe' } },
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
            { id: 'ctx', component: 'kb-next', region: 'main', bind: { events: 'events' }, props: { mode: 'context' } },
            { id: 'review', component: 'kb-next', region: 'main', props: { mode: 'review', limit: 2 } },
            { id: 'recent', component: 'item-list', region: 'main', bind: { items: 'recent' }, props: { title: 'Zuletzt gelesen', dense: true, limit: 3, emptyTitle: 'Noch nichts gelesen' } },
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
      viewports: ALL_VP, demoData: demo,
      variants: [
        {
          id: 'A', name: 'Baum + Artikel', direction: 'kompakt', concept: 'Klassische Dokumentations-Navigation: links Suche, Bereichsfilter und Wissensbaum, rechts der gewählte Artikel mit Inhaltsverzeichnis. Struktur ist immer sichtbar.',
          description: '+ Orientierung durch Struktur, schnelles Blättern  − Auf Mobile verschwindet der Baum hinter einem Umschalter',
          layout: { type: 'sidebar', panelLabel: 'Wissensbaum' },
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
            hdr({ eyebrow: 'Wissensdatenbank', title: 'Was möchtest du nachschlagen?', subtitle: `${published.length} Artikel in ${areas.length} Bereichen`, primaryLabel: '' }),
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
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData: { articles, areas },
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
      demoData: { articleItems, articleCards },
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
      demoData: { articles },
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
      viewports: ['desktop', 'mobile'], demoData: { articles, areas },
    },
    {
      id: 'knowledge.inbox', name: 'Leseliste', group: 'Pflege', status: 'not_analyzed', tier: 3,
      purpose: 'Links und Texte aus dem Teilen-Menü sammeln und später lesen oder in einen Artikel überführen.',
      requirements: [{ text: 'Link oder Text per Teilen-Menü speichern, Lesestatus, Hervorhebungen', type: 'action', priority: 'could' }, { text: 'Aus der Leseliste einen Artikel anlegen', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['mobile'], demoData: { articles },
    },
    {
      id: 'knowledge.sources', name: 'Quellen & Verlauf', group: 'Pflege', status: 'not_analyzed', tier: 3,
      purpose: 'Quellenangaben je Artikel und Versionsverlauf mit Wiederherstellen.',
      requirements: [{ text: 'Quellen mit Link, Prüfung auf tote Links', type: 'info', priority: 'could' }, { text: 'Frühere Stände ansehen und wiederherstellen', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop'], demoData: { articles },
    },
    {
      id: 'knowledge.import', name: 'Import', group: 'Pflege', status: 'not_analyzed', tier: 3,
      purpose: 'Markdown-Dateien importieren und Notizen in Artikel umwandeln.',
      requirements: [{ text: 'Markdown-Ordner importieren, Notiz in Artikel umwandeln', type: 'action', priority: 'could' }],
      interactions: [], viewports: ['desktop'], demoData: { articles },
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
