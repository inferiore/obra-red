# Spec: Cliente puede eliminar una solicitud publicada sin oferta aceptada

**Status:** implemented
**Date:** 2026-10-19
**Area:** both

## Problem / Context

Un cliente que publica una solicitud por error (o simplemente ya no la necesita) no tiene forma de
borrarla, ni siquiera antes de que nadie la tome en firme. Hoy el único camino es dejarla ahí
indefinidamente, incluso si ya recibió ofertas que el cliente no piensa aceptar.

De hecho, el backend ya tiene un endpoint `DELETE /solicitudes/:id`
(`server/src/solicitudes/solicitudes.controller.ts:106`) y el store del frontend ya expone
`solicitudesStore.eliminar()` (`src/store/solicitudesStore.ts:130`) — pero:
- El endpoint no tiene **ningún** guard de rol, dueño ni estado: cualquier usuario autenticado
  (cliente, trabajador o admin) puede borrar cualquier solicitud de cualquier otro usuario, en
  cualquier estado, incluso una en `ejecucion` con evidencias/disputa.
- Ningún componente de la UI llama a `eliminar()` — no hay botón en ningún lado.

Este spec cierra ambos huecos a la vez: agrega las reglas de negocio que faltan en el endpoint ya
existente, y expone la acción en la UI.

## Goals

- Un cliente puede eliminar **su propia** solicitud mientras no tenga ninguna oferta `aceptada` ni
  un trabajador asignado directamente (flujo "Tomar trabajo") — es decir, mientras nadie la haya
  tomado en firme todavía. Puede tener ofertas `pendiente` sin problema; esas se borran junto con
  la solicitud (cascade / borrado manual previo, ver Backend Impact).
- El endpoint `DELETE /solicitudes/:id` rechaza el borrado si quien llama no es el cliente dueño,
  si existe alguna oferta `aceptada` para esa solicitud, o si `solicitud.trabajadorAsignado` está
  asignado (cubre el caso "Tomar trabajo", que no pasa por `ofertas` en absoluto).
- El botón de eliminar aparece tanto en la card del Dashboard como en `SolicitudDetailDialog`,
  visible solo cuando esas condiciones se cumplen, con un diálogo de confirmación (acción
  irreversible).

## Non-Goals / Out of Scope

- Soft-delete / papelera / posibilidad de restaurar — se borra el registro de verdad, igual que ya
  hace `SolicitudesService.eliminar` hoy.
- Permitir eliminar una vez que hay trabajador asignado (oferta aceptada o "Tomar trabajo") —
  cubre automáticamente los estados `ejecucion`, `revision`, `corrigiendo`, `disputa`,
  `finalizado`, que solo se alcanzan después de asignar un trabajador. Eliminar en esos casos
  requeriría decidir qué pasa con evidencias, pagos, etc.; fuera de alcance.
- Notificar a los trabajadores que ofertaron (`pendiente`) de que su oferta fue borrada junto con
  la solicitud — se van en silencio, igual que al cerrar/expirar una oferta hoy.
- Permitir que un admin elimine solicitudes de otros (no se pide; el admin no es parte de este
  flujo).

## Proposed Approach

Agregar las validaciones que hoy faltan en `SolicitudesService.eliminar` y en el controller, y
cablear el botón ya soportado por el store a la tarjeta de solicitud del cliente en el Dashboard.

## Backend Impact

- `server/src/solicitudes/solicitudes.controller.ts:106` — agregar `@UseGuards(JwtAuthGuard,
  RolesGuard)` + `@Roles('cliente')` al endpoint `eliminar`, y pasar `req.user.username` al
  servicio (igual que `subirEvidencias`/`abrirDisputa`).
- `server/src/solicitudes/solicitudes.service.ts:143` (`eliminar`) — recibir
  `clienteUsername: string` y:
  - `ForbiddenException` si `solicitud.clienteUsername !== clienteUsername`.
  - `ConflictException` si `solicitud.trabajadorAsignado` está asignado (cubre tanto una oferta
    aceptada como el flujo directo "Tomar trabajo", ya que ambos son los únicos caminos que
    asignan `trabajadorAsignado`).
  - `ConflictException` si existe alguna oferta con `solicitudId = id` y `estado === 'aceptada'`
    (defensivo; en teoría ya implica `trabajadorAsignado` seteado, pero evita depender de un solo
    campo).
  - Inyectar `OfertasService` o el repo de `Oferta` en `SolicitudesModule`/`SolicitudesService`
    para la consulta anterior, según cómo esté armado el módulo hoy.
- Ofertas `pendiente` que queden asociadas a la solicitud: `Oferta.solicitud` ya tiene
  `onDelete: 'CASCADE'` a nivel de FK (`server/src/ofertas/oferta.entity.ts`), así que deberían
  borrarse solas al eliminar la solicitud — **verificar en la implementación** que SQLite
  realmente tiene `PRAGMA foreign_keys = ON` en esta conexión (TypeORM no siempre lo activa por
  default); si no, borrar las ofertas pendientes manualmente antes del `repo.remove()`.
- No requiere migración (no cambia el schema).

## Frontend Impact

- Condición para mostrar el botón, en ambos lugares: `!s.trabajadorAsignado` y ninguna de
  `s.ofertas` (ya embebidas en `GET /solicitudes`) tiene `estado === 'aceptada'`.
- `src/pages/Dashboard.tsx` — en la vista de cliente, donde se renderiza cada card de su propia
  solicitud, agregar un botón/ícono "Eliminar" visible cuando se cumple la condición anterior.
- `src/components/SolicitudDetailDialog.tsx` — mismo botón/condición en el detalle, visible solo
  cuando quien ve el diálogo es el cliente dueño.
- Confirmación antes de llamar a `solicitudesStore.eliminar(id)` — usar el patrón de diálogo de
  confirmación ya existente en el proyecto (ver si hay uno genérico tipo `AlertDialog` de
  shadcn/ui ya en uso para otra acción destructiva; si no, usar el primitivo `AlertDialog` de
  `src/components/ui`). Mencionar en el texto de confirmación que, si hay ofertas pendientes, se
  eliminan junto con la solicitud.
- Tras eliminar: refrescar la lista (`fetchAll()` o remover optimistamente del estado local, según
  lo que ya haga el store para otras mutaciones), cerrar `SolicitudDetailDialog` si estaba abierto,
  y mostrar un toast de confirmación, siguiendo el patrón existente en el resto del Dashboard.

## Open Questions

Ninguna pendiente — resuelto en chat: el botón aparece en Dashboard y en `SolicitudDetailDialog`;
la única condición de negocio es que no exista oferta `aceptada` ni trabajador asignado
directamente.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
