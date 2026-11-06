-- Lua Nails · categoría nueva "Pestañas y cejas" (lifting, laminado,
-- perfilado) más las 4 promos combinadas de los flyers. sin_retiro = true
-- porque "¿venís con las uñas puestas?" no aplica a estos servicios.
-- Duraciones de las promos = suma de los servicios que incluyen.
-- Correr en Supabase > SQL Editor, después de los archivos anteriores.

insert into public.categorias_servicio (nombre, nota, sin_retiro, orden) values
  ('Pestañas y cejas', 'Lifting y laminado incluyen, opcional, tinte negro/marrón y botox.', true, 7);

insert into public.servicios (categoria_id, nombre, precio, duracion_min, orden)
select (select id from public.categorias_servicio where nombre = 'Pestañas y cejas'), s.nombre, s.precio, s.duracion_min, s.orden
from (values
  ('Lifting de pestañas', 20000, 60, 1),
  ('Laminado de cejas', 13000, 45, 2),
  ('Perfilado de cejas', 9000, 20, 3),
  ('Perfilado + laminado de cejas', 21000, 65, 4),
  ('Lifting de pestañas + perfilado de cejas', 27000, 80, 5),
  ('Lifting de pestañas + laminado de cejas', 34000, 105, 6),
  ('Lifting de pestañas + laminado + perfilado de cejas', 41000, 125, 7)
) as s(nombre, precio, duracion_min, orden);
