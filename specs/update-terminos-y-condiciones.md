<!--
Copied from specs/_template.md. See CLAUDE.md > "Spec-driven development" for the workflow.
-->

# Spec: Mostrar el texto real de Términos y Condiciones / Política de Privacidad en el registro

**Status:** implemented
**Date:** 2026-08-25
**Area:** frontend

## Problem / Context

Al registrarse (`/registro?role=cliente` o `/registro?role=trabajador`), el usuario debe aceptar los
"términos y condiciones" y la "política de privacidad" mediante un checkbox. Al hacer clic en esos
enlaces se abre `LegalDialog` (`src/components/LegalDialog.tsx`), que muestra un **resumen** escrito
a mano (`TERMINOS_RESUMEN` / `PRIVACIDAD_RESUMEN`, 8 y 5 ítems respectivamente) — no el texto real.

El texto real y completo existe en `src/pages/Terminos.tsx` y `src/pages/Privacidad.tsx` (rutas
`/terminos` y `/privacidad`), cada uno con su propio arreglo `SECCIONES` (~193 y ~127 líneas de
contenido legal real). El resumen de `LegalDialog` es una paráfrasis mantenida por separado, que
puede desincronizarse del documento real — y dado que esto es una aceptación legal en el registro,
el usuario debería estar aceptando el texto real, no una versión resumida.

Esto afecta a **ambos roles** (`cliente` y `trabajador`): `Register.tsx` usa el mismo `LegalDialog`
sin importar el rol — no hay una ruta de código separada por rol.

## Goals

- El diálogo que se abre desde el checkbox de registro debe mostrar el texto real y completo de
  Términos y Condiciones / Política de Privacidad — el mismo contenido que `/terminos` y
  `/privacidad`, no una paráfrasis independiente.
- Una sola fuente de verdad para el contenido legal, para que no puedan volver a desincronizarse el
  documento completo y lo que se muestra en el diálogo de registro.

## Non-Goals / Out of Scope

- No se cambia el contenido legal en sí (los textos de `SECCIONES` en `Terminos.tsx`/`Privacidad.tsx`
  siguen siendo la fuente autorizada; esto es solo sobre dónde/cómo se renderiza).
- No se agrega versionado de términos ni se re-solicita aceptación a usuarios ya registrados — fuera
  de alcance.
- `ConfirmacionAcuerdoDialog.tsx` (flujo de aceptar oferta / pago) tiene el mismo problema: su propio
  arreglo `TERMINOS` (una tercera paráfrasis independiente, distinta tanto del resumen de
  `LegalDialog` como del texto real). Confirmado al revisar el archivo, pero queda **fuera de
  alcance** de este spec — es un flujo distinto (post-registro, antes de pagar), no el de registro.
  Ver nota al final de este documento para el seguimiento.

## Proposed Approach

Extraer el contenido (`SECCIONES`) de `Terminos.tsx` y `Privacidad.tsx` a una fuente compartida (p.
ej. `src/data/legal.ts`, exportando `TERMINOS_SECCIONES` y `PRIVACIDAD_SECCIONES`), y un componente
de renderizado compartido para la lista de secciones (título + párrafos), reutilizado tanto por las
páginas completas (`/terminos`, `/privacidad`) como por `LegalDialog`. `LegalDialog` deja de usar sus
propios `TERMINOS_RESUMEN`/`PRIVACIDAD_RESUMEN` y en su lugar renderiza el contenido real dentro de su
`ScrollArea` existente (que ya está diseñado para contenido largo con scroll).

Esto es solo frontend — no hay endpoints ni entidades involucradas.

## Frontend Impact

- `src/data/legal.ts` (nuevo): mover ahí `SECCIONES` de `Terminos.tsx` y de `Privacidad.tsx`, con
  nombres distintos (`TERMINOS_SECCIONES`, `PRIVACIDAD_SECCIONES`).
- `src/pages/Terminos.tsx` / `src/pages/Privacidad.tsx`: importar desde `src/data/legal.ts` en vez de
  definir `SECCIONES` localmente; el JSX de renderizado (`article > section.map(...)`) puede quedar
  igual o extraerse también a un componente compartido si el detalle de implementación lo justifica.
- `src/components/LegalDialog.tsx`: eliminar `TERMINOS_RESUMEN`/`PRIVACIDAD_RESUMEN`; renderizar
  `TERMINOS_SECCIONES`/`PRIVACIDAD_SECCIONES` según `type`. Por defecto, quitar el botón "Ver
  documento completo" (queda redundante una vez que el diálogo ya muestra el texto real) — ajustar
  si al implementar se ve mejor dejarlo.

## Open Questions

Ninguna bloqueante para aprobar — quedan como detalles a resolver durante la implementación:

- Mostrar ~193/127 líneas de texto legal dentro de un modal es más contenido del que normalmente
  lleva un modal — confirmar visualmente que el `ScrollArea` actual de `LegalDialog` (altura fija)
  se ve bien con el contenido real; ajustar si no.

## Follow-up (fuera de alcance)

`ConfirmacionAcuerdoDialog.tsx` tiene el mismo problema de fondo (su propio arreglo `TERMINOS`
independiente) en el flujo de aceptar oferta/pago. Vale la pena un spec separado más adelante para
aplicarle el mismo fix, una vez que `src/data/legal.ts` exista como fuente compartida.

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-react-developer` (Area: frontend).
