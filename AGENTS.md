# AGENTS.md

This repository is a frontend-only enterprise financial management platform inspired by Sage Intacct, redesigned to be cleaner, role-based, and especially friendly for accountants.

## Product goals
Build a complete frontend that is:
- role-based
- accountant-friendly
- enterprise-grade
- API-ready
- mock-dynamic, never static

Primary roles:
- Accountant
- AP Specialist
- AR Specialist
- Controller
- CFO
- Admin

Accountant workflows are the highest priority.

## Non-negotiable rules
- Do NOT hardcode values directly inside components.
- All charts, tables, filters, KPIs, dashboards, queues, drawers, and detail screens must be driven by structured mock data, service functions, and local state.
- The UI must behave as if real APIs exist.
- The architecture must allow replacing mock services with real APIs later without changing UI components.

## Required structure
- app/
- components/
- components/layout/
- components/navigation/
- components/charts/
- components/tables/
- components/finance/
- components/workflows/
- components/reports/
- components/admin/
- lib/types/
- lib/mock-data/
- lib/services/
- lib/utils/

## Data rules
- All data must come from:
  - lib/mock-data
  - lib/services
  - component state
- Components must consume service-layer functions only.
- Use strict TypeScript types for all domain objects.

## UX rules
Do NOT simplify this into a generic startup dashboard.

Keep the UI:
- dense
- structured
- enterprise-grade
- table-first for operators
- queue-first for accountants
- easy to drill into

Prioritize:
- work queues
- exception handling
- approvals
- reconciliation
- close management
- saved views
- bulk actions
- sticky filters
- sticky table headers
- right-side drawers

## Dynamic behavior rules
The following must work through state + services:
- changing date range updates all widgets on the page
- switching entity updates all relevant data on the page
- filtering by department/project updates charts and tables
- dashboards fully re-render based on filter state
- tables support sorting, filtering, pagination, row selection, and bulk actions
- clicking rows opens dynamically populated drawers
- forms simulate create/update/delete flows
- list and detail views stay in sync after mutations

## Role-based UX
Each role should have a distinct default homepage and navigation emphasis.

Accountant homepage should emphasize:
- tasks due today
- unreconciled transactions
- draft journals
- close progress
- missing documents
- exceptions
- quick actions

CFO homepage should emphasize:
- KPIs
- trends
- forecast
- consolidation
- AI insights

AP, AR, Controller, and Admin should each have tailored homepages and visible actions.

## Validation rules
When implementing a milestone:
1. make the change
2. run the smallest relevant checks
3. fix issues before moving on
4. keep code reusable and typed
5. avoid duplication

## Output style
When reporting progress:
- summarize what changed
- list files touched
- note assumptions
- report validation results