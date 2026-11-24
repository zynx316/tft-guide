// Erfassen-Feld: ein Satz oder ein Sprachbefehl, TAKT erkennt Aufgabe, Termin, Notiz, Buchung, Mahlzeit oder Einkauf und legt sie in der Datenwelt an.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon, Button, Badge, Card, Chip } from '../../ui.js';
import { KINDS, KIND_ORDER, EXAMPLES, parseCapture, asKind, commitCapture } from './_capture.js';
import { priv } from './_system.js';
import { pushUndo } from './_crosscut.js';
import { XC_CSS } from './_xc-css.js';

const CSS = `
  .tk-xc-cap { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-cap__bar { display: flex; align-items: center; gap: var(--tk-space-2); padding: 6px 6px 6px var(--tk-space-4); border-radius: var(--tk-radius-xl); border: 1.5px solid var(--tk-c-border-strong); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-cap__bar:focus-within { border-color: var(--tk-c-accent); box-shadow: 0 0 0 3px var(--tk-c-accent-soft); }
  .tk-xc-cap--big .tk-xc-cap__bar { padding: 10px 10px 10px var(--tk-space-5); box-shadow: var(--tk-shadow-md); }
  .tk-xc-cap__in { flex: 1 1 auto; min-width: 0; height: 44px; border: 0; outline: 0; background: none; color: var(--tk-c-text); font: inherit; font-size: var(--tk-fs-lg); }
  .tk-xc-cap--big .tk-xc-cap__in { height: 52px; font-size: var(--tk-fs-xl); }
  .tk-xc-cap__in::placeholder { color: var(--tk-c-text-subtle); }
  .bp-mobile .tk-xc-cap__in { font-size: 16px; }
  .tk-xc-cap__mic { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 0; background: var(--tk-c-surface3); color: var(--tk-c-text); cursor: pointer; }
  .tk-xc-cap__mic[aria-pressed="true"] { background: var(--tk-c-danger); color: var(--tk-c-bg); animation: tk-xc-pulse 1.1s ease-in-out infinite; }
  @keyframes tk-xc-pulse { 50% { box-shadow: 0 0 0 8px var(--tk-c-danger-soft); } }
  @media (prefers-reduced-motion: reduce) { .tk-xc-cap__mic[aria-pressed="true"] { animation: none; } }
  .tk-xc-cap__prev { display: flex; flex-direction: column; gap: var(--tk-space-3); padding: var(--tk-space-4); border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-cap__prev--missing { border-color: var(--tk-c-warning); }
  .tk-xc-cap__fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--tk-space-2) var(--tk-space-4); margin: 0; }
  .tk-xc-cap__fields div { min-width: 0; }
  .tk-xc-cap__fields dt { font-size: var(--tk-fs-xs); color: var(--tk-c-text-subtle); text-transform: uppercase; letter-spacing: var(--tk-ls-wide); }
  .tk-xc-cap__fields dd { margin: 0; font-weight: var(--tk-fw-medium); overflow-wrap: anywhere; }
  .tk-xc-cap__tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tk-space-2); }
  .tk-xc-cap__tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 84px; padding: var(--tk-space-3) var(--tk-space-2); border-radius: var(--tk-radius-lg); border: 1.5px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; font-weight: var(--tk-fw-medium); cursor: pointer; min-width: 0; }
  .tk-xc-cap__tile[aria-pressed="true"] { border-color: var(--tk-c-accent); background: var(--tk-c-accent-soft); color: var(--tk-c-accent); }
  .tk-xc-cap__tile:hover { border-color: var(--tk-c-accent); }
  @media (min-width: 900px) { .tk-xc-cap__tiles { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
  .tk-xc-cap__sug { display: flex; align-items: center; gap: var(--tk-space-3); width: 100%; padding: var(--tk-space-3) var(--tk-space-4); border: 1px solid var(--tk-c-border); border-radius: var(--tk-radius-lg); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-height: 52px; min-width: 0; }
  .tk-xc-cap__sug:hover { border-color: var(--tk-c-accent); }
  .tk-xc-cap__ok { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); border-radius: var(--tk-radius-lg); background: var(--tk-c-success-soft); min-width: 0; }
  .tk-xc-cap__ok > svg { color: var(--tk-c-success); flex: none; }`;

export const captureField = {
  id: 'capture-field',
  name: 'Erfassen-Feld',
  category: 'Querschnitt',
  description: 'Ein Eingabefeld für alles: „morgen 14 Uhr Zahnarzt“, „!Angebot Müller schicken“, „−12,50 Rewe“, „Milch kaufen“. TAKT zeigt vor dem Speichern, was erkannt wurde, und legt es in der Datenwelt an. Art lässt sich umstellen, Rückgängig inklusive.',
  version: '1.1',
  props: [
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['line', 'tiles', 'smart'], default: 'line' },
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'Was möchtest du festhalten?' },
    { name: 'showExamples', label: 'Beispiele zeigen', type: 'boolean', default: true },
    { name: 'showRecent', label: 'Zuletzt erfasst', type: 'boolean', default: true },
    { name: 'showInbox', label: 'Eingang-Hinweis', type: 'boolean', default: false },
    { name: 'initialText', label: 'Startsatz (Vorschau)', type: 'text', default: '' },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Welt: tasks', required: false },
    { slot: 'events', label: 'Termine', default: 'events', shape: 'Welt: events', required: false },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: 'Welt: transactions', required: false },
    { slot: 'meals', label: 'Mahlzeiten', default: 'nutDiary', shape: 'Welt: nutDiary', required: false },
    { slot: 'shopping', label: 'Einkaufsliste', default: 'nutShopping', shape: 'Welt: nutShopping', required: false },
    { slot: 'inbox', label: 'Eingang', default: 'taskInbox', shape: 'Welt: taskInbox', required: false },
    { slot: 'notes', label: 'Notizen', default: 'notes', shape: 'Welt: notes', required: false },
    { slot: 'foods', label: 'Lebensmittel', default: 'nutFoods', shape: 'Welt: nutFoods', required: false },
  ],
  events: ['capture.input', 'capture.kind', 'capture.voice', 'capture.save', 'capture.undo', 'capture.suggest'],
  states: ['empty'],
  flutter: { widget: 'TaktCaptureField', propMap: { mode: 'layout', placeholder: 'hint', showExamples: 'showExamples' }, events: { 'capture.save': 'onCapture', 'capture.voice': 'onVoice', 'capture.undo': 'onUndo' } },
  a11y: { role: 'group', nameFrom: 'Erfassen' },
  css: XC_CSS + CSS,
  example: { props: { initialText: 'morgen 14 Uhr Zahnarzt' }, data: { tasks: [], events: [], transactions: [], meals: [], shopping: { manual: [] }, inbox: [], notes: [], foods: [] } },
  render: function CaptureField({ props, data, setData, ctx }) {
    const [text, setText] = useState(props.initialText || '');
    const [forced, setForced] = useState(null);
    const [recent, setRecent] = useState([]);
    const [mic, setMic] = useState(0);            // 0 aus, sonst Zähler der Sprachbeispiele
    const [step, setStep] = useState(0);
    useEffect(() => { if (!mic) return undefined; const t = setTimeout(() => { setText(EXAMPLES[step % EXAMPLES.length]); setForced(null); setStep(step + 1); setMic(0); }, 1500); return () => clearTimeout(t); }, [mic]);
    const base = parseCapture(text, ctx.today, Array.isArray(data.foods) ? data.foods : []);
    const p = base && forced ? asKind(base, forced, ctx.today) : base;
    const k = p && KINDS[p.kind];
    const input = (v) => { setText(v); setForced(null); ctx.emit('capture.input', { length: v.length }); };
    const pick = (kind) => { setForced(kind === p?.kind && !forced ? null : kind); ctx.emit('capture.kind', { kind }); };
    const save = () => {
      if (!p || p.missing) return;
      const r = commitCapture(p, { setData, ctx });
      setRecent((l) => [{ id: r.id, kind: p.kind, label: p.title, restore: r.restore }, ...l].slice(0, 4));
      pushUndo(ctx, { text: `${KINDS[p.kind].label} erfasst: ${p.title}`, restore: () => { r.restore(); setRecent((l) => l.filter((x) => x.id !== r.id)); ctx.emit('capture.undo', { id: r.id }); } });
      ctx.emit('capture.save', { kind: p.kind, id: r.id }); setText(''); setForced(null);
    };
    const undo = (r) => { r.restore(); setRecent((l) => l.filter((x) => x.id !== r.id)); ctx.emit('capture.undo', { id: r.id }); ctx.toast('Rückgängig gemacht'); };
    const voice = () => { ctx.emit('capture.voice'); setMic(1); };
    const big = props.mode !== 'line';
    const bar = html`<div class="tk-xc-cap__bar"><button type="button" class="tk-xc-cap__mic" aria-pressed=${mic ? 'true' : 'false'} aria-label=${mic ? 'Zuhören …' : 'Sprechen'} onClick=${voice}><${Icon} name="mic" size=${20} /></button>
      <input class="tk-xc-cap__in" value=${text} placeholder=${mic ? 'Zuhören …' : props.mode === 'tiles' && forced ? KINDS[forced].placeholder : props.placeholder} aria-label="Erfassen" data-qa="capture-input" autocomplete="off" enterkeyhint="done"
        onInput=${(e) => input(e.currentTarget.value)} onKeyDown=${(e) => e.key === 'Enter' && save()} />
      <${Button} variant="primary" icon=${ctx.bp === 'mobile' ? 'arrow-up' : 'plus'} disabled=${!p || !!p.missing} onClick=${save} data-qa="capture-save" aria-label=${k ? `Als ${k.label} erfassen` : 'Erfassen'}>${ctx.bp === 'mobile' ? '' : props.mode === 'smart' && k ? `Als ${k.label}` : 'Erfassen'}<//></div>`;
    const kindChips = html`<div class="tk-xc-chips" data-scroll-x role="group" aria-label="Art wählen">${KIND_ORDER.map((id) => html`<${Chip} icon=${KINDS[id].icon} active=${p?.kind === id} onClick=${() => pick(id)}>${KINDS[id].label}<//>`)}</div>`;
    const preview = p && html`<div class=${`tk-xc-cap__prev${p.missing ? ' tk-xc-cap__prev--missing' : ''}`} aria-live="polite" data-qa="capture-preview">
      <div class="tk-row" style="gap:var(--tk-space-3)"><span class="tk-xc-ic"><${Icon} name=${k.icon} size=${18} /></span><div class="tk-grow"><strong class="tk-xc-t" style="display:block">${p.title}</strong><span class="tk-xc-s" style="display:block">${p.why}</span></div><${Badge} tone=${p.kind === 'inbox' ? 'warning' : p.sure ? 'success' : 'info'}>${p.kind === 'inbox' ? 'Eingang' : k.label}<//></div>
      <dl class="tk-xc-cap__fields">${p.fields.map((f) => html`<div><dt>${f.k}</dt><dd>${priv(ctx, f.v)}</dd></div>`)}</dl>
      ${p.missing && html`<div class="tk-row" style="gap:var(--tk-space-2);color:var(--tk-c-warning)"><${Icon} name="alert-triangle" size=${16} /><span class="tk-xc-s" style="color:var(--tk-c-text)">${p.missing}</span></div>`}
      ${props.mode !== 'tiles' && html`<div><div class="tk-xc-s" style="margin-bottom:6px">Falsch erkannt? Art wählen:</div>${kindChips}</div>`}</div>`;
    const examples = props.showExamples && !p && html`<div class="tk-xc-stack"><div class="tk-xc-sec">Zum Ausprobieren</div><div class="tk-xc-wrap">${EXAMPLES.map((e) => html`<${Chip} onClick=${() => { input(e); ctx.emit('capture.suggest', { text: e }); }}>${e}<//>`)}</div></div>`;
    const recents = props.showRecent && recent.length > 0 && html`<div class="tk-xc-stack"><div class="tk-xc-sec">Zuletzt erfasst</div><${Card} flush>${recent.map((r) => html`<div class="tk-xc-row" key=${r.id} style="cursor:default"><span class="tk-xc-ic tk-xc-ic--success"><${Icon} name=${KINDS[r.kind].icon} size=${18} /></span>
      <span class="tk-xc-main"><span class="tk-xc-t">${r.label}</span><span class="tk-xc-s">${KINDS[r.kind].label} angelegt</span></span>
      <button type="button" class="tk-xc-link" onClick=${() => ctx.emit(`open:${KINDS[r.kind].to}`, { id: r.id })}>Ansehen</button>
      <button type="button" class="tk-xc-iconbtn" aria-label=${`„${r.label}“ rückgängig`} onClick=${() => undo(r)}><${Icon} name="undo-2" size=${16} /></button></div>`)}<//></div>`;
    const sugg = [];
    if (props.mode === 'smart') {
      const ev = (Array.isArray(data.events) ? data.events : []).find((e) => String(e.start).startsWith('2026-11-24') && e.start > '2026-11-24T10:00');
      if (ev) sugg.push({ icon: 'sticky-note', label: `Notiz zu „${ev.title}“`, sub: 'Termin heute', text: `Notiz: ${ev.title} – ` });
      const tx = (Array.isArray(data.transactions) ? data.transactions : []).find((t) => t.type === 'expense');
      if (tx) sugg.push({ icon: 'wallet', label: `Wie zuletzt: ${tx.title}`, sub: 'Letzte Ausgabe wiederholen', text: `−${String(Math.abs(tx.amount).toFixed(2)).replace('.', ',')} ${tx.title.split(' ')[0]}` });
      sugg.push({ icon: 'shopping-basket', label: 'Einkauf ergänzen', sub: 'Auf die Liste setzen', text: 'Milch kaufen' });
    }
    const inboxN = Array.isArray(data.inbox) ? data.inbox.length : 0;
    return html`<div class=${`tk-xc-cap${big ? ' tk-xc-cap--big' : ''}`} data-qa="capture-field">
      ${props.mode === 'tiles' && html`<div class="tk-xc-cap__tiles" role="group" aria-label="Art wählen">${KIND_ORDER.map((id) => html`<button type="button" class="tk-xc-cap__tile" aria-pressed=${(forced || p?.kind) === id ? 'true' : 'false'} onClick=${() => { setForced(id); ctx.emit('capture.kind', { kind: id }); }}><${Icon} name=${KINDS[id].icon} size=${24} />${KINDS[id].label}</button>`)}</div>`}
      ${bar}${preview}
      ${props.mode === 'smart' && !p && sugg.length > 0 && html`<div class="tk-xc-stack"><div class="tk-xc-sec">Vorschläge aus deinem Tag</div>${sugg.map((s) => html`<button type="button" class="tk-xc-cap__sug" onClick=${() => { input(s.text); ctx.emit('capture.suggest', { text: s.text }); }}><span class="tk-xc-ic"><${Icon} name=${s.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${s.label}</span><span class="tk-xc-s">${s.sub}</span></span><${Icon} name="arrow-right" size=${16} /></button>`)}</div>`}
      ${examples}${recents}
      ${props.showInbox && html`<button type="button" class="tk-xc-cap__sug" onClick=${() => ctx.emit('open:tasks.inbox')}><span class="tk-xc-ic tk-xc-ic--warning"><${Icon} name="inbox" size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${inboxN ? `${inboxN} im Eingang` : 'Eingang ist leer'}</span><span class="tk-xc-s">Unerkanntes landet hier und wartet auf Sortierung</span></span><${Icon} name="chevron-right" size=${16} /></button>`}
    </div>`;
  },
};
export default captureField;
