<script setup lang="ts">
import { useFiTheme } from '../composables/useFiTheme'
import { useFiText } from '../i18n'

/**
 * Listón de conmemoración del tema activo. No renderiza nada en el tema base
 * ni en temas sin listón, así que puede quedarse fijo en el header.
 * Los colores salen de --fi-ribbon y --fi-ribbon-accent (src/css/themes.css):
 * el SVG no sabe de temas, solo pinta dos tiras.
 */
const props = withDefaults(defineProps<{
  /** Cualquier longitud CSS; el ancho sigue la proporción 3:4. */
  height?: string
}>(), {
  height: '2rem',
})

const { definition } = useFiTheme()
const text = useFiText()
</script>

<template>
  <svg
    v-if="definition.ribbon"
    viewBox="0 0 24 32"
    role="img"
    :aria-label="text(definition.description)"
    :style="{ height: props.height, width: 'auto' }"
    class="shrink-0"
  >
    <title>{{ text(definition.description) }}</title>
    <!-- Halo: el listón de luto es negro y el header es oscuro; sin este
         contorno claro desaparecería. Sobre fondo claro apenas se nota. -->
    <g
      fill="none"
      stroke="rgb(255 255 255 / 0.85)"
      stroke-width="5.4"
    >
      <path d="M12 3.5C16 3.5 16.8 8.5 14.4 12.5L6 28.5" />
      <path d="M12 3.5C8 3.5 7.2 8.5 9.6 12.5L18 28.5" />
    </g>
    <path
      d="M12 3.5C16 3.5 16.8 8.5 14.4 12.5L6 28.5"
      fill="none"
      stroke="var(--fi-ribbon-accent)"
      stroke-width="3.4"
    />
    <path
      d="M12 3.5C8 3.5 7.2 8.5 9.6 12.5L18 28.5"
      fill="none"
      stroke="var(--fi-ribbon)"
      stroke-width="3.4"
    />
  </svg>
</template>
