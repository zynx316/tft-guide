// Gemeinsame Datenwelt: Erfassungen, Belege und Visitenkarten (Eigentümer: picture-to-text). Referenztag: Di, 24.11.2026 09:30.
// Die Erkennung selbst ist in der Vorschau simuliert; Beleg, Visitenkarte und Dokument verweisen per `captureId` auf ihre Erfassung.
// Buchungen gehören Finanzen (`transactions`), Notizen gehören Wissen (`notes`): aus einer Erfassung entsteht per Aktion dort ein Eintrag.
import { triple } from './_util.js';

const L = (...lines) => lines.join('\n');
const cap = (id, title, source, when, text, lang, confidence, uncertain = [], extra = {}) => ({
  id, title, source, text, lang, confidence, uncertain, created: when.iso, meta: when.label, kind: 'text',
  subtitle: text.split('\n').join(' · ').slice(0, 70),
  badge: `${Math.round(confidence * 100)} %`, tone: confidence > 0.9 ? 'success' : 'warning',
  icon: { camera: 'camera', file: 'image', clipboard: 'clipboard' }[source], group: { camera: 'Kamera', file: 'Datei', clipboard: 'Zwischenablage' }[source], ...extra,
});

/** Erfassungen (Text, Beleg, Karte, Dokument) – neueste zuerst. `uncertain` = unsichere Wörter mit Vorschlag. */
const capturesRaw = [
  cap('c1', 'Quittung Bäckerei Hoffmann', 'camera', { iso: '2026-11-24T08:12:00', label: 'Heute, 08:12' }, L('Bäckerei Hoffmann', 'Bahnhofstraße 12, 33602 Bielefeld', '24.11.2026 08:05 Uhr', '2 × Brötchen 1,60 €', '1 × Kaffee 2,90 €', 'Summe 4,50 €', 'Vielen Dank für Ihren Besuch!'), 'Deutsch', 0.97, [], { kind: 'receipt', receiptId: 'r1' }),
  cap('c2', 'Whiteboard Sprint-Planung', 'camera', { iso: '2026-11-23T16:40:00', label: 'Gestern' }, L('Sprint 23 – Planung', 'Ziel: Workbench-Beta', 'Offen: Kaiender-Varianten', 'Demo am Freitag 14:00 Uhr'), 'Deutsch', 0.91, [{ word: 'Kaiender-Varianten', alt: 'Kalender-Varianten', conf: 0.58 }]),
  cap('c3', 'Visitenkarte Dr. Müller', 'file', { iso: '2026-11-22T10:05:00', label: 'Sonntag' }, L('Dr. Anna Müiler', 'Rechtsanwältin', 'Müller & Partner mbB', 'Tel. +49 521 555 0142', 'anna.mueller@mueller-partner.example'), 'Deutsch', 0.88, [{ word: 'Müiler', alt: 'Müller', conf: 0.61 }], { kind: 'card', cardId: 'k1' }),
  cap('c7', 'Stromliefervertrag (3 Seiten)', 'file', { iso: '2026-11-21T17:20:00', label: 'Samstag' }, L('Stromliefervertrag', 'Vertragsnummer 7741-2209', 'Laufzeit 12 Monate ab 01.01.2027', 'Arbeitspreis 31,4 ct/kWh', 'Kündigungsfrist 4 Wochen zum Laufzeitende'), 'Deutsch', 0.93, [{ word: '31,4', alt: '31,9', conf: 0.66 }], { kind: 'document', pages: 3 }),
  cap('c4', 'Screenshot Fehlermeldung', 'clipboard', { iso: '2026-11-20T14:22:00', label: '20.11.' }, L('Error 503: Service Unavailable', 'The server is temporarily unable to handle your request.', 'Please try again later.'), 'Englisch', 0.99),
  cap('c5', 'Buchseite „Deep Work“', 'file', { iso: '2026-11-17T21:30:00', label: '17.11.' }, L('Konzentratlon ist eine Fähigkeit,', 'die man trainieren kann – wie einen Muskel.', 'Jede Ablenkunq schwächt das Training.'), 'Deutsch', 0.84, [{ word: 'Konzentratlon', alt: 'Konzentration', conf: 0.55 }, { word: 'Ablenkunq', alt: 'Ablenkung', conf: 0.52 }]),
  cap('c6', 'Handschriftliche Einkaufsliste', 'camera', { iso: '2026-11-15T09:10:00', label: '15.11.' }, L('Einkauf Samstag', 'Hafermilch', 'Tomaten (Strauch)', 'Basilikurn', 'Kaffee Bohnen'), 'Deutsch', 0.72, [{ word: 'Basilikurn', alt: 'Basilikum', conf: 0.49 }, { word: '(Strauch)', alt: '(Roma)', conf: 0.42 }]),
  cap('c8', 'Rechnung Buchhandlung Neumann', 'camera', { iso: '2026-11-23T15:40:00', label: 'Gestern' }, L('Buchhandlung Neumann', 'Rechnung Nr. 20418', '2 × Fachbuch Typografle 49,80 €', 'Summe inkl. 7 % MwSt. 49,80 €', 'Zahlbar innerhalb von 14 Tagen'), 'Deutsch', 0.96, [{ word: 'Typografle', alt: 'Typografie', conf: 0.61 }], { kind: 'receipt', receiptId: 'r2' }),
  cap('c9', 'Rechnung Karton & Pack GmbH', 'file', { iso: '2026-11-20T11:15:00', label: '20.11.' }, L('Karton & Pack GmbH', 'Rechnung vom 20.11.2026', '50 × Versandkarton M 62,40 €', 'Polsterfolie 50 m 24,95 €', 'Packband 6 × 21,00 €, Versand 20,00 €', 'Summe 128,35 €'), 'Deutsch', 0.9, [], { kind: 'receipt', receiptId: 'r4' }),
  cap('c10', 'Kassenbon Thalia Bücher', 'camera', { iso: '2026-11-16T14:22:00', label: '16.11.' }, L('Thalia Bücher', 'Deep Work 24,00 €', 'Atomic Habits 18,50 €', 'Summe 42,50 €', 'Zahlung Karte'), 'Deutsch', 0.97, [], { kind: 'receipt', receiptId: 'r3' }),
  cap('c11', 'Visitenkarte Tim Brandt', 'camera', { iso: '2026-11-19T16:50:00', label: '19.11.' }, L('Tim Brandt', 'Geschäftsführer', 'Kanzlei Brandt', 'Tel. +49 521 555 0177', 'tim.brandt@kanzlei-brandt.example'), 'Deutsch', 0.95, [], { kind: 'card', cardId: 'k2' }),
];

export const captures = [...capturesRaw].sort((a, b) => b.created.localeCompare(a.created));

/** Beispielbilder für „Text erkennen“ (Simulation). */
export const captureSamples = [
  { title: 'Rechnung Buchhandlung Neumann', source: 'camera', lang: 'Deutsch', confidence: 0.96, text: L('Buchhandlung Neumann', 'Rechnung Nr. 20418', '2 × Fachbuch Typografle 49,80 €', 'Summe inkl. 7 % MwSt. 49,80 €', 'Zahlbar innerhalb von 14 Tagen'), uncertain: [{ word: 'Typografle', alt: 'Typografie', conf: 0.61 }] },
  { title: 'Vertrag Stromanbieter (Seite 1)', source: 'file', lang: 'Deutsch', confidence: 0.93, text: L('Stromliefervertrag', 'Vertragsnummer 7741-2209', 'Laufzeit 12 Monate ab 01.01.2027', 'Arbeitspreis 31,4 ct/kWh', 'Kündigungsfrist 4 Wochen zum Laufzeitende'), uncertain: [{ word: '31,4', alt: '31,9', conf: 0.66 }] },
  { title: 'Screenshot Terminbestätigung', source: 'clipboard', lang: 'Deutsch', confidence: 0.98, text: L('Terminbestätigung', 'Zahnarztpraxis Dr. Keller', 'Donnerstag, 03.12.2026 um 10:30 Uhr', 'Bitte 10 Minuten früher erscheinen.'), uncertain: [] },
  { title: 'Notizzettel Telefonat', source: 'camera', lang: 'Deutsch', confidence: 0.79, text: L('Rückruf Herr Schmidt', 'Angebot 4182 prüfen', 'Lieferzeit bis Mitte Januar?', 'Tel. 0521 / 555 0199'), uncertain: [{ word: '4182', alt: '4132', conf: 0.57 }, { word: 'Schmidt', alt: 'Schmitt', conf: 0.63 }] },
];

// Belege: Summen stimmen mit den Positionen überein; darin enthaltene MwSt wird von der Komponente berechnet.
export const receipts = [
  { id: 'r1', captureId: 'c1', merchant: 'Bäckerei Hoffmann', date: '2026-11-24', time: '08:05', total: 4.5, vatRate: 7, category: 'Lebensmittel', account: 'Girokonto', payment: 'Karte', status: 'offen', conf: { merchant: 0.98, date: 0.96, total: 0.97 }, lines: [{ name: 'Brötchen', qty: 2, total: 1.6 }, { name: 'Kaffee', qty: 1, total: 2.9 }] },
  { id: 'r2', captureId: 'c8', merchant: 'Buchhandlung Neumann', date: '2026-11-23', time: '15:40', total: 49.8, vatRate: 7, category: 'Business', account: 'Geschäftskonto', payment: 'Rechnung', status: 'offen', conf: { merchant: 0.95, date: 0.9, total: 0.96 }, lines: [{ name: 'Fachbuch Typografie', qty: 2, total: 49.8 }] },
  { id: 'r4', captureId: 'c9', merchant: 'Karton & Pack GmbH', date: '2026-11-20', time: '11:15', total: 128.35, vatRate: 19, category: 'Business', account: 'Geschäftskonto', payment: 'Überweisung', status: 'offen', conf: { merchant: 0.93, date: 0.74, total: 0.9 }, lines: [{ name: 'Versandkarton M', qty: 50, total: 62.4 }, { name: 'Polsterfolie 50 m', qty: 1, total: 24.95 }, { name: 'Packband', qty: 6, total: 21 }, { name: 'Versand', qty: 1, total: 20 }] },
  { id: 'r3', captureId: 'c10', merchant: 'Thalia Bücher', date: '2026-11-16', time: '14:22', total: 42.5, vatRate: 7, category: 'Freizeit', account: 'Kreditkarte', payment: 'Karte', status: 'offen', conf: { merchant: 0.97, date: 0.97, total: 0.98 }, lines: [{ name: 'Buch „Deep Work“', qty: 1, total: 24 }, { name: 'Buch „Atomic Habits“', qty: 1, total: 18.5 }] },
];

export const businessCards = [
  { id: 'k1', captureId: 'c3', name: 'Dr. Anna Müiler', title: 'Rechtsanwältin', company: 'Müller & Partner mbB', phone: '+49 521 555 0142', email: 'anna.mueller@mueller-partner.example', web: 'mueller-partner.example', address: 'Marktstraße 4, 33602 Bielefeld', conf: { name: 0.61, phone: 0.92, email: 0.9 } },
  { id: 'k2', captureId: 'c11', name: 'Tim Brandt', title: 'Geschäftsführer', company: 'Kanzlei Brandt', phone: '+49 521 555 0177', email: 'tim.brandt@kanzlei-brandt.example', web: 'kanzlei-brandt.example', address: 'Obernstraße 18, 33602 Bielefeld', conf: { name: 0.97, phone: 0.8, email: 0.96 } },
];

// Abgeleitete Werte (aus den Listen, nie von Hand)
function deriveScans(list, receiptList) {
  const unsure = (c) => (c.uncertain || []).length;
  const toReview = list.filter((c) => unsure(c) > 0).map((c) => ({ id: c.id, title: c.title, subtitle: c.uncertain.map((u) => u.word).join(', '), meta: c.meta, badge: `${unsure(c)} unsicher`, tone: 'warning', icon: 'alert-triangle', group: c.group }));
  const open = receiptList.filter((r) => r.status === 'offen').length;
  const avg = list.length ? Math.round((list.reduce((s, c) => s + c.confidence, 0) / list.length) * 100) : null;   // ohne Erfassung kein Durchschnitt
  return {
    toReview, open, count: list.length,
    metrics: [
      { label: 'Erfassungen', value: list.length, icon: 'scan-text', tone: 'accent' },
      { label: 'Zu prüfen', value: toReview.length, icon: 'alert-triangle', tone: 'warning' },
      { label: 'Belege offen', value: open, icon: 'receipt', tone: 'info' },
      { label: 'Ø Konfidenz', raw: avg, kind: 'percent', icon: 'gauge', tone: 'success' },
    ],
    bySource: { segments: !list.length ? [] : ['camera', 'file', 'clipboard'].map((s) => ({ label: { camera: 'Kamera', file: 'Datei', clipboard: 'Zwischenablage' }[s], value: list.filter((c) => c.source === s).length })) },
  };
}
const ds = deriveScans(captures, receipts);
export const capturesToReview = ds.toReview;
export const capturesMetrics = ds.metrics;
export const capturesBySource = ds.bySource;

const summaryOf = (d) => ({ kpis: [
  { label: 'zu prüfen', value: d.toReview.length, icon: 'alert-triangle', tone: d.toReview.length ? 'warning' : 'success', to: 'picture-to-text.history' },
  { label: 'Belege offen', value: d.open, icon: 'receipt', tone: 'info', to: 'picture-to-text.receipt' },
  { label: 'Erfassungen', value: d.count, icon: 'scan-text', tone: 'neutral', to: 'picture-to-text.history' },
] });
export const pictureToTextSummary = summaryOf(ds);
export const pictureToTextHints = [
  ...(ds.open ? [{ id: 'h-ptt-receipts', text: `${ds.open} Belege warten auf Prüfung und Buchung.`, source: 'receipts', module: 'picture-to-text', tone: 'info', to: 'picture-to-text.receipt' }] : []),
  ...(ds.toReview.length ? [{ id: 'h-ptt-review', text: `${ds.toReview.length} Erfassungen enthalten unsichere Wörter – ein kurzer Blick lohnt sich.`, source: 'captures', module: 'picture-to-text', tone: 'neutral', to: 'picture-to-text.history' }] : []),
];
const eurText = (v) => `${String(v.toFixed(2)).replace('.', ',')}\u00a0€`;
export const pictureToTextSearch = [
  ...captures.map((c) => ({ id: `scan:${c.id}`, type: c.kind === 'receipt' ? 'Beleg-Erfassung' : c.kind === 'card' ? 'Visitenkarte' : 'Erfassung', title: c.title, subtitle: `${c.group} · ${c.meta}`, module: 'picture-to-text', to: 'picture-to-text.result', params: { id: c.id } })),
  ...receipts.map((r) => ({ id: `receipt:${r.id}`, type: 'Beleg', title: r.merchant, subtitle: `${r.date.slice(8)}.${r.date.slice(5, 7)}. · ${eurText(r.total)} · ${r.status}`, module: 'picture-to-text', to: 'picture-to-text.receipt', params: { id: r.id } })),
  ...businessCards.map((k) => ({ id: `card:${k.id}`, type: 'Kontakt', title: k.name, subtitle: `${k.title} · ${k.company}`, module: 'picture-to-text', to: 'picture-to-text.card', params: { id: k.id } })),
];
export const pictureToTextNotifications = ds.open ? [
  { id: 'n-ptt-receipts', title: `${ds.open} Belege offen`, text: `Zuletzt erkannt: ${receipts[0].merchant}. Prüfen und buchen geht in zwei Tipps.`, module: 'picture-to-text', tone: 'neutral', priority: 'leise', time: captures[0].created, to: 'picture-to-text.receipt' },
] : [];

const zero = deriveScans([], []), ss = deriveScans(triple(captures), triple(receipts));
export const scenarios = {
  erststart: { capturesMetrics: zero.metrics, capturesBySource: zero.bySource, pictureToTextSummary: { kpis: [{ label: 'Erfassungen', value: 0, icon: 'scan-text', tone: 'neutral', to: 'picture-to-text.capture' }] }, captureSamples },
  stress: { capturesMetrics: ss.metrics, capturesBySource: ss.bySource, capturesToReview: ss.toReview, pictureToTextSummary: summaryOf(ss) },
};
