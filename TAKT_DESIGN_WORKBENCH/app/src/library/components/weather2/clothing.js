// Wetter: Kleidungstipp (wx-clothing) und Tagesbriefing (wx-briefing)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Badge, Check, EmptyState } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, NoPlace, SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, EX, toneVar, softVar } from './_weather2.js';
import { clothingAdvice, briefing, SENS_LABEL } from './_advice.js';

export const wxClothing = {
  id: 'wx-clothing',
  name: 'Kleidungstipp',
  category: 'Wetter',
  description: 'Was heute anziehen? Aus gefühlter Temperatur, Wind, Regen und UV für den Rest des Tages abgeleitet. Empfindlichkeit einstellbar (friert schnell / normal / unempfindlich), Dinge zum Mitnehmen abhakbar, Aufschlüsselung nach Tageszeit.',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['card', 'compact'], default: 'card' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Heute anziehen' },
    { name: 'showParts', label: 'Aufschlüsselung nach Tageszeit', type: 'boolean', default: true },
    { name: 'showSensitivity', label: 'Empfindlichkeit einstellbar', type: 'boolean', default: true },
    { name: 'linkLabel', label: 'Link-Text (leer = kein Link)', type: 'text', default: '' },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.clothing.sensitivity', 'weather.clothing.pack', 'weather.advice.open'],
  states: ['empty'],
  css: `
  .tk-wxcl__lead { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.25; }
  .tk-wxcl__chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:var(--tk-space-3); }
  .tk-wxcl__item { display:inline-flex; align-items:center; gap:8px; min-height:40px; padding:0 14px 0 10px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-medium); cursor:pointer; }
  .tk-wxcl__item[aria-pressed="true"] { background:var(--tk-c-success-soft); border-color:transparent; color:var(--tk-c-success); }
  .tk-wxcl__item[aria-pressed="true"] span:last-child { text-decoration:line-through; text-decoration-thickness:1px; }
  .tk-wxcl__parts { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-2); margin-top:var(--tk-space-4); }
  .tk-wxcl__part { display:flex; flex-direction:column; gap:2px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-width:0; } .tk-wxcl__part strong { color:var(--tk-c-text); font-size:var(--tk-fs-lg); }
  .tk-wxbf__item { display:flex; gap:var(--tk-space-3); align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border-top:1px solid var(--tk-c-border); }
  .tk-wxbf__item:first-child { border-top:0; } .tk-wxbf__n { flex:none; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-weight:var(--tk-fw-bold); font-size:var(--tk-fs-sm); }
  .tk-wxbf__title { font-weight:var(--tk-fw-semibold); line-height:1.3; } .tk-wxbf__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; line-height:1.45; }
  .tk-wxbf__item[data-done="true"] { opacity:.55; } .tk-wxbf__item[data-done="true"] .tk-wxbf__title { text-decoration:line-through; }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, setData, ctx }) => {
    const [packed, setPacked] = useState([]);
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} icon="shirt" />`;
    const S = settingsOf(data), a = clothingAdvice(place, S, ctx.today);
    const setSens = (v) => { setData('settings', (s) => ({ ...(s && !Array.isArray(s) ? s : {}), sensitivity: v })); ctx.emit('weather.clothing.sensitivity', { value: v }); };
    const link = props.linkLabel && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('weather.advice.open', { id: 'clothing' })}>${props.linkLabel}<//>`;
    const items = html`<div class="tk-wxcl__chips" role="group" aria-label="Mitnehmen">${a.items.map((i) => html`<button type="button" class="tk-wxcl__item" aria-pressed=${packed.includes(i.id) ? 'true' : 'false'} title=${i.why} onClick=${() => { setPacked(packed.includes(i.id) ? packed.filter((x) => x !== i.id) : [...packed, i.id]); ctx.emit('weather.clothing.pack', { id: i.id }); }}>
      <span style="display:inline-flex;color:var(--tk-c-accent)"><${Icon} name=${packed.includes(i.id) ? 'check-circle-2' : i.icon} size=${17} /></span><span>${i.label}</span></button>`)}</div>`;
    if (props.layout === 'compact') return html`<${Card} title=${props.title} icon="shirt" actions=${link}><div class="tk-wxcl__lead">${a.lead}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm);margin-top:4px">${a.reason}</div>${items}<//>`;
    return html`<${Card} title=${props.title} icon="shirt" actions=${link || html`<${Badge}>gefühlt ab ${a.minFeels}°<//>`}>
      <div class="tk-wxcl__lead">${a.lead}</div><div class="tk-muted" style="margin-top:4px">${a.reason}</div>${items}
      ${props.showParts && html`<div class="tk-wxcl__parts">${a.parts.map((p) => html`<div class="tk-wxcl__part"><span>${p.label}</span><strong class="tk-num">${p.feels}°</strong><span>${p.rain ? 'Regen' : p.gust >= 50 ? `Böen ${p.gust}` : 'trocken'}</span></div>`)}</div>`}
      ${props.showSensitivity && html`<div class="tk-row" style="margin-top:var(--tk-space-4);gap:var(--tk-space-3);flex-wrap:wrap"><span class="tk-muted" style="font-size:var(--tk-fs-sm)">Empfindlichkeit</span>
        <div class="tk-seg" role="tablist" aria-label="Kälteempfinden">${Object.entries(SENS_LABEL).map(([k, l]) => html`<button type="button" role="tab" aria-selected=${S.sensitivity === k ? 'true' : 'false'} onClick=${() => setSens(k)}>${l}</button>`)}</div></div>`}<//>`;
  },
};

export const wxBriefing = {
  id: 'wx-briefing',
  name: 'Wetter-Briefing (priorisiert)',
  category: 'Wetter',
  description: 'Was ist heute wichtig? Priorisierte Hinweise aus Warnungen, Nowcast, Terminen mit Weg, Kleidung, Lauffenster und Pollen – jeweils mit einer passenden Aktion. Erledigte Hinweise lassen sich abhaken.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Heute wichtig' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 5 },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS, SLOT_EVENTS, { slot: 'venues', label: 'Wege zu Orten', default: 'venues', shape: '{ [ort]: {mode,min,outdoor} }' }, { slot: 'training', label: 'Training', default: 'training', shape: '{id,date,start,end,title,where}[]' }],
  events: ['weather.alert.open', 'weather.radar.open', 'weather.advice.open', 'weather.environment.open', 'weather.briefing.done'],
  states: ['empty'],
  css: ``,
  example: { data: { place: EX.place, settings: EX.settings, events: EX.events, venues: EX.venues, training: EX.training } },
  render: ({ props, data, ctx }) => {
    const [done, setDone] = useState([]);
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} icon="sparkles" />`;
    const S = settingsOf(data), U = unitsOf(S);
    const items = briefing(place, S, data.events, data.training, data.venues, ctx.today, U).slice(0, props.limit);
    if (!items.length) return html`<${Card} title=${props.title} icon="sparkles"><${EmptyState} icon="check-circle-2" title="Nichts Besonderes" text="Heute gibt es keine Wetterhinweise, die dich betreffen." /><//>`;
    const open = items.filter((i) => !done.includes(i.id)).length;
    return html`<${Card} flush title=${props.title} icon="sparkles" actions=${html`<${Badge} tone=${open ? 'accent' : 'success'}>${open ? `${open} offen` : 'alles gesehen'}<//>`}>
      ${items.map((it, k) => { const d = done.includes(it.id);
        return html`<div class="tk-wxbf__item" data-done=${d ? 'true' : 'false'}><span class="tk-wxbf__n" style=${`background:${softVar(it.tone)};color:${toneVar(it.tone)}`}><${Icon} name=${it.icon} size=${15} /></span>
          <div class="tk-grow"><div class="tk-wxbf__title">${it.title}</div><div class="tk-wxbf__text">${it.text}</div></div>
          <div class="tk-row" style="gap:4px;flex:none"><${Button} size="sm" onClick=${() => ctx.emit(it.event, it.detail)}>${it.action}<//><${Check} checked=${d} label=${`${it.title} gesehen`} onChange=${(v) => { setDone(v ? [...done, it.id] : done.filter((x) => x !== it.id)); ctx.emit('weather.briefing.done', { id: it.id }); }} /></div></div>`; })}<//>`;
  },
};
export default [wxClothing, wxBriefing];
