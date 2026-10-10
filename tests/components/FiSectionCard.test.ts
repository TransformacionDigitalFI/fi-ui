import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { countTags, loadComponent, openingTag, render } from './render'

const FiSectionCard = await loadComponent('FiSectionCard')

describe('FiSectionCard', () => {
  it('es una <section> con <h2> azul marino por defecto', async () => {
    const html = await render(FiSectionCard, { title: 'Datos de contacto' }, { slots: { default: () => 'cuerpo' } })
    expect(html.startsWith('<section')).toBe(true)
    expect(openingTag(html, /<h2[^>]*>/)).toContain('text-fi-navy')
    expect(html).toMatch(/<h2[^>]*>\s*Datos de contacto\s*<\/h2>/)
  })

  it('headingLevel=3 baja el nivel y el tamaño', async () => {
    const html = await render(FiSectionCard, { title: 'Nota', headingLevel: 3 })
    expect(countTags(html, 'h2')).toBe(0)
    expect(openingTag(html, /<h3[^>]*>/)).toContain('text-base')
  })

  it('cambia de elemento con `as`', async () => {
    expect((await render(FiSectionCard, { title: 'A', as: 'article' })).startsWith('<article')).toBe(true)
    expect((await render(FiSectionCard, { title: 'A', as: 'div' })).startsWith('<div')).toBe(true)
  })

  it('el ícono del encabezado es decorativo', async () => {
    const html = await render(FiSectionCard, { title: 'A', icon: 'i-ph-phone' })
    expect(openingTag(html, /<span class="inline-grid[^>]*>/)).toContain('aria-hidden="true"')
  })

  it('divided traza el borde bajo el encabezado', async () => {
    const plain = await render(FiSectionCard, { title: 'A' }, { slots: { default: () => 'x' } })
    const divided = await render(FiSectionCard, { title: 'A', divided: true }, { slots: { default: () => 'x' } })
    expect(plain).not.toContain('border-b')
    expect(divided).toContain('border-b border-default')
  })

  it('padded=false deja el cuerpo sin relleno', async () => {
    const html = await render(FiSectionCard, { padded: false }, { slots: { default: () => h('table', { id: 'tabla' }) } })
    expect(html).toMatch(/<div class="flex-1"><table id="tabla">/)
  })

  it('con h-full, el cuerpo crece y el pie queda abajo', async () => {
    const html = await render(FiSectionCard, { title: 'A' }, { slots: { default: () => 'cuerpo', footer: () => 'pie' } })
    expect(html.slice(0, html.indexOf('>'))).toContain('flex flex-col')
    expect(html).toMatch(/<div class="flex-1[^"]*">cuerpo/)
  })

  it('acciones, pie y encabezado propio', async () => {
    const html = await render(FiSectionCard, { title: 'A' }, {
      slots: {
        actions: () => h('button', { type: 'button' }, 'Agregar'),
        footer: () => 'pie',
        default: () => 'cuerpo',
      },
    })
    expect(html).toContain('>Agregar</button>')
    expect(html).toMatch(/border-t border-default[^>]*>pie</)

    const custom = await render(FiSectionCard, { title: 'No debe verse' }, { slots: { header: () => h('h2', 'Propio') } })
    expect(custom).toContain('Propio')
    expect(custom).not.toContain('No debe verse')
  })

  it('sin título ni slots de encabezado no rinde encabezado', async () => {
    const html = await render(FiSectionCard, {}, { slots: { default: () => 'solo cuerpo' } })
    expect(countTags(html, 'h2')).toBe(0)
    expect(html).toContain('p-4 sm:p-5')
  })
})
