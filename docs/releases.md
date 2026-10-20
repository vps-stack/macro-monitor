# Semantische Releases

Die Ausstattung wertet Conventional Commits aus und erzeugt bei Bedarf einen
Release-Commit, einen Versions-Tag und einen GitHub-Release mit Release Notes.
Root/Frontend und Backend erhalten dieselbe Version. Es wird nichts auf npm
veröffentlicht. Der Job `release` in `.github/workflows/deploy.yml` läuft bei
Pushes auf `main` parallel zu `build`. Die bestehenden Jobs `build` und `deploy`
bleiben unverändert; `deploy` hängt weiterhin ausschließlich von `build` ab.

## Voraussetzungen und Installation

Node.js `^22.14.0 || >=24.10.0` und npm sind erforderlich; empfohlen ist Node 24
ab 24.10.0. Diese Anforderung gilt auch für die lokalen Release- und Commitlint-
Werkzeuge. Im Repository-Root ausführen:

```sh
npm ci
npm --prefix backend ci
npm test
```

Der bestehende Build-Job nutzt weiterhin Node 20.20.2 für Installation und Build.
Dort kann npm wegen der neuen Entwicklungswerkzeuge Engine-Warnungen ausgeben.
Der neue Release-Job verwendet unabhängig davon Node **24.13.1**.

Das Root-`prepare`-Skript installiert die Husky-Hooks. `pre-commit` startet über
`npm test` die vorhandenen Backendtests; `commit-msg` prüft Conventional Commits.
Beide Installationen sind daher auch für Commits und Release-Commits nötig.
Die Commitlint-Konfiguration verwendet wegen `"type": "module"` einen ESM-Export.

## Commit-Konvention

Commitlint sowie Commit-Analyse und Release Notes verwenden das Preset
`conventionalcommits`. Beispiele (ausgehend von `1.0.0`):

| Commitnachricht | Wirkung |
| --- | --- |
| `fix: korrigiere die Kalorienberechnung` | Patch → `1.0.1` |
| `perf: beschleunige die Produktsuche` | Patch → `1.0.1` |
| `feat: ergänze einen Wochenbericht` | Minor → `1.1.0` |
| `feat!: ändere das Format der Archivdaten` | Major → `2.0.0` |
| `docs: aktualisiere die Anleitung` | kein Release |
| `chore: aktualisiere Entwicklungswerkzeuge` | kein Release |

Alternativ markiert ein Footer nach einer Leerzeile einen Major-Release:

```text
feat: vereinheitliche das Archivformat

BREAKING CHANGE: Archivdaten verwenden jetzt das neue Datumsformat.
```

Die höchste Wirkung aller Commits seit dem letzten Release bestimmt den
Versionssprung. Ohne releasewirksame Commits entstehen weder neue Version noch
Changelog-Eintrag oder Release. Auch der automatisch erzeugte Commit
`chore(release): 1.1.0 [skip ci]` besteht Commitlint und löst keinen weiteren
Release aus. Bei Squash-Merges muss die endgültige Commitnachricht auf `main`
der Konvention entsprechen.

## Versionsbasis einmalig initialisieren

Bei der Einrichtung am 20.10.2026 wurden weder lokale/Remote-Tags noch
GitHub-Releases gefunden. Root-Paket und Root-Lockfile wurden von `0.0.0` auf
`1.0.0` angeglichen; Backend-Paket und Backend-Lockfile standen bereits darauf.
semantic-release liest seine letzte Version aus erreichbaren Git-Release-Tags,
nicht aus `package.json`. Ohne Ausgangstag würde es die gesamte Historie als
ersten Release behandeln.

Bei der erneuten Remote-Prüfung stand `main` auf
`1394ff916a590cc626ed3a8ad17b4ca77023a8eb`: Root-Paket und Root-Lockfile dort
noch `0.0.0`, Backend-Paket und Backend-Lockfile `1.0.0`. Diesen Stand deshalb
noch nicht mit `v1.0.0` markieren; zuerst die gemeinsame Versionsbasis integrieren.

Der Release-Job prüft vor Installationen und Release-Aufruf, ob `v1.0.0`
existiert und vom ausgecheckten `main`-Commit erreichbar ist. Ohne diese Basis
schlägt nur der Release-Job mit einer verständlichen Fehlermeldung fehl;
`build` und `deploy` können weiterhin laufen. So veröffentlicht der erste
Integrations-Push vor dem Setzen des Tags nicht versehentlich die alte Historie.

Die erstmalige Aktivierung erfolgt in dieser Reihenfolge (nur Anleitung;
bei der Einrichtung nicht ausgeführt):

Vor Schritt 1 die im Abschnitt „GitHub-Authentifizierung und Rechte“ beschriebenen
Actions-Einstellungen und Push-Rechte prüfen.

1. Alle Release-Dateien aus dieser Einrichtung einschließlich Workflow,
   Root-Paket/Lockfile, Husky, Commitlint und Changelog gemeinsam auf `main`
   übernehmen. Bis zur Initialisierung keine weiteren Feature-/Fix-Änderungen
   auf `main` integrieren. Den dadurch gestarteten Workflow beenden lassen;
   sein Release-Job scheitert zunächst erwartungsgemäß am fehlenden Ausgangstag.
2. Mit Node 24.13.1 lokal einen sauberen, mit `origin/main` synchronisierten
   Checkout herstellen. Der aktuelle kanonische Repository-Name ist
   `vps-stack/macro-monitor`; das bisherige `origin` zeigt noch auf die
   weitergeleitete Adresse `Flotsam3/MacroMonitor`. Vor manuellen Release-
   Aufrufen `origin` aktualisieren, da das GitHub-Plugin den Repository-Namen
   gegen die API prüft. `actions/checkout` verwendet im Job automatisch die
   aktuelle Repository-Adresse.

```sh
git remote set-url origin https://github.com/vps-stack/macro-monitor.git
git switch main
git pull --ff-only origin main
git status --short
git fetch origin --tags
git tag --list
git ls-remote --tags origin
git log -5 --oneline --decorate
```

3. Kontrollieren, dass der Arbeitsbaum sauber ist und `HEAD` dem gewünschten
   Ausgangsstand auf `origin/main` entspricht. Root- und Backend-`package.json`
   sowie beide Lockfiles müssen `1.0.0` enthalten; bei Lockfiles auch
   `packages[""].version` prüfen. Abhängigkeiten installieren und Tests ausführen:

```sh
npm ci
npm --prefix backend ci
npm test
```

4. Prüfen, dass weder `v1.0.0` noch neuere Release-Tags existieren. Dann den
   bewusst geprüften `HEAD` auf `main` als gemeinsame Ausgangsversion markieren:

```sh
git tag v1.0.0 HEAD
git push origin v1.0.0
```

5. Im GitHub-Actions-Lauf aus Schritt 1 **nur die fehlgeschlagenen Jobs erneut
   ausführen**, sofern dessen Commit noch dieser Ausgangsstand ist. Der frische
   Checkout lädt das Tag; der Release-Job soll mit bestandenen Tests und ohne
   releasewirksame Commits seit `v1.0.0` erfolgreich ohne Veröffentlichung enden.
   Ein Tag-Push startet diesen Workflow nicht, weil sein Trigger ausschließlich
   Branch-Pushes auf `main` umfasst. Optional kann zuvor lokal mit den unten
   beschriebenen Zugangsdaten `npm run release:dry-run` ausgeführt werden.
6. Der nächste normale Push/Merge auf `main` löst den Job automatisch aus.
   Ein späterer `fix:`-Commit führt beispielsweise von `1.0.0` zu `1.0.1`,
   ein `feat:`-Commit zu `1.1.0`; ohne releasewirksame Commits bleibt es bei `1.0.0`.

Bestehende Tags nicht überschreiben. Ein auf einem anderen Branch verbleibendes
Tag ist keine verlässliche Basis für `main`. Der Ausgangstag benötigt keinen
GitHub-Release. Alle Änderungen bis einschließlich des markierten Commits sind
damit als Ausgangsstand abgegolten; nur spätere Commits werden für neue Releases
ausgewertet. Changelog und Paketdateien allein initialisieren diese Git-Historie
nicht.

## Automatischer Release-Job und Auswirkungen

Wie im Exlingua-Vorbild lädt `actions/checkout@v4` mit `fetch-depth: 0` die
vollständige Historie samt Tags. Nach der Prüfung der Ausgangsbasis installiert
der Job unter Node 24.13.1 mit `npm ci` Root- und Backend-Abhängigkeiten. Das
Root-`prepare` aktiviert Husky; die Backend-Installation stellt die Werkzeuge
für den Pre-Commit-Testhook bereit. `npm test` wird außerdem ausdrücklich vor
semantic-release ausgeführt, damit auch Läufe ohne Release auf Backendfehler
geprüft werden. Husky bleibt aktiviert und prüft beim Release-Commit erneut die
Tests und dessen Nachricht.

`npx --no-install semantic-release` verwendet nur die installierte Version aus
dem Lockfile und behält die CI-Prüfungen bei. Die lokalen npm-Release-Skripte
verwenden dagegen bewusst `--no-ci`. Eine Concurrency-Gruppe nur für `release`
verhindert gleichzeitige Releases desselben Branches; ein laufender Release
wird nicht abgebrochen. `build` wird dadurch nicht serialisiert.

Der Job aktualisiert zuerst die Root-Versionen, dann die Backend-Versionen.
Der Release-Commit umfasst ausschließlich Changelog und die vier Paketdateien
und lautet `chore(release): ${nextRelease.version} [skip ci]`.

Dieser Commit startet keinen weiteren Build oder Deploy: `[skip ci]` überspringt
Push-Workflows; außerdem lösen Pushes und Releases mit dem eingebauten
`GITHUB_TOKEN` keine weiteren Push-/Release-Workflows aus. Es entsteht keine
Release-Schleife. Auch ein künftiger Workflow mit `on: release` würde durch
diesen Token keinen Folgelauf erhalten.

Da `release` und `build` unabhängig sind, kann ein Release trotz fehlgeschlagenem
Build veröffentlicht werden; umgekehrt verhindert ein Releasefehler kein
Deployment nach erfolgreichem Build. Build und Deployment verwenden den
ursprünglichen auslösenden Commit. Sie enthalten daher die Paketversionen
dieses Commits, nicht die erst parallel erzeugten Release-Versionen. Es erfolgt
kein zweites Deployment des Release-Commits. Diese Eigenschaften sind bewusst
wie beim Vorbild beibehalten.

## Dry-Run und manueller Release

Mit vollständiger Git-Historie und Tags auf einem sauberen, mit `origin/main`
synchronisierten `main` sowie installierten Root- und Backend-Abhängigkeiten:

```sh
npm run release:dry-run
npm run release
```

Die Skripte verwenden `--no-ci`, damit sie ausdrücklich auch lokal laufen.
Nur `main` ist als Release-Branch konfiguriert; auf anderen Branches wird kein
Release ausgeführt. Ein Dry-Run prüft unter anderem Plugins, Authentifizierung,
Push-Berechtigungen und Commit-Auswertung und zeigt die Release Notes. Er
überspringt `prepare`, `publish`, `success` und `fail`: Er schreibt keine
Release-Dateien, erstellt keinen Release-Commit/Tag und veröffentlicht nichts.
Die tatsächliche Aktualisierung beider Pakete wird dabei nicht ausgeführt.
Uncommittete Änderungen sind keine Eingabe für die Commit-Auswertung.

Der reguläre Aufruf aktualisiert zuerst Root-Paket und Root-Lockfile über
`@semantic-release/npm` mit `npmPublish: false`, dann Backend-Paket und
Backend-Lockfile über `npm version --no-git-tag-version`. Das Git-Plugin nimmt
ausschließlich `CHANGELOG.md` und diese vier Paketdateien in den Commit
`chore(release): ${nextRelease.version} [skip ci]` auf. Anschließend werden
Release-Commit und `v${version}`-Tag gepusht und der GitHub-Release erstellt.
Auch bei manuellen Release-Aufrufen unterdrückt `[skip ci]` am Release-Commit
einen erneuten Push-Workflow.

## GitHub-Authentifizierung und Rechte

Im Release-Job wird das automatisch bereitgestellte
`${{ secrets.GITHUB_TOKEN }}` als `GITHUB_TOKEN` verwendet; ein zusätzliches
PAT-Secret ist für diese Konfiguration nicht erforderlich. Nur dieser Job
erhält `contents: write`, `issues: write` und `pull-requests: write`.
Die Checkout-Action behält standardmäßig die Git-Zugangsdaten für den Push.
semantic-release setzt ohne eigene Vorgaben die Git-Identität
`semantic-release-bot`; eine zusätzliche globale Git-Konfiguration ist im Job
nicht nötig.

Bei der lesenden GitHub-Prüfung am 20.10.2026 war die Standardberechtigung für
Workflows `read`; Actions waren aktiviert und alle Actions zugelassen, ohne
Pflicht zur SHA-Pinnung. Die Leserechte werden durch die expliziten
Job-Berechtigungen ergänzt;
eine pauschale Umstellung aller Jobs auf Schreibrechte ist nicht nötig.
`main` hatte keinen klassischen Branch-Schutz, die Liste wirksamer Branch-Regeln
und die Repository-Rulesets waren leer. Der für die Abfrage verwendete Benutzer
hatte Admin-/Push-Rechte; das beweist keine Rechte des erst im CI erzeugten
Tokens. Die effektiven Tokenrechte lassen sich erst im Lauf unter
**Set up job → GITHUB_TOKEN Permissions** kontrollieren.

Vor Aktivierung in **Settings → Actions → General** prüfen, dass Actions und
die verwendeten Checkout-/Setup-Node-Actions erlaubt sind und übergeordnete
Richtlinien die angeforderten Schreibrechte nicht verhindern. Unter
**Settings → Rules → Rulesets** und **Branches** prüfen, dass der Job direkt nach
`main` und neue Versions-Tags pushen darf. Später eingeführte Pflicht-PRs,
Statuschecks oder Signaturpflichten können den Release-Push blockieren;
`contents: write` umgeht solche Regeln nicht. Die Option zum Erstellen oder
Genehmigen von Pull Requests ist hier nicht erforderlich: Der Job kommentiert
gegebenenfalls bestehende PRs, erstellt aber keine neuen.

Für **lokale manuelle** Aufrufe gilt:

`GH_TOKEN` oder `GITHUB_TOKEN` muss für das Repository verfügbar sein. Für einen
Fine-grained PAT benötigt das GitHub-Plugin `Contents: read/write`,
`Issues: read/write` und `Pull requests: read/write` (für Release-Verweise und
Kommentare); ein klassischer PAT benötigt den Scope `repo`. Ein bloßes
`gh auth login` ersetzt diese Umgebungsvariable nicht automatisch. Git muss
ebenfalls nichtinteraktiv zu `origin` authentifiziert sein, z. B. über einen
Credential Helper oder SSH. Token niemals in Dateien oder Remote-URLs ablegen.

Für Release-Commits muss die Git-Identität (`user.name`, `user.email`) gesetzt
sein. Die Identität bzw. der Token muss Commits nach `main` und neue Tags pushen
sowie GitHub-Releases erstellen dürfen; Branch-/Tag-Schutzregeln müssen dies
erlauben. npm-Zugangsdaten werden nicht benötigt. Netzwerkzugriff auf GitHub
und diese Schreibrechte sind auch für die Verifikation im Dry-Run nötig.

Weiterführend: [semantic-release-Konfiguration](https://semantic-release.gitbook.io/semantic-release/usage/configuration),
[Commit-Analyse](https://github.com/semantic-release/commit-analyzer#configuration)
und [GitHub-Authentifizierung](https://github.com/semantic-release/github#github-authentication).
Details zu [GITHUB_TOKEN und Folge-Workflows](https://docs.github.com/en/actions/concepts/security/github_token),
[übersprungenen Workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)
und [Job-Berechtigungen](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions).
