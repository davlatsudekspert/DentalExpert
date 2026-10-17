-- Global discovery: country+city IDs, clinicians, clinics (many-to-many), verified contacts, sponsored campaigns.
-- Not applied to any project yet. Review, then apply to the dedicated Dental Expert Supabase project.

create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name jsonb not null
);

create table public.cities (
  id text primary key,
  country_code text not null references public.countries(code),
  name jsonb not null,
  lat double precision, lng double precision
);

create table public.clinicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  specialty jsonb not null,
  bio jsonb,
  languages text[] not null default '{}',
  photo_url text,
  license_status text not null default 'unverified'
    check (license_status in ('unverified','pending','verified','rejected')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  city_id text not null references public.cities(id),
  address jsonb,
  lat double precision, lng double precision,
  is_demo boolean not null default false
);

create table public.clinician_clinics (
  clinician_id uuid references public.clinicians(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  primary key (clinician_id, clinic_id)
);

create table public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references public.clinicians(id) on delete cascade,
  kind text not null check (kind in ('phone','telegram','instagram','email','map','payment')),
  value text not null,
  verified_at timestamptz,
  active boolean generated always as (verified_at is not null) stored
);

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  clinician_id uuid not null references public.clinicians(id) on delete cascade,
  city_id text not null references public.cities(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_days int not null check (duration_days in (1,3,6,10)),
  payment_state text not null default 'unpaid'
    check (payment_state in ('unpaid','paid','refunded','revoked')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.ad_campaigns (city_id, starts_at, ends_at);

create view public.active_sponsors with (security_invoker = true) as
select c.city_id, c.clinician_id, c.starts_at, c.ends_at
from public.ad_campaigns c
join public.clinicians k on k.id = c.clinician_id
where c.payment_state = 'paid' and now() between c.starts_at and c.ends_at
  and k.license_status = 'verified' and not k.is_demo;

alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.clinicians enable row level security;
alter table public.clinics enable row level security;
alter table public.clinician_clinics enable row level security;
alter table public.contact_channels enable row level security;
alter table public.ad_campaigns enable row level security;

create policy "public read countries" on public.countries for select using (true);
create policy "public read cities" on public.cities for select using (true);
create policy "public read verified clinicians" on public.clinicians for select
  using (license_status = 'verified' or is_demo or user_id = auth.uid());
create policy "owner update clinician" on public.clinicians for update using (user_id = auth.uid());
create policy "public read clinics" on public.clinics for select using (true);
create policy "public read links" on public.clinician_clinics for select using (true);
create policy "public read active contacts" on public.contact_channels for select using (active);
create policy "owner manage contacts" on public.contact_channels for all
  using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
create policy "owner read campaigns" on public.ad_campaigns for select
  using (clinician_id in (select id from public.clinicians where user_id = auth.uid()));
-- ad_campaigns has no insert/update policy: payment_state is written only server-side (service role).
