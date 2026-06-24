-- ============================================================================
-- Zalut Admin — esquema base para la sección "Dev app info"
-- Ejecuta esto en tu proyecto de Supabase (SQL Editor o vía MCP/migración).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Perfiles
-- ---------------------------------------------------------------------------
create type public.zalut_role as enum ('customer', 'store_owner', 'admin');

create table public.zalut_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.zalut_role not null default 'customer',
  full_name   text,
  avatar_url  text,
  dev_color   text,            -- color del autor en las vistas de dev (#RRGGBB)
  phone       text,
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.zalut_profiles enable row level security;

-- Cada usuario puede leer/actualizar su propio perfil (el cliente anon usa esto en el DAL).
create policy "perfil propio: select"
  on public.zalut_profiles for select
  using (auth.uid() = id);

create policy "perfil propio: update"
  on public.zalut_profiles for update
  using (auth.uid() = id);

-- Crea el perfil automáticamente al registrarse un usuario.
-- Nombre prefijado (zalut_) porque este proyecto Supabase es compartido con ropero
-- y no debemos pisar su handle_new_user().
create or replace function public.zalut_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.zalut_profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_zalut
  after insert on auth.users
  for each row execute function public.zalut_handle_new_user();

-- Solo debe correr vía trigger, no como RPC pública.
revoke execute on function public.zalut_handle_new_user() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Notas de dev (las "cards" del panel)
-- ---------------------------------------------------------------------------
create table public.zalut_dev_notes (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references auth.users (id) on delete cascade,
  title        text,
  icon         text,                                 -- emoji por página (vista tipo Notion)
  system_key   text,                                 -- marca estable para páginas de sistema (p.ej. 'general')
  blocks       jsonb not null default '[]'::jsonb,   -- bloques: text/link/image/audio/file/todo
                                                      -- cada bloque: { id, group, author, at, kind, ... }
  tags         text[] not null default '{}',
  search_text  text not null default '',
  edits        jsonb not null default '[]'::jsonb,   -- historial: [{ user_id, at }]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index zalut_dev_notes_created_at_idx on public.zalut_dev_notes (created_at desc);
create index zalut_dev_notes_author_idx     on public.zalut_dev_notes (author_id);
create index zalut_dev_notes_tags_idx        on public.zalut_dev_notes using gin (tags);
create index zalut_dev_notes_blocks_idx      on public.zalut_dev_notes using gin (blocks);
create unique index zalut_dev_notes_system_key_uniq
  on public.zalut_dev_notes (system_key) where system_key is not null;

-- La página "General" (system_key='general') es el destino por defecto al crear
-- bloques desde la pestaña "Crear". Sembrar una vez:
--   insert into public.zalut_dev_notes (author_id, title, icon, search_text, system_key)
--   select id, 'General', '🗂️', 'general', 'general' from public.zalut_profiles
--   where role='admin' order by created_at limit 1
--   on conflict (system_key) where system_key is not null do nothing;

-- RLS activado sin policies: toda la lectura/escritura pasa por el service role
-- (server actions / route handlers) que ya verifica rol admin en el código.
alter table public.zalut_dev_notes enable row level security;

-- Mantener updated_at al día (función prefijada para no chocar con ropero).
create or replace function public.zalut_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger zalut_dev_notes_set_updated_at
  before update on public.zalut_dev_notes
  for each row execute function public.zalut_set_updated_at();

create trigger zalut_profiles_set_updated_at
  before update on public.zalut_profiles
  for each row execute function public.zalut_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2b) Información permanente de Zalut (pestaña "Zalut": correos, dominios, cuentas…)
-- ---------------------------------------------------------------------------
create table public.zalut_company_info (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users (id) on delete cascade,
  category    text not null default 'general',  -- email | domain | account | general
  title       text not null,
  subtitle    text,
  fields      jsonb not null default '[]'::jsonb,  -- [{ id, label, value, secret }]
  notes       text,
  sort        integer not null default 0,
  edits       jsonb not null default '[]'::jsonb,  -- [{ user_id, at }]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index zalut_company_info_category_idx on public.zalut_company_info (category, sort, created_at);
create index zalut_company_info_author_idx   on public.zalut_company_info (author_id);

-- RLS activado sin policies: lectura/escritura solo vía service role (server actions admin).
alter table public.zalut_company_info enable row level security;

create trigger zalut_company_info_set_updated_at
  before update on public.zalut_company_info
  for each row execute function public.zalut_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Storage: bucket privado para imágenes / audio / documentos de las notas
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('zalut-dev-media', 'zalut-dev-media', false)
on conflict (id) do nothing;
-- El acceso es vía signed URLs generadas con el service role; no se necesitan policies.

-- ---------------------------------------------------------------------------
-- 4) Para volverte admin (corre esto con tu user_id tras registrarte)
-- ---------------------------------------------------------------------------
-- update public.zalut_profiles set role = 'admin' where id = 'TU-USER-ID';
