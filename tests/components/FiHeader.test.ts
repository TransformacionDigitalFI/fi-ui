import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { loadComponent, openingTag, render } from './render'

const FiHeader = await loadComponent('FiHeader')

describe('FiHeader', () => {
  it('lo primero es "Saltar al contenido" hacia #main-content, oculto hasta el foco', async () => {
    const html = await render(FiHeader)
    expect(html.startsWith('<a href="#main-content"')).toBe(true)
    const link = openingTag(html, /<a href="#main-content"[^>]*>/)
    expect(link).toContain('sr-only')
    expect(link).toContain('focus:not-sr-only')
    expect(html).toMatch(/<a href="#main-content"[^>]*>Saltar al contenido<\/a>/)
  })

  it('destino configurable, en el idioma activo, o sin enlace con skipTo=false', async () => {
    expect(await render(FiHeader, { skipTo: '#contenido' }, { locale: 'en' }))
      .toMatch(/^<a href="#contenido"[^>]*>Skip to main content<\/a>/)
    expect(await render(FiHeader, { skipTo: false })).not.toContain('Saltar al contenido')
  })

  it('el título acepta `{ es, en }`', async () => {
    const html = await render(FiHeader, { title: { es: 'Programa', en: 'Program' }, topBar: false }, { locale: 'en' })
    expect(html).toMatch(/border-s[^>]*>Program</)
  })

  it('pasa `controlClass` de la cinta a su slot `top-bar-end`', async () => {
    const html = await render(FiHeader, {}, {
      slots: { 'top-bar-end': ({ controlClass }: { controlClass: string }) => h('button', { type: 'button', class: controlClass }, 'English') },
    })
    const button = openingTag(html, /<button[^>]*>English/)
    expect(button).toContain('hover:bg-(--fi-topbar-hover)')
    expect(button).toContain('focus-visible:outline-2')
  })
})
