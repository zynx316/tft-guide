// Gemeinsame Datenwelt: Termine & Aufgaben der Persona (Kalender, Aufgaben, Start, Fokus …)
// Referenztag: Di, 24.11.2026 09:30. Von Modul-Manifesten importiert oder per '@world:events' gebunden.
const baseEvents = [
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
const baseTasks = [
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

// ============================================================================
// ERGÄNZUNGEN Kalender & Aufgaben (additiv; die Einträge oben bleiben unverändert).
// Neue Welt-Schlüssel: calSources, calHolidays, calBirthdays, calPrefs, taskInbox, taskActivity, taskFocusLog, taskFocusGoal.
// ============================================================================

/** Termin-Details (Teilnehmer, Erinnerungen, Fahrzeit, Link) – werden den Basis-Terminen per ID zugeordnet. */
const EVENT_DETAILS = {
  e3: { attendees: [{ name: 'Lea Hoffmann', status: 'Zugesagt', role: 'Organisatorin' }, { name: 'Ben Albrecht', status: 'Zugesagt' }, { name: 'Mara Sander', status: 'Offen' }], reminders: ['15 Min. vorher'], link: 'Teams-Besprechung' },
  e4: { reminders: ['5 Min. vorher'] },
  e5: { attendees: [{ name: 'Jana', status: 'Zugesagt' }], reminders: ['30 Min. vorher'], travel: 10 },
  e6: { attendees: [{ name: 'Frau Petersen', status: 'Zugesagt', role: 'Lieferantin' }, { name: 'Tom Wagner', status: 'Zugesagt' }], reminders: ['10 Min. vorher'], link: 'Zoom-Meeting' },
  e7: { attendees: [{ name: 'Herr Müller', status: 'Zugesagt', role: 'Kunde' }], reminders: ['1 Tag vorher', '15 Min. vorher'] },
  e8: { attendees: [{ name: 'Sven Ritter', status: 'Zugesagt', role: 'Fotograf' }, { name: 'Jana', status: 'Vielleicht' }], reminders: ['1 Tag vorher', '1 Std. vorher'], travel: 25 },
  e9: { reminders: ['1 Std. vorher'], travel: 12 },
  e10: { reminders: ['1 Tag vorher', '30 Min. vorher'], travel: 15 },
  e11: { attendees: [{ name: 'Mara Sander', status: 'Zugesagt' }, { name: 'Ben Albrecht', status: 'Vielleicht' }], reminders: ['15 Min. vorher'], link: 'Teams-Besprechung' },
  e12: { attendees: [{ name: 'Lea Hoffmann', status: 'Zugesagt' }], reminders: ['10 Min. vorher'] },
  e15: { reminders: ['15 Min. vorher'] },
  e16: { attendees: [{ name: 'Lea Hoffmann', status: 'Zugesagt' }, { name: 'Ben Albrecht', status: 'Zugesagt' }, { name: 'Mara Sander', status: 'Abgesagt' }], reminders: ['1 Tag vorher'], travel: 8 },
  e17: { attendees: [{ name: 'Frau Brandt', status: 'Zugesagt', role: 'Steuerberaterin' }], reminders: ['1 Tag vorher', '1 Std. vorher'], travel: 20 },
  e20: { attendees: [{ name: 'Jana', status: 'Zugesagt' }, { name: 'Timo', status: 'Offen' }], reminders: ['1 Tag vorher'], travel: 85 },
  'e-standup': { attendees: [{ name: 'Lea Hoffmann', status: 'Zugesagt' }, { name: 'Ben Albrecht', status: 'Zugesagt' }], reminders: ['5 Min. vorher'], link: 'Teams-Besprechung' },
};

/** Feiertage NRW (gesetzlich, Brauchtum) – Winter bis Frühjahr 2027. eventId: bereits als Termin vorhanden. */
export const calHolidays = [
  { id: 'h-allerheiligen', name: 'Allerheiligen', date: '2026-11-01', type: 'gesetzlich' },
  { id: 'h-totensonntag', name: 'Totensonntag', date: '2026-11-22', type: 'Gedenktag' },
  { id: 'h-advent1', name: '1. Advent', date: '2026-11-29', type: 'Brauchtum', eventId: 'e19' },
  { id: 'h-nikolaus', name: 'Nikolaus', date: '2026-12-06', type: 'Brauchtum' },
  { id: 'h-heiligabend', name: 'Heiligabend', date: '2026-12-24', type: 'Brauchtum' },
  { id: 'h-weihnacht1', name: '1. Weihnachtstag', date: '2026-12-25', type: 'gesetzlich' },
  { id: 'h-weihnacht2', name: '2. Weihnachtstag', date: '2026-12-26', type: 'gesetzlich' },
  { id: 'h-silvester', name: 'Silvester', date: '2026-12-31', type: 'Brauchtum' },
  { id: 'h-neujahr', name: 'Neujahr', date: '2027-01-01', type: 'gesetzlich' },
  { id: 'h-karfreitag', name: 'Karfreitag', date: '2027-03-26', type: 'gesetzlich' },
  { id: 'h-ostermontag', name: 'Ostermontag', date: '2027-03-29', type: 'gesetzlich' },
  { id: 'h-mai', name: 'Tag der Arbeit', date: '2027-05-01', type: 'gesetzlich' },
  { id: 'h-himmelfahrt', name: 'Christi Himmelfahrt', date: '2027-05-06', type: 'gesetzlich' },
  { id: 'h-pfingstmontag', name: 'Pfingstmontag', date: '2027-05-17', type: 'gesetzlich' },
  { id: 'h-fronleichnam', name: 'Fronleichnam', date: '2027-05-27', type: 'gesetzlich' },
];

/** Geburtstage aus den Kontakten (nächstes Vorkommen, `turns` = wird … Jahre). */
export const calBirthdays = [
  { id: 'bd-jana', name: 'Jana', relation: 'Partnerin', date: '2026-11-20', turns: 37, eventId: 'e24' },
  { id: 'bd-timo', name: 'Timo', relation: 'Bruder', date: '2026-11-28', turns: 36 },
  { id: 'bd-mama', name: 'Mama (Ingrid)', relation: 'Familie', date: '2026-12-03', turns: 66 },
  { id: 'bd-lea', name: 'Lea Hoffmann', relation: 'Team', date: '2026-12-17', turns: 31 },
  { id: 'bd-papa', name: 'Papa (Dieter)', relation: 'Familie', date: '2027-01-09', turns: 68 },
];

/** Kalenderquellen & Konten (Sync-Status je Quelle). status: ok | error | permission */
export const calSources = [
  { id: 'personal', name: 'Jonas · Persönlich', kind: 'google', account: 'Google-Konto', tone: 'accent', visible: true, isDefault: true, status: 'ok', lastSync: '2026-11-24T09:12:00' },
  { id: 'work', name: 'Nordlicht Studio', kind: 'microsoft', account: 'Microsoft 365', tone: 'warning', visible: true, status: 'ok', lastSync: '2026-11-24T09:05:00' },
  { id: 'family', name: 'Jana & Jonas', kind: 'icloud', account: 'iCloud · geteilt mit Jana', tone: 'accent2', visible: true, status: 'ok', lastSync: '2026-11-24T08:40:00' },
  { id: 'etsy', name: 'Etsy-Versandfristen', kind: 'ics', account: 'ICS-Abo per URL', tone: 'success', visible: true, status: 'error', error: 'Anmeldung abgelaufen – das Abo liefert seit Sonntag keine Daten.', lastSync: '2026-11-22T06:00:00' },
  { id: 'holidays', name: 'Feiertage NRW', kind: 'builtin', account: 'Gesetzliche Feiertage und Brauchtum', tone: 'neutral', visible: true, status: 'ok', readonly: true, lastSync: '2026-11-24T00:00:00' },
  { id: 'birthdays', name: 'Geburtstage', kind: 'contacts', account: 'Aus deinen Kontakten', tone: 'accent2', visible: true, status: 'ok', readonly: true, lastSync: '2026-11-24T00:00:00' },
  { id: 'school', name: 'Schulferien NRW', kind: 'ics', account: 'ICS-Abo per URL', tone: 'info', visible: false, status: 'ok', lastSync: '2026-11-20T06:00:00' },
  { id: 'device', name: 'Gerätekalender', kind: 'device', account: 'Pixel 9 · Lokal', tone: 'info', visible: false, status: 'permission' },
];

/** Kalender-Einstellungen (Wochenstart, Dauer, Erinnerung, Zeitraster). */
export const calPrefs = { weekStart: 'Montag', defaultDuration: 60, defaultReminder: '15 Min. vorher', gridFrom: 7, gridTo: 20, weekNumbers: true };

const holidayEvents = calHolidays.filter((h) => !h.eventId && h.type !== 'Gedenktag').map((h) => ({ id: h.id, title: h.name, start: h.date, end: h.date, allDay: true, category: 'Feiertag', tone: 'neutral', source: 'holidays', kind: 'holiday' }));
const birthdayEvents = calBirthdays.filter((b) => !b.eventId).map((b) => ({ id: b.id, title: `Geburtstag ${b.name.split(' (')[0]}`, start: b.date, end: b.date, allDay: true, category: 'Geburtstag', tone: 'accent2', source: 'birthdays', kind: 'birthday', note: `${b.relation} · wird ${b.turns}` }));
const extraEvents = [
  { id: 'e-etsy1', title: 'Etsy: Versandfrist Winterkollektion', start: '2026-11-26', end: '2026-11-26', allDay: true, category: 'Sales', tone: 'warning', source: 'etsy' },
  { id: 'e-etsy2', title: 'Etsy: Letzter Versandtag vor Weihnachten', start: '2026-12-17', end: '2026-12-17', allDay: true, category: 'Sales', tone: 'warning', source: 'etsy' },
  { id: 'e-ferien', title: 'Weihnachtsferien NRW', start: '2026-12-23', end: '2027-01-06', allDay: true, category: 'Feiertag', tone: 'info', source: 'school', kind: 'holiday', hidden: true },
];

/** Termine der Persona inklusive Details, Feiertagen, Geburtstagen und Abo-Terminen. */
export const events = [...baseEvents.map((e) => (EVENT_DETAILS[e.id] ? { ...e, ...EVENT_DETAILS[e.id] } : e)), ...holidayEvents, ...birthdayEvents, ...extraEvents];
/** Ursprüngliche Termine ohne Ergänzungen (für freigegebene Features, die unverändert bleiben). Keine Welt-Daten. */
export const legacyEvents = () => baseEvents.map((e) => ({ ...e }));
export const legacyTasks = () => baseTasks.map((t) => ({ ...t }));

/** Erledigungstag der bereits abgehakten Aufgaben (für Wochenauswertung). */
const DONE_AT = { t4: '2026-11-23', t18: '2026-11-23', t21: '2026-11-20' };
export const tasks = baseTasks.map((t) => (DONE_AT[t.id] ? { ...t, doneAt: DONE_AT[t.id] } : t));

/** Eingang: schnell erfasste Dinge, die noch sortiert werden müssen (Quelle, Zeitpunkt, Vorschlag). */
export const taskInbox = [
  { id: 'in1', title: 'Rückruf Spedition wegen Palette Winterkollektion', source: 'Sprache', at: '2026-11-24T08:12:00', suggest: { project: 'Shop', due: '2026-11-24', priority: 'hoch' } },
  { id: 'in2', title: 'Rechnung Fotograf prüfen und buchen', source: 'Scan', at: '2026-11-24T07:55:00', suggest: { project: 'Finanzen', due: '2026-11-26', priority: 'mittel' } },
  { id: 'in3', title: 'Verpackungsmaterial nachbestellen (Karton 30 × 20)', source: 'Notiz', at: '2026-11-23T17:40:00', suggest: { project: 'Shop', due: '2026-11-25', priority: 'mittel' } },
  { id: 'in4', title: 'Jana fragen: Weihnachtsgeschenke für die Eltern', source: 'Erfassen', at: '2026-11-23T21:15:00', suggest: { project: 'Privat', due: '2026-11-28', priority: 'niedrig' } },
  { id: 'in5', title: 'Artikel zur neuen Verpackungsverordnung lesen', source: 'Teilen', at: '2026-11-23T14:05:00', suggest: { project: 'Shop', priority: 'niedrig' } },
  { id: 'in6', title: 'Idee: Adventskalender-Bundle im Shop anbieten', source: 'Sprache', at: '2026-11-22T10:30:00', suggest: { project: 'Vertrieb', priority: 'mittel' } },
  { id: 'in7', title: 'Steuerberater: Frage zu Etsy-Gebühren mitbringen', source: 'Erfassen', at: '2026-11-21T16:20:00', suggest: { project: 'Finanzen', due: '2026-11-27', priority: 'mittel' } },
];

/** Bereits archivierte Erledigungen je Tag (nicht mehr in der Liste). Zusammen mit tasks[].doneAt ergibt das die Wochenstatistik (Mo + Di = 9). */
export const taskActivity = [
  { day: '2026-11-18', archived: 4 }, { day: '2026-11-19', archived: 6 }, { day: '2026-11-20', archived: 4 }, { day: '2026-11-21', archived: 1 },
  { day: '2026-11-22', archived: 0 }, { day: '2026-11-23', archived: 5 }, { day: '2026-11-24', archived: 2 },
];

/** Fokus-Sitzungen (Pomodoro, 25 Min.) der letzten Tage; heute bis 09:30: zwei Sitzungen. */
const FOCUS_DAYS = {
  '2026-11-18': [['t17', '09:00'], ['t17', '09:30'], ['t3', '14:00'], ['t3', '14:30']],
  '2026-11-19': [['t6', '08:30'], ['t6', '09:00'], ['t9', '10:00'], ['t9', '10:30'], ['t13', '15:00']],
  '2026-11-20': [['t10', '09:00'], ['t10', '09:30'], ['t21', '11:00']],
  '2026-11-23': [['t11', '08:30'], ['t3', '10:00'], ['t3', '10:30'], ['t7', '15:30']],
  '2026-11-24': [['t1', '08:05'], ['t5', '08:40']],
};
export const taskFocusLog = Object.entries(FOCUS_DAYS).flatMap(([day, list]) => list.map(([taskId, at], i) => ({
  id: `fl-${day.slice(5)}-${i + 1}`, taskId, title: (baseTasks.find((t) => t.id === taskId) || {}).title || 'Aufgabe', start: `${day}T${at}:00`, minutes: 25, kind: 'Fokus',
})));
export const taskFocusGoal = { sessionsPerDay: 6, focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15 };
