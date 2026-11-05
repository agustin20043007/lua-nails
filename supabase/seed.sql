-- Lua Nails · carga inicial del catálogo
-- Correr después de schema.sql. Son los mismos datos que hoy están
-- harcodeados en src/app/page.tsx (SERVICIOS, RETIROS, HORARIOS).

insert into public.categorias_servicio (nombre, nota, sin_retiro, orden) values
  ('Semipermanente', null, false, 1),
  ('Capping', null, false, 2),
  ('Soft gel', 'Retoque: mismos valores que capping.', false, 3),
  ('Estética de manos', 'Limado de uñas, retiro de cutícula y durezas e hidratación de la piel.', true, 4),
  ('Pies', null, false, 5),
  ('Retiro', null, true, 6);

insert into public.servicios (categoria_id, nombre, precio, duracion_min, orden)
select c.id, s.nombre, s.precio, s.duracion_min, s.orden
from (values
  ('Semipermanente', 'Liso', 14500, 60, 1),
  ('Semipermanente', 'Diseño en dos uñas', 15500, 75, 2),
  ('Semipermanente', 'Full diseño / francesa', 16000, 90, 3),
  ('Semipermanente', 'Full diseño + relieves', 17000, 105, 4),

  ('Capping', 'Transparente / neutral glitter (sin esmalte)', 15000, 75, 1),
  ('Capping', 'Liso', 18000, 90, 2),
  ('Capping', 'Diseño en dos uñas', 19000, 105, 3),
  ('Capping', 'Full diseño / francesa', 20000, 120, 4),
  ('Capping', 'Full diseño + relieves', 22000, 120, 5),

  ('Soft gel', 'Liso', 19000, 120, 1),
  ('Soft gel', 'Diseño en dos uñas', 20000, 120, 2),
  ('Soft gel', 'Full diseño / francesa', 21000, 135, 3),
  ('Soft gel', 'Full diseño + relieves', 23000, 150, 4),

  ('Estética de manos', 'Estética de manos', 9000, 45, 1),
  ('Estética de manos', 'Estética de manos + retiro', 10000, 60, 2),

  ('Pies', 'Semipermanente liso', 16000, 60, 1),
  ('Pies', 'Semipermanente diseño', 17000, 75, 2),
  ('Pies', 'Tradicional', 13000, 60, 3),

  ('Retiro', 'Retiro de semipermanente', 5000, 30, 1),
  ('Retiro', 'Retiro de capping / soft gel', 6000, 30, 2)
) as s(categoria, nombre, precio, duracion_min, orden)
join public.categorias_servicio c on c.nombre = s.categoria;

insert into public.retiros (nombre, precio, duracion_min) values
  ('semipermanente', 5000, 30),
  ('capping / soft gel', 6000, 30);

insert into public.horarios (dia_semana, hora_inicio, hora_fin) values
  (0, null, null),
  (1, '09:00', '19:00'),
  (2, '09:00', '19:00'),
  (3, '09:00', '19:00'),
  (4, '09:00', '19:00'),
  (5, '09:00', '19:00'),
  (6, '09:00', '14:00');
