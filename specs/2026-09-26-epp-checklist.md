# Spec: Checklist de EPP (dotación de seguridad) antes de subir evidencias de progreso

**Status:** approved
**Date:** 2026-09-26
**Area:** frontend

## Problem / Context

Today a trabajador can open `EvidenciasUploadDialog` from `Dashboard.tsx` (via the "Subir
evidencias" / "Corregir y reenviar" action shown while a solicitud is `ejecucion` or
`corrigiendo`) and go straight to uploading antes/durante/después photos — there's no moment in
the flow where the trabajador is asked to confirm they're using their equipo de protección
personal (EPP) dotación on the job site. The business wants to introduce basic worker-safety
messaging ("queremos tener cuidado con nuestros trabajadores") by requiring the trabajador to
confirm they're wearing/using their EPP before the first progress-evidence upload for a given
job.

This is a UI-only safety nudge/gate, not a compliance record: nothing about this confirmation is
sent to or stored by the backend.

## Goals

- Before a trabajador can upload progress evidence (antes/durante/después photos) for the first
  time on a given solicitud, they must confirm an EPP checklist covering: cascos, guantes, botas
  de seguridad, gafas, suéteres tipo buzo, pantalones largos.
- The trabajador cannot proceed to the antes/durante/después upload UI in `EvidenciasUploadDialog`
  until that confirmation is given — the checklist blocks/gates the upload path, it isn't a
  dismissible reminder.
- On subsequent uploads for the same solicitud (e.g. a `corrigiendo` resubmit after the cliente
  requests corrections), the trabajador is not asked again.
- Only the trabajador sees this checklist — clientes and admin never see it (it does not appear in
  the cliente's read-only view of `EvidenciasUploadDialog`, nor in `ProgresoTrabajoDialog`, nor
  anywhere in the admin views).
- No backend change of any kind: no new entity, column, migration, or endpoint. This is enforced
  entirely client-side.

## Non-Goals / Out of Scope

- No audit trail or record of EPP confirmations — the backend never learns this happened, and
  there's no way for a cliente/admin to see whether/when a trabajador confirmed.
- No enforcement beyond the UI gate — nothing stops a trabajador from confirming without actually
  wearing the equipment; this is an honor-system nudge, not verification.
- Does not gate the "subir evidencia de disputa" tab/flow in the same dialog (disputa evidence is
  a different kind of upload, unrelated to progress documentation) — only the antes/durante/después
  progress-evidence path is gated.
- Does not touch the "Tomar trabajo" direct-claim flow, oferta flow, or any other part of the
  solicitud lifecycle — this only affects the moment right before progress-evidence upload.
- Does not affect `ProgresoTrabajoDialog` (the cliente's read-only progress/chat view) or any
  cliente-facing screen.
- Not part of / does not conflict with the separate in-progress "carnet trabajador" spec
  (`specs/2026-09-26-carnet-trabajador.md`) — unrelated feature, no shared code assumed here.

## Decisions

- **Checklist granularity**: 6 individually-checkable checkboxes, one per item (cascos, guantes,
  botas de seguridad, gafas, suéteres tipo buzo, pantalones largos) — all 6 must be checked to
  proceed. Not a single blanket "confirmo dotación completa" checkbox.
- **Copy/wording**: title "Antes de subir evidencias"; intro "Por tu seguridad, confirma que estás
  usando tu dotación de protección personal antes de continuar."; the 6 checklist item labels are
  exactly as named above (Cascos, Guantes, Botas de seguridad, Gafas, Suéteres tipo buzo,
  Pantalones largos).
- **Re-confirmation within a browser session before first real submit**: the confirmation is
  remembered client-side per solicitud id in `sessionStorage` (same session-scoped pattern already
  used by `authStore` — cleared on browser restart, not `localStorage`), so reopening the dialog
  within the same session doesn't re-prompt even before the first actual evidence submission for
  that solicitud. Once real progress evidence exists on the solicitud (`evidenciaAntes/Durante/
  Despues` no longer all empty), the gate is moot anyway per the derived "first time" logic below.

## Proposed Approach

Add an EPP confirmation step inside `EvidenciasUploadDialog` (the actual entry point for
progress-evidence upload — confirmed by reading `Dashboard.tsx`: the trabajador's "Subir
evidencias" / "Corregir y reenviar" action for `ejecucion`/`corrigiendo` solicitudes calls
`setEvidenciasOfId(s.id)` directly, opening this dialog with no intermediate screen).

The dialog already branches its content on `puedeSubirNormal` (trabajador + estado in
`ejecucion`/`corrigiendo`) vs. read-only/disputa views. The EPP checklist only applies inside that
`puedeSubirNormal` branch, as a step shown before the antes/durante/después tabs are usable.

"First time for this job" is derived rather than separately tracked: `Solicitud` already carries
`evidenciaAntes` / `evidenciaDurante` / `evidenciaDespues` (fetched via `fetchOne` when the dialog
opens). If all three are empty, no progress evidence has ever been submitted for this solicitud
yet, so the checklist gate applies; once the trabajador has successfully submitted evidence once
(`subirEvidencias` succeeds), those fields are non-empty on refetch and the gate no longer shows,
including on a later `corrigiendo` resubmit. This needs no new client storage keyed by solicitud
id and no backend field.

## Frontend Impact

- `src/components/EvidenciasUploadDialog.tsx`: when `puedeSubirNormal` is true and the solicitud
  has no existing progress evidence (`evidenciaAntes/Durante/Despues` all empty), render an EPP
  checklist step (6 individually-checkable items) in place of the antes/durante/después tabs, with
  its own confirm action; only after confirming does the dialog reveal the normal upload
  tabs/footer. Confirmation is recorded in `sessionStorage` keyed by solicitud id (e.g.
  `epp-confirmado-<solicitudId>`) so it isn't re-prompted on dialog reopen within the same browser
  session, following the same session-scoped storage pattern `authStore` already uses.
- No changes to `src/store/solicitudesStore.ts`, `src/types/solicitud.ts`, or any backend file —
  this is presentation-only, gating an existing UI path with no new data dependency.

## Open Questions

None outstanding — see Decisions above.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
