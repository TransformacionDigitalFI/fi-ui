import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import colors from 'tailwindcss/colors'
import { composite, mixOklch, mixOklchColors, toHexColor } from '../src/color'
import { fiStatusColors } from '../src/app-config'

/**
 * Lee las semillas y la fórmula de las escalas directamente del CSS, para que
 * las pruebas verifiquen lo que se publica y no una copia que pueda divergir.
 */

const read = (file: string) => readFileSync(fileURLToPath(new URL(`../src/css/${file}`, import.meta.url)), 'utf8')

export const tokensCss = read('tokens.css')
export const themesCss = read('themes.css')
export const noFontsCss = read('no-fonts.css')

export type Role = 'primary' | 'secondary' | 'tertiary'
export const ROLES: Role[] = ['primary', 'secondary', 'tertiary']
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type Step = typeof STEPS[number]

export type Status = keyof typeof fiStatusColors
export const STATUSES = Object.keys(fiStatusColors) as Status[]

export const WHITE = '#FFFFFF'

function declarations(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  // Sin comentarios: un `;` dentro de un comentario partiría la declaración.
  const clean = block.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim()
  return out
}

/** Une las declaraciones de todos los bloques con ese selector exacto. */
function blocks(css: string, selector: RegExp): Record<string, string> {
  const re = new RegExp(`(?:^|\\n)\\s*${selector.source}\\s*\\{([\\s\\S]*?)\\n {2}\\}`, 'g')
  const found = [...css.matchAll(re)]
  if (!found.length) throw new Error(`No se encontró el bloque ${selector.source}`)
  return Object.assign({}, ...found.map(m => declarations(m[1]!)))
}

export const baseDecls = blocks(tokensCss, /:root,\s*\[data-fi-theme\]/)

/** Bloques de modo claro: superficies y pasos de roles y estados. */
export const lightDecls = blocks(tokensCss, /:root:not\(\.dark\),\s*\.light:not\(\.dark\)/)

/** Bloques `:root` sueltos (radio, paleta de datos). */
export const rootDecls = blocks(tokensCss, /:root/)

/** Reenlace de los temas con alcance local (un contenedor con data-fi-theme). */
export const scopedThemeDecls = blocks(tokensCss, /\[data-fi-theme\]:not\(:root\)/)

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

/** Un tema resuelto: cada paso de cada rol. */
export function themeScale(themeId: string): (role: Role, step: Step) => string {
  const seeds = seedsOf(themeId)
  return (role, step) => stepColor(role, step, seeds[role])
}

export const neutral = (step: Step) => {
  const value = baseDecls[`--color-fi-neutral-${step}`]
  if (!value) throw new Error(`Falta --color-fi-neutral-${step}`)
  return value
}

/**
 * Resuelve un valor de color de las escalas fijas: literal, var(--color-fi-…)
 * (neutro o pizarra) o color-mix(in oklch, var(a) p%, var(b)).
 */
export function resolveFixed(value: string): string {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase()
  const ref = /^var\((--[\w-]+)\)$/.exec(v)?.[1]
  if (ref) {
    const target = baseDecls[ref] ?? lightDecls[ref] ?? rootDecls[ref]
    if (!target) throw new Error(`${ref} no está declarado`)
    return resolveFixed(target)
  }
  const mix = /^color-mix\(in oklch, var\((--[\w-]+)\)(?: (\d+)%)?, var\((--[\w-]+)\)(?: (\d+)%)?\)$/.exec(v)
  if (mix) {
    const a = resolveFixed(`var(${mix[1]})`)
    const b = resolveFixed(`var(${mix[3]})`)
    const wA = mix[2] ? Number(mix[2]) / 100 : mix[4] ? 1 - Number(mix[4]) / 100 : 0.5
    return mixOklchColors(a, b, wA)
  }
  throw new Error(`Valor no resoluble a hex: ${value}`)
}

/** Token de superficie o texto de modo claro, ya en hex. */
export function surface(token: string): string {
  const value = lightDecls[token]
  if (!value) throw new Error(`Falta ${token} en el bloque de modo claro`)
  return resolveFixed(value)
}

/** Las tres superficies claras sobre las que se lee todo. */
export const SURFACES = {
  'bg-default (página)': () => surface('--ui-bg'),
  'bg-elevated (tarjeta)': () => surface('--ui-bg-elevated'),
  'bg-muted (banda)': () => surface('--ui-bg-muted'),
} as const

/**
 * Paso de la escala que un token runtime usa en modo claro:
 * `--ui-success: var(--ui-color-success-800)` → 800. Sin remapeo, 500 (lo que
 * pone Nuxt UI).
 */
export function lightRuntimeStep(key: Role | Status): Step {
  const value = lightDecls[`--ui-${key}`]
  if (!value) return 500
  const m = new RegExp(`^var\\(--ui-color-${key}-(\\d+)\\)$`).exec(value)
  if (!m) throw new Error(`--ui-${key} debe apuntar a un paso: ${value}`)
  return Number(m[1]) as Step
}

/** Color de estado de la paleta de Tailwind que mapea fiStatusColors. */
export function statusColor(status: Status, step: Step): string {
  const palette = (colors as unknown as Record<string, Record<number, string>>)[fiStatusColors[status]]
  const value = palette?.[step]
  if (!value) throw new Error(`Tailwind no tiene ${fiStatusColors[status]}-${step}`)
  return toHexColor(value)
}

/** `bg-{color}/10` sobre una superficie: el fondo de una insignia soft. */
export const tint = (color: string, over: string, alpha = 0.1) => composite(color, alpha, over)

export const headerBg = (() => {
  const value = baseDecls['--fi-header-bg']
  if (!value) throw new Error('Falta --fi-header-bg')
  return value
})()

/** --fi-navy / --fi-gold apuntan a un paso de una escala; devuelve cuál. */
function roleToken(token: string, role: Role): Step {
  const m = new RegExp(`^var\\(--color-fi-${role}-(\\d+)\\)$`).exec(baseDecls[token] ?? '')
  if (!m) throw new Error(`${token} debe ser var(--color-fi-${role}-N)`)
  return Number(m[1]) as Step
}

export const navyStep = roleToken('--fi-navy', 'tertiary')
export const goldStep = roleToken('--fi-gold', 'secondary')
