import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { countTags, loadComponent, openingTag, render } from './render'

const FiCtaBand = await loadComponent('FiCtaBand')

describe('FiCtaBand', () => {
  it('es una isla oscura azul marino con un <h2>', async () => {
    const html = await render(FiCtaBand, { title: '¿Necesitas hablar con alguien?' })
    const root = openingTag(html, /<section[^>]*>/)
    expect(root).toMatch(/class="dark /)
    expect(root).toContain('bg-fi-navy')
    expect(countTags(html, 'h2')).toBe(1)
    expect(countTags(html, 'h1')).toBe(0)
  })

  it('headingLevel=3 para una banda dentro de una sección', async () => {
    const html = await render(FiCtaBand, { title: 'A', headingLevel: 3 })
    expect(countTags(html, 'h3')).toBe(1)
  })

  it('el brillo y el ícono son decorativos', async () => {
    const html = await render(FiCtaBand, { title: 'A', icon: 'i-ph-chat-circle' })
    expect(openingTag(html, /<div class="pointer-events-none[^>]*>/)).toContain('aria-hidden="true"')
    expect(openingTag(html, /<span class="iconify[^>]*>/)).toContain('aria-hidden="true"')
  })

  it('el antetítulo dorado es AA sobre azul marino (secondary-300, no --fi-gold)', async () => {
    const html = await render(FiCtaBand, { title: 'A', eyebrow: 'Regreso' })
    expect(openingTag(html, /<p class="mb-2[^>]*>/)).toContain('text-secondary-300')
  })

  it('descripción, contenido y acciones', async () => {
    const html = await render(FiCtaBand, { title: 'A', description: { es: 'Texto', en: 'Text' } }, {
      locale: 'en',
      slots: { default: () => h('p', { id: 'extra' }), actions: () => h('a', { href: '/agendar' }, 'Agendar') },
    })
    expect(html).toContain('Text')
    expect(html).toContain('id="extra"')
    expect(html).toMatch(/justify-center gap-3"><a href="\/agendar">Agendar<\/a>/)
  })
})
