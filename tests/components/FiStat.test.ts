import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { countTags, loadComponent, openingTag, render } from './render'

const FiStat = await loadComponent('FiStat')
const FiStatGrid = await loadComponent('FiStatGrid')

const stats = [
  { label: 'Abiertas', value: 12, icon: 'i-ph-tray' },
  { label: { es: 'Vencidas', en: 'Overdue' }, value: 3, icon: 'i-ph-warning', tone: 'error' },
  { label: 'Cerradas', value: '1,204', hint: 'Este semestre' },
]

/** Contenido de cada grupo `<div>` del `<dl>` (sin la etiqueta de apertura ni comentarios). */
function groups(html: string): string[] {
  return html.replace(/<!--[\s\S]*?-->/g, '')
    .split('<div class="relative flex')
    .slice(1)
    .map(group => group.slice(group.indexOf('>') + 1))
}

/** Etiquetas dt/dd de cada grupo, en orden. */
function groupChildren(html: string): string[][] {
  return groups(html).map(group => [...group.matchAll(/<(dt|dd)[\s>]/g)].map(m => m[1]!))
}

describe('FiStatGrid', () => {
  it('es una lista de definiciones con un grupo dt/dd por cifra', async () => {
    const html = await render(FiStatGrid, { stats })
    expect(html.startsWith('<dl')).toBe(true)
    expect(countTags(html, 'dl')).toBe(1)
    expect(countTags(html, 'dt')).toBe(3)
    expect(groupChildren(html)).toEqual([['dt', 'dd'], ['dt', 'dd'], ['dt', 'dd', 'dd']])
  })

  it('cada grupo solo tiene dt y dd como hijos directos (HTML válido)', async () => {
    const html = await render(FiStatGrid, { stats: stats.map(stat => ({ ...stat, to: '/x' })) })
    for (const group of groups(html)) {
      const rest = group.replace(/<(dt|dd)[\s>][\s\S]*?<\/\1>/g, '')
      expect(rest.startsWith('</div>'), rest).toBe(true)
    }
  })

  it('el rótulo va antes que el dato en el DOM y el dato lleva cifras tabulares', async () => {
    const html = await render(FiStatGrid, { stats: [stats[0]] })
    expect(html.indexOf('Abiertas')).toBeLessThan(html.indexOf('>12<'))
    expect(openingTag(html, /<dd[^>]*>/)).toMatch(/order-first.*tabular-nums.*text-fi-navy/)
  })

  it('el tono de estado solo cambia el círculo; el normal es azul marino', async () => {
    const html = await render(FiStatGrid, { stats })
    expect(html).toContain('bg-fi-navy text-white')
    expect(html).toContain('bg-error/10 text-error')
    expect(html).toContain('Vencidas')
  })

  it('columnas: tantas como cifras con `stats`, 4 con el slot, o las que se pidan', async () => {
    expect(await render(FiStatGrid, { stats })).toContain('sm:grid-cols-3')
    expect(await render(FiStatGrid, { stats: [stats[0]] })).toContain('sm:grid-cols-2')
    expect(await render(FiStatGrid, {}, { slots: { default: () => h(FiStat, { label: 'A', value: 1 }) } }))
      .toContain('lg:grid-cols-4')
    expect(await render(FiStatGrid, { stats, columns: 5 })).toContain('xl:grid-cols-5')
  })

  it('con FiStat en el slot sigue siendo un solo <dl>', async () => {
    const html = await render(FiStatGrid, {}, {
      slots: { default: () => [h(FiStat, { label: 'A', value: 1 }), h(FiStat, { label: 'B', value: 2 })] },
    })
    expect(countTags(html, 'dl')).toBe(1)
    expect(countTags(html, 'dt')).toBe(2)
  })

  it('loading pone todas las cifras en espera sin ocultar sus rótulos', async () => {
    const html = await render(FiStatGrid, { stats, loading: true })
    expect(html.match(/aria-busy="true"/g)).toHaveLength(3)
    expect(html).toContain('Abiertas')
    expect(html).not.toContain('>12<')
  })

  it('traduce los rótulos `{ es, en }`', async () => {
    const html = await render(FiStatGrid, { stats }, { locale: 'en' })
    expect(html).toContain('Overdue')
  })
})

describe('FiStat suelto', () => {
  it('rinde su propio <dl>', async () => {
    const html = await render(FiStat, { label: 'Sesiones', value: 40 })
    expect(html.startsWith('<dl')).toBe(true)
    expect(countTags(html, 'dt')).toBe(1)
  })

  it('el círculo del ícono es decorativo', async () => {
    const html = await render(FiStat, { label: 'Sesiones', value: 40, icon: 'i-ph-calendar' })
    expect(openingTag(html, /<span class="inline-grid[^>]*>/)).toContain('aria-hidden="true"')
  })

  it('con `to` el rótulo es el enlace y cubre la tarjeta, con foco visible', async () => {
    const html = await render(FiStat, { label: 'Pendientes', value: 5, to: '/pendientes' })
    const link = openingTag(html, /<a [^>]*>/)
    expect(link).toContain('href="/pendientes"')
    expect(link).toContain('after:inset-0')
    expect(link).toContain('focus-visible:after:outline-2')
    expect(html).toMatch(/<a [^>]*>\s*Pendientes\s*<\/a>/)
    expect(openingTag(html, /<span class="iconify pointer-events-none[^>]*>/)).toContain('aria-hidden="true"')
  })

  it('en carga anuncia "Cargando…" y no muestra el valor', async () => {
    const html = await render(FiStat, { label: 'Sesiones', value: 40, loading: true })
    expect(html).toContain('<span class="sr-only">Cargando…</span>')
    expect(html).not.toContain('>40<')
  })
})
