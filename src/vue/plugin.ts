import { isRef, ref, watchEffect } from 'vue'
import type { Plugin, Ref } from 'vue'
import { fiAppConfig, fiUiThemeColors } from '../app-config'
import { FI_CHROME_COLOR } from '../chrome'
import { fiConfigKey } from '../composables/useFiConfig'
import type { FiUiConfig } from '../composables/useFiConfig'
import { createFiThemeState, fiThemeKey } from '../composables/useFiTheme'
import { resolveFiTheme } from '../themes/calendar'
import type { FiCalendarEntry, FiThemeSetting } from '../themes/calendar'
import { isFiThemeId } from '../themes/registry'
import { fiLocaleKey } from '../i18n'

/**
 * Integración para Vue + Vite sin Nuxt. Hace lo mismo que el módulo de Nuxt,
 * en dos piezas porque Vue no tiene un punto único de configuración:
 *
 *   // vite.config.ts
 *   import ui from '@nuxt/ui/vite'
 *   import { fiUiViteOptions } from '@fi-unam/ui/vue'
 *   plugins: [vue(), ui(fiUiViteOptions)]
 *
 *   // main.ts
 *   import { createFiUi } from '@fi-unam/ui/vue'
 *   app.use(router).use(ui).use(createFiUi())
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
}

/** Opciones para `ui()` de `@nuxt/ui/vite`. */
export const fiUiViteOptions = {
  ui: fiAppConfig.ui,
  theme: { colors: fiUiThemeColors },
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

      const chromeColor = ref(FI_CHROME_COLOR)

      if (typeof document !== 'undefined') {
        watchEffect(() => document.documentElement.setAttribute('data-fi-theme', theme.value))
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

      app.provide(fiThemeKey, createFiThemeState(theme, chromeColor))
      app.provide(fiConfigKey, ref<FiUiConfig>({ topBar: options.topBar, footer: options.footer }))
      app.provide(fiLocaleKey, isRef(options.locale) ? options.locale : ref(options.locale ?? 'es'))
    },
  }
}
