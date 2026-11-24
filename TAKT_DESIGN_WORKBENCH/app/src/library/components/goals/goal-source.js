// Ziele: Quelle eines Ziels – woher der Wert kommt, ohne Doppelerfassung, mit Weg in das Fachmodul.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState } from '../../ui.js';
import { GOAL_SLOTS, GL_CSS, useViews, openSource, valueLine, hidden } from './_goals.js';
import { pickGoal } from './goal-hero.js';
import { EXAMPLE } from './_example.js';

const MODULE_NAME = { fitness: 'Fitness', savings: 'Sparpläne', sales: 'Sales', habits: 'Gewohnheiten', tasks: 'Aufgaben', goals: 'Ziele' };
const MODULE_ICON = { fitness: 'dumbbell', savings: 'piggy-bank', sales: 'store', habits: 'repeat', tasks: 'list-checks', goals: 'target' };

export const goalSource = {
  id: 'goal-source',
  name: 'Quelle des Ziels',
  category: 'Ziele',
  description: 'Zeigt, woher der Fortschritt kommt (Fitness, Sparpläne, Sales, Gewohnheiten, Aufgaben oder eigene Zählung), den aktuellen Wert und führt per „Im Modul öffnen“ in das Quellmodul. Betont: Nichts wird doppelt erfasst.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Quelle' },
  ],
  data: GOAL_SLOTS,
  events: ['source.open'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalSource', propMap: { title: 'title' }, events: { 'source.open': 'onOpenSource' } },
  css: `${GL_CSS}
  .tk-gl-so { display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap; } .tk-gl-so__ic { width:44px; height:44px; border-radius:12px; display:grid; place-items:center; flex:none; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); }
  .tk-gl-so__b { flex:1 1 200px; min-width:0; display:flex; flex-direction:column; gap:4px; } .tk-gl-so__b b { font-size:var(--tk-fs-md); } .tk-gl-so__act { flex-basis:100%; display:flex; gap:8px; flex-wrap:wrap; } .bp-mobile .tk-gl-so__act .tk-btn { min-height:44px; }`,
  example: { data: EXAMPLE },
  render: function GoalSource({ props, data, ctx }) {
    const { views } = useViews(data, ctx);
    const v = pickGoal(views, ctx);
    if (!v) return html`<${Card} title=${props.title}><${EmptyState} icon="link-2" title="Noch keine Quelle" text="Ziele mit Quelle holen ihren Fortschritt automatisch." /><//>`;
    const s = v.source, own = s.type === 'manual' && !s.link, mod = s.link?.module || s.module;
    return html`<${Card} title=${props.title}><div class="tk-gl-so"><span class="tk-gl-so__ic"><${Icon} name=${MODULE_ICON[mod] || 'link-2'} size=${22} /></span>
      <div class="tk-gl-so__b"><b>${s.label}</b><span class="tk-gl-note tk-gl-num">${hidden(v) ? 'Zahlen ausgeblendet' : valueLine(ctx, v)}</span>
        <span class="tk-gl-note">${own ? 'Diesen Stand trägst du selbst ein. Verknüpfe das Ziel mit einer Gewohnheit, wenn du es automatisch zählen willst.' : `Der Wert kommt aus ${MODULE_NAME[mod] || mod}. Dort änderst du ihn, hier wird nichts doppelt erfasst.`}</span></div>
      ${!own && html`<div class="tk-gl-so__act"><${Button} icon="arrow-right" onClick=${() => openSource(ctx, v)}>Im Modul öffnen<//></div>`}</div><//>`;
  },
};
export default goalSource;
