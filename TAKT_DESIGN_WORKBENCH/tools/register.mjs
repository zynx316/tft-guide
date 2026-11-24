// Node-Loader für die Testumgebung: bildet die Bare-Specifier der Importmap
// (app/index.html, app/preview.html) auf app/vendor ab. Nutzung:
//   node --import ./tools/register.mjs --test tests/
// Dadurch sind registry.js, spec.js, preview-payload.js und seed/index.js in Node importierbar.
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Importmap-Einträge aus dem Browser (muss mit app/index.html übereinstimmen). */
export const IMPORT_MAP = {
  preact: 'app/vendor/preact.module.js',
  'preact/hooks': 'app/vendor/hooks.module.js',
  htm: 'app/vendor/htm.module.js',
};

/** Absolute file:-URLs je Bare-Specifier. */
export const RESOLVED = Object.fromEntries(Object.entries(IMPORT_MAP).map(([k, v]) => [k, pathToFileURL(path.join(ROOT, v)).href]));

// Resolve-Hook als Data-URL, damit keine zusätzliche Datei nötig ist.
const hooks = `
const MAP = ${JSON.stringify(RESOLVED)};
export async function resolve(specifier, context, nextResolve) {
  if (Object.hasOwn(MAP, specifier)) return { url: MAP[specifier], format: 'module', shortCircuit: true };
  return nextResolve(specifier, context);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);
