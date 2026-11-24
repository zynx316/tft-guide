// Finanzen: Erfassen in einer Zeile mit Erkennung („−4,90 Café“, „+120 Etsy“, „umbuchen 150 Tagesgeld“).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Badge } from '../../ui.js';
import { arr, parseQuick, catMeta } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, Tile, bookTx, unbookTx, buildTx, readPrefill, prefillDate, PrefillNote, prefillAmountText, markReceiptBooked } from './_fin.js';
import { ex } from './_example.js';

const EXAMPLES = ['−4,90 Café Morgenrot', '−38 Rewe Karte', '+120 Etsy Auszahlung', 'umbuchen 150 Tagesgeld'];
const KIND = { expense: 'Ausgabe', income: 'Einnahme', transfer: 'Umbuchung' };

export const finQuickLine = {
  id: 'fin-quick-line',
  name: 'Erfassen in einer Zeile',
  category: 'Finanzen',
  description: 'Eine Zeile reicht: Betrag, Titel und optional „Karte“ oder „umbuchen“. TAKT erkennt Art, Kategorie (über Regeln) und Konto und zeigt es vor dem Speichern. Enter speichert, Rückgängig holt die Buchung zurück. Kommt die Buchung aus einem Beleg (ctx.ui.prefill), stehen Betrag, Titel, Datum, Kategorie und Konto schon da und sind mit „aus Beleg“ gekennzeichnet.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Schnell erfassen' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['card', 'bar'], default: 'card' },
    { name: 'showExamples', label: 'Beispiele zeigen', type: 'boolean', default: true },
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'z. B. −4,90 Café' },
  ],
  data: slots('transactions', 'accounts', 'cats', 'rules', 'prefs'),
  events: ['capture.save', 'capture.undo', 'capture.prefill-discard', 'numpad.open'],
  states: ['empty'],
  css: `
  .tk-fnq { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-fnq__in { display:flex; gap:8px; align-items:center; } .tk-fnq__in .tk-input { flex:1 1 auto; min-width:0; font-size:max(16px, var(--tk-fs-lg)); }
  .tk-fnq__det { display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:var(--tk-fs-sm); }
  .tk-fnq--bar { padding:var(--tk-space-2) var(--tk-space-3); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border-strong); box-shadow:var(--tk-shadow-md); }`,
  example: { data: ex('transactions', 'accounts', 'categories', 'rules', 'prefs') },
  render: function FinQuickLine({ props, data, setData, ctx }) {
    const c = pctx(ctx, data), accs = arr(data.accounts), txs = arr(data.transactions);
    // Vorbelegung (z. B. aus einem Beleg): Text, Konto, Kategorie und Datum stehen schon da; Verwerfen setzt alles zurück.
    const [pf, setPf] = useState(() => readPrefill(ctx, { accounts: accs, categories: data.categories }));
    const [text, setText] = useState(() => (pf?.amount ? `${pf.kind === 'income' ? '+' : '-'}${prefillAmountText(pf)}` : '')), [last, setLast] = useState(null);
    const parsed = text.trim() ? parseQuick(text, { accounts: accs, cats: data.categories, rules: data.rules }) : null;
    const p = parsed && pf ? { ...parsed, ...(parsed.title ? {} : { title: pf.title }), ...(pf.kind !== 'transfer' ? { type: pf.kind } : {}), ...(pf.account ? { account: pf.account } : {}), ...(pf.category ? { category: pf.category } : {}) } : parsed;
    const ok = p && p.account && (p.type !== 'transfer' || p.to);
    const discard = () => { setPf(null); setText(''); ctx.setUi('prefill', null); ctx.emit('capture.prefill-discard'); };
    const save = () => {
      if (!ok) return;
      const tx = buildTx(ctx, txs, { ...p, date: pf ? prefillDate(ctx, pf) : undefined, receiptId: pf?.receiptId, icon: p.type === 'transfer' ? 'arrow-left-right' : catMeta(data.categories, p.category).icon });
      bookTx(setData, tx); setLast({ ...tx, restore: pf?.receiptId ? markReceiptBooked(ctx, pf.receiptId, tx) : null }); setText(''); setPf(null); ctx.setUi('prefill', null);
      ctx.emit('capture.save', { id: tx.id, type: p.type, amount: p.amount, ...(pf?.receiptId ? { receiptId: pf.receiptId } : {}) }); ctx.toast(pf?.receiptId ? 'Beleg gebucht' : 'Gespeichert');
    };
    const undo = () => { unbookTx(setData, last); last.restore?.(); ctx.emit('capture.undo', { id: last.id }); setLast(null); };
    const accName = (id) => accs.find((a) => a.id === id)?.name || '–';
    const det = p && html`<div class="tk-fnq__det" aria-live="polite" data-qa="quick-detected"><${Badge} tone=${p.type === 'income' ? 'success' : p.type === 'transfer' ? 'info' : 'accent'}>${KIND[p.type]}<//><strong class="tk-fn-num">${eur(c, p.amount)}</strong>
      <${Badge}><${Icon} name=${catMeta(data.categories, p.category).icon} size=${12} /> ${catMeta(data.categories, p.category).label}<//><span class="tk-fn-meta">${p.type === 'transfer' ? `${accName(p.account)} → ${p.to ? accName(p.to) : 'Zielkonto fehlt'}` : accName(p.account)}${p.title ? ` · ${p.title}` : ''}</span></div>`;
    const inner = html`<div class="tk-fnq">
      <div class="tk-fnq__in"><input class="tk-input" value=${text} onInput=${(e) => setText(e.currentTarget.value)} onKeyDown=${(e) => e.key === 'Enter' && save()} placeholder=${props.placeholder} aria-label="Buchung in einer Zeile" inputmode="text" autocomplete="off" />
        <${Button} variant="primary" icon="check" disabled=${!ok} onClick=${save} data-qa="quick-save">Erfassen<//></div>
      ${pf && html`<${PrefillNote} pf=${pf} onDiscard=${discard} />`}
      ${det}
      ${props.style !== 'bar' && props.showExamples && !text && html`<div class="tk-fn-actions" role="group" aria-label="Beispiele">${EXAMPLES.map((x) => html`<button type="button" class="tk-chip" onClick=${() => setText(x.replace('−', '-'))}>${x}</button>`)}</div>`}
      ${last && html`<div class="tk-fn-undo" role="status"><span class="tk-fn-grow">${last.title} · ${eur(c, Math.abs(last.amount))} gespeichert</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${undo}>Rückgängig<//></div>`}
      ${props.style !== 'bar' && html`<div><${Button} size="sm" variant="ghost" icon="keyboard" onClick=${() => ctx.emit('numpad.open')}>Mit Numpad erfassen<//></div>`}</div>`;
    return props.style === 'bar' ? html`<div class="tk-fnq--bar">${inner}</div>` : html`<${Card} title=${props.title} icon="zap">${inner}<//>`;
  },
};
export default [finQuickLine];
