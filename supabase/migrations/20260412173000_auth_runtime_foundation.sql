create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

insert into public.organizations (id, name, slug, status)
values
  ('org-northstar', 'Northstar Holdings', 'northstar', 'active'),
  ('org-admin', 'Platform Administration', 'admin', 'active')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    status = excluded.status;

alter table public.entities
  add column if not exists organization_id text references public.organizations(id),
  add column if not exists type text not null default 'primary' check (type in ('primary', 'subsidiary', 'consolidated')),
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive')),
  add column if not exists parent_entity_id text references public.entities(id),
  add column if not exists country text,
  add column if not exists timezone text;

update public.entities
set organization_id = coalesce(organization_id, 'org-northstar');

alter table public.profiles
  add column if not exists organization_id text references public.organizations(id),
  add column if not exists auth_user_id uuid,
  add column if not exists auth_email text,
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists title text,
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  add column if not exists role_id text,
  add column if not exists avatar_url text,
  add column if not exists last_login_at timestamptz,
  add column if not exists is_global_admin boolean not null default false;

update public.profiles
set organization_id = coalesce(organization_id, 'org-northstar'),
    auth_email = coalesce(auth_email, email),
    username = coalesce(username, split_part(email, '@', 1)),
    display_name = coalesce(display_name, trim(first_name || ' ' || last_name))
where organization_id is null
   or auth_email is null
   or username is null
   or display_name is null;

create unique index if not exists profiles_auth_user_id_idx on public.profiles (auth_user_id) where auth_user_id is not null;
create unique index if not exists profiles_auth_email_idx on public.profiles (auth_email) where auth_email is not null;
create unique index if not exists profiles_org_username_idx on public.profiles (organization_id, username) where organization_id is not null and username is not null;

alter table public.entity_memberships
  add column if not exists organization_id text references public.organizations(id);

update public.entity_memberships memberships
set organization_id = coalesce(
  memberships.organization_id,
  (select profiles.organization_id from public.profiles where profiles.id = memberships.profile_id)
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.profiles(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  role_id text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, organization_id)
);

insert into public.organization_memberships (profile_id, organization_id, role_id)
select distinct
  profiles.id,
  coalesce(profiles.organization_id, 'org-northstar'),
  coalesce(profiles.role_id, memberships.role_id, 'accountant')
from public.profiles profiles
left join public.entity_memberships memberships on memberships.profile_id = profiles.id
on conflict (profile_id, organization_id) do nothing;

create table if not exists public.roles (
  id text primary key,
  name text not null,
  description text not null,
  landing_route text not null default '/',
  accent_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles(id) on delete cascade,
  permission_id text not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

insert into public.roles (id, name, description, landing_route, accent_label)
values
  ('accountant', 'Accountant', 'Daily operator focused on close, reconciliations, and exceptions.', '/', 'Close'),
  ('ap_specialist', 'AP Specialist', 'Manages vendor onboarding, bills, approvals, and disbursements.', '/', 'Payables'),
  ('ar_specialist', 'AR Specialist', 'Owns invoicing, collections, receipts, and customer balances.', '/', 'Receivables'),
  ('controller', 'Controller', 'Oversees close, controls, consolidations, and reporting accuracy.', '/', 'Controls'),
  ('cfo', 'CFO', 'Reviews performance, trends, consolidation, and forecast readiness.', '/', 'Performance'),
  ('admin', 'Admin', 'Administers users, workflows, integrations, and system settings.', '/', 'Platform'),
  ('viewer', 'Viewer', 'Read-only finance workspace access.', '/', 'View')
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    landing_route = excluded.landing_route,
    accent_label = excluded.accent_label;

insert into public.permissions (id, label)
values
  ('dashboard.view', 'View dashboards'),
  ('transactions.view', 'View transactions'),
  ('transactions.export', 'Export transactions'),
  ('bills.view', 'View bills'),
  ('bills.manage', 'Manage bills'),
  ('invoices.view', 'View invoices'),
  ('invoices.manage', 'Manage invoices'),
  ('journal_entries.view', 'View journal entries'),
  ('journal_entries.manage', 'Manage journal entries'),
  ('chart_of_accounts.view', 'View chart of accounts'),
  ('chart_of_accounts.manage', 'Manage chart of accounts'),
  ('close.view', 'View close workspace'),
  ('close.manage', 'Manage close workspace'),
  ('reconciliation.view', 'View reconciliations'),
  ('reconciliation.manage', 'Manage reconciliations'),
  ('reports.view', 'View reports'),
  ('reports.build', 'Build reports'),
  ('saved_views.manage', 'Manage saved views'),
  ('search.global', 'Use global search'),
  ('admin.manage', 'Manage administration'),
  ('integrations.manage', 'Manage integrations'),
  ('api.manage', 'Manage developer platform')
on conflict (id) do update
set label = excluded.label;

insert into public.role_permissions (role_id, permission_id)
values
  ('accountant', 'dashboard.view'),
  ('accountant', 'transactions.view'),
  ('accountant', 'journal_entries.view'),
  ('accountant', 'journal_entries.manage'),
  ('accountant', 'chart_of_accounts.view'),
  ('accountant', 'close.view'),
  ('accountant', 'close.manage'),
  ('accountant', 'reconciliation.view'),
  ('accountant', 'reconciliation.manage'),
  ('accountant', 'reports.view'),
  ('accountant', 'saved_views.manage'),
  ('accountant', 'search.global'),
  ('ap_specialist', 'dashboard.view'),
  ('ap_specialist', 'bills.view'),
  ('ap_specialist', 'bills.manage'),
  ('ap_specialist', 'transactions.view'),
  ('ap_specialist', 'saved_views.manage'),
  ('ap_specialist', 'reports.view'),
  ('ap_specialist', 'search.global'),
  ('ar_specialist', 'dashboard.view'),
  ('ar_specialist', 'invoices.view'),
  ('ar_specialist', 'invoices.manage'),
  ('ar_specialist', 'transactions.view'),
  ('ar_specialist', 'saved_views.manage'),
  ('ar_specialist', 'reports.view'),
  ('ar_specialist', 'search.global'),
  ('controller', 'dashboard.view'),
  ('controller', 'transactions.view'),
  ('controller', 'transactions.export'),
  ('controller', 'bills.view'),
  ('controller', 'invoices.view'),
  ('controller', 'journal_entries.view'),
  ('controller', 'journal_entries.manage'),
  ('controller', 'chart_of_accounts.view'),
  ('controller', 'chart_of_accounts.manage'),
  ('controller', 'close.view'),
  ('controller', 'close.manage'),
  ('controller', 'reconciliation.view'),
  ('controller', 'reports.view'),
  ('controller', 'reports.build'),
  ('controller', 'saved_views.manage'),
  ('controller', 'search.global'),
  ('cfo', 'dashboard.view'),
  ('cfo', 'transactions.view'),
  ('cfo', 'transactions.export'),
  ('cfo', 'reports.view'),
  ('cfo', 'reports.build'),
  ('cfo', 'saved_views.manage'),
  ('cfo', 'search.global'),
  ('admin', 'dashboard.view'),
  ('admin', 'transactions.view'),
  ('admin', 'bills.view'),
  ('admin', 'invoices.view'),
  ('admin', 'journal_entries.view'),
  ('admin', 'chart_of_accounts.manage'),
  ('admin', 'close.manage'),
  ('admin', 'reports.build'),
  ('admin', 'saved_views.manage'),
  ('admin', 'search.global'),
  ('admin', 'admin.manage'),
  ('admin', 'integrations.manage'),
  ('admin', 'api.manage'),
  ('viewer', 'dashboard.view'),
  ('viewer', 'reports.view'),
  ('viewer', 'search.global')
on conflict (role_id, permission_id) do nothing;

create table if not exists public.user_preferences (
  profile_id text primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  default_entity_id text references public.entities(id),
  default_date_range text not null default 'this_month',
  sidebar_collapsed boolean not null default false,
  notifications jsonb not null default '{"email":true,"push":true,"approvals":true,"tasks":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_views (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  module text not null,
  name text not null,
  filters jsonb not null,
  columns jsonb,
  sort_by text,
  sort_direction text check (sort_direction in ('asc', 'desc')),
  is_default boolean not null default false,
  role_scope text,
  created_by text not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists saved_views_profile_module_idx on public.saved_views (profile_id, module);

create table if not exists public.notifications (
  id text primary key,
  profile_id text references public.profiles(id) on delete cascade,
  organization_id text references public.organizations(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  category text,
  read boolean not null default false,
  link text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_profile_read_idx on public.notifications (profile_id, read, created_at desc);

create table if not exists public.audit_logs (
  id text primary key,
  organization_id text references public.organizations(id) on delete cascade,
  actor_profile_id text references public.profiles(id) on delete set null,
  target_profile_id text references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  entity_number text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id text primary key,
  organization_id text references public.organizations(id) on delete cascade,
  profile_id text references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  description text,
  related_type text,
  related_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.runtime_datasets (
  domain text primary key,
  payload jsonb not null,
  checksum text,
  updated_at timestamptz not null default now()
);

alter table public.customers add column if not exists organization_id text references public.organizations(id);
alter table public.invoices add column if not exists organization_id text references public.organizations(id);
alter table public.receipts add column if not exists organization_id text references public.organizations(id);
alter table public.documents add column if not exists organization_id text references public.organizations(id);

update public.customers set organization_id = coalesce(organization_id, 'org-northstar');
update public.invoices set organization_id = coalesce(organization_id, 'org-northstar');
update public.receipts set organization_id = coalesce(organization_id, 'org-northstar');
update public.documents set organization_id = coalesce(organization_id, 'org-northstar');

create or replace function public.current_profile_id()
returns text
language sql
stable
as $$
  select profiles.id
  from public.profiles
  where profiles.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_profile_is_global_admin()
returns boolean
language sql
stable
as $$
  select coalesce((
    select profiles.is_global_admin
    from public.profiles
    where profiles.auth_user_id = auth.uid()
    limit 1
  ), false)
$$;

create or replace function public.can_access_organization(target_organization_id text)
returns boolean
language sql
stable
as $$
  select
    public.current_profile_is_global_admin()
    or exists (
      select 1
      from public.organization_memberships memberships
      where memberships.profile_id = public.current_profile_id()
        and memberships.organization_id = target_organization_id
    )
$$;

create or replace function public.can_access_entity(target_entity_id text)
returns boolean
language sql
stable
as $$
  select
    public.current_profile_is_global_admin()
    or exists (
      select 1
      from public.entity_memberships memberships
      where memberships.profile_id = public.current_profile_id()
        and memberships.entity_id = target_entity_id
    )
$$;

alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.entity_memberships enable row level security;
alter table public.user_preferences enable row level security;
alter table public.saved_views enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.activity_events enable row level security;
alter table public.runtime_datasets enable row level security;
alter table public.organizations enable row level security;
alter table public.entities enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.receipts enable row level security;
alter table public.documents enable row level security;

drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy on public.profiles
for select
using (id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists org_memberships_select_policy on public.organization_memberships;
create policy org_memberships_select_policy on public.organization_memberships
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists entity_memberships_select_policy on public.entity_memberships;
create policy entity_memberships_select_policy on public.entity_memberships
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists user_preferences_select_policy on public.user_preferences;
create policy user_preferences_select_policy on public.user_preferences
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists user_preferences_update_policy on public.user_preferences;
create policy user_preferences_update_policy on public.user_preferences
for update
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin())
with check (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists saved_views_select_policy on public.saved_views;
create policy saved_views_select_policy on public.saved_views
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists saved_views_modify_policy on public.saved_views;
create policy saved_views_modify_policy on public.saved_views
for all
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin())
with check (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists notifications_select_policy on public.notifications;
create policy notifications_select_policy on public.notifications
for select
using (
  public.current_profile_is_global_admin()
  or profile_id = public.current_profile_id()
  or (profile_id is null and public.can_access_organization(organization_id))
);

drop policy if exists notifications_update_policy on public.notifications;
create policy notifications_update_policy on public.notifications
for update
using (
  public.current_profile_is_global_admin()
  or profile_id = public.current_profile_id()
)
with check (
  public.current_profile_is_global_admin()
  or profile_id = public.current_profile_id()
);

drop policy if exists audit_logs_select_policy on public.audit_logs;
create policy audit_logs_select_policy on public.audit_logs
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(organization_id));

drop policy if exists activity_events_select_policy on public.activity_events;
create policy activity_events_select_policy on public.activity_events
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(organization_id));

drop policy if exists runtime_datasets_select_policy on public.runtime_datasets;
create policy runtime_datasets_select_policy on public.runtime_datasets
for select
using (auth.uid() is not null);

drop policy if exists organizations_select_policy on public.organizations;
create policy organizations_select_policy on public.organizations
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(id));

drop policy if exists entities_select_policy on public.entities;
create policy entities_select_policy on public.entities
for select
using (public.current_profile_is_global_admin() or public.can_access_entity(id));

drop policy if exists customers_select_policy on public.customers;
create policy customers_select_policy on public.customers
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(organization_id));

drop policy if exists invoices_select_policy on public.invoices;
create policy invoices_select_policy on public.invoices
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(organization_id));

drop policy if exists receipts_select_policy on public.receipts;
create policy receipts_select_policy on public.receipts
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(organization_id));

drop policy if exists documents_select_policy on public.documents;
create policy documents_select_policy on public.documents
for select
using (public.current_profile_is_global_admin() or public.can_access_organization(organization_id));
