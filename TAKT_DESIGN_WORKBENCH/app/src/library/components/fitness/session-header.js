// Fitness: Kopf der Live-Einheit – Titel, Dauer, Satzfortschritt, Volumen, Start/Pause/Beenden.
import { html } from '../../../lib/html.js';
import { useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, Progress, Segmented, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { buildSession, num, fmtKg } from './_calc.js';
import { doneCount, totalCount, volumeNow, start, finish, resetSession } from './_session.js';
import { useSessionTicker, Ring } from './_ui.js';

export const clock = (sec) => { const s = Math.max(0, Math.round(sec)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(s % 60).padStart(2, '0')}`; };

export const sessionHeader = {
  id: 'session-header',
  name: 'Session-Kopf',
  category: 'Fitness',
  description: 'Kopf der Live-Einheit: Titel, Dauer, Satzfortschritt und Volumen mit Start, Pause und Beenden. Wählt bei Bedarf den Trainingstag und zählt die Zeit (nur im Launcher, nicht in QA-Screenshots).',
  version: '1.1',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['compact', 'hero', 'minimal'], default: 'compact' },
    { name: 'showDayPicker', label: 'Trainingstag wählbar (vor dem Start)', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'session', label: 'Live-Einheit', default: 'session', shape: '{dayId,title,subtitle,status,elapsed,rest,exercises:[…]}', required: true },
    { slot: 'program', label: 'Programm', default: 'program', shape: '{days:[{id,name,…}]}' },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
    { slot: 'library', label: 'Übungsbibliothek', default: 'library', shape: 'Übungen[]' },
  ],
  events: ['session.start', 'session.pause', 'session.resume', 'session.finish', 'session.discard', 'session.day', 'safety.open'],
  states: ['empty'],
  css: `
  .tk-sess { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-sess__top { display:flex; align-items:center; gap:var(--tk-space-3); flex-wrap:wrap; }
  .tk-sess__title { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; }
  .tk-sess__stats { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-sess__actions { display:flex; gap:var(--tk-space-2); align-items:center; flex-wrap:wrap; }
  .tk-sess--hero { align-items:center; text-align:center; } .tk-sess--hero .tk-sess__actions { justify-content:center; }
  .tk-sess--minimal { gap:var(--tk-space-2); }
  .tk-sess__pain { margin:0; display:flex; gap:6px; align-items:flex-start; font-size:var(--tk-fs-xs); line-height:var(--tk-lh-snug); color:var(--tk-c-text-subtle); } .tk-sess__pain svg { flex:none; margin-top:2px; } .tk-sess--hero .tk-sess__pain { text-align:left; }
  .bp-mobile .tk-sess__actions .tk-btn--primary { flex:1 1 140px; min-height:44px; }`,
  example: { data: { session: { id: 's', dayId: 'upperA', title: 'Oberkörper A', subtitle: 'Mi, 25.11. · 18:30 · ca. 55 Min.', status: 'running', elapsed: 1260, rest: null, exercises: [
    { id: 'x1', name: 'Bankdrücken', sets: [{ id: 'a', type: 'work', kg: 62.5, reps: 8, done: true }, { id: 'b', type: 'work', kg: 62.5, reps: 8, done: false }] }] } } },
  render: function SessionHeader({ props, data, setData, ctx }) {
    const s = data.session;
    const setS = (fn) => setData('session', fn);
    useSessionTicker(s, setS, ctx);
    const days = data.program?.days || [];
    const load = (id) => {
      const built = days.length ? buildSession(id, { program: data.program, history: data.history || [], library: data.library || [] }, isoDay(ctx.today)) : null;
      if (built) { setData('session', built); ctx.emit('session.day', { id }); }
    };
    useEffect(() => { const id = ctx.ui.selectedId; if (id && s && id !== s.dayId && s.status !== 'running' && days.some((d) => d.id === id)) load(id); }, [ctx.ui.selectedId]);
    if (!s || !(s.exercises || []).length) return html`<${Card}><${EmptyState} icon="dumbbell" title="Kein Training geplant" text="Wähle im Plan einen Trainingstag oder starte ein freies Training." /><//>`;
    const done = doneCount(s), total = totalCount(s), vol = volumeNow(s);
    const ratio = total ? done / total : 0;
    const run = (kind) => { setS((cur) => (kind === 'start' ? start(cur) : { ...cur, status: kind === 'pause' ? 'paused' : 'running' })); ctx.emit(`session.${kind === 'resume' ? 'resume' : kind}`, { id: s.dayId }); };
    const end = () => ctx.openDialog({ title: 'Training beenden?',
      body: () => html`<div class="tk-col" style="gap:10px"><p>${done} von ${total} Sätzen erledigt${done < total ? ' – offene Sätze werden nicht gewertet, ohne Vorwurf.' : '.'}</p><${Progress} value=${ratio} tone=${done === total ? 'success' : undefined} /></div>`,
      footer: (close) => html`<${Button} onClick=${close}>Weitermachen<//><${Button} variant="primary" icon="check" onClick=${() => { setS((cur) => finish(cur)); ctx.emit('session.finish', { done, total, volume: vol }); close(); }}>Beenden<//>` });
    const safety = () => { ctx.emit('safety.open'); ctx.openDialog({ title: 'Hinweis zur Sicherheit',
      body: () => html`<p>Bei Schmerz (nicht bei normalem Muskelbrennen) die Übung abbrechen oder auslassen – das ist kein Rückschritt. Wärme dich mit leichten Sätzen auf und steigere das Gewicht nur schrittweise. Richtwerte, kein medizinischer Rat; bei anhaltenden Beschwerden bitte ärztlich abklären.</p>`,
      footer: (close) => html`<${Button} onClick=${() => { setS((cur) => resetSession(cur)); ctx.emit('session.discard', { id: s.dayId }); ctx.toast('Training zurückgesetzt'); close(); }}>Training zurücksetzen<//><${Button} variant="primary" onClick=${close}>Verstanden<//>` }); };
    const clockEl = html`<span class="tk-num" aria-label="Dauer">${clock(s.elapsed || 0)}</span>`;
    const actions = html`<div class="tk-sess__actions">
      ${s.status === 'ready' && html`<${Button} variant="primary" icon="play" onClick=${() => run('start')}>Training starten<//>`}
      ${s.status === 'running' && html`<${Button} icon="pause" onClick=${() => run('pause')}>Pause<//>`}
      ${s.status === 'paused' && html`<${Button} variant="primary" icon="play" onClick=${() => run('resume')}>Weiter<//>`}
      ${(s.status === 'running' || s.status === 'paused') && html`<${Button} icon="check" onClick=${end}>Beenden<//>`}
      ${s.status === 'done' && html`<${Badge} tone="success" icon="check-circle-2">${s.saved ? 'Gespeichert' : 'Beendet'}<//>`}
      <${Button} variant="ghost" icon="info" aria-label="Sicherheitshinweis" onClick=${safety} /></div>`;
    const picker = props.showDayPicker && s.status === 'ready' && days.length > 1 && html`<${Segmented} label="Trainingstag" value=${s.dayId} onChange=${load} options=${days.map((d) => ({ value: d.id, label: d.name }))} />`;
    const pain = html`<p class="tk-sess__pain" role="note"><${Icon} name="heart-pulse" size=${13} /><span>Bei Schmerz oder Schwindel abbrechen. Stechender Schmerz ist kein Trainingsreiz.</span></p>`;
    if (props.layout === 'minimal') return html`<div class="tk-sess tk-sess--minimal"><div class="tk-sess__top"><div class="tk-grow"><div class="tk-label">${s.title}</div></div>
      <${Badge} tone=${s.status === 'paused' ? 'warning' : 'neutral'} icon="timer">${clockEl}<//>${actions}</div><${Progress} value=${ratio} />${pain}</div>`;
    if (props.layout === 'hero') return html`<${Card}><div class="tk-sess tk-sess--hero">
      <${Ring} value=${ratio} size=${132} stroke=${12} tone=${done === total ? 'success' : 'accent'} label=${`${done} von ${total} Sätzen`}><div><div class="tk-fit-big">${done}<small class="tk-muted" style="font-size:var(--tk-fs-lg)">/${total}</small></div><div class="tk-subtle" style="font-size:var(--tk-fs-xs)">Sätze</div></div><//>
      <div><div class="tk-sess__title">${s.title}</div><div class="tk-muted" style="margin-top:4px">${s.subtitle}</div></div>
      <div class="tk-sess__stats" style="width:100%"><div class="tk-fit-stat"><span>Dauer</span><strong>${clockEl}</strong></div><div class="tk-fit-stat"><span>Volumen</span><strong>${num(vol)}<small> kg</small></strong></div>
        <div class="tk-fit-stat"><span>Übungen</span><strong>${(s.exercises || []).filter((e) => !e.skipped).length}</strong></div></div>
      ${picker}${actions}${pain}</div><//>`;
    return html`<${Card}><div class="tk-sess"><div class="tk-sess__top"><div class="tk-grow"><div class="tk-sess__title tk-truncate">${s.title}</div><div class="tk-muted tk-truncate" style="font-size:var(--tk-fs-sm)">${s.subtitle}</div></div>
      <div class="tk-row" style="gap:16px"><div class="tk-fit-stat"><span>Dauer</span><strong>${clockEl}</strong></div><div class="tk-fit-stat"><span>Sätze</span><strong>${done}<small>/${total}</small></strong></div>
        <div class="tk-fit-stat"><span>Volumen</span><strong>${num(vol)}<small> kg</small></strong></div></div></div>
      <${Progress} value=${ratio} tone=${done === total && total ? 'success' : undefined} />${picker}${actions}${pain}</div><//>`;
  },
};
export default [sessionHeader];
