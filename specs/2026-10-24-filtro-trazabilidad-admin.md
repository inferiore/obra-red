# Spec: Filtros de trazabilidad en el panel de administrador

**Status:** implemented
**Date:** 2026-10-24
**Area:** both

## Problem / Context

El panel de administrador muestra todas las solicitudes de la plataforma en una sola lista, sin
forma de filtrarla. A medida que crezca el volumen de solicitudes, encontrar un caso específico
(para dar seguimiento, resolver una disputa, auditar un trabajador, etc.) se vuelve impráctico. En
la reunión se pidió agregar un filtro de trazabilidad a esa lista; el criterio técnico exacto de
qué campos incluir se dejó a discreción de desarrollo ("eso te lo dejo a ti, tú sabrás cuál será
la mejor").

## Goals

- El admin puede filtrar la lista de solicitudes del panel por, al menos:
  - Estado de la solicitud (`publicado`, `ejecucion`, `disputa`, `finalizado`, etc.)
  - Tipo de trabajo (`tipo`: plomería, electricidad, etc.)
  - Nombre o username del cliente
  - Nombre o username del trabajador asignado
- Los filtros se pueden combinar entre sí (no son mutuamente excluyentes).
- La lista se actualiza según el filtro aplicado sin necesidad de recargar toda la página.

## Non-Goals / Out of Scope

- Búsqueda por número de documento de identidad — no está claro que el admin deba tener acceso
  directo a ese dato sensible desde un filtro de texto libre; si se necesita, debe tratarse como
  su propio spec con una decisión explícita sobre exposición de datos personales.
- Exportar resultados filtrados (CSV, Excel, etc.).
- Guardar filtros favoritos o vistas personalizadas por admin.

## Proposed Approach

Agregar controles de filtro (selects/inputs) en la vista de listado de solicitudes del panel de
administrador, aplicando el filtrado sobre los datos ya cargados en el frontend si el volumen lo
permite, o vía query params al backend si se prefiere filtrar en el servidor — a decidir en Plan
Mode según cómo esté estructurada hoy esa pantalla y cuántas solicitudes maneja típicamente la
plataforma.

## Backend Impact

Si se decide filtrar en el servidor: agregar query params opcionales al endpoint de listado de
solicitudes para admin (estado, tipo, cliente, trabajador). Si se filtra en el cliente: sin
impacto backend.

## Frontend Impact

Agregar la UI de filtros (selects para estado/tipo, inputs de texto para cliente/trabajador) en la
pantalla de listado de solicitudes del panel de administrador, y la lógica de filtrado
correspondiente.

## Open Questions

- ¿Filtrar en cliente o en servidor? Depende del volumen de datos esperado — a resolver en Plan
  Mode revisando cómo está implementada hoy esa pantalla.
- ¿Se necesita además un filtro por rango de fechas (`createdAt`)? No se mencionó explícitamente
  en la reunión pero es un campo de trazabilidad común — confirmar si se agrega a este mismo spec
  o se deja fuera.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer`.
