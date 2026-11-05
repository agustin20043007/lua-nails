"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import Link from "next/link";
import { cerrarSesion } from "@/app/actions/auth";
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
  mes: "ln-mes",
  dias: "ln-dias",
  dia: "ln-dia",
  horas: "ln-horas",
  vacio: "ln-vacio",
  hora: "ln-hora",
  campo: "ln-campo",
  mal: "ln-mal",
  errorMsg: "ln-error-msg",
  ayuda: "ln-ayuda",
  ok: "ln-ok",
  icono: "ln-icono",
  resumen: "ln-resumen",
  btn: "ln-btn",
  cuenta: "ln-cuenta",
  cuentaBtn: "ln-cuenta-btn",
  btnWa: "ln-btn-wa",
  btnSec: "ln-btn-sec",
  barra: "ln-barra",
  barraWrap: "ln-barra-wrap",
  barraInfoText: "ln-barra-info",
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

/* ============ CONFIGURACIÓN (editá acá) ============ */
const WHATSAPP = "5493413608338"; // 549 + característica + número, sin 0 ni 15
const INTERVALO = 30; // cada cuántos minutos arranca un turno
const DIAS_A_MOSTRAR = 21;
// Horario por día de la semana (0=domingo ... 6=sábado). null = cerrado
const HORARIOS: Record<number, [string, string] | null> = {
  0: null,
  1: ["09:00", "19:00"],
  2: ["09:00", "19:00"],
  3: ["09:00", "19:00"],
  4: ["09:00", "19:00"],
  5: ["09:00", "19:00"],
  6: ["09:00", "14:00"],
};
// [nombre, precio, duración en minutos]
type Item = [string, number, number];
type Categoria = { cat: string; nota?: string; sinRetiro?: boolean; items: Item[] };
const SERVICIOS: Categoria[] = [
  {
    cat: "Semipermanente",
    items: [
      ["Liso", 14500, 60],
      ["Diseño en dos uñas", 15500, 75],
      ["Full diseño / francesa", 16000, 90],
      ["Full diseño + relieves", 17000, 105],
    ],
  },
  {
    cat: "Capping",
    items: [
      ["Transparente / neutral glitter (sin esmalte)", 15000, 75],
      ["Liso", 18000, 90],
      ["Diseño en dos uñas", 19000, 105],
      ["Full diseño / francesa", 20000, 120],
      ["Full diseño + relieves", 22000, 120],
    ],
  },
  {
    cat: "Soft gel",
    nota: "Retoque: mismos valores que capping.",
    items: [
      ["Liso", 19000, 120],
      ["Diseño en dos uñas", 20000, 120],
      ["Full diseño / francesa", 21000, 135],
      ["Full diseño + relieves", 23000, 150],
    ],
  },
  {
    cat: "Estética de manos",
    nota: "Limado de uñas, retiro de cutícula y durezas e hidratación de la piel.",
    sinRetiro: true,
    items: [
      ["Estética de manos", 9000, 45],
      ["Estética de manos + retiro", 10000, 60],
    ],
  },
  {
    cat: "Pies",
    items: [
      ["Semipermanente liso", 16000, 60],
      ["Semipermanente diseño", 17000, 75],
      ["Tradicional", 13000, 60],
    ],
  },
  {
    cat: "Retiro",
    sinRetiro: true,
    items: [
      ["Retiro de semipermanente", 5000, 30],
      ["Retiro de capping / soft gel", 6000, 30],
    ],
  },
];
const RETIROS: Item[] = [
  ["semipermanente", 5000, 30],
  ["capping / soft gel", 6000, 30],
];
// Turnos ya ocupados (por ahora a mano; después vendrán de una base de datos)
// formato: "AAAA-MM-DD HH:MM" con duración en minutos
const OCUPADOS: [string, number][] = [
  // ["2026-11-06 10:00", 90],
];
/* =================================================== */

const PASOS = [
  { n: 1, label: "Servicio" },
  { n: 2, label: "Día y hora" },
  { n: 3, label: "Tus datos" },
  { n: 4, label: "Listo" },
];

const plata = (n: number) => "$" + n.toLocaleString("es-AR");
const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const aHora = (min: number) =>
  String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const iso = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const durTxt = (m: number) => (m < 60 ? m + " min" : Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""));
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// El calendario depende de la hora actual, que no puede leerse durante el
// prerender estático: useSyncExternalStore reporta "cliente" solo tras montar.
const sinSuscripcion = () => () => {};
const esCliente = () => true;
const esServidor = () => false;

export default function Turnero({ nombre: nombreCuenta }: { nombre: string }) {
  const [paso, setPaso] = useState(1);
  const [catIdx, setCatIdx] = useState<number | null>(null);
  const [itemIdx, setItemIdx] = useState<number | null>(null);
  const [retiro, setRetiro] = useState("");
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<number | null>(null);
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<boolean[]>(() =>
    SERVICIOS.map((_, i) => i === 0),
  );
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [nota, setNota] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const mounted = useSyncExternalStore(sinSuscripcion, esCliente, esServidor);

  const servicioActual = useMemo(() => {
    if (catIdx === null || itemIdx === null) return null;
    const c = SERVICIOS[catIdx];
    const it = c.items[itemIdx];
    let nombreServ = c.cat === "Estética de manos" || c.cat === "Retiro" ? it[0] : `${c.cat} · ${it[0]}`;
    let precio = it[1];
    let dur = it[2];
    if (retiro !== "" && !c.sinRetiro) {
      const r = RETIROS[Number(retiro)];
      nombreServ += ` + retiro de ${r[0]}`;
      precio += r[1];
      dur += r[2];
    }
    return { nombre: nombreServ, precio, dur };
  }, [catIdx, itemIdx, retiro]);

  function horasLibres(d: Date): { t: number; libre: boolean }[] {
    if (!servicioActual) return [];
    const h = HORARIOS[d.getDay()];
    if (!h) return [];
    const dur = servicioActual.dur;
    const ini = aMin(h[0]);
    const fin = aMin(h[1]);
    const k = iso(d);
    const ahora = new Date();
    const esHoy = iso(ahora) === k;
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes() + 60; // 1 h de anticipación
    const ocup = OCUPADOS.filter((o) => o[0].startsWith(k)).map((o): [number, number] => {
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

  function fechaLarga(): string {
    if (!dia) return "";
    const d = new Date(`${dia}T12:00`);
    return capitalizar(d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));
  }

  function irA(p: number) {
    if (p === 2 && dia && !horasLibres(new Date(`${dia}T12:00`)).length) {
      setDia(null);
    }
    setPaso(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continuar() {
    if (paso === 3) {
      const nOk = nombre.trim().length >= 2;
      const tOk = tel.replace(/\D/g, "").length >= 10;
      setShowErrors(true);
      if (!nOk || !tOk) return;
    }
    irA(paso + 1);
  }

  function reiniciar() {
    setCatIdx(null);
    setItemIdx(null);
    setRetiro("");
    setDia(null);
    setHora(null);
    setNombre("");
    setTel("");
    setNota("");
    setShowErrors(false);
    setCategoriasAbiertas(SERVICIOS.map((_, i) => i === 0));
    irA(1);
  }

  let diasList: { k: string; d: Date; abierto: boolean }[] = [];
  let mesLabel = "";
  let horasList: { t: number; libre: boolean }[] = [];
  if (mounted) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    diasList = Array.from({ length: DIAS_A_MOSTRAR }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const libres = horasLibres(d);
      return { k: iso(d), d, abierto: !!HORARIOS[d.getDay()] && libres.length > 0 };
    });
    const mesRef = dia ? new Date(`${dia}T12:00`) : hoy;
    mesLabel = capitalizar(mesRef.toLocaleDateString("es-AR", { month: "long", year: "numeric" }));
    horasList = dia ? horasLibres(new Date(`${dia}T12:00`)) : [];
  }

  const nombreInvalido = showErrors && nombre.trim().length < 2;
  const telInvalido = showErrors && tel.replace(/\D/g, "").length < 10;

  let barraDetalle = "";
  if (servicioActual) {
    barraDetalle = `${durTxt(servicioActual.dur)} · ${plata(servicioActual.precio)}`;
    if (paso >= 2 && dia) {
      barraDetalle = fechaLarga() + (hora !== null ? ` · ${aHora(hora)} hs` : "");
    }
  }
  let continuarDisabled = !servicioActual;
  if (servicioActual) {
    if (paso === 2) continuarDisabled = hora === null;
    else continuarDisabled = false;
  }

  const resumenFilas: [string, string][] =
    servicioActual && dia && hora !== null
      ? [
          ["Servicio", servicioActual.nombre],
          ["Día", fechaLarga()],
          ["Horario", `${aHora(hora)} hs (${durTxt(servicioActual.dur)} aprox.)`],
          ["Nombre", nombre.trim()],
          ["WhatsApp", tel.trim()],
          ...(nota.trim() ? ([["Comentario", nota.trim()]] as [string, string][]) : []),
          ["Total", plata(servicioActual.precio)],
        ]
      : [];

  const linkWhatsApp = useMemo(() => {
    if (!servicioActual || !dia || hora === null) return "";
    const notaTrim = nota.trim();
    const msg =
      `¡Hola Lua Nails! 💅 Quiero sacar un turno:\n\n` +
      `• Servicio: ${servicioActual.nombre}\n` +
      `• Día: ${fechaLarga()}\n` +
      `• Horario: ${aHora(hora)} hs\n` +
      `• Total: ${plata(servicioActual.precio)}\n\n` +
      `Nombre: ${nombre.trim()}\nWhatsApp: ${tel.trim()}` +
      (notaTrim ? `\nComentario: ${notaTrim}` : "");
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioActual, dia, hora, nombre, tel, nota]);

  return (
    <div className={`${styles.page} ${montserrat.variable} ${cormorant.variable}`}>
      <div className={styles.wrap}>
        <div className={styles.cuenta}>
          Hola, {nombreCuenta.split(" ")[0]} · <Link href="/mis-turnos">Mis turnos</Link> ·{" "}
          <button type="button" className={styles.cuentaBtn} onClick={() => cerrarSesion()}>
            Cerrar sesión
          </button>
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
              {SERVICIOS.map((c, ci) => (
                <div key={c.cat} className={`${styles.cat} ${categoriasAbiertas[ci] ? styles.abierta : ""}`}>
                  <button
                    type="button"
                    className={styles.catTit}
                    onClick={() =>
                      setCategoriasAbiertas((prev) => prev.map((v, i) => (i === ci ? !v : v)))
                    }
                  >
                    {c.cat}
                    <span className={styles.flecha}>⌄</span>
                  </button>
                  {categoriasAbiertas[ci] && (
                    <div className={styles.catItems}>
                      {c.nota && <div className={styles.nota}>{c.nota}</div>}
                      {c.items.map((it, ii) => (
                        <button
                          key={it[0]}
                          type="button"
                          className={`${styles.serv} ${catIdx === ci && itemIdx === ii ? styles.sel : ""}`}
                          onClick={() => {
                            setCatIdx(ci);
                            setItemIdx(ii);
                            setHora(null);
                          }}
                        >
                          <span className={styles.punto}></span>
                          <span className={styles.nom}>
                            {it[0]}
                            <span className={styles.durTexto}>{durTxt(it[2])} aprox.</span>
                          </span>
                          <span className={styles.precio}>{plata(it[1])}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {catIdx !== null && !SERVICIOS[catIdx].sinRetiro && (
              <div className={styles.extra}>
                <label htmlFor="retiro">¿Venís con uñas puestas?</label>
                <select
                  id="retiro"
                  value={retiro}
                  onChange={(e) => {
                    setRetiro(e.target.value);
                    setHora(null);
                  }}
                >
                  <option value="">No, vengo sin nada</option>
                  <option value="0">Sí, tengo semipermanente (+$5.000)</option>
                  <option value="1">Sí, tengo capping / soft gel (+$6.000)</option>
                </select>
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
            <div className={styles.mes}>{mesLabel}</div>
            <div className={styles.dias}>
              {diasList.map((d, i) => (
                <button
                  key={d.k}
                  type="button"
                  className={`${styles.dia} ${dia === d.k ? styles.sel : ""}`}
                  disabled={!d.abierto}
                  onClick={() => {
                    setDia(d.k);
                    setHora(null);
                  }}
                >
                  <small>{i === 0 ? "Hoy" : d.d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")}</small>
                  <strong>{d.d.getDate()}</strong>
                </button>
              ))}
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

        {paso === 3 && (
          <section>
            <button type="button" className={styles.volver} onClick={() => irA(2)}>
              ← Cambiar día u horario
            </button>
            <h2>Tus datos</h2>
            <div className={`${styles.campo} ${nombreInvalido ? styles.mal : ""}`}>
              <label htmlFor="nombre">Nombre y apellido</label>
              <input
                id="nombre"
                autoComplete="name"
                placeholder="Ej: Sofía Gómez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              {nombreInvalido && <div className={styles.errorMsg}>Escribí tu nombre</div>}
            </div>
            <div className={`${styles.campo} ${telInvalido ? styles.mal : ""}`}>
              <label htmlFor="tel">WhatsApp</label>
              <input
                id="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Ej: 341 555 1234"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
              />
              <div className={styles.ayuda}>Te escribimos por acá para confirmar el turno.</div>
              {telInvalido && <div className={styles.errorMsg}>Revisá el número (código de área + número)</div>}
            </div>
            <div className={styles.campo}>
              <label htmlFor="nota">Comentario (opcional)</label>
              <textarea
                id="nota"
                rows={3}
                placeholder="Ej: quiero diseño con flores, traigo foto de referencia"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>
          </section>
        )}

        {paso === 4 && servicioActual && dia && hora !== null && (
          <section>
            <div className={styles.ok}>
              <div className={styles.icono}>♡</div>
              <h2>¡Ya casi está!</h2>
              <p>Mandanos el pedido por WhatsApp y te confirmamos el turno.</p>
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
              <a className={`${styles.btn} ${styles.btnWa}`} href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
                Enviar por WhatsApp
              </a>
              <button type="button" className={`${styles.btn} ${styles.btnSec}`} onClick={reiniciar}>
                Sacar otro turno
              </button>
            </div>
          </section>
        )}

        <footer>☾ Lua Nails · Turnos por WhatsApp 341 360-8338</footer>
      </div>

      {paso !== 4 && (
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
              {paso === 3 ? "Ver resumen" : "Continuar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
