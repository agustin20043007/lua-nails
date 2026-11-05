"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";

export type EstadoTurno = { error?: string; ok?: boolean } | undefined;

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export async function crearTurno(_prevState: EstadoTurno, formData: FormData): Promise<EstadoTurno> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Volvé a iniciar sesión." };

  const servicioId = Number(formData.get("servicioId"));
  const retiroIdRaw = String(formData.get("retiroId") ?? "");
  const retiroId = retiroIdRaw ? Number(retiroIdRaw) : null;
  const fecha = String(formData.get("fecha") ?? "");
  const horaInicioMin = Number(formData.get("horaInicio"));
  const duracionMin = Number(formData.get("duracionMin"));
  const precioTotal = Number(formData.get("precioTotal"));
  const nota = String(formData.get("nota") ?? "").trim();

  if (!servicioId || !fecha || !duracionMin || !precioTotal || Number.isNaN(horaInicioMin)) {
    return { error: "Faltan datos del turno. Volvé a elegir el servicio y el horario." };
  }

  const supabase = await createClient();

  // Revalidamos que el horario siga libre: alguien pudo reservarlo justo
  // mientras esta clienta completaba el formulario.
  const { data: ocupados } = await supabase.rpc("horarios_ocupados", { desde: fecha, hasta: fecha });
  const choca = (ocupados ?? []).some((o: { hora_inicio: string; duracion_min: number }) => {
    const inicio = aMin(o.hora_inicio.slice(0, 5));
    const fin = inicio + o.duracion_min;
    return horaInicioMin < fin && horaInicioMin + duracionMin > inicio;
  });
  if (choca) return { error: "Justo se ocupó ese horario. Elegí otro, por favor." };

  const horaInicioStr =
    String(Math.floor(horaInicioMin / 60)).padStart(2, "0") + ":" + String(horaInicioMin % 60).padStart(2, "0");

  const { error } = await supabase.from("turnos").insert({
    cliente_id: usuario.id,
    servicio_id: servicioId,
    retiro_id: retiroId,
    fecha,
    hora_inicio: horaInicioStr,
    duracion_min: duracionMin,
    precio_total: precioTotal,
    nombre: usuario.nombre,
    telefono: usuario.telefono ?? "",
    nota: nota || null,
  });

  if (error) return { error: "No se pudo guardar el turno. Probá de nuevo." };

  return { ok: true };
}
