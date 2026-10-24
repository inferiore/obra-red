# Spec: Arreglar el chat entre cliente y trabajador (no refleja actividad)

**Status:** implemented
**Date:** 2026-10-24
**Area:** both

## Problem / Context

Durante una prueba en vivo con dos sesiones simultáneas (un usuario como cliente, otro como
trabajador, sobre la misma solicitud) se intentó probar el chat de la solicitud y no se pudo: al
revisar la pestaña del trabajador, el chat "no tiene actividad" aunque en teoría ya existe esa
función en la aplicación. No quedó claro en la reunión si es un bug puntual o si el flujo nunca se
terminó de conectar en tiempo real entre dos usuarios reales.

Este documento registra el síntoma reportado. La causa raíz **no se investiga en este spec** —
queda para la fase de implementación/Plan Mode, como indica el flujo normal de este proyecto para
bugs no triviales.

## Goals

- Dos usuarios (cliente y trabajador) sobre la misma solicitud pueden intercambiar mensajes por el
  chat existente de la solicitud y ambos ven los mensajes del otro de forma confiable.
- Verificar el escenario completo: enviar un mensaje desde un lado, confirmar que aparece del otro
  lado (con o sin necesidad de refrescar manualmente — a decidir en implementación si se requiere
  polling, websockets, o si basta con recargar al abrir el diálogo).

## Non-Goals / Out of Scope

- Determinar la causa raíz desde este documento — se investiga al implementar.
- Notificaciones push o en tiempo real más allá de lo que ya exista para el chat.
- Historial/analítica de conversaciones (cubierto parcialmente por
  `specs/2026-10-24-chat-visible-admin-disputa.md`, que es un spec separado).

## Proposed Approach

Reproducir el escenario (dos sesiones simultáneas, cliente y trabajador, misma solicitud en un
estado donde el chat debería estar disponible) y diagnosticar en el componente y servicio de
mensajes existentes del proyecto (componente de chat de la solicitud, store correspondiente,
módulo de mensajes del backend), corrigiendo lo que impida que los mensajes se reflejen para
ambos lados.

## Backend Impact

A determinar durante el diagnóstico — podría ser un problema de la API de mensajes, de cómo se
consulta/refresca la lista, o simplemente de que el flujo nunca se completó para ambos roles.

## Frontend Impact

A determinar durante el diagnóstico — podría ser un problema de fetch/refresco del componente de
chat, de permisos de UI por rol, o de que falte un disparador para refrescar la conversación.

## Open Questions

Ninguna — el objetivo (que el chat funcione de verdad entre dos usuarios) es claro; el cómo se
resuelve investigando en Plan Mode/implementación.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer` según lo que se encuentre.
