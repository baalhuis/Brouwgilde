-- ============================================================
-- BROUWGILDE BREDA — Supabase Database Schema
-- Voer dit uit in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Uitbreiding van auth.users met rol en brouwerijnaam
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  role        text not null default 'brouwer' check (role in ('superuser','admin','brouwer')),
  brewery_name text,
  created_at  timestamptz default now()
);

-- Trigger: maak automatisch een profiel aan bij registratie
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, brewery_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'brewery_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. BEERS ────────────────────────────────────────────────
create table public.beers (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references public.profiles(id) on delete set null,
  naam         text not null,
  categorie    text not null check (categorie in ('A','B','C','D','V')),
  biertype     text not null,
  brouwerij    text not null,
  beschrijving text,
  ebc          numeric,
  ibu          numeric,
  abv          numeric,
  untappd_url  text,
  brewfather_url text,
  created_at   timestamptz default now()
);

-- ── 3. SESSIONS ─────────────────────────────────────────────
create table public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  admin_id            uuid references public.profiles(id) on delete set null,
  naam                text not null,
  type                text not null check (type in ('beerswap','kampioenschap')),
  datum               date not null,
  beschrijving        text,
  closed              boolean default false,
  leaderboard_visible boolean default true,
  edit_locked         boolean default false,
  created_at          timestamptz default now()
);

-- ── 4. SESSION_BEERS ─────────────────────────────────────────
-- Koppeltabel: welke bieren zitten in een sessie
create table public.session_beers (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references public.sessions(id) on delete cascade,
  beer_id      uuid references public.beers(id) on delete cascade,
  identifier   text,                    -- Kampioenschap-ID bv. "ID-AB3C"
  unique(session_id, beer_id)
);

-- ── 5. SESSION_PARTICIPANTS ──────────────────────────────────
create table public.session_participants (
  session_id  uuid references public.sessions(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  joined_at   timestamptz default now(),
  primary key (session_id, user_id)
);

-- ── 6. SESSION_ASSIGNMENTS (kampioenschap) ───────────────────
-- Welke bieren moet een specifieke proever beoordelen
create table public.session_assignments (
  session_id  uuid references public.sessions(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  beer_id     uuid references public.beers(id) on delete cascade,
  primary key (session_id, user_id, beer_id)
);

-- ── 7. TASTING_FORMS ────────────────────────────────────────
create table public.tasting_forms (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references public.sessions(id) on delete cascade,
  beer_id      uuid references public.beers(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  kleur        integer not null check (kleur between 1 and 10),
  koolzuur     integer not null check (koolzuur between 1 and 10),
  geur         integer not null check (geur between 1 and 10),
  smaak        integer not null check (smaak between 1 and 10),
  nasmaak      integer not null check (nasmaak between 1 and 10),
  opmerkingen  text,
  -- Berekende score opgeslagen voor performance
  score        numeric generated always as (
    (kleur * 1.0 + koolzuur * 1.0 + geur * 3.0 + smaak * 3.0 + nasmaak * 2.0) / 10.0
  ) stored,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(session_id, beer_id, user_id)   -- 1 formulier per persoon per bier per sessie
);

-- Trigger: updated_at automatisch bijhouden
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger tasting_forms_updated_at
  before update on public.tasting_forms
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.beers              enable row level security;
alter table public.sessions           enable row level security;
alter table public.session_beers      enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_assignments enable row level security;
alter table public.tasting_forms      enable row level security;

-- Helper: haal de rol van de ingelogde user op
create or replace function public.my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── PROFILES ────────────────────────────────────────────────
create policy "Iedereen kan profielen lezen"
  on public.profiles for select using (true);

create policy "Eigen profiel aanpassen"
  on public.profiles for update using (auth.uid() = id);

create policy "Superuser mag alles"
  on public.profiles for all using (public.my_role() = 'superuser');

-- ── BEERS ────────────────────────────────────────────────────
create policy "Iedereen kan bieren lezen"
  on public.beers for select using (true);

create policy "Ingelogde users mogen bieren toevoegen"
  on public.beers for insert with check (auth.uid() = owner_id);

create policy "Eigenaar mag eigen bier bewerken"
  on public.beers for update using (auth.uid() = owner_id);

create policy "Superuser mag alle bieren bewerken"
  on public.beers for all using (public.my_role() = 'superuser');

-- ── SESSIONS ─────────────────────────────────────────────────
create policy "Iedereen kan sessies lezen"
  on public.sessions for select using (true);

create policy "Admin/superuser mag sessies aanmaken"
  on public.sessions for insert
  with check (public.my_role() in ('admin','superuser'));

create policy "Admin van sessie of superuser mag bewerken"
  on public.sessions for update
  using (auth.uid() = admin_id or public.my_role() = 'superuser');

create policy "Superuser mag sessies verwijderen"
  on public.sessions for delete using (public.my_role() = 'superuser');

-- ── SESSION_BEERS ─────────────────────────────────────────────
create policy "Iedereen kan session_beers lezen"
  on public.session_beers for select using (true);

create policy "Admin of superuser mag session_beers beheren"
  on public.session_beers for all
  using (
    public.my_role() = 'superuser' or
    exists (select 1 from public.sessions s where s.id = session_id and s.admin_id = auth.uid())
  );

-- ── SESSION_PARTICIPANTS ──────────────────────────────────────
create policy "Iedereen kan deelnemers zien"
  on public.session_participants for select using (true);

create policy "Zelf aanmelden"
  on public.session_participants for insert with check (auth.uid() = user_id);

create policy "Zelf afmelden"
  on public.session_participants for delete using (auth.uid() = user_id);

-- ── SESSION_ASSIGNMENTS ───────────────────────────────────────
create policy "Iedereen kan assignments zien"
  on public.session_assignments for select using (true);

create policy "Admin of superuser mag assignments beheren"
  on public.session_assignments for all
  using (
    public.my_role() = 'superuser' or
    exists (select 1 from public.sessions s where s.id = session_id and s.admin_id = auth.uid())
  );

-- ── TASTING_FORMS ─────────────────────────────────────────────
create policy "Eigenaar ziet eigen formulieren altijd"
  on public.tasting_forms for select using (auth.uid() = user_id);

create policy "Admin/superuser ziet alle formulieren"
  on public.tasting_forms for select
  using (public.my_role() in ('admin','superuser'));

create policy "Brouwer ziet formulieren van eigen bieren"
  on public.tasting_forms for select
  using (
    exists (
      select 1 from public.beers b
      where b.id = beer_id and b.owner_id = auth.uid()
    )
  );

create policy "Ingelogde user mag formulier indienen"
  on public.tasting_forms for insert with check (auth.uid() = user_id);

create policy "Eigenaar mag formulier bewerken (als niet vergrendeld)"
  on public.tasting_forms for update
  using (
    auth.uid() = user_id and
    not exists (
      select 1 from public.sessions s
      where s.id = session_id and (s.edit_locked = true or s.closed = true)
    )
  );

create policy "Superuser mag altijd formulieren bewerken"
  on public.tasting_forms for update using (public.my_role() = 'superuser');

create policy "Superuser mag formulieren verwijderen"
  on public.tasting_forms for delete using (public.my_role() = 'superuser');

-- ============================================================
-- HANDIGE VIEWS
-- ============================================================

-- Leaderboard view: gemiddelde score per bier per sessie
create or replace view public.leaderboard as
select
  tf.session_id,
  tf.beer_id,
  b.naam,
  b.brouwerij,
  b.biertype,
  b.categorie,
  round(avg(tf.score), 2) as avg_score,
  count(*) as num_reviews
from public.tasting_forms tf
join public.beers b on b.id = tf.beer_id
group by tf.session_id, tf.beer_id, b.naam, b.brouwerij, b.biertype, b.categorie;

-- ============================================================
-- EERSTE SUPERUSER INSTELLEN
-- ============================================================
-- Na je eerste registratie, voer dit uit met jouw e-mailadres:
--
-- update public.profiles
-- set role = 'superuser'
-- where id = (select id from auth.users where email = 'jouw@email.nl');
--
-- ============================================================
