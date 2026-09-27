# Spec: Pestañas de evolución de evidencias durante una disputa

**Spec #:** 5
**Status:** implemented
**Date:** 2026-09-10
**Area:** both

## Problem / Context

`Solicitud` ya guarda evidencia fotográfica en tres arreglos separados —
`evidenciaAntes`, `evidenciaDurante`, `evidenciaDespues` — más una nota (`evidenciaNota`)
(`server/src/solicitudes/solicitud.entity.ts`). Cuando una solicitud entra en `disputa` (ver
`specs/2026-09-10-limite-correccion-y-disputa.md`) y se suben nuevas fotos para sustentar la
disputa, hoy no hay una fase/columna distinta para esas fotos — se mezclarían con
`evidenciaDurante`, que representa el avance normal del trabajo, no evidencia de disputa — ni una
vista que agrupe la evidencia por fase para que el cliente vea cómo evolucionó el trabajo.

## Goals

- La evidencia subida específicamente durante una disputa se guarda en una fase distinta de la
  evidencia normal antes/durante/después.
- Tanto el cliente como el trabajador pueden subir evidencia en fase disputa (no solo el
  trabajador, a diferencia de antes/durante/después), y cada elemento queda marcado con quién lo
  subió y cuándo — no es una lista anónima de URLs como las otras fases.
- La evidencia de disputa es visible para cliente y trabajador apenas se sube (misma mecánica de
  fetch que el resto de la evidencia — no queda oculta hasta que un administrador empiece a mediar).
- El cliente (y el administrador, ver `specs/2026-09-10-panel-admin-disputas.md`) puede ver una
  vista con pestañas (Antes / Durante / Después / Disputa) que muestra cómo evolucionó el trabajo,
  incluyendo las fotos subidas durante la disputa con su autor y fecha.

## Non-Goals / Out of Scope

- No cambia el flujo existente de subida de evidencia fuera de una disputa (antes/durante/después
  sigue funcionando igual vía el mecanismo actual, probablemente `EvidenciasUploadDialog`).
- No se construye una bitácora genérica de auditoría de cada cambio de estado — solo la vista de
  evidencia fotográfica agrupada por fase.

## Proposed Approach

A diferencia de `evidenciaAntes`/`evidenciaDurante`/`evidenciaDespues` (arreglos planos de URLs,
sin autor porque solo el trabajador sube en esas fases), `evidenciaDisputa` necesita atribución por
elemento porque ambas partes pueden subir. Agregar
`evidenciaDisputa: { url: string; autorUsername: string; createdAt: string }[]` (`simple-json`,
`default: '[]'`) a `Solicitud`, poblado por el mecanismo de subida de evidencia existente cuando
`solicitud.estado === 'disputa'`, tomando `autorUsername` de `req.user.username` (cliente o
trabajador, ambos permitidos mientras sean parte de la solicitud) y `createdAt` al momento de la
subida. En el frontend, `EvidenciasUploadDialog.tsx` (el componente que hoy muestra/gestiona
evidencia — confirmado como el correcto, no `ProgresoTrabajoDialog.tsx` que es cliente-facing y no
maneja evidencia) gana una pestaña adicional "Disputa" que solo aparece cuando `evidenciaDisputa`
no está vacío, mostrando cada foto con su autor y fecha.

## Backend Impact

- `server/src/solicitudes/solicitud.entity.ts`: nueva columna `evidenciaDisputa` (con la forma de
  objeto con atribución, no un `string[]` plano).
- Migración nueva.
- Extender el método/DTO de subida de evidencia (`subir-evidencias.dto.ts` /
  `SolicitudesService.subirEvidencias`) para aceptar la fase `disputa` y, a diferencia de las otras
  fases, permitir que la llame tanto `solicitud.clienteUsername` como `solicitud.trabajadorAsignado`
  (las otras fases hoy solo las sube el trabajador — confirmar el guard actual de
  `subirEvidencias` antes de tocarlo, para no aflojar por accidente el control de acceso de las
  fases existentes).

## Frontend Impact

- `EvidenciasUploadDialog.tsx`: convertir la vista de evidencia en una con `Tabs` por fase en vez de
  lista plana, agregando la pestaña "Disputa" condicional con autor+fecha por foto.
- El cliente también necesita una forma de subir evidencia de disputa (hoy `EvidenciasUploadDialog`
  es trabajador-facing) — confirmar en Plan Mode si se reutiliza el mismo diálogo con permisos
  ampliados o si el cliente sube desde otro punto de entrada (p. ej. `ProgresoTrabajoDialog.tsx`,
  que sí es cliente-facing).

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿Quién puede subir evidencia en fase disputa? **Resuelto por el usuario:** ambas partes (cliente y
  trabajador), y cada elemento debe indicar quién lo subió y cuándo.
- ¿Debe ser visible en tiempo real o solo cuando un admin medie? **Resuelto por el usuario:** visible
  para cliente y trabajador tan pronto se sube — no queda oculta detrás de la mediación del admin.
  (Interpretado como "sin gating", no como WebSocket/push en vivo — mismo mecanismo de fetch que el
  resto de la evidencia en este proyecto; confirmar si esto no es lo que se quiso decir.)

**Depende de `specs/2026-09-10-limite-correccion-y-disputa.md` (Spec #4) — el estado `disputa` debe
existir antes de poder implementar esto.** Spec #4 está `approved` pero aún no implementado; este
spec queda `approved` pero su Plan Mode/implementación se secuencia después de que Spec #4 aterrice.

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
