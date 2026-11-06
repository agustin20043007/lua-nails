"use client";

import { useActionState } from "react";
import Link from "next/link";
import "../auth.css";
import { solicitarRecuperacion, type EstadoAuth } from "@/app/actions/auth";

export default function FormularioRecuperar() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(solicitarRecuperacion, undefined);

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Recuperar contraseña</h1>
        <p className="ln-auth-sub">Te mandamos un link por mail para elegir una nueva</p>

        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}
        {estado?.mensaje && <p className="ln-auth-ok">{estado.mensaje}</p>}

        {!estado?.mensaje && (
          <form action={accion}>
            <div className="ln-auth-campo">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" required />
            </div>
            <button type="submit" className="ln-auth-btn" disabled={pendiente}>
              {pendiente ? "Enviando…" : "Mandar link"}
            </button>
          </form>
        )}

        <p className="ln-auth-link">
          <Link href="/ingresar">← Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
