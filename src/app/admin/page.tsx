import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/actions/auth";
import Agenda, { type TurnoAgenda } from "./agenda";
import "./admin.css";

const DIAS_A_MOSTRAR = 7;

const iso = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

type FilaTurnoDB = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_min: number;
  precio_total: number;
  nombre: string;
  telefono: string;
  nota: string | null;
  estado: "confirmado" | "cancelado";
  servicio: { nombre: string; categoria: { nombre: string } | null } | null;
  retiro: { nombre: string } | null;
};

export default async function AdminPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "admin") redirect("/turnos");

  const supabase = await createClient();

  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + (DIAS_A_MOSTRAR - 1));

  const hoyISO = iso(hoy);
  const dias = Array.from({ length: DIAS_A_MOSTRAR }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    return iso(d);
  });

  const { data } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, duracion_min, precio_total, nombre, telefono, nota, estado, servicio:servicios(nombre, categoria:categorias_servicio(nombre)), retiro:retiros(nombre)",
    )
    .gte("fecha", hoyISO)
    .lte("fecha", iso(limite))
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  const filas = (data ?? []) as unknown as FilaTurnoDB[];

  const turnos: TurnoAgenda[] = filas.map((t) => {
    const catNombre = t.servicio?.categoria?.nombre ?? "";
    const servNombre = t.servicio?.nombre ?? "Servicio";
    let servicioNombre =
      catNombre && catNombre !== "Estética de manos" && catNombre !== "Retiro" ? `${catNombre} · ${servNombre}` : servNombre;
    if (t.retiro) servicioNombre += ` + retiro de ${t.retiro.nombre}`;

    return {
      id: t.id,
      fecha: t.fecha,
      horaInicio: aMin(t.hora_inicio.slice(0, 5)),
      duracionMin: t.duracion_min,
      precioTotal: t.precio_total,
      nombreCliente: t.nombre,
      telefono: t.telefono,
      nota: t.nota,
      estado: t.estado,
      servicioNombre,
    };
  });

  return (
    <div className="ln-admin">
      <div className="ln-admin-wrap">
        <div className="ln-admin-header">
          <h1>Agenda</h1>
          <div className="ln-admin-cuenta">
            Hola, {usuario.nombre.split(" ")[0]} ·{" "}
            <form action={cerrarSesion} style={{ display: "inline" }}>
              <button type="submit">Cerrar sesión</button>
            </form>
          </div>
        </div>
        <p className="ln-admin-sub">Lua Nails · Panel de turnos</p>

        <Agenda turnos={turnos} dias={dias} hoyISO={hoyISO} />
      </div>
    </div>
  );
}
