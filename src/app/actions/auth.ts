"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";

export type EstadoAuth = { error?: string; mensaje?: string } | undefined;

async function obtenerOrigen() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function traducirError(mensaje: string): string {
  if (mensaje.includes("already registered")) return "Ese email ya está registrado. Probá iniciar sesión.";
  if (mensaje.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (mensaje.includes("Email not confirmed")) return "Confirmá tu email (te mandamos un link) antes de iniciar sesión.";
  if (mensaje.includes("Password should be")) return "La contraseña tiene que tener al menos 6 caracteres.";
  return "Algo salió mal. Probá de nuevo en un momento.";
}

export async function registrarse(_prevState: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (nombre.length < 2) return { error: "Escribí tu nombre y apellido." };
  if (telefono.replace(/\D/g, "").length < 10) return { error: "Revisá el número de WhatsApp (código de área + número)." };
  if (!email.includes("@")) return { error: "Revisá el email." };
  if (password.length < 6) return { error: "La contraseña tiene que tener al menos 6 caracteres." };
  if (password !== password2) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, telefono } },
  });

  if (error) {
    console.error("Error en registrarse (signUp):", error.message, error.status, error.code);
    return { error: traducirError(error.message) };
  }

  if (data.session) {
    redirect("/turnos");
  }

  return { mensaje: "Te mandamos un mail para confirmar la cuenta. Abrilo y después iniciá sesión." };
}

export async function iniciarSesion(_prevState: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá el email y la contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traducirError(error.message) };

  const usuario = await getUsuarioActual();
  redirect(usuario?.rol === "admin" ? "/admin" : "/turnos");
}

export async function solicitarRecuperacion(_prevState: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Revisá el email." };

  const supabase = await createClient();
  const origen = await obtenerOrigen();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/auth/confirm?next=/restablecer`,
  });

  if (error) {
    console.error("Error en solicitarRecuperacion (resetPasswordForEmail):", error.message, error.status);
  }

  // Siempre el mismo mensaje, exista o no ese email: así no se puede usar
  // este formulario para averiguar qué emails están registrados.
  return { mensaje: "Si ese email está registrado, te mandamos un link para restablecer la contraseña. Revisá tu casilla (y la de spam)." };
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
