// Trading: Kursalarme – anlegen, aktive und ausgelöste Alarme, pausieren, löschen mit Rückgängig, Abstand zum Kurs.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, IconButton, EmptyState, Segmented, Icon } from '../../ui.js';
import { fmtPercent, fmtDate, fmtTime } from '../../../lib/format.js';
import { arr, alertInfo, known, byId } from './_calc.js';
import { slots, Px, Tile, Note, TRD_CSS, openSecurity } from './_trd.js';
import { AlertForm, AF_CSS } from './_alertform.js';
import { ex } from './_example.js';

export const trdAlerts = {
  id: 'trd-alerts',
  name: 'Kursalarme',
  category: 'Trading',
  description: 'Kursalarme je Wertpapier mit Richtung und Kursmarke: aktive und ausgelöste Alarme, Abstand zum aktuellen Kurs, pausieren, löschen mit Rückgängig. Als Liste, als Karten mit Abstandsbalken oder kompakt mit Schnell-Anlage.',
  version: '1.3',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Kursalarme' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards', 'quick'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'scope', label: 'Umfang', type: 'select', options: ['all', 'selected'], default: 'all' },
    { name: 'showForm', label: 'Formular zum Anlegen', type: 'boolean', default: true },
    { name: 'showAll', label: 'Link „Alle Alarme“', type: 'boolean', default: false },
  ],
  data: slots('alerts', 'instruments', 'positions', 'watchlist'),
  events: ['alert.create', 'alert.toggle', 'alert.delete', 'alert.restore', 'alert.invalid', 'alert.open', 'alerts.open', 'alert.tab'],
  states: ['empty'],
  css: `${TRD_CSS}${AF_CSS}
  .tk-trd-al { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-trd-al__row { display:flex; align-items:center; gap:12px; padding:10px 4px; min-height:60px; } .tk-trd-al__row[data-off="true"] { opacity:.72; }
  .tk-trd-al__main { display:flex; align-items:center; gap:12px; min-width:0; flex:1 1 auto; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:0; min-height:44px; }
  .tk-trd-al__cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, calc(250px * var(--tk-text-scale, 1))), 1fr)); gap:var(--tk-space-3); }
  .tk-trd-al__card { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); padding:var(--tk-space-4); display:flex; flex-direction:column; gap:10px; min-width:0; }
  .tk-trd-al__undo { display:flex; align-items:center; gap:8px; justify-content:space-between; padding:8px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); font-size:var(--tk-fs-sm); }
  [data-tk-large-text] .tk-trd-al__row { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-trd-al__main { flex:1 1 100%; align-items:flex-start; } [data-tk-large-text] .tk-trd-al__main > .tk-trd-ico { display:none; } [data-tk-large-text] .tk-trd-al__undo { flex-wrap:wrap; }`,
  example: { data: ex('alerts', 'instruments', 'positions', 'watchlist') },
  render: function TrdAlerts({ props, data, setData, ctx }) {
    const [tab, setTab] = useState('aktiv'), [undo, setUndo] = useState(null), [form, setForm] = useState(false);
    const ok = known(data.positions, data.watchlist), insts = arr(data.instruments);
    const sel = props.scope === 'selected' ? (insts.find((i) => i.id === ctx.ui.selectedId) || insts.find((i) => arr(data.positions).some((p) => p.id === i.id)) || insts[0] || {}).id : null;
    const all = arr(data.alerts).filter(ok).filter((a) => !sel || a.securityId === sel);
    const act = all.filter((a) => a.status !== 'ausgelöst'), hit = all.filter((a) => a.status === 'ausgelöst');
    const quick = props.style === 'quick', list = (tab === 'aktiv' || quick ? act : hit);
    const rows = props.limit > 0 ? [...list].sort((a, b) => (alertInfo(a, byId(data.instruments, a.securityId)).dist) - (alertInfo(b, byId(data.instruments, b.securityId)).dist)).slice(0, props.limit) : list;
    const patch = (id, p) => setData('alerts', (l) => arr(l).map((a) => (a.id === id ? { ...a, ...p } : a)));
    const toggle = (a) => { const s = a.status === 'aktiv' ? 'pausiert' : 'aktiv'; patch(a.id, { status: s }); ctx.emit('alert.toggle', { id: a.id, status: s }); };
    const del = (a) => { setData('alerts', (l) => arr(l).filter((x) => x.id !== a.id)); setUndo(a); ctx.emit('alert.delete', { id: a.id }); };
    const restore = () => { setData('alerts', (l) => [undo, ...arr(l)]); ctx.emit('alert.restore', { id: undo.id }); setUndo(null); };
    const name = (a) => { const i = byId(data.instruments, a.securityId); return i ? i.short || i.name : '–'; };
    const form_ = props.showForm && (!quick || form) && html`<${Card} title="Neuer Alarm" icon="bell" actions=${quick && html`<${IconButton} icon="x" label="Formular schließen" onClick=${() => setForm(false)} />`}><${AlertForm} data=${data} setData=${setData} ctx=${ctx} compact=${quick} onDone=${() => setTab('aktiv')} /><//>`;
    const segs = !quick && html`<${Segmented} label="Alarme" value=${tab} onChange=${(v) => { setTab(v); ctx.emit('alert.tab', { tab: v }); }} options=${[{ value: 'aktiv', label: `Aktiv (${act.length})` }, { value: 'hit', label: `Ausgelöst (${hit.length})` }]} />`;
    const dist = (a) => { const i = byId(data.instruments, a.securityId), s = alertInfo(a, i); return { i, s }; };
    const state = (a) => { const { i, s } = dist(a); return a.status === 'ausgelöst' ? html`erreicht ${fmtDate(a.triggeredAt, { style: 'short' })}, ${fmtTime(a.triggeredAt)} Uhr` : a.status === 'pausiert' ? 'pausiert' : html`Kurs <${Px} v=${s.price} /> · noch ${fmtPercent(Math.max(0, s.dist), { digits: 1 })}`; };
    const label = (a) => html`${name(a)} ${a.dir === 'above' ? 'über' : 'unter'} <${Px} v=${a.price} />`;
    const acts = (a) => (a.status === 'ausgelöst' ? html`<${IconButton} icon="trash-2" label=${`Alarm ${name(a)} löschen`} onClick=${() => del(a)} />` : html`<${IconButton} icon=${a.status === 'aktiv' ? 'pause' : 'play'} label=${a.status === 'aktiv' ? `Alarm ${name(a)} pausieren` : `Alarm ${name(a)} fortsetzen`} onClick=${() => toggle(a)} /><${IconButton} icon="trash-2" label=${`Alarm ${name(a)} löschen`} onClick=${() => del(a)} />`);
    const row = (a) => { const { s } = dist(a); return html`<div class="tk-trd-al__row" data-off=${String(a.status === 'pausiert')}><button type="button" class="tk-trd-al__main" onClick=${() => openSecurity(ctx, a.securityId, 'alert.open')} aria-label=${`${name(a)} öffnen`}>
      <${Tile} icon=${a.status === 'ausgelöst' ? 'check-circle-2' : 'bell'} tone=${a.status === 'ausgelöst' ? 'success' : s.near ? 'warning' : 'accent'} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-wrap" style="display:block">${label(a)}</span><span class="tk-trd-sub">${state(a)}</span></span></button>${s.near && a.status === 'aktiv' && html`<span class="tk-trd-pill tk-trd-pill--warning">nah</span>`}${acts(a)}</div>`; };
    const card = (a) => { const { s } = dist(a), fill = a.status === 'ausgelöst' ? 1 : Math.max(0.04, 1 - Math.min(1, Math.max(0, s.dist) / 0.15)); return html`<div class="tk-trd-al__card"><div class="tk-trd-row"><${Tile} icon=${a.status === 'ausgelöst' ? 'check-circle-2' : 'bell'} tone=${a.status === 'ausgelöst' ? 'success' : s.near ? 'warning' : 'accent'} size=${34} /><span class="tk-trd-grow"><span class="tk-trd-wrap" style="display:block">${label(a)}</span><span class="tk-trd-sub">${state(a)}</span></span></div>
      <div class="tk-trd-bar" role="img" aria-label=${`Abstand zur Marke: ${a.status === 'ausgelöst' ? 'erreicht' : fmtPercent(Math.max(0, s.dist), { digits: 1 })}`}><i style=${`width:${fill * 100}%;background:var(--tk-c-${a.status === 'pausiert' ? 'text-subtle' : s.near || a.status === 'ausgelöst' ? 'warning' : 'accent'})`}></i></div><div class="tk-trd-row" style="justify-content:space-between"><span class="tk-trd-sub">seit ${fmtDate(a.created, { style: 'short' })}</span><span>${acts(a)}</span></div></div>`; };
    const empty = !list.length && html`<${EmptyState} icon=${tab === 'aktiv' || quick ? 'bell' : 'check-circle-2'} title=${tab === 'aktiv' || quick ? 'Keine aktiven Alarme' : 'Noch nichts ausgelöst'} text=${tab === 'aktiv' || quick ? 'Lege eine Kursmarke fest, dann meldet sich TAKT, wenn der Kurs sie erreicht.' : 'Ausgelöste Alarme erscheinen hier mit Zeitpunkt.'} action=${(quick || !props.showForm) && html`<${Button} variant="primary" icon="plus" onClick=${() => { if (quick) { setForm(true); setTab('aktiv'); } else ctx.emit('alert.new', { id: sel || ctx.ui.selectedId, to: 'trading.alerts' }); }}>Alarm anlegen<//>`} />`;
    const body = empty || (props.style === 'cards' ? html`<div class="tk-trd-al__cards">${rows.map(card)}</div>` : html`<div class="tk-trd-list">${rows.map(row)}</div>`);
    return html`<div class="tk-trd-al"><${Card} title=${props.title} icon="bell" actions=${quick ? html`<${Button} size="sm" icon="plus" onClick=${() => { setForm(true); ctx.emit('alert.form'); }}>Neu<//>` : null}>
      ${segs}${undo && html`<div class="tk-trd-al__undo" role="status" style="margin-top:8px"><span>Alarm gelöscht</span><${Button} size="sm" icon="undo-2" onClick=${restore}>Rückgängig<//></div>`}<div style=${segs ? 'margin-top:12px' : ''}>${body}</div>
      ${props.showAll && html`<div style="margin-top:8px"><${Button} variant="ghost" size="sm" iconRight="chevron-right" onClick=${() => ctx.emit('alerts.open', { to: 'trading.alerts' })}>Alle Alarme<//></div>`}<//>${form_}
      ${!quick && html`<${Note} icon="info">Benachrichtigung per Push und im TAKT-Verlauf (Demo, nicht aktiv). Kurse sind fiktiv und verzögert.<//>`}</div>`;
  },
};
export default [trdAlerts];
