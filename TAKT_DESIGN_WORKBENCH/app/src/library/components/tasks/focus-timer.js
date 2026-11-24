// Aufgaben: Fokus-Timer (Pomodoro) an einer Aufgabe – Fokus-/Pausenphasen, Zeitraffer für die Demo, Protokoll in der Fokus-Liste.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Chip, Select, Segmented, Icon, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { toIso } from '../calendar/_cal.js';
import { sortTasks, dueInfo, DueText, subProgress, TASK_CSS } from './_tasks.js';
import { PRESETS, fmtClock, sessionsOn, minLabel } from './_tasks-x.js';

export const focusTimer = {
  id: 'focus-timer',
  name: 'Fokus-Timer',
  category: 'Aufgaben',
  description: 'Pomodoro an einer Aufgabe: Fokusblock, kurze Pause, nach vier Blöcken lange Pause. Start, Pause, Zurücksetzen, Überspringen, Presets (25/5, 50/10, 15/3) und ein Zeitraffer für die Demo. Abgeschlossene Blöcke landen im Fokus-Protokoll und auf der Aufgabe.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Fokus' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['ring', 'compact'], default: 'ring' },
    { name: 'preset', label: 'Rhythmus', type: 'select', options: Object.keys(PRESETS), default: '25 / 5' },
    { name: 'showPicker', label: 'Aufgabe wählbar', type: 'boolean', default: true },
    { name: 'showDots', label: 'Tagesziel (Punkte)', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,estimate?,spent?,subtasks?,done?}[]', required: true },
    { slot: 'log', label: 'Fokus-Protokoll', default: 'log', shape: '{id,taskId,title,start,minutes}[]', required: false },
    { slot: 'goal', label: 'Tagesziel', default: 'goal', shape: '{sessionsPerDay}', required: false },
  ],
  events: ['focus.start', 'focus.pause', 'focus.reset', 'focus.skip', 'focus.complete', 'focus.task', 'task.open'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-focus { display:flex; flex-direction:column; align-items:center; gap:var(--tk-space-4); text-align:center; }
  .tk-focus__ring { position:relative; width:min(260px, 100%); aspect-ratio:1; }
  .tk-focus__ring svg { width:100%; height:100%; display:block; }
  .tk-focus__time { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; }
  .tk-focus__clock { font-size:var(--tk-fs-4xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; letter-spacing:-0.02em; line-height:1; }
  .tk-focus__phase { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-muted); }
  .tk-focus__ctrl { display:flex; align-items:center; justify-content:center; gap:var(--tk-space-3); flex-wrap:wrap; }
  .tk-focus__go { min-width:148px; height:48px; }
  .tk-focus__task { width:100%; max-width:420px; display:flex; flex-direction:column; gap:6px; text-align:left; }
  .tk-focus__dots { display:flex; gap:6px; justify-content:center; } .tk-focus__dots i { width:12px; height:12px; border-radius:50%; border:2px solid var(--tk-c-border-strong); } .tk-focus__dots i[data-on="true"] { background:var(--tk-c-accent); border-color:var(--tk-c-accent); }
  .tk-focus--compact { flex-direction:row; flex-wrap:wrap; align-items:center; text-align:left; gap:var(--tk-space-4); }
  .tk-focus--compact .tk-focus__clock { font-size:var(--tk-fs-3xl); } .tk-focus--compact .tk-focus__time { position:static; align-items:flex-start; }
  .tk-focus--compact .tk-focus__task { flex:1 1 240px; max-width:none; }
  .bp-mobile .tk-focus__ring { width:min(236px, 78vw); }`,
  example: { data: { tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', estimate: 60, subtasks: [{ id: 'a', title: 'PDF erzeugen', done: false }] }], log: [], goal: { sessionsPerDay: 6 } } },
  render: function FocusTimer({ props, data, setData, ctx }) {
    const tasks = (Array.isArray(data.tasks) ? data.tasks : []).filter((t) => !t.done).sort(sortTasks);
    const pick = tasks.find((t) => t.id === ctx.ui.selectedId) || tasks.find((t) => dueInfo(t, ctx.today).diff <= 0) || tasks[0];
    const [taskId, setTaskId] = useState(pick?.id), [presetKey, setPreset] = useState(props.preset), [phase, setPhase] = useState('Fokus');
    const P = PRESETS[presetKey] || PRESETS['25 / 5'], len = (ph) => (ph === 'Fokus' ? P.focus : ph === 'Pause' ? P.brk : P.long) * 60;
    const [left, setLeft] = useState(len('Fokus')), [running, setRunning] = useState(false), [fast, setFast] = useState(false), [block, setBlock] = useState(0), [offset, setOffset] = useState(0);
    const task = tasks.find((t) => t.id === taskId) || pick, total = len(phase);
    const todayKey = isoDay(ctx.today), done = sessionsOn(data.log, todayKey).length, goal = Number(data.goal?.sessionsPerDay) || 6;
    const advance = (log) => {
      const next = phase !== 'Fokus' ? 'Fokus' : (block + 1) % 4 === 0 ? 'Lange Pause' : 'Pause';
      if (phase === 'Fokus' && log && task) {
        const start = new Date(+ctx.today + offset * 60000);
        setData('log', (l) => [...(Array.isArray(l) ? l : []), { id: `fl${Date.now().toString(36)}`, taskId: task.id, title: task.title, start: toIso(start), minutes: P.focus, kind: 'Fokus' }]);
        setData('tasks', (all) => all.map((t) => (t.id === task.id ? { ...t, spent: (t.spent || 0) + P.focus } : t)));
        ctx.emit('focus.complete', { id: task.id, minutes: P.focus }); ctx.toast(`Fokusblock geschafft – ${next === 'Pause' ? P.brk : P.long} Min. Pause`);
      } else if (phase !== 'Fokus' && log) ctx.toast('Pause vorbei – weiter geht’s');
      if (phase === 'Fokus' && log) setBlock(block + 1);
      setOffset(offset + total / 60); setPhase(next); setLeft(len(next)); setRunning(false);
    };
    useEffect(() => { if (ctx.ui.selectedId && tasks.some((t) => t.id === ctx.ui.selectedId)) setTaskId(ctx.ui.selectedId); }, [ctx.ui.selectedId]);
    useEffect(() => { if (!running) return undefined; const id = setInterval(() => setLeft((l) => l - (fast ? 60 : 1)), 1000); return () => clearInterval(id); }, [running, fast]);
    useEffect(() => { if (running && left <= 0) advance(true); }, [left, running]);
    if (!tasks.length) return html`<${Card} title=${props.title}><${EmptyState} icon="timer" title="Keine offene Aufgabe" text="Lege eine Aufgabe an, um einen Fokusblock zu starten." /><//>`;
    const R = 112, C = 2 * Math.PI * R, prog = Math.min(1, Math.max(0, 1 - left / total)), tone = phase === 'Fokus' ? 'var(--tk-c-accent)' : 'var(--tk-c-success)';
    const toggle = () => { ctx.emit(running ? 'focus.pause' : 'focus.start', { id: task?.id, phase }); setRunning(!running); };
    const reset = () => { setRunning(false); setLeft(total); ctx.emit('focus.reset', { id: task?.id }); };
    const skip = () => { ctx.emit('focus.skip', { phase }); advance(false); };
    const sp = task ? subProgress(task) : { done: 0, total: 0 }, spent = task?.spent || 0, nextStep = task && (task.subtasks || []).find((s) => !s.done);
    const timeBox = html`<div class="tk-focus__time"><span class="tk-focus__phase">${phase}${running ? ' · läuft' : ''}</span><span class="tk-focus__clock" role="timer" aria-label=${`${phase}: noch ${fmtClock(left)}`} aria-live="off">${fmtClock(left)}</span></div>`;
    const ctrl = html`<div class="tk-focus__ctrl"><${Button} icon="rotate-ccw" aria-label="Zurücksetzen" onClick=${reset} /><${Button} variant="primary" class="tk-focus__go" icon=${running ? 'pause' : 'play'} onClick=${toggle}>${running ? 'Pause' : left < total ? 'Weiter' : 'Start'}<//><${Button} icon="chevron-right" aria-label=${phase === 'Fokus' ? 'Block überspringen' : 'Pause überspringen'} onClick=${skip} /></div>`;
    const taskBox = html`<div class="tk-focus__task">
      ${props.showPicker && html`<${Select} value=${task?.id} aria-label="Aufgabe für den Fokusblock" onChange=${(v) => { setTaskId(v); ctx.setUi('selectedId', v); ctx.emit('focus.task', { id: v }); }} options=${tasks.map((t) => ({ value: t.id, label: t.title }))} />`}
      ${!props.showPicker && html`<b class="tk-truncate">${task?.title}</b>`}
      ${task && html`<div class="tk-row" style="flex-wrap:wrap;gap:6px"><${DueText} t=${task} today=${ctx.today} />${task.estimate && html`<span class="tk-subcount"><${Icon} name="timer" size=${13} />ca. ${minLabel(task.estimate)}</span>`}${spent > 0 && html`<span class="tk-subcount"><${Icon} name="target" size=${13} />${spent} Min. Fokus</span>`}${sp.total > 0 && html`<span class="tk-subcount"><${Icon} name="list-checks" size=${13} />${sp.done}/${sp.total}</span>`}</div>`}
      ${nextStep && html`<div class="tk-subtle" style="font-size:var(--tk-fs-sm)">Nächster Schritt: ${nextStep.title}</div>`}</div>`;
    const opts = html`<div class="tk-row" style="flex-wrap:wrap;justify-content:center;gap:8px"><${Segmented} label="Rhythmus" value=${presetKey} onChange=${(v) => { setPreset(v); if (!running && phase === 'Fokus') setLeft(PRESETS[v].focus * 60); }} options=${Object.keys(PRESETS).map((k) => ({ value: k, label: k }))} /><${Chip} icon="zap" active=${fast} onClick=${() => setFast(!fast)}>Zeitraffer<//></div>`;
    const dots = props.showDots && html`<div class="tk-focus__dots" role="img" aria-label=${`${done} von ${goal} Fokusblöcken heute`}>${Array.from({ length: goal }, (_, i) => html`<i data-on=${i < done}></i>`)}</div>`;
    if (props.style === 'compact') return html`<${Card} title=${props.title} icon="timer" actions=${html`<${Badge}>${done}/${goal} heute<//>`}><div class="tk-focus tk-focus--compact" data-qa="focus-timer">${timeBox}${ctrl}${taskBox}</div><div style="margin-top:12px">${opts}</div><//>`;
    return html`<${Card} title=${props.title} icon="timer" actions=${html`<${Badge} tone=${phase === 'Fokus' ? 'accent' : 'success'}>${done}/${goal} heute<//>`}><div class="tk-focus" data-qa="focus-timer">
      <div class="tk-focus__ring"><svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="14" /><circle cx="130" cy="130" r=${R} fill="none" stroke=${tone} stroke-width="14" stroke-linecap="round" stroke-dasharray=${`${C * prog} ${C}`} stroke-opacity=${prog > 0 ? 1 : 0} transform="rotate(-90 130 130)" /></svg>${timeBox}</div>
      ${taskBox}${ctrl}${dots}${opts}</div><//>`;
  },
};
export default focusTimer;
