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

## Active Plan: Milestone 7 Accountant Work Queue Module

### Goal
Turn `/work-queue` into a real accountant-first operational workspace with a unified queue table, sticky controls, saved views, bulk actions, and service-driven detail drawers.

### Scope
- `app/(workspace)/work-queue/page.tsx`
- `components/tables`
- `components/workflows`
- `components/layout`
- `lib/types`
- `lib/mock-data`
- `lib/services`
- `lib/services/index.ts`

### Files and architecture
- Replace the `/work-queue` shell stub with a real module page built inside the shared shell and driven by the existing role, entity, and date-range workspace context
- Add a dedicated work queue domain with typed items, detail payloads, section definitions, actions, and queue-local filter state
- Keep one unified queue table surface and switch sections, columns, counts, and actions through service-driven metadata instead of subpages or inline conditionals
- Reuse existing shell and service foundations, but make the work queue its own canonical module instead of leaning on the older `/tasks` and `/approvals` pages

### Domain types
- Add a dedicated `lib/types/work-queue.ts` domain file for queue items, queue detail, queue sections, queue filters, queue actions, queue summaries, and queue table metadata
- Export the new queue types through the shared `@/lib/types` barrel so components can stay decoupled from implementation files

### Mock data and services
- Add `lib/mock-data/work-queue.ts` for dedicated queue records that normalize missing-document issues, import errors, assignment state, and action availability across multiple source modules
- Add `lib/services/work-queue.ts` with canonical queue APIs for sections, list results, detail data, saved views, single-item actions, and bulk actions
- Keep queue services composing existing service-layer data where possible, including approvals, journal entries, close tasks, reconciliation exceptions, transactions, departments, projects, and saved views
- Keep all queue components consuming the service layer only

### UX and behavior
- The queue is table-first and queue-first, with sticky section tabs, sticky filter controls, a sticky table header, right-side detail drawers, and an action bar for selected rows
- Sections include Needs Review, Approvals, Reconciliation Exceptions, Missing Documents, Import Errors, Close Tasks, and Assigned to Me
- Queue-local filters include department, project, status, assignee, search, sort, and pagination; shell filters remain entity and date range
- Mutations update list rows, section counts, selection state, and the open drawer without refresh so the module feels API-backed

### Validation
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- If dependencies are still missing, report the exact missing binary/blocker

### Milestones
1. Update the milestone plan and add the new queue domain types plus dataset/service scaffolding
2. Build the unified queue page, filters, table, bulk action bar, saved views, and detail drawer
3. Wire queue actions and saved views so mutations stay in sync with the open workspace
4. Run static validation and capture blockers

### Progress log
- 2026-04-04: Confirmed `/work-queue` is still a shell stub and the existing generic table primitives do not yet support sticky headers, selection, bulk actions, or queue-local saved views.
- 2026-04-04: Audited the current services and datasets for approvals, close tasks, reconciliations, journal entries, documents, tasks, and notifications to define the unified queue composition.
- 2026-04-04: Chose the unified-table queue design with queue-local department/project filters and operational bulk actions, keeping shell-level filters limited to entity and date range.
- 2026-04-04: Validation is still expected to be blocked by missing local `eslint`, `tsc`, and `next` binaries until dependencies are installed.
