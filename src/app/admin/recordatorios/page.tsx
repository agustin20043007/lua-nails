import { createClient } from "@/lib/supabase/server";
import { iso } from "@/lib/calendario";
import Recordatorios, { type TurnoRecordatorio } from "./recordatorios";

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SIN_PREFIJO = ["Estética de manos", "Retiro", "Pestañas y cejas"];

type FilaTurnoDB = {
  id: string;
  hora_inicio: string;
  nombre: string;
  telefono: string;
  servicio: { nombre: string; categoria: { nombre: string } | null } | null;
};

export default async function RecordatoriosPage() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  const mananaISO = iso(manana);

  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select("id, hora_inicio, nombre, telefono, servicio:servicios(nombre, categoria:categorias_servicio(nombre))")
    .eq("fecha", mananaISO)
    .eq("estado", "confirmado")
    .order("hora_inicio", { ascending: true });

  const filas = (data ?? []) as unknown as FilaTurnoDB[];
  const turnos: TurnoRecordatorio[] = filas.map((t) => {
    const catNombre = t.servicio?.categoria?.nombre ?? "";
    const servNombre = t.servicio?.nombre ?? "su turno";
    const servicioNombre = catNombre && !SIN_PREFIJO.includes(catNombre) ? `${catNombre} · ${servNombre}` : servNombre;
    return {
      id: t.id,
      horaInicio: t.hora_inicio.slice(0, 5),
      nombreCliente: t.nombre,
      telefono: t.telefono,
      servicioNombre,
    };
  });

  const fechaLarga = capitalizar(
    new Date(`${mananaISO}T12:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }),
  );

  return (
    <div>
      <h1>Recordatorios</h1>
      <p className="ln-admin-sub">Turnos de mañana, {fechaLarga}</p>
      <Recordatorios turnos={turnos} fechaLarga={fechaLarga} />
    </div>
  );
}
