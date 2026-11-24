// Ziele: Anlegen – mögliche Quellen und Aufbau einer Ziel-Definition aus den Antworten des Assistenten (rein, getestet).
const arr = (v) => (Array.isArray(v) ? v : []);

/** Mögliche Quellen für ein neues Ziel. `used` = es gibt schon ein Ziel dazu (kein zweites Ziel zur selben Quelle, vor allem keine doppelten Sparziele). */
export function sourceOptions(src, goals) {
  const used = (t, ref) => arr(goals).some((g) => !g.archived && g.source?.type === t && (ref == null || g.source.ref === ref));
  const out = [];
  for (const s of src.savingsGoals) out.push({ key: `savings:${s.id}`, type: 'savings', ref: s.id, title: s.name, label: s.name, sub: 'Sparziel aus Sparpläne', module: 'savings', area: 'finanzen', used: used('savings', s.id), due: s.due });
  if (src.bodySummary) out.push({ key: 'weight', type: 'weight', title: 'Zielgewicht erreichen', label: 'Gewichtstrend', sub: 'Trend aus Fitness', module: 'fitness', area: 'gesundheit', used: used('weight') });
  if (arr(src.weeklyTraining).length) out.push({ key: 'training', type: 'training', title: 'Regelmäßig trainieren', label: 'Training pro Woche', sub: 'Wochenziel und Serie aus Fitness', module: 'fitness', area: 'gesundheit', used: used('training') });
  if (arr(src.channels).length) out.push({ key: 'sales', type: 'sales', title: 'Monatsumsatz', label: 'Umsatz der letzten 30 Tage', sub: 'aus Sales', module: 'sales', area: 'business', used: used('sales'), needsTarget: true, unit: '€', suggest: 18000 });
  for (const h of arr(src.habits)) if (h.rhythm?.type !== 'perWeek') out.push({ key: `habit:${h.id}`, type: 'habit', ref: h.id, title: `${h.name}: Serie`, label: `Serie „${h.name}“`, sub: 'aus Gewohnheiten', module: 'habits', area: 'gesundheit', used: used('habit', h.id), needsTarget: true, unit: 'Tage', suggest: 30 });
  out.push({ key: 'manual', type: 'manual', title: '', label: 'Ich zähle selbst', sub: 'z. B. Bücher, Lektionen, Besuche', module: 'goals', area: null, used: false, needsTarget: true, needsUnit: true, unit: '', suggest: 10 });
  return out;
}

const SRC_META = {
  savings: { module: 'savings', label: 'Sparziel in Sparpläne', to: 'savings.goals' },
  weight: { module: 'fitness', label: 'Gewichtstrend aus Fitness', to: 'fitness.body' },
  training: { module: 'fitness', label: 'Wochenziel und Serie aus Fitness', to: 'fitness.goals' },
  sales: { module: 'sales', label: 'Umsatz der letzten 30 Tage aus Sales', to: 'sales.revenue' },
  habit: { module: 'habits', label: 'Serie der Gewohnheit', to: 'habits.detail' },
  manual: { module: 'goals', label: 'Eigene Zählung', to: 'goals.detail' },
};

/** Aus den Antworten des Assistenten eine Ziel-Definition bauen. `d`: { title, why, area, option, target?, unit?, due?, focus }. */
export function buildGoal(d, { id, today, src }) {
  const o = d.option, t = o.type;
  const g = { id, title: String(d.title || o.title || '').trim(), why: String(d.why || '').trim(), area: d.area || o.area || 'persoenlich', since: today, due: d.due || null, focus: !!d.focus,
    source: { type: t, ...(o.ref ? { ref: o.ref } : {}), ...SRC_META[t] }, milestones: [] };
  if (t === 'sales' || t === 'habit' || t === 'manual') g.measure = { unit: t === 'sales' ? '€' : t === 'habit' ? 'Tage' : String(d.unit || '').trim(), start: 0, target: Number(d.target) || 1 };
  if (t === 'sales') g.rolling = true;
  if (t === 'manual') g.snapshots = [{ date: today, value: 0 }];
  const target = t === 'savings' ? arr(src.savingsGoals).find((s) => s.id === o.ref)?.target : g.measure?.target;
  if (target) g.milestones = [{ id: 'm1', title: 'Die Hälfte', at: Math.round(target / 2) }, { id: 'm2', title: 'Ziel erreicht', at: target }];
  else if (t === 'weight' && src.bodySummary) { const { startKg, goalKg } = src.bodySummary; g.milestones = [{ id: 'm1', title: 'Halbzeit', at: Math.round(((startKg + goalKg) / 2) * 10) / 10 }, { id: 'm2', title: 'Zielgewicht', at: goalKg }]; }
  else if (t === 'training') g.milestones = [{ id: 'm1', title: '12 Wochen in Folge', at: 12 }];
  return g;
}
