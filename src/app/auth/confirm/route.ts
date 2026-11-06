import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TipoOtp = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

// Los links que manda Supabase por mail (recuperar contraseña, confirmar
// cuenta, etc.) apuntan acá con un token_hash + type. Lo canjeamos por una
// sesión real antes de mandar a la clienta a la página que corresponda.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as TipoOtp | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Error en /auth/confirm (verifyOtp):", error.message, error.status);
  }

  return NextResponse.redirect(`${origin}/ingresar?error=link_invalido`);
}
