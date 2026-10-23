-- =====================================================================
-- TuxQuest · Pasar la base de datos a inglés
-- Ejecutar DESPUÉS de claves.sql, sobre una base que ya tenga datos.
-- Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
--
-- Qué hace:
--   1. Renombra las columnas que estaban en castellano
--   2. Traduce los valores guardados (dificultad, tema, modo, tipo)
--   3. Renombra los identificadores de los objetos de la tienda
--   4. Rehace los check y las funciones que llevaban la lista escrita
--
-- Los textos que ve el jugador -nombres y descripciones de los objetos,
-- enunciados de las preguntas- siguen en castellano: eso es el idioma
-- del producto, no código mezclado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Columnas
-- ---------------------------------------------------------------------
do $mig$
declare
  v_col text;
begin
  foreach v_col in array array['titulo:title', 'marco:frame', 'family:family_id'] loop
    if exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'profiles'
                  and column_name = split_part(v_col, ':', 1)) then
      execute format('alter table public.profiles rename column %I to %I',
                     split_part(v_col, ':', 1), split_part(v_col, ':', 2));
    end if;
  end loop;
end
$mig$;

-- ---------------------------------------------------------------------
-- 2. Valores guardados
--
-- Los check viejos nombran los valores en castellano, así que hay que
-- quitarlos antes de traducir y volver a ponerlos después.
-- ---------------------------------------------------------------------
alter table public.questions       drop constraint if exists questions_difficulty_check;
alter table public.family_progress drop constraint if exists family_progress_difficulty_check;
alter table public.family_progress drop constraint if exists family_progress_mode_check;
alter table public.shop_items      drop constraint if exists shop_items_kind_check;
alter table public.profiles        drop constraint if exists profiles_family_valido;

update public.questions set difficulty = case difficulty
  when 'facil' then 'easy'
  when 'medio' then 'medium'
  when 'dificil' then 'hard'
  else difficulty end;

update public.questions set topic = case topic
  when 'navegacion' then 'navigation'
  when 'archivos' then 'files'
  when 'paquetes' then 'packages'
  when 'permisos' then 'permissions'
  when 'busqueda' then 'search'
  when 'sistema' then 'system'
  when 'procesos' then 'processes'
  when 'servicios' then 'services'
  when 'redes' then 'network'
  else topic end;

update public.family_progress set difficulty = case difficulty
  when 'facil' then 'easy'
  when 'medio' then 'medium'
  when 'dificil' then 'hard'
  else difficulty end;

update public.family_progress set topic = case topic
  when 'navegacion' then 'navigation'
  when 'archivos' then 'files'
  when 'paquetes' then 'packages'
  when 'permisos' then 'permissions'
  when 'busqueda' then 'search'
  when 'sistema' then 'system'
  when 'procesos' then 'processes'
  when 'servicios' then 'services'
  when 'redes' then 'network'
  else topic end;

update public.family_progress set mode = case mode
  when 'mision' then 'mission'
  when 'historia' then 'story'
  else mode end;

update public.shop_items set kind = case kind
  when 'titulo' then 'title'
  when 'marco' then 'frame'
  else kind end;


alter table public.questions
  add constraint questions_difficulty_check check (difficulty in ('easy', 'medium', 'hard'));
alter table public.family_progress
  add constraint family_progress_difficulty_check check (difficulty in ('easy', 'medium', 'hard'));
alter table public.family_progress
  add constraint family_progress_mode_check check (mode in ('mission', 'story'));
alter table public.shop_items
  add constraint shop_items_kind_check check (kind in ('avatar', 'title', 'frame', 'boost'));

-- ---------------------------------------------------------------------
-- 3. Identificadores de los objetos
--
-- inventory.item_id apunta a shop_items(id), así que hay que soltar la
-- clave foránea mientras se renombran y volver a ponerla al final.
-- profiles guarda el objeto equipado en avatar, title y frame.
-- ---------------------------------------------------------------------
create table if not exists public._id_map (old text primary key, new text not null);
truncate public._id_map;

insert into public._id_map (old, new) values
  ('titulo_novato', 'title_rookie'),
  ('titulo_shell', 'title_shell'),
  ('titulo_script', 'title_script'),
  ('titulo_sysadmin', 'title_sysadmin'),
  ('titulo_kernel', 'title_kernel'),
  ('titulo_root', 'title_root'),
  ('marco_base', 'frame_basic'),
  ('marco_bronce', 'frame_bronze'),
  ('marco_plata', 'frame_silver'),
  ('marco_oro', 'frame_gold'),
  ('marco_neon', 'frame_neon'),
  ('boost_monedas', 'boost_coins'),
  ('boost_tiempo', 'boost_time'),
  ('boost_pista', 'boost_hint'),
  ('boost_escudo', 'boost_shield'),
  ('tux_gafas', 'tux_shades'),
  ('tux_rey', 'tux_king'),
  ('tux_oro', 'tux_gold'),
  ('tux_fantasma', 'tux_ghost'),
  ('av_tactica', 'av_tactical'),
  ('av_exploradora', 'av_scout'),
  ('av_infiltrada', 'av_infiltrator'),
  ('av_escudero', 'av_squire'),
  ('av_guardia', 'av_guard'),
  ('av_automata', 'av_automaton'),
  ('av_dagas', 'av_daggers'),
  ('av_orco', 'av_orc'),
  ('av_barbaro', 'av_barbarian'),
  ('av_garras', 'av_claws'),
  ('av_arquera', 'av_archer'),
  ('av_maga', 'av_mage'),
  ('av_bruja', 'av_witch'),
  ('av_francotiradora', 'av_sniper'),
  ('av_trol', 'av_troll'),
  ('av_demonio', 'av_demon'),
  ('av_espectro', 'av_specter');


alter table public.inventory drop constraint if exists inventory_item_id_fkey;

update public.shop_items s set id      = m.new from public._id_map m where s.id      = m.old;
update public.inventory  i set item_id = m.new from public._id_map m where i.item_id = m.old;
update public.profiles   p set avatar  = m.new from public._id_map m where p.avatar  = m.old;
update public.profiles   p set title   = m.new from public._id_map m where p.title   = m.old;
update public.profiles   p set frame   = m.new from public._id_map m where p.frame   = m.old;

alter table public.inventory
  add constraint inventory_item_id_fkey foreign key (item_id) references public.shop_items(id);

drop table public._id_map;

-- Lo que viene equipado de fábrica también cambia de nombre
alter table public.profiles alter column title set default 'title_rookie';
alter table public.profiles alter column frame set default 'frame_basic';

-- La familia del perfil apunta a families en vez de repetir la lista
do $fk$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_family_fkey') then
    alter table public.profiles
      add constraint profiles_family_fkey
      foreign key (family_id) references public.families(id);
  end if;
end
$fk$;

-- ---------------------------------------------------------------------
-- 4. Funciones que llevaban los valores escritos dentro
-- ---------------------------------------------------------------------
create or replace function public.equip_item(p_slot text, p_item_id text)
returns json language plpgsql security definer set search_path = public as $fn$
declare v_kind text;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  if p_slot not in ('avatar', 'title', 'frame') then raise exception 'Ranura no valida'; end if;

  select kind into v_kind from shop_items where id = p_item_id and active;
  if v_kind is null or v_kind <> p_slot then raise exception 'Ese objeto no existe'; end if;
  if not has_item(p_item_id) then raise exception 'Objeto bloqueado'; end if;

  if p_slot = 'avatar' then
    update profiles set avatar = p_item_id where id = auth.uid();
  elsif p_slot = 'title' then
    update profiles set title = p_item_id where id = auth.uid();
  else
    update profiles set frame = p_item_id where id = auth.uid();
  end if;

  return (select json_build_object('avatar', avatar, 'title', title, 'frame', frame)
            from profiles where id = auth.uid());
end;
$fn$;

create or replace function public.set_family(p_family text)
returns text language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  -- null vuelve a dejar que se deduzca de las misiones superadas
  if p_family is not null and not exists (select 1 from families where id = p_family) then
    raise exception 'Familia no valida';
  end if;

  update profiles set family_id = p_family where id = auth.uid();
  return p_family;
end;
$fn$;

-- finish_run valida dificultad y modo, que ahora van en inglés
create or replace function public.finish_run(
  p_family text, p_difficulty text, p_mode text, p_topic text,
  p_correct int, p_total int, p_coins int, p_boost text default null
)
returns int language plpgsql security definer set search_path = public as $fn$
declare
  v_coins int;
  v_payout int;
  v_used int;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  if not exists (select 1 from families where id = p_family) then raise exception 'Familia no valida'; end if;
  if p_difficulty not in ('easy', 'medium', 'hard') then raise exception 'Dificultad no valida'; end if;
  if p_mode not in ('mission', 'story') then raise exception 'Modo no valido'; end if;
  if coalesce(p_topic, '') = '' then raise exception 'Tema no valido'; end if;
  if p_total <= 0 or p_total > 30 or p_correct < 0 or p_correct > p_total then raise exception 'Resultado no valido'; end if;
  if p_coins < 0 or p_coins > p_correct * 20 then raise exception 'Monedas no validas'; end if;

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

  v_payout := p_coins;

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

grant execute on function public.equip_item(text, text) to authenticated;
grant execute on function public.set_family(text) to authenticated;
grant execute on function public.finish_run(text, text, text, text, int, int, int, text) to authenticated;
