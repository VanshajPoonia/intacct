alter table public.user_preferences
  add column if not exists default_role_id text references public.roles(id);

create table if not exists public.saved_reports (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  type text not null,
  filters jsonb not null default '{}'::jsonb,
  columns jsonb not null default '[]'::jsonb,
  group_by text,
  sort_by text,
  created_by text not null references public.profiles(id) on delete cascade,
  created_by_name text not null,
  is_favorite boolean not null default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists saved_reports_profile_created_idx on public.saved_reports (profile_id, created_at desc);
create index if not exists saved_reports_org_type_idx on public.saved_reports (organization_id, type);

create table if not exists public.report_pins (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  report_id text references public.saved_reports(id) on delete cascade,
  report_key text not null,
  name text not null,
  type text not null,
  href text not null,
  source text not null check (source in ('builtin', 'saved')),
  last_run_at timestamptz,
  is_pinned boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id, report_key)
);

create index if not exists report_pins_profile_created_idx on public.report_pins (profile_id, created_at desc);

create table if not exists public.report_activity (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  report_id text references public.saved_reports(id) on delete cascade,
  report_key text not null,
  name text not null,
  type text not null,
  href text not null,
  activity_type text not null check (activity_type in ('view', 'run', 'pin')),
  actor_name text not null,
  duration_ms integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists report_activity_profile_created_idx on public.report_activity (profile_id, created_at desc);
create index if not exists report_activity_report_created_idx on public.report_activity (report_key, created_at desc);

alter table public.saved_reports enable row level security;
alter table public.report_pins enable row level security;
alter table public.report_activity enable row level security;

drop policy if exists saved_reports_select_policy on public.saved_reports;
create policy saved_reports_select_policy on public.saved_reports
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists saved_reports_modify_policy on public.saved_reports;
create policy saved_reports_modify_policy on public.saved_reports
for all
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin())
with check (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists report_pins_select_policy on public.report_pins;
create policy report_pins_select_policy on public.report_pins
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists report_pins_modify_policy on public.report_pins;
create policy report_pins_modify_policy on public.report_pins
for all
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin())
with check (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists report_activity_select_policy on public.report_activity;
create policy report_activity_select_policy on public.report_activity
for select
using (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());

drop policy if exists report_activity_insert_policy on public.report_activity;
create policy report_activity_insert_policy on public.report_activity
for insert
with check (profile_id = public.current_profile_id() or public.current_profile_is_global_admin());
