-- Lua Nails · horarios ocupados, visibles para cualquier clienta logueada
-- Correr en Supabase > SQL Editor, después de los archivos anteriores.
--
-- Las políticas de RLS de public.turnos solo dejan ver el turno propio (o
-- todos, si sos admin). Pero para armar el calendario, cualquier clienta
-- necesita saber qué horarios están ocupados por CUALQUIERA, sin ver de
-- quién es ni el motivo. Esta función devuelve solo fecha/hora/duración
-- (nada de nombre, teléfono ni comentario) y cualquier usuario logueado
-- puede llamarla.

create or replace function public.horarios_ocupados(desde date, hasta date)
returns table (fecha date, hora_inicio time, duracion_min int)
language sql
security definer
set search_path = public
stable
as $$
  select fecha, hora_inicio, duracion_min
  from public.turnos
  where estado = 'confirmado'
    and fecha between desde and hasta;
$$;

grant execute on function public.horarios_ocupados(date, date) to authenticated;
