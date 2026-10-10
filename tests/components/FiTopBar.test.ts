import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { contrast } from '../../src/color'
import { fiReadableTextOn } from '../../src/composables/fiComponents'
import { fiTopBarSocial } from '../../src/fi-data'
import { loadComponent, render } from './render'

const FiTopBar = await loadComponent('FiTopBar')

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const topBarSource = read('../../src/components/FiTopBar.vue')
const tokens = read('../../src/css/tokens.css')

/** Hex de un paso del neutro según tokens.css. */
function neutralHex(step: number): string {
  const hex = new RegExp(`--color-fi-neutral-${step}:\\s*(#[0-9A-Fa-f]{6})`).exec(tokens)?.[1]
  if (!hex) throw new Error(`Falta --color-fi-neutral-${step} en tokens.css`)
  return hex
}

/** El hex que hay detrás del valor que devuelve fiReadableTextOn. */
function textHex(value: string): string {
  const step = /--color-fi-neutral-(\d+)/.exec(value)?.[1]
  if (!step) throw new Error(`Valor inesperado: ${value}`)
  return neutralHex(Number(step))
}

describe('FiTopBar: contraste (A-05)', () => {
  it('el hover/foco de los enlaces es AA con texto blanco', () => {
    const hover = /--fi-topbar-hover:\s*var\(--color-fi-neutral-(\d+)\)/.exec(topBarSource)?.[1]
    expect(hover, 'el hover sale de la escala neutral').toBeTruthy()
    expect(contrast('#FFFFFF', neutralHex(Number(hover)))).toBeGreaterThanOrEqual(4.5)
  })

  it('sin hex duplicados de la escala neutral', () => {
    const style = topBarSource.slice(topBarSource.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')
    expect(style).not.toMatch(/#ADB5BD|#F8F9FA/i)
  })

  it.each(fiTopBarSocial.filter(item => item.color).map(item => [item.label, item.color!] as const))(
    'el nombre de %s es AA sobre su color de marca',
    (_, color) => {
      expect(contrast(textHex(fiReadableTextOn(color)), color)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('un color que no se puede medir conserva el texto claro', () => {
    expect(fiReadableTextOn('var(--marca)')).toBe('var(--color-fi-neutral-50)')
    expect(fiReadableTextOn(undefined)).toBe('var(--color-fi-neutral-50)')
  })
})

describe('FiTopBar: marcado', () => {
  it('los enlaces con submenú no se anuncian como menú (no hay role=menu detrás)', async () => {
    expect(await render(FiTopBar)).not.toContain('aria-haspopup')
  })

  it('el color de texto de cada red viaja en una variable', async () => {
    const html = await render(FiTopBar, { social: [{ label: 'Instagram', icon: 'i-x', to: 'https://i.g', color: '#FCAF45' }] })
    expect(html).toContain('--fi-social-text:var(--color-fi-neutral-900)')
  })

  it('la ranura `end` recibe la receta de un control de la cinta', async () => {
    const html = await render(FiTopBar, { links: [], social: [] }, {
      slots: { end: ({ controlClass }: { controlClass: string }) => h('button', { type: 'button', class: controlClass }, 'English') },
    })
    expect(html).toMatch(/<button type="button" class="inline-flex h-full[^"]*text-white[^"]*">English<\/button>/)
  })
})
