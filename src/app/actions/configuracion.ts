"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";

export type EstadoConfig = { error?: string; ok?: boolean } | undefined;

export async function guardarHorarios(_prevState: EstadoConfig, formData: FormData): Promise<EstadoConfig> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const filas: { dia_semana: number; tramo: number; hora_inicio: string; hora_fin: string }[] = [];
  for (let dia = 0; dia <= 6; dia++) {
    const abierto = formData.get(`abierto_${dia}`) === "on";
    if (!abierto) continue;

    const tramos: { inicio: string; fin: string }[] = [];
    for (let i = 0; formData.has(`inicio_${dia}_${i}`); i++) {
      const inicio = String(formData.get(`inicio_${dia}_${i}`) ?? "");
      const fin = String(formData.get(`fin_${dia}_${i}`) ?? "");
      if (!inicio || !fin || inicio >= fin) {
        return { error: "Revisá los horarios: el de cierre tiene que ser después del de apertura." };
      }
      tramos.push({ inicio, fin });
    }
    if (tramos.length === 0) {
      return { error: "Agregá al menos una franja horaria para los días abiertos." };
    }

    tramos.sort((a, b) => a.inicio.localeCompare(b.inicio));
    for (let i = 0; i < tramos.length; i++) {
      if (i > 0 && tramos[i].inicio < tramos[i - 1].fin) {
        return { error: "Las franjas horarias de un mismo día no pueden superponerse." };
      }
      filas.push({ dia_semana: dia, tramo: i + 1, hora_inicio: tramos[i].inicio, hora_fin: tramos[i].fin });
    }
  }

  const supabase = await createClient();
  const { error: errorBorrado } = await supabase.from("horarios").delete().gte("dia_semana", 0);
  if (errorBorrado) return { error: "No se pudo guardar. Probá de nuevo." };
  if (filas.length > 0) {
    const { error } = await supabase.from("horarios").insert(filas);
    if (error) return { error: "No se pudo guardar. Probá de nuevo." };
  }

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
