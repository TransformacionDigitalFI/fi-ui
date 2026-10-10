import { describe, expect, it } from 'vitest'
import { loadComponent, openingTag, render } from './render'

const FiIconBadge = await loadComponent('FiIconBadge')

describe('FiIconBadge', () => {
  it('sin label es decorativo', async () => {
    const html = await render(FiIconBadge, { icon: 'i-ph-heart' })
    const root = openingTag(html, /<span[^>]*>/)
    expect(root).toContain('aria-hidden="true"')
    expect(root).not.toContain('role=')
  })

  it('con label se anuncia como imagen con nombre', async () => {
    const html = await render(FiIconBadge, { icon: 'i-ph-heart', label: { es: 'Bienestar', en: 'Wellbeing' } }, { locale: 'en' })
    const root = openingTag(html, /<span[^>]*>/)
    expect(root).toContain('role="img"')
    expect(root).toContain('aria-label="Wellbeing"')
    expect(root).not.toContain('aria-hidden')
  })

  it.each([
    ['sm', 'size-8', 'size-4'],
    ['md', 'size-10', 'size-5'],
    ['lg', 'size-12', 'size-6'],
    ['xl', 'size-14', 'size-7'],
  ])('tamaño %s: círculo %s, ícono %s', async (size, box, icon) => {
    const html = await render(FiIconBadge, { icon: 'i-ph-heart', size })
    expect(openingTag(html, /<span[^>]*>/)).toContain(box)
    expect(openingTag(html, /<span class="iconify[^>]*>/)).toContain(icon)
  })

  it('azul marino por defecto; oro AA (secondary-500) y estados con su token de texto', async () => {
    expect(await render(FiIconBadge, { icon: 'i-ph-x' })).toContain('bg-fi-navy text-white')
    expect(await render(FiIconBadge, { icon: 'i-ph-x', tone: 'gold' })).toContain('bg-secondary-500 text-white')
    expect(await render(FiIconBadge, { icon: 'i-ph-x', tone: 'warning' })).toContain('bg-warning/10 text-warning')
  })
})
