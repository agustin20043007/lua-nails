-- Lua Nails · la manicura puede asignar turnos sin cuenta vinculada
-- Correr en Supabase > SQL Editor, después de los archivos anteriores.
--
-- Hasta ahora todo turno requería un cliente_id (la cuenta logueada que
-- reservó). La manicura necesita poder anotar turnos de gente que llamó o
-- escribió por WhatsApp y no tiene cuenta en la web, así que cliente_id pasa
-- a ser opcional: el nombre y el teléfono quedan igual, sueltos en el turno.

alter table public.turnos alter column cliente_id drop not null;

create policy "admin_crea_turno"
  on public.turnos for insert
  with check (public.es_admin());
