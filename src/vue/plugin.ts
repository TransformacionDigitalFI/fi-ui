import { isRef, ref, watch, watchEffect } from 'vue'
import type { Plugin, Ref } from 'vue'
import { fiChromeColor } from '../chrome'
import { fiConfigKey } from '../composables/useFiConfig'
import type { FiUiConfig } from '../composables/useFiConfig'
import { createFiThemeState, fiThemeKey } from '../composables/useFiTheme'
import { resolveFiTheme } from '../themes/calendar'
import type { FiCalendarEntry, FiThemeSetting } from '../themes/calendar'
import { isFiThemeId } from '../themes/registry'
import { fiLocaleKey } from '../i18n'

// La configuración de Vite vive en src/vite.js (JavaScript, para que Node la
// cargue desde vite.config.ts). Se reexporta aquí por compatibilidad: en
// vite.config.ts importa de '@fi-unam/ui/vite', no de aquí.
export { fiUiViteConfig, fiUiViteOptions } from '../vite'

/**
 * Integración para Vue + Vite sin Nuxt. Hace lo mismo que el módulo de Nuxt,
 * en tres piezas porque Vue no tiene un punto único de configuración:
 *
 *   // vite.config.ts — de '@fi-unam/ui/vite', que Node puede cargar
 *   import ui from '@nuxt/ui/vite'
 *   import { fiUiViteConfig, fiUiViteOptions } from '@fi-unam/ui/vite'
 *   export default defineConfig({
 *     ...fiUiViteConfig,
 *     plugins: [vue(), ui(fiUiViteOptions)],
 *   })
 *
 *   // main.ts
 *   import { createFiUi } from '@fi-unam/ui/vue'
 *   app.use(router).use(ui).use(createFiUi())
 *
 *   // main.css
 *   @import "tailwindcss";
 *   @import "@nuxt/ui";
 *   @import "@fi-unam/ui";
 *
 * Sin SSR el tema se aplica al montar, así que no hay forma de evitar un
 * instante con el tema base si el sitio arranca en otro.
 */

export interface FiUiVueOptions extends FiUiConfig {
  theme?: FiThemeSetting
  calendar?: FiCalendarEntry[]
  previewParam?: string | false
  /** Idioma de los textos del paquete; pasa un ref (p. ej. el de vue-i18n) para que cambie en vivo. */
  locale?: string | Readonly<Ref<string>>
  /**
   * Fondo rojo de <html> y `<meta name="theme-color">` con el primario del
   * tema. `false` los apaga (apps sin la cinta roja arriba). Por defecto,
   * `true`. Ver src/chrome.ts.
   */
  chrome?: boolean
}

export function createFiUi(options: FiUiVueOptions = {}): Plugin {
  return {
    install(app) {
      const param = options.previewParam ?? 'tema'
      const preview = param && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get(param)
        : null

      const theme = ref(isFiThemeId(preview)
        ? preview
        : resolveFiTheme({ setting: options.theme, calendar: options.calendar }))

      // Arranca con el primario del tema y lo sigue; FiHeader lo ajusta
      // después según lo que esté arriba (src/nuxt/runtime/plugin.ts).
      const chromeColor = ref(fiChromeColor(theme.value))
      watch(theme, (id) => {
        chromeColor.value = fiChromeColor(id)
      })

      const chrome = options.chrome !== false

      if (typeof document !== 'undefined') {
        const html = document.documentElement
        watchEffect(() => html.setAttribute('data-fi-theme', theme.value))
        if (!chrome) {
          html.setAttribute('data-fi-chrome', 'off')
        }
        else {
          watchEffect(() => {
            let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
            if (!meta) {
              meta = document.createElement('meta')
              meta.name = 'theme-color'
              document.head.appendChild(meta)
            }
            meta.content = chromeColor.value
          })
        }
      }

      app.provide(fiThemeKey, createFiThemeState(theme, chromeColor))
      app.provide(fiConfigKey, ref<FiUiConfig>({ topBar: options.topBar, footer: options.footer }))
      app.provide(fiLocaleKey, isRef(options.locale) ? options.locale : ref(options.locale ?? 'es'))
    },
  }
}
