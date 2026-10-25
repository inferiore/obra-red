# Spec: Código de verificación al encuentro (reemplaza la idea del QR)

**Status:** implemented
**Date:** 2026-10-24
**Area:** both

## Problem / Context

Se propuso originalmente un sistema de código QR para que el cliente verifique la identidad del
trabajador al llegar al sitio del servicio (un "pase digital" escaneable). En la reunión se
descartó esa idea por razones técnicas concretas:
- Cada QR implicaría almacenar una imagen, lo cual no es viable guardar en el servidor actual y
  requeriría un servicio de almacenamiento externo (costo adicional).
- Leer un QR requiere una cámara decente — muchos celulares de trabajadores pueden tener cámaras
  o pantallas en mal estado, generando fricción (`"hay gente que no, que no le lee el código QR"`).

Se acordó reemplazarlo por un **código de verificación simple**, similar al que usan apps de
transporte (InDriver y similares) para confirmar que la persona que llega es la correcta.

## Goals

- Cuando una solicitud pasa a estado `ejecucion` (el trabajador fue asignado), el sistema genera
  un **código de verificación estático** para esa solicitud — se genera una sola vez y no cambia
  mientras dure el servicio.
- El código es visible tanto para el cliente como para el trabajador, cada uno en su propia app.
- Al encontrarse en persona, ambas partes simplemente comparan visualmente que el código que ve el
  trabajador coincide con el que ve el cliente — no hay escaneo, ni que ingresar nada.
- **Fallback sin el código** (por si el trabajador se queda sin internet o batería y no puede
  mostrar el código en su app): el cliente puede verificar la identidad con el nombre completo del
  trabajador y los **últimos 3 dígitos** de su documento de identidad — nunca el número completo,
  por protección de datos personales. Esta información le llega al cliente de antemano (por
  ejemplo, al momento en que se acepta la oferta/se asigna el trabajador), para poder usarla sin
  depender de que el trabajador tenga conexión en ese momento.
- El fallback no se le muestra al cliente como una alternativa más junto al código — primero se
  intenta el código; si eso falla (el trabajador no tiene cómo mostrarlo), ahí se recurre al
  fallback. (Mismo patrón que "olvidé mi contraseña": un método primero, el otro solo aparece si
  el primero no funciona.)

## Non-Goals / Out of Scope

- Código QR o cualquier mecanismo que dependa de cámara/escaneo.
- Rotación/expiración automática del código — se decidió explícitamente que sea estático por
  solicitud, no un código tipo OTP que cambie cada cierto tiempo.
- Verificación biométrica o con foto en tiempo real.
- Un "pase digital" visual con diseño elaborado (carnet de trabajador) — eso ya existe como
  funcionalidad separada (`CarnetTrabajadorDialog`, feature ya implementada); este spec es
  específicamente sobre el código de verificación en sí, no un rediseño del carnet.

## Proposed Approach

Generar el código cuando la solicitud entra en `ejecucion` (mismo momento en que se asigna
`trabajadorAsignado`, ya sea por oferta aceptada o por "Tomar trabajo"), guardarlo en la
solicitud, y exponerlo en el detalle de la solicitud tanto a cliente como a trabajador. El
documento de identidad y nombre del trabajador para el fallback ya deberían estar disponibles en
su perfil (`User` entity) — exponer solo los últimos 3 dígitos al cliente, nunca el documento
completo.

## Backend Impact

- Nuevo campo en `Solicitud` para el código de verificación (string corto, ej. 4-6 dígitos),
  generado al momento de pasar a `ejecucion` — requiere migración.
- Exponer el código (y el nombre + últimos 3 dígitos del documento del trabajador asignado, para
  el fallback) en la respuesta de la solicitud, pero **solo** a las partes involucradas (cliente
  dueño o trabajador asignado) — no exponerlo en listados generales ni a otros usuarios.
- Validar que el documento de identidad del trabajador exista en su perfil antes de permitir que
  tome/acepte trabajos (o manejar el caso de que no exista — a definir en implementación).

## Frontend Impact

- Mostrar el código de verificación en el detalle de la solicitud (`ejecucion`) tanto para cliente
  como trabajador, con una UI simple (texto grande, fácil de comparar a simple vista).
- Agregar la opción de fallback ("¿No puedes mostrar el código?") que revela el nombre + últimos 3
  dígitos del documento, visible solo si el usuario la abre explícitamente (no mostrarla junto al
  código por defecto).

## Open Questions

- ¿En qué momento exacto deja de ser relevante el código — cuando la solicitud pasa a `revision`,
  o se mantiene visible mientras la solicitud no esté `finalizado`? Se propone que sea visible
  mientras `estado === 'ejecucion'` (o también `'corrigiendo'`, ya que el trabajador puede volver
  al sitio) y dejar de mostrarse después.
- ¿Qué pasa si se reemplaza el trabajador asignado (no debería poder pasar hoy, pero confirmar)?
  Asumiendo que no aplica porque `trabajadorAsignado` no cambia una vez asignado.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer`.
