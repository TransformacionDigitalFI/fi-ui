/**
 * Matemática de color mínima para verificar los temas sin navegador.
 *
 * Reproduce lo que hace el CSS del paquete — `color-mix(in oklch, semilla p%,
 * white|black)` — para poder calcular contraste WCAG de cada escala en las
 * pruebas. No es una librería de color general: solo sRGB ⇄ OKLCH, la mezcla
 * en OKLCH tal como la define CSS Color 4 y el contraste relativo.
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
