<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import UHeader from '@nuxt/ui/components/Header.vue'
import UNavigationMenu from '@nuxt/ui/components/NavigationMenu.vue'
import type { FiLink, FiSocialLink } from '../fi-data'
import { readRootColor } from '../chrome'
import { useFiTheme } from '../composables/useFiTheme'
import FiLogo from './FiLogo.vue'
import FiThemeRibbon from './FiThemeRibbon.vue'
import FiTopBar from './FiTopBar.vue'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'

/**
 * Encabezado de los sitios FI sobre UHeader de Nuxt UI: franja roja de
 * accesos (se va con el scroll) y debajo la barra oscura fija con el
 * logotipo blanco y el menú en versalitas, como el portal sobre su portada y
 * los micrositios de la Facultad. Al bajar se contrae.
 *
 * Es oscuro siempre: la clase `dark` en la raíz (y en el panel móvil) hace que
 * los tokens de Nuxt UI tomen sus valores de modo oscuro solo aquí dentro, así
 * que los botones del slot `actions` se leen bien sin clases a mano. Por lo
 * mismo, enlace activo y hover usan el rojo-400: el rojo-500 sobre este fondo
 * se queda en 2.9:1.
 *
 * `title` es el nombre del sitio (p. ej. "Programa de Salud Mental"); aparece
 * junto al logotipo. Los atributos sueltos (class, id…) van al UHeader.
 *
 * Lo primero que rinde es el enlace "Saltar al contenido" (WCAG 2.4.1): oculto
 * hasta recibir el foco, lleva a `skipTo` (por defecto `#main-content`). El
 * layout del proyecto pone ese id en su `<main>`; `skipTo: false` lo quita si
 * el layout ya tiene el suyo.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  items?: NavigationMenuItem[]
  title?: LocalizedText
  /** Destino del logotipo. */
  to?: string
  topBar?: boolean
  /** Enlaces de la cinta; si no se pasan, los de `fiUi.topBar` o los del portal. */
  topLinks?: FiLink[]
  /** Redes de la cinta; si no se pasan, las de `fiUi.topBar` o las del portal. */
  social?: FiSocialLink[]
  /** Selector del contenido principal para "Saltar al contenido"; `false` no rinde el enlace. */
  skipTo?: string | false
  /**
   * Clases extra del bloque de marca (el que lleva el filete divisorio junto
   * al logotipo FI). Para ocultarlo en móvil usa `'hidden sm:block'` aquí, no
   * dentro del slot: si solo se oculta el contenido, el filete queda solo.
   */
  brandClass?: string
}>(), {
  items: () => [],
  title: undefined,
  to: '/',
  topBar: true,
  topLinks: undefined,
  social: undefined,
  skipTo: '#main-content',
  brandClass: undefined,
})

const open = defineModel<boolean>('open', { default: false })

// Contracción al hacer scroll, con dos umbrales: al contraerse, el header
// (sticky, en el flujo) acorta el documento y el navegador puede recortar
// scrollY; con un solo umbral eso lo vuelve a cruzar y el estado oscila.
const ENTER_Y = 96
const EXIT_Y = 32
const scrolled = ref(false)
let ticking = false

// Color de la barra del navegador: el de lo que esté arriba de la pantalla.
// Mientras se ve la cinta, su rojo; ya que se fue con el scroll, el del header.
// Se lee del CSS ya resuelto para que siga al tema especial activo.
const { theme, chromeColor } = useFiTheme()
const topBar = ref<{ root: HTMLElement | null } | null>(null)

function updateChromeColor() {
  const topBarHeight = props.topBar ? (topBar.value?.root?.offsetHeight ?? 0) : 0
  const token = window.scrollY < topBarHeight ? '--ui-color-primary-500' : '--fi-header-bg'
  const color = readRootColor(token)
  if (color && color !== chromeColor.value) chromeColor.value = color
}

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const y = window.scrollY
    if (y > ENTER_Y) scrolled.value = true
    else if (y < EXIT_Y) scrolled.value = false
    updateChromeColor()
    ticking = false
  })
}

onMounted(() => {
  scrolled.value = window.scrollY > ENTER_Y
  updateChromeColor()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

watch(theme, () => nextTick(updateChromeColor))

const headerUi = computed(() => ({
  root: 'dark h-auto bg-(--fi-header-bg) backdrop-blur-none border-white/10 text-default',
  container: [
    'transition-[height] duration-300 motion-reduce:transition-none',
    scrolled.value ? 'h-15 lg:h-17' : 'h-20 lg:h-24',
  ].join(' '),
  left: 'lg:flex-none',
  center: 'lg:flex-1 lg:justify-end',
  right: 'lg:flex-none',
  content: 'dark bg-(--fi-header-bg) text-default',
}))

// Como el portal: versalitas negritas, sin íconos (los íconos de los items sí
// se ven en el panel móvil, donde ayudan a escanear la lista). La receta es
// `.fi-navlink`; tamaño y peso se repiten como utilidades porque el tema de
// UNavigationMenu trae `text-sm font-medium`, que están en la capa utilities y
// le ganarían a la clase (capa components). Así tailwind-merge los reemplaza.
const desktopNavUi = {
  link: 'fi-navlink px-2.5 py-2 text-[0.8125rem] font-bold text-highlighted hover:text-primary data-active:text-primary',
  linkLeadingIcon: 'hidden',
}

const t = useFiT()
const text = useFiText()
const title = computed(() => (props.title ? text.value(props.title) : undefined))

// El salto no pasa por el router (no ensucia la URL con el hash) y lleva el
// foco al destino aunque no sea enfocable: sin `tabindex` el navegador solo
// desplaza la vista y el siguiente Tab vuelve a empezar por el encabezado.
function skipToContent(event: MouseEvent) {
  if (!props.skipTo) return
  let target: HTMLElement | null = null
  try {
    target = document.querySelector<HTMLElement>(props.skipTo)
  }
  catch {
    // Selector no válido: queda el comportamiento nativo del enlace.
  }
  if (!target) return
  event.preventDefault()
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  target.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <a
    v-if="props.skipTo"
    :href="props.skipTo"
    class="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-100 focus:rounded-md focus:bg-fi-navy focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-white"
    @click="skipToContent"
  >{{ t('skipToContent') }}</a>

  <FiTopBar
    v-if="props.topBar"
    ref="topBar"
    :links="props.topLinks"
    :social="props.social"
  >
    <template
      v-if="$slots['top-bar-end']"
      #end="slotProps"
    >
      <slot
        name="top-bar-end"
        v-bind="slotProps"
      />
    </template>
  </FiTopBar>

  <UHeader
    v-bind="$attrs"
    v-model:open="open"
    :to="props.to"
    :title="title ?? t('faculty')"
    mode="slideover"
    :ui="headerUi"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <slot name="logo">
          <FiLogo
            variant="inverse"
            :height="scrolled ? '2.25rem' : '3rem'"
            class="transition-[height] duration-300 motion-reduce:transition-none"
          />
        </slot>
        <span
          v-if="title || $slots.brand"
          class="max-w-52 border-s border-white/20 ps-3 text-sm font-semibold leading-tight text-highlighted"
          :class="props.brandClass"
        >
          <slot name="brand">{{ title }}</slot>
        </span>
        <FiThemeRibbon height="2.25rem" />
      </span>
    </template>

    <UNavigationMenu
      v-if="props.items.length"
      :items="props.items"
      variant="link"
      :ui="desktopNavUi"
    />

    <template #right>
      <slot name="actions" />
    </template>

    <template #body>
      <UNavigationMenu
        v-if="props.items.length"
        :items="props.items"
        orientation="vertical"
        class="-mx-2.5"
      />
      <slot name="menu-footer" />
    </template>
  </UHeader>
</template>
