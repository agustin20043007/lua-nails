"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";

export type EstadoPerfil = { error?: string; ok?: boolean } | undefined;

export async function actualizarDatos(_prevState: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Volvé a iniciar sesión." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (nombre.length < 2) return { error: "Escribí tu nombre y apellido." };
  if (telefono.replace(/\D/g, "").length < 10) return { error: "Revisá el número de WhatsApp (código de área + número)." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ nombre, telefono }).eq("id", usuario.id);
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/configuracion");
  revalidatePath("/turnos");
  revalidatePath("/mis-turnos");
  return { ok: true };
}

export async function cambiarContrasena(_prevState: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Volvé a iniciar sesión." };

  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (password.length < 6) return { error: "La contraseña tiene que tener al menos 6 caracteres." };
  if (password !== password2) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo cambiar la contraseña. Probá de nuevo." };

  return { ok: true };
}
