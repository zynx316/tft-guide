// Ziele: Nächster Schritt eines Ziels – verknüpfte Aufgabe aus Aufgaben (erledigen oder öffnen) oder Hinweis in das Quellmodul.
import { html } from '../../../lib/html.js';
import { Card, EmptyState } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, useViews } from './_goals.js';
import { NextStep, NS_CSS } from './_next.js';
import { pickGoal } from './goal-hero.js';
import { EXAMPLE } from './_example.js';

export const goalNextStep = {
  id: 'goal-next-step',
  name: 'Nächster Schritt',
  category: 'Ziele',
  description: 'Der eine nächste Schritt zum gewählten Ziel: eine verknüpfte Aufgabe (mit Fälligkeit; „Erledigt“ schreibt in die gemeinsame Aufgabenliste) oder, wenn keine Aufgabe offen ist, ein Hinweis mit Weg in das Quellmodul.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Nächster Schritt' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: GOAL_SLOTS,
  events: ['step.done', 'step.undo', 'task.open', 'source.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalNextStep', propMap: { title: 'title', framed: 'framed' }, events: { 'step.done': 'onDone', 'task.open': 'onOpenTask', 'source.open': 'onOpenSource' } },
  css: `${GL_CSS}${NS_CSS}`,
  example: { data: EXAMPLE },
  render: function GoalNextStep({ props, data, setData, ctx }) {
    const { views } = useViews(data, ctx);
    const v = pickGoal(views, ctx);
    const inner = v ? html`<${NextStep} v=${v} ctx=${ctx} setData=${setData} />` : html`<${EmptyState} icon="list-checks" title="Noch kein Schritt" text="Sobald ein Ziel existiert, zeigt TAKT hier den nächsten Schritt." />`;
    return props.framed ? html`<${Card} title=${props.title}>${inner}<//>` : inner;
  },
};
export default goalNextStep;
