# Spec: Chat por solicitud, abierto al aceptar una oferta

**Spec #:** 6
**Status:** implemented
**Date:** 2026-09-10
**Area:** both

## Problem / Context

Hoy, una vez que un cliente acepta una oferta (`OfertasService.aceptar`), cliente y trabajador no
tienen ningún canal dentro de la app para comunicarse sobre el trabajo. Cualquier acuerdo sobre
alcance, cambios de precio, fechas, etc. ocurre fuera de la plataforma, sin ningún registro al que
ObraRed pueda recurrir si más adelante surge una disputa (ver
`specs/2026-09-10-limite-correccion-y-disputa.md`).

## Goals

- Apenas un cliente acepta una oferta, queda disponible un chat asociado a esa solicitud.
- Cliente y trabajador pueden intercambiar mensajes de texto sobre esa solicitud dentro de la app,
  durante todo su ciclo de vida (`ejecucion` → `revision` → `corrigiendo` → `disputa` →
  `finalizado`). Una vez `finalizado`, el historial sigue siendo visible pero ya no se pueden enviar
  mensajes nuevos (solo lectura).
- Cada mensaje nuevo genera una notificación (`specs/2026-09-10-sistema-notificaciones.md`) para la
  otra parte, reutilizando el `notificar()`/`NotificacionesService` ya existente.
- Un ícono de "Mensajes" en el header (mismo patrón y ubicación que la campana de notificaciones ya
  implementada) muestra un conteo de no leídos y un dropdown listando las solicitudes con chat
  activo; hacer click en una fila abre el hilo completo en un diálogo (`ChatSolicitudDialog`).
- Cada mensaje queda persistido (autor, momento, contenido) como registro duradero y consultable
  por un administrador — este es el insumo que usará el panel de trazabilidad de
  `specs/2026-09-10-panel-admin-disputas.md`.

## Non-Goals / Out of Scope

- Adjuntar fotos/archivos dentro del chat — la subida de evidencia ya tiene su propio flujo
  dedicado; el chat es solo texto en esta v1.
- Entrega en tiempo real (WebSocket) — hacer fetch al abrir el chat es suficiente para el tamaño
  actual del proyecto (ver la misma decisión tomada para el sistema de notificaciones).
- El chat no resuelve disputas por sí mismo — eso es responsabilidad del administrador vía el panel
  de trazabilidad y mediación.

## Proposed Approach

Nueva entidad de mensaje (`solicitudId`, `autorUsername`, `contenido`, `createdAt`) y un módulo
backend con `GET /solicitudes/:id/mensajes` y `POST /solicitudes/:id/mensajes`, protegido para que
solo puedan leer/escribir el `clienteUsername` y el `trabajadorAsignado` de esa solicitud (más el
rol `admin`, ampliado en el spec del panel de administrador). No hace falta un paso explícito de
"crear el chat": los mensajes simplemente referencian `solicitudId` directamente, así que "abrir el
chat" equivale a que el endpoint de mensajes se vuelva utilizable una vez `aceptar` ya fijó
`trabajadorAsignado`. `POST` valida que `solicitud.estado !== 'finalizado'` (histórico visible vía
`GET`, pero ya no se puede escribir). Cada `POST` exitoso dispara el mismo `notificar()` que ya usan
`OfertasService`/`SolicitudesService`, notificando a la otra parte (cliente↔trabajador).

En el frontend, se replica el patrón ya construido para `NotificacionesMenu.tsx` (Spec #3): un
ícono "Mensajes" (p. ej. `MessageCircle` de `lucide-react`) en el mismo grupo de acciones del header
de `Dashboard.tsx`/`Perfil.tsx`, junto a la campana. Su dropdown lista solicitudes con chat activo
(ordenadas por mensaje más reciente, con conteo de no leídos); click en una fila abre
`ChatSolicitudDialog` con el hilo completo de esa solicitud. Esto evita construir una página/ruta de
"bandeja de entrada" separada — reutiliza el mismo esqueleto (ícono + badge + dropdown) que ya
existe para notificaciones, consistente con el tamaño de este proyecto.

## Backend Impact

- Nuevo módulo (p. ej. `server/src/mensajes/`): entidad, servicio, controlador, DTOs.
- Migración nueva para la tabla de mensajes.
- Guard de acceso que compare `req.user` contra `solicitud.clienteUsername` /
  `solicitud.trabajadorAsignado`; `POST` además valida `solicitud.estado !== 'finalizado'`
  (`ConflictException` si ya finalizó — de solo lectura en adelante).
- `POST /solicitudes/:id/mensajes` invoca el `notificar()` existente para avisar a la otra parte.

## Frontend Impact

- Nuevo `src/store/mensajesStore.ts`, siguiendo el mismo patrón de mapa por solicitud que
  `ofertasStore` (`bySolicitud: Record<string, Mensaje[]>`).
- Nuevo componente `ChatSolicitudDialog.tsx` (el hilo completo de una solicitud) más un ícono de
  "Mensajes" en el header (mismo lugar/patrón que `NotificacionesMenu.tsx`) con dropdown de
  conversaciones activas — ver Proposed Approach. El input para enviar mensaje se deshabilita
  cuando `solicitud.estado === 'finalizado'`, mostrando el historial de solo lectura.

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿El chat permanece disponible durante todo el ciclo de vida? **Resuelto por el usuario:**
  disponible durante todo el ciclo de vida; una vez `finalizado` el historial sigue visible pero ya
  no se pueden enviar mensajes nuevos.
- ¿Un mensaje nuevo genera notificación? **Resuelto por el usuario:** sí, cada mensaje nuevo genera
  una notificación para la otra parte.
- ¿Dónde vive el chat en la UI? **Resuelto por el usuario, siguiendo la recomendación dada** (estilo
  Airbnb pero adaptado al tamaño de este proyecto): ícono de "Mensajes" en el header, mismo patrón
  que la campana de notificaciones — dropdown de conversaciones activas, click abre el hilo completo
  en `ChatSolicitudDialog`. Se descartó una página/ruta de bandeja de entrada separada por ser más
  alcance del necesario para el tamaño actual de la app.

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
