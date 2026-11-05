import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { iso, sumarMeses, ultimoDiaDelMes } from "@/lib/calendario";
import Turnero, { type CategoriaDB, type HorariosSemana, type Ocupado, type RetiroDB } from "./turnero";

export default async function TurnosPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");

  const supabase = await createClient();

  // El calendario deja elegir este mes y el que sigue, así que traemos los
  // ocupados hasta el último día de ese segundo mes.
  const hoy = new Date();
  const siguiente = sumarMeses(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const hastaISO = ultimoDiaDelMes(siguiente.anio, siguiente.mes);

  const [categoriasRes, serviciosRes, retirosRes, horariosRes, ocupadosRes] = await Promise.all([
    supabase.from("categorias_servicio").select("id, nombre, nota, sin_retiro").order("orden"),
    supabase.from("servicios").select("id, categoria_id, nombre, precio, duracion_min").order("orden"),
    supabase.from("retiros").select("id, nombre, precio, duracion_min"),
    supabase.from("horarios").select("dia_semana, hora_inicio, hora_fin"),
    supabase.rpc("horarios_ocupados", { desde: iso(hoy), hasta: hastaISO }),
  ]);

  const servicios = serviciosRes.data ?? [];
  const categorias: CategoriaDB[] = (categoriasRes.data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    nota: c.nota,
    sinRetiro: c.sin_retiro,
    items: servicios
      .filter((s) => s.categoria_id === c.id)
      .map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracionMin: s.duracion_min })),
  }));

  const retiros: RetiroDB[] = (retirosRes.data ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    precio: r.precio,
    duracionMin: r.duracion_min,
  }));

  const horarios: HorariosSemana = {};
  for (const h of horariosRes.data ?? []) {
    horarios[h.dia_semana] = h.hora_inicio && h.hora_fin ? [h.hora_inicio.slice(0, 5), h.hora_fin.slice(0, 5)] : null;
  }

  const ocupados: Ocupado[] = (ocupadosRes.data ?? []).map(
    (o: { fecha: string; hora_inicio: string; duracion_min: number }) => [
      `${o.fecha} ${o.hora_inicio.slice(0, 5)}`,
      o.duracion_min,
    ],
  );

  return (
    <Turnero
      nombre={usuario.nombre}
      telefono={usuario.telefono ?? ""}
      categorias={categorias}
      retiros={retiros}
      horarios={horarios}
      ocupados={ocupados}
    />
  );
}
