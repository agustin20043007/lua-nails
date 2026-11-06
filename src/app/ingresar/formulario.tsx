"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import "../auth.css";
import { iniciarSesion, type EstadoAuth } from "@/app/actions/auth";

const CLAVE_EMAIL_RECORDADO = "lua-nails-email-recordado";

// Lectura del localStorage vía useSyncExternalStore (no un efecto con
// setState) para que no haya mismatch entre el render del servidor y el del
// cliente: en el servidor no hay nada guardado, así que arranca en null.
const sinSuscripcion = () => () => {};
const leerEmailGuardado = () => {
  try {
    return localStorage.getItem(CLAVE_EMAIL_RECORDADO);
  } catch {
    return null;
  }
};
const sinEmailGuardado = () => null;

export default function FormularioIngresar({ errorLink }: { errorLink?: boolean }) {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(iniciarSesion, undefined);
  const emailGuardado = useSyncExternalStore(sinSuscripcion, leerEmailGuardado, sinEmailGuardado);
  const [email, setEmail] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [sincronizado, setSincronizado] = useState(false);

  if (!sincronizado && emailGuardado) {
    setEmail(emailGuardado);
    setRecordar(true);
    setSincronizado(true);
  }

  function alEnviar() {
    try {
      if (recordar && email) {
        localStorage.setItem(CLAVE_EMAIL_RECORDADO, email);
      } else {
        localStorage.removeItem(CLAVE_EMAIL_RECORDADO);
      }
    } catch {
      // Ídem arriba.
    }
  }

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Iniciar sesión</h1>
        <p className="ln-auth-sub">Lua Nails · Estética &amp; uñas</p>

        {errorLink && (
          <p className="ln-auth-error">Ese link venció o ya se usó. Pedí uno nuevo para restablecer la contraseña.</p>
        )}
        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}

        <form action={accion} onSubmit={alEnviar}>
          <div className="ln-auth-campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="ln-auth-campo">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <label className="ln-auth-checkbox">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
            Recordar mi usuario
          </label>
          <button type="submit" className="ln-auth-btn" disabled={pendiente}>
            {pendiente ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="ln-auth-link">
          <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="ln-auth-link">
          ¿No tenés cuenta? <Link href="/registrarse">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
