import { computed, watch } from 'vue'
import { defineNuxtPlugin, useAppConfig, useHead, useRoute, useRuntimeConfig, useState } from '#imports'
import { fiChromeColor } from '../../chrome'
import { fiConfigKey } from '../../composables/useFiConfig'
import { fiLocaleKey } from '../../i18n'
import type { FiUiConfig } from '../../composables/useFiConfig'
import { createFiThemeState, fiThemeKey } from '../../composables/useFiTheme'
import { resolveFiTheme } from '../../themes/calendar'
import { isFiThemeId } from '../../themes/registry'
import type { FiThemeId } from '../../themes/registry'
import type { FiUiPublicRuntimeConfig } from '../module'

/**
 * Decide el tema una sola vez por carga y lo pone en <html data-fi-theme>.
 * Con SSR lo decide el servidor y llega en el HTML (sin parpadeo de color);
 * useState lleva el mismo valor a la hidratación para que el cliente no lo
 * recalcule con su propio reloj.
 */
export default defineNuxtPlugin({
  name: 'fi-ui:theme',
  setup(nuxtApp) {
    const config = useRuntimeConfig().public.fiUi as FiUiPublicRuntimeConfig
    const route = useRoute()

    const theme = useState<FiThemeId>('fi-ui:theme', () => {
      const preview = config.previewParam ? route.query[config.previewParam] : undefined
      if (isFiThemeId(preview)) return preview
      return resolveFiTheme({ setting: config.theme, calendar: config.calendar ?? undefined })
    })

    // Color de la barra del navegador. Arranca con el primario del tema y lo
    // sigue al cambiar de tema, también en páginas sin FiHeader (un
    // dashboard): antes se quedaba en el rojo FI aunque la página fuera
    // verde. FiHeader lo ajusta después según lo que esté arriba; su watch
    // corre después de este y gana.
    const chromeColor = useState<string>('fi-ui:chrome-color', () => fiChromeColor(theme.value))
    watch(theme, (id) => {
      chromeColor.value = fiChromeColor(id)
    })

    // `chrome: false` apaga el fondo rojo de <html> (no-fonts.css) y no emite
    // theme-color: el navegador usa el suyo.
    const chrome = config.chrome !== false
    useHead({
      htmlAttrs: {
        'data-fi-theme': computed(() => theme.value),
        ...(chrome ? {} : { 'data-fi-chrome': 'off' }),
      },
      meta: chrome ? [{ name: 'theme-color', content: chromeColor }] : [],
    })

    nuxtApp.vueApp.provide(fiThemeKey, createFiThemeState(theme, chromeColor))

    // Enlaces, redes y contacto del proyecto: `fiUi` en su app.config.ts.
    const appConfig = useAppConfig() as { fiUi?: FiUiConfig }
    nuxtApp.vueApp.provide(fiConfigKey, computed(() => appConfig.fiUi ?? {}))

    // Idioma de los textos del paquete: el de @nuxtjs/i18n si el proyecto lo
    // usa. Se lee en diferido porque su plugin puede registrarse después.
    nuxtApp.vueApp.provide(fiLocaleKey, computed(() => {
      const i18n = (nuxtApp as unknown as { $i18n?: { locale?: { value?: unknown } } }).$i18n
      const locale = i18n?.locale?.value
      return typeof locale === 'string' ? locale : 'es'
    }))
  },
})
