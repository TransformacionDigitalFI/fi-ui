<script setup lang="ts">
/**
 * Círculo numerado de las infografías FI ("1", "2"… en las tarjetas de
 * cambios). Alterna azul marino y oro si no se le dice el tono: impar marino,
 * par oro. El oro aquí es secondary-500 y no --fi-gold: lleva texto blanco
 * encima y el oro decorativo no llega a AA.
 */
const props = withDefaults(defineProps<{
  value: number | string
  tone?: 'navy' | 'gold' | 'auto'
}>(), {
  tone: 'auto',
})

function resolvedTone(): 'navy' | 'gold' {
  if (props.tone !== 'auto') return props.tone
  const n = Number(props.value)
  return Number.isFinite(n) && n % 2 === 0 ? 'gold' : 'navy'
}
</script>

<template>
  <span
    class="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums text-white"
    :class="resolvedTone() === 'gold' ? 'bg-secondary-500' : 'bg-(--fi-navy)'"
  >
    {{ props.value }}
  </span>
</template>
