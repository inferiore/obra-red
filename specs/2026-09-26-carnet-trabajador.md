# Spec: Carnet de identificación del trabajador

**Status:** approved
**Date:** 2026-09-26
**Area:** frontend

## Problem / Context

Today, once a cliente accepts an oferta and a trabajador is assigned to a solicitud, there's no
visual way for the cliente to confirm who's actually showing up to do the work, nor any
identification artifact the trabajador can show at the door. `PATCH /ofertas/:id/aceptar` moves the
`Solicitud` to `estado: 'ejecucion'` and sets `trabajadorAsignado`, but from there the relationship
is purely data — nothing renders a "this person is authorized for this job" credential on either
side.

Note: this only applies to the oferta-acceptance path. The other existing acceptance path in this
codebase — "Tomar trabajo" (direct claim via `PATCH /solicitudes/:id/estado` straight to
`ejecucion`, bypassing ofertas) — is explicitly out of scope here (see Non-Goals).

## Goals

- When a cliente accepts an oferta (`PATCH /ofertas/:id/aceptar` succeeds), a carnet becomes
  viewable for that specific solicitud, from both the cliente's and the trabajador's side.
- The carnet displays: trabajador nombre, foto, calificación (puntuación); the work to be done
  (the solicitud's tipo/categoría + descripción); cliente nombre; ubicación; and a date.
- The carnet is viewable in-app (a dialog/card component) and downloadable as a PDF from the same
  view, for both roles.
- The carnet is derived entirely from existing data (`Solicitud`, `User`) at render/export time —
  no new backend record is created or persisted when a carnet is "issued."
- The carnet is only accessible while the job is active — it stops being accessible once the
  solicitud reaches `estado: 'finalizado'` (exact boundary for in-between estados like `revision` /
  `corrigiendo` / `disputa` is an open question below).
- The carnet is scoped to one solicitud — it is not a reusable, persistent per-trabajador
  credential shown across unrelated jobs.

## Non-Goals / Out of Scope

- Not triggered by the "Tomar trabajo" direct-claim flow — only by oferta acceptance.
- No new backend entity, table, or migration to store issued carnets, verification codes, or an
  issuance audit trail. If a future need arises for persistent/auditable carnets, that's a separate
  spec.
- No QR code, cryptographic signature, or scannable verification mechanism — the requested contents
  are plain informational fields, not a security credential. (Flagged as an open question below in
  case that's actually wanted.)
- No notification (push/email) when a carnet becomes available — it's accessible on demand from the
  UI, not proactively pushed.
- No real trabajador photo upload feature. The app has no headshot/avatar upload today — the
  "photo" on the carnet will reuse the same generated initials avatar (`fotoUrl`, via
  `api.dicebear.com`) already used for trabajador display elsewhere (e.g. `OfertaCard` in
  `OfertasDialog.tsx`, `toPublicProfile` in `users.controller.ts`). Actually adding real photo
  uploads is a separate feature.
- No changes to the accept-oferta transaction itself (`OfertasService.aceptar`) — carnet rendering
  is purely a read-time view on data that transaction already produces.

## Proposed Approach

A new frontend-only presentational component (e.g. `CarnetTrabajadorDialog`) renders the carnet from
data already available to the client:
- The `Solicitud` record (tipo, descripción, ubicación, clienteNombre, trabajadorAsignado, estado) —
  already present in `solicitudesStore` for both roles once a solicitud is in `ejecucion` or beyond.
- The trabajador's public profile (nombre, calificación, fotoUrl, verificado) — fetched via the
  existing `GET /users/:username` endpoint (`toPublicProfile` in `users.controller.ts`), the same
  one already used by `TrabajadorPerfilDialog`. No new endpoint needed.

Entry points (both open the same carnet component, one per role's existing view):
- **Cliente side**: from `OfertasDialog.tsx`, once `handlePagoCompletado` completes (right after
  `aceptarOferta` succeeds) — offer a way to view the carnet there — and from wherever the cliente
  can already see a solicitud's detail while it's active (`SolicitudDetailDialog.tsx` or
  equivalent), for any of their own solicitudes past acceptance and before `finalizado`.
- **Trabajador side**: from `Dashboard.tsx`'s "mis trabajos" view, for solicitudes where
  `trabajadorAsignado === username` and estado is in the active window — a "Ver carnet" action next
  to the existing job entries.

PDF export is a new client-side capability — this codebase currently has no PDF-generation
dependency in `package.json`, so this introduces one (exact library — e.g. `jspdf` +
`html2canvas`, or a print-stylesheet-based approach — is a Plan Mode / implementation decision, not
a spec decision).

## Frontend Impact

- New component, likely `src/components/CarnetTrabajadorDialog.tsx` (naming TBD in Plan Mode),
  rendering the fields listed in Goals from a `Solicitud` + trabajador public profile.
- `src/components/OfertasDialog.tsx`: hook a "Ver carnet" affordance into the post-acceptance flow
  (`handlePagoCompletado`), alongside the existing toast.
- `src/components/SolicitudDetailDialog.tsx` (or wherever the cliente already views an in-progress
  solicitud's detail — confirm the exact current view in Plan Mode): add a "Ver carnet" entry point
  for active solicitudes.
- `src/pages/Dashboard.tsx`: add a "Ver carnet" entry point in the trabajador's list of assigned
  jobs (`trabajadorAsignado === username`).
- New dependency for client-side PDF generation (specific package TBD in Plan Mode).
- No changes to `src/store/solicitudesStore.ts` or `src/store/ofertasStore.ts` data shapes — this
  reads existing fields, it doesn't add new ones.

## Resolved Decisions

- **Estado boundary**: the carnet is accessible for any solicitud where `trabajadorAsignado` is set
  and `estado !== 'finalizado'` — i.e. it remains visible through `ejecucion`, `revision`,
  `corrigiendo`, and `disputa`, not just strictly during `ejecucion`. Reasoning: this is the more
  conservative default for the stated goal ("identify the trabajador for the duration of the job") —
  narrowing availability to `ejecucion` only would hide the carnet the moment a cliente requests a
  correction (`corrigiendo`) or a dispute opens, which are exactly the moments a cliente is most
  likely to want to double check who they're dealing with. It only disappears once the job is
  actually done (`finalizado`).
- **"Date" field**: shown as the render-time date (today, whenever the carnet is viewed or exported),
  not a stored "accepted on" timestamp — `Solicitud` doesn't track when it transitioned to
  `ejecucion`, and adding that would mean new persistence, which is out of scope per this spec's
  Goals (no new backend record).
- **Photo**: reuses the existing dicebear-generated initials avatar (`fotoUrl`) already used
  elsewhere for trabajadores (`OfertaCard`, `toPublicProfile`) — no real photo upload feature exists
  in this codebase today, and adding one is out of scope here.
- **Verification affordance**: scoped out — the carnet is a plain informational card (no QR code,
  no cryptographic signature, no scannable verification). See Non-Goals.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-react-developer` per `Area`.
