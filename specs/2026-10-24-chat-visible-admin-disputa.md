# Spec: Admin puede ver el chat de la solicitud al mediar una disputa

**Status:** implemented
**Date:** 2026-10-24
**Area:** both

## Problem / Context

Cuando una solicitud entra en disputa, el equipo de ObraRed (rol admin) debe mediar entre cliente
y trabajador, pero hoy no tiene forma de ver de qué hablaron antes de que la disputa se abriera —
no hay visibilidad sobre la conversación entre ambas partes dentro del panel de administrador. En
la reunión se discutió crear un chat nuevo específico para disputas, pero se decidió una opción más
simple: reusar el chat general que ya existe en la solicitud (el mismo que usan cliente y
trabajador durante la ejecución) y simplemente hacerlo visible para el admin cuando revisa el caso.

Este spec depende de que el chat general funcione correctamente —
ver `specs/2026-10-24-chat-tiempo-real.md`, que debe resolverse primero o en paralelo.

## Goals

- El admin, desde el panel de administración, puede abrir y leer el historial completo de mensajes
  de una solicitud (el mismo chat que ya ven cliente y trabajador), especialmente útil cuando la
  solicitud está en estado `disputa`.
- No se crea un chat ni un modelo de datos nuevo — se reutiliza el mecanismo de mensajes existente.
- El admin también puede escribir en esa conversación para mediar activamente — ver nota abajo.

## Non-Goals / Out of Scope

- Resolver la disputa (eso es un spec aparte: `specs/2026-10-24-resolucion-disputa-pago.md`).
- Notificar a cliente/trabajador de que el admin está leyendo la conversación (sí se les notifica
  cuando el admin **escribe** — ver nota abajo, eso no es un Non-Goal).

> **Nota (actualizado tras revisar el estado real del código):** la versión original de este spec
> proponía que el admin solo pudiera leer, no escribir. Al planear la implementación se encontró
> que el backend (`mensajes.service.ts`) ya permitía al admin escribir mensajes, con una
> notificación deliberada a **ambas** partes cuando el autor es admin — no era un descuido, sino
> una funcionalidad ya pensada para que el admin medie activamente. Se decidió mantenerla en vez
> de restringirla, así que el Goal de "solo lectura" se reemplaza por el de arriba.

## Proposed Approach

En la vista de detalle de una solicitud dentro del panel de administrador, mostrar el chat de esa
solicitud reusando el mismo componente/consulta de mensajes que ya existen para cliente/trabajador
— sin restricción de lectura/escritura por rol.

## Backend Impact

Ya implementado: `mensajes.service.ts` (`guardAcceso`) permite a cualquier usuario con
`role === 'admin'` leer y escribir mensajes de cualquier solicitud, sin ser cliente dueño ni
trabajador asignado. El marcado de "leído" no se dispara para admin (correcto, ya que no es
destinatario). Al escribir, se notifica a ambas partes. Cubierto por tests en
`mensajes.service.spec.ts`.

## Frontend Impact

Ya implementado: `src/pages/AdminSolicitudDetail.tsx` renderiza una Card "Chat" con un botón
"Ver conversación" que abre `ChatSolicitudDialog` (el mismo componente completo, sin props
especiales), visible siempre, sin importar el estado de la solicitud. Falta agregar cobertura de
tests para este flujo (ver plan de implementación).

## Open Questions

Ninguna — resuelto: visible en cualquier estado (no solo `disputa`), y el admin puede leer y
escribir.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer`.
