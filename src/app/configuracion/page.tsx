import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import MenuCliente from "@/app/menu-cliente";
import FormularioConfiguracion from "./formulario";
import "../auth.css";

export default async function ConfiguracionClientePage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return (
    <div className="ln-auth">
      <div style={{ width: "100%", maxWidth: 380, display: "flex", justifyContent: "flex-end" }}>
        <MenuCliente nombre={usuario.nombre} />
      </div>
      <FormularioConfiguracion nombre={usuario.nombre} telefono={usuario.telefono ?? ""} email={usuario.email} />
    </div>
  );
}
