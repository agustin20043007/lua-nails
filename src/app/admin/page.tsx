import { createClient } from "@/lib/supabase/server";
import { NOMBRES_MES, iso, primerDiaDelMes, sumarMeses, ultimoDiaDelMes } from "@/lib/calendario";
import Calendario, { type CategoriaCatalogo, type TurnoAgenda } from "./agenda";

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
  servicio_id: number;
  servicio: { nombre: string; categoria: { nombre: string } | null } | null;
  retiro: { nombre: string } | null;
  viene_con_unas_puestas: boolean | null;
};

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
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
  const [{ data }, categoriasRes, serviciosRes] = await Promise.all([
    supabase
      .from("turnos")
      .select(
        "id, fecha, hora_inicio, duracion_min, precio_total, nombre, telefono, nota, estado, servicio_id, viene_con_unas_puestas, servicio:servicios(nombre, categoria:categorias_servicio(nombre)), retiro:retiros(nombre)",
      )
      .gte("fecha", primerDiaDelMes(anio, mes))
      .lte("fecha", ultimoDiaDelMes(anio, mes))
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true }),
    supabase.from("categorias_servicio").select("id, nombre").order("orden"),
    supabase.from("servicios").select("id, categoria_id, nombre, precio, duracion_min").order("orden"),
  ]);

  const filas = (data ?? []) as unknown as FilaTurnoDB[];

  const servicios = serviciosRes.data ?? [];
  const categorias: CategoriaCatalogo[] = (categoriasRes.data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    servicios: servicios
      .filter((s) => s.categoria_id === c.id)
      .map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracionMin: s.duracion_min })),
  }));

  const turnos: TurnoAgenda[] = filas.map((t) => {
    const catNombre = t.servicio?.categoria?.nombre ?? "";
    const servNombre = t.servicio?.nombre ?? "Servicio";
    const sinPrefijo = ["Estética de manos", "Retiro", "Pestañas y cejas"];
    let servicioNombre = catNombre && !sinPrefijo.includes(catNombre) ? `${catNombre} · ${servNombre}` : servNombre;
    if (t.retiro) servicioNombre += ` + retiro de ${t.retiro.nombre}`;
    if (t.viene_con_unas_puestas) servicioNombre += " · viene con las uñas puestas";

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
      servicioId: t.servicio_id,
    };
  });

  return (
    <div>
      <h1>Agenda</h1>
      <p className="ln-admin-sub">Turnos del mes</p>

      <Calendario
        key={`${anio}-${mes}`}
        turnos={turnos}
        categorias={categorias}
        anio={anio}
        mes={mes}
        mesLabel={`${capitalizar(NOMBRES_MES[mes - 1])} ${anio}`}
        hoyISO={hoyISO}
        mesAnteriorHref={`/admin?mes=${anterior.anio}-${String(anterior.mes).padStart(2, "0")}`}
        mesSiguienteHref={`/admin?mes=${siguiente.anio}-${String(siguiente.mes).padStart(2, "0")}`}
      />
    </div>
  );
}
