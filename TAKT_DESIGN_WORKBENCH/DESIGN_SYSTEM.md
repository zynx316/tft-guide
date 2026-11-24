# Designsystem – TAKT V2.0 (in der Workbench)

Implementierung: `app/src/design-system/tokens.js` (Tokens & Themes) · `app/src/design-system/takt-base.css` (Primitive, App-Shell,
Layouts) · `app/src/library/` (Primitive `ui.js`, Komponenten, Vertrag `CONTRACT.md`). Live-Dokumentation in der Workbench unter
**Komponenten › Design Tokens & Themes** (Farbrollen, Kontrast-Audit, Typografie, Abstände) und je Komponente (Galerie, Zustände,
Props, Datenslots, Events, Verwendung).

## Grundregeln
1. **Eine Quelle:** Alle Werte stehen in `tokens.js` und werden als CSS-Variablen `--tk-…` ausgegeben. Komponenten verwenden
   keine festen Farben/Abstände. Eine Token-Änderung wirkt sofort in allen Komponenten, Varianten und Vorschauen.
2. **Themes ändern nur Farbe:** Hintergrund, Oberflächen, Kontraste, Akzente, Schatten, Diagrammpalette. Nie Abstände, Größen,
   Typografie oder die Informationsarchitektur.
3. **Kontrast ist geprüft:** `auditTheme()` prüft je Theme 16 Paare (Text auf Hintergrund/Oberfläche, Text auf Akzent, Status auf
   Soft-Flächen, aktive Navigation). Stand: **alle drei Themes bestanden**. Zusätzlich misst die QA-Sonde den Kontrast real gerenderter Texte.
4. **Mobile zuerst bedienbar:** Touch-Ziele auf Mobile ≥ 36 px (Ziel 44 px, `--tk-size-touch`), Eingaben 16 px (kein Zoom auf iOS),
   Dialoge werden zu Bottom-Sheets, Navigation zur Bottom-Navigation.
5. **Komponenten statt Einzelanfertigung:** Neue Muster als Komponente in die Library, nicht in eine Variante hineinbauen.

## Themes
| Theme | Charakter | Schema | Akzent |
|---|---|---|---|
| **Graphite** (Standard) | Ruhiges, neutrales Dunkelgrau, kühler Blau-Akzent – für tägliche Nutzung | dunkel | `#6aa6ff` |
| **Horizon** | Hell und luftig, weiße Flächen, Blau/Petrol – für Tageslicht und Lesbarkeit | hell | `#1a62bb` |
| **Intensiv** | Hoher Kontrast, Tiefschwarz, Orange/Magenta – Fokus und Motivation | dunkel | `#ff7a1a` |

**Farbrollen** (jedes Theme definiert alle): `bg, surface, surface2, surface3, overlay, border, borderStrong, text, textMuted,
textSubtle, textOnAccent, accent, accentHover, accentSoft, accent2, success(+Soft), warning(+Soft), danger(+Soft), info(+Soft),
focus, navBg, navActive` + `chart-1…6` + Schatten `sm/md/lg`.
> **Offen (Phase 1):** Farbwerte mit den echten TAKT-Themes im Flutter-Projekt abgleichen (`tokens.js`, TODO).

## Basis-Tokens
| Gruppe | Werte |
|---|---|
| Schrift | Inter / Segoe UI Variable / System · Größen xs 11 · sm 12,5 · md 14 · lg 16 · xl 19 · 2xl 23 · 3xl 29 · 4xl 36 · Gewichte 400/500/600/700 |
| Abstände | 0 · 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 px (`--tk-space-N`) |
| Radien | xs 4 · sm 6 · md 10 · lg 14 · xl 20 · pill |
| Größen | Touch 44 · Control 36 (sm 28) · Icon 18 · App-Bar 56 · Bottom-Nav 64 · Nav-Rail 76 · Sidebar 232 · Inhalt max. 1280 |
| Breakpoints | Mobile < 600 · Tablet 600–1023 · Desktop ≥ 1024 (wide ≥ 1366) |
| Bewegung | fast 120 ms · base 180 ms · slow 280 ms · Easing `cubic-bezier(.2,.7,.2,1)` · `prefers-reduced-motion` respektiert |

## Richtungen (Versionen der App)
| Richtung | Leitidee | App-Rahmen | Theme-Vorschlag |
|---|---|---|---|
| **Kompakt** | Dichte vor Weißraum, Listen/Tabellen, Aktionen in der Zeile, Zahlen exakt | Tab-Leiste (4 Favoriten + Mehr) | Graphite |
| **Visuell** | Eine Botschaft pro Karte, Diagramme, Raum, Fortschritt sichtbar | Launchpad (Start = Modulraster mit Live-Kennzahlen) | Horizon |
| **Fokus** | Nächste Aktion zuerst, Kontext aus anderen Modulen, Erfassen ohne Umweg | Heute + Module-Blatt + zentraler Erfassen-Knopf | Intensiv |

Richtungen unterscheiden sich **strukturell** (Layout, Hierarchie, Komponentenwahl, Bedienkonzept), nicht nur in Farben. Themes
bleiben frei kombinierbar; der App-Rahmen ist im Launcher und auf der App-Ebene unabhängig wählbar.

## App-Shell & Layouts
- **App-Rahmen:** Desktop Sidebar mit Modulen · Tablet Navigationsleiste · Mobile App-Bar + Rahmen je Richtung (siehe oben).
  „Mehr“/„Alle Module“ gruppiert nach Lebensbereich. Suche und Glocke führen zu `system.search`/`system.notifications`.
- **Layouts für Varianten:** `stack` (optional schmal) · `split` (2/3 + 1/3; Optionen gleich breit, Seitenspalte zuerst,
  **Seitenspalte läuft mit**) · `sidebar` (Panel einklappbar) · `grid` (12er-Raster; Option **Karten gleich hoch**) · `tabs`.
  Regionen: Kopf, Hauptbereich, Seitenspalte, Seitenleiste, Fuß, unten fixiert. Blöcke je Breakpoint ausblendbar.
- **Schriftskalierung:** alle Schriftgrößen-Tokens rechnen mit `--tk-text-scale` (Launcher: 100/130/200 %). Layouts dürfen bei
  200 % nichts abschneiden – prüfbar mit `?scale=2` bzw. `npm run qa -- --scale 2`.

## Primitive (`library/ui.js`)
Button (default/primary/ghost/danger, sm, Icon-only) · IconButton · Badge (Töne) · Chip (Filter) · Card · SectionHeader · Field ·
Input · Textarea · Select · Search · Check (Touch-Fläche 40 px mobil) · **Switch (Trefferfläche 44 px mobil)** · Segmented
(≥ 44 px breit mobil) · Tabs · Progress · **NumberStepper** (− / +, 44 px, Komma-Eingabe, Dauerdruck) · **Ring**
(Fortschrittsring, Überschreitung gedämpft statt Warnfarbe) · Avatar · EmptyState · ErrorState · Skeleton · Sparkline · Delta ·
`toneColor()`. Zusätzlich in der Runtime: Dialog/Bottom-Sheet, Toast, Umgebungshinweis (Offline/veraltet).
Formatierung ausschließlich über `lib/format.js` (`ctx.fmt`; de-DE, geschütztes Leerzeichen vor Einheit, echtes Minus).
Inhaltliche Leitplanken: `docs/HEALTH_GUIDELINES.md` (keine Alarmfarben bei Kalorien/Gewicht, keine Moralwörter),
`docs/FINANCE_GUIDELINES.md` (Hinweisarten, Spannen, Privatsphäre), `docs/TEXT_STIL.md`.

## Zustände
Jede Variante ist in **Standard, Leer, Lädt, Fehler** prüfbar (Vorschau-Werkzeugleiste), zusätzlich mit den **Datenszenarien**
Alltag, Erster Start (Nutzerdaten leer) und Stress-Tag (dreifache Listen, lange Texte) sowie den Umgebungen Offline und
Privatsphäre. Leer = alle gebundenen Daten leer →
Komponenten zeigen `EmptyState`. Lädt/Fehler rendert die Runtime generisch (Skeleton / Fehler mit „Erneut versuchen“), sofern die
Komponente das nicht selbst übernimmt.

## Komponenten
Vollständiger, automatisch erzeugter Katalog mit Version, Zweck, Datenslots, Events, Verwendung und Flutter-Hinweis:
**`docs/KOMPONENTEN.md`** (`node --import ./tools/register.mjs tools/component-catalog.mjs`). Bereiche: Kern (generisch),
Querschnitt (Hinweise, Offline, Sync, Berechtigung, Wiederholung, Rückgängig, Verknüpfungen, Erststart), Kalender, Aufgaben,
Inhalte, Einblicke, Finanzen, Sparpläne, Trading, Fitness, Ernährung, Wetter, Gewohnheiten/Start. CSS-Präfix je Bereich.

## Flutter-Überführung (Vorbereitung)
- `Daten & Backup › Design-Tokens exportieren` liefert `takt-design-tokens.json` (Basis, Themes, Farbrollen).
- Dart-Export (`core/flutter.js`): `ThemeExtension` mit allen Farbrollen je Theme plus `ThemeData`-Grundgerüst.
- Feature-/Modul-Spezifikation als Markdown (Anforderungen, Akzeptanzkriterien, Interaktionen mit Navigation, Variante mit
  Blöcken, Bindungen, Flutter-Hinweis je Komponente). Neue Komponenten tragen `flutter: { widget, propMap, events }`.
- Offen (TASKS.md): Entitäten/ARB/Widgetbook erst nach Richtungswahl und Phase 1.
