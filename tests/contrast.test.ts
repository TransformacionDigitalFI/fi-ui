import { describe, expect, it } from 'vitest'
import { contrast, deltaEOk } from '../src/color'
import { fiPrimaryOnTint } from '../src/app-config'
import { fiThemeIds } from '../src/themes/registry'
import type { Role, Status, Step } from './css'
import { goldStep, headerBg, lightRuntimeStep, navyStep, neutral, ROLES, STATUSES, statusColor, SURFACES, themeScale, tint, WHITE } from './css'

/**
 * Contraste de color por tema (contrato D3). Cada par es uno que la
 * interfaz pinta de verdad:
 *   - texto de rol o de estado sobre las tres superficies claras;
 *   - insignia soft/subtle: texto sobre un tinte del 10 % del mismo color,
 *     encima de una tarjeta, de la página o de una banda;
 *   - botón sólido: texto blanco sobre el color.
 * Los pasos no se escriben aquí: se leen de tokens.css (el token runtime de
 * modo claro) y de src/app-config.js (el texto primario sobre tinte).
 */

const AA = 4.5
const NON_TEXT = 3

const surfaces = Object.entries(SURFACES).map(([name, get]) => [name, get()] as const)
const [, page] = surfaces[0]!
const [, card] = surfaces[1]!

/** Paso del texto primario sobre su tinte, leído de fiPrimaryOnTint. */
const primaryOnTintStep = (() => {
  const m = /(?:^|\s)text-primary-(\d+)(?:\s|$)/.exec(fiPrimaryOnTint)
  if (!m) throw new Error(`fiPrimaryOnTint no fija un paso: ${fiPrimaryOnTint}`)
  return Number(m[1]) as Step
})()

/** Combinaciones que la documentación prohíbe, con su motivo. */
const FORBIDDEN_ON_MUTED: Role[] = ['primary'] // text-primary (#CD171E) sobre bg-muted: 4.35:1

describe.each(fiThemeIds)('tema %s', (id) => {
  const scale = themeScale(id)
  const runtime = (role: Role) => scale(role, lightRuntimeStep(role))
  const onTint = (role: Role) => (role === 'primary' ? scale(role, primaryOnTintStep) : runtime(role))

  describe.each(ROLES)('%s', (role) => {
    it.each(surfaces)('como texto, legible sobre %s', (name, bg) => {
      if (name.startsWith('bg-muted') && FORBIDDEN_ON_MUTED.includes(role)) return
      expect(contrast(runtime(role), bg), `${runtime(role)} sobre ${bg}`).toBeGreaterThanOrEqual(AA)
    })

    it.each(surfaces)('insignia soft/subtle legible sobre %s', (_name, bg) => {
      const fill = tint(runtime(role), bg)
      expect(contrast(onTint(role), fill), `${onTint(role)} sobre ${fill}`).toBeGreaterThanOrEqual(AA)
    })

    it('botón sólido con texto blanco', () => {
      // El sólido primario es el 500 exacto (#CD171E en el tema FI).
      const bg = role === 'primary' ? scale('primary', 500) : runtime(role)
      expect(contrast(WHITE, bg), bg).toBeGreaterThanOrEqual(AA)
    })
  })

  it('--fi-navy legible como título sobre las tres superficies y con texto blanco encima', () => {
    const navy = scale('tertiary', navyStep)
    for (const [, bg] of surfaces) expect(contrast(navy, bg), `${navy} sobre ${bg}`).toBeGreaterThanOrEqual(AA)
    expect(contrast(WHITE, navy), navy).toBeGreaterThanOrEqual(AA)
  })

  it('--fi-gold se distingue sobre --fi-navy y sobre --fi-header-bg (filete, 3:1)', () => {
    const gold = scale('secondary', goldStep)
    const navy = scale('tertiary', navyStep)
    expect(contrast(gold, navy), `${gold} sobre ${navy}`).toBeGreaterThanOrEqual(NON_TEXT)
    expect(contrast(gold, headerBg), `${gold} sobre ${headerBg}`).toBeGreaterThanOrEqual(NON_TEXT)
  })

  it('el primario (marca) no se confunde con un color de estado', () => {
    // Ver themes.css: el primario nunca comunica un estado; esto evita que un
    // tema nuevo copie uno. ΔE OKLab 0.07 ≈ 3.5 diferencias apenas visibles.
    const brand = scale('primary', 500)
    for (const status of STATUSES) {
      const state = statusColor(status, lightRuntimeStep(status))
      expect(deltaEOk(brand, state), `${brand} vs ${status} ${state}`).toBeGreaterThanOrEqual(0.07)
    }
  })
})

describe('combinaciones prohibidas siguen siéndolo', () => {
  it('text-primary sobre bg-muted no llega a AA en algún tema (si llegara, sobra la prohibición)', () => {
    const muted = SURFACES['bg-muted (banda)']()
    const worst = Math.min(...fiThemeIds.map(id => contrast(themeScale(id)('primary', lightRuntimeStep('primary')), muted)))
    expect(worst).toBeLessThan(AA)
  })
})

describe.each(STATUSES)('estado %s', (status) => {
  const step = lightRuntimeStep(status)
  const color = statusColor(status, step)

  function passesEverywhere(c: string): boolean {
    return surfaces.every(([, bg]) => contrast(c, bg) >= AA && contrast(c, tint(c, bg)) >= AA)
      && contrast(WHITE, c) >= AA
  }

  it.each(surfaces)('como texto, legible sobre %s', (_name, bg) => {
    expect(contrast(color, bg), `${color} sobre ${bg}`).toBeGreaterThanOrEqual(AA)
  })

  it.each(surfaces)('insignia soft/subtle legible sobre %s', (_name, bg) => {
    expect(contrast(color, tint(color, bg)), `${color} sobre su tinte en ${bg}`).toBeGreaterThanOrEqual(AA)
  })

  it('botón sólido con texto blanco', () => {
    expect(contrast(WHITE, color), color).toBeGreaterThanOrEqual(AA)
  })

  it('el paso es el mínimo que pasa (uno más claro ya no)', () => {
    const lighter = (step - 100) as Step
    expect(passesEverywhere(statusColor(status, lighter)), `${status}-${lighter} también pasaría`).toBe(false)
  })

  it('en una isla oscura (400 sobre --fi-header-bg y neutral-900)', () => {
    const island = statusColor(status, 400)
    expect(contrast(island, headerBg)).toBeGreaterThanOrEqual(AA)
    expect(contrast(island, neutral(900))).toBeGreaterThanOrEqual(AA)
  })

  it('no se confunde con el primario ni con el rojo FI', () => {
    expect(deltaEOk(color, '#CD171E')).toBeGreaterThanOrEqual(0.07)
  })
})

describe('el estado es más oscuro que el primario: lo separa la luminosidad', () => {
  it.each(STATUSES as Status[])('%s', (status) => {
    const state = statusColor(status, lightRuntimeStep(status))
    for (const id of fiThemeIds) {
      expect(contrast(WHITE, state), `${status} vs primario de ${id}`)
        .toBeGreaterThan(contrast(WHITE, themeScale(id)('primary', 500)))
    }
  })
})
