// Gemeinsame Daten-Helfer für Bibliothekskomponenten (Filter, Suche, Gruppierung).
export const toList = (v) => (Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean));

const norm = (s) => String(s ?? '').toLowerCase();

/**
 * Wendet den geteilten UI-Zustand (ctx.ui.query / ctx.ui.filter) auf eine Liste an.
 * Filter-Semantik: "Alle" = kein Filter, "Offen"/"Erledigt" = done-Flag,
 * sonst Abgleich gegen status/group/category/tags/priority/type.
 */
export function applyUiFilter(items, ui = {}, { searchFields = ['title', 'subtitle', 'text', 'meta', 'name'], respect = true } = {}) {
  if (!respect || !Array.isArray(items)) return items || [];
  let out = items;
  const q = norm(ui.query).trim();
  if (q) out = out.filter((it) => searchFields.some((f) => norm(it[f]).includes(q)) || (it.tags || []).some((t) => norm(t).includes(q)));
  const f = ui.filter;
  if (f && !/^alle?$/i.test(f)) {
    const lf = norm(f);
    if (lf === 'offen') out = out.filter((it) => !it.done);
    else if (lf === 'erledigt') out = out.filter((it) => it.done);
    else out = out.filter((it) => ['status', 'group', 'category', 'priority', 'type', 'tone'].some((k) => norm(it[k]) === lf) || (it.tags || []).some((t) => norm(t) === lf));
  }
  return out;
}

export function groupBy(items, keyFn) {
  const m = new Map();
  for (const it of items) { const k = keyFn(it); if (!m.has(k)) m.set(k, []); m.get(k).push(it); }
  return [...m.entries()];
}

export const nextId = (items, prefix = 'n') => `${prefix}${Date.now().toString(36)}${(items?.length || 0)}`;
