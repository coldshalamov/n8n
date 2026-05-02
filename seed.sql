-- ============================================================
-- Seed data — sample portfolio so the dashboard has something to render.
-- Run AFTER schema.sql.  Idempotent: re-running just upserts.
-- ============================================================

-- ----- contractors -----
insert into contractors (id, company_name, contact_name, email, phone, trade, license_number, rating, notes) values
  ('11111111-1111-1111-1111-111111111111', 'Apex Plumbing Solutions',  'Carlos Mendez',   'carlos@apexplumbing.com', '305-555-0142', 'plumbing',   'CFC1432891', 5, 'Reliable, fair pricing, quick response'),
  ('22222222-2222-2222-2222-222222222222', 'Bright Volt Electric',     'Maria Santos',    'maria@brightvolt.com',    '305-555-0188', 'electrical', 'EC13007821', 4, 'Excellent for new builds'),
  ('33333333-3333-3333-3333-333333333333', 'South Beach Roofing Co',   'Jake Morrison',   'jake@sbroofing.com',      '305-555-0234', 'roofing',    'CCC1330156', 5, 'Top tier, hurricane-rated installs'),
  ('44444444-4444-4444-4444-444444444444', 'Coral Painting & Drywall', 'Luis Hernandez',  'luis@coralpaint.com',     '305-555-0301', 'painting',   null,         4, 'Great finish work'),
  ('55555555-5555-5555-5555-555555555555', 'Miami Build General',      'Tom Reilly',      'tom@miamibuild.com',      '305-555-0445', 'general',    'CGC1521889', 4, 'Handles full GC work')
on conflict (id) do update set
  company_name   = excluded.company_name,
  contact_name   = excluded.contact_name,
  email          = excluded.email,
  phone          = excluded.phone,
  trade          = excluded.trade,
  license_number = excluded.license_number,
  rating         = excluded.rating,
  notes          = excluded.notes;

-- ----- properties -----
insert into properties (id, address, city, state, zip, status, purchase_price, target_sale_price, actual_sale_price, total_budget, total_spent, square_feet, bedrooms, bathrooms, hero_image_url, notes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '742 NW 43rd Street',                  'Miami', 'FL', '33127', 'in_progress', 285000, 525000, null,   95000,  47200, 1840, 3, 2.0, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80', 'Little Haiti flip. Kitchen and bathrooms full gut. Roof done.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1455 Brickell Bay Drive Unit 502',    'Miami', 'FL', '33131', 'punch_list',  640000, 925000, null,   80000,  78400, 1320, 2, 2.0, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80',  'Brickell condo refresh. Final walkthrough next week.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '2310 SW 28th Lane',                   'Miami', 'FL', '33133', 'permitting',  420000, 780000, null,  140000,   8500, 2240, 4, 3.0, 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1600&q=80', 'Coconut Grove. Waiting on permits for second-story addition.'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '5821 N Miami Avenue',                 'Miami', 'FL', '33127', 'listing',     195000, 395000, null,   65000,  61300, 1280, 2, 2.0, 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1600&q=80', 'MiMo District. Listed last week, two showings scheduled.'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '988 SW 8th Street',                   'Miami', 'FL', '33130', 'sold',        310000, 555000, 548000, 110000, 102800, 1680, 3, 2.5, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80', 'Closed at $548K. 19% net after costs.'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '4170 SW 22nd Terrace',                'Miami', 'FL', '33145', 'acquired',    365000, 645000, null,  115000,      0, 1980, 3, 2.0, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80', 'Just closed. Walkthrough scheduled.')
on conflict (id) do update set
  address           = excluded.address,
  status            = excluded.status,
  purchase_price    = excluded.purchase_price,
  target_sale_price = excluded.target_sale_price,
  actual_sale_price = excluded.actual_sale_price,
  total_budget      = excluded.total_budget,
  total_spent       = excluded.total_spent,
  square_feet       = excluded.square_feet,
  bedrooms          = excluded.bedrooms,
  bathrooms         = excluded.bathrooms,
  hero_image_url    = excluded.hero_image_url,
  notes             = excluded.notes;

-- ----- jobs (active flip — 742 NW 43rd) -----
insert into jobs (id, property_id, contractor_id, title, description, trade, status, estimated_cost, actual_cost, start_date, due_date, completed_date) values
  ('a0000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Roof tear-off and replacement',           'Full strip and re-shingle, GAF arch',           'roofing',    'paid',          14500, 14200, '2026-04-02', '2026-04-09', '2026-04-08'),
  ('a0000002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Kitchen plumbing rough-in',               'Reroute to new island, replace hot lines',      'plumbing',   'complete',       8200,  7800, '2026-04-12', '2026-04-19', '2026-04-18'),
  ('a0000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Electrical panel upgrade + kitchen rewire','100A → 200A panel, all kitchen circuits',      'electrical', 'in_progress',   11500,  null, '2026-04-22', '2026-05-08',  null),
  ('a0000004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Interior paint full house',               'SW Pure White walls, satin trim',               'painting',   'approved',       8400,  null, '2026-05-10', '2026-05-17',  null),
  ('a0000005-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  null,                                   'Hardwood flooring install',               'White oak engineered, full house',              'flooring',   'bid_requested', 18000,  null,  null,         '2026-05-22',  null)
on conflict (id) do nothing;

-- ----- jobs (Brickell unit) -----
insert into jobs (id, property_id, contractor_id, title, trade, status, estimated_cost, actual_cost, due_date, completed_date) values
  ('b0000001-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Touchup paint and trim',     'painting', 'complete',  2400, 2400, '2026-04-25', '2026-04-25'),
  ('b0000002-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Replace master shower valve','plumbing', 'inspection',1800, 1800, '2026-04-29',  null)
on conflict (id) do nothing;

-- ----- jobs (Coconut Grove permitting) -----
insert into jobs (id, property_id, contractor_id, title, trade, status, estimated_cost, due_date) values
  ('c0000001-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'Demolition prep',          'general', 'pending',     8500, '2026-05-15'),
  ('c0000002-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc',  null,                                   'Permit submission package','general', 'in_progress',    0, '2026-05-08')
on conflict (id) do nothing;

-- ----- budget_items (active flip) -----
delete from budget_items where property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
insert into budget_items (property_id, category, estimated, actual) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'demolition',   5000,  4800),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'roofing',     15000, 14200),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'plumbing',     9000,  7800),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'electrical',  12000,  8400),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'kitchen',     22000,  6500),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bathrooms',   14000,  4500),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'painting',     8500,     0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'flooring',    18000,     0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'permits',      2500,  1000),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'contingency',  5000,     0);

-- ----- bids on the flooring job -----
delete from bids where job_id = 'a0000005-0000-0000-0000-000000000005';
insert into bids (job_id, contractor_id, amount, scope_of_work, estimated_days, status) values
  ('a0000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 17800, 'White oak engineered, 7" planks, all 1840 sqft',  6, 'pending'),
  ('a0000005-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 19200, 'Same scope, premium underlayment',                5, 'pending');

-- ----- invoices -----
delete from invoices where job_id in ('a0000001-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001');
insert into invoices (job_id, contractor_id, amount, invoice_number, status, paid_at) values
  ('a0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 14200, 'SBR-2026-0184', 'paid',     now() - interval '14 days'),
  ('a0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',  7800, 'APX-1029',      'approved', null),
  ('b0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444',  2400, 'COR-2026-77',   'paid',     now() - interval '6 days');

-- ----- activity log -----
delete from activity_log where property_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);
insert into activity_log (property_id, job_id, actor, action, details, created_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0000001-0000-0000-0000-000000000001', 'system',           'job_completed',     '{"job":"Roof tear-off and replacement"}',  now() - interval '24 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0000002-0000-0000-0000-000000000002', 'Carlos Mendez',    'invoice_submitted', '{"amount":7800}',                          now() - interval '14 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0000003-0000-0000-0000-000000000003', 'Maria Santos',     'status_changed',    '{"to":"in_progress"}',                     now() - interval '10 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0000005-0000-0000-0000-000000000005', 'Tom Reilly',       'bid_submitted',     '{"amount":17800}',                         now() - interval '4 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0000005-0000-0000-0000-000000000005', 'Luis Hernandez',   'bid_submitted',     '{"amount":19200}',                         now() - interval '2 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b0000002-0000-0000-0000-000000000002', 'Carlos Mendez',    'job_completed',     '{"job":"Master shower valve"}',            now() - interval '3 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',  null,                                  'Tom Reilly',       'note_added',        '{"note":"Permit office said 2 weeks turnaround"}', now() - interval '1 day');
