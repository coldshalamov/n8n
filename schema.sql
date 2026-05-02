-- ============================================================
-- Rehab Ops — Database Schema
-- Run this in your Supabase SQL editor (SQL > New query > paste > Run)
-- Idempotent: safe to re-run.
-- ============================================================

create extension if not exists "pgcrypto";

-- Helper: keep updated_at in sync
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----- properties -----
create table if not exists properties (
  id                uuid primary key default gen_random_uuid(),
  address           text not null,
  city              text default 'Miami',
  state             text default 'FL',
  zip               text,
  status            text default 'acquired' check (status in (
                       'acquired','permitting','in_progress','punch_list','listing','sold'
                    )),
  purchase_price    numeric(12,2),
  target_sale_price numeric(12,2),
  actual_sale_price numeric(12,2),
  total_budget      numeric(12,2) default 0,
  total_spent       numeric(12,2) default 0,
  square_feet       integer,
  bedrooms          integer,
  bathrooms         numeric(3,1),
  hero_image_url    text,
  ghl_opportunity_id text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

drop trigger if exists properties_updated_at on properties;
create trigger properties_updated_at
  before update on properties
  for each row execute function set_updated_at();

create index if not exists idx_properties_status on properties(status);

-- ----- contractors -----
create table if not exists contractors (
  id               uuid primary key default gen_random_uuid(),
  company_name     text not null,
  contact_name     text,
  email            text,
  phone            text,
  trade            text,
  license_number   text,
  insurance_expiry date,
  rating           integer default 3 check (rating between 1 and 5),
  ghl_contact_id   text,
  notes            text,
  created_at       timestamptz default now()
);

create index if not exists idx_contractors_trade on contractors(trade);
create index if not exists idx_contractors_email on contractors(email);

-- ----- jobs -----
create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid references properties(id) on delete cascade,
  contractor_id   uuid references contractors(id) on delete set null,
  title           text not null,
  description     text,
  trade           text,
  status          text default 'pending' check (status in (
                    'pending','bid_requested','bid_received','approved',
                    'in_progress','inspection','complete','paid'
                  )),
  estimated_cost  numeric(10,2),
  actual_cost     numeric(10,2),
  start_date      date,
  due_date        date,
  completed_date  date,
  ghl_task_id     text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

drop trigger if exists jobs_updated_at on jobs;
create trigger jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

create index if not exists idx_jobs_property   on jobs(property_id);
create index if not exists idx_jobs_contractor on jobs(contractor_id);
create index if not exists idx_jobs_status     on jobs(status);
create index if not exists idx_jobs_due_date   on jobs(due_date);

-- ----- bids -----
create table if not exists bids (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid references jobs(id)        on delete cascade,
  contractor_id  uuid references contractors(id) on delete cascade,
  amount         numeric(10,2) not null,
  scope_of_work  text,
  estimated_days integer,
  status         text default 'pending' check (status in ('pending','accepted','rejected')),
  document_url   text,
  submitted_at   timestamptz default now()
);

create index if not exists idx_bids_job on bids(job_id);

-- ----- invoices -----
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid references jobs(id)        on delete cascade,
  contractor_id  uuid references contractors(id) on delete cascade,
  amount         numeric(10,2) not null,
  invoice_number text,
  status         text default 'pending' check (status in ('pending','approved','paid','disputed')),
  document_url   text,
  submitted_at   timestamptz default now(),
  paid_at        timestamptz
);

create index if not exists idx_invoices_job    on invoices(job_id);
create index if not exists idx_invoices_status on invoices(status);

-- ----- documents -----
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid references properties(id)  on delete cascade,
  job_id        uuid references jobs(id)        on delete cascade,
  contractor_id uuid references contractors(id) on delete set null,
  type          text not null check (type in (
                  'photo','lien_waiver','permit','contract','invoice','bid','inspection_report','other'
                )),
  filename      text,
  url           text,
  uploaded_by   text,
  notes         text,
  created_at    timestamptz default now()
);

create index if not exists idx_documents_property on documents(property_id);
create index if not exists idx_documents_job      on documents(job_id);

-- ----- budget_items -----
create table if not exists budget_items (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  category    text not null,
  estimated   numeric(10,2) default 0,
  actual      numeric(10,2) default 0,
  notes       text
);

create index if not exists idx_budget_items_property on budget_items(property_id);

-- ----- activity_log -----
create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  job_id      uuid references jobs(id)       on delete cascade,
  actor       text,
  action      text not null,
  details     jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_activity_property on activity_log(property_id);
create index if not exists idx_activity_created  on activity_log(created_at desc);

-- ============================================================
-- Row Level Security
-- Phase 1 model: any signed-in user has full read/write access.
-- We'll narrow this in Phase 2 when contractors get their own role.
-- ============================================================

alter table properties    enable row level security;
alter table contractors   enable row level security;
alter table jobs          enable row level security;
alter table bids          enable row level security;
alter table invoices      enable row level security;
alter table documents     enable row level security;
alter table budget_items  enable row level security;
alter table activity_log  enable row level security;

drop policy if exists "authed access" on properties;
create policy "authed access" on properties for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on contractors;
create policy "authed access" on contractors for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on jobs;
create policy "authed access" on jobs for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on bids;
create policy "authed access" on bids for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on invoices;
create policy "authed access" on invoices for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on documents;
create policy "authed access" on documents for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on budget_items;
create policy "authed access" on budget_items for all to authenticated using (true) with check (true);

drop policy if exists "authed access" on activity_log;
create policy "authed access" on activity_log for all to authenticated using (true) with check (true);
