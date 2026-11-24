// Gemeinsame Datenwelt: Wissen und Notizen (Eigentümer: knowledge). Notizen und Artikel liegen hier, nicht mehr im Modul-Manifest:
// Erfassen, Suche, Bildtext-Erkennung und Notiz-Editor arbeiten auf denselben Listen (`notes`, `articles`).
// Referenztag: Di, 24.11.2026 09:30. Abgeleitete Werte (Kennzahlen, Karten, Diagramme) werden aus den Listen berechnet, nie von Hand getippt.
import { TODAY, dowOf, triple } from './_util.js';

const L = (...lines) => lines.join('\n');

// ------------------------------------------------------------------ Notizen
/** Notizen (Markdown). `inbox: true` = noch nicht einsortiert (Eingang der Notizen), `archived`, `pinned`. */
export const notes = [
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
  // Eingang: noch nicht einsortiert
  { id: 'n11', title: 'Newsletter-Betreff testen', inbox: true, tags: [], updated: '2026-11-24T08:52:00',
    body: 'Zwei Betreffzeilen im A/B-Test: „Black Friday: 20 % auf Wohntextilien“ gegen „Dein Winter wird gemütlich“.' },
  { id: 'n12', title: 'Rückruf Frau Weber (Lieferung)', inbox: true, tags: [], updated: '2026-11-24T09:05:00',
    body: 'Frau Weber fragt nach der Lieferzeit für die Wolldecke Skagen. Bis morgen zurückrufen.' },
  { id: 'n13', title: 'Kaffeebohnen fürs Büro nachbestellen', inbox: true, tags: [], updated: '2026-11-23T20:15:00',
    body: 'Hausmischung, 1 kg. Vorrat reicht noch bis Freitag.' },
];

const history = [
  { id: 'h1', title: 'Notiz bearbeitet', time: '2026-11-24T07:40:00', icon: 'pencil', tone: 'accent', text: 'Abschnitt „Offene Fragen“ ergänzt' },
  { id: 'h2', title: 'Tag „Ideen“ hinzugefügt', time: '2026-11-23T21:12:00', icon: 'tag', tone: 'info' },
  { id: 'h3', title: 'Notiz angeheftet', time: '2026-11-22T08:30:00', icon: 'pin', tone: 'warning' },
  { id: 'h4', title: 'Notiz angelegt', time: '2026-11-20T18:05:00', icon: 'sticky-note', tone: 'success' },
];

/** Verlauf der Notizen (Aktivität). */
export const notesHistory = [
  { id: 'h1', title: 'Notiz bearbeitet', time: '2026-11-24T07:40:00', icon: 'pencil', tone: 'accent', text: 'Abschnitt „Offene Fragen“ ergänzt' },
  { id: 'h2', title: 'Tag „Ideen“ hinzugefügt', time: '2026-11-23T21:12:00', icon: 'tag', tone: 'info' },
  { id: 'h3', title: 'Notiz angeheftet', time: '2026-11-22T08:30:00', icon: 'pin', tone: 'warning' },
  { id: 'h4', title: 'Notiz angelegt', time: '2026-11-20T18:05:00', icon: 'sticky-note', tone: 'success' },
];
/** Verknüpfungen der Notiz „Ideen TAKT V2“ (Aufgabe, Termin, Artikel). */
export const notesLinks = [
  { id: 'l1', label: 'Aufgabe: Wireframes Kalender prüfen', module: 'tasks', sub: 'fällig heute' },
  { id: 'l2', label: 'Sprint-Planung', module: 'calendar', sub: 'heute 11:00' },
  { id: 'l3', label: 'Artikel: Fokuszeit schützen', module: 'knowledge' },
];

/** Kennzahlen, Tag-Diagramm und Zähler aus einer Notizliste (auch für die Szenarien). */
function deriveNotes(list) {
  const live = list.filter((n) => !n.archived && !n.inbox);
  const inbox = list.filter((n) => n.inbox && !n.archived).length;
  const open = live.reduce((s, n) => s + (String(n.body || '').match(/^\s*[-*]\s+\[ \]/gm) || []).length, 0);
  const tags = {};
  for (const n of live) for (const t of n.tags || []) tags[t] = (tags[t] || 0) + 1;
  return {
    live: live.length, inbox, open,
    metrics: [
      { label: 'Notizen', value: live.length, icon: 'sticky-note', tone: 'accent' },
      { label: 'Angeheftet', value: live.filter((n) => n.pinned).length, icon: 'pin', tone: 'warning' },
      { label: 'Im Eingang', value: inbox, icon: 'inbox', tone: inbox ? 'info' : 'success' },
      { label: 'Offene Punkte', value: open, icon: 'list-checks', tone: 'success' },
    ],
    tagChart: { segments: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })) },
  };
}
const dn = deriveNotes(notes);
export const notesMetrics = dn.metrics;
export const notesTagChart = dn.tagChart;

// ------------------------------------------------------------------ Wissen
/** Bereiche der Wissensdatenbank (Grundstruktur, bleibt im Ersten Start erhalten). */
export const knowledgeAreas = [
  { id: 'Technik', name: 'Technik', icon: 'laptop', tone: 'accent' },
  { id: 'Arbeit & Prozesse', name: 'Arbeit & Prozesse', icon: 'briefcase', tone: 'warning' },
  { id: 'Persönlich', name: 'Persönlich', icon: 'heart-pulse', tone: 'success' },
];

/** Artikel (Markdown). `status: 'draft'` = Entwurf, `bookmarked`, `lastRead`, `readProgress` 0 bis 1. */
export const articles = [
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
    body: L('Drei Einheiten pro Woche im FitX Bielefeld, jeweils 55 bis 60 Minuten, Beginn 18:30 Uhr.', '', '## Wochenplan', '- Montag: Unterkörper', '- Mittwoch: Oberkörper A', '- Freitag: Ganzkörper', '', '## Progression', '1. Gewicht erst steigern, wenn alle Wiederholungen sauber gelingen', '2. Alle sechs Wochen eine leichte Entlastungswoche') },
  { id: 'kb11', area: 'Persönlich', category: 'Finanzen', title: 'Budget-Regel 50/30/20', author: 'Ich', tags: ['Budget'], updated: '2026-11-03T19:10:00', related: [],
    body: L('Eine einfache Faustregel für die monatliche Aufteilung des Nettoeinkommens.', '', '## Aufteilung', '- **50 %** Fixkosten (Miete, Versicherungen, Mobilität)', '- **30 %** Lebensstil (Essen, Freizeit, Reisen)', '- **20 %** Sparen und Vorsorge', '', '> Hinweis: Die Prozente sind ein Startpunkt – wichtiger ist, dass das Sparen automatisch passiert.') },
  { id: 'kb12', area: 'Persönlich', category: 'Gesundheit', title: 'Schlafroutine', author: 'Ich', tags: ['Gesundheit'], updated: '2026-10-25T21:00:00', related: ['kb9'],
    body: L('Gute Tage beginnen am Vorabend.', '', '## Routine', '- Feste Schlafenszeit um 22:30 Uhr', '- Bildschirme eine Stunde vorher aus', '- Zimmer kühl und dunkel halten') },
  { id: 'kb13', area: 'Arbeit & Prozesse', category: 'Vertrieb', title: 'Retourenprozess Online-Shop (Entwurf)', author: 'Ich', tags: ['Retoure', 'Sales'], status: 'draft', updated: '2026-11-24T08:30:00', related: ['kb5'],
    body: L('Ablauf, wenn ein Kunde eine Bestellung zurücksenden möchte.', '', '## Schritte', '1. Retoure im Shop-System bestätigen', '2. Rücksendeetikett senden', '3. Ware prüfen und Erstattung auslösen', '', '> Hinweis: Offen sind Fristen je Kanal (Etsy, Amazon).') },
  { id: 'kb14', area: 'Technik', category: 'Betrieb', title: 'Zertifikate erneuern (Entwurf)', author: 'Markus Lange', tags: ['Betrieb'], status: 'draft', updated: '2026-11-19T17:10:00', related: ['kb4'],
    body: L('Kurzanleitung für die jährliche Erneuerung der TLS-Zertifikate.', '', '## Checkliste', '- [ ] Ablaufdatum prüfen', '- [ ] Neues Zertifikat anfordern', '- [ ] Auf dem Server einspielen und testen') },
];

const dayDiff = (iso) => Math.round((new Date(`${TODAY}T12:00:00`) - new Date(`${String(iso).slice(0, 10)}T12:00:00`)) / 864e5);
const relLabel = (iso) => { const d = dayDiff(iso); return d === 0 ? 'Heute' : d === 1 ? 'Gestern' : d > 1 && d < 7 ? ({ 0: 'Mo', 1: 'Di', 2: 'Mi', 3: 'Do', 4: 'Fr', 5: 'Sa', 6: 'So' })[dowOf(iso)] : `${String(iso).slice(8, 10)}.${String(iso).slice(5, 7)}.`; };
const strip = (s) => s.replace(/```[\s\S]*?```/g, '').split('\n').map((l) => l.replace(/^#{1,6}\s*|^\s*[-*]\s+(\[[ x]\]\s*)?|^\s*\d+\.\s+|^>\s*|[*`]/g, '').trim()).filter(Boolean).join(' · ');

/** Karten, Listen, Diagramm und Kennzahlen der Wissensübersicht aus einer Artikelliste (auch für die Szenarien). */
function deriveKnowledge(list, areas = knowledgeAreas) {
  const toneOf = Object.fromEntries(areas.map((a) => [a.id, a]));
  const published = list.filter((a) => a.status !== 'draft');
  const item = (a, extra = {}) => ({ id: a.id, title: a.title, subtitle: `${a.area} › ${a.category}`, badge: a.area, tone: toneOf[a.area]?.tone, icon: toneOf[a.area]?.icon, category: a.area, ...extra });
  const cards = published.map((a) => ({ id: a.id, title: a.title, text: strip(a.body).slice(0, 140), tags: a.tags, icon: toneOf[a.area]?.icon, tone: toneOf[a.area]?.tone, category: a.area, meta: a.category }));
  const drafts = list.filter((a) => a.status === 'draft').map((a) => item(a, { subtitle: `Entwurf · ${a.author}`, meta: relLabel(a.updated), badge: 'Entwurf', tone: 'warning' }));
  return {
    published: published.length, drafts: drafts.length, bookmarks: published.filter((a) => a.bookmarked).length, stale: published.filter((a) => dayDiff(a.updated) > 21).length,
    cards,
    items: published.map((a) => item(a, { subtitle: strip(a.body).slice(0, 90), meta: relLabel(a.updated) })),
    recent: published.filter((a) => a.lastRead).sort((a, b) => b.lastRead.localeCompare(a.lastRead)).map((a) => item(a, { meta: relLabel(a.lastRead) })),
    bookmarkCards: published.filter((a) => a.bookmarked).map((a) => ({ ...cards.find((c) => c.id === a.id), meta: relLabel(a.updated) })),
    bookmarkItems: published.filter((a) => a.bookmarked).map((a) => item(a, { meta: relLabel(a.updated) })),
    draftItems: drafts,
    // Ohne Artikel keine Segmente: das Diagramm zeigt dann seinen Leerzustand statt „Gesamt 1“ bei 0 %
    areaChart: { segments: published.length ? areas.map((a) => ({ label: a.name, value: published.filter((x) => x.area === a.id).length })) : [] },
    metrics: [
      { label: 'Artikel', value: published.length, icon: 'library', tone: 'accent' },
      { label: 'Lesezeichen', value: published.filter((a) => a.bookmarked).length, icon: 'bookmark', tone: 'warning' },
      { label: 'Entwürfe', value: drafts.length, icon: 'pencil', tone: 'info' },
      { label: 'Zu prüfen', value: published.filter((a) => dayDiff(a.updated) > 21).length, icon: 'clock', tone: 'danger' },
    ],
  };
}
const dk = deriveKnowledge(articles);
export const articleCards = dk.cards;
export const articleItems = dk.items;
export const articleRecent = dk.recent;
export const articleBookmarkCards = dk.bookmarkCards;
export const articleBookmarkItems = dk.bookmarkItems;
export const articleDrafts = dk.draftItems;
export const knowledgeAreaChart = dk.areaChart;
export const knowledgeMetrics = dk.metrics;

// ------------------------------------------------------------------ Launchpad, Hinweise, Suche, Mitteilungen
const notesSummaryOf = (d) => ({ kpis: [
  { label: 'Notizen', value: d.live, icon: 'sticky-note', tone: 'accent', to: 'notes.home' },
  { label: 'im Eingang', value: d.inbox, icon: 'inbox', tone: d.inbox ? 'info' : 'success', to: 'notes.inbox' },
  { label: 'offene Punkte', value: d.open, icon: 'list-checks', tone: 'neutral', to: 'notes.checklists' },
] });
const knowledgeSummaryOf = (d) => ({ kpis: [
  { label: 'Artikel', value: d.published, icon: 'library', tone: 'accent', to: 'knowledge.home' },
  { label: 'Lesezeichen', value: d.bookmarks, icon: 'bookmark', tone: 'warning', to: 'knowledge.browse' },
  { label: 'zu prüfen', value: d.stale, icon: 'clock', tone: d.stale ? 'info' : 'success', to: 'knowledge.review' },
] });
export const notesSummary = notesSummaryOf(dn);
export const knowledgeSummary = knowledgeSummaryOf(dk);

const inboxNotes = notes.filter((n) => n.inbox && !n.archived);
export const notesHints = inboxNotes.length ? [{ id: 'h-notes-inbox', text: `${inboxNotes.length} Notizen im Eingang warten auf Tag, Aufgabe oder Archiv.`, source: 'notes[inbox]', module: 'notes', tone: 'info', to: 'notes.inbox' }] : [];
export const knowledgeHints = [
  ...(dk.stale ? [{ id: 'h-kb-review', text: `${dk.stale} Artikel sind seit über 21 Tagen unverändert – ein Blick, ob sie noch stimmen.`, source: 'articles', module: 'knowledge', tone: 'info', to: 'knowledge.review' }] : []),
  ...articles.filter((a) => a.status === 'draft').slice(0, 1).map((a) => ({ id: `h-kb-draft-${a.id}`, text: `Entwurf „${a.title}“ wartet auf Fertigstellung.`, source: `articles[${a.id}]`, module: 'knowledge', tone: 'neutral', to: 'knowledge.article', carry: { selectedId: a.id } })),
];
const plain = (s) => strip(s).slice(0, 70);
export const notesSearch = notes.filter((n) => !n.archived).map((n) => ({ id: `note:${n.id}`, type: 'Notiz', title: n.title, subtitle: `${n.inbox ? 'Eingang' : (n.tags || []).join(', ') || 'Notiz'} · ${plain(n.body)}`, module: 'notes', to: 'notes.editor', params: { id: n.id } }));
export const knowledgeSearch = articles.map((a) => ({ id: `article:${a.id}`, type: a.status === 'draft' ? 'Entwurf' : 'Artikel', title: a.title, subtitle: `${a.area} › ${a.category}`, module: 'knowledge', to: 'knowledge.article', params: { id: a.id } }));
export const notesNotifications = inboxNotes.length ? [{ id: 'n-notes-inbox', title: `${inboxNotes.length} Notizen im Eingang`, text: `„${inboxNotes[0].title}“ und ${inboxNotes.length - 1} weitere sind noch nicht einsortiert.`, module: 'notes', tone: 'neutral', priority: 'leise', time: inboxNotes.map((n) => n.updated).sort().at(-1), to: 'notes.inbox' }] : [];
export const knowledgeNotifications = [];

// ------------------------------------------------------------------ Szenarien
const sn = deriveNotes(triple(notes)), sk = deriveKnowledge(triple(articles));
const zeroN = deriveNotes([]), zeroK = deriveKnowledge([]);
export const scenarios = {
  erststart: {
    knowledgeAreas,
    notesMetrics: zeroN.metrics, notesTagChart: zeroN.tagChart, notesSummary: notesSummaryOf(zeroN),
    knowledgeMetrics: zeroK.metrics, knowledgeAreaChart: zeroK.areaChart, knowledgeSummary: knowledgeSummaryOf(zeroK),
  },
  stress: {
    notesMetrics: sn.metrics, notesTagChart: sn.tagChart, notesSummary: notesSummaryOf(sn),
    knowledgeMetrics: sk.metrics, knowledgeAreaChart: sk.areaChart, knowledgeSummary: knowledgeSummaryOf(sk),
    articleCards: sk.cards, articleItems: sk.items, articleRecent: sk.recent, articleBookmarkCards: sk.bookmarkCards, articleBookmarkItems: sk.bookmarkItems, articleDrafts: sk.draftItems,
  },
};
