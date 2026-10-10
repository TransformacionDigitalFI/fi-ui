<script setup lang="ts">
import { computed } from 'vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import { fiStatusIcons } from '../composables/fiComponents'
import type { FiStatus } from '../composables/fiComponents'
import { useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'

/**
 * Insignia de estado: ícono + texto, nunca solo color (WCAG 1.4.1). Es UBadge
 * con el color del estado y un ícono por defecto distinto para cada uno, así
 * que se distingue también en escala de grises o con daltonismo.
 *
 * El estado es el mapa semántico del paquete (`FiStatus`), no el del dominio.
 * Cada proyecto declara su tabla y la usa en todas partes:
 *
 *   const STATUS_TONE: Record<EstadoSolicitud, FiStatus> = {
 *     pendiente: 'warning', aceptada: 'success', rechazada: 'error', cerrada: 'neutral',
 *   }
 *   <FiStatusBadge :status="STATUS_TONE[s.estado]" :label="t(`estado.${s.estado}`)" />
 *
 * `subtle` (por defecto) lleva borde, y es la que se lee igual sobre tarjeta
 * blanca y sobre la pizarra de la página.
 */
const props = withDefaults(defineProps<{
  status: FiStatus
  label: LocalizedText
  /** Reemplaza el ícono por defecto del estado. */
  icon?: string
  variant?: 'subtle' | 'soft' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  icon: undefined,
  variant: 'subtle',
  size: 'md',
})

const text = useFiText()
const icon = computed(() => props.icon ?? fiStatusIcons[props.status])
</script>

<template>
  <UBadge
    :color="props.status"
    :variant="props.variant"
    :size="props.size"
    :icon="icon"
    :label="text(props.label)"
    :data-status="props.status"
  />
</template>
