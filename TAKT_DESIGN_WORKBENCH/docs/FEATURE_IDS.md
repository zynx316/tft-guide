# Feature-Katalog (verbindliche IDs)

> Automatisch erzeugt aus dem Seed 2026-11-24.6 mit `node tools/feature-ids.mjs` – nicht von Hand bearbeiten.
> Feature-IDs werden nie umbenannt (Querverweise, Entscheidungen, Versionen hängen daran). Neue IDs nach dem Muster `<modul>.<name>`.

**19 Module · 197 Features · 154 mit Design · 336 Varianten**

Legende: Tier 1 = täglich/kritisch, 2 = regelmäßig, 3 = selten · Richtungen K/V/F = Kompakt/Visuell/Fokus (● eigene Variante, ○ fehlt) · ⌂ = Modul-Startseite

## Start (`home`) · Tag & Organisation

Das Herzstück: Heute auf einen Blick – Termine, Aufgaben, Gewohnheiten, Wetter, Geld und Training – dazu Morgenbriefing, Tagesrückblick und eine anpassbare Startseite.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `home.today` ⌂ | Heute | 1 | ● ● ● | Design in Arbeit | `tasks.detail`, `calendar.home`, `tasks.home`, `habits.home`, `weather.home`, `finance.home`, `savings.home`, `fitness.home`, `nutrition.home`, `goals.home`, `shopping.home`, `documents.home`, `habits.detail`, `home.briefing`, `home.customize` |
| `home.briefing` | Tagesbriefing | 1 | ● ● ● | Design in Arbeit | `weather.home`, `calendar.home`, `tasks.home`, `habits.home`, `finance.home`, `fitness.home`, `home.today` |
| `home.review` | Rückblick | 2 | ● ● ● | In Prüfung | `tasks.home`, `calendar.home`, `habits.home`, `finance.home`, `savings.home`, `fitness.home` |
| `home.customize` | Startseite anpassen | 3 | ● ● ○ | Design in Arbeit | `home.today` |
| `home.hints` | Hinweise | 2 | ○ ○ ● | Design in Arbeit | `weather.home`, `tasks.home`, `calendar.home`, `finance.home`, `savings.home` |
| `home.firststeps` | Erste Schritte | 3 | – | Analysiert | – |

## Kalender (`calendar`) · Tag & Organisation

Termine planen, überblicken und mit Aufgaben verbinden: Übersicht, Tag, Woche, Monat und Agenda, Termin-Detail mit Teilnehmern und Erinnerungen, Quellen, Feiertage und Geburtstage.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `calendar.home` ⌂ | Übersicht | 1 | ● ● ● | In Prüfung | `calendar.event`, `calendar.day`, `calendar.week`, `calendar.month`, `calendar.agenda`, `calendar.sources`, `calendar.create`, `tasks.detail` |
| `calendar.day` | Tagesansicht | 1 | ● ● ● | Design in Arbeit | `calendar.event` |
| `calendar.week` | Wochenansicht | 1 | ● ● ● | Design in Arbeit | `calendar.event`, `tasks.detail`, `calendar.tasks` |
| `calendar.month` | Monatsansicht | 2* | ● ○ ● | Freigegeben 🔒 | – |
| `calendar.agenda` | Agenda | 2 | ● ● ○ | Design in Arbeit | `calendar.event`, `calendar.filter` |
| `calendar.event` | Termin-Detail | 1 | ● ● ● | Design in Arbeit | – |
| `calendar.create` | Termin erstellen | 1 | ● ● ● | Design in Arbeit | `calendar.event` |
| `calendar.edit` | Termin bearbeiten | 2 | – | Analysiert | – |
| `calendar.recurrence` | Wiederholungen | 3 | – | Nicht untersucht | – |
| `calendar.categories` | Kategorien | 3 | ○ ● ○ | Design in Arbeit | – |
| `calendar.filter` | Filter | 3 | ● ○ ○ | In Prüfung | `calendar.event` |
| `calendar.tasks` | Aufgabenintegration | 2 | ○ ○ ● | Design in Arbeit | `tasks.detail` |
| `calendar.sources` | Kalender & Feiertage | 3 | ● ● ○ | Design in Arbeit | `calendar.event` |

## Aufgaben (`tasks`) · Tag & Organisation

Aufgaben erfassen, sortieren und abarbeiten: Übersicht, Eingang, Liste, Kanban, Detail und Fokus-Timer mit Fälligkeiten, Projekten und Unteraufgaben.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `tasks.home` ⌂ | Übersicht | 1 | ● ● ● | In Prüfung | `tasks.detail`, `tasks.overview`, `tasks.due`, `tasks.inbox`, `tasks.focus`, `tasks.kanban`, `tasks.projects` |
| `tasks.overview` | Aufgabenübersicht | 1 | ● ● ● | Design in Arbeit | `tasks.detail`, `calendar.event`, `tasks.kanban` |
| `tasks.kanban` | Kanban | 2 | ● ● ● | Design in Arbeit | `tasks.detail` |
| `tasks.list` | Listenansicht | 2 | ● ● ○ | Design in Arbeit | `tasks.detail` |
| `tasks.detail` | Detailansicht | 1 | ● ● ● | In Prüfung | `tasks.focus` |
| `tasks.inbox` | Eingang | 1 | ● ○ ● | Design in Arbeit | `tasks.detail` |
| `tasks.focus` | Fokus-Timer | 2 | ● ● ● | Design in Arbeit | `tasks.detail` |
| `tasks.priority` | Prioritäten | 2 | – | Analysiert | – |
| `tasks.due` | Fälligkeit | 2 | ○ ○ ● | Design in Arbeit | `tasks.list`, `tasks.detail` |
| `tasks.repeat` | Wiederholungen | 3 | – | Nicht untersucht | – |
| `tasks.categories` | Kategorien | 3 | – | Analysiert | – |
| `tasks.projects` | Projekte | 2 | ○ ● ○ | Design in Arbeit | `tasks.detail` |

## Gewohnheiten (`habits`) · Tag & Organisation

Kleine Gewohnheiten abhaken, Serien mit Gnadentag, Routinen als Abfolge und ein ruhiger Wochenrückblick – ohne Punkte und ohne Druck.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `habits.home` ⌂ | Heute | 1 | ● ● ● | Design in Arbeit | `habits.detail`, `habits.create`, `habits.routines`, `habits.review` |
| `habits.detail` | Gewohnheit | 2 | ● ● ● | Design in Arbeit | – |
| `habits.create` | Gewohnheit anlegen | 2 | ● ● ● | Design in Arbeit | `habits.home` |
| `habits.routines` | Routinen | 2 | ● ● ● | Design in Arbeit | `habits.home`, `habits.create` |
| `habits.review` | Wochenrückblick | 2 | ● ● ● | In Prüfung | `habits.home` |
| `habits.pause` | Pause & Gnadentag | 3 | ○ ○ ● | Design in Arbeit | – |
| `habits.templates` | Vorlagen | 3 | – | Analysiert | – |
| `habits.integrations` | Verknüpfungen | 3 | – | Analysiert | – |
| `habits.reminders` | Erinnerungen | 3 | – | Nicht untersucht | – |
| `habits.settings` | Einstellungen | 3 | – | Nicht untersucht | – |

## Ziele (`goals`) · Tag & Organisation

Wenige, wichtige Ziele sichtbar machen, ein Wochenfokus mit höchstens drei Zielen und Fortschritt, der automatisch aus den Fachmodulen kommt – motivierend, ohne Punkte und ohne Druck.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `goals.home` ⌂ | Übersicht | 1 | ● ● ● | Design in Arbeit | `goals.detail`, `goals.create`, `goals.week`, `goals.review`, `tasks.detail` |
| `goals.detail` | Ziel | 2 | ● ○ ● | Design in Arbeit | `tasks.detail` |
| `goals.create` | Ziel anlegen | 2 | ● ○ ● | Design in Arbeit | `goals.detail` |
| `goals.week` | Wochenfokus | 2 | ● ● ○ | Design in Arbeit | `goals.home`, `goals.create` |
| `goals.review` | Monatsrückblick | 3 | ○ ● ○ | In Prüfung | `goals.detail`, `goals.home` |
| `goals.settings` | Einstellungen | 3 | – | Analysiert | – |

## Einkauf & Haushalt (`shopping`) · Tag & Organisation

Einkaufslisten schnell abarbeiten (im Laden einhändig, nach Gang), Vorräte im Blick behalten und wiederkehrende Haushaltsaufgaben nicht vergessen.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `shopping.home` ⌂ | Übersicht | 1 | ● ● ● | Design in Arbeit | `shopping.list`, `shopping.store`, `shopping.household`, `shopping.pantry`, `finance.budgets`, `tasks.detail` |
| `shopping.list` | Einkaufsliste | 1 | ● ● ● | In Prüfung | `shopping.store`, `shopping.plan-import` |
| `shopping.store` | Laden-Modus | 1 | ● ○ ● | Design in Arbeit | `finance.quickadd`, `shopping.list` |
| `shopping.pantry` | Vorräte | 3 | ● ○ ○ | Design in Arbeit | `shopping.list` |
| `shopping.household` | Haushalt & Wartung | 2 | ● ● ○ | Design in Arbeit | `tasks.detail`, `shopping.list` |
| `shopping.plan-import` | Zutaten aus dem Plan | 3 | ● ○ ○ | Design in Arbeit | `shopping.list`, `nutrition.plan` |
| `shopping.settings` | Läden & Gänge | 3 | ● ○ ○ | Design in Arbeit | – |

## Finanzen (`finance`) · Finanzen

Konten, Buchungen, Budgets, Abos, Cashflow und Vermögen: ruhig erfassen, jederzeit wissen, was frei ist. Anzeige, Planung und Auswertung, keine Anlage- oder Steuerberatung.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `finance.home` ⌂ | Heute | 1 | ● ● ● | In Prüfung | `finance.quickadd`, `finance.transactions`, `finance.transaction`, `finance.budgets`, `finance.networth`, `finance.subscriptions`, `savings.home`, `finance.cashflow`, `finance.accounts` |
| `finance.accounts` | Konten | 1 | ● ● ● | In Prüfung | `finance.transactions`, `finance.subscriptions`, `savings.home`, `finance.networth` |
| `finance.quickadd` | Schnell erfassen | 1 | ● ● ● | In Prüfung | `finance.transaction` |
| `finance.transactions` | Buchungen | 2 | ● ● ○ | Design in Arbeit | `finance.transaction`, `finance.quickadd` |
| `finance.transaction` | Buchungs-Detail | 2 | ● ○ ○ | Design in Arbeit | `finance.subscriptions` |
| `finance.budgets` | Budgets | 2 | ● ● ● | Design in Arbeit | `finance.transactions` |
| `finance.subscriptions` | Abos und Fixkosten | 2 | ● ● ● | Design in Arbeit | – |
| `finance.cashflow` | Cashflow und Auswertung | 2 | ● ● ○ | Design in Arbeit | `finance.transactions` |
| `finance.networth` | Vermögen | 2 | ● ● ○ | Design in Arbeit | `finance.accounts` |
| `finance.categories` | Kategorien und Regeln | 3 | ● ○ ○ | Design in Arbeit | `finance.transactions` |
| `finance.privacy` | Privatsphäre und Sicherheit | 3 | ○ ○ ● | Design in Arbeit | – |
| `finance.import` | Import und Abgleich | 3 | – | Analysiert | – |
| `finance.business` | Selbstständige: Rücklagen | 3 | – | Nicht untersucht | – |

## Sparpläne (`savings`) · Finanzen

ETF- und Konto-Sparpläne planen, überblicken und mit Zielen verbinden: Rate, Rhythmus, Ausführungstermine, Deckung, Rechner mit Spanne, Sparziele und Steuer-Orientierung. Plan-Tracker, keine Ausführung beim Broker.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `savings.home` ⌂ | Übersicht | 1 | ● ● ● | In Prüfung | `savings.plan`, `savings.create`, `savings.calculator`, `savings.plans`, `savings.calendar`, `savings.goals`, `savings.tax` |
| `savings.plans` | Alle Sparpläne | 1 | ● ● ○ | Design in Arbeit | `savings.plan`, `savings.create` |
| `savings.plan` | Sparplan-Detail | 2 | ● ● ● | Design in Arbeit | `savings.calculator`, `trading.detail`, `savings.create` |
| `savings.create` | Sparplan anlegen | 2 | ● ○ ● | Design in Arbeit | `savings.plan` |
| `savings.calculator` | Rechner & Szenarien | 1 | ● ● ● | In Prüfung | `savings.compare`, `savings.create` |
| `savings.goals` | Sparziele | 1 | ● ● ● | Design in Arbeit | `savings.create`, `savings.plan`, `savings.calendar`, `savings.tax` |
| `savings.calendar` | Ausführungen | 2 | ● ● ○ | Design in Arbeit | `savings.plan`, `savings.goals`, `savings.tax`, `savings.create` |
| `savings.tax` | Steuern & Freistellungsauftrag | 2 | ● ● ○ | Design in Arbeit | – |
| `savings.compare` | Szenarien vergleichen | 3 | ○ ● ○ | Design in Arbeit | – |
| `savings.withdrawal` | Entnahmeplan | 3 | – | Nicht untersucht | – |
| `savings.assumptions` | Annahmen & Einstellungen | 3 | – | Nicht untersucht | – |

## Trading (`trading`) · Finanzen

Depot, Watchlist, Wertpapiere, simulierte Orders, Kursalarme, Dividenden und Auswertung: Märkte beobachten und das eigene Depot verstehen, ohne echte Orderausführung.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `trading.home` ⌂ | Übersicht | 1 | ● ● ● | In Prüfung | `trading.portfolio`, `trading.detail`, `trading.watchlist`, `trading.order`, `trading.alerts`, `trading.dividends`, `savings.plan` |
| `trading.portfolio` | Depot | 1 | ● ● ○ | In Prüfung | `trading.detail`, `trading.order` |
| `trading.watchlist` | Watchlist | 2 | ● ● ○ | Design in Arbeit | `trading.detail`, `trading.alerts` |
| `trading.detail` | Wertpapier | 2 | ● ● ○ | In Prüfung | `trading.order`, `trading.alerts`, `savings.plan` |
| `trading.order` | Order (Simulation) | 1 | ● ● ● | In Prüfung | `trading.detail` |
| `trading.alerts` | Kursalarme | 2 | ● ● ○ | Design in Arbeit | `trading.detail` |
| `trading.dividends` | Dividenden | 2 | ● ● ○ | Design in Arbeit | `trading.detail`, `trading.tax` |
| `trading.history` | Transaktionen | 3 | ● ○ ○ | Design in Arbeit | `trading.detail` |
| `trading.performance` | Performance & Aufteilung | 3 | ● ● ○ | Design in Arbeit | – |
| `trading.tax` | Steuer-Orientierung | 2 | ● ○ ○ | Analysiert | `trading.detail` |

## Fitness (`fitness`) · Gesundheit

Training, Aktivität, Körperwerte, Erholung und Ziele: Einheiten im Studio mit einem Tap pro Satz protokollieren, Fortschritt ohne Vergleichsdruck sehen und dranbleiben.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `fitness.home` ⌂ | Übersicht | 1 | ● ● ● | Design in Arbeit | `fitness.session`, `fitness.plan`, `fitness.exercise`, `fitness.progress`, `fitness.goals`, `fitness.body`, `fitness.activity`, `fitness.recovery` |
| `fitness.session` | Workout | 1 | ● ● ● | In Prüfung | `fitness.exercise`, `fitness.progress` |
| `fitness.plan` | Trainingsplan | 2 | ● ● ● | Design in Arbeit | `fitness.session`, `fitness.exercise`, `fitness.exercises` |
| `fitness.exercises` | Übungen | 2 | ● ● ● | Design in Arbeit | `fitness.exercise` |
| `fitness.exercise` | Übungs-Detail | 2 | ○ ● ○ | Design in Arbeit | `fitness.plan` |
| `fitness.progress` | Fortschritt & Rekorde | 2 | ● ● ● | Design in Arbeit | `fitness.exercise`, `fitness.exercises` |
| `fitness.body` | Körperwerte | 1 | ● ● ● | Design in Arbeit | – |
| `fitness.activity` | Aktivität | 2 | ● ● ○ | Design in Arbeit | – |
| `fitness.recovery` | Erholung | 2 | ● ○ ● | Design in Arbeit | – |
| `fitness.goals` | Ziele & Motivation | 2 | ● ● ● | Design in Arbeit | – |
| `fitness.history` | Verlauf der Einheiten | 3 | – | Analysiert | – |
| `fitness.custom` | Eigene Übung anlegen | 3 | – | Nicht untersucht | – |
| `fitness.sources` | Datenquellen & Datenschutz | 3 | – | Nicht untersucht | – |

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

Gedanken, Listen und Ideen in Sekunden festhalten, im Eingang einsortieren und jederzeit wiederfinden.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `notes.home` ⌂ | Übersicht | 1 | ● ● ● | Design in Arbeit | `notes.editor`, `notes.overview`, `notes.inbox`, `notes.checklists` |
| `notes.overview` | Notizübersicht | 1 | ● ● ● | Design in Arbeit | – |
| `notes.editor` | Notiz-Editor | 1 | ● ● ● | In Prüfung | – |
| `notes.inbox` | Schnellnotiz & Eingang | 1 | ● ○ ● | Design in Arbeit | `notes.editor` |
| `notes.search` | Suche & Tags | 2 | ● ● ○ | Design in Arbeit | `notes.editor` |
| `notes.checklists` | Checklisten | 2 | ● ● ○ | Design in Arbeit | `notes.editor` |
| `notes.pin-archive` | Anheften & Archiv | 3 | ● ○ ○ | Design in Arbeit | – |
| `notes.attachments` | Anhänge & Sprachnotiz | 3 | – | Analysiert | – |
| `notes.notebooks` | Notizbücher | 3 | – | Nicht untersucht | – |
| `notes.templates` | Vorlagen | 3 | – | Nicht untersucht | – |
| `notes.history` | Versionsverlauf | 3 | – | Nicht untersucht | – |

## Wissensdatenbank (`knowledge`) · Wissen & Inhalte

Dauerhaftes Wissen in Bereichen, Kategorien und Artikeln – gut auffindbar, lesbar und leicht zu pflegen.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `knowledge.home` ⌂ | Übersicht | 2 | ● ● ● | Design in Arbeit | `knowledge.article`, `knowledge.browse` |
| `knowledge.browse` | Wissensbaum & Navigation | 2 | ● ● ○ | Design in Arbeit | – |
| `knowledge.article` | Artikelansicht & Bearbeiten | 1 | ● ○ ● | In Prüfung | `knowledge.article` |
| `knowledge.search` | Suche | 2 | ● ● ○ | Design in Arbeit | `knowledge.article` |
| `knowledge.review` | Aktualität prüfen | 2 | ● ○ ○ | Design in Arbeit | `knowledge.article` |
| `knowledge.links` | Verknüpfungen | 3 | – | Analysiert | – |
| `knowledge.inbox` | Leseliste | 3 | – | Nicht untersucht | – |
| `knowledge.sources` | Quellen & Verlauf | 3 | – | Nicht untersucht | – |
| `knowledge.import` | Import | 3 | – | Nicht untersucht | – |

## Picture to Text (`picture-to-text`) · Wissen & Inhalte

Text, Belege, Visitenkarten und Dokumente aus Fotos erkennen, prüfen und weiterverwenden.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `picture-to-text.home` ⌂ | Übersicht | 2 | ● ● ● | Design in Arbeit | `picture-to-text.scanner`, `picture-to-text.receipt`, `picture-to-text.card`, `picture-to-text.capture`, `picture-to-text.result`, `picture-to-text.history` |
| `picture-to-text.capture` | Bild erfassen | 2 | ● ● ● | Design in Arbeit | – |
| `picture-to-text.scanner` | Dokumenten-Scanner | 2 | ● ● ● | Design in Arbeit | – |
| `picture-to-text.receipt` | Beleg erkennen | 1 | ● ○ ● | Design in Arbeit | `finance.quickadd` |
| `picture-to-text.card` | Visitenkarte | 3 | ○ ○ ● | Design in Arbeit | – |
| `picture-to-text.result` | Texterkennung & Ergebnis | 1 | ● ● ● | In Prüfung | `picture-to-text.receipt`, `picture-to-text.card` |
| `picture-to-text.history` | Verlauf | 2 | ● ● ○ | Design in Arbeit | – |
| `picture-to-text.export` | Export | 3 | – | Analysiert | – |
| `picture-to-text.multipage` | Mehrseitige Dokumente | 3 | – | Analysiert | `picture-to-text.scanner` |
| `picture-to-text.settings` | Einstellungen | 3 | – | Nicht untersucht | – |

## Dokumente & Verträge (`documents`) · Wissen & Inhalte

Verträge mit Fristen im Griff, wichtige Dokumente sofort finden, Garantien nicht verpassen, Steuerbelege gesammelt – ruhig, vertrauenswürdig, ohne Rechtsberatung.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `documents.home` ⌂ | Übersicht | 1 | ● ● ● | In Prüfung | `documents.contract`, `documents.warranties`, `documents.detail`, `documents.tax-folder`, `documents.list`, `documents.scan-in`, `documents.contracts`, `documents.settings` |
| `documents.contracts` | Verträge | 2 | ● ● ○ | Design in Arbeit | `documents.contract`, `documents.scan-in` |
| `documents.contract` | Vertrag | 2 | ● ○ ● | Design in Arbeit | `finance.subscriptions`, `documents.detail`, `documents.scan-in` |
| `documents.list` | Alle Dokumente | 3 | ● ● ○ | Design in Arbeit | `documents.detail`, `documents.scan-in` |
| `documents.detail` | Dokument | 2 | ● ○ ● | Design in Arbeit | `documents.contract`, `documents.warranties`, `calendar.event` |
| `documents.warranties` | Garantien | 3 | ● ● ○ | Design in Arbeit | `documents.detail`, `documents.scan-in` |
| `documents.tax-folder` | Steuerordner 2026 | 3 | ● ● ○ | Design in Arbeit | `calendar.event`, `documents.scan-in` |
| `documents.scan-in` | Dokument ablegen | 3 | ○ ○ ● | Analysiert | `picture-to-text.scanner`, `documents.detail`, `documents.warranties` |
| `documents.settings` | Einstellungen | 3 | ● ○ ○ | Analysiert | – |
| `documents.reminders` | Fristenkalender | 3 | – | Nicht untersucht | – |
| `documents.sharing` | Teilen und Export | 3 | – | Nicht untersucht | – |

## Wetter (`weather`) · Umgebung

Wetter, das Entscheidungen trägt: Jetzt, Regen in den nächsten Minuten, Stunden und 10 Tage, amtliche Warnungen, Pollen, UV und Luft – und was das für Kleidung, Training und Termine bedeutet.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `weather.home` ⌂ | Übersicht | 1 | ● ● ● | In Prüfung | `weather.radar`, `weather.alerts`, `weather.hourly`, `weather.daily`, `weather.advice`, `weather.environment`, `weather.locations`, `weather.settings` |
| `weather.current` | Aktuelles Wetter | 2* | ○ ● ● | Freigegeben 🔒 | – |
| `weather.radar` | Regenradar | 1 | ○ ● ● | Design in Arbeit | `weather.alerts`, `weather.advice` |
| `weather.hourly` | Stündlich | 2 | ● ● ○ | Design in Arbeit | – |
| `weather.daily` | 10 Tage | 2 | ● ● ○ | In Prüfung | `weather.hourly`, `weather.alerts` |
| `weather.alerts` | Warnungen | 1 | ● ○ ● | Design in Arbeit | – |
| `weather.advice` | Kleidung & Aktivität | 2 | ● ● ● | Design in Arbeit | `weather.alerts`, `weather.radar`, `weather.environment` |
| `weather.environment` | Pollen, UV & Luft | 3 | ● ● ○ | Design in Arbeit | – |
| `weather.locations` | Orte | 3 | ● ○ ○ | Design in Arbeit | `weather.home`, `weather.settings` |
| `weather.settings` | Einheiten & Benachrichtigungen | 3 | ● ○ ○ | Design in Arbeit | – |
| `weather.widgets` | Wetter in Start & Kalender | 3* | – | Nicht untersucht | – |

## Sales Channels (`sales`) · Business

Verkaufskanäle zentral verwalten: Shopify, Etsy, Amazon, eBay und eigener Shop – mit Bestellungen, Listings und Umsatzauswertung.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `sales.overview` ⌂ | Übersicht | 1 | ● ● ● | Design in Arbeit | `sales.channel`, `sales.order`, `sales.connect`, `sales.revenue`, `sales.orders` |
| `sales.orders` | Bestellungen | 1 | ● ● ● | Design in Arbeit | `sales.order` |
| `sales.order` | Bestellung | 1 | ● ○ ● | Design in Arbeit | `sales.channel`, `sales.orders` |
| `sales.channel` | Kanal | 1 | ● ○ ● | Design in Arbeit | `sales.order`, `sales.sync-log` |
| `sales.sync-log` | Sync-Protokoll | 2 | ● ○ ○ | Design in Arbeit | `sales.channel` |
| `sales.listings` | Produkte & Listings | 2 | – | Analysiert | – |
| `sales.connect` | Kanal verbinden | 2 | ● ○ ○ | In Prüfung | `sales.channel` |
| `sales.revenue` | Auswertung Umsatz | 2 | ● ● ○ | Design in Arbeit | `sales.channel` |
| `sales.returns` | Retouren | 3 | – | Nicht untersucht | – |
| `sales.shipping` | Versand & Tracking | 3 | – | Nicht untersucht | – |
| `sales.inventory` | Lagerbestand | 3 | – | Nicht untersucht | – |
| `sales.customers` | Kunden | 3 | – | Nicht untersucht | – |
| `sales.margin` | Marge | 3 | – | Nicht untersucht | – |

## TAKT Kern (`system`) · System

Der Querschnitt der App: Mitteilungen (Glocke), globale Suche (Lupe), Schnell erfassen mit Erkennung, Willkommen beim ersten Start, Papierkorb, App-Sperre und der Zustandskatalog für Offline, Konflikt, Berechtigung und Fehler.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `system.notifications` ⌂ | Mitteilungen | 1 | ● ● ● | In Prüfung | `notes.inbox`, `weather.alerts`, `nutrition.water`, `documents.tax-folder`, `tasks.inbox`, `picture-to-text.receipt`, `goals.detail`, `shopping.household`, `finance.subscriptions`, `sales.connect`, `shopping.store`, `documents.warranties`, `settings.data`, `habits.routines`, `fitness.home`, `goals.week`, `savings.calendar`, `finance.transaction`, `finance.budgets`, `home.review`, `calendar.sources`, `trading.alerts`, `tasks.list`, `tasks.detail`, `calendar.event`, `calendar.home`, `tasks.home`, `weather.home`, `sales.overview`, `savings.home`, `habits.home`, `trading.portfolio`, `nutrition.home`, `settings.home`, `home.today`, `finance.home`, `goals.home`, `shopping.home`, `documents.home`, `settings.notifications`, `system.capture` |
| `system.search` | Suche | 1 | ● ● ● | Design in Arbeit | `calendar.sources`, `tasks.inbox`, `habits.detail`, `habits.routines`, `goals.detail`, `shopping.list`, `shopping.household`, `shopping.pantry`, `shopping.settings`, `finance.subscriptions`, `finance.budgets`, `savings.goals`, `trading.detail`, `trading.alerts`, `fitness.exercise`, `fitness.plan`, `nutrition.log`, `notes.editor`, `knowledge.article`, `picture-to-text.result`, `picture-to-text.receipt`, `picture-to-text.card`, `documents.detail`, `documents.warranties`, `weather.locations`, `weather.alerts`, `sales.order`, `sales.channel`, `tasks.detail`, `calendar.event`, `finance.transaction`, `finance.accounts`, `savings.plan`, `nutrition.recipe`, `nutrition.foods`, `system.capture`, `calendar.create`, `finance.quickadd`, `settings.appearance`, `system.lock`, `system.trash`, `settings.data`, `settings.home`, `home.today`, `calendar.home`, `tasks.home`, `habits.home`, `notes.home`, `knowledge.home`, `picture-to-text.home`, `finance.home`, `savings.home`, `trading.portfolio`, `fitness.home`, `nutrition.home`, `weather.home`, `sales.overview`, `settings.region`, `settings.modules`, `settings.notifications`, `settings.accounts`, `system.help`, `settings.about` |
| `system.capture` | Schnell erfassen | 1 | ● ● ● | In Prüfung | `tasks.list`, `calendar.agenda`, `tasks.inbox`, `notes.inbox`, `finance.transactions`, `nutrition.log`, `shopping.list` |
| `system.onboarding` | Willkommen | 2 | ● ○ ● | Design in Arbeit | `home.today` |
| `system.trash` | Papierkorb | 3 | ● ○ ○ | Design in Arbeit | – |
| `system.lock` | App-Sperre & Datenschutz | 2 | ● ● ○ | Design in Arbeit | – |
| `system.states` | Zustandskatalog | 3 | ● ● ○ | In Prüfung | `system.trash`, `settings.data` |
| `system.help` | Hilfe & Tipps | 3 | ● ○ ○ | Design in Arbeit | – |
| `system.links` | Verknüpfungen | 3 | – | Analysiert | – |
| `system.widgets` | Widgets & Startbildschirm | 3 | – | Nicht untersucht | – |
| `system.share` | Teilen | 3 | – | Nicht untersucht | – |

## Einstellungen (`settings`) · System

Alle Einstellungen in Gruppen: Darstellung und Theme, Module und Navigation, Benachrichtigungen mit Ruhezeiten, Daten, Export und Backup, Konten und Sync, Sprache und Region, Über TAKT.

| Feature-ID | Name | Tier | K V F | Status | führt zu |
|---|---|---|---|---|---|
| `settings.home` ⌂ | Einstellungen | 1 | ● ● ● | In Prüfung | `settings.appearance`, `settings.region`, `settings.modules`, `settings.notifications`, `system.lock`, `settings.data`, `system.trash`, `settings.accounts`, `system.help`, `system.onboarding`, `settings.about` |
| `settings.appearance` | Darstellung & Theme | 2 | ● ● ○ | Design in Arbeit | – |
| `settings.modules` | Module & Navigation | 1 | ● ● ○ | In Prüfung | – |
| `settings.notifications` | Benachrichtigungen | 2 | ● ○ ● | Design in Arbeit | `system.notifications` |
| `settings.data` | Daten, Export & Backup | 2 | ● ● ○ | Design in Arbeit | `system.trash` |
| `settings.accounts` | Konten & Sync | 2 | ● ○ ○ | Design in Arbeit | `sales.connect` |
| `settings.region` | Sprache & Region | 3 | ● ○ ○ | Design in Arbeit | – |
| `settings.about` | Über TAKT | 3 | ● ○ ○ | Design in Arbeit | `system.help`, `system.states` |

* Tier geschätzt (nicht explizit gesetzt).

