-- ============================================================
-- PDPA Shield - live database monitoring setup
--
-- Run this ONCE in your own Supabase project's SQL editor.
-- It creates five sample tables filled with FAKE Singapore
-- personal data, plus a small helper the monitor uses to list
-- tables and columns using a read-only key.
--
-- SAFE TO RE-RUN: existing sample tables are refilled, not
-- duplicated.
--
-- PLEASE READ THE NOTES AT THE BOTTOM BEFORE ADDING REAL DATA.
-- ============================================================

-- ---------- 1. Sample tables (fake data) ----------

create table if not exists public.clients (
  id bigint generated always as identity primary key,
  client_name text not null,
  contact_email text,
  contact_phone text,
  nric text,
  home_address text,
  date_of_birth date,
  company_name text,
  engagement text,
  fee_sgd numeric
);

create table if not exists public.client_contacts (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text,
  mobile text,
  department text,
  is_primary boolean default true
);

create table if not exists public.payroll (
  id bigint generated always as identity primary key,
  employee_name text not null,
  nric text,
  salary_sgd numeric,
  bank_account text,
  bank_name text,
  pay_month text
);

create table if not exists public.invoices (
  id bigint generated always as identity primary key,
  invoice_no text not null,
  client_id bigint,
  issued_on date,
  amount_sgd numeric,
  gst_sgd numeric,
  status text
);

create table if not exists public.engagements (
  id bigint generated always as identity primary key,
  client_id bigint,
  partner_name text,
  engagement_type text,
  start_date date,
  hours numeric
);

create table if not exists public.firm_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- ---------- 2. Refill with fake sample rows ----------

truncate table public.clients restart identity;
truncate table public.client_contacts restart identity;
truncate table public.payroll restart identity;
truncate table public.invoices restart identity;
truncate table public.engagements restart identity;

insert into public.clients
  (client_name, contact_email, contact_phone, nric, home_address, date_of_birth, company_name, engagement, fee_sgd) values
  ('Tan Wei Ming', 'weiming.tan@example.sg', '+65 9123 4567', 'S1234567D', 'Blk 123 Bedok North Ave 3 #05-12 S460123', '1985-03-14', 'Lion City Traders Pte Ltd', 'Annual audit', 8500),
  ('Priya Raman', 'priya.r@example.com', '8234 5678', 'T0123456G', '45 Tampines St 21 S529393', '1990-07-02', 'Marina Bay Florist', 'Tax filing', 1200),
  ('Ahmad bin Ismail', 'ahmad.ismail@example.sg', '9876 5432', 'S8765432A', 'Blk 9 Jalan Bukit Merah #12-01 S150009', '1978-11-23', 'Kampong Glam Cafe', 'Bookkeeping', 2400),
  ('Chloe Lim', '', '6345 1122', 'F1234567N', '22 Holland Grove Rd S278801', '1995-01-30', 'Orchard Design Studio', 'GST registration', 650),
  ('Rajesh Kumar', 'rajesh.k@example.net', '+65 8111 2233', 'G7654321M', 'Blk 301 Jurong East St 32 #08-44 S600301', '1982-06-18', 'Jurong Logistics', 'Annual audit', 12000),
  ('Lee Hui Min', 'huimin.lee@example.sg', '', 'S2345678B', '10 Tiong Bahru Rd S168732', '1988-09-09', 'Tiong Bahru Bakery', 'Payroll', 1800),
  ('Nur Aisyah', 'nur.aisyah@example.com', '9001 2345', 'T1122334C', 'Blk 88 Bedok Reservoir Rd S470088', '1993-12-05', 'Bedok Tuition Centre', 'Tax filing', null),
  ('Marcus Ong', 'marcus.ong@example.sg', '8899 7766', 'S3456789Z', '5 Clarke Quay Ln S179024', '1980-04-27', 'Clarke Quay Events', 'Bookkeeping', 3200),
  ('Devi Nair', 'devi.nair@example.sg', '9777 8899', 'S9988776E', '30 Woodlands Cir S738056', '1987-02-11', 'Woodlands Hardware', 'GST registration', 780),
  ('Kent Chua', 'kent.chua@example.com', '6222 3344', 'S1122334F', '88 Toa Payoh Lor 5 S319384', '1969-08-30', 'Toa Payoh Clinic', 'Annual audit', 9800),
  ('Siti Zaleha', 'siti.zaleha@example.sg', '8456 1122', 'T2233445G', '12 Pasir Ris Dr 1 S519522', '1991-05-19', 'Pasir Ris Cafe', 'Bookkeeping', 1500),
  ('Wong Kar Wai', 'kw.wong@example.net', '9333 4455', 'S4455667H', '7 Yio Chu Kang Rd S545695', '1975-12-02', 'Yio Chu Kang Studio', 'Tax filing', 2100);

insert into public.client_contacts
  (full_name, email, mobile, department, is_primary) values
  ('Alvin Teo', 'alvin.teo@example.sg', '9111 2233', 'Finance', true),
  ('Mei Ling Goh', 'meiling.goh@example.com', '8222 3344', 'HR', true),
  ('Hafiz Rahman', 'hafiz.rahman@example.sg', '9555 6677', 'Operations', false),
  ('Janice Ng', 'janice.ng@example.net', '6333 4455', 'Finance', true),
  ('Suresh Pillai', 'suresh.p@example.sg', '9888 1122', 'IT', false),
  ('Farah Lee', 'farah.lee@example.com', '8777 9900', 'Admin', true),
  ('Daniel Tan', 'daniel.tan@example.sg', '9000 1234', 'Finance', false),
  ('Grace Sim', 'grace.sim@example.net', '6111 7788', 'Marketing', true);

insert into public.payroll
  (employee_name, nric, salary_sgd, bank_account, bank_name, pay_month) values
  ('Ong Bee Lian', 'S5566778J', 4200, '012-345678-9', 'DBS', '2026-09'),
  ('Kumar Sivalingam', 'S6677889K', 3850, '023-456789-0', 'OCBC', '2026-09'),
  ('Tan Jia Hui', 'S7788990L', 5100, '034-567890-1', 'UOB', '2026-09'),
  ('Ismail Hassan', 'T8899001M', 2900, '045-678901-2', 'DBS', '2026-09'),
  ('Lim Ai Peng', 'S9900112N', 6400, '056-789012-3', 'Maybank', '2026-09'),
  ('Ravi Chandran', 'S1011122P', 3300, '067-890123-4', 'HSBC', '2026-09');

insert into public.invoices
  (invoice_no, client_id, issued_on, amount_sgd, gst_sgd, status) values
  ('INV-2026-001', 1, '2026-01-15', 8500, 765, 'Paid'),
  ('INV-2026-002', 2, '2026-01-22', 1200, 108, 'Paid'),
  ('INV-2026-003', 3, '2026-02-03', 2400, 216, 'Paid'),
  ('INV-2026-004', 4, '2026-02-14', 650, 58.5, 'Overdue'),
  ('INV-2026-005', 5, '2026-03-01', 12000, 1080, 'Paid'),
  ('INV-2026-006', 6, '2026-03-18', 1800, 162, 'Pending'),
  ('INV-2026-007', 7, '2026-04-05', 2100, 189, 'Paid'),
  ('INV-2026-008', 8, '2026-04-21', 3200, 288, 'Paid'),
  ('INV-2026-009', 9, '2026-05-09', 780, 70.2, 'Overdue'),
  ('INV-2026-010', 10, '2026-05-27', 9800, 882, 'Paid');

insert into public.engagements
  (client_id, partner_name, engagement_type, start_date, hours) values
  (1, 'Josephine Yeoh', 'Annual audit', '2026-01-05', 120),
  (2, 'Josephine Yeoh', 'Tax filing', '2026-01-12', 18),
  (3, 'Marcus Ho', 'Bookkeeping', '2026-02-01', 40),
  (4, 'Marcus Ho', 'GST registration', '2026-02-10', 12),
  (5, 'Josephine Yeoh', 'Annual audit', '2026-03-02', 160),
  (6, 'Alan Goh', 'Payroll', '2026-03-15', 24),
  (7, 'Alan Goh', 'Tax filing', '2026-04-01', 16),
  (8, 'Marcus Ho', 'Bookkeeping', '2026-04-18', 36);

insert into public.firm_settings (key, value) values
  ('firm_name', 'Demo Firm LLP'),
  ('gst_registered', 'true'),
  ('retention_months', '60'),
  ('default_currency', 'SGD')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ---------- 3. Let the monitor read them ----------
-- The monitor connects with a read-only key. For that key to see a table,
-- the table needs a read policy that allows the anonymous (key-only) role.

do $$
declare t text;
begin
  foreach t in array array['clients','client_contacts','payroll','invoices','engagements','firm_settings']
  loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists pdpa_shield_read on public.%I', t);
    execute format('create policy pdpa_shield_read on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- ---------- 4. Table-listing helper ----------
-- A read-only key cannot list tables by itself, so this helper returns the
-- table names and column names/types. It returns metadata only - never rows.

create or replace function public.pdpa_monitor_inventory()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'tables', coalesce(jsonb_agg(jsonb_build_object(
        'table', c.relname,
        'columns', coalesce((
            select jsonb_agg(jsonb_build_object(
                       'name', a.attname,
                       'type', format_type(a.atttypid, a.atttypmod)
                     ) order by a.attnum)
            from pg_attribute a
            where a.attrelid = c.oid
              and a.attnum > 0
              and not a.attisdropped
          ), '[]'::jsonb)
      ) order by c.relname), '[]'::jsonb)
  )
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'v', 'm', 'p')
    and c.relname <> 'pdpa_monitor_inventory';
$$;

grant execute on function public.pdpa_monitor_inventory() to anon, authenticated;

-- ============================================================
-- NOTES
--
-- 1. Everything above is FAKE data for demonstration. The names, IDs,
--    phone numbers, addresses and bank accounts are invented.
--
-- 2. The read policy lets anyone holding your project URL plus the
--    read-only key see these tables. That is fine for sample data.
--    Before you put real client data here, either:
--      - create a read-only key limited to only the tables you monitor, and
--        keep it private, and
--      - replace the "using (true)" policy with one that checks a condition
--        you choose (for example a role or an allowed IP range).
--
-- 3. To stop monitoring a table, drop its read policy:
--      drop policy pdpa_shield_read on public.payroll;
--
-- 4. To undo this setup completely:
--      drop function public.pdpa_monitor_inventory();
--      drop table public.clients, public.client_contacts, public.payroll,
--               public.invoices, public.engagements, public.firm_settings;
-- ============================================================
