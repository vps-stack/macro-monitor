# MM-03: USDA-Key im Client

Entscheidungsvermerk zu [Issue #11](https://github.com/vps-stack/macro-monitor/issues/11), geprüft am 15.10.2026 gegen Commit `adceb2c345f8c415c84f68d8bde9abd6956624f2`.

## Befund und Keyklasse

`VITE_USDA_API_KEY` ist ein FoodData-Central-/data.gov-API-Schlüssel zur Autorisierung von Provideranfragen, kein öffentlicher Client-Identifier und kein MacroMonitor-Nutzertoken. Die öffentlichen Lebensmitteldaten machen den Schlüssel nicht öffentlich verwendbar.

Der konkrete Pfad:

1. `.github/workflows/deploy.yml` schreibt `secrets.VITE_USDA_API_KEY` vor dem Frontendbuild nach `.env.production`. `.env.sample` nennt dieselbe Clientvariable.
2. `NewFoodPanel` übergibt den Produktnamen an `ProductNameSearch`. Dessen Suchbutton ruft nach einer Leerprüfung `searchProductByName(query)` auf.
3. `src/services/searchProductByName.ts` liest `import.meta.env.VITE_USDA_API_KEY`. Vite ersetzt diesen Zugriff beim Build durch den konfigurierten Wert.
4. Der Browser ruft direkt `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=<synthetischer-wert>&query=…` auf, mit `pageSize=15` und den Datentypen `Foundation,SR Legacy`. Der Schlüssel ist damit im Bundle und in der Request-URL sichtbar. Die MacroMonitor-Backendauthentifizierung und deren Ratenlimit liegen nicht auf diesem Pfad.

GitHub-Secrets schützen den Build-Eingang, nicht den Wert im veröffentlichten JavaScript. [Vite dokumentiert die Einbettung von `VITE_*` ausdrücklich](https://vite.dev/guide/env-and-mode#env-variables).

## Providerbewertung

Der [USDA API Guide](https://fdc.nal.usda.gov/api-guide/#key-responsibility) verlangt, den Schlüssel geheim zu halten; öffentlich gefundene Keys werden deaktiviert. Er nennt standardmäßig 1.000 Anfragen pro Stunde und IP, bei Überschreitung eine einstündige Keysperre und HTTP 429. Eine spätere Bündelung über das Backend konzentriert Anfragen auf dessen Ausgangs-IP.

Bewertung: Ein auslesbarer gültiger Key kann für fremde Anfragen verwendet werden; Quotenverbrauch und Deaktivierung können die Suche beeinträchtigen. Das ist eine Risikobewertung, kein Missbrauchsnachweis. Es wurden weder echte Schlüssel, GitHub-Secretwerte, lokale `.env`-Dateien noch vorhandene/produktive Bundles untersucht. Ob aktuell ein echter Key ausgeliefert wird, bleibt offen.

## Isolierter Buildnachweis

Eine temporäre Kopie enthielt ausschließlich mit `git ls-files` ausgewählte Frontenddateien aus `src/`, `public/`, `index.html`, `package.json`, `vite.config.ts` und den beiden Frontend-tsconfigs. Keine `.env`-Dateien, vorhandenen Builds oder Backenddateien wurden kopiert. Installierte Buildabhängigkeiten wurden aus dem Repository verwendet.

Für die Reproduktion alle geerbten Variablen mit Namen `VITE_*` aus der Build-Prozessumgebung entfernen und ausschließlich diese synthetischen Werte setzen:

```text
VITE_USDA_API_KEY=MM03_SYNTHETIC_KEY_NOT_A_REAL_CREDENTIAL
VITE_API_URL=/api
VITE_CLOUDINARY_URL=https://images.invalid/
```

Danach in der Kopie mit der vorhandenen Vite-Konfiguration bauen; `envDir: false` verhindert das Laden von Umgebungsdateien:

```js
import { build } from 'vite';
await build({ root: isolatedCopy, envDir: false, build: { outDir: 'dist' } });
```

Anschließend ausschließlich die erzeugten `dist/assets/*.js` der Kopie nach dem Marker und der USDA-Such-URL durchsuchen. Nicht die Anwendung ausführen und keine Suchanfrage absenden.

Ergebnis mit Vite 7.3.6 / Node 24.13.1: Build erfolgreich, 1.832 Module, ein JavaScript-Bundle `index-BoyglkHx.js`; **genau ein Markervorkommen**, USDA-Suchendpunkt im selben Bundle. Vite meldete zusätzlich einen Chunk über 500 kB. Die Kopie wurde danach entfernt. Es gab keine USDA-API-, Cloudinary- oder Datenbankaufrufe. Dies weist die Einbettung im vorhandenen Pfad nach; es ist kein Nachweis eines kompromittierten echten Keys.

## Entscheidung und gesonderter Folgefix

MM-03 bleibt gemäß Issue eine Untersuchung. Die kleinste vorgeschlagene Korrektur nutzt das bestehende authentifizierte Express-Backend:

- Ein fester Suchendpunkt, beispielsweise `GET /api/food/search?query=…`, hinter `authenticate`; serverseitiger `USDA_API_KEY` ohne `VITE_`. Feste USDA-Zieladresse, keine frei wählbaren Provider oder URLs.
- Query als einzelnen String trimmen und auf 1–100 Zeichen begrenzen; ungültige Queries mit 400 vor jedem Provideraufruf ablehnen. `pageSize=15` und Datentypen serverseitig festlegen. Ein kleines Routenlimit pro authentifiziertem Nutzer ergänzen (Vorschlag: 10/min); das vorhandene allgemeine IP-Limit allein schützt die gemeinsame USDA-Quote nicht ausreichend. Dieses Nutzerlimit garantiert noch keine Einhaltung der gesamten Providerquote.
- Einen 5-Sekunden-Abbruch für Fetch und Bodylesen vorsehen. Upstream-429 kontrolliert als 429, Timeout als 504 und sonstige Upstreamfehler als 502 melden; keine Schlüssel, vollständigen Provider-URLs oder rohen Fehlerobjekte in Logs/Antworten. Fehlende Serverkonfiguration kontrolliert mit 503 beantworten.
- Die Browsersuche auf diesen Endpunkt mit vorhandenen Session-Credentials umstellen. Bestehendes Ergebnisformat und Nährwertmapping beibehalten. Clientvariable aus Code, Beispieldatei und Buildworkflow entfernen.

Kein generisches Provider-Gateway, zusätzlicher Pflichtcache oder neues Monitoring ist hierfür erforderlich. Weitere Quotenmaßnahmen erst nach tatsächlichem Bedarf festlegen.

Gezielte Abnahme des Folgefixes: synthetischer Marker fehlt im Browserbundle; ohne Session 401 und kein Upstreamaufruf; ungültige Query 400 ohne Upstreamaufruf; Upstream-429 und Timeout kontrolliert mit Mocks nachweisen; erfolgreiche Suche erhält ihre bisherige Ergebnisdarstellung. Die Untersuchung fügt keine dauerhafte Testsuite hinzu; diese Tests gehören zur noch nicht implementierten Migration.

Migration und Rotation sind separat freizugeben: zuerst den Backendpfad mit serverseitiger Konfiguration bereitstellen, dann den Client und dessen Buildkonfiguration umstellen und die Markerfreiheit prüfen. Alte veröffentlichte Bundles können einen bisherigen Key weiter enthalten. Anschließend einen möglicherweise veröffentlichten Key gesondert ersetzen/deaktivieren und alte Artefakte entsprechend behandeln. Dieser PR ändert oder rotiert keine Secrets und führt kein Deployment aus. Bis zur Umsetzung bleibt das dokumentierte Clientrisiko bestehen.
