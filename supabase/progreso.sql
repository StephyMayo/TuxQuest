create table if not exists public.family_progress (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  family_id  text not null references public.families(id),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  mode       text not null check (mode in ('mission', 'story')),
  topic      text not null,
  best_correct int not null check (best_correct >= 0),
  best_total   int not null check (best_total > 0),
  completed    boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, family_id, difficulty, mode, topic)
);

create index if not exists family_progress_jugador_idx
  on public.family_progress (user_id, family_id, difficulty);

insert into public.family_progress (user_id, family_id, difficulty, mode, topic, best_correct, best_total, completed, updated_at)
select mp.user_id,
       split_part(mp.mission_key, ':', 1),
       split_part(mp.mission_key, ':', 2),
       'mission',
       split_part(mp.mission_key, ':', 3),
       mp.best_correct,
       greatest(mp.best_total, 1),
       mp.completed,
       mp.updated_at
  from public.mission_progress mp
 where split_part(mp.mission_key, ':', 1) in ('debian', 'arch', 'redhat', 'suse')
   and split_part(mp.mission_key, ':', 2) in ('easy', 'medium', 'hard')
   and split_part(mp.mission_key, ':', 3) <> ''
on conflict (user_id, family_id, difficulty, mode, topic) do nothing;

-- ---------------------------------------------------------------------
-- Guardar una partida terminada, sea misión o capítulo de historia
-- ---------------------------------------------------------------------
drop function if exists public.finish_run(text, text, text, text, int, int, int, text);
drop function if exists public.finish_run(text, text, text, text, int, int, text);

create or replace function public.finish_run(
  p_family text,
  p_difficulty text,
  p_mode text,
  p_topic text,
  p_correct int,
  p_total int,
  p_boost text default null
)
returns int language plpgsql security definer set search_path = public as $fn$
declare
  v_coins int;
  v_payout int;
  v_coins_per_correct int;
  v_used int;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  if p_family not in ('debian', 'arch', 'redhat', 'suse') then raise exception 'Familia no valida'; end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then raise exception 'Dificultad no valida'; end if;
  if p_mode not in ('mission', 'story') then raise exception 'Modo no valido'; end if;
  if coalesce(p_topic, '') = '' then raise exception 'Tema no valido'; end if;
  if p_total <= 0 or p_total > 30 or p_correct < 0 or p_correct > p_total then raise exception 'Resultado no valido'; end if;

  -- El cliente solo informa los aciertos; la tarifa y el pago los decide la base.
  v_coins_per_correct := case
    when p_mode = 'story' then 4
    when p_difficulty = 'easy' then 5
    when p_difficulty = 'medium' then 10
    else 20
  end;
  v_payout := p_correct * v_coins_per_correct;

  insert into family_progress as fp
    (user_id, family_id, difficulty, mode, topic, best_correct, best_total, completed)
  values
    (auth.uid(), p_family, p_difficulty, p_mode, p_topic, p_correct, p_total, p_correct::numeric / p_total >= 0.7)
  on conflict (user_id, family_id, difficulty, mode, topic) do update set

    best_correct = case when excluded.best_correct::numeric / excluded.best_total > fp.best_correct::numeric / fp.best_total
                        then excluded.best_correct else fp.best_correct end,
    best_total   = case when excluded.best_correct::numeric / excluded.best_total > fp.best_correct::numeric / fp.best_total
                        then excluded.best_total else fp.best_total end,
    completed    = fp.completed or excluded.completed,
    updated_at   = now();

  -- El multiplicador se aplica aqui, no en el navegador: solo cuenta si el
  -- jugador tiene de verdad el boost, y se gasta al usarlo.
  if p_boost = 'boost_coins' then
    update inventory set qty = qty - 1, updated_at = now()
     where user_id = auth.uid() and item_id = 'boost_coins' and qty > 0
    returning qty into v_used;
    if v_used is not null then v_payout := v_payout * 2; end if;
  end if;

  update profiles set coins = coins + v_payout where id = auth.uid() returning coins into v_coins;
  return v_coins;
end;
$fn$;

create or replace function public.missions_done()
returns int language sql security definer set search_path = public stable as $fn$
  select count(*)::int from family_progress where user_id = auth.uid() and completed;
$fn$;

drop function if exists public.finish_mission(text, int, int, int, text);
drop function if exists public.finish_mission(text, int, int, int);

alter table public.family_progress enable row level security;

drop policy if exists "family_progress_read_own" on public.family_progress;
create policy "family_progress_read_own" on public.family_progress for select using (auth.uid() = user_id);

grant select on public.family_progress to authenticated;
grant execute on function public.finish_run(text, text, text, text, int, int, text) to authenticated;
