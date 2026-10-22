-- =====================================================================
-- TuxQuest · Familia elegida en el perfil
-- Ejecutar DESPUÉS de avatares-2.sql.
-- Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- =====================================================================

-- Hasta ahora la familia se deducía de en cuál habías superado más
-- misiones. Ahora se puede elegir: null significa «que la deduzca».
alter table public.profiles add column if not exists family text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_family_valido') then
    alter table public.profiles
      add constraint profiles_family_valido
      check (family is null or family in ('debian', 'arch', 'redhat', 'suse'));
  end if;
end
$$;

create or replace function public.set_family(p_family text)
returns text language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;
  -- null vuelve a dejar que se deduzca de las misiones superadas
  if p_family is not null and p_family not in ('debian', 'arch', 'redhat', 'suse') then
    raise exception 'Familia no valida';
  end if;

  update profiles set family = p_family where id = auth.uid();
  return p_family;
end;
$fn$;

grant execute on function public.set_family(text) to authenticated;
