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

## Active Plan: Milestone 11-12 Admin, Platform Controls, And Final Stub Cleanup

### Goal
Build service-driven Admin, Integrations, API / Developer Platform, Rule Engine, Exports & Sharing, and Event Monitoring workspaces, then remove the remaining top-level placeholder routes while preserving a green validation baseline.

### Scope
- `app/(workspace)/admin`
- `app/(workspace)/admin/*`
- `app/(workspace)/integrations`
- `app/(workspace)/api-developer`
- `app/(workspace)/rule-engine`
- `app/(workspace)/exports-sharing`
- `app/(workspace)/event-monitoring`
- `app/(workspace)/accounts-receivable`
- `app/(workspace)/dashboards`
- `app/(workspace)/ai`
- `app/(workspace)/workflows-automation`
- `components/admin`
- `lib/types`
- `lib/mock-data`
- `lib/services`
- `lib/mock-data/shell.ts`
- `lib/services/index.ts`

### Files and architecture
- Keep `app/(workspace)/page.tsx` as the authenticated home and do not restore `app/page.tsx`
- Reuse the shared dense workspace pattern already used by finance modules for platform/governance routes
- Replace old `AppShell` admin pages with thin route wrappers over shared client workspace components
- Remove top-level `ShellStubRoute` usage from the targeted routes and replace it with service-driven overview or operator workspace components
- Keep pages consuming `@/lib/services` only, with no direct `mock-data` reads in components

### Domain types
- Add typed platform/admin objects for integrations, developer assets, rules, exports, event monitoring, custom fields, and notification policies
- Add shared platform workspace query and list/detail typing through the `@/lib/types` barrel

### Mock data and services
- Add structured mock datasets for platform/admin domains under `lib/mock-data/platform.ts`
- Add canonical workspace services for admin, integrations, API / developer platform, rule engine, exports/sharing, and event monitoring
- Add service-driven overview services for dashboards, AI, workflows automation, and AR overview routes so they stop being static stubs
- Keep filters, sorting, pagination, drawers, saved views, and mutations flowing through services plus local UI state

### UX and behavior
- Admin and platform pages should be dense, operator-friendly, and role-aware
- `/admin` and `/admin/*` should share one service-backed workspace model with section locking rather than bespoke page logic
- Top-level platform modules should expose quick actions, sticky controls, tables, saved views, and right-side drawers where appropriate
- Any visible top-level section left on the page must be service-driven, not static placeholder copy

### Validation
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- Preserve passing validation after the final cleanup

### Milestones
1. Confirm green baseline and inventory unfinished stub/platform routes
2. Finalize shared platform/admin types, mock data, service modules, and barrels
3. Rebuild `/admin` and `/admin/*` on the shared workspace pattern
4. Rebuild `/integrations`, `/api-developer`, `/rule-engine`, `/exports-sharing`, and `/event-monitoring`
5. Replace the remaining top-level stubs at `/accounts-receivable`, `/dashboards`, `/ai`, and `/workflows-automation`
6. Align shell metadata and run final lint, typecheck, and build

### Progress log
- 2026-04-05: Confirmed the validation baseline is green before milestone 11-12 work begins.
- 2026-04-05: Identified remaining top-level `ShellStubRoute` pages and existing `AppShell` admin subpages that still rely on inline page logic.
- 2026-04-05: Started the canonical platform/admin type, mock-data, and service layer for admin governance, integrations, developer tooling, rules, exports, and event monitoring.
