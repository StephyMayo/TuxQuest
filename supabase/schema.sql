-- =====================================================================
-- TuxQuest · Esquema de base de datos para Supabase (PostgreSQL)
-- Ejecutar en: Supabase > SQL Editor > New query > pegar y Run.
-- Después ejecutar seed.sql para cargar familias, categorías y preguntas.
-- =====================================================================

-- Familias y categorías (RNF-09: el contenido vive en la base de datos)
create table if not exists public.families (
  id text primary key,
  name text not null,
  package_manager text not null,
  sort int not null default 0
);

create table if not exists public.distros (
  id text primary key,
  family_id text not null references public.families(id),
  name text not null,
  sort int not null default 0
);

-- Perfil del jugador (las contraseñas las gestiona Supabase Auth, RNF-04)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 20),
  coins int not null default 20 check (coins >= 0),
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz not null default now()
);

-- Banco de preguntas (RF-07, RF-16)
create table if not exists public.questions (
  id text primary key,
  family_id text references public.families(id),          -- null = común a todas las familias
  distro_id text references public.distros(id),           -- null = toda la familia
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  type text not null check (type in ('write', 'choice', 'complete', 'fix')),
  topic text not null,
  prompt text not null,
  answers text[] not null,
  options text[],
  template text,
  broken text,
  hint text not null default '',
  explanation text not null default '',
  cwd text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists questions_filter_idx on public.questions (difficulty, family_id, distro_id) where active;

-- Progreso de misiones (RF-06)
create table if not exists public.mission_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_key text not null,
  best_correct int not null,
  best_total int not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, mission_key)
);

-- ---------------------------------------------------------------------
-- Crear el perfil automáticamente al registrarse
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Funciones (RPC). Las monedas solo cambian a través de estas funciones.
-- ---------------------------------------------------------------------
create or replace function public.username_taken(p_username text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from profiles where lower(username) = lower(p_username));
$$;

create or replace function public.spend_coins(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare v_coins int;
begin
  if p_amount <= 0 or p_amount > 100 then raise exception 'Cantidad no válida'; end if;
  update profiles set coins = coins - p_amount
   where id = auth.uid() and coins >= p_amount
  returning coins into v_coins;
  if v_coins is null then raise exception 'Monedas insuficientes'; end if;
  return v_coins;
end;
$$;

create or replace function public.finish_mission(p_key text, p_correct int, p_total int, p_coins int)
returns int language plpgsql security definer set search_path = public as $$
declare v_coins int;
begin
  if auth.uid() is null then raise exception 'Sesión no iniciada'; end if;
  if p_total <= 0 or p_total > 20 or p_correct < 0 or p_correct > p_total then raise exception 'Resultado no válido'; end if;
  -- Límite: como máximo 20 monedas por acierto (dificultad difícil)
  if p_coins < 0 or p_coins > p_correct * 20 then raise exception 'Monedas no válidas'; end if;

  insert into mission_progress as mp (user_id, mission_key, best_correct, best_total, completed)
  values (auth.uid(), p_key, p_correct, p_total, p_correct::numeric / p_total >= 0.7)
  on conflict (user_id, mission_key) do update set
    best_correct = case when excluded.best_correct::numeric / excluded.best_total > mp.best_correct::numeric / mp.best_total
                        then excluded.best_correct else mp.best_correct end,
    best_total   = case when excluded.best_correct::numeric / excluded.best_total > mp.best_correct::numeric / mp.best_total
                        then excluded.best_total else mp.best_total end,
    completed    = mp.completed or excluded.completed,
    updated_at   = now();

  update profiles set coins = coins + p_coins where id = auth.uid() returning coins into v_coins;
  return v_coins;
end;
$$;

-- ---------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
-- ---------------------------------------------------------------------
alter table public.families enable row level security;
alter table public.distros enable row level security;
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.mission_progress enable row level security;

drop policy if exists "families_read" on public.families;
create policy "families_read" on public.families for select using (true);

drop policy if exists "distros_read" on public.distros;
create policy "distros_read" on public.distros for select using (true);

drop policy if exists "questions_read" on public.questions;
create policy "questions_read" on public.questions for select using (active);

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "progress_read_own" on public.mission_progress;
create policy "progress_read_own" on public.mission_progress for select using (auth.uid() = user_id);

-- No hay políticas de insert/update para el cliente: monedas y progreso
-- solo se modifican con spend_coins() y finish_mission().
grant usage on schema public to anon, authenticated;
grant select on public.families, public.distros, public.questions to anon, authenticated;
grant select on public.profiles, public.mission_progress to authenticated;
grant execute on function public.username_taken(text) to anon, authenticated;
grant execute on function public.spend_coins(int) to authenticated;
grant execute on function public.finish_mission(text, int, int, int) to authenticated;
