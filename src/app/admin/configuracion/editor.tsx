"use client";

import { useActionState, useState } from "react";
import { guardarHorarios, guardarServicios, type EstadoConfig } from "@/app/actions/configuracion";

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = ["00", "15", "30", "45"];

export type ServicioConfig = { id: number; nombre: string; precio: number; duracionMin: number };
export type CategoriaConfig = { id: number; nombre: string; servicios: ServicioConfig[] };
export type Tramo = { inicio: string; fin: string };
export type HorarioDia = { dia: number; abierto: boolean; tramos: Tramo[] };

export default function EditorConfiguracion({
  categorias,
  horarios,
}: {
  categorias: CategoriaConfig[];
  horarios: HorarioDia[];
}) {
  return (
    <div>
      <SeccionHorarios horariosIniciales={horarios} />
      <SeccionServicios categorias={categorias} />
    </div>
  );
}

function SeccionHorarios({ horariosIniciales }: { horariosIniciales: HorarioDia[] }) {
  const [estado, guardar, guardando] = useActionState<EstadoConfig, FormData>(guardarHorarios, undefined);
  const [dias, setDias] = useState(horariosIniciales);

  function actualizar(dia: number, cambios: Partial<HorarioDia>) {
    setDias((prev) => prev.map((d) => (d.dia === dia ? { ...d, ...cambios } : d)));
  }

  function actualizarTramo(dia: number, idx: number, cambios: Partial<Tramo>) {
    setDias((prev) =>
      prev.map((d) =>
        d.dia === dia ? { ...d, tramos: d.tramos.map((t, i) => (i === idx ? { ...t, ...cambios } : t)) } : d,
      ),
    );
  }

  function agregarTramo(dia: number) {
    setDias((prev) =>
      prev.map((d) => (d.dia === dia ? { ...d, tramos: [...d.tramos, { inicio: "16:00", fin: "20:00" }] } : d)),
    );
  }

  function quitarTramo(dia: number, idx: number) {
    setDias((prev) =>
      prev.map((d) => (d.dia === dia ? { ...d, tramos: d.tramos.filter((_, i) => i !== idx) } : d)),
    );
  }

  return (
    <section className="ln-admin-config-sec">
      <h3>Horarios de atención</h3>
      <p className="ln-admin-sub">
        Para un día con corte (ej: mañana y tarde), agregá más de una franja horaria.
      </p>
      <form action={guardar}>
        {dias.map((d) => (
          <div key={d.dia} className="ln-admin-horario-fila">
            <label className="ln-admin-horario-check">
              <input
                type="checkbox"
                name={`abierto_${d.dia}`}
                checked={d.abierto}
                onChange={(e) => actualizar(d.dia, { abierto: e.target.checked })}
              />
              {NOMBRES_DIA[d.dia]}
            </label>
            {d.abierto ? (
              <div className="ln-admin-horario-tramos">
                {d.tramos.map((t, i) => (
                  <div key={i} className="ln-admin-horario-horas">
                    <SelectorHora
                      nombreCampo={`inicio_${d.dia}_${i}`}
                      valor={t.inicio}
                      onCambiar={(v) => actualizarTramo(d.dia, i, { inicio: v })}
                    />
                    <span>a</span>
                    <SelectorHora
                      nombreCampo={`fin_${d.dia}_${i}`}
                      valor={t.fin}
                      onCambiar={(v) => actualizarTramo(d.dia, i, { fin: v })}
                    />
                    {d.tramos.length > 1 && (
                      <button
                        type="button"
                        className="ln-admin-tramo-quitar"
                        onClick={() => quitarTramo(d.dia, i)}
                        aria-label="Quitar franja"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="ln-admin-tramo-agregar" onClick={() => agregarTramo(d.dia)}>
                  + Agregar franja horaria
                </button>
              </div>
            ) : (
              <span className="ln-admin-horario-cerrado">Cerrado</span>
            )}
          </div>
        ))}
        {estado?.error && <p className="ln-admin-error">{estado.error}</p>}
        {estado?.ok && <p className="ln-admin-ok">Guardado.</p>}
        <button type="submit" className="ln-admin-btn-guardar" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar horarios"}
        </button>
      </form>
    </section>
  );
}

function SelectorHora({
  nombreCampo,
  valor,
  onCambiar,
}: {
  nombreCampo: string;
  valor: string;
  onCambiar: (valor: string) => void;
}) {
  const [hora, minuto] = valor.split(":");

  return (
    <span className="ln-admin-hora-selector">
      <select value={hora} onChange={(e) => onCambiar(`${e.target.value}:${minuto}`)}>
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      :
      <select value={minuto} onChange={(e) => onCambiar(`${hora}:${e.target.value}`)}>
        {MINUTOS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input type="hidden" name={nombreCampo} value={valor} />
    </span>
  );
}

function SeccionServicios({ categorias }: { categorias: CategoriaConfig[] }) {
  const [estado, guardar, guardando] = useActionState<EstadoConfig, FormData>(guardarServicios, undefined);

  return (
    <section className="ln-admin-config-sec">
      <h3>Servicios y precios</h3>
      <form action={guardar}>
        {categorias.map((c) => (
          <div key={c.id}>
            <h3>{c.nombre}</h3>
            {c.servicios.map((s) => (
              <div key={s.id} className="ln-admin-servicio-fila">
                <span className="ln-admin-servicio-nombre">{s.nombre}</span>
                <label>
                  $
                  <input type="number" min={0} step={100} name={`precio_${s.id}`} defaultValue={s.precio} />
                </label>
                <label>
                  <input type="number" min={5} step={5} name={`duracion_${s.id}`} defaultValue={s.duracionMin} />
                  min
                </label>
              </div>
            ))}
          </div>
        ))}
        {estado?.error && <p className="ln-admin-error">{estado.error}</p>}
        {estado?.ok && <p className="ln-admin-ok">Guardado.</p>}
        <button type="submit" className="ln-admin-btn-guardar" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar servicios"}
        </button>
      </form>
    </section>
  );
}
