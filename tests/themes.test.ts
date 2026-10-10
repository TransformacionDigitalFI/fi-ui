import { describe, expect, it } from 'vitest'
import { contrast, hexToOklch } from '../src/color'
import { FI_CHROME_COLOR, fiChromeColor } from '../src/chrome'
import { fiThemeIds, fiThemes } from '../src/themes/registry'
import { baseDecls, cssThemes, headerBg, neutral, ROLES, scopedThemeDecls, seedsOf, stepColor, STEPS, themeScale } from './css'

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

  it('el color de la barra del navegador de cada tema es su primario', () => {
    for (const id of fiThemeIds) {
      expect(fiThemes[id].chromeColor.toUpperCase(), id).toBe(seedsOf(id).primary.toUpperCase())
      expect(fiChromeColor(id), id).toBe(fiThemes[id].chromeColor)
    }
  })

  it('las escalas se derivan de la semilla en todos los pasos', () => {
    for (const role of ROLES) {
      for (const step of STEPS) {
        expect(baseDecls[`--color-fi-${role}-${step}`], `${role}-${step}`).toContain(`--fi-seed-${role}`)
      }
    }
  })

  it('un tema con alcance local reenlaza todos los pasos y los tokens runtime', () => {
    for (const role of ROLES) {
      for (const step of STEPS) {
        expect(scopedThemeDecls[`--ui-color-${role}-${step}`], `${role}-${step}`).toBe(`var(--color-fi-${role}-${step})`)
      }
      expect(scopedThemeDecls[`--ui-${role}`], role).toMatch(new RegExp(`^var\\(--ui-color-${role}-\\d+\\)$`))
    }
  })
})

describe.each(fiThemeIds)('tema %s: escalas', (id) => {
  const scale = themeScale(id)

  it.each(ROLES)('%s: la escala va de claro a oscuro sin saltos hacia atrás', (role) => {
    const lightness = STEPS.map(step => hexToOklch(scale(role, step)).l)
    for (let i = 1; i < lightness.length; i++) expect(lightness[i]).toBeLessThan(lightness[i - 1]!)
  })

  it.each(ROLES)('%s: botón sólido en una isla oscura (400 con texto neutral-900)', (role) => {
    const bg = scale(role, 400)
    expect(contrast(bg, neutral(900)), `${role} ${bg}`).toBeGreaterThanOrEqual(AA)
  })

  it('enlace activo del header oscuro legible (primary-400 sobre --fi-header-bg)', () => {
    const link = scale('primary', 400)
    expect(contrast(link, headerBg), link).toBeGreaterThanOrEqual(AA)
  })
})

describe('neutro grafito en islas oscuras', () => {
  // En claro el texto atenuado es pizarra (tests/surfaces.test.ts); el
  // grafito es la escala de las islas: Nuxt UI usa 400 como text-muted
  // sobre neutral-900 (bg) y el pie usa neutral-700.
  it('texto atenuado (400) legible sobre el pie (700), sobre bg (900) y sobre --fi-header-bg', () => {
    expect(contrast(neutral(400), neutral(700))).toBeGreaterThanOrEqual(AA)
    expect(contrast(neutral(400), neutral(900))).toBeGreaterThanOrEqual(AA)
    expect(contrast(neutral(400), headerBg)).toBeGreaterThanOrEqual(AA)
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
