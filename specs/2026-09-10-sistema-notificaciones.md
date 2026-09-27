# Spec: Sistema de notificaciones (interno + abstracción multi-canal) e ícono de notificaciones

**Spec #:** 3
**Status:** implemented
**Date:** 2026-09-10
**Area:** both

## Problem / Context

Hoy no existe ningún módulo de notificaciones en el backend ni en el frontend (verificado: no hay
`chat`/`notificacion`/`notification` en `server/src`, y las únicas coincidencias en `src/` son
incidentales). Un trabajador no se entera cuando su oferta es aprobada, cuando se abre una disputa,
ni cuando su trabajo se finaliza y se le libera el pago. Un cliente no se entera cuando recibe una
nueva oferta ni cuando su solicitud pasa a `ejecucion`. Todo depende de que el usuario refresque el
dashboard manualmente.

`Perfil.tsx` (pestaña "Ajustes") ya tiene un `Card` de "Notificaciones" con dos `Switch`
("Correo electrónico", "Push") — pero son controles puramente visuales, no conectados a nada real
todavía.

## Goals

- Se crea un registro de notificación interna persistida para el usuario correcto en estos eventos:
  - **Trabajador**: oferta aceptada; solicitud entra en disputa; trabajo finalizado (y, como
    consecuencia, pago liberado).
  - **Cliente**: recibe una nueva oferta sobre su solicitud; su solicitud pasa a `ejecucion`;
    solicitud entra en disputa.
- Un ícono de notificaciones (campana) visible en la interfaz muestra el conteo de no leídas y una
  lista desplegable de las notificaciones del usuario autenticado; abrir/hacer click marca como
  leída.
- El backend está construido con una abstracción de canal (interno / SMS / Email / Push) para que
  agregar canales reales sea incremental, pero en esta primera versión **solo el canal interno se
  entrega de verdad** — SMS/Email/Push quedan como no-ops (o solo log) hasta integrar un proveedor
  real, siguiendo el mismo criterio que ya aplica este proyecto al flujo de pago (`PagoFlowDialog`
  es un mock, no una integración real).

## Non-Goals / Out of Scope

- Integración real con un proveedor de SMS/Email/Push (Twilio, SES, FCM, etc.) — explícitamente
  fuera de alcance en esta v1; la abstracción existe para que no haya que rediseñar cuando se
  integre.
- Conectar los `Switch` de preferencias de `Perfil.tsx` para de verdad suprimir canales — fuera de
  alcance salvo que se resuelva incluirlo en Open Questions.
- Entrega en tiempo real (WebSocket/SSE) a una pestaña abierta — v1 puede hacer fetch al montar /
  al abrir el dropdown; push en vivo queda como mejora futura.

## Proposed Approach

Nueva entidad `Notificacion` (`userUsername`, `tipo`, `mensaje`, `solicitudId` nullable, `leido`
boolean, `createdAt`) y un módulo `server/src/notificaciones/` (service + controller) con
`GET /notificaciones` (las del usuario autenticado, más recientes primero) y
`PATCH /notificaciones/:id/leer`. Un método `NotificacionesService.crear(...)` se invoca desde los
servicios que ya son dueños de cada transición de estado (no se centraliza en un solo lugar
desacoplado de la lógica de negocio):

- `OfertasService.crear` → notifica al cliente ("nueva oferta recibida").
- `OfertasService.aceptar` → notifica al trabajador ("oferta aceptada") y, ya que esta también deja
  `solicitud.estado = 'ejecucion'`, notifica al cliente ("tu solicitud pasó a ejecución").
- `SolicitudesService.actualizarEstado` (el endpoint genérico `PATCH /solicitudes/:id/estado`, sin
  validación de transición — usado hoy por el flujo directo "Tomar trabajo" que salta ofertas) →
  si `dto.estado === 'ejecucion'`, notifica al cliente (cubre el otro camino, no-oferta, hacia
  ejecución); si `dto.estado === 'finalizado'`, notifica al trabajador. **Nota:** hoy no existe en
  el código ningún método dedicado que ponga `estado = 'finalizado'` — solo este endpoint genérico
  podría hacerlo si el frontend lo llama con ese valor; no se está inventando ni validando ese flujo
  aquí, solo enganchando la notificación al único punto de entrada que existe para ese estado.
- Transición a `disputa` (spec `specs/2026-09-10-limite-correccion-y-disputa.md`, Spec #4) → notifica
  a cliente y trabajador. **Depende de que el Spec #4 esté implementado primero** (agrega el estado
  `disputa` y los métodos `solicitarCorreccion`/`abrirDisputa` que lo producen); hasta entonces este
  gancho específico queda como seguimiento, no se implementa en el mismo cambio que el resto de esta
  spec.

## Backend Impact

- Nuevo módulo `server/src/notificaciones/` (`notificacion.entity.ts`, `notificaciones.service.ts`,
  `notificaciones.controller.ts`, `dto/`).
- Agregar `Notificacion` a `entities: [...]` en `server/src/database/data-source.ts` + migración.
- Llamadas a `NotificacionesService.crear(...)` insertadas en los puntos listados arriba
  (`OfertasService`, `SolicitudesService`), inyectando el nuevo servicio donde haga falta.

## Frontend Impact

- Nuevo `src/store/notificacionesStore.ts` (lista + conteo no leídas + `fetchAll`/`marcarLeida`,
  llamado una sola vez al montar cada página autenticada — sin polling, ver Resolved Questions).
- Nuevo componente de campana con dropdown (p. ej. `NotificacionesMenu.tsx`). No existe hoy un
  header/nav compartido entre páginas — `Dashboard.tsx` (`<header>` en la línea ~292) y
  `Perfil.tsx` (`<header>` en la línea ~219) cada una renderiza el suyo de forma independiente. El
  componente se instancia en **ambos** headers (grupo de acciones a la derecha, junto al botón "Mi
  perfil"/"Salir" — `Dashboard.tsx` línea ~307, `Perfil.tsx` línea equivalente), no en un layout
  compartido nuevo.

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿Dónde vive el header/nav compartido para anclar la campana? **Resuelto por el usuario:** no hay
  header compartido, es un componente nuevo — se instancia en los headers propios de `Dashboard.tsx`
  y `Perfil.tsx` (confirmado en código: cada uno tiene su `<header>` independiente).
- ¿La campana aparece en ambos headers o solo en Dashboard? **Resuelto por el usuario:** en ambos
  (Dashboard y Perfil).
- ¿Cada cuánto se refresca el conteo de no leídas? **Resuelto por el usuario:** por ahora solo al
  refrescar/cargar la página — sin polling ni refresco al abrir el dropdown.
- ¿La notificación de "trabajo finalizado / pago liberado" se dispara aunque no exista integración
  real de pagos? **Resuelto por el usuario:** sí, se dispara con la transición de la solicitud a
  `finalizado`, independientemente de que el pago real no exista todavía.
- ¿El rol `admin` recibe notificaciones en esta spec? **Resuelto por el usuario:** no, el admin
  queda fuera de alcance por ahora.

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
