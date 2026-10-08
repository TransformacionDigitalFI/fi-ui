<script setup lang="ts">
import { useAppConfig } from '#imports'
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { useFiT } from '../i18n'

/**
 * "Regresar" de los micrositios FI. Si se llegó navegando dentro del sitio,
 * vuelve a la página anterior; si se llegó por enlace externo o carga directa,
 * va a `fallback`. No depende del router: vue-router deja la ruta previa en
 * `history.state.back`, y sin ella el enlace sigue su `to` normal.
 */
const props = withDefaults(defineProps<{
  fallback?: string
  label?: string
}>(), {
  fallback: '/',
  label: undefined,
})

const appConfig = useAppConfig()
const t = useFiT()

function onClick(event: MouseEvent) {
  if (typeof window === 'undefined') return
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
    class="group inline-flex items-center gap-1.5 rounded-md py-1.5 ps-1.5 pe-2.5 text-sm font-semibold text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    @click="onClick"
  >
    <UIcon
      :name="appConfig.ui.icons.arrowLeft"
      class="size-4 transition-transform group-hover:-translate-x-0.5"
    />
    {{ props.label ?? t('goBack') }}
  </ULink>
</template>
