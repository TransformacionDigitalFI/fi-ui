import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { normalizeFiLocale } from '../../src/i18n'

/**
 * Reglas del paquete que se verifican sobre el código fuente de los
 * componentes, sin renderizar.
 */

const dir = fileURLToPath(new URL('../../src/components/', import.meta.url))
const files = readdirSync(dir)
const sources = Object.fromEntries(files.map(file => [file, readFileSync(`${dir}${file}`, 'utf8')]))
const index = readFileSync(fileURLToPath(new URL('../../src/index.ts', import.meta.url)), 'utf8')

describe('src/components', () => {
  it('solo contiene componentes .vue (el módulo de Nuxt registra todo lo que haya)', () => {
    expect(files.filter(file => !file.endsWith('.vue'))).toEqual([])
  })

  it.each(files)('%s se exporta desde src/index.ts', (file) => {
    const name = file.replace(/\.vue$/, '')
    expect(index).toContain(`export { default as ${name} } from './components/${file}'`)
  })

  it.each(files)('%s no usa variantes dark: (lo oscuro son islas con la clase `dark`)', (file) => {
    expect(sources[file]).not.toMatch(/(?:^|[\s"'`])dark:/m)
  })

  it.each(files)('%s no baja de 12 px de texto', (file) => {
    expect(sources[file]).not.toMatch(/text-\[(?:\d|1[01])px\]|text-\[0\.(?:[0-6]\d*|7[0-4]\d*)rem\]/)
  })
})

describe('normalizeFiLocale', () => {
  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    ['EN_gb', 'en'],
    ['es', 'es'],
    ['es-MX', 'es'],
    ['fr', 'es'],
    ['eng', 'es'],
    ['', 'es'],
  ])('%s → %s', (locale, expected) => {
    expect(normalizeFiLocale(locale)).toBe(expected)
  })
})
