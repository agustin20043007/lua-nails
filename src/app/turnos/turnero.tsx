"use client";

import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import MenuCliente from "@/app/menu-cliente";
import { crearTurno, type EstadoTurno } from "@/app/actions/turnos";
import { DIAS_SEMANA_CORTO, NOMBRES_MES, grillaMes, iso, sumarMeses, ultimoDiaDelMes } from "@/lib/calendario";
import "./page.css";

// El pipeline de Tailwind/Turbopack de este proyecto no genera el mapa de
// clases localizadas de los CSS Modules (las claves quedan "undefined"), así
// que page.css es una hoja global con clases prefijadas "ln-" y este objeto
// solo traduce los nombres usados en el JSX a esas clases reales.
const styles = {
  page: "ln-page",
  wrap: "ln-wrap",
  luna: "ln-luna",
  sub: "ln-sub",
  linea: "ln-linea",
  pasos: "ln-pasos",
  paso: "ln-paso",
  activo: "ln-activo",
  hecho: "ln-hecho",
  pasoSpan: "ln-paso-span",
  cat: "ln-cat",
  abierta: "ln-abierta",
  catTit: "ln-cat-tit",
  flecha: "ln-flecha",
  catItems: "ln-cat-items",
  nota: "ln-nota",
  serv: "ln-serv",
  sel: "ln-sel",
  punto: "ln-punto",
  nom: "ln-nom",
  durTexto: "ln-dur",
  precio: "ln-precio",
  extra: "ln-extra",
  volver: "ln-volver",
  calHeader: "ln-cal-header",
  calMesLabel: "ln-cal-mes-label",
  calNav: "ln-cal-nav",
  calSemana: "ln-cal-semana",
  calGrid: "ln-cal-grid",
  calDia: "ln-cal-dia",
  calHoy: "ln-cal-hoy",
  calVacio: "ln-cal-vacio",
  horas: "ln-horas",
  vacio: "ln-vacio",
  hora: "ln-hora",
  campo: "ln-campo",
  errorMsg: "ln-error-msg",
  ok: "ln-ok",
  icono: "ln-icono",
  resumen: "ln-resumen",
  btn: "ln-btn",
  cuenta: "ln-cuenta",
  btnWa: "ln-btn-wa",
  btnSec: "ln-btn-sec",
  barra: "ln-barra",
  barraWrap: "ln-barra-wrap",
  barraInfoText: "ln-barra-info",
  sino: "ln-sino",
  opcion: "ln-opcion",
} as const;

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});

const WHATSAPP = "5493413608338"; // 549 + característica + número, sin 0 ni 15
const INTERVALO = 30; // cada cuántos minutos arranca un turno

export type ServicioDB = { id: number; nombre: string; precio: number; duracionMin: number };
export type CategoriaDB = { id: number; nombre: string; nota: string | null; sinRetiro: boolean; items: ServicioDB[] };
export type HorariosSemana = Record<number, [string, string] | null>;
export type Ocupado = [string, number]; // "AAAA-MM-DD HH:MM", duración en minutos

const PASOS = [
  { n: 1, label: "Servicio" },
  { n: 2, label: "Día y hora" },
  { n: 3, label: "Listo" },
];

const plata = (n: number) => "$" + n.toLocaleString("es-AR");
const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const aHora = (min: number) =>
  String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const durTxt = (m: number) => (m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""));
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// El calendario depende de la hora actual, que no puede leerse durante el
// prerender estático: useSyncExternalStore reporta "cliente" solo tras montar.
const sinSuscripcion = () => () => {};
const esCliente = () => true;
const esServidor = () => false;

type ServicioActual = { id: number; nombre: string; precio: number; dur: number };

type Props = {
  nombre: string;
  telefono: string;
  categorias: CategoriaDB[];
  horarios: HorariosSemana;
  ocupados: Ocupado[];
};

export default function Turnero({ nombre: nombreCuenta, telefono: telCuenta, categorias, horarios, ocupados }: Props) {
  const [paso, setPaso] = useState(1);
  const [catIdx, setCatIdx] = useState<number | null>(null);
  const [itemIdx, setItemIdx] = useState<number | null>(null);
  const [vieneConUnas, setVieneConUnas] = useState<boolean | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<number | null>(null);
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<boolean[]>(() =>
    categorias.map((_, i) => i === 0),
  );
  const [intento, setIntento] = useState(0);
  const [mesOffset, setMesOffset] = useState(0); // 0 = este mes, 1 = el que sigue
  const mounted = useSyncExternalStore(sinSuscripcion, esCliente, esServidor);

  const servicioActual = useMemo((): ServicioActual | null => {
    if (catIdx === null || itemIdx === null) return null;
    const c = categorias[catIdx];
    const it = c.items[itemIdx];
    const nombreServ =
      c.nombre === "Estética de manos" || c.nombre === "Retiro" || c.nombre === "Pestañas y cejas"
        ? it.nombre
        : `${c.nombre} · ${it.nombre}`;
    return { id: it.id, nombre: nombreServ, precio: it.precio, dur: it.duracionMin };
  }, [catIdx, itemIdx, categorias]);

  function horasLibres(d: Date): { t: number; libre: boolean }[] {
    if (!servicioActual) return [];
    const h = horarios[d.getDay()];
    if (!h) return [];
    const dur = servicioActual.dur;
    const ini = aMin(h[0]);
    const fin = aMin(h[1]);
    const k = iso(d);
    const ahora = new Date();
    const esHoy = iso(ahora) === k;
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes() + 60; // 1 h de anticipación
    const ocup = ocupados.filter((o) => o[0].startsWith(k)).map((o): [number, number] => {
      const s = aMin(o[0].slice(11));
      return [s, s + o[1]];
    });
    const out: { t: number; libre: boolean }[] = [];
    for (let t = ini; t + dur <= fin; t += INTERVALO) {
      const libre = !ocup.some(([a, b]) => t < b && t + dur > a) && !(esHoy && t < minAhora);
      out.push({ t, libre });
    }
    return out.some((x) => x.libre) ? out : [];
  }

  function irA(p: number) {
    if (p === 2 && dia && !horasLibres(new Date(`${dia}T12:00`)).length) {
      setDia(null);
    }
    setPaso(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continuar() {
    irA(paso + 1);
  }

  function reiniciar() {
    setCatIdx(null);
    setItemIdx(null);
    setVieneConUnas(null);
    setDia(null);
    setHora(null);
    setCategoriasAbiertas(categorias.map((_, i) => i === 0));
    setMesOffset(0);
    setIntento((n) => n + 1);
    irA(1);
  }

  // El horario de reserva llega hasta fin del mes que sigue: dos meses de
  // calendario para elegir, nunca menos.
  let semanas: (string | null)[][] = [];
  let mesLabelCal = "";
  let hoyISO = "";
  let horizonHastaISO = "";
  let horasList: { t: number; libre: boolean }[] = [];
  if (mounted) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    hoyISO = iso(hoy);
    const siguiente = sumarMeses(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    horizonHastaISO = ultimoDiaDelMes(siguiente.anio, siguiente.mes);
    const mostrado = sumarMeses(hoy.getFullYear(), hoy.getMonth() + 1, mesOffset);
    semanas = grillaMes(mostrado.anio, mostrado.mes);
    mesLabelCal = `${capitalizar(NOMBRES_MES[mostrado.mes - 1])} ${mostrado.anio}`;
    horasList = dia ? horasLibres(new Date(`${dia}T12:00`)) : [];
  }

  function diaHabilitado(fecha: string): boolean {
    if (!hoyISO || fecha < hoyISO || fecha > horizonHastaISO) return false;
    const d = new Date(`${fecha}T12:00`);
    return !!horarios[d.getDay()] && horasLibres(d).length > 0;
  }

  let barraDetalle = "";
  if (servicioActual) {
    barraDetalle = `${durTxt(servicioActual.dur)} · ${plata(servicioActual.precio)}`;
    if (paso >= 2 && dia) {
      const d = new Date(`${dia}T12:00`);
      barraDetalle = capitalizar(d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));
      barraDetalle += hora !== null ? ` · ${aHora(hora)} hs` : "";
    }
  }
  let continuarDisabled = !servicioActual;
  if (servicioActual) {
    if (paso === 1) {
      const requiereInfoUnas = catIdx !== null && !categorias[catIdx].sinRetiro;
      continuarDisabled = requiereInfoUnas && vieneConUnas === null;
    } else if (paso === 2) {
      continuarDisabled = hora === null;
    } else {
      continuarDisabled = false;
    }
  }

  return (
    <div className={`${styles.page} ${montserrat.variable} ${cormorant.variable}`}>
      <div className={styles.wrap}>
        <div className={styles.cuenta}>
          <MenuCliente nombre={nombreCuenta} />
        </div>
        <header>
          <div className={styles.luna}>☾</div>
          <h1>LUA NAILS</h1>
          <div className={styles.sub}>Estética &amp; uñas</div>
          <div className={styles.linea}></div>
        </header>

        <nav className={styles.pasos}>
          {PASOS.map((p) => (
            <div
              key={p.n}
              className={`${styles.paso} ${paso === p.n ? styles.activo : ""} ${paso > p.n ? styles.hecho : ""}`}
            >
              <b>{p.n}</b>
              <span className={styles.pasoSpan}>{p.label}</span>
            </div>
          ))}
        </nav>

        {paso === 1 && (
          <section>
            <h2>¿Qué te querés hacer?</h2>
            <div>
              {categorias.map((c, ci) => (
                <div key={c.id} className={`${styles.cat} ${categoriasAbiertas[ci] ? styles.abierta : ""}`}>
                  <button
                    type="button"
                    className={styles.catTit}
                    onClick={() =>
                      setCategoriasAbiertas((prev) => prev.map((v, i) => (i === ci ? !v : v)))
                    }
                  >
                    {c.nombre}
                    <span className={styles.flecha}>⌄</span>
                  </button>
                  {categoriasAbiertas[ci] && (
                    <div className={styles.catItems}>
                      {c.nota && <div className={styles.nota}>{c.nota}</div>}
                      {c.items.map((it, ii) => (
                        <button
                          key={it.id}
                          type="button"
                          className={`${styles.serv} ${catIdx === ci && itemIdx === ii ? styles.sel : ""}`}
                          onClick={() => {
                            setCatIdx(ci);
                            setItemIdx(ii);
                            setVieneConUnas(null);
                            setHora(null);
                          }}
                        >
                          <span className={styles.punto}></span>
                          <span className={styles.nom}>
                            {it.nombre}
                            <span className={styles.durTexto}>{durTxt(it.duracionMin)} aprox.</span>
                          </span>
                          <span className={styles.precio}>{plata(it.precio)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {catIdx !== null && !categorias[catIdx].sinRetiro && (
              <div className={styles.extra}>
                <label>¿Venís con las uñas puestas?</label>
                <div className={styles.sino}>
                  <button
                    type="button"
                    className={`${styles.opcion} ${vieneConUnas === false ? styles.sel : ""}`}
                    onClick={() => setVieneConUnas(false)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className={`${styles.opcion} ${vieneConUnas === true ? styles.sel : ""}`}
                    onClick={() => setVieneConUnas(true)}
                  >
                    Sí
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {paso === 2 && (
          <section>
            <button type="button" className={styles.volver} onClick={() => irA(1)}>
              ← Cambiar servicio
            </button>
            <h2>Elegí el día</h2>
            <div className={styles.calHeader}>
              <button
                type="button"
                className={styles.calNav}
                disabled={mesOffset === 0}
                onClick={() => setMesOffset((n) => n - 1)}
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <div className={styles.calMesLabel}>{mesLabelCal}</div>
              <button
                type="button"
                className={styles.calNav}
                disabled={mesOffset === 1}
                onClick={() => setMesOffset((n) => n + 1)}
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>
            <div className={styles.calSemana}>
              {DIAS_SEMANA_CORTO.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className={styles.calGrid}>
              {semanas.flat().map((fecha, i) =>
                fecha ? (
                  <button
                    key={fecha}
                    type="button"
                    className={`${styles.calDia} ${fecha === hoyISO ? styles.calHoy : ""} ${dia === fecha ? styles.sel : ""}`}
                    disabled={!diaHabilitado(fecha)}
                    onClick={() => {
                      setDia(fecha);
                      setHora(null);
                    }}
                  >
                    {Number(fecha.slice(-2))}
                  </button>
                ) : (
                  <div key={`vacio-${i}`} className={`${styles.calDia} ${styles.calVacio}`} />
                ),
              )}
            </div>
            <h2 style={{ marginTop: 18 }}>Elegí el horario</h2>
            <div className={styles.horas}>
              {!dia && <div className={styles.vacio}>Primero elegí un día.</div>}
              {dia && horasList.length === 0 && <div className={styles.vacio}>No quedan horarios este día.</div>}
              {dia &&
                horasList.map((h) => (
                  <button
                    key={h.t}
                    type="button"
                    className={`${styles.hora} ${hora === h.t ? styles.sel : ""}`}
                    disabled={!h.libre}
                    onClick={() => setHora(h.t)}
                  >
                    {aHora(h.t)}
                  </button>
                ))}
            </div>
          </section>
        )}

        {paso === 3 && servicioActual && dia && hora !== null && (
          <ConfirmarTurno
            key={intento}
            servicioActual={servicioActual}
            dia={dia}
            hora={hora}
            vieneConUnas={vieneConUnas}
            nombreCuenta={nombreCuenta}
            telCuenta={telCuenta}
            onVolver={() => irA(2)}
            onReservarOtro={reiniciar}
          />
        )}

        <footer>☾ Lua Nails · Turnos por WhatsApp 341 360-8338</footer>
      </div>

      {paso !== 3 && (
        <div className={styles.barra}>
          <div className={`${styles.wrap} ${styles.barraWrap}`}>
            <div className={styles.barraInfoText}>
              {servicioActual ? (
                <>
                  <strong>{servicioActual.nombre}</strong>
                  {barraDetalle}
                </>
              ) : (
                "Elegí un servicio"
              )}
            </div>
            <button type="button" className={styles.btn} disabled={continuarDisabled} onClick={continuar}>
              {paso === 2 ? "Ver resumen" : "Continuar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmarTurno({
  servicioActual,
  dia,
  hora,
  vieneConUnas,
  nombreCuenta,
  telCuenta,
  onVolver,
  onReservarOtro,
}: {
  servicioActual: ServicioActual;
  dia: string;
  hora: number;
  vieneConUnas: boolean | null;
  nombreCuenta: string;
  telCuenta: string;
  onVolver: () => void;
  onReservarOtro: () => void;
}) {
  const [nota, setNota] = useState("");
  const [avisado, setAvisado] = useState(false);
  const [estado, confirmar, guardando] = useActionState<EstadoTurno, FormData>(crearTurno, undefined);

  const fechaLarga = capitalizar(
    new Date(`${dia}T12:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }),
  );

  const resumenFilas: [string, string][] = [
    ["Servicio", servicioActual.nombre],
    ...(vieneConUnas !== null ? ([["¿Venís con las uñas puestas?", vieneConUnas ? "Sí" : "No"]] as [string, string][]) : []),
    ["Día", fechaLarga],
    ["Horario", `${aHora(hora)} hs (${durTxt(servicioActual.dur)} aprox.)`],
    ["Nombre", nombreCuenta],
    ["WhatsApp", telCuenta],
    ...(nota.trim() ? ([["Comentario", nota.trim()]] as [string, string][]) : []),
    ["Total", plata(servicioActual.precio)],
  ];

  if (estado?.ok) {
    const notaTrim = nota.trim();
    const msg =
      `¡Hola Lua Nails! 💅 Acabo de reservar un turno:\n\n` +
      `• Servicio: ${servicioActual.nombre}\n` +
      (vieneConUnas !== null ? `• ¿Venís con las uñas puestas?: ${vieneConUnas ? "Sí" : "No"}\n` : "") +
      `• Día: ${fechaLarga}\n` +
      `• Horario: ${aHora(hora)} hs\n` +
      `• Total: ${plata(servicioActual.precio)}\n\n` +
      `Nombre: ${nombreCuenta}\nWhatsApp: ${telCuenta}` +
      (notaTrim ? `\nComentario: ${notaTrim}` : "");
    const linkWhatsApp = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);

    return (
      <section>
        <div className={styles.ok}>
          <div className={styles.icono}>♡</div>
          <h2>¡Turno reservado!</h2>
          <p>{avisado ? "Te esperamos." : "Para terminar, avisanos por WhatsApp."}</p>
        </div>
        <div className={styles.resumen}>
          {resumenFilas.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            className={`${styles.btn} ${styles.btnWa}`}
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAvisado(true)}
          >
            Avisar por WhatsApp
          </a>
          {avisado && (
            <button type="button" className={`${styles.btn} ${styles.btnSec}`} onClick={onReservarOtro}>
              Sacar otro turno
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <button type="button" className={styles.volver} onClick={onVolver}>
        ← Cambiar día u horario
      </button>
      <div className={styles.ok}>
        <div className={styles.icono}>♡</div>
        <h2>¡Ya casi está!</h2>
        <p>Revisá los datos y confirmá tu turno.</p>
      </div>
      <form action={confirmar}>
        <input type="hidden" name="servicioId" value={servicioActual.id} />
        <input type="hidden" name="vieneConUnasPuestas" value={vieneConUnas === null ? "" : String(vieneConUnas)} />
        <input type="hidden" name="fecha" value={dia} />
        <input type="hidden" name="horaInicio" value={hora} />
        <input type="hidden" name="duracionMin" value={servicioActual.dur} />
        <input type="hidden" name="precioTotal" value={servicioActual.precio} />
        <div className={styles.campo}>
          <label htmlFor="nota">Comentario (opcional)</label>
          <textarea
            id="nota"
            name="nota"
            rows={3}
            placeholder="Ej: quiero diseño con flores, traigo foto de referencia"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
        <div className={styles.resumen}>
          {resumenFilas.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        {estado?.error && <p className={styles.errorMsg}>{estado.error}</p>}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button type="submit" className={styles.btn} disabled={guardando}>
            {guardando ? "Confirmando…" : "Confirmar turno"}
          </button>
        </div>
      </form>
    </section>
  );
}
