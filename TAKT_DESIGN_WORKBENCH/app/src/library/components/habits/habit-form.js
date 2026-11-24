// Gewohnheiten: Gewohnheit anlegen – Formular (alles auf einer Seite) oder geführt (4 Schritte), mit Vorlagen und Vorschau.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Field, Input, Select, Segmented, Switch, Chip, Icon, toneColor } from '../../ui.js';
import { nextId } from '../../helpers.js';
import { todayKey, WD, DAYPARTS, rhythmLabel, HABIT_CSS } from './_habits.js';

const ICONS = ['droplet', 'book-open', 'activity', 'moon', 'sun', 'pill', 'dumbbell', 'brain', 'footprints', 'coffee', 'leaf', 'heart', 'pencil', 'bike', 'apple', 'bed'];
const ICON_LABEL = { droplet: 'Wasser', 'book-open': 'Buch', activity: 'Bewegung', moon: 'Abend', sun: 'Morgen', pill: 'Kapsel', dumbbell: 'Training', brain: 'Kopf', footprints: 'Schritte', coffee: 'Kaffee', leaf: 'Natur', heart: 'Herz', pencil: 'Schreiben', bike: 'Rad', apple: 'Ernährung', bed: 'Schlaf' };
const LINKS = { '': '', fitness: 'Fitness: Training zählt automatisch', nutrition: 'Ernährung: Wasser aus dem Tracker', tasks: 'Aufgaben: erledigte Aufgabe zählt' };
const INIT = { name: '', icon: 'droplet', tone: 3, daypart: 'morgens', rtype: 'daily', days: [0, 1, 2, 3, 4], perWeek: 3, qty: false, target: 8, unit: 'Gläser', step: 1, reminder: false, time: '07:30', joker: true, link: '', note: '' };
export const TEMPLATES = [
  { name: 'Wasser trinken', icon: 'droplet', tone: 3, daypart: 'tagsüber', qty: true, target: 10, unit: 'Gläser', step: 1, link: 'nutrition' },
  { name: '10 000 Schritte', icon: 'footprints', tone: 2, daypart: 'tagsüber', qty: true, target: 10000, unit: 'Schritte', step: 1000, link: 'fitness' },
  { name: 'Lesen 20 Min.', icon: 'book-open', tone: 5, daypart: 'abends', qty: true, target: 20, unit: 'Min.', step: 5 },
  { name: 'Dehnen', icon: 'activity', tone: 2, daypart: 'morgens', reminder: true, time: '07:30' },
  { name: 'Vitamin D', icon: 'pill', tone: 4, daypart: 'morgens' },
  { name: 'Kein Handy nach 22 Uhr', icon: 'moon', tone: 6, daypart: 'abends', reminder: true, time: '21:45' },
  { name: 'Tagesplanung', icon: 'list-checks', tone: 1, daypart: 'morgens', rtype: 'weekdays' },
  { name: 'Krafttraining', icon: 'dumbbell', tone: 6, daypart: 'tagsüber', rtype: 'perWeek', perWeek: 3, link: 'fitness' },
];
const STEPS = ['Was', 'Wie oft', 'Ziel', 'Erinnerung'];

export const habitForm = {
  id: 'habit-form',
  name: 'Gewohnheit-Formular',
  category: 'Gewohnheiten',
  description: 'Gewohnheit anlegen: Name, Symbol, Rhythmus (täglich, werktags, bestimmte Tage, X× pro Woche), Tageszeit, Ziel (abhaken oder zählen), Erinnerung, Gnadentag und Verknüpfung. Stile: Formular mit Vorlagen oder geführt in 4 Schritten – mit Vorschau.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Neue Gewohnheit' },
    { name: 'style', label: 'Stil', type: 'select', options: ['form', 'wizard'], default: 'form' },
    { name: 'showTemplates', label: 'Vorlagen zeigen', type: 'boolean', default: true },
    { name: 'showPreview', label: 'Vorschau zeigen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'habits', label: 'Gewohnheiten (Ziel)', default: 'habits', shape: 'siehe habit-list', required: true }],
  events: ['habit.create', 'form.invalid', 'habit.template', 'form.step'],
  states: ['empty', 'loading', 'error'],
  css: `${HABIT_CSS}
  .tk-hf { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-hf__sec { display:flex; flex-direction:column; gap:10px; } .tk-hf__lab { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); }
  .tk-hf__tpl { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; } .tk-hf__tpl .tk-chip { flex:none; }
  .tk-hf__icons { display:grid; grid-template-columns:repeat(auto-fill, minmax(44px, 1fr)); gap:6px; } .tk-hf__ico { height:44px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); display:grid; place-items:center; cursor:pointer; padding:0; }
  .tk-hf__ico[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); color:var(--tk-c-accent); } .tk-hf__tones { display:flex; gap:10px; flex-wrap:wrap; } .tk-hf__tone { width:36px; height:36px; border-radius:50%; border:2px solid transparent; padding:0; cursor:pointer; background:var(--c); box-shadow:inset 0 0 0 2px var(--tk-c-surface); } .tk-hf__tone[aria-pressed="true"] { border-color:var(--tk-c-text); }
  .tk-hf__days { display:flex; gap:6px; flex-wrap:wrap; } .tk-hf__days .tk-chip { min-width:44px; justify-content:center; } .tk-hf__row { display:flex; align-items:center; gap:12px; justify-content:space-between; min-height:44px; } .tk-hf__row > span:first-child { min-width:0; }
  .tk-hf__grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; } .tk-hf__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-hf__prev { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:var(--tk-radius-md); border:1px dashed var(--tk-c-border-strong); background:var(--tk-c-surface2); } .tk-hf__prev .ic { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; background:color-mix(in srgb, var(--hc) 16%, transparent); color:var(--hc); flex:none; } .tk-hf__prev b { display:block; font-weight:var(--tk-fw-medium); }
  .tk-hf__foot { display:flex; gap:8px; justify-content:space-between; align-items:center; flex-wrap:wrap; } .tk-hf__steps { display:flex; gap:6px; align-items:center; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-hf__steps i { width:26px; height:5px; border-radius:3px; background:var(--tk-c-surface3); } .tk-hf__steps i[data-on="true"] { background:var(--tk-c-accent); }
  .bp-mobile .tk-hf__grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } .bp-mobile .tk-hf__tone { width:40px; height:40px; }`,
  example: { data: { habits: [] } },
  render: function HabitForm({ props, setData, ctx }) {
    const [f, setF] = useState(INIT), [step, setStep] = useState(0), [err, setErr] = useState({}), [done, setDone] = useState(null);
    const set = (patch) => { setF((x) => ({ ...x, ...patch })); setDone(null); };
    const validate = (upto = 3) => { const e = {};
      if (upto >= 0 && f.name.trim().length < 2) e.name = 'Bitte gib einen Namen an (mindestens 2 Zeichen).';
      if (upto >= 1 && f.rtype === 'days' && !f.days.length) e.days = 'Wähle mindestens einen Tag.';
      if (upto >= 2 && f.qty && (!(Number(f.target) >= 1) || !f.unit.trim())) e.target = 'Menge (≥ 1) und Einheit angeben.';
      return e; };
    const tpl = (t) => { setF({ ...INIT, ...t, qty: !!t.qty }); setErr({}); setDone(null); ctx.emit('habit.template', { name: t.name }); };
    const draft = () => ({ id: nextId([], 'h'), name: f.name.trim(), icon: f.icon, tone: f.tone, daypart: f.daypart, time: f.reminder ? f.time : null, reminder: f.reminder,
      rhythm: f.rtype === 'days' ? { type: 'days', days: f.days } : f.rtype === 'perWeek' ? { type: 'perWeek', perWeek: Number(f.perWeek) || 3 } : { type: f.rtype }, goal: f.qty ? { target: Number(f.target), unit: f.unit.trim(), step: Number(f.step) || 1 } : null,
      joker: f.joker, link: f.link ? { module: f.link, label: LINKS[f.link].split(':')[0] } : null, note: f.note, since: todayKey(ctx), log: {} });
    const submit = () => { const e = validate(); setErr(e); if (Object.keys(e).length) { ctx.emit('form.invalid', { fields: Object.keys(e) }); if (props.style === 'wizard') setStep(e.name ? 0 : e.days ? 1 : 2); return; }
      const h = draft(); setData('habits', (all) => [...(Array.isArray(all) ? all : []), h]); ctx.emit('habit.create', { id: h.id }); ctx.toast(`„${h.name}“ angelegt – starte klein`); setDone(h.name); setF(INIT); setStep(0); };
    const next = () => { const e = validate(step); setErr(e); if (Object.keys(e).length) { ctx.emit('form.invalid', { fields: Object.keys(e) }); return; } setStep(step + 1); ctx.emit('form.step', { step: step + 1 }); };

    const secWhat = html`<div class="tk-hf__sec">
      ${props.showTemplates && html`<div><div class="tk-hf__lab" style="margin-bottom:8px">Vorlagen</div><div class="tk-hf__tpl" role="group" aria-label="Vorlagen">${TEMPLATES.map((t) => html`<${Chip} icon=${t.icon} active=${f.name === t.name} onClick=${() => tpl(t)}>${t.name}<//>`)}</div></div>`}
      <${Field} label="Name" error=${err.name}><${Input} value=${f.name} onInput=${(v) => set({ name: v })} placeholder="z. B. 10 Minuten dehnen" invalid=${!!err.name} maxlength="40" /><//>
      <div><div class="tk-hf__lab" style="margin-bottom:8px">Symbol</div><div class="tk-hf__icons" role="group" aria-label="Symbol">${ICONS.map((i) => html`<button type="button" class="tk-hf__ico" aria-pressed=${f.icon === i} aria-label=${ICON_LABEL[i]} title=${ICON_LABEL[i]} onClick=${() => set({ icon: i })}><${Icon} name=${i} size=${19} /></button>`)}</div></div>
      <div><div class="tk-hf__lab" style="margin-bottom:8px">Farbe</div><div class="tk-hf__tones" role="group" aria-label="Farbe">${[1, 2, 3, 4, 5, 6].map((t) => html`<button type="button" class="tk-hf__tone" style=${`--c:${toneColor(t)}`} aria-pressed=${f.tone === t} aria-label=${`Farbe ${t}`} onClick=${() => set({ tone: t })}></button>`)}</div></div></div>`;
    const secWhen = html`<div class="tk-hf__sec"><div class="tk-hf__lab">Rhythmus</div>
      <${Segmented} label="Rhythmus" value=${f.rtype} onChange=${(v) => set({ rtype: v })} options=${[{ value: 'daily', label: 'Täglich' }, { value: 'weekdays', label: 'Werktags' }, { value: 'days', label: 'Bestimmte Tage' }, { value: 'perWeek', label: 'X× pro Woche' }]} />
      ${f.rtype === 'days' && html`<div class="tk-hf__days" role="group" aria-label="Wochentage">${WD.map((d, i) => html`<${Chip} active=${f.days.includes(i)} onClick=${() => set({ days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i].sort() })}>${d}<//>`)}</div>`}
      ${err.days && html`<span class="tk-field__error">${err.days}</span>`}
      ${f.rtype === 'perWeek' && html`<${Field} label="Wie oft pro Woche?" hint="Flexibel: egal an welchen Tagen."><${Select} value=${String(f.perWeek)} onChange=${(v) => set({ perWeek: Number(v) })} options=${[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n}× pro Woche` }))} /><//>`}
      <div class="tk-hf__lab" style="margin-top:6px">Tageszeit</div><${Segmented} label="Tageszeit" value=${f.daypart} onChange=${(v) => set({ daypart: v })} options=${DAYPARTS.map((d) => ({ value: d.id, label: d.label, icon: d.icon }))} /></div>`;
    const secGoal = html`<div class="tk-hf__sec"><div class="tk-hf__row"><span><b>Menge zählen</b><div class="tk-hf__sub">Statt Abhaken, z. B. 8 Gläser oder 20 Minuten.</div></span><${Switch} checked=${f.qty} onChange=${(v) => set({ qty: v })} label="Menge zählen" /></div>
      ${f.qty && html`<div class="tk-hf__grid"><${Field} label="Ziel pro Tag"><${Input} type="number" min="1" inputmode="numeric" value=${f.target} onInput=${(v) => set({ target: v })} invalid=${!!err.target} /><//><${Field} label="Einheit"><${Input} value=${f.unit} onInput=${(v) => set({ unit: v })} placeholder="Gläser" /><//><${Field} label="Schrittweite"><${Input} type="number" min="1" inputmode="numeric" value=${f.step} onInput=${(v) => set({ step: v })} /><//></div>`}
      ${err.target && html`<span class="tk-field__error">${err.target}</span>`}
      <div class="tk-hf__row"><span><b>Gnadentag</b><div class="tk-hf__sub">Ein verpasster Tag pro Woche bricht die Serie nicht.</div></span><${Switch} checked=${f.joker} onChange=${(v) => set({ joker: v })} label="Gnadentag" /></div>
      <${Field} label="Verknüpfung" hint="Verknüpfte Daten zählen automatisch mit."><${Select} value=${f.link} onChange=${(v) => set({ link: v })} options=${[{ value: '', label: 'Keine' }, ...['fitness', 'nutrition', 'tasks'].map((k) => ({ value: k, label: LINKS[k] }))]} /><//></div>`;
    const secRemind = html`<div class="tk-hf__sec"><div class="tk-hf__row"><span><b>Erinnerung</b><div class="tk-hf__sub">Eine ruhige Mitteilung, ohne Drängen.</div></span><${Switch} checked=${f.reminder} onChange=${(v) => set({ reminder: v })} label="Erinnerung" /></div>
      ${f.reminder && html`<${Field} label="Uhrzeit"><${Input} type="time" value=${f.time} onInput=${(v) => set({ time: v })} /><//>`}<${Field} label="Notiz (optional)"><${Input} value=${f.note} onInput=${(v) => set({ note: v })} placeholder="Warum ist dir das wichtig?" maxlength="80" /><//></div>`;
    const d = draft(), hc = toneColor(f.tone);
    const preview = props.showPreview && html`<div class="tk-hf__prev" aria-label="Vorschau" style=${`--hc:${hc}`}><span class="ic"><${Icon} name=${f.icon} size=${19} /></span><div class="tk-grow" style="min-width:0"><b class="tk-truncate">${d.name || 'Name der Gewohnheit'}</b><span class="tk-hf__sub">${rhythmLabel(d)} · ${DAYPARTS.find((x) => x.id === f.daypart).label}${d.goal ? ` · ${d.goal.target} ${d.goal.unit}` : ''}${f.reminder ? ` · ${f.time} Uhr` : ''}</span></div></div>`;
    const ok = done && html`<div class="tk-hf__prev" role="status" style="border-style:solid;border-color:var(--tk-c-success)"><${Icon} name="check-circle-2" size=${20} /><span>„${done}“ ist angelegt. Du findest sie unter Heute.</span></div>`;

    if (props.style === 'wizard') return html`<${Card} title=${props.title} icon="plus"><div class="tk-hf">
      <div class="tk-hf__steps" aria-label=${`Schritt ${step + 1} von 4`}>${STEPS.map((s, i) => html`<i data-on=${i <= step}></i>`)}<span style="margin-left:6px"><strong>${STEPS[step]}</strong> · ${step + 1}/4</span></div>
      ${[secWhat, secWhen, secGoal, secRemind][step]}${preview}${ok}
      <div class="tk-hf__foot"><${Button} variant="ghost" icon="chevron-left" onClick=${() => setStep(Math.max(0, step - 1))} disabled=${step === 0}>Zurück<//>
        ${step < 3 ? html`<${Button} variant="primary" iconRight="chevron-right" onClick=${next}>Weiter<//>` : html`<${Button} variant="primary" icon="check" onClick=${submit}>Gewohnheit anlegen<//>`}</div></div><//>`;
    return html`<${Card} title=${props.title} icon="plus"><div class="tk-hf">${secWhat}${secWhen}${secGoal}${secRemind}${preview}${ok}
      <div class="tk-hf__foot"><span class="tk-hf__sub">Du kannst alles später ändern.</span><${Button} variant="primary" icon="check" onClick=${submit}>Gewohnheit anlegen<//></div></div><//>`;
  },
};
export default habitForm;
