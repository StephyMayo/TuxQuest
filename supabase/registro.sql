create or replace function public.free_username(p_base text, p_id uuid)
returns text language plpgsql security definer set search_path = public as $fn$
declare
  v_base text;
  v_name text;
  v_try  int := 0;
begin
  v_base := left(regexp_replace(coalesce(p_base, ''), '[^A-Za-z0-9_]', '', 'g'), 20);

  if char_length(v_base) < 3 then
    v_base := left('tux_' || replace(p_id::text, '-', ''), 20);
  end if;

  v_name := v_base;
  while exists (select 1 from profiles where lower(username) = lower(v_name) and id <> p_id) loop
    v_try := v_try + 1;
    if v_try > 99 then
      return left('tux_' || replace(p_id::text, '-', ''), 20);
    end if;

    v_name := left(v_base, 19 - char_length(v_try::text)) || '_' || v_try::text;
  end loop;

  return v_name;
end;
$fn$;

revoke all on function public.free_username(text, uuid) from public;

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

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
