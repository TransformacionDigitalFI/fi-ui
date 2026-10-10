import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Compila las hojas del paquete con Tailwind v4, como lo hace un proyecto
 * (`@import "tailwindcss"; @import "@fi-unam/ui";`), y revisa que lo
 * prometido exista de verdad: utilidades, escala tipográfica, fuentes.
 */

const require = createRequire(import.meta.url)
const cssDir = fileURLToPath(new URL('../src/css/', import.meta.url))

/** Resolución de @import como la de Tailwind: rutas relativas o paquetes. */
async function loadStylesheet(id: string, base: string) {
  let path: string
  if (id.startsWith('.') || id.startsWith('/')) path = resolve(base, id)
  else if (id === 'tailwindcss') path = require.resolve('tailwindcss/index.css')
  else path = require.resolve(id)
  return { path, base: dirname(path), content: await readFile(path, 'utf8') }
}

async function build(entry: string, candidates: string[]): Promise<string> {
  const compiler = await compile(`@import "tailwindcss";\n@import "./${entry}";`, {
    base: cssDir,
    loadStylesheet,
    loadModule: async () => { throw new Error('sin módulos JS') },
  })
  return compiler.build(candidates)
}

describe('no-fonts.css', () => {
  let css: string
  beforeAll(async () => {
    css = await build('no-fonts.css', [
      'text-fi-navy', 'bg-fi-gold/60', 'border-fi-navy', 'bg-fi-header',
      'bg-fi-chart-1', 'text-fi-chart-8', 'bg-fi-chart-seq-5',
      'text-xs', 'text-2xl', 'font-sans', 'font-serif',
    ])
  })

  it('utilidades editoriales que siguen al tema (var directa, sin pasar por :root)', () => {
    expect(css).toMatch(/\.text-fi-navy\s*\{\s*color:\s*var\(--fi-navy\)/)
    expect(css).toMatch(/\.border-fi-navy\s*\{\s*border-color:\s*var\(--fi-navy\)/)
    expect(css).toMatch(/\.bg-fi-header\s*\{\s*background-color:\s*var\(--fi-header-bg\)/)
    expect(css).toMatch(/\.bg-fi-gold\\\/60\s*\{[^}]*var\(--fi-gold\)/)
  })

  it('utilidades de la paleta de datos', () => {
    expect(css).toMatch(/\.bg-fi-chart-1\s*\{\s*background-color:\s*var\(--fi-chart-1\)/)
    expect(css).toMatch(/\.text-fi-chart-8\s*\{\s*color:\s*var\(--fi-chart-8\)/)
    expect(css).toMatch(/\.bg-fi-chart-seq-5\s*\{\s*background-color:\s*var\(--fi-chart-seq-5\)/)
  })

  it('escala tipográfica FI (xs = 13px, base = 17px)', () => {
    expect(css).toContain('--text-xs: 0.8125rem;')
    expect(css).toContain('--text-base: 1.0625rem;')
    expect(css).toContain('--text-2xl: 1.5625rem;')
    expect(css).toMatch(/\.text-xs\s*\{\s*font-size:\s*var\(--text-xs\)/)
  })

  it('familias con el nombre de Fontsource primero', () => {
    expect(css).toMatch(/--font-sans:\s*"Inter Variable", "Inter"/)
    expect(css).toMatch(/--font-serif:\s*"Playfair Display Variable", "Playfair Display"/)
  })

  it('.fi-label y .fi-tag existen y no bajan de 12px', () => {
    expect(css).toMatch(/\.fi-label\s*\{[^}]*font-size:\s*var\(--text-xs\)/)
    const tag = /\.fi-tag\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    const size = /font-size:\s*([\d.]+)rem/.exec(tag)?.[1]
    expect(Number(size) * 16).toBeGreaterThanOrEqual(12)
  })

  it('el fondo rojo de <html> se apaga con data-fi-chrome="off"', () => {
    expect(css).toMatch(/html:not\(\[data-fi-chrome="off"\]\)\s*\{\s*background-color:\s*var\(--ui-color-primary-500\)/)
  })

  it('no trae @font-face', () => {
    expect(css).not.toContain('@font-face')
  })
})

describe('index.css (con fuentes)', () => {
  let css: string
  beforeAll(async () => {
    css = await build('index.css', ['font-sans'])
  })

  it('Inter y Playfair Display, redonda e itálica, servidas desde el paquete', () => {
    const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1]!)
    const has = (family: string, style: string) => faces.some(f => f.includes(`'${family}'`) && f.includes(`font-style: ${style}`))
    expect(has('Inter Variable', 'normal')).toBe(true)
    expect(has('Inter Variable', 'italic')).toBe(true)
    expect(has('Playfair Display Variable', 'normal')).toBe(true)
    expect(has('Playfair Display Variable', 'italic')).toBe(true)
    // Sin red externa: todas las fuentes son archivos locales del paquete.
    expect(faces.every(f => /url\(\.\/files\/[\w-]+\.woff2\)/.test(f))).toBe(true)
  })

  it('latin y latin-ext declarados con unicode-range (el navegador baja solo esos para español)', () => {
    expect(css).toMatch(/playfair-display-latin-wght-italic\.woff2/)
    expect(css).toMatch(/inter-latin-ext-wght-normal\.woff2/)
    expect(css).toContain('unicode-range')
  })
})
