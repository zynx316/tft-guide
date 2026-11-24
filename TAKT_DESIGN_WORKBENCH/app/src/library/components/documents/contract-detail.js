// Dokumente: Vertrag im Detail – Frist mit Stufe, Laufzeit, Dokumente, Kosten-Verknüpfung zu Finanzen (Abos) und „Kündigung vorbereiten“.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, Select, Switch } from '../../ui.js';
import { money } from '../../helpers.js';
import { dayDiff } from '../../../lib/date.js';
import { REMINDER_DAYS, stageOf } from './_deadlines.js';
import { arr, todayOf, dateLabel, inDays, typeIcon, plural, termProgress, IconTile, StageBadge, DaysCount } from './_docs.js';
import { openCancelDraft } from './_cancel.js';
import { pick } from './_example.js';

export const dokContractDetail = {
  id: 'dok-contract-detail',
  name: 'Vertrag im Detail',
  category: 'Dokumente',
  description: 'Ein Vertrag mit Frist (Tage, Stufe, Erinnerung 30/14/3), Laufzeit-Balken, zugehörigen Dokumenten und Link zu den Kosten in Finanzen. Aktion „Kündigung vorbereiten“ öffnet eine Textvorlage. Stil „facts“ als Faktenblatt, „focus“ mit der Frist zuerst.',
  version: '1.2',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['facts', 'focus'], default: 'facts' },
    { name: 'picker', label: 'Vertrag wechseln', type: 'boolean', default: true },
    { name: 'showCosts', label: 'Kosten zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'contracts', label: 'Verträge (abgeleitet aus Finanzen)', default: 'contracts', shape: '{id,subscriptionId,name,kind,provider,amount,interval,cancelBy?,endsOn?,term,customerNo,cancelTo,reminder}[]', required: true },
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,type,contractId?,date,pages}[]', required: false },
  ],
  events: ['cost.open', 'doc.open', 'contract.cancel', 'contract.reminder', 'scan.start', 'contract.select'],
  states: ['empty'],
  flutter: { widget: 'TaktContractDetail', propMap: { style: 'variant', picker: 'showPicker', showCosts: 'showCosts' }, events: { 'cost.open': 'onOpenCosts', 'doc.open': 'onOpenDocument', 'contract.cancel': 'onPrepareCancel', 'contract.reminder': 'onToggleReminder' } },
  css: `
  .tk-dok-cd { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; } .tk-dok-cd__id { display:flex; align-items:center; gap:12px; flex-wrap:wrap; min-width:0; } .tk-dok-cd__id h2 { margin:0; font-size:var(--tk-fs-xl); line-height:1.2; overflow-wrap:anywhere; }
  .tk-dok-cd__frist { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid color-mix(in srgb, var(--tc) 40%, var(--tk-c-border)); background:color-mix(in srgb, var(--tc) 8%, var(--tk-c-surface)); }
  [data-tk-large-text] .tk-dok-cd__id > :first-child { display:none; } [data-tk-large-text] .tk-dok-cd__id > .tk-dok-main { flex:1 1 100%; } [data-tk-large-text] .tk-dok-cd__id h2 { overflow-wrap:break-word; hyphens:auto; }
  .tk-dok-cd__rem { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; } .tk-dok-cd__sel { max-width:360px; }
  .tk-dok-cd__cols { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap:var(--tk-space-4); align-items:start; }`,
  example: { props: { style: 'facts' }, data: pick('contracts', 'documents') },
  render: function DokContractDetail({ props, data, setData, ctx }) {
    const list = arr(data.contracts), today = todayOf(ctx);
    const soonest = [...list].filter((c) => c.cancelBy).sort((a, b) => a.cancelBy.localeCompare(b.cancelBy))[0];
    const c = list.find((x) => x.id === ctx.ui.selectedId) || soonest || list[0];
    if (!c) return html`<${Card}><${EmptyState} icon="scroll-text" title="Kein Vertrag gewählt" text="Verträge kommen aus Finanzen. Lege einen Vertrag als Dokument ab, dann steht hier die Frist." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Vertrag scannen<//>`} /><//>`;
    const docs = arr(data.documents).filter((d) => d.contractId === c.id);
    const days = c.cancelBy ? dayDiff(today, c.cancelBy) : null, stage = days != null && days >= 0 ? stageOf(days) : null;
    const p = termProgress(c, today);
    const remind = (on) => { setData('contracts', (l) => arr(l).map((x) => (x.id === c.id ? { ...x, reminder: { ...x.reminder, on } } : x))); ctx.emit('contract.reminder', { id: c.id, on }); ctx.toast(on ? 'Erinnerung eingeschaltet' : 'Erinnerung ausgeschaltet'); };
    const head = html`<div class="tk-dok-cd__id"><${IconTile} icon=${c.icon || 'scroll-text'} tone="accent" size=${44} /><div class="tk-dok-main"><h2>${c.name}</h2><span class="tk-dok-sub">${c.provider} · ${c.kind}${c.business ? ' · Geschäft' : ''}</span></div>
      ${stage ? html`<${StageBadge} stage=${stage} />` : html`<${Badge}>${c.cancelable ? 'ohne feste Frist' : 'läuft unbefristet'}<//>`}</div>`;
    const frist = html`<section class="tk-dok-cd__frist" style=${`--tc:var(--tk-c-${stage && stage.tone !== 'neutral' ? stage.tone : 'accent'})`} aria-label="Frist">
      ${stage ? html`<${DaysCount} days=${days} stage=${stage} />` : html`<${IconTile} icon="calendar-check" tone="info" size=${44} />`}
      <div class="tk-dok-main"><b>${c.cancelBy ? `Kündigung bis ${dateLabel(c.cancelBy, today)}` : 'Keine feste Kündigungsfrist hinterlegt'}</b>
        <span class="tk-dok-sub">${c.cancelBy ? `${inDays(days)}${c.endsOn ? `, Vertragsende ${dateLabel(c.endsOn, today)}` : ''}` : c.noticeDays ? `${c.noticeDays} Tage Frist laut Vertrag` : c.term}</span>
        ${c.cancelable && c.cancelBy && html`<div class="tk-dok-cd__rem" aria-label="Erinnerungen">${REMINDER_DAYS.map((d) => html`<${Badge} tone=${c.reminder?.on ? 'accent' : 'neutral'} icon="bell">${d} Tage vorher<//>`)}</div>`}</div>
      ${c.cancelable && c.cancelBy && html`<span class="tk-dok-remind"><${Switch} checked=${!!c.reminder?.on} onChange=${remind} label="Erinnerung" />Erinnerung</span>`}</section>`;
    const actions = html`<div class="tk-dok-btns"><${Button} variant="primary" icon="send" disabled=${!c.cancelable} onClick=${() => openCancelDraft(ctx, c)}>Kündigung vorbereiten<//>
      <${Button} icon="wallet" onClick=${() => ctx.emit('cost.open', { id: c.subscriptionId })}>Kosten in Finanzen<//></div>${!c.cancelable && html`<p class="tk-dok-sub">Keine Vorlage: ${c.kind === 'Wohnen' ? 'Miete kündigst du mit der Frist laut Mietvertrag.' : 'Kündige mit der Frist laut Vertrag.'} ${c.note}</p>`}`;
    const facts = html`<${Card} title="Laufzeit und Kosten" icon="hourglass"><dl class="tk-dok-kv">
      <dt>Laufzeit</dt><dd>${c.term}</dd>${c.termStart && html`<dt>Beginn</dt><dd>${dateLabel(c.termStart, today)}</dd>`}${c.endsOn && html`<dt>Ende (mit Kündigung)</dt><dd>${dateLabel(c.endsOn, today)}</dd>`}
      ${props.showCosts && html`<dt>Kosten</dt><dd>${money(ctx, c.amount)} ${c.interval === 'monatlich' ? 'im Monat' : c.interval}</dd>`}<dt>Kundennummer</dt><dd>${c.customerNo}</dd>${c.cancelTo && html`<dt>Kündigung an</dt><dd>${c.cancelTo}</dd>`}</dl>
      ${p != null && html`<div style="margin-top:var(--tk-space-3)"><div class="tk-dok-bar" role="progressbar" aria-label="Laufzeit" aria-valuenow=${Math.round(p * 100)} aria-valuemin="0" aria-valuemax="100"><i style=${`width:${p * 100}%`}></i></div><p class="tk-dok-fine" style="margin-top:4px">${Math.round(p * 100)} % der Laufzeit vorbei</p></div>`}
      <p class="tk-dok-fine" style="margin-top:var(--tk-space-3)">Kosten und Fristen pflegt Finanzen, hier werden sie nur gezeigt.</p><//>`;
    const docCard = html`<${Card} flush title="Dokumente" icon="files" actions=${html`<${Badge}>${docs.length}<//>`}>${docs.length ? docs.map((d) => html`<button type="button" class="tk-dok-row" onClick=${() => { ctx.setUi('selectedId', d.id); ctx.emit('doc.open', { id: d.id }); }}>
      <${IconTile} icon=${typeIcon(d.type)} tone="info" /><span class="tk-dok-main"><b>${d.title}</b><span class="tk-dok-sub">${d.type} · ${dateLabel(d.date, today)} · ${plural(d.pages, 'Seite', 'Seiten')}</span></span><${Icon} name="chevron-right" size=${16} /></button>`)
      : html`<${EmptyState} icon="file-text" title="Noch kein Dokument" text="Lege den Vertrag oder die Bestätigung ab, dann findest du Fristen und Nummern sofort." action=${html`<${Button} icon="scan" onClick=${() => ctx.emit('scan.start')}>Dokument scannen<//>`} />`}<//>`;
    const picker = props.picker && list.length > 1 && html`<div class="tk-dok-cd__sel"><${Select} value=${c.id} onChange=${(id) => { ctx.setUi('selectedId', id); ctx.emit('contract.select', { id }); }} options=${list.map((x) => ({ value: x.id, label: x.name }))} aria-label="Vertrag wechseln" /></div>`;
    if (props.style === 'focus') return html`<div class="tk-dok-cd">${picker}${head}${frist}${actions}${docCard}${facts}</div>`;
    return html`<div class="tk-dok-cd">${picker}${head}${frist}<div class="tk-dok-cd__cols">${facts}${docCard}</div>${actions}</div>`;
  },
};
export default dokContractDetail;
