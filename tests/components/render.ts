import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSSRApp, h, ref } from 'vue'
import type { Component, Slots } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { compileScript, parse } from 'vue/compiler-sfc'
import { fiConfigKey } from '../../src/composables/useFiConfig'
import type { FiUiConfig } from '../../src/composables/useFiConfig'
import { fiLocaleKey } from '../../src/i18n'

/**
 * Render en servidor de los componentes del paquete sin @vitejs/plugin-vue.
 *
 * El paquete no tiene configuración de Vitest ni compila .vue por su cuenta
 * (el proyecto que lo instala lo hace). Aquí cada SFC se compila con
 * vue/compiler-sfc (que ya viene con vue), se reescriben sus importaciones y
 * se escribe como .ts en `.cache/`; Vitest lo importa y transforma como
 * cualquier módulo. Así se prueba el archivo que se publica, no una copia.
 *
 * - `@nuxt/ui/components/X.vue` → el sustituto `X` de stubs.ts.
 * - Rutas relativas (`../i18n`, `./FiLogo.vue`) → apuntan al original desde
 *   la caché; los .vue se compilan en cadena. Así `fiLocaleKey` es el mismo
 *   símbolo en la prueba y en el componente.
 * - El nombre de cada archivo compilado lleva el hash de su código final, que
 *   incluye las rutas de sus dependencias: un cambio en FiLogo invalida
 *   también la copia de FiHeader. Se escribe con renombre atómico porque los
 *   archivos de prueba corren en paralelo.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CACHE = resolve(ROOT, 'tests/components/.cache')
const STUBS = resolve(ROOT, 'tests/components/stubs.ts')

const fsHost = {
  fileExists: (file: string) => existsSync(file),
  readFile: (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined),
}

function specifier(fromDir: string, target: string): string {
  const path = relative(fromDir, target).split('\\').join('/')
  return path.startsWith('.') ? path : `./${path}`
}

const compiled = new Map<string, string>()

function compileSfc(file: string): string {
  const cached = compiled.get(file)
  if (cached) return cached

  const { descriptor, errors } = parse(readFileSync(file, 'utf8'), { filename: file })
  if (errors.length) throw errors[0]
  const id = createHash('sha1').update(file).digest('hex').slice(0, 8)
  const { content } = compileScript(descriptor, { id, inlineTemplate: true, fs: fsHost })

  // Primero las relativas: la ruta a stubs.ts que se agrega después también lo es.
  const code = content
    .replace(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g, (_, spec: string) => {
      const target = resolve(dirname(file), spec)
      return `from '${specifier(CACHE, target.endsWith('.vue') ? compileSfc(target) : target)}'`
    })
    .replace(
      /import\s+(\w+)\s+from\s+['"]@nuxt\/ui\/components\/(\w+)\.vue['"]/g,
      (_, local: string, name: string) => `import { ${name} as ${local} } from '${specifier(CACHE, STUBS)}'`,
    )

  const hash = createHash('sha1').update(code).digest('hex').slice(0, 10)
  const out = resolve(CACHE, `${basename(file, '.vue')}.${hash}.ts`)
  if (!existsSync(out)) {
    mkdirSync(CACHE, { recursive: true })
    const tmp = `${out}.${process.pid}.tmp`
    writeFileSync(tmp, code)
    renameSync(tmp, out)
  }
  compiled.set(file, out)
  return out
}

/** Carga un componente de src/components ya compilado. */
export async function loadComponent(name: string): Promise<Component> {
  const out = compileSfc(resolve(ROOT, 'src/components', `${name}.vue`))
  const mod = await import(/* @vite-ignore */ out) as { default: Component }
  return mod.default
}

export interface RenderOptions {
  locale?: string
  config?: FiUiConfig
  /** Funciones de slot; las que reciben props (`{ controlClass }`) también caben. */
  slots?: Slots | Record<string, (...args: never[]) => unknown>
}

/**
 * HTML del componente renderizado en servidor, con idioma y configuración del
 * paquete provistos. Sin comentarios: los marcadores de hidratación de Vue
 * (`<!--[-->`, `<!--v-if-->`) solo estorban a las aserciones.
 */
export async function render(
  component: Component,
  props: Record<string, unknown> = {},
  { locale = 'es', config = {}, slots }: RenderOptions = {},
): Promise<string> {
  const app = createSSRApp({ render: () => h(component, props, slots as Slots | undefined) })
  app.provide(fiLocaleKey, ref(locale))
  app.provide(fiConfigKey, ref(config))
  return (await renderToString(app)).replace(/<!--[\s\S]*?-->/g, '')
}

/** Cuántas veces aparece una etiqueta de apertura (`<h1>`, `<h1 class…>`). */
export function countTags(html: string, tag: string): number {
  return html.match(new RegExp(`<${tag}[\\s>]`, 'g'))?.length ?? 0
}

/** Atributos de la primera etiqueta que cumpla el patrón (sin parser: el HTML de Vue es predecible). */
export function openingTag(html: string, pattern: RegExp): string {
  const match = html.match(pattern)
  if (!match) throw new Error(`No se encontró ${pattern} en:\n${html}`)
  return match[0]
}
