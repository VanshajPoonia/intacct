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

## Active Plan: Milestone 5 ERP Shell And Navigation System

### Goal
Rebuild the app chrome as a shared, role-aware ERP workspace shell with dense accountant-friendly navigation and service-driven shell configuration.

### Scope
- `app/(workspace)`
- `components/layout`
- `components/navigation`
- `lib/types/ui.ts`
- `lib/mock-data/shell.ts`
- `lib/services/shell.ts`
- minimal route stubs only for missing top-level modules

### Files and architecture
- Move authenticated routes under `app/(workspace)/...` so the shell mounts once without changing public URLs
- Add a client workspace shell provider for active role, entity, date range, sidebar collapse, and command palette state
- Keep `lib/mock-data/shell.ts` as the canonical chrome dataset and `lib/services/shell.ts` as the only shell read surface
- Keep `AppShell` as a compatibility wrapper so existing module pages still render inside the new shared shell during the transition

### Domain types
- Expand `lib/types/ui.ts` with shell module, sidebar, command palette, breadcrumb, stub-page, and shell-context contracts
- Keep route metadata, menu groups, and command actions typed instead of embedding labels or nav structure inside JSX

### Mock data and services
- Add shell datasets for top-module navigation, mega-menu groupings, role-aware sidebar sections, breadcrumb registry, command palette definitions, stub-page metadata, and date presets
- Add shell services for available roles, shell context, top nav, sidebar nav, breadcrumbs, command palette config, and stub pages
- Derive role-aware shell behavior from the existing identity and master-data services rather than duplicating user/entity logic in components

### UX and behavior
- Dense ERP chrome with sticky header, top module nav, collapsible sidebar, breadcrumb row, and command palette trigger
- Role switcher, entity switcher, and date-range switcher live in the header and drive shared shell state
- Mega menus open on click only and close on outside click or `Escape`
- Breadcrumbs derive from typed route metadata, including semantic labels for dynamic detail routes
- Landing and stub routes are lightweight but real pages backed by shell services, not handwritten placeholders

### Validation
- Run `npm run lint`
- Run `npx tsc --noEmit`
- Run `npm run build`
- If dependencies are still missing, report the exact missing binary/blocker

### Milestones
1. Add typed shell contracts and the shell mock-data/service layer
2. Implement the shared workspace provider and shell primitives
3. Refactor header, sidebar, module nav, breadcrumbs, command palette, and compatibility shell wrapper
4. Move authenticated routes under the workspace layout and add shell-level landing/stub pages
5. Run static validation and capture blockers

### Progress log
- 2026-04-04: Audited the current route tree and existing shell components to identify the shared-shell migration path.
- 2026-04-04: Expanded `lib/types/ui.ts` with shell-specific module, sidebar, breadcrumb, command, stub-page, and context types.
- 2026-04-04: Confirmed the migration strategy: keep `/login` outside the shell, move authenticated routes into a route group, and retain `AppShell` as a compatibility wrapper while the module pages catch up.
- 2026-04-04: Added `lib/mock-data/shell.ts` and `lib/services/shell.ts` to make modules, mega menus, sidebar sections, breadcrumbs, command groups, and stub pages service-driven.
- 2026-04-04: Rebuilt the shell chrome around a shared workspace provider and refactored the header, sidebar, module nav, breadcrumbs, command palette, org switcher, and layout primitives to consume shell services.
- 2026-04-04: Moved authenticated routes into `app/(workspace)/...`, replaced `/` with a role-aware workspace landing, and added shell-level landing routes for missing top-level ERP modules.
- 2026-04-04: Validation remains blocked by missing local `eslint`, `tsc`, and `next` binaries because project dependencies are not installed.
