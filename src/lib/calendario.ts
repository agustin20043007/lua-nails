// Utilidades de calendario compartidas por /turnos (reservar) y /admin (ver
// la agenda). Las fechas siempre son strings "AAAA-MM-DD" en hora local, y
// "mes" va de 1 a 12 (no de 0 a 11 como Date.getMonth()).

export const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const DIAS_SEMANA_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const iso = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

export function sumarMeses(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const total = (mes - 1) + delta;
  const anioNuevo = anio + Math.floor(total / 12);
  const mesNuevo = ((total % 12) + 12) % 12 + 1;
  return { anio: anioNuevo, mes: mesNuevo };
}

export function primerDiaDelMes(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

export function ultimoDiaDelMes(anio: number, mes: number): string {
  const ultimo = new Date(anio, mes, 0).getDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
}

// Grilla de semanas (domingo a sábado) para pintar el mes; null = celda vacía
// (relleno antes del día 1 o después del último día).
export function grillaMes(anio: number, mes: number): (string | null)[][] {
  const primerDia = new Date(anio, mes - 1, 1);
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const offsetInicial = primerDia.getDay();

  const celdas: (string | null)[] = [];
  for (let i = 0; i < offsetInicial; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push(`${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}
