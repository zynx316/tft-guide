// Wetter: Orte verwalten (wx-places) – Suche, Favoriten, Reihenfolge, Reiseorte, Vergleich
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, Search, EmptyState } from '../../ui.js';
import { settingsOf, unitsOf, cond, dayDiff, stamp, LV, CondIcon, SLOT_SETTINGS, EX } from './_weather2.js';

const activeAlert = (p, now) => (p.alerts || []).filter((a) => a.to > now).sort((a, b) => b.level - a.level)[0];
const tripText = (p, today) => { if (!p.trip) return ''; const d = dayDiff(p.trip.from, today); const f = (x) => `${x.slice(8, 10)}.${x.slice(5, 7)}.`; return `${p.trip.label} ${f(p.trip.from)}–${f(p.trip.to)}${d > 0 ? ` · in ${d} Tagen` : ''}`; };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const wxPlaces = {
  id: 'wx-places',
  name: 'Orte (Suche & Liste)',
  category: 'Wetter',
  description: 'Orte verwalten: Suche mit Vorschlägen und aktueller Temperatur, gemerkte Orte mit Favorit, Reihenfolge, Reisemarkierung (Datum, „in 18 Tagen“) und Warnhinweis, Standort fest an erster Stelle, Vergleich zweier Orte. Antippen wählt den Ort – im Launcher zeigt die ganze Wetter-App danach diesen Ort.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Gemerkte Orte' },
    { name: 'showCompare', label: 'Vergleich anbieten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'places', label: 'Orte', default: 'places', shape: 'Ortsbündel[] (id, name, region, saved, favorite, order, trip?, alerts, current, daily)', required: true }, { slot: 'active', label: 'Aktiver Ort', default: 'active', shape: 'Ortsbündel' }, SLOT_SETTINGS],
  events: ['weather.location.select', 'weather.location.add', 'weather.location.remove', 'weather.location.favorite', 'weather.location.move', 'weather.location.compare'],
  states: ['empty'],
  css: `
  .tk-wxl__row { display:flex; align-items:center; gap:var(--tk-space-3); min-height:68px; padding:8px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); }
  .tk-wxl__row:last-child { border-bottom:0; } .tk-wxl__row[data-active="true"] { background:var(--tk-c-surface2); box-shadow:inset 3px 0 0 var(--tk-c-accent); }
  .tk-wxl__main { display:flex; align-items:center; gap:var(--tk-space-3); flex:1; min-width:0; min-height:52px; border:0; background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; padding:0; }
  .tk-wxl__ic { flex:none; width:44px; height:44px; border-radius:14px; display:grid; place-items:center; background:var(--tk-c-surface2); color:var(--tk-c-text-muted); }
  .tk-wxl__name { font-weight:var(--tk-fw-semibold); display:flex; align-items:center; gap:6px; flex-wrap:wrap; } .tk-wxl__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:1px; }
  .tk-wxl__temp { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; letter-spacing:-0.02em; }
  .tk-wxl__tools { display:flex; gap:6px; flex-wrap:wrap; padding:8px var(--tk-space-4) 12px calc(var(--tk-space-4) + 44px + var(--tk-space-3)); border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .bp-mobile .tk-wxl__tools { padding-left:var(--tk-space-4); }
  .tk-wxl__cmp { display:grid; grid-template-columns:minmax(80px, 1fr) 1fr 1fr; gap:6px var(--tk-space-3); font-size:var(--tk-fs-sm); align-items:center; font-variant-numeric:tabular-nums; } .tk-wxl__cmp strong { font-size:var(--tk-fs-md); }`,
  example: { data: { places: EX.places, active: EX.active, settings: EX.settings } },
  render: ({ props, data, setData, ctx }) => {
    const [q, setQ] = useState('');
    const [more, setMore] = useState(null);
    const [cmp, setCmp] = useState([]);
    const all = Array.isArray(data.places) ? data.places : [];
    const U = unitsOf(settingsOf(data)), now = stamp(ctx.today), act = data.active?.id;
    const saved = all.filter((p) => p.saved).sort((a, b) => (b.isCurrentLocation ? 1 : 0) - (a.isCurrentLocation ? 1 : 0) || a.order - b.order);
    const hits = q.trim() ? all.filter((p) => [p.name, p.region, p.country].some((f) => norm(f).includes(norm(q.trim())))) : [];
    const pick = (p) => { setData('active', p); ctx.emit('weather.location.select', { id: p.id }); ctx.toast(`Ort: ${p.name}`); };
    const upd = (id, patch) => setData('places', (list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const add = (p) => { setData('places', (list) => list.map((x) => (x.id === p.id ? { ...x, saved: true, order: Math.max(0, ...list.map((y) => y.order || 0)) + 1 } : x))); ctx.emit('weather.location.add', { id: p.id }); ctx.toast(`${p.name} gemerkt`); setQ(''); };
    const remove = (p) => { upd(p.id, { saved: false, favorite: false }); if (act === p.id) setData('active', all.find((x) => x.isCurrentLocation) || all[0]); ctx.emit('weather.location.remove', { id: p.id }); ctx.toast(`${p.name} entfernt`); setMore(null); };
    const move = (p, dir) => { const ids = saved.filter((x) => !x.isCurrentLocation).map((x) => x.id), i = ids.indexOf(p.id), j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; setData('places', (list) => list.map((x) => (ids.includes(x.id) ? { ...x, order: ids.indexOf(x.id) + 1 } : x))); ctx.emit('weather.location.move', { id: p.id, dir }); };
    const toggleCmp = (id) => { const n = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp, id].slice(-2); setCmp(n); ctx.emit('weather.location.compare', { ids: n }); };
    const summary = (p) => { const w = cond(p.current.code, p.current.night); return `${w.label} · ${U.t(p.daily[0].max)} / ${U.t(p.daily[0].min)}`; };
    const row = (p, i) => { const al = activeAlert(p, now), isA = act === p.id, open = more === p.id, w = cond(p.current.code, p.current.night), nonCur = saved.filter((x) => !x.isCurrentLocation), idx = nonCur.findIndex((x) => x.id === p.id);
      return html`<div class="tk-wxl__row" data-active=${isA ? 'true' : 'false'}>
        <button type="button" class="tk-wxl__main" aria-label=${`${p.name} anzeigen, ${U.t(p.current.temp)}, ${w.label}`} onClick=${() => pick(p)}>
          <span class="tk-wxl__ic" style=${isA ? 'background:var(--tk-c-accent);color:var(--tk-c-text-on-accent)' : ''}><${Icon} name=${p.isCurrentLocation ? 'map-pin' : p.kind === 'reise' ? 'plane' : p.favorite ? 'star' : 'map'} size=${20} /></span>
          <span class="tk-grow"><span class="tk-wxl__name"><span class="tk-truncate">${p.name}</span>${p.isCurrentLocation && html`<${Badge} tone="accent">Standort<//>`}${isA && html`<${Badge}>Angezeigt<//>`}${al && html`<${Badge} tone=${LV[al.level].tone} icon="alert-triangle">Stufe ${al.level}<//>`}</span>
            <span class="tk-wxl__sub" style="display:block">${p.trip ? tripText(p, ctx.today) : summary(p)}</span>${p.trip && html`<span class="tk-wxl__sub" style="display:block">${summary(p)}</span>`}</span>
          ${ctx.bp !== 'mobile' && html`<${CondIcon} code=${p.current.code} night=${p.current.night} size=${22} />`}<span class="tk-wxl__temp">${U.t(p.current.temp)}</span></button>
        <${Button} variant="ghost" size="sm" icon=${open ? 'chevron-up' : 'more-horizontal'} aria-label=${`Optionen für ${p.name}`} aria-expanded=${open ? 'true' : 'false'} onClick=${() => setMore(open ? null : p.id)} /></div>
        ${open && html`<div class="tk-wxl__tools">${props.showCompare && html`<button type="button" class="tk-chip" aria-pressed=${cmp.includes(p.id) ? 'true' : 'false'} onClick=${() => toggleCmp(p.id)}>Vergleichen</button>`}<${Button} size="sm" icon="star" onClick=${() => { upd(p.id, { favorite: !p.favorite }); ctx.emit('weather.location.favorite', { id: p.id }); }}>${p.favorite ? 'Favorit entfernen' : 'Als Favorit'}<//>
          ${!p.isCurrentLocation && html`<${Button} size="sm" icon="arrow-up" disabled=${idx <= 0} onClick=${() => move(p, -1)}>Nach oben<//><${Button} size="sm" icon="arrow-down" disabled=${idx >= nonCur.length - 1} onClick=${() => move(p, 1)}>Nach unten<//><${Button} size="sm" variant="danger" icon="trash-2" onClick=${() => remove(p)}>Entfernen<//>`}
          ${p.isCurrentLocation && html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm);align-self:center">Der Standort folgt dem Gerät und kann nicht entfernt werden.</span>`}</div>`}`; };
    const [a, b] = cmp.map((id) => all.find((p) => p.id === id)).filter(Boolean);
    const rows = a && b ? [['Jetzt', (p) => `${U.t(p.current.temp)}, ${cond(p.current.code).label}`], ['Heute', (p) => `${U.t(p.daily[0].max)} / ${U.t(p.daily[0].min)}`], ['Regenrisiko', (p) => `${p.daily[0].pop} %`], ['Wind', (p) => U.w(p.current.wind)], ['Morgen', (p) => `${U.t(p.daily[1].max)} · ${cond(p.daily[1].code).label}`]] : [];
    return html`<div class="tk-col" style="gap:var(--tk-space-3)"><${Search} value=${q} onInput=${setQ} placeholder="Ort suchen, z. B. Tokio oder München" />
      ${q.trim() && html`<${Card} flush title=${`Suchergebnisse (${hits.length})`} icon="search">${hits.length ? hits.map((p) => html`<div class="tk-wxl__row"><span class="tk-wxl__ic"><${Icon} name="map-pin" size=${19} /></span><span class="tk-grow"><span class="tk-wxl__name">${p.name}</span><span class="tk-wxl__sub" style="display:block">${p.region}, ${p.country} · ${U.t(p.current.temp)} ${cond(p.current.code).label}</span></span>
        ${p.saved ? html`<${Badge} tone="success" icon="check">Gemerkt<//>` : html`<${Button} size="sm" icon="plus" onClick=${() => add(p)}>Hinzufügen<//>`}</div>`) : html`<${EmptyState} icon="search" title="Kein Ort gefunden" text=${`Zu „${q}“ gibt es keinen Treffer. Prüfe die Schreibweise.`} />`}<//>`}
      ${saved.length ? html`<${Card} flush title=${props.title} icon="map-pin" actions=${html`<${Badge}>${saved.length}<//>`}>${saved.map(row)}<//>` : html`<${Card}><${EmptyState} icon="map-pin" title="Noch keine Orte" text="Suche oben nach einem Ort, um sein Wetter zu merken." /><//>`}
      ${props.showCompare && saved.length > 1 && !a && html`<p class="tk-subtle" style="margin:0;font-size:var(--tk-fs-sm);display:flex;gap:6px;align-items:flex-start"><${Icon} name="git-compare" size=${14} /><span>Zwei Orte über „Optionen › Vergleichen“ auswählen, um sie zu vergleichen.</span></p>`}
      ${a && b && html`<${Card} title="Vergleich" icon="git-compare" actions=${html`<${Button} size="sm" variant="ghost" onClick=${() => setCmp([])}>Zurücksetzen<//>`}><div class="tk-wxl__cmp"><span></span><strong>${a.name}</strong><strong>${b.name}</strong>${rows.map(([l, f]) => html`<span class="tk-muted">${l}</span><span>${f(a)}</span><span>${f(b)}</span>`)}</div><//>`}</div>`;
  },
};
export default [wxPlaces];
