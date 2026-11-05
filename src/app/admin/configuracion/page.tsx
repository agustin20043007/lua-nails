import { createClient } from "@/lib/supabase/server";
import EditorConfiguracion, { type CategoriaConfig, type HorarioDia } from "./editor";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  const [categoriasRes, serviciosRes, horariosRes] = await Promise.all([
    supabase.from("categorias_servicio").select("id, nombre").order("orden"),
    supabase.from("servicios").select("id, categoria_id, nombre, precio, duracion_min").order("orden"),
    supabase.from("horarios").select("dia_semana, hora_inicio, hora_fin").order("dia_semana"),
  ]);

  const servicios = serviciosRes.data ?? [];
  const categorias: CategoriaConfig[] = (categoriasRes.data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    servicios: servicios
      .filter((s) => s.categoria_id === c.id)
      .map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracionMin: s.duracion_min })),
  }));

  const porDia = new Map(
    (horariosRes.data ?? []).map((h) => [h.dia_semana, h] as const),
  );
  const horarios: HorarioDia[] = Array.from({ length: 7 }, (_, dia) => {
    const h = porDia.get(dia);
    return {
      dia,
      abierto: !!h?.hora_inicio && !!h?.hora_fin,
      inicio: h?.hora_inicio ? h.hora_inicio.slice(0, 5) : "09:00",
      fin: h?.hora_fin ? h.hora_fin.slice(0, 5) : "19:00",
    };
  });

  return (
    <div>
      <h1>Configuración</h1>
      <p className="ln-admin-sub">Horarios de atención y precios de los servicios</p>
      <EditorConfiguracion categorias={categorias} horarios={horarios} />
    </div>
  );
}
