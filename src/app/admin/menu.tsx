"use client";

import { useState } from "react";
import Link from "next/link";
import { cerrarSesion } from "@/app/actions/auth";

export default function MenuAdmin({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="ln-admin-menu">
      <button
        type="button"
        className="ln-admin-menu-btn"
        aria-label="Abrir menú"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        ☰
      </button>
      {abierto && (
        <>
          <button
            type="button"
            className="ln-admin-menu-fondo"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
          />
          <nav className="ln-admin-menu-panel">
            <div className="ln-admin-menu-nombre">Hola, {nombre.split(" ")[0]}</div>
            <Link href="/admin" onClick={() => setAbierto(false)}>
              Agenda
            </Link>
            <Link href="/admin/ganancias" onClick={() => setAbierto(false)}>
              Ganancias
            </Link>
            <Link href="/admin/recordatorios" onClick={() => setAbierto(false)}>
              Recordatorios
            </Link>
            <Link href="/admin/configuracion" onClick={() => setAbierto(false)}>
              Configuración
            </Link>
            <form action={cerrarSesion}>
              <button type="submit" className="ln-admin-menu-salir">
                Cerrar sesión
              </button>
            </form>
          </nav>
        </>
      )}
    </div>
  );
}
