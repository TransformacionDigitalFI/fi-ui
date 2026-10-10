import { describe, expect, it } from 'vitest'
import { loadComponent, openingTag, render } from './render'

const FiLogo = await loadComponent('FiLogo')

describe('FiLogo', () => {
  it.each([
    ['es', 'Facultad de Ingeniería'],
    ['en', 'Faculty of Engineering'],
    ['en-US', 'Faculty of Engineering'],
    ['es-MX', 'Facultad de Ingeniería'],
  ])('alt por defecto en %s: %s', async (locale, alt) => {
    const html = await render(FiLogo, {}, { locale })
    expect(openingTag(html, /<img[^>]*>/)).toContain(`alt="${alt}"`)
  })

  it('alt propio, también `{ es, en }`', async () => {
    const html = await render(FiLogo, { alt: { es: 'Inicio', en: 'Home' } }, { locale: 'en' })
    expect(html).toContain('alt="Home"')
  })

  it('alt="" lo vuelve decorativo (no cae al del diccionario)', async () => {
    // Vue escribe el atributo vacío sin valor (`alt`), que en HTML es lo mismo que alt="".
    const img = openingTag(await render(FiLogo, { alt: '' }), /<img[^>]*>/)
    expect(img).toMatch(/\salt(?:="")?[\s>]/)
    expect(img).not.toContain('Facultad')
  })
})
