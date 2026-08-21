# Authoring → published VISITA — traceability matrix

Proved by `qa/tools/visita-traceability.mjs`, not by reading code.

Every field is written with a run-unique sentinel before the panel is opened, so
a value that merely *looks* right cannot pass: the demo config ships the same
words the author would type, and a surface printing its own copy would be
indistinguishable from a connected one under any weaker test. A sentinel that
reaches VISITA proves the record was read. Surviving demo text would prove the
opposite.

| Authoring field | Config path | Runtime consumer | Visitor surface | Status |
|---|---|---|---|---|
| Horarios | `visitor.hours` | `hud.setVisitorInfo()` | VISITA · Horarios | CONNECTED |
| Dirección | `visitor.address` | `hud.setVisitorInfo()` | VISITA · Dirección | CONNECTED |
| Entrada | `visitor.admission` | `hud.setVisitorInfo()` | VISITA · Entrada | CONNECTED |
| Accesibilidad | `visitor.accessibility` | `hud.setVisitorInfo()` | VISITA · Accesibilidad | CONNECTED |
| Cómo llegar | `visitor.transport` | `hud.setVisitorInfo()` | VISITA · Cómo llegar | CONNECTED |
| Aparcamiento | `visitor.parking` | `hud.setVisitorInfo()` | VISITA · Aparcamiento | CONNECTED |
| Contacto | `visitor.contact` | `hud.setVisitorInfo()` | VISITA · Contacto | CONNECTED |
| Más información | `visitor.notes` | `hud.setVisitorInfo()` | VISITA · Más información | CONNECTED |
| Reservar visita | `visitor.bookingUrl` | `hud.setVisitorInfo()` | VISITA · CTA Reservar | CONNECTED |
| Comprar entrada | `visitor.ticketUrl` | `hud.setVisitorInfo()` | VISITA · CTA Comprar | CONNECTED |
| Cómo llegar (enlace) | `visitor.directionsUrl` | `hud.setVisitorInfo()` | VISITA · CTA Cómo llegar | CONNECTED |
| Programación | `visitor.programme[]` | `hud.setVisitorInfo()` | VISITA · Programación | CONNECTED |

**12 CONNECTED · 0 PARTIAL · 0 HARDCODED · 0 NOT REPRESENTED.**

There is one authoritative Visitor truth: `config.visitor`, normalised by
`normaliseVisitor()` and rendered by `hud.setVisitorInfo()`. No duplicated
hard-coded Visitor content was found, so no de-duplication work is required.

## What this does not cover

Media referenced by these records. A field can be CONNECTED and still point at
an asset that does not survive the session — that is P0.2, and it is a separate
contract. CONFIG PERSISTENCE IS NOT ASSET PERSISTENCE.
