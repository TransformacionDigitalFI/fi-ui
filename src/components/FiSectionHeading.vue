<script setup lang="ts">
/**
 * Encabezado de sección de los sitios FI (gaceta, micrositios): etiqueta-flecha
 * azul marino como antetítulo, título en azul marino, filete dorado con rombo
 * al centro y descripción. Para una sección completa con contenido, ponlo en el
 * slot `header` de UPageSection o arriba de tu propio contenedor.
 */
const props = withDefaults(defineProps<{
  title: string
  /** Antetítulo en la etiqueta-flecha (`.fi-tag`). */
  eyebrow?: string
  description?: string
  align?: 'center' | 'start'
  as?: 'h1' | 'h2' | 'h3'
}>(), {
  eyebrow: undefined,
  description: undefined,
  align: 'center',
  as: 'h2',
})
</script>

<template>
  <div
    class="max-w-2xl"
    :class="props.align === 'center' ? 'mx-auto text-center' : ''"
  >
    <span
      v-if="props.eyebrow"
      class="fi-tag mb-4"
    >{{ props.eyebrow }}</span>

    <component
      :is="props.as"
      class="text-2xl font-bold tracking-tight text-balance text-(--fi-navy) sm:text-3xl lg:text-4xl"
    >
      <slot name="title">
        {{ props.title }}
      </slot>
    </component>

    <div
      class="mt-4 flex max-w-64 items-center gap-3"
      :class="props.align === 'center' ? 'mx-auto' : ''"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-(--fi-gold)/60" />
      <span class="size-2 rotate-45 bg-(--fi-gold)" />
      <span class="h-px flex-1 bg-(--fi-gold)/60" />
    </div>

    <p
      v-if="props.description || $slots.description"
      class="mt-4 text-base text-pretty text-muted"
    >
      <slot name="description">
        {{ props.description }}
      </slot>
    </p>
  </div>
</template>
