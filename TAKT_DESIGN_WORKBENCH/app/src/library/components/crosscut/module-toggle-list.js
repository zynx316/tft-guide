// Module & Navigation: Module ein-/ausschalten, Favoriten für die Navigationsleiste wählen und ordnen, mit Vorschau der Leiste.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, Badge, Switch, Card, Button } from '../../ui.js';
import { MODULES, MODULE_AREAS, DEFAULT_PREFS, getPrefs, isEnabled, moduleMeta, plural } from './_system.js';
import { XC_CSS } from './_xc-css.js';

const CSS = `
  .tk-xc-mod { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-mod__bar { display: flex; align-items: stretch; justify-content: space-around; gap: 2px; padding: var(--tk-space-2); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border-strong); background: var(--tk-c-nav-bg); min-width: 0; }
  .tk-xc-mod__bar > span { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 2px; border-radius: var(--tk-radius-md); font-size: var(--tk-fs-xs); color: var(--tk-c-text-muted); }
  .tk-xc-mod__bar > span > span { padding: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tk-xc-mod__bar > span:first-child { background: var(--tk-c-nav-active); color: var(--tk-c-accent); font-weight: var(--tk-fw-semibold); }
  [data-tk-large-text] .tk-xc-mod__bar { flex-wrap: wrap; } [data-tk-large-text] .tk-xc-mod__bar > span { flex: 1 1 40%; }
  [data-tk-large-text] .tk-xc-mod__bar > span > span { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; text-align: center; }
  .tk-xc-mod__empty { border-style: dashed; color: var(--tk-c-text-subtle); }
  .tk-xc-mod__star[aria-pressed="true"] { color: var(--tk-c-warning); }
  .tk-xc-mod__row { display: flex; align-items: center; gap: var(--tk-space-2); min-height: 56px; padding: var(--tk-space-2) var(--tk-space-3); border-bottom: 1px solid var(--tk-c-border); min-width: 0; }
  [data-tk-large-text] .tk-xc-mod__row:has(.tk-switch, .tk-badge) { flex-wrap: wrap; row-gap: 6px; } [data-tk-large-text] .tk-xc-mod__row:has(.tk-switch, .tk-badge) > .tk-xc-ic { display: none; }
  [data-tk-large-text] .tk-xc-mod__row:has(.tk-switch, .tk-badge) > .tk-xc-main { flex: 1 1 100%; } [data-tk-large-text] .tk-xc-mod__row:has(.tk-switch, .tk-badge) > :last-child { margin-left: auto; }
  .tk-xc-mod__row:last-child { border-bottom: 0; }
  .tk-xc-mod__row[data-off="true"] .tk-xc-main { opacity: .55; }
  .tk-xc-mod__tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: var(--tk-space-3); }
  [data-tk-large-text] .tk-xc-mod__tiles { grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); }
  .tk-xc-mod__tile { position: relative; display: flex; flex-direction: column; gap: var(--tk-space-2); padding: var(--tk-space-4); min-height: 128px; border-radius: var(--tk-radius-xl); border: 1.5px solid var(--tk-c-accent); background: var(--tk-c-accent-soft); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-mod__tile[aria-pressed="false"] { border-color: var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text-muted); }
  .tk-xc-mod__tile .tk-xc-s { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .tk-xc-mod__slot { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); min-height: 72px; border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-mod__slot[data-empty="true"] { border-style: dashed; background: transparent; }
  .tk-xc-mod__no { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex: none; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-bold); background: var(--tk-c-surface3); color: var(--tk-c-text-muted); font-variant-numeric: tabular-nums; }
  .tk-xc-mod__slot .tk-xc-s { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .tk-xc-mod__slot .tk-btn { flex: none; min-height: var(--tk-size-touch); }
  [data-tk-large-text] .tk-xc-mod__slot { flex-wrap: wrap; } [data-tk-large-text] .tk-xc-mod__slot .tk-xc-main { flex: 1 1 calc(100% - 7em); }
  .tk-xc-mod__pick { display: flex; flex-direction: column; gap: 2px; } .tk-xc-mod__pick button { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: var(--tk-space-3); min-height: 52px; padding: 6px var(--tk-space-3); border-radius: var(--tk-radius-md); cursor: pointer; min-width: 0; } .tk-xc-mod__pick button:hover { background: var(--tk-c-surface2); } .tk-xc-mod__pick button:focus-visible { outline: 2px solid var(--tk-c-focus); }
  .tk-xc-mod__pick button[aria-current="true"] { background: var(--tk-c-accent-soft); }
  .tk-xc-mod__wrap { position: relative; display: flex; min-width: 0; }
  .tk-xc-mod__wrap .tk-xc-mod__tile { width: 100%; }
  .tk-xc-mod__wrap .tk-xc-iconbtn { position: absolute; top: 6px; right: 6px; }`;

export const moduleToggleList = {
  id: 'module-toggle-list',
  name: 'Module & Navigation',
  category: 'Querschnitt',
  description: 'Alle Module auf einen Blick: ein- und ausschalten, bis zu vier Favoriten für die Navigationsleiste wählen und ordnen. Die Vorschau zeigt die Leiste sofort. Darstellung „slots“: vier Plätze der Leiste, je Platz ein Modul über „Ändern“ wählen (Tausch möglich), Module ein-/ausschalten erst auf Wunsch. Änderungen landen in den gemeinsamen Einstellungen (Favoriten, aktive Module).',
  version: '1.4',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'tiles', 'slots'], default: 'list' },
    { name: 'maxFavorites', label: 'Höchstens Favoriten', type: 'number', default: 4 },
    { name: 'showPreview', label: 'Vorschau der Leiste', type: 'boolean', default: true },
  ],
  data: [{ slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: 'Welt: prefs', required: false }],
  events: ['modules.toggle', 'modules.favorite', 'modules.move', 'modules.reset', 'modules.limit'],
  states: ['empty'],
  flutter: { widget: 'TaktModuleManager', propMap: { style: 'layout', maxFavorites: 'maxFavorites' }, events: { 'modules.toggle': 'onToggle', 'modules.favorite': 'onFavorite', 'modules.move': 'onReorder' } },
  a11y: { role: 'list', nameFrom: 'Module' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { prefs: {} } },
  render: function ModuleToggleList({ props, data, setData, ctx }) {
    const [manage, setManage] = useState(false);
    const prefs = getPrefs(data.prefs, ctx);
    const max = Math.max(1, Number(props.maxFavorites) || 4);
    const favs = prefs.favorites.filter((id) => isEnabled(prefs, id)).slice(0, max);
    const save = (next) => setData('prefs', { ...prefs, ...next });
    const toggle = (m) => {
      if (m.locked) { ctx.toast(`${m.name} bleibt immer aktiv`); return; }
      const on = !isEnabled(prefs, m.id);
      save({ enabled: { ...prefs.enabled, [m.id]: on }, favorites: on ? prefs.favorites : prefs.favorites.filter((x) => x !== m.id) });
      ctx.emit('modules.toggle', { id: m.id, on });
    };
    const star = (m) => {
      if (!isEnabled(prefs, m.id)) { ctx.toast(`${m.name} ist ausgeschaltet`); return; }
      const has = favs.includes(m.id);
      if (!has && favs.length >= max) { ctx.toast(`Höchstens ${max} Favoriten. Entferne zuerst einen.`); ctx.emit('modules.limit', { max }); return; }
      save({ favorites: has ? favs.filter((x) => x !== m.id) : [...favs, m.id] }); ctx.emit('modules.favorite', { id: m.id, on: !has });
    };
    const move = (id, dir) => { const i = favs.indexOf(id), j = i + dir; if (j < 0 || j >= favs.length) return; const a = favs.slice(); [a[i], a[j]] = [a[j], a[i]]; save({ favorites: a }); ctx.emit('modules.move', { id, dir }); };
    const reset = () => { save({ favorites: DEFAULT_PREFS.favorites, enabled: {} }); ctx.emit('modules.reset'); ctx.toast('Standard wiederhergestellt'); };
    const nActive = MODULES.filter((m) => isEnabled(prefs, m.id)).length;

    const preview = props.showPreview && html`<div class="tk-xc-stack"><div class="tk-xc-sec">Navigationsleiste<span class="tk-xc-sec__n">${favs.length} von ${max}</span></div>
      <div class="tk-xc-mod__bar" role="img" aria-label=${`Vorschau: ${favs.map((id) => moduleMeta(id).name).join(', ')} und Mehr`}>${favs.map((id) => { const m = moduleMeta(id); return html`<span key=${id}><${Icon} name=${m.icon} size=${21} /><span>${m.name}</span></span>`; })}
        <span><${Icon} name="menu" size=${21} /><span>Mehr</span></span></div>
      ${favs.length === 0 && html`<p class="tk-xc-s" style="white-space:normal">Noch kein Favorit. Tippe den Stern bei einem Modul.</p>`}</div>`;
    const order = favs.length > 0 && props.style === 'list' && html`<div><div class="tk-xc-sec">Reihenfolge</div><${Card} flush>${favs.map((id, i) => { const m = moduleMeta(id); return html`<div class="tk-xc-mod__row" key=${id}><span class="tk-xc-ic"><${Icon} name=${m.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${m.name}</span></span>
      <button type="button" class="tk-xc-iconbtn" aria-label=${`${m.name} nach oben`} disabled=${i === 0} onClick=${() => move(id, -1)}><${Icon} name="arrow-up" size=${16} /></button>
      <button type="button" class="tk-xc-iconbtn" aria-label=${`${m.name} nach unten`} disabled=${i === favs.length - 1} onClick=${() => move(id, 1)}><${Icon} name="arrow-down" size=${16} /></button></div>`; })}<//></div>`;

    if (props.style === 'slots') {
      const place = (i, id) => { const a = favs.slice(); if (id == null) a.splice(i, 1); else { const j = a.indexOf(id); if (j >= 0) a[j] = a[i]; a[i] = id; } save({ favorites: a.filter(Boolean) }); ctx.emit(id == null ? 'modules.favorite' : 'modules.move', { id: id ?? favs[i], slot: i + 1, on: id != null }); };
      const choose = (i) => ctx.openDialog({ title: `Platz ${i + 1} der Leiste`, body: (close) => html`<div class="tk-xc-mod__pick">${MODULES.filter((m) => isEnabled(prefs, m.id)).map((m) => { const at = favs.indexOf(m.id); return html`<button type="button" key=${m.id} aria-current=${at === i ? 'true' : 'false'} onClick=${() => { place(i, m.id); close(); }}>
          <span class="tk-xc-ic"><${Icon} name=${m.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${m.name}</span><span class="tk-xc-s">${at === i ? 'Aktuell auf diesem Platz' : at >= 0 ? `Steht auf Platz ${at + 1}, die beiden tauschen` : m.desc}</span></span></button>`; })}
          ${favs[i] && html`<${Button} variant="ghost" icon="x" onClick=${() => { place(i, null); close(); }}>Platz leeren<//>`}</div>` });
      const slotRow = (i) => { const id = favs[i], m = id ? moduleMeta(id) : null;
        return m ? html`<div class="tk-xc-mod__slot" key=${i}><span class="tk-xc-mod__no" aria-hidden="true">${i + 1}</span><span class="tk-xc-ic"><${Icon} name=${m.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${m.name}</span><span class="tk-xc-s">${m.desc}</span></span><${Button} onClick=${() => choose(i)} aria-label=${`Platz ${i + 1} ändern, aktuell ${m.name}`}>Ändern<//></div>`
          : html`<div class="tk-xc-mod__slot" data-empty="true" key=${i}><span class="tk-xc-mod__no" aria-hidden="true">${i + 1}</span><span class="tk-xc-main"><span class="tk-xc-t">Platz frei</span><span class="tk-xc-s">Ein Modul für den schnellen Zugriff</span></span><${Button} variant="primary" icon="plus" onClick=${() => choose(i)} aria-label=${`Platz ${i + 1} belegen`}>Wählen<//></div>`; };
      const switches = manage && MODULE_AREAS.map((area) => { const ms = MODULES.filter((m) => m.area === area); return ms.length > 0 && html`<div key=${area}><div class="tk-xc-sec">${area}</div><${Card} flush>${ms.map((m) => html`<div class="tk-xc-mod__row" key=${m.id} data-off=${isEnabled(prefs, m.id) ? undefined : 'true'}>
          <span class="tk-xc-ic"><${Icon} name=${m.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${m.name}</span></span>${m.locked ? html`<${Badge} icon="lock">Immer an<//>` : html`<${Switch} checked=${isEnabled(prefs, m.id)} label=${`${m.name} aktiv`} onChange=${() => toggle(m)} />`}</div>`)}<//></div>`; });
      return html`<div class="tk-xc-mod" data-qa="module-toggle-list">${preview}
        <div><div class="tk-xc-sec">Plätze</div><div class="tk-xc-stack">${Array.from({ length: max }, (_, i) => slotRow(i))}</div></div>
        <div class="tk-xc-stack"><${Button} icon=${manage ? 'chevron-up' : 'sliders-horizontal'} aria-expanded=${manage ? 'true' : 'false'} onClick=${() => setManage(!manage)}>${manage ? 'Module ausblenden' : `Module ein- und ausschalten (${plural(nActive, 'Modul', 'Module')} aktiv)`}<//>
        ${manage && html`<div class="tk-row" style="justify-content:flex-end"><${Button} size="sm" variant="ghost" icon="rotate-ccw" onClick=${reset}>Zurücksetzen<//></div>`}${switches}</div></div>`;
    }
    const starBtn = (m) => html`<button type="button" class="tk-xc-iconbtn tk-xc-mod__star" aria-pressed=${favs.includes(m.id) ? 'true' : 'false'} aria-label=${`${m.name} als Favorit`} onClick=${(e) => { e.stopPropagation(); star(m); }}><${Icon} name="star" size=${18} /></button>`;
    const body = props.style === 'tiles'
      ? MODULE_AREAS.map((area) => { const ms = MODULES.filter((m) => m.area === area); return ms.length > 0 && html`<div key=${area}><div class="tk-xc-sec">${area}</div><div class="tk-xc-mod__tiles">${ms.map((m) => html`<div class="tk-xc-mod__wrap" key=${m.id}><button type="button" class="tk-xc-mod__tile" aria-pressed=${isEnabled(prefs, m.id) ? 'true' : 'false'} onClick=${() => toggle(m)} aria-label=${`${m.name} ${isEnabled(prefs, m.id) ? 'ausschalten' : 'einschalten'}`}>
          <span class="tk-xc-ic"><${Icon} name=${m.icon} size=${22} /></span><span class="tk-xc-main"><span class="tk-xc-t">${m.name}</span><span class="tk-xc-s">${m.desc}</span></span>${m.locked && html`<${Badge} icon="lock">Immer an<//>`}</button>${starBtn(m)}</div>`)}</div></div>`; })
      : MODULE_AREAS.map((area) => { const ms = MODULES.filter((m) => m.area === area); return ms.length > 0 && html`<div key=${area}><div class="tk-xc-sec">${area}</div><${Card} flush>${ms.map((m) => html`<div class="tk-xc-mod__row" key=${m.id} data-off=${isEnabled(prefs, m.id) ? undefined : 'true'}>
          <span class="tk-xc-ic"><${Icon} name=${m.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${m.name}</span><span class="tk-xc-s">${m.desc}</span></span>
          ${starBtn(m)}${m.locked ? html`<${Badge} icon="lock">Immer an<//>` : html`<${Switch} checked=${isEnabled(prefs, m.id)} label=${`${m.name} aktiv`} onChange=${() => toggle(m)} />`}</div>`)}<//></div>`; });
    return html`<div class="tk-xc-mod" data-qa="module-toggle-list">${preview}${order}
      <div class="tk-row" style="justify-content:space-between;gap:var(--tk-space-2)"><span class="tk-xc-s">${plural(nActive, 'Modul', 'Module')} aktiv</span><${Button} size="sm" variant="ghost" icon="rotate-ccw" onClick=${reset}>Zurücksetzen<//></div>
      ${props.style === 'tiles' && html`<p class="tk-xc-s" style="white-space:normal">Tippe ein Modul, um es ein- oder auszuschalten. Mit dem Stern legst du Favoriten für die Leiste fest.</p>`}
      ${body}</div>`;
  },
};
export default moduleToggleList;
