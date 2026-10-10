import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import colors from 'tailwindcss/colors'
import { describe, expect, it } from 'vitest'
import { fiAppConfig, fiIcons, fiPrimaryOnTint, fiStatusColors, fiUiColors, fiUiThemeColors } from '../src/app-config'

/**
 * La configuración de Nuxt UI que trae el paquete (contrato D2, D3 y D6).
 * Lo que se mide en color está en contrast.test.ts y surfaces.test.ts; aquí,
 * que cada componente reciba lo que la regla de superficies dice.
 */

const ui = fiAppConfig.ui as Record<string, any>
const require = createRequire(import.meta.url)

/** Todas las clases de un valor de configuración, aplanadas. */
function classesOf(value: unknown): string[] {
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean)
  if (Array.isArray(value)) return value.flatMap(classesOf)
  if (value && typeof value === 'object') return Object.values(value).flatMap(classesOf)
  return []
}

describe('colores', () => {
  it('roles de marca a las escalas del paquete y estados a paletas de Tailwind', () => {
    expect(ui.colors).toEqual({ ...fiUiColors, ...fiStatusColors })
    expect(fiStatusColors).toEqual({ success: 'green', info: 'sky', warning: 'amber', error: 'red' })
    for (const palette of Object.values(fiStatusColors)) {
      expect((colors as Record<string, unknown>)[palette], palette).toBeTruthy()
    }
  })

  it('Nuxt UI genera variantes para todos los colores configurados', () => {
    for (const key of Object.keys(ui.colors).filter(k => k !== 'neutral')) expect(fiUiThemeColors).toContain(key)
  })
})

describe('íconos', () => {
  // Las claves de `ui.icons` de Nuxt UI 4.9.
  const NUXT_UI_ICON_KEYS = [
    'arrowDown', 'arrowLeft', 'arrowRight', 'arrowUp', 'caution', 'check', 'chevronDoubleLeft',
    'chevronDoubleRight', 'chevronDown', 'chevronLeft', 'chevronRight', 'chevronUp', 'close', 'copy',
    'copyCheck', 'dark', 'drag', 'ellipsis', 'error', 'external', 'eye', 'eyeOff', 'file', 'folder',
    'folderOpen', 'hash', 'info', 'light', 'loading', 'menu', 'minus', 'panelClose', 'panelOpen', 'plus',
    'reload', 'search', 'stop', 'success', 'system', 'tip', 'upload', 'warning',
  ]
  const ph = JSON.parse(readFileSync(require.resolve('@iconify-json/ph/icons.json'), 'utf8')) as {
    icons: Record<string, unknown>
    aliases?: Record<string, unknown>
  }

  it('cubre todas las claves de Nuxt UI, con Phosphor', () => {
    expect(Object.keys(fiIcons).sort()).toEqual([...NUXT_UI_ICON_KEYS].sort())
    expect(ui.icons).toBe(fiIcons)
  })

  it.each(Object.entries(fiIcons))('%s → %s existe en @iconify-json/ph', (_key, icon) => {
    const name = icon.replace(/^i-ph-/, '')
    expect(icon).toMatch(/^i-ph-/)
    expect(name in ph.icons || name in (ph.aliases ?? {}), icon).toBe(true)
  })
})

describe('superficies (contrato D2)', () => {
  it.each([
    ['modal', 'content'], ['slideover', 'content'], ['drawer', 'content'], ['popover', 'content'],
    ['tooltip', 'content'], ['toast', 'root'], ['dropdownMenu', 'content'], ['contextMenu', 'content'],
    ['select', 'content'], ['selectMenu', 'content'], ['inputMenu', 'content'],
  ])('%s: el %s del overlay es blanco (bg-elevated)', (component, slot) => {
    expect(classesOf(ui[component].slots[slot])).toContain('bg-elevated')
  })

  it.each(['card', 'pageCard'])('%s es la tarjeta FI: blanca y rounded-2xl', (component) => {
    expect(classesOf(ui[component].slots.root)).toContain('rounded-2xl')
    expect(classesOf(ui[component].variants.variant.outline)).toContain('bg-elevated')
  })

  it('UPageCard enlazable: hover visible sobre la tarjeta blanca', () => {
    const hovers = (ui.pageCard.compoundVariants as { to?: boolean, class: unknown }[])
      .filter(c => c.to === true)
      .flatMap(c => classesOf(c.class))
    expect(hovers).toEqual(expect.arrayContaining(['hover:bg-muted/50', 'hover:bg-accented']))
  })

  it('USkeleton: tinte visible sobre blanco y quieto con prefers-reduced-motion', () => {
    expect(classesOf(ui.skeleton.base)).toEqual(expect.arrayContaining(['bg-accented', 'motion-reduce:animate-none']))
  })

  it.each(['modal', 'slideover'])('%s: el pie alinea [Cancelar] [Acción] a la derecha', (component) => {
    expect(classesOf(ui[component].slots.footer)).toContain('justify-end')
  })

  it.each(['input', 'textarea', 'select', 'selectMenu', 'inputMenu', 'inputNumber', 'inputTags', 'inputDate', 'inputTime', 'pinInput'])(
    '%s: el campo outline es blanco',
    (component) => {
      expect(classesOf(ui[component].variants.variant.outline)).toContain('bg-elevated')
    },
  )

  it('ningún hover, selección ni relleno usa bg-elevated (es la tarjeta)', () => {
    const offenders: string[] = []
    for (const [component, config] of Object.entries(ui)) {
      for (const cls of classesOf(config)) {
        if (/(?:^|:)before:bg-elevated|(?:hover|active|focus|data-\[[^\]]+\]|data-highlighted|data-selected):bg-elevated/.test(cls)) {
          offenders.push(`${component}: ${cls}`)
        }
      }
    }
    // El día elegido en un calendario `outline` es superficie con anillo (como
    // un botón outline), no un tinte: blanco a propósito.
    expect(offenders).toEqual(['calendar: data-selected:bg-elevated'])
  })

  it('botón neutro: ghost, outline, soft y subtle hacen hover con bg-accented', () => {
    const neutral = (ui.button.compoundVariants as { color?: string, variant?: string | string[], class: string }[])
      .filter(c => c.color === 'neutral')
    const variants = neutral.flatMap(c => [c.variant].flat())
    expect(variants.sort()).toEqual(['ghost', 'outline', 'soft', 'subtle'])
    for (const c of neutral) expect(classesOf(c.class), String(c.variant)).toContain('hover:bg-accented')
  })

  it('el texto primario sobre su tinte baja un paso en botón, insignia y alerta', () => {
    for (const component of ['button', 'badge', 'alert']) {
      const soft = (ui[component].compoundVariants as { color?: string, variant?: string | string[], class: unknown }[])
        .find(c => c.color === 'primary' && [c.variant].flat().includes('soft'))
      expect(soft, component).toBeTruthy()
      expect(classesOf(soft!.class).join(' '), component).toContain(fiPrimaryOnTint)
    }
  })
})

describe('tabla', () => {
  const slots = ui.table.slots

  it('es su propia tarjeta, con encabezados en versalitas azul marino sobre la banda', () => {
    expect(classesOf(slots.root)).toEqual(expect.arrayContaining(['rounded-2xl', 'border', 'border-default', 'bg-elevated']))
    expect(classesOf(slots.thead)).toContain('bg-muted')
    expect(classesOf(slots.th)).toEqual(expect.arrayContaining(['uppercase', 'text-fi-navy']))
  })

  it('las celdas parten líneas: whitespace-nowrap solo por columna (meta.class)', () => {
    expect(classesOf(slots.td)).toContain('whitespace-normal')
    expect(classesOf(slots.td)).not.toContain('whitespace-nowrap')
  })

  it('fila seleccionada y hover de fila seleccionable se ven sobre blanco', () => {
    expect(classesOf(slots.tr)).toContain('data-[selected=true]:bg-muted')
    expect(classesOf(slots.tbody)).toContain('[&>tr]:data-[selectable=true]:hover:bg-muted/50')
  })
})

describe('dashboard', () => {
  it('barra lateral: isla oscura con la cinta roja (también el panel móvil)', () => {
    for (const slot of ['root', 'content']) {
      expect(classesOf(ui.dashboardSidebar.slots[slot]), slot)
        .toEqual(expect.arrayContaining(['dark', 'bg-fi-header', 'border-t-4', 'border-t-primary-500']))
    }
  })

  it('barra superior: blanca, con el filete rojo y el título azul marino', () => {
    expect(classesOf(ui.dashboardNavbar.slots.root)).toEqual(expect.arrayContaining(['bg-elevated', 'border-t-4', 'border-t-primary-500']))
    expect(classesOf(ui.dashboardNavbar.slots.title)).toContain('text-fi-navy')
  })

  it('panel y grupo sobre la página pizarra', () => {
    expect(classesOf(ui.dashboardPanel.slots.root)).toContain('bg-default')
    expect(classesOf(ui.dashboardGroup.base)).toContain('bg-default')
  })
})

describe('tipografía', () => {
  it('ningún texto por debajo de 12px', () => {
    const small = classesOf(ui).filter(cls => /text-\[(?:\d|1[01])px\]/.test(cls))
    expect(small).toEqual([])
  })

  it('tamaños de botón y campos un paso arriba (los del PSM)', () => {
    for (const component of ['button', 'input', 'select', 'selectMenu', 'inputMenu']) {
      expect(ui[component].variants.size.md.base, component).toBe('text-base')
      expect(ui[component].variants.size.xl.base, component).toBe('text-lg')
    }
    expect(ui.textarea.variants.size.md.base).toBe('text-base')
  })

  it('formField: etiqueta base, ayudas y error en sm', () => {
    expect(ui.formField.slots).toMatchObject({
      label: 'text-base font-medium text-default',
      description: 'text-sm text-muted',
      hint: 'text-sm text-muted',
      error: 'text-sm text-error',
    })
  })

  it('títulos de diálogos y paneles en azul marino', () => {
    for (const component of ['modal', 'slideover', 'drawer']) {
      expect(classesOf(ui[component].slots.title), component).toEqual(expect.arrayContaining(['font-bold', 'text-fi-navy']))
    }
  })
})

describe('Tailwind ve las clases de la configuración', () => {
  it('no-fonts.css apunta @source a src/app-config.js', () => {
    const css = readFileSync(new URL('../src/css/no-fonts.css', import.meta.url), 'utf8')
    expect(css).toContain('@source "../app-config.js";')
  })

  it('las clases se escriben literales (sin `${…}`), para que el escáner las encuentre', () => {
    const source = readFileSync(new URL('../src/app-config.js', import.meta.url), 'utf8')
    expect(source).not.toMatch(/['"`][^'"`]*\$\{[^}]*\}[^'"`]*['"`]/)
  })
})
