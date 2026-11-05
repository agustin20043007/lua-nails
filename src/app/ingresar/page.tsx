"use client";

import { useActionState } from "react";
import Link from "next/link";
import "../auth.css";
import { iniciarSesion, type EstadoAuth } from "@/app/actions/auth";

export default function IngresarPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(iniciarSesion, undefined);

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Iniciar sesión</h1>
        <p className="ln-auth-sub">Lua Nails · Estética &amp; uñas</p>

        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}

        <form action={accion}>
          <div className="ln-auth-campo">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" required />
          </div>
          <div className="ln-auth-campo">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button type="submit" className="ln-auth-btn" disabled={pendiente}>
            {pendiente ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="ln-auth-link">
          ¿No tenés cuenta? <Link href="/registrarse">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
