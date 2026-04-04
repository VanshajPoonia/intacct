# PLANS.md

Use this file for any major feature or multi-step implementation.

## Rules
- Work in milestones.
- Each milestone must end in demonstrably working frontend behavior.
- Do not move on while validation is failing.
- Keep this plan updated.

## Each plan must include
1. Goal
2. Scope
3. Files and architecture
4. Domain types
5. Mock data and services
6. UX and behavior
7. Validation
8. Milestones
9. Progress log

---

## Active Plan: Milestone 6 Dynamic Role Homepages And Demo Role System

### Goal
Turn `/` into a dynamic, role-aware finance homepage surface so each demo role lands in a distinct, service-driven workspace without leaving the shared shell.

### Scope
- `app/(workspace)/page.tsx`
- `components/layout`
- `components/finance`
- `components/workflows`
- `lib/types/ui.ts`
- `lib/mock-data/identity.ts`
- `lib/services/homepages.ts`
- `lib/services/index.ts`

### Files and architecture
- Keep `/` as the shared home URL and swap homepage content based on the visible shell role instead of redirecting per role
- Keep the existing shared shell provider as the single source for active role, entity, and date range so homepage data refreshes automatically with shell changes
- Add a dedicated homepage service module that composes existing services and returns typed homepage payloads for every role
- Replace the generic `RoleWorkspaceLanding` entrypoint with a homepage resolver that renders a bespoke accountant workspace and lighter shared role homepages

### Domain types
- Expand `lib/types/ui.ts` with homepage-specific contracts for role homepage data, sections, widgets, metrics, and actions
- Keep homepage widget metadata typed so copy, actions, emphasis, and list structure stay out of JSX

### Mock data and services
- Keep role titles, subtitles, quick actions, and emphasis in the identity dataset, with `/` as the universal default route for all primary roles
- Add `lib/services/homepages.ts` with canonical role homepage APIs that compose finance, close, workflow, search, and admin services
- Keep components consuming homepage services only, even when the homepage service internally stitches together canonical and transitional legacy service outputs

### UX and behavior
- Role switching changes `/` in place without changing the URL and updates visible actions, widgets, and navigation emphasis immediately
- Accountant homepage is the most polished surface, with queue-first, table-first sections for tasks due today, unreconciled transactions, draft journals, missing documents, close progress, exceptions, and quick actions
- AP, AR, Controller, CFO, and Admin each get distinct service-driven homepages with role-specific section ordering and action sets
- Homepage components stay dense and operational, avoiding startup-style hero cards and generic dashboard mosaics

### Validation
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- If dependencies are still missing, report the exact missing binary/blocker

### Milestones
1. Update the milestone plan and align role-home metadata for shared-home behavior
2. Add typed homepage contracts and canonical homepage service composition for all six roles
3. Implement service-driven homepage components and replace the `/` landing entrypoint
4. Run static validation and capture blockers

### Progress log
- 2026-04-04: Confirmed the shared shell already persists role, entity, and date-range state, so milestone 6 can focus on replacing the generic home surface rather than reworking shell state.
- 2026-04-04: Audited the current identity, close, reporting, workflow, and legacy service layers to map accountant-first homepage widgets to existing service-driven data.
- 2026-04-04: Confirmed `/` still renders `RoleWorkspaceLanding`, making it the correct entrypoint to replace with the new homepage resolver.
- 2026-04-04: Validation is still expected to be blocked by missing local `eslint`, `tsc`, and `next` binaries until dependencies are installed.
