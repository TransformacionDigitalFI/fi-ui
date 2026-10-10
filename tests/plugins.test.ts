import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, isRef, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import { fiAppConfig, fiUiThemeColors } from '../src/app-config'
import { FI_CHROME_COLOR } from '../src/chrome'
import { useFiTheme } from '../src/composables/useFiTheme'
import { fiThemes } from '../src/themes/registry'
import { createFiUi, fiUiViteConfig, fiUiViteOptions } from '../src/vue/plugin'

/**
 * Los dos puntos de entrada en tiempo de ejecución: el plugin de Vue
 * (createFiUi) y el de Nuxt (src/nuxt/runtime/plugin.ts, con #imports
 * sustituido). Lo que se prueba es el cromo del navegador (M-03, A-20).
 */

describe('Vue + Vite', () => {
  it('fiUiViteOptions: configuración FI, variante tertiary y color mode apagado', () => {
    expect(fiUiViteOptions.ui).toBe(fiAppConfig.ui)
    expect(fiUiViteOptions.theme.colors).toEqual(fiUiThemeColors)
    expect(fiUiViteOptions.colorMode).toBe(false)
  })

  it('fiUiViteConfig: no pre-empaqueta el paquete ni sus entradas profundas', () => {
    expect(fiUiViteConfig.optimizeDeps.exclude).toEqual(['@fi-unam/ui', '@fi-unam/ui/vue', '@fi-unam/ui/data'])
  })

  function mount(options: Parameters<typeof createFiUi>[0]) {
    const app = createApp(defineComponent({ setup: () => () => h('div') }))
    app.use(createFiUi(options))
    return app.runWithContext(useFiTheme)
  }

  it('el color de la barra arranca con el primario del tema y lo sigue al cambiar', async () => {
    const state = mount({ theme: '8m' })
    expect(state.chromeColor.value).toBe(fiThemes['8m'].chromeColor)
    state.setTheme('salud-mental')
    await nextTick()
    expect(state.chromeColor.value).toBe(fiThemes['salud-mental'].chromeColor)
  })

  it('con el tema FI arranca en el rojo de la cinta', () => {
    expect(mount({ theme: 'fi' }).chromeColor.value).toBe(FI_CHROME_COLOR)
  })
})

const nuxtStub = vi.hoisted(() => ({
  head: [] as unknown[],
  state: new Map<string, unknown>(),
  runtime: { public: { fiUi: { theme: 'auto', calendar: null, previewParam: 'tema', chrome: true } } },
}))

vi.mock('#imports', () => ({
  defineNuxtPlugin: (plugin: unknown) => plugin,
  useAppConfig: () => ({}),
  useHead: (input: unknown) => nuxtStub.head.push(input),
  useRoute: () => ({ query: { tema: 'cancer-mama' } }),
  useRuntimeConfig: () => nuxtStub.runtime,
  useState: <T>(key: string, init: () => T) => {
    if (!nuxtStub.state.has(key)) nuxtStub.state.set(key, ref(init()))
    return nuxtStub.state.get(key) as Ref<T>
  },
}))

describe('Nuxt', () => {
  async function run(chrome: boolean) {
    nuxtStub.head.length = 0
    nuxtStub.state.clear()
    nuxtStub.runtime.public.fiUi.chrome = chrome
    const { default: plugin } = await import('../src/nuxt/runtime/plugin') as unknown as {
      default: { setup: (app: { vueApp: ReturnType<typeof createApp> }) => void }
    }
    const vueApp = createApp(defineComponent({ setup: () => () => h('div') }))
    plugin.setup({ vueApp })
    return nuxtStub.head[0] as { htmlAttrs: Record<string, unknown>, meta: { name: string, content: Ref<string> }[] }
  }

  it('theme-color con el primario del tema activo, también sin FiHeader', async () => {
    const input = await run(true)
    const meta = input.meta.find(m => m.name === 'theme-color')
    expect(meta && isRef(meta.content) ? meta.content.value : undefined).toBe(fiThemes['cancer-mama'].chromeColor)
    expect(input.htmlAttrs['data-fi-chrome']).toBeUndefined()
  })

  it('chrome: false — sin theme-color y con data-fi-chrome="off" en <html>', async () => {
    const input = await run(false)
    expect(input.meta).toEqual([])
    expect(input.htmlAttrs['data-fi-chrome']).toBe('off')
  })
})
