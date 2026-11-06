"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  actualizarTurnoAdmin,
  alternarDiaCerrado,
  cancelarTurno,
  crearTurnoAdmin,
  type EstadoTurnoAdmin,
} from "@/app/actions/admin";
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
  servicioId: number;
};

export type ServicioCatalogo = { id: number; nombre: string; precio: number; duracionMin: number };
export type CategoriaCatalogo = { id: number; nombre: string; servicios: ServicioCatalogo[] };

const plata = (n: number) => "$" + n.toLocaleString("es-AR");
const aHora = (min: number) =>
  String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const durTxt = (m: number) => (m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""));
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Props = {
  turnos: TurnoAgenda[];
  categorias: CategoriaCatalogo[];
  diasCerrados: string[];
  anio: number;
  mes: number; // 1-12
  mesLabel: string;
  hoyISO: string;
  mesAnteriorHref: string;
  mesSiguienteHref: string;
};

export default function Calendario({
  turnos,
  categorias,
  diasCerrados,
  anio,
  mes,
  mesLabel,
  hoyISO,
  mesAnteriorHref,
  mesSiguienteHref,
}: Props) {
  const semanas = grillaMes(anio, mes);
  const cerrados = new Set(diasCerrados);

  const diaConTurnos = (fecha: string) => turnos.some((t) => t.fecha === fecha);
  const hoyEstaEnEsteMes = estaEnMes(hoyISO, anio, mes);
  const diaInicial = hoyEstaEnEsteMes ? hoyISO : semanas.flat().find((f) => f && diaConTurnos(f)) ?? null;
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(diaInicial);
  const [formularioAbierto, setFormularioAbierto] = useState<"nuevo" | string | null>(null);

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
              className={`ln-admin-cal-dia ${fecha === hoyISO ? "ln-admin-cal-hoy" : ""} ${diaSeleccionado === fecha ? "ln-admin-cal-sel" : ""} ${cerrados.has(fecha) ? "ln-admin-cal-cerrado" : ""}`}
              onClick={() => {
                setDiaSeleccionado(fecha);
                setFormularioAbierto(null);
              }}
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
          <div className="ln-admin-dia-header">
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
              {cerrados.has(diaSeleccionado) && <span className="ln-admin-badge-cerrado">Cerrado</span>}
            </h2>
            <div className="ln-admin-dia-header-acciones">
              <ToggleDiaCerrado
                fecha={diaSeleccionado}
                cerrado={cerrados.has(diaSeleccionado)}
                cantidadTurnos={turnosDelDia.filter((t) => t.estado === "confirmado").length}
              />
              {formularioAbierto === null && (
                <button type="button" className="ln-admin-btn-nuevo" onClick={() => setFormularioAbierto("nuevo")}>
                  + Nuevo turno
                </button>
              )}
            </div>
          </div>

          {formularioAbierto === "nuevo" && (
            <FormTurno
              categorias={categorias}
              fechaInicial={diaSeleccionado}
              onListo={() => setFormularioAbierto(null)}
              onCancelar={() => setFormularioAbierto(null)}
            />
          )}

          {turnosDelDia.length === 0 ? (
            formularioAbierto !== "nuevo" && <div className="ln-admin-vacio">No hay turnos.</div>
          ) : (
            turnosDelDia.map((t) =>
              formularioAbierto === t.id ? (
                <FormTurno
                  key={t.id}
                  categorias={categorias}
                  turno={t}
                  fechaInicial={t.fecha}
                  onListo={() => setFormularioAbierto(null)}
                  onCancelar={() => setFormularioAbierto(null)}
                />
              ) : (
                <FilaTurno
                  key={t.id}
                  turno={t}
                  deshabilitado={formularioAbierto !== null}
                  onEditar={() => setFormularioAbierto(t.id)}
                />
              ),
            )
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

function ModalConfirmar({
  titulo,
  mensaje,
  textoConfirmar,
  peligro,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="ln-admin-modal-fondo" onClick={onCancelar}>
      <div className="ln-admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ln-admin-modal-marca">☾ Lua Nails</div>
        <h3 className="ln-admin-modal-titulo">{titulo}</h3>
        <p className="ln-admin-modal-mensaje">{mensaje}</p>
        <div className="ln-admin-modal-acciones">
          <button type="button" className="ln-admin-btn-editar" onClick={onCancelar}>
            Volver
          </button>
          <button
            type="button"
            className={peligro ? "ln-admin-btn-cerrar" : "ln-admin-btn-guardar"}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleDiaCerrado({
  fecha,
  cerrado,
  cantidadTurnos,
}: {
  fecha: string;
  cerrado: boolean;
  cantidadTurnos: number;
}) {
  const [estado, accionar] = useActionState(alternarDiaCerrado, undefined);
  const [confirmando, setConfirmando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const avisoTurnos =
    cantidadTurnos > 0 ? ` Ya hay ${cantidadTurnos} turno(s) ese día: van a quedar como están.` : "";

  return (
    <>
      <form ref={formRef} action={accionar}>
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="cerradoActual" value={String(cerrado)} />
        <BotonToggleDia cerrado={cerrado} onClick={() => (cerrado ? formRef.current?.requestSubmit() : setConfirmando(true))} />
        {estado?.error && <div className="ln-admin-error">{estado.error}</div>}
      </form>
      {confirmando && (
        <ModalConfirmar
          titulo="¿Cerrar este día?"
          mensaje={`No se van a poder reservar turnos nuevos por la web ese día.${avisoTurnos}`}
          textoConfirmar="Sí, cerrar día"
          peligro
          onConfirmar={() => {
            setConfirmando(false);
            formRef.current?.requestSubmit();
          }}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </>
  );
}

function BotonToggleDia({ cerrado, onClick }: { cerrado: boolean; onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      className={cerrado ? "ln-admin-btn-reabrir" : "ln-admin-btn-cerrar"}
      disabled={pending}
      onClick={onClick}
    >
      {pending ? "Guardando…" : cerrado ? "Reabrir día" : "Cerrar día"}
    </button>
  );
}

function FilaTurno({
  turno,
  deshabilitado,
  onEditar,
}: {
  turno: TurnoAgenda;
  deshabilitado: boolean;
  onEditar: () => void;
}) {
  const [estado, cancelar] = useActionState(cancelarTurno, undefined);
  const [confirmando, setConfirmando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
          <>
            <button type="button" className="ln-admin-btn-editar" disabled={deshabilitado} onClick={onEditar}>
              Editar
            </button>
            <form ref={formRef} action={cancelar}>
              <input type="hidden" name="turnoId" value={turno.id} />
              <BotonCancelar deshabilitado={deshabilitado} onClick={() => setConfirmando(true)} />
            </form>
          </>
        )}
        {estado?.error && <div className="ln-admin-error">{estado.error}</div>}
      </div>
      {confirmando && (
        <ModalConfirmar
          titulo="¿Cancelar turno?"
          mensaje={`${turno.nombreCliente} · ${aHora(turno.horaInicio)} hs · ${turno.servicioNombre}`}
          textoConfirmar="Sí, cancelar"
          peligro
          onConfirmar={() => {
            setConfirmando(false);
            formRef.current?.requestSubmit();
          }}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}

function BotonCancelar({ deshabilitado, onClick }: { deshabilitado: boolean; onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="button" className="ln-admin-btn-cancelar" disabled={pending || deshabilitado} onClick={onClick}>
      {pending ? "Cancelando…" : "Cancelar"}
    </button>
  );
}

function FormTurno({
  categorias,
  turno,
  fechaInicial,
  onListo,
  onCancelar,
}: {
  categorias: CategoriaCatalogo[];
  turno?: TurnoAgenda;
  fechaInicial: string;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const accion = turno ? actualizarTurnoAdmin : crearTurnoAdmin;
  const [estado, enviar, enviando] = useActionState<EstadoTurnoAdmin, FormData>(accion, undefined);

  const todosLosServicios = categorias.flatMap((c) => c.servicios);
  const servicioInicial = turno
    ? todosLosServicios.find((s) => s.id === turno.servicioId)
    : todosLosServicios[0];

  const [servicioId, setServicioId] = useState<number | undefined>(servicioInicial?.id);
  const [duracionMin, setDuracionMin] = useState(turno?.duracionMin ?? servicioInicial?.duracionMin ?? 30);
  const [precioTotal, setPrecioTotal] = useState(turno?.precioTotal ?? servicioInicial?.precio ?? 0);

  useEffect(() => {
    if (estado?.ok) onListo();
  }, [estado, onListo]);

  function alCambiarServicio(id: number) {
    setServicioId(id);
    const s = todosLosServicios.find((x) => x.id === id);
    if (s) {
      setDuracionMin(s.duracionMin);
      setPrecioTotal(s.precio);
    }
  }

  return (
    <form action={enviar} className="ln-admin-form-turno">
      {turno && <input type="hidden" name="turnoId" value={turno.id} />}
      <div className="ln-admin-campo">
        <label htmlFor="servicioId">Servicio</label>
        <select
          id="servicioId"
          name="servicioId"
          value={servicioId ?? ""}
          onChange={(e) => alCambiarServicio(Number(e.target.value))}
          required
        >
          {categorias.map((c) => (
            <optgroup key={c.id} label={c.nombre}>
              {c.servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="ln-admin-campo-fila">
        <div className="ln-admin-campo">
          <label htmlFor="fecha">Día</label>
          <input id="fecha" name="fecha" type="date" defaultValue={fechaInicial} required />
        </div>
        <div className="ln-admin-campo">
          <label htmlFor="horaInicio">Hora</label>
          <input
            id="horaInicio"
            name="horaInicio"
            type="time"
            step={1800}
            defaultValue={turno ? aHora(turno.horaInicio) : undefined}
            required
          />
        </div>
      </div>

      <div className="ln-admin-campo-fila">
        <div className="ln-admin-campo">
          <label htmlFor="duracionMin">Duración (min)</label>
          <input
            id="duracionMin"
            name="duracionMin"
            type="number"
            min={5}
            step={5}
            value={duracionMin}
            onChange={(e) => setDuracionMin(Number(e.target.value))}
            required
          />
        </div>
        <div className="ln-admin-campo">
          <label htmlFor="precioTotal">Precio</label>
          <input
            id="precioTotal"
            name="precioTotal"
            type="number"
            min={0}
            step={100}
            value={precioTotal}
            onChange={(e) => setPrecioTotal(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="ln-admin-campo-fila">
        <div className="ln-admin-campo">
          <label htmlFor="nombre">Nombre de la clienta</label>
          <input id="nombre" name="nombre" type="text" defaultValue={turno?.nombreCliente} required />
        </div>
        <div className="ln-admin-campo">
          <label htmlFor="telefono">WhatsApp</label>
          <input id="telefono" name="telefono" type="tel" defaultValue={turno?.telefono} required />
        </div>
      </div>

      <div className="ln-admin-campo">
        <label htmlFor="nota">Nota (opcional)</label>
        <textarea id="nota" name="nota" rows={2} defaultValue={turno?.nota ?? ""} />
      </div>

      {estado?.error && <div className="ln-admin-error">{estado.error}</div>}

      <div className="ln-admin-form-acciones">
        <button type="button" className="ln-admin-btn-cancelar" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="ln-admin-btn-guardar" disabled={enviando}>
          {enviando ? "Guardando…" : turno ? "Guardar cambios" : "Crear turno"}
        </button>
      </div>
    </form>
  );
}
