-- =====================================================================
-- TuxQuest · Más avatares para la tienda y nombre de usuario editable
-- Ejecutar DESPUÉS de avatares.sql.
-- Supabase > SQL Editor > New query > pegar y Run.
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 18 avatares nuevos. Los precios viven aquí porque buy_item() los lee
-- de la base de datos: lo que manda el navegador nunca se usa para cobrar.
-- ---------------------------------------------------------------------
insert into public.shop_items (id, kind, name, description, price, stackable, requires, sort) values
  ('av_escudero', 'avatar', 'Escudero verde', 'Pequeño, con casco y bastón. Todo el mundo empieza así.', 120, false, 0, 20),
  ('av_marine', 'avatar', 'Marine orbital', 'Armadura blanca y rifle. Despliegue limpio, salida limpia.', 150, false, 0, 21),
  ('av_guardia', 'avatar', 'Guardia dorada', 'De guardia en el puerto 22, turno de noche.', 170, false, 1, 22),
  ('av_automata', 'avatar', 'Autómata oxidado', 'Lleva décadas funcionando. Nadie recuerda quién lo compiló.', 200, false, 2, 23),
  ('av_dagas', 'avatar', 'Dagas gemelas', 'Dos filos, dos terminales abiertas.', 220, false, 3, 24),
  ('av_orco', 'avatar', 'Orco martillador', 'Su respuesta a cualquier error es volver a compilar.', 240, false, 3, 25),
  ('av_barbaro', 'avatar', 'Bárbaro del log', 'Lee diez mil líneas de registro sin pestañear.', 260, false, 4, 26),
  ('av_ninja', 'avatar', 'Ninja de la red', 'Entra por el puerto que nadie vigila.', 280, false, 5, 27),
  ('av_garras', 'avatar', 'Garras de plasma', 'Corta procesos colgados de un zarpazo.', 300, false, 5, 28),
  ('av_neon', 'avatar', 'Arquera de neón', 'Apunta al proceso correcto a la primera.', 320, false, 6, 29),
  ('av_arquera', 'avatar', 'Arquera del bosque', 'Paciente. Espera a que el servidor baje la guardia.', 340, false, 7, 30),
  ('av_maga', 'avatar', 'Maga arcana', 'Sus conjuros son alias que nadie más entiende.', 380, false, 8, 31),
  ('av_bruja', 'avatar', 'Bruja del shell', 'Invoca con un pipe y tres comandos encadenados.', 400, false, 8, 32),
  ('av_francotiradora', 'avatar', 'Francotiradora', 'Un disparo, un bug menos.', 430, false, 10, 33),
  ('av_trol', 'avatar', 'Trol de root', 'Vive bajo el sistema de archivos y cobra peaje.', 460, false, 10, 34),
  ('av_mecha', 'avatar', 'Mecha de asalto', 'Cañón, escudo y ni un solo ciclo desperdiciado.', 500, false, 12, 35),
  ('av_demonio', 'avatar', 'Demonio del kernel', 'Lo invocaron con un rm -rf y ya no se fue.', 550, false, 14, 36),
  ('av_espectro', 'avatar', 'Caballero espectral', 'Sigue rondando el servidor que apagaron en 2009.', 600, false, 16, 37)
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, description = excluded.description,
  price = excluded.price, stackable = excluded.stackable, requires = excluded.requires, sort = excluded.sort;

-- ---------------------------------------------------------------------
-- Cambiar el nombre de usuario
-- ---------------------------------------------------------------------
create or replace function public.set_username(p_username text)
returns text language plpgsql security definer set search_path = public as $fn$
declare v_nuevo text;
begin
  if auth.uid() is null then raise exception 'Sesion no iniciada'; end if;

  v_nuevo := btrim(p_username);
  -- Las mismas reglas que valida el formulario, repetidas aqui porque el
  -- navegador se puede saltar.
  if v_nuevo !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Nombre no valido';
  end if;

  if exists (
    select 1 from profiles
     where lower(username) = lower(v_nuevo) and id <> auth.uid()
  ) then
    raise exception 'Nombre en uso';
  end if;

  update profiles set username = v_nuevo where id = auth.uid();
  return v_nuevo;
end;
$fn$;

grant execute on function public.set_username(text) to authenticated;
