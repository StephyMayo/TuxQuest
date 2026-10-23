-- =====================================================================
-- TuxQuest · Familia elegida en el perfil
-- Ejecutar DESPUÉS de avatares-2.sql.
-- Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- =====================================================================

-- Hasta ahora la familia se deducía de en cuál habías superado más
-- misiones. Ahora se puede elegir: null significa «que la deduzca».
alter table public.profiles add column if not exists family_id text;

-- La columna apunta a families en vez de repetir los cuatro nombres en un
-- check: asi la base garantiza la relacion y la lista vive en un solo sitio.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_family_fkey') then
    alter table public.profiles
      add constraint profiles_family_fkey
      foreign key (family_id) references public.families(id);
  end if;
end
$$;

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

grant execute on function public.set_family(text) to authenticated;
