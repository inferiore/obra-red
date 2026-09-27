# Spec: Un trabajador no puede enviar más de una oferta activa a la misma solicitud

**Spec #:** 1
**Status:** implemented
**Date:** 2026-09-10
**Area:** both

## Problem / Context

`OfertasService.crear` (`server/src/ofertas/ofertas.service.ts`) hoy solo valida que
`solicitud.estado === 'publicado'` antes de crear la oferta — no valida si el trabajador que
ofrece ya tiene una oferta sobre esa misma solicitud. Un trabajador puede enviar varias ofertas
(con distintos precios/mensajes) a la misma solicitud sin ninguna restricción del backend.

En el frontend, `Dashboard.tsx` ya deriva en vivo un filtro "ya ofertó" a partir de
`solicitud.ofertas` (cada `Solicitud` de `GET /solicitudes` trae sus ofertas embebidas) para
ocultar la acción de ofertar en la lista — pero es solo una ayuda visual en esa vista; no hay
garantía de que `SolicitudDetailDialog` (el diálogo real donde se envía la oferta) reaplique el
mismo chequeo, y nada impide una llamada directa a `POST /ofertas`.

## Goals

- El backend rechaza una nueva oferta si el trabajador ya tiene una oferta `pendiente` sobre la
  misma `solicitudId`, con un mensaje de error claro en español.
- `SolicitudDetailDialog` (el punto de entrada real para ofertar) oculta o deshabilita la acción de
  ofertar cuando el usuario autenticado ya tiene una oferta pendiente sobre esa solicitud, no solo
  la vista de `Dashboard`.

## Non-Goals / Out of Scope

- No se implementa "retirar oferta" (ver `specs/_example-retirar-oferta.md`, hipotético) — este
  spec asume que una oferta no se puede retirar; el único camino para que un trabajador vuelva a
  ofertar es que el cliente rechace su oferta `pendiente` actual.
- No se implementa edición de una oferta ya enviada (cambiar precio/mensaje sin crear una nueva).
- No hay límite en cuántas veces un trabajador puede reofertar tras un rechazo — una oferta
  `rechazada` no cuenta para el bloqueo, así que puede enviar tantas ofertas nuevas como quiera
  mientras cada una anterior ya esté `rechazada` (confirmado con el usuario, ver Resolved
  Questions).

## Proposed Approach

En `OfertasService.crear`, antes de guardar, consultar si existe una oferta previa del mismo
`trabajadorUsername` sobre el mismo `solicitudId` con `estado === 'pendiente'` y lanzar
`ConflictException` si existe. Una oferta `rechazada` no bloquea nada — el trabajador puede volver a
ofertar de inmediato. El chequeo existente de `solicitud.estado !== 'publicado'` ya cubre
indirectamente el caso de una oferta `aceptada` (la solicitud pasa a `ejecucion` y deja de aceptar
ofertas), así que el único gap real a cerrar es `pendiente` vs. `pendiente`.

## Backend Impact

- `server/src/ofertas/ofertas.service.ts`: `crear()` gana una consulta de existencia
  (`trabajadorUsername` + `solicitudId` + `estado: 'pendiente'`) antes del `save`, lanzando
  `ConflictException('Ya tienes una oferta pendiente en esta solicitud')` si aplica. No se filtra
  por ofertas `rechazada` — esas no cuentan para el bloqueo.
- No requiere cambios de entidad ni migración — es una regla de negocio, no un cambio de esquema.

## Frontend Impact

- `src/components/SolicitudDetailDialog.tsx`: replicar el chequeo que ya existe en `Dashboard.tsx`
  (usar `solicitud.ofertas` + `trabajadorUsername === username`) para ocultar/deshabilitar la
  sección de "Hacer oferta" cuando ya existe una oferta pendiente del usuario actual.
- Mostrar el error del backend vía toast si de todas formas llega a intentarse (defensa en
  profundidad, no solo UI).

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿Una oferta `rechazada` bloquea permanentemente al trabajador de volver a ofertar, o solo cuenta
  como "activa" mientras está `pendiente`? **Resuelto por el usuario:** solo bloquea mientras está
  `pendiente`; una vez rechazada, el trabajador puede enviar tantas ofertas nuevas como quiera.

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
