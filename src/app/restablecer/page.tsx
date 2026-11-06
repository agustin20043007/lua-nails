import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import FormularioRestablecer from "./formulario";

export default async function RestablecerPage() {
  // Llega acá con la sesión temporal que abrió /auth/confirm al verificar el
  // link del mail. Si no hay sesión, el link venció o ya se usó.
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/recuperar");

  return <FormularioRestablecer />;
}
