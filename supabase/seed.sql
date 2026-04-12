insert into public.entities (id, name, code, currency)
values
  ('e1', 'Northstar Holdings', 'NSH', 'USD'),
  ('e2', 'Northstar Manufacturing West', 'NSW', 'USD'),
  ('e3', 'Northstar Europe', 'NSEU', 'EUR'),
  ('e4', 'Northstar Consolidated', 'NSC', 'USD')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name, last_name, default_entity_id)
values
  ('u1', 'ava.mitchell@northstarfinance.com', 'Ava', 'Mitchell', 'e4'),
  ('u4', 'owen.price@northstarfinance.com', 'Owen', 'Price', 'e1'),
  ('u6', 'noah.wells@northstarfinance.com', 'Noah', 'Wells', 'e4')
on conflict (id) do nothing;

insert into public.entity_memberships (profile_id, entity_id, role_id)
values
  ('u1', 'e1', 'accountant'),
  ('u1', 'e2', 'accountant'),
  ('u1', 'e3', 'accountant'),
  ('u1', 'e4', 'accountant'),
  ('u4', 'e1', 'ar_specialist'),
  ('u4', 'e3', 'ar_specialist'),
  ('u6', 'e1', 'admin'),
  ('u6', 'e2', 'admin'),
  ('u6', 'e3', 'admin'),
  ('u6', 'e4', 'admin')
on conflict (profile_id, entity_id) do nothing;

insert into public.customers (
  id,
  name,
  code,
  email,
  phone,
  credit_limit,
  payment_terms,
  status,
  balance,
  lifetime_revenue,
  currency,
  created_at,
  last_payment_date,
  last_payment_amount,
  collection_notes,
  assigned_collector,
  collection_priority
)
values
  ('c-apex', 'Apex Retail Group', 'APEX', 'ap@apexretail.com', '(646) 555-1001', 250000, 'Net 30', 'active', 128000, 1680000, 'USD', '2024-05-10T00:00:00Z', '2026-03-31T00:00:00Z', 128000, null, null, null),
  ('c-luma', 'Luma Health Systems', 'LUMA', 'payments@lumahealth.com', '(404) 555-3390', 350000, 'Net 45', 'active', 94000, 2210000, 'USD', '2024-09-02T00:00:00Z', null, null, null, null, null),
  ('c-berger', 'Berger Industrial GmbH', 'BERGER', 'finance@berger-industrial.de', null, 200000, 'Net 30', 'active', 41000, 640000, 'EUR', '2025-01-12T00:00:00Z', null, null, null, null, 'medium'),
  ('c-northwind', 'Northwind Health', 'NORTHWIND', 'ap@northwindhealth.com', '(617) 555-2210', 280000, 'Net 30', 'active', 31000, 480000, 'USD', '2025-07-19T00:00:00Z', null, null, null, null, null),
  ('c-trident', 'Trident Foods', 'TRIDENT', 'billing@tridentfoods.com', '(312) 555-7810', 150000, 'Net 15', 'hold', 76500, 540000, 'USD', '2025-03-05T00:00:00Z', null, null, 'Late payer in Q1 close review', 'Owen Price', 'high')
on conflict (id) do nothing;

insert into public.invoices (
  id,
  number,
  customer_id,
  customer_name,
  date,
  due_date,
  amount,
  amount_paid,
  open_balance,
  currency,
  status,
  collection_status,
  description,
  entity_id,
  department_id,
  department_name,
  created_at,
  sent_at,
  paid_at
)
values
  ('inv-1101', 'INV-1101', 'c-apex', 'Apex Retail Group', '2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', 128000, 128000, 0, 'USD', 'paid', 'none', 'Implementation milestone billing', 'e1', 'd-sales', 'Sales', '2026-03-01T09:00:00Z', '2026-03-01T09:10:00Z', '2026-03-31T09:00:00Z'),
  ('inv-1102', 'INV-1102', 'c-luma', 'Luma Health Systems', '2026-03-17T00:00:00Z', '2026-05-01T00:00:00Z', 94000, null, 94000, 'USD', 'sent', 'none', 'Platform license expansion', 'e1', 'd-sales', 'Sales', '2026-03-17T10:15:00Z', '2026-03-17T10:20:00Z', null),
  ('inv-1103', 'INV-1103', 'c-trident', 'Trident Foods', '2026-03-27T00:00:00Z', '2026-04-11T00:00:00Z', 76500, null, 76500, 'USD', 'overdue', 'in_collections', 'Hardware shipment and setup', 'e1', 'd-sales', 'Sales', '2026-03-27T11:00:00Z', '2026-03-27T11:05:00Z', null),
  ('inv-1104', 'INV-1104', 'c-berger', 'Berger Industrial GmbH', '2026-03-20T00:00:00Z', '2026-04-19T00:00:00Z', 41000, null, 41000, 'EUR', 'sent', 'reminder_sent', 'EU shared service fee', 'e3', 'd-fin', 'Finance', '2026-03-20T08:45:00Z', '2026-03-20T08:50:00Z', null)
on conflict (id) do nothing;

insert into public.invoice_lines (
  id,
  invoice_id,
  description,
  account_id,
  account_name,
  amount,
  quantity,
  unit_price,
  project_id,
  project_name,
  sort_order
)
values
  ('ili-1', 'inv-1101', 'Implementation milestone 3', 'a-service', 'Service Revenue', 128000, 1, 128000, 'p-close', 'Q1 Close Acceleration', 1),
  ('ili-2', 'inv-1102', 'Platform license seats', 'a-sales', 'Product Revenue', 94000, 94, 1000, null, null, 1),
  ('ili-3', 'inv-1103', 'Hardware shipment', 'a-sales', 'Product Revenue', 68000, 68, 1000, null, null, 1),
  ('ili-4', 'inv-1103', 'Setup services', 'a-service', 'Service Revenue', 8500, 17, 500, null, null, 2),
  ('ili-5', 'inv-1104', 'Shared service billing', 'a-service', 'Service Revenue', 41000, 1, 41000, 'p-eu', 'EU Shared Services', 1)
on conflict (id) do nothing;

insert into public.receipts (
  id,
  number,
  date,
  amount,
  currency,
  method,
  status,
  customer_id,
  customer_name,
  invoice_ids,
  bank_account_id,
  bank_account_name,
  reference,
  entity_id,
  created_by,
  created_at
)
values
  ('inv-1101-receipt-1', 'RCT-1101-1', '2026-03-31T09:00:00Z', 128000, 'USD', 'ach', 'applied', 'c-apex', 'Apex Retail Group', array['inv-1101'], 'ba-op', 'Northstar Operating', 'PAY-INV-1101-1', 'e1', 'system', '2026-03-31T09:00:00Z')
on conflict (id) do nothing;

insert into public.documents (
  id,
  number,
  type,
  module,
  title,
  status,
  entity_id,
  related_entity_type,
  related_entity_id,
  file_name,
  file_size_bytes,
  mime_type,
  created_at,
  updated_at,
  version
)
values
  ('doc-inv-1102', 'DOC-1102', 'invoice', 'ar', 'Luma Health invoice package', 'approved', 'e1', 'invoice', 'inv-1102', 'inv-1102.pdf', 201440, 'application/pdf', '2026-03-17T10:15:00Z', '2026-03-17T10:20:00Z', 1),
  ('doc-inv-1103', 'DOC-1103', 'invoice', 'ar', 'Trident invoice support docs', 'pending', 'e1', 'invoice', 'inv-1103', 'inv-1103.pdf', 246210, 'application/pdf', '2026-03-27T11:00:00Z', '2026-03-27T11:05:00Z', 1)
on conflict (id) do nothing;
