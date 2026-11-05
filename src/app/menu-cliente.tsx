"use client";

import { useState } from "react";
import Link from "next/link";
import { cerrarSesion } from "@/app/actions/auth";
import "./menu-cliente.css";

export default function MenuCliente({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="ln-menu">
      <button
        type="button"
        className="ln-menu-btn"
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
            className="ln-menu-fondo"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
          />
          <nav className="ln-menu-panel">
            <div className="ln-menu-nombre">Hola, {nombre.split(" ")[0]}</div>
            <Link href="/turnos" onClick={() => setAbierto(false)}>
              Reservar turno
            </Link>
            <Link href="/mis-turnos" onClick={() => setAbierto(false)}>
              Mis turnos
            </Link>
            <Link href="/configuracion" onClick={() => setAbierto(false)}>
              Configuración
            </Link>
            <form action={cerrarSesion}>
              <button type="submit" className="ln-menu-salir">
                Cerrar sesión
              </button>
            </form>
          </nav>
        </>
      )}
    </div>
  );
}
