import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MenuCliente from "@/app/menu-cliente";
import { iso } from "@/lib/calendario";
import "./mis-turnos.css";

const plata = (n: number) => "$" + n.toLocaleString("es-AR");
const aHora = (hhmm: string) => hhmm.slice(0, 5);
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type FilaTurnoDB = {
  id: string;
  fecha: string;
  hora_inicio: string;
  precio_total: number;
  nota: string | null;
  estado: "confirmado" | "cancelado";
  servicio: { nombre: string; categoria: { nombre: string } | null } | null;
  retiro: { nombre: string } | null;
};

type Turno = {
  id: string;
  fecha: string;
  hora: string;
  precioTotal: number;
  nota: string | null;
  estado: "confirmado" | "cancelado";
  servicioNombre: string;
};

export default async function MisTurnosPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");

  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora_inicio, precio_total, nota, estado, servicio:servicios(nombre, categoria:categorias_servicio(nombre)), retiro:retiros(nombre)",
    )
    .eq("cliente_id", usuario.id)
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false });

  const hoyISO = iso(new Date());

  const turnos: Turno[] = ((data ?? []) as unknown as FilaTurnoDB[]).map((t) => {
    const catNombre = t.servicio?.categoria?.nombre ?? "";
    const servNombre = t.servicio?.nombre ?? "Servicio";
    const sinPrefijo = ["Estética de manos", "Retiro", "Pestañas y cejas"];
    let servicioNombre = catNombre && !sinPrefijo.includes(catNombre) ? `${catNombre} · ${servNombre}` : servNombre;
    if (t.retiro) servicioNombre += ` + retiro de ${t.retiro.nombre}`;

    return {
      id: t.id,
      fecha: t.fecha,
      hora: aHora(t.hora_inicio),
      precioTotal: t.precio_total,
      nota: t.nota,
      estado: t.estado,
      servicioNombre,
    };
  });

  const proximos = turnos.filter((t) => t.estado === "confirmado" && t.fecha >= hoyISO).reverse();
  const historial = turnos.filter((t) => t.estado === "cancelado" || t.fecha < hoyISO);

  return (
    <div className="ln-mt">
      <div className="ln-mt-wrap">
        <div className="ln-mt-topbar">
          <span className="ln-mt-marca">☾ Lua Nails</span>
          <MenuCliente nombre={usuario.nombre} />
        </div>

        <h1>Mis turnos</h1>
        <p className="ln-mt-sub">Hola, {usuario.nombre.split(" ")[0]}</p>

        <h2>Próximos turnos</h2>
        {proximos.length === 0 ? (
          <p className="ln-mt-vacio">No tenés turnos próximos. ¿Reservamos uno?</p>
        ) : (
          proximos.map((t) => <FilaTurno key={t.id} turno={t} />)
        )}

        <h2>Historial</h2>
        {historial.length === 0 ? (
          <p className="ln-mt-vacio">Todavía no tenés turnos anteriores.</p>
        ) : (
          historial.map((t) => <FilaTurno key={t.id} turno={t} />)
        )}
      </div>
    </div>
  );
}

function FilaTurno({ turno }: { turno: Turno }) {
  const d = new Date(`${turno.fecha}T12:00`);
  const diaMes = d.getDate();
  const mesCorto = capitalizar(d.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""));
  const cancelado = turno.estado === "cancelado";

  return (
    <div className={`ln-mt-turno ${cancelado ? "ln-mt-turno-cancelado" : ""}`}>
      <div className="ln-mt-turno-fecha">
        <strong>{diaMes}</strong>
        <span>{mesCorto}</span>
      </div>
      <div className="ln-mt-turno-info">
        <strong>{turno.servicioNombre}</strong>
        <div className="ln-mt-turno-detalle">{turno.hora} hs</div>
        {turno.nota && <div className="ln-mt-turno-nota">“{turno.nota}”</div>}
        {cancelado && <span className="ln-mt-badge">Cancelado</span>}
      </div>
      <div className="ln-mt-turno-precio">{plata(turno.precioTotal)}</div>
    </div>
  );
}
