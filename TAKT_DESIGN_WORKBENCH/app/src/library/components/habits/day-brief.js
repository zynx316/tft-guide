// Start: Tagesbriefing – das Morgenbriefing in 30 Sekunden (Liste, Geschichte oder Schritt für Schritt).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, EmptyState, Icon, Switch, toneColor } from '../../ui.js';
import { dayData, buildBrief } from './_today.js';
import { Ring, dayLabel, todayKey } from './_habits.js';

const SAMPLE = { weather: { temp: 6, cond: 'Leicht bewölkt', icon: 'cloud-sun', warn: 'Sturmböen ab 14 Uhr', tip: 'Winterjacke einpacken', location: 'Bielefeld' }, finance: { expenses: 1284.3, savingsRate: 0.34 }, plans: [{ id: 'p', name: 'All-World', monthly: 300, day: 1, active: true }],
  training: { next: 'Mi, 25.11.', nextName: 'Oberkörper' }, nutrition: { kcal: 612, kcalGoal: 2400, protein: 41, proteinGoal: 140 },
  events: [{ id: 'e', title: 'Daily Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00' }], tasks: [{ id: 't', title: 'Angebot Müller GmbH', due: '2026-11-24T14:00:00' }], habits: [] };

export const dayBrief = {
  id: 'day-brief',
  name: 'Tagesbriefing',
  category: 'Start',
  description: 'Morgenbriefing aus allen Modulen: Wetter, erster Termin, wichtigste Aufgaben, Gewohnheiten, Geld und Training – jede Zeile mit Quelle und Sprung ins Modul. Stile: Liste (dicht), Geschichte (große Karte) und Schritte (eine Karte nach der anderen).',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Tagesbriefing' },
    { name: 'style', label: 'Stil', type: 'select', options: ['list', 'story', 'steps'], default: 'list' },
    { name: 'userName', label: 'Name', type: 'text', default: 'Jonas' },
    { name: 'time', label: 'Zeit der Mitteilung', type: 'text', default: '07:00' },
    { name: 'showSchedule', label: 'Mitteilung zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'events', label: 'Termine', default: 'events', shape: 'Termine (Welt)', required: false },
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben (Welt)', required: false },
    { slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: false },
    { slot: 'weather', label: 'Wetter', default: 'weather', shape: '{temp,cond,icon,warn?,tip?}', required: false },
    { slot: 'finance', label: 'Finanzkennzahlen', default: 'finance', shape: '{expenses,savingsRate}', required: false },
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{name,monthly,day,active}[]', required: false },
    { slot: 'training', label: 'Training', default: 'training', shape: '{next,nextName}', required: false },
    { slot: 'nutrition', label: 'Ernährung', default: 'nutrition', shape: '{kcal,kcalGoal,protein,proteinGoal}', required: false },
  ],
  events: ['briefing.open.weather', 'briefing.open.calendar', 'briefing.open.tasks', 'briefing.open.habits', 'briefing.open.finance', 'briefing.open.training', 'briefing.step', 'briefing.done', 'briefing.schedule'],
  states: ['empty'],
  css: `
  .tk-db__top { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid var(--tk-c-border); flex-wrap:wrap; } .tk-db__top > div:first-child { flex:1; min-width:160px; } .tk-db__sched { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-db__line { display:flex; align-items:flex-start; gap:12px; width:100%; padding:12px 16px; min-height:64px; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; } .tk-db__line:last-child { border-bottom:0; } .tk-db__line:hover { background:var(--tk-c-surface2); }
  .tk-db__ic { width:36px; height:36px; border-radius:11px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--tc) 15%, transparent); color:var(--tc); } .tk-db__main { flex:1; min-width:0; } .tk-db__main b { display:block; font-weight:var(--tk-fw-semibold); } .tk-db__main span { display:block; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:var(--tk-lh-snug); margin-top:2px; }
  .tk-db__src { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); white-space:nowrap; margin-top:3px; }
  .tk-db__hero { padding:24px 22px 20px; background:linear-gradient(140deg, var(--tk-c-accent-soft), transparent 70%); border-bottom:1px solid var(--tk-c-border); display:flex; flex-direction:column; gap:10px; } .tk-db__hero h2 { font-size:var(--tk-fs-3xl); letter-spacing:var(--tk-ls-tight); margin:0; line-height:1.1; } .tk-db__sum { font-size:var(--tk-fs-lg); color:var(--tk-c-text); line-height:var(--tk-lh-snug); max-width:46ch; }
  .tk-db__cards { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:var(--tk-space-3); padding:var(--tk-space-3); } .bp-mobile .tk-db__cards { grid-template-columns:minmax(0, 1fr); }
  .tk-db__card { display:flex; flex-direction:column; gap:8px; padding:16px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; } .tk-db__card:hover { border-color:var(--tk-c-border-strong); } .tk-db__card b { font-size:var(--tk-fs-lg); letter-spacing:var(--tk-ls-tight); } .tk-db__card p { margin:0; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:var(--tk-lh-normal); }
  .tk-db__step { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; padding:32px 24px 20px; min-height:320px; justify-content:center; } .tk-db__step .tk-db__ic { width:72px; height:72px; border-radius:22px; } .tk-db__step h3 { font-size:var(--tk-fs-2xl); letter-spacing:var(--tk-ls-tight); margin:0; } .tk-db__step p { margin:0; font-size:var(--tk-fs-md); color:var(--tk-c-text-muted); max-width:42ch; line-height:var(--tk-lh-normal); }
  .tk-db__pips { display:flex; gap:6px; justify-content:center; } .tk-db__pips i { width:22px; height:5px; border-radius:3px; background:var(--tk-c-surface3); } .tk-db__pips i[data-on="true"] { background:var(--tk-c-accent); } .tk-db__nav { display:flex; gap:8px; justify-content:space-between; align-items:center; padding:12px 16px 16px; }
  .bp-mobile .tk-db__hero { padding:20px 16px 16px; } .bp-mobile .tk-db__hero h2 { font-size:var(--tk-fs-2xl); } .bp-mobile .tk-db__step { padding:24px 16px 12px; min-height:300px; }
  [data-tk-large-text] .tk-db__line { flex-wrap:wrap; row-gap:0; } [data-tk-large-text] .tk-db__main { flex:1 1 8em; }
  [data-tk-large-text] .tk-db__src { flex:1 0 100%; white-space:normal; margin-top:0; padding-left:calc(36px + 12px); }
  [data-tk-large-text] .tk-db__nav { flex-wrap:wrap; } [data-tk-large-text] .tk-db__top > div:first-child { flex:1 1 100%; min-width:0; }`,
  example: { props: { style: 'list' }, data: SAMPLE },
  render: function DayBrief({ props, data, ctx }) {
    const [i, setI] = useState(0), [sched, setSched] = useState(true), [read, setRead] = useState(false);
    const dd = dayData(data, ctx), lines = buildBrief(data, ctx, dd);
    if (!lines.length || (!dd.timed.length && !dd.tasks.length && !dd.habits.length && !Object.keys(data.weather || {}).length)) return html`<${Card} title=${props.title}><${EmptyState} icon="sunrise" title="Noch kein Briefing" text="Sobald Kalender, Aufgaben und Wetter verbunden sind, bekommst du hier jeden Morgen eine Zusammenfassung." /><//>`;
    const open = (l) => ctx.emit(`briefing.open.${l.key}`, { id: l.key });
    const sum = `${dd.timed.length} Termine, ${dd.scopeOpen.length} Aufgaben fällig${data.weather?.warn ? `, ${String(data.weather.warn).replace(/^./, (c) => c.toLowerCase())}` : ''}.`;
    const hello = `Guten Morgen, ${props.userName}`;
    const schedRow = props.showSchedule && html`<div class="tk-db__sched"><${Icon} name="bell" size=${15} />Mitteilung um ${props.time}<${Switch} checked=${sched} onChange=${(v) => { setSched(v); ctx.emit('briefing.schedule', { on: v }); ctx.toast(v ? `Briefing täglich um ${props.time} Uhr` : 'Briefing-Mitteilung aus'); }} label="Briefing-Mitteilung" /></div>`;
    const lineBtn = (l) => html`<button type="button" class="tk-db__line" style=${`--tc:${toneColor(l.tone)}`} onClick=${() => open(l)}><span class="tk-db__ic"><${Icon} name=${l.icon} size=${18} /></span><span class="tk-db__main"><b>${l.title}</b><span>${l.text}</span></span><span class="tk-db__src">${l.source}</span></button>`;

    if (props.style === 'steps') {
      const last = i >= lines.length, l = lines[Math.min(i, lines.length - 1)];
      const go = (n) => { setI(n); ctx.emit('briefing.step', { step: n }); };
      if (last) return html`<${Card} flush><div class="tk-db__step"><${Ring} value=${1} size=${84} stroke=${7} color="var(--tk-c-success)"><${Icon} name="check" size=${32} /><//><h3>Bereit für den Tag</h3><p>${sum} Ein Schritt nach dem anderen.</p>
        <${Button} variant="primary" iconRight="chevron-right" onClick=${() => ctx.emit('briefing.done')}>Los geht’s<//><${Button} variant="ghost" icon="rotate-ccw" onClick=${() => go(0)}>Noch einmal<//></div><//>`;
      return html`<${Card} flush><div class="tk-db__step" style=${`--tc:${toneColor(l.tone)}`}><div class="tk-db__pips" aria-label=${`Karte ${i + 1} von ${lines.length}`}>${lines.map((x, k) => html`<i data-on=${k <= i}></i>`)}</div>
        <span class="tk-db__ic"><${Icon} name=${l.icon} size=${32} /></span><div class="tk-label">${l.source}</div><h3>${l.title}</h3><p>${l.text}</p>
        <${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => open(l)}>In ${l.source} öffnen<//></div>
        <div class="tk-db__nav"><${Button} variant="ghost" icon="chevron-left" onClick=${() => go(Math.max(0, i - 1))} disabled=${i === 0}>Zurück<//><span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">${i + 1} / ${lines.length}</span><${Button} variant="primary" iconRight="chevron-right" onClick=${() => go(i + 1)}>${i === lines.length - 1 ? 'Fertig' : 'Weiter'}<//></div><//>`;
    }
    if (props.style === 'story') return html`<${Card} flush><div class="tk-db__hero"><div class="tk-row" style="gap:8px"><${Badge} tone="accent" icon="sunrise">${props.title}<//><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${dayLabel(todayKey(ctx))} · 30 Sekunden</span></div><h2>${hello}</h2><p class="tk-db__sum">${sum}</p>${schedRow}</div>
      <div class="tk-db__cards">${lines.map((l) => html`<button type="button" class="tk-db__card" style=${`--tc:${toneColor(l.tone)}`} onClick=${() => open(l)}><span class="tk-db__ic"><${Icon} name=${l.icon} size=${18} /></span><b>${l.title}</b><p>${l.text}</p><span class="tk-db__src">${l.source}</span></button>`)}</div>
      <div class="tk-db__nav"><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${read ? 'Als gelesen markiert' : `${lines.length} Quellen`}</span><${Button} variant="primary" icon="check" onClick=${() => { setRead(true); ctx.emit('briefing.done'); }}>Verstanden<//></div><//>`;
    return html`<${Card} flush><div class="tk-db__top"><div><div class="tk-card__title">${hello}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${sum}</div></div>${schedRow}</div>${lines.map(lineBtn)}<//>`;
  },
};
export default dayBrief;
