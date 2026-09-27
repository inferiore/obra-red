# Spec: Términos y condiciones clickeables dentro del checkbox de aceptación de oferta

**Spec #:** 2
**Status:** implemented
**Date:** 2026-09-10
**Area:** frontend

## Problem / Context

`src/components/ConfirmacionAcuerdoDialog.tsx` (el diálogo que un cliente ve antes de aceptar una
oferta y pasar al pago) ya tiene dos botones funcionales — "Términos y condiciones" y "Política de
privacidad" — que abren `LegalDialog`. Sin embargo, el checkbox de aceptación obligatorio (el que
habilita "Confirmar y continuar al pago") tiene su propio texto — "**términos del servicio**" y
"**condiciones de la plataforma ObraRed**" — con estilo `underline font-semibold`, es decir, _se ve_
como un enlace, pero no tiene `onClick` ni abre nada. Es una señal visual engañosa: el usuario
espera que sea clickeable y no lo es.

## Goals

- El texto "términos del servicio" y "condiciones de la plataforma" dentro del label del checkbox
  de aceptación es realmente clickeable y abre el mismo `LegalDialog` (terminos/privacidad) que los
  botones existentes.
- Hacer click en ese texto no debe marcar/desmarcar el checkbox (hoy toda la fila es un `<label>`
  que envuelve el `Checkbox`, así que un click en cualquier parte del label lo activa por defecto).

## Non-Goals / Out of Scope

- No se tocan ni se eliminan los botones independientes "Términos y condiciones" / "Política de
  privacidad" que ya existen arriba del checkbox — siguen funcionando igual.
- No se exige que el usuario haya abierto/leído los términos antes de poder marcar el checkbox
  (podría ser un endurecimiento futuro de cumplimiento, pero no fue pedido aquí).

## Proposed Approach

`src/pages/Register.tsx` (checkbox "Crear cuenta de Cliente/Trabajador", líneas ~767-794) ya
resuelve exactamente este mismo problema correctamente: dentro del label del checkbox de aceptación,
"términos y condiciones" y "política de privacidad" son `<button type="button" onClick={() =>
setLegalOpen("terminos"|"privacidad")}>` con estilo `text-primary underline`. No usa
`stopPropagation` — no hace falta: quien recibe el click es el propio `<button>` (un control
interactivo), y los navegadores no reenvían ese click como toggle del checkbox asociado cuando el
elemento clickeado ya es interactivo por sí mismo (a diferencia de clickear texto plano dentro del
label). Confirmado que este patrón ya funciona en producción — se replica tal cual en
`ConfirmacionAcuerdoDialog.tsx`, cambiando los `<span>` estáticos por `<button>` iguales a los de
`Register.tsx`, reutilizando el `legalOpen`/`LegalDialog` que el diálogo ya tiene.

## Frontend Impact

- `src/components/ConfirmacionAcuerdoDialog.tsx` únicamente: cambiar el `<span>` estático dentro del
  `<label htmlFor="acepto-terminos">` por dos botones inline con `stopPropagation`. No hay cambios
  de store ni de API.

## Open Questions

Ninguna pendiente.

## Resolved Questions

- ¿"condiciones de la plataforma" debe abrir `privacidad` (como el botón "Política de privacidad")
  o `terminos`? **Resuelto por el usuario:** "términos y condiciones" → abre `terminos` (Términos y
  Condiciones de uso de la plataforma ObraRed); "política de privacidad" → abre `privacidad`
  (Política de Privacidad — cómo tratamos y protegemos tus datos personales). Mismo mapeo y misma
  redacción de enlaces que ya usa correctamente `src/pages/Register.tsx` en el checkbox de "Crear
  cuenta de Cliente/Trabajador".

---

Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
