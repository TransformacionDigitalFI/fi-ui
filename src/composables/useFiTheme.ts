import { computed, inject, ref } from 'vue'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import { FI_CHROME_COLOR } from '../chrome'
import { fiThemes, FI_DEFAULT_THEME } from '../themes/registry'
import type { FiThemeDefinition, FiThemeId } from '../themes/registry'

/**
 * Estado del tema activo. Lo provee el módulo de Nuxt o el plugin de Vue; los
 * componentes del paquete solo lo leen, así que funcionan igual en ambos.
 *
 * Cambiar el tema en tiempo de ejecución es para vistas previas: el tema del
 * sitio se decide en configuración (`theme: 'auto' | id`), no por visitante.
 */
export interface FiThemeState {
  /** Id del tema aplicado al documento. */
  theme: Readonly<Ref<FiThemeId>>
  definition: ComputedRef<FiThemeDefinition>
  setTheme: (id: FiThemeId) => void
  /**
   * Color de la barra del navegador (`<meta name="theme-color">`). Lo ajusta
   * FiHeader según lo que esté arriba de la pantalla: la cinta roja o el
   * header oscuro.
   */
  chromeColor: Ref<string>
}

export const fiThemeKey: InjectionKey<FiThemeState> = Symbol('fi-ui:theme')

export function createFiThemeState(
  theme: Ref<FiThemeId>,
  chromeColor: Ref<string> = ref(FI_CHROME_COLOR),
): FiThemeState {
  return {
    theme,
    chromeColor,
    definition: computed(() => fiThemes[theme.value]),
    setTheme: (id) => {
      theme.value = id
    },
  }
}

/**
 * Sin proveedor devuelve el tema base en lugar de lanzar: un componente del
 * paquete usado en una prueba o en una historia aislada sigue renderizando.
 */
export function useFiTheme(): FiThemeState {
  return inject(fiThemeKey, () => createFiThemeState(ref(FI_DEFAULT_THEME)), true)
}
