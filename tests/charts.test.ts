import { describe, expect, it } from 'vitest'
import { contrast, deltaEOk, hexToOklch, mixOklchColors } from '../src/color'
import type { FiVision } from '../src/color'
import { baseDecls, lightRuntimeStep, neutral, noFontsCss, resolveFixed, rootDecls, STATUSES, statusColor, surface, themeScale, themesCss, WHITE } from './css'

/**
 * Paleta de datos (contrato D4). La categórica es fija — un tema especial no
 * repinta las gráficas — pero sale de los roles del tema FI: aquí se
 * recalcula cada valor desde las semillas para que no se desvíe de ellos.
 * Umbrales del método de visualización de datos: ΔE OKLab ×100 ≥ 15 entre
 * vecinas con visión normal y ≥ 8 con protanopia/deuteranopia (Machado
 * 2009), marcas ≥ 3:1 contra la superficie.
 */

const fi = themeScale('fi')

/** Cómo se deriva cada color de la paleta categórica, en orden. */
const DERIVATION: [string, () => string][] = [
  ['azul marino (tertiary-800)', () => fi('tertiary', 800)],
  ['azul pizarra (tertiary-500)', () => fi('tertiary', 500)],
  ['oro (secondary-500)', () => fi('secondary', 500)],
  ['púrpura (tertiary-500 ↔ primary-500)', () => mixOklchColors(fi('tertiary', 500), fi('primary', 500), 0.5)],
  ['oro oscuro (secondary-700)', () => fi('secondary', 700)],
  ['azul verdoso (tertiary-500 75% ↔ secondary-500)', () => mixOklchColors(fi('tertiary', 500), fi('secondary', 500), 0.75)],
  ['ciruela (tertiary-700 ↔ primary-700)', () => mixOklchColors(fi('tertiary', 700), fi('primary', 700), 0.5)],
  ['grafito (neutral-500)', () => neutral(500)],
]

const chart = Array.from({ length: 8 }, (_, i) => {
  const value = rootDecls[`--fi-chart-${i + 1}`]
  if (!value) throw new Error(`Falta --fi-chart-${i + 1}`)
  return resolveFixed(value)
})

const seq = Array.from({ length: 5 }, (_, i) => {
  const value = rootDecls[`--fi-chart-seq-${i + 1}`]
  if (!value) throw new Error(`Falta --fi-chart-seq-${i + 1}`)
  return resolveFixed(value)
})

const page = surface('--ui-bg')
const text = surface('--ui-text')

describe('paleta categórica --fi-chart-1…8', () => {
  it.each(DERIVATION.map(([name, derive], i) => [i + 1, name, derive] as const))(
    '--fi-chart-%i es %s del tema FI',
    (n, _name, derive) => {
      expect(chart[n - 1]).toBe(derive())
    },
  )

  it.each(chart.map((c, i) => [i + 1, c] as const))('--fi-chart-%i (%s) ≥ 3:1 sobre blanco y sobre la página', (_n, c) => {
    expect(contrast(c, WHITE)).toBeGreaterThanOrEqual(3)
    expect(contrast(c, page)).toBeGreaterThanOrEqual(3)
  })

  it.each<[FiVision, number]>([['normal', 15], ['protan', 8], ['deutan', 8]])(
    'vecinas distinguibles con visión %s (ΔE×100 ≥ %i)',
    (vision, min) => {
      for (let i = 0; i < chart.length - 1; i++) {
        const d = deltaEOk(chart[i]!, chart[i + 1]!, vision) * 100
        expect(d, `--fi-chart-${i + 1} ↔ ${i + 2}`).toBeGreaterThanOrEqual(min)
      }
    },
  )

  it('las tres primeras se distinguen entre todas (dispersión, mapas)', () => {
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        expect(deltaEOk(chart[i]!, chart[j]!) * 100, `${i + 1} ↔ ${j + 1}`).toBeGreaterThanOrEqual(15)
        expect(deltaEOk(chart[i]!, chart[j]!, 'deutan') * 100, `${i + 1} ↔ ${j + 1}`).toBeGreaterThanOrEqual(8)
      }
    }
  })

  it('ningún color se confunde con verde, ámbar o rojo de estado, ni con el rojo de marca', () => {
    // `info` (azul cielo) queda fuera a propósito: el azul es la identidad FI
    // (azul marino, pizarra) y el contrato solo reserva verde, ámbar y rojo.
    const reserved = [
      ...STATUSES.filter(status => status !== 'info')
        .flatMap(status => [statusColor(status, 500), statusColor(status, lightRuntimeStep(status))]),
      fi('primary', 500),
    ]
    for (const c of chart) {
      for (const r of reserved) expect(deltaEOk(c, r) * 100, `${c} vs ${r}`).toBeGreaterThanOrEqual(10)
    }
  })

  it('no sigue a los temas especiales: se declara solo en :root, con valores fijos', () => {
    expect(themesCss).not.toContain('--fi-chart')
    expect(Object.keys(baseDecls).filter(k => k.startsWith('--fi-chart'))).toEqual([])
    for (let i = 1; i <= 8; i++) expect(rootDecls[`--fi-chart-${i}`]).not.toMatch(/--color-fi-(primary|secondary|tertiary)/)
  })
})

describe('rampa secuencial --fi-chart-seq-1…5', () => {
  it('un solo matiz (pizarra), de claro a oscuro, con pasos que se ven', () => {
    const lch = seq.map(hexToOklch)
    for (let i = 1; i < lch.length; i++) {
      expect(lch[i]!.l, `seq-${i + 1}`).toBeLessThan(lch[i - 1]!.l - 0.06)
      expect(Math.abs(lch[i]!.h - lch[0]!.h), `matiz de seq-${i + 1}`).toBeLessThan(15)
    }
  })

  it('texto encima: --ui-text en 1–3, blanco en 4–5', () => {
    seq.slice(0, 3).forEach((c, i) => expect(contrast(text, c), `seq-${i + 1}`).toBeGreaterThanOrEqual(4.5))
    seq.slice(3).forEach((c, i) => expect(contrast(WHITE, c), `seq-${i + 4}`).toBeGreaterThanOrEqual(4.5))
  })
})

describe('utilidades de Tailwind para la paleta', () => {
  it.each([...Array.from({ length: 8 }, (_, i) => `chart-${i + 1}`), ...Array.from({ length: 5 }, (_, i) => `chart-seq-${i + 1}`)])(
    '--color-fi-%s',
    (name) => {
      expect(noFontsCss).toContain(`--color-fi-${name}: var(--fi-${name});`)
    },
  )
})
