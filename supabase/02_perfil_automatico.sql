-- Lua Nails · perfil automático al registrarse
-- Correr en Supabase > SQL Editor, después de schema.sql y seed.sql.
--
-- Cuando alguien se registra (supabase.auth.signUp), esto crea su fila en
-- public.profiles automáticamente usando el nombre/teléfono que mandamos en
-- options.data. security definer hace que el trigger pueda escribir aunque
-- todavía no haya sesión activa (ej. mientras espera confirmar el email).

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    new.raw_user_meta_data ->> 'telefono'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
