import { inject, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { FiContact, FiLink, FiSocialLink } from '../fi-data'

/**
 * Contenido institucional que cambia por proyecto: los enlaces y redes de la
 * cinta superior y del pie. Lo provee el módulo de Nuxt (desde `fiUi` en el
 * app.config.ts del proyecto) o el plugin de Vue (`createFiUi({ ... })`).
 *
 * Precedencia en cada componente: prop explícita > esta configuración > datos
 * del portal FI (src/fi-data.ts). Un arreglo vacío es una decisión ("sin
 * redes"), no un hueco: no cae al valor del portal.
 */
export interface FiUiConfig {
  topBar?: {
    links?: FiLink[]
    social?: FiSocialLink[]
  }
  footer?: {
    social?: FiSocialLink[]
    links?: FiLink[]
    contact?: FiContact
  }
}

export const fiConfigKey: InjectionKey<Readonly<Ref<FiUiConfig>>> = Symbol('fi-ui:config')

export function useFiConfig(): Readonly<Ref<FiUiConfig>> {
  return inject(fiConfigKey, () => ref<FiUiConfig>({}), true)
}
