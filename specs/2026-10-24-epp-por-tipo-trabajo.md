# Spec: EPP obligatorio según el tipo de trabajo

**Status:** approved
**Date:** 2026-10-24
**Area:** frontend

## Problem / Context

Hoy, antes de subir evidencias, el trabajador debe marcar que cuenta con todo el checklist de
elementos de protección personal (EPP) sin importar qué tipo de trabajo vaya a hacer. En la
reunión se señaló que esto no tiene sentido para trabajos livianos — por ejemplo, pintar una pared
no requiere casco, y exigirlo genera fricción innecesaria (el trabajador no puede continuar si no
marca algo que de verdad no necesita para ese trabajo).

Se acordó: los elementos **básicos** (pantalón, botas, gafas, guantes) siguen siendo obligatorios
siempre. El **casco** y la **protección auditiva** pasan a ser obligatorios solo para los tipos de
trabajo de mayor riesgo, y opcionales (marcables, pero no bloquean continuar) para el resto.

**Agrupación de tipos de trabajo acordada:**
- **Alto riesgo** (requieren también casco + protección auditiva obligatorios):
  `albanileria`, `demolicion`, `techado`, `soldadura`.
- **Resto** (solo básicos obligatorios — casco y protección auditiva quedan como opcionales):
  `plomeria`, `electricidad`, `carpinteria`, `pintura`, `yeso`, `otro`.

## Goals

- El checklist de EPP (antes de subir evidencias) sigue exigiendo marcar pantalón, botas, gafas y
  guantes para cualquier solicitud, sin excepción.
- Para solicitudes de tipo `albanileria`, `demolicion`, `techado` o `soldadura`, el checklist
  también exige marcar casco y protección auditiva antes de poder continuar.
- Para el resto de los tipos, casco y protección auditiva aparecen en el checklist pero marcarlos
  es opcional — no bloquean el botón de continuar.
- Se agrega protección auditiva como un ítem nuevo del checklist (hoy no está, según lo discutido
  en la reunión).

## Non-Goals / Out of Scope

- Un campo nuevo de "casa" vs. "obra" en el formulario de creación de la solicitud — se descartó
  a favor de inferirlo del `tipo` de trabajo que ya existe.
- Cambiar la lista de tipos de trabajo (`TipoTrabajo`) en sí.
- Verificar con foto que el trabajador realmente está usando el EPP marcado — sigue siendo una
  declaración (checkbox), igual que hoy.

## Proposed Approach

En el componente donde hoy se exige marcar todo el checklist de EPP antes de continuar (parte del
flujo de subir evidencias), diferenciar los ítems básicos (siempre obligatorios) de los
adicionales (casco, protección auditiva), y condicionar si estos últimos son obligatorios según si
`solicitud.tipo` pertenece al grupo de alto riesgo definido arriba.

## Frontend Impact

- Localizar el componente del checklist de EPP (relacionado con el flujo de subir evidencias) y:
  - Agregar el ítem "Protección auditiva" (tapones/orejeras) a la lista.
  - Separar la lógica de "todos los ítems marcados habilitan continuar" en dos grupos: básicos
    (siempre requeridos) y adicionales (requeridos solo si `tipo` está en el grupo de alto
    riesgo).
  - Mantener casco y protección auditiva visibles y marcables siempre (el trabajador puede
    marcarlos aunque no sean obligatorios para ese tipo), solo cambia si bloquean o no continuar.

## Open Questions

Ninguna — la agrupación de tipos y el criterio básico/adicional ya quedaron definidos arriba.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-react-developer`.
