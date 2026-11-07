"use client";

import { useState } from "react";
import { normalizarWhatsApp } from "@/lib/telefono";

export type TurnoRecordatorio = {
  id: string;
  horaInicio: string; // "HH:MM"
  nombreCliente: string;
  telefono: string;
  servicioNombre: string;
};

function mensajeRecordatorio(turno: TurnoRecordatorio, fechaLarga: string): string {
  const primerNombre = turno.nombreCliente.trim().split(" ")[0];
  return (
    `¡Hola ${primerNombre}! 💅 Te recordamos tu turno en Lua Nails ${fechaLarga.toLowerCase()} ` +
    `a las ${turno.horaInicio} hs (${turno.servicioNombre}).\n\n¡Te esperamos! ☾`
  );
}

export default function Recordatorios({
  turnos,
  fechaLarga,
}: {
  turnos: TurnoRecordatorio[];
  fechaLarga: string;
}) {
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  if (turnos.length === 0) {
    return <div className="ln-admin-vacio">No hay turnos confirmados para mañana.</div>;
  }

  return (
    <div>
      {turnos.map((t) => {
        const numeroWa = normalizarWhatsApp(t.telefono);
        const enviado = enviados.has(t.id);
        return (
          <div key={t.id} className="ln-admin-turno">
            <div className="ln-admin-turno-hora">{t.horaInicio}</div>
            <div className="ln-admin-turno-info">
              <strong>{t.nombreCliente}</strong>
              <div className="ln-admin-turno-detalle">{t.servicioNombre}</div>
            </div>
            <div className="ln-admin-turno-acciones">
              {numeroWa ? (
                <a
                  className={`ln-admin-btn-recordatorio ${enviado ? "ln-admin-btn-recordatorio-hecho" : ""}`}
                  href={`https://wa.me/${numeroWa}?text=${encodeURIComponent(mensajeRecordatorio(t, fechaLarga))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setEnviados((prev) => new Set(prev).add(t.id))}
                >
                  {enviado ? "✓ Avisada" : "Avisar por WhatsApp"}
                </a>
              ) : (
                <span className="ln-admin-badge-aviso">Revisá el teléfono</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
