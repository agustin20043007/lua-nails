-- Lua Nails · días puntuales cerrados (vacaciones, feriados, etc.)
-- Correr en Supabase > SQL Editor, después de los archivos anteriores.
--
-- "horarios" define el horario semanal habitual (por día de semana). Esta
-- tabla guarda excepciones puntuales: fechas concretas en las que la
-- manicura cierra, sin importar lo que diga el horario semanal. El público
-- puede leerla para que el calendario de reserva no deje elegir esos días;
-- solo la manicura puede cerrarlos o reabrirlos.

create table public.dias_cerrados (
  fecha date primary key,
  created_at timestamptz not null default now()
);

alter table public.dias_cerrados enable row level security;

create policy "dias_cerrados_publico" on public.dias_cerrados for select using (true);

create policy "dias_cerrados_solo_admin_escribe" on public.dias_cerrados for all
  using (public.es_admin()) with check (public.es_admin());
