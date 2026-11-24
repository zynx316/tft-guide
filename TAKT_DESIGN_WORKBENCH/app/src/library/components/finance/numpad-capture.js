// Finanzen: Schnell erfassen mit Numpad – Ausgabe, Einnahme, Umbuchung; Kategorie-Vorschläge, Wirkung vorab, Rückgängig.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Input, Segmented, Select } from '../../ui.js';
import { arr, r2, pressKey, digitsToNumber, numberToDigits, suggestCategories, frequentExpenses, catMeta, safeToSpend, spentByCategory, matchRule } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, Tile, bookTx, unbookTx, buildTx } from './_fin.js';
import { ex } from './_example.js';

const MODES = [{ value: 'expense', label: 'Ausgabe', icon: 'minus' }, { value: 'income', label: 'Einnahme', icon: 'plus' }, { value: 'transfer', label: 'Umbuchung', icon: 'arrow-left-right' }];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];
const SAVE = { expense: 'Ausgabe speichern', income: 'Einnahme speichern', transfer: 'Umbuchung speichern' };

export const finNumpadCapture = {
  id: 'fin-numpad-capture',
  name: 'Numpad-Erfassung',
  category: 'Finanzen',
  description: 'Buchung in wenigen Taps erfassen: Betrag über das Numpad, Kategorie aus Vorschlägen, Konto, optional Titel. Ausgabe, Einnahme oder Umbuchung; die Wirkung auf „frei verfügbar“ und das Budget ist vorab sichtbar, Rückgängig inklusive.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Erfassen' },
    { name: 'defaultMode', label: 'Startart', type: 'select', options: ['expense', 'income', 'transfer'], default: 'expense' },
    { name: 'showImpact', label: 'Wirkung vorab zeigen', type: 'boolean', default: false },
    { name: 'showFrequent', label: '„Häufig“-Chips', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: slots('transactions', 'accounts', 'cats', 'rules', 'budgets', 'subs', 'plans', 'events', 'prefs'),
  events: ['capture.save', 'capture.undo', 'capture.mode'],
  states: ['empty'],
  css: `
  .tk-fnp { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; max-width:520px; margin-inline:auto; width:100%; }
  .tk-fnp__disp { display:flex; align-items:baseline; justify-content:center; gap:8px; padding:var(--tk-space-3) 0; min-height:72px; }
  .tk-fnp__amt { font-size:var(--tk-fs-4xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; white-space:nowrap; line-height:1; } .tk-fnp__amt[data-empty="true"] { color:var(--tk-c-text-subtle); }
  .tk-fnp__chips { display:flex; flex-wrap:wrap; gap:6px; } .tk-fnp__row { display:grid; grid-template-columns:1fr 1fr; gap:var(--tk-space-2); } .tk-fnp__row--1 { grid-template-columns:1fr; }
  .tk-fnp__pad { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; }
  .tk-fnp__key { height:56px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-semibold); cursor:pointer; display:grid; place-items:center; }
  .tk-fnp__key:hover { background:var(--tk-c-surface3); } .tk-fnp__key:active { transform:scale(.97); } .tk-fnp__key:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  @media (max-height:760px) { .bp-mobile .tk-fnp__key { height:48px; } .bp-mobile .tk-fnp__disp { min-height:56px; padding:4px 0; } }
  .tk-fnp__impact { display:flex; flex-direction:column; gap:2px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-fnp__impact b { color:var(--tk-c-text); } .tk-fnp__lab { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); margin:0 0 4px; font-weight:var(--tk-fw-semibold); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); }`,
  example: { props: { showImpact: true }, data: ex('transactions', 'accounts', 'categories', 'rules', 'budgets', 'subscriptions', 'plans', 'events', 'prefs') },
  render: function FinNumpadCapture({ props, data, setData, ctx }) {
    const c = pctx(ctx, data);
    const [mode, setMode] = useState(props.defaultMode), [digits, setDigits] = useState(''), [cat, setCat] = useState(null), [accId, setAcc] = useState(null), [toId, setTo] = useState(null), [title, setTitle] = useState(''), [last, setLast] = useState(null);
    const accs = arr(data.accounts).filter((a) => a.type !== 'depot'), txs = arr(data.transactions);
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="keyboard">${b}<//>` : b);
    if (!accs.length) return wrap(html`<div class="tk-state"><div class="tk-state__title">Noch kein Konto</div><div class="tk-state__text">Lege ein Konto an, dann kannst du Buchungen erfassen.</div><div style="margin-top:8px"><${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('account.add')}>Konto anlegen<//></div></div>`);
    const amount = digitsToNumber(digits), from = accId || accs.find((a) => a.type === 'giro')?.id || accs[0].id;
    const dest = toId && toId !== from ? toId : (accs.find((a) => a.type === 'savings' && a.id !== from) || accs.find((a) => a.id !== from))?.id;
    const sug = mode === 'income' ? ['Einnahmen Shop', 'Einnahmen'] : suggestCategories({ txs, cats: data.categories, rules: data.rules, title, today: ctx.today, limit: 6 });
    const chosen = cat && sug.includes(cat) ? cat : cat || sug[0];
    const destAcc = accs.find((a) => a.id === dest), tcat = destAcc?.type === 'savings' ? 'Sparen' : 'Umbuchung';
    const key = (k) => setDigits((d) => pressKey(d, k));
    const valid = amount > 0 && (mode !== 'transfer' || (dest && dest !== from));
    const save = () => {
      if (!valid) return;
      const cc = mode === 'transfer' ? tcat : chosen, meta = catMeta(data.categories, cc);
      const tx = buildTx(ctx, txs, { type: mode, amount, account: from, to: mode === 'transfer' ? dest : undefined, category: cc, title: title.trim(), icon: mode === 'transfer' ? 'arrow-left-right' : meta.icon });
      bookTx(setData, tx); setLast(tx); setDigits(''); setTitle(''); setCat(null);
      ctx.emit('capture.save', { id: tx.id, type: mode, amount }); ctx.toast(`${mode === 'transfer' ? 'Umbuchung' : 'Buchung'} gespeichert`);
    };
    const undo = () => { if (!last) return; unbookTx(setData, last); ctx.emit('capture.undo', { id: last.id }); setLast(null); };
    const onKey = (e) => { if (/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return; if (/^\d$/.test(e.key)) key(e.key); else if (e.key === ',' || e.key === '.') key(','); else if (e.key === 'Backspace') key('back'); else if (e.key === 'Enter') save(); };
    // Wirkung vorab: frei verfügbar und Budget der Kategorie
    let impact = null;
    if (props.showImpact && amount > 0 && data.budgets) {
      const sg = (accounts) => safeToSpend({ accounts, txs, subs: data.subscriptions, plans: data.plans, events: data.events, today: ctx.today, reserve: data.prefs?.reserve ?? 0 });
      const after = arr(data.accounts).map((a) => { const d = mode === 'income' ? amount : -amount; return a.id === from ? { ...a, balance: r2(a.balance + d) } : mode === 'transfer' && a.id === dest ? { ...a, balance: r2(a.balance + amount) } : a; });
      const b0 = sg(data.accounts), b1 = sg(after), bud = mode === 'expense' && arr(data.budgets).find((b) => b.category === chosen), used = spentByCategory(txs, ctx.today)[chosen] || 0;
      if (b0 && b1) impact = html`<div class="tk-fnp__impact" aria-live="polite"><span>Frei verfügbar danach: <b>${eur(c, b1.free)}</b> (vorher ${eur(c, b0.free)})</span>${bud && html`<span>${bud.label}: <b>${eur(c, used + amount)}</b> von ${eur(c, bud.target)}${used + amount > bud.target ? ' – über dem Budget' : ''}</span>`}</div>`;
    }
    const freq = props.showFrequent && mode === 'expense' ? frequentExpenses(txs, 3) : [];
    const fill = (f) => { setTitle(f.title); setCat(f.category); setAcc(f.account); setDigits(numberToDigits(f.amount)); };
    const selOpts = (skip) => accs.filter((a) => a.id !== skip).map((a) => ({ value: a.id, label: a.name }));
    return wrap(html`<div class="tk-fnp" tabindex="0" onKeyDown=${onKey} data-qa="numpad">
      <${Segmented} label="Art der Buchung" value=${mode} onChange=${(v) => { setMode(v); setCat(null); ctx.emit('capture.mode', { mode: v }); }} options=${MODES} />
      <div class="tk-fnp__disp" aria-live="polite"><span class="tk-fnp__amt" data-empty=${String(!digits)} data-qa="amount">${mode === 'income' ? '+' : mode === 'expense' ? '−' : ''}${c.privacy ? '•••• ' : digits || '0'}</span><span class="tk-fn-meta" style="font-size:var(--tk-fs-xl)">€</span></div>
      ${mode !== 'transfer' ? html`<div><p class="tk-fnp__lab">Kategorie</p><div class="tk-fnp__chips" role="group" aria-label="Kategorie">${sug.map((id) => { const m = catMeta(data.categories, id); return html`<button type="button" class="tk-chip" aria-pressed=${String(chosen === id)} onClick=${() => setCat(id)}><${Icon} name=${m.icon} size=${14} />${m.label}</button>`; })}</div></div>` : null}
      ${freq.length ? html`<div><p class="tk-fnp__lab">Häufig</p><div class="tk-fnp__chips">${freq.map((f) => html`<button type="button" class="tk-chip" onClick=${() => fill(f)}><${Icon} name="history" size=${14} />${f.title.length > 22 ? `${f.title.slice(0, 21)}…` : f.title}</button>`)}</div></div>` : null}
      <div class=${`tk-fnp__row ${mode === 'transfer' ? '' : 'tk-fnp__row--1'}`}><label class="tk-field"><span class="tk-field__label">${mode === 'transfer' ? 'Von' : mode === 'income' ? 'Auf Konto' : 'Konto'}</span><${Select} value=${from} onChange=${(v) => { setAcc(v); ctx.emit('capture.mode', { account: v }); }} options=${selOpts(null)} aria-label="Konto" /></label>
        ${mode === 'transfer' && html`<label class="tk-field"><span class="tk-field__label">Nach</span><${Select} value=${dest} onChange=${setTo} options=${selOpts(from)} aria-label="Zielkonto" /></label>`}</div>
      ${mode !== 'transfer' && html`<${Input} value=${title} onInput=${(v) => { setTitle(v); if (!cat) { const r = matchRule(data.rules, v); if (r) setCat(r.category); } }} placeholder="Wofür? z. B. Bäckerei (optional)" aria-label="Titel" maxlength="60" />`}
      ${impact}
      <div class="tk-fnp__pad" role="group" aria-label="Zahlenfeld">${KEYS.map((k) => html`<button type="button" class="tk-fnp__key" onClick=${() => key(k)} aria-label=${k === 'back' ? 'Letzte Ziffer löschen' : k === ',' ? 'Komma' : k}>${k === 'back' ? '⌫' : k}</button>`)}</div>
      <${Button} variant="primary" icon="check" disabled=${!valid} onClick=${save} data-qa="capture-save-btn">${SAVE[mode]}<//>
      ${last && html`<div class="tk-fn-undo" role="status"><span class="tk-fn-grow">${last.type === 'transfer' ? 'Umbuchung' : last.title}: ${eur(c, Math.abs(last.amount))} gespeichert</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${undo}>Rückgängig<//></div>`}</div>`);
  },
};
export default [finNumpadCapture];
