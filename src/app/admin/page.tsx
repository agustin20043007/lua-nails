import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { cerrarSesion } from "@/app/actions/auth";
import "../auth.css";

export default async function AdminPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "admin") redirect("/mis-turnos");

  return (
    <div className="ln-auth">
      <div className="ln-auth-card">
        <div className="ln-auth-luna">☾</div>
        <h1>Hola, {usuario.nombre.split(" ")[0]}</h1>
        <p className="ln-auth-sub">Panel de Lua Nails</p>
        <p className="ln-auth-nota">Acá va a estar la agenda del día y de la semana. Todavía lo estamos armando.</p>
        <form action={cerrarSesion}>
          <button type="submit" className="ln-auth-btn-sec">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
