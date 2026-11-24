// Gemeinsame Datenwelt: Dokumente & Verträge (Eigentümer: documents; Bauplan 5.13).
// Fristen und Dokumente gehören documents. Laufende Kosten und Summen gehören Finanzen: `contracts` wird aus den Abos
// (`subscriptions`) und den Fristen (`financeSubMeta`) der Finanzwelt abgeleitet und ergänzt nur eigene Metadaten
// (Anbieter, Kundennummer, Erinnerung). Beträge und Kündigungsfristen werden nie doppelt gepflegt.
// Belege (scans.js `receipts`) und Geschäftsbuchungen (finance.js `transactions`) erscheinen im Steuerordner nur als Verweis.
import { subscriptions, financeSubMeta, transactions, scenarios as financeScenarios } from './finance.js';
import { receipts } from './scans.js';
import { events as calendarEvents } from './organisation.js';
import { TODAY, addDay, triple } from './_util.js';
import { fmtDate } from '../../lib/format.js';
import { dayDiff } from '../../lib/date.js';
import { warrantyEnd, warrantyState, buildDeadlines, taxStats } from '../../library/components/documents/_deadlines.js';

const at = (day, hhmm = '12:00') => `${day}T${hhmm}:00`;

// --- Ordner (Grundstruktur der App, bleibt auch im Erststart) -----------------------------------------------------
export const documentFolders = [
  { id: 'f-vertraege', name: 'Verträge', icon: 'scroll-text', tone: 1, desc: 'Mobilfunk, Fitness und weitere laufende Verträge', retention: '3 Jahre nach Vertragsende' },
  { id: 'f-versicherung', name: 'Versicherungen', icon: 'shield-check', tone: 3, desc: 'Policen und Schreiben der Versicherer', retention: '3 Jahre nach Vertragsende' },
  { id: 'f-wohnen', name: 'Wohnen', icon: 'home', tone: 2, desc: 'Mietvertrag, Strom, Abrechnungen', retention: '3 Jahre nach Vertragsende' },
  { id: 'f-steuer', name: 'Steuer 2026', icon: 'landmark', tone: 4, desc: 'Bescheide, Meldungen und Nachweise', retention: '8 bis 10 Jahre (Richtwert)' },
  { id: 'f-garantie', name: 'Garantien', icon: 'badge-check', tone: 5, desc: 'Kaufbelege mit Gewährleistung und Garantie', retention: 'Ablauf plus 1 Jahr' },
  { id: 'f-ausweise', name: 'Ausweise', icon: 'contact-round', tone: 6, desc: 'Kopien von Ausweis und Reisepass', retention: 'Bis zum Ablauf' },
  { id: 'f-geschaeft', name: 'Geschäft', icon: 'briefcase', tone: 1, desc: 'Nordlicht Studio: Anmeldung, Abos, Steuerberatung', retention: '8 bis 10 Jahre (Richtwert)' },
];

// --- Dokumente (Eigentum documents). Neueste zuerst. `validUntil` = Ablaufdatum, `contractId` = Vertrag (abgeleitet) ------
const D = (id, title, folderId, type, date, o = {}) => ({ id, title, folderId, type, date, added: at(date), pages: 1, format: 'PDF', size: '240 KB', source: 'Scanner', tags: [], ...o });
export const documents = [
  D('doc-kfz-schreiben', 'HUK-Coburg: Schreiben zum Beitrag 2027', 'f-versicherung', 'Schreiben', '2026-11-24', { added: at('2026-11-24', '08:20'), contractId: 'ct-sub-kfz', source: 'Foto', format: 'JPG', size: '1,4 MB', pages: 2, tags: ['Auto', 'neu'], excerpt: 'Mitteilung zum Beitrag für das Versicherungsjahr 2027. Die Fristen stehen im Schreiben.', note: 'Heute fotografiert. Frist und Wortlaut im Schreiben selbst prüfen.' }),
  D('doc-strom-abrechnung', 'Stadtwerke Bielefeld: Jahresabrechnung Strom 2025', 'f-wohnen', 'Rechnung', '2026-11-23', { added: at('2026-11-23', '19:05'), contractId: 'ct-sub-strom', source: 'E-Mail', pages: 4, size: '380 KB', tags: ['Wohnen'], excerpt: 'Abrechnungszeitraum 01.01. bis 31.12.2025, Verbrauch und Abschläge.' }),
  D('doc-ust-okt', 'Umsatzsteuer-Voranmeldung Oktober 2026', 'f-steuer', 'Meldung', '2026-11-10', { added: at('2026-11-10', '16:40'), source: 'Import', tags: ['Steuer', 'Geschäft'], excerpt: 'Voranmeldungszeitraum Oktober 2026, übermittelt über die Steuersoftware.' }),
  D('doc-pass', 'Reisepass (Kopie)', 'f-ausweise', 'Ausweis', '2017-02-19', { added: at('2026-09-03', '10:10'), validUntil: '2027-02-18', sensitive: true, format: 'JPG', size: '960 KB', tags: ['Reise'], excerpt: 'Gültig bis 18.02.2027. Für die Japan-Reise 2027 rechtzeitig erneuern.', note: 'Für die Japan-Reise im September 2027 sollte der Pass noch gültig sein. Einreiseregeln beim Auswärtigen Amt prüfen.' }),
  D('doc-est-2025', 'Einkommensteuerbescheid 2025', 'f-steuer', 'Bescheid', '2026-08-12', { added: at('2026-08-12', '11:30'), pages: 6, size: '510 KB', tags: ['Steuer'], excerpt: 'Festsetzung der Einkommensteuer für das Jahr 2025.' }),
  D('doc-kauf-drucker', 'Kaufbeleg Etikettendrucker', 'f-garantie', 'Beleg', '2024-11-27', { added: at('2025-01-08', '09:15'), warrantyId: 'w-drucker', tags: ['Geschäft', 'Garantie'], excerpt: 'Etikettendrucker für den Versand, Kauf am 27.11.2024.', size: '180 KB' }),
  D('doc-kauf-kaffee', 'Kaufbeleg Kaffeevollautomat', 'f-garantie', 'Beleg', '2024-12-05', { added: at('2024-12-05', '18:20'), warrantyId: 'w-kaffee', tags: ['Haushalt', 'Garantie'], excerpt: 'Kaffeevollautomat, Kauf am 05.12.2024, zwei Jahre Gewährleistung.', size: '210 KB' }),
  D('doc-kauf-notebook', 'Kaufbeleg Notebook Pro 14″', 'f-garantie', 'Beleg', '2025-03-14', { added: at('2025-03-14', '14:00'), warrantyId: 'w-notebook', tags: ['Geschäft', 'Garantie'], pages: 2, size: '320 KB', excerpt: 'Notebook mit Herstellergarantie auf 36 Monate.' }),
  D('doc-kauf-kopfhoerer', 'Kaufbeleg Kopfhörer', 'f-garantie', 'Beleg', '2025-06-20', { added: at('2025-06-20', '12:40'), warrantyId: 'w-kopfhoerer', tags: ['Privat', 'Garantie'], source: 'Foto', format: 'JPG', size: '1,1 MB' }),
  D('doc-kauf-waschmaschine', 'Kaufbeleg Waschmaschine', 'f-garantie', 'Beleg', '2021-02-18', { added: at('2021-02-18', '16:00'), warrantyId: 'w-waschmaschine', tags: ['Haushalt', 'Garantie'], pages: 2, excerpt: 'Garantie und Gewährleistung sind abgelaufen, der Beleg bleibt bis Februar 2027 im Ordner.' }),
  D('doc-handy', 'Telekom Mobilfunk: Vertrag, 24 Monate', 'f-vertraege', 'Vertrag', '2025-03-15', { added: at('2025-03-15', '13:10'), contractId: 'ct-sub-handy', validUntil: '2027-03-14', pages: 8, size: '1,2 MB', tags: ['Mobilfunk'], excerpt: 'Mindestlaufzeit 24 Monate, Verlängerung um 12 Monate, Kündigungsfrist drei Monate.' }),
  D('doc-kfz-police', 'HUK-Coburg: Police Kfz-Versicherung 2026', 'f-versicherung', 'Versicherung', '2025-12-18', { added: at('2025-12-18', '10:20'), contractId: 'ct-sub-kfz', validUntil: '2026-12-31', pages: 6, size: '410 KB', tags: ['Auto', 'Versicherung'], excerpt: 'Versicherungsjahr 2026, Verlängerung zum 01.01.2027 ohne Kündigung.' }),
  D('doc-depot-steuer', 'Jahressteuerbescheinigung Depot 2025', 'f-steuer', 'Bescheinigung', '2026-02-20', { added: at('2026-02-20', '08:50'), source: 'Import', tags: ['Steuer', 'Depot'], excerpt: 'Erträge und einbehaltene Steuern des Depots für das Jahr 2025.' }),
  D('doc-adobe', 'Adobe Creative Cloud: Abo-Bestätigung', 'f-geschaeft', 'Vertrag', '2025-09-09', { added: at('2025-09-09', '09:30'), contractId: 'ct-sub-adobe', source: 'E-Mail', tags: ['Geschäft', 'Software'] }),
  D('doc-fitx', 'FitX Mitgliedschaft: Vertrag', 'f-vertraege', 'Vertrag', '2023-09-01', { added: at('2023-09-01', '17:45'), contractId: 'ct-sub-fitx', pages: 5, size: '600 KB', tags: ['Fitness'], excerpt: 'Monatlich kündbar mit einer Frist von 28 Tagen zum Monatsende.' }),
  D('doc-strom', 'Stadtwerke Bielefeld: Stromliefervertrag', 'f-wohnen', 'Vertrag', '2024-02-10', { added: at('2024-02-10', '12:00'), contractId: 'ct-sub-strom', pages: 3, tags: ['Wohnen'], excerpt: 'Variabler Tarif, Kündigung mit 14 Tagen Frist.' }),
  D('doc-stb', 'Steuerberatungsvertrag Kanzlei Brandt', 'f-geschaeft', 'Vertrag', '2024-01-15', { added: at('2024-01-15', '15:30'), pages: 4, tags: ['Steuer', 'Geschäft'], links: [{ kind: 'event', id: 'e17' }], excerpt: 'Beratung der Nordlicht Studio, Ansprechpartner Tim Brandt.' }),
  D('doc-gewerbe', 'Gewerbeanmeldung Nordlicht Studio', 'f-geschaeft', 'Meldung', '2022-05-02', { added: at('2022-05-02', '10:00'), tags: ['Geschäft'], excerpt: 'Anmeldung eines Gewerbes: Handel mit Wohnaccessoires.' }),
  D('doc-miete', 'Mietvertrag Wohnung Bielefeld', 'f-wohnen', 'Vertrag', '2021-04-01', { added: at('2021-04-01', '11:15'), contractId: 'ct-sub-miete', pages: 14, size: '2,1 MB', tags: ['Wohnen'], excerpt: 'Unbefristeter Mietvertrag. Fristen stehen im Vertrag.' }),
  D('doc-perso', 'Personalausweis (Kopie)', 'f-ausweise', 'Ausweis', '2021-06-03', { added: at('2026-09-03', '10:05'), validUntil: '2031-06-02', sensitive: true, format: 'JPG', size: '820 KB', tags: ['Identität'] }),
];

// --- Garantien: Gewährleistung (gesetzlich) und optional Herstellergarantie, Enden aus Kaufdatum und Monaten ------------
const W = (id, title, purchaseDate, price, o) => ({ id, title, purchaseDate, price, legalMonths: 24, makerMonths: 0, ...o, legalEnd: warrantyEnd(purchaseDate, 24), makerEnd: warrantyEnd(purchaseDate, o.makerMonths || 0) });
export const warranties = [
  W('w-drucker', 'Etikettendrucker', '2024-11-27', 189, { documentId: 'doc-kauf-drucker', store: 'Büro & Versand Müller', category: 'Geschäft', business: true, serial: '•••• 2207', note: 'Zwei Jahre Gewährleistung. Mängel vor dem Ablauf melden.' }),
  W('w-kaffee', 'Kaffeevollautomat', '2024-12-05', 649, { documentId: 'doc-kauf-kaffee', store: 'Elektro Brinkmann', category: 'Haushalt', makerMonths: 36, serial: '•••• 3321', note: 'Herstellergarantie 36 Monate auf Registrierung.' }),
  W('w-notebook', 'Notebook Pro 14″', '2025-03-14', 1649, { documentId: 'doc-kauf-notebook', store: 'Online-Händler', category: 'Geschäft', business: true, makerMonths: 36, serial: '•••• 8842' }),
  W('w-kopfhoerer', 'Kopfhörer mit Geräuschunterdrückung', '2025-06-20', 299, { documentId: 'doc-kauf-kopfhoerer', store: 'Elektro Brinkmann', category: 'Privat', serial: '•••• 1180' }),
  W('w-waschmaschine', 'Waschmaschine', '2021-02-18', 549, { documentId: 'doc-kauf-waschmaschine', store: 'Küchen & Hausgeräte Bielefeld', category: 'Haushalt', makerMonths: 60, serial: '•••• 7716' }),
];

// --- Steuerordner 2026: Struktur und Verweise (Beträge und Status kommen aus den Quellen) ------------------------------
// Unterlagen-Frist: ein Tag vor dem Termin bei der Kanzlei (Kalender e17), nicht frei gesetzt
const advisorEvent = calendarEvents.find((e) => e.id === 'e17');
export const taxFolder = {
  year: 2026, due: advisorEvent ? addDay(advisorEvent.start, -1) : '2026-11-26', advisor: { name: 'Tim Brandt', company: 'Kanzlei Brandt', eventId: 'e17', cardId: 'k2' },
  formats: ['PDF-Sammelmappe', 'ZIP mit Einzeldateien', 'Liste als CSV'], lastExport: null,
  categories: [
    { id: 'tc-einnahmen', name: 'Einnahmen', hint: 'Auszahlungen der Verkaufskanäle', icon: 'store', refs: [{ kind: 'tx', id: 't5' }, { kind: 'tx', id: 't3' }] },
    { id: 'tc-betrieb', name: 'Betriebsausgaben', hint: 'Belege und laufende Geschäftskosten', icon: 'receipt', refs: [{ kind: 'receipt', id: 'r2' }, { kind: 'receipt', id: 'r4' }, { kind: 'sub', id: 'sub-adobe' }, { kind: 'missing', id: 't2', label: 'Belege Oktober', note: 'Aufgabe „Belege Oktober hochladen“ ist noch offen', to: 'tasks.detail' }] },
    { id: 'tc-anschaffungen', name: 'Anschaffungen', hint: 'Geräte für das Geschäft, die Abschreibung läuft über mehrere Jahre', icon: 'laptop', refs: [{ kind: 'doc', id: 'doc-kauf-drucker' }, { kind: 'doc', id: 'doc-kauf-notebook' }] },
    { id: 'tc-versicherung', name: 'Versicherungen', hint: 'Policen und Beitragsschreiben', icon: 'shield-check', refs: [{ kind: 'doc', id: 'doc-kfz-police' }, { kind: 'doc', id: 'doc-kfz-schreiben' }] },
    { id: 'tc-bescheide', name: 'Bescheide und Meldungen', hint: 'Vom Finanzamt und vom Depot', icon: 'landmark', refs: [{ kind: 'doc', id: 'doc-est-2025' }, { kind: 'doc', id: 'doc-ust-okt' }, { kind: 'doc', id: 'doc-depot-steuer' }] },
  ],
};

// --- Verträge: aus Finanzen abgeleitet (Abo + Fristen) plus eigene Metadaten ------------------------------------------
const contractMeta = {
  'sub-kfz': { kind: 'Versicherung', provider: 'HUK-Coburg', termStart: '2026-01-01', customerNo: '•••• 4471', cancelTo: 'Kundenservice laut Police, schriftlich oder im Kundenportal', note: 'Beitragsschreiben für 2027 liegt vor (Dokumente).' },
  'sub-handy': { kind: 'Mobilfunk', provider: 'Telekom', termStart: '2025-03-15', customerNo: '•••• 9025', cancelTo: 'Kundenservice laut Vertrag, schriftlich oder im Kundencenter' },
  'sub-fitx': { kind: 'Fitness', provider: 'FitX', customerNo: '•••• 5310', cancelTo: 'Studio oder Online-Kündigung im Mitgliederbereich', note: 'Zum Jahresende kündigen: Frist 28 Tage.' },
  'sub-strom': { kind: 'Energie', provider: 'Stadtwerke Bielefeld', customerNo: '•••• 2204', cancelTo: 'Kundenservice, schriftlich oder im Kundenportal' },
  'sub-miete': { kind: 'Wohnen', provider: 'Hausverwaltung', customerNo: '–', cancelTo: 'Laut Mietvertrag', note: 'Mietverträge kündigst du mit der im Vertrag genannten Frist.' },
  'sub-netflix': { kind: 'Streaming', provider: 'Netflix', customerNo: '–', cancelTo: 'Online im Konto' },
  'sub-spotify': { kind: 'Streaming', provider: 'Spotify', customerNo: '–', cancelTo: 'Online im Konto' },
  'sub-icloud': { kind: 'Cloud', provider: 'Apple', customerNo: '–', cancelTo: 'Einstellungen des Geräts' },
  'sub-adobe': { kind: 'Software', provider: 'Adobe', customerNo: '–', cancelTo: 'Online im Konto', note: 'Betriebsausgabe, gehört in den Steuerordner.' },
};
const baseId = (id) => String(id).split('~')[0];
/** Verträge aus einer Abo-Liste der Finanzwelt: Beträge, Intervall, Tag und Fristen bleiben dort, hier nur gelesen. */
export function contractsFrom(subs, meta = financeSubMeta) {
  return subs.map((s) => {
    const m = meta[baseId(s.id)] || {}, own = contractMeta[baseId(s.id)] || {};
    const endsOn = s.renewal ? addDay(s.renewal, -1) : m.cancelBy && s.noticeDays ? addDay(m.cancelBy, s.noticeDays) : null;
    return {
      id: `ct-${s.id}`, subscriptionId: s.id, name: s.name, kind: own.kind || 'Vertrag', provider: own.provider || s.name, category: s.category, icon: s.icon,
      amount: s.amount, interval: s.interval, day: s.day, cancelable: !!s.cancelable, business: !!s.business, noticeDays: s.noticeDays ?? null, renewal: s.renewal ?? null,
      cancelBy: m.cancelBy ?? null, endsOn, term: m.term || 'Laufzeit offen', termStart: own.termStart ?? null, customerNo: own.customerNo || '–', cancelTo: own.cancelTo || '',
      note: own.note || m.note || '', reminder: { on: !!m.cancelBy, days: [30, 14, 3] },
    };
  });
}
export const contracts = contractsFrom(subscriptions);

// --- Kennzahlen, Hinweise, Suche, Mitteilungen (aus den Daten abgeleitet) ------------------------------------------------
function summaryOf({ docs, cons, wars, tax }) {
  if (!docs.length && !cons.length && !wars.length) return { kpis: [{ label: 'Dokumente', value: 0, icon: 'files', tone: 'neutral', to: 'documents.scan-in' }] };
  const src = { transactions, receipts, documents: docs, subscriptions: cons.map((c) => ({ id: c.subscriptionId, name: c.name, amount: c.amount })) };
  const dl = buildDeadlines({ contracts: cons, warranties: wars, documents: docs, tax, taxOpen: taxStats(tax, src).open, today: TODAY });
  const n30 = dl.filter((d) => d.days <= 30).length;
  const activeW = wars.filter((w) => warrantyState(w, TODAY).status !== 'abgelaufen').length;
  return { kpis: [
    { label: 'Fristen in 30 Tagen', value: n30, icon: 'calendar-clock', tone: n30 ? 'warning' : 'success', to: 'documents.home' },
    { label: 'Verträge und Abos', value: cons.length, icon: 'scroll-text', tone: 'neutral', to: 'documents.contracts' },
    { label: 'Dokumente', value: docs.length, icon: 'files', tone: 'neutral', to: 'documents.list' },
    { label: 'Garantien aktiv', value: activeW, icon: 'badge-check', tone: 'info', to: 'documents.warranties' },
  ] };
}
export const documentsSummary = summaryOf({ docs: documents, cons: contracts, wars: warranties, tax: taxFolder });

const taxNow = taxStats(taxFolder, { transactions, receipts, documents, subscriptions: contracts.map((c) => ({ id: c.subscriptionId, name: c.name, amount: c.amount })) });
// Hinweis: fmtDate im Stil weekday endet auf „.“ (z. B. „Fr, 27.11.“). Steht das Datum am Satzende, ist das der Schlusspunkt.
const wd = (iso) => fmtDate(iso, { style: 'weekday' });
const inDays = (iso) => { const n = dayDiff(TODAY, iso); return n === 0 ? 'heute' : n === 1 ? 'morgen' : `in ${n} Tagen`; };
const druck = warranties.find((w) => w.id === 'w-drucker'), kaffee = warranties.find((w) => w.id === 'w-kaffee'), fitx = contracts.find((c) => c.id === 'ct-sub-fitx');
// Kündigungsfristen kennt Finanzen schon (Hinweis und Mitteilung zur Kfz-Versicherung): hier nur Fristen, die dort nicht vorkommen
export const documentsHints = [
  { id: 'h-doc-drucker', text: `Gewährleistung des Etikettendruckers endet ${inDays(druck.legalEnd)} (${wd(druck.legalEnd)}). Mängel vorher melden.`, source: 'warranties[w-drucker]', module: 'documents', tone: 'warning', to: 'documents.warranties', carry: { selectedId: 'w-drucker' } },
  { id: 'h-doc-steuer', text: `Steuerordner ${taxFolder.year}: ${taxNow.open} Einträge offen, Termin bei der Kanzlei Brandt am ${wd('2026-11-27')}`, source: 'taxFolder', module: 'documents', tone: 'info', to: 'documents.tax-folder' },
  { id: 'h-doc-fitx', text: `FitX: Kündigung zum ${fmtDate(fitx.endsOn)} ist noch bis ${fmtDate(fitx.cancelBy)} möglich.`, source: 'contracts[ct-sub-fitx]', module: 'documents', tone: 'info', to: 'documents.contract', carry: { selectedId: 'ct-sub-fitx' } },
];
const folderName = (id) => documentFolders.find((f) => f.id === id)?.name || 'Dokumente';
export const documentsSearch = [
  ...documents.map((d) => ({ id: `doc:${d.id}`, type: 'Dokument', title: d.title, subtitle: `${folderName(d.folderId)} · ${fmtDate(d.date)}`, module: 'documents', to: 'documents.detail', params: { id: d.id } })),
  ...warranties.map((w) => { const s = warrantyState(w, TODAY); return { id: `warranty:${w.id}`, type: 'Garantie', title: w.title, subtitle: s.next ? `${s.next.label} endet ${fmtDate(s.next.date)}` : 'abgelaufen', module: 'documents', to: 'documents.warranties', params: { id: w.id } }; }),
];
export const documentsNotifications = [
  { id: 'n-doc-drucker', title: `Gewährleistung endet ${inDays(druck.legalEnd)}`, text: `Etikettendrucker, ${wd(druck.legalEnd)} Mängel vorher melden.`, module: 'documents', tone: 'warning', priority: 'wichtig', time: at(TODAY, '07:30'), to: 'documents.warranties' },
  { id: 'n-doc-steuer', title: `Steuerordner ${taxFolder.year}`, text: `${taxNow.open} Einträge sind noch offen. Der Termin bei der Kanzlei Brandt ist am ${wd('2026-11-27')}`, module: 'documents', tone: 'neutral', priority: 'normal', time: at(TODAY, '08:15'), to: 'documents.tax-folder' },
  { id: 'n-doc-kaffee', title: 'Gewährleistung Kaffeevollautomat', text: `Endet am ${fmtDate(kaffee.legalEnd)}, die Herstellergarantie läuft bis ${fmtDate(kaffee.makerEnd)}.`, module: 'documents', tone: 'neutral', priority: 'leise', time: at(addDay(TODAY, -1), '18:00'), to: 'documents.warranties' },
];

// --- Szenarien: Erster Start (nichts abgelegt, Ordner und Steuer-Struktur bleiben) und Stress (Listen ×3, Verträge aus den ×3-Abos) ---
const stressDocs = triple(documents), stressWars = triple(warranties);
const stressCons = contractsFrom(financeScenarios.stress.subscriptions || triple(subscriptions));
export const scenarios = {
  erststart: {
    documents: [], contracts: [], warranties: [], documentsSummary: summaryOf({ docs: [], cons: [], wars: [], tax: taxFolder }),
    documentsHints: [], documentsSearch: [], documentsNotifications: [], documentFolders,
    taxFolder: { ...taxFolder, lastExport: null, categories: taxFolder.categories.map((c) => ({ ...c, refs: [] })) },
  },
  stress: { contracts: stressCons, documentsSummary: summaryOf({ docs: stressDocs, cons: stressCons, wars: stressWars, tax: taxFolder }) },
};
