import "server-only";

import { createClient } from "@/lib/supabase/server";

export type UsuarioActual = {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  rol: "clienta" | "admin";
};

export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre, telefono, rol")
    .eq("id", auth.user.id)
    .single();

  if (!perfil) {
    // El trigger que crea el perfil al registrarse no corrió (o todavía no
    // se instaló en la base): lo creamos ahora para no dejar a la cuenta
    // sin acceso. Usa los mismos datos que mandó el formulario de registro.
    const metadata = auth.user.user_metadata as { nombre?: string; telefono?: string };
    const { data: perfilCreado } = await supabase
      .from("profiles")
      .insert({ id: auth.user.id, nombre: metadata.nombre ?? "", telefono: metadata.telefono ?? null })
      .select("nombre, telefono, rol")
      .single();

    if (!perfilCreado) return null;

    return {
      id: auth.user.id,
      email: auth.user.email ?? "",
      nombre: perfilCreado.nombre,
      telefono: perfilCreado.telefono,
      rol: perfilCreado.rol,
    };
  }

  return {
    id: auth.user.id,
    email: auth.user.email ?? "",
    nombre: perfil.nombre,
    telefono: perfil.telefono,
    rol: perfil.rol,
  };
}
