<script setup lang="ts">
import { computed } from 'vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import type { FiIconBadgeSize, FiIconBadgeTone } from '../composables/fiComponents'
import { useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'

/**
 * Ícono dentro de un círculo: el distintivo de tarjetas, cifras, resultados y
 * bandas de los sitios FI. Reemplaza las copias a mano con tamaños y colores
 * sueltos; aquí hay cuatro tamaños y un juego cerrado de tonos.
 *
 * - `navy` (por defecto): azul marino con ícono blanco, el de las cifras.
 * - `gold`: oro con ícono blanco. Es secondary-500 y no --fi-gold, como en
 *   FiStepBadge: el oro decorativo con blanco encima queda en 3:1 justo.
 * - `primary`: rojo FI (primary-500, la semilla exacta aunque el token de
 *   texto `--ui-primary` se oscurezca). Para marca, nunca para error.
 * - `neutral`: pizarra tenue con ícono azul marino; discreto, para encabezados
 *   de tarjeta.
 * - `success` | `warning` | `error` | `info`: solo cuando el ícono comunica un
 *   estado. Fondo tenue del estado y el ícono en su token de texto (ya
 *   oscurecido para AA en modo claro).
 *
 * Sin `label` es decorativo (`aria-hidden`): el significado lo lleva el texto
 * de al lado. Con `label` se anuncia como imagen con ese nombre.
 */
const props = withDefaults(defineProps<{
  icon: string
  size?: FiIconBadgeSize
  tone?: FiIconBadgeTone
  label?: LocalizedText
}>(), {
  size: 'md',
  tone: 'navy',
  label: undefined,
})

const text = useFiText()

const SIZE: Record<FiIconBadgeSize, { box: string, icon: string }> = {
  sm: { box: 'size-8', icon: 'size-4' },
  md: { box: 'size-10', icon: 'size-5' },
  lg: { box: 'size-12', icon: 'size-6' },
  xl: { box: 'size-14', icon: 'size-7' },
}

const TONE: Record<FiIconBadgeTone, string> = {
  navy: 'bg-fi-navy text-white',
  gold: 'bg-secondary-500 text-white',
  primary: 'bg-primary-500 text-white',
  neutral: 'bg-accented text-fi-navy',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
}

const label = computed(() => (props.label ? text.value(props.label) : undefined))
</script>

<template>
  <span
    class="inline-grid shrink-0 place-items-center rounded-full"
    :class="[SIZE[props.size].box, TONE[props.tone]]"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <UIcon
      :name="props.icon"
      :class="SIZE[props.size].icon"
      aria-hidden="true"
    />
  </span>
</template>
