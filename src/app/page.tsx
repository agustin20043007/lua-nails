import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";

export default async function RootPage() {
  const usuario = await getUsuarioActual();
  redirect(usuario ? "/turnos" : "/ingresar");
}
