import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fiAppConfig, fiUiThemeColors } from '../src/app-config'

/**
 * El módulo de Nuxt sin Nuxt: @nuxt/kit es una dependencia par opcional y no
 * se instala en el paquete, así que se sustituye por lo mínimo. Se prueba la
 * lógica propia — solo claro, cromo, mezcla del app.config — no la de Nuxt.
 */

const warn = vi.fn()
vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: (definition: unknown) => definition,
  createResolver: () => ({ resolve: (path: string) => path }),
  addComponentsDir: vi.fn(),
  addImports: vi.fn(),
  addPlugin: vi.fn(),
  addVitePlugin: vi.fn(),
  useLogger: () => ({ warn }),
  hasNuxtModule: (name: string, nuxt: FakeNuxt) => nuxt.options.modules.some(m => (Array.isArray(m) ? m[0] : m) === name),
}))

interface FakeNuxt {
  options: {
    modules: (string | [string, Record<string, unknown>])[]
    typescript: { hoist: string[] }
    ui?: Record<string, unknown>
    fiUi?: Record<string, unknown>
    colorMode?: Record<string, unknown>
    appConfig: Record<string, any>
    runtimeConfig: { public: Record<string, any> }
    build: { transpile: string[] }
    vite: { optimizeDeps?: { exclude?: string[] } }
  }
  hook: ReturnType<typeof vi.fn>
}

function fakeNuxt(overrides: Partial<FakeNuxt['options']> = {}): FakeNuxt {
  return {
    options: {
      modules: ['@fi-unam/ui/nuxt', '@nuxt/ui'],
      typescript: { hoist: [] },
      appConfig: { ui: { colors: { primary: 'green', neutral: 'slate' }, icons: { close: 'i-lucide-x' } } },
      runtimeConfig: { public: {} },
      build: { transpile: [] },
      vite: {},
      ...overrides,
    },
    hook: vi.fn(),
  }
}

type ModuleDefinition = {
  defaults: Record<string, unknown>
  moduleDependencies: (nuxt: FakeNuxt) => Record<string, { defaults?: Record<string, any> }>
  setup: (options: Record<string, unknown>, nuxt: FakeNuxt) => void
}

const { default: mod } = await import('../src/nuxt/module') as unknown as { default: ModuleDefinition }
const options = (overrides: Record<string, unknown> = {}) => ({ ...mod.defaults, ...overrides })

beforeEach(() => warn.mockReset())

describe('solo claro (contrato D1)', () => {
  it('por defecto apaga el color mode de Nuxt UI antes de que Nuxt UI lo resuelva', () => {
    const nuxt = fakeNuxt()
    mod.moduleDependencies(nuxt)
    expect(nuxt.options.ui?.colorMode).toBe(false)
  })

  it('respeta un ui.colorMode que el proyecto declare', () => {
    const nuxt = fakeNuxt({ ui: { colorMode: true } })
    mod.moduleDependencies(nuxt)
    expect(nuxt.options.ui?.colorMode).toBe(true)
  })

  it.each([
    ['en la clave fiUi', { fiUi: { colorMode: 'app' } }],
    ['en línea en modules', { modules: [['@fi-unam/ui/nuxt', { colorMode: 'app' }], '@nuxt/ui'] }],
  ] as const)('con colorMode: \'app\' %s, no lo toca', (_where, overrides) => {
    const nuxt = fakeNuxt(overrides as Partial<FakeNuxt['options']>)
    mod.moduleDependencies(nuxt)
    expect(nuxt.options.ui?.colorMode).toBeUndefined()
  })

  it('si Nuxt UI ya encoló @nuxtjs/color-mode, no lo apaga a medias: lo fija en claro y avisa', () => {
    const nuxt = fakeNuxt({ typescript: { hoist: ['@nuxtjs/color-mode'] } })
    mod.moduleDependencies(nuxt)
    expect(nuxt.options.ui?.colorMode).toBeUndefined()

    mod.setup(options(), nuxt)
    expect(nuxt.options.colorMode).toMatchObject({ preference: 'light', fallback: 'light', storageKey: 'fi-ui-color-mode' })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('sin color-mode en camino no avisa ni toca sus opciones', () => {
    const nuxt = fakeNuxt()
    mod.setup(options(), nuxt)
    expect(nuxt.options.colorMode).toBeUndefined()
    expect(warn).not.toHaveBeenCalled()
  })

  it('pide a Nuxt UI la variante tertiary y los colores de estado', () => {
    const deps = mod.moduleDependencies(fakeNuxt())
    expect(deps['@nuxt/ui']?.defaults?.theme?.colors).toEqual(fiUiThemeColors)
  })
})

describe('app.config', () => {
  it('la configuración FI queda por encima de los defaults de Nuxt UI', () => {
    const nuxt = fakeNuxt()
    mod.setup(options(), nuxt)
    expect(nuxt.options.appConfig.ui.colors.primary).toBe('fi-primary')
    expect(nuxt.options.appConfig.ui.colors.success).toBe('green')
    expect(nuxt.options.appConfig.ui.icons.close).toBe('i-ph-x')
    expect(nuxt.options.appConfig.ui.table).toEqual(fiAppConfig.ui.table)
  })
})

describe('cromo y runtime', () => {
  it('pasa chrome y el tema al runtime público, con chrome encendido por defecto', () => {
    const nuxt = fakeNuxt()
    mod.setup(options(), nuxt)
    expect(nuxt.options.runtimeConfig.public.fiUi).toMatchObject({ theme: 'auto', previewParam: 'tema', chrome: true })
  })

  it('chrome: false llega al runtime', () => {
    const nuxt = fakeNuxt()
    mod.setup(options({ chrome: false }), nuxt)
    expect(nuxt.options.runtimeConfig.public.fiUi.chrome).toBe(false)
  })

  it('no pre-empaqueta el paquete ni sus entradas profundas', () => {
    const nuxt = fakeNuxt()
    mod.setup(options(), nuxt)
    expect(nuxt.options.vite.optimizeDeps?.exclude).toEqual(['@fi-unam/ui', '@fi-unam/ui/vue', '@fi-unam/ui/data'])
    expect(nuxt.options.build.transpile).toContain('@fi-unam/ui')
  })
})
