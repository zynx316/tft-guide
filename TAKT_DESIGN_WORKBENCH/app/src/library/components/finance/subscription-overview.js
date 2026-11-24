// Finanzen: Abos und Fixkosten – Kündigungsfristen, ungenutzte Abos und Jahreskosten.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { subStats, subKind, yearly, arr, obj } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, eur0, Tile, shortDate } from './_fin.js';
import { ex } from './_example.js';

export const finSubscriptionOverview = {
  id: 'fin-subscription-overview',
  name: 'Abos und Fixkosten',
  category: 'Finanzen',
  description: 'Laufende Kosten auf einen Blick: Monats- und Jahressumme, Kündigungsfristen, ungenutzte Abos. „Kündigung vormerken“ erinnert rechtzeitig – gekündigt wird beim Anbieter.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Abos und Fixkosten' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards', 'callouts'], default: 'list' },
    { name: 'showBusiness', label: 'Betriebliche Abos zeigen', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Zeilen in der Liste (0 = alle)', type: 'number', default: 0 },
  ],
  data: slots('subs', 'subMeta', 'prefs'),
  events: ['sub.open', 'sub.cancel', 'sub.keep'],
  states: ['empty'],
  css: `
  .tk-fnsub__sum { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:var(--tk-space-3); margin-bottom:var(--tk-space-4); }
  .tk-fnsub__sum > div { padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); min-width:0; }
  .tk-fnsub__sum strong { display:block; font-size:var(--tk-fs-xl); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-fnsub__h { margin:var(--tk-space-4) 0 var(--tk-space-2); display:flex; align-items:center; gap:8px; }
  .tk-fnsub__row { display:flex; align-items:center; gap:12px; padding:8px 0; min-height:52px; min-width:0; }
  .tk-fnsub__row > .tk-fn-tap { flex:1 1 auto; min-width:0; padding:2px 4px; }
  .tk-fnsub__call { display:flex; flex-direction:column; gap:8px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-warning-soft); border:1px solid var(--tk-c-border); }
  .tk-fnsub__calls { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 250px), 1fr)); gap:var(--tk-space-3); }
  .tk-fnsub__call .tk-fn-sub { color:var(--tk-c-text-muted); }
  .tk-fnsub__call--info { background:var(--tk-c-info-soft); }
  .tk-fnsub__hero { display:flex; flex-direction:column; gap:10px; margin-bottom:var(--tk-space-4); }`,
  example: { props: {}, data: ex('subscriptions', 'subMeta', 'prefs') },
  render: function FinSubscriptionOverview({ props, data, setData, ctx }) {
    const c = pctx(ctx, data), meta = obj(data.subMeta);
    let subs = arr(data.subscriptions);
    if (!props.showBusiness) subs = subs.filter((s) => !s.business);
    if (!subs.length) return html`<${Card} title=${props.title} icon="repeat"><${EmptyState} icon="repeat" title="Noch keine Abos" text="Trage regelmäßige Zahlungen ein, dann siehst du Fristen und Jahreskosten." /><//>`;
    const st = subStats(subs, meta, ctx.today);
    const toggle = (s) => { const next = !s.cancelPlanned; setData('subscriptions', (l) => arr(l).map((x) => (x.id === s.id ? { ...x, cancelPlanned: next } : x))); ctx.emit(next ? 'sub.cancel' : 'sub.keep', { id: s.id }); ctx.toast(next ? `Kündigung von ${s.name} vorgemerkt. Gekündigt wird bei deinem Anbieter.` : `Vormerkung für ${s.name} zurückgenommen`); };
    const open = (s) => ctx.emit('sub.open', { id: s.id });
    const btn = (s) => (s.cancelable ? html`<${Button} size="sm" variant=${s.cancelPlanned ? 'primary' : 'default'} icon=${s.cancelPlanned ? 'check' : 'bell'} onClick=${() => toggle(s)} aria-pressed=${String(!!s.cancelPlanned)}>${s.cancelPlanned ? 'Vorgemerkt' : 'Kündigung vormerken'}<//>` : null);
    const dl = (s) => meta[s.id]?.cancelBy;
    const frist = (s) => { const d = st.deadline(s); return html`<span class="tk-fn-pill tk-fn-pill--warning"><${Icon} name="clock" size=${11} />Kündigung bis ${shortDate(c, dl(s))} · ${d === 0 ? 'heute' : d === 1 ? 'morgen' : `in ${d} Tagen`}</span>`; };
    const row = (s) => html`<div class="tk-fnsub__row"><button type="button" class="tk-fn-tap" onClick=${() => open(s)} aria-label=${`${s.name}, ${eur(c, s.amount)} im Monat`}><${Tile} icon=${s.icon} tone=${subKind(s) === 'fix' ? 1 : 4} size=${34} />
      <span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${s.name}</span><span class="tk-fn-sub tk-fn-title" style="display:block">${meta[s.id]?.term || `${s.interval} am ${s.day}.`}${s.business ? ' · Betrieb' : ''}</span></span>
      <span style="text-align:right"><span class="tk-fn-num" style="display:block;font-weight:600">${eur(c, s.amount)}</span><span class="tk-fn-sub tk-fn-num">${eur0(c, yearly(s))} / Jahr</span></span></button>${props.style === 'list' ? btn(s) : null}</div>`;
    const callout = (s, kind) => html`<div class=${`tk-fnsub__call ${kind === 'unused' ? 'tk-fnsub__call--info' : ''}`}><div class="tk-fn-row"><${Tile} icon=${kind === 'unused' ? 'eye-off' : 'clock'} tone=${kind === 'unused' ? 'info' : 'warning'} size=${32} />
      <div class="tk-fn-grow"><div class="tk-fn-title">${s.name}</div><div class="tk-fn-sub">${kind === 'unused' ? `${s.lastUsedDays} Tage nicht genutzt · ${eur0(c, yearly(s))} im Jahr` : meta[s.id]?.note || meta[s.id]?.term}</div></div></div>${kind === 'frist' && frist(s)}<div>${btn(s)}</div></div>`;
    const frists = st.deadlines, unused = st.unused.filter((s) => !frists.includes(s));
    const calls = (frists.length || unused.length) && html`<div class="tk-fnsub__calls" data-qa="sub-callouts">${frists.map((s) => callout(s, 'frist'))}${unused.map((s) => callout(s, 'unused'))}</div>`;
    if (props.style === 'callouts') return html`<${Card} title=${props.title} icon="repeat" actions=${html`<span class="tk-fn-meta tk-fn-num">${eur0(c, st.monthly)} / Monat</span>`}>${calls || html`<${EmptyState} icon="check-circle-2" title="Nichts zu prüfen" text="Keine Frist in den nächsten 45 Tagen, kein ungenutztes Abo." />`}<//>`;

    const sumTiles = html`<div class="tk-fnsub__sum"><div><span class="tk-fn-cap">Pro Monat</span><strong>${eur(c, st.monthly)}</strong></div><div><span class="tk-fn-cap">Pro Jahr</span><strong>${eur0(c, st.yearly)}</strong></div>
      <div><span class="tk-fn-cap">Fixkosten</span><strong>${eur0(c, st.fixed)}</strong></div><div><span class="tk-fn-cap">Abos</span><strong>${eur(c, st.abos)}</strong></div></div>`;
    const groups = [['Fixkosten', subs.filter((s) => !s.business && subKind(s) === 'fix')], ['Abos', subs.filter((s) => !s.business && subKind(s) === 'abo')], ['Betrieb', subs.filter((s) => s.business)]].filter(([, l]) => l.length);
    const lists = groups.map(([g, l]) => { const rows = props.limit > 0 ? l.slice(0, props.limit) : l; return html`<div class="tk-fnsub__h"><span class="tk-fn-cap">${g}</span><span class="tk-fn-sub tk-fn-num">${eur(c, l.reduce((a, s) => a + s.amount, 0))} / Monat</span></div><div class="tk-fn-list">${rows.map(row)}</div>`; });
    if (props.style === 'cards') {
      const share = [['Fixkosten', st.fixed, toneColor(1)], ['Abos', st.abos, toneColor(4)]], tot = st.fixed + st.abos || 1;
      return html`<${Card} title=${props.title} icon="repeat"><div class="tk-fnsub__hero"><div><div class="tk-fn-cap">Jahreskosten</div><div class="tk-fn-big tk-fn-big--xl">${eur0(c, st.yearly)}</div><div class="tk-fn-meta">${eur(c, st.monthly)} im Monat, ${subs.length} Verträge</div></div>
        <div class="tk-fn-bar" style="height:12px" role="img" aria-label=${`Fixkosten ${eur0(c, st.fixed)}, Abos ${eur0(c, st.abos)} im Monat`}>${share.map(([l, v, col]) => html`<i style=${`width:${(v / tot) * 100}%;background:${col}`}></i>`)}</div>
        <div class="tk-fn-actions tk-fn-meta">${share.map(([l, v, col]) => html`<span style="display:inline-flex;gap:6px;align-items:center"><i style=${`width:9px;height:9px;border-radius:3px;background:${col}`}></i>${l} ${eur0(c, v)}</span>`)}</div></div>${calls}${lists}<//>`;
    }
    return html`<${Card} title=${props.title} icon="repeat">${sumTiles}${calls}${lists}<//>`;
  },
};
export default [finSubscriptionOverview];
