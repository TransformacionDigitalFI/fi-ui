import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'
import { fiContact, fiTopLinks } from '../src/fi-data'
import { fiLocaleKey, resolveText, useFiT, useFiText } from '../src/i18n'
import { fiThemes } from '../src/themes/registry'

function withLocale<T>(locale: string, use: () => T): T {
  const app = createApp(defineComponent({ setup: () => () => h('div') }))
  app.provide(fiLocaleKey, ref(locale))
  return app.runWithContext(use)
}

describe('resolveText', () => {
  it('un texto fijo es igual en todos los idiomas', () => {
    expect(resolveText('8M', 'en')).toBe('8M')
  })

  it('usa el inglés si existe y cae al español si no', () => {
    expect(resolveText({ es: 'Género', en: 'Gender' }, 'en')).toBe('Gender')
    expect(resolveText({ es: 'Género' }, 'en')).toBe('Género')
    expect(resolveText({ es: 'Género', en: 'Gender' }, 'es')).toBe('Género')
  })
})

describe('useFiT', () => {
  it('sin proveedor habla español', () => {
    const app = createApp(defineComponent({ setup: () => () => h('div') }))
    const t = app.runWithContext(useFiT)
    expect(t.value('privacyNotice')).toBe('Aviso de privacidad')
  })

  it('interpola parámetros en el idioma activo', () => {
    const t = withLocale('en', useFiT)
    expect(t.value('rights', { year: 2026 })).toBe('Faculty of Engineering — UNAM © 2026 All rights reserved')
  })

  it('un idioma desconocido cae al español', () => {
    const text = withLocale('fr', useFiText)
    expect(text.value({ es: 'Avisos', en: 'Notices' })).toBe('Avisos')
  })
})

describe('datos del portal', () => {
  it('todo texto con versión por idioma trae inglés', () => {
    const texts = [
      ...fiTopLinks.flatMap(link => [link.label, ...(link.children ?? []).map(child => child.label)]),
      fiContact.institution,
      fiContact.entity,
      ...Object.values(fiThemes).flatMap(theme => [theme.label, theme.description]),
    ]
    for (const text of texts) {
      if (typeof text !== 'string') expect(text.en, text.es).toBeTruthy()
    }
  })
})
