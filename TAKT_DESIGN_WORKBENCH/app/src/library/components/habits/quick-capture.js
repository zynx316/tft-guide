// Start: Schnellerfassung – Aufgabe, Notiz, Ausgabe oder Wasser ohne Umweg, direkt von der Startseite.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Button, Icon, Input } from '../../ui.js';
import { nextId, toList } from '../../helpers.js';
import { isoDay } from '../../../lib/util.js';
import { list, todayKey, setCount, countOn, target, isDone } from './_habits.js';
import { linked } from './_today.js';

const KINDS = {
  'Aufgabe': { icon: 'list-checks', ph: 'Aufgabe für heute … (Enter)' }, 'Notiz': { icon: 'sticky-note', ph: 'Gedanke festhalten … (Enter)' },
  'Ausgabe': { icon: 'receipt', ph: 'Betrag und Zweck, z. B. 4,80 Kaffee' }, 'Wasser': { icon: 'droplet', ph: '' },
};

export const quickCapture = {
  id: 'quick-capture',
  name: 'Schnellerfassung',
  category: 'Start',
  description: 'Erfassen ohne Umweg: Aufgabe (landet sofort in der Liste), Notiz, Ausgabe oder ein Glas Wasser (zählt bei der Gewohnheit). Art per Chip wählen, Enter genügt.',
  version: '1.1',
  props: [
    { name: 'kinds', label: 'Arten', type: 'list', default: ['Aufgabe', 'Notiz', 'Ausgabe', 'Wasser'] },
    { name: 'elevated', label: 'Schwebend (Schatten)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben (Ziel)', default: 'tasks', shape: 'Aufgaben', required: false },
    { slot: 'habits', label: 'Gewohnheiten (Wasser)', default: 'habits', shape: 'siehe habit-list', required: false },
  ],
  events: ['quickadd.submit', 'capture.note', 'capture.expense', 'capture.water'],
  states: ['empty', 'loading', 'error'],
  css: `
  .tk-qc { display:flex; flex-direction:column; gap:8px; padding:10px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); } .tk-qc--elevated { box-shadow:var(--tk-shadow-md); }
  .tk-qc__kinds { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; } .tk-qc__kinds .tk-chip { flex:none; } .tk-qc__row { display:flex; gap:8px; align-items:center; } .tk-qc__row .tk-input { flex:1; min-width:0; }
  /* Mobil fixiert unten: in Ruhe nur eine Zeile (Art-Knopf, Eingabe, +); die Arten erscheinen erst beim Tippen – spart ~40 % Höhe */
  .tk-qc__kind { display:none; } .bp-mobile .tk-qc { padding:8px; gap:6px; } .bp-mobile .tk-qc__kind { display:inline-flex; }
  .bp-mobile .tk-qc:not(:focus-within):not(.tk-qc--pick) .tk-qc__kinds { display:none; }
  .tk-qc__water { flex:1; display:flex; align-items:center; gap:12px; min-height:var(--tk-size-control); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .bp-mobile .tk-qc { padding:8px; gap:6px; }`,
  example: { data: { tasks: [], habits: [] } },
  render: function QuickCapture({ props, data, setData, ctx }) {
    const kinds = toList(props.kinds).filter((k) => KINDS[k]);
    const [kind, setKind] = useState(kinds[0] || 'Aufgabe'), [v, setV] = useState(''), [pick, setPick] = useState(false);
    const water = linked(list(data.habits), 'nutrition'), today = todayKey(ctx), k = KINDS[kind] ? kind : kinds[0];
    const reset = (msg) => { setV(''); ctx.toast(msg); };
    const add = () => {
      const t = v.trim(); if (!t) return;
      if (k === 'Aufgabe') { setData('tasks', (all) => [{ id: nextId(all, 'q'), title: t, due: isoDay(ctx.today), priority: 'mittel', project: 'Eingang', category: 'Arbeit', status: 'Offen', subtasks: [] }, ...(Array.isArray(all) ? all : [])]); reset(`„${t}“ als Aufgabe angelegt`); }
      else if (k === 'Notiz') { ctx.emit('capture.note', { text: t }); reset('Notiz gespeichert'); }
      else { ctx.emit('capture.expense', { text: t }); reset(`Ausgabe „${t}“ vorgemerkt`); return; }
      ctx.emit('quickadd.submit', { kind: k, title: t });
    };
    const drink = () => { if (!water) return; const n = countOn(water, today) + (water.goal?.step || 1); setCount(setData, water.id, today, n); ctx.emit('capture.water', { count: n }); ctx.toast(n >= target(water) ? 'Wasserziel erreicht' : `${n} von ${target(water)} Gläsern`); };
    return html`<div class=${`tk-qc ${props.elevated ? 'tk-qc--elevated' : ''} ${pick ? 'tk-qc--pick' : ''}`}>
      <div class="tk-qc__kinds" role="group" aria-label="Art der Erfassung">${kinds.map((x) => html`<button type="button" class="tk-chip" aria-pressed=${x === k} onClick=${() => { setKind(x); setPick(false); }}><${Icon} name=${KINDS[x].icon} size=${14} />${x}</button>`)}</div>
      <div class="tk-qc__row"><button type="button" class="tk-btn tk-btn--icon tk-qc__kind" aria-label=${`Art: ${k} – Art wählen`} aria-expanded=${String(pick)} onClick=${() => setPick(!pick)}><${Icon} name=${KINDS[k].icon} size=${18} /></button>${k === 'Wasser' ? html`<div class="tk-qc__water"><span>${water ? `${countOn(water, today)} von ${target(water)} ${water.goal?.unit || ''} heute${isDone(water, today) ? ' – Ziel erreicht' : ''}` : 'Keine Wasser-Gewohnheit angelegt'}</span></div><${Button} variant="primary" icon="plus" onClick=${drink} disabled=${!water}>1 Glas<//>`
        : html`<${Input} value=${v} onInput=${setV} placeholder=${KINDS[k].ph} aria-label=${KINDS[k].ph} onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} variant="primary" icon="plus" onClick=${add} aria-label="Hinzufügen">${ctx.bp === 'mobile' ? null : 'Hinzufügen'}<//>`}</div></div>`;
  },
};
export default quickCapture;
