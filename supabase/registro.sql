-- =====================================================================
-- TuxQuest · Registro de jugadores a prueba de fallos
-- Ejecutar DESPUÉS de claves.sql (y de english.sql si vienes de una base
-- en castellano). Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
--
-- Por qué:
--   Crear una cuenta hacía dos cosas que podían fallar y dejar al jugador
--   sin poder entrar:
--
--   1. handle_new_user() insertaba el perfil sin comprobar nada. Si el
--      nombre de usuario ya existía (unique), traía caracteres raros o se
--      quedaba corto (check de 3 a 20), el insert fallaba. Y como el
--      trigger va sobre auth.users, al fallar se cae TODO el registro:
--      Supabase devuelve «Database error saving new user» y la cuenta no
--      se crea. El formulario valida el nombre, pero una cuenta creada
--      desde el panel de Supabase o con la API de administración no pasa
--      por ese formulario.
--
--   2. Si por lo que fuera no quedaba perfil, iniciar sesión fallaba para
--      siempre con «No se encontró el perfil del jugador», porque el
--      trigger solo salta al crear el usuario, no al entrar.
--
--   Ahora el nombre se limpia y se le busca uno libre, un problema con el
--   perfil ya no tumba el registro, y ensure_profile() crea el perfil que
--   falte la primera vez que el jugador entra.
--
-- OJO, esto NO es lo que limita cuántas cuentas puedes crear seguidas:
--   el tope de 3 o 4 registros por hora lo pone el servidor de correo
--   gratuito de Supabase, y se quita desactivando «Confirm email» en
--   Authentication > Sign In / Providers > Email. Mira el README.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Un nombre de usuario válido y libre a partir de lo que haya
--
-- Deja solo letras, números y _, lo recorta a 20 y, si ya está cogido,
-- le va probando sufijos (_1, _2…). Si no hay nada aprovechable, saca uno
-- del id del usuario, que es único. Devuelve siempre algo que cumple el
-- check de la tabla, así que el insert no puede fallar por el nombre.
-- ---------------------------------------------------------------------
create or replace function public.free_username(p_base text, p_id uuid)
returns text language plpgsql security definer set search_path = public as $fn$
declare
  v_base text;
  v_name text;
  v_try  int := 0;
begin
  v_base := left(regexp_replace(coalesce(p_base, ''), '[^A-Za-z0-9_]', '', 'g'), 20);
  -- menos de 3 caracteres no pasa el check: se usa el id, que es único
  if char_length(v_base) < 3 then
    v_base := left('tux_' || replace(p_id::text, '-', ''), 20);
  end if;

  v_name := v_base;
  while exists (select 1 from profiles where lower(username) = lower(v_name) and id <> p_id) loop
    v_try := v_try + 1;
    if v_try > 99 then
      return left('tux_' || replace(p_id::text, '-', ''), 20);
    end if;
    -- se recorta la base para que el sufijo quepa en los 20 caracteres
    v_name := left(v_base, 19 - char_length(v_try::text)) || '_' || v_try::text;
  end loop;

  return v_name;
end;
$fn$;

-- Es de uso interno: solo la llaman el trigger y ensure_profile().
revoke all on function public.free_username(text, uuid) from public;

-- ---------------------------------------------------------------------
-- Crear el perfil al registrarse, sin poder tumbar el registro
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    free_username(
      coalesce(
        nullif(btrim(new.raw_user_meta_data->>'username'), ''),
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      new.id
    )
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Pase lo que pase, la cuenta se crea. El perfil que falte lo arregla
  -- ensure_profile() cuando el jugador entre.
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Red de seguridad: el perfil que falte se crea al entrar
--
-- Sirve para las cuentas creadas desde el panel de Supabase o con la API
-- de administración (que es como se dan de alta muchas cuentas de golpe
-- sin gastar correos) y para las que se quedaron a medias.
-- Devuelve el perfil ya listo, exista de antes o se acabe de crear.
-- ---------------------------------------------------------------------
create or replace function public.ensure_profile()
returns json language plpgsql security definer set search_path = public as $fn$
declare
  v_id   uuid := auth.uid();
  v_base text;
begin
  if v_id is null then raise exception 'Sesion no iniciada'; end if;

  if not exists (select 1 from profiles where id = v_id) then
    select coalesce(
             nullif(btrim(u.raw_user_meta_data->>'username'), ''),
             split_part(coalesce(u.email, ''), '@', 1)
           )
      into v_base
      from auth.users u
     where u.id = v_id;

    insert into profiles (id, username)
    values (v_id, free_username(v_base, v_id))
    on conflict (id) do nothing;
  end if;

  return (
    select json_build_object(
             'id', id, 'username', username, 'coins', coins,
             'avatar', avatar, 'title', title, 'frame', frame,
             'family_id', family_id
           )
      from profiles where id = v_id
  );
end;
$fn$;

grant execute on function public.ensure_profile() to authenticated;

-- ---------------------------------------------------------------------
-- Perfiles que faltan de antes (cuentas creadas mientras el trigger
-- fallaba, o a mano desde el panel). Se les crea el perfil ahora.
--
-- Va de uno en uno a propósito: free_username() mira los nombres que ya
-- hay en la tabla, y en un solo insert masivo no vería los de las filas
-- de la misma sentencia, así que dos cuentas con el mismo nombre base
-- chocarían.
-- ---------------------------------------------------------------------
do $backfill$
declare r record;
begin
  for r in
    select u.id,
           coalesce(
             nullif(btrim(u.raw_user_meta_data->>'username'), ''),
             split_part(coalesce(u.email, ''), '@', 1)
           ) as base
      from auth.users u
      left join public.profiles p on p.id = u.id
     where p.id is null
  loop
    insert into public.profiles (id, username)
    values (r.id, public.free_username(r.base, r.id))
    on conflict (id) do nothing;
  end loop;
end
$backfill$;
