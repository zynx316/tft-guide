// Dokumente & Verträge: Welt-Konsistenz mit den Quellmodulen (Finanzen, Picture to Text), Ableitungen, Aggregate und Szenarien.
import { near } from './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../app/src/seed/world/index.js';
import { applyScenario } from '../app/src/core/world.js';
import { contractsFrom } from '../app/src/seed/world/documents.js';
import { subscriptions, financeSubMeta, transactions } from '../app/src/seed/world/finance.js';
import { receipts } from '../app/src/seed/world/scans.js';
import { buildDeadlines, taxStats } from '../app/src/library/components/documents/_deadlines.js';

const TODAY = '2026-11-24';
const W = WORLD;
const stress = applyScenario(WORLD, 'stress'), erst = applyScenario(WORLD, 'erststart');
const uniq = (list) => new Set(list.map((x) => x.id)).size === list.length;
const src = (w) => ({ transactions: w.transactions, receipts: w.receipts, documents: w.documents, subscriptions: w.contracts.map((c) => ({ id: c.subscriptionId, name: c.name, amount: c.amount })) });
const deadlines = (w) => buildDeadlines({ contracts: w.contracts, warranties: w.warranties, documents: w.documents, tax: w.taxFolder, taxOpen: taxStats(w.taxFolder, src(w)).open, today: TODAY });

test('Verträge sind aus den Abos der Finanzwelt abgeleitet: Beträge, Intervall und Fristen stimmen exakt überein', () => {
  assert.equal(W.contracts.length, subscriptions.length);
  for (const s of subscriptions) {
    const c = W.contracts.find((x) => x.subscriptionId === s.id);
    assert.ok(c, `Vertrag zu ${s.id}`);
    assert.equal(c.id, `ct-${s.id}`); assert.equal(c.amount, s.amount); assert.equal(c.interval, s.interval); assert.equal(c.name, s.name);
    assert.equal(c.cancelBy, financeSubMeta[s.id]?.cancelBy ?? null, `${s.id}: Kündigungsfrist wie in Finanzen`);
    assert.equal(c.term, financeSubMeta[s.id]?.term || 'Laufzeit offen');
  }
  const by = (id) => W.contracts.find((c) => c.id === id);
  assert.equal(by('ct-sub-kfz').cancelBy, '2026-11-30'); assert.equal(by('ct-sub-fitx').cancelBy, '2026-12-03'); assert.equal(by('ct-sub-handy').cancelBy, '2026-12-15');
  assert.equal(by('ct-sub-kfz').endsOn, '2026-12-31'); assert.equal(by('ct-sub-fitx').endsOn, '2026-12-31'); assert.equal(by('ct-sub-handy').endsOn, '2027-03-14');
  assert.ok(uniq(W.contracts));
});

test('Dokumente: eindeutige IDs, Ordner, Verträge, Garantien und Kaufbelege lösen auf', () => {
  assert.ok(uniq(W.documents) && uniq(W.warranties) && uniq(W.documentFolders));
  for (const d of W.documents) {
    assert.ok(W.documentFolders.some((f) => f.id === d.folderId), `${d.id}: Ordner`);
    if (d.contractId) assert.ok(W.contracts.some((c) => c.id === d.contractId), `${d.id}: Vertrag ${d.contractId}`);
    if (d.warrantyId) assert.equal(W.warranties.find((w) => w.id === d.warrantyId)?.documentId, d.id, `${d.id}: Garantie verweist zurück`);
    assert.ok(d.added >= `${d.date}T00:00:00` || d.added.startsWith('20'), 'Zeitstempel');
    assert.ok(d.added <= `${TODAY}T09:30:00`, `${d.id}: nicht nach dem Referenzmoment hinzugefügt`);
  }
  for (const w of W.warranties) assert.ok(W.documents.some((d) => d.id === w.documentId), `${w.id}: Kaufbeleg`);
});

test('Garantien: Enden werden aus Kaufdatum und Monaten abgeleitet', () => {
  const g = (id) => W.warranties.find((w) => w.id === id);
  assert.equal(g('w-drucker').legalEnd, '2026-11-27'); assert.equal(g('w-kaffee').legalEnd, '2026-12-05'); assert.equal(g('w-kaffee').makerEnd, '2027-12-05');
  assert.equal(g('w-waschmaschine').makerEnd, '2026-02-18'); assert.equal(g('w-notebook').makerEnd, '2028-03-14'); assert.equal(g('w-drucker').makerEnd, null);
});

test('Steuerordner: Verweise lösen auf Belege, Buchungen, Abos und Dokumente auf; Belege bleiben bei Picture to Text und Finanzen', () => {
  const st = taxStats(W.taxFolder, src(W));
  const refs = W.taxFolder.categories.flatMap((c) => c.refs);
  assert.equal(st.total, refs.length, 'jeder Verweis löst auf');
  for (const r of refs.filter((x) => x.kind === 'receipt')) assert.ok(receipts.some((x) => x.id === r.id), r.id);
  for (const r of refs.filter((x) => x.kind === 'tx')) { const t = transactions.find((x) => x.id === r.id); assert.ok(t && t.account === 'acc-business' && t.type === 'income', `${r.id}: Geschäftsbuchung`); }
  assert.equal(st.open, 3, 'zwei Belege ohne Buchung und „Belege Oktober“');
  assert.ok(!('receipts' in W.taxFolder) && !W.documents.some((d) => /Karton|Buchhandlung/.test(d.title)), 'Belege nicht kopiert');
  const own = new Set(Object.keys(W.taxFolder)); assert.ok(!own.has('transactions'));
});

test('Fristen am Referenztag: Reihenfolge, Stufen 3/14/30 und Abgleich mit Finanzen', () => {
  const dl = deadlines(W);
  assert.deepEqual(dl.map((d) => [d.title, d.days, d.stage.id]), [
    ['Steuerordner 2026', 2, 'dringend'], ['Etikettendrucker', 3, 'dringend'], ['Kfz-Versicherung', 6, 'bald'], ['Fitnessstudio FitX', 9, 'bald'], ['Kaffeevollautomat', 11, 'bald'], ['Telekom Mobilfunk', 21, 'blick'], ['Reisepass (Kopie)', 86, 'weit'],
  ]);
  for (const d of dl.filter((x) => x.kind === 'contract')) assert.equal(d.date, financeSubMeta[d.refId.replace('ct-', '')].cancelBy);
});

test('Aggregate: Kennzahl nicht monetär, keine Dublette zur Kündigungs-Mitteilung von Finanzen', () => {
  const k = W.documentsSummary.kpis;
  assert.equal(k[0].label, 'Fristen in 30 Tagen'); assert.equal(k[0].value, deadlines(W).filter((d) => d.days <= 30).length); assert.ok(!/€/.test(`${k[0].value}`));
  assert.equal(W.allKpis.documents, k);
  for (const n of W.documentsNotifications) { assert.ok(!/Kündigungsfrist|kündig/i.test(`${n.title} ${n.text}`), `${n.id} wiederholt eine Kündigungsfrist von Finanzen`); assert.ok(n.time <= '2026-11-24T09:30:00'); }
  assert.ok(!W.documentsHints.some((h) => /Kfz/.test(h.text)), 'Kfz-Frist meldet Finanzen');
  const finTexts = [...W.financeHints, ...W.financeNotifications].map((x) => x.text);
  for (const h of W.documentsHints) assert.ok(!finTexts.includes(h.text));
  for (const s of W.documentsSearch) { assert.match(s.id, /^(doc|warranty):/); assert.equal(s.module, 'documents'); }
  assert.ok(W.searchIndex.some((s) => s.id === 'doc:doc-pass') && W.allHints.some((h) => h.module === 'documents') && W.allNotifications.some((n) => n.module === 'documents'));
});

test('Szenario Erster Start: nichts abgelegt, Ordner und Steuer-Struktur bleiben, Kennzahl führt zum Ablegen', () => {
  for (const k of ['documents', 'contracts', 'warranties', 'documentsHints', 'documentsSearch', 'documentsNotifications']) assert.equal(erst[k].length, 0, k);
  assert.ok(erst.documentFolders.length >= 6);
  assert.ok(erst.taxFolder.categories.length >= 4 && erst.taxFolder.categories.every((c) => c.refs.length === 0));
  assert.deepEqual(erst.documentsSummary.kpis[0], { label: 'Dokumente', value: 0, icon: 'files', tone: 'neutral', to: 'documents.scan-in' });
  assert.equal(taxStats(erst.taxFolder, src(erst)).total, 0);
});

test('Szenario Stress: Listen ×3 mit eindeutigen IDs, Verträge aus den ×3-Abos, Kennzahlen folgen', () => {
  assert.equal(stress.documents.length, W.documents.length * 3); assert.equal(stress.warranties.length, W.warranties.length * 3);
  assert.equal(stress.contracts.length, subscriptions.length * 3);
  assert.ok(uniq(stress.documents) && uniq(stress.contracts) && uniq(stress.warranties));
  for (const c of stress.contracts) { const s = stress.subscriptions.find((x) => x.id === c.subscriptionId); assert.ok(s, c.id); assert.ok(near(c.amount, s.amount)); }
  assert.equal(stress.documentsSummary.kpis[2].value, stress.documents.length);
  assert.equal(stress.documentsSummary.kpis[1].value, stress.contracts.length);
  assert.ok(stress.contracts.some((c) => c.name.length > 60), 'lange Namen');
});

test('contractsFrom ist rein und folgt der übergebenen Abo-Liste', () => {
  assert.deepEqual(contractsFrom([]), []);
  const one = contractsFrom([subscriptions[2]]); assert.equal(one[0].id, 'ct-sub-kfz'); assert.equal(one[0].amount, 54.1);
});
