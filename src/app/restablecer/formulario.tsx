"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../auth.css";
import { cambiarContrasena, type EstadoPerfil } from "@/app/actions/perfil";

export default function FormularioRestablecer() {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState<EstadoPerfil, FormData>(cambiarContrasena, undefined);

  useEffect(() => {
    if (!estado?.ok) return;
    const id = setTimeout(() => router.push("/"), 1200);
    return () => clearTimeout(id);
  }, [estado, router]);

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Elegí tu nueva contraseña</h1>
        <p className="ln-auth-sub">Lua Nails · Estética &amp; uñas</p>

        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}
        {estado?.ok && <p className="ln-auth-ok">Contraseña actualizada, te estamos llevando adentro…</p>}

        {!estado?.ok && (
          <form action={accion}>
            <div className="ln-auth-campo">
              <label htmlFor="password">Nueva contraseña</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
            </div>
            <div className="ln-auth-campo">
              <label htmlFor="password2">Repetí la nueva contraseña</label>
              <input id="password2" name="password2" type="password" autoComplete="new-password" minLength={6} required />
            </div>
            <button type="submit" className="ln-auth-btn" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Guardar y entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
