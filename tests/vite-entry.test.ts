import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { fiAppConfig, fiUiThemeColors } from '../src/app-config'
import { fiUiViteConfig, fiUiViteOptions } from '../src/vite'
import * as vuePlugin from '../src/vue/plugin'

/**
 * `@fi-unam/ui/vite` lo importa vite.config.ts, y eso lo carga Node, no Vite:
 * dentro de node_modules Node no acepta TypeScript ni imports sin extensión.
 * Aquí se instala una copia mínima del paquete en un node_modules temporal y
 * se importa con Node, igual que en un proyecto Vue + Vite.
 */

const src = fileURLToPath(new URL('../src/', import.meta.url))
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  type: string
  exports: Record<string, unknown>
}

describe('@fi-unam/ui/vite', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fi-ui-vite-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('Node lo carga desde node_modules (sin TypeScript ni imports sin extensión)', () => {
    const root = join(dir, 'node_modules', '@fi-unam', 'ui')
    mkdirSync(join(root, 'src'), { recursive: true })
    for (const file of ['vite.js', 'app-config.js']) cpSync(join(src, file), join(root, 'src', file))
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: '@fi-unam/ui', type: pkg.type, exports: { './vite': pkg.exports['./vite'] } }))

    const out = execFileSync(process.execPath, [
      '--input-type=module',
      '-e',
      'const m = await import("@fi-unam/ui/vite"); console.log(JSON.stringify({ colorMode: m.fiUiViteOptions.colorMode, colors: m.fiUiViteOptions.theme.colors, uiKeys: Object.keys(m.fiUiViteOptions.ui).length, exclude: m.fiUiViteConfig.optimizeDeps.exclude }))',
    ], { cwd: dir, encoding: 'utf8' })

    const loaded = JSON.parse(out) as { colorMode: boolean, colors: string[], uiKeys: number, exclude: string[] }
    expect(loaded.colorMode).toBe(false)
    expect(loaded.colors).toEqual(fiUiThemeColors)
    expect(loaded.uiKeys).toBe(Object.keys(fiAppConfig.ui).length)
    expect(loaded.exclude).toEqual(fiUiViteConfig.optimizeDeps.exclude)
  })

  it('solo importa archivos .js con extensión', () => {
    for (const file of ['vite.js', 'app-config.js']) {
      const source = readFileSync(join(src, file), 'utf8')
      for (const [, spec] of source.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) {
        expect(spec, `${file} importa ${spec}`).toMatch(/^\.\/[\w-]+\.js$/)
      }
    }
  })

  it('las opciones son la configuración FI, con el color mode apagado', () => {
    expect(fiUiViteOptions.ui).toBe(fiAppConfig.ui)
    expect(fiUiViteOptions.theme.colors).toEqual(fiUiThemeColors)
    expect(fiUiViteOptions.colorMode).toBe(false)
    expect(fiUiViteConfig.optimizeDeps.exclude).toEqual(['@fi-unam/ui', '@fi-unam/ui/vue', '@fi-unam/ui/data'])
  })

  it('@fi-unam/ui/vue lo reexporta (compatibilidad con 0.1)', () => {
    expect(vuePlugin.fiUiViteOptions).toBe(fiUiViteOptions)
    expect(vuePlugin.fiUiViteConfig).toBe(fiUiViteConfig)
  })
})
