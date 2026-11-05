import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import Turnero from "./turnero";

export default async function TurnosPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/ingresar");

  return <Turnero nombre={usuario.nombre} />;
}
