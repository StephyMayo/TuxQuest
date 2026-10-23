-- =====================================================================
-- TuxQuest · profiles.family con clave foránea
-- Ejecutar DESPUÉS de progreso.sql.
-- Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
--
-- Por qué:
--   La familia elegida en el perfil se había dejado con un check que
--   repetía los cuatro nombres a mano. Funciona, pero deja la lista en
--   dos sitios y no relaciona la columna con la tabla families. El resto
--   del esquema sí usa claves foráneas, así que esta también.
-- =====================================================================

-- Por si quedara algún valor que no esté en families (no debería, lo
-- impedía el check), se deja en null antes de poner la clave foránea.
update public.profiles
   set family_id = null
 where family_id is not null
   and family_id not in (select id from public.families);

alter table public.profiles drop constraint if exists profiles_family_valido;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_family_fkey') then
    alter table public.profiles
      add constraint profiles_family_fkey
      foreign key (family_id) references public.families(id);
  end if;
end
$$;

-- set_family() ya no repite la lista: pregunta a la tabla
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
