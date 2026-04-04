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

## Active Plan: Milestone 8 Service-Driven GL, AP, AR, And Cash Workspaces

### Goal
Rebuild General Ledger, Accounts Payable, Accounts Receivable, and Cash Management as shared-shell, service-driven operator workspaces with green validation.

### Scope
- `app/(workspace)/general-ledger`
- `app/(workspace)/accounts-payable`
- `app/(workspace)/accounts-receivable`
- `app/(workspace)/cash-management`
- `components/layout`
- `components/finance`
- `components/general-ledger`
- `components/accounts-payable`
- `components/accounts-receivable`
- `lib/types`
- `lib/mock-data`
- `lib/services`
- `lib/services/index.ts`
- `lib/utils.ts`

### Files and architecture
- Replace the remaining GL/AP/AR/Cash stubs and older page-local implementations with module workspaces that inherit the shared `(workspace)` shell
- Normalize the module surface around shared toolbar, summary strip, sticky filters, dense tables, right-side drawers, saved views, and service-driven mutations
- Add module-specific service adapters for workspace summaries, list results, detail payloads, filter options, and operator actions without introducing direct `mock-data` reads in components
- Keep secondary routes available, but fully rebuild the primary routes in this milestone: GL landing, journal entries, chart of accounts; AP landing, bills, vendors, payments; AR landing, invoices, customers, receipts; Cash landing, accounts, transactions, reconciliation

### Domain types
- Add module workspace response types, detail drawer field types, and table metadata where needed so the UI can stay generic and service-driven
- Export any new types through the shared `@/lib/types` barrel

### Mock data and services
- Extend canonical and compatibility services so GL/AP/AR/Cash pages can read summaries, lists, details, and mutations only through `@/lib/services`
- Keep entity, date range, department, project, search, sort, pagination, selection, and saved-view state flowing through services plus local UI state
- Use existing mock datasets as the source of truth and add missing derived service responses instead of hardcoding business labels in components

### UX and behavior
- Each rebuilt module is table-first and operator-focused, with shell-driven entity/date changes refreshing every summary, list, and drawer
- GL emphasizes journals, review status, and chart-of-accounts maintenance
- AP emphasizes bill review, vendor exposure, payment release readiness, and bulk approval or payment actions
- AR emphasizes invoice follow-up, customer balances, receipt application, and collection visibility
- Cash emphasizes bank accounts, transaction review, and reconciliation exceptions rather than dashboard cards
- Mutations keep list and detail state in sync without refresh

### Validation
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- Fix the existing baseline issues that currently block validation before considering the milestone complete

### Milestones
1. Install dependencies and fix current validation blockers unrelated to the module rebuild
2. Add module service adapters and shared operator-workspace components
3. Rebuild GL primary routes and validate
4. Rebuild AP primary routes and validate
5. Rebuild AR primary routes and validate
6. Rebuild Cash primary routes and validate
7. Run final lint, typecheck, and build

### Progress log
- 2026-04-04: Confirmed dependencies were missing and installed `node_modules` so milestone validation can become a real gate.
- 2026-04-04: Audited GL/AP/AR/Cash routes and confirmed the primary pages still rely on older page-local state and `AppShell`, while top-level GL/AP/AR landing pages remain stubs.
- 2026-04-04: Identified baseline validation blockers outside milestone 8 UI work, including missing lint tooling, missing compatibility exports, and existing build errors in older routes.
