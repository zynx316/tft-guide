# Briefing für Modul-Worker (Komponenten + Seed-Manifest eines Moduls)

Dieses Briefing gilt für jeden Agenten oder jede Session, die ein TAKT-Modul in der Workbench aufbaut oder vertieft.
Ziel ist **die beste mögliche Basis**. Dazu gehört je Modul eine Modul-Startseite, alle wichtigen Features, mehrere
strukturell verschiedene Versionen, echte Interaktionen, realistische Daten und geprüfte Qualität.

## Pflichtlektüre (vor dem ersten Edit)
- `app/src/library/CONTRACT.md`: Komponentenvertrag, exakt einhalten.
- `app/src/library/ui.js` (Primitive) und `app/src/library/helpers.js`: nutzen, nicht nachbauen.
- `app/src/library/components/core/*.js`: 15 generische Komponenten. Prüfen, bevor du etwas neu baust.
- Vorhandene Fachkomponenten im eigenen Bereich und angrenzend (`components/*/`).
- `app/src/seed/SEED_FORMAT.md` (inkl. Abschnitt „Ebenen & Versionen“) und ein vollständiges Beispiel (`seed/modules/calendar.js`).
- `app/src/core/directions.js`: Richtungen, Startseite, Navigation.
- `app/src/design-system/tokens.js` und `takt-base.css`.

## Ebenen & Versionen – das musst du liefern
1. **Modul-Startseite** (Ebene 1): ein Feature „Übersicht“ (Gruppe „Übersicht“), gesetzt als `module.homeFeatureId`.
   Es ist der Einstieg im Demo-Launcher und braucht **drei Varianten**, je eine pro Richtung:
   - `kompakt`: hohe Dichte, Listen/Tabellen, Zahlen exakt, Aktionen in der Zeile.
   - `visuell`: große Karten, Diagramme, Raum, Fortschritt sichtbar, eine Botschaft pro Karte.
   - `fokus`: „Was ist als Nächstes zu tun?“, priorisierte Hinweise, Kontext aus anderen Modulen, Erfassen ohne Umweg.

   Die drei Varianten müssen sich **strukturell** unterscheiden (Layout-Typ, Hierarchie, Komponentenwahl, Bedienkonzept),
   nicht nur in Props oder Farben.
2. **Kern-Features** (die 3–4 wichtigsten des Moduls): mindestens 2 Richtungen, ideal 3. Weitere Features: 1 Variante
   mit gesetzter Richtung. Features im Status „Nicht untersucht“/„Analysiert“ dürfen ohne Variante bleiben, brauchen
   aber Zweck und Anforderungen.
3. **Navigation** (`interaction.to`): Die App muss sich im Launcher wie eine echte App anfühlen. Mindestens die Wege
   Startseite → Kern-Features → Detail per Interaktion mit `to` verknüpfen. Das `event` muss von einer Komponente der
   jeweiligen Variante wirklich ausgelöst werden, z. B. `item.open`, `card.open`, `header.secondary`, `metric.open`
   oder eigene Events.
4. **Akzeptanzkriterien** (`acceptance`, 3–6 prüfbare Sätze) für Startseite und Kern-Features; **Abläufe** (`flows`)
   für 1–3 typische Wege.
5. **Status realistisch** verteilen (nicht alles „Design in Arbeit“). Mindestens 2 Entscheidungen, davon 1 offen.

## Gemeinsame Datenwelt (Persona „Ein Tag“)
- `app/src/seed/world/`: `persona.js` (Jonas Keller, Bielefeld, Online-Shop „Nordlicht Studio“), `organisation.js`
  (Termine, Aufgaben), `finance.js` (Konten, Buchungen, Budgets, Abos, Sparpläne, Sparziele, Depot, Watchlist,
  Dividenden; rechnerisch konsistent) sowie `fitness.js`, `nutrition.js` und `weather.js` (vom jeweiligen Worker zu befüllen).
- **Binden statt kopieren:** `demoData: { plans: '@world:savingsPlans' }`. Lokale, rein featurebezogene Daten bleiben im Manifest.
- **Konsistenz:** Zahlen, die in mehreren Modulen vorkommen (Depotwert, Sparrate, Trainingstage, Kalorienziel …),
  kommen aus der Welt. Abgeleitete Werte (Summen, Quoten) berechnet die Welt-Datei selbst, nicht von Hand.
- **Rechnen:** Finanzmathematik nur über `app/src/core/finmath.js` (getestet, `tools/test-finmath.mjs`).

## Inhalt & Qualität
- **Fachlich erstklassig:** Denke wie die beste App ihrer Klasse im deutschsprachigen Raum. Deutsche Formate (Euro,
  Komma, Datum „Di, 24.11.“, 24-h-Zeit), sachliche Hinweise, wo nötig (Finanzen: „keine Anlageberatung, Simulation“;
  Gesundheit: „kein medizinischer Rat“).
- **Demo-Daten:** realistisch, konsistent und rund um den Referenztag Di, 24.11.2026, 09:30 (`ctx.today`). Persona:
  selbstständiger Power-User aus Bielefeld, Online-Handel (Shopify/Etsy), ETF-Sparer, trainiert 3×/Woche, achtet auf
  Ernährung. Daten innerhalb des Moduls stimmig (Summen passen zu Listen).
- **Beträge/Prozente:** nur über `money(ctx, …)` und `percent(ctx, …)` (Privatsphäre-Modus), Hinweise über `legal-notice`.
- **Komponenten:** Neue Komponenten nur, wenn core/vorhandene es nicht gut können. Jede neue Komponente braucht:
  Vertrag, `example`, Leerzustand, Mobile ≥ 36 px Touch (Ziel 44), keine Hex-Farben (nur `var(--tk-…)`),
  `ctx.emit` für jede relevante Aktion, `setData`/`setUi` für echte Interaktion, Datum relativ zu `ctx.today` (nie `new Date()`),
  `isoDay()` statt `toISOString().slice(0,10)`. Maximal ~250 Zeilen je Datei, gemeinsame Helfer in eine `_<bereich>.js`.
- **Texte:** Deutsch mit echten Umlauten, knapp, freundlich, ohne Füllwörter.
- **Barrierefreiheit:** `aria-label` für Icon-Buttons, Rollen für Tabs/Checkboxen, Kontrast über Tokens.

## Dateibereich
Nur die Dateien, die dein Arbeitspaket nennt. Kern/Primitive/Runtime/Registry/Workbench **nicht** ändern. Wünsche an
den Kern gehören in den Abschlussbericht.

## Testen (Pflicht)
1. `node tools/check.mjs`: 0 Fehler.
2. Eigener Server: `node server.mjs --port <deinPort> --data /tmp/<dein-name>` (leere Daten, die Vorschau nutzt den Seed).
3. Playwright (`require('playwright')`, `chromium.launch()`) für jede Variante:
   `http://localhost:<port>/preview.html?feature=<id>&variant=<v>&theme=<t>` bei 1440×900, 768×1024, 390×844, 360×780,
   in allen drei Themes (graphite, horizon, intensiv). Warten auf `body[data-ready]`, dann
   `await page.evaluate(() => window.__taktQA.run())`. Ziel: **kein fail, kein warn**.
4. Zustände: `&state=empty`, `&state=loading`, `&state=error` (Mobile + Desktop) → kein fail.
5. App-Modus (Launcher): `preview.html?app=1&version=dir:kompakt` (bzw. `dir:visuell`, `dir:fokus`) bei 390×844.
   Über `[data-nav-module="<modul>"]` oder `window.__taktPreview.navigate('<featureId>')` zum Modul, dann die
   Navigationswege klicken. Die Route erkennst du an `.tk-app__crumb strong`. Alle `to`-Wege müssen funktionieren.
6. Komponenten-Galerie: `preview.html?component=<id>&theme=horizon` für jede neue Komponente.
7. Screenshots mit dem Read-Tool ansehen und **optisch nachbessern**, bis es wie eine hochwertige, moderne App aussieht.
8. Server beenden.

## Abschlussbericht (knapp)
Dateien, Komponenten (id, Zweck, Events), Features (Status, Varianten mit Richtung), Navigationswege, QA-Ergebnis
(Varianten × Viewports × Themes), bekannte Einschränkungen, Wünsche an Kern/Primitive.
