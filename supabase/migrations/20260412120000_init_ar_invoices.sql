create extension if not exists pgcrypto;

create table if not exists public.entities (
  id text primary key,
  name text not null,
  code text not null unique,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  default_entity_id text references public.entities(id),
  created_at timestamptz not null default now()
);

create table if not exists public.entity_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.profiles(id) on delete cascade,
  entity_id text not null references public.entities(id) on delete cascade,
  role_id text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, entity_id)
);

create table if not exists public.customers (
  id text primary key,
  name text not null,
  code text not null unique,
  email text not null,
  phone text,
  address text,
  billing_address text,
  credit_limit numeric(14, 2) not null default 0,
  payment_terms text not null,
  status text not null check (status in ('active', 'inactive', 'pending', 'hold')),
  balance numeric(14, 2) not null default 0,
  lifetime_revenue numeric(14, 2) not null default 0,
  last_payment_date timestamptz,
  last_payment_amount numeric(14, 2),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  collection_notes text,
  assigned_collector text,
  collection_priority text check (collection_priority in ('low', 'medium', 'high', 'critical'))
);

create table if not exists public.invoices (
  id text primary key,
  number text not null unique,
  customer_id text not null references public.customers(id),
  customer_name text not null,
  date timestamptz not null,
  due_date timestamptz not null,
  amount numeric(14, 2) not null,
  amount_paid numeric(14, 2),
  open_balance numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  status text not null check (status in ('draft', 'sent', 'paid', 'partial', 'overdue', 'voided')),
  collection_status text not null default 'none' check (collection_status in ('none', 'reminder_sent', 'in_collections', 'escalated', 'written_off')),
  description text,
  entity_id text not null references public.entities(id),
  department_id text,
  department_name text,
  billing_address text,
  memo text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  paid_at timestamptz
);

create table if not exists public.invoice_lines (
  id text primary key,
  invoice_id text not null references public.invoices(id) on delete cascade,
  description text not null,
  account_id text not null,
  account_name text not null,
  amount numeric(14, 2) not null,
  quantity numeric(14, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2),
  department_id text,
  department_name text,
  project_id text,
  project_name text,
  class_id text,
  class_name text,
  sort_order integer not null default 0
);

create table if not exists public.receipts (
  id text primary key,
  number text not null unique,
  date timestamptz not null,
  amount numeric(14, 2) not null,
  currency text not null default 'USD',
  method text not null check (method in ('check', 'ach', 'wire', 'credit_card', 'cash')),
  status text not null check (status in ('pending', 'applied', 'unapplied', 'voided')),
  customer_id text not null references public.customers(id),
  customer_name text not null,
  invoice_ids text[] not null default '{}',
  bank_account_id text not null,
  bank_account_name text not null,
  check_number text,
  reference text,
  memo text,
  entity_id text not null references public.entities(id),
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id text primary key,
  number text not null unique,
  type text not null check (type in ('bill', 'invoice', 'journal_entry', 'payment', 'receipt', 'contract', 'report', 'attachment')),
  module text not null check (module in ('ap', 'ar', 'gl', 'cash', 'close', 'reporting', 'contracts')),
  title text not null,
  status text not null check (status in ('draft', 'pending', 'approved', 'posted', 'archived', 'missing')),
  entity_id text not null references public.entities(id),
  related_entity_type text,
  related_entity_id text,
  file_name text,
  file_size_bytes integer,
  mime_type text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index if not exists invoices_entity_id_idx on public.invoices (entity_id);
create index if not exists invoices_customer_id_idx on public.invoices (customer_id);
create index if not exists invoices_due_date_idx on public.invoices (due_date);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoice_lines_invoice_id_idx on public.invoice_lines (invoice_id);
create index if not exists receipts_customer_id_idx on public.receipts (customer_id);
create index if not exists receipts_invoice_ids_idx on public.receipts using gin (invoice_ids);
create index if not exists documents_related_entity_idx on public.documents (related_entity_type, related_entity_id);
