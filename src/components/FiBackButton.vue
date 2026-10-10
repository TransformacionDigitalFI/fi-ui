<script setup lang="ts">
import { computed } from 'vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'

/**
 * "Regresar" de los sitios FI. Si se llegó navegando dentro del sitio, vuelve
 * a la página anterior; si se llegó por enlace externo o carga directa, va a
 * `fallback`. No depende del router: vue-router deja la ruta previa en
 * `history.state.back`, y sin ella el enlace sigue su `to` normal.
 *
 * El ícono va por prop y no por `useAppConfig()` de `#imports`: así el
 * componente no depende de nada de Nuxt y funciona igual en Vue + Vite.
 *
 * `iconOnly` deja solo la flecha en un blanco de 36 px (encabezados de vista,
 * FiPageHeader `back`). El texto pasa a `aria-label`: un ícono solo siempre
 * lleva nombre accesible, y un tooltip no lo da.
 */
const props = withDefaults(defineProps<{
  fallback?: string
  label?: LocalizedText
  iconOnly?: boolean
  icon?: string
}>(), {
  fallback: '/',
  label: undefined,
  iconOnly: false,
  icon: 'i-ph-arrow-left',
})

const t = useFiT()
const text = useFiText()
const label = computed(() => (props.label ? text.value(props.label) : t.value('goBack')))

function onClick(event: MouseEvent) {
  if (typeof window === 'undefined') return
  // Con modificadores (abrir en otra pestaña) manda el navegador.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  const state = window.history.state as { back?: unknown } | null
  if (state?.back) {
    event.preventDefault()
    window.history.back()
  }
}
</script>

<template>
  <ULink
    raw
    :to="props.fallback"
    :aria-label="props.iconOnly ? label : undefined"
    :title="props.iconOnly ? label : undefined"
    class="group inline-flex items-center font-semibold text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
    :class="props.iconOnly
      ? 'size-9 shrink-0 justify-center rounded-lg hover:bg-accented'
      : 'gap-1.5 rounded-md py-1.5 ps-1.5 pe-2.5 text-sm'"
    @click="onClick"
  >
    <UIcon
      :name="props.icon"
      :class="props.iconOnly ? 'size-5' : 'size-4'"
      class="shrink-0 motion-safe:transition-transform motion-safe:group-hover:-translate-x-0.5"
      aria-hidden="true"
    />
    <template v-if="!props.iconOnly">
      {{ label }}
    </template>
  </ULink>
</template>
