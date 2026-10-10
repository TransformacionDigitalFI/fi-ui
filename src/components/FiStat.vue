<script setup lang="ts">
import { computed, inject } from 'vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { fiStatGridKey } from '../composables/fiComponents'
import type { FiStatTone } from '../composables/fiComponents'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'
import FiIconBadge from './FiIconBadge.vue'

/**
 * Cifra clave (KPI): tarjeta blanca plana, ícono en círculo y el dato grande
 * en azul marino con cifras tabulares, para que los dígitos se alineen entre
 * tarjetas vecinas.
 *
 * Semántica de lista de definiciones: el rótulo es el término (`<dt>`) y el
 * dato su definición (`<dd>`). En el DOM va primero el rótulo —un lector de
 * pantalla oye "Solicitudes pendientes, 12"— y `order-first` pone el número
 * arriba a la vista. Dentro de FiStatGrid rinde un `<div>` (el `<dl>` es la
 * rejilla); suelto, su propio `<dl>`. Un `<div>` dentro de `<dl>` solo admite
 * `<dt>` y `<dd>`, por eso el círculo y la flecha viven dentro del `<dt>` con
 * posición absoluta en vez de en envoltorios propios.
 *
 * - `tone`: el círculo azul marino es el normal. Un tono de estado solo cuando
 *   la cifra ES un estado ("3 vencidas"), y nunca como único significado: el
 *   rótulo lo dice con palabras.
 * - `to`: la tarjeta entera es un enlace (enlace estirado sobre el rótulo, con
 *   foco visible en el contorno de la tarjeta y una flecha como pista).
 * - `loading`: el rótulo ya se sabe y se muestra; el dato es un bloque del
 *   mismo alto, así nada salta cuando llega.
 */
const props = withDefaults(defineProps<{
  label: LocalizedText
  value: string | number
  icon?: string
  hint?: LocalizedText
  tone?: FiStatTone
  to?: string
  loading?: boolean
}>(), {
  icon: undefined,
  hint: undefined,
  tone: 'default',
  to: undefined,
  loading: false,
})

const inGrid = inject(fiStatGridKey, false)
const t = useFiT()
const text = useFiText()

const label = computed(() => text.value(props.label))
const hint = computed(() => (props.hint ? text.value(props.hint) : undefined))
const badgeTone = computed(() => (props.tone === 'default' ? 'navy' : props.tone))

// Relleno lateral con el hueco del círculo (16 + 40 + 12 px) y el de la
// flecha; excluyentes para que no compitan dos `ps-*` en la misma tarjeta.
const rootClass = computed(() => [
  props.icon ? 'min-h-18 ps-[4.25rem]' : 'ps-4',
  props.to ? 'pe-10 transition-colors hover:border-fi-navy motion-reduce:transition-none' : 'pe-4',
])
</script>

<template>
  <component
    :is="inGrid ? 'div' : 'dl'"
    class="relative flex min-w-0 flex-col justify-center rounded-2xl border border-default bg-elevated py-3.5"
    :class="rootClass"
    :aria-busy="props.loading ? 'true' : undefined"
  >
    <dt class="mt-1 text-sm text-pretty text-muted">
      <FiIconBadge
        v-if="props.icon"
        :icon="props.icon"
        :tone="badgeTone"
        size="md"
        class="absolute start-4 top-1/2 -translate-y-1/2"
      />
      <ULink
        v-if="props.to"
        raw
        :to="props.to"
        class="focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
      >
        {{ label }}
      </ULink>
      <template v-else>
        {{ label }}
      </template>
      <!-- Ayuda de la métrica (un botón de "¿qué mide?"): hermana del enlace,
           no hija, y con z-10 encima del enlace estirado, así se puede
           pulsar sin navegar y no hay un control interactivo dentro de otro. -->
      <span
        v-if="$slots.help"
        class="relative z-10 ms-1 inline-flex align-middle"
      >
        <slot name="help" />
      </span>
      <UIcon
        v-if="props.to"
        name="i-ph-caret-right"
        class="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-dimmed"
        aria-hidden="true"
      />
    </dt>

    <dd class="order-first text-2xl leading-none font-bold tabular-nums text-fi-navy">
      <template v-if="props.loading">
        <span
          class="block h-[1em] w-16 max-w-full rounded-md bg-accented motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span class="sr-only">{{ t('loading') }}</span>
      </template>
      <template v-else>
        {{ props.value }}
      </template>
    </dd>

    <dd
      v-if="hint || $slots.hint"
      class="mt-1 text-xs text-pretty text-dimmed"
    >
      <slot name="hint">
        {{ hint }}
      </slot>
    </dd>
  </component>
</template>
