// Gemeinsame Datenwelt: Termine & Aufgaben der Persona (Kalender, Aufgaben, Start, Fokus …)
// Referenztag: Di, 24.11.2026 09:30. Von Modul-Manifesten importiert oder per '@world:events' gebunden.
export const events = [
  // Serien
  { id: 'e-standup', title: 'Daily Stand-up', start: '2026-11-02T09:45:00', end: '2026-11-02T10:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams', repeat: 'Werktags' },
  { id: 'e-planung', title: 'Wochenplanung', start: '2026-11-02T08:30:00', end: '2026-11-02T09:15:00', category: 'Fokus', tone: 'success', repeat: 'Wöchentlich', note: 'Prioritäten der Woche festlegen, Kalender und Aufgaben abgleichen.' },
  { id: 'e-fitness', title: 'Krafttraining Oberkörper', start: '2026-11-05T18:30:00', end: '2026-11-05T19:30:00', category: 'Fitness', tone: 'info', location: 'Studio Kraftwerk', repeat: 'Wöchentlich' },
  // Montag 23.11.
  { id: 'e1', title: 'Design-Review Kalender', start: '2026-11-23T11:00:00', end: '2026-11-23T12:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams' },
  { id: 'e2', title: 'Fokus: Angebotskalkulation', start: '2026-11-23T14:00:00', end: '2026-11-23T15:30:00', category: 'Fokus', tone: 'success' },
  // Dienstag 24.11. (heute)
  { id: 'e3', title: 'Sprint-Planung', start: '2026-11-24T11:00:00', end: '2026-11-24T11:45:00', category: 'Arbeit', tone: 'accent', location: 'Konferenzraum 2', note: 'Backlog-Priorisierung für Sprint 12.' },
  { id: 'e4', title: 'Fokus: Workbench-Review', start: '2026-11-24T10:30:00', end: '2026-11-24T12:00:00', category: 'Fokus', tone: 'success', note: 'Varianten Kalender und Aufgaben durchgehen.' },
  { id: 'e5', title: 'Mittag mit Jana', start: '2026-11-24T12:30:00', end: '2026-11-24T13:30:00', category: 'Privat', tone: 'accent2', location: 'Café Moll' },
  { id: 'e6', title: 'Lieferanten-Call Etsy', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00', category: 'Sales', tone: 'warning', location: 'Zoom', note: 'Konditionen Q1 besprechen.' },
  // Mittwoch 25.11.
  { id: 'e7', title: 'Kunden-Call Müller GmbH', start: '2026-11-25T09:00:00', end: '2026-11-25T10:00:00', category: 'Sales', tone: 'warning', location: 'Telefon' },
  { id: 'e8', title: 'Produktfoto-Shooting', start: '2026-11-25T13:00:00', end: '2026-11-25T16:00:00', category: 'Arbeit', tone: 'accent', location: 'Studio Ehrenfeld', note: 'Winterkollektion, 12 Artikel.' },
  { id: 'e9', title: 'Physiotherapie', start: '2026-11-25T16:30:00', end: '2026-11-25T17:30:00', category: 'Gesundheit', tone: 'danger', location: 'Praxis Lindner' },
  // Donnerstag 26.11.
  { id: 'e10', title: 'Zahnarzt', start: '2026-11-26T08:00:00', end: '2026-11-26T09:00:00', category: 'Gesundheit', tone: 'danger', location: 'Praxis Dr. Weber' },
  { id: 'e11', title: 'Workshop Preisstrategie', start: '2026-11-26T10:00:00', end: '2026-11-26T12:00:00', category: 'Sales', tone: 'warning', location: 'Teams' },
  { id: 'e12', title: '1:1 mit Lea', start: '2026-11-26T13:30:00', end: '2026-11-26T14:15:00', category: 'Arbeit', tone: 'accent' },
  { id: 'e13', title: 'Fokus: Newsletter schreiben', start: '2026-11-26T14:30:00', end: '2026-11-26T16:00:00', category: 'Fokus', tone: 'success' },
  // Freitag 27.11.
  { id: 'e14', title: 'Black Friday', start: '2026-11-27', end: '2026-11-27', allDay: true, category: 'Sales', tone: 'warning' },
  { id: 'e15', title: 'Shop-Wochenreview', start: '2026-11-27T09:30:00', end: '2026-11-27T10:30:00', category: 'Sales', tone: 'warning', location: 'Büro' },
  { id: 'e16', title: 'Team-Mittagessen', start: '2026-11-27T12:00:00', end: '2026-11-27T13:00:00', category: 'Privat', tone: 'accent2', location: 'Trattoria Bella' },
  { id: 'e17', title: 'Steuerberater', start: '2026-11-27T15:00:00', end: '2026-11-27T16:00:00', category: 'Arbeit', tone: 'accent', location: 'Kanzlei Brandt' },
  // Wochenende
  { id: 'e18', title: 'Wochenmarkt', start: '2026-11-28T10:00:00', end: '2026-11-28T11:30:00', category: 'Privat', tone: 'accent2', location: 'Markt am Dom' },
  { id: 'e19', title: '1. Advent', start: '2026-11-29', end: '2026-11-29', allDay: true, category: 'Privat', tone: 'accent2' },
  { id: 'e20', title: 'Wanderung Taunus', start: '2026-11-29T11:00:00', end: '2026-11-29T15:00:00', category: 'Fitness', tone: 'info', location: 'Feldberg' },
  // übriger November / Dezember
  { id: 'e21', title: 'Quartalsreview Q4', start: '2026-11-05T14:00:00', end: '2026-11-05T16:00:00', category: 'Arbeit', tone: 'accent', location: 'Teams' },
  { id: 'e22', title: 'Messe Köln', start: '2026-11-10', end: '2026-11-12', allDay: true, category: 'Sales', tone: 'warning', location: 'Köln' },
  { id: 'e23', title: 'Fotograf: Produktshooting vorbereiten', start: '2026-11-16T10:00:00', end: '2026-11-16T11:00:00', category: 'Arbeit', tone: 'accent' },
  { id: 'e24', title: 'Janas Geburtstag', start: '2026-11-20', end: '2026-11-20', allDay: true, category: 'Privat', tone: 'accent2' },
  { id: 'e25', title: 'Zahnreinigung', start: '2026-11-18T16:00:00', end: '2026-11-18T17:00:00', category: 'Gesundheit', tone: 'danger' },
  { id: 'e26', title: 'Monatsabschluss Buchhaltung', start: '2026-11-30T10:00:00', end: '2026-11-30T12:00:00', category: 'Arbeit', tone: 'accent', location: 'Büro' },
  { id: 'e27', title: 'Jahresplanung 2027', start: '2026-12-01T09:00:00', end: '2026-12-01T12:00:00', category: 'Fokus', tone: 'success' },
  { id: 'e28', title: 'Nikolausfeier Team', start: '2026-12-04T17:00:00', end: '2026-12-04T20:00:00', category: 'Privat', tone: 'accent2', location: 'Brauhaus' },
];

/** Aufgaben (Referenz: heute Di 24.11.2026). status: Offen | In Arbeit | Review | Erledigt */
export const tasks = [
  { id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', project: 'Vertrieb', category: 'Arbeit', status: 'In Arbeit', estimate: 60, note: 'Kunde erwartet Rückmeldung bis 14:00 Uhr.', subtasks: [{ id: 't1s1', title: 'Preise prüfen', done: true }, { id: 't1s2', title: 'PDF erzeugen', done: false }, { id: 't1s3', title: 'An Kunden senden', done: false }] },
  { id: 't2', title: 'Belege Oktober hochladen', due: '2026-11-23', priority: 'mittel', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 30, repeat: 'Monatlich', subtasks: [] },
  { id: 't3', title: 'Produktfotos Winterkollektion auswählen', due: '2026-11-25', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'Offen', estimate: 90, subtasks: [{ id: 't3s1', title: 'Rohdaten sichten', done: true }, { id: 't3s2', title: 'Favoriten markieren', done: true }, { id: 't3s3', title: 'Retusche beauftragen', done: false }, { id: 't3s4', title: 'Bilder hochladen', done: false }] },
  { id: 't4', title: 'Steuerberater-Termin bestätigen', due: '2026-11-23', priority: 'niedrig', project: 'Finanzen', category: 'Finanzen', status: 'Erledigt', done: true, subtasks: [] },
  { id: 't5', title: 'Wireframes Kalender-Wochenansicht prüfen', due: '2026-11-24', priority: 'hoch', project: 'TAKT V2', category: 'Arbeit', status: 'Review', estimate: 45, subtasks: [{ id: 't5s1', title: 'Mobile 390 px testen', done: false }, { id: 't5s2', title: 'Kontraste prüfen', done: false }] },
  { id: 't6', title: 'Newsletter Black Friday planen', due: '2026-11-24T16:30:00', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'In Arbeit', estimate: 60, subtasks: [] },
  { id: 't7', title: 'Lieferantenkonditionen vergleichen', due: '2026-11-24', priority: 'mittel', project: 'Vertrieb', category: 'Arbeit', status: 'Offen', estimate: 45, subtasks: [] },
  { id: 't8', title: 'Etsy-Gebühren buchen', due: '2026-11-22', priority: 'hoch', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 20, subtasks: [] },
  { id: 't9', title: 'Retourenprozess dokumentieren', due: '2026-11-27', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'Offen', estimate: 60, subtasks: [{ id: 't9s1', title: 'Ablauf skizzieren', done: false }, { id: 't9s2', title: 'Vorlagen erstellen', done: false }] },
  { id: 't10', title: 'Jahresplanung 2027 vorbereiten', due: '2026-11-30', priority: 'niedrig', project: 'Vertrieb', category: 'Arbeit', status: 'Offen', estimate: 120, subtasks: [] },
  { id: 't11', title: 'Workbench: Varianten Aufgaben freigeben', due: '2026-11-26', priority: 'hoch', project: 'TAKT V2', category: 'Arbeit', status: 'Review', estimate: 30, subtasks: [] },
  { id: 't12', title: 'Geschenk für Jana besorgen', due: '2026-11-28', priority: 'mittel', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 60, subtasks: [] },
  { id: 't13', title: 'Wochenplanung schreiben', due: '2026-11-30', priority: 'mittel', project: 'TAKT V2', category: 'Arbeit', status: 'Offen', estimate: 30, repeat: 'Wöchentlich', subtasks: [] },
  { id: 't14', title: 'Backup-Festplatte prüfen', priority: 'niedrig', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 30, subtasks: [] },
  { id: 't15', title: 'Winterreifen wechseln lassen', due: '2026-12-05', priority: 'niedrig', project: 'Privat', category: 'Privat', status: 'Offen', subtasks: [] },
  { id: 't16', title: 'Lagerbestand Q4 zählen', due: '2026-12-02', priority: 'mittel', project: 'Shop', category: 'Arbeit', status: 'Offen', estimate: 90, subtasks: [] },
  { id: 't17', title: 'Kundenfeedback auswerten', due: '2026-11-29', priority: 'mittel', project: 'Vertrieb', category: 'Arbeit', status: 'In Arbeit', estimate: 45, subtasks: [{ id: 't17s1', title: 'Bewertungen exportieren', done: true }, { id: 't17s2', title: 'Themen clustern', done: false }] },
  { id: 't18', title: 'Domain-Verlängerung bezahlen', due: '2026-11-23', priority: 'niedrig', project: 'Shop', category: 'Finanzen', status: 'Erledigt', done: true, subtasks: [] },
  { id: 't19', title: 'Fitnessplan Dezember anpassen', due: '2026-11-27', priority: 'niedrig', project: 'Privat', category: 'Privat', status: 'Offen', estimate: 30, subtasks: [] },
  { id: 't20', title: 'Umsatzsteuer-Voranmeldung', due: '2026-12-10', priority: 'hoch', project: 'Finanzen', category: 'Finanzen', status: 'Offen', estimate: 45, subtasks: [] },
  { id: 't21', title: 'Kassenbuch abgleichen', due: '2026-11-20', priority: 'mittel', project: 'Finanzen', category: 'Finanzen', status: 'Erledigt', done: true, subtasks: [] },
];
