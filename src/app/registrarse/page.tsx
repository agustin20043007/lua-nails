import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import FormularioRegistrarse from "./formulario";

export default async function RegistrarsePage() {
  const usuario = await getUsuarioActual();
  if (usuario) {
    redirect(usuario.rol === "admin" ? "/admin" : "/mis-turnos");
  }

  return <FormularioRegistrarse />;
}
