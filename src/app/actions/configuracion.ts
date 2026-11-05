"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";

export type EstadoConfig = { error?: string; ok?: boolean } | undefined;

export async function guardarHorarios(_prevState: EstadoConfig, formData: FormData): Promise<EstadoConfig> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const filas: { dia_semana: number; hora_inicio: string | null; hora_fin: string | null }[] = [];
  for (let dia = 0; dia <= 6; dia++) {
    const abierto = formData.get(`abierto_${dia}`) === "on";
    if (!abierto) {
      filas.push({ dia_semana: dia, hora_inicio: null, hora_fin: null });
      continue;
    }
    const inicio = String(formData.get(`inicio_${dia}`) ?? "");
    const fin = String(formData.get(`fin_${dia}`) ?? "");
    if (!inicio || !fin || inicio >= fin) {
      return { error: "Revisá los horarios: el de cierre tiene que ser después del de apertura." };
    }
    filas.push({ dia_semana: dia, hora_inicio: inicio, hora_fin: fin });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("horarios").upsert(filas, { onConflict: "dia_semana" });
  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/admin/configuracion");
  return { ok: true };
}

export async function guardarServicios(_prevState: EstadoConfig, formData: FormData): Promise<EstadoConfig> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const ids = new Set<number>();
  for (const key of formData.keys()) {
    const m = /^precio_(\d+)$/.exec(key);
    if (m) ids.add(Number(m[1]));
  }

  const actualizaciones: { id: number; precio: number; duracionMin: number }[] = [];
  for (const id of ids) {
    const precio = Number(formData.get(`precio_${id}`));
    const duracionMin = Number(formData.get(`duracion_${id}`));
    if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(duracionMin) || duracionMin <= 0) {
      return { error: "Revisá que todos los precios y duraciones sean números mayores a 0." };
    }
    actualizaciones.push({ id, precio, duracionMin });
  }

  const supabase = await createClient();
  const resultados = await Promise.all(
    actualizaciones.map((a) =>
      supabase.from("servicios").update({ precio: a.precio, duracion_min: a.duracionMin }).eq("id", a.id),
    ),
  );
  if (resultados.some((r) => r.error)) return { error: "No se pudo guardar alguno de los cambios. Probá de nuevo." };

  revalidatePath("/admin/configuracion");
  return { ok: true };
}
