import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NOMBRES_MES, iso, primerDiaDelMes, sumarMeses, ultimoDiaDelMes } from "@/lib/calendario";

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plata = (n: number) => "$" + n.toLocaleString("es-AR");
const sumarPrecios = (filas: { precio_total: number }[] | null) =>
  (filas ?? []).reduce((acc, f) => acc + f.precio_total, 0);

export default async function GananciasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
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

  // Solo cuentan los turnos ya realizados: si el mes mostrado es el actual,
  // el corte es hoy (no sumamos turnos de días que todavía no llegaron).
  const finDeMes = ultimoDiaDelMes(anio, mes);
  const hastaMes = finDeMes < hoyISO ? finDeMes : hoyISO;

  const supabase = await createClient();
  const [{ data: turnosHoy }, { data: turnosMes }] = await Promise.all([
    supabase.from("turnos").select("precio_total").eq("estado", "confirmado").eq("fecha", hoyISO),
    supabase
      .from("turnos")
      .select("precio_total")
      .eq("estado", "confirmado")
      .gte("fecha", primerDiaDelMes(anio, mes))
      .lte("fecha", hastaMes),
  ]);

  const gananciaHoy = sumarPrecios(turnosHoy);
  const cantidadHoy = turnosHoy?.length ?? 0;
  const gananciaMes = sumarPrecios(turnosMes);
  const cantidadMes = turnosMes?.length ?? 0;
  const esMesActual = hastaMes === hoyISO;

  return (
    <div>
      <h1>Ganancias</h1>
      <p className="ln-admin-sub">Suma de los turnos confirmados (no incluye cancelados)</p>

      <div className="ln-admin-ganancia-card">
        <div className="ln-admin-ganancia-label">Hoy</div>
        <div className="ln-admin-ganancia-monto">{plata(gananciaHoy)}</div>
        <div className="ln-admin-ganancia-detalle">
          {cantidadHoy} turno{cantidadHoy === 1 ? "" : "s"}
        </div>
      </div>

      <div className="ln-admin-ganancia-card">
        <div className="ln-admin-cal-header">
          <Link
            href={`/admin/ganancias?mes=${anterior.anio}-${String(anterior.mes).padStart(2, "0")}`}
            className="ln-admin-cal-nav"
            aria-label="Mes anterior"
          >
            ‹
          </Link>
          <div className="ln-admin-cal-mes-label">
            {capitalizar(NOMBRES_MES[mes - 1])} {anio}
          </div>
          <Link
            href={`/admin/ganancias?mes=${siguiente.anio}-${String(siguiente.mes).padStart(2, "0")}`}
            className="ln-admin-cal-nav"
            aria-label="Mes siguiente"
          >
            ›
          </Link>
        </div>
        <div className="ln-admin-ganancia-monto">{plata(gananciaMes)}</div>
        <div className="ln-admin-ganancia-detalle">
          {cantidadMes} turno{cantidadMes === 1 ? "" : "s"}
          {esMesActual ? " · hasta hoy" : ""}
        </div>
      </div>
    </div>
  );
}
