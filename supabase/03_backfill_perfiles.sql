-- Lua Nails · rellenar perfiles de cuentas creadas antes del trigger
-- Correr en Supabase > SQL Editor, después de 02_perfil_automatico.sql.
--
-- El trigger de 02 solo corre para cuentas NUEVAS. Esto crea la fila en
-- public.profiles para cualquier usuario que ya existía en auth.users y
-- todavía no tenía perfil (por ejemplo, cuentas de prueba registradas
-- antes de que el trigger existiera). Es seguro correrlo más de una vez.

insert into public.profiles (id, nombre, telefono)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'nombre', ''),
  u.raw_user_meta_data ->> 'telefono'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
