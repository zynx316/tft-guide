// Ernährung: Ziele & Bedarf – Assistent in vier Schritten mit Sicherheits-Stopps (kein Ziel unter Grundumsatz, Tempo begrenzt, nichts für Minderjährige).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Segmented, Progress, Chip, Switch, Badge } from '../../ui.js';
import { GOAL_TYPES, ACTIVITY, MACRO_PRESETS, planTarget, macrosFor, actFactor, num, bmr } from './_calc.js';
import { Stepper, NU_CSS, obj, tintBox } from './_ui.js';

const SEX = [{ value: 'm', label: 'Männlich' }, { value: 'f', label: 'Weiblich' }, { value: 'x', label: 'Keine Angabe' }];
const TITLES = ['Dein Ziel', 'Körperdaten', 'Alltag & Bewegung', 'Ergebnis'];

export const goalWizard = {
  id: 'goal-wizard',
  name: 'Ziele & Bedarf (Assistent)',
  category: 'Ernährung',
  description: 'Vier Schritte zum Kalorien- und Makroziel: Ziel, Körperdaten, Aktivität, Ergebnis mit Herleitung. Sicherheits-Stopps: kein Ziel unter dem Grundumsatz, Abnehmtempo begrenzt, für unter 18 Jahre keine Defizit-Ziele; Aktivitätskalorien zählen nicht zusätzlich. Orientierungswerte, kein medizinischer Rat.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ziele & Bedarf' },
    { name: 'startStep', label: 'Startschritt (1–4)', type: 'number', default: 1 },
  ],
  data: [
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal,protein,carbs,fat,fiber,water,trainingDays,trainingBonus,useTrainingBonus,showNumbers}', required: true },
    { slot: 'profile', label: 'Profil', default: 'profile', shape: '{sex,age,heightCm,weightKg,goalWeightKg,activity,goalType,pace,preset}', required: true },
  ],
  events: ['goals.step', 'goals.apply', 'goals.blocked', 'goals.pace'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-gw { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-gw__opts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } .bp-mobile .tk-gw__opts { grid-template-columns:1fr; }
  .tk-gw__opt { display:flex; gap:12px; align-items:center; text-align:left; padding:12px 14px; min-height:64px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; font:inherit; cursor:pointer; min-width:0; }
  .tk-gw__opt:hover { border-color:var(--tk-c-border-strong); } .tk-gw__opt[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); } .tk-gw__opt:disabled { opacity:.5; cursor:default; }
  .tk-gw__opt strong { display:block; } .tk-gw__opt span.t { font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); }
  .tk-gw__fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:var(--tk-space-4); } .tk-gw__fields > div { display:flex; flex-direction:column; gap:6px; }
  .tk-gw__nums { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; } .tk-gw__nums div { padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); } .tk-gw__nums strong { display:block; font-size:var(--tk-nfs-xl); font-variant-numeric:tabular-nums; } .tk-gw__nums span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-muted); }
  .tk-gw__target { padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:linear-gradient(135deg, var(--tk-c-accent-soft), transparent); border:1px solid var(--tk-c-border); } .tk-gw__target .tk-nu-big { color:var(--tk-c-accent); }
  .tk-gw__stop { display:flex; gap:10px; padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-warning-soft); font-size:var(--tk-nfs-sm); align-items:flex-start; } .tk-gw__stop .icon { color:var(--tk-c-warning); flex:none; margin-top:1px; }
  .tk-gw__range { width:100%; height:44px; accent-color:var(--tk-c-accent); }
  .tk-gw__why { padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); display:flex; flex-direction:column; gap:6px; font-variant-numeric:tabular-nums; }
  .tk-gw__nav { display:flex; justify-content:space-between; gap:10px; } .tk-gw__nav .tk-btn { min-width:110px; justify-content:center; }`,
  example: { data: { goals: { kcal: 2400, protein: 140, carbs: 291, fat: 75, fiber: 30, water: 2500, trainingDays: ['Mo', 'Mi', 'Fr'], trainingBonus: 150, useTrainingBonus: false, showNumbers: true }, profile: { sex: 'm', age: 38, heightCm: 183, weightKg: 82.4, goalWeightKg: 79, activity: 'aktiv', goalType: 'abnehmen', pace: 0.35, preset: 'eiweiss' } } },
  render: function GoalWizard({ props, data, setData, ctx }) {
    const prof = obj(data.profile), goals = obj(data.goals);
    const [step, setStep] = useState(Math.max(0, Math.min(3, (props.startStep || 1) - 1)));
    const [d, setD] = useState({ goalType: prof.goalType || 'abnehmen', sex: prof.sex || 'm', age: prof.age || 35, heightCm: prof.heightCm || 175, weightKg: prof.weightKg || 75, goalWeightKg: prof.goalWeightKg || 72, activity: prof.activity || 'leicht', pace: prof.pace ?? 0.35, preset: prof.preset || 'ausgewogen', bonus: !!goals.useTrainingBonus });
    const [why, setWhy] = useState(false);
    const set = (k) => (v) => setD((x) => ({ ...x, [k]: v }));
    const p = { sex: d.sex, age: d.age, heightCm: d.heightCm, weightKg: d.weightKg, activity: d.activity };
    const numbers = d.goalType !== 'gesund';
    const mode = d.goalType === 'gesund' ? 'halten' : d.goalType;
    const res = planTarget(p, mode, d.pace), preset = MACRO_PRESETS.find((m) => m.id === d.preset) || MACRO_PRESETS[0];
    const mac = macrosFor(res.target, d.weightKg, preset);
    const minor = d.age < 18, weeks = d.pace > 0 ? Math.round(Math.abs(d.weightKg - d.goalWeightKg) / d.pace) : 0;
    const go = (n) => { setStep(n); ctx.emit('goals.step', { step: n + 1 }); };
    const apply = () => {
      if (mode === 'abnehmen' && minor) { ctx.emit('goals.blocked', { reason: 'minor' }); return; }
      if (res.blocked) ctx.emit('goals.blocked', { reason: res.blocked });
      setData('goals', (g) => ({ ...obj(g), kcal: res.target, protein: mac.protein, carbs: mac.carbs, fat: mac.fat, useTrainingBonus: d.bonus, showNumbers: numbers }));
      setData('profile', (x) => ({ ...obj(x), ...p, goalType: d.goalType, goalWeightKg: d.goalWeightKg, pace: d.pace, preset: d.preset, bmr: res.bmr, tdee: res.tdee }));
      ctx.emit('goals.apply', { kcal: res.target }); ctx.toast(numbers ? `Ziel gespeichert: ${num(res.target)} kcal` : 'Gewohnheitsmodus aktiv: Zahlen sind ausgeblendet');
    };
    let body;
    if (step === 0) body = html`<div class="tk-gw__opts">${GOAL_TYPES.map((g) => html`<button type="button" class="tk-gw__opt" aria-pressed=${String(d.goalType === g.id)} disabled=${g.id === 'abnehmen' && minor} onClick=${() => set('goalType')(g.id)}>${tintBox('accent', g.icon, 20)}<span style="min-width:0"><strong>${g.label}</strong><span class="t">${g.text}</span></span></button>`)}</div>
      ${minor && html`<p class="tk-nu-meta" style="margin:0">Unter 18 Jahren werden keine Defizit-Ziele angeboten.</p>`}`;
    else if (step === 1) body = html`<div class="tk-gw__fields"><div><span class="tk-nu-meta">Geschlecht (für die Formel)</span><${Segmented} value=${d.sex} onChange=${set('sex')} options=${SEX} label="Geschlecht" /></div>
      <div><span class="tk-nu-meta">Alter</span><${Stepper} value=${d.age} onChange=${set('age')} min=${14} max=${99} unit="J." label="Alter" /></div>
      <div><span class="tk-nu-meta">Größe</span><${Stepper} value=${d.heightCm} onChange=${set('heightCm')} min=${120} max=${230} unit="cm" label="Größe" /></div>
      <div><span class="tk-nu-meta">Gewicht</span><${Stepper} value=${d.weightKg} onChange=${set('weightKg')} step=${0.5} min=${35} max=${250} digits=${1} unit="kg" label="Gewicht" /></div>
      ${numbers && html`<div><span class="tk-nu-meta">Wunschgewicht</span><${Stepper} value=${d.goalWeightKg} onChange=${set('goalWeightKg')} step=${0.5} min=${35} max=${250} digits=${1} unit="kg" label="Wunschgewicht" /></div>`}</div>`;
    else if (step === 2) body = html`<div class="tk-gw__opts">${ACTIVITY.map((a) => html`<button type="button" class="tk-gw__opt" aria-pressed=${String(d.activity === a.id)} onClick=${() => set('activity')(a.id)}>${tintBox('accent2', 'activity', 20)}<span style="min-width:0"><strong>${a.label}</strong><span class="t">${a.example}</span></span></button>`)}</div>`;
    else body = !numbers ? html`<div class="tk-gw__target"><div class="tk-nu-cap">Gewohnheitsmodus</div><p style="margin:6px 0 0">Du siehst Mahlzeiten, Wasser und Training ohne Kalorien- und Gramm-Zahlen. Rechnerisch bleibt dein Richtwert von etwa ${num(res.target)} kcal im Hintergrund erhalten.</p></div>`
      : html`<div class="tk-gw__nums"><div><strong>${num(res.bmr)}</strong><span>Grundumsatz kcal</span></div><div><strong>${num(res.tdee)}</strong><span>Gesamtumsatz kcal</span></div><div><strong>${res.deficit >= 0 ? '−' : '+'}${num(Math.abs(res.deficit))}</strong><span>${res.deficit >= 0 ? 'Defizit' : 'Überschuss'} kcal</span></div></div>
      <div class="tk-gw__target"><div class="tk-nu-cap">Empfohlenes Ziel</div><div class="tk-row" style="gap:8px;align-items:baseline;flex-wrap:wrap"><span class="tk-nu-big">${num(res.target)}</span><span class="tk-muted">kcal pro Tag · Spanne ${num(res.target - 100)} bis ${num(res.target + 100)}</span></div></div>
      ${res.blocked && html`<div class="tk-gw__stop" role="status"><${Icon} name="shield-check" size=${17} /><span><strong>Sicherheits-Stopp:</strong> ${res.note}</span></div>`}
      ${mode !== 'halten' && html`<div><div class="tk-row" style="justify-content:space-between"><span class="tk-nu-meta">Tempo</span><strong class="tk-num">${num(d.pace, 2)} kg pro Woche</strong></div><input type="range" class="tk-gw__range" min="0.1" max="0.75" step="0.05" value=${d.pace} onInput=${(e) => { set('pace')(Number(e.currentTarget.value)); ctx.emit('goals.pace', { pace: Number(e.currentTarget.value) }); }} aria-label="Tempo in Kilogramm pro Woche" />
        ${mode === 'abnehmen' && html`<span class="tk-nu-meta">Bis ${num(d.goalWeightKg, 1)} kg dauert es so etwa ${weeks} Wochen. Langsam hält länger.</span>`}</div>`}
      <div><div class="tk-nu-meta" style="margin-bottom:6px">Makro-Verteilung</div><div class="tk-nu-chips">${MACRO_PRESETS.map((m) => html`<${Chip} active=${d.preset === m.id} onClick=${() => set('preset')(m.id)}>${m.label}<//>`)}</div>
        <p class="tk-nu-meta" style="margin:8px 0 0">${preset.text}: <strong class="tk-num" style="color:var(--tk-c-text)">E ${num(mac.protein)} g · KH ${num(mac.carbs)} g · F ${num(mac.fat)} g</strong></p></div>
      <label class="tk-row" style="gap:10px;justify-content:space-between"><span>Trainingstage +${goals.trainingBonus || 150} kcal <span class="tk-nu-meta">(nur Vorschlag, aus Standard)</span></span><span class="tk-nu-sw"><${Switch} checked=${d.bonus} onChange=${set('bonus')} label="Trainingstag-Zuschlag" /></span></label>
      <p class="tk-nu-meta" style="margin:0">Aktivitätskalorien aus Fitness werden nicht zusätzlich als Essensbudget angerechnet.</p>
      <div><${Button} variant="ghost" size="sm" iconRight=${why ? 'chevron-up' : 'chevron-down'} onClick=${() => setWhy(!why)} aria-expanded=${String(why)}>Wie wird das berechnet?<//>
        ${why && html`<div class="tk-gw__why"><span>Grundumsatz (Mifflin-St-Jeor): 10 × ${num(d.weightKg, 1)} kg + 6,25 × ${num(d.heightCm)} cm − 5 × ${num(d.age)} ${d.sex === 'm' ? '+ 5' : d.sex === 'f' ? '− 161' : '− 78'} = <strong>${num(bmr(p))} kcal</strong></span><span>Gesamtumsatz: ${num(res.bmr)} × ${num(actFactor(d.activity), 3)} = <strong>${num(res.tdee)} kcal</strong></span>
          <span>Ziel: Gesamtumsatz ${mode === 'aufbauen' ? '+' : '−'} ${num(d.pace, 2)} kg × 7.700 kcal ÷ 7 Tage, auf 10 gerundet = <strong>${num(res.target)} kcal</strong></span><span>Untergrenze: nie unter Grundumsatz und ${num(res.floor)} kcal.</span></div>`}</div>
      <${Button} variant="primary" icon="check" onClick=${apply} disabled=${mode === 'abnehmen' && minor}>${mode === 'abnehmen' && minor ? 'Nicht verfügbar' : 'Ziel übernehmen'}<//>`;
    return html`<${Card} title=${props.title} icon="target"><div class="tk-gw">
      <div><div class="tk-row" style="justify-content:space-between;margin-bottom:6px"><span class="tk-nu-cap">Schritt ${step + 1} von 4</span><strong>${TITLES[step]}</strong></div><${Progress} value=${(step + 1) / 4} /></div>
      ${goals.kcal > 0 && step < 3 && html`<div class="tk-nu-chips"><${Badge}>Aktuell ${num(goals.kcal)} kcal<//><${Badge}>E ${num(goals.protein)} g<//><${Badge}>KH ${num(goals.carbs)} g<//><${Badge}>F ${num(goals.fat)} g<//></div>`}
      ${body}
      <div class="tk-gw__nav"><${Button} icon="arrow-left" disabled=${step === 0} onClick=${() => go(step - 1)}>Zurück<//>${step < 3 && html`<${Button} variant="primary" iconRight="arrow-right" onClick=${() => go(step + 1)}>Weiter<//>`}</div></div><//>`;
  },
};
export default [goalWizard];
