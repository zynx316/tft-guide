// Picture to Text: Beleg als Karte – gestalteter Kassenzettel mit Anteilen je Position, daneben die Prüfung mit Kategorie-Kacheln.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, Input, Field, Segmented, Ring, EmptyState, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';
import { useReceiptForm, findDupe, CATS, CAT_ICON, ACCOUNTS } from './receipt-parts.js';

function Slip({ rc, data, setData, ctx, showItems }) {
  const { f, set, total, err, booked, valid, vat, book, toFinance } = useReceiptForm({ rc, setData, ctx });
  const dupe = findDupe(data.transactions, rc), lines = rc.lines || [], sum = lines.reduce((n, l) => n + l.total, 0) || 1;
  const conf = Math.round(Math.min(...Object.values(rc.conf || { a: 1 })) * 100), low = Object.entries(rc.conf || {}).filter(([, v]) => v < 0.85).map(([k]) => ({ merchant: 'Händler', date: 'Datum', total: 'Betrag' }[k] || k));
  return html`<div class="tk-rcs__stage">
    <div class="tk-rcs__paper" role="img" aria-label=${`Beleg ${rc.merchant}, ${fmt.date(rc.date)}`}>
      <div class="tk-rcs__merchant">${rc.merchant}</div><div class="tk-rcs__sub">${fmt.date(rc.date)}${rc.time ? ` · ${rc.time} Uhr` : ''} · ${rc.payment}</div>
      ${showItems && lines.length > 0 && html`<div class="tk-rcs__bar" aria-hidden="true">${lines.map((l, i) => html`<i style=${`flex:${l.total / sum};background:${toneColor(1 + (i % 6))}`}></i>`)}</div>
        <div class="tk-rcs__lines">${lines.map((l, i) => html`<div><span class="tk-rcs__dot" style=${`background:${toneColor(1 + (i % 6))}`}></span><span class="tk-rcs__name">${l.qty} × ${l.name}</span><span class="tk-num">${money(ctx, l.total)}</span></div>`)}</div>`}
      <div class="tk-rcs__vat"><span>Darin MwSt ${rc.vatRate} %</span><span class="tk-num">${money(ctx, vat)}</span></div>
      <div class="tk-rcs__sum"><span>Gesamt</span><strong class="tk-num">${money(ctx, total > 0 ? total : 0)}</strong></div></div>
    <div class="tk-rcs__check">
      <div class="tk-rcs__conf"><${Ring} value=${conf} max=${100} size=${56} stroke=${7} tone=${conf >= 90 ? 'success' : 'warning'} label=${`Erkennung ${conf} Prozent sicher`}><b style="font-size:var(--tk-fs-xs)">${conf} %</b><//>
        <div><strong>${low.length ? `Bitte prüfen: ${low.join(', ')}` : 'Alles sicher erkannt'}</strong><div class="tk-subtle" style="font-size:var(--tk-fs-sm)"><${Badge} tone=${booked ? 'success' : 'info'} icon=${booked ? 'check' : 'clock'}>${booked ? 'Gebucht' : 'Noch nicht gebucht'}<//></div></div></div>
      ${dupe && !booked && html`<div class="tk-ocr__sugg" role="status"><${Icon} name="copy" size=${18} /><div class="tk-grow"><strong>Möglicherweise schon gebucht</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${dupe.title} · ${money(ctx, dupe.amount)} am ${fmt.date(dupe.date)}</div></div></div>`}
      <${Field} label="Betrag (€)" error=${err.total}><${Input} class="tk-input tk-rcs__amount" inputmode="decimal" value=${f.total} onInput=${set('total')} invalid=${!!err.total} disabled=${booked} /><//>
      <div class="tk-rcs__two"><${Field} label="Händler" error=${err.merchant}><${Input} value=${f.merchant} onInput=${set('merchant')} invalid=${!!err.merchant} disabled=${booked} /><//>
        <${Field} label="Datum" error=${err.date}><${Input} type="date" value=${f.date} onInput=${set('date')} invalid=${!!err.date} disabled=${booked} /><//></div>
      <div><div class="tk-label" id=${`cat-${rc.id}`}>Kategorie</div><div class="tk-rcs__cats" role="radiogroup" aria-labelledby=${`cat-${rc.id}`}>${CATS.map((c) => html`<button type="button" role="radio" aria-checked=${f.cat === c ? 'true' : 'false'} disabled=${booked} onClick=${() => set('cat')(c)}><${Icon} name=${CAT_ICON[c]} size=${20} />${c}</button>`)}</div></div>
      <div><div class="tk-label">Konto</div><${Segmented} label="Konto" value=${f.acc} onChange=${set('acc')} options=${Object.keys(ACCOUNTS).map((a) => ({ value: a, label: a }))} /></div>
      <div class="tk-ocr__actions"><${Button} variant="primary" icon=${booked ? 'check' : 'wallet'} disabled=${booked || !valid} onClick=${() => { ctx.setUi('selectedId', rc.id); book(); }}>${booked ? 'Gebucht' : 'Als Ausgabe buchen'}<//><${Button} icon="arrow-up-right" onClick=${toFinance}>In Finanzen prüfen<//></div>
      <div class="tk-subtle" style="font-size:var(--tk-fs-xs)">${ctx.mode === 'app' ? 'Die Buchung wird in Finanzen vorgeschlagen und erst nach „Speichern“ dort angelegt.' : 'Die Buchung wird nur vorgeschlagen und erst nach „Als Ausgabe buchen“ angelegt.'} Beträge stammen aus der Erkennung, bitte vergleiche sie mit dem Beleg.</div>
    </div></div>`;
}

export const receiptSlip = {
  id: 'receipt-slip',
  name: 'Beleg-Karte',
  category: 'Inhalte',
  description: 'Beleg als gestalteter Kassenzettel (Positionen mit Farbanteilen, MwSt, Gesamt) neben der Prüfung: Erkennungs-Ring, Betrag groß, Kategorie als Kacheln, Konto, Dublettenhinweis und „Als Ausgabe buchen“. Oben wählt eine Leiste den Beleg.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Beleg' },
    { name: 'showItems', label: 'Positionen mit Anteilen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'receipts', label: 'Belege', default: 'receipts', shape: '{id,merchant,date,total,vatRate,category,account?,payment,status:offen|gebucht,lines?,conf?}[]', required: true },
    { slot: 'transactions', label: 'Buchungen (Datenwelt)', default: 'transactions', shape: '{id,date,title,amount,type}[]', required: false },
  ],
  events: ['receipt.open', 'receipt.book', 'receipt.finance', 'receipt.capture', 'form.invalid'],
  states: ['empty'],
  flutter: { widget: 'TaktReceiptSlip', propMap: { title: 'title', showItems: 'showItems' }, events: ['receipt.open', 'receipt.book', 'receipt.finance', 'receipt.capture', 'form.invalid'] },
  css: `
  .tk-rcs { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-rcs__pills { display:flex; flex-wrap:wrap; gap:8px; }
  .bp-mobile .tk-rcs__pills { flex-wrap:nowrap; overflow-x:auto; scroll-snap-type:x proximity; padding-bottom:4px; } .bp-mobile .tk-rcs__pills button { flex:none; scroll-snap-align:start; }
  [data-tk-large-text] .tk-rcs__pills { flex-wrap:wrap; overflow:visible; } [data-tk-large-text] .tk-rcs__pills button { flex:0 1 auto; max-width:100%; }
  .tk-rcs__pills button { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:0 14px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; text-align:left; }
  .tk-rcs__pills button[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-rcs__pills b { font-variant-numeric:tabular-nums; }
  .tk-rcs__stage { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--tk-space-5); align-items:start; }
  .bp-desktop .tk-rcs__stage { grid-template-columns:minmax(0,360px) minmax(0,1fr); }
  .tk-rcs__paper { position:relative; margin-bottom:8px; display:flex; flex-direction:column; gap:12px; padding:var(--tk-space-6) var(--tk-space-5) calc(var(--tk-space-6) + 8px); background:var(--tk-c-surface3); border-radius:var(--tk-radius-md) var(--tk-radius-md) 0 0; box-shadow:var(--tk-shadow-sm, none); min-width:0; }
  .tk-rcs__paper::after { content:''; position:absolute; left:0; right:0; bottom:-8px; height:8px; background:linear-gradient(135deg, var(--tk-c-surface3) 50%, transparent 50%) 0 0/12px 8px, linear-gradient(225deg, var(--tk-c-surface3) 50%, transparent 50%) 0 0/12px 8px; }
  .tk-rcs__merchant { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); overflow-wrap:anywhere; }
  .tk-rcs__sub { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-rcs__bar { display:flex; height:10px; border-radius:5px; overflow:hidden; gap:2px; } .tk-rcs__bar i { display:block; min-width:4px; }
  .tk-rcs__lines { display:flex; flex-direction:column; gap:8px; padding:12px 0; border-top:1px dashed var(--tk-c-border-strong); border-bottom:1px dashed var(--tk-c-border-strong); }
  .tk-rcs__lines > div { display:flex; align-items:baseline; gap:8px; font-size:var(--tk-fs-sm); }
  .tk-rcs__dot { width:8px; height:8px; border-radius:50%; flex:none; } .tk-rcs__name { flex:1; min-width:0; overflow-wrap:anywhere; }
  .tk-rcs__vat, .tk-rcs__sum { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-rcs__sum { font-size:var(--tk-fs-md); color:var(--tk-c-text); } .tk-rcs__sum strong { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.1; }
  .tk-rcs__check { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-rcs__conf { display:flex; align-items:center; gap:14px; }
  .tk-rcs__two { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); } .bp-mobile .tk-rcs__two { grid-template-columns:minmax(0,1fr); }
  .tk-rcs__amount { font-size:var(--tk-fs-2xl) !important; height:56px; font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; }
  .tk-rcs__cats { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; margin-top:6px; }
  .tk-rcs__cats button { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; min-height:72px; padding:8px 4px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; text-align:center; overflow-wrap:anywhere; hyphens:auto; }
  .tk-rcs__cats button[aria-checked="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); }
  .tk-rcs__cats button:disabled { opacity:.6; cursor:default; }`,
  example: { props: {}, data: { transactions: [], receipts: [
    { id: 'r1', merchant: 'Bäckerei Hoffmann', date: '2026-11-24', time: '08:05', total: 4.5, vatRate: 7, category: 'Lebensmittel', account: 'Girokonto', payment: 'Karte', status: 'offen', conf: { merchant: 0.98, date: 0.96, total: 0.97 }, lines: [{ name: 'Brötchen', qty: 2, total: 1.6 }, { name: 'Kaffee', qty: 1, total: 2.9 }] },
  ] } },
  render: function ReceiptSlip({ props, data, setData, ctx }) {
    const all = (data.receipts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!all.length) return html`<${Card} title=${props.title} icon="receipt"><${EmptyState} icon="receipt" title="Noch kein Beleg" text="Fotografiere einen Kassenbon oder eine Rechnung, TAKT liest Händler, Datum und Betrag aus." action=${html`<${Button} variant="primary" icon="camera" onClick=${() => { if (!ctx.emit('receipt.capture', { to: 'picture-to-text.capture' })) ctx.toast('Erfassen öffnet in „Bild erfassen“'); }}>Beleg fotografieren<//>`} /><//>`;
    const sel = all.find((r) => r.id === ctx.ui.selectedId) || all.find((r) => r.status === 'offen') || all[0];
    return html`<div class="tk-rcs" data-qa="receipt-slip"><div class="tk-rcs__pills" role="group" aria-label="Beleg wählen">${all.map((r) => html`<button type="button" aria-pressed=${r.id === sel.id ? 'true' : 'false'} onClick=${() => { ctx.setUi('selectedId', r.id); ctx.emit('receipt.open', { id: r.id }); }}>${r.status === 'gebucht' ? html`<${Icon} name="check" size=${15} />` : null}${r.merchant}<b>${money(ctx, r.total)}</b></button>`)}</div>
      <${Slip} key=${sel.id} rc=${sel} data=${data} setData=${setData} ctx=${ctx} showItems=${props.showItems} /></div>`;
  },
};
