import { addComponentsDir, addImports, addPlugin, addVitePlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import { fiAppConfig, fiUiThemeColors } from '../app-config'
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
}

export interface FiUiPublicRuntimeConfig {
  theme: FiThemeSetting
  calendar: FiCalendarEntry[] | null
  previewParam: string | false
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@fi-unam/ui',
    configKey: 'fiUi',
  },
  defaults: {
    theme: 'auto',
    previewParam: 'tema',
  },
  // Nuxt UI tiene que generar la variante `tertiary`; sus valores por defecto
  // no la incluyen. `defaults` respeta lo que el proyecto declare.
  moduleDependencies: {
    '@nuxt/ui': {
      defaults: { theme: { colors: fiUiThemeColors } },
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // El paquete se publica como código fuente (.vue y .ts).
    nuxt.options.build.transpile.push('@fi-unam/ui')
    nuxt.options.vite.optimizeDeps ||= {}
    nuxt.options.vite.optimizeDeps.exclude = [...(nuxt.options.vite.optimizeDeps.exclude ?? []), '@fi-unam/ui']

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

    // Los colores del paquete por encima de los defaults de Nuxt UI, pero por
    // debajo del app.config.ts del proyecto, que se fusiona después en runtime.
    nuxt.options.appConfig.ui = defu(fiAppConfig.ui, nuxt.options.appConfig.ui)

    const publicConfig: FiUiPublicRuntimeConfig = {
      theme: options.theme,
      calendar: options.calendar ?? null,
      previewParam: options.previewParam,
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
