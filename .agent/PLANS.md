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

## Active Plan: Milestone 9 Role-Aware Budgets, Fixed Assets, And Contracts/Revenue Workspaces

### Goal
Build Budgets & Forecasting, Fixed Assets, and Contracts / Revenue as role-aware, service-driven top-level workspaces with a green validation baseline.

### Scope
- `app/(workspace)/budgets-forecasting`
- `app/(workspace)/fixed-assets`
- `app/(workspace)/contracts-revenue`
- `components/layout`
- `components/finance`
- `components/reports`
- `lib/types`
- `lib/mock-data`
- `lib/services`
- `lib/mock-data/shell.ts`
- `lib/services/index.ts`
- `lib/mock-data/identity.ts`

### Files and architecture
- Repair the current baseline first so `lint`, `tsc --noEmit`, and `build` are real gates again
- Replace the three current stub routes with rich, top-level operator workspaces that inherit the shared `(workspace)` shell
- Reuse shared toolbar, summary strip, sticky filters, dense tables, right-side drawers, saved views, and service-driven mutations
- Add module-specific service adapters for summaries, list results, detail payloads, role-aware actions, and mutations without introducing direct `mock-data` reads in components
- Keep milestone 9 to top-level workspaces only; deeper nested routes are deferred

### Domain types
- Add typed budget/forecast, fixed-asset, and revenue-schedule domain models
- Export any new types through the shared `@/lib/types` barrel

### Mock data and services
- Add structured mock datasets for budget versions, scenarios, submissions, fixed assets, depreciation runs, revenue schedules, performance obligations, and recognition events
- Extend canonical services so the three new workspaces can read summaries, lists, details, and mutations only through `@/lib/services`
- Keep entity, date range, department, project, search, sort, pagination, selection, and saved-view state flowing through services plus local UI state
- Tie budget variance to reporting services, fixed assets to GL/depreciation activity, and contracts/revenue to existing contracts, invoices, journals, and documents

### UX and behavior
- Each rebuilt module is table-first and operator-focused, with shell-driven entity/date changes refreshing every summary, list, and drawer
- Budgets & Forecasting emphasizes variance review, forecast scenarios, and submission readiness
- Fixed Assets emphasizes capitalization, depreciation exceptions, and lifecycle controls
- Contracts / Revenue emphasizes recognition timing, deferred revenue, and schedule exceptions
- Accountant defaults lead with exception-heavy operational views rather than executive summaries
- Mutations keep list and detail state in sync without refresh

### Validation
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- Fix the existing baseline issues before considering the milestone complete

### Milestones
1. Repair baseline validation blockers and restore green lint/typecheck/build
2. Add milestone-9 typed domain models, structured mock datasets, and canonical services
3. Rebuild Budgets & Forecasting as a role-aware top-level workspace and validate
4. Rebuild Fixed Assets as a role-aware top-level workspace and validate
5. Rebuild Contracts / Revenue as a role-aware top-level workspace and validate
6. Run final lint, typecheck, and build

### Progress log
- 2026-04-04: Confirmed the milestone-9 routes are still shell stubs and the current repo baseline remains red due to missing lint tooling and a broken Cash landing page.
- 2026-04-04: Locked milestone 9 to rich top-level workspaces only, with budget access expanded to the Accountant role.
