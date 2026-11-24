// Picture to Text: Erkennungsergebnis mit Konfidenz-Markierung, Bildvorschau (gestaltet), Aktionen
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, Segmented, EmptyState, Input, Field, Progress, Switch, Select } from '../../ui.js';
import { isoLocal, wordCount } from './content-util.js';
import { money } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';

const clean = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

function Preview({ cap }) {
  const lines = cap.text.split('\n'); const max = Math.max(...lines.map((l) => l.length), 1);
  const flagged = (l) => (cap.uncertain || []).some((u) => l.includes(u.word));
  return html`<div class="tk-ocr__img" role="img" aria-label=${`Vorschau des erfassten Bildes: ${cap.title}`}>
    <span class="tk-ocr__corner tk-ocr__corner--tl"></span><span class="tk-ocr__corner tk-ocr__corner--tr"></span><span class="tk-ocr__corner tk-ocr__corner--bl"></span><span class="tk-ocr__corner tk-ocr__corner--br"></span>
    <div class="tk-ocr__page">${lines.map((l, i) => html`<i data-flag=${flagged(l) ? 'true' : 'false'} style=${`width:${Math.max(24, Math.round((l.length / max) * 100))}%;${i === 0 ? 'height:9px;' : ''}`}></i>`)}</div>
  </div>`;
}

export const ocrResult = {
  id: 'ocr-result',
  name: 'Erkennungsergebnis',
  category: 'Inhalte',
  description: 'Erkannter Text der gewählten Erfassung (ctx.ui.selectedId) mit Markierung unsicherer Wörter (Tippen übernimmt den Korrekturvorschlag), Sprache, Konfidenz, Bildvorschau und Aktionen Kopieren / Als Notiz speichern / Teilen. Layout „review“ führt Wort für Wort durch alle unsicheren Stellen. Erkennt Belege und Visitenkarten und bietet die passende Auswertung an.',
  version: '1.1',
  props: [
    { name: 'showImage', label: 'Bildvorschau', type: 'boolean', default: true },
    { name: 'showConfidence', label: 'Unsichere Wörter markieren', type: 'boolean', default: true },
    { name: 'allowEdit', label: 'Text bearbeiten erlauben', type: 'boolean', default: true },
    { name: 'layout', label: 'Layout', type: 'select', options: ['side', 'review'], default: 'side' },
  ],
  data: [
    { slot: 'captures', label: 'Erfassungen', default: 'captures', shape: '{id,title,text,lang,confidence,uncertain?:{word,alt,conf}[],source?}[]', required: true },
    { slot: 'notes', label: 'Notizen (Ziel für „Als Notiz“)', default: 'notes', shape: 'Notiz-Array', required: false },
  ],
  events: ['ocr.copy', 'ocr.save-note', 'ocr.share', 'ocr.correct', 'ocr.edit', 'ocr.keep', 'ocr.receipt', 'ocr.card'],
  states: ['empty'],
  css: `
  .tk-ocr { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--tk-space-5); min-width:0; }
  .bp-desktop .tk-ocr--img { grid-template-columns:220px minmax(0,1fr); }
  .tk-ocr__img { position:relative; padding:18px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface3); display:grid; place-items:center; min-height:200px; }
  .tk-ocr__page { width:100%; max-width:200px; min-height:150px; padding:16px 14px; border-radius:var(--tk-radius-sm); background:var(--tk-c-surface); box-shadow:var(--tk-shadow-md); display:flex; flex-direction:column; gap:9px; transform:rotate(-1.2deg); }
  .tk-ocr__page i { display:block; height:6px; border-radius:3px; background:var(--tk-c-border-strong); }
  .tk-ocr__page i[data-flag="true"] { background:var(--tk-c-warning); }
  .tk-ocr__corner { position:absolute; width:16px; height:16px; border:2px solid var(--tk-c-accent); }
  .tk-ocr__corner--tl { top:8px; left:8px; border-right:0; border-bottom:0; border-top-left-radius:6px; }
  .tk-ocr__corner--tr { top:8px; right:8px; border-left:0; border-bottom:0; border-top-right-radius:6px; }
  .tk-ocr__corner--bl { bottom:8px; left:8px; border-right:0; border-top:0; border-bottom-left-radius:6px; }
  .tk-ocr__corner--br { bottom:8px; right:8px; border-left:0; border-top:0; border-bottom-right-radius:6px; }
  .bp-mobile .tk-ocr__img { min-height:150px; }
  .tk-ocr__text { padding:var(--tk-space-4); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); font-size:var(--tk-fs-md); line-height:2; white-space:pre-wrap; overflow-wrap:anywhere; min-height:140px; }
  .tk-ocr__word { display:inline-block; padding:0 4px; margin:0 -1px; border:0; border-bottom:2px dashed var(--tk-c-warning); border-radius:4px 4px 0 0; background:var(--tk-c-warning-soft); color:var(--tk-c-text); font:inherit; line-height:1.5; cursor:pointer; }
  .tk-ocr__word:hover { background:var(--tk-c-warning); color:var(--tk-c-bg); }
  .bp-mobile .tk-ocr__word { min-height:36px; padding:6px 6px; line-height:1.3; }
  .tk-ocr__meta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .tk-ocr__actions { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; }
  .bp-mobile .tk-ocr__actions .tk-btn { flex:1 1 40%; }
  .tk-ocr__sugg { display:flex; align-items:center; gap:12px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-accent-soft); flex-wrap:wrap; }
  .tk-ocr__legend { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); display:flex; align-items:center; gap:6px; }`,
  example: { data: { notes: [], captures: [{ id: 'c1', title: 'Whiteboard Sprint-Planung', text: 'Sprint 23 – Planung\nZiel: Workbench-Beta\nOffen: Kaiender-Varianten\nDemo am Freitag 14:00', lang: 'Deutsch', confidence: 0.93, uncertain: [{ word: 'Kaiender-Varianten', alt: 'Kalender-Varianten', conf: 0.58 }] }] } },
  render: ({ props, data, setData, ctx }) => {
    const [mode, setMode] = useState('view');
    const [saved, setSaved] = useState(null);
    const [own, setOwn] = useState('');
    const caps = data.captures || [];
    const cap = caps.find((c) => c.id === ctx.ui.selectedId) || (props.layout === 'review' && caps.find((c) => (c.uncertain || []).length)) || caps[0];
    if (!cap) return html`<${Card}><${EmptyState} icon="scan-text" title="Noch kein Text erkannt" text="Erfasse ein Bild – der erkannte Text erscheint hier." /><//>`;
    const unsure = cap.uncertain || [];
    const conf = Math.round(cap.confidence * 100);
    const copy = () => { try { navigator.clipboard?.writeText(cap.text); } catch { /* Vorschau */ } ctx.emit('ocr.copy', { id: cap.id }); ctx.toast('Text kopiert'); };
    const toNote = () => {
      const id = (ctx.newId ? ctx.newId("n") : `n${Date.now().toString(36)}`);
      setData('notes', (a) => [{ id, title: cap.title, body: `${cap.text.split('\n').join('\n\n')}`, tags: ['OCR'], inbox: true, updated: isoLocal(ctx.today) }, ...(Array.isArray(a) ? a : [])]);
      setSaved(cap.id); ctx.emit('ocr.save-note', { id: cap.id }); ctx.toast('Als Notiz gespeichert');
    };
    const share = () => { ctx.emit('ocr.share', { id: cap.id }); ctx.openDialog({ title: 'Text teilen',
      body: (close) => html`<div class="tk-col" style="gap:8px">${[['mail', 'Per E-Mail senden'], ['file-text', 'Als Textdatei (.txt) sichern'], ['link-2', 'Link zum Ergebnis kopieren']].map(([ic, l]) => html`<${Button} icon=${ic} style="justify-content:flex-start" onClick=${() => { ctx.toast(l); close(); }}>${l}<//>`)}</div>` }); };
    const fix = (u) => { setData('captures', (all) => all.map((c) => (c.id === cap.id ? { ...c, text: c.text.replace(u.word, u.alt), uncertain: (c.uncertain || []).filter((x) => x.word !== u.word) } : c))); ctx.emit('ocr.correct', { word: u.word, alt: u.alt }); ctx.toast(`„${u.word}“ → „${u.alt}“`); };
    const renderLine = (line) => line.split(/(\s+)/).map((tok) => { const u = props.showConfidence && unsure.find((x) => clean(tok) === clean(x.word) && tok.trim()); return u ? html`<button type="button" class="tk-ocr__word" title=${`Unsicher (${Math.round(u.conf * 100)} %) – tippen für „${u.alt}“`} aria-label=${`Unsicheres Wort ${tok}, Vorschlag ${u.alt}`} onClick=${() => fix(u)}>${tok}</button>` : tok; });
    const words = wordCount(cap.text);
    const sugg = cap.kind === 'receipt' || cap.kind === 'card';
    const suggestion = sugg && html`<div class="tk-ocr__sugg"><span style="color:var(--tk-c-accent)"><${Icon} name=${cap.kind === 'receipt' ? 'receipt' : 'user'} size=${18} /></span>
      <div class="tk-grow"><strong>${cap.kind === 'receipt' ? 'Das sieht nach einem Beleg aus' : 'Das sieht nach einer Visitenkarte aus'}</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${cap.kind === 'receipt' ? 'Betrag, Händler und Datum erkennen und als Ausgabe vorschlagen.' : 'Name, Firma und Kontaktdaten übernehmen.'}</div></div>
      <${Button} size="sm" variant="primary" onClick=${() => ctx.emit(cap.kind === 'receipt' ? 'ocr.receipt' : 'ocr.card', { id: cap.id })}>${cap.kind === 'receipt' ? 'Als Beleg auswerten' : 'Als Visitenkarte'}<//></div>`;
    if (props.layout === 'review') {
      const u = unsure[0]; const total = (cap.reviewTotal ?? unsure.length) || 1; const doneN = total - unsure.length;
      const line = u && (cap.text.split('\n').find((l) => l.includes(u.word)) || u.word);
      const keep = () => { setData('captures', (all) => all.map((c) => (c.id === cap.id ? { ...c, reviewTotal: total, uncertain: (c.uncertain || []).filter((x) => x.word !== u.word) } : c))); ctx.emit('ocr.keep', { word: u.word }); };
      const apply = (alt) => { setData('captures', (all) => all.map((c) => (c.id === cap.id ? { ...c, reviewTotal: total, text: c.text.replace(u.word, alt), uncertain: (c.uncertain || []).filter((x) => x.word !== u.word) } : c))); ctx.emit('ocr.correct', { word: u.word, alt }); ctx.toast(`„${u.word}“ → „${alt}“`); setOwn(''); };
      return html`<${Card} title=${cap.title} icon="scan-text" actions=${html`<${Badge} tone=${u ? 'warning' : 'success'}>${u ? `${doneN + 1} von ${total}` : 'Geprüft'}<//>`}><div class="tk-col" style="gap:14px">
        ${suggestion}
        <${Progress} value=${doneN / total} tone=${u ? 'accent' : 'success'} />
        ${u ? html`<div class="tk-ocr__text" style="min-height:0">${line.split(/(\s+)/).map((tok) => (clean(tok) === clean(u.word) && tok.trim() ? html`<mark class="tk-ocr__word" style="cursor:default">${tok}</mark>` : tok))}</div>
          <div class="tk-muted" style="font-size:var(--tk-fs-sm)">Unsicher (${Math.round(u.conf * 100)} %). Vorschlag: „${u.alt}“.</div>
          <div class="tk-col" style="gap:8px"><${Button} variant="primary" icon="check" onClick=${() => apply(u.alt)}>„${u.alt}“ übernehmen<//><${Button} onClick=${keep}>So lassen<//>
            <div class="tk-row" style="gap:8px"><${Input} value=${own} onInput=${setOwn} placeholder="Eigene Schreibweise" aria-label="Eigene Schreibweise" /><${Button} disabled=${!own.trim()} onClick=${() => apply(own.trim())}>Ersetzen<//></div></div>`
          : html`<div class="tk-col" style="align-items:center;text-align:center;gap:8px;padding:var(--tk-space-4) 0"><span style="color:var(--tk-c-success)"><${Icon} name="check-circle-2" size=${32} /></span><strong>Alle Stellen geprüft</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${words} Wörter · Konfidenz ${conf} %</div></div>
            <div class="tk-ocr__text">${cap.text}</div>
            <div class="tk-ocr__actions"><${Button} icon="copy" onClick=${copy}>Kopieren<//><${Button} variant="primary" icon=${saved === cap.id ? 'check' : 'notebook-pen'} onClick=${toNote} disabled=${saved === cap.id}>${saved === cap.id ? 'Als Notiz gespeichert' : 'Als Notiz speichern'}<//></div>`}
      </div><//>`;
    }

    return html`<${Card} title=${cap.title} icon="scan-text" actions=${props.allowEdit && html`<${Segmented} label="Textmodus" value=${mode} onChange=${(m) => { setMode(m); ctx.emit('ocr.edit', { mode: m }); }} options=${[{ value: 'view', label: 'Ansicht' }, { value: 'edit', label: 'Bearbeiten' }]} />`}>
      <div class=${`tk-ocr ${props.showImage ? 'tk-ocr--img' : ''}`}>
        ${props.showImage && html`<${Preview} cap=${cap} />`}
        <div class="tk-col" style="gap:14px">
          <div class="tk-ocr__meta">
            <${Badge} icon="languages">${cap.lang}<//>
            <${Badge}><span class="tk-dot" style=${`color:var(--tk-c-${cap.confidence > 0.9 ? 'success' : 'warning'})`}></span>Konfidenz ${conf} %<//>
            <${Badge}>${words} ${words === 1 ? 'Wort' : 'Wörter'}<//>
            ${unsure.length > 0 && props.showConfidence && html`<${Badge} icon="alert-triangle">${unsure.length} unsicher<//>`}
          </div>
          ${mode === 'edit'
            ? html`<textarea class="tk-textarea" style="min-height:180px;line-height:1.7" aria-label="Erkannten Text bearbeiten" value=${cap.text} onInput=${(e) => { const v = e.currentTarget.value; setData('captures', (all) => all.map((c) => (c.id === cap.id ? { ...c, text: v } : c))); }}></textarea>`
            : html`<div class="tk-ocr__text">${cap.text.split('\n').map((l, i, a) => html`<span>${renderLine(l)}${i < a.length - 1 ? '\n' : ''}</span>`)}</div>`}
          ${suggestion}
          ${unsure.length > 0 && props.showConfidence && mode === 'view' && html`<div class="tk-ocr__legend"><${Icon} name="info" size=${14} />Markierte Wörter sind unsicher – antippen, um den Vorschlag zu übernehmen.</div>`}
          <div class="tk-ocr__actions">
            <${Button} icon="copy" onClick=${copy}>Kopieren<//>
            <${Button} variant="primary" icon=${saved === cap.id ? 'check' : 'notebook-pen'} onClick=${toNote} disabled=${saved === cap.id}>${saved === cap.id ? 'Als Notiz gespeichert' : 'Als Notiz speichern'}<//>
            <${Button} icon="send" onClick=${share}>Teilen<//>
          </div>
        </div>
      </div><//>`;
  },
};

// ------------------------------------------------------------------------------------------------ Beleg erkennen ---
const CATS = ['Lebensmittel', 'Haushalt', 'Mobilität', 'Freizeit', 'Gesundheit', 'Business'];
const ACCOUNTS = { Girokonto: 'acc-giro', Kreditkarte: 'acc-kreditkarte', Geschäftskonto: 'acc-business' };
const toNum = (v) => parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
const Conf = ({ c }) => (c != null && c < 0.85 ? html`<${Badge} tone="warning" icon="alert-triangle">Bitte prüfen<//>` : null);

function ReceiptForm({ rc, props, setData, ctx, dupe }) {
  const [f, setF] = useState({ merchant: rc.merchant, date: rc.date, total: rc.total.toFixed(2).replace('.', ','), cat: rc.category, acc: rc.account || 'Girokonto' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const total = toNum(f.total); const today = isoLocal(ctx.today).slice(0, 10);
  const err = { total: !(total > 0) ? 'Diese Angabe passt nicht. Prüfe den Betrag.' : '', date: !f.date || f.date > today ? 'Das Datum liegt in der Zukunft oder fehlt.' : '', merchant: !f.merchant.trim() ? 'Händler fehlt.' : '' };
  const booked = rc.status === 'gebucht'; const valid = !err.total && !err.date && !err.merchant;
  const vat = total > 0 ? Math.round((total / (1 + rc.vatRate / 100)) * (rc.vatRate / 100) * 100) / 100 : 0;
  // Vorbelegung für „Schnell erfassen“ (Finanzen): Betrag positiv, Konto als ID, Uhrzeit vom Beleg.
  const prefill = { kind: 'expense', title: f.merchant.trim(), amount: total > 0 ? total : 0, date: f.date, time: rc.time, category: f.cat, account: ACCOUNTS[f.acc] || 'acc-giro', receiptId: rc.id };
  const book = () => {
    // App: Schnell erfassen öffnet mit den Angaben, gebucht wird dort nach „Speichern“. Einzel-Screen (kein Ziel erreichbar): direkt buchen.
    if (ctx.emit('receipt.book', { id: rc.id, to: 'finance.quickadd', ui: { prefill } })) return;
    setData('transactions', (a) => [{ id: `t-${rc.id}`, date: `${f.date}T${rc.time || '12:00'}:00`, title: f.merchant.trim(), category: f.cat, amount: -total, account: ACCOUNTS[f.acc] || 'acc-giro', type: 'expense', icon: 'receipt', receiptId: rc.id }, ...(Array.isArray(a) ? a : [])]);
    setData('receipts', (a) => a.map((x) => (x.id === rc.id ? { ...x, status: 'gebucht', merchant: f.merchant, date: f.date, total, category: f.cat, account: f.acc } : x)));
    ctx.toast(`Gebucht: ${money(ctx, -total)} · ${f.merchant.trim()}`);
  };
  const lines = rc.lines || [];
  return html`<div class=${`tk-rcpt ${props.showImage ? 'tk-rcpt--img' : ''}`}>
    ${props.showImage && html`<div class="tk-ocr__img" role="img" aria-label=${`Vorschau des Belegs ${rc.merchant}`}><span class="tk-ocr__corner tk-ocr__corner--tl"></span><span class="tk-ocr__corner tk-ocr__corner--tr"></span><span class="tk-ocr__corner tk-ocr__corner--bl"></span><span class="tk-ocr__corner tk-ocr__corner--br"></span>
      <div class="tk-ocr__page"><i style="width:70%;height:9px" data-flag=${rc.conf?.merchant < 0.85 ? 'true' : 'false'}></i><i style="width:45%"></i>${lines.slice(0, 4).map((_, k) => html`<i style=${`width:${[80, 62, 74, 55][k]}%`}></i>`)}<i style="width:40%;height:8px;align-self:flex-end" data-flag=${rc.conf?.total < 0.85 ? 'true' : 'false'}></i></div></div>`}
    <div class="tk-col" style="gap:12px;min-width:0">
      <div class="tk-row" style="gap:8px;flex-wrap:wrap"><${Badge} tone=${booked ? 'success' : 'info'} icon=${booked ? 'check' : 'clock'}>${booked ? 'Gebucht' : 'Noch nicht gebucht'}<//><${Badge}>${rc.payment}<//><${Badge}>Konfidenz ${Math.round(Math.min(...Object.values(rc.conf || { a: 1 })) * 100)} %<//></div>
      ${dupe && !booked && html`<div class="tk-ocr__sugg" role="status"><${Icon} name="copy" size=${18} /><div class="tk-grow"><strong>Möglicherweise schon gebucht</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${dupe.title} · ${money(ctx, dupe.amount)} am ${fmt.date(dupe.date)}</div></div></div>`}
      <div class="tk-rcpt__grid">
        <${Field} label="Händler" error=${err.merchant}><${Input} value=${f.merchant} onInput=${set('merchant')} invalid=${!!err.merchant} disabled=${booked} /><${Conf} c=${rc.conf?.merchant} /><//>
        <${Field} label="Datum" error=${err.date}><${Input} type="date" value=${f.date} onInput=${set('date')} invalid=${!!err.date} disabled=${booked} /><${Conf} c=${rc.conf?.date} /><//>
        <${Field} label="Betrag (€)" error=${err.total}><${Input} inputmode="decimal" value=${f.total} onInput=${set('total')} invalid=${!!err.total} disabled=${booked} /><${Conf} c=${rc.conf?.total} /><//>
        <${Field} label="Kategorie"><${Select} value=${f.cat} options=${CATS} onChange=${set('cat')} disabled=${booked} /><//>
        <${Field} label="Konto"><${Select} value=${f.acc} options=${Object.keys(ACCOUNTS)} onChange=${set('acc')} disabled=${booked} /><//>
        <div class="tk-rcpt__vat"><span class="tk-subtle">Darin MwSt ${rc.vatRate} %</span><strong class="tk-num">${money(ctx, vat)}</strong></div></div>
      ${props.showItems && lines.length > 0 && html`<div class="tk-rcpt__lines"><div class="tk-label">Positionen</div>${lines.map((l) => html`<div class="tk-rcpt__line"><span class="tk-truncate">${l.qty} × ${l.name}</span><span class="tk-num">${money(ctx, l.total)}</span></div>`)}</div>`}
      <div class="tk-ocr__actions"><${Button} variant="primary" icon=${booked ? 'check' : 'wallet'} disabled=${booked || !valid} onClick=${book}>${booked ? 'Gebucht' : 'Als Ausgabe buchen'}<//>
        <${Button} icon="arrow-up-right" onClick=${() => ctx.emit('receipt.finance', { id: rc.id, ui: { prefill } })}>In Finanzen prüfen<//></div>
      <div class="tk-subtle" style="font-size:var(--tk-fs-xs)">${ctx.mode === 'app' ? 'Die Buchung wird in Finanzen vorgeschlagen und erst nach „Speichern“ dort angelegt.' : 'Die Buchung wird nur vorgeschlagen und erst nach „Als Ausgabe buchen“ angelegt.'} Beträge stammen aus der Erkennung, bitte vergleiche sie mit dem Beleg.</div>
    </div></div>`;
}

export const receiptReview = {
  id: 'receipt-review',
  name: 'Beleg erkennen',
  category: 'Inhalte',
  description: 'Erkannter Beleg als prüfbares Formular (Händler, Datum, Betrag, MwSt, Kategorie, Konto) mit Konfidenz-Hinweisen, Dublettenprüfung gegen vorhandene Buchungen und „Als Ausgabe buchen“: in der App öffnet Schnell erfassen (Finanzen) mit den Angaben als Vorbelegung, im Einzel-Screen schreibt es direkt in die Buchungen der Datenwelt. Auch als Belegliste und als „Nächster Beleg“-Karte.',
  version: '1.2',
  props: [
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['review', 'list', 'next'], default: 'review' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Beleg prüfen' },
    { name: 'showImage', label: 'Belegvorschau', type: 'boolean', default: true },
    { name: 'showItems', label: 'Positionen', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (Liste)', type: 'number', default: 0 },
    { name: 'quietEmpty', label: 'Ohne Belege nichts anzeigen (Darstellung „next“)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'receipts', label: 'Belege', default: 'receipts', shape: '{id,merchant,date,total,vatRate,category,account?,payment,status:offen|gebucht,lines?,conf?}[]', required: true },
    { slot: 'transactions', label: 'Buchungen (Datenwelt)', default: 'transactions', shape: '{id,date,title,amount,type}[]', required: false },
  ],
  events: ['receipt.open', 'receipt.book', 'receipt.finance'],
  states: ['empty'],
  css: `
  [data-tk-large-text] .tk-rcpt__row .tk-truncate, [data-tk-large-text] .tk-ocr .tk-truncate { white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; }
  [data-tk-large-text] .tk-rcpt__row { flex-wrap:wrap; }
  .tk-rcpt { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--tk-space-5); min-width:0; }
  .bp-desktop .tk-rcpt--img { grid-template-columns:220px minmax(0,1fr); }
  .tk-rcpt__grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); align-items:start; }
  .bp-mobile .tk-rcpt__grid { grid-template-columns:minmax(0,1fr); }
  .tk-rcpt__vat { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 4px; min-height:var(--tk-size-control); font-size:var(--tk-fs-sm); }
  .tk-rcpt__lines { display:flex; flex-direction:column; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); padding:var(--tk-space-3) var(--tk-space-4); gap:6px; }
  .tk-rcpt__line { display:flex; justify-content:space-between; gap:12px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-rcpt__row { display:flex; align-items:center; gap:12px; width:100%; min-height:60px; padding:10px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-rcpt__row:hover { background:var(--tk-c-surface2); }
  .tk-rcpt__row[aria-current="true"] { background:var(--tk-c-accent-soft); }
  .tk-rcpt__row:last-child { border-bottom:0; }
  .tk-rcpt__ico { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; flex:none; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
  .tk-rcpt__next { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-5); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-left:4px solid var(--tk-c-warning); }
  .tk-rcpt__big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }`,
  example: { props: { mode: 'review' }, data: { transactions: [{ id: 't9', date: '2026-11-16T14:22:00', title: 'Thalia Bücher', amount: -42.5, type: 'expense' }], receipts: [
    { id: 'r1', merchant: 'Bäckerei Hoffmann', date: '2026-11-24', time: '08:05', total: 4.5, vatRate: 7, category: 'Lebensmittel', account: 'Girokonto', payment: 'Karte', status: 'offen', conf: { merchant: 0.98, date: 0.96, total: 0.97 }, lines: [{ name: 'Brötchen', qty: 2, total: 1.6 }, { name: 'Kaffee', qty: 1, total: 2.9 }] },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    const all = (data.receipts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const sel = all.find((r) => r.id === ctx.ui.selectedId) || all.find((r) => r.status === 'offen') || all[0];
    const open = (r) => { ctx.setUi('selectedId', r.id); ctx.emit('receipt.open', { id: r.id }); };
    if (!all.length && props.quietEmpty && props.mode === 'next') return null;   // Startseite ohne Daten: nur eine Aktion (die Wege oben), keine leere Karte
    if (!all.length) return html`<${Card} title=${props.title} icon="receipt"><${EmptyState} icon="receipt" title="Noch kein Beleg" text="Fotografiere einen Kassenbon oder eine Rechnung, TAKT liest Händler, Datum und Betrag aus." /><//>`;
    if (props.mode === 'list') {
      const list = props.limit > 0 ? all.slice(0, props.limit) : all;
      return html`<${Card} flush title=${props.title} icon="receipt" actions=${html`<${Badge} tone="warning">${all.filter((r) => r.status === 'offen').length} offen<//>`}>${list.map((r) => html`<button type="button" class="tk-rcpt__row" aria-current=${r.id === sel.id && ctx.ui.selectedId ? 'true' : 'false'} onClick=${() => open(r)}>
        <span class="tk-rcpt__ico"><${Icon} name="receipt" size=${18} /></span><div class="tk-grow" style="min-width:0"><div style="font-weight:var(--tk-fw-medium)" class="tk-truncate">${r.merchant}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${fmt.date(r.date)} · ${r.category}</div></div>
        <div style="text-align:right"><div class="tk-num" style="font-weight:var(--tk-fw-semibold)">${money(ctx, r.total)}</div><${Badge} tone=${r.status === 'gebucht' ? 'success' : 'info'}>${r.status === 'gebucht' ? 'Gebucht' : 'Offen'}<//></div></button>`)}<//>`;
    }
    if (props.mode === 'next') {
      const n = all.filter((r) => r.status === 'offen');
      if (!n.length) return html`<${Card} title=${props.title} icon="receipt"><${EmptyState} icon="check-circle-2" title="Alle Belege gebucht" text="Neue Belege erscheinen hier, sobald du sie erfasst." /><//>`;
      const r = n[0];
      return html`<div class="tk-rcpt__next"><span class="tk-label">Beleg wartet</span><div class="tk-rcpt__big">${money(ctx, r.total)}</div><div><strong>${r.merchant}</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${fmt.date(r.date)} · Vorschlag: ${r.category}${n.length > 1 ? ` · ${n.length - 1} weitere offen` : ''}</div></div>
        <div><${Button} variant="primary" icon="wallet" onClick=${() => open(r)}>Prüfen und buchen<//></div></div>`;
    }
    const dupe = (data.transactions || []).find((t) => Math.abs(Math.abs(t.amount) - sel.total) < 0.005 && Math.abs(new Date(t.date) - new Date(sel.date)) < 4 * 864e5 && t.id !== `t-${sel.id}`);
    return html`<${Card} title=${props.title} icon="receipt" actions=${html`<${Badge}>${sel.merchant}<//>`}><${ReceiptForm} key=${sel.id} rc=${sel} props=${props} setData=${setData} ctx=${ctx} dupe=${dupe} /><//>`;
  },
};

// ------------------------------------------------------------------------------------------------ Visitenkarte ---
const CARD_FIELDS = [['name', 'Name', 'user'], ['title', 'Funktion', 'briefcase'], ['company', 'Firma', 'building-2'], ['phone', 'Telefon', 'smartphone'], ['email', 'E-Mail', 'mail'], ['web', 'Website', 'globe'], ['address', 'Adresse', 'map-pin']];

function CardForm({ c, setData, ctx }) {
  const [f, setF] = useState(() => Object.fromEntries(CARD_FIELDS.map(([k]) => [k, c[k] || ''])));
  const [saved, setSaved] = useState(!!c.saved);
  const bad = { email: f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) ? 'Diese Adresse passt nicht. Prüfe das @-Zeichen.' : '', phone: f.phone && !/^[+\d][\d\s/().-]{5,}$/.test(f.phone) ? 'Diese Nummer passt nicht.' : '', name: !f.name.trim() ? 'Name fehlt.' : '' };
  const ok = !bad.email && !bad.phone && !bad.name;
  const save = () => { setData('cards', (a) => a.map((x) => (x.id === c.id ? { ...x, ...f, saved: true } : x))); setSaved(true); ctx.emit('card.save', { id: c.id }); ctx.toast(`Kontakt gespeichert: ${f.name}`); };
  const ini = f.name.replace(/^(Dr\.|Prof\.)\s*/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
  return html`<div class="tk-card-bc"><div class="tk-card-bc__card"><span class="tk-card-bc__av" aria-hidden="true">${ini || '?'}</span><div style="min-width:0"><div class="tk-card-bc__name">${f.name || 'Name'}</div><div class="tk-muted">${f.title}${f.title && f.company ? ' · ' : ''}${f.company}</div></div></div>
    <div class="tk-rcpt__grid">${CARD_FIELDS.map(([k, label]) => html`<${Field} label=${label} error=${bad[k]}><${Input} value=${f[k]} onInput=${(v) => setF((x) => ({ ...x, [k]: v }))} invalid=${!!bad[k]} aria-label=${label} /><${Conf} c=${c.conf?.[k]} /><//>`)}</div>
    <div class="tk-ocr__actions"><${Button} variant="primary" icon=${saved ? 'check' : 'users'} disabled=${!ok || saved} onClick=${save}>${saved ? 'Kontakt gespeichert' : 'Kontakt speichern'}<//>
      <${Button} icon="mail" disabled=${!f.email} onClick=${() => { ctx.emit('card.mail', { id: c.id }); ctx.toast(`E-Mail an ${f.email}`); }}>E-Mail<//><${Button} icon="smartphone" disabled=${!f.phone} onClick=${() => { ctx.emit('card.call', { id: c.id }); ctx.toast(`Anruf: ${f.phone}`); }}>Anrufen<//>
      <${Button} icon="calendar-plus" onClick=${() => { ctx.emit('card.event', { id: c.id }); ctx.toast('Termin mit diesem Kontakt vorschlagen'); }}>Termin<//></div></div>`;
}

export const businessCard = {
  id: 'business-card',
  name: 'Visitenkarte',
  category: 'Inhalte',
  description: 'Erkannte Visitenkarte als Kontaktkarte mit prüfbaren Feldern (Name, Funktion, Firma, Telefon, E-Mail, Website, Adresse), Konfidenz-Hinweisen, Eingabeprüfung und Aktionen Kontakt speichern, E-Mail, Anrufen, Termin.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Visitenkarte' }],
  data: [{ slot: 'cards', label: 'Visitenkarten', default: 'cards', shape: '{id,name,title?,company?,phone?,email?,web?,address?,conf?,saved?}[]', required: true }],
  events: ['card.save', 'card.mail', 'card.call', 'card.event'],
  states: ['empty'],
  css: `
  .tk-card-bc { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-card-bc__card { display:flex; align-items:center; gap:14px; padding:var(--tk-space-5); border-radius:var(--tk-radius-lg); background:var(--tk-c-accent-soft); border:1px solid color-mix(in srgb, var(--tk-c-accent) 30%, transparent); min-width:0; }
  .tk-card-bc .tk-input, .tk-rcpt .tk-input { text-overflow:ellipsis; }
  .tk-card-bc__av { width:56px; height:56px; border-radius:50%; flex:none; display:grid; place-items:center; background:var(--tk-c-accent); color:var(--tk-c-on-accent, var(--tk-c-bg)); font-weight:var(--tk-fw-bold); font-size:var(--tk-fs-lg); }
  .tk-card-bc__name { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); overflow-wrap:anywhere; }`,
  example: { data: { cards: [{ id: 'k1', name: 'Dr. Anna Müller', title: 'Steuerberaterin', company: 'Müller & Partner mbB', phone: '+49 521 555 0142', email: 'anna.mueller@mueller-partner.example', web: 'mueller-partner.example', address: 'Marktstraße 4, 33602 Bielefeld', conf: { name: 0.61 } }] } },
  render: ({ props, data, setData, ctx }) => {
    const cards = data.cards || []; const c = cards.find((x) => x.id === ctx.ui.selectedId) || cards[0];
    if (!c) return html`<${Card} title=${props.title} icon="user"><${EmptyState} icon="user" title="Noch keine Visitenkarte" text="Fotografiere eine Karte, TAKT liest Name, Firma und Kontaktdaten aus." /><//>`;
    return html`<${Card} title=${props.title} icon="user"><${CardForm} key=${c.id} c=${c} setData=${setData} ctx=${ctx} /><//>`;
  },
};
