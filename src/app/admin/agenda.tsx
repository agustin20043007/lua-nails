"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { cancelarTurno } from "@/app/actions/admin";

export type TurnoAgenda = {
  id: string;
  fecha: string; // "AAAA-MM-DD"
  horaInicio: number; // minutos desde medianoche
  duracionMin: number;
  precioTotal: number;
  nombreCliente: string;
  telefono: string;
  nota: string | null;
  estado: "confirmado" | "cancelado";
  servicioNombre: string;
};

const plata = (n: number) => "$" + n.toLocaleString("es-AR");
const aHora = (min: number) =>
  String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const durTxt = (m: number) => (m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""));
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Agenda({ turnos, dias, hoyISO }: { turnos: TurnoAgenda[]; dias: string[]; hoyISO: string }) {
  const [vista, setVista] = useState<"hoy" | "semana">("hoy");

  const diasAMostrar = vista === "hoy" ? [hoyISO] : dias;

  return (
    <div>
      <div className="ln-admin-tabs">
        <button
          type="button"
          className={`ln-admin-tab ${vista === "hoy" ? "ln-admin-tab-activo" : ""}`}
          onClick={() => setVista("hoy")}
        >
          Hoy
        </button>
        <button
          type="button"
          className={`ln-admin-tab ${vista === "semana" ? "ln-admin-tab-activo" : ""}`}
          onClick={() => setVista("semana")}
        >
          Esta semana
        </button>
      </div>

      {diasAMostrar.map((fecha) => {
        const turnosDelDia = turnos.filter((t) => t.fecha === fecha).sort((a, b) => a.horaInicio - b.horaInicio);
        const d = new Date(`${fecha}T12:00`);
        const esHoy = fecha === hoyISO;
        const etiqueta = esHoy
          ? "Hoy"
          : capitalizar(d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));

        return (
          <div key={fecha}>
            <div className="ln-admin-dia">{etiqueta}</div>
            {turnosDelDia.length === 0 ? (
              <div className="ln-admin-vacio">No hay turnos.</div>
            ) : (
              turnosDelDia.map((t) => <FilaTurno key={t.id} turno={t} />)
            )}
          </div>
        );
      })}
    </div>
  );
}

function FilaTurno({ turno }: { turno: TurnoAgenda }) {
  const [estado, cancelar] = useActionState(cancelarTurno, undefined);
  const cancelado = turno.estado === "cancelado";

  return (
    <div className={`ln-admin-turno ${cancelado ? "ln-admin-turno-cancelado" : ""}`}>
      <div className="ln-admin-turno-hora">{aHora(turno.horaInicio)}</div>
      <div className="ln-admin-turno-info">
        <strong>{turno.nombreCliente}</strong>
        <div className="ln-admin-turno-detalle">
          {turno.servicioNombre} · {durTxt(turno.duracionMin)} · {turno.telefono}
        </div>
        {turno.nota && <div className="ln-admin-turno-nota">“{turno.nota}”</div>}
      </div>
      <div className="ln-admin-turno-precio">{plata(turno.precioTotal)}</div>
      <div className="ln-admin-turno-acciones">
        {cancelado ? (
          <span className="ln-admin-badge">Cancelado</span>
        ) : (
          <form
            action={cancelar}
            onSubmit={(e) => {
              if (!confirm(`¿Cancelar el turno de ${turno.nombreCliente} a las ${aHora(turno.horaInicio)}?`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="turnoId" value={turno.id} />
            <BotonCancelar />
          </form>
        )}
        {estado?.error && <div className="ln-admin-error">{estado.error}</div>}
      </div>
    </div>
  );
}

function BotonCancelar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ln-admin-btn-cancelar" disabled={pending}>
      {pending ? "Cancelando…" : "Cancelar"}
    </button>
  );
}
