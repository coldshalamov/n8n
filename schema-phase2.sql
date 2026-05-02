-- ============================================================
-- Phase 2 — Contractor portal: role-based access + storage
-- Run AFTER schema.sql (and seed.sql, if you've run it).
-- Idempotent.
-- ============================================================

-- 1. Link contractor records to Supabase auth users
alter table contractors
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_contractors_auth_user
  on contractors(auth_user_id) where auth_user_id is not null;

-- 2. Helper functions used by RLS policies

-- The current contractor's record id, or null if the user is the owner.
create or replace function current_contractor_id() returns uuid
  language sql stable security definer
  set search_path = public, auth
  as $$
    select id from contractors where auth_user_id = auth.uid() limit 1;
  $$;

-- A user is treated as "owner" when there is no contractor row linked to them.
-- (Owners are humans you create directly in Supabase Auth; contractors get
--  linked when they accept their magic-link invite.)
create or replace function is_owner() returns boolean
  language sql stable security definer
  set search_path = public, auth
  as $$
    select not exists (select 1 from contractors where auth_user_id = auth.uid());
  $$;

-- 3. Replace the permissive Phase 1 policies with role-aware ones.

-- properties: owners only
drop policy if exists "authed access" on properties;
drop policy if exists "owner access" on properties;
create policy "owner access" on properties
  for all to authenticated
  using (is_owner()) with check (is_owner());

-- contractors: owners full; contractors can read their own row
drop policy if exists "authed access" on contractors;
drop policy if exists "owner access" on contractors;
drop policy if exists "contractor self" on contractors;
create policy "owner access" on contractors
  for all to authenticated
  using (is_owner()) with check (is_owner());
create policy "contractor self" on contractors
  for select to authenticated
  using (auth_user_id = auth.uid());

-- jobs: owner full; contractor sees own jobs only
drop policy if exists "authed access" on jobs;
drop policy if exists "owner access" on jobs;
drop policy if exists "contractor own jobs" on jobs;
create policy "owner access" on jobs
  for all to authenticated
  using (is_owner()) with check (is_owner());
create policy "contractor own jobs" on jobs
  for select to authenticated
  using (contractor_id = current_contractor_id());

-- bids: owner full; contractor can read+create their own bids
drop policy if exists "authed access" on bids;
drop policy if exists "owner access" on bids;
drop policy if exists "contractor own bids" on bids;
drop policy if exists "contractor submit bids" on bids;
create policy "owner access" on bids
  for all to authenticated
  using (is_owner()) with check (is_owner());
create policy "contractor own bids" on bids
  for select to authenticated
  using (contractor_id = current_contractor_id());
create policy "contractor submit bids" on bids
  for insert to authenticated
  with check (
    contractor_id = current_contractor_id()
    and job_id in (select id from jobs where contractor_id = current_contractor_id())
  );

-- invoices: same as bids
drop policy if exists "authed access" on invoices;
drop policy if exists "owner access" on invoices;
drop policy if exists "contractor own invoices" on invoices;
drop policy if exists "contractor submit invoices" on invoices;
create policy "owner access" on invoices
  for all to authenticated
  using (is_owner()) with check (is_owner());
create policy "contractor own invoices" on invoices
  for select to authenticated
  using (contractor_id = current_contractor_id());
create policy "contractor submit invoices" on invoices
  for insert to authenticated
  with check (
    contractor_id = current_contractor_id()
    and job_id in (select id from jobs where contractor_id = current_contractor_id())
  );

-- documents: owner full; contractor reads their own + linked job docs, can upload
drop policy if exists "authed access" on documents;
drop policy if exists "owner access" on documents;
drop policy if exists "contractor own docs" on documents;
drop policy if exists "contractor upload docs" on documents;
create policy "owner access" on documents
  for all to authenticated
  using (is_owner()) with check (is_owner());
create policy "contractor own docs" on documents
  for select to authenticated
  using (
    contractor_id = current_contractor_id()
    or job_id in (select id from jobs where contractor_id = current_contractor_id())
  );
create policy "contractor upload docs" on documents
  for insert to authenticated
  with check (
    contractor_id = current_contractor_id()
    and (
      job_id is null
      or job_id in (select id from jobs where contractor_id = current_contractor_id())
    )
  );

-- budget_items: owner only
drop policy if exists "authed access" on budget_items;
drop policy if exists "owner access" on budget_items;
create policy "owner access" on budget_items
  for all to authenticated
  using (is_owner()) with check (is_owner());

-- activity_log: owner full; contractor can append on their own jobs (for upload events)
drop policy if exists "authed access" on activity_log;
drop policy if exists "owner access" on activity_log;
drop policy if exists "contractor read own activity" on activity_log;
drop policy if exists "contractor write own activity" on activity_log;
create policy "owner access" on activity_log
  for all to authenticated
  using (is_owner()) with check (is_owner());
create policy "contractor read own activity" on activity_log
  for select to authenticated
  using (
    job_id in (select id from jobs where contractor_id = current_contractor_id())
  );
create policy "contractor write own activity" on activity_log
  for insert to authenticated
  with check (
    job_id in (select id from jobs where contractor_id = current_contractor_id())
  );

-- 4. Storage bucket for documents (photos, lien waivers, bid PDFs, invoices)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Storage policies — anyone authed can upload to their scoped folder.
-- File paths follow the convention: {job_id}/{filename}
drop policy if exists "owner storage all" on storage.objects;
drop policy if exists "contractor storage own jobs" on storage.objects;
drop policy if exists "contractor storage upload" on storage.objects;
drop policy if exists "public storage read" on storage.objects;

create policy "public storage read" on storage.objects
  for select using (bucket_id = 'documents');

create policy "owner storage all" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and is_owner())
  with check (bucket_id = 'documents' and is_owner());

create policy "contractor storage upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and exists (
      select 1
      from jobs
      where jobs.contractor_id = current_contractor_id()
        and jobs.id::text = (storage.foldername(name))[1]
    )
  );

-- 5. Helper view: my_jobs (contractor's perspective)
create or replace view my_jobs with (security_invoker = true) as
  select
    j.*,
    p.address      as property_address,
    p.city         as property_city,
    p.hero_image_url as property_hero
  from jobs j
  left join properties p on p.id = j.property_id
  where j.contractor_id = current_contractor_id();
