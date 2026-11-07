-- Lua Nails · horarios cortados (varias franjas por día)
-- Correr en Supabase > SQL Editor, después de los archivos anteriores.
--
-- Hasta ahora "horarios" tenía una sola franja por día de semana (una fila,
-- hora_inicio/hora_fin nulos si estaba cerrado). Esto agrega una columna
-- "tramo" para poder guardar varias franjas en el mismo día (ej: 9 a 13 y
-- 16 a 20, con corte al mediodía). Un día cerrado ahora simplemente no
-- tiene filas, en vez de tener una fila con horas nulas.

delete from public.horarios where hora_inicio is null or hora_fin is null;

alter table public.horarios drop constraint horarios_pkey;
alter table public.horarios add column tramo int not null default 1 check (tramo >= 1);
alter table public.horarios add primary key (dia_semana, tramo);
alter table public.horarios alter column hora_inicio set not null;
alter table public.horarios alter column hora_fin set not null;
