# Persona: Jonas Keller, ein Dienstag

> **Stand:** 24.11.2026 · **Referenzmoment:** Di, 24.11.2026, 09:30 Uhr, Bielefeld (`DEFAULT_TODAY`)
> **Status: Platzhalter.** Alles in diesem Dokument ist eine **Annahme**, bis der Nutzer die Persona bestätigt oder ändert (BAUPLAN_PAKETE `decisionsForUser` Nr. 1: Name, Alter, Ort, Branche, Gewicht, Kontostände in plausibler Größenordnung). Jede Angabe ist mit **(A)** für Annahme markiert, wenn sie nicht direkt aus einer Welt-Datei stammt; Angaben aus Welt-Dateien nennen den Schlüssel in Klammern.
> **Gültigkeit:** Referenz für Demo-Daten, Szenarien, Entscheidungs-Aufgaben („Wie schnell komme ich zur Aktion?“) und Gerätetests. Sie ersetzt keine echte Zielgruppenrecherche.
> **Zugehörige Dateien:** `app/src/seed/world/persona.js`, `home.js`, `organisation.js`, `finance.js`, `savings.js`, `trading.js`, `fitness.js`, `nutrition.js`, `weather.js`, `knowledge.js`, `scans.js`, `sales.js`, `habits.js`, `system.js`, `settings.js` · `docs/DATENWELT.md` (Schlüssel, Invarianten, Befunde) · `docs/HEALTH_GUIDELINES.md` · `docs/FINANCE_GUIDELINES.md` · `docs/GERAETETEST.md` · `docs/BAUPLAN.md` (4, 5.5).

## 1. Steckbrief (A)

| | |
|---|---|
| Name, Alter | Jonas Keller, 38 (`persona`) |
| Wohnort | Bielefeld, zusammen mit Partnerin Jana (`persona`) |
| Beruf | selbstständig, Online-Shop „Nordlicht Studio“ (nachhaltige Wohnaccessoires) auf Shopify, Etsy und Amazon; Geschäftskonto bei Kontist (`persona`, `accounts`) |
| Geld | ETF-Sparer (All-World, Emerging Markets, World IT) plus zwei Einzelaktien, Notgroschen im Aufbau, spart auf die Japan-Reise 2027 (`persona`, `savingsPlans`, `savingsGoals`) |
| Körper | Krafttraining Mo/Mi/Fr, Laufen am Wochenende, Ziel: 3 kg abnehmen (80 → 77 kg), ca. 2.400 kcal und 140 g Eiweiß pro Tag (`persona`, `nutGoals`; Training Mo Unterkörper, Mi Oberkörper A, Fr Ganzkörper, jeweils 18:30 im FitX Bielefeld, `trainingProgram`) |
| Technik | Power-User, nutzt Kalender, Aufgaben, Shop-Dashboards und Finanz-Apps täglich (A) |
| Haltung zur App | will **eine** App für alles, wenig Reibung, keine Belehrung, keine Gamification (A, aus den Nicht-Zielen der Mission: kein soziales Netzwerk, keine Ranglisten) |

Gewicht, Größe und Zielgewicht sind in den Welt-Dateien einheitlich (78,4 kg, 182 cm, Ziel 77 kg; Befund B1 behoben). Auch Trainingstage, Zeiten und Studio sind einheitlich: Mo/Mi/Fr 18:30 im FitX Bielefeld in Wochenplan, Kalender (Serien `e-fit-…`), Wetter und Ernährung; die frühere Donnerstags-Serie im Studio Kraftwerk entfällt (Befund B2 behoben, `DATENWELT.md` Abschnitt 8).

## 2. Geräte (A)

| Gerät | Annahme | Nutzung im Projekt |
|---|---|---|
| Smartphone | Android, Größe wie Pixel 8 (412 × 915 dp), Alltagsgerät; zusätzlich kompakte Referenz 360 × 780 | Launcher-Rahmen `pixel-8`, `galaxy-s`; echter Gerätetest (`GERAETETEST.md`) |
| Laptop | Windows, 1440 × 900 | Workbench, Launcher mit bis zu 3 Versionen nebeneinander |
| Schnittstellen | Health Connect für Schritte, Schlaf, Ruhepuls (`stepsToday.source`), Körperwaage mit Körperfett-Messwert (`bodyMeasurements`) | Berechtigungs-Zustände (`denied`) prüfen |
| Netz | Heim-WLAN, mobil unterwegs mit schwankender Verbindung, Studio und Laden teils ohne Netz | Offline-Zustand, Warteschlange |

## 3. Ziele (A, mit Welt-Bezug)

| Bereich | Ziel | Stand 24.11.2026 | Quelle |
|---|---|---|---|
| Körper | 3 kg abnehmen (Start 80 kg, Ziel 77 kg) | Trend 78,5 kg, 1,5 kg erreicht, 0,3 kg in der letzten Woche | `bodySummary` |
| Training | 3 Einheiten pro Woche, Serie halten | KW 48: 1 von 3, Serie 12 Wochen, 1 Joker übrig, 96 Einheiten seit Start (100. in Sicht) | `weeklyTraining`, `fitnessStreak`, `fitnessSummary` |
| Ernährung | 2.400 kcal, 140 g Eiweiß, 2,5 l Wasser | 09:30: 1.490 kcal (inkl. vorab erfasstem Mittagessen), 69 g Eiweiß, 1,0 l Wasser | `nutSummary` |
| Notgroschen | 15.000 € (6 Monatsausgaben) | 9.500 €, 150 € pro Monat | `savingsGoals` |
| Japan-Reise 2027 | 6.000 € bis 01.09.2027 | 2.150 € | `savingsGoals` |
| E-Bike | 3.500 € bis 01.06.2027 | 1.200 €, Sparplan pausiert bis 15.01.2027 | `savingsGoals`, `savingsPlans` |
| Altersvorsorge | Depot, 425 € pro Monat (All-World 300 €, Emerging Markets 75 €, World IT 50 €) | Depotwert 30.097,73 € | `savingsGoals`, `depotValue` |
| Beruf | Black Friday am Fr 27.11. vorbereiten, Jahresplanung 2027 am Di 01.12. | Newsletter und Angebot heute fällig; 3 neue Bestellungen heute (281,89 €), Etsy-Anbindung abgelaufen | `events`, `tasks`, `orders`, `channels` |

## 4. Tagesablauf Di, 24.11.2026 (stundenweise)

Die Tabelle zeigt, was die Welt für den Referenztag bereits sagt. „Jetzt“ ist 09:30 Uhr (Referenzmoment der Demo). Alles danach ist **Plan**, nicht erledigt. Zeiten ohne Welt-Quelle sind **(A)**.

| Zeit | Was passiert | Modul | Quelle |
|---|---|---|---|
| 06:30 | Aufgestanden nach 6,9 Std. Schlaf (Ziel 7,5), Qualität 3 von 5, Ruhepuls 58 | fitness | `sleepLog` |
| ca. 06:45 (A) | Morgens gewogen: 78,4 kg | fitness | `bodyWeightLog` |
| 07:15 | Vitamin D genommen (Serie 55 Tage) | habits | `habits` (h-vitd) |
| 07:20 | Wasser, 250 ml | nutrition | `nutWater.entries` |
| 07:40 | Frühstück: Skyr-Bowl (Skyr 250 g, Haferflocken 50 g, Blaubeeren 80 g, Walnüsse 15 g, Honig 10 g), etwa 507 kcal | nutrition | `nutDiary` |
| 07:48 | Etsy: Zugriffstoken abgelaufen, Bestellungen werden nicht abgeglichen (Mitteilung, Fehlerzustand des Kanals) | sales | `channels` (etsy), `salesNotifications` |
| 07:55 | Kaffee mit Hafer-Drink | nutrition | `nutDiary` |
| 08:05 | Wasser, 500 ml (eigene Flasche) | nutrition | `nutWater.entries` |
| ca. 08:00 bis 08:22 (A) | Morgenspaziergang, 22 Min., 2,4 km | fitness | `activityItems` (a-walk-2) |
| 08:12 | Einkauf bei REWE, −38,47 € vom Girokonto | finance | `transactions` (t1) |
| 08:30 | Tagesplanung erledigt | habits | `habits` (h-plan) |
| 08:52 | DWD-Warnung Stufe 2: Sturmböen bis 72 km/h, Bielefeld, 14:00 bis 23:00 Uhr | weather | `wxActive.alerts` (wx-a1) |
| 09:10 | Snack: Apfel und 20 g Mandeln | nutrition | `nutDiary` |
| 08:40 und 09:12 | Neue Bestellungen: #4184 (Eigener Shop), #4185 (Shopify); #4183 (Amazon) um 07:55 | sales | `orders` |
| 09:15 | Wasser, 250 ml (zusammen 1,0 l) | nutrition | `nutWater.entries` |
| **09:30** | **Jetzt:** 3.240 Schritte, 22 aktive Minuten; 1.490 kcal erfasst; 6 °C, gefühlt 3 °C, leicht bewölkt; Sonnenaufgang war 07:52 | home | `stepsToday`, `nutSummary`, `wxActive.current` |
| 09:42 | kurzer Schauer (Nowcast) | weather | `wxActive.nowcast` |
| 09:45 | Daily Stand-up, 15 Min., Teams | calendar | `events` (e-standup, werktags) |
| 10:30 bis 12:00 | Fokus: Workbench-Review (Varianten Kalender und Aufgaben) | calendar, tasks | `events` (e4) |
| 11:00 bis 11:45 | Sprint-Planung, Konferenzraum 2. **Überschneidet** den Fokusblock (Konflikt) | calendar | `events` (e3) |
| 12:30 bis 13:30 | Mittag mit Jana, Café Moll (8 Min. zu Fuß, draußen); Quiche mit Salat, vorab mit 720 kcal geschätzt | calendar, nutrition | `events` (e5), `wxVenues`, `nutDiary` (prelogged) |
| 14:00 | **Angebot Müller GmbH finalisieren** fällig (hoch, 60 Min. geschätzt, 1 von 3 Unteraufgaben erledigt; Kunde erwartet Rückmeldung bis 14:00) | tasks | `tasks` (t1) |
| ab 14:00 | Regen und Sturmböen bis 72 km/h, Warnstufe 2 bis 23:00 Uhr | weather | `wxActive.alerts` |
| 15:00 bis 16:00 | Lieferanten-Call Etsy, Zoom (Konditionen Q1) | calendar, sales | `events` (e6) |
| 16:28 | Sonnenuntergang | weather | `wxActive.sun` |
| 16:30 | **Newsletter Black Friday planen** fällig (60 Min.) | tasks | `tasks` (t6) |
| heute, ohne Uhrzeit | Wireframes Kalender-Wochenansicht prüfen (Review, 45 Min.), Lieferantenkonditionen vergleichen (45 Min.) | tasks | `tasks` (t5, t7) |
| überfällig | Etsy-Gebühren buchen (seit 22.11., hoch), Belege Oktober hochladen (seit 23.11.) | tasks, finance | `tasks` (t8, t2) |
| Abend (A) | **Kein Training** (Erholungstag; morgen 18:30 Oberkörper A). Abendessen: Lachs mit Ofengemüse, 636 kcal; Snack: Quark mit Blaubeeren, 168 kcal. Tagesziel dann etwa 2.294 von 2.400 kcal | fitness, nutrition | `fitnessToday`, `nutPlan` |
| Nacht (A) | Schlafziel 7,5 Std. | fitness | `fitnessProfile.sleepGoalH` |

**Geld an diesem Tag (Stand 09:30):** Girokonto 3.842,17 €, Geschäftskonto 12.480,55 €, Tagesgeld 9.500,00 €, Kreditkarte −412,30 €, Depot 30.097,73 €, Vermögen 55.508,15 €. Einnahmen im November 2.952,40 € (Shopify 2.140,00 €, Etsy 812,40 €), Ausgaben 1.975,52 €, Sparquote 33 %; die Privatentnahme (4.200 €) ist eine Umbuchung und zählt nicht mit. Budget Freizeit 164,50 € von 150 € (über Plan, Hinweis ohne Alarm). **Anstehend:** Di 01.12. Miete 1.150,00 €, Strom 95,00 €, Kfz 54,10 €, Abos und Mobilfunk, außerdem Sparraten 500 € (All-World 300 €, World IT 50 €, Notgroschen 150 €); 15.12. Sparplan Emerging Markets 75 € (fällt der Tag auf ein Wochenende, wird am nächsten Handelstag gebucht); Fr 27.11. Steuerberater 15:00; 10.12. Umsatzsteuer-Voranmeldung.

**Morgen (Mi, 25.11.), damit Wege und Hinweise konsistent sind:** 09:00 Kunden-Call Müller GmbH (Telefon, hängt an Angebot t1); 13:00 bis 16:00 Produktfoto-Shooting Studio Ehrenfeld (Winterkollektion, 12 Artikel, 25 Min. mit dem Auto); 16:30 bis 17:30 Physiotherapie, Praxis Lindner (Rad, 15 Min.); 18:30 Training Oberkörper A (FitX Bielefeld); Böen bis 58 km/h am Vormittag (`wx-a2`, Stufe 1).

## 5. Nutzungskontexte (A)

| Kontext | Wann | Gerät, Haltung | Was zählt | Beispiel-Features |
|---|---|---|---|---|
| **Morgenüberblick** | 07:00 bis 09:30, zu Hause | Smartphone, Einhand oder zwei Hände, Kaffee in der anderen | in 30 Sekunden orientiert: Termine, Fälliges, Wetter, Kalorien übrig | `home.today`, `home.briefing` |
| **Unterwegs** | Weg zum Café, Einkauf, Bahn | Smartphone, **Einhand, Daumenzone**, Sonne und Regen | große Ziele, wenig Text, **Privatmodus** in der Öffentlichkeit | `finance.capture`, `system.capture`, Privatmodus |
| **Schreibtisch** | 10:30 bis 17:00 | Laptop 1440 × 900 | Dichte, Tastatur, Kalender, Aufgaben, Finanzen nebeneinander | `calendar.week`, `tasks.list`, `finance.accounts` |
| **Studio** | Mo/Mi/Fr 18:30 | Smartphone, verschwitzte oder nasse Finger, App im Hintergrund, Kopfhörer | Satz mit 1 Tap, Timer läuft weiter, Schrift groß | `fitness.session`, Rest-Timer |
| **Küche und Laden** | abends, Wochenmarkt | Smartphone, Hände schmutzig, **offline** im Laden | Rezept im Kochmodus, Einkaufsliste ohne Netz, große Flächen | `nutrition.log`, `shopping.lists`, Laden-Modus |
| **Abend auf dem Sofa** | 21:00 bis 22:30 | Smartphone oder Tablet, zwei Hände | ruhiger Rückblick, Planung, Finanz-Check ohne Druck | `home.review`, `savings.goals` |
| **Draußen bei Wetter** | Sturm, Regen, Frost | Smartphone, Handschuhe möglich | Warnung mit Text und Quelle, Alternative, betroffene Termine | `weather.home`, `weather.alerts` |

## 6. Annahmen, die der Nutzer bestätigen soll

| Nr. | Frage | Vorschlag (A) |
|---|---|---|
| 1 | Name, Alter, Ort, Haushalt passen? | Jonas Keller, 38, Bielefeld, mit Jana |
| 2 | Beruf und Branche? | selbstständiger Online-Händler (Shopify, Etsy, Amazon) |
| 3 | Gewicht, Größe, Ziel? | 78,4 kg, 182 cm, Ziel 77 kg (einheitlich in Fitness und Ernährung); Kalorienziel 2.400 kcal |
| 4 | Trainingstage und Studio? | Mo/Mi/Fr 18:30, FitX Bielefeld, Laufen am Wochenende (in allen Welt-Dateien einheitlich) |
| 5 | Größenordnung der Kontostände (Giro 3.842 €, Depot 30.098 €)? | als Platzhalter belassen |
| 6 | Gerät (Android, 412 × 915 dp) und Windows-Laptop? | ja, bis anders gemeldet |
| 7 | Gesundheitsmodus: Zahlen sichtbar oder „ohne Zahlen“ als Standard? | Zahlen sichtbar, Gewohnheitsmodus wählbar (`HEALTH_GUIDELINES.md` Abschnitt 5) |

Bis zur Bestätigung gilt jede Aussage hier und in den Welt-Dateien als **Annahme**. Persona-Änderungen nimmt der Eigentümer von `persona.js` (MOD-HOME) vor; abgeleitete Dateien ziehen nach (`DATENWELT.md` Abschnitt 9, Regel „keine Kopien“).
