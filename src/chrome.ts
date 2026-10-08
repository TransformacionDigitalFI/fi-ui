/**
 * Color de la interfaz del navegador (barra de pestañas/direcciones).
 *
 * `<meta name="theme-color">` lo respetan Safari 15–18, Chrome en Android y
 * las apps instaladas. Safari 26 dejó de leerlo y toma el color del fondo de
 * html/body o del elemento fijo pegado arriba; para ese caso el paquete pinta
 * el fondo de <html> con el mismo rojo de la cinta (tokens.css).
 *
 * El valor de arranque es el rojo del tema FI: lo usa el HTML del servidor
 * antes de que el cliente lea el CSS real (un tema especial lo corrige al
 * montar). `tests/themes.test.ts` verifica que coincida con --fi-seed-primary.
 */
export const FI_CHROME_COLOR = '#CD171E'

/** Lee un token de color del documento ya resuelto (solo cliente). */
export function readRootColor(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || null
}
