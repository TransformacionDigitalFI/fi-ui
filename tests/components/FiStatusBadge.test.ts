import { describe, expect, it } from 'vitest'
import { fiStatusIcons } from '../../src/composables/fiComponents'
import type { FiStatus } from '../../src/composables/fiComponents'
import { loadComponent, render } from './render'

const FiStatusBadge = await loadComponent('FiStatusBadge')

describe('FiStatusBadge', () => {
  it.each(Object.entries(fiStatusIcons))('%s: ícono propio y texto, nunca solo color', async (status, icon) => {
    const html = await render(FiStatusBadge, { status, label: 'Estado' })
    expect(html).toContain(`data-icon="${icon}"`)
    expect(html).toContain('<span data-slot="label">Estado</span>')
    expect(html).toContain(`data-color="${status}"`)
  })

  it('cada estado tiene un ícono distinto', () => {
    const icons = Object.values(fiStatusIcons)
    expect(new Set(icons).size).toBe(icons.length)
  })

  it('variante subtle por defecto; ícono y variante configurables', async () => {
    const status: FiStatus = 'warning'
    expect(await render(FiStatusBadge, { status, label: 'Pendiente' })).toContain('data-variant="subtle"')
    const html = await render(FiStatusBadge, { status, label: 'Pendiente', icon: 'i-ph-hourglass', variant: 'outline' })
    expect(html).toContain('data-icon="i-ph-hourglass"')
    expect(html).toContain('data-variant="outline"')
  })

  it('traduce la etiqueta `{ es, en }`', async () => {
    const html = await render(FiStatusBadge, { status: 'success', label: { es: 'Vigente', en: 'Active' } }, { locale: 'en-GB' })
    expect(html).toContain('>Active</span>')
  })
})
