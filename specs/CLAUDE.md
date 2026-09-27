# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ObraRed is a marketplace connecting clients ("clientes") with tradespeople ("trabajadores") for home-repair jobs in Colombia. The frontend was scaffolded by Lovable (vite_react_shadcn_ts template); the backend (`server/`) is a hand-built NestJS + TypeORM + SQLite API. All app text/UI is in Spanish; domain terms (solicitud, oferta, trabajador, etc.) should stay in Spanish to match the rest of the codebase.

## Commands

**Frontend** (repo root):
- `npm i` — install dependencies (package-lock.json is the source of truth; bun.lock/bun.lockb also exist from the Lovable origin but npm is what's been used locally)
- `npm run dev` — start Vite dev server (defaults to port 8080, falls back to next free port if in use)
- `npm run build` / `npm run build:dev` / `npm run preview`
- `npm run lint` — ESLint (config ignores `server/`, which has its own)
- `npm run test` / `npm run test:watch` — vitest
- Run a single test file: `npx vitest run src/test/example.test.ts`

**Backend** (`server/`):
- `npm i` — install dependencies
- `npm run start:dev` — Nest in watch mode (port 3001 by default, see `server/.env`)
- `npm run migration:generate` / `migration:run` / `migration:revert` — TypeORM migrations against `server/src/database/data-source.ts`
- `npm run seed` — (re)inserts the 3 demo users (`cliente`/`trabajador`/`admin`, password `obrared1`) into SQLite; safe to re-run, skips existing usernames
- Both servers must run simultaneously for the app to work; frontend reads the API base URL from `VITE_API_URL` in the root `.env` (defaults to `http://localhost:3001`)

## Architecture

**Real backend, no more mocks.** The frontend used to fake everything in React Context + localStorage; that's been replaced by a NestJS API (`server/`) backed by SQLite, with Zustand stores on the frontend calling it over `fetch`.

### Backend (`server/src/`)
- **Modules**: `auth/` (register/login/me, JWT via `@nestjs/jwt` + `passport-jwt`, `JwtAuthGuard`/`RolesGuard`), `users/` (profile updates), `solicitudes/` (CRUD + estado transitions), `ofertas/` (create/list/aceptar).
- **Entities** (`*/​*.entity.ts`): `User`, `Solicitud`, `Oferta`. `Oferta` is a real persisted row (not derived) — `trabajadorUsername` + `solicitudId` are the only identity; display fields like `nombre`/`calificacion`/`verificado` are joined from `User` at read time via `OfertasService`'s private `enriquecer()` helper, so they always reflect the trabajador's current profile. `OfertasService.findBySolicitud` enriches ofertas for one solicitud (used by `GET /ofertas?solicitudId=X`); `OfertasService.findBySolicitudIds` batches the same enrichment across many solicitudes in one query (via TypeORM `In()`) and returns a `Map<solicitudId, OfertaEnriquecida[]>` — `SolicitudesService.findAll` calls this to embed each solicitud's `ofertas` directly in `GET /solicitudes`, so the frontend never has to fetch ofertas per solicitud just to render a list (see the N+1 note below).
- **Accepting an oferta** (`PATCH /ofertas/:id/aceptar`) runs inside a single `DataSource.transaction`: the target oferta → `aceptada`, sibling ofertas on the same solicitud → `rechazada`, and the parent `Solicitud` → `estado: 'ejecucion'` + `trabajadorAsignado` set. Don't split this across separate client-side calls — the frontend calls this one endpoint and refetches.
- **Migrations**: SQLite, `synchronize: false`, migrations live in `server/src/database/migrations/`. Always generate a migration after entity changes rather than relying on sync.
- **JWT secret loading gotcha**: `main.ts` imports `dotenv/config` as its very first line, before `AppModule`. This matters because CommonJS require() evaluates `auth.module.ts` (and its `JwtModule.register()` call, which reads `process.env.JWT_SECRET` at module-evaluation time) before `app.module.ts`'s own `ConfigModule.forRoot()` runs — if `.env` isn't loaded even earlier in `main.ts`, tokens get signed with a different secret than they're verified with silently.

### Frontend (`src/`)
- **State**: three Zustand stores replace the old Context providers — `src/store/authStore.ts` (session, persisted to `sessionStorage` via zustand's `persist` middleware — deliberately not `localStorage`, to preserve the original "session doesn't survive browser restart" behavior), `src/store/solicitudesStore.ts`, `src/store/ofertasStore.ts` (keyed by solicitud id: `bySolicitud: Record<string, Oferta[]>`, used by `OfertasDialog.tsx` for a single on-demand fetch when a cliente opens it — not used by the Dashboard list, see below). No providers needed — components just call `useAuthStore()`, etc. Pages that read `solicitudes`/`ofertas` are responsible for calling `fetchAll()`/`fetchBySolicitud()` in a `useEffect` on mount (see `Dashboard.tsx`, `Perfil.tsx`, `OfertasDialog.tsx`).
- **API client**: `src/lib/apiClient.ts` is a thin `fetch` wrapper (`apiFetch<T>(path, { method, body, token })`), throwing `ApiError` (has `.status`) on non-2xx responses.
- **Ranking helpers** (`src/lib/ofertas.ts`): `calcularScore`/`ordenarPorMejor`/`razonMejorOferta` are still pure client-side functions over real `Oferta[]` fetched from the store — only the old `getOfertasMock` hash-based generator was removed.
- **Routing (`src/App.tsx`)**: React Router with `/`, `/acceso` (role select), `/login`, `/registro`, `/dashboard`, `/perfil`, `/terminos`, `/privacidad`. `/dashboard` and `/perfil` are wrapped in `<ProtectedRoute>` (`src/components/ProtectedRoute.tsx`), which reads `useAuthStore` and redirects to `/login` if unauthenticated (supports an `allow` prop to restrict by `UserRole`).
- **Dashboard is role-branched**: `src/pages/Dashboard.tsx` renders different views/actions depending on `user.role` (cliente vs. trabajador vs. admin) rather than having separate route trees per role. A trabajador's "already offered on this solicitud" filter is derived live from `s.ofertas` (each `Solicitud` returned by `GET /solicitudes` now carries its own `ofertas: Oferta[]`, checking `trabajadorUsername`), not a stored flag.
- **N+1 fix (2026-08)**: `Dashboard.tsx` used to loop over every visible solicitud on mount and fire one `GET /ofertas?solicitudId=X` per solicitud just to show an "N ofertas" badge and the already-offered check — classic N+1. Fixed by embedding `ofertas` directly on each solicitud in `GET /solicitudes` (via `OfertasService.findBySolicitudIds`, one batched query total). Don't reintroduce a per-solicitud fetch loop for list rendering — if a view needs fresh/single-solicitud oferta data on demand (like `OfertasDialog` does when a user opens it), that's a legitimate one-off fetch via `ofertasStore.fetchBySolicitud`, not a loop over a list.
- **Two competing "trabajador takes a job" flows exist by design**: a trabajador can either click "Tomar trabajo" (direct claim, calls `PATCH /solicitudes/:id/estado` straight to `ejecucion`, bypasses ofertas entirely) or submit a priced oferta via `SolicitudDetailDialog` for the cliente to review/accept in `OfertasDialog`. These are intentionally not unified.
- **UI components**: `src/components/ui/*` is the shadcn/ui primitive layer (generated, follow existing conventions if adding more — see `components.json` for aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`). Domain components (dialogs like `CalificacionDialog`, `PagoFlowDialog`, `ProgresoTrabajoDialog`, `EvidenciasUploadDialog`, etc.) live directly under `src/components/`. The payment flow (`PagoFlowDialog`) is still a pure UI mock — no real payment provider is integrated; "accepting" an oferta for real happens via the ofertas store before the mock payment screen shows.
- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.json`).

## Development workflow

### Spec-driven development

For non-trivial changes, write a spec **before** entering Plan Mode. A spec captures the *what* and
*why* (the product/requirements decision); Claude Code's built-in Plan Mode then covers the *how*
(the implementation approach) — Plan Mode should design *from* an approved spec, not replace it.

**When to write a spec:** if the change is a new feature, a new API endpoint/entity, a change to a
core domain flow (estado transitions, auth, the accept-oferta transaction, the payment mock flow),
or anything where the "what" itself is a decision someone could reasonably question — write a spec
first. Skip straight to Plan Mode (or straight to implementation for trivial cases) for
well-scoped bug fixes, refactors with no behavior change, dependency bumps, and styling tweaks —
anything where you could state the change in one unambiguous sentence and the only real question is
implementation detail.

**Where specs live:** `specs/<YYYY-MM-DD>-<slug>.md`, one file per spec, copied from
`specs/_template.md`. See `specs/_example-retirar-oferta.md` for a worked (hypothetical, non-real)
example of the format.

**Workflow:**
1. Draft the spec (`Status: draft`) and iterate on it in chat with the user.
2. Once the user is happy with it, update `Status: approved` in the file — this is the approval
   gate, not just verbal agreement in chat, so a later session can tell at a glance whether a spec
   is settled.
3. Start Plan Mode referencing the approved spec file; the plan should describe implementation
   steps, not re-litigate the *what*.
4. Once the plan is approved, implement via `senior-react-developer` / `senior-nest-developer`
   (per the spec's `Area` field, or both).
5. Optionally flip `Status: implemented` once shipped — low ceremony, skip if it's not useful.

Don't let this become bureaucratic overhead: this is a solo/small-team MVP project (see the
backend subagent's own anti-over-engineering guidance) — most day-to-day changes should skip the
spec step entirely.

## Notes on tooling

- Frontend TypeScript is configured loosely on purpose: `strictNullChecks: false`, `noImplicitAny: false`, `noUnusedLocals/Parameters: false` (see `tsconfig.json`). Backend (`server/tsconfig.json`) is stricter (`strictNullChecks: true`) — don't assume the same laxity there.
- Frontend ESLint has `@typescript-eslint/no-unused-vars` turned off.
- `lovable-tagger`'s `componentTagger` plugin only runs in dev mode (`mode === "development"` in `vite.config.ts`) — it's part of the Lovable editor integration, not needed for prod builds.
- `.lovable/plan.md` contains a leftover plan doc from a previous Lovable-driven change (LegalDialog scroll fix) — historical context, not current TODO.
- `server/obrared.sqlite` and `server/.env` are gitignored; re-run `npm run migration:run` + `npm run seed` after a fresh clone since the DB file isn't checked in.
