import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/actions/auth";
import { NOMBRES_MES, iso, primerDiaDelMes, sumarMeses, ultimoDiaDelMes } from "@/lib/calendario";
import Calendario, { type TurnoAgenda } from "./agenda";
import "./admin.css";

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "admin") redirect("/turnos");

  const hoy = new Date();
  const hoyISO = iso(hoy);

  const { mes: mesParam } = await searchParams;
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth() + 1;
  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [a, m] = mesParam.split("-").map(Number);
    anio = a;
    mes = m;
  }

  const anterior = sumarMeses(anio, mes, -1);
  const siguiente = sumarMeses(anio, mes, 1);

  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, duracion_min, precio_total, nombre, telefono, nota, estado, servicio:servicios(nombre, categoria:categorias_servicio(nombre)), retiro:retiros(nombre)",
    )
    .gte("fecha", primerDiaDelMes(anio, mes))
    .lte("fecha", ultimoDiaDelMes(anio, mes))
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

        <Calendario
          key={`${anio}-${mes}`}
          turnos={turnos}
          anio={anio}
          mes={mes}
          mesLabel={`${capitalizar(NOMBRES_MES[mes - 1])} ${anio}`}
          hoyISO={hoyISO}
          mesAnteriorHref={`/admin?mes=${anterior.anio}-${String(anterior.mes).padStart(2, "0")}`}
          mesSiguienteHref={`/admin?mes=${siguiente.anio}-${String(siguiente.mes).padStart(2, "0")}`}
        />
      </div>
    </div>
  );
}
