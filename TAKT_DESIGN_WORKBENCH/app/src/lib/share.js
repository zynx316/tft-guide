// ============================================================================
// STRUKTURELLES TEILEN – nach einer Änderung (Kopie + Rezept) werden alle unveränderten Teilbäume des neuen Zustands
// durch die Objekte des vorherigen Zustands ersetzt. Ergebnis ist inhaltlich identisch mit `next`, teilt aber Speicher
// mit `prev`: Jeder Rückgängig-Schritt kostet dann nur noch die geänderten Pfade statt einer Vollkopie (~3 MB).
// Arrays von Objekten mit `id` werden über die ID zugeordnet (unshift/Einfügen am Anfang zerstört das Teilen nicht).
// Voraussetzung: Zustände werden nach dem Übernehmen nicht mehr direkt verändert (Änderungen nur über store.mutate).
// ============================================================================
export function shareUnchanged(prev, next) {
  if (prev === next) return prev;
  if (!prev || !next || typeof prev !== 'object' || typeof next !== 'object' || Array.isArray(prev) !== Array.isArray(next)) return next;
  let same = true;
  if (Array.isArray(next)) {
    if (prev.length !== next.length) same = false;
    const first = next.find((x) => x && typeof x === 'object');
    const byId = first && first.id != null ? new Map(prev.map((x) => [x && typeof x === 'object' ? x.id : undefined, x])) : null;
    for (let i = 0; i < next.length; i++) {
      const n = next[i];
      const p = byId && n && typeof n === 'object' && n.id != null && byId.has(n.id) ? byId.get(n.id) : prev[i];
      const r = p === undefined && !(i in prev) ? n : shareUnchanged(p, n);
      if (r !== n) next[i] = r;
      if (r !== prev[i]) same = false;
    }
  } else {
    const kp = Object.keys(prev); const kn = Object.keys(next);
    if (kp.length !== kn.length) same = false;
    for (const k of kn) {
      const has = Object.prototype.hasOwnProperty.call(prev, k);
      const r = has ? shareUnchanged(prev[k], next[k]) : next[k];
      if (r !== next[k]) next[k] = r;
      if (!has || r !== prev[k]) same = false;
    }
  }
  return same ? prev : next;
}
