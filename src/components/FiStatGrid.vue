<script setup lang="ts">
import { computed, provide } from 'vue'
import { fiStatGridKey } from '../composables/fiComponents'
import type { FiStatItem } from '../composables/fiComponents'
import FiStat from './FiStat.vue'

/**
 * Rejilla de cifras clave. Es un `<dl>`: cada FiStat de adentro es un par
 * término/definición, así que un lector de pantalla anuncia la lista y cuántas
 * cifras tiene.
 *
 * Dos formas, la misma salida:
 *   <FiStatGrid :stats="[{ label: 'Abiertas', value: 12, icon: 'i-ph-tray' }]" />
 *   <FiStatGrid :columns="3"><FiStat … /><FiStat … /><FiStat … /></FiStatGrid>
 *
 * `columns` es el máximo en pantallas anchas; en móvil siempre es una columna.
 * Sin `columns`, con `stats` toma tantas como cifras (de 2 a 5) y con el slot,
 * 4. `loading` pone todas las cifras de `stats` en espera (el skeleton y la
 * tarjeta real comparten geometría, así que no hay salto al llegar los datos).
 */
const props = withDefaults(defineProps<{
  stats?: FiStatItem[]
  columns?: 2 | 3 | 4 | 5
  loading?: boolean
}>(), {
  stats: undefined,
  columns: undefined,
  loading: false,
})

provide(fiStatGridKey, true)

const columns = computed(() => {
  if (props.columns) return props.columns
  if (!props.stats) return 4
  return Math.min(5, Math.max(2, props.stats.length)) as 2 | 3 | 4 | 5
})

const COLUMNS: Record<2 | 3 | 4 | 5, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}
</script>

<template>
  <dl
    class="grid grid-cols-1 gap-3"
    :class="COLUMNS[columns]"
  >
    <slot>
      <FiStat
        v-for="(stat, index) in props.stats"
        :key="index"
        :label="stat.label"
        :value="stat.value"
        :icon="stat.icon"
        :hint="stat.hint"
        :tone="stat.tone"
        :to="stat.to"
        :loading="stat.loading ?? props.loading"
      />
    </slot>
  </dl>
</template>
