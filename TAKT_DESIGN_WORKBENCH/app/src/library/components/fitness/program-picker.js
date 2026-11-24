// Fitness: Programmwahl – Einladung ohne Programm (eine Aktion) und Auswahl der Startprogramme (Liste, Karten, Empfehlung).
// Ist bereits ein Programm aktiv, zeigt die Komponente nichts. „Übernehmen“ schreibt Programm, „Heute“ und Live-Einheit in die Welt.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { buildSession, nextTraining, WD } from './_calc.js';

const trainDays = (p) => (p?.rhythm || []).filter((r) => r.kind === 'strength').map((r) => WD[r.dow]);
const soft = (t) => String(t || '').replace(/\//g, '/\u200b');
const metaOf = (c) => `${c.daysPerWeek}× pro Woche · ca. ${c.minutes} Min. · ${c.level}`;
const MODES = ['invite', 'invite-hero', 'invite-step', 'list', 'cards', 'recommend'];

export const programPicker = {
  id: 'program-picker',
  name: 'Programmwahl',
  category: 'Fitness',
  description: 'Leerzustand und Auswahl für das Trainingsprogramm: Einladung mit genau einer Aktion („Programm wählen“, führt zum Plan) oder die Startprogramme als Liste, Karten oder Empfehlung mit einem „Übernehmen“. Sobald ein Programm aktiv ist, bleibt die Komponente unsichtbar.',
  version: '1.0',
  props: [
    { name: 'mode', label: 'Darstellung', type: 'select', options: MODES, default: 'invite' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Noch kein Programm' },
    { name: 'text', label: 'Text', type: 'textarea', default: 'Wähle ein Startprogramm – dann erscheinen hier deine Woche und dein nächstes Training.' },
    { name: 'ctaLabel', label: 'Beschriftung der Aktion', type: 'text', default: 'Programm wählen' },
    { name: 'applyLabel', label: 'Beschriftung „Übernehmen“', type: 'text', default: 'Programm übernehmen' },
    { name: 'to', label: 'Ziel der Einladung (Feature-ID)', type: 'text', default: 'fitness.plan' },
  ],
  data: [
    { slot: 'catalog', label: 'Startprogramme', default: 'catalog', shape: '{id,name,level,daysPerWeek,minutes,text,fit,recommended,program}[]', required: true },
    { slot: 'program', label: 'Aktives Programm (leer = keines)', default: 'program', shape: '{days}' },
    { slot: 'today', label: 'Heute', default: 'today', shape: '{kind,nextDayId,nextWhen,nextName}' },
    { slot: 'library', label: 'Übungen', default: 'library', shape: 'Übungen[]' },
  ],
  events: ['program.choose', 'program.select'],
  states: ['empty'],
  flutter: { widget: 'TaktProgramPicker', propMap: { mode: 'mode', title: 'title', text: 'text', ctaLabel: 'ctaLabel', applyLabel: 'applyLabel' }, events: { 'program.choose': 'onChoose', 'program.select': 'onSelect' } },
  a11y: { role: 'region', nameFrom: 'Titel' },
  css: `
  /* Ausgeblendete Blöcke (quietEmpty) sollen keine Lücke im Raster hinterlassen. */
  .tk-block:empty { display:none !important; }
  .tk-fit-pp { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-fit-pp__inv { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; } .tk-fit-pp__inv > .tk-grow { flex:1 1 220px; min-width:0; }
  .tk-fit-pp__disc { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); flex:none; }
  .tk-fit-pp__hero { display:flex; flex-direction:column; align-items:center; text-align:center; gap:var(--tk-space-3); padding:var(--tk-space-6) var(--tk-space-4); }
  .tk-fit-pp__big { width:88px; height:88px; border-radius:50%; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); border:1.5px dashed var(--tk-c-accent); }
  .tk-fit-pp__prev { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
  .tk-fit-pp__step { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-fit-pp__step .tk-btn { width:100%; min-height:52px; justify-content:center; }
  .tk-fit-pp__lead { max-width:46ch; color:var(--tk-c-text-muted); margin:0; }
  .tk-fit-pp__list { display:flex; flex-direction:column; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); min-width:0; }
  .tk-fit-pp__row { display:flex; align-items:center; gap:var(--tk-space-3); min-height:64px; padding:10px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; cursor:pointer; text-align:left; width:100%; min-width:0; }
  .tk-fit-pp__row:first-child { border-radius:var(--tk-radius-md) var(--tk-radius-md) 0 0; } .tk-fit-pp__row:last-child { border-bottom:0; border-radius:0 0 var(--tk-radius-md) var(--tk-radius-md); } .tk-fit-pp__row:hover { background:var(--tk-c-surface2); } .tk-fit-pp__row[aria-checked="true"] { background:var(--tk-c-accent-soft); }
  .tk-fit-pp__radio { width:20px; height:20px; border-radius:50%; border:2px solid var(--tk-c-border-strong); flex:none; display:grid; place-items:center; } .tk-fit-pp__row[aria-checked="true"] .tk-fit-pp__radio, .tk-fit-pp__card[aria-checked="true"] .tk-fit-pp__radio { border-color:var(--tk-c-accent); background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); }
  .tk-fit-pp__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
  .tk-fit-pp__card { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1.5px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; cursor:pointer; text-align:left; min-width:0; }
  .tk-fit-pp__card:hover { border-color:var(--tk-c-border-strong); } .tk-fit-pp__card[aria-checked="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-fit-pp__top { display:flex; align-items:center; gap:var(--tk-space-2); justify-content:space-between; flex-wrap:wrap; min-width:0; } .tk-fit-pp__n { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); line-height:1; font-variant-numeric:tabular-nums; }
  .tk-fit-pp__days { display:flex; flex-wrap:wrap; gap:4px; } .tk-fit-pp__days span { min-width:34px; text-align:center; padding:3px 6px; border-radius:var(--tk-radius-sm); background:var(--tk-c-surface3); font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); }
  .tk-fit-pp__rec { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); }
  .tk-fit-pp__dayrow { display:flex; gap:var(--tk-space-3); align-items:baseline; font-size:var(--tk-fs-sm); border-bottom:1px solid var(--tk-c-border); padding:6px 0; } .tk-fit-pp__dayrow:last-child { border-bottom:0; } .tk-fit-pp__dayrow b { min-width:2.5em; }
  .tk-fit-pp__cta { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; } .tk-fit-pp__cta .tk-btn--primary { flex:1 1 200px; min-height:48px; }
  .bp-mobile .tk-fit-pp__row { min-height:68px; }`,
  example: { data: {
    catalog: [
      { id: 'prog-gk', name: 'Ganzkörper 3×', level: 'Einsteiger', daysPerWeek: 3, minutes: 45, text: 'Zwei abwechselnde Ganzkörper-Einheiten.', fit: 'Für den Einstieg.', recommended: true,
        program: { id: 'prog-gk', name: 'Ganzkörper 3×', rhythm: [{ dow: 0, kind: 'strength', dayId: 'gkA' }, { dow: 2, kind: 'strength', dayId: 'gkB' }, { dow: 4, kind: 'strength', dayId: 'gkA' }], days: [{ id: 'gkA', name: 'Ganzkörper A', time: '18:30', durationMin: 45, focus: 'Beine, Brust, Rücken', exercises: [{ exerciseId: 'beinpresse', sets: 3, repLo: 10, repHi: 12, rest: 120 }] }, { id: 'gkB', name: 'Ganzkörper B', time: '18:30', durationMin: 45, focus: 'Beine, Brust, Rücken', exercises: [{ exerciseId: 'rudern-kabel', sets: 3, repLo: 10, repHi: 12, rest: 90 }] }] } },
      { id: 'prog-ppl', name: 'Push/Pull/Beine', level: 'Fortgeschritten', daysPerWeek: 3, minutes: 60, text: 'Drücken, Ziehen, Beine im Wechsel.', fit: 'Für mehr Volumen.', recommended: false, program: { id: 'prog-ppl', name: 'Push/Pull/Beine', rhythm: [{ dow: 0, kind: 'strength', dayId: 'push' }], days: [{ id: 'push', name: 'Push', time: '18:30', durationMin: 60, focus: 'Brust, Schulter', exercises: [{ exerciseId: 'bankdruecken', sets: 3, repLo: 8, repHi: 10, rest: 120 }] }] } },
    ],
    program: { days: [] }, today: {}, library: [{ id: 'beinpresse', name: 'Beinpresse' }, { id: 'rudern-kabel', name: 'Rudern am Kabel' }, { id: 'bankdruecken', name: 'Bankdrücken' }] }, props: { mode: 'list' } },
  render: function ProgramPicker({ props, data, setData, ctx }) {
    const cat = Array.isArray(data.catalog) ? data.catalog : [];
    const [sel, setSel] = useState(null);
    const [more, setMore] = useState(false);
    const hasProgram = (data.program?.days || []).length > 0;
    if (hasProgram || !cat.length) return null;
    const mode = MODES.includes(props.mode) ? props.mode : 'invite';
    const chosen = cat.find((c) => c.id === sel) || cat.find((c) => c.recommended) || cat[0];
    const choose = () => ctx.emit('program.choose', { to: props.to || 'fitness.plan' });
    const apply = () => {
      const iso = isoDay(ctx.today); const prog = { ...chosen.program, startDate: iso };
      const today = nextTraining(prog, data.library || [], iso, { weekSessions: 0, weekGoal: 3 });
      setData('program', prog); if (today) setData('today', today);
      const w = ctx.world;
      if (w?.set) {
        const s = today ? buildSession(today.nextDayId, { program: prog, history: [], library: data.library || [] }, today.nextDate) : null;
        if (s) w.set('activeWorkout', { ...s, subtitle: `${today.nextWhen} · ca. ${today.nextMinutes} Min.` });
        w.set('fitnessSummary', (x) => ({ ...(x || {}), kpis: ((x || {}).kpis || []).map((k, i) => (i === 0 ? { ...k, value: today ? today.nextWhen.replace(', ', ' · ') : k.value } : k)), todayKind: today?.kind || 'rest', nextWorkoutDay: today ? today.nextWhen.split(',')[0] : '–', workoutDays: trainDays(prog) }));
      }
      ctx.emit('program.select', { id: chosen.id });
      ctx.toast(`„${chosen.name}“ übernommen${today ? ` – nächstes Training: ${today.nextWhen}` : ''}`);
    };
    const applyBtn = html`<${Button} variant="primary" icon="check" onClick=${apply}>${props.applyLabel}<//>`;
    const radio = (on) => html`<span class="tk-fit-pp__radio" aria-hidden="true">${on && html`<${Icon} name="check" size=${12} stroke=${3} />`}</span>`;

    if (mode === 'invite') return html`<${Card}><div class="tk-fit-pp__inv" data-qa="program-picker"><span class="tk-fit-pp__disc"><${Icon} name="clipboard-check" size=${24} /></span>
      <div class="tk-grow"><div class="tk-h3">${props.title}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${props.text}</div></div>
      <${Button} variant="primary" icon="arrow-right" onClick=${choose}>${props.ctaLabel}<//></div><//>`;

    if (mode === 'invite-hero') return html`<${Card}><div class="tk-fit-pp__hero" data-qa="program-picker"><span class="tk-fit-pp__big"><${Icon} name="dumbbell" size=${36} /></span>
      <h3 class="tk-h2" style="margin:0">${props.title}</h3><p class="tk-fit-pp__lead">${props.text}</p>
      <div class="tk-fit-pp__prev" aria-label="Startprogramme">${cat.map((c) => html`<${Badge} key=${c.id}>${c.name}<//>`)}</div>
      <${Button} variant="primary" icon="arrow-right" onClick=${choose}>${props.ctaLabel}<//></div><//>`;

    if (mode === 'invite-step') return html`<${Card}><div class="tk-fit-pp__step" data-qa="program-picker"><span class="tk-label">Als Nächstes</span>
      <div><div class="tk-h2">${props.title}</div><p class="tk-fit-pp__lead" style="margin-top:6px">${props.text}</p></div>
      <${Button} variant="primary" size="lg" icon="arrow-right" onClick=${choose}>${props.ctaLabel}<//></div><//>`;

    if (mode === 'cards') return html`<div class="tk-fit-pp" data-qa="program-picker"><div><h3 class="tk-h3" style="margin:0">${props.title}</h3><p class="tk-muted" style="margin:4px 0 0;font-size:var(--tk-fs-sm)">${props.text}</p></div>
      <div class="tk-fit-pp__grid" role="radiogroup" aria-label="Startprogramme">${cat.map((c) => html`<button type="button" role="radio" key=${c.id} class="tk-fit-pp__card" aria-checked=${String(chosen.id === c.id)} onClick=${() => { setSel(c.id); ctx.emit('program.preview', { id: c.id }); }}>
        <div class="tk-fit-pp__top"><span class="tk-fit-pp__n">${c.daysPerWeek}×</span>${c.recommended ? html`<${Badge}>Empfohlen<//>` : html`<${Badge}>${c.level}<//>`}${radio(chosen.id === c.id)}</div>
        <div><div class="tk-h3">${soft(c.name)}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">pro Woche · ca. ${c.minutes} Min.</div></div>
        <div class="tk-fit-pp__days" aria-label="Trainingstage">${trainDays(c.program).map((d, i) => html`<span key=${i}>${d}</span>`)}</div>
        <div class="tk-muted" style="font-size:var(--tk-fs-sm)">${c.text}</div></button>`)}</div>
      <div class="tk-fit-pp__cta">${applyBtn}</div></div>`;

    if (mode === 'recommend') {
      const others = cat.filter((c) => c.id !== chosen.id);
      return html`<${Card}><div class="tk-fit-pp" data-qa="program-picker"><span class="tk-label">${chosen.recommended ? 'Empfohlen für den Start' : 'Deine Auswahl'}</span>
        <div class="tk-fit-pp__rec"><div class="tk-row" style="gap:8px;flex-wrap:wrap"><div class="tk-h2 tk-grow">${soft(chosen.name)}</div><${Badge}>${chosen.level}<//></div>
          <div class="tk-muted" style="font-size:var(--tk-fs-sm)">${metaOf(chosen)}</div><div>${chosen.fit}</div>
          <div>${(chosen.program.rhythm || []).filter((r) => r.kind === 'strength').map((r) => { const d = (chosen.program.days || []).find((x) => x.id === r.dayId) || {}; return html`<div class="tk-fit-pp__dayrow" key=${r.dow}><b>${WD[r.dow]}</b><span class="tk-grow">${d.name}</span><span class="tk-muted">${d.focus}</span></div>`; })}</div></div>
        <div class="tk-fit-pp__cta">${applyBtn}<${Button} variant="ghost" icon=${more ? 'chevron-up' : 'chevron-down'} onClick=${() => setMore(!more)} aria-expanded=${String(more)}>Andere Programme<//></div>
        ${more && html`<div class="tk-fit-pp__list" role="radiogroup" aria-label="Andere Programme">${others.map((c) => html`<button type="button" role="radio" key=${c.id} class="tk-fit-pp__row" aria-checked="false" onClick=${() => { setSel(c.id); setMore(false); ctx.emit('program.preview', { id: c.id }); }}>
          <div class="tk-grow" style="min-width:0"><div style="font-weight:600">${soft(c.name)}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${metaOf(c)}</div></div><${Icon} name="chevron-right" size=${16} /></button>`)}</div>`}</div><//>`;
    }

    return html`<${Card} title=${props.title} icon="clipboard-check"><div class="tk-fit-pp" data-qa="program-picker"><p class="tk-muted" style="margin:0;font-size:var(--tk-fs-sm)">${props.text}</p>
      <div class="tk-fit-pp__list" role="radiogroup" aria-label="Startprogramme">${cat.map((c) => html`<button type="button" role="radio" key=${c.id} class="tk-fit-pp__row" aria-checked=${String(chosen.id === c.id)} onClick=${() => { setSel(c.id); ctx.emit('program.preview', { id: c.id }); }}>
        ${radio(chosen.id === c.id)}<div class="tk-grow" style="min-width:0"><div style="font-weight:600">${soft(c.name)}${c.recommended ? ' · empfohlen' : ''}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${metaOf(c)}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${c.text}</div></div></button>`)}</div>
      <div class="tk-fit-pp__cta">${applyBtn}</div></div><//>`;
  },
};
export default [programPicker];
