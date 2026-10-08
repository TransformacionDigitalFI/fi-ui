<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Entrada suave al hacer scroll (opacidad + 10 px, 300 ms, una sola vez), la
 * de los micrositios FI. El contenido nunca debe quedar invisible:
 * - En SSR y en el primer render es visible; solo se anima lo que al montar
 *   está por debajo del viewport.
 * - Respeta prefers-reduced-motion.
 * - Si el IntersectionObserver no dispara, un temporizador lo revela igual.
 * `will-change` solo vive mientras anima: fijo, cada envoltorio sería una
 * capa de composición permanente.
 */
const props = withDefaults(defineProps<{ as?: string, delay?: number }>(), {
  as: 'div',
  delay: 0,
})

const el = ref<HTMLElement | null>(null)
const shown = ref(true)
const animating = ref(false)
let observer: IntersectionObserver | null = null
let safety: ReturnType<typeof setTimeout> | null = null
let dropHint: ReturnType<typeof setTimeout> | null = null

function stopAnimating() {
  animating.value = false
  if (dropHint) {
    clearTimeout(dropHint)
    dropHint = null
  }
}

function reveal() {
  shown.value = true
  observer?.disconnect()
  observer = null
  if (safety) {
    clearTimeout(safety)
    safety = null
  }
  // `transitionend` no llega si el elemento está oculto o no llegó a
  // transicionar; esto libera el will-change de todos modos.
  if (animating.value && !dropHint) dropHint = setTimeout(stopAnimating, props.delay + 400)
}

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !('IntersectionObserver' in window) || !el.value) return
  if (el.value.getBoundingClientRect().top < window.innerHeight * 0.9) return

  shown.value = false
  animating.value = true
  try {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) reveal()
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el.value)
  }
  catch {
    reveal()
    return
  }
  safety = setTimeout(reveal, 1600)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (safety) clearTimeout(safety)
  if (dropHint) clearTimeout(dropHint)
})
</script>

<template>
  <component
    :is="props.as"
    ref="el"
    class="transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none"
    :class="shown ? 'opacity-100' : 'translate-y-2.5 opacity-0'"
    :style="{
      transitionDelay: `${props.delay}ms`,
      willChange: animating ? 'opacity, translate' : undefined,
    }"
    @transitionend.self="stopAnimating"
  >
    <slot />
  </component>
</template>
