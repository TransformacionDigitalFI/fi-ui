<script setup lang="ts">
import { computed } from 'vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'

/**
 * Banda de llamado a la acción del sitio público: bloque azul marino con un
 * brillo dorado en la esquina, ícono dorado opcional, título, texto y
 * acciones al centro. Cierra una página con el siguiente paso ("Agenda",
 * "Escríbenos").
 *
 * Es una isla oscura: la clase `dark` hace que los tokens de Nuxt UI tomen sus
 * valores de modo oscuro solo aquí dentro, así que los UButton del slot
 * `actions` se leen bien sin clases a mano (como en FiHeader y FiFooter).
 *
 * El dorado de texto es secondary-300 y no --fi-gold: sobre el azul marino
 * --fi-gold da 4:1 (suficiente para el ícono, no para texto de 13 px).
 *
 * Una por vista, como máximo; el brillo es estático (nada se anima).
 */
const props = withDefaults(defineProps<{
  title: LocalizedText
  description?: LocalizedText
  /** Antetítulo pequeño en versalitas doradas sobre el título. */
  eyebrow?: LocalizedText
  /** Ícono dorado sobre el título. */
  icon?: string
  headingLevel?: 2 | 3
}>(), {
  description: undefined,
  eyebrow: undefined,
  icon: undefined,
  headingLevel: 2,
})

const text = useFiText()

const description = computed(() => (props.description ? text.value(props.description) : undefined))
</script>

<template>
  <section class="dark relative isolate overflow-hidden rounded-3xl bg-fi-navy px-6 py-12 text-center text-default sm:px-12 sm:py-16">
    <div
      class="pointer-events-none absolute inset-0 -z-10 opacity-15 [background:radial-gradient(circle_at_15%_20%,var(--fi-gold),transparent_45%)]"
      aria-hidden="true"
    />

    <div class="mx-auto max-w-2xl">
      <UIcon
        v-if="props.icon"
        :name="props.icon"
        class="mx-auto mb-4 block size-12 text-fi-gold"
        aria-hidden="true"
      />
      <p
        v-if="props.eyebrow"
        class="mb-2 text-xs font-semibold tracking-[0.08em] text-secondary-300 uppercase"
      >
        {{ text(props.eyebrow) }}
      </p>
      <component
        :is="`h${props.headingLevel}`"
        class="text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl"
      >
        {{ text(props.title) }}
      </component>
      <p
        v-if="description"
        class="mx-auto mt-4 max-w-xl text-base text-pretty text-white/80"
      >
        {{ description }}
      </p>

      <div
        v-if="$slots.default"
        class="mt-6"
      >
        <slot />
      </div>

      <div
        v-if="$slots.actions"
        class="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>
