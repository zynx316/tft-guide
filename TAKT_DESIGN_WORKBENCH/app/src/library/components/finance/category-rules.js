// Finanzen: Kategorien (feste Taxonomie, eigene ergänzbar) und Regeln „Titel enthält … → Kategorie“.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Badge, Field, Input, Select, Switch, Check } from '../../ui.js';
import { arr, catMeta, monthTx, spentByCategory, ruleHits, matchRule, r2 } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, Tile } from './_fin.js';
import { ex } from './_example.js';

const KIND = { fix: 'Fix', variabel: 'Variabel', sparen: 'Sparen', einkommen: 'Einnahme', umbuchung: 'Umbuchung' };
const KINDS = Object.entries(KIND).filter(([k]) => k !== 'umbuchung').map(([value, label]) => ({ value, label }));
const ICONS = ['tag', 'shopping-cart', 'utensils', 'car', 'home', 'heart-pulse', 'graduation-cap', 'gift', 'plane', 'baby', 'shirt', 'bike'];

function CategoryForm({ cat, onSave }) {
  const [label, setLabel] = useState(cat?.label || ''), [kind, setKind] = useState(cat?.kind || 'variabel'), [icon, setIcon] = useState(cat?.icon || 'tag');
  return html`<div class="tk-fn-stack"><${Field} label="Name"><${Input} value=${label} onInput=${setLabel} maxlength="30" placeholder="z. B. Haustier" /><//><${Field} label="Art"><${Select} value=${kind} onChange=${setKind} options=${KINDS} /><//>
    <div><span class="tk-field__label">Symbol</span><div class="tk-fn-actions" style="margin-top:6px" role="group" aria-label="Symbol">${ICONS.map((i) => html`<button type="button" class="tk-chip" aria-pressed=${String(icon === i)} aria-label=${i} onClick=${() => setIcon(i)}><${Icon} name=${i} size=${16} /></button>`)}</div></div>
    <${Button} variant="primary" icon="check" disabled=${!label.trim()} onClick=${() => onSave({ label: label.trim(), kind, icon })}>Speichern<//></div>`;
}

export const finCategoryList = {
  id: 'fin-category-list',
  name: 'Kategorien',
  category: 'Finanzen',
  description: 'Alle Kategorien mit Art (fix, variabel, Sparen, Einnahme), Nutzung im Monat und Buchungsanzahl. Eigene Kategorien lassen sich anlegen und umbenennen; Umbuchung bleibt fest und zählt nie als Ausgabe.',
  version: '1.1',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Kategorien' }, { name: 'editable', label: 'Bearbeiten erlauben', type: 'boolean', default: true }],
  data: slots('cats', 'transactions', 'prefs'),
  events: ['category.open', 'category.add', 'category.edit'],
  states: ['empty'],
  css: `
  [data-tk-large-text] .tk-fnc__tap { flex-wrap:wrap; row-gap:4px; align-items:flex-start; } [data-tk-large-text] .tk-fnc__tap > .tk-fn-ico { display:none; } [data-tk-large-text] .tk-fnc__tap > .tk-fn-grow { flex:1 1 100%; } [data-tk-large-text] .tk-fnc__tap .tk-fn-sub { display:block; }`,
  example: { data: ex('categories', 'transactions', 'prefs') },
  render: function FinCategoryList({ props, data, setData, ctx }) {
    const c = pctx(ctx, data), cats = arr(data.categories), spent = spentByCategory(data.transactions, ctx.today), cur = monthTx(data.transactions, ctx.today);
    const count = (id) => cur.filter((t) => t.category === id).length;
    const save = (cat, f) => { if (cat) setData('categories', (l) => arr(l).map((x) => (x.id === cat.id ? { ...x, ...f } : x))); else setData('categories', (l) => [...arr(l), { id: f.label, label: f.label, icon: f.icon, kind: f.kind, tone: 'accent', custom: true }]); ctx.emit(cat ? 'category.edit' : 'category.add', { id: cat?.id || f.label }); ctx.toast('Gespeichert'); };
    const edit = (cat) => ctx.openDialog({ title: cat ? `${cat.label} bearbeiten` : 'Kategorie anlegen', body: (close) => html`<${CategoryForm} cat=${cat} onSave=${(f) => { save(cat, f); close(); }} />` });
    const addBtn = props.editable && html`<${Button} size="sm" variant="ghost" icon="plus" onClick=${() => edit(null)}>Kategorie<//>`;
    if (!cats.length) return html`<${Card} title=${props.title} icon="tags" actions=${addBtn}><${EmptyState} icon="tags" title="Noch keine Kategorien" text="Lege Kategorien an, um Buchungen und Budgets zu ordnen." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => edit(null)}>Kategorie anlegen<//>`} /><//>`;
    return html`<${Card} flush title=${props.title} icon="tags" actions=${addBtn}><div class="tk-fn-list">${cats.map((k) => html`<div class="tk-fn-row" style="padding:6px var(--tk-space-4);min-height:56px"><button type="button" class="tk-fn-tap tk-fnc__tap" style="padding:4px" onClick=${() => ctx.emit('category.open', { id: k.id, ui: { filter: k.id } })} aria-label=${`${k.label}: Buchungen ansehen`}><${Tile} icon=${k.icon} tone=${k.tone} size=${34} />
      <span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${k.label}</span><span class="tk-fn-sub">${count(k.id)} Buchungen im Monat${spent[k.id] ? ` · ${eur(c, spent[k.id])}` : ''}</span></span><${Badge}>${KIND[k.kind] || k.kind}<//></button>
      ${props.editable && k.kind !== 'umbuchung' && html`<${Button} variant="ghost" icon="pencil" aria-label=${`${k.label} bearbeiten`} onClick=${() => edit(k)} />`}</div>`)}</div><//>`;
  },
};

function RuleForm({ cats, txs, rules, onSave }) {
  const opts = arr(cats).filter((x) => x.kind !== 'umbuchung'), [match, setMatch] = useState(''), [cat, setCat] = useState(opts[0]?.id || ''), [apply, setApply] = useState(true);
  const hits = match.trim() ? arr(txs).filter((t) => t.title.toLowerCase().includes(match.trim().toLowerCase())) : [];
  const dup = arr(rules).some((r) => r.match === match.trim().toLowerCase());
  return html`<div class="tk-fn-stack"><${Field} label="Wenn der Titel enthält" error=${dup ? 'Für diesen Text gibt es schon eine Regel.' : null}><${Input} value=${match} onInput=${setMatch} placeholder="z. B. bäckerei" maxlength="40" /><//>
    <${Field} label="dann Kategorie"><${Select} value=${cat} onChange=${setCat} options=${opts.map((x) => ({ value: x.id, label: x.label }))} /><//>
    <p class="tk-fn-meta" aria-live="polite">${match.trim() ? `Trifft auf ${hits.length} Buchung${hits.length === 1 ? '' : 'en'}${hits.length ? `: ${hits.slice(0, 2).map((t) => t.title).join(', ')}${hits.length > 2 ? ' …' : ''}` : ''}` : 'Gib einen Textteil ein, um die Treffer zu sehen.'}</p>
    <label class="tk-fn-row"><${Check} checked=${apply} onChange=${setApply} label="Auf bestehende Buchungen anwenden" /><span>Auf bestehende Buchungen anwenden</span></label>
    <${Button} variant="primary" icon="check" disabled=${!match.trim() || dup} onClick=${() => onSave({ match: match.trim().toLowerCase(), category: cat, apply })}>Regel speichern<//></div>`;
}

export const finRuleList = {
  id: 'fin-rule-list',
  name: 'Kategorisierungsregeln',
  category: 'Finanzen',
  description: 'Regeln „Titel enthält … → Kategorie“ sortieren neue Buchungen automatisch. Mit Trefferzahl, Ein/Aus-Schalter, Vorschau beim Anlegen und „Auf bestehende Buchungen anwenden“.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Regeln' }],
  data: slots('rules', 'cats', 'transactions', 'prefs'),
  events: ['rule.add', 'rule.toggle', 'rule.apply'],
  states: ['empty'],
  css: ``,
  example: { data: ex('rules', 'categories', 'transactions', 'prefs') },
  render: function FinRuleList({ props, data, setData, ctx }) {
    const rules = arr(data.rules), txs = arr(data.transactions);
    const applyRules = (list) => {
      const hit = (t) => { const r = t.type !== 'transfer' && matchRule(list, t.title); return r && r.category !== t.category ? r : null; };
      const n = txs.filter(hit).length;
      setData('transactions', (l) => arr(l).map((t) => { const r = hit(t); return r ? { ...t, category: r.category, icon: catMeta(data.categories, r.category).icon } : t; }));
      return n;
    };
    const add = () => ctx.openDialog({ title: 'Regel anlegen', body: (close) => html`<${RuleForm} cats=${data.categories} txs=${txs} rules=${rules} onSave=${(f) => { const rule = { id: `r-${f.match}`, match: f.match, category: f.category, active: true, hits: 0 }; setData('rules', (l) => [...arr(l), rule]); if (f.apply) applyRules([rule]); ctx.emit('rule.add', { match: f.match }); ctx.toast('Regel gespeichert'); close(); }} />` });
    const toggle = (r) => { setData('rules', (l) => arr(l).map((x) => (x.id === r.id ? { ...x, active: !x.active } : x))); ctx.emit('rule.toggle', { id: r.id, active: !r.active }); };
    const addBtn = html`<${Button} size="sm" variant="ghost" icon="plus" onClick=${add}>Regel<//>`;
    if (!rules.length) return html`<${Card} title=${props.title} icon="sparkles" actions=${null}><${EmptyState} icon="sparkles" title="Noch keine Regeln" text="Regeln ordnen neue Buchungen automatisch ein, zum Beispiel „rewe“ als Lebensmittel." action=${html`<${Button} variant="primary" icon="plus" onClick=${add}>Regel anlegen<//>`} /><//>`;
    const open = txs.filter((t) => t.category === 'Sonstiges').length;
    return html`<${Card} flush title=${props.title} icon="sparkles" actions=${addBtn}><div class="tk-fn-list">${rules.map((r) => { const m = catMeta(data.categories, r.category); return html`<div class="tk-fn-row" style="padding:6px var(--tk-space-4);min-height:56px"><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">„${r.match}“ → ${m.label}</span><span class="tk-fn-sub">${ruleHits(r, txs)} Treffer${r.active ? '' : ' · pausiert'}</span></span><${Switch} checked=${r.active} onChange=${() => toggle(r)} label=${`Regel ${r.match} ${r.active ? 'pausieren' : 'aktivieren'}`} /></div>`; })}</div>
      ${open > 0 && html`<div style="padding:var(--tk-space-3) var(--tk-space-4)"><${Button} size="sm" icon="refresh-cw" onClick=${() => { const n = applyRules(rules); ctx.emit('rule.apply', { count: n }); ctx.toast(n ? `${n} Buchungen neu eingeordnet` : 'Keine Buchung passte zu einer Regel'); }}>${open} Buchungen ohne Kategorie prüfen<//></div>`}<//>`;
  },
};
export default [finCategoryList, finRuleList];
