// Ziele: Wochenfokus – höchstens drei Ziele mit nächstem Schritt (Streifen, große Karten oder „Schritte“).
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, Ring } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, useViews, openGoal, StateBadge, valueLine, dueLine, nextTitle, AreaTag, bigValue, toneColor } from './_goals.js';
import { NextStep, NS_CSS } from './_next.js';
import { FOCUS_MAX } from './_calc.js';
import { EXAMPLE } from './_example.js';

export const goalFocus = {
  id: 'goal-focus',
  name: 'Wochenfokus',
  category: 'Ziele',
  description: `Die höchstens ${FOCUS_MAX} Ziele dieser Woche. Streifen (kompakt, nächster Schritt in der Zeile), Karten (Ring, Stand, Schritt) oder „Schritte“ (je Ziel eine klare nächste Aktion mit „Erledigt“) oder „Ein Schritt“ (nur der dringendste Schritt groß, die übrigen Ziele als ruhige Zeilen). Der Schritt ist eine verknüpfte Aufgabe aus Aufgaben.`,
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenfokus' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['strip', 'cards', 'steps', 'single'], default: 'strip' },
    { name: 'editLabel', label: 'Link „Ändern“ (leer = aus)', type: 'text', default: 'Fokus ändern' },
  ],
  data: GOAL_SLOTS,
  events: ['goal.open', 'week.open', 'step.done', 'step.undo', 'task.open', 'source.open', 'goal.create.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalFocus', propMap: { title: 'title', style: 'style', editLabel: 'editLabel' }, events: { 'goal.open': 'onOpenGoal', 'week.open': 'onEditFocus', 'step.done': 'onStepDone', 'task.open': 'onOpenTask' } },
  css: `${GL_CSS}${NS_CSS}
  .tk-gl-fo__head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 8px 8px 16px; flex-wrap:wrap; } .tk-gl-fo__head h3 { margin:0; font-size:var(--tk-fs-md); } .tk-gl-fo__cnt { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); margin-left:8px; font-weight:var(--tk-fw-regular); }
  .tk-gl-fo__row { display:flex; flex-direction:column; gap:8px; padding:10px 16px 12px; border-top:1px solid var(--tk-c-border); min-width:0; }
  .tk-gl-fo__t { all:unset; box-sizing:border-box; cursor:pointer; display:flex; justify-content:space-between; gap:10px; align-items:baseline; min-height:32px; flex-wrap:wrap; } .tk-gl-fo__t b { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; flex:1 1 160px; } .tk-gl-fo__t:focus-visible { outline:2px solid var(--tk-c-focus); border-radius:var(--tk-radius-sm); }
  .tk-gl-fo__cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 250px), 1fr)); gap:var(--tk-space-3); }
  .tk-gl-fo__card { display:flex; flex-direction:column; gap:12px; padding:16px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:linear-gradient(160deg, color-mix(in srgb, var(--gc) 10%, var(--tk-c-surface)), var(--tk-c-surface) 70%); min-width:0; }
  .tk-gl-fo__open { all:unset; box-sizing:border-box; display:flex; gap:14px; align-items:center; cursor:pointer; min-width:0; } .tk-gl-fo__open:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:var(--tk-radius-md); }
  .tk-gl-fo__b { display:flex; flex-direction:column; gap:4px; min-width:0; flex:1; } .tk-gl-fo__b b { font-size:var(--tk-fs-lg); letter-spacing:var(--tk-ls-tight); line-height:var(--tk-lh-snug); overflow-wrap:anywhere; }
  .tk-gl-fo__step { padding-top:12px; border-top:1px solid var(--tk-c-border); }
  .tk-gl-fo__big { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:var(--tk-radius-xl); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); } .tk-gl-fo__big .tk-gl-ns__t b { font-size:var(--tk-fs-lg); }
  .tk-gl-fo__rest { display:flex; flex-direction:column; margin-top:var(--tk-space-3); } .tk-gl-fo__rest h4 { margin:0 0 4px; font-size:var(--tk-fs-xs); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); }
  .tk-gl-fo__mini { all:unset; box-sizing:border-box; display:flex; flex-direction:column; gap:2px; min-height:52px; padding:8px 4px; justify-content:center; border-top:1px solid var(--tk-c-border); cursor:pointer; min-width:0; } .tk-gl-fo__mini:focus-visible { outline:2px solid var(--tk-c-focus); border-radius:var(--tk-radius-sm); }
  .tk-gl-fo__mini b { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-gl-fo__mini span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); overflow-wrap:anywhere; }
  .tk-gl-fo__list { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-gl-fo__lead { margin:0; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }`,
  example: { props: { style: 'cards' }, data: EXAMPLE },
  render: function GoalFocus({ props, data, setData, ctx }) {
    const { views } = useViews(data, ctx);
    const focus = views.filter((v) => v.focus).slice(0, FOCUS_MAX);
    if (!views.length) return null;   // Erster Start: die Einladung steht einmal in „Alle Ziele“, nicht doppelt
    const edit = props.editLabel && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('week.open')}>${props.editLabel}<//>`;
    if (!focus.length) return html`<${Card} title=${props.title}><${EmptyState} icon="star" title="Noch kein Wochenfokus" text=${views.length ? `Wähle bis zu ${FOCUS_MAX} Ziele, die diese Woche zählen. Alles andere läuft ruhig weiter.` : 'Lege zuerst ein Ziel an, dann wählst du hier deinen Wochenfokus.'}
      action=${views.length ? html`<${Button} variant="primary" icon="star" onClick=${() => ctx.emit('week.open')}>Fokus wählen<//>` : html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create.open')}>Erstes Ziel anlegen<//>`} /><//>`;
    if (props.style === 'cards') return html`<section aria-label=${props.title}><div class="tk-gl-fo__head" style="padding-left:0"><h3>${props.title}<span class="tk-gl-fo__cnt">${focus.length} von ${FOCUS_MAX}</span></h3>${edit}</div>
      <div class="tk-gl-fo__cards">${focus.map((v) => html`<article class="tk-gl-fo__card" style=${`--gc:${toneColor(v.areaTone)}`}>
        <button type="button" class="tk-gl-fo__open" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}: ${valueLine(ctx, v)}. Öffnen`}><${Ring} value=${v.progress} size=${76} stroke=${8} tone=${v.areaTone} label=${`${Math.round(v.progress * 100)} % erreicht`}><span class="tk-gl-num" style="font-weight:600">${Math.round(v.progress * 100)}%</span><//>
          <span class="tk-gl-fo__b"><${AreaTag} v=${v} /><b>${v.title}</b><span class="tk-gl-note tk-gl-num">${valueLine(ctx, v)}</span></span></button>
        <div class="tk-gl-fo__step"><${NextStep} v=${v} ctx=${ctx} setData=${setData} compact=${true} /></div></article>`)}</div></section>`;
    if (props.style === 'single') {
      const lead = [...focus].sort((a, b) => (a.next?.kind === 'task' ? 0 : 1) - (b.next?.kind === 'task' ? 0 : 1) || String(a.next?.due || '9').localeCompare(String(b.next?.due || '9')))[0];
      const rest = focus.filter((v) => v.id !== lead.id);
      return html`<section aria-label=${props.title}><div class="tk-gl-fo__head" style="padding-left:0"><h3>${props.title}<span class="tk-gl-fo__cnt">${focus.length} von ${FOCUS_MAX}</span></h3>${edit}</div>
        <article class="tk-gl-fo__big" style=${`--gc:${toneColor(lead.areaTone)}`}><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><${AreaTag} v=${lead} /><${StateBadge} v=${lead} /></div>
          <button type="button" class="tk-gl-fo__t" onClick=${() => openGoal(ctx, lead)} aria-label=${`${lead.title} öffnen`}><b>${lead.title}</b><span class="tk-gl-note tk-gl-num">${valueLine(ctx, lead)}</span></button>
          <${NextStep} v=${lead} ctx=${ctx} setData=${setData} /></article>
        ${rest.length > 0 && html`<div class="tk-gl-fo__rest"><h4>Danach</h4>${rest.map((v) => html`<button type="button" class="tk-gl-fo__mini" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}: ${v.next ? nextTitle(ctx, v.next) : 'kein Schritt offen'}. Öffnen`}><b>${v.title}</b><span>${v.next ? nextTitle(ctx, v.next) : 'Gerade ist kein Schritt offen.'}</span></button>`)}</div>`}</section>`;
    }
    if (props.style === 'steps') return html`<section aria-label=${props.title}><div class="tk-gl-fo__head" style="padding-left:0"><h3>${props.title}<span class="tk-gl-fo__cnt">${focus.length} von ${FOCUS_MAX}</span></h3>${edit}</div>
      <p class="tk-gl-fo__lead">Pro Ziel ein Schritt. Mehr musst du diese Woche nicht tun.</p>
      <div class="tk-gl-fo__list">${focus.map((v) => html`<article class="tk-gl-fo__big" style=${`--gc:${toneColor(v.areaTone)}`}><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><${AreaTag} v=${v} /><${StateBadge} v=${v} /></div>
        <button type="button" class="tk-gl-fo__t" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title} öffnen`}><b>${v.title}</b><span class="tk-gl-note tk-gl-num">${valueLine(ctx, v)}</span></button>
        <${NextStep} v=${v} ctx=${ctx} setData=${setData} /></article>`)}</div></section>`;
    return html`<${Card} flush><div class="tk-gl-fo__head"><h3>${props.title}<span class="tk-gl-fo__cnt">${focus.length} von ${FOCUS_MAX}</span></h3>${edit}</div>
      ${focus.map((v) => html`<div class="tk-gl-fo__row"><button type="button" class="tk-gl-fo__t" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}: ${valueLine(ctx, v)}. Öffnen`}><b>${v.title}</b><span class="tk-gl-note tk-gl-num">${bigValue(ctx, v)} · ${dueLine(v)}</span></button>
        <${NextStep} v=${v} ctx=${ctx} setData=${setData} compact=${true} /></div>`)}<//>`;
  },
};
export default goalFocus;
