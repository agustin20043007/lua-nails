"use client";

import { useActionState } from "react";
import { actualizarDatos, cambiarContrasena, type EstadoPerfil } from "@/app/actions/perfil";

export default function FormularioConfiguracion({
  nombre,
  telefono,
  email,
}: {
  nombre: string;
  telefono: string;
  email: string;
}) {
  return (
    <>
      <SeccionDatos nombre={nombre} telefono={telefono} email={email} />
      <SeccionContrasena />
    </>
  );
}

function SeccionDatos({ nombre, telefono, email }: { nombre: string; telefono: string; email: string }) {
  const [estado, guardar, guardando] = useActionState<EstadoPerfil, FormData>(actualizarDatos, undefined);

  return (
    <div className="ln-auth-card">
      <h2>Tus datos</h2>
      <form action={guardar}>
        <div className="ln-auth-campo">
          <label htmlFor="nombre">Nombre y apellido</label>
          <input id="nombre" name="nombre" autoComplete="name" defaultValue={nombre} required />
        </div>
        <div className="ln-auth-campo">
          <label htmlFor="telefono">WhatsApp</label>
          <input id="telefono" name="telefono" type="tel" inputMode="tel" autoComplete="tel" defaultValue={telefono} required />
        </div>
        <div className="ln-auth-campo">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" defaultValue={email} disabled />
        </div>
        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}
        {estado?.ok && <p className="ln-auth-ok">Guardado.</p>}
        <button type="submit" className="ln-auth-btn" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function SeccionContrasena() {
  const [estado, cambiar, cambiando] = useActionState<EstadoPerfil, FormData>(cambiarContrasena, undefined);

  return (
    <div className="ln-auth-card">
      <h2>Cambiar contraseña</h2>
      <form action={cambiar}>
        <div className="ln-auth-campo">
          <label htmlFor="password">Nueva contraseña</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
        </div>
        <div className="ln-auth-campo">
          <label htmlFor="password2">Repetí la nueva contraseña</label>
          <input id="password2" name="password2" type="password" autoComplete="new-password" minLength={6} required />
        </div>
        {estado?.error && <p className="ln-auth-error">{estado.error}</p>}
        {estado?.ok && <p className="ln-auth-ok">Contraseña actualizada.</p>}
        <button type="submit" className="ln-auth-btn" disabled={cambiando}>
          {cambiando ? "Cambiando…" : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
