// Lua Nails · validar números de WhatsApp (Argentina)
//
// Los formularios piden código de área + número, sin 0 ni 15 (ej: "341 555
// 1234"), que es el formato que necesita un link wa.me una vez armado como
// 54 9 + eso. Esto valida que lo tipeado se pueda llevar a ese formato sin
// adivinar: si alguien lo escribe con +54, 0 inicial o 9 de más, se corrige
// solo; si viene con el viejo "15" en el medio (donde no sabemos dónde
// termina el código de área), se rechaza y se pide que lo reescriban.
export function normalizarWhatsApp(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("54")) digitos = digitos.slice(2);
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  if (digitos.startsWith("9")) digitos = digitos.slice(1);
  if (digitos.length < 8 || digitos.length > 11) return null;
  return `549${digitos}`;
}
