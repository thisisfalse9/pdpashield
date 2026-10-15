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
  ('Chloe Lim', '', '6345 1122', 'F1234567N', '22 Holland Grove Rd S278801', '1995-01-30', 'Orchard Design Studio', 'GST registration', 650);

insert into public.client_contacts
  (full_name, email, mobile, department, is_primary) values
  ('Alvin Teo', 'alvin.teo@example.sg', '9111 2233', 'Finance', true),
  ('Mei Ling Goh', 'meiling.goh@example.com', '8222 3344', 'HR', true),
  ('Hafiz Rahman', 'hafiz.rahman@example.sg', '9555 6677', 'Operations', false);

insert into public.payroll
  (employee_name, nric, salary_sgd, bank_account, bank_name, pay_month) values
  ('Ong Bee Lian', 'S5566778J', 4200, '012-345678-9', 'DBS', '2026-09'),
  ('Kumar Sivalingam', 'S6677889K', 3850, '023-456789-0', 'OCBC', '2026-09'),
  ('Tan Jia Hui', 'S7788990L', 5100, '034-567890-1', 'UOB', '2026-09');

insert into public.invoices (invoice_no, client_id, issued_on, amount_sgd, gst_sgd, status) values
  ('INV-2026-001', 1, '2026-01-15', 8500, 765, 'Paid'),
  ('INV-2026-002', 2, '2026-01-22', 1200, 108, 'Overdue');

insert into public.engagements (client_id, partner_name, engagement_type, start_date, hours) values
  (1, 'Josephine Yeoh', 'Annual audit', '2026-01-05', 120),
  (2, 'Marcus Ho', 'Tax filing', '2026-01-12', 18);

insert into public.firm_settings (key, value) values
  ('firm_name', 'Demo Firm LLP'),
  ('gst_registered', 'true')
on conflict (key) do update set value = excluded.value, updated_at = now();

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

GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.client_contacts TO service_role;
GRANT ALL ON public.payroll TO service_role;
GRANT ALL ON public.invoices TO service_role;
GRANT ALL ON public.engagements TO service_role;
GRANT ALL ON public.firm_settings TO service_role;

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