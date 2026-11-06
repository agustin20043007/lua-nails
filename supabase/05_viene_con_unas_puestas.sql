-- Lua Nails · pregunta informativa "¿venís con las uñas puestas?"
-- Reemplaza el upsell pago de retiro en la reserva online: ahora es
-- obligatorio responder (para los servicios que lo piden) pero no suma
-- precio ni duración, es solo un dato para la manicura. El retiro pago
-- sigue existiendo como servicio propio (categoría "Retiro"), por si se
-- cobra en el local. Correr en Supabase > SQL Editor, después de los
-- archivos anteriores.

alter table public.turnos
  add column viene_con_unas_puestas boolean;
