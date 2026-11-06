import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import FormularioIngresar from "./formulario";

export default async function IngresarPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const usuario = await getUsuarioActual();
  if (usuario) {
    redirect(usuario.rol === "admin" ? "/admin" : "/turnos");
  }

  const { error } = await searchParams;
  return <FormularioIngresar errorLink={error === "link_invalido"} />;
}
