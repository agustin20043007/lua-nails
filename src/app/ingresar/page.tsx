import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import FormularioIngresar from "./formulario";

export default async function IngresarPage() {
  const usuario = await getUsuarioActual();
  if (usuario) {
    redirect(usuario.rol === "admin" ? "/admin" : "/turnos");
  }

  return <FormularioIngresar />;
}
