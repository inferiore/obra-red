# Spec: Admin puede ver el chat de la solicitud al mediar una disputa

**Status:** approved
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

## Non-Goals / Out of Scope

- Que el admin pueda escribir/participar activamente en el chat — en esta primera versión es solo
  lectura. Si se necesita que el admin intervenga directamente en la conversación, es una
  ampliación futura.
- Resolver la disputa (eso es un spec aparte: `specs/2026-10-24-resolucion-disputa-pago.md`).
- Notificar a cliente/trabajador de que el admin está leyendo la conversación.

## Proposed Approach

En la vista de detalle de una solicitud dentro del panel de administrador, agregar una sección o
botón que muestre el chat de esa solicitud en modo solo-lectura, reusando el componente/consulta
de mensajes que ya existen para cliente/trabajador.

## Backend Impact

El endpoint de mensajes existente debe poder ser consultado también por el rol `admin` para
cualquier solicitud (hoy probablemente solo permite a las partes de la solicitud — cliente y
trabajador asignado — leer sus propios mensajes; confirmar y ajustar el guard de autorización
durante la implementación).

## Frontend Impact

En la vista de detalle de solicitud del panel admin, agregar la sección de chat en modo
solo-lectura, reusando el componente de chat ya existente en el proyecto en la medida de lo
posible.

## Open Questions

- ¿El admin debe ver el chat en cualquier estado de la solicitud, o solo cuando está en `disputa`?
  Por defecto se propone mostrarlo siempre que el admin abra el detalle de una solicitud, ya que no
  hay razón para ocultarlo en otros estados — ajustar si se prefiere restringirlo solo a `disputa`.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer`.
