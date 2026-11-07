"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { normalizarWhatsApp } from "@/lib/telefono";

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

export type EstadoDiaCerrado = { error?: string } | undefined;

export async function alternarDiaCerrado(
  _prevState: EstadoDiaCerrado,
  formData: FormData,
): Promise<EstadoDiaCerrado> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const fecha = String(formData.get("fecha") ?? "");
  const cerradoActual = formData.get("cerradoActual") === "true";
  if (!fecha) return { error: "Falta la fecha." };

  const supabase = await createClient();
  const { error } = cerradoActual
    ? await supabase.from("dias_cerrados").delete().eq("fecha", fecha)
    : await supabase.from("dias_cerrados").insert({ fecha });

  if (error) {
    return { error: cerradoActual ? "No se pudo reabrir el día. Probá de nuevo." : "No se pudo cerrar el día. Probá de nuevo." };
  }

  revalidatePath("/admin");
  revalidatePath("/turnos");
  return undefined;
}

export type EstadoTurnoAdmin = { error?: string; ok?: boolean } | undefined;

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function datosTurnoDesdeForm(formData: FormData) {
  const servicioId = Number(formData.get("servicioId"));
  const fecha = String(formData.get("fecha") ?? "");
  const horaInicio = String(formData.get("horaInicio") ?? "");
  const duracionMin = Number(formData.get("duracionMin"));
  const precioTotal = Number(formData.get("precioTotal"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const nota = String(formData.get("nota") ?? "").trim();
  return { servicioId, fecha, horaInicio, duracionMin, precioTotal, nombre, telefono, nota };
}

async function hayChoqueDeHorario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fecha: string,
  horaInicioMin: number,
  duracionMin: number,
  excluirTurnoId?: string,
) {
  let consulta = supabase
    .from("turnos")
    .select("id, hora_inicio, duracion_min")
    .eq("fecha", fecha)
    .eq("estado", "confirmado");
  if (excluirTurnoId) consulta = consulta.neq("id", excluirTurnoId);
  const { data } = await consulta;

  return (data ?? []).some((t: { hora_inicio: string; duracion_min: number }) => {
    const inicio = aMin(t.hora_inicio.slice(0, 5));
    const fin = inicio + t.duracion_min;
    return horaInicioMin < fin && horaInicioMin + duracionMin > inicio;
  });
}

export async function crearTurnoAdmin(_prevState: EstadoTurnoAdmin, formData: FormData): Promise<EstadoTurnoAdmin> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const { servicioId, fecha, horaInicio, duracionMin, precioTotal, nombre, telefono, nota } =
    datosTurnoDesdeForm(formData);
  if (!servicioId || !fecha || !horaInicio || !duracionMin || !precioTotal || !nombre || !telefono) {
    return { error: "Completá servicio, día, hora, nombre y WhatsApp." };
  }
  if (!normalizarWhatsApp(telefono)) {
    return { error: "Revisá el número de WhatsApp: código de área + número, sin el 0 ni el 15 (ej: 341 555 1234)." };
  }

  const horaInicioMin = aMin(horaInicio);
  const supabase = await createClient();

  if (await hayChoqueDeHorario(supabase, fecha, horaInicioMin, duracionMin)) {
    return { error: "Ese horario ya está ocupado por otro turno." };
  }

  const { error } = await supabase.from("turnos").insert({
    cliente_id: null,
    servicio_id: servicioId,
    fecha,
    hora_inicio: horaInicio,
    duracion_min: duracionMin,
    precio_total: precioTotal,
    nombre,
    telefono,
    nota: nota || null,
  });

  if (error) return { error: "No se pudo guardar el turno. Probá de nuevo." };

  revalidatePath("/admin");
  return { ok: true };
}

export async function actualizarTurnoAdmin(
  _prevState: EstadoTurnoAdmin,
  formData: FormData,
): Promise<EstadoTurnoAdmin> {
  const usuario = await getUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return { error: "No tenés permiso para hacer esto." };

  const turnoId = String(formData.get("turnoId") ?? "");
  if (!turnoId) return { error: "Falta el turno a modificar." };

  const { servicioId, fecha, horaInicio, duracionMin, precioTotal, nombre, telefono, nota } =
    datosTurnoDesdeForm(formData);
  if (!servicioId || !fecha || !horaInicio || !duracionMin || !precioTotal || !nombre || !telefono) {
    return { error: "Completá servicio, día, hora, nombre y WhatsApp." };
  }
  if (!normalizarWhatsApp(telefono)) {
    return { error: "Revisá el número de WhatsApp: código de área + número, sin el 0 ni el 15 (ej: 341 555 1234)." };
  }

  const horaInicioMin = aMin(horaInicio);
  const supabase = await createClient();

  if (await hayChoqueDeHorario(supabase, fecha, horaInicioMin, duracionMin, turnoId)) {
    return { error: "Ese horario ya está ocupado por otro turno." };
  }

  const { error } = await supabase
    .from("turnos")
    .update({
      servicio_id: servicioId,
      fecha,
      hora_inicio: horaInicio,
      duracion_min: duracionMin,
      precio_total: precioTotal,
      nombre,
      telefono,
      nota: nota || null,
    })
    .eq("id", turnoId);

  if (error) return { error: "No se pudo guardar el turno. Probá de nuevo." };

  revalidatePath("/admin");
  return { ok: true };
}
