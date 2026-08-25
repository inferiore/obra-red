<!--
Spec template for ObraRed. Copy this file to specs/YYYY-MM-DD-<slug>.md, fill it in,
and set Status to `approved` once the user has reviewed it in chat.
See CLAUDE.md > "Spec-driven development" for when a spec is required.
-->

# Spec: <short title>

**Status:** draft
**Date:** YYYY-MM-DD
**Area:** frontend | backend | both

## Problem / Context

What real problem or need motivates this change? What happens today (or doesn't happen) that this fixes?

## Goals

- What this change must achieve, stated as outcomes — not implementation steps.

## Non-Goals / Out of Scope

- What this spec explicitly does NOT cover, to keep scope bounded.

## Proposed Approach

High-level shape of the solution: which entities/endpoints/pages/stores are affected, and — if both
frontend and backend are touched — the contract between them (API shape, new fields, new estado
values, etc.). This is not an implementation plan; Plan Mode covers step-by-step "how" once this
spec is approved.

## Backend Impact
*(omit this section if Area: frontend)*

## Frontend Impact
*(omit this section if Area: backend)*

## Open Questions

- Anything the user still needs to decide before this can move to `approved`.

---
Once approved: set `Status: approved` above, then start a Claude Code session in Plan Mode
referencing this file to design the implementation. Delegate the actual implementation to
`senior-nest-developer` / `senior-react-developer` per `Area`.
