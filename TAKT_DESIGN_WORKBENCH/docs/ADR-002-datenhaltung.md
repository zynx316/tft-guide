# ADR-002: Datenhaltung (lokal zuerst, Sync optional)

> **Stand:** 24.11.2026 · **Status:** **geteilt.** Teil 1 (lokal zuerst, Konfliktregel der Workbench, Feedback nur anhängen, Backups) ist **angenommen** und entspricht dem Ist-Stand der Workbench. Teil 2 (Sync zwischen Geräten, geteilte Daten mit der Partnerin, verschlüsseltes Backup, Cloud-OCR) ist **offen** und eine Entscheidung für den Nutzer (BAUPLAN_PAKETE `decisionsForUser` Nr. 4). Reversibilität von „lokal zuerst“: **unumkehrbar** im Sinne der Pflichtfrage `pattern-offline`, weil sie Datenmodell und Fehlerbilder prägt.
> **Gültigkeit:** gilt (a) für die Workbench-Daten und (b) als Vorgabe für die Architektur der echten App (Flutter). Jede Annahme zur echten App ist **Annahme**, bis Phase 1 vorliegt.
> **Zugehörige Dateien:** `server.mjs` (`/api/state`, `/api/backups`, `/api/feedback`) · `app/src/workbench/store.js` (Persistenz, Konflikt, Tab-Abgleich) · `app/src/core/schema.js` (`meta.rev`, `worldOverrides`) · `data/workbench.json`, `data/backups/`, `data/feedback.jsonl` · `app/src/seed/catalog.js` (Pflichtfragen `offline`, `privacy`) · `docs/HEALTH_GUIDELINES.md` (Abschnitt 8) · `docs/FINANCE_GUIDELINES.md` · `docs/ADR-001-demo-launcher.md` · `docs/BAUPLAN.md` (5.2, 5.11, 12, 13).

## 1. Kontext

Zwei verschiedene Dinge heißen „Daten“:

1. **Workbench-Daten:** Module, Features, Varianten, Entscheidungen, Verlauf, Feedback. Sie liegen als Datei (`data/workbench.json`) und, ohne Server, im Browser-Speicher. Sie gehören dem Projekt, sind **keine** persönlichen Daten und enthalten nur fiktive Demo-Inhalte.
2. **Daten der echten App:** Termine, Aufgaben, Buchungen, Gewicht, Training, Mahlzeiten. Sie sind **persönlich**, teils **besondere Kategorien** (Gesundheit, Art. 9 DSGVO) und teils finanziell.

Die Pflichtfrage `pattern-offline` empfiehlt „Lokal zuerst: alles nutzbar, Sync später, Konflikte sichtbar“. Die Pflichtfrage `pattern-privacy` empfiehlt „Beträge ausblenden und Sperre für sensible Module“, Gesundheitsdaten lokal.

## 2. Entscheidung (Teil 1, angenommen)

### 2.1 Lokal zuerst

- Alle Daten liegen **lokal auf dem Gerät** (echte App) bzw. in **einer Datei im Projektordner** (Workbench). Jede Funktion arbeitet ohne Netz. Schreibaktionen ohne Netz werden gespeichert und später abgeglichen (Offline-Zustand mit Banner „Offline, Stand 09:15“).
- Es gibt **kein Konto, keine Cloud, keine Telemetrie** als Voraussetzung. Gesundheitsdaten verlassen das Gerät nicht (`HEALTH_GUIDELINES.md` D1).
- Die Workbench-Oberfläche ist ohne Server lauffähig (Browser-Speicher als Rückfall).

### 2.2 Konfliktregel der Workbench (Ist)

| Baustein | Regel |
|---|---|
| **Revision** | Jede Änderung erhöht `meta.rev` (Zähler) im Client. Der Client merkt sich die zuletzt bekannte Revision der Server-Datei (`serverRev`). |
| **Schreiben** | `PUT /api/state` mit Header `X-Base-Rev: <serverRev>`. Stimmt die Revision der Datei nicht überein, antwortet der Server **409 „Konflikt“**. Die Datei wird **atomar** geschrieben (Schreiben in `.tmp`, dann Umbenennen). |
| **Bei 409** | Der Client holt den Server-Stand, wendet seine noch nicht gespeicherten Änderungen als Rezepte darauf neu an (Rebase, bis zu zwei Versuche) und speichert erneut. Scheitert das (z. B. nach Rückgängig), setzt er den Status `conflict`, legt den eigenen Stand als **Konflikt-Kopie** ab (`takt-workbench-conflict-copy` im Browser-Speicher, wiederherstellbar unter „Daten & Backup“) und überschreibt die Datei **nicht**. |
| **Start** | Die Server-Datei ist maßgeblich. Ist der Browser-Stand **neuer** (Zeitstempel `updatedAt`) und die Revision verschieden, wird er **nicht** still übernommen, sondern als Konflikt-Kopie gesichert. |
| **Tab-Abgleich** | Mehrere Tabs (Workbench plus Launcher): `storage`-Ereignis übernimmt einen **neueren** Stand eines anderen Tabs samt Revision. Beim Zurückkehren in den Tab (`visibilitychange`, `focus`) gleicht `syncFromServer` mit der Datei ab, **wenn nichts Ungespeichertes** vorliegt. |
| **LAN** | Im LAN ist die Workbench **schreibgeschützt** (Schreiben nur von 127.0.0.1, `Host` localhost, kein fremder Origin). Einzige Ausnahme ist `POST /api/feedback`. |
| **Freigaben** | Freigegebene Features sind gesperrt, Änderungen nur über „Neue Arbeitsversion“. Keine Abkürzung am Schutz vorbei (Regel 3 in `CLAUDE.md`). |

### 2.3 Feedback nur anhängen

- Bewertungen, Kommentare und Wünsche aus dem Launcher gehen als **append-only** Zeilen in `data/feedback.jsonl` (kein Überschreiben, kein Löschen über die API). Eintrag höchstens 20 KB, gleicher Origin.
- Die Workbench übernimmt sie **idempotent** über die `id` (`actions.importFeedback`, Obergrenze 2.000 Einträge) in den Feedback-Eingang der Workbench (Demo & Entscheidung › Reiter „Feedback“, im Bauplan „Eingang“). Dort werden sie **übernommen oder verworfen** (Ist: Status „übernommen“, „verworfen“; „vertagen“ ist Ziel, Bauplan 5.11). Übernehmen läuft über die bestehende Sperrlogik.
- Offline am Handy: Einträge liegen in einer lokalen Warteschlange und werden später gesendet (Ist: `localStorage`, Ziel: IndexedDB). Wiederholtes Senden erzeugt keinen Doppeleintrag (`id`).
- Feedback enthält **keine Gesundheits- oder Finanzwerte**, nur Bewertung, Route, Version, Kommentar.
- Ist (`server.mjs`, am Stichtag geprüft): Rate-Limit 60 pro Minute je IP (Antwort 429), Rotation der Datei ab 5 MB (alte Datei bleibt als `feedback-<zeit>.jsonl`), Deduplizierung auf dem Server nach `id`, `GET /api/feedback?since=`, `GET /api/ping`, Schema 2 mit Feldbegrenzung. **Umgesetzt:** WLAN-PIN (`?k=` bzw. Header `X-Takt-Pin`; nur mit `npm run lan`, bei jedem Start neu, `--pin`/`--no-pin`); ohne PIN beantwortet der Server anderen Geräten nur `/api/ping`.

### 2.4 Backups

- **Automatisch** beim Speichern, höchstens **eines je 10 Minuten**, es bleiben die **letzten 40** (`data/backups/`, Name mit Zeitstempel und Anlass `auto` oder `manuell`; der Anlass `pre-migration-v3` kommt mit der Schema-Migration, Ziel).
- **Manuell** über „Daten & Backup“ oder `POST /api/backups`; Wiederherstellung und Export dort.
- Vor einer **Schema-Migration** (Schema 2 → 3) ruft der Client ein Backup mit dem Label `pre-migration-v3` (Ziel, Bauplan 5.2). Seed-Patch und Import legen ebenfalls vorher ein Backup an (Ziel).
- `data/backups/` ist nicht im Repository (`.gitignore`), die Datenwelt (Persona) kommt immer aus dem Code und braucht kein Backup.
- Backups sind **nicht verschlüsselt** (Workbench, fiktive Daten). Für die echte App ist ein **verschlüsseltes** Backup Teil der offenen Entscheidung (Abschnitt 3).

## 3. Offene Entscheidung (Teil 2): Sync, Teilen, Backup, Cloud-OCR

### 3.1 Optionen für Sync und Sicherung der echten App

| Option | Beschreibung | Folgen |
|---|---|---|
| **A. Nur lokal plus Export-Datei** | Kein Sync. Der Nutzer exportiert Backups von Hand. | Einfachster Datenschutz, keine Server-Kosten, kein Konfliktfall. Gerätewechsel und Verlust nur per Datei. Geteilte Einkaufsliste mit Jana nicht möglich. |
| **B. Lokal plus verschlüsseltes Backup im eigenen Speicher** (z. B. Cloud-Ordner des Nutzers) | Automatisches Backup, **Ende-zu-Ende verschlüsselt**, nur Wiederherstellung, kein Live-Sync. | Guter Kompromiss: Daten bleiben unlesbar für den Speicheranbieter. Schlüsselverwaltung nötig (Passphrase). Kein Konfliktfall außer Wiederherstellung. |
| **C. Geräte-Sync mit Konfliktlösung** | Änderungen zwischen Geräten abgleichen (Feld- oder Eintragsebene, z. B. mit Änderungsprotokoll oder CRDT). | Hoher Aufwand: Datenmodell, Identitäten, Konfliktregeln, Tests. Für Gesundheitsdaten ist eine **neue ausdrückliche Einwilligung** und ein Verarbeitungskonzept nötig. |
| **D. Eigenes oder fremdes Backend** | Server mit Konto, Sync, Teilen. | Betrieb, Lizenz, Haftung, DSGVO (Auftragsverarbeitung, Hosting). Widerspricht „lokal zuerst“ als Voraussetzung, nur als **optionale** Zusatzfunktion denkbar. |

**Vorschlag (kein Beschluss):** Basis v1 mit **A**, Ziel für die erste Veröffentlichung **B**. **C oder D** nur mit eigener Entscheidung und nur für einzelne Bereiche (z. B. gemeinsame Einkaufsliste), Gesundheits- und Finanzdaten bleiben lokal. Der Nutzer entscheidet.

### 3.2 Konfliktregel für die echte App (nur falls Sync kommt)

Vorschlag (Annahme): **pro Eintrag** die jüngste Änderung (Zeitstempel plus Geräte-ID), Löschen als Markierung, bei gleichzeitiger Bearbeitung desselben Eintrags **sichtbarer Konflikt** („Zwei Stände von diesem Termin“) mit Wahl, nie stilles Überschreiben. Dieselbe Haltung wie in der Workbench (Konflikt-Kopie statt Überschreiben).

### 3.3 Geteilte Einkaufsliste mit der Partnerin

Einziger plausibler Sync-Kandidat im Alltag. Ohne Backend nicht lösbar. Optionen: (a) Liste per Teilen-Dialog exportieren (kein Live-Sync), (b) nur diese Liste über Option D, getrennt von allen übrigen Daten. Entscheidung offen, Eigentümer des Datenobjekts ist `shopping` (`DATENWELT.md` Abschnitt 3.2).

### 3.4 Cloud-OCR (Picture to Text)

| Option | Folgen |
|---|---|
| **Lokal auf dem Gerät** | Beleg- und Dokumentenbilder verlassen das Gerät nicht, Genauigkeit begrenzt, Modellgröße. Passt zu „lokal zuerst“. |
| **Cloud-Dienst** | bessere Erkennung, aber Belege (Finanzdaten, teils Gesundheitsdaten) gehen an einen Dienst: Einwilligung, Auftragsverarbeitung, Löschfristen, keine Nutzung im Offline-Fall. |

**Vorschlag:** lokal als Standard, Cloud nur als bewusst aktivierbare Option je Aufruf mit klarem Hinweis, nie für Gesundheitsfotos. Entscheidung offen (Feature `picture-to-text.settings`).

## 4. Folgen

- Jede Funktion muss **ohne Netz** einen sinnvollen Zustand haben (leer, veraltet, wartend). Der Zustandskatalog (`offline`, `stale`, `denied`) ist verbindlich.
- **Keine Pflicht-Anmeldung.** Kein Feature darf Netz oder Konto voraussetzen, außer es ist ausdrücklich als Option gekennzeichnet.
- Konflikte werden **sichtbar** gemacht, nie still aufgelöst (Workbench: Konflikt-Kopie, App: Konfliktanzeige falls Sync).
- Daten, die abgeleitet werden können (Welt, Summen), werden **nicht** gespeichert, sondern berechnet (`DATENWELT.md` Abschnitt 5.1).
- Backups und Löschen sind Funktionen des Nutzers: Export, Wiederherstellen, **endgültig löschen je Bereich** (besonders Gesundheit).

## 5. Offene Punkte

1. **Sync ja oder nein** und welche Option (A bis D): Nutzerentscheidung.
2. **Verschlüsseltes Backup** (Passphrase, Speicherort): hängt an 1.
3. **Geteilte Einkaufsliste**: nur mit Backend oder per Export (Abschnitt 3.3).
4. **Cloud-OCR**: lokal oder Cloud (Abschnitt 3.4).
5. **Rechtsprüfung** des Datenschutzkonzepts (Einwilligung, Löschfristen) vor einer Veröffentlichung.
6. **Wiedervorlage** dieser Entscheidung nach Phase 1 (echtes Datenmodell, vorhandene lokale Datenbank).
