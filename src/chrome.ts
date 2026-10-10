import { fiThemes } from './themes/registry'
import type { FiThemeId } from './themes/registry'

/**
 * Color de la interfaz del navegador (barra de pestañas/direcciones).
 *
 * `<meta name="theme-color">` lo respetan Safari 15–18, Chrome en Android y
 * las apps instaladas. Safari 26 dejó de leerlo y toma el color del fondo de
 * html/body o del elemento fijo pegado arriba; para ese caso el paquete pinta
 * el fondo de <html> con el mismo rojo de la cinta (no-fonts.css).
 *
 * Las dos cosas son el "cromo" del paquete y se apagan juntas con
 * `fiUi: { chrome: false }` (Nuxt) o `createFiUi({ chrome: false })` (Vue):
 * no se emite theme-color y <html> lleva `data-fi-chrome="off"`.
 *
 * El valor de arranque es el rojo del tema FI. `tests/themes.test.ts`
 * verifica que coincida con --fi-seed-primary.
 */
export const FI_CHROME_COLOR = '#CD171E'

/**
 * Color de la barra con un tema: su primario, el mismo del <html>. Es el
 * valor de partida en cada página — también en las que no montan FiHeader,
 * como un dashboard — y FiHeader lo ajusta después según lo que esté arriba
 * de la pantalla (la cinta o el header oscuro).
 */
export function fiChromeColor(theme: FiThemeId): string {
  return fiThemes[theme]?.chromeColor ?? FI_CHROME_COLOR
}

/** Lee un token de color del documento ya resuelto (solo cliente). */
export function readRootColor(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || null
}
