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

  if (!perfil) return null;

  return {
    id: auth.user.id,
    email: auth.user.email ?? "",
    nombre: perfil.nombre,
    telefono: perfil.telefono,
    rol: perfil.rol,
  };
}
