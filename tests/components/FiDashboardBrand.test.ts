import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { loadComponent, openingTag, render } from './render'

const FiDashboardBrand = await loadComponent('FiDashboardBrand')

describe('FiDashboardBrand', () => {
  it('expandida: logotipo blanco con alt y el nombre del sistema, todo como enlace', async () => {
    const html = await render(FiDashboardBrand, { name: 'Programa de Salud Mental', to: '/dashboard' })
    expect(openingTag(html, /<a [^>]*>/)).toContain('href="/dashboard"')
    expect(openingTag(html, /<img[^>]*>/)).toContain('alt="Facultad de Ingeniería"')
    expect(openingTag(html, /<img[^>]*>/)).toContain('fi-wordmark-inverse')
    expect(html).toMatch(/text-fi-gold[^>]*>Programa de Salud Mental</)
  })

  it('contraída: escudo decorativo y el nombre completo solo para lectores de pantalla', async () => {
    const html = await render(FiDashboardBrand, { name: { es: 'Programa', en: 'Program' }, collapsed: true }, { locale: 'en' })
    expect(openingTag(html, /<img[^>]*>/)).toMatch(/\salt(?:="")?[\s>]/)
    expect(openingTag(html, /<img[^>]*>/)).toContain('fi-escudo')
    expect(html).toContain('<span class="sr-only">Faculty of Engineering — Program</span>')
  })

  it('slots para logotipo y marca propios', async () => {
    const html = await render(FiDashboardBrand, { collapsed: true }, {
      slots: { mark: () => h('img', { src: '/marca.svg', alt: '' }) },
    })
    expect(html).toContain('/marca.svg')
    expect(html).not.toContain('fi-escudo')
  })
})
