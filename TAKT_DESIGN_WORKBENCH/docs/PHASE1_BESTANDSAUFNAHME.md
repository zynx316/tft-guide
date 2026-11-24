# Phase 1 – Bestandsaufnahme des echten TAKT-Projekts (lokal auszuführen)

**Warum offen?** Die Workbench wurde in einer Cloud-Umgebung gebaut, die keinen Zugriff auf
`G:\Projekte\97_Uebernahme\TAKT-Merge-Git\` hatte (kein verbundener Rechner). Die Module/Features im Seed stammen
deshalb aus dem Auftrag und sind als **„in Phase 1 verifizieren“** markiert (`module.source`). Diese Phase holt das nach.

Start in Claude Code (im Workbench-Ordner): **`/takt-phase1`** – oder manuell nach dieser Anleitung.

## 0. Sicherheitsregeln (strikt)
- Im TAKT-Projekt **nur lesen**. Erlaubt: `git status`, `git log`, `git branch`, `git rev-parse`, `git ls-files`, `git diff --stat`.
- **Verboten:** add, commit, push, stash, reset, checkout, restore, clean, Dateien ändern/anlegen/löschen.
  (`.claude/settings.json` der Workbench verbietet `git -C <pfad> add/commit/push/reset/stash/checkout`.)
- Keine produktiven Flutter-/Dart-Dateien verändern. Ergebnisse nur in den Workbench-Ordner schreiben.

## 1. Git-Status dokumentieren
```powershell
$T = "G:\Projekte\97_Uebernahme\TAKT-Merge-Git"
git -C $T rev-parse --abbrev-ref HEAD      # Branch
git -C $T rev-parse HEAD                   # Commit
git -C $T log -5 --oneline
git -C $T status --porcelain=v1            # Änderungen + Untracked
```
Erwartet (frühere Prüfungen): Änderungen an `android/version_code.state`, untracked `_bau_apk_2026-09-27.ps1`. Abweichungen notieren.

## 2. Aktuelle Version & Projektkopien
- `pubspec.yaml` → `version:`; `android/version_code.state`.
- Projektkopien suchen: `Get-ChildItem G:\Projekte -Directory -Recurse -Depth 2 | Where-Object Name -match 'TAKT'`
  → je Kopie: letzter Commit/Änderungsdatum, Version. Welche ist maßgeblich? (Ergebnis begründen.)

## 3. Modulregister & Navigation
Gesucht wird die Stelle, an der Module registriert/aufgelistet werden. Typische Suchbegriffe:
`module`, `Module(`, `registry`, `enum .*Module`, `routes`, `GoRoute`, `MaterialPageRoute`, `BottomNavigationBar`,
`NavigationRail`, `Drawer`, `ModuleId`, `kModules`. Für jedes Modul erfassen: ID/Name, Icon, Einstiegs-Screen, Unterseiten,
Feature-Flags/aktiv, Pfad:Zeile.

## 4. Features je Modul
Je Modul die Screens/Widgets/Dialoge auflisten (z. B. `lib/modules/<modul>/…`, `*_screen.dart`, `*_page.dart`, `*_view.dart`,
`*_dialog.dart`). Daraus Features ableiten (Ansichten, Erstellen/Bearbeiten, Filter, Einstellungen …) und mit den Seed-Features
abgleichen: **vorhanden / fehlt im Seed / nur im Seed (Annahme)**.

## 5. Themes (Graphite / Horizon / Intensiv)
Theme-Definitionen finden (`ThemeData`, `ColorScheme`, `ThemeExtension`, `graphite`, `horizon`, `intensiv`).
Exakte Farbwerte je Rolle notieren und auf die Rollen in `app/src/design-system/tokens.js` (`COLOR_ROLES`) abbilden.
Danach `tokens.js` anpassen (TODO-Kommentar dort), `npm run qa` (globale Änderung → alle Features).

## 6. Frühere Designprototypen, HTML-Vorschauen, Konzepte
Suchen: `*.html` außerhalb von build-Ordnern, `*prototyp*`, `*preview*`, `*konzept*`, `*design*`, `*.md` in docs-Ordnern.
Besonders **Fitness- und Finanzen-Konzepte** (separat erarbeitet, Referenz für das Designsystem): Fundorte notieren, Kernanforderungen
in die Referenzmodule (`seed/modules/fitness.js`, `finance.js` → `docs`, `requirements`) übernehmen – **ohne neues Vollaudit**.
Fundstellen als `references` an den passenden Features hinterlegen.

## 7. Ergebnisse in die Workbench übernehmen
1. `docs/PHASE1_ERGEBNIS.md` schreiben (Git-Status, Version, Kopien, Modul-/Feature-Tabelle mit Belegen, Themes, Prototypen, Abweichungen).
2. Seed anpassen (`app/src/seed/modules/*.js`): fehlende Module/Features ergänzen, Annahmen (`home`, `settings`) bestätigen oder
   entfernen, `source` auf die echte Quelle setzen. `SEED_VERSION` in `seed/index.js` erhöhen.
3. `npm run check` → `npm run qa`.
4. In der Workbench: **Daten & Backup › Neue Seed-Inhalte übernehmen** (fügt Neues hinzu, ändert nichts Bestehendes).
   Hat noch niemand in der Workbench gearbeitet, ist **Zurücksetzen** einfacher (exportiert vorher automatisch).
5. `TASKS.md` und `WORK_LOG.md` aktualisieren.

## Ergebnis-Vorlage `docs/PHASE1_ERGEBNIS.md`
```markdown
# Phase 1 – Ergebnis (Datum)
## Git
Branch · Commit · Status (geändert/untracked) · Bewertung
## Version & Kopien
| Pfad | Version | letzter Commit | maßgeblich? |
## Module (Modulregister: <Pfad:Zeile>)
| ID | Name | Icon | Einstieg | Features (Anzahl) | im Seed? |
## Features je Modul
| Modul | Feature | Quelle (Pfad) | Seed-ID | Status/Abweichung |
## Themes
| Rolle | Graphite | Horizon | Intensiv | Quelle |
## Prototypen & Konzepte
| Pfad | Art | Inhalt | übernommen nach |
## Abweichungen & Entscheidungen für den Nutzer
```
