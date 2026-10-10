/**
 * Matemática de color mínima para verificar los temas sin navegador.
 *
 * Reproduce lo que hace el CSS del paquete — `color-mix(in oklch, …)` — para
 * poder calcular contraste WCAG de cada escala en las pruebas, la distancia
 * entre colores (ΔE en OKLab) y cómo los ve una persona con daltonismo. No es
 * una librería de color general: solo sRGB ⇄ OKLCH, la mezcla en OKLCH tal
 * como la define CSS Color 4, la composición de un tinte translúcido, el
 * contraste relativo y la simulación de Machado et al. (2009).
 */

export interface Oklch { l: number, c: number, h: number }

type Rgb = [number, number, number]

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

export function parseHex(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`Color no válido: ${hex}`)
  const n = Number.parseInt(m[1]!, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function toHex([r, g, b]: Rgb): string {
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

function linearToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function hexToOklch(hex: string): Oklch {
  const [L, a, b] = linearToOklab(parseHex(hex).map(toLinear) as Rgb)
  const c = Math.hypot(a, b)
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { l: L, c, h: h < 0 ? h + 360 : h }
}

const inGamut = (rgb: Rgb) => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4)

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180
  return oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)])
}

/** OKLCH → hex, bajando croma hasta caber en sRGB (como el mapeo de gama de CSS). */
export function oklchToHex(color: Oklch): string {
  let lin = oklchToLinear(color)
  if (!inGamut(lin)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid
      else hi = mid
    }
    lin = oklchToLinear({ ...color, c: lo })
  }
  return toHex(lin.map(v => toGamma(Math.min(1, Math.max(0, v)))) as Rgb)
}

/**
 * `color-mix(in oklch, seed p%, white|black)`. Blanco y negro son acromáticos:
 * su matiz es "powerless" y la interpolación toma el de la semilla, así que el
 * tono se conserva y solo se mueven luminosidad y croma.
 */
export function mixOklch(seedHex: string, weight: number, toward: 'white' | 'black'): string {
  const seed = hexToOklch(seedHex)
  const end = toward === 'white' ? 1 : 0
  return oklchToHex({
    l: seed.l * weight + end * (1 - weight),
    c: seed.c * weight,
    h: seed.h,
  })
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * `color-mix(in oklch, a weightA, b)` entre dos colores cualesquiera, con el
 * matiz por el arco corto (el de CSS por defecto). Si uno es acromático su
 * matiz no cuenta y se toma el del otro, como en CSS.
 */
export function mixOklchColors(a: string, b: string, weightA = 0.5): string {
  const x = hexToOklch(a)
  const y = hexToOklch(b)
  const ACHROMATIC = 1e-4
  const hx = x.c < ACHROMATIC ? y.h : x.h
  const hy = y.c < ACHROMATIC ? x.h : y.h
  let dh = hy - hx
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  const h = hx + dh * (1 - weightA)
  return oklchToHex({
    l: x.l * weightA + y.l * (1 - weightA),
    c: x.c * weightA + y.c * (1 - weightA),
    h: h < 0 ? h + 360 : h % 360,
  })
}

/** `oklch(44.8% 0.119 151.328)` (la forma de la paleta de Tailwind) → hex. */
export function parseOklch(value: string): string {
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim())
  if (!m) throw new Error(`Color OKLCH no válido: ${value}`)
  const l = Number(m[1]) / (m[2] ? 100 : 1)
  return oklchToHex({ l, c: Number(m[3]), h: Number(m[4]) })
}

/** Hex o `oklch(…)` → hex. */
export function toHexColor(value: string): string {
  return value.trim().startsWith('oklch') ? parseOklch(value) : toHex(parseHex(value))
}

/**
 * Un color con opacidad sobre un fondo opaco (`bg-success/10` encima de una
 * tarjeta): la mezcla que ve el ojo, hecha en sRGB como la compone el
 * navegador.
 */
export function composite(fg: string, alpha: number, bg: string): string {
  const f = parseHex(fg)
  const b = parseHex(bg)
  return toHex(f.map((v, i) => v * alpha + b[i]! * (1 - alpha)) as Rgb)
}

// Machado, Oliveira y Fernandes (2009), severidad 1.0, sobre sRGB lineal.
const CVD: Record<'protan' | 'deutan', [Rgb, Rgb, Rgb]> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
}

export type FiVision = 'normal' | 'protan' | 'deutan'

function oklabFor(hex: string, vision: FiVision): Rgb {
  const lin = parseHex(hex).map(toLinear) as Rgb
  if (vision === 'normal') return linearToOklab(lin)
  const m = CVD[vision]
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return linearToOklab(m.map(row => clamp(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])) as Rgb)
}

/**
 * Distancia entre dos colores en OKLab (0 = iguales; ~0.02 es la diferencia
 * apenas perceptible). Con `vision` mide cómo los distingue alguien con
 * protanopia o deuteranopia.
 */
export function deltaEOk(a: string, b: string, vision: FiVision = 'normal'): number {
  const x = oklabFor(a, vision)
  const y = oklabFor(b, vision)
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}
