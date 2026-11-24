// Finanzen: Buchungs-Detail – Kategorie ändern (mit Regel-Angebot), Notiz, Beleg und Aufteilen auf zwei Kategorien.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Badge, Field, Select, Input, Textarea } from '../../ui.js';
import { arr, obj, catMeta, r2, matchRule } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, Tile, txAmount, txColor, dayLabel } from './_fin.js';
import { fmtTime } from '../../../lib/format.js';
import { toDate } from '../../../lib/date.js';
import { ex } from './_example.js';

const num = (v) => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

function SplitForm({ tx, cats, onSave }) {
  const total = Math.abs(tx.amount), opts = arr(cats).filter((c) => c.kind === 'variabel' || c.kind === 'fix').filter((c) => c.id !== tx.category);
  const [cat, setCat] = useState(opts[0]?.id || ''), [part, setPart] = useState('10,00'), p = num(part);
  const ok = cat && p > 0 && p < total;
  return html`<div class="tk-fn-stack"><p class="tk-fn-meta">${tx.title}: ${eur({}, total)} gesamt. Der Rest bleibt bei „${tx.category}“.</p>
    <${Field} label="Zweite Kategorie"><${Select} value=${cat} onChange=${setCat} options=${opts.map((c) => ({ value: c.id, label: c.label }))} /><//>
    <${Field} label="Betrag in dieser Kategorie (€)" error=${p >= total ? 'Der Betrag muss kleiner als der Gesamtbetrag sein.' : null}><${Input} inputmode="decimal" value=${part} onInput=${setPart} /><//>
    <${Button} variant="primary" icon="split" disabled=${!ok} onClick=${() => onSave(cat, r2(p))}>Aufteilen<//></div>`;
}

export const finTxDetail = {
  id: 'fin-tx-detail',
  name: 'Buchungs-Detail',
  category: 'Finanzen',
  description: 'Eine Buchung im Detail: Betrag, Konto, Zeitpunkt; Kategorie ändern (auf Wunsch als Regel merken), Notiz, Beleg anhängen und auf zwei Kategorien aufteilen. Die Auswahl kommt aus der Buchungsliste (selectedId).',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Buchung' },
    { name: 'allowSplit', label: 'Aufteilen anbieten', type: 'boolean', default: true },
  ],
  data: [...slots('transactions', 'accounts', 'cats', 'rules', 'subs', 'prefs'), { slot: 'txMeta', label: 'Zusatzangaben', default: 'txMeta', shape: '{[txId]:{note?,receipt?}}', required: false }],
  events: ['tx.category', 'tx.note', 'tx.receipt', 'tx.split', 'tx.rule', 'tx.sub'],
  states: ['empty'],
  css: `
  .tk-fnx__hero { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; }
  .tk-fnx__sec { display:flex; flex-direction:column; gap:8px; padding-top:var(--tk-space-4); margin-top:var(--tk-space-4); border-top:1px solid var(--tk-c-border); }
  .tk-fnx__chips { display:flex; flex-wrap:wrap; gap:6px; }
  .tk-fnx__file { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); min-width:0; }
  .tk-fnx__kv { display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:var(--tk-fs-sm); margin:0; } .tk-fnx__kv dt { color:var(--tk-c-text-subtle); } .tk-fnx__kv dd { margin:0; text-align:right; min-width:0; overflow-wrap:anywhere; }`,
  example: { data: { ...ex('transactions', 'accounts', 'categories', 'rules', 'subscriptions', 'prefs', 'txMeta') } },
  render: function FinTxDetail({ props, data, setData, ctx }) {
    const c = pctx(ctx, data), txs = arr(data.transactions), meta = obj(data.txMeta);
    const sorted = [...txs].sort((a, b) => toDate(b.date) - toDate(a.date));
    const tx = txs.find((t) => t.id === ctx.ui.selectedId) || sorted[0];
    const [note, setNote] = useState(null);
    if (!tx) return html`<${Card} title=${props.title} icon="receipt"><${EmptyState} icon="receipt" title="Keine Buchung gewählt" text="Wähle in der Buchungsliste eine Buchung aus." /><//>`;
    const m = catMeta(data.categories, tx.category), tr = tx.type === 'transfer', acc = (id) => arr(data.accounts).find((a) => a.id === id)?.name || '–';
    const upd = (patch) => setData('transactions', (l) => arr(l).map((t) => (t.id === tx.id ? { ...t, ...patch } : t)));
    const curNote = note ?? tx.note ?? meta[tx.id]?.note ?? '', receipt = tx.receipt ?? meta[tx.id]?.receipt, sub = tx.subscriptionId && arr(data.subscriptions).find((s) => s.id === tx.subscriptionId);
    const pool = arr(data.categories).filter((x) => (tx.type === 'income' ? x.kind === 'einkommen' : x.kind === 'variabel' || x.kind === 'fix' || x.kind === 'sparen'));
    const setCat = (id) => { const cm = catMeta(data.categories, id); upd({ category: id, icon: cm.icon, split: undefined }); ctx.emit('tx.category', { id: tx.id, category: id }); ctx.toast(`Kategorie: ${cm.label}`); };
    const word = (tx.title.split(/[\s,]+/).find((w) => w.length > 2) || '').toLowerCase();
    const ruleOffer = !tr && word && !matchRule(data.rules, tx.title);
    const addRule = () => { setData('rules', (l) => [...arr(l), { id: `r-${word}`, match: word, category: tx.category, active: true, hits: 1 }]); ctx.emit('tx.rule', { match: word, category: tx.category }); ctx.toast(`Regel angelegt: „${word}“ → ${m.label}`); };
    const saveNote = () => { upd({ note: curNote }); setNote(null); ctx.emit('tx.note', { id: tx.id }); ctx.toast('Notiz gespeichert'); };
    const attach = (how) => { upd({ receipt: `beleg-${String(tx.date).slice(0, 10)}${how === 'foto' ? '.jpg' : '.pdf'}` }); ctx.emit('tx.receipt', { id: tx.id, action: 'attach' }); ctx.toast('Beleg angehängt (Simulation)'); };
    const openSplit = () => ctx.openDialog({ title: 'Buchung aufteilen', body: (close) => html`<${SplitForm} tx=${tx} cats=${data.categories} onSave=${(cat, part) => { upd({ split: [{ category: tx.category, amount: r2(tx.amount + part) }, { category: cat, amount: -part }] }); ctx.emit('tx.split', { id: tx.id, category: cat, amount: part }); ctx.toast('Aufgeteilt, Budgets sind aktualisiert'); close(); }} />` });
    const openAttach = () => ctx.openDialog({ title: 'Beleg anhängen', body: (close) => html`<div class="tk-fn-stack"><${Button} icon="camera" onClick=${() => { attach('foto'); close(); }}>Foto aufnehmen<//><${Button} icon="file-text" onClick=${() => { attach('datei'); close(); }}>Datei wählen<//><p class="tk-fn-note"><${Icon} name="info" size=${14} />Demo: Es wird nur ein Dateiname gespeichert. Belege bleiben lokal auf dem Gerät.</p></div>` });
    return html`<${Card} title=${props.title} icon="receipt"><div class="tk-fnx__hero"><${Tile} icon=${tr ? 'arrow-left-right' : tx.icon || m.icon} tone=${tr ? 'neutral' : m.tone} size=${48} /><div class="tk-fn-grow"><div class="tk-fn-title" style="font-size:var(--tk-fs-lg)">${tx.title}</div><div class="tk-fn-meta">${dayLabel(c, tx.date)} · ${fmtTime(tx.date)} Uhr</div></div>
      <div class="tk-fn-big" style=${`color:${txColor(tx)}`} data-qa="tx-amount">${txAmount(c, tx)}</div></div>
      <dl class="tk-fnx__kv" style="margin-top:var(--tk-space-4)"><dt>Konto</dt><dd>${tr ? `${acc(tx.account)} → ${acc(tx.to)}` : acc(tx.account)}</dd><dt>Art</dt><dd>${tr ? 'Umbuchung (zählt nicht als Ausgabe)' : tx.type === 'income' ? 'Einnahme' : 'Ausgabe'}</dd>${sub ? html`<dt>Vertrag</dt><dd><button type="button" class="tk-btn tk-btn--sm tk-btn--ghost" onClick=${() => ctx.emit('tx.sub', { id: sub.id })}>${sub.name}<${Icon} name="chevron-right" size=${14} /></button></dd>` : null}</dl>
      ${!tr && html`<div class="tk-fnx__sec"><span class="tk-fn-cap">Kategorie</span>${arr(tx.split).length ? html`<div class="tk-fn-stack">${tx.split.map((s) => html`<div class="tk-fn-row"><${Tile} icon=${catMeta(data.categories, s.category).icon} tone=${catMeta(data.categories, s.category).tone} size=${28} /><span class="tk-fn-grow">${catMeta(data.categories, s.category).label}</span><strong class="tk-fn-num">${eur(c, s.amount)}</strong></div>`)}<div><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${() => { upd({ split: undefined }); ctx.toast('Aufteilung aufgehoben'); }}>Aufteilung aufheben<//></div></div>`
        : html`<div class="tk-fnx__chips" role="group" aria-label="Kategorie ändern">${pool.map((x) => html`<button type="button" class="tk-chip" aria-pressed=${String(x.id === tx.category)} onClick=${() => setCat(x.id)}><${Icon} name=${x.icon} size=${14} />${x.label}</button>`)}</div>
        ${ruleOffer && html`<div class="tk-fn-undo"><span class="tk-fn-grow">Immer „${word}“ als ${m.label} einordnen?</span><${Button} size="sm" icon="sparkles" onClick=${addRule}>Regel anlegen<//></div>`}
        ${props.allowSplit && tx.type === 'expense' && html`<div><${Button} size="sm" variant="ghost" icon="split" onClick=${openSplit}>Auf zwei Kategorien aufteilen<//></div>`}`}</div>`}
      <div class="tk-fnx__sec"><span class="tk-fn-cap">Notiz</span><${Textarea} value=${curNote} onInput=${setNote} placeholder="z. B. wofür oder mit wem" rows="2" aria-label="Notiz" />${note !== null && note !== (tx.note ?? meta[tx.id]?.note ?? '') && html`<div><${Button} size="sm" variant="primary" icon="check" onClick=${saveNote}>Notiz speichern<//></div>`}</div>
      <div class="tk-fnx__sec"><span class="tk-fn-cap">Beleg</span>${receipt ? html`<div class="tk-fnx__file"><${Icon} name="paperclip" size=${16} /><span class="tk-fn-grow tk-fn-title">${receipt}</span><${Button} size="sm" variant="ghost" icon="trash-2" aria-label="Beleg entfernen" onClick=${() => { upd({ receipt: null }); ctx.emit('tx.receipt', { id: tx.id, action: 'remove' }); }} /></div>` : html`<div><${Button} size="sm" icon="paperclip" onClick=${openAttach}>Beleg anhängen<//></div>`}</div><//>`;
  },
};
export default [finTxDetail];
