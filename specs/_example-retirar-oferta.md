<!--
Worked example of the spec format. This is NOT a real spec — it describes a hypothetical
feature that has not been requested or approved. Do not implement this.
-->

# Spec: Trabajador puede retirar una oferta pendiente

**Status:** example (not a real spec — do not implement)
**Date:** 2026-08-25
**Area:** both

## Problem / Context

Today a trabajador who submits an oferta on a solicitud has no way to back out of it. If they
realize they can't take the job after all (schedule conflict, priced it wrong, etc.), their only
options are to let it sit until it expires (`DIAS_VIGENCIA_OFERTA` in `ofertas.service.ts`) or ask
the cliente informally to ignore it. This is confusing for clientes, who may see a stale oferta in
`OfertasDialog` with no signal that the trabajador is no longer interested.

## Goals

- A trabajador can withdraw their own oferta while it's still `pendiente`.
- The oferta disappears from the cliente's `OfertasDialog` list once withdrawn.
- The trabajador can submit a new oferta on the same solicitud afterward, if they change their mind
  again (i.e. withdrawing doesn't block a future oferta on the same solicitud).

## Non-Goals / Out of Scope

- Retracting an already-`aceptada` oferta — that's a much bigger problem (the solicitud is already
  in `ejecucion`) and out of scope here.
- Notifying the cliente (push/email) that an oferta was withdrawn — silent removal from the list is
  enough for v1.
- Letting the cliente see *that* an oferta was withdrawn (an audit trail) — withdrawn ofertas are
  just gone, not shown in a "withdrawn" state.

## Proposed Approach

Add a `retirada` value to `OfertaEstado` (currently `'pendiente' | 'aceptada' | 'rechazada'`) and a
new endpoint that only the owning trabajador can call, only while the oferta is still `pendiente`.
`OfertasService.findBySolicitud` / `findBySolicitudIds` filter `retirada` ofertas out of what's
returned to clientes, the same way expired ofertas are already flagged via `expirada`.

## Backend Impact

- `server/src/ofertas/oferta.entity.ts`: add `'retirada'` to `OfertaEstado`.
- `server/src/ofertas/ofertas.service.ts`: new `retirar(ofertaId: string, trabajadorUsername: string)`
  method — `NotFoundException` if missing, `ForbiddenException` if `oferta.trabajadorUsername !==
  trabajadorUsername`, `ConflictException` if `oferta.estado !== 'pendiente'`. Exclude `retirada`
  ofertas from `findBySolicitud`/`findBySolicitudIds` results (or keep them and let the frontend
  filter — TBD, see Open Questions).
- `server/src/ofertas/ofertas.controller.ts`: `PATCH /ofertas/:id/retirar`, guarded by
  `JwtAuthGuard`, reads `trabajadorUsername` from `req.user`, not the body.
- Migration: new column value only (`estado` is already a `varchar`), no schema change — no
  migration needed.

## Frontend Impact

- `src/lib/ofertas.ts`: add `'retirada'` to `OfertaEstado`.
- `src/store/ofertasStore.ts`: new `retirar(ofertaId, solicitudId)` action, same pattern as
  `aceptar` (call the endpoint, then re-fetch `bySolicitud` for that solicitud).
- Wherever a trabajador sees their own submitted ofertas (check current dashboard/detail views for
  the right spot — this needs its own look, not assumed here): a "Retirar oferta" button, visible
  only when `estado === 'pendiente'` and `trabajadorUsername === username`.

## Open Questions

- Should withdrawn ofertas still count toward `misOfertasSolicitudIds` (i.e., does withdrawing free
  the trabajador to see the solicitud as available again in their feed), or should it stay hidden
  from them too for a cooldown period?
- Should there be a limit on how many times a trabajador can retirar+re-ofertar on the same
  solicitud, to prevent spammy back-and-forth?
- Does `OfertasService.aceptar`'s sibling-rejection logic (marks other ofertas `rechazada` when one
  is accepted) need to account for already-`retirada` ofertas, or is `Not(ofertaId)` on `estado`
  update safe as-is regardless of prior state?

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
