# Spec: Adjuntar fotos y video al solicitar una corrección

**Status:** implemented
**Date:** 2026-10-24
**Area:** both

## Problem / Context

Hoy, cuando un cliente pide una corrección sobre un trabajo entregado (`solicitarCorreccion`), no
tiene forma de mostrar visualmente qué está mal — solo puede describirlo por texto. En la reunión
se propuso que, además de poder usar el chat general de la solicitud
(ver `specs/2026-10-24-chat-visible-admin-disputa.md`), el cliente pueda adjuntar varias fotos y
un video corto (hasta 30 segundos) directamente al pedir la corrección, para que el trabajador (y
el admin, si hay disputa después) entiendan exactamente el problema sin depender solo del texto.

Al confirmar el alcance: sin almacenamiento externo (bucket) por ahora, y el video es de **30
segundos**, no 30 minutos como se interpretó inicialmente.

## Nota técnica — mecanismo de almacenamiento a usar

El proyecto **ya tiene** un mecanismo de archivos en disco, separado de la base de datos: el
módulo `files` (`server/src/files/`), con `POST /files` (multipart, vía `FilesInterceptor`), que
guarda los archivos físicamente en `./uploads/` del servidor y solo registra la ruta
(`/uploads/<archivo>`) en una tabla `files` — nada de base64 ni bucket externo. El frontend ya
tiene el helper `resolveFileUrl` (`src/lib/apiClient.ts`) preparado para anteponerle la URL base
a esas rutas relativas.

Sin embargo, `EvidenciasUploadDialog.tsx` (el componente que hoy maneja fotos de
evidencia/disputa) **no usa ese mecanismo** — sigue convirtiendo las fotos a base64 con
`FileReader.readAsDataURL()` y las manda como texto dentro del body de la solicitud, que es
justamente el patrón que ya causó el problema de payloads pesados (commit `6622e16`). Para fotos y
video de corrección, **se debe usar el endpoint `/files` existente**, no repetir el patrón de
base64, evitando así el problema de origen sin necesidad de contratar almacenamiento externo.

Con video de 30 segundos (no 30 minutos) y guardado en disco vía `/files`, esto es viable sin
bucket externo. Los puntos a resolver en implementación, no en este spec, son de validación
(tamaño máximo de archivo y duración del video), no de arquitectura de almacenamiento.

## Goals

- Al solicitar una corrección, el cliente puede adjuntar varias fotos.
- El cliente también puede adjuntar un video de **hasta 30 segundos**.
- Fotos y video se suben vía el endpoint `/files` existente (multipart, a disco), no como base64
  embebido en el body.
- El trabajador ve esas fotos/video al revisar la corrección solicitada.

## Non-Goals / Out of Scope

- Almacenamiento externo (bucket/S3) — descartado explícitamente por ahora.
- Edición o anotación de las fotos/video (marcar con flechas, recortar, etc.).
- Streaming en vivo — es contenido subido, no una llamada de video.
- Migrar `EvidenciasUploadDialog.tsx` a usar `/files` en lugar de base64 para los flujos que ya
  existen (evidencia antes/durante/después, fotos de disputa) — fuera de alcance de este spec,
  aunque sería una mejora natural a futuro y podría considerarse su propio spec de refactor.

## Proposed Approach

Extender el formulario de "Solicitar corrección" para incluir un selector de fotos (múltiples) y
un selector de video, usando el mismo patrón multipart que ya expone `POST /files`
(`object`/`objectId` para asociar los archivos a la solicitud/corrección). Validar en el backend
el tamaño máximo de archivo y, para el video, un límite de duración de 30 segundos. Guardar en la
solicitud las referencias (rutas) a los archivos subidos, no el contenido.

## Backend Impact

- `server/src/files/files.controller.ts` — el endpoint `POST /files` ya acepta hasta 5 archivos
  (`FilesInterceptor('files', 5)`); el `ParseFilePipe` hoy no tiene validadores (`validators: []`)
  — agregar validación de tipo MIME (imagen/video) y tamaño máximo de archivo.
  - Para el video, agregar validación de duración máxima (30s). Esto requiere inspeccionar el
    archivo subido (ej. con `ffprobe`/una librería equivalente) ya que no se puede confiar en el
    valor que reporte el cliente — a definir la herramienta exacta en implementación.
- `server/src/solicitudes/solicitudes.service.ts` (`solicitarCorreccion`) — aceptar referencias a
  los archivos subidos (rutas de `/files`) y asociarlas a la corrección solicitada. Requiere
  decidir dónde se guardan esas referencias (nuevo campo en `Solicitud`, o aprovechar el campo
  `object`/`objectId` de la tabla `files` para consultarlas sin duplicar datos — revisar en
  implementación cuál encaja mejor con el patrón ya usado por `files.service.ts`).

## Frontend Impact

- Extender el diálogo donde se solicita la corrección para incluir selector de fotos (múltiples) y
  selector de video, subiendo ambos vía `POST /files` (multipart) en vez de convertir a base64.
- Mostrar las fotos/video adjuntos (resueltos con `resolveFileUrl`, igual que ya se hace con otras
  rutas de `/uploads/`) en la vista del trabajador cuando recibe la corrección.
- Validar en el cliente la duración del video antes de subir (para dar feedback inmediato), aunque
  la validación real y definitiva debe quedar también del lado del servidor.

## Open Questions

- ¿Hay un límite de cantidad de fotos? Se propone reusar el límite ya existente de 5 archivos por
  subida que impone `FilesInterceptor('files', 5)`, salvo que se prefiera uno distinto.
- ¿El video es obligatorio, opcional, o reemplaza a las fotos (uno u otro, no ambos)? Se asume
  opcional y complementario a las fotos salvo que se indique lo contrario.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design la implementación. Delegate la implementación vía
`senior-nest-developer` / `senior-react-developer`.
