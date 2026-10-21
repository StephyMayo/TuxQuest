-- =====================================================================
-- TuxQuest · Tienda, inventario y personalización del perfil
-- Ejecutar DESPUÉS de schema.sql y seed.sql.
-- Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catálogo de la tienda. El precio vive aquí porque el servidor nunca
-- confía en el precio que manda el navegador.
-- ---------------------------------------------------------------------
create table if not exists public.shop_items (
  id text primary key,
  kind text not null check (kind in ('avatar', 'titulo', 'marco', 'boost')),
  name text not null,
  description text not null default '',
  price int not null check (price >= 0),
  -- los boosts se gastan, así que se pueden comprar varias veces
  stackable boolean not null default false,
  -- misiones completadas necesarias para desbloquearlo
  requires int not null default 0,
  active boolean not null default true,
  sort int not null default 0
);

-- Inventario del jugador (cosméticos qty = 1, boosts qty = n)
create table if not exists public.inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.shop_items(id),
  qty int not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Personalización del perfil
alter table public.profiles add column if not exists avatar text not null default 'tux';
alter table public.profiles add column if not exists titulo text not null default 'titulo_novato';
alter table public.profiles add column if not exists marco  text not null default 'marco_base';

-- ---------------------------------------------------------------------
-- Contenido del catálogo (debe coincidir con src/data/shop.ts)
-- ---------------------------------------------------------------------
insert into public.shop_items (id, kind, name, description, price, stackable, requires, sort) values
  ('boost_monedas',  'boost',  'Doble moneda',      'Duplica las monedas que ganes en la misión.',          25, true,  0,  1),
  ('boost_tiempo',   'boost',  'Tiempo extra',      'Suma 15 segundos al reloj del reto actual.',           15, true,  0,  2),
  ('boost_pista',    'boost',  'Pista gratis',      'Revela la pista de un reto sin pagar monedas.',        18, true,  0,  3),
  ('boost_escudo',   'boost',  'Escudo de Tux',     'Tu siguiente fallo cuenta como acierto.',              40, true,  0,  4),

  ('tux',            'avatar', 'Tux clásico',       'El pingüino de siempre.',                               0, false, 0, 10),
  ('tux_gafas',      'avatar', 'Tux hacker',        'Con gafas de sol.',                                    60, false, 0, 11),
  ('tux_ninja',      'avatar', 'Tux ninja',         'Se mueve entre directorios sin hacer ruido.',         120, false, 3, 12),
  ('tux_rey',        'avatar', 'Tux rey',           'Corona para quien domina su distribución.',           200, false, 6, 13),
  ('tux_fantasma',   'avatar', 'Tux fantasma',      'Un proceso que nadie puede matar.',                   280, false, 8, 14),
  ('tux_oro',        'avatar', 'Tux dorado',        'Edición brillante.',                                  350, false, 10, 15),

  ('titulo_novato',  'titulo', 'Novato',            'Todos empezamos escribiendo ls.',                       0, false, 0, 20),
  ('titulo_shell',   'titulo', 'Aprendiz de shell', 'Ya no le temes al cursor parpadeante.',                40, false, 0, 21),
  ('titulo_script',  'titulo', 'Script Kiddie',     'Copias comandos, pero con estilo.',                    90, false, 3, 22),
  ('titulo_sysadmin','titulo', 'Sysadmin',          'Los servicios te obedecen.',                          180, false, 6, 23),
  ('titulo_kernel',  'titulo', 'Maestro del Kernel','Compilas por diversión.',                             300, false, 9, 24),
  ('titulo_root',    'titulo', 'root',              'Con gran poder viene un gran rm -rf.',                500, false, 12, 25),

  ('marco_base',     'marco',  'Marco estándar',    'Sobrio y funcional, como Debian.',                      0, false, 0, 30),
  ('marco_bronce',   'marco',  'Marco de bronce',   'Tu primera medalla.',                                  70, false, 0, 31),
  ('marco_plata',    'marco',  'Marco de plata',    'Brilla sin exagerar.',                                150, false, 4, 32),
  ('marco_neon',     'marco',  'Marco neón',        'Terminal a las 3 de la madrugada.',                   260, false, 6, 33),
  ('marco_oro',      'marco',  'Marco de oro',      'Para los que terminan el desafío final.',             320, false, 8, 34)
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, description = excluded.description,
  price = excluded.price, stackable = excluded.stackable, requires = excluded.requires, sort = excluded.sort;

-- ---------------------------------------------------------------------
-- Funciones (RPC). El inventario y las monedas solo cambian aquí dentro.
-- ---------------------------------------------------------------------

-- Misiones completadas por el jugador actual (para los desbloqueos)
create or replace function public.missions_done()
returns int language sql security definer set search_path = public stable as $fn$
  select count(*)::int from mission_progress where user_id = auth.uid() and completed;
$fn$;

-- ¿El jugador tiene al menos una unidad del item? Los gratuitos siempre sí.
create or replace function public.has_item(p_item_id text)
returns boolean language sql security definer set search_path = public stable as $fn$
  select coalesce((select price = 0 from shop_items where id = p_item_id), false)
      or exists (select 1 from inventory where user_id = auth.uid() and item_id = p_item_id and qty > 0);
$fn$;

create or replace function public.buy_item(p_item_id text)
returns int language plpgsql security definer set search_path = public as $fn$
declare
  v_item shop_items%rowtype;
  v_coins int;
  v_have int;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;

  select * into v_item from shop_items where id = p_item_id and active;
  if not found then raise exception 'Ese objeto no existe'; end if;

  if v_item.requires > 0 and missions_done() < v_item.requires then
    raise exception 'Objeto bloqueado';
  end if;

  select qty into v_have from inventory where user_id = auth.uid() and item_id = p_item_id;
  if not v_item.stackable and coalesce(v_have, 0) > 0 then
    raise exception 'Ya tienes ese objeto';
  end if;

  -- Cobrar. El where con coins >= price evita saldos negativos aunque
  -- lleguen dos compras a la vez.
  update profiles set coins = coins - v_item.price
   where id = auth.uid() and coins >= v_item.price
  returning coins into v_coins;
  if v_coins is null then raise exception 'Monedas insuficientes'; end if;

  insert into inventory (user_id, item_id, qty)
  values (auth.uid(), p_item_id, 1)
  on conflict (user_id, item_id) do update set qty = inventory.qty + 1, updated_at = now();

  return v_coins;
end;
$fn$;

create or replace function public.equip_item(p_slot text, p_item_id text)
returns json language plpgsql security definer set search_path = public as $fn$
declare v_kind text;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  if p_slot not in ('avatar', 'titulo', 'marco') then raise exception 'Ranura no valida'; end if;

  select kind into v_kind from shop_items where id = p_item_id and active;
  if v_kind is null or v_kind <> p_slot then raise exception 'Ese objeto no existe'; end if;
  if not has_item(p_item_id) then raise exception 'Objeto bloqueado'; end if;

  if p_slot = 'avatar' then
    update profiles set avatar = p_item_id where id = auth.uid();
  elsif p_slot = 'titulo' then
    update profiles set titulo = p_item_id where id = auth.uid();
  else
    update profiles set marco = p_item_id where id = auth.uid();
  end if;

  return (select json_build_object('avatar', avatar, 'titulo', titulo, 'marco', marco)
            from profiles where id = auth.uid());
end;
$fn$;

create or replace function public.consume_boost(p_item_id text)
returns int language plpgsql security definer set search_path = public as $fn$
declare v_qty int;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  if not exists (select 1 from shop_items where id = p_item_id and kind = 'boost') then
    raise exception 'Ese objeto no existe';
  end if;

  update inventory set qty = qty - 1, updated_at = now()
   where user_id = auth.uid() and item_id = p_item_id and qty > 0
  returning qty into v_qty;
  if v_qty is null then raise exception 'Sin unidades'; end if;

  return v_qty;
end;
$fn$;

-- finish_mission con soporte de boost. Se elimina la version de 4
-- argumentos para que no queden dos funciones con el mismo nombre.
drop function if exists public.finish_mission(text, int, int, int);

create or replace function public.finish_mission(p_key text, p_correct int, p_total int, p_coins int, p_boost text default null)
returns int language plpgsql security definer set search_path = public as $fn$
declare
  v_coins int;
  v_payout int;
  v_used int;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  if p_total <= 0 or p_total > 20 or p_correct < 0 or p_correct > p_total then raise exception 'Resultado no valido'; end if;
  -- Limite: como maximo 20 monedas por acierto (dificultad dificil)
  if p_coins < 0 or p_coins > p_correct * 20 then raise exception 'Monedas no validas'; end if;

  insert into mission_progress as mp (user_id, mission_key, best_correct, best_total, completed)
  values (auth.uid(), p_key, p_correct, p_total, p_correct::numeric / p_total >= 0.7)
  on conflict (user_id, mission_key) do update set
    best_correct = case when excluded.best_correct::numeric / excluded.best_total > mp.best_correct::numeric / mp.best_total
                        then excluded.best_correct else mp.best_correct end,
    best_total   = case when excluded.best_correct::numeric / excluded.best_total > mp.best_correct::numeric / mp.best_total
                        then excluded.best_total else mp.best_total end,
    completed    = mp.completed or excluded.completed,
    updated_at   = now();

  v_payout := p_coins;

  -- El multiplicador se aplica aqui, no en el navegador: solo cuenta si el
  -- jugador tiene de verdad el boost, y se gasta al usarlo.
  if p_boost = 'boost_monedas' then
    update inventory set qty = qty - 1, updated_at = now()
     where user_id = auth.uid() and item_id = 'boost_monedas' and qty > 0
    returning qty into v_used;
    if v_used is not null then v_payout := v_payout * 2; end if;
  end if;

  update profiles set coins = coins + v_payout where id = auth.uid() returning coins into v_coins;
  return v_coins;
end;
$fn$;

-- ---------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
-- ---------------------------------------------------------------------
alter table public.shop_items enable row level security;
alter table public.inventory  enable row level security;

drop policy if exists "shop_items_read" on public.shop_items;
create policy "shop_items_read" on public.shop_items for select using (active);

drop policy if exists "inventory_read_own" on public.inventory;
create policy "inventory_read_own" on public.inventory for select using (auth.uid() = user_id);

-- Sin insert/update para el cliente: el inventario solo cambia desde
-- buy_item(), consume_boost() y finish_mission().
grant select on public.shop_items to anon, authenticated;
grant select on public.inventory to authenticated;
grant execute on function public.missions_done() to authenticated;
grant execute on function public.has_item(text) to authenticated;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.equip_item(text, text) to authenticated;
grant execute on function public.consume_boost(text) to authenticated;
grant execute on function public.finish_mission(text, int, int, int, text) to authenticated;
