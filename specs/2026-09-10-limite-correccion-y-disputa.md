# Spec: Límite de una corrección por solicitud y transición automática a estado "disputa"

**Spec #:** 4
**Status:** implemented
**Date:** 2026-09-10
**Area:** both

## Problem / Context

`SolicitudesService.solicitarCorreccion` (`server/src/solicitudes/solicitudes.service.ts`) hoy solo
valida `solicitud.estado !== 'revision'` y luego, sin límite, guarda
`solicitud.correccionComentario = dto.comentario` y pone `estado = 'corrigiendo'`. No existe ningún
contador — un cliente puede solicitar corrección indefinidamente sobre la misma solicitud.

Tampoco existe hoy un estado `disputa`: `SolicitudEstado` (`server/src/solicitudes/solicitud.entity.ts`)
solo define `'borrador' | 'publicado' | 'ejecucion' | 'revision' | 'corrigiendo' | 'finalizado'`.

## Goals

- Una solicitud solo puede pasar por el flujo de "solicitar corrección" **una vez**
  (`revision` → `corrigiendo` → `revision` de vuelta, primera ronda).
- Si el cliente pide corrección una segunda vez sobre la misma solicitud, esta pasa
  automáticamente al nuevo estado `disputa` en lugar de volver a `corrigiendo`.
- El trabajador también puede abrir una disputa directamente sobre una solicitud en la que está
  asignado (no solo el cliente vía una segunda corrección) — p. ej. si no está de acuerdo con lo que
  se le está pidiendo. (Resuelto con el usuario: ambas partes pueden disparar `disputa`.)
- El nuevo estado `disputa` se refleja consistentemente en backend (`SolicitudEstado`) y frontend
  (tipos, badges/labels de estado en las vistas que listan solicitudes).
- El historial completo de comentarios de corrección del cliente se conserva (no se sobrescribe la
  primera corrección al pedir la segunda). (Resuelto con el usuario.)

## Non-Goals / Out of Scope

- Cómo se resuelve una disputa (a qué estado puede pasar después, quién lo decide) — eso pertenece
  al spec del panel de administrador (`specs/2026-09-10-panel-admin-disputas.md`) o a un spec propio
  futuro; este spec solo cubre la _entrada_ a `disputa`.
- Lógica de reembolso/retención de pago durante una disputa — fuera de alcance; no existe
  integración de pagos real todavía (`PagoFlowDialog` sigue siendo un mock de UI).

## Proposed Approach

Agregar `'disputa'` a `SolicitudEstado`. Agregar una columna contador
(`correccionesCount: number`, `default: 0`) a `Solicitud`, y reemplazar el campo único
`correccionComentario?: string` por un arreglo `correcciones: string[]` (mismo patrón
`simple-json`, `default: '[]'` que ya usan `evidenciaAntes`/`evidenciaDurante`/`evidenciaDespues`),
para conservar el historial completo en vez de sobrescribir.

**Flujo cliente** (`solicitarCorreccion`, sin cambios en quién lo llama): hace `push` del nuevo
comentario a `correcciones`; si `correccionesCount === 0` → comportamiento actual (incrementar a 1,
`estado = 'corrigiendo'`); si `correccionesCount >= 1` → en vez de volver a `corrigiendo`,
`estado = 'disputa'`.

**Flujo trabajador** (nuevo): un método/endpoint separado `abrirDisputa(solicitudId,
trabajadorUsername)` que no pasa por el conteo de correcciones — el trabajador puede llevar la
solicitud directamente a `disputa` mientras está asignado a ella, sin haber agotado ningún límite.
Valida que `req.user.username === solicitud.trabajadorAsignado` y que el estado actual admite abrir
una disputa (p. ej. `ejecucion` | `revision` | `corrigiendo`; no desde `disputa` ya abierta ni desde
`finalizado`).

## Backend Impact

- `server/src/solicitudes/solicitud.entity.ts`: agregar `'disputa'` a `SolicitudEstado`, la nueva
  columna `correccionesCount`, y reemplazar `correccionComentario?: string` por
  `correcciones: string[]` (`simple-json`, `default: '[]'`).
- Migración nueva (columnas nuevas + migración de dato si `correccionComentario` ya tiene filas con
  valor — revisar si hace falta un paso de backfill a `correcciones: [valorExistente]` o si el
  proyecto no tiene datos reales que migrar todavía).
- `server/src/solicitudes/solicitudes.service.ts`: `solicitarCorreccion` gana la rama de conteo +
  `push` al arreglo; nuevo método `abrirDisputa` para el flujo del trabajador.
- `server/src/solicitudes/solicitudes.controller.ts`: nuevo endpoint (p. ej.
  `PATCH /solicitudes/:id/abrir-disputa`), `@UseGuards(JwtAuthGuard)`, leyendo
  `trabajadorUsername` de `req.user`, no del body.
- Revisar cualquier otro punto del servicio que haga `switch`/comparación exhaustiva sobre
  `SolicitudEstado` o que lea `correccionComentario` (p. ej. `subirEvidencias`, transición a
  `revision`) para que el nuevo estado `disputa` y el nuevo campo `correcciones` no rompan una rama
  existente.

## Frontend Impact

- Dondequiera que `SolicitudEstado` esté espejado en el frontend (`src/types/solicitud.ts` u
  similar): agregar `'disputa'`; actualizar el tipo de `correccionComentario` a `correcciones:
  string[]` en el tipo `Solicitud` del frontend también.
- Badges/labels de estado en `Dashboard.tsx` (y cualquier otro lugar que coloree/etiquete el estado
  de una solicitud): agregar "En disputa" con su propio color.
- El diálogo de solicitar corrección (`RevisionTrabajoDialog.tsx`, a confirmar que es el componente
  correcto) debería: (a) avisar _antes_ de la segunda solicitud que esta abrirá una disputa, no solo
  después del hecho; (b) mostrar el historial de `correcciones` (ambas, no solo la última).
- Nueva acción "Abrir disputa" visible para el trabajador en la vista donde gestiona una solicitud
  asignada (confirmar componente exacto — candidato `ProgresoTrabajoDialog.tsx` — antes de Plan
  Mode), llamando al nuevo endpoint.

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿La transición a `disputa` la dispara únicamente el cliente, o también el trabajador?
  **Resuelto por el usuario:** ambas partes pueden disparar la transición a `disputa` — el cliente
  vía una segunda solicitud de corrección, el trabajador vía una acción explícita nueva.
- ¿`correccionComentario` debe conservar el historial de ambas correcciones?
  **Resuelto por el usuario:** sí, debe conservar el historial completo — de ahí el cambio de campo
  único a arreglo `correcciones: string[]`.

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
