import { describe, expect, it } from 'vitest'
import { contrast, deltaEOk, relativeLuminance } from '../src/color'
import { seedsOf, stepColor, surface, SURFACES, WHITE } from './css'

/**
 * Superficies de modo claro (contrato D2 y D5): página pizarra, tarjetas
 * blancas, bandas bg-muted y el tinte fuerte bg-accented, con lo que se pinta
 * encima. Reemplaza la prueba vieja de "neutro sobre neutral-50", que ya no
 * describía ninguna superficie real: en claro el texto atenuado es pizarra.
 */

const AA = 4.5
const NON_TEXT = 3
// Un hover o una selección tienen que verse sin tener que buscarlos. ΔE OKLab
// 0.02 es la diferencia apenas perceptible; se pide el doble.
const VISIBLE_TINT = 0.04

const surfaces = Object.entries(SURFACES).map(([name, get]) => [name, get()] as const)
const accented = surface('--ui-bg-accented')

describe('la inversión FI', () => {
  it('la tarjeta es blanca y la página no', () => {
    expect(surface('--ui-bg-elevated')).toBe(WHITE)
    expect(surface('--ui-bg')).not.toBe(WHITE)
  })

  it('los tintes van de claro a oscuro: tarjeta > página > banda > acentuado', () => {
    const order = ['--ui-bg-elevated', '--ui-bg', '--ui-bg-muted', '--ui-bg-accented'].map(t => relativeLuminance(surface(t)))
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeLessThan(order[i - 1]!)
  })
})

describe.each([...surfaces, ['bg-accented (hover, activo)', accented] as const])('texto sobre %s', (_name, bg) => {
  it.each(['--ui-text', '--ui-text-highlighted', '--ui-text-toned', '--ui-text-muted', '--ui-text-dimmed'])('%s legible', (token) => {
    expect(contrast(surface(token), bg), `${surface(token)} sobre ${bg}`).toBeGreaterThanOrEqual(AA)
  })
})

describe('jerarquía del texto', () => {
  it('highlighted (títulos, menús) es más oscuro que el cuerpo, como en Nuxt UI', () => {
    expect(relativeLuminance(surface('--ui-text-highlighted'))).toBeLessThan(relativeLuminance(surface('--ui-text')))
  })
})

describe('hover y selección se ven en las dos superficies (contrato D2)', () => {
  it.each(surfaces)('bg-accented (hover de botones y menús) se distingue de %s', (_name, bg) => {
    expect(deltaEOk(accented, bg), `${accented} vs ${bg}`).toBeGreaterThanOrEqual(VISIBLE_TINT)
  })

  it.each(surfaces.slice(0, 2))('bg-muted (reposo de soft, fila seleccionada) se distingue de %s', (_name, bg) => {
    const muted = surface('--ui-bg-muted')
    expect(deltaEOk(muted, bg), `${muted} vs ${bg}`).toBeGreaterThanOrEqual(VISIBLE_TINT)
  })
})

describe('bordes de los controles (contrato D5, WCAG 1.4.11)', () => {
  // input, select, textarea, checkbox, radio y el botón outline neutro dibujan
  // su contorno con ring-accented, y el campo es blanco: el borde tiene que
  // separarse del relleno y de lo que rodea al control.
  const border = surface('--ui-border-accented')

  it.each(surfaces)('border-accented ≥ 3:1 contra %s', (_name, bg) => {
    expect(contrast(border, bg), `${border} sobre ${bg}`).toBeGreaterThanOrEqual(NON_TEXT)
  })
})

describe('el botón primario se distingue de las superficies (3:1, componente)', () => {
  it.each(surfaces)('sobre %s', (_name, bg) => {
    expect(contrast(stepColor('primary', 500, seedsOf('fi').primary), bg)).toBeGreaterThanOrEqual(NON_TEXT)
  })
})
