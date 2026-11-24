// Fitness: gemeinsame Bedienlogik für Satz-Logger und Fokus-Satz (Satz abhaken, ändern, Übung tauschen/auslassen).
import { html } from '../../../lib/html.js';
import { Button, Badge, Icon } from '../../ui.js';
import { fmtKg, numAuto, e1rm } from './_calc.js';
import { toggleDone, patchSet, addSet, removeSet, skipExercise, swapExercise } from './_session.js';

/** Alle Aktionen auf einer Session. s = aktuelle Session, setS = Setter, data enthält library/history. */
export function useOps(s, setS, ctx, data, prHints = true) {
  const locked = s.status === 'done';
  const toggle = (ex, st) => {
    if (locked) return;
    const r = toggleDone(s, ex.id, st.id); setS(r.session);
    ctx.emit(r.set?.done ? 'set.complete' : 'set.edit', { exercise: ex.exerciseId, set: st.id, kg: st.kg, reps: st.reps, done: !!r.set?.done });
    if (r.pr) { ctx.emit('pr.hit', { exercise: ex.exerciseId }); if (prHints) ctx.toast(`Neuer Bestwert: ${ex.name} – schön gemacht`); }
    else if (r.finished) ctx.toast('Alle Sätze erledigt – du kannst das Training beenden');
  };
  const edit = (ex, st, patch) => { if (locked) return; setS(patchSet(s, ex.id, st.id, patch)); ctx.emit('set.edit', { exercise: ex.exerciseId, set: st.id, ...patch }); };
  const add = (ex) => { setS(addSet(s, ex.id)); ctx.emit('set.add', { exercise: ex.exerciseId }); };
  const remove = (ex, st) => { setS(removeSet(s, ex.id, st.id)); ctx.emit('set.remove', { exercise: ex.exerciseId }); };
  const skip = (ex, on = true) => { setS(skipExercise(s, ex.id, on)); ctx.emit('exercise.skip', { exercise: ex.exerciseId, skipped: on }); if (on) ctx.toast(`${ex.name} ausgelassen – kein Problem`); };
  const open = (ex) => { ctx.setUi('selectedId', ex.exerciseId); ctx.emit('exercise.open', { id: ex.exerciseId }); };
  const swap = (ex) => {
    const lib = data.library || []; const cur = lib.find((l) => l.id === ex.exerciseId);
    const alts = lib.filter((l) => l.id !== ex.exerciseId && (l.muscle === ex.muscle || (cur?.alternatives || []).includes(l.id)))
      .sort((a, b) => ((cur?.alternatives || []).includes(b.id) ? 1 : 0) - ((cur?.alternatives || []).includes(a.id) ? 1 : 0) || a.name.localeCompare(b.name, 'de')).slice(0, 9);
    ctx.openDialog({ title: `${ex.name} ersetzen`,
      body: (close) => html`<div class="tk-col" style="gap:6px"><p class="tk-muted" style="font-size:var(--tk-fs-sm)">Bereits erledigte Sätze bleiben erhalten. Vorschläge nach Muskelgruppe und Alternativen.</p>
        ${alts.length ? alts.map((l) => html`<button type="button" class="tk-sl-alt" onClick=${() => { setS(swapExercise(s, ex.id, l, data.history)); ctx.emit('exercise.swap', { from: ex.exerciseId, to: l.id }); ctx.toast(`${l.name} übernommen`); close(); }}>
          <span class="tk-grow tk-truncate" style="font-weight:600;text-align:left">${l.name}</span><${Badge}>${l.equipment}<//><${Icon} name="chevron-right" size=${16} /></button>`) : html`<span class="tk-muted">Keine Alternativen gefunden.</span>`}</div>`,
      footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//>` });
  };
  return { toggle, edit, add, remove, skip, open, swap, locked };
}

export const prevText = (ex) => { const w = ex.sets.find((x) => x.type === 'work' && x.prevReps != null); return w ? (ex.unit === 'kg' ? `${fmtKg(w.prevKg)} × ${w.prevReps}` : `${w.prevReps} ${ex.unit === 's' ? 's' : 'Wdh.'}`) : null; };
export const setLabel = (ex, i) => (ex.sets[i].type === 'warm' ? 'A' : String(ex.sets.slice(0, i + 1).filter((x) => x.type === 'work').length));
export const pbText = (ex) => (ex.best != null && ex.unit === 'kg' ? `Bestwert: ${numAuto(ex.best, 1)} kg (1RM geschätzt)` : null);
export { e1rm };

export const LOGGER_CSS = `
  .tk-sl-alt { display:flex; align-items:center; gap:10px; width:100%; min-height:48px; padding:6px 12px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:inherit; cursor:pointer; }
  .tk-sl-alt:hover { border-color:var(--tk-c-accent); }
  .tk-sl-ok { width:44px; height:44px; border-radius:50%; border:1.5px solid var(--tk-c-border-strong); background:transparent; display:grid; place-items:center; cursor:pointer; color:var(--tk-c-text-subtle); flex:none; padding:0; }
  .tk-sl-ok:hover:not(:disabled) { border-color:var(--tk-c-success); color:var(--tk-c-success); } .tk-sl-ok:disabled { cursor:default; opacity:.7; }
  .tk-sl-ok[aria-pressed="true"] { background:var(--tk-c-success); border-color:var(--tk-c-success); color:var(--tk-c-surface); }`;
