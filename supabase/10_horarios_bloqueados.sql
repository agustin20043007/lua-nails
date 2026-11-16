-- Lua Nails · horarios puntuales cerrados manualmente por la manicura
-- Correr en Supabase > SQL Editor, después de los archivos anteriores.
--
-- "dias_cerrados" cierra un día entero. Esta tabla deja cerrar un horario
-- puntual (una franja de 30 min) dentro de un día que sigue abierto, por
-- ejemplo para bloquear las 11:00 de un día sin cerrar todo el día. El
-- público puede leerla para que el calendario de reserva no ofrezca esos
-- horarios; solo la manicura puede cerrarlos o reabrirlos.

create table public.horarios_bloqueados (
  fecha date not null,
  hora_inicio time not null,
  created_at timestamptz not null default now(),
  primary key (fecha, hora_inicio)
);

alter table public.horarios_bloqueados enable row level security;

create policy "horarios_bloqueados_publico" on public.horarios_bloqueados for select using (true);

create policy "horarios_bloqueados_solo_admin_escribe" on public.horarios_bloqueados for all
  using (public.es_admin()) with check (public.es_admin());
