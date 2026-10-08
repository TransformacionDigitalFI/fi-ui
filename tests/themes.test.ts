import { describe, expect, it } from 'vitest'
import { contrast, hexToOklch } from '../src/color'
import { FI_CHROME_COLOR } from '../src/chrome'
import { fiThemeIds, fiThemes } from '../src/themes/registry'
import { baseDecls, cssThemes, headerBg, navyStep, neutral, ROLES, seedsOf, stepColor, STEPS, surface } from './css'

const AA = 4.5

describe('registro y CSS describen los mismos temas', () => {
  it('cada tema del CSS está en el registro', () => {
    expect(Object.keys(cssThemes).sort()).toEqual(fiThemeIds.filter(id => id !== 'fi').sort())
  })

  it('un tema con listón declara su color, y uno sin listón no', () => {
    for (const id of fiThemeIds) {
      const declaresRibbon = id !== 'fi' && cssThemes[id]?.['--fi-ribbon'] !== undefined
      expect(declaresRibbon, id).toBe(fiThemes[id].ribbon)
    }
  })

  it('las escalas se derivan de la semilla en todos los pasos', () => {
    for (const role of ROLES) {
      for (const step of STEPS) {
        expect(baseDecls[`--color-fi-${role}-${step}`], `${role}-${step}`).toContain(`--fi-seed-${role}`)
      }
    }
  })
})

describe.each(fiThemeIds)('tema %s', (id) => {
  const seeds = seedsOf(id)

  it.each(ROLES)('%s: botón sólido legible en modo claro (500 con texto blanco)', (role) => {
    const bg = stepColor(role, 500, seeds[role])
    expect(contrast(bg, '#FFFFFF'), `${role} ${bg}`).toBeGreaterThanOrEqual(AA)
  })

  it.each(ROLES)('%s: botón sólido legible en modo oscuro (400 con texto neutral-900)', (role) => {
    const bg = stepColor(role, 400, seeds[role])
    expect(contrast(bg, neutral(900)), `${role} ${bg}`).toBeGreaterThanOrEqual(AA)
  })

  it('enlace activo del header oscuro legible (primary-400 sobre --fi-header-bg)', () => {
    const link = stepColor('primary', 400, seeds.primary)
    expect(contrast(link, headerBg), link).toBeGreaterThanOrEqual(AA)
  })

  it('texto blanco legible en la etiqueta-flecha (--fi-navy)', () => {
    const navy = stepColor('tertiary', navyStep, seeds.tertiary)
    expect(contrast('#FFFFFF', navy), navy).toBeGreaterThanOrEqual(AA)
  })

  it('títulos en --fi-navy legibles sobre el fondo de página', () => {
    const navy = stepColor('tertiary', navyStep, seeds.tertiary)
    expect(contrast(navy, surface('--ui-bg')), navy).toBeGreaterThanOrEqual(AA)
  })

  it.each(ROLES)('%s: la escala va de claro a oscuro sin saltos hacia atrás', (role) => {
    const lightness = STEPS.map(step => hexToOklch(stepColor(role, step, seeds[role])).l)
    for (let i = 1; i < lightness.length; i++) expect(lightness[i]).toBeLessThan(lightness[i - 1]!)
  })
})

describe('neutro', () => {
  it('texto atenuado de Nuxt UI (500) legible sobre blanco y sobre bg-muted', () => {
    expect(contrast(neutral(500), '#FFFFFF')).toBeGreaterThanOrEqual(AA)
    expect(contrast(neutral(500), neutral(50))).toBeGreaterThanOrEqual(AA)
  })

  it('texto atenuado en oscuro (400) legible sobre el pie (700) y sobre bg (900)', () => {
    expect(contrast(neutral(400), neutral(700))).toBeGreaterThanOrEqual(AA)
    expect(contrast(neutral(400), neutral(900))).toBeGreaterThanOrEqual(AA)
  })
})

describe('superficies de modo claro (fondo pizarra, tarjetas blancas)', () => {
  it.each(['--ui-bg', '--ui-bg-elevated', '--ui-bg-muted'])('texto, secundario y atenuado legibles sobre %s', (bg) => {
    expect(contrast(surface('--ui-text'), surface(bg))).toBeGreaterThanOrEqual(AA)
    expect(contrast(surface('--ui-text-muted'), surface(bg))).toBeGreaterThanOrEqual(AA)
    expect(contrast(surface('--ui-text-dimmed'), surface(bg))).toBeGreaterThanOrEqual(AA)
  })

  it('el botón primario se distingue del fondo de página (3:1, componente)', () => {
    expect(contrast(stepColor('primary', 500, seedsOf('fi').primary), surface('--ui-bg'))).toBeGreaterThanOrEqual(3)
  })
})

describe('la identidad FI no se mueve', () => {
  it('el primario es exactamente el rojo del portal', () => {
    expect(seedsOf('fi').primary).toBe('#CD171E')
    expect(stepColor('primary', 500, seedsOf('fi').primary)).toBe('#CD171E')
  })

  it('la barra del navegador arranca con ese mismo rojo', () => {
    expect(FI_CHROME_COLOR).toBe(seedsOf('fi').primary)
  })
})
