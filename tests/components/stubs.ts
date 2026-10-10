import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'

/**
 * Sustitutos mínimos de los componentes de Nuxt UI para las pruebas de
 * render. Nuxt UI no está instalado en el paquete (es peer) y, aunque lo
 * estuviera, necesita su app config y su plugin de Vite. Estas pruebas miden
 * lo que pone el componente FI —elementos, encabezados, atributos ARIA,
 * textos—, no a Nuxt UI, así que basta con que cada sustituto rinda su
 * elemento base, sus slots y deje pasar los atributos sueltos.
 */

const iconSpan = (name: string) => h('span', { 'class': 'iconify', 'data-icon': name, 'aria-hidden': 'true' })

export const Icon = defineComponent({
  name: 'UIcon',
  props: { name: { type: String, required: true } },
  setup: props => () => h('span', { 'class': 'iconify', 'data-icon': props.name }),
})

export const Link = defineComponent({
  name: 'ULink',
  props: {
    to: { type: String, default: undefined },
    raw: Boolean,
    target: { type: String, default: undefined },
  },
  setup: (props, { slots }) => () => (props.to
    ? h('a', { href: props.to, target: props.target }, slots.default?.())
    : h('button', { type: 'button' }, slots.default?.())),
})

export const Button = defineComponent({
  name: 'UButton',
  props: {
    label: { type: String, default: undefined },
    icon: { type: String, default: undefined },
    to: { type: String, default: undefined },
    target: { type: String, default: undefined },
    color: { type: String, default: undefined },
    variant: { type: String, default: undefined },
    size: { type: String, default: undefined },
  },
  setup: (props, { slots }) => () => h(
    props.to ? 'a' : 'button',
    { 'href': props.to, 'target': props.target, 'data-color': props.color, 'data-variant': props.variant },
    [props.icon ? iconSpan(props.icon) : null, props.label, slots.default?.()],
  ),
})

export const Badge = defineComponent({
  name: 'UBadge',
  props: {
    label: { type: [String, Number], default: undefined },
    icon: { type: String, default: undefined },
    color: { type: String, default: undefined },
    variant: { type: String, default: undefined },
    size: { type: String, default: undefined },
  },
  setup: props => () => h(
    'span',
    { 'data-slot': 'base', 'data-color': props.color, 'data-variant': props.variant, 'data-size': props.size },
    [props.icon ? iconSpan(props.icon) : null, h('span', { 'data-slot': 'label' }, String(props.label ?? ''))],
  ),
})

export const Header = defineComponent({
  name: 'UHeader',
  props: {
    title: { type: String, default: undefined },
    to: { type: String, default: undefined },
    mode: { type: String, default: undefined },
    ui: { type: Object, default: undefined },
    open: Boolean,
  },
  setup: (_, { slots }) => () => h('header', [slots.title?.(), slots.default?.(), slots.right?.()]),
})

export const NavigationMenu = defineComponent({
  name: 'UNavigationMenu',
  props: {
    items: { type: Array as PropType<{ label?: string }[]>, default: () => [] },
  },
  setup: props => () => h('nav', h('ul', props.items.map(item => h('li', item.label)))),
})

export const Footer = defineComponent({
  name: 'UFooter',
  props: { ui: { type: Object, default: undefined } },
  setup: (_, { slots }) => () => h('footer', [slots.top?.(), slots.left?.(), slots.right?.(), slots.bottom?.()]),
})

export const Container = defineComponent({
  name: 'UContainer',
  setup: (_, { slots }) => () => h('div', slots.default?.()),
})
