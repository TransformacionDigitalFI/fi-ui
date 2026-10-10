import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { countTags, loadComponent, openingTag, render } from './render'

const FiPageHeader = await loadComponent('FiPageHeader')

describe('FiPageHeader', () => {
  it('rinde un solo <h1> con el título', async () => {
    const html = await render(FiPageHeader, { title: 'Solicitudes', description: 'Bandeja de entrada' })
    expect(countTags(html, 'h1')).toBe(1)
    expect(html).toMatch(/<h1[^>]*>\s*Solicitudes\s*<\/h1>/)
    expect(html).toContain('Bandeja de entrada')
  })

  it('con as="h2" no aporta ningún <h1>', async () => {
    const html = await render(FiPageHeader, { title: 'Sección', as: 'h2' })
    expect(countTags(html, 'h1')).toBe(0)
    expect(countTags(html, 'h2')).toBe(1)
  })

  it('el título es azul marino con la utilidad del paquete, no con una variable suelta', async () => {
    const html = await render(FiPageHeader, { title: 'Vista' })
    expect(openingTag(html, /<h1[^>]*>/)).toContain('text-fi-navy')
    expect(html).not.toContain('(--fi-navy)')
  })

  it('el antetítulo usa la etiqueta-flecha y el filete es decorativo', async () => {
    const html = await render(FiPageHeader, { title: 'Vista', eyebrow: 'Gestión' })
    expect(html).toMatch(/<span class="fi-tag[^"]*">Gestión<\/span>/)
    expect(html).toMatch(/<span class="mt-2 flex w-24[^"]*" aria-hidden="true">/)
  })

  it('sin filete con rule=false', async () => {
    const html = await render(FiPageHeader, { title: 'Vista', rule: false })
    expect(html).not.toContain('w-24')
  })

  it('back muestra un "Regresar" de solo ícono con nombre accesible', async () => {
    const html = await render(FiPageHeader, { title: 'Detalle', back: '/dashboard/solicitudes' })
    const link = openingTag(html, /<a [^>]*href="\/dashboard\/solicitudes"[^>]*>/)
    expect(link).toContain('aria-label="Regresar"')
    expect(html).not.toMatch(/>\s*Regresar\s*</)
  })

  it('back=false no rinde el botón', async () => {
    const html = await render(FiPageHeader, { title: 'Detalle', back: false })
    expect(countTags(html, 'a')).toBe(0)
  })

  it('el nombre del botón sigue el idioma, también con región (en-US)', async () => {
    const html = await render(FiPageHeader, { title: { es: 'Detalle', en: 'Detail' }, back: '/' }, { locale: 'en-US' })
    expect(html).toContain('aria-label="Go back"')
    expect(html).toMatch(/<h1[^>]*>\s*Detail\s*<\/h1>/)
  })

  it('descriptionLoading reserva el renglón y lo anuncia como carga', async () => {
    const html = await render(FiPageHeader, { title: 'Vista', description: 'No debe verse', descriptionLoading: true })
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('<span class="sr-only">Cargando…</span>')
    expect(html).not.toContain('No debe verse')
  })

  it('pone slots de acciones, insignias y entrada en su lugar', async () => {
    const html = await render(FiPageHeader, { title: 'Vista' }, {
      slots: {
        leading: () => h('img', { alt: '', src: '/avatar.png' }),
        badges: () => h('span', { id: 'badge' }, 'Vigente'),
        actions: () => h('button', { type: 'button' }, 'Nueva'),
      },
    })
    expect(html).toContain('id="badge"')
    expect(html).toContain('>Nueva</button>')
    expect(html.indexOf('/avatar.png')).toBeLessThan(html.indexOf('<h1'))
  })
})
