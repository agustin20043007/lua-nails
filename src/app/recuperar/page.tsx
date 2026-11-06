import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import FormularioRecuperar from "./formulario";

export default async function RecuperarPage() {
  const usuario = await getUsuarioActual();
  if (usuario) {
    redirect(usuario.rol === "admin" ? "/admin" : "/turnos");
  }

  return <FormularioRecuperar />;
}
