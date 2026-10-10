import { computed, inject, ref } from 'vue'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

/**
 * Idioma de los componentes del paquete. No depende de ninguna librería de
 * i18n: el proyecto le pasa el idioma activo (el módulo de Nuxt lo toma de
 * @nuxtjs/i18n si está instalado; en Vue, `createFiUi({ locale })`). Sin
 * proveedor, español.
 *
 * - Los textos propios del paquete ("Aviso de privacidad", "Redes sociales")
 *   viven en el diccionario de abajo.
 * - Los datos que pasa el proyecto (enlaces, redes, contacto, temas) aceptan
 *   `LocalizedText`: un texto fijo o `{ es, en }`.
 */

export type FiLocale = 'es' | 'en'

/** Texto fijo, o uno por idioma (el español es obligatorio: es el respaldo). */
export type LocalizedText = string | { es: string, en?: string }

export const fiLocaleKey: InjectionKey<Readonly<Ref<string>>> = Symbol('fi-ui:locale')

export function useFiLocale(): Readonly<Ref<string>> {
  return inject(fiLocaleKey, () => ref('es'), true)
}

/**
 * Reduce el código que pase el proyecto a uno de los dos idiomas del paquete.
 * @nuxtjs/i18n y vue-i18n aceptan códigos con región ('en-US', 'en_GB'); una
 * comparación exacta con 'en' los mandaba en silencio al español.
 */
export function normalizeFiLocale(locale: string | null | undefined): FiLocale {
  return typeof locale === 'string' && /^en(?:[-_]|$)/i.test(locale.trim()) ? 'en' : 'es'
}

export function resolveText(text: LocalizedText, locale: string): string {
  if (typeof text === 'string') return text
  return (normalizeFiLocale(locale) === 'en' ? text.en : undefined) ?? text.es
}

const MESSAGES = {
  es: {
    facultyLinks: 'Accesos de la Facultad',
    socialNetworks: 'Redes sociales',
    footerLinks: 'Enlaces del pie',
    privacyNotice: 'Aviso de privacidad',
    phone: 'Teléfono',
    email: 'Correo',
    rights: 'Facultad de Ingeniería — UNAM © {year} Derechos reservados',
    goBack: 'Regresar',
    faculty: 'Facultad de Ingeniería',
    skipToContent: 'Saltar al contenido',
    loading: 'Cargando…',
  },
  en: {
    facultyLinks: 'Faculty links',
    socialNetworks: 'Social media',
    footerLinks: 'Footer links',
    privacyNotice: 'Privacy notice',
    phone: 'Phone',
    email: 'Email',
    rights: 'Faculty of Engineering — UNAM © {year} All rights reserved',
    goBack: 'Go back',
    faculty: 'Faculty of Engineering',
    skipToContent: 'Skip to main content',
    loading: 'Loading…',
  },
} satisfies Record<FiLocale, Record<string, string>>

export type FiMessageKey = keyof typeof MESSAGES.es

/** Textos propios del paquete en el idioma activo, con `{param}` opcional. */
export function useFiT(): ComputedRef<(key: FiMessageKey, params?: Record<string, string | number>) => string> {
  const locale = useFiLocale()
  return computed(() => {
    const dict = normalizeFiLocale(locale.value) === 'en' ? MESSAGES.en : MESSAGES.es
    return (key, params) => {
      const text: string = dict[key] ?? MESSAGES.es[key]
      return params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text
    }
  })
}

/** Resuelve `LocalizedText` reactivo al idioma activo. */
export function useFiText(): ComputedRef<(text: LocalizedText) => string> {
  const locale = useFiLocale()
  return computed(() => (text: LocalizedText) => resolveText(text, locale.value))
}
