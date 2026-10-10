<script setup lang="ts">
import { computed } from 'vue'
import wordmark from '../assets/fi-wordmark.png'
import wordmarkInverse from '../assets/fi-wordmark-inverse.png'
import wordmarkFooter from '../assets/fi-wordmark-footer.png'
import escudo from '../assets/fi-escudo.png'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'

/**
 * Logotipo de la Facultad tal como lo usa el portal.
 * - `wordmark`: "Facultad de Ingeniería" en grafito, para fondos claros.
 * - `inverse`: el mismo en blanco, para fondos oscuros o de color.
 * - `footer`: escudo y "Facultad de" en blanco, "Ingeniería" en rojo; el del
 *   pie del portal y los micrositios (archivo original, 200×67: no lo escales
 *   arriba de 67 px o se verá borroso).
 * - `escudo`: el escudo a color.
 * La altura va por prop y no por clase: una `h-*` del consumidor competiría
 * con la del componente y ganaría la que Tailwind emita después.
 *
 * El texto alternativo sale del diccionario del paquete en el idioma activo.
 * `alt=""` lo vuelve decorativo, para cuando el nombre de la Facultad ya está
 * escrito junto al logotipo.
 */
const props = withDefaults(defineProps<{
  variant?: 'wordmark' | 'inverse' | 'footer' | 'escudo'
  alt?: LocalizedText
  /** Cualquier longitud CSS; el ancho sigue la proporción. */
  height?: string
}>(), {
  variant: 'wordmark',
  alt: undefined,
  height: '3rem',
})

const t = useFiT()
const text = useFiText()

const src = computed(() => ({
  wordmark,
  inverse: wordmarkInverse,
  footer: wordmarkFooter,
  escudo,
})[props.variant])

// Solo la ausencia toma el del diccionario: la cadena vacía es una decisión
// (logotipo decorativo), no un hueco.
const alt = computed(() => (props.alt === undefined ? t.value('faculty') : text.value(props.alt)))
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    class="w-auto max-w-none select-none"
    :style="{ height: props.height }"
    draggable="false"
  >
</template>
