"use client";

import { useActionState } from "react";
import Link from "next/link";
import "../auth.css";
import { registrarse, type EstadoAuth } from "@/app/actions/auth";

export default function FormularioRegistrarse() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(registrarse, undefined);

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Creá tu cuenta</h1>
        <p className="ln-auth-sub">Para reservar turnos en Lua Nails</p>

        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}
        {estado?.mensaje && <p className="ln-auth-ok">{estado.mensaje}</p>}

        {!estado?.mensaje && (
          <form action={accion}>
            <div className="ln-auth-campo">
              <label htmlFor="nombre">Nombre y apellido</label>
              <input id="nombre" name="nombre" autoComplete="name" placeholder="Ej: Sofía Gómez" required />
            </div>
            <div className="ln-auth-campo">
              <label htmlFor="telefono">WhatsApp</label>
              <input id="telefono" name="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej: 341 555 1234" required />
            </div>
            <div className="ln-auth-campo">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" required />
            </div>
            <div className="ln-auth-campo">
              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
            </div>
            <div className="ln-auth-campo">
              <label htmlFor="password2">Repetí la contraseña</label>
              <input id="password2" name="password2" type="password" autoComplete="new-password" minLength={6} required />
            </div>
            <button type="submit" className="ln-auth-btn" disabled={pendiente}>
              {pendiente ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="ln-auth-link">
          ¿Ya tenés cuenta? <Link href="/ingresar">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
