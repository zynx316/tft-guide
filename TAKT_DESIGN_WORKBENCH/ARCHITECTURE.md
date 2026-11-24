# Architektur – TAKT Design Workbench (Stand V2, 24.11.2026)

> Zahlen zu Modulen, Features und Komponenten stehen in `docs/FEATURE_IDS.md` (automatisch erzeugt) und in der Ausgabe von
> `npm run check`. Der Bauplan mit allen Verträgen steht in `docs/BAUPLAN.md`.

## 1. Leitentscheidungen

| Entscheidung | Begründung | Verworfen |
|---|---|---|
| **Browser-App ohne Build** (ES-Module, Preact 10 + htm, vendored in `app/vendor/`) | Läuft überall, keine Toolchain, Komponenten-Modell wie React, Claude-freundlich | React+Vite+TS (Build), Vanilla-DOM (unwartbar), Electron (schwer) |
| **Lokaler Node-Server ohne Abhängigkeiten** (`server.mjs`) | Datei-Persistenz, Backups, Feedback vom Handy, Netzwerkinfo | Datenbank, Cloud-Backend |
| **Deklarative Varianten** (`layout` + `blocks[]`) aus einer **Komponenten-Registry** | Designs ändern ohne Neuentwicklung; Verbesserungen wirken überall; selektive Tests | Freies HTML je Variante |
| **Eine Vorschau-Runtime für alles** (Feature, Komponente, ganze App) in echten Iframes | Echte Breakpoints, voll bedienbar, identisch in Workbench, Launcher, QA | Skalierte Divs, Screenshots |
| **Demo-Launcher als PWA auf derselben Runtime** (ADR-001) | Kein Flutter-SDK nötig, alle Komponenten wiederverwendbar, Laptop und Handy identisch | Flutter Web, Electron/Tauri, Capacitor |
| **Eine Datenwelt aus dem Code** (`seed/world/`, `core/world.js`) | Alle Module zeigen dieselben Zahlen; Szenarien ohne Handarbeit; nie veraltet | Kopierte Demo-Daten je Feature |
| **Entscheiden statt endlos vergleichen** (`core/process.js`) | Inbox nach Blockierwirkung, Zeitbox, Rundenlimit 2, Gates je Ebene | Freie Diskussion ohne Abschluss |
| **Eine QA-Sonde** (`preview/qa-probe.js`) für Workbench und CLI | Gleiche Prüfungen sofort und automatisiert | Getrennte Prüflogik |

## 2. Struktur

```
TAKT_DESIGN_WORKBENCH/
├─ server.mjs              Statischer Server + /api/state (Revisionen, 409) · /api/backups · /api/feedback (v2, append-only,
│                          LAN-fähig, Ratenbegrenzung, Dubletten-Schutz) · /api/network · /api/ping · /api/qa/latest
├─ app/
│  ├─ index.html           Workbench            ├─ preview.html  Vorschau (Iframe-Ziel, auch Direktlinks)
│  ├─ launcher.html        Demo-Launcher (PWA: manifest.webmanifest, sw.js, icon.svg)
│  └─ src/
│     ├─ lib/              html.js · icons.js + icon-data.js (Lucide) · util.js · format.js (de-DE) · date.js
│     ├─ design-system/    tokens.js (EINZIGE Token-Quelle, 3 Themes, Kontrast-Audit) · takt-base.css
│     ├─ library/          registry.js · CONTRACT.md · ui.js (Primitive) · helpers.js · components/<bereich>/
│     ├─ preview/          runtime.js (Renderer, App-Player) · launchpad.js (App-Rahmen) · layouts.js · qa-probe.js
│     ├─ core/             rein, auch in Node: schema · versioning · impact · devices · directions · process · world ·
│     │                    preview-payload · seedpatch · workorder · spec · flutter · finmath · recurrence · health
│     ├─ seed/             index.js · catalog.js (App-Fragen, Muster) · modules/*.js · world/*.js (Datenwelt)
│     ├─ launcher/         launcher.js · launcher.css · devices.js
│     └─ workbench/        store.js · app.js · router.js · qa-runner.js · workbench.css · ui/* · views/*
├─ qa/run-qa.mjs           Vertrag · E2E (32) · Screenshot-Matrix (auch Szenario/Umgebung) · Pixel-Regression
├─ tests/*.test.mjs        Node-Tests (node:test, ~190): Kern, Format, Wiederholung, Gesundheit, Finanzmathe, Welt, Seed-Patch
├─ tools/                  check.mjs (statisch, Cache) · register.mjs (preact-Loader für Node) · verify.mjs ·
│                          work-order.mjs (Arbeitsauftrag) · feature-ids.mjs (Katalog) · test-finmath.mjs
├─ data/                   workbench.json (Live-Stand) · backups/ · feedback.jsonl
├─ docs/                   BAUPLAN · FEATURE_IDS · DATENWELT · Leitlinien (Gesundheit, Finanzen, Text) · ADRs · Gerätetest ·
│                          PERSONA · WORKER_BRIEF · brainstorm/ · work-orders/
└─ .claude/                commands/ (takt-start, -phase1, -feature, -qa, -review, -work-order, -round-prep) · agents/
```
**Schichten (nur nach unten):** `workbench/`, `launcher/` → `core/`, `preview/` (über Iframe) → `library/` → `design-system/`, `lib/`.
`core/` und `seed/` sind browserfrei; mit `tools/register.mjs` ist auch `library/` in Node ladbar (Tests).

## 3. Datenmodell (`core/schema.js`, Schema v2)
Zusätzlich zu Modulen, Features, Varianten, Versionen, Historie und QA (siehe Kommentare in `schema.js`):

| Bereich | Felder |
|---|---|
| **App (Ebene 0)** | `app: { directionId, shell, favorites[4], startFeatureId, vision, contexts[], principles[], nonGoals[], weights{}, phase1Done }` |
| **Richtungen** | `directions[]: { id (kompakt/visuell/fokus), name, claim, description, principles[], shell, theme }` |
| **Modul** | `+ area, homeFeatureId, directionId, assumptionStatus, assumptionNote` |
| **Feature** | `+ tier (1–3), acceptance[], flows[], interactions[].to (Navigation), seedHash` |
| **Variante** | `+ direction` (Zuordnung zu einer Richtung = Version im Launcher), `layout.stretch`, `layout.asideSticky` |
| **Entscheidung v2** | `level (app/pattern/module/feature/component), kind, question, options[{id,label,description,ref}], chosen, recommendation{optionId,reasons,by}, reversibility, status (open/decided/parked/superseded), revisitAt/If, rounds, supersedes` |
| **Prozess** | `rounds[]` (Agenda, Zeitbox, Ergebnisse), `pins[]` (Anmerkungen), `scores{feature:{variant:{kriterium:1–5}}}`, `feedback[]` |
| **Welt** | nur `worldOverrides` (bewusste Abweichungen); die Welt selbst kommt immer aus `seed/world` |

`migrate()` ergänzt fehlende Felder und ist idempotent (Test). Die Datenwelt wird seit Seed 2026-11-24.3 nicht mehr gespeichert.

## 4. Zustand & Persistenz (`workbench/store.js`, `server.mjs`)
- **Einziger Schreibweg:** `mutate(summary, recipe, meta)` auf einer Kopie (atomar), Historie, Undo/Redo (ohne Einstellungen/QA),
  entprelltes Speichern. UI ruft nur `actions.*` auf. Nach jeder Änderung teilt `lib/share.js` (`shareUnchanged`) alle
  unveränderten Teilbäume mit dem Vorzustand – 60 Rückgängig-Schritte kosten so etwa 0,3 MB statt ~180 MB. Deshalb gilt:
  übernommene Zustände nie direkt verändern (auch nicht in Ansichten, z. B. kein `.sort()` auf Zustands-Arrays ohne Kopie).
- **Mehrere Tabs/Geräte:** Tabs übernehmen den Stand des anderen Tabs inkl. Server-Revision; beim Zurückkehren in den Tab wird
  der Datei-Stand abgeglichen. Meldet der Server trotzdem einen Konflikt (409), werden die noch nicht gespeicherten eigenen
  Änderungen als Rezepte **auf den Server-Stand neu angewendet** (Rebase) – nur wenn das scheitert (z. B. nach Undo), bleibt der
  Stand als Konflikt-Kopie im Browser.
- **Backups** automatisch (höchstens alle 10 Min., 40 behalten), **Feedback** append-only in `data/feedback.jsonl` (Schema v2).
- **Seed-Patch** (`core/seedpatch.js`): Neues ergänzen, vom Nutzer unveränderte Features aktualisieren (vorher Arbeitsversion
  sichern), Freigegebenes nie ändern (offene Entscheidung „Seed-Vorschlag“). Erkennung über `seedHash` bzw. Verlauf.

## 5. Vorschau-Runtime (`preview/`)
- **Modi:** Feature (eine Variante), Komponente (Galerie), **App** (Demo-Launcher: ganze App mit Navigation).
- **App-Player:** Routen-Stapel, Zurück (Taste, Geste, Android-Zurück über den Launcher), Modul-Startseiten, Bereichsblatt,
  „Mehr“/„Alle Module“ nach Lebensbereich, Skizzen für Features ohne Design, Navigationsregeln aus `interaction.to`,
  geteilter Weltzustand (Aktionen wirken modulübergreifend).
- **App-Rahmen** (`launchpad.js`): `tabs` (4 Favoriten + Mehr), `launchpad` (Start = Modulraster mit Live-Kennzahlen aus der
  Welt), `fokus` (Heute, Module-Blatt, zentraler Erfassen-Knopf, der in die Welt schreibt). Rahmen je Richtung, abweichend über
  `app.shell` oder Launcher-Schalter.
- **Versionen** (`core/directions.js`): Arbeitsstand · Richtung (`dir:<id>`) · **Meine Auswahl** (`mix`: Feature-Entscheidung ›
  Modul-Richtung › App-Richtung › Arbeitsstand) · Freigegeben · `pin:<feature>:<variante>` („In App ansehen“ aus dem Studio).
- **Szenarien** (`core/world.js`): Alltag, Erster Start (Nutzerdaten leer, Kataloge/Wetter bleiben), Stress-Tag (dreifache Listen,
  lange Texte); gezielte Werte je Welt-Datei über `export const scenarios`.
- **Umgebung:** `env.offline` (Hinweisleiste), `env.stale`, `privacy` (Beträge maskiert), `env.scale` (Schrift 100–200 % über
  `--tk-text-scale` in allen Schriftgrößen-Tokens).
- **Kontext für Komponenten:** `ctx.today`, `ctx.now()`, `ctx.live` (Uhr läuft nur im echten Launcher), `ctx.fmt`, `ctx.env`,
  `ctx.privacy`, `ctx.ui`/`setUi`, `ctx.openDialog`, `ctx.toast`, `ctx.emit`.
- **Nachrichten:** Runtime → Host `ready`, `route {featureId, moduleId, depth, initial, external, shellPage}`, `interaction`,
  `select-block`; Host → Runtime `render`. API im Iframe: `window.__taktPreview.{render, navigate, back}`, `window.__taktQA.run()`.
- Direktlinks: `preview.html?feature=…&variant=…&theme=…&state=…&scenario=…&env=offline,privacy&scale=2` bzw.
  `?app=1&version=dir:fokus&route=<feature>&shell=launchpad`.

## 6. Demo-Launcher (`launcher/`, `launcher.html`)
Laptop: 1–4 Versionen nebeneinander in Geräterahmen, gekoppelte Navigation (nur Nutzer-Wechsel), Werkzeugleiste (Gerät, Theme,
Rahmen, Szenario, Offline, Schrift, Beträge, Ebene, Demo zurücksetzen, Präsentation). Handy: Vollbild, schwebender
Versionsschalter, Zurück-Taste geht in der App zurück. Bewertung je Ebene (App/Modul/Feature): Sterne, Favorit, fünf Kriterien,
Kommentar, „Übernehmen“ (lokal direkt als Entscheidung, im WLAN als Feedback). QR-Dialog mit Netzwerkdiagnose (`/api/network`).

## 7. Entscheidungsprozess (`core/process.js`, Views `app-level`, `rounds`, `decide`, `ws-process`)
- **Ebenen:** 0 App (Leitbild, Richtung, Rahmen, Grundsatzfragen, Muster) · 1 Modul (Startseite, Richtung) · 2 Feature (Variante)
  · 3 Komponente.
- **Inbox:** offene + fällig geparkte Entscheidungen nach Blockierwirkung × Reversibilität × Alter.
- **Entscheidungsrunden:** Agenda (5–7), Zeitbox, Optionen mit Live-Vorschau, Empfehlung per Klick, Parken mit Wiedervorlage,
  „Änderung nötig“ nur bis zur 2. Runde (Rundenlimit). Abschluss → **Arbeitsauftrag** (Markdown, `core/workorder.js`).
- **Gates:** Definition of Ready/Done je Feature, Modul-Gate, App-Gate. **Design-Tiefe** (Tier 1–3) bestimmt den Aufwand.
- **Scorecard** im Variantenvergleich (Gewichte aus dem Leitbild), **Anmerkungen** (Muss-Anmerkungen blockieren die Freigabe),
  **Annahmen-Register** für Phase 1.

## 8. Theme Engine & Designsystem (Details: `DESIGN_SYSTEM.md`)
`tokens.js` → `tokensStylesheet()` (Basis + `[data-tk-theme]`), `auditTheme()` (Kontrastpaare), `tokensJson()`, Dart-Export
(`core/flutter.js`). Schriftgrößen skalieren über `--tk-text-scale`. Die Workbench-Oberfläche hat ein eigenes neutrales Design.

## 9. Komponenten-Library (`library/`)
Vertrag in `CONTRACT.md` (`id, name, category, version, props[], data[], events[], states[], css, example, render`, neu: `flutter`).
Primitive in `ui.js` (u. a. Button, Chip, Card, Switch mit 44-px-Trefferfläche, Segmented, NumberStepper, Ring, Progress,
EmptyState). Querschnitt-Bausteine in `components/crosscut/` (Hinweise, Offline, Sync, Berechtigung, Wiederholung, Rückgängig,
Verknüpfungen, Erststart). Fachbereiche je Modul (`components/<bereich>/`, CSS-Präfix je Bereich).

## 10. Versionierung, Freigabe, Sperre (`core/versioning.js`, `store.js`)
Unverändert gegenüber V1: Arbeitsversion `0.x`, Freigabe mit Checkliste (+ Gates) → Major-Version, Snapshot inkl. QA,
Entscheidungen und Komponentenversionen, Sperre; „Neue Arbeitsversion“ entsperrt; Drift-Erkennung bei Komponentenänderungen.

## 11. QA (Details: `QA_REPORT.md`)
| Ebene | Was | Wo |
|---|---|---|
| Statisch (< 1 s) | Syntax (Cache), Seed-Integrität, Navigationsgraph, Startseiten-Richtungen, Begriffslisten Gesundheit/Finanzen, Token-/Datums-/Umlaut-Regeln | `npm run check` |
| Node-Tests (~5 s) | Kern, Migration, Seed, Prozess, Welt/Szenarien, Seed-Patch, Versionen, Format, Wiederholung, Gesundheit, Finanzmathematik, Querschnitt | `npm test` |
| Sonde | Rendering, Blöcke, Überlauf, Abschneiden, Touch, Kontrast, Bilder, **Namen von Bedienelementen**, **Privatsphäre** | `preview/qa-probe.js` |
| CLI | Vertrag · 32 E2E-Tests (inkl. Launcher, Rahmen, Runden, Gates, Seed) · Matrix (Viewports × Themes × Zustände, optional Szenario/Umgebung) · Pixel-Regression | `npm run qa` |
| Gesamt | check → test → (qa:changed) | `npm run verify` |

## 12. Erweiterungspunkte
Neues Modul → `seed/modules/<id>.js` + Manifest in `seed/index.js` + Welt-Datei (Eigentümer laut `docs/DATENWELT.md`) ·
neue Komponente → `library/components/<bereich>/` (Vertrag, `flutter`, Präfix) · neue Richtung → `directions` (Workbench) ·
neuer Rahmen → `preview/launchpad.js` · neue QA-Prüfung → `qa-probe.js` · neuer Test → `tests/<bereich>-*.test.mjs` ·
neue Grundsatzfrage → `seed/catalog.js`.
