"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";

export type EstadoCancelar = { error?: string } | undefined;

export async function cancelarTurno(_prevState: EstadoCancelar, formData: FormData): Promise<EstadoCancelar> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const turnoId = String(formData.get("turnoId") ?? "");
  if (!turnoId) return { error: "Falta el turno a cancelar." };

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").update({ estado: "cancelado" }).eq("id", turnoId);

  if (error) return { error: "No se pudo cancelar el turno. Probá de nuevo." };

  revalidatePath("/admin");
  return undefined;
}
