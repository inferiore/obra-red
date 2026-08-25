# Specs

This folder holds lightweight specs for non-trivial changes to ObraRed — a short write-up of *what* we're building and *why*, before anyone (human or Claude Code) starts designing *how*.

The full convention is documented in the root [`CLAUDE.md`](../CLAUDE.md) under "Development workflow" — this file is the human-facing quick version.

## When do I need one?

Ask yourself: could someone reasonably say "wait, should we even do this / do it this way?" If yes, write a spec first.

**Write a spec for:**
- New features
- New API endpoints or entities
- Changes to core domain flows (estado transitions, auth, the accept-oferta transaction, the payment mock flow)
- Anything where the "what" is itself a decision, not just an implementation detail

**Skip it for:**
- Well-scoped bug fixes
- Refactors with no behavior change
- Dependency bumps
- Styling/copy tweaks

Rule of thumb: if you can state the change in one unambiguous sentence and the only open question is implementation detail, you don't need a spec.

## How to write one

1. Copy [`_template.md`](./_template.md) to `specs/YYYY-MM-DD-<slug>.md` (e.g. `specs/2026-09-03-retirar-oferta.md`).
2. Fill in the sections: problem/context, goals, non-goals, proposed approach, and (if applicable) backend/frontend impact. Leave `Status: draft` while you're iterating.
3. Discuss it — in chat with Claude, in a PR comment, however works for you.
4. Once everyone's happy, flip `Status: approved` in the file itself. That's the actual sign-off — not just a verbal "sounds good," so anyone opening the file later (including a future Claude Code session with no memory of the conversation) can tell at a glance whether it's settled.
5. From there, implementation can proceed — either by hand, or by starting a Claude Code session in Plan Mode pointed at the approved spec, which will turn it into a concrete implementation plan.
6. Optionally set `Status: implemented` once it ships. This step is skippable — don't let stale statuses become their own chore.

See [`_example-retirar-oferta.md`](./_example-retirar-oferta.md) for a filled-out (hypothetical, not real) example of the format.

## A couple of ground rules

- Files prefixed with `_` (`_template.md`, `_example-*.md`) aren't specs themselves — they sort above the real ones and are there for reference.
- Keep it short. This is an MVP with a handful of users — a spec should take minutes to write and read, not become a design doc. If a section doesn't apply, delete it or say "N/A."
- A spec is not an implementation plan. It shouldn't list step-by-step code changes — that's what Plan Mode (or just talking through the how) is for, once the what is settled.
