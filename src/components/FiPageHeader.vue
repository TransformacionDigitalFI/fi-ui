<script setup lang="ts">
import { computed } from 'vue'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'
import FiBackButton from './FiBackButton.vue'

/**
 * Encabezado de una vista de trabajo (dashboard o trámite público): antetítulo
 * opcional en etiqueta-flecha, título azul marino, filete dorado corto y
 * descripción, con las acciones de la vista a la derecha (debajo en móvil).
 * Es la versión compacta y alineada al inicio de FiSectionHeading.
 *
 * - Es el único `<h1>` de la vista. En el dashboard, la barra superior
 *   (UDashboardNavbar) no debe llevar otro: su título es orientación, no
 *   encabezado. `as="h2"` es para cuando la vista ya tiene su h1 en otro lado.
 * - `back`: ruta de respaldo de un "Regresar" compacto (solo flecha, con
 *   `aria-label` del diccionario) a la izquierda del bloque. Vuelve en el
 *   historial si se llegó navegando; si no, va a esa ruta.
 * - `descriptionLoading`: la descripción depende de datos que no han llegado;
 *   se reserva su renglón con un bloque del mismo alto para que el contenido
 *   de abajo no salte.
 * - Slot `actions`: un solo botón sólido `primary`; el resto `outline`/`ghost`
 *   o agrupado en un UDropdownMenu "Más acciones".
 * - Slot `badges`: estado del objeto junto al título (FiStatusBadge).
 * - Slot `leading`: avatar o ícono antes del bloque de texto.
 *
 * La raíz es un `<div>` y no un `<header>`: fuera de `<main>` o de una
 * sección, un `<header>` se vuelve el landmark "banner" del sitio y compite
 * con el encabezado real.
 */
const props = withDefaults(defineProps<{
  title: LocalizedText
  description?: LocalizedText
  /** Antetítulo en la etiqueta-flecha (`.fi-tag`): el módulo o sección. */
  eyebrow?: LocalizedText
  descriptionLoading?: boolean
  /** Filete dorado corto bajo el título. */
  rule?: boolean
  as?: 'h1' | 'h2'
  /** Ruta de respaldo del botón "Regresar"; sin ella (o `false`) no se muestra. */
  back?: string | false
}>(), {
  description: undefined,
  eyebrow: undefined,
  descriptionLoading: false,
  rule: true,
  as: 'h1',
  back: undefined,
})

const t = useFiT()
const text = useFiText()

const description = computed(() => (props.description ? text.value(props.description) : undefined))
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="flex min-w-0 items-start gap-3">
      <FiBackButton
        v-if="props.back"
        :fallback="props.back"
        icon-only
        class="-ms-2"
      />
      <slot name="leading" />

      <div class="min-w-0">
        <span
          v-if="props.eyebrow"
          class="fi-tag mb-3"
        >{{ text(props.eyebrow) }}</span>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <component
            :is="props.as"
            class="text-2xl font-bold tracking-tight text-balance text-fi-navy sm:text-3xl"
          >
            {{ text(props.title) }}
          </component>
          <div
            v-if="$slots.badges"
            class="flex flex-wrap items-center gap-2"
          >
            <slot name="badges" />
          </div>
        </div>

        <span
          v-if="props.rule"
          class="mt-2 flex w-24 items-center gap-2"
          aria-hidden="true"
        >
          <span class="h-px flex-1 bg-fi-gold/60" />
          <span class="size-1.5 rotate-45 bg-fi-gold" />
        </span>

        <div
          v-if="props.descriptionLoading"
          class="mt-2 text-base"
          aria-busy="true"
        >
          <span
            class="block h-[1lh] w-48 max-w-full rounded-md bg-accented motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <span class="sr-only">{{ t('loading') }}</span>
        </div>
        <div
          v-else-if="description || $slots.description"
          class="mt-2 max-w-prose text-base text-pretty text-muted"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </div>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
