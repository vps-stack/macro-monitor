# MM-02: proxy-addr und Produktionsrelevanz

Triage zu [Issue #12](https://github.com/vps-stack/macro-monitor/issues/12), geprüft am 15.10.2026 gegen Commit `4f75fc1cd342503994f115d468bb1f8fc66a5669`.

## Einstufung

| Ebene | Ergebnis | Nachweis/Grenze |
| --- | --- | --- |
| Dependency | **Betroffen** | Lockfile und lokale Installation enthalten `proxy-addr` 2.0.7. |
| Codevoraussetzung | **Fehlt** | Numerisches `trust proxy = 1`; keine Trust-Subnetze im Anwendungscode. |
| Produktionsversion | **Offen** | Keine Bestätigung aus dem laufenden produktiven Backend. |
| Infrastruktur | **Unklar** | Proxykette, Porterreichbarkeit und Headerbehandlung nicht bestätigt. |

Damit ist kein ausnutzbarer Critical-Befund in MacroMonitor nachgewiesen. Die fehlende Codevoraussetzung ist keine pauschale Freigabe der Infrastruktur. Der Auftraggeber hat angewiesen, die fehlenden Produktionsangaben als offen zu dokumentieren; der entsprechende Nachweis im Issue bleibt ausstehend.

## Advisory und Voraussetzungen

[GHSA-jqcg-44mw-7w3h / CVE-2026-90711](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), Stand 05.10.2026, ist als **Critical (CVSS 9.1)** bewertet. Betroffen: `>= 1.1.0, < 2.0.8`; erste gepatchte Version: **2.0.8**.

Die Voraussetzung ist eine problematische IPv6-Trust-Subnetzkonfiguration: etwa `::ffff:10.0.0.0/8` statt `/104`, oder ein Subnetz mit führenden Nullbits wie `::/1`. Dadurch können unerwartet IPv4-Adressen als vertrauenswürdige Proxys gelten und vom Client gesetzte `X-Forwarded-For`-Werte die IP-Ermittlung beeinflussen. Mögliche Folgen betreffen IP-basierte Kontrollen und Logs. Versionsbetroffenheit allein belegt diese Konfiguration nicht.

## Repository- und lokaler Laufzeitnachweis

`npm ls express proxy-addr forwarded ipaddr.js --omit=dev --prefix backend` und lesende Auswertung von `backend/package-lock.json` ergeben übereinstimmend:

```text
express 4.22.3
└── proxy-addr 2.0.7       (Express-Anforderung: ~2.0.7)
    ├── forwarded 0.2.0
    └── ipaddr.js 1.9.1
```

Dies sind **lokale** Nachweise. Der Deploymentworkflow verwendet zwar das Backend-Lockfile und `npm ci --omit=dev`; daraus folgt nur die erwartete Version eines unveränderten erfolgreichen Deployments, nicht die tatsächlich laufende Produktionsversion.

`backend/src/server.ts:28` setzt `app.set('trust proxy', 1)`. Die Suche in `backend/src` findet keine andere Trust-Konfiguration oder IPv6-Trust-Subnetze. Im lokal installierten Express implementiert `lib/utils.js` den numerischen Fall direkt als Hop-Prüfung `i < val`; er ruft dabei nicht `proxyaddr.compile` zur Subnetzerstellung auf. Die konkrete Advisory-Voraussetzung fehlt somit in diesem Codepfad.

`generalLimiter` und `authLimiter` verwenden den Standard-IP-Schlüssel von `express-rate-limit` und damit `req.ip`. `authLimiter` schützt unter anderem `/login` und `/register`. Die eigentliche Nutzerautorisierung prüft hingegen JWT-Cookie und Nutzerdokument (`backend/src/middleware/auth.ts`); ein IP-basierter Login-Bypass wird hier nicht behauptet.

Zusätzliche einmalige lokale Probe mit Express/`proxy-addr`, ohne HTTP-Listener oder Netzwerkverkehr: numerisch `1` wird unverändert übernommen; dabei **null Subnetzkompilierungen**. Hop 0 wird vertraut, Hop 1 nicht. Rein synthetische Requestobjekte liefern:

| Socket-Adresse | `X-Forwarded-For` | Ermittelte IP |
| --- | --- | --- |
| `192.0.2.10` | `203.0.113.250, 198.51.100.23` | `198.51.100.23` |
| `198.51.100.23` | `203.0.113.250` | `203.0.113.250` |
| `198.51.100.23` | fehlt | `198.51.100.23` |

Die zweite Zeile zeigt ein **eigenständiges bedingtes Infrastruktur-Risiko** numerischen Proxyvertrauens: Könnten Clients den Backendport direkt erreichen, würde ein vorgeschobener Header geglaubt. Ob dieser Pfad existiert, ist unbekannt. [Express warnt bei numerischem Vertrauen vor kürzeren alternativen Zugriffspfaden](https://expressjs.com/en/guide/behind-proxies/). Die Probe belegt kein erreichbares Produktionsszenario und testet keinen Produktionslimiter.

## Noch erforderliche Betreiberbestätigung

Im tatsächlich vom Dienst verwendeten Backend-Verzeichnis kann der Betreiber rein lesend `npm ls express proxy-addr --omit=dev` ausführen und Ausgabe, Zeitpunkt sowie Zuordnung zum laufenden Release/Prozess mitteilen. Keine Installation, Aktualisierung oder Neustarts sind dafür vorgesehen. Ein Lockfile aus einem anderen Verzeichnis reicht nicht als Laufzeitbeleg.

Zusätzlich offen: tatsächliche Proxy-Hops einschließlich CDN/Loadbalancer, mögliche kürzere Zugriffswege, Listener-/Firewallfreigaben und das Entfernen bzw. vertrauenswürdige Ergänzen eingehender Forwarded-Header am Proxy. Bei Abweichungen muss die Bewertung erneut erfolgen. Es wurden keine Produktionsrequests oder Infrastrukturänderungen durchgeführt.

## Kleiner Folgefix und passende Abnahme

Ein gezieltes Lockfile-Update von **2.0.7 auf 2.0.8** ist sinnvoll, auch wenn die konkrete Codevoraussetzung fehlt. Das Patchrelease passt in Express' bestehendes `~2.0.7`. Laut [Release](https://github.com/jshttp/proxy-addr/releases/tag/v2.0.8) und [Paketmanifest des Tags](https://raw.githubusercontent.com/jshttp/proxy-addr/v2.0.8/package.json) bleiben `forwarded` 0.2.0, `ipaddr.js` 1.9.1 und die Node-Anforderung `>= 0.10` gleich. Das ist eine Kompatibilitätsindikation, noch keine Integrationsprüfung der neuen Version.

Für den Folgefix ausschließlich Version, Auflösungs-URL und Integrität des betroffenen Lockfile-Eintrags aktualisieren, unveränderte Express-/Restabhängigkeiten nachweisen und anschließend lokal sauber installieren und prüfen. Kein Express-Majorwechsel, keine neue direkte Dependency, kein Override und kein breites `npm audit fix`. Eine Änderung an `trust proxy` erst anhand der bestätigten Proxykette festlegen; das Paketpatch allein löst das mögliche Direktzugriffsrisiko nicht.

Dann genügen gezielte lokale Regressionstests mit synthetischer Proxykette: erwartete `req.ip`/`req.ips` bei einem Proxy, Umgang mit vorgeschobenen Headern und kürzeren Zugriffspfaden gemäß bestätigter Topologie sowie der vorhandene Authlimiter (gleiche ermittelte Client-IP bleibt im selben Zähler, 11. Anfrage innerhalb des Fensters ergibt 429, zweite Client-IP separater Zähler). Direkte/unerlaubte Pfade gemäß künftiger Vertrauenskonfiguration prüfen. Keine Produktionsrequests; Nutzerdatenzugriffe mocken.

Diese Triage ändert ausschließlich die Dokumentation; neue dauerhafte Regressionstests sind dafür nicht nötig. Lockfile und Laufzeitkonfiguration bleiben unverändert. Der separate moderate `ip-address`-Befund wird nicht in MM-02 aufgenommen. Produktionsversion und Infrastruktur bleiben offen; kein automatisches Schließen des Issues, Merge oder Deployment.
