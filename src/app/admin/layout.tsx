import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import MenuAdmin from "./menu";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== "admin") redirect("/turnos");

  return (
    <div className="ln-admin">
      <div className="ln-admin-wrap">
        <div className="ln-admin-topbar">
          <MenuAdmin nombre={usuario.nombre} />
          <span className="ln-admin-marca">☾ Lua Nails</span>
        </div>
        {children}
      </div>
    </div>
  );
}
