import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadComponent, openingTag, render } from './render'

const FiBackButton = await loadComponent('FiBackButton')

describe('FiBackButton', () => {
  it('no depende de #imports (funciona en Vue + Vite sin Nuxt)', () => {
    const source = readFileSync(fileURLToPath(new URL('../../src/components/FiBackButton.vue', import.meta.url)), 'utf8')
    expect(source).not.toMatch(/from\s+['"]#imports['"]/)
  })

  it('con texto: "Regresar" visible y la ruta de respaldo', async () => {
    const html = await render(FiBackButton, { fallback: '/inicio' })
    const link = openingTag(html, /<a [^>]*>/)
    expect(link).toContain('href="/inicio"')
    expect(link).not.toContain('aria-label')
    expect(html).toMatch(/>\s*Regresar\s*<\/a>/)
  })

  it('iconOnly: sin texto visible y con aria-label', async () => {
    const html = await render(FiBackButton, { iconOnly: true })
    const link = openingTag(html, /<a [^>]*>/)
    expect(link).toContain('aria-label="Regresar"')
    expect(link).toContain('size-9')
    expect(html).not.toMatch(/>\s*Regresar\s*</)
    expect(openingTag(html, /<span class="iconify[^>]*>/)).toContain('aria-hidden="true"')
  })

  it('ícono configurable, Phosphor por defecto', async () => {
    expect(await render(FiBackButton)).toContain('data-icon="i-ph-arrow-left"')
    expect(await render(FiBackButton, { icon: 'i-ph-house' })).toContain('data-icon="i-ph-house"')
  })

  it('etiqueta `{ es, en }` y diccionario por idioma, también con región', async () => {
    expect(await render(FiBackButton, { iconOnly: true }, { locale: 'en-US' })).toContain('aria-label="Go back"')
    expect(await render(FiBackButton, { label: { es: 'Volver a la lista', en: 'Back to list' } }, { locale: 'en' }))
      .toMatch(/>\s*Back to list\s*<\/a>/)
  })
})
