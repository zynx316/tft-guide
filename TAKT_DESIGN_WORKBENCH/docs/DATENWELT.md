# Datenwelt der Persona „Ein Tag“ (Verträge, Schlüssel, Eigentümer)

> **Stand:** 24.11.2026, Integration „Datenwelt“ (Paket welt): alle Module haben eine Welt-Datei, die Invarianten W1 bis W17 sind als Test umgesetzt (`tests/world-invariants.test.mjs`), die Befunde B2, B3, B8, B10, B11 und B12 sind behoben · **Referenztag:** Di, 24.11.2026, 09:30 Uhr (`DEFAULT_TODAY`)
> **Gültigkeit:** verbindlich für `app/src/seed/world/**` und für jede Bindung `'@world:<schlüssel>'`. Gilt, bis eine Entscheidung im Entscheidungslog sie ändert. Die Persona ist ein **Platzhalter**, bis der Nutzer sie bestätigt (Abschnitt 2).
> **Zugehörige Dateien:** `app/src/seed/world/*.js` (Hilfen in `_util.js`, kein Welt-Teil) · `app/src/core/world.js` (`getWorld`, `applyScenario`, `SCENARIOS`, `hasWorldKey`) · `app/src/core/preview-payload.js` (`worldFor`, `buildAppPayload`) · `app/src/preview/runtime.js` (`useWorld`, Screen-Kontext) · `app/src/core/schema.js` (`worldOverrides`) · `docs/PERSONA.md` · `docs/BAUPLAN.md` (5.5, 5.7, 5.13, 12) · `docs/HEALTH_GUIDELINES.md`, `docs/FINANCE_GUIDELINES.md` · `docs/TEXT_STIL.md`.
> **Ist und Ziel:** „Ist“ ist der Code nach der Integration, „Ziel“ der Vertrag für neue Arbeit. Bewusste Abweichungen stehen in Abschnitt 8 (offene Befunde) und Abschnitt 11.

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

Eine Datei = ein Eigentümer-Paket. Jeder **benannte Export, der keine Funktion ist**, wird ein Welt-Schlüssel (`pick()` in `world/index.js` filtert Funktionen heraus). Funktionen dürfen für Hilfen exportiert werden und sind keine Schlüssel. `_util.js` enthält gemeinsame Hilfen (`triple`, `at`, `eventsOn`, `eur` …) und wird von `index.js` nicht als Welt-Teil geladen.

| Datei | Eigentümer-Paket | Modul(e) | Stand |
|---|---|---|---|
| `index.js` | INF-3 / welt | Aggregation (`allKpis`, `allHints`, `searchIndex`, `allNotifications`), `scenarios` je Datei sammeln | vorhanden, 216 Schlüssel |
| `persona.js` | MOD-HOME | home (Persona) | vorhanden, 1 Schlüssel |
| `home.js` | MOD-HOME | home (Kennzahlen, Mitteilung Wochenrückblick) | vorhanden; Briefing und Tagesablauf bleiben abgeleitet in den Start-Komponenten |
| `organisation.js` | MOD-CAL | calendar, tasks | vorhanden (Termine inkl. Trainingsserien, Aufgaben, Eingang, Fokus, Aggregate) |
| `finance.js` | MOD-FIN | finance (**enthält bis zum Umzug B9 zusätzlich Sparen und Depot**) | vorhanden |
| `savings.js` | MOD-SAV | savings (Aggregate; Daten noch in `finance.js`) | vorhanden |
| `trading.js` | MOD-TRD | trading (Alarme, Orders, Käufe, Soll-Anteile, Vergleichsindex, Aggregate) | vorhanden |
| `fitness.js`, `nutrition.js`, `weather.js` | MOD-FIT, MOD-NUT, MOD-WET | fitness, nutrition, weather | vorhanden |
| `knowledge.js` | MOD-KB | knowledge **und** notes (`notes`, `articles`) | vorhanden |
| `scans.js` | MOD-PTT | picture-to-text (Erfassungen, Belege, Visitenkarten) | vorhanden |
| `sales.js` | MOD-SAL | sales (Kanäle, Bestellungen, Sync-Protokoll) | vorhanden |
| `habits.js` | MOD-HAB | habits (Gewohnheiten, Routinen; Start bindet dieselben) | vorhanden |
| `system.js` | MOD-SYS | system (Papierkorb, Kennzahlen) | vorhanden |
| `settings.js` | MOD-SET | settings (`prefs`, Sicherungen) | vorhanden |
| `goals.js` | MOD-HAB | goals (Ziel-Definitionen, Lebensbereiche; Werte nur aus den Quellmodulen abgeleitet) | vorhanden (Abschnitt 4.14) |
| `shopping.js` | MOD-REG | shopping (Listen, Läden, Vorräte, Haushaltswartung, Einkäufe; Lebensmittel-Liste noch in `nutShopping`, B5) | vorhanden (Abschnitt 4.15) |
| `documents.js` | MOD-REG | documents (Dokumente, Ordner, Verträge abgeleitet aus Finanzen, Garantien, Steuerordner) | vorhanden (Abschnitt 4.16) |

Die Welt enthält 216 Schlüssel (`Object.keys(WORLD)`); `searchIndex` hat 223 Einträge, `allNotifications` 24, `allHints` 36 (19 Module).

### 3.2 Eigentümer je Datenobjekt (Bauplan 5.13)

| Datenobjekt | Eigentümer | Andere Module |
|---|---|---|
| Einkaufsliste, Vorräte, Haushaltswartung | shopping | Ernährung liefert Zutaten per Verknüpfung (`carry`) |
| Abos und Verträge | Fristen und Dokumente: documents; laufende Kosten und Summen: finance (`subscriptions`, `financeSubMeta`) | documents leitet `contracts` daraus ab (Beträge und Kündigungsfristen exakt wie Finanzen) und verlinkt zurück (`cost.open`) |
| Ziele | goals (Definition, Meilensteine, Wochenfokus) | Werte kommen immer aus der Quelle (Sparziele, Gewicht, Training, Umsatz, Serien, Aufgaben); ein Ziel speichert nie einen Quellwert, zu einer Quelle höchstens ein Ziel |
| Garantien, Steuerordner | documents | Steuerordner enthält nur Verweise auf Buchungen, Belege, Dokumente und Abos |
| Schlaf und Check-in | fitness.recovery | kein Journal-Modul in Basis v1 |
| Wasser | nutrition.water | Start zeigt Kachel, Gewohnheiten verknüpfen nur |
| Fokuszeit | tasks.focus (`focusMinutes` aus der Aufgaben-Welt) | Start und Kalender lesen |
| Steuer | Sicht: trading.tax; Selbstständigen-Rücklagen: finance.business (Skelett); Belege-Ordner: documents | |
| Sparpläne und Sparziele | savings (`savingsPlans`, `savingsGoals`) | goals zeigt Sparziele nur als Quelle |
| Depot, Positionen, Watchlist, Dividenden | trading | finance rechnet `depotValue` aus trading |
| Termine, Aufgaben | organisation-Welt (calendar, tasks) | Training und Mahlzeiten erzeugen Termine/Aufgaben nur über Welt-Einträge mit gleichen IDs |
| Persona | home (`persona.js`) | |
| Einstellungen (`prefs`), Sicherungen | settings | Runtime liest `prefs.favorites` für die Navigation |
| Notizen | knowledge (`notes`) | Erfassen legt Notizen hier an (`inbox: true`), Bildtext-Erkennung, Suche und Start lesen |
| Artikel | knowledge (`articles`) | |
| Erfassungen, Belege, Visitenkarten | picture-to-text (`captures`, `receipts`, `businessCards`) | Buchung entsteht in Finanzen, Notiz in `notes` |
| Kanäle, Bestellungen | sales (`channels`, `orders`) | Finanzen sieht nur die Auszahlungen als Buchungen |
| Gewohnheiten, Routinen | habits (`habits`, `routines`) | Start bindet dieselben Listen; Training zählt aus Fitness, Wasser aus Ernährung |
| Kursalarme, simulierte Orders, Käufe, Soll-Anteile, Vergleichsindex | trading (`tradingAlerts`, `tradingOrders`, `tradingTrades`, `tradingTargets`, `tradingBenchmark`) | |
| Papierkorb | system (`trash`) | |
| Eingang (unsortierte Erfassungen) | tasks (`taskInbox`) | system zählt ihn in `systemSummary`; Notizen aus Erfassen gehen nicht dorthin |

### 3.3 Pflicht-Exporte je Welt-Datei

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
| `knowledge.js` | `knowledgeSummary/Hints/Search/Notifications`, `notesSummary/Hints/Search/Notifications`, `scenarios` |
| `scans.js` | `pictureToTextSummary/…` |
| `sales.js` | `salesSummary/…`, `scenarios` (Fehlerzustand „Etsy-Token abgelaufen“) |
| `habits.js` / `goals.js` | `habitsSummary/…` / `goalsSummary/…` |
| `documents.js` / `shopping.js` | `documentsSummary/…` / `shoppingSummary/…` |
| `system.js` | `systemSummary/Hints/Search/Notifications`, `trash` |
| `settings.js` | `settingsSummary/…`, `prefs` |
| `home.js` | `homeSummary/Hints/Search/Notifications` (Briefing und Tagesablauf bleiben abgeleitet in den Komponenten, keine Kopien) |

## 4. Schlüsselkatalog (Ist)

Struktur und je ein Beispiel. „abgeleitet“ = in der Datei berechnet. Anzahl in Klammern. Alle Werte fiktiv.

### 4.1 `persona.js` (MOD-HOME)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `persona` | Objekt: `name, age, city, household, work, money, health, today, weekday, weather` (Textfelder) | `name: 'Jonas Keller'`, `today: '2026-11-24T09:30:00'`; `persona.health` nennt keine Zahl zu Gewicht oder Größe, nur Ziel, kcal und Eiweiß |

### 4.2 `organisation.js` (MOD-CAL)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `events` (53) | `{id, title, start, end, category, tone, location?, repeat?, note?, allDay?}`, ISO ohne Zone | `e5` „Mittag mit Jana“, 12:30–13:30, Café Moll. Am Referenztag: `e-standup` 09:45 (werktags), `e4` 10:30, `e3` 11:00 (Überschneidung gewollt, in `note` benannt), `e5` 12:30, `e6` 15:00. Krafttraining als drei Wochenserien `e-fit-lower`, `e-fit-upperA`, `e-fit-full` (Mo/Mi/Fr 18:30, FitX Bielefeld) aus `trainingProgram`. `legacyEvents()` liefert den ursprünglichen Stand der freigegebenen Features unverändert. |
| `tasks` (21) | `{id, title, due?, priority hoch/mittel/niedrig, project, category, status Offen/In Arbeit/Review/Erledigt, estimate?, done?, repeat?, note?, subtasks[{id,title,done}]}` | `t1` „Angebot Müller GmbH finalisieren“, fällig 24.11. 14:00, hoch, 1 von 3 Unteraufgaben erledigt. 18 offene, 4 heute fällig, 2 überfällig (`t2`, `t8`). |

### 4.3 `finance.js` (MOD-FIN; Sparen und Depot ziehen später um, Schlüsselnamen bleiben)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `accounts` (5) | `{id, name, bank, type giro/business/savings/credit/depot, balance, icon, tone, spark[], iban?, interestPa?, limit?}` | `acc-giro` 3.842,17 €; `acc-depot` 30.097,73 € |
| `netWorth` | Zahl, abgeleitet (Σ Kontostände) | 55.508,15 |
| `transactions` (26) | `{id, date, title, category, amount (negativ = Abfluss), account, type income/expense/transfer, to?/from? (Gegenkonto einer Umbuchung), subscriptionId?, icon}` | `t1` 24.11. 08:12 REWE −38,47 €; `t16`/`t17` Privatentnahme: beide Seiten `transfer`; `t10` Sparplan EM IMI am Mo 16.11. (nicht am Sonntag) |
| `budgets` (5) | `{id, label, category, target, icon, value}`, `value` abgeleitet (Σ Ausgaben je Kategorie im November) | Freizeit 164,50 von 150 € |
| `subscriptions` (9) | `{id, name, amount, interval, day, category, icon, cancelable, noticeDays?, renewal?, lastUsedDays?, business?}` | `sub-miete` 1.150 € am 1. |
| `fixedCostsMonthly` | Zahl, abgeleitet (ohne `business`) | 1.391,96 |
| `positions` (5) | `{id, name, short, type ETF/Aktie, isin, quantity, buyPrice, price, prevClose, currency, region, sector, savingsPlanId?, tone, spark[]}` plus abgeleitet `value, cost, gain, gainPct, dayChangePct` | `p-allworld` 152,31 × 118,42 = 18.036,55 € |
| `depotCash` | Zahl | 1.250,00 |
| `depotValue` | Zahl, abgeleitet (Σ `value` + `depotCash`) | 30.097,73 |
| `depotHistory` | `{labels[12], series[{name, values[12]}]}` Dez bis Nov, „Depotwert“ und „Eingezahlt“ | letzter Wert 30.098 |
| `savingsPlans` (5) | `{id, name, positionId? oder accountId?, isin?, monthly, day, intervalMonths, startDate, active, pausedUntil?, dynamicPa, expectedReturnPa, goalId, tone}` | `sp-allworld` 300 € am 1. |
| `savingsMonthlyTotal` | Zahl, abgeleitet (Σ aktive `monthly`) | 575 |
| `savingsGoals` (4) | `{id, name, target, current, icon, tone, due, monthly (= Σ Raten der Pläne mit dieser goalId, abgeleitet), paused?}` | `g-notgroschen` 9.500 von 15.000 €; `g-rente` 425 € pro Monat (All-World 300 + EM 75 + World IT 50) |
| `watchlist` (5) | `{id, title, type, price, change, trend[], alert?{above/below}}` | `w-btc` Bitcoin 84.120 |
| `dividends` (3) | `{id, positionId, title, exDate, payDate, perShare, quantity, amount, status erwartet/gezahlt}` | Apple 1,92 €, gezahlt 13.11. |
| `taxAllowance` | `{total, used, bank, stand}` | 1.000 €, davon 312,40 € genutzt |
| `financeSummary` | flaches Objekt, abgeleitet (Funktion `summaryOfFinance`): `netWorth, depotValue, income, expenses, saved, savingsRate, fixedCostsMonthly, savingsMonthlyTotal`, zusätzlich `kpis` | `income` 2.952,40 €, `expenses` 1.975,52 €, `saved` 575 €, `savingsRate` 33 % (Umbuchungen zählen nicht, W4) |

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
| `nutFoods` (48) | `{id, name, category, kcal, protein, carbs (verfügbar), fat, fiber, sugar, satFat, salt, alcohol? (g je 100 g/ml, 7 kcal je g), je 100 g/ml, unit, portions[{label, g}], brand, barcode, allergens[], tags[], fav, piece?, eur100, source}` | `f-skyr` 63 kcal, 11 g Eiweiß, Allergen `Milch` |
| `nutRecipes` (8) | `{id, title, subtitle, meal, servings, prepMin, cookMin, level, tags[], fav, tone, icon, ingredients[{foodId, g}], steps[], perServing}` | `r-lachs` Lachs mit Ofengemüse |
| `nutDiary` (44) | `{id 'd001…', date, meal, time, foodId, name, amount, grams, kcal, protein, carbs, fat, …, source, prelogged?, eventId?}` | 24.11. 07:40 Skyr natur 158 kcal |
| `nutWater` | `{goal 2500, vessels[4], entries[3], week[6]}` | heute 1.000 ml |
| `nutGoals` | `{kcal, protein, carbs, fat, fiber, water, trainingDays, trainingBonus, useTrainingBonus, includeActivity, showNumbers, setOn}` | 2.400 kcal, 140 g Eiweiß; `trainingDays` aus `trainingProgram.days` (Mo, Mi, Fr) |
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
| `wxTraining` (5) | `{id, eventId, date, start, end, title, where, outdoor, kind}`, aus `trainingProgram` abgeleitet; `eventId` zeigt auf die Kalenderserie (`e-fit-…`) bzw. `e20` (Wanderung) | Mi 25.11. 18:30 Oberkörper A, FitX Bielefeld |

Wetterfakt am Referenztag: Böen-Warnung Stufe 2 `wx-a1`, 14:00 bis 23:00 Uhr, Böen bis 72 km/h, ausgegeben 08:52 Uhr; `wx-a2` Stufe 1 Mi 06:00 bis 12:00; `wx-a3` Frost Do 22:00 bis Fr 09:00.

### 4.7 `savings.js`, `trading.js` (Aggregate und Trading-Daten)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `savingsSummary`, `savingsHints`, `savingsSearch`, `savingsNotifications` | Vertrag 5.2, aus `savingsPlans` und `savingsGoals` abgeleitet | „4 von 5 Sparpläne aktiv“, nächste Ausführung 01.12. (500 € an diesem Tag) |
| `tradingAlerts` (6) | `{id, securityId, dir above/below, price, status aktiv/ausgelöst/pausiert, created, triggeredAt?}` | `al1` NVIDIA unter 115 |
| `tradingOrders` (3) | `{id, securityId, side, type markt/limit/stop, qty, limit?/stop?, price, fee, total, status offen/simuliert, validity, created}` | `o1` Allianz Limit 280 (Simulation) |
| `tradingTrades` (4) | `{id, date, side buy/sell, securityId, qty, price, buyPrice?, fee}` | `tr-sap-v` Verkauf SAP am 14.08. |
| `tradingTargets` | `{ <positionId oder cash>: Prozent }`, Summe 100 | All-World 60 % |
| `tradingBenchmark` | `{name, labels[12], values[12]}` | Welt-Index (fiktiv), Start 100 |
| `tradingSummary`, `tradingHints`, `tradingSearch`, `tradingNotifications` | Vertrag 5.2 | „5 Positionen im Depot“, Alarm „nah“ bei höchstens 3 % Abstand |

### 4.8 `knowledge.js` (Notizen und Wissen)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `notes` (13) | `{id, title, body (Markdown), tags[], pinned?, archived?, inbox?, updated}` | `n1` „Ideen TAKT V2“; 3 Notizen im Eingang (`inbox: true`); „Erfassen › Notiz“ legt hier an |
| `notesHistory` (4), `notesLinks` (3) | Verlauf, Verknüpfungen (Aufgabe, Termin, Artikel) | |
| `notesMetrics` (4), `notesTagChart` | abgeleitet aus `notes` | 9 Notizen, 12 offene Punkte |
| `knowledgeAreas` (3) | `{id, name, icon, tone}`, Grundstruktur (bleibt im Ersten Start) | Technik, Arbeit & Prozesse, Persönlich |
| `articles` (14) | `{id, area, category, title, author, tags[], updated, related[], body, bookmarked?, lastRead?, readProgress?, status? draft}` | `kb1` Git-Workflow im Team; Trainingsplan (`kb10`) nennt Mo Unterkörper, Mi Oberkörper A, Fr Ganzkörper |
| `articleCards`, `articleItems`, `articleRecent`, `articleBookmarkCards`, `articleBookmarkItems`, `articleDrafts`, `knowledgeAreaChart`, `knowledgeMetrics` | abgeleitet aus `articles` (Karten, Listen, Diagramm, Kennzahlen) | 12 veröffentlicht, 4 Lesezeichen, 2 Entwürfe, 2 „zu prüfen“ |
| `notesSummary`, `knowledgeSummary` + Hints/Search/Notifications | Vertrag 5.2 | |

### 4.9 `scans.js` (Picture to Text)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `captures` (11) | `{id, title, source camera/file/clipboard, text, lang, confidence, uncertain[{word, alt, conf}], created, kind text/receipt/card/document, receiptId?, cardId?}`, neueste zuerst | `c1` Quittung Bäckerei Hoffmann, 97 % |
| `captureSamples` (4) | Beispielbilder für „Text erkennen“ (Simulation, Referenzdaten) | |
| `receipts` (4) | `{id, captureId, merchant, date, time, total, vatRate, category, account, payment, status offen/gebucht, lines[]}`; `r3` (Thalia) ist **bewusst** eine Dublette zur Buchung `t9` (Dublettenprüfung) | `r1` 4,50 € offen |
| `businessCards` (2) | `{id, captureId, name, title, company, phone, email, …}` | `k2` Tim Brandt, Kanzlei Brandt (Steuerberater im Kalender `e17`) |
| `capturesToReview`, `capturesMetrics`, `capturesBySource` | abgeleitet | 6 Erfassungen mit unsicheren Wörtern |
| `pictureToTextSummary` + Hints/Search/Notifications | Vertrag 5.2 | |

### 4.10 `sales.js`

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `channels` (5) | `{id, name, status connected/error/paused, lastSync, revenue (30 Tage), orders, delta, trend[], log[], error?}` | Etsy: Zugriffstoken abgelaufen (bewusster Fehlerzustand) |
| `orders` (11) | `{id, number, customer, channel, channelId, status new/paid/shipped/delivered, lines[], shipping, total, date, history[]}`; `total` = Σ Positionen + Versand | `o1` #4185, 69,60 € |
| `salesMetrics`, `salesMetricsRevenue`, `salesRevenue`, `salesShares`, `salesRows`, `salesStageChart`, `salesSyncLog` | abgeleitet aus `orders` und `channels` | Umsatz heute 281,89 € (3 Bestellungen) |
| `salesSummary` + Hints/Search/Notifications | Vertrag 5.2 | „6 Bestellungen offen“ |

### 4.11 `habits.js`

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `habits` (7) | `{id, name, icon, tone, daypart, time, rhythm{type daily/weekdays/perWeek}, goal?{target, unit, step}, since, link?, log{ISO-Tag: Zahl}, note}` | Wasser heute 4 von 10 Gläsern (= 1.000 ml aus `nutWater`); Krafttraining ab 05.10. aus `workoutHistory` |
| `routines` (2) | `{id, name, icon, time, steps[{id, title, minutes, habitId?}], log}` | Morgenroutine, Abendroutine |
| `habitHintCards` (3) | Hinweiskarten der Gewohnheiten (Format der Komponente `hint-cards`) | |
| `habitsSummary` + Hints/Search/Notifications | Vertrag 5.2 | „2 von 7 heute erledigt“ |

Start und Gewohnheiten binden **dieselben** Schlüssel (`@world:habits`, `@world:routines`): ein Haken auf „Start“ erscheint in „Gewohnheiten – Heute“ (Test `world-invariants`).

### 4.12 `home.js`, `system.js`, `settings.js`

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `homeSummary`, `homeHints`, `homeSearch`, `homeNotifications` | Vertrag 5.2 | „4 Aufgaben heute fällig“ |
| `trash` (7) | `{id, title, module, kind, deletedAt, detail?, payload?}` (30 Tage Aufbewahrung) | `tr1` Altes Angebot Schmidt |
| `systemSummary` + Hints/Search/Notifications | Vertrag 5.2 | „10 im Eingang“ (7 Aufgaben-Eingang + 3 Notizen) |
| `prefs` | `{favorites, enabled, theme, density, textScale, reduceMotion, privacy, quietHours, notify, region}` – **identisch** mit `DEFAULT_PREFS` in `crosscut/_system.js` (Test) | Favoriten Start, Kalender, Aufgaben, Finanzen |
| `backups` (5) | `{id, at, size, kind auto/manual}` | heute 03:00, 6,9 MB |
| `settingsSummary` + Hints/Search/Notifications | Vertrag 5.2 | „19 von 19 Module aktiv“ |

### 4.14 `goals.js` (MOD-HAB, Modul „Ziele“)

Rechenlogik rein in `library/components/goals/_calc.js` (auch von Welt und Tests importiert).

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `goals` (10) | `{id, title, why, area, since, due?, focus?, hideNumbers?, rolling?, status?('paused'), source{type savings/weight/training/sales/habit/checklist/manual, ref?, module, label, to, link?}, measure?{unit,start,target}, snapshots?[{date,value}] (nur eigene Zähler), milestones[{id,title, at \| taskId \| done}], nextTaskId?, nextHint?}` | `g-japan` verweist per `source.ref` auf `savingsGoals[g-japan]`; `g-blackfriday` als Checkliste mit Aufgaben t6, t3, t9 |
| `goalAreas` (4) | `{id, name, icon, tone, hint}`: gesundheit, finanzen, business, persoenlich (bleibt im Ersten Start) | |
| `goalsSummary` + Hints/Search/Notifications | Vertrag 5.2; erste Kennzahl ohne Betrag („6 von 10 Ziele im Plan“); Such-IDs `ziel:<id>` (`goal:` nutzt `savingsSearch` für Sparziele) | |

Nur gelesen: `savingsGoals`, `bodySummary`, `bodyWeightLog`, `weeklyTraining`, `fitnessStreak`, `channels` (Umsatz 30 Tage, kein eigener Monatsumsatz), `habits`, `tasks` („Erledigt“ in Ziele schreibt in `tasks`). Wochenfokus = Flag `focus` (höchstens 3). Gesundheitsziele: Zahlen per `hideNumbers` ausblendbar (auch in `aria-label`), nie „hinter dem Plan“. Szenarien: Erststart leer (Bereiche bleiben, Einladung „Ziel anlegen“), Stress ×3 (Wochenfokus bleibt bei den drei Originalen). Tests: `goals-calc`, `goals-world`.

### 4.15 `shopping.js` (MOD-REG, Modul „Einkauf & Haushalt“)

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `shoppingLists` (3) | `{id, name, icon, tone, kind food/custom, storeId, shared, aisles?, items[{id, name, qty, aisle, done, price?, note?, for?}]}`; `sl-food` ist nur der Verweis auf `nutShopping` (ohne `items`) | Drogerie 5, Baumarkt 5 Artikel (`for` = Wartung, z. B. Filtermatte → `hh-dunstabzug`) |
| `shoppingStores` (4) | `{id, name, short, kind, icon, tone, note, aisles[] in Laufweg-Reihenfolge}` | REWE Bielefeld-Mitte (Kühlware zuletzt), Wochenmarkt, dm, Baumarkt |
| `shoppingPantry` (11) | `{id, name, foodId?, aisle, level ok/low/empty, listId?, note, refill?}`; bei Lebensmitteln gilt `ok` ⇔ `foodId` in `nutShopping.pantry` | 5 knapp |
| `householdTasks` (6) | `{id, name, area, icon, tone, rule (core/recurrence.js), lastDone, since, minutes, note, taskId}` | Waschmaschine 7 Tage überfällig, Dunstabzug heute |
| `householdTemplates` (6) | Vorschläge zum Übernehmen (Referenzdaten, bleiben im Erststart) | |
| `shoppingTrips` (4) | `{id, status geplant/erledigt, date, time, storeId, listId, transactionId?, total?}`; erledigte verweisen auf `t1`, `t8`, `t11` (gleicher Betrag) | geplant Do 26.11. 17:30 |
| `shoppingSummary` + Hints/Search/Notifications | aus den Daten berechnet (`shoppingSummaryOf` in `library/components/shopping/_logic.js`); Lebensmittel-Budget übrig = `nutSummary.foodBudgetLeft` = Finanz-Budget `b-food`; Such-IDs `slist:`, `sitem:`, `hhtask:`, `spantry:`, `sstore:` | 37 Artikel offen, 2 Wartungen fällig |

Querbezüge: Budget nur gelesen; „Einkauf fertig“ öffnet `finance.quickadd` mit Vorbelegung (`ctx.ui.prefill`); „Als Aufgabe planen“ legt eine Aufgabe in `tasks` an. Szenarien: Erststart nur leere Lebensmittel-Liste, Läden und Vorschläge; Stress ×3. Tests: `shopping-logic`, `shopping-world` (S1–S8).

### 4.16 `documents.js` (MOD-REG, Modul „Dokumente & Verträge“)

Fristenlogik rein in `library/components/documents/_deadlines.js` (dringend bis 3 Tage, bald 14, im Blick 30, Horizont 90; Garantie-Enden mit Monatsende-Klemmung).

| Schlüssel | Struktur | Beispiel |
|---|---|---|
| `documents` (20) | `{id 'doc-…', title, folderId, type, date, added, pages, format, size, source, tags[], excerpt?, validUntil?, contractId?, warrantyId?, sensitive?, links?}` | Reisepass gültig bis in 86 Tagen |
| `documentFolders` (7) | `{id 'f-…', name, icon, tone, desc, retention}` (bleibt im Erststart) | |
| `contracts` (9) | **abgeleitet** aus `subscriptions` + `financeSubMeta` (`ct-<subscriptionId>`; Betrag, Intervall, Kündigungsfrist exakt wie Finanzen) plus eigene Felder `kind, provider, termStart, customerNo, cancelTo, reminder{on, days[30,14,3]}` | Kfz-Versicherung 6 Tage, FitX 9 Tage |
| `warranties` (5) | `{id 'w-…', title, purchaseDate, price, legalMonths 24, makerMonths, legalEnd/makerEnd abgeleitet, documentId (Kaufbeleg), store, category, business}` | Etikettendrucker: Gewährleistung endet in 3 Tagen |
| `taxFolder` | `{year, due, advisor{eventId e17, cardId k2}, formats[], lastExport, categories[{id, refs[{kind tx/receipt/doc/sub/missing, id}]}]}` – nur Verweise | 3 offene Nachweise |
| `documentsSummary` + Hints/Search/Notifications | erste Kennzahl „Fristen in 30 Tagen“ (nicht monetär); Suche liefert Dokumente und Garantien (Verträge kommen als Abo aus `financeSearch`); keine Kündigungs-Mitteilungen (die meldet Finanzen) | |

Querbezüge: Kosten-Link zu `finance.subscriptions`, Scan über `picture-to-text.scanner`, Termin `e17` (Kanzlei Brandt), „Kündigung vorbereiten“ kann eine Aufgabe anlegen, Modulsperre schreibt `prefs.privacy.sensitive`. Szenarien: Erststart leer außer Ordnern und Steuer-Kategorien; Stress leitet Verträge aus den ×3-Abos ab. Tests: `documents-deadlines`, `documents-manifest`, `documents-world`.

### 4.13 Aggregate (`index.js`)

| Schlüssel | Struktur |
|---|---|
| `allKpis` | `{ <modul-id>: kpis[] }` für alle 19 Module |
| `allHints` | alle `<m>Hints`, in Modulreihenfolge |
| `searchIndex` | alle `<m>Search`, IDs `<sammlung>:<id>`, eindeutig |
| `allNotifications` | alle `<m>Notifications`, neueste zuerst |

Dublettenschutz in der Suche: Die Komponente `global-search` baut Aufgaben, Termine, Buchungen, Konten, Sparpläne, Depot, Rezepte und Lebensmittel selbst aus den Sammlungen (Slots). Darum nennen `tasksSearch`, `calendarSearch`, `financeSearch`, `savingsSearch`, `tradingSearch` und `nutritionSearch` nur **weitere** Objekte (Eingang, Kalenderquellen, Abos, Budgets, Sparziele, Watchlist, Alarme, Vorlagen). Notizen, Artikel, Gewohnheiten, Bestellungen, Erfassungen, Übungen und Orte kommen über `searchIndex`. Neu zur Laufzeit angelegte Objekte (z. B. eine erfasste Notiz) erscheinen erst in der Suche, wenn die Komponente ihre Quelle direkt indexiert (Wunsch in Abschnitt 11).

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

**Ist:** Alle 19 Module liefern `<m>Summary` mit `kpis` (bestehende flache Objekte `financeSummary`, `fitnessSummary` wurden **additiv** erweitert, `nutSummary` bleibt, dazu `nutritionSummary`), dazu `<m>Hints`, `<m>Search` und `<m>Notifications` (leere Listen erlaubt). `world/index.js` sammelt sie zu `allKpis`, `allHints`, `searchIndex`, `allNotifications` (Abschnitt 4.13). Das Launchpad liest `<m>Summary.kpis[0]` (`preview/launchpad.js`), `system.notifications` bindet `allNotifications`, `system.search` bindet `searchIndex`. Jedes `to` in Hints, Suche und Mitteilungen ist eine vorhandene Feature-ID (Test) und in `system.notifications` bzw. `system.search` als Navigationsregel eingetragen.

### 5.3 `prefs` (Eigentümer settings)

`prefs = { favorites, enabled, theme, density, textScale, reduceMotion, privacy, quietHours, notify, region }` (früher als `units` geplant: jetzt `region`). Die Runtime nutzt `prefs.favorites` für die Navigation, falls gesetzt (Ziel: erste vier Favoriten plus „Mehr“). Ziel-Erweiterung für Gesundheit: `prefs.health = { hideWeight, hideKcal, habitMode }` (`HEALTH_GUIDELINES.md` Abschnitte 4 und 5). Ist: `prefs` liegt in `settings.js` und entspricht Wert für Wert `DEFAULT_PREFS` (`crosscut/_system.js`; Test), damit die Runtime Standardwerte nicht als Änderung wertet. Das Format ist `{favorites, enabled, theme, density, textScale, reduceMotion, privacy{…}, quietHours{…}, notify{…}, region{…}}`. `prefs.health` ist nicht vorhanden; `nutGoals.showNumbers` ist der einzige Schalter.

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

**Umsetzung (Ist):** Jede Welt-Datei mit abgeleiteten Werten liefert `scenarios`. `index.js` sammelt sie je Datei (Liste `WORLD_SCENARIOS`), `applyScenario` wendet sie in Reihenfolge an; plain Objekte werden dabei **flach über** die generische Umformung gelegt (ein leeres Objekt leert also kein Objekt, das schon umgeformt wurde). Erster Start: Kennzahlen `<m>Summary` zeigen Zähler 0 oder eine Einladung („Konten verbunden 0“), Katalog- und Wetterdaten bleiben, `wxTraining` ist leer (noch kein Plan), Soll-Anteile (`tradingTargets`) bleiben als Konfiguration stehen. Stress-Tag: Listen ×3, abgeleitete Werte werden **aus den verdreifachten Listen neu berechnet** (Depotwert, Vermögen, Budgets, Sparraten, Tagebuch-Summen, Kennzahlen); der Stress-Kontostand 9.999.999,99 € und das Kalorien-Plus sind bewusste Extremwerte. Aggregate (`searchIndex`, `allNotifications`, …) folgen generisch (leer bzw. ×3).

**Anforderungen (Ziel):**

1. **Referenzdaten sind keine Nutzerdaten.** Bibliotheken (`exerciseLibrary`, `nutFoods`, `nutRecipes`), Orte (`wxPlaces`, `wxActive`), Warnstufen, Konten-Stammdaten und Einstellungen bleiben im Erststart erhalten. Welt-Dateien schützen sie über `scenarios.erststart` (Rückgabe des vollen Wertes) oder INF-3 ergänzt eine Schutzliste je Datei (Wunsch im Bericht).
2. **Abgeleitete Werte folgen.** Jede Datei überschreibt in `scenarios.erststart` und `scenarios.stress` alle abgeleiteten Schlüssel (`financeSummary`, `depotValue`, `netWorth`, `nutSummary`, `bodySummary`, `fitnessSummary`, …), damit die Invarianten aus Abschnitt 7 **in jedem Szenario** gelten.
3. **Stress mit Extremwerten:** mindestens je Modul ein Extremfall (Kontostand `9.999.999,99 €`, Name mit 60 Zeichen, Lebensmittelname mit 80 Zeichen, 12 Termine an einem Tag, „99+“ Mitteilungen, 4-stellige Wiederholungen).
4. **Erststart zeigt den Pfad in die App:** Erststart-Checkliste und Einladungen kommen aus `home.js`/`system.js` (`firstrun`-Zustand), nicht aus den Fachdaten.
5. Szenarien ändern **nie** `persona`, `prefs` und IDs bestehender Schlüssel.

## 7. Konsistenz-Invarianten (Test: `tests/world-invariants.test.mjs`)

Jede Invariante gilt für `alltag`; W1 bis W3, W5, W6, W9, W14 und W15 prüft der Test zusätzlich nach `applyScenario(WORLD, 'erststart' | 'stress')` (W17). Der Test erweitert W14 um alle Referenzen der Welt und prüft die Aggregate (Vertragsformat, Ziele, Navigationsregeln).

| Nr. | Invariante | Ist (nach Integration „Datenwelt“) |
|---|---|---|
| W1 | Depotkonto = Positionssumme + Verrechnung: `accounts[acc-depot].balance` = Σ `positions.value` + `depotCash` (±0,01 €) und gleich `depotValue` | erfüllt, auch in Erster Start und Stress-Tag (30.097,73 = 28.847,73 + 1.250,00; Stress: Positionen ×3) |
| W2 | `netWorth` = Σ `accounts.balance` (±0,01 €) | erfüllt in allen Szenarien (55.508,15) |
| W3 | Budget-Ist = Σ Beträge der Buchungen `type: 'expense'` je Kategorie im Monat | erfüllt in allen Szenarien (Lebensmittel 262,90 €; Stress: Budgets aus den verdreifachten Buchungen) |
| W4 | **Umbuchung neutral:** `type: 'transfer'` zählt nicht in Einnahmen, Ausgaben, Budgets, Sparquote; beide Seiten haben denselben Typ | erfüllt (Privatentnahme `t16`/`t17` beide `transfer`; Einnahmen 2.952,40 €, Sparquote 33 %; Befund B3 behoben) |
| W5 | **Sparraten = Planraten:** Σ aktive `savingsPlans.monthly` = Σ Umbuchungen der Kategorie `Sparen` im Monat = `savingsMonthlyTotal` | erfüllt in allen Szenarien (575 €; Stress 1.725 €) |
| W6 | Sparziele: `g-notgroschen.current` = Kontostand Tagesgeld, `g-rente.current` = `depotValue`, `monthly` je Ziel = Σ Raten der Pläne mit dieser `goalId` | erfüllt (`g-rente.monthly` 425 € aus den Plänen abgeleitet, Befund B12 behoben) |
| W7 | Position: `value` = `quantity × price`, `gain` = `value − cost` (±0,01 €) | erfüllt (Rundung je Wert auf Cent, Toleranz 0,011 € beim Gewinn) |
| W8 | **kcal aus Makros ±12 %** (`atwaterPlausible` in `core/health.js`: 4·Eiweiß + 4·KH + 9·Fett + 7·Alkohol, Toleranz 12 %, mindestens 5 kcal) für `nutFoods` (je 100 g) und `nutDiary` | erfüllt: 48 von 48 Lebensmitteln und 44 von 44 Einträgen plausibel (Bier mit Feld `alcohol`, Brokkoli und Spinat nachgezogen; Befund B8 behoben) |
| W9 | Mahlzeitensummen = Tagessumme: `nutSummary.eatenKcal` = Σ `nutDiary` des Tages = `nutHistory[heute].kcal` | erfüllt in allen Szenarien (1.490 kcal; Erster Start 0; Stress ×3) |
| W10 | Ziel: `nutSummary.goalKcal` = `nutGoals.kcal`; `nutGoals.kcal` ≥ Grundumsatz des Profils (`HEALTH_GUIDELINES.md` K1) | erfüllt (2.400 ≥ 1.737) |
| W11 | **Gleiche Termine in Kalender und Start:** jede `eventId` in Tagebuch, Plan, Training zeigt auf ein vorhandenes Ereignis in `events`; Start (`home.js`) liest `events`, keine Kopie | erfüllt (Training: Kalenderserien `e-fit-…`, Wanderung `e20`) |
| W12 | **Training einheitlich:** Wochenplan (`trainingProgram.days`), Kalender-Termine, `wxTraining`, `nutGoals.trainingDays` nennen dieselben Tage, Zeiten, Orte | erfüllt: Mo/Mi/Fr 18:30 im FitX Bielefeld in Plan, Kalender, Wetter und Ernährung (Befund B2 behoben) |
| W13 | **Profil einheitlich:** Gewicht, Größe, Zielgewicht in `persona`, `fitnessProfile`/`bodySummary`, `nutProfile`, `nutSummary` identisch | erfüllt (78,4 kg, 182 cm, Ziel 77 kg) |
| W14 | Referenzen auflösbar: `account`, `to`, `subscriptionId`, `positionId`, `savingsPlanId`, `goalId`, `foodId`, `recipeId`, `eventId`, `exerciseId` zeigen auf vorhandene Einträge | erfüllt in allen Szenarien (Test prüft Konten, Abos, Positionen, Pläne, Ziele, Lebensmittel, Rezepte, Termine, Übungen, Erfassungen, Gewohnheiten, Trading) |
| W15 | IDs je Sammlung eindeutig | erfüllt in allen Szenarien für alle Sammlungen mit `id`; sammlungsübergreifend nicht (Befund B4: Suche und Hints verwenden `<sammlung>:<id>`) |
| W16 | Zeiten relativ zum Referenztag; Einträge nach 09:30 am Referenztag sind nur geplant oder vorab erfasst | erfüllt (Test prüft Buchungen, Notizen, Erfassungen, Bestellungen, Papierkorb, Mitteilungen, Einheiten, Alarme; Mittagessen nur vorab erfasst) |
| W17 | Szenarien erhalten W1 bis W3, W5, W9 | erfüllt: W1 bis W3, W5, W9 (und W6, W14, W15) gelten nach `applyScenario(WORLD, 'erststart' | 'stress')` (Befund B6 behoben) |

## 8. Befunde (Stand nach Integration)

Behobene Befunde bleiben als Verlauf stehen; ein Test sichert sie ab (`world-invariants`). Offene Befunde gehen als Wünsche an die Eigentümer (Abschlussbericht).

| Nr. | Befund | Status | Umsetzung oder Vorschlag | Eigentümer |
|---|---|---|---|---|
| B1 | Profil (Gewicht, Größe, Zielgewicht) | **behoben** | einheitlich 78,4 kg, 182 cm, Ziel 77 kg; `persona.health` sagt jetzt „3 kg abnehmen“ | MOD-HOME |
| B2 | Training: Kalender Donnerstag im Studio Kraftwerk, Wetter Mi/Fr Studio Kraftwerk, Fitness Mo/Mi/Fr im FitX Bielefeld | **behoben** | Wochenplan (Fitness) führt. Kalender: drei Serien `e-fit-lower`, `e-fit-upperA`, `e-fit-full` (Mo/Mi/Fr 18:30, FitX Bielefeld, `legacyEvents()` bleibt für das freigegebene Feature unverändert); `wxTraining` mit `eventId`; `nutGoals.trainingDays` aus dem Programm; Wissensartikel „Trainingsplan Grundlagen“ und Habit-Verlauf folgen. Abweichung vom ersten Vorschlag: Serien statt Einzeltermine `tr-<datum>`, weil die Wetter-Komponenten Termine und Training zusammenführen und Serien dort nicht doppelt erscheinen | MOD-CAL, MOD-WET, MOD-FIT |
| B3 | Privatentnahme: `t16` `income`, `t17` `transfer` | **behoben** | beide Seiten `transfer`, Kategorie „Umbuchung“; Einnahmen 2.952,40 €, Sparquote 33 % | MOD-FIN |
| B4 | ID-Überschneidung Aufgaben und Buchungen (`t1`…) | offen (bewusst) | bestehende IDs bleiben; Suche, Hints und Mitteilungen verwenden `<sammlung>:<id>` | alle |
| B5 | `nutShopping` in `nutrition.js`, Eigentümer der Liste ist `shopping` | offen (Entscheidung) | Modul `shopping` ist gebaut und liest/schreibt dieselben Felder (`checked`, `manual`, `pantry`, `recipeAdds`); offene Entscheidung `shopping.list` „Wem gehört die Lebensmittel-Liste?“ (Empfehlung: Einkauf, Ernährung liefert Zutaten per `carry`). Danach Umzug nach `shoppingLists`, Schlüssel bleiben | MOD-REG, MOD-NUT |
| B6 | Szenarien leeren Referenzdaten und lassen abgeleitete Werte stehen | **behoben** | `scenarios` in allen Dateien mit abgeleiteten Werten; Test W17 | alle |
| B7 | `scenarios` mehrerer Dateien überschreiben sich | **behoben** | `index.js` sammelt je Datei (`WORLD_SCENARIOS`), `applyScenario` wendet sie an; Aggregate in `index.js` | INF-3 |
| B8 | Atwater: Brokkoli, Spinat, Bier | **behoben** | Nährwerte nachgezogen, Feld `alcohol` (g je 100 ml) bei Bier und in den Tagebucheinträgen | MOD-NUT |
| B9 | Sparen und Depot liegen in `finance.js` | offen (bewusst) | Aggregate und Trading-Daten haben eigene Dateien (`savings.js`, `trading.js`). `positions`, `watchlist`, `savingsPlans` … bleiben in `finance.js`, weil `library/components/trading/_seeddata.js` sie von dort importiert; Umzug sobald die Bibliothek umgestellt ist (Schlüssel bleiben) | MOD-SAV, MOD-TRD |
| B10 | Terminüberschneidung `e3` und `e4` | **behoben** | als gewollt in `note` gekennzeichnet, `calendarHints` nennt sie | MOD-CAL |
| B11 | Sparplan am Sonntag gebucht | **behoben** | `t10` am Mo 16.11. (nächster Handelstag) | MOD-FIN |
| B12 | `sp-tech` ohne Ziel | **behoben** | `goalId: 'g-rente'`, Rate der Altersvorsorge 425 €, `monthly` je Ziel wird aus den Plänen abgeleitet | MOD-SAV |
| B13 | Bildtext-Erkennung: Belege und Visitenkarten verwiesen auf nicht vorhandene Erfassungen (`c8`…`c11`) | **behoben** | Erfassungen ergänzt (W14); Visitenkarte „Dr. Müller“ ist jetzt Rechtsanwältin, der Steuerberater ist durchgängig Tim Brandt (Kalender `e17`, Karte `k2`) | MOD-PTT |
| B14 | Mitteilungstexte widersprachen den Daten (Eingang „4“ statt 7, „Oberkörper A: 5 Übungen, 60 Min.“ statt 6, 55 Min., Sparplan „575 €“ am 01.12. statt 500 €, Kursalarm „Bitcoin über 84.000 €“ ohne Alarm) | **behoben** | Mitteilungen sind aus den Daten abgeleitet (`<m>Notifications`) | system, alle |

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
| Invarianten W1 bis W17 (inkl. Szenarien, Referenzen W14, eindeutige IDs W15) | `tests/world-invariants.test.mjs`, `npm test` | umgesetzt (31 Tests). `tests/core-world.test.mjs` prüft zusätzlich die Szenario-Mechanik |
| Unbekannter Welt-Schlüssel in `demoData` | `tests/world-invariants.test.mjs` (alle Manifeste) | umgesetzt; `tools/check.mjs` meldet es noch nicht (Wunsch) |
| `Date.now()`, `new Date()` ohne Argument, `Math.random()` in `seed/world/**` | `tests/world-invariants.test.mjs` | umgesetzt (`tools/check.mjs` Wunsch) |
| Aggregat-Form (`kpis`, `Hints`, `Search`, `Notifications`), Ziele existieren, Navigationsregeln in `system.*` | `tests/world-invariants.test.mjs` | umgesetzt |
| `prefs` = `DEFAULT_PREFS` | `tests/world-invariants.test.mjs` | umgesetzt |
| Seed-Größe unter 1,6 MB | `tests/world-invariants.test.mjs` (Welt als JSON) | umgesetzt (Welt rund 0,6 MB) |
| Browser: Startseiten aller Module in Kompakt, Visuell, Fokus × Alltag, Erster Start, Stress | Playwright-Probe `window.__taktQA.run()` bei 390 × 844 | 126 Läufe ohne fail und warn; 136 Varianten der Module notes, knowledge, picture-to-text, sales, habits, trading, system, settings, home in allen drei Szenarien (390) und Alltag (390, 1440) ohne fail und warn |

## 11. Offene Punkte

- **Persona bestätigen oder ändern** (Entscheidung offen). Bis dahin alle Persona-Daten Platzhalter.
- **Abgrenzung Sparen/Trading/Finanz-Datei** (B9): Umzug der Daten, sobald `library/components/trading/_seeddata.js` nicht mehr aus `world/finance.js` importiert (Schlüssel bleiben).
- **Suche über zur Laufzeit angelegte Objekte:** `global-search` indexiert nur seine festen Quellen (Aufgaben, Termine, Buchungen …). Eine per „Erfassen“ angelegte Notiz liegt zwar in `notes`, erscheint aber erst in der Suche, wenn die Komponente `notes`, `articles`, `habits`, `orders` direkt als Quelle bekommt (Wunsch an `crosscut`).
- **Fokus-Rahmen „Erfassen“** (`preview/launchpad.js`, `CaptureSheet`) legt nur Aufgaben und Ausgaben an; Notizen (und Termine) sollten ebenfalls in die Welt (`notes`, `events`) schreiben.
- **`tools/check.mjs`:** unbekannte `@world:`-Schlüssel, Aggregat-Form und `Date.now()` in `seed/world/**` auch dort prüfen (der Test deckt es ab).
- **`SEED_VERSION`** (`seed/index.js`) erhöhen, damit „Neue Seed-Inhalte übernehmen“ die geänderten Bindungen (Notizen, Wissen, Picture to Text, Sales, Gewohnheiten, Trading, Kern, Einstellungen) in bestehende Stände übernimmt.
- Statische Untertitel in einzelnen Startseiten (z. B. „9 Notizen · 3 im Eingang“ in Notizen, „3 von 5 Kanälen laufen“ in Sales) sind Text im Manifest und folgen den Szenarien nicht.
