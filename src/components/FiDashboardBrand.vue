<script setup lang="ts">
import { computed } from 'vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'
import FiLogo from './FiLogo.vue'

/**
 * Marca para el slot `header` de UDashboardSidebar: logotipo FI en blanco y,
 * debajo, el nombre del sistema en versalitas doradas; todo es el enlace al
 * inicio del dashboard. Va dentro de la barra lateral oscura (isla `dark`
 * sobre --fi-header-bg), donde el dorado da 5.4:1.
 *
 *   <UDashboardSidebar collapsible …>
 *     <template #header="{ collapsed }">
 *       <FiDashboardBrand name="Programa de Salud Mental" to="/dashboard" :collapsed="collapsed" />
 *     </template>
 *
 * Contraída, la barra no tiene ancho para el logotipo: queda el escudo (o lo
 * que se ponga en el slot `mark`, p. ej. el símbolo del sistema) y el nombre
 * pasa a texto solo para lectores de pantalla, así el enlace conserva su
 * nombre accesible completo. Por lo mismo, lo que vaya en `mark` es
 * decorativo (`alt=""`): si no, el nombre se anunciaría dos veces.
 */
const props = withDefaults(defineProps<{
  /** Nombre del sistema bajo el logotipo. */
  name?: LocalizedText
  to?: string
  collapsed?: boolean
}>(), {
  name: undefined,
  to: '/',
  collapsed: false,
})

const t = useFiT()
const text = useFiText()

const name = computed(() => (props.name ? text.value(props.name) : undefined))
</script>

<template>
  <ULink
    raw
    :to="props.to"
    class="flex min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    :class="props.collapsed ? 'w-full justify-center' : 'w-full flex-col items-start gap-2'"
  >
    <template v-if="props.collapsed">
      <slot name="mark">
        <FiLogo
          variant="escudo"
          height="2rem"
          alt=""
        />
      </slot>
      <span class="sr-only">{{ t('faculty') }}<template v-if="name"> — {{ name }}</template></span>
    </template>

    <template v-else>
      <slot name="logo">
        <FiLogo
          variant="inverse"
          height="2.5rem"
        />
      </slot>
      <span
        v-if="name || $slots.name"
        class="text-xs leading-snug font-bold tracking-[0.1em] text-fi-gold uppercase"
      >
        <slot name="name">{{ name }}</slot>
      </span>
    </template>
  </ULink>
</template>
