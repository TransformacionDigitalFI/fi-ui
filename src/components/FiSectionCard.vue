<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'
import FiIconBadge from './FiIconBadge.vue'

/**
 * Tarjeta de sección con encabezado: la superficie de contenido de los sitios
 * FI (blanca, borde, `rounded-2xl`) con un solo tratamiento de encabezado para
 * toda la app —ícono en círculo tenue, título, descripción y acciones a la
 * derecha—, en lugar de una variante por vista.
 *
 * - `headingLevel` sigue la jerarquía de la vista: 2 para una sección de la
 *   página (`text-lg` azul marino), 3 para una tarjeta dentro de una sección
 *   (`text-base`). No es un tamaño: el nivel se elige por estructura.
 * - `padded: false` deja el cuerpo a sangre, para una UTable o una lista que
 *   ya traen su propio relleno.
 * - `divided` traza el borde bajo el encabezado; sin él, encabezado y cuerpo
 *   comparten el fondo.
 * - Slot `header` reemplaza el encabezado entero; `actions` se queda a la
 *   derecha (abajo en móvil) y `footer` cierra la tarjeta con su borde.
 * - Es columna flexible y el cuerpo crece: en una rejilla de tarjetas con
 *   `class="h-full"`, los pies quedan alineados abajo aunque los textos
 *   midan distinto.
 */
const props = withDefaults(defineProps<{
  title?: LocalizedText
  description?: LocalizedText
  icon?: string
  as?: 'section' | 'article' | 'div'
  headingLevel?: 2 | 3
  padded?: boolean
  divided?: boolean
}>(), {
  title: undefined,
  description: undefined,
  icon: undefined,
  as: 'section',
  headingLevel: 2,
  padded: true,
  divided: false,
})

const slots = useSlots()
const text = useFiText()

const title = computed(() => (props.title ? text.value(props.title) : undefined))
const description = computed(() => (props.description ? text.value(props.description) : undefined))
const hasHeader = computed(() => !!(title.value || slots.header || slots.actions))

const bodyClass = computed(() => {
  if (!props.padded) return 'flex-1'
  // Sin borde, el encabezado ya puso su relleno inferior: el cuerpo no lo repite.
  return hasHeader.value && !props.divided ? 'flex-1 px-4 pb-4 sm:px-5 sm:pb-5' : 'flex-1 p-4 sm:p-5'
})
</script>

<template>
  <component
    :is="props.as"
    class="flex flex-col rounded-2xl border border-default bg-elevated"
  >
    <div
      v-if="hasHeader"
      class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 sm:px-5 sm:pt-5"
      :class="props.divided ? 'border-b border-default pb-4' : 'pb-3'"
    >
      <slot name="header">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <FiIconBadge
            v-if="props.icon"
            :icon="props.icon"
            tone="neutral"
            size="sm"
          />
          <div class="min-w-0">
            <component
              :is="`h${props.headingLevel}`"
              v-if="title"
              class="text-pretty"
              :class="props.headingLevel === 2
                ? 'text-lg font-semibold text-fi-navy'
                : 'text-base font-semibold text-highlighted'"
            >
              {{ title }}
            </component>
            <p
              v-if="description"
              class="mt-0.5 text-sm text-pretty text-muted"
            >
              {{ description }}
            </p>
          </div>
        </div>
      </slot>

      <div
        v-if="$slots.actions"
        class="flex shrink-0 flex-wrap items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="$slots.default"
      :class="bodyClass"
    >
      <slot />
    </div>

    <div
      v-if="$slots.footer"
      class="border-t border-default px-4 py-3 sm:px-5"
    >
      <slot name="footer" />
    </div>
  </component>
</template>
