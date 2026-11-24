// Einstellungs-Liste: Gruppen mit Zeilen (Navigation, Schalter, Auswahl, Stepper, Info, Status, Aktion), optional mit Suche.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, Badge, Switch, Select, Segmented, NumberStepper, Card, EmptyState, Button } from '../../ui.js';
import { getPrefs, prefAt, setPrefAt, fold, Hl, COMPUTED } from './_system.js';
import { XC_CSS, toneIc } from './_xc-css.js';

const CSS = `
  .tk-xc-set { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-set__group { display: flex; flex-direction: column; gap: var(--tk-space-2); min-width: 0; }
  .tk-xc-set__foot { padding: 0 var(--tk-space-2); font-size: var(--tk-fs-sm); color: var(--tk-c-text-subtle); line-height: var(--tk-lh-snug); }
  .tk-xc-set__row { display: flex; align-items: center; flex-wrap: wrap; gap: var(--tk-space-3); min-height: 56px; padding: var(--tk-space-2) var(--tk-space-4); border-bottom: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-set__row:last-child { border-bottom: 0; }
  button.tk-xc-set__row { width: 100%; background: none; border-left: 0; border-right: 0; border-top: 0; color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; }
  button.tk-xc-set__row:hover { background: var(--tk-c-surface2); }
  .tk-xc-set__row > .tk-xc-main { flex: 1 1 0; min-width: 120px; }
  .tk-xc-set__row[data-off="true"] { opacity: .5; }
  .tk-xc-set__row--danger .tk-xc-t { color: var(--tk-c-danger); }
  .tk-xc-set__val { flex: none; display: inline-flex; align-items: center; gap: var(--tk-space-2); max-width: 55%; color: var(--tk-c-text-muted); font-size: var(--tk-fs-sm); text-align: right; min-width: 0; }
  .tk-xc-set__val > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tk-xc-set__ctl { flex: none; margin-left: auto; max-width: 100%; }
  .tk-xc-set__row--stack .tk-xc-set__ctl { flex: 1 1 100%; margin-left: 0; }
  .tk-xc-set__row--stack .tk-seg { display: flex; width: 100%; }
  .tk-xc-set__row--stack .tk-seg button { flex: 1 1 0; justify-content: center; }
  .tk-xc-set__tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 156px), 1fr)); gap: var(--tk-space-3); }
  .tk-xc-set__tile { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tk-space-3); padding: var(--tk-space-4); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; min-height: 132px; }
  .tk-xc-set__tile:hover { border-color: var(--tk-c-accent); box-shadow: var(--tk-shadow-sm); }
  .tk-xc-set__tile .tk-xc-t { white-space: normal; overflow-wrap: break-word; hyphens: auto; }
  .bp-mobile .tk-xc-set__tile .tk-xc-t { font-size: 14px; }
  @media (min-width: 900px) { .tk-xc-set__tiles { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); } }
  .tk-xc-set__tile .tk-xc-ic { width: 44px; height: 44px; border-radius: var(--tk-radius-lg); }
  .tk-xc-set__tile .tk-xc-s { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .tk-xc-set__search { display: flex; align-items: center; gap: var(--tk-space-2); height: 44px; padding: 0 var(--tk-space-3); border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-border-strong); background: var(--tk-c-surface); color: var(--tk-c-text-muted); }
  .tk-xc-set__search input { flex: 1 1 auto; min-width: 0; height: 100%; border: 0; outline: 0; background: none; font-size: var(--tk-fs-md); }
  .bp-mobile .tk-xc-set__search input { font-size: 16px; }`;

const SEG = (o) => o.length <= 3 && o.every((x) => String(x.label ?? x).length <= 12);

export const settingsList = {
  id: 'settings-list',
  name: 'Einstellungs-Liste',
  category: 'Querschnitt',
  description: 'Gruppierte Einstellungen: Zeilen zum Öffnen, Schalter, Auswahl, Stepper, Info, Status und Aktionen. Werte mit `pref` landen in den gemeinsamen Einstellungen (wirken in allen Screens), Stil „Kacheln“ zeigt die Gruppen als Einstiegskarten.',
  version: '1.0',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['inset', 'tiles'], default: 'inset' },
    { name: 'searchable', label: 'Suchfeld', type: 'boolean', default: false },
    { name: 'groupIds', label: 'Nur Gruppen (IDs, leer = alle)', type: 'list', default: [] },
  ],
  data: [
    { slot: 'groups', label: 'Gruppen', default: 'groups', shape: '{id,title,footer?,icon?,to?,summary?,rows:[{id,type,label,hint?,icon?,pref?,value?,options?,to?}]}[]', required: true },
    { slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: 'Welt: prefs', required: false },
  ],
  events: ['settings.change', 'settings.search', 'settings.action', 'settings.open'],
  states: ['empty'],
  flutter: { widget: 'TaktSettingsList', propMap: { style: 'layout', searchable: 'searchable', groups: 'sections' }, events: { 'settings.change': 'onChanged', 'settings.action': 'onAction', 'settings.open': 'onOpen' } },
  a11y: { role: 'list', nameFrom: 'Gruppentitel' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { groups: [{ id: 'g1', title: 'Allgemein', rows: [{ id: 'r1', type: 'switch', label: 'Mitteilungen', hint: 'Erinnerungen an Termine und Fristen', value: true }, { id: 'r2', type: 'choice', label: 'Wochenstart', options: ['Montag', 'Sonntag'], value: 'Montag' }, { id: 'r3', type: 'nav', label: 'Darstellung', value: 'Graphite', icon: 'palette', to: 'settings.appearance' }] }] } },
  render: function SettingsList({ props, data, setData, ctx }) {
    const [q, setQ] = useState('');
    const prefs = getPrefs(data.prefs, ctx);
    let groups = Array.isArray(data.groups) ? data.groups : [];
    const ids = Array.isArray(props.groupIds) ? props.groupIds.filter(Boolean) : [];
    if (ids.length) groups = groups.filter((g) => ids.includes(g.id));
    if (!groups.length) return html`<${EmptyState} icon="settings" title="Keine Einstellungen" text="Hier erscheinen die Einstellungen dieses Bereichs." />`;
    const val = (r) => (r.computed ? COMPUTED[r.computed]?.(prefs) : r.member ? (prefAt(prefs, r.pref) || []).includes(r.member) : r.pref ? prefAt(prefs, r.pref) : r.value);
    const set = (g, r, v) => {
      if (r.member) { const cur = prefAt(prefs, r.pref) || []; setData('prefs', setPrefAt(prefs, r.pref, v ? [...cur.filter((x) => x !== r.member), r.member] : cur.filter((x) => x !== r.member))); }
      else if (r.pref) setData('prefs', setPrefAt(prefs, r.pref, v));
      else setData('groups', (all) => (Array.isArray(all) ? all : []).map((x) => (x.id !== g.id ? x : { ...x, rows: x.rows.map((y) => (y.id === r.id ? { ...y, value: v } : y)) })));
      ctx.emit('settings.change', { id: r.id, value: v });
    };
    const off = (r) => r.disabledIf && !prefAt(prefs, r.disabledIf);
    const needle = fold(q).trim();
    const visible = groups.map((g) => ({ ...g, rows: (g.rows || []).filter((r) => !needle || fold(`${r.label} ${r.hint || ''} ${r.keys || ''}`).includes(needle)) })).filter((g) => !needle || g.rows.length);
    const search = props.searchable && html`<label class="tk-xc-set__search"><${Icon} name="search" size=${18} /><input type="search" value=${q} placeholder="Einstellungen durchsuchen" aria-label="Einstellungen durchsuchen" onInput=${(e) => { setQ(e.currentTarget.value); ctx.emit('settings.search', { length: e.currentTarget.value.length }); }} /></label>`;

    if (props.style === 'tiles') {
      return html`<div class="tk-xc-set" data-qa="settings-list">${search}<div class="tk-xc-set__tiles">${visible.map((g) => html`<button type="button" class="tk-xc-set__tile" key=${g.id} onClick=${() => { ctx.emit('settings.open', { id: g.id }); if (g.to) ctx.emit(`open:${g.to}`); }}>
        <span class=${`tk-xc-ic${toneIc(g.tone)}`}><${Icon} name=${g.icon || 'settings'} size=${22} /></span><span class="tk-xc-main"><span class="tk-xc-t" style="font-size:var(--tk-fs-lg)">${g.title}</span><span class="tk-xc-s">${(g.computed && COMPUTED[g.computed]?.(prefs)) || String(g.summary || `${g.rows.length} Einstellungen`).replace(/\{(\w+)\}/g, (_, k) => COMPUTED[k]?.(prefs) ?? '')}</span></span></button>`)}</div>
        ${visible.length === 0 && html`<${EmptyState} icon="search" title=${`Keine Einstellung für „${q}“`} text="Prüfe die Schreibweise." />`}</div>`;
    }
    const row = (g, r) => {
      const v = val(r), dis = off(r), t = r.type || 'nav';
      const lead = r.icon && html`<span class=${`tk-xc-ic${toneIc(r.tone)}`}><${Icon} name=${r.icon} size=${18} /></span>`;
      const text = html`<span class="tk-xc-main"><span class="tk-xc-t" style="white-space:normal"><${Hl} text=${r.label} q=${q} /></span>${r.hint && html`<span class="tk-xc-s" style="white-space:normal">${r.hint}</span>`}</span>`;
      if (t === 'nav' || t === 'action') {
        const danger = r.tone === 'danger';
        return html`<button type="button" class=${`tk-xc-set__row${danger ? ' tk-xc-set__row--danger' : ''}`} key=${r.id} onClick=${() => { if (t === 'nav') { ctx.emit('settings.open', { id: r.id }); if (r.to) ctx.emit(`open:${r.to}`); } else { ctx.emit('settings.action', { id: r.id }); ctx.toast(r.toast || r.label); } }} data-row=${r.id}>
          ${lead}${text}${t === 'nav' ? html`<span class="tk-xc-set__val">${r.badge && html`<${Badge} tone=${r.badgeTone || 'accent'}>${r.badge}<//>`}${v != null && v !== '' && html`<span>${String(v)}</span>`}<${Icon} name="chevron-right" size=${16} /></span>` : html`<${Icon} name=${r.actionIcon || 'chevron-right'} size=${16} />`}</button>`;
      }
      const stack = t === 'choice' && SEG(r.options || []) === false ? false : t === 'choice';
      return html`<div class=${`tk-xc-set__row${stack ? ' tk-xc-set__row--stack' : ''}`} key=${r.id} data-off=${dis ? 'true' : undefined} data-row=${r.id}>${lead}${text}
        ${t === 'switch' && html`<span class="tk-xc-set__ctl"><${Switch} checked=${!!v} label=${r.label} onChange=${(x) => !dis && set(g, r, x)} /></span>`}
        ${t === 'choice' && html`<span class="tk-xc-set__ctl">${SEG(r.options || []) ? html`<${Segmented} value=${v} label=${r.label} options=${(r.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label }))} onChange=${(x) => !dis && set(g, r, x)} />` : html`<${Select} value=${v} options=${r.options} aria-label=${r.label} onChange=${(x) => !dis && set(g, r, x)} />`}</span>`}
        ${t === 'select' && html`<span class="tk-xc-set__ctl" style="min-width:120px"><${Select} value=${v} options=${r.options || []} aria-label=${r.label} disabled=${dis} onChange=${(x) => set(g, r, x)} /></span>`}
        ${t === 'stepper' && html`<span class="tk-xc-set__ctl"><${NumberStepper} value=${Number(v) || 0} min=${r.min} max=${r.max} step=${r.step || 1} unit=${r.unit} label=${r.label} onChange=${(x) => set(g, r, x)} /></span>`}
        ${t === 'info' && html`<span class="tk-xc-set__val"><span>${String(v ?? '–')}</span></span>`}
        ${t === 'status' && html`<span class="tk-xc-set__val"><${Badge} tone=${r.tone || 'neutral'} icon=${r.statusIcon}>${String(v)}<//></span>`}</div>`;
    };
    return html`<div class="tk-xc-set" data-qa="settings-list">${search}
      ${visible.map((g) => html`<section class="tk-xc-set__group" key=${g.id} aria-label=${g.title}>${g.title && html`<div class="tk-xc-sec">${g.title}</div>`}<${Card} flush>${g.rows.map((r) => row(g, r))}<//>${g.footer && html`<p class="tk-xc-set__foot">${g.footer}</p>`}</section>`)}
      ${visible.length === 0 && html`<${EmptyState} icon="search" title=${`Keine Einstellung für „${q}“`} text="Prüfe die Schreibweise oder öffne eine Gruppe." action=${html`<${Button} size="sm" onClick=${() => setQ('')}>Suche zurücksetzen<//>`} />`}</div>`;
  },
};
export default settingsList;
