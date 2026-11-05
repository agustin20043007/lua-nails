"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { cancelarTurno } from "@/app/actions/admin";
import { DIAS_SEMANA_CORTO, grillaMes } from "@/lib/calendario";

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

type Props = {
  turnos: TurnoAgenda[];
  anio: number;
  mes: number; // 1-12
  mesLabel: string;
  hoyISO: string;
  mesAnteriorHref: string;
  mesSiguienteHref: string;
};

export default function Calendario({ turnos, anio, mes, mesLabel, hoyISO, mesAnteriorHref, mesSiguienteHref }: Props) {
  const semanas = grillaMes(anio, mes);

  const diaConTurnos = (fecha: string) => turnos.some((t) => t.fecha === fecha);
  const hoyEstaEnEsteMes = estaEnMes(hoyISO, anio, mes);
  const diaInicial = hoyEstaEnEsteMes ? hoyISO : semanas.flat().find((f) => f && diaConTurnos(f)) ?? null;
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(diaInicial);

  const turnosDelDia = diaSeleccionado
    ? turnos.filter((t) => t.fecha === diaSeleccionado).sort((a, b) => a.horaInicio - b.horaInicio)
    : [];

  return (
    <div>
      <div className="ln-admin-cal-header">
        <Link href={mesAnteriorHref} className="ln-admin-cal-nav" aria-label="Mes anterior">
          ‹
        </Link>
        <div className="ln-admin-cal-mes-label">{mesLabel}</div>
        <Link href={mesSiguienteHref} className="ln-admin-cal-nav" aria-label="Mes siguiente">
          ›
        </Link>
      </div>

      <div className="ln-admin-cal-semana">
        {DIAS_SEMANA_CORTO.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="ln-admin-cal-grid">
        {semanas.flat().map((fecha, i) =>
          fecha ? (
            <button
              key={fecha}
              type="button"
              className={`ln-admin-cal-dia ${fecha === hoyISO ? "ln-admin-cal-hoy" : ""} ${diaSeleccionado === fecha ? "ln-admin-cal-sel" : ""}`}
              onClick={() => setDiaSeleccionado(fecha)}
            >
              <span>{Number(fecha.slice(-2))}</span>
              {diaConTurnos(fecha) && <span className="ln-admin-cal-punto" />}
            </button>
          ) : (
            <div key={`vacio-${i}`} className="ln-admin-cal-dia ln-admin-cal-vacio" />
          ),
        )}
      </div>

      {diaSeleccionado ? (
        <>
          <h2 className="ln-admin-dia-titulo">
            {diaSeleccionado === hoyISO
              ? "Hoy"
              : capitalizar(
                  new Date(`${diaSeleccionado}T12:00`).toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }),
                )}
          </h2>
          {turnosDelDia.length === 0 ? (
            <div className="ln-admin-vacio">No hay turnos.</div>
          ) : (
            turnosDelDia.map((t) => <FilaTurno key={t.id} turno={t} />)
          )}
        </>
      ) : (
        <div className="ln-admin-vacio">Elegí un día para ver los turnos.</div>
      )}
    </div>
  );
}

function estaEnMes(fecha: string, anio: number, mes: number) {
  const [a, m] = fecha.split("-").map(Number);
  return a === anio && m === mes;
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
