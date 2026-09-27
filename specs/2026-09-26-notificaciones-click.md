# Spec: Clic en una notificación navega a la vista correcta

**Status:** approved
**Date:** 2026-09-26
**Area:** both

## Problem / Context

Notifications are created correctly today (`NotificacionesService.crear`, called from three
`notificar(...)` wrapper methods in `solicitudes.service.ts`, `ofertas.service.ts`, and
`mensajes.service.ts`) and rendered in `NotificacionesMenu.tsx`, but clicking one does nothing
beyond marking it read (`onClick={() => !n.leido && marcarLeida(n.id)}`). A cliente who gets a
"nueva oferta" notification, for example, has to close the menu and manually find and open
`OfertasDialog` themselves — the notification is informational only, not actionable.

The root blocker is that `Notificacion` only stores `solicitudId: string | null` — it has no way
to reference the specific sub-entity a notification is about (e.g. which `Oferta`), and the
frontend has no click handler to route to a dialog based on `tipo` in the first place.

## Goals

- Clicking any notification in `NotificacionesMenu` opens the correct dialog for that
  notification's `tipo`, per this mapping (already confirmed):

  | `tipo` | Recipient | Click action |
  |---|---|---|
  | `nueva_oferta` | cliente | Open `OfertasDialog` for that solicitud |
  | `oferta_aceptada` | trabajador | Open `SolicitudDetailDialog` for that solicitud |
  | `nuevo_mensaje` | cliente or trabajador | Open `ChatSolicitudDialog` for that solicitud |
  | `solicitud_en_ejecucion` | cliente | Open `ProgresoTrabajoDialog` for that solicitud |
  | `solicitud_finalizada` | trabajador | Open `SolicitudDetailDialog` for that solicitud |
  | `solicitud_en_disputa` | cliente & trabajador | Role-appropriate dialog (see below) |
  | `disputa_resuelta` | cliente & trabajador | Role-appropriate dialog (see below) |

  For `solicitud_en_disputa` and `disputa_resuelta`, the dialog choice is based on the **currently
  logged-in user's role** (`useAuthStore`), not on any property of the notification itself: cliente
  → `ProgresoTrabajoDialog`, trabajador → `SolicitudDetailDialog`.
- This works regardless of where `NotificacionesMenu` is mounted (`Dashboard.tsx` and
  `Perfil.tsx` today) — the click behavior does not depend on page-specific state.
- `Notificacion` persists enough information (beyond `solicitudId`, which stays as the navigation
  target) to identify the specific sub-entity a notification refers to, so this is extensible to
  future notification types without another schema change to the base shape.
- Clicking a notification still marks it read (existing behavior), in addition to opening the
  dialog.

## Non-Goals / Out of Scope

- Deep-linking to a specific message inside `ChatSolicitudDialog` (e.g. scrolling to/highlighting
  the exact new mensaje) — opening the chat for the right solicitud is sufficient for v1.
- Deep-linking/highlighting the specific new oferta inside `OfertasDialog`'s list — opening the
  dialog for the right solicitud is sufficient; the trabajador-facing "which oferta" is already
  visually obvious (it's the newest one).
- Backfilling `object`/`objectId` on notification rows that already exist in the DB before this
  migration — see Open Questions.
- Any change to *when*/*whether* a notification is created, or its `mensaje` text — this spec is
  purely about making existing notifications clickable.
- Push/email notifications, or any delivery channel beyond the existing in-app
  `GET /notificaciones` polling — unchanged.
- Changing `NotificacionesMenu`'s trigger UI (bell icon, badge count, dropdown) — only the
  per-item click behavior changes.

## Proposed Approach

**Backend:** add a polymorphic reference to `Notificacion`, following the existing `File` entity's
`object` / `objectId` precedent (`server/src/files/files.entity.ts`) rather than inventing a new
pattern. `solicitudId` is kept as-is and unchanged in meaning: it's the id every one of the four
target dialogs is keyed by, so it remains the single field the frontend uses to resolve *which
solicitud* to fetch/open regardless of `tipo`. `object` + `objectId` are added purely to identify
the specific sub-entity the notification is *about*, for cases where that's a different id than the
solicitud itself (an oferta, a mensaje) — additive, not a replacement, which also means no backward
compatibility break for the one existing consumer (`NotificacionesMenu`) reading `solicitudId`.

Per-`tipo` values (decided; the reasoning is that `object` names the entity class and `objectId`
its id — for `tipo`s where there's no separate entity beyond the solicitud itself, `object` is
`'solicitud'` and `objectId` duplicates `solicitudId`):

| `tipo` | `object` | `objectId` |
|---|---|---|
| `nueva_oferta` | `'oferta'` | the new oferta's id |
| `oferta_aceptada` | `'oferta'` | the accepted oferta's id |
| `nuevo_mensaje` | `'mensaje'` | the new mensaje's id |
| `solicitud_en_ejecucion` | `'solicitud'` | `solicitudId` |
| `solicitud_finalizada` | `'solicitud'` | `solicitudId` |
| `solicitud_en_disputa` | `'solicitud'` | `solicitudId` |
| `disputa_resuelta` | `'solicitud'` | `solicitudId` |

The three call sites that build notifications already have the relevant id in scope but currently
discard it (per exploration: `guardada.id` in `ofertas.service.ts` for `nueva_oferta`, the
`ofertaId` parameter for `oferta_aceptada`, the new mensaje's id in `mensajes.service.ts`) — this is
a matter of threading an id through, not new lookups.

**Frontend:** make `NotificacionesMenu` self-contained, mirroring `MensajesMenu`'s existing pattern
(owns its own "which solicitud + which dialog is open" local state and renders the dialog itself),
rather than threading callbacks/props through `Dashboard.tsx` and `Perfil.tsx` separately. On
click, the component:
1. Marks the notification read (existing behavior, unchanged).
2. Resolves the full `Solicitud` via `useSolicitudesStore` (cache hit from `solicitudes`, or
   `fetchOne(solicitudId)` if not present) — needed because `OfertasDialog` and the other target
   dialogs need the full `Solicitud` object, not just an id.
3. Picks a dialog per the `tipo` table in Goals (with the role-based branch for the two dual-role
   `tipo`s, read from `useAuthStore`), and opens it with the resolved solicitud.

`object`/`objectId` are not consumed by the click handler itself for v1 — `tipo` alone fully
determines which dialog opens, per the confirmed mapping. They're persisted per the user's explicit
request (so the data model can represent "this notification is about oferta X" rather than just
"about solicitud Y"), and become available for the two out-of-scope deep-linking improvements
above without another migration.

## Backend Impact

- `server/src/notificaciones/notificacion.entity.ts`: add `object: string | null` and
  `objectId: string | null` columns (nullable, matching `solicitudId`'s existing nullability
  pattern), same shape as `File.object`/`File.objectId`.
- New migration in `server/src/database/migrations/` for the two new columns (no `synchronize`,
  per project convention).
- `server/src/notificaciones/notificaciones.service.ts`: extend `crear(...)` to accept optional
  `object`/`objectId` params, defaulting to `null` for callers that don't pass them.
- `server/src/solicitudes/solicitudes.service.ts`: the `notificar(...)` wrapper's four call sites
  (`solicitud_en_ejecucion`, `solicitud_finalizada`, `disputa_resuelta`, `solicitud_en_disputa`)
  pass `object: 'solicitud'`, `objectId: solicitudId`.
- `server/src/ofertas/ofertas.service.ts`: the `nueva_oferta` call site passes
  `object: 'oferta'`, `objectId: guardada.id`; the `oferta_aceptada` call site passes
  `object: 'oferta'`, `objectId: ofertaId`. Both keep passing `solicitudId` as today.
- `server/src/mensajes/mensajes.service.ts`: the `nuevo_mensaje` call site passes
  `object: 'mensaje'`, `objectId` set to the new mensaje's id, alongside the existing
  `solicitudId`.
- `GET /notificaciones` response shape gains `object`/`objectId` fields — additive, no breaking
  change to existing consumers.

## Frontend Impact

- `src/store/notificacionesStore.ts`: extend the `Notificacion` type with `object: string | null`
  and `objectId: string | null` to match the API response (unused by logic beyond typing, per
  Proposed Approach).
- `src/components/NotificacionesMenu.tsx`: becomes self-contained per Proposed Approach — add local
  state for which dialog is open and for which solicitud (mirroring `MensajesMenu.tsx`'s
  `solicitudId`/`chatOpen` pattern), a `tipo` → dialog-type mapping function (including the
  role-based branch for `solicitud_en_disputa`/`disputa_resuelta`, reading `useAuthStore`), and
  renders whichever of `OfertasDialog`, `SolicitudDetailDialog`, `ProgresoTrabajoDialog`, or
  `ChatSolicitudDialog` is currently selected.
- `src/pages/Dashboard.tsx` / `src/pages/Perfil.tsx`: no prop wiring needed for this — that's the
  point of making `NotificacionesMenu` self-contained. `Dashboard.tsx`'s existing separate
  `OfertasDialog` instance (opened via its own "ver ofertas" button, unrelated to notifications)
  is untouched; `NotificacionesMenu` renders its own independent dialog instance when needed.
- No new store methods needed: `useSolicitudesStore` already exposes `fetchOne(id)` for the
  cache-miss case.

## Open Questions

Both resolved:

- No backfill for old `Notificacion` rows created before this migration. They'll have
  `object`/`objectId` as `null`, and clicking one stays a no-op (today's behavior) — acceptable.
- `nuevo_mensaje` needs no role branch: both cliente and trabajador open the same
  `ChatSolicitudDialog` for that solicitud when clicking a `nuevo_mensaje` notification — confirmed
  as intentional, not an oversight.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
