-- Lua Nails · esquema inicial
-- Correr esto en Supabase > SQL Editor (una sola vez, en orden).

create extension if not exists "pgcrypto";

-- ============ PERFILES ============
-- Un perfil por usuario de auth.users. "rol" distingue clienta de la manicura.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  telefono text,
  rol text not null default 'clienta' check (rol in ('clienta', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Función auxiliar: ¿el usuario logueado es la manicura?
create function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'admin'
  );
$$;

create policy "ver_propio_perfil_o_admin"
  on public.profiles for select
  using (auth.uid() = id or public.es_admin());

create policy "crear_propio_perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "editar_propio_perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ============ CATÁLOGO DE SERVICIOS ============
create table public.categorias_servicio (
  id serial primary key,
  nombre text not null unique,
  nota text,
  sin_retiro boolean not null default false,
  orden int not null default 0
);

create table public.servicios (
  id serial primary key,
  categoria_id int not null references public.categorias_servicio (id) on delete cascade,
  nombre text not null,
  precio int not null,
  duracion_min int not null,
  orden int not null default 0
);

create table public.retiros (
  id serial primary key,
  nombre text not null,
  precio int not null,
  duracion_min int not null
);

-- Horario de atención por día de semana (0 = domingo ... 6 = sábado). NULL = cerrado.
create table public.horarios (
  dia_semana int primary key check (dia_semana between 0 and 6),
  hora_inicio time,
  hora_fin time
);

alter table public.categorias_servicio enable row level security;
alter table public.servicios enable row level security;
alter table public.retiros enable row level security;
alter table public.horarios enable row level security;

create policy "catalogo_publico" on public.categorias_servicio for select using (true);
create policy "catalogo_publico" on public.servicios for select using (true);
create policy "catalogo_publico" on public.retiros for select using (true);
create policy "catalogo_publico" on public.horarios for select using (true);

create policy "solo_admin_escribe" on public.categorias_servicio for all
  using (public.es_admin()) with check (public.es_admin());
create policy "solo_admin_escribe" on public.servicios for all
  using (public.es_admin()) with check (public.es_admin());
create policy "solo_admin_escribe" on public.retiros for all
  using (public.es_admin()) with check (public.es_admin());
create policy "solo_admin_escribe" on public.horarios for all
  using (public.es_admin()) with check (public.es_admin());

-- ============ TURNOS ============
create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  servicio_id int not null references public.servicios (id),
  retiro_id int references public.retiros (id),
  fecha date not null,
  hora_inicio time not null,
  duracion_min int not null,
  precio_total int not null,
  nombre text not null,
  telefono text not null,
  nota text,
  estado text not null default 'confirmado' check (estado in ('confirmado', 'cancelado')),
  created_at timestamptz not null default now()
);

create index turnos_fecha_idx on public.turnos (fecha, hora_inicio);
create index turnos_cliente_idx on public.turnos (cliente_id);

alter table public.turnos enable row level security;

create policy "clienta_ve_lo_suyo_admin_ve_todo"
  on public.turnos for select
  using (auth.uid() = cliente_id or public.es_admin());

create policy "clienta_crea_su_turno"
  on public.turnos for insert
  with check (auth.uid() = cliente_id);

create policy "solo_admin_cancela"
  on public.turnos for update
  using (public.es_admin())
  with check (public.es_admin());
