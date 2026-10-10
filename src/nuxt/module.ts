import { addComponentsDir, addImports, addPlugin, addVitePlugin, createResolver, defineNuxtModule, hasNuxtModule, useLogger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { defu } from 'defu'
import { fiAppConfig, fiUiThemeColors } from '../app-config'
import { fiUiViteConfig } from '../vite'
import type { FiUiConfig } from '../composables/useFiConfig'
import type { FiCalendarEntry, FiThemeSetting } from '../themes/calendar'

// `fiUi` en el app.config.ts del proyecto: enlaces y redes de la cinta y el pie.
declare module '@nuxt/schema' {
  interface AppConfigInput {
    fiUi?: FiUiConfig
  }
}

export interface ModuleOptions {
  /**
   * `'auto'` (por defecto) activa el tema que toque según el calendario; un id
   * fija ese tema. Se puede cambiar sin recompilar con la variable de entorno
   * `NUXT_PUBLIC_FI_UI_THEME` (p. ej. `luto`).
   */
  theme: FiThemeSetting
  /** Reemplaza el calendario por defecto (las fechas del registro de temas). */
  calendar?: FiCalendarEntry[]
  /**
   * Parámetro de URL para previsualizar un tema (`?tema=8m`). Solo cambia lo
   * que ve quien abre ese enlace. `false` lo desactiva.
   */
  previewParam: string | false
  /**
   * `'light'` (por defecto): el lenguaje FI es solo claro. El módulo pone
   * `ui.colorMode = false` en Nuxt UI — no se instala @nuxtjs/color-mode y
   * <html> nunca recibe `.dark` — salvo que el proyecto declare
   * `ui.colorMode` él mismo. Lo oscuro existe solo como isla: un contenedor
   * con la clase `dark` (FiHeader, FiFooter, la barra lateral del
   * dashboard); dentro, Nuxt UI aplica sus tokens `.dark` igual que con
   * color mode, porque los declara su CSS bajo ese selector.
   *
   * `'app'`: el color mode queda en manos del proyecto, bajo su riesgo:
   * --fi-navy, --fi-gold y las superficies FI no tienen versión oscura, y
   * en una página completa en oscuro los títulos azul marino quedan a 1.3:1.
   *
   * Por cómo Nuxt resuelve las dependencias entre módulos, Nuxt UI decide si
   * instala @nuxtjs/color-mode ANTES de que corra este módulo si aparece
   * antes en `modules`. Lista '@fi-unam/ui/nuxt' primero (o solo: instala
   * @nuxt/ui por su cuenta) o declara `ui: { colorMode: false }`; si no,
   * el módulo lo avisa al arrancar y deja el color mode fijo en claro.
   */
  colorMode: 'light' | 'app'
  /**
   * Cromo del navegador: el fondo rojo de <html> (lo que Safari 26 usa para
   * su barra) y `<meta name="theme-color">` con el primario del tema activo.
   * `false` lo apaga en todo el sitio — <html> lleva `data-fi-chrome="off"`
   * y no se emite theme-color —, para apps sin la cinta roja arriba. Para
   * apagarlo solo en un layout: useHead({ htmlAttrs: { 'data-fi-chrome':
   * 'off' } }) y su propio theme-color.
   */
  chrome: boolean
}

export interface FiUiPublicRuntimeConfig {
  theme: FiThemeSetting
  calendar: FiCalendarEntry[] | null
  previewParam: string | false
  chrome: boolean
}

const MODULE_NAME = '@fi-unam/ui'

// Lo que Vite no debe pre-empaquetar: el paquete se publica como código
// fuente (.vue y .ts). Con cada entrada por separado, para que un import
// profundo tampoco se empaquete aparte. La misma lista que usa Vue + Vite
// (src/vite.js).
const OPTIMIZE_DEPS_EXCLUDE = fiUiViteConfig.optimizeDeps.exclude

/**
 * `colorMode` tal como lo escribió el proyecto, antes de que Nuxt resuelva
 * las opciones del módulo: en la clave `fiUi` de nuxt.config o en línea en
 * `modules`.
 */
function requestedColorMode(nuxt: Nuxt): ModuleOptions['colorMode'] {
  const fromKey = (nuxt.options as { fiUi?: Partial<ModuleOptions> }).fiUi?.colorMode
  if (fromKey) return fromKey
  for (const entry of nuxt.options.modules) {
    if (Array.isArray(entry) && entry[0] === '@fi-unam/ui/nuxt') {
      const inline = (entry[1] as Partial<ModuleOptions> | undefined)?.colorMode
      if (inline) return inline
    }
  }
  return 'light'
}

/**
 * ¿@nuxtjs/color-mode se instala en este build? Sí si el proyecto lo lista,
 * o si Nuxt UI ya lo encoló como dependencia (las dependencias no opcionales
 * se registran en `typescript.hoist` al resolverse).
 */
function colorModeComing(nuxt: Nuxt): boolean {
  const hoist = nuxt.options.typescript.hoist
  return (Array.isArray(hoist) && hoist.includes('@nuxtjs/color-mode'))
    || hasNuxtModule('@nuxtjs/color-mode', nuxt)
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: MODULE_NAME,
    configKey: 'fiUi',
  },
  defaults: {
    theme: 'auto',
    previewParam: 'tema',
    colorMode: 'light',
    chrome: true,
  },
  // Nuxt UI tiene que generar la variante `tertiary`; sus valores por defecto
  // no la incluyen. `defaults` respeta lo que el proyecto declare, y defu une
  // arreglos: un proyecto que repite `ui.theme.colors` en nuxt.config no
  // pisa esta lista, la amplía (aun así no hace falta declararla).
  //
  // Es función, y no objeto, para apagar el color mode a tiempo: Nuxt UI
  // lee `nuxt.options.ui.colorMode` en SU propia resolución de dependencias
  // para decidir si instala @nuxtjs/color-mode, y los `defaults` de aquí
  // llegan después. Escribirlo directo solo sirve si Nuxt UI todavía no se
  // resolvió — si ya encoló color-mode, apagarlo dejaría a Nuxt UI con su
  // composable falso Y el real; ese caso se avisa en `setup`.
  // Tipos explícitos: inferidos, TypeScript ve un ciclo (el módulo se
  // referencia a sí mismo a través de `defineNuxtModule`) y el proyecto que
  // compila este código fuente recibe `any` implícito.
  moduleDependencies(nuxt: Nuxt): Record<string, { defaults?: Record<string, unknown> }> {
    const ui = ((nuxt.options as unknown as { ui?: Record<string, unknown> }).ui ??= {})
    if (requestedColorMode(nuxt) === 'light' && ui.colorMode === undefined && !colorModeComing(nuxt)) {
      ui.colorMode = false
    }
    return {
      '@nuxt/ui': {
        defaults: { theme: { colors: fiUiThemeColors } },
      },
    }
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const logger = useLogger(MODULE_NAME)

    // El paquete se publica como código fuente (.vue y .ts).
    nuxt.options.build.transpile.push('@fi-unam/ui')
    nuxt.options.vite.optimizeDeps ||= {}
    nuxt.options.vite.optimizeDeps.exclude = [...(nuxt.options.vite.optimizeDeps.exclude ?? []), ...OPTIMIZE_DEPS_EXCLUDE]

    // Solo claro: si @nuxtjs/color-mode se va a instalar de todos modos (Nuxt
    // UI se resolvió antes que este módulo, o el proyecto lo lista), se fija
    // en claro y se cambia la clave de almacenamiento para ignorar un
    // "oscuro" que el navegador haya guardado antes. Se escribe aquí porque
    // color-mode, encolado como dependencia, se instala después de este
    // módulo; si el proyecto lo listó antes, ya leyó sus opciones y solo
    // queda el aviso. Un selector de tema en la interfaz podría seguir
    // poniendo `.dark` en <html>: no lo ofrezcas.
    if (options.colorMode === 'light' && colorModeComing(nuxt)) {
      const colorMode = ((nuxt.options as unknown as { colorMode?: Record<string, unknown> }).colorMode ??= {})
      colorMode.preference = 'light'
      colorMode.fallback = 'light'
      colorMode.storageKey = 'fi-ui-color-mode'
      logger.warn(
        '@nuxtjs/color-mode está instalado y el lenguaje FI es solo claro. '
        + 'Lista \'@fi-unam/ui/nuxt\' antes que \'@nuxt/ui\' en `modules` (o declara '
        + '`ui: { colorMode: false }`), o pon `fiUi: { colorMode: \'app\' }` si el modo '
        + 'oscuro es intencional. Mientras tanto queda fijo en claro.',
      )
    }

    // En desarrollo, Vite sirve lo de node_modules con `?v=<hash>` y
    // `Cache-Control: immutable`, y ese hash solo cambia si cambia el lockfile.
    // Este paquete se publica como código fuente y se reinstala al editarlo
    // (npm install ../fi-ui --install-links) sin cambiar de versión: el
    // navegador se quedaba con archivos viejos junto a otros nuevos. Aquí se
    // fuerza revalidación solo para sus archivos y solo en `nuxt dev`.
    addVitePlugin({
      name: 'fi-ui:dev-no-immutable-cache',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes('/@fi-unam/ui/')) {
            const setHeader = res.setHeader.bind(res)
            res.setHeader = (name, value) =>
              setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-cache' : value)
          }
          next()
        })
      },
    })

    // Nitro (el servidor) no transforma TypeScript dentro de node_modules, y el
    // app.config.ts de un proyecto puede importar `@fi-unam/ui/data`: sin esto
    // el build del servidor falla con "Expected '{', got 'interface'". Nuxt
    // arma esa exclusión con sus capas, no con build.transpile, así que cada
    // patrón se envuelve para que deje pasar este paquete y nada más.
    // Declaración de los .png que importa FiLogo, para los tsconfig del
    // proyecto que compilan este código fuente sin los tipos de Vite.
    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: resolve('../env.d.ts') })
    })

    nuxt.hook('nitro:config', (config) => {
      const allowPackage = (pattern: RegExp) =>
        new RegExp(`^(?!.*node_modules[\\\\/]@fi-unam[\\\\/]ui[\\\\/]).*(?:${pattern.source})`, pattern.flags)
      config.esbuild ||= {}
      config.esbuild.options ||= {}
      const current = config.esbuild.options.exclude ?? [/node_modules/]
      const patterns = Array.isArray(current) ? current : [current]
      config.esbuild.options.exclude = patterns.map(pattern =>
        pattern instanceof RegExp ? allowPackage(pattern) : pattern)
    })

    // La configuración FI de Nuxt UI (src/app-config.js) por encima de los
    // defaults de Nuxt UI, pero por debajo del app.config.ts del proyecto, que
    // se fusiona después en runtime: el proyecto gana. Ojo con los arreglos
    // (compoundVariants): Nuxt los concatena; ver la cabecera de app-config.js.
    // El tipo de appConfig.ui lo generan Nuxt UI y el proyecto (.nuxt/types);
    // aquí basta con que sea un objeto.
    const appConfig = nuxt.options.appConfig as { ui?: Record<string, unknown> }
    appConfig.ui = defu(fiAppConfig.ui, appConfig.ui ?? {})

    const publicConfig: FiUiPublicRuntimeConfig = {
      theme: options.theme,
      calendar: options.calendar ?? null,
      previewParam: options.previewParam,
      chrome: options.chrome,
    }
    // Nuxt infiere el tipo de runtimeConfig de sus propios valores (y ahí
    // `previewParam` sería solo string); el tipo real es el de la interfaz.
    const runtimePublic = nuxt.options.runtimeConfig.public as Record<string, unknown>
    runtimePublic.fiUi = defu(runtimePublic.fiUi as Partial<FiUiPublicRuntimeConfig> | undefined, publicConfig)

    addComponentsDir({ path: resolve('../components'), pathPrefix: false })
    addImports({ name: 'useFiTheme', from: resolve('../composables/useFiTheme') })
    addPlugin(resolve('./runtime/plugin'))
  },
})
