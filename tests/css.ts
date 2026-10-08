import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mixOklch } from '../src/color'

/**
 * Lee las semillas y la fórmula de las escalas directamente del CSS, para que
 * las pruebas verifiquen lo que se publica y no una copia que pueda divergir.
 */

const read = (file: string) => readFileSync(fileURLToPath(new URL(`../src/css/${file}`, import.meta.url)), 'utf8')

export const tokensCss = read('tokens.css')
export const themesCss = read('themes.css')

export type Role = 'primary' | 'secondary' | 'tertiary'
export const ROLES: Role[] = ['primary', 'secondary', 'tertiary']
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type Step = typeof STEPS[number]

function declarations(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim()
  return out
}

const baseBlock = /:root,\s*\[data-fi-theme\]\s*\{([\s\S]*?)\n {2}\}/.exec(tokensCss)?.[1]
if (!baseBlock) throw new Error('No se encontró el bloque base en tokens.css')
export const baseDecls = declarations(baseBlock)

/** Temas declarados en themes.css: id → declaraciones. */
export const cssThemes: Record<string, Record<string, string>> = Object.fromEntries(
  [...themesCss.matchAll(/\[data-fi-theme="([^"]+)"\]\s*\{([^}]*)\}/g)]
    .map(m => [m[1]!, declarations(m[2]!)]),
)

/** Semillas efectivas de un tema: las suyas sobre las del tema FI. */
export function seedsOf(themeId: string): Record<Role, string> {
  const own = themeId === 'fi' ? {} : (cssThemes[themeId] ?? {})
  return Object.fromEntries(ROLES.map((role) => {
    const value = own[`--fi-seed-${role}`] ?? baseDecls[`--fi-seed-${role}`]
    if (!value) throw new Error(`Falta --fi-seed-${role}`)
    return [role, value]
  })) as Record<Role, string>
}

/** Reproduce un paso de la escala con la fórmula declarada en tokens.css. */
export function stepColor(role: Role, step: Step, seed: string): string {
  const formula = baseDecls[`--color-fi-${role}-${step}`]
  if (!formula) throw new Error(`Falta --color-fi-${role}-${step}`)
  if (formula === `var(--fi-seed-${role})`) return seed.toUpperCase()
  const m = /^color-mix\(in oklch, var\(--fi-seed-[\w]+\) (\d+)%, (white|black)\)$/.exec(formula)
  if (!m) throw new Error(`Fórmula no reconocida en ${role}-${step}: ${formula}`)
  return mixOklch(seed, Number(m[1]) / 100, m[2] as 'white' | 'black')
}

export const neutral = (step: Step) => {
  const value = baseDecls[`--color-fi-neutral-${step}`]
  if (!value) throw new Error(`Falta --color-fi-neutral-${step}`)
  return value
}

const surfaceBlock = /:root:not\(\.dark\),\s*\.light\s*\{([\s\S]*?)\n {2}\}/.exec(tokensCss)?.[1]
if (!surfaceBlock) throw new Error('No se encontró el bloque de superficies en tokens.css')
const surfaceDecls = declarations(surfaceBlock)

/** Resuelve un token de superficie a hex (literal o var(--color-fi-…)). */
export function surface(token: string): string {
  const value = surfaceDecls[token]
  if (!value) throw new Error(`Falta ${token} en superficies`)
  const ref = /^var\((--[\w-]+)\)$/.exec(value)?.[1]
  const hex = ref ? baseDecls[ref] : value
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`${token} no resuelve a hex: ${value}`)
  return hex.toUpperCase()
}

export const headerBg = (() => {
  const value = baseDecls['--fi-header-bg']
  if (!value) throw new Error('Falta --fi-header-bg')
  return value
})()

/** --fi-navy apunta a un paso de la escala terciaria; devuelve cuál. */
export const navyStep = (() => {
  const m = /^var\(--color-fi-tertiary-(\d+)\)$/.exec(baseDecls['--fi-navy'] ?? '')
  if (!m) throw new Error('--fi-navy debe ser var(--color-fi-tertiary-N)')
  return Number(m[1]) as Step
})()
