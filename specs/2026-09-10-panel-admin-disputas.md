# Spec: Panel de administrador — trazabilidad completa y mensajería de mediación

**Spec #:** 7
**Status:** implemented
**Date:** 2026-09-10
**Area:** both

## Problem / Context

Hoy el rol `admin` (uno de los tres roles existentes, ver `server/src/auth/`) no tiene ninguna
vista dedicada para revisar el historial completo de una solicitud (estados, ofertas, evidencia,
mensajes) ni forma de intervenir enviando mensajes al cliente y/o trabajador para ayudar a resolver
una disputa (`specs/2026-09-10-limite-correccion-y-disputa.md`).

## Goals

- Un administrador tiene una vista de listado de solicitudes (no existe hoy) desde la cual entrar a
  cualquier solicitud individual.
- Un administrador puede abrir cualquier solicitud y ver de forma consolidada: su estado actual e
  historial relevante, sus ofertas, su evidencia por fases (incluida la fase disputa, ver
  `specs/2026-09-10-evidencias-disputa-pestanas.md`) y los mensajes de su chat
  (`specs/2026-09-10-chat-solicitud.md`).
- Un administrador puede enviar mensajes dentro de ese mismo chat, visibles tanto para el cliente
  como para el trabajador, con el fin de mediar y llegar a un acuerdo.
- Un administrador puede **cerrar/resolver una disputa** eligiendo uno de dos desenlaces:
  reanudar el trabajo (`estado → 'ejecucion'`) o darlo por completado (`estado → 'finalizado'`).
  Solo disponible cuando `solicitud.estado === 'disputa'`.

## Non-Goals / Out of Scope

- El administrador **no** puede fijar la solicitud a un estado arbitrario — la acción de resolución
  está acotada a las dos opciones de arriba, solo desde `disputa`. No hay un control genérico de
  "cambiar a cualquier estado".
- Lógica de reembolso/retención de pago al resolver una disputa — sigue fuera de alcance; no existe
  integración de pagos real todavía (`PagoFlowDialog` es un mock de UI).
- No se construye un dashboard administrativo general (gestión de usuarios, métricas, etc.) — el
  alcance es estrictamente la trazabilidad, mensajería, y resolución de disputas por solicitud.

## Proposed Approach

Nueva ruta/página solo-admin (p. ej. `/admin/solicitudes`, listado) → `/admin/solicitudes/:id`
(detalle), ya que no existe ninguna vista de listado admin hoy. El detalle consume los endpoints ya
existentes (`GET /solicitudes/:id`, ofertas, evidencia) más los endpoints de mensajes de
`specs/2026-09-10-chat-solicitud.md` — ampliando el guard de esos endpoints para admitir también
`role === 'admin'` — y publica mensajes usando el mismo `POST .../mensajes` que usan cliente y
trabajador. Cuando `solicitud.estado === 'disputa'`, el detalle muestra una acción "Resolver
disputa" con dos opciones (reanudar / finalizar) que llama a un nuevo endpoint dedicado, admin-only,
acotado exclusivamente a esa transición — no un endpoint genérico de cambio de estado.

## Backend Impact

- Ampliar el guard de acceso de los endpoints de mensajes (spec de chat) para incluir `admin`.
- Nuevo endpoint `PATCH /solicitudes/:id/resolver-disputa`, `@Roles('admin')` +
  `@UseGuards(JwtAuthGuard, RolesGuard)` (primer uso de guard de rol en `solicitudes.controller.ts`
  hasta ahora — confirmar el patrón exacto de `@Roles`/`RolesGuard` usado en otros controllers antes
  de Plan Mode). DTO `{ estado: 'ejecucion' | 'finalizado' }`. En el servicio:
  `ConflictException` si `solicitud.estado !== 'disputa'`; si no, aplica el `estado` pedido y
  notifica a cliente y trabajador vía el `notificar()` ya existente (mismo patrón usado por
  `solicitarCorreccion`/`abrirDisputa` en Spec #4).
- Posible endpoint agregador (p. ej. `GET /solicitudes/:id/trazabilidad`) si ensamblar la vista
  desde 3-4 llamadas separadas resulta demasiado costoso en el frontend — decisión de diseño para
  Plan Mode.
- `GET /solicitudes` ya no tiene guard de rol (cualquier usuario autenticado puede listarlas) — para
  el listado admin, decidir en Plan Mode si se reutiliza tal cual o si conviene un
  `GET /solicitudes?soloDisputas=true` o similar para no traer todo el listado sin filtrar.

## Frontend Impact

- Nueva página de listado solo-admin (no existe ninguna vista de listado hoy) + página/diálogo de
  detalle, protegidas con el equivalente de `ProtectedRoute` restringido a `allow={['admin']}`.
- Reutilizar el componente de chat de `specs/2026-09-10-chat-solicitud.md` en un modo "enviar como
  administrador".
- Acción "Resolver disputa" (dos botones/opciones: reanudar → `ejecucion`, finalizar →
  `finalizado`), visible solo cuando `solicitud.estado === 'disputa'`.

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿Existe una vista de listado de solicitudes para admin? **Resuelto por el usuario:** no existe,
  hay que construirla.
- ¿El admin puede cerrar/resolver una disputa? **Resuelto por el usuario:** sí — acotado a elegir
  entre `ejecucion` (reanudar trabajo) o `finalizado` (dar por completado), no un cambio de estado
  arbitrario (ver pregunta de seguimiento respondida por el usuario en el chat: "solo ejecucion o
  finalizado").

Depende de `specs/2026-09-10-chat-solicitud.md` y `specs/2026-09-10-evidencias-disputa-pestanas.md`
(ambos `approved`, el de chat aún no implementado — este spec se implementa después de esos dos).

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
