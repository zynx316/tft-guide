# Architektur – TAKT Design Workbench

## 1. Leitentscheidungen

| Entscheidung | Begründung | Verworfen |
|---|---|---|
| **Browser-App ohne Build** (ES-Module, Preact 10 + htm, lokal in `app/vendor/`) | Läuft überall, keine Toolchain, kein `node_modules` zur Laufzeit, Komponenten-Modell wie React (wartbar, Claude-freundlich) | React+Vite+TS (Build-Schritt, mehr Abhängigkeiten), Vanilla-DOM (wird bei dieser UI-Größe unwartbar), Electron (schwer, für V1 unnötig) |
| **Lokaler Node-Server ohne Abhängigkeiten** (`server.mjs`) | Datei-Persistenz (`data/workbench.json`), Backups, CLI-QA-Ergebnisse; Workbench funktioniert auch ohne (Browser-Speicher) | Datenbank (unnötig bei < 10 MB JSON), Cloud-Backend |
| **Deklarative Varianten** (`layout` + `blocks[]`) aus einer **Komponenten-Registry** | Designs ändern ohne Neuentwicklung; Komponenten-Verbesserung wirkt überall; Abhängigkeitsanalyse für selektive Tests | Freies HTML je Variante (Wegwerf-Prototypen, keine Wiederverwendung) |
| **Echte Iframes in Gerätebreite** für jede Vorschau | Media-Queries/Breakpoints greifen real; voll bedienbar; isoliert vom Workbench-CSS | Skalierte Divs (falsche Breakpoints), Screenshots (nicht bedienbar) |
| **Eine QA-Sonde für alles** (`preview/qa-probe.js`) | Gleiche Prüfungen in Workbench (sofort) und CLI (Playwright, Screenshots, Pixelvergleich) | Getrennte Prüflogik |
| **Playwright nur für die CLI-QA** | Automatisierte E2E-/Screenshot-/Regressionstests; Workbench selbst braucht es nicht | — |

## 2. Struktur

```
TAKT_DESIGN_WORKBENCH/
├─ server.mjs                 Statischer Server + REST (/api/state, /api/backups, /api/qa/latest), Härtung, Revisionen
├─ package.json               Skripte (start, lan, check, qa, qa:changed, qa:e2e, qa:visual, qa:baseline)
├─ app/
│  ├─ index.html              Workbench (Shell)          ├─ preview.html   TAKT-Vorschau (Iframe-Ziel)
│  ├─ vendor/                 preact, hooks, htm (+ Lizenzen)
│  └─ src/
│     ├─ lib/                 html.js (htm-Binding) · icons.js + icon-data.js (Lucide, 216 Icons) · util.js
│     ├─ design-system/       tokens.js (EINZIGE Token-Quelle) · takt-base.css (Primitive, App-Shell, Layouts)
│     ├─ library/             registry.js · CONTRACT.md · ui.js (Primitive) · helpers.js
│     │  └─ components/       core/ (15 generische) · calendar/ (6) · tasks/ (5) · content/ (10) · insights/ (9)
│     ├─ preview/             runtime.js (Renderer) · layouts.js · qa-probe.js
│     ├─ core/                schema.js · versioning.js · impact.js · devices.js · preview-payload.js   (rein, auch Node)
│     ├─ seed/                index.js · SEED_FORMAT.md · modules/*.js (12 Module)
│     └─ workbench/           store.js · app.js · router.js · qa-runner.js · workbench.css · ui/{kit,preview-frame}.js · views/*
├─ qa/                        run-qa.mjs · baselines/ (maschinenspezifisch, nicht versioniert) · results/ (Läufe)
├─ tools/check.mjs            statische Schnellprüfung
├─ data/                      workbench.json (Live-Stand) · backups/
└─ docs/                      MISSION.md · PHASE1_BESTANDSAUFNAHME.md · examples/
```

**Schichten (Abhängigkeit nur nach unten):** `workbench/` → `core/`, `preview/` (über Iframe), `library/` → `design-system/`, `lib/`.
`core/` und `seed/` sind browserfrei (von CLI und `tools/check.mjs` direkt importierbar).

## 3. Datenmodell (`core/schema.js`, Schema v1)

```js
state = {
  schemaVersion: 1,
  meta: { project, createdAt, updatedAt, rev, seedVersion },
  settings: { wbTheme, previewTheme, viewport, previewState, chrome, multiViewports, qaViewports, qaThemes, qaStates, lastFeatureId },
  modules: [{ id, name, icon, description, status /*concept|active|released|reference*/, theme, designVersion, order,
              archived, isReference, links:[moduleId], docs, infoArchitecture, source, createdAt, updatedAt }],
  features: [{ id /*modul.feature*/, moduleId, name, group, order, purpose,
               status /*not_analyzed|analyzed|design|review|released|implemented|regression_ok*/, archived,
               requirements:[{id,text,type:info|action|state|rule,priority:must|should|could}],
               interactions:[{id,trigger,result,event}], states:[default|empty|loading|error], viewports:[desktop|notebook|tablet|mobile],
               variants:[{ id /*A,B,C…*/, name, concept, description, layout:{type, narrow?, even?, asideFirstOnMobile?, panelLabel?},
                           blocks:[{ id, component, region, props, bind:{slot:dataKey}, hideOn:[bp], span?, spanTablet?, tab? }],
                           createdAt, updatedAt, origin }],
               selectedVariantId, demoData:{ key: any }, links:[featureId], references:[{label,href}], notes,
               version /*Arbeitsstand*/, releasedVersionId, locked, realDevice:{ok,note,at}, createdAt, updatedAt }],
  versions: [{ id, featureId, moduleId, version, kind:draft|review|release, note, createdAt, status,
               snapshot:{purpose,requirements,interactions,states,viewports,variants,selectedVariantId,demoData,references},
               qa /*bei Freigabe*/, decisionIds, componentVersions /*bei Freigabe*/ }],
  decisions: [{ id, featureId, moduleId, title, decision, rationale, tradeoffs, alternatives, status:open|decided|superseded, createdAt, decidedAt }],
  history: [{ id, ts, type, entity, entityId, featureId, moduleId, summary }],          // max. 3000
  qa: { runs:[…max 60], latest:{ [featureId]: { runId, ts, status, variantId, version, results:[…] } }, cli, seen:{ [featureId]: { [event]: ts } } },
  components: { [componentId]: { status, notes, changedAt } }                          // Metadaten zur Library
}
```
`migrate()` ergänzt fehlende Felder (Vorwärtskompatibilität). Zukünftige Schemaänderungen: Migrationsschritt in `migrate()`
ergänzen und `SCHEMA_VERSION` erhöhen (siehe TASKS.md – Migrationskette inkl. Snapshots ist offen).

## 4. Zustand & Persistenz (`workbench/store.js`, `server.mjs`)
- **Einziger Schreibweg:** `mutate(summary, recipe, meta)` – arbeitet auf einer Kopie (atomar: Fehler ⇒ keine Änderung),
  erhöht `meta.rev`, schreibt Historie (mit Zusammenfassen schneller Folgeänderungen), Undo/Redo (60 Schritte; **Einstellungen und
  QA sind vom Undo ausgenommen**), speichert entprellt (400 ms).
- **Domänen-Aktionen:** `actions.*` (Module, Features, Varianten, Blöcke, Anforderungen, Demo-Daten, Versionen, Freigabe,
  Entscheidungen, QA, Import/Export, Seed). UI ruft nur diese auf; Fehler (z. B. Sperre) → Toast mit Aktion „Neue Arbeitsversion“.
- **Speicherorte:** Server-Datei `data/workbench.json` (maßgeblich, atomar per tmp+rename) + Browser-Speicher (Cache/Fallback).
  Ohne Server läuft alles im Browser-Speicher.
- **Konflikte (Mehrere Tabs/Prozesse):** Client sendet `X-Base-Rev`; weicht die Datei-Revision ab → `409`, Status „Konflikt“,
  eigener Stand bleibt als Konflikt-Kopie im Browser. Neuerer Browser-Stand beim Start wird nicht still übernommen.
- **Backups:** automatisch höchstens alle 10 Min. beim Speichern, 40 behalten (`data/backups/`), manuell per UI; Wiederherstellen per UI.
- **Server-Härtung:** Pfad-Traversal-Schutz, Schreiben nur von localhost mit lokalem Host/Origin und `application/json`;
  `npm run lan` ist für andere Geräte schreibgeschützt.

## 5. Preview Engine
- `ui/preview-frame.js`: Iframe in exakter Gerätebreite (`core/devices.js`: 1440, 1280, 1024, 768, 390 + 360 optional),
  skaliert auf den verfügbaren Platz; Payload-Updates live (`window.__taktPreview.render`), Interaktionen per `postMessage`.
- `preview/runtime.js`: setzt Tokens als CSS-Variablen + Komponenten-CSS, Breakpoint-Klassen (`bp-mobile|tablet|desktop`),
  TAKT-App-Rahmen (Sidebar ≥ 1024, Navigationsleiste 600–1023, Bottom-Navigation < 600), Dialog-/Toast-Host,
  Error-Boundary je Block, generische Zustände (Lädt/Fehler), Leerzustand über leere Daten, Alt+Klick-Blockauswahl, Hervorhebung.
- **Geteilte Vorschau-Daten:** Blöcke, die denselben Demo-Daten-Schlüssel binden, sehen dieselben Änderungen (Quick-Add → Liste).
  **Geteilter UI-Zustand** (`ctx.ui`: `query`, `filter`, `view`, `selectedId`, `selectedDate`) verbindet Blöcke (Suche → Liste, Liste → Detail).
- **Deterministisch:** `ctx.today` = 24.11.2026 09:30 → Screenshots sind reproduzierbar.
- Direktlinks: `preview.html?feature=<id>&variant=<id>&theme=<t>&state=<s>&chrome=0|1` bzw. `?component=<id>`.

## 6. Theme Engine & Designsystem (Details: `DESIGN_SYSTEM.md`)
`tokens.js` → `tokensStylesheet()` (Basis-Variablen + je Theme `[data-tk-theme]`), `auditTheme()` (16 Kontrastpaare je Theme,
alle bestanden), `tokensJson()` (Export für Flutter-Mapping). Die Workbench-Oberfläche hat ein **eigenes** neutrales Design
(`workbench.css`, Hell/Dunkel), damit die TAKT-Vorschau nicht eingefärbt wirkt.

## 7. Komponenten-Library (`library/`)
Vertrag in `CONTRACT.md`: `{ id, name, category, description, version, props[], data[], events[], states[], css, example, render }`.
Der Inspector im Design Studio wird aus `props[]` generiert; Datenbindungen aus `data[]`; Interaktions-Abdeckung aus `events[]`.
45 Komponenten (15 generisch, 30 fachlich). Primitive (`ui.js`) verhindern Mehrfachimplementierungen.

## 8. Versionierung, Freigabe, Sperre (`core/versioning.js`, `store.js`)
- Arbeitsversion `0.x`; **„Version sichern“** = Snapshot + `0.x → 0.x+1`; **„Zur Prüfung“** = Snapshot (review) + Status.
- **Freigabe** = Checkliste im Store erzwungen (bevorzugte Variante, Muss-Anforderungen, Interaktionen, QA ohne Fehler, QA aktueller
  als letzte Designänderung, alle Ziel-Viewports geprüft) – Ausnahme nur mit dokumentierter Begründung. Ergebnis: Major-Version
  (`→ 1.0`), Snapshot mit QA-Ergebnis, Entscheidungen und **Komponentenversionen**, Feature **gesperrt**.
- **Sperre:** Inhalte (Zweck, Anforderungen, Interaktionen, Varianten, Blöcke, Demo-Daten, Viewports, Zustände) sind unveränderbar;
  Status „Freigegeben/Implementiert/Regression bestanden“ nur über Freigabe; Löschen nur mit ausdrücklicher Bestätigung;
  Zusammenführen einer gesperrten Quelle unmöglich. Organisatorisches (Gruppe, Reihenfolge, Notizen, Verknüpfungen, Gerätetest) bleibt änderbar.
- **Neue Arbeitsversion** (`1.0 → 1.1`) entsperrt; der Freigabe-Snapshot bleibt unverändert. **Wiederherstellen** älterer
  Versionen sichert vorher automatisch den aktuellen Stand.
- **Drift-Erkennung:** Hat eine Komponente seit der Freigabe eine neue `version`, zeigen Feature-QA und Quality Center
  „Regression nötig“. Die CLI prüft freigegebene Features zusätzlich **pixelgenau strikt**.

## 9. QA
| Ebene | Was | Wo |
|---|---|---|
| Sonde | Render-Fehler, fehlende Blöcke, horizontaler Überlauf, abgeschnittene Inhalte, Touch-Ziele (Mobile), WCAG-Kontrast (≤ 500 Textstellen), Bilder | `preview/qa-probe.js` |
| Workbench | QA-Lauf je Feature/Modul/alle/betroffene (sichtbarer Prüf-Frame), Matrix, Details, Drift, Gerätetests | `workbench/qa-runner.js`, Quality Center |
| CLI | Vertrag (Komponenten, Bindungen, Events) · 24 E2E-Bedientests · Screenshot-Matrix · Pixel-Regression (Baselines) · `--changed` per Datei-Hash | `qa/run-qa.mjs` |
| Statisch | Syntax, Seed-Integrität, Token-/Datums-/Umlaut-Regeln | `tools/check.mjs` |

**Baseline-Strategie:** Für Features in Arbeit folgt die Baseline dem letzten Lauf (Änderungen = Hinweis), für **freigegebene**
Features ist jede Abweichung > 0,2 % ein Fehler (Regression), bis bewusst `npm run qa:baseline` gesetzt wird.
**Selektiv:** `impact.js` (Komponente → Features/Varianten) in UI und CLI; `--changed` vergleicht Datei-Hashes der Komponenten;
Änderungen an Tokens/Primitiven/Runtime gelten als global (alle Features).

## 10. Seed & Datenfluss
Seed (`seed/modules/*.js`) = Startinhalt und Vorlage. Live-Arbeit passiert in `data/workbench.json`. `mergeSeed()` übernimmt
neue Module/Features/Entscheidungen aus dem Seed, ohne Bestehendes zu ändern (für Phase-1-Ergebnisse).

## 11. Architekturprüfung (Worker G, 24.11.2026) – Ergebnis & Umsetzung
**Behoben (Muss):** Status-Freigabe ohne Sperre · Sperr-Umgehungen (Meta-Felder, Merge, Löschen, Interaktions-Zeitstempel im Feature,
Feld-Whitelist) · Komponentenversionen im Freigabe-Snapshot + Drift-Erkennung + Checkliste im Store · Undo ohne Einstellungen/QA ·
Revisionen/409 bei Mehrfach-Schreibern, kein stilles Überschreiben beim Start · `mergeSeed` mit Entscheidungen · fehlende Skripte
(`qa/run-qa.mjs`, `tools/check.mjs`) · Server-Härtung (Pfad, Origin/Host, Content-Type, LAN read-only) · Zeitzonen-Bug (`isoDay`),
doppelte `DEFAULT_TODAY` · Auto-Snapshot vor Wiederherstellung.
**Offen (mittelfristig, in TASKS.md):** Skalierung (Versionen/QA in eigene Dateien, Undo als Patches), Migrationskette inkl. Snapshots,
Vereinheitlichung der Library-Helfer (Datum/Filter/IDs, Exportmuster, Ordner = Kategorien), Erweiterung des deklarativen Modells
(Container-Blöcke, Props je Breakpoint, Feldmapping, JSON-Schema für `shape`, einfache Aktionen), Flutter-Export (semantische Tokens,
Komponenten→Widget-Mapping, Feature-Spezifikation), `module.theme` in der Vorschau nutzen.
**Bewusst so gelassen:** reiner `core/`, atomares `mutate`, Snapshot-/Freigabe-Konzept, ein Vorschaupfad für alles, Komponentenvertrag,
Token-Konsequenz, kleine Layout-Engine, Server ohne Abhängigkeiten, Seed als Code.

## 12. Erweiterungspunkte
Neues Gerät → `core/devices.js` · neues Theme → `tokens.js` (alle `COLOR_ROLES`) · neuer Layout-Typ → `preview/layouts.js` + CSS ·
neue Komponente → `library/components/*` · neue QA-Prüfung → `qa-probe.js` (wirkt in UI und CLI) · neuer E2E-Test → `qa/run-qa.mjs`.
