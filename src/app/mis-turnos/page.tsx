import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { cerrarSesion } from "@/app/actions/auth";
import "../auth.css";

export default async function MisTurnosPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Hola, {usuario.nombre.split(" ")[0]}</h1>
        <p className="ln-auth-sub">Lua Nails · Estética &amp; uñas</p>
        <p className="ln-auth-nota">Acá vas a poder ver tus turnos. Todavía lo estamos armando.</p>
        <p className="ln-auth-link">
          <Link href="/turnos">← Volver a reservar</Link>
        </p>
        <form action={cerrarSesion}>
          <button type="submit" className="ln-auth-btn-sec">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
