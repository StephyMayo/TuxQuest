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

create or replace function public.set_family(p_family text)
returns text language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;

  if p_family is not null and not exists (select 1 from families where id = p_family) then
    raise exception 'Familia no valida';
  end if;

  update profiles set family_id = p_family where id = auth.uid();
  return p_family;
end;
$fn$;

grant execute on function public.set_family(text) to authenticated;
