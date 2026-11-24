// Gemeinsame Test-Helfer. WICHTIG: als ERSTER Import in jeder Testdatei laden – setzt die Zeitzone
// auf Europe/Berlin, bevor irgendein Datum erzeugt wird (Sommerzeit-Tests brauchen das).
process.env.TZ = 'Europe/Berlin';

/** Geschütztes Leerzeichen und echtes Minus (wie in lib/format.js). */
export const NB = ' ';
export const MINUS = '−';

/** Ist die Zeitzone wirklich Berlin? (sonst sind Sommerzeit-Tests nicht aussagekräftig) */
export const BERLIN = new Date(2026, 9, 25, 12).getTimezoneOffset() === -60 && new Date(2026, 5, 1, 12).getTimezoneOffset() === -120;

/** Toleranzvergleich. */
export const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

/** Datum als „YYYY-MM-DD HH:mm“ in Lokalzeit – kurz und gut lesbar in Fehlermeldungen. */
export const ymdhm = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
/** Nur der Tag. */
export const ymd = (d) => ymdhm(d).slice(0, 10);

/**
 * Meldet Inhalte, die andere Pakete gerade bauen, als Diagnose statt als Fehler.
 * @param {import('node:test').TestContext} t Testkontext
 * @param {string} title Überschrift
 * @param {string[]} items Auffälligkeiten
 */
export function report(t, title, items) {
  t.diagnostic(items.length ? `${title}: ${items.length} Hinweis(e) – ${items.slice(0, 8).join(' | ')}${items.length > 8 ? ' | …' : ''}` : `${title}: keine Auffälligkeiten`);
}

/** Lädt Registry, Schema, Seed usw. einmal (zwischengespeichert). */
let cache;
export async function loadWorkbench() {
  if (!cache) {
    const [registry, schema, seed, directions, process_, workorder, spec, payload, versioning, world] = await Promise.all([
      import('../app/src/library/registry.js'), import('../app/src/core/schema.js'), import('../app/src/seed/index.js'),
      import('../app/src/core/directions.js'), import('../app/src/core/process.js'), import('../app/src/core/workorder.js'),
      import('../app/src/core/spec.js'), import('../app/src/core/preview-payload.js'), import('../app/src/core/versioning.js'),
      import('../app/src/seed/world/index.js'),
    ]);
    cache = { registry, schema, seed, directions, process: process_, workorder, spec, payload, versioning, world };
  }
  return cache;
}

let seedState;
/** Frisch gebauter Seed-Zustand (einmal je Testdatei gebaut, danach geklont – Tests dürfen ihn verändern). */
export async function seedClone() {
  const { seed } = await loadWorkbench();
  seedState ??= seed.buildSeedState();
  return structuredClone(seedState);
}

/**
 * Datenwelt eines Zustands – unabhängig davon, ob sie (alt) im Zustand liegt oder (neu) aus core/world.js kommt.
 * @param {object} state Workbench-Zustand
 * @returns {Promise<object>} Welt-Schlüssel → Daten
 */
export async function worldOf(state) {
  if (state.world && Object.keys(state.world).length) return state.world;
  try { const w = await import('../app/src/core/world.js'); if (typeof w.getWorld === 'function') return w.getWorld(state); } catch { /* ältere Fassung ohne world.js */ }
  return (await loadWorkbench()).world.WORLD;
}
