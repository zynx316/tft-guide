# Datenwelt der Persona „Ein Tag“ (Verträge, Schlüssel, Eigentümer)

> **Stand:** 24.11.2026 (Lektüre der Welt-Dateien am Stichtag; mehrere Module bauen sie gerade aus, Zahlen und Schlüsselanzahl können sich ändern) · **Referenztag:** Di, 24.11.2026, 09:30 Uhr (`DEFAULT_TODAY`)
> **Gültigkeit:** verbindlich für `app/src/seed/world/**` und für jede Bindung `'@world:<schlüssel>'`. Gilt, bis eine Entscheidung im Entscheidungslog sie ändert. Die Persona ist ein **Platzhalter**, bis der Nutzer sie bestätigt (Abschnitt 2).
> **Zugehörige Dateien:** `app/src/seed/world/*.js` · `app/src/core/world.js` (`getWorld`, `applyScenario`, `SCENARIOS`, `hasWorldKey`) · `app/src/core/preview-payload.js` (`worldFor`, `buildAppPayload`) · `app/src/preview/runtime.js` (`useWorld`, Screen-Kontext) · `app/src/core/schema.js` (`worldOverrides`) · `docs/PERSONA.md` · `docs/BAUPLAN.md` (5.5, 5.7, 5.13, 12) · `docs/HEALTH_GUIDELINES.md`, `docs/FINANCE_GUIDELINES.md` · `docs/TEXT_STIL.md`.
> **Ist und Ziel:** „Ist“ ist der Code am Stichtag, „Ziel“ der Vertrag für neue Arbeit. Abweichungen stehen in Abschnitt 8 und, wo sie eine Invariante betreffen, in Abschnitt 7.

## 1. Zweck

Alle Module erzählen **dieselbe Geschichte an einem Tag**. Zahlen, die in mehreren Modulen vorkommen (Depotwert, Sparrate, Trainingstage, Kalorienziel, Termine), kommen aus **einer** Stelle. Dadurch sind Entscheidungen im Launcher nach Design und nicht nach widersprüchlichen Daten möglich, und Änderungen (Aufgabe abhaken, Wasser trinken) wirken überall.

Prinzipien (Bauplan 2): eine Wahrheit je Ding, jedes Datenobjekt hat **genau einen Eigentümer** (Abschnitt 3.2), andere verlinken oder zeigen es an, abgeleitete Werte werden in der Welt **berechnet**, nie von Hand getippt.

## 2. Persona (Kurzprofil, Platzhalter)

Quelle: `world/persona.js` (Schlüssel `persona`). **Annahme, bis der Nutzer bestätigt oder ändert** (BAUPLAN_PAKETE `decisionsForUser` Nr. 1). Vollständiger Tagesablauf: `docs/PERSONA.md`.

| Feld | Wert (Platzhalter) |
|---|---|
| Name, Alter, Ort | Jonas Keller, 38, Bielefeld, mit Partnerin Jana |
| Beruf | selbstständig, Online-Shop „Nordlicht Studio“ (nachhaltige Wohnaccessoires) auf Shopify, Etsy, Amazon |
| Geld | ETF-Sparer (All-World, Emerging Markets, World IT), Notgroschen im Aufbau, spart auf Japan-Reise 2027 |
| Körper | Krafttraining 3× pro Woche (Mo/Mi/Fr), Laufen am Wochenende, Ziel: 3 kg abnehmen (80 → 77 kg; `persona.health` schreibt „3 kg Fett verlieren“, die Messreihe misst Gewicht), ca. 2.400 kcal pro Tag, 140 g Eiweiß |
| Referenzmoment | Di, 24.11.2026, 09:30 Uhr, Bielefeld, 6 °C, leicht bewölkt, ab 14 Uhr Sturmböen |

Persona-Aussagen sind Eigentum des Moduls **home** (`persona.js`). Andere Dateien dürfen sie lesen, nicht abweichend wiederholen (Abschnitt 8, Befund B1).

## 3. Dateien und Eigentümer

### 3.1 Welt-Dateien

Eine Datei = ein Eigentümer-Paket. Jeder **benannte Export, der keine Funktion ist**, wird ein Welt-Schlüssel (`pick()` in `world/index.js` filtert Funktionen heraus). Funktionen dürfen für Hilfen exportiert werden und sind keine Schlüssel.

| Datei | Eigentümer-Paket | Modul(e) | Ist am Stichtag |
|---|---|---|---|
| `index.js` | INF-3 | Aggregation (`allKpis`, `allHints`, `searchIndex`, `allNotifications`), `scenarios` zusammenführen | vorhanden, **nur `pick`/`WORLD`/`isWorldRef`/`worldKey`**; Aggregate fehlen |
| `persona.js` | MOD-HOME | home (Persona) | vorhanden, 1 Schlüssel |
| `organisation.js` | MOD-CAL | calendar, tasks | vorhanden, 2 Schlüssel (`events`, `tasks`) |
| `finance.js` | MOD-FIN | finance (**enthält heute zusätzlich Sparen und Depot**) | vorhanden, 17 Schlüssel |
| `savings.js` | MOD-SAV | savings | **fehlt** (Daten liegen in `finance.js`) |
| `trading.js` | MOD-TRD | trading | **fehlt** (Daten liegen in `finance.js`) |
| `fitness.js` | MOD-FIT | fitness | vorhanden, 27 Schlüssel |
| `nutrition.js` | MOD-NUT | nutrition | vorhanden, 11 Schlüssel |
| `weather.js` | MOD-WET | weather | vorhanden, 6 Schlüssel |
| `knowledge.js` | MOD-KB | knowledge, notes | **fehlt** |
| `scans.js` | MOD-PTT | picture-to-text | **fehlt** |
| `sales.js` | MOD-SAL | sales | **fehlt** |
| `habits.js` | MOD-HAB | habits | **fehlt** |
| `goals.js` | MOD-HAB | goals | **fehlt** |
| `documents.js` | MOD-REG | documents | **fehlt** |
| `shopping.js` | MOD-REG | shopping | **fehlt** |
| `system.js` | MOD-SYS | system | **fehlt** |
| `settings.js` | MOD-SET | settings (`prefs`) | **fehlt** |
| `home.js` | MOD-HOME | home (Briefing, Tagesablauf, Erste Schritte) | **fehlt** |

Beim Stand dieser Lektüre enthält `WORLD` 64 Schlüssel. Fehlende Dateien legt INF-3 als Stubs an (Bauplan 6, Dateibesitz-Liste); die Eigentümer-Pakete befüllen sie.

### 3.2 Eigentümer je Datenobjekt (Bauplan 5.13)

| Datenobjekt | Eigentümer | Andere Module |
|---|---|---|
| Einkaufsliste, Vorräte, Haushaltswartung | shopping | Ernährung liefert Zutaten per Verknüpfung (`carry`) |
| Abos und Verträge | Fristen und Dokumente: documents; laufende Kosten und Summen: finance (`subscriptions`) | documents verlinkt |
| Schlaf und Check-in | fitness.recovery | kein Journal-Modul in Basis v1 |
| Wasser | nutrition.water | Start zeigt Kachel, Gewohnheiten verknüpfen nur |
| Fokuszeit | tasks.focus (`focusMinutes` aus der Aufgaben-Welt) | Start und Kalender lesen |
| Steuer | Sicht: trading.tax; Selbstständigen-Rücklagen: finance.business (Skelett); Belege-Ordner: documents | |
| Sparpläne und Sparziele | savings (`savingsPlans`, `savingsGoals`) | goals zeigt Sparziele nur als Quelle |
| Depot, Positionen, Watchlist, Dividenden | trading | finance rechnet `depotValue` aus trading |
| Termine, Aufgaben | organisation-Welt (calendar, tasks) | Training und Mahlzeiten erzeugen Termine/Aufgaben nur über Welt-Einträge mit gleichen IDs |
| Persona | home (`persona.js`) | |
| Einstellungen (`prefs`) | settings | Runtime liest `prefs.favorites` für die Navigation |

### 3.3 Pflicht-Exporte je Welt-Datei (Ziel)

Für **jedes** Modul, das eine Datei besitzt, exportiert die Datei (camelCase der Modul-ID, z. B. `pictureToText`):

| Export | Form | Pflicht |
|---|---|---|
| `<m>Summary` | `{ kpis: [...] }` | ja (Abschnitt 5.1) |
| `<m>Hints` | `[...]` | ja, leere Liste erlaubt |
| `<m>Search` | `[...]` | ja, leere Liste erlaubt |
| `<m>Notifications` | `[...]` | ja, leere Liste erlaubt |
| `scenarios` | `{ erststart: {…}, stress: {…} }` | ja für Module mit Tier-1-Daten (Abschnitt 6) |
| `prefs` | `{ favorites, units, privacy, quietHours, textScale }` | nur `settings.js` |

| Datei | Konkrete Pflicht-Exporte |
|---|---|
| `organisation.js` | `calendarSummary/Hints/Search/Notifications`, `tasksSummary/Hints/Search/Notifications`, `scenarios` |
| `finance.js` | `financeSummary` (Ist: flach, Ziel: zusätzlich `kpis`), `financeHints`, `financeSearch`, `financeNotifications`, `scenarios` |
| `savings.js` | `savingsSummary/Hints/Search/Notifications`, `scenarios` (+ `savingsPlans`, `savingsGoals` ziehen aus `finance.js` hierher) |
| `trading.js` | `tradingSummary/Hints/Search/Notifications`, `scenarios` (+ `positions`, `depotCash`, `depotValue`, `depotHistory`, `watchlist`, `dividends`, `taxAllowance`) |
| `fitness.js` | `fitnessSummary` (Ist: flach, Ziel: zusätzlich `kpis`), `fitnessHints/Search/Notifications`, `scenarios` |
| `nutrition.js` | `nutritionSummary/Hints/Search/Notifications` (Ist: `nutSummary`, bleibt), `scenarios` |
| `weather.js` | `weatherSummary/Hints/Search/Notifications`, `scenarios` |
| `knowledge.js` | `knowledgeSummary/…`, `notesSummary/…` |
| `scans.js` | `pictureToTextSummary/…` |
| `sales.js` | `salesSummary/…`, `scenarios` (Fehlerzustand „Etsy-Token abgelaufen“) |
| `habits.js` / `goals.js` | `habitsSummary/…` / `goalsSummary/…` |
| `documents.js` / `shopping.js` | `documentsSummary/…` / `shoppingSummary/…` |
| `system.js` | `systemSummary/…` (Befehle, Eingang) |
| `settings.js` | `settingsSummary/…`, `prefs` |
| `home.js` | `homeSummary/…`, `homeBriefing`, `homeTimeline` (Tagesablauf aus anderen Schlüsseln abgeleitet, keine Kopien) |

## 4. Schlüsselkatalog (Ist)

Struktur und je ein Beispiel. „abgeleitet“ = in der Datei berechnet. Anzahl in Klammern. Alle Werte fiktiv.

### 4.1 `persona.js` (MOD-HOME)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `persona` | Objekt: `name, age, city, household, work, money, health, today, weekday, weather` (Textfelder) | `name: 'Jonas Keller'`, `today: '2026-11-24T09:30:00'`; `persona.health` nennt keine Zahl zu Gewicht oder Größe, nur Ziel, kcal und Eiweiß |

### 4.2 `organisation.js` (MOD-CAL)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `events` (31) | `{id, title, start, end, category, tone, location?, repeat?, note?, allDay?}`, ISO ohne Zone | `e5` „Mittag mit Jana“, 12:30–13:30, Café Moll. Am Referenztag: `e-standup` 09:45 (werktags), `e4` 10:30, `e3` 11:00, `e5` 12:30, `e6` 15:00. |
| `tasks` (21) | `{id, title, due?, priority hoch/mittel/niedrig, project, category, status Offen/In Arbeit/Review/Erledigt, estimate?, done?, repeat?, note?, subtasks[{id,title,done}]}` | `t1` „Angebot Müller GmbH finalisieren“, fällig 24.11. 14:00, hoch, 1 von 3 Unteraufgaben erledigt. 18 offene, 4 heute fällig, 2 überfällig (`t2`, `t8`). |

### 4.3 `finance.js` (MOD-FIN; Sparen und Depot ziehen später um, Schlüsselnamen bleiben)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `accounts` (5) | `{id, name, bank, type giro/business/savings/credit/depot, balance, icon, tone, spark[], iban?, interestPa?, limit?}` | `acc-giro` 3.842,17 €; `acc-depot` 30.097,73 € |
| `netWorth` | Zahl, abgeleitet (Σ Kontostände) | 55.508,15 |
| `transactions` (26) | `{id, date, title, category, amount (negativ = Abfluss), account, type income/expense/transfer, to?, subscriptionId?, icon}` | `t1` 24.11. 08:12 REWE −38,47 € |
| `budgets` (5) | `{id, label, category, target, icon, value}`, `value` abgeleitet (Σ Ausgaben je Kategorie im November) | Freizeit 164,50 von 150 € |
| `subscriptions` (9) | `{id, name, amount, interval, day, category, icon, cancelable, noticeDays?, renewal?, lastUsedDays?, business?}` | `sub-miete` 1.150 € am 1. |
| `fixedCostsMonthly` | Zahl, abgeleitet (ohne `business`) | 1.391,96 |
| `positions` (5) | `{id, name, short, type ETF/Aktie, isin, quantity, buyPrice, price, prevClose, currency, region, sector, savingsPlanId?, tone, spark[]}` plus abgeleitet `value, cost, gain, gainPct, dayChangePct` | `p-allworld` 152,31 × 118,42 = 18.036,55 € |
| `depotCash` | Zahl | 1.250,00 |
| `depotValue` | Zahl, abgeleitet (Σ `value` + `depotCash`) | 30.097,73 |
| `depotHistory` | `{labels[12], series[{name, values[12]}]}` Dez bis Nov, „Depotwert“ und „Eingezahlt“ | letzter Wert 30.098 |
| `savingsPlans` (5) | `{id, name, positionId? oder accountId?, isin?, monthly, day, intervalMonths, startDate, active, pausedUntil?, dynamicPa, expectedReturnPa, goalId, tone}` | `sp-allworld` 300 € am 1. |
| `savingsMonthlyTotal` | Zahl, abgeleitet (Σ aktive `monthly`) | 575 |
| `savingsGoals` (4) | `{id, name, target, current, icon, tone, due, monthly, paused?}` | `g-notgroschen` 9.500 von 15.000 € |
| `watchlist` (5) | `{id, title, type, price, change, trend[], alert?{above/below}}` | `w-btc` Bitcoin 84.120 |
| `dividends` (3) | `{id, positionId, title, exDate, payDate, perShare, quantity, amount, status erwartet/gezahlt}` | Apple 1,92 €, gezahlt 13.11. |
| `taxAllowance` | `{total, used, bank, stand}` | 1.000 €, davon 312,40 € genutzt |
| `financeSummary` | flaches Objekt, abgeleitet: `netWorth, depotValue, income, expenses, saved, savingsRate, fixedCostsMonthly, savingsMonthlyTotal` | `saved` 575, `income` 7.152,40 (siehe Befund B3) |

### 4.4 `fitness.js` (MOD-FIT)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `fitnessProfile` | Objekt: `name, heightCm, gym, weeklyGoal, runGoal, stepGoal, activeMinGoal, weeklyActiveGoal, sleepGoalH, restingHr, startKg, goalKg, goalStart, lifetimeBefore, stand` | 182 cm, FitX Bielefeld, Ziel 77 kg |
| `exerciseLibrary` (32) | `{id, name, muscle, secondary[], equipment, type, level, unit kg/reps/s, step, rest, intro, steps[], …}` | `bankdruecken` |
| `trainingProgram` | `{id, name, short, level, startDate, description, progression, deload, rhythm[7], days[3 {id, name, short, dow, time, durationMin, focus, exercises[{exerciseId, sets, repLo, repHi, rest, warmup}]}], alternatives[3]}` | Mo Unterkörper, Mi Oberkörper A, Fr Ganzkörper, 18:30 |
| `workoutHistory` (21) | `{id 'h-<datum>', date, start, dayId, title, durationMin, rating, exercises[{exerciseId, sets[{type warm/work, kg, reps}]}], note, sets, volume, prs[]}` | `h-2026-11-23` Unterkörper, 58 Min. |
| `runLog` (11) | `{id 'r-<datum>', date, start, kind, km, min, paceSec, avgHr, note}` | 22.11. 9,5 km |
| `personalRecords` (15) | `{id 'pr-…', exerciseId, name, muscle, unit, type, value, kg, reps, date, previous, previousDate, recent}` | Beinpresse 1RM (geschätzt) 206,7 kg |
| `weeklyTraining` (8) | `{week, label 'KW 48', current, sessions, goal, reached, joker, minutes, sets, volume, runs, runKm, setsByMuscle}` | KW 48: 1 von 3 Einheiten |
| `volumeSeries`, `stepsSeries`, `sleepSeries` | `{labels[], series[{name, values[]}]}` | Schritte der letzten 7 Tage |
| `bodyWeightLog` (83) | `{date, kg}` | 24.11. 78,4 |
| `bodySummary` | abgeleitet: `weightKg, trendKg, startKg, goalKg, lostKg, toGoalKg, progress, weekDeltaKg, entries, bmi, perWeekKg, etaWeeks` | Trend 78,5 kg, −0,3 kg in 7 Tagen |
| `bodyMeasurements` (6) | `{id, label, unit, icon, good, points[{date, value}]}` | Taille 88,0 → 84,8 cm |
| `activityLog` (30) | `{date, steps, activeMin, km, kind, partial?}` | 24.11. 3.240 Schritte (Teiltag) |
| `stepsToday` | `{date, hourly[10], total, source}` | `source: 'Health Connect (Demo)'` |
| `activityItems` (13) | `{id, date, title, subtitle, meta, icon, tone}` | Spaziergang 2,4 km, 22 Min. |
| `sleepLog` (14) | `{date, bed, wake, hours, quality, restingHr}` | 24.11.: 23:35 bis 06:30, 6,9 Std. |
| `recoveryCheckins` (7) | `{date, energy, soreness, stress}` | 23.11.: 4, 3, 3 |
| `fitnessGoals` (5) | `{id, label, value, target, unit, icon, hint}` | `g-train` 1 von 3 |
| `fitnessStreak` | `{weeks, best, since, jokersPerQuarter, jokersLeft, paused, history[12], current}` | 12 Wochen, 1 Joker übrig |
| `fitnessMilestones` (6) | `{id, title, text, icon, tone, value, target, unit, done, date?}` | „12 Wochen in Folge“ (erreicht) |
| `weeklyRecap` | `{week, range, done[], learned, next}` | KW 47, 16.–22.11. |
| `fitnessToday` | Objekt für Start und Übersicht: `kind 'rest'`, `headline`, `next*`, `steps`, `sleepHours`, … | „Erholungstag“, morgen 18:30 Oberkörper A |
| `activeWorkout` | Sitzung `{id 'session-upperA', dayId, title, subtitle, status 'ready', elapsed, rest, exercises[…]}` | Oberkörper A, Mi 25.11. 18:30 |
| `fitnessRings` (3), `fitnessMetrics` (4) | Kennzahlen für Ringe und Kacheln | Schritte 3.240 von 9.000 |
| `fitnessSummary` | flaches Objekt, abgeleitet: `sessionsTotal, sessions8w, volume8w, plannedSets, avgSleep7, avgSteps7, workoutDays, runDays, nextWorkoutDay, todayKind, stand` | `sessionsTotal` 96 |

### 4.5 `nutrition.js` (MOD-NUT)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `nutFoods` (48) | `{id, name, category, kcal, protein, carbs, fat, fiber, sugar, satFat, salt (je 100 g/ml), unit, portions[{label, g}], brand, barcode, allergens[], tags[], fav, piece?, eur100, source}` | `f-skyr` 63 kcal, 11 g Eiweiß, Allergen `Milch` |
| `nutRecipes` (8) | `{id, title, subtitle, meal, servings, prepMin, cookMin, level, tags[], fav, tone, icon, ingredients[{foodId, g}], steps[], perServing}` | `r-lachs` Lachs mit Ofengemüse |
| `nutDiary` (44) | `{id 'd001…', date, meal, time, foodId, name, amount, grams, kcal, protein, carbs, fat, …, source, prelogged?, eventId?}` | 24.11. 07:40 Skyr natur 158 kcal |
| `nutWater` | `{goal 2500, vessels[4], entries[3], week[6]}` | heute 1.000 ml |
| `nutGoals` | `{kcal, protein, carbs, fat, fiber, water, trainingDays, trainingBonus, useTrainingBonus, includeActivity, showNumbers, setOn}` | 2.400 kcal, 140 g Eiweiß |
| `nutProfile` | `{sex, age, heightCm, weightKg, goalWeightKg, activity, goalType, pace, preset, bmr, tdee, weightTrend[]}` | 78,4 kg, 182 cm, Ziel 77 kg, BMR 1.737, TDEE 2.692, Tempo 0,27 kg pro Woche |
| `nutPlan` (23) | `{id, date, meal, kind recipe/food/out, recipeId?, foodId?, label?, servings, status planned/done, eventId?, kcal, protein, carbs, fat}` | heute Abend Lachs, 636 kcal |
| `nutShopping` | `{rangeDays, pantry[], checked{}, manual[], recipeAdds[], budgetMonth, spentMonth}` | Budget 450 €, ausgegeben 262,90 € |
| `nutTemplates` (3) | `{id, name, meal, items[{foodId, g}], kcal}` | „Meine Skyr-Bowl“ |
| `nutHistory` (35) | `{date, kcal, protein, carbs, fat, fiber, logged, partial, water}` | heute 1.490 kcal (Teiltag) |
| `nutSummary` | abgeleitet: `date, goalKcal, eatenKcal, leftKcal, protein, proteinGoal, waterMl, waterGoal, nextMeal, weightKg, goalWeightKg, foodBudgetLeft` | 1.490 von 2.400 kcal, übrig 910 |

### 4.6 `weather.js` (MOD-WET)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `wxActive` | Ort-Bündel (= `wxPlaces[0]`): `id, name, region, lat, lon, kind, saved, updated, source, current{temp, feels, code, wind, gust, …, summary}, nowcast{issued, step 5, values[{t, mm}], state, text}, hours[120], daily[10], alerts[], pollen, air, uv, sun` | Bielefeld, 6 °C, gefühlt 3 °C, Stand 09:25 |
| `wxPlaces` (8) | Orte: `bielefeld` (Standort), `hamburg` (gemerkt, Warnung Stufe 3), `lissabon` (Reise ab 12.12.), 5 Suchtreffer | |
| `wxAlertLevels` (4) | `{level 1–4, name, color, meaning, action}` (DWD-Schema, fiktiv) | Stufe 2 „Markante Wetterwarnung“ |
| `wxSettings` | `{units, clock, sensitivity, allergens[], offline, refreshMin, source, alerts{minLevel, scope, quiet…}, notify{…}}` | Allergene Birke, Gräser |
| `wxVenues` | Objekt: Ortsname → `{mode Fuß/Rad/Auto, min, outdoor, stayOutdoor?}` | Café Moll: Fuß, 8 Min. |
| `wxTraining` (4) | `{id, date, start, end, title, where, outdoor, kind}` | siehe Befund B2 |

Wetterfakt am Referenztag: Böen-Warnung Stufe 2 `wx-a1`, 14:00 bis 23:00 Uhr, Böen bis 72 km/h, ausgegeben 08:52 Uhr; `wx-a2` Stufe 1 Mi 06:00 bis 12:00; `wx-a3` Frost Do 22:00 bis Fr 09:00.

## 5. Bindung und Zugriff

### 5.1 Bindung

In `demoData` eines Features bindet `'@world:<schlüssel>'` einen Welt-Schlüssel statt Daten zu kopieren: `demoData: { items: '@world:tasks' }`. Lokale, rein featurebezogene Daten bleiben im Manifest.

**Ist**

1. **Feature-Modus:** `worldFor(state, demoData, scenario)` (`core/preview-payload.js`) legt nur die **referenzierten** Schlüssel ins Payload (`getWorld(state, scenario)` aus `core/world.js`).
2. **App-Modus (Launcher):** `buildAppPayload` übergibt die **ganze** Welt des Szenarios (`world: getWorld(…)`); zusätzlich `scenario`, `env`, `privacy` im Payload.
3. **Runtime:** `useWorld(payload.world)` hält die Welt als Zustand der Vorschau (Kopie). Lesen: Komponente fragt den Datenschlüssel, der Store löst `isWorldRef` auf (`world.data[<schlüssel>]`). Schreiben über `setData(key, wert | fn)`; bei Weltbindung geht der Schreibzugriff an die Welt, `fn` bekommt `d[key] ?? []`. Alle Screens **einer** Version teilen die Welt, zwei Versionen nebeneinander haben je eine eigene Kopie.
4. **Persistenz:** Die Welt wird nicht mehr im Zustand gespeichert (`schema.js`: `delete s.world`); sie kommt immer aus dem Code. Nur `worldOverrides` (bewusste Abweichungen, Standard leer) bleiben. Änderungen in der Vorschau gelten nur für die Sitzung.
5. **Prüfung:** `hasWorldKey(key)` (`core/world.js`) kann Bindungen validieren; `check` soll unbekannte Schlüssel melden (Ziel, INF-5).

**Ziel (Bauplan 5.4, 5.7)**: `ctx.world {get, set, add, reset}`, Nachricht `world-changed {key}`, `window.__taktPreview.resetWorld()`. Schlüssel dürfen nie entfernt oder umbenannt werden, solange ein freigegebenes Feature sie bindet.

### 5.2 Aggregat-Vertrag (Summary, Hints, Search, Notifications) — Ziel

Jedes Modul exportiert vier Schlüssel (Abschnitt 3.3). `world/index.js` aggregiert sie automatisch zu `allKpis` (je Modul-ID), `allHints`, `searchIndex`, `allNotifications`. **Start, Hub, Suche und Mitteilungen lesen nur diese Aggregate** und hängen damit nicht von einzelnen Modul-Paketen ab.

| Export | Eintrag | Pflichtfelder |
|---|---|---|
| `<m>Summary` | `{ kpis: [{ label, value, unit?, tone?, icon?, delta?, to? }] }` | `label`, `value` |
| `<m>Hints` | `{ id, text, source, module, tone, to, carry? }` | alle außer `carry` |
| `<m>Search` | `{ id, type, title, subtitle?, module, to, params? }` | `id`, `type`, `title`, `module`, `to` |
| `<m>Notifications` | `{ id, title, text, module, tone, priority 'wichtig'/'normal'/'leise', time, to, actions? }` | alle außer `actions` |

Regeln: `to` ist eine Feature-ID oder `module:<id>`; `carry` übergibt Parameter an das Ziel (`{selectedId: 'id'}`); `source` nennt den Welt-Schlüssel, aus dem der Hinweis folgt (nachvollziehbar, Bauplan 5.12); Suchindex-IDs sind `<sammlung>:<id>` (z. B. `task:t1`, `tx:t1`), weil Sammlungs-IDs sich überschneiden (Befund B4); Zeiten relativ zum Referenztag; `tone` im Gesundheitskontext nie `danger` (`HEALTH_GUIDELINES.md`).

Beispiele (Ziel, aus Ist-Daten):

```js
// calendarHints
{ id: 'h-wx-cafe', text: 'Der Weg zum Café Moll um 12:30 Uhr bleibt trocken, ab 14 Uhr gibt es Sturmböen.', source: 'wxActive.alerts[wx-a1]', module: 'calendar', tone: 'info', to: 'weather.alerts' }
// tasksSearch
{ id: 'task:t1', type: 'Aufgabe', title: 'Angebot Müller GmbH finalisieren', subtitle: 'Heute 14:00 · hoch', module: 'tasks', to: 'tasks.detail', params: { id: 't1' } }
// weatherNotifications
{ id: 'n-wx-a1', title: 'Sturmböen ab 14 Uhr', text: 'Böen bis 72 km/h, Warnstufe 2, bis 23 Uhr.', module: 'weather', tone: 'warning', priority: 'wichtig', time: '2026-11-24T08:52:00', to: 'weather.alerts' }
// nutritionSummary.kpis
{ label: 'Kalorien übrig', value: 910, unit: 'kcal', tone: 'accent', icon: 'flame', to: 'nutrition.today' }
```

**Ist:** Es gibt keine `…Hints/Search/Notifications` und keine Aggregate. Drei flache Objekte tragen den Namen `financeSummary`, `fitnessSummary`, `nutSummary`, aber **nicht** die Form `{kpis: […]}`. Empfehlung (Annahme, Entscheidung bei INF-3 und den Modul-Eigentümern): Bestehende Objekte werden **additiv** um ein Feld `kpis` ergänzt (Exportnamen bestehender Dateien bleiben); für Ernährung kommt `nutritionSummary` neu hinzu, `nutSummary` bleibt.

### 5.3 `prefs` (Eigentümer settings)

`prefs = { favorites, units, privacy, quietHours, textScale }`. Die Runtime nutzt `prefs.favorites` für die Navigation, falls gesetzt (Ziel: erste vier Favoriten plus „Mehr“). Ziel-Erweiterung für Gesundheit: `prefs.health = { hideWeight, hideKcal, habitMode }` (`HEALTH_GUIDELINES.md` Abschnitte 4 und 5). Ist: nicht vorhanden; `nutGoals.showNumbers` ist der einzige Schalter.

## 6. Szenario-Vertrag

Szenarien: **alltag** (Standard), **erststart**, **stress** (`SCENARIOS` in `core/world.js`).

| Szenario | Bedeutung | Pflicht für die Welt |
|---|---|---|
| `alltag` | die Welt wie sie ist (voller Dienstag) | keine Überschreibung |
| `erststart` | noch keine **eigenen** Daten: Leerzustände und Einladungen testen | Nutzerdaten leer; **Referenzdaten bleiben** (Bibliotheken, Orte, Katalog); abgeleitete Werte passend |
| `stress` | dreifache Listen, lange Texte, Extremwerte: Umbrüche, Überlauf, Leistung | Listen ×3 mit eindeutigen IDs, Texte +40 %, Extremwerte |

**Mechanik (Ist, `core/world.js`):**

- `applyScenario(WORLD, id)`: `alltag` unverändert; `erststart` leert jedes Array und jedes Array in Objekten bis Tiefe 2; `stress` verdreifacht Listen von Objekten (IDs der Kopien `<id>~2`, `<id>~3`, Titel mit Zusatztext) und lässt Skalare unverändert. Geschützt (nie verändert): Schlüssel von `persona.js`, `prefs`, `scenarios`.
- `WORLD.scenarios[id]` aus den Welt-Dateien überschreibt gezielt (`Object.assign`). Jede Welt-Datei darf dazu `export const scenarios = { erststart: {schlüssel: wert}, stress: {schlüssel: wert} }` liefern (Bauplan 5.5).
- Auswahl per Launcher, `preview.html?scenario=…` und Payload-Feld `scenario`.

**Anforderungen (Ziel):**

1. **Referenzdaten sind keine Nutzerdaten.** Bibliotheken (`exerciseLibrary`, `nutFoods`, `nutRecipes`), Orte (`wxPlaces`, `wxActive`), Warnstufen, Konten-Stammdaten und Einstellungen bleiben im Erststart erhalten. Welt-Dateien schützen sie über `scenarios.erststart` (Rückgabe des vollen Wertes) oder INF-3 ergänzt eine Schutzliste je Datei (Wunsch im Bericht).
2. **Abgeleitete Werte folgen.** Jede Datei überschreibt in `scenarios.erststart` und `scenarios.stress` alle abgeleiteten Schlüssel (`financeSummary`, `depotValue`, `netWorth`, `nutSummary`, `bodySummary`, `fitnessSummary`, …), damit die Invarianten aus Abschnitt 7 **in jedem Szenario** gelten.
3. **Stress mit Extremwerten:** mindestens je Modul ein Extremfall (Kontostand `9.999.999,99 €`, Name mit 60 Zeichen, Lebensmittelname mit 80 Zeichen, 12 Termine an einem Tag, „99+“ Mitteilungen, 4-stellige Wiederholungen).
4. **Erststart zeigt den Pfad in die App:** Erststart-Checkliste und Einladungen kommen aus `home.js`/`system.js` (`firstrun`-Zustand), nicht aus den Fachdaten.
5. Szenarien ändern **nie** `persona`, `prefs` und IDs bestehender Schlüssel.

## 7. Konsistenz-Invarianten (Test: `tests/world-*.test.mjs`, Eigentümer INF-5)

Jede Invariante gilt für `alltag` **und** nach `applyScenario(WORLD, 'erststart' | 'stress')`.

| Nr. | Invariante | Ist (24.11.2026) |
|---|---|---|
| W1 | Depotkonto = Positionssumme + Verrechnung: `accounts[acc-depot].balance` = Σ `positions.value` + `depotCash` (±0,01 €) und gleich `depotValue` | erfüllt (30.097,73 = 28.847,73 + 1.250,00) |
| W2 | `netWorth` = Σ `accounts.balance` (±0,01 €) | erfüllt (55.508,15) |
| W3 | Budget-Ist = Σ Beträge der Buchungen `type: 'expense'` je Kategorie im Monat | erfüllt (z. B. Lebensmittel 262,90 €) |
| W4 | **Umbuchung neutral:** `type: 'transfer'` zählt nicht in Einnahmen, Ausgaben, Budgets, Sparquote; beide Seiten haben denselben Typ | **verletzt** (Befund B3) |
| W5 | **Sparraten = Planraten:** Σ aktive `savingsPlans.monthly` = Σ Umbuchungen der Kategorie `Sparen` im Monat = `savingsMonthlyTotal` | erfüllt (575 €) |
| W6 | Sparziele: `g-notgroschen.current` = Kontostand Tagesgeld, `g-rente.current` = `depotValue`, `monthly` je Ziel = Σ Raten der Pläne mit dieser `goalId` | erfüllt |
| W7 | Position: `value` = `quantity × price`, `gain` = `value − cost` (±0,01 €) | erfüllt |
| W8 | **kcal aus Makros ±12 %** (`atwaterPlausible` in `core/health.js`: 4·Eiweiß + 4·KH + 9·Fett + 7·Alkohol, Toleranz 12 %, mindestens 5 kcal) für `nutFoods` (je 100 g) und `nutDiary` | **3 von 48** Lebensmitteln und **3 von 44** Einträgen melden (Befund B8) |
| W9 | Mahlzeitensummen = Tagessumme: `nutSummary.eatenKcal` = Σ `nutDiary` des Tages = `nutHistory[heute].kcal` | erfüllt (1.490 kcal) |
| W10 | Ziel: `nutSummary.goalKcal` = `nutGoals.kcal`; `nutGoals.kcal` ≥ Grundumsatz des Profils (`HEALTH_GUIDELINES.md` K1) | erfüllt (2.400 ≥ 1.737) |
| W11 | **Gleiche Termine in Kalender und Start:** jede `eventId` in Tagebuch, Plan, Training zeigt auf ein vorhandenes Ereignis in `events`; Start (`home.js`) liest `events`, keine Kopie | `eventId: 'e5'` erfüllt; Training verletzt (Befund B2); `home.js` fehlt |
| W12 | **Training einheitlich:** Wochenplan (`trainingProgram.days`), Kalender-Termine, `wxTraining`, `nutGoals.trainingDays` nennen dieselben Tage, Zeiten, Orte | **verletzt** (Befund B2) |
| W13 | **Profil einheitlich:** Gewicht, Größe, Zielgewicht in `persona`, `fitnessProfile`/`bodySummary`, `nutProfile`, `nutSummary` identisch | erfüllt (78,4 kg, 182 cm, Ziel 77 kg; war verletzt, Befund B1 behoben) |
| W14 | Referenzen auflösbar: `account`, `to`, `subscriptionId`, `positionId`, `savingsPlanId`, `goalId`, `foodId`, `recipeId`, `eventId`, `exerciseId` zeigen auf vorhandene Einträge | erfüllt (am Stichtag geprüft: keine Referenzfehler) |
| W15 | IDs je Sammlung eindeutig | erfüllt (`events`, `tasks`, `transactions`, `nutDiary`); sammlungsübergreifend nicht (Befund B4) |
| W16 | Zeiten relativ zum Referenztag; Einträge nach 09:30 am Referenztag sind nur geplant oder vorab erfasst | erfüllt (z. B. `prelogged: true` für das Mittagessen) |
| W17 | Szenarien erhalten W1 bis W3, W5, W9 | **verletzt** (Befund B6) |

## 8. Befunde am Stichtag (Ist ≠ Vertrag)

Diese Befunde sind nicht in meiner Datei-Liste behebbar. Sie gehen als Wünsche an die Eigentümer (Abschlussbericht).

| Nr. | Befund | Vorschlag | Eigentümer |
|---|---|---|---|
| B1 | **Profil (behoben am Stichtag):** Die Ernährung führte zunächst 82,4 kg, 183 cm, Ziel 79 kg (Grundumsatz 1.783 kcal), Fitness 78,4 kg, 182 cm, Ziel 77 kg (1.737 kcal). MOD-NUT hat `nutProfile` und `nutSummary` auf die Messreihe von `fitnessProfile` umgestellt. Rest: `persona.health` sagt „3 kg Fett verlieren“, die Daten messen Gewicht (80 → 77 kg). | Wortlaut zu „3 kg abnehmen“ ändern, sobald die Persona bestätigt wird. Kalorienziel 2.400 kcal bleibt (Tempo 0,27 kg pro Woche, `planTarget`). | MOD-HOME |
| B2 | **Training:** Fitness: Mo Unterkörper, Mi Oberkörper A, Fr Ganzkörper, 18:30, FitX Bielefeld. Kalender: `e-fitness` „Krafttraining Oberkörper“ **wöchentlich donnerstags** (Serienstart Do 05.11.), Studio Kraftwerk; kein Eintrag für Mo/Mi/Fr. Wetter (`wxTraining`): Mi 25.11. „Unterkörper“, Fr 27.11. „Oberkörper“, Studio Kraftwerk. Dazu am Mi 25.11. Physiotherapie 16:30 bis 17:30 (`e9`). | Trainingstermine entstehen aus `trainingProgram` mit gleichen IDs (`tr-<datum>`) in `events` und `wxTraining`; Studio „FitX Bielefeld“; `e-fitness` entfällt oder wird Mo/Mi/Fr. | MOD-CAL, MOD-WET, MOD-FIT |
| B3 | **Privatentnahme:** `t16` (Giro, +4.200 €) hat `type: 'income'`, die Gegenbuchung `t17` `type: 'transfer'`. `financeSummary.income` = 7.152,40 € und Sparquote 72,4 % (ohne Privatentnahme etwa 33 %). | Beide Seiten `transfer` (Gesamtsicht), Sicht benennen (`FINANCE_GUIDELINES.md` Abschnitt 5). | MOD-FIN |
| B4 | **ID-Überschneidung:** Aufgaben `t1`…`t21` und Buchungen `t1`…`t26`. | Bestehende IDs bleiben. Neue Sammlungen mit Präfix (`tx-`, `evt-`, `task-`). Suche, Hints und Deep-Links verwenden `<sammlung>:<id>`. | alle |
| B5 | **Einkaufsliste:** `nutShopping` liegt in `nutrition.js`, Eigentümer der Liste ist `shopping`. | `nutShopping` bleibt als Zutaten-Brücke; `shopping.js` besitzt die Liste und übernimmt per `carry`. | MOD-REG, MOD-NUT |
| B6 | **Szenarien (am Stichtag exportiert keine Welt-Datei `scenarios`):** Das generische `erststart` leert auch Referenzdaten (`exerciseLibrary`, `nutFoods`, `wxActive.hours`, `accounts` werden leer) und lässt abgeleitete Schlüssel stehen (`financeSummary.income` 7.152,40, `depotValue` 30.097,73, `nutSummary.eatenKcal` 1.490 bei leeren Listen). | `scenarios.erststart` je Datei (Abschnitt 6) oder Schutzliste in `core/world.js`. | alle Welt-Dateien, INF-3 |
| B7 | **Index:** `world/index.js` übernimmt per `pick` alle Exporte. Exportieren mehrere Dateien `scenarios`, **überschreibt die letzte** die anderen; `core/world.js` liest `WORLD.scenarios[id]`. | `scenarios` je Szenario und Schlüssel zusammenführen, nicht ersetzen; Aggregate ergänzen. | INF-3 |
| B8 | **Atwater:** `Brokkoli` und `Blattspinat` liegen knapp außerhalb der Toleranz (Ballaststoffe, Rundung), `Bier (Pils)` fehlt das Alkoholfeld (Alkohol 7 kcal pro g); die 3 Tagebucheinträge sind Bier. | Nährwerte nachziehen und für Alkohol ein Feld `alcohol` (g je 100 ml) ergänzen. | MOD-NUT |
| B9 | **Dateizuschnitt:** Sparen und Depot liegen in `finance.js`. | Verschieben nach `savings.js` und `trading.js`, Schlüsselnamen unverändert. | MOD-SAV, MOD-TRD |
| B10 | **Terminüberschneidung:** `e4` „Fokus: Workbench-Review“ (10:30 bis 12:00) und `e3` „Sprint-Planung“ (11:00 bis 11:45). | Absichtliche Überschneidung für `calendar.conflicts` mit `note` kennzeichnen. | MOD-CAL |
| B11 | **Sparplan am Sonntag:** `t10` „Sparplan EM IMI“ am So 15.11. gebucht. | Auf den nächsten Handelstag (Mo 16.11.) legen (`FINANCE_GUIDELINES.md` Abschnitt 8). | MOD-FIN, MOD-SAV |
| B12 | **Sparplan ohne Ziel:** `sp-tech` (World IT, 50 €) hat `goalId: null`, die Positionen von All-World und Emerging Markets führen zu `g-rente` (375 €). Die Altersvorsorge zeigt damit 375 € statt 425 € pro Monat, obwohl alle drei Positionen im Depot liegen. | Entscheiden, ob World IT zur Altersvorsorge zählt (`goalId: 'g-rente'`, Rate 425 €) oder bewusst ohne Ziel bleibt (dann im Ziel-Text erwähnen). W5 ist davon nicht berührt. | MOD-SAV |

## 9. Regeln für neue Daten

1. **Zeiten relativ zum Referenztag** `2026-11-24`: eine Konstante je Datei aus `lib/date.js` (`DEFAULT_TODAY`, `toIsoDay`, `addDays`), davon abgeleitet `d(-6)`, `d(1)`. Verboten sind `Date.now()`, `new Date()` ohne Argument und `Math.random()`. Zufallsähnliches nur mit festem Seed (Beispiel: `rng(2411)` in `fitness.js`).
2. **IDs stabil:** deterministisch, nie umbenennen, nie wiederverwenden, keine Reihenfolgeabhängigkeit. Bestehende Präfixe bleiben (`e`, `t`, `h-<datum>`, `r-<datum>`, `d001`). Neue Sammlungen bekommen sprechende Präfixe. Stress-Kopien tragen `~<n>`.
3. **Keine Kopien:** Eine Zahl, die in mehreren Modulen vorkommt, steht beim Eigentümer (Abschnitt 3.2). Andere verlinken per ID (`eventId`, `positionId`, `goalId`, `foodId`) oder leiten ab. Abgeleitete Summen, Quoten, Trends werden **in der Datei berechnet**.
4. **Referenzen müssen auflösen** (W14). Keine verwaisten IDs.
5. **Fiktiv und plausibel:** Beträge, Kurse, Nährwerte, Orte sind erfunden (ISINs der Demo sind real, Werte nicht). Nährwerte tragen `source: 'Demo-Daten (…)'`. Keine echten Personendaten.
6. **Namensraum:** camelCase, bei Mehrdeutigkeit Modulpräfix (`nut…`, `wx…`, `fitness…`, `savings…`). Schlüssel werden **nie entfernt oder umbenannt**, solange ein Feature sie bindet; Strukturänderungen sind **additiv**.
7. **Leitplanken:** Gesundheitstexte nach `HEALTH_GUIDELINES.md` (keine Verbotsbegriffe, Überschreitung nicht rot), Finanztexte nach `FINANCE_GUIDELINES.md`, Du-Form und Umlaute nach `TEXT_STIL.md`.
8. **Größe:** Seed insgesamt unter 1,6 MB (Bauplan 10). Große Reihen (Wetterstunden, Verläufe) werden **generiert**, nicht als Literal getippt.
9. **Szenarien mitdenken** (Abschnitt 6): neuer Schlüssel = Entscheidung „Nutzerdaten, Referenzdaten oder abgeleitet?“ und, wo nötig, Eintrag in `scenarios`.
10. **Änderung am Seed:** `SEED_VERSION` erhöhen, wenn Manifeste betroffen sind; die Welt selbst kommt immer aus dem Code und braucht keine Migration.

## 10. Prüfung

| Prüfung | Wo | Status |
|---|---|---|
| Invarianten W1 bis W17 | `tests/world-*.test.mjs` (Namensraum von INF-5), `npm test` | Ziel; Ist: Stichproben am Stichtag per Wegwerf-Skript geprüft (Ergebnis in Abschnitt 7). `tests/core-world.test.mjs` prüft nur die Szenario-Mechanik (leer, verdreifacht, eindeutige IDs), nicht die Invarianten |
| Unbekannter Welt-Schlüssel in `demoData` | `tools/check.mjs` (`hasWorldKey`) | Ziel |
| `Date.now()`, `new Date()` ohne Argument, `Math.random()` in `seed/world/**` | `tools/check.mjs` | Ziel |
| Aggregat-Form (`kpis`, `Hints`, `Search`, `Notifications`) | `tools/check.mjs` und Test | Ziel |
| Szenarien: W1 bis W3, W5, W9 nach `applyScenario` | `tests/world-scenarios.test.mjs` | Ziel |
| Seed-Größe unter 1,6 MB | `tools/check.mjs` | Ziel (Bauplan 10) |

## 11. Offene Punkte

- **Persona bestätigen oder ändern** (Entscheidung offen). Bis dahin alle Persona-Daten Platzhalter.
- **Führende Werte** für Studio und Trainingstage (Befund B2): Vorschlag steht in Abschnitt 8. Gewicht, Größe und Zielgewicht sind seit dem Stichtag einheitlich (B1 behoben).
- **Aggregate und `prefs`**: Zuständigkeit INF-3 (Aggregation) und MOD-SET (`prefs`).
- **Abgrenzung Sparen/Trading/Finanz-Datei** (B9): Reihenfolge der Verschiebung, ohne Schlüssel zu ändern.
