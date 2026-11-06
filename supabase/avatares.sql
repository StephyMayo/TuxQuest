insert into public.shop_items (id, kind, name, description, price, stackable, requires, sort) values
  ('av_tactical',     'avatar', 'Operadora táctica', 'Sale a campo con el portátil en la mano.',           400, false,  5, 16),
  ('av_scout', 'avatar', 'Exploradora',       'Se mueve por el sistema de archivos como por un tejado.', 480, false,  8, 17),
  ('av_infiltrator',  'avatar', 'Infiltrada',        'Entra, hace su trabajo y no deja ni una línea en los registros.', 550, false, 12, 18)
on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, description = excluded.description,
  price = excluded.price, stackable = excluded.stackable, requires = excluded.requires, sort = excluded.sort;
