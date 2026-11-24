# Feature-Katalog (verbindliche IDs)

> Automatisch erzeugt aus dem Seed 2026-11-24.3 mit `node tools/feature-ids.mjs` – nicht von Hand bearbeiten.
> Feature-IDs werden nie umbenannt (Querverweise, Entscheidungen, Versionen hängen daran). Neue IDs nach dem Muster `<modul>.<name>`.

**16 Module · 105 Features · 77 mit Design · 158 Varianten**

Legende: Tier 1 = täglich/kritisch, 2 = regelmäßig, 3 = selten · Richtungen K/V/F = Kompakt/Visuell/Fokus (● eigene Variante, ○ fehlt) · ⌂ = Modul-Startseite

## Start (`home`) · Tag & Organisation

Das Herzstück: Heute auf einen Blick – Termine, Aufgaben, Gewohnheiten, Wetter, Geld und Training – dazu Morgenbriefing, Tagesrückblick und eine anpassbare Startseite.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `home.today` ⌂ | Heute | 1* | ● ● ● | Design in Arbeit | `tasks.detail`, `calendar.home`, `tasks.overview`, `habits.home`, `weather.home`, `finance.accounts`, `fitness.home`, `nutrition.home`, `habits.detail`, `home.briefing`, `home.customize` |
| `home.briefing` | Tagesbriefing | 2* | ● ● ● | Design in Arbeit | `weather.home`, `calendar.home`, `tasks.overview`, `habits.home`, `finance.accounts`, `fitness.home`, `home.today` |
| `home.review` | Rückblick | 2* | ● ● ● | In Prüfung | `tasks.overview`, `calendar.home`, `habits.home`, `finance.accounts`, `fitness.home` |
| `home.customize` | Startseite anpassen | 2* | ● ● ○ | Design in Arbeit | `home.today` |
| `home.hints` | Hinweise | 1* | ○ ○ ● | Design in Arbeit | `weather.home`, `tasks.overview`, `calendar.home`, `finance.accounts` |
| `home.firststeps` | Erste Schritte | 1* | – | Analysiert | – |

## Kalender (`calendar`) · Tag & Organisation

Termine planen, überblicken und mit Aufgaben verbinden: Übersicht, Tag, Woche, Monat und Agenda, Termin-Detail mit Teilnehmern und Erinnerungen, Quellen, Feiertage und Geburtstage.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `calendar.home` ⌂ | Übersicht | 1* | ● ● ● | In Prüfung | `calendar.event`, `calendar.day`, `calendar.week`, `calendar.month`, `calendar.agenda`, `calendar.sources`, `calendar.create`, `tasks.detail` |
| `calendar.day` | Tagesansicht | 2* | ● ● ● | Design in Arbeit | `calendar.event` |
| `calendar.week` | Wochenansicht | 2* | ● ● ● | Design in Arbeit | `calendar.event`, `tasks.detail`, `calendar.tasks` |
| `calendar.month` | Monatsansicht | 2* | ● ○ ● | Freigegeben 🔒 | – |
| `calendar.agenda` | Agenda | 2* | ● ● ○ | Design in Arbeit | `calendar.event`, `calendar.filter` |
| `calendar.event` | Termin-Detail | 2* | ● ● ● | Design in Arbeit | – |
| `calendar.create` | Termin erstellen | 2* | ● ● ● | Design in Arbeit | `calendar.event` |
| `calendar.edit` | Termin bearbeiten | 3* | – | Analysiert | – |
| `calendar.recurrence` | Wiederholungen | 3* | – | Nicht untersucht | – |
| `calendar.categories` | Kategorien | 2* | ○ ● ○ | Design in Arbeit | – |
| `calendar.filter` | Filter | 2* | ● ○ ○ | In Prüfung | `calendar.event` |
| `calendar.tasks` | Aufgabenintegration | 2* | ○ ○ ● | Design in Arbeit | `tasks.detail` |
| `calendar.sources` | Kalender & Feiertage | 2* | ● ● ○ | Design in Arbeit | `calendar.event` |

## Aufgaben (`tasks`) · Tag & Organisation

Aufgaben erfassen, priorisieren und abarbeiten: Liste, Kanban und Tagesfokus mit Fälligkeiten, Projekten und Unteraufgaben.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `tasks.overview` ⌂ | Aufgabenübersicht | 1* | ● ○ ● | Design in Arbeit | – |
| `tasks.kanban` | Kanban | 2* | ○ ○ ○ | Design in Arbeit | – |
| `tasks.list` | Listenansicht | 2* | ● ○ ○ | Design in Arbeit | – |
| `tasks.priority` | Prioritäten | 3* | – | Analysiert | – |
| `tasks.due` | Fälligkeit | 2* | ● ○ ○ | Design in Arbeit | – |
| `tasks.repeat` | Wiederholungen | 3* | – | Nicht untersucht | – |
| `tasks.categories` | Kategorien | 3* | – | Analysiert | – |
| `tasks.projects` | Projekte | 2* | ● ○ ○ | Design in Arbeit | – |
| `tasks.detail` | Detailansicht | 2* | ● ○ ○ | In Prüfung | – |

## Gewohnheiten (`habits`) · Tag & Organisation

Kleine Gewohnheiten abhaken, Serien mit Gnadentag, Routinen als Abfolge und ein ruhiger Wochenrückblick – ohne Punkte und ohne Druck.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `habits.home` ⌂ | Heute | 1* | ● ● ● | Design in Arbeit | `habits.detail`, `habits.create`, `habits.routines`, `habits.review` |
| `habits.detail` | Gewohnheit | 2* | ● ● ● | Design in Arbeit | – |
| `habits.create` | Gewohnheit anlegen | 2* | ● ● ● | Design in Arbeit | `habits.home` |
| `habits.routines` | Routinen | 2* | ● ● ● | Design in Arbeit | `habits.home`, `habits.create` |
| `habits.review` | Wochenrückblick | 2* | ● ● ● | In Prüfung | `habits.home` |
| `habits.pause` | Pause & Gnadentag | 2* | ○ ○ ● | Design in Arbeit | – |
| `habits.templates` | Vorlagen | 3* | – | Analysiert | – |
| `habits.integrations` | Verknüpfungen | 3* | – | Analysiert | – |
| `habits.reminders` | Erinnerungen | 3* | – | Nicht untersucht | – |
| `habits.settings` | Einstellungen | 3* | – | Nicht untersucht | – |

## Finanzen (`finance`) · Finanzen

Konten, Budgets, Umsätze und Auswertungen – Referenzmodul für Kennzahlen, Diagramme und Fortschrittsanzeigen im Designsystem.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `finance.accounts` ⌂ | Kontenübersicht | 1* | ● ○ ○ | Design in Arbeit | – |
| `finance.budgets` | Budgets | 2* | ○ ○ ○ | Design in Arbeit | – |
| `finance.transactions` | Transaktionen | 3* | – | Analysiert | – |
| `finance.reports` | Auswertungen | 3* | – | Nicht untersucht | – |

## Sparpläne (`savings`) · Finanzen

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|

## Trading (`trading`) · Finanzen

Märkte beobachten und das eigene Depot im Blick behalten: Watchlist, Kursverläufe, Portfolio und simulierte Orders – ohne echte Orderausführung.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `trading.watchlist` ⌂ | Watchlist | 2* | ● ○ ○ | Design in Arbeit | – |
| `trading.portfolio` | Depot | 2* | ● ○ ○ | Design in Arbeit | – |
| `trading.detail` | Wertpapier-Detail | 2* | ○ ○ ● | Design in Arbeit | – |
| `trading.order` | Order erfassen (Simulation) | 2* | ● ○ ○ | In Prüfung | – |
| `trading.alerts` | Kursalarme | 3* | – | Analysiert | – |
| `trading.history` | Orderhistorie | 3* | – | Nicht untersucht | – |

## Fitness (`fitness`) · Gesundheit

Training, Aktivität, Körperwerte, Erholung und Ziele: Einheiten im Studio mit einem Tap pro Satz protokollieren, Fortschritt ohne Vergleichsdruck sehen und dranbleiben.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `fitness.home` ⌂ | Übersicht | 1* | ● ● ● | Design in Arbeit | `fitness.session`, `fitness.plan`, `fitness.exercise`, `fitness.progress`, `fitness.goals`, `fitness.body`, `fitness.activity`, `fitness.recovery` |
| `fitness.session` | Workout | 1* | ● ● ● | In Prüfung | `fitness.exercise`, `fitness.progress` |
| `fitness.plan` | Trainingsplan | 2* | ● ● ● | Design in Arbeit | `fitness.session`, `fitness.exercise`, `fitness.exercises` |
| `fitness.exercises` | Übungen | 2* | ● ● ● | Design in Arbeit | `fitness.exercise` |
| `fitness.exercise` | Übungs-Detail | 2* | ○ ● ○ | Design in Arbeit | `fitness.plan` |
| `fitness.progress` | Fortschritt & Rekorde | 2* | ● ● ● | Design in Arbeit | `fitness.exercise`, `fitness.exercises` |
| `fitness.body` | Körperwerte | 2* | ● ● ● | Design in Arbeit | – |
| `fitness.activity` | Aktivität | 2* | ● ● ○ | Design in Arbeit | – |
| `fitness.recovery` | Erholung | 2* | ● ○ ● | Design in Arbeit | – |
| `fitness.goals` | Ziele & Motivation | 2* | ● ● ● | Design in Arbeit | – |
| `fitness.history` | Verlauf der Einheiten | 3* | – | Analysiert | – |
| `fitness.custom` | Eigene Übung anlegen | 3* | – | Nicht untersucht | – |
| `fitness.sources` | Datenquellen & Datenschutz | 3* | – | Nicht untersucht | – |

## Ernährung (`nutrition`) · Gesundheit

Mahlzeiten in zwei bis drei Taps erfassen, Kalorien und Makros ohne Druck im Blick behalten, Rezepte, Wochenplan und Einkaufsliste verbinden.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `nutrition.home` ⌂ | Übersicht | 1* | ● ● ● | In Prüfung | `nutrition.log`, `nutrition.water`, `nutrition.insights`, `nutrition.recipe`, `nutrition.goals` |
| `nutrition.log` | Mahlzeit erfassen | 1* | ● ● ● | Design in Arbeit | `nutrition.foods` |
| `nutrition.water` | Wasser | 2* | ● ● ● | In Prüfung | – |
| `nutrition.foods` | Lebensmittel & Nährwerte | 2* | ● ● ○ | Design in Arbeit | – |
| `nutrition.recipes` | Rezepte | 2* | ● ● ○ | Design in Arbeit | `nutrition.recipe` |
| `nutrition.recipe` | Rezept-Detail | 2* | ○ ● ● | In Prüfung | `nutrition.shopping` |
| `nutrition.plan` | Wochenplan | 2* | ● ○ ● | Design in Arbeit | `nutrition.recipe`, `nutrition.shopping` |
| `nutrition.shopping` | Einkaufsliste | 2* | ● ● ○ | Design in Arbeit | `nutrition.plan` |
| `nutrition.goals` | Ziele & Bedarf | 2* | ● ○ ● | Design in Arbeit | `nutrition.home` |
| `nutrition.insights` | Auswertung | 2* | ● ● ● | Design in Arbeit | – |
| `nutrition.templates` | Vorlagen & Favoriten | 3* | – | Nicht untersucht | – |
| `nutrition.habit` | Gewohnheitsmodus | 3* | – | Analysiert | – |

## Notizen (`notes`) · Wissen & Inhalte

Gedanken, Listen und Ideen schnell festhalten, mit Tags ordnen und jederzeit wiederfinden.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `notes.overview` ⌂ | Notizübersicht | 1* | ● ● ● | Design in Arbeit | – |
| `notes.editor` | Notiz-Editor | 2* | ○ ○ ○ | In Prüfung | – |
| `notes.search` | Suche & Tags | 2* | ● ○ ○ | Design in Arbeit | – |
| `notes.checklists` | Checklisten | 3* | – | Analysiert | – |
| `notes.pin-archive` | Anheften & Archiv | 3* | – | Nicht untersucht | – |

## Wissensdatenbank (`knowledge`) · Wissen & Inhalte

Dauerhaftes Wissen in Bereichen, Kategorien und Artikeln – gut auffindbar, lesbar und leicht zu pflegen.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `knowledge.browse` ⌂ | Wissensbaum & Navigation | 2* | ○ ● ○ | Design in Arbeit | – |
| `knowledge.article` | Artikelansicht & Bearbeiten | 2* | ○ ○ ○ | In Prüfung | – |
| `knowledge.search` | Suche | 3* | – | Analysiert | – |
| `knowledge.links` | Verknüpfungen | 3* | – | Nicht untersucht | – |

## Picture to Text (`picture-to-text`) · Wissen & Inhalte

Text aus Fotos, Screenshots und Dokumenten erkennen, prüfen und weiterverwenden.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `picture-to-text.capture` ⌂ | Bild erfassen | 1* | ○ ○ ● | Design in Arbeit | – |
| `picture-to-text.result` | Texterkennung & Ergebnis | 2* | ○ ○ ● | In Prüfung | – |
| `picture-to-text.history` | Verlauf | 2* | ● ○ ○ | Design in Arbeit | – |
| `picture-to-text.export` | Export | 3* | – | Analysiert | – |
| `picture-to-text.multipage` | Mehrseitige Dokumente | 3* | – | Nicht untersucht | – |

## Wetter (`weather`) · Umgebung

Wetter, das Entscheidungen trägt: Jetzt, Regen in den nächsten Minuten, Stunden und 10 Tage, amtliche Warnungen, Pollen, UV und Luft – und was das für Kleidung, Training und Termine bedeutet.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `weather.home` ⌂ | Übersicht | 1* | ● ● ● | In Prüfung | `weather.radar`, `weather.alerts`, `weather.hourly`, `weather.daily`, `weather.advice`, `weather.environment`, `weather.locations`, `weather.settings` |
| `weather.current` | Aktuelles Wetter | 2* | ○ ● ● | Freigegeben 🔒 | – |
| `weather.radar` | Regenradar | 2* | ○ ● ● | Design in Arbeit | `weather.alerts`, `weather.advice` |
| `weather.hourly` | Stündlich | 2* | ● ● ○ | Design in Arbeit | – |
| `weather.daily` | 10 Tage | 2* | ● ● ○ | In Prüfung | `weather.hourly`, `weather.alerts` |
| `weather.alerts` | Warnungen | 2* | ● ○ ● | Design in Arbeit | – |
| `weather.advice` | Kleidung & Aktivität | 2* | ● ● ● | Design in Arbeit | `weather.alerts`, `weather.radar`, `weather.environment` |
| `weather.environment` | Pollen, UV & Luft | 2* | ● ● ○ | Design in Arbeit | – |
| `weather.locations` | Orte | 2* | ● ○ ○ | Design in Arbeit | `weather.home`, `weather.settings` |
| `weather.settings` | Einheiten & Benachrichtigungen | 2* | ● ○ ○ | Design in Arbeit | – |
| `weather.widgets` | Wetter in Start & Kalender | 3* | – | Nicht untersucht | – |

## Sales Channels (`sales`) · Business

Verkaufskanäle zentral verwalten: Shopify, Etsy, Amazon, eBay und eigener Shop – mit Bestellungen, Listings und Umsatzauswertung.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `sales.overview` ⌂ | Kanalübersicht | 1* | ● ● ● | Design in Arbeit | – |
| `sales.orders` | Bestellungen | 2* | ○ ○ ○ | Design in Arbeit | – |
| `sales.listings` | Produkte & Listings | 3* | – | Analysiert | – |
| `sales.connect` | Kanal verbinden | 2* | ○ ○ ○ | In Prüfung | – |
| `sales.revenue` | Auswertung Umsatz | 2* | ● ○ ○ | Design in Arbeit | – |
| `sales.returns` | Retouren | 3* | – | Nicht untersucht | – |

## TAKT Kern (`system`) · System

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|

## Einstellungen (`settings`) · System

Darstellung (Themes Graphite/Horizon/Intensiv), Module ein-/ausblenden, Konten, Datenexport.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `settings.appearance` ⌂ | Darstellung & Theme | 2* | ○ ○ ○ | Analysiert | – |

* Tier geschätzt (nicht explizit gesetzt).

