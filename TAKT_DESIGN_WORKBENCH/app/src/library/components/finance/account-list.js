// Finanzen: Konten nach Art gruppiert – Salden, Verlauf, Kreditrahmen; Konto antippen öffnet die Buchungen des Kontos.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Sparkline, Field, Input, Select, toneColor } from '../../ui.js';
import { arr, wealth, r2 } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, eur0, Tile } from './_fin.js';
import { fmtPercent } from '../../../lib/format.js';
import { ex } from './_example.js';

const TYPES = [{ value: 'giro', label: 'Girokonto' }, { value: 'savings', label: 'Tagesgeld' }, { value: 'credit', label: 'Kreditkarte' }, { value: 'business', label: 'Geschäftskonto' }];
const ICON = { giro: 'credit-card', business: 'briefcase', savings: 'piggy-bank', credit: 'credit-card', depot: 'candlestick-chart' };
const num = (v) => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

function AccountForm({ onSave }) {
  const [name, setName] = useState(''), [type, setType] = useState('giro'), [bank, setBank] = useState(''), [bal, setBal] = useState('0');
  return html`<div class="tk-fn-stack"><${Field} label="Name"><${Input} value=${name} onInput=${setName} placeholder="z. B. Girokonto" maxlength="40" /><//><${Field} label="Art"><${Select} value=${type} onChange=${setType} options=${TYPES} /><//>
    <${Field} label="Bank (optional)"><${Input} value=${bank} onInput=${setBank} /><//><${Field} label="Kontostand heute (€)" hint="Du kannst ihn später korrigieren."><${Input} inputmode="decimal" value=${bal} onInput=${setBal} /><//>
    <${Button} variant="primary" icon="check" disabled=${!name.trim()} onClick=${() => onSave({ name: name.trim(), type, bank: bank.trim(), balance: type === 'credit' ? -Math.abs(num(bal)) : num(bal) })}>Konto speichern<//></div>`;
}

export const finAccountList = {
  id: 'fin-account-list',
  name: 'Kontenübersicht',
  category: 'Finanzen',
  description: 'Konten nach Art (Liquidität, Rücklagen, Anlage, Kreditkarte) mit Saldo, Verlauf und Gesamtvermögen. Antippen öffnet die Buchungen des Kontos oder wählt es für eine danebenstehende Liste. Konto anlegen inklusive.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Konten' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['rows', 'cards'], default: 'rows' },
    { name: 'tapMode', label: 'Antippen', type: 'select', options: ['open', 'select'], default: 'open' },
    { name: 'showTotal', label: 'Gesamtsumme zeigen', type: 'boolean', default: true },
    { name: 'allowAdd', label: 'Konto anlegen erlauben', type: 'boolean', default: true },
  ],
  data: slots('accounts', 'prefs'),
  events: ['account.open', 'account.select', 'account.add'],
  states: ['empty'],
  css: `
  .tk-fna__grp { display:flex; justify-content:space-between; gap:8px; padding:var(--tk-space-3) 0 4px; } .tk-fna__grp:first-child { padding-top:0; }
  .tk-fna__row { padding:8px 8px; margin-inline:-8px; width:calc(100% + 16px); min-height:60px; } .tk-fna__row[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-fna__cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap:var(--tk-space-3); }
  .tk-fna__card { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-fna__card:hover { background:var(--tk-c-surface3); } .tk-fna__card[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-fna__lim { height:5px; border-radius:3px; background:var(--tk-c-surface3); overflow:hidden; } .tk-fna__lim i { display:block; height:100%; background:var(--tk-c-accent2); }
  [data-tk-large-text] .tk-fna__total { font-size:var(--tk-fs-2xl); } [data-tk-large-text] .tk-fna__row { flex-wrap:wrap; row-gap:4px; align-items:flex-start; height:auto; } [data-tk-large-text] .tk-fna__row > .tk-fn-grow { flex:1 1 100%; } [data-tk-large-text] .tk-fna__row > .tk-fn-ico, [data-tk-large-text] .tk-fna__row > svg, [data-tk-large-text] .tk-fna__card .tk-fn-ico, [data-tk-large-text] .tk-fna__card svg { display:none; }
  [data-tk-large-text] .tk-fna__row > .tk-fn-num { margin-left:auto; } [data-tk-large-text] .tk-fna__card .tk-fn-row { flex-wrap:wrap; } [data-tk-large-text] .tk-fna__card .tk-fn-grow { flex:1 1 100%; } [data-tk-large-text] .tk-fna__card .tk-fn-title { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:break-word; } [data-tk-large-text] .tk-fna__grp { flex-wrap:wrap; }`,
  example: { data: ex('accounts', 'prefs') },
  render: function FinAccountList({ props, data, setData, ctx }) {
    const c = pctx(ctx, data), accs = arr(data.accounts);
    const add = () => ctx.openDialog({ title: 'Konto anlegen', body: (close) => html`<${AccountForm} onSave=${(f) => { const id = `acc-${f.type}-${accs.length + 1}`; setData('accounts', (l) => [...arr(l), { id, name: f.name, bank: f.bank, type: f.type, balance: f.balance, icon: ICON[f.type], tone: 1, spark: [f.balance] }]); ctx.emit('account.add', { id }); ctx.toast('Konto angelegt'); close(); }} />` });
    const addBtn = props.allowAdd && html`<${Button} size="sm" variant="ghost" icon="plus" onClick=${add}>Konto<//>`;
    if (!accs.length) return html`<${Card} title=${props.title} icon="landmark"><${EmptyState} icon="landmark" title="Noch kein Konto" text="Lege dein Girokonto an, dann kannst du Buchungen erfassen und siehst, was frei ist." action=${props.allowAdd && html`<${Button} variant="primary" icon="plus" onClick=${add}>Konto anlegen<//>`} /><//>`;
    const w = wealth(accs), card = accs.filter((a) => a.type === 'credit');
    const groups = [...w.groups.filter((g) => g.accounts.length).map((g) => ({ id: g.id, label: g.label, list: g.accounts })), ...(card.length ? [{ id: 'credit', label: 'Kreditkarte', list: card }] : [])];
    const pick = (a) => { if (props.tapMode === 'select') { ctx.setUi('account', ctx.ui.account === a.id ? null : a.id); ctx.emit('account.select', { id: a.id }); } else ctx.emit('account.open', { id: a.id, ui: { account: a.id } }); };
    const sub = (a) => (a.type === 'savings' ? `${a.bank} · ${fmtPercent(a.interestPa || 0, { digits: 1 })} p. a.` : a.type === 'depot' ? `${a.bank} · Wert aus dem Depot` : a.type === 'credit' ? `${a.bank} · Rahmen ${eur0(c, a.limit || 0)}` : `${a.bank || ''}${a.iban ? ` · ${a.iban.slice(-8)}` : ''}`);
    const bal = (a) => html`<strong class="tk-fn-num" style=${a.balance < 0 ? 'color:var(--tk-c-text)' : ''}>${eur(c, a.balance)}</strong>`;
    const trend = (a) => (arr(a.spark).length > 1 ? html`<${Sparkline} values=${a.spark} width=${56} height=${22} tone=${a.balance >= 0 ? toneColor(a.tone || 1) : 'neutral'} />` : null);
    const total = html`<div class="tk-fn-row" style="justify-content:space-between;margin-bottom:var(--tk-space-3)"><div><div class="tk-fn-cap">Gesamtvermögen</div><div class="tk-fn-big tk-fna__total">${eur(c, w.net)}</div></div>${ctx.ui.account && html`<${Button} size="sm" variant="ghost" icon="x" onClick=${() => ctx.setUi('account', null)}>Auswahl aufheben<//>`}</div>`;
    const pressed = (a) => String(ctx.ui.account === a.id);
    const body = props.style === 'cards'
      ? groups.map((g) => html`<div class="tk-fna__grp"><span class="tk-fn-cap">${g.label}</span></div><div class="tk-fna__cards">${g.list.map((a) => html`<button type="button" class="tk-fna__card" aria-pressed=${pressed(a)} onClick=${() => pick(a)} aria-label=${`${a.name}, ${eur(c, a.balance)}`}>
          <span class="tk-fn-row"><${Tile} icon=${a.icon || ICON[a.type]} tone=${a.tone || 1} size=${34} /><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${a.name}</span><span class="tk-fn-sub tk-fn-title" style="display:block">${sub(a)}</span></span></span>
          <span class="tk-fn-row" style="justify-content:space-between"><span class="tk-fn-big" style="font-size:var(--tk-fs-xl)">${eur(c, a.balance)}</span>${trend(a)}</span>
          ${a.type === 'credit' && a.limit ? html`<span class="tk-fna__lim" role="img" aria-label=${`Rahmen zu ${Math.round((-a.balance / a.limit) * 100)} Prozent genutzt`}><i style=${`width:${Math.min(100, (-a.balance / a.limit) * 100)}%`}></i></span>` : null}</button>`)}</div>`)
      : groups.map((g) => html`<div class="tk-fna__grp"><span class="tk-fn-cap">${g.label}</span><span class="tk-fn-sub tk-fn-num">${eur0(c, r2(g.list.reduce((s, a) => s + a.balance, 0)))}</span></div><div class="tk-fn-list">${g.list.map((a) => html`<button type="button" class="tk-fn-tap tk-fna__row" aria-pressed=${pressed(a)} onClick=${() => pick(a)} aria-label=${`${a.name}, ${eur(c, a.balance)}`}>
          <${Tile} icon=${a.icon || ICON[a.type]} tone=${a.tone || 1} size=${36} /><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${a.name}</span><span class="tk-fn-sub tk-fn-title" style="display:block">${sub(a)}</span></span>${trend(a)}${bal(a)}<${Icon} name="chevron-right" size=${15} /></button>`)}</div>`);
    return html`<${Card} title=${props.title} icon="landmark" actions=${addBtn}>${props.showTotal && total}${body}<//>`;
  },
};
export default [finAccountList];
