# Spec: Admin resuelve una disputa eligiendo cómo repartir el pago

**Status:** implemented
**Date:** 2026-10-24
**Area:** both

## Problem / Context

Cuando se abre una disputa, hoy el admin puede revisarla pero no quedó claro en la reunión que
exista una acción concreta para "cerrarla" decidiendo qué pasa con el pago. En la discusión se
acordó que el admin debe poder elegir entre tres resoluciones: liberar el pago completo al
trabajador, devolverlo completo al cliente, o dividirlo 50/50 entre ambos.

**Importante:** el flujo de pago de ObraRed (`PagoFlowDialog`) es hoy una **maqueta de UI, sin
proveedor de pagos real integrado** (ver `CLAUDE.md`). Esto significa que "resolver la disputa"
en este spec es sobre **registrar la decisión y actualizar el estado de la solicitud/oferta**, no
sobre mover dinero real — eso solo aplicará cuando se integre un proveedor de pagos de verdad.

## Goals

- Desde el panel de administrador, en una solicitud en estado `disputa`, el admin puede elegir una
  de tres resoluciones: 100% para el trabajador, 100% para el cliente, o 50/50.
- La resolución elegida queda registrada en la solicitud (o en un registro asociado) y es visible
  después para ambas partes.
- La solicitud sale del estado `disputa` hacia un estado final apropiado una vez resuelta (a
  definir en implementación cuál estado — por ejemplo `finalizado`, posiblemente con un submotivo
  o nota de que fue resuelta por disputa).

## Non-Goals / Out of Scope

- Mover dinero real — el sistema de pagos sigue siendo una maqueta; esto solo prepara el registro
  de la decisión para cuando exista un proveedor de pagos real.
- Permitir porcentajes personalizados distintos a 100/0, 0/100 y 50/50 — solo esas tres opciones
  por ahora.
- Notificar automáticamente a cliente/trabajador del resultado por fuera de la app (email/SMS) —
  solo se registra en la plataforma.
- Habilitar el chat de la solicitud dentro del panel admin — eso es un spec aparte
  (`specs/2026-10-24-chat-visible-admin-disputa.md`).

## Proposed Approach

Revisar el endpoint y flujo de resolución de disputa que ya existe en el backend (hay un endpoint
de resolución de disputas en `solicitudes.controller.ts`/`solicitudes.service.ts` — confirmar su
forma exacta durante la implementación) y ampliarlo para aceptar una de las tres resoluciones de
pago, en vez de (o además de) solo el cambio de estado que ya maneje hoy.

## Backend Impact

- Revisar el DTO/endpoint de resolución de disputa existente y extenderlo para aceptar el tipo de
  resolución (`trabajador` | `cliente` | `mitad`).
- Guardar esa decisión en la solicitud (nuevo campo, o reutilizar uno existente si ya hay espacio
  para esto — confirmar en implementación) — requiere migración si se agrega un campo.
- Mantener el guard de rol `admin` que ya debería existir en este endpoint.

## Frontend Impact

- En la vista de detalle de solicitud del panel admin, agregar la UI para elegir entre las tres
  resoluciones al resolver una disputa (por ejemplo tres botones o un selector + confirmación).
- Mostrar el resultado de la resolución en la vista de cliente y trabajador una vez aplicada.

## Open Questions

- ¿A qué estado final pasa la solicitud tras resolver la disputa? Se propone `finalizado` por
  defecto — confirmar si se prefiere un estado distinto o una marca adicional (ej.
  `finalizado` + `resueltaPorDisputa: true`).
- ¿Se requiere una nota/justificación obligatoria del admin al elegir la resolución, o basta con
  elegir una de las tres opciones?

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer`.
