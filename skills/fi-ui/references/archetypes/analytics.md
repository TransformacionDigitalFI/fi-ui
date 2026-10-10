# Arquetipo `analytics` — Analítica

Resume cómo va un programa en un periodo y deja profundizar: **cifras clave,
tendencia, desgloses**, un detalle por serie, instantáneas inmutables del
cierre de semestre y exportación con alcance explícito. Incluye la variante
**"mi trabajo"**, donde cada persona del personal ve sus propias cifras.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).
>
> **Antes de dibujar cualquier gráfica, lee [data-viz.md](../data-viz.md)**:
> paleta `--fi-chart-*`, cuándo se permiten colores de estado, ejes de 12 px
> reales, tooltips, mapas de calor, formato de números (`useFormat`) y
> supresión de conteos pequeños. Este archivo dice **dónde** va cada pieza;
> data-viz dice **cómo** se dibuja.

## Propósito y usuario

- **Usuario:** coordinación (permiso de estadísticas) para el programa entero;
  cada asesora o asesor para "mi trabajo".
- **Tarea:** responder preguntas fijas ("¿cuántas solicitudes llegaron?",
  "¿qué cobertura tenemos por carrera?"), encontrar de qué se compone una cifra
  rara, congelar el cierre del semestre y sacar los datos para un informe.
- **Éxito:** entiende el periodo en el primer vistazo (cifras con contexto),
  llega al detalle de una cifra en un clic, y lo que exporta dice exactamente
  qué periodo, qué filtros y qué tratamiento de privacidad lleva.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Estadísticas del programa por periodo, desgloses, series en el tiempo. | "¿Qué requiere mi atención ahora?": es [`dashboard-home`](dashboard-home.md); el inicio puede enlazar 3–4 cifras de aquí. |
| Instantáneas semestrales inmutables y su comparación. | Quién hizo qué y cuándo, salud de procesos: es [`audit-and-monitoring`](audit-and-monitoring.md). |
| Exportar datos agregados. | Buscar a una persona o un caso: es [`record-finder`](record-finder.md). Desde una estadística anonimizada no se baja a personas (ver [Drill-down](#drill-down)). |
| Las cifras propias de una persona del personal (variante "mi trabajo"). | Un trámite documental puro (constancias sin estadística): puede ir como pestaña de "mi trabajo", no como vista de analítica aparte. |

## Mapa del módulo

Un módulo de analítica tiene, como mucho, estas vistas. Cada una responde una
pregunta; no las juntes en una página de mil líneas (inventario: 1375 líneas
sin navegación interna).

| Vista | Pregunta | Contenido |
|---|---|---|
| Resumen | ¿Cómo vamos en este periodo? | Filtro global, 3–5 `FiStat`, una tendencia, 2–4 desgloses, definiciones. |
| Detalle | ¿De qué se compone esta cifra o serie? | Migas de pan, `h1` que nombra la rebanada, gráfica + `UTable` paginada con totales, exportar esa rebanada. |
| Instantáneas | ¿Cómo cerró el semestre? | `UTable` de instantáneas (solo lectura), "Nueva instantánea" con confirmación, comparación. |
| Exportar | Necesito los datos en un archivo. | Conjunto, periodo, columnas, nota de privacidad, descarga. |
| Mi trabajo (variante) | ¿Qué hice yo en este periodo? | Mis cifras, mi lista, mis constancias. |

Navegación entre vistas: `UNavigationMenu orientation="horizontal"` en el
`UDashboardToolbar` con rutas reales. "Resumen" lleva `exact: true`; las demás
marcan activo **por prefijo**, para que "Periodo" siga activo en
`/estadisticas/periodo/detalle` (E-14). El detalle añade `UBreadcrumb` en el
navbar: Estadísticas › Periodo › Solicitudes por semana.

## Anatomía del resumen (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar #left` (`UBreadcrumb`) + `UDashboardToolbar` con el `UNavigationMenu` del módulo. | Sin `title` en el navbar. Nunca `role="tablist"` sobre enlaces (E-14). |
| 1 | Encabezado | `FiPageHeader` con `title` ("Estadísticas") y `description` = población · periodo aplicado. `#actions`: "Exportar…" `neutral outline`. | Sin `primary solid` en el resumen: no hay una acción principal, y está bien. |
| 2 | Filtro global | **El** `PeriodFilter` del proyecto (uno solo para toda la app) dentro de una tarjeta blanca, con los filtros extra en su slot `#filters`. Debajo: chips de filtros activos y "Datos al 8 oct 2026, 10:30" (`role="status"`). | Aplica a **todo** lo de la página. Nada de fechas sueltas, rangos rápidos propios ni un formulario de periodo por vista (C-31). |
| 3 | Cifras clave | `FiStatGrid :columns="4"` de `FiStat`: valor formateado, `hint` con comparación y base n, `to` al detalle filtrado. | 3–5 cifras. `tone` solo si la cifra **es** un estado. Nada de cuatro diseños de KPI (E-16, C-14). |
| 4 | Tendencia | Un `ChartCard` a todo el ancho (serie de tiempo). | Título = conclusión; subtítulo = medida · población · periodo. |
| 5 | Desgloses | 2–4 `ChartCard` en `grid gap-6 lg:grid-cols-2` (barras ordenadas). | 6–8 visuales como máximo en toda la vista. Lo demás, a una vista de detalle o a pestañas dentro de una sección. |
| 6 | Definiciones y notas | `FiSectionCard title="Definiciones"` con un `<dl>` (métrica → definición), la fuente y la regla de supresión. | Cada métrica que aparece arriba está definida aquí o en su ayuda. |

### Esqueleto del resumen

```vue
<!-- pages/dashboard/estadisticas/index.vue -->
<script setup lang="ts">
import type { FiStatItem } from '@fi-unam/ui'
import { defaultRange, periodLabel, type PeriodRange } from '~/utils/period'

/** Lo que manda el servidor: conteos ya suprimidos, nunca el valor real < 5. */
type PublicCount = { value: number } | { suppressed: true }

interface Overview {
  generatedAt: string // ISO: la frescura de los datos
  kpis: {
    requests: number
    requestsChange: number | null // fracción vs. periodo anterior
    firstContacts: number
    activeRecords: number
    coveredStudents: number
    population: number
  }
  weekly: { weekStart: string, weekLabel: string, requests: number }[]
  byCareer: { career: string, count: PublicCount }[]
}

const route = useRoute()
const router = useRouter()
const fmt = useFormat() // ver data-viz.md → Formato de números

// El periodo vive en la URL: un enlace reproduce exactamente la misma vista.
const fallback = defaultRange()
const applied = computed<PeriodRange>(() => ({
  from: (route.query.desde as string) ?? fallback.from,
  to: (route.query.hasta as string) ?? fallback.to,
}))
const from = ref(applied.value.from)
const to = ref(applied.value.to)

function applyPeriod(range: PeriodRange) {
  router.replace({ query: { ...route.query, desde: range.from, hasta: range.to } })
}

const { data, status, error, refresh } = useLazyFetch<Overview>('/api/stats/overview', {
  query: computed(() => ({ from: applied.value.from, to: applied.value.to })),
})
const firstLoad = computed(() => status.value === 'pending' && !data.value)
const detailQuery = computed(() => `desde=${applied.value.from}&hasta=${applied.value.to}`)

const stats = computed<FiStatItem[]>(() => {
  const k = data.value?.kpis
  return [
    {
      label: 'Solicitudes recibidas',
      value: k ? fmt.value.int(k.requests) : '—',
      icon: 'i-ph-tray',
      // La comparación es texto, nunca una flecha verde/roja sola.
      hint: k?.requestsChange != null ? `${fmt.value.delta(k.requestsChange)} vs. periodo anterior` : 'Sin periodo anterior comparable',
      to: `/dashboard/estadisticas/periodo/detalle?serie=solicitudes&${detailQuery.value}`,
      loading: firstLoad.value,
    },
    { label: 'Primeros contactos', value: k ? fmt.value.int(k.firstContacts) : '—', icon: 'i-ph-handshake', loading: firstLoad.value },
    { label: 'Historiales activos', value: k ? fmt.value.int(k.activeRecords) : '—', icon: 'i-ph-folder-open', loading: firstLoad.value },
    {
      label: 'Cobertura',
      value: k ? fmt.value.pct(k.coveredStudents / k.population) : '—',
      icon: 'i-ph-users-three',
      // El porcentaje dice su base.
      hint: k ? `${fmt.value.int(k.coveredStudents)} de ${fmt.value.int(k.population)} estudiantes` : undefined,
      loading: firstLoad.value,
    },
  ]
})
</script>

<template>
  <UDashboardPanel id="estadisticas">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Estadísticas' }]" />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UNavigationMenu
          :items="[
            { label: 'Resumen', to: '/dashboard/estadisticas', exact: true },
            { label: 'Periodo', to: '/dashboard/estadisticas/periodo' },
            { label: 'Instantáneas', to: '/dashboard/estadisticas/instantaneas' },
            { label: 'Exportar', to: '/dashboard/estadisticas/exportar' },
          ]"
          orientation="horizontal"
          variant="link"
          highlight
          aria-label="Secciones de estadísticas"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Analítica: ancho completo del panel (patterns.md → Responsive). -->
      <div class="flex w-full flex-col gap-6">
        <FiPageHeader title="Estadísticas" :description="`Licenciatura y posgrado · ${periodLabel(applied)}`">
          <template #actions>
            <UButton label="Exportar…" icon="i-ph-download-simple" color="neutral" variant="outline" @click="openExport()" />
          </template>
        </FiPageHeader>

        <!-- Tarjeta sin título: FiSectionCard, no las clases de tarjeta copiadas (B-14). -->
        <FiSectionCard aria-label="Periodo y filtros">
          <PeriodFilter v-model:from="from" v-model:to="to" :loading="status === 'pending'" @apply="applyPeriod">
            <template #filters>
              <!-- Filtros extra del módulo: USelect con centinela 'all', nunca '' -->
            </template>
          </PeriodFilter>
          <p v-if="data" role="status" class="mt-3 text-sm text-muted">Datos al {{ fmt.dateTime(data.generatedAt) }}</p>
        </FiSectionCard>

        <!-- Una petición, una región de error: no nueve recuadros rojos. -->
        <UAlert
          v-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No se pudieron cargar las estadísticas"
          description="El periodo elegido se conserva."
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <template v-else>
          <FiStatGrid :stats="stats" :columns="4" />

          <ChartCard
            title="Las solicitudes subieron 18 % en septiembre"
            description="Solicitudes recibidas por semana · licenciatura y posgrado"
            summary="Se recibieron 312 solicitudes en septiembre, 48 más que en agosto. La semana con más fue la del 22 sep (96)."
            help="Solicitud: cada envío del formulario público o captura de recepción. No incluye seguimientos."
            :detail-to="`/dashboard/estadisticas/periodo/detalle?serie=solicitudes&${detailQuery}`"
            :source="data ? `Fuente: registro de solicitudes. Datos al ${fmt.dateTime(data.generatedAt)}.` : undefined"
            :loading="firstLoad"
            :empty="data?.weekly.length === 0"
          >
            <template #chart="{ describedby }">
              <RequestsTrendChart :series="data!.weekly" :aria-describedby="describedby" />
            </template>
            <template #table>
              <UTable :data="data!.weekly" :columns="weeklyColumns" caption="Solicitudes por semana" />
            </template>
          </ChartCard>

          <div class="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Ingeniería Civil concentra una de cada cuatro solicitudes"
              description="Solicitudes por carrera · ordenadas de mayor a menor"
              source="Para proteger la privacidad, los valores menores a 5 se muestran como «< 5»."
              :loading="firstLoad"
              :empty="data?.byCareer.length === 0"
            >
              <template #chart><CareerBarChart :items="data!.byCareer" /></template>
              <template #table><UTable :data="data!.byCareer" :columns="careerColumns" caption="Solicitudes por carrera" /></template>
            </ChartCard>
            <!-- 1–3 desgloses más, como máximo -->
          </div>

          <FiSectionCard title="Definiciones" icon="i-ph-book-open" divided>
            <dl class="grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="font-medium text-highlighted">Historial activo</dt>
                <dd class="text-sm text-muted">Historial con al menos una sesión en los últimos 90 días y sin cierre registrado.</dd>
              </div>
              <!-- … una entrada por métrica que aparece arriba -->
            </dl>
          </FiSectionCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

`weeklyColumns` y `careerColumns` siguen la receta de columnas de
[components.md](../components.md#utable): números a la derecha con
`tabular-nums`, y la celda suprimida muestra "< 5" (nunca 0).

### Filtro de periodo: un solo componente

fi-ui no trae filtro de periodo: cada proyecto tiene **uno** y lo usan todas
las vistas que consultan por fechas (analítica, bitácora, historiales). Tres
filtros distintos en tres vistas es lo que la auditoría encontró (C-31).

```ts
// utils/period.ts
import { FI_TIME_ZONE } from '@fi-unam/ui'

export interface PeriodRange { from: string, to: string } // fechas civiles 'yyyy-mm-dd'

// en-CA formatea como yyyy-mm-dd; la zona es la de la FI, no la del navegador.
const civil = new Intl.DateTimeFormat('en-CA', { timeZone: FI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
export const today = () => civil.format(new Date())
export const daysAgo = (days: number) => civil.format(new Date(Date.now() - days * 86_400_000))
export const defaultRange = (): PeriodRange => ({ from: daysAgo(29), to: today() })

// Una fecha civil NO es un instante: new Date('2026-08-01') es medianoche UTC,
// que en la zona de la FI (UTC-6) ya es 31 jul. Se formatean en UTC.
// En un proyecto con i18n, el locale sale del idioma activo.
const civilLabel = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const asUtc = (day: string) => new Date(`${day}T00:00:00Z`)
export const formatDay = (day: string) => civilLabel.format(asUtc(day))
export const periodLabel = (range: PeriodRange) => civilLabel.formatRange(asUtc(range.from), asUtc(range.to)) // "1 ago – 30 sep 2026"
```

```vue
<!-- components/PeriodFilter.vue -->
<script setup lang="ts">
import { daysAgo, today, type PeriodRange } from '~/utils/period'

const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })

const props = withDefaults(defineProps<{
  loading?: boolean
  presets?: { label: string, days: number }[]
}>(), {
  loading: false,
  presets: () => [{ label: '7 días', days: 7 }, { label: '30 días', days: 30 }, { label: '90 días', days: 90 }],
})
const emit = defineEmits<{ apply: [range: PeriodRange] }>()

const maxDate = today()
const inverted = computed(() => from.value > to.value)
// El rango rápido activo se DEDUCE del rango: no se guarda aparte y no puede contradecirlo.
const activePreset = computed(() =>
  props.presets.find(preset => from.value === daysAgo(preset.days - 1) && to.value === maxDate)?.days,
)

function apply(range: PeriodRange) {
  if (range.from > range.to) return // el error ya se ve en el campo
  from.value = range.from
  to.value = range.to
  emit('apply', range)
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <!-- Rangos rápidos: se aplican al pulsar. Activo = neutral subtle + check + aria-pressed. -->
    <div role="group" aria-label="Rangos rápidos" class="flex flex-wrap gap-2">
      <UButton
        v-for="preset in props.presets"
        :key="preset.days"
        :label="preset.label"
        :icon="activePreset === preset.days ? 'i-ph-check' : undefined"
        color="neutral"
        :variant="activePreset === preset.days ? 'subtle' : 'outline'"
        size="sm"
        :aria-pressed="activePreset === preset.days"
        @click="apply({ from: daysAgo(preset.days - 1), to: maxDate })"
      />
    </div>

    <!-- Dos fechas: en un teléfono se reparten el ancho (min-w-0), desde sm se fijan. -->
    <div class="flex w-full min-w-0 items-end gap-2 sm:w-auto">
      <UFormField label="Desde" name="from" class="min-w-0 flex-1 sm:flex-none" :error="inverted ? 'Debe ser anterior a «Hasta».' : undefined">
        <UInput v-model="from" type="date" :max="maxDate" class="w-full sm:w-40" />
      </UFormField>
      <UFormField label="Hasta" name="to" class="min-w-0 flex-1 sm:flex-none">
        <UInput v-model="to" type="date" :max="maxDate" class="w-full sm:w-40" />
      </UFormField>
    </div>

    <slot name="filters" />

    <!-- Escribir una fecha no consulta: "Aplicar" sí. Siempre neutral: el filtro
         se usa en vistas que tienen su propio primary sólido (E-17). -->
    <UButton label="Aplicar" icon="i-ph-arrow-clockwise" color="neutral" variant="outline" :loading="props.loading" @click="apply({ from, to })" />
  </div>
</template>
```

Reglas del filtro:

- El rango aplicado vive en la URL de la vista (`?desde=&hasta=`), no solo en
  el componente.
- Un semestre académico puede ser un rango rápido más (un `USelect` en
  `#filters` que escribe `from`/`to`); nunca un campo de texto libre "2026-1"
  además de las fechas (inventario, instantáneas).
- Rango invertido: error en el campo con `UFormField :error`, no un párrafo
  `text-(--ui-error)` suelto.
- Las fechas del rango son **civiles** (`'yyyy-mm-dd'`): se muestran con
  `formatDay`/`periodLabel`, nunca con `new Date(dia)` formateado en la zona de
  la FI, que las recorre un día hacia atrás.
- Nunca el rango rápido activo en `primary solid` junto a un "Actualizar"
  también sólido (E-17).

### `ChartCard`: una sección de gráfica

Composición del proyecto sobre `FiSectionCard` (fi-ui no la trae). Todas las
gráficas de la app la usan, así que título, ayuda, alternativa en tabla,
fuente, detalle y estados son iguales en todas (inventario: tarjetas de
gráfica sin encabezado consistente).

```vue
<!-- components/stats/ChartCard.vue -->
<script setup lang="ts">
const props = defineProps<{
  /** La conclusión, no el nombre de la métrica. */
  title: string
  /** Medida · población · periodo. */
  description: string
  /** Resumen en texto: la alternativa de la gráfica para todas las personas. */
  summary?: string
  /** Definición de la métrica, en un popover. */
  help?: string
  /** Detalle filtrado: el drill-down es un enlace explícito, no la tarjeta entera. */
  detailTo?: string
  /** Fuente, fecha de los datos y nota de supresión. */
  source?: string
  loading?: boolean
  empty?: boolean
  error?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

const view = ref<'chart' | 'table'>('chart')
const summaryId = useId()
</script>

<template>
  <FiSectionCard :title="props.title" :description="props.description" divided>
    <template #actions>
      <!-- Ayuda con objetivo ≥ 24 px (size="sm" = 32 px) y nombre propio (E-M2). -->
      <UPopover v-if="props.help" :content="{ align: 'end' }">
        <UButton icon="i-ph-question" color="neutral" variant="ghost" size="sm" :aria-label="`Qué mide: ${props.title}`" />
        <template #content>
          <p class="max-w-xs p-3 text-sm text-default">{{ props.help }}</p>
        </template>
      </UPopover>
      <UTabs
        v-model="view"
        :items="[{ label: 'Gráfica', value: 'chart', icon: 'i-ph-chart-bar' }, { label: 'Tabla', value: 'table', icon: 'i-ph-table' }]"
        :content="false"
        variant="pill"
        color="neutral"
        size="xs"
      />
    </template>

    <div v-if="props.loading" role="status">
      <span class="sr-only">Cargando la gráfica…</span>
      <USkeleton class="h-60 w-full rounded-xl" aria-hidden="true" />
    </div>

    <UAlert
      v-else-if="props.error"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Esta gráfica no está disponible por ahora"
      :actions="[{ label: 'Reintentar', color: 'neutral', variant: 'outline', onClick: () => emit('retry') }]"
    />

    <!-- Vacío ≠ error. Dentro de una FiSectionCard (h2), el título del vacío es <p>, no otro h2. -->
    <UEmpty v-else-if="props.empty" variant="naked" size="sm">
      <template #header>
        <FiIconBadge icon="i-ph-chart-bar" />
        <p class="text-sm font-medium text-highlighted">Sin datos en este periodo</p>
        <p class="text-sm text-muted">Prueba con un periodo más amplio.</p>
      </template>
    </UEmpty>

    <template v-else>
      <p v-if="props.summary" :id="summaryId" class="text-sm text-muted">{{ props.summary }}</p>
      <div class="mt-4 min-w-0">
        <slot v-if="view === 'chart'" name="chart" :describedby="props.summary ? summaryId : undefined" />
        <slot v-else name="table" />
      </div>
    </template>

    <template v-if="props.source || props.detailTo" #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p v-if="props.source" class="text-sm text-muted">{{ props.source }}</p>
        <UButton
          v-if="props.detailTo"
          :to="props.detailTo"
          label="Ver detalle"
          trailing-icon="i-ph-arrow-right"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="`Ver detalle: ${props.title}`"
        />
      </div>
    </template>
  </FiSectionCard>
</template>
```

Reglas de cada gráfica (detalle en [data-viz.md](../data-viz.md)):

- Una sola serie = **un** color (`--fi-chart-1`); varias series = paleta
  categórica + patrón de línea o etiqueta directa, nunca solo color (E-02,
  E-03).
- Verde/ámbar/rojo **solo** si el valor es bueno o malo (una tasa de abandono
  sobre el umbral), nunca para distinguir categorías de malestar, edades o
  carreras (E-01, E-03).
- Texto de ejes ≥ 12 px **reales**: no `text-[10px]` dentro de un `viewBox`
  que escala (E-07).
- Tooltip con **todas** las series y alcanzable con teclado (E-02).
- Mapa de calor = `<table>` con `th scope` y la rampa `--fi-chart-seq-*`, con
  el color del número según la cubeta (E-06, E-M3).
- Barras desde 0, ordenadas; sin pasteles de más de 5 partes, sin doble eje.
- Animación ≤ 200 ms y solo con `motion-safe:` (E-28).

## Drill-down

Del resumen al detalle de una cifra, siempre con un **enlace real**:

| Desde | Cómo | No |
|---|---|---|
| Una cifra clave | `FiStat` con `to` a la vista de detalle con los filtros en la URL. | Un `FiStat` con un botón de ayuda dentro (botón dentro de enlace, E-10). |
| Una gráfica | "Ver detalle" en el pie del `ChartCard`. | La tarjeta entera como enlace: se descubre mal (inventario, periodo). |
| Una barra o fila | La etiqueta de la barra o la primera celda como `ULink`, alcanzable con teclado. | Áreas de clic solo para mouse en el SVG (E-02). |

La vista de detalle:

- `UBreadcrumb` en el navbar con el camino (Estadísticas › Periodo › Serie) y
  el `UNavigationMenu` del módulo con la pestaña padre activa.
- `FiPageHeader` cuyo `title` **nombra la rebanada** ("Solicitudes por semana")
  y cuya `description` dice periodo y filtros; `back` a la vista de origen
  con la misma query.
- Mismo `PeriodFilter`; los filtros llegan por la URL y "Copiar enlace"
  (`neutral ghost`) reproduce la vista.
- Gráfica + `UTable` paginada (`UPagination` con `active-color="neutral"`),
  fila de totales en el pie de la tabla, `sticky="header"`.
- "Exportar esta vista…" con el alcance de esta rebanada.
- **Privacidad:** desde una estadística anonimizada no se baja a personas
  identificables, salvo que el rol lo permita y el acceso quede registrado.
  Una celda suprimida ("< 5") no es un enlace.

## Instantáneas (snapshots)

Una instantánea **congela** las cifras de un semestre tal como están al
generarla. Es inmutable: no se edita, no se regenera, no se borra desde la
interfaz (un error de generación se corrige con un proceso administrado y
registrado, no con un botón).

| Bloque | Componentes | Regla |
|---|---|---|
| Encabezado | `FiPageHeader title="Instantáneas"` con "Nueva instantánea" **`primary solid`** en `#actions`. | Es la acción principal de esta vista. Ningún otro sólido (vacío incluido, E-17). |
| Lista | `UTable`: Semestre · Periodo · Generada (fecha y quién) · `FiStatusBadge status="neutral" label="Congelada" icon="i-ph-lock-simple"` · "Ver" (`neutral ghost`). | Solo lectura: sin editar ni eliminar en el menú de fila. |
| Detalle | `USlideover` con las cifras de la instantánea y su "Descargar CSV". | Nunca una sección que aparece debajo de la tabla sin mover foco ni scroll (E-30). |
| Comparación | Vista o pestaña propia: `UTable` con métricas en filas y semestres en columnas, diferencia con signo en texto ("+12 %"). | El color no es la única pista de "subió/bajó". |
| Crear | `UModal` con el semestre (`USelect`), el periodo **derivado y de solo lectura**, el aviso de inmutabilidad y el botón "Generar instantánea de 2026-1". | El modal es la confirmación: resume qué se va a congelar antes de hacerlo (E-30). |

```vue
<!-- components/stats/CreateSnapshotModal.vue -->
<script setup lang="ts">
import { periodLabel } from '~/utils/period'

interface SemesterOption { id: string, label: string, from: string, to: string, hasSnapshot: boolean }

const props = defineProps<{ semesters: SemesterOption[] }>() // from/to: fechas civiles 'yyyy-mm-dd'
const emit = defineEmits<{ close: [created: { id: string } | false] }>()

const semesterId = ref<string>() // sin valor: el USelect muestra el placeholder (nunca un item con value '')
const semester = computed(() => props.semesters.find(item => item.id === semesterId.value))
const items = computed(() => props.semesters.map(item => ({
  label: item.hasSnapshot ? `${item.label} (ya tiene instantánea)` : item.label,
  value: item.id,
  disabled: item.hasSnapshot,
})))

const fieldError = ref<string>()
const submitError = ref<string | null>(null)
const creating = ref(false)

async function create() {
  if (!semester.value) {
    fieldError.value = 'Elige el semestre que quieres congelar.'
    return
  }
  fieldError.value = undefined
  submitError.value = null
  creating.value = true
  try {
    const created = await $fetch<{ id: string }>('/api/stats/snapshots', { method: 'POST', body: { semesterId: semester.value.id } })
    emit('close', created)
  } catch {
    submitError.value = 'No se pudo generar la instantánea. No se creó nada; inténtalo de nuevo.'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <UModal title="Nueva instantánea" description="Congela las cifras de un semestre tal como están hoy.">
    <template #body>
      <div class="flex flex-col gap-5">
        <UFormField label="Semestre" name="semester" :error="fieldError">
          <USelect v-model="semesterId" :items="items" placeholder="Elige un semestre" class="w-full" />
        </UFormField>

        <!-- El periodo se deriva del semestre: nada de fechas ni "2026-1" escritos a mano. -->
        <dl v-if="semester" class="grid gap-3 sm:grid-cols-2">
          <div>
            <dt class="fi-label">Periodo</dt>
            <dd class="text-default">{{ periodLabel(semester) }}</dd>
          </div>
          <div>
            <dt class="fi-label">Incluye</dt>
            <dd class="text-default">Solicitudes, historiales, sesiones y cobertura</dd>
          </div>
        </dl>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-ph-lock-simple"
          title="La instantánea no se puede cambiar"
          description="Queda congelada con las cifras de hoy. No se puede editar ni volver a generar para el mismo semestre."
        />
        <UAlert v-if="submitError" role="alert" color="error" variant="subtle" icon="i-ph-warning-circle" :title="submitError" />
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
      <UButton :label="semester ? `Generar instantánea de ${semester.label}` : 'Generar instantánea'" color="primary" variant="solid" :loading="creating" @click="create()" />
    </template>
  </UModal>
</template>
```

## Exportar con alcance explícito

Una exportación dice **antes de descargar** qué contiene, y el archivo lo
repite. Vale para el "Exportar…" del resumen, el del detalle, el de un
`ChartCard` y la vista "Exportar".

| Regla | Cómo |
|---|---|
| Exporta lo que se ve | Mismos filtros y periodo que la vista; el servidor los recibe de la URL. |
| El alcance se lee antes | `UModal` con un `<dl>`: conjunto, periodo, filtros, columnas. |
| Privacidad explícita | `UAlert color="info"`: datos agregados, sin nombres, cuentas ni correos (salvo que el rol lo requiera), conteos < 5 como "< 5", la descarga queda registrada. |
| El archivo se explica solo | Nombre con conjunto y periodo (`solicitudes-por-semana_2026-08-01_2026-09-30.csv`, desde i18n, C-35); primeras filas o archivo adjunto con filtros, fecha de generación y definición de columnas. |
| Texto de enlace descriptivo | "Descargar solicitudes por semana (CSV)", no "Descargar". |
| Exportaciones largas | ≥ 10 s: `UProgress` con valor y texto en `role="status"`; si va en segundo plano, aviso al terminar. |

```vue
<UModal title="Exportar datos" description="Descarga exactamente lo que estás viendo.">
  <template #body>
    <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-[9rem_1fr]">
      <dt class="fi-label">Conjunto</dt>
      <dd class="text-default">Solicitudes por semana</dd>
      <dt class="fi-label">Periodo</dt>
      <dd class="text-default">{{ periodLabel(applied) }}</dd>
      <dt class="fi-label">Filtros</dt>
      <dd class="text-default">{{ activeFiltersLabel || 'Ninguno' }}</dd>
      <dt class="fi-label">Columnas</dt>
      <dd class="text-default">semana, solicitudes, primera vez, recurrentes</dd>
    </dl>
    <UAlert
      class="mt-5"
      color="info"
      variant="subtle"
      icon="i-ph-shield-check"
      title="Datos agregados"
      description="El archivo no incluye nombres, números de cuenta ni correos. Los valores menores a 5 aparecen como «< 5». La descarga queda registrada."
    />
  </template>
  <template #footer="{ close }">
    <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
    <UButton :to="exportUrl" external download label="Descargar CSV" icon="i-ph-download-simple" color="primary" variant="solid" />
  </template>
</UModal>
```

La vista "Exportar" es la misma receta a pantalla completa: `URadioGroup` de
conjuntos (cada uno con su `description`), `PeriodFilter`, la lista de
columnas del conjunto elegido, la nota de privacidad y "Descargar CSV" como
único `primary solid`.

## Variante "mi trabajo"

Las cifras de **una** persona del personal sobre su propio trabajo, más sus
constancias. Misma anatomía, recortada:

| # | Bloque | Componentes | Regla |
|---|---|---|---|
| 1 | Encabezado | `FiPageHeader title="Mi trabajo"` | Se enlaza desde el inicio y el sidebar, no solo desde el menú de usuario (inventario). |
| 2 | Pestañas | `UTabs` "Mi actividad · Constancias" (`variant="link"`), con la pestaña en la URL. | Las constancias son un trámite frecuente al cierre del semestre: no van enterradas bajo las cifras (inventario). |
| 3 | Mi actividad | `PeriodFilter` + `FiStatGrid :columns="3"` (sesiones, horas de acompañamiento, citas) + `UTable` de mis citas del periodo. | Sin comparaciones con colegas ni rankings: son mis cifras. |
| 4 | Constancias | `UTable`: periodo, servicio o rol, `FiStatusBadge` (Disponible `success`, En revisión `warning`), "Descargar" `neutral outline` con nombre propio. | Si una no está disponible, la fila dice por qué y cuándo. |

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Encabezado y filtro finales; `FiStat :loading`; cada `ChartCard` con su skeleton de la altura del trazo. | Nada de spinner de página ni "Calculando…" en texto (E-20). |
| Revalidando (cambió el periodo) | Las cifras y gráficas anteriores se quedan; "Aplicar" gira. | No vacíes la página para volver a cargarla. |
| Sin datos en el periodo | Cada `ChartCard` con `UEmpty` "Sin datos en este periodo"; las cifras en 0 con su `hint`. | Mismo vacío en todas las gráficas (E-20). |
| Error (una petición) | Un `UAlert color="error"` con "Reintentar" en lugar de cifras y gráficas. | Nunca 0 ni "sin datos" cuando la carga falló. |
| Parcial | La gráfica que falló dice "no está disponible" con reintento; las demás se muestran. | Contrato explícito del endpoint, no un `catch` que devuelve `[]`. |
| Valores suprimidos | "< 5" en la celda, barra sin dibujar con su etiqueta, nota al pie. | Se suprime en el servidor ([data-viz.md](../data-viz.md#supresión-de-conteos-pequeños)). |
| Datos viejos | "Datos al …" siempre visible; si la fuente se actualiza por lotes, la hora del último lote. | — |
| Exportando | Botón con `:loading`; ≥ 10 s, `UProgress` con valor en `role="status"`. | — |
| Sin instantáneas | `UEmpty` "Aún no hay instantáneas" con "Nueva instantánea" en `neutral outline` (el encabezado ya tiene el sólido). | — |

## Jerarquía de acciones

1. **Resumen y detalle:** sin `primary solid`. "Exportar…" es `neutral
   outline` en el encabezado.
2. **Instantáneas:** "Nueva instantánea" es el único sólido. **Exportar
   (vista):** "Descargar CSV" es el único sólido.
3. **Filtro:** rangos rápidos `neutral` (`subtle` + check + `aria-pressed`
   el activo, `outline` los demás); "Aplicar" `neutral outline` (E-17).
4. **Por gráfica:** ayuda (`neutral ghost` con nombre), "Gráfica · Tabla"
   (`UTabs` pill neutral), "Ver detalle" (`neutral ghost`) en el pie.
5. **Drill-down** siempre como enlace (`to`), nunca `@click` con
   `navigateTo`.
6. Crear una instantánea confirma dentro de su propio modal, con el resumen
   de lo que se congela.

## Responsive

- Analítica usa el ancho completo del panel; las cifras pasan de 4 columnas a
  2 (`sm`) y a 1 (móvil) solas (`FiStatGrid`).
- Desgloses: `lg:grid-cols-2`; abajo de `lg`, una columna.
- Las gráficas miden su contenedor (`ResizeObserver`) y reducen las etiquetas
  del eje x en anchos chicos; texto ≥ 12 px reales siempre (E-07).
- Tablas en su propio contenedor con scroll; la primera columna identifica la
  fila.
- El filtro: rangos rápidos arriba, fechas repartiendo el ancho en móvil
  (`min-w-0 flex-1`), "Aplicar" al final.
- Pestañas del módulo: el `UNavigationMenu` horizontal se desplaza dentro del
  toolbar si no cabe.

## Accesibilidad

- Un solo `h1` (`FiPageHeader`); cada `ChartCard` es `h2`.
- Toda gráfica: resumen en texto + tabla a un clic + SVG con `role="img"` y
  `aria-describedby` al resumen ([data-viz.md](../data-viz.md#alternativa-en-tabla-y-resumen-en-texto)).
- La ayuda de métrica es un botón de ≥ 24 px con nombre ("Qué mide: …") y
  nunca vive dentro de otro control (E-M2, E-10).
- Mapas de calor como `<table>` con `th scope="col"`/`scope="row"`; el dato de
  día y hora en la celda, no solo en un tooltip de hover (E-M3).
- La frescura ("Datos al …") y el conteo de resultados son `role="status"`.
- Las pestañas del módulo son enlaces (`UNavigationMenu`); "Gráfica · Tabla"
  y "Mi actividad · Constancias" son `UTabs` reales.
- Movimiento solo con `motion-safe:`; nada de barras que crecen 500 ms
  (E-28).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| `--fi-chart-*` sin estados; una serie, un color. | Paleta de 12 colores armada con `primary-500`, `warning-500`, `success-500`, `error-500`: rojo FI junto a rojo de error a 1.49:1 (E-01). |
| Tres líneas con patrón distinto y etiqueta al final; tooltip con todas. | "Favorables" y "adversos" distinguibles solo por verde y rojo; el tooltip muestra solo el total (E-02). |
| Rojo/ámbar/verde solo para valores buenos o malos. | Rojo de error en "Malestares individuales", verde en rangos de edad, mapa serie → color copiado en dos páginas (E-03). |
| Número de la celda con el color de su cubeta (`--fi-chart-seq-*`). | Número en tinta sobre la cubeta más oscura: 1.4:1 (E-06). |
| Etiquetas de eje en HTML o `viewBox` al ancho real. | `text-[10px]` dentro de un `viewBox` de 900: ~4 px en el teléfono (E-07). |
| `FiStat` con `to`; ayuda fuera del área clicable. | Tarjeta KPI `<button>` con un botón de ayuda dentro (E-10). |
| `UTable` en todas las tablas, con `UPagination`. | Cinco `<table>` a mano con cinco encabezados distintos y paginación de cuatro botones de flecha (E-12). |
| `UNavigationMenu` con coincidencia por prefijo. | `EstadisticasTabs` con `role="tab"` sobre enlaces y coincidencia exacta: en el detalle ninguna pestaña queda activa (E-14). |
| `FiStatGrid` en todas las cifras. | Cuatro diseños de KPI y números de 4xl sin `tabular-nums` (E-16, C-14). |
| `.fi-label` para rótulos; `.fi-tag` máximo uno por sección. | Siete `.fi-tag` por página y rótulos de 10–11 px en cinco recetas (E-15). |
| Un `PeriodFilter` en toda la app. | Filtro de periodo rehecho en tres vistas, con claves i18n de otra pantalla (C-31, inventario). |
| Un solo sólido por vista; rangos rápidos neutrales. | Rango activo `primary solid` junto a "Actualizar" `primary solid`; tres sólidos en instantáneas (E-17). |
| Crear instantánea en modal con resumen; detalle en slideover. | Detalle que aparece bajo la tabla sin mover foco ni scroll; creación irreversible sin paso de confirmación (E-30). |
| `h2` de sección en `text-lg` navy (lo pone `FiSectionCard`). | `h2` en `text-sm` en unas tarjetas y `text-xl` en otras de la misma página (E-31). |
| Botón de ayuda de 32 px. | Disparador de ayuda de 16 × 16 px junto a cada cifra (E-M2). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/estadisticas/index.vue`: el resumen. El inventario
  propone 4 cifras con comparación y 3–4 gráficas arriba, los análisis
  secundarios (cobertura, malestares, cruces) en sub-vistas, filtro global
  fijo y un `ChartCard` con ayuda y exportación.
- `app/pages/dashboard/estadisticas/periodo/index.vue` y `periodo/detalle.vue`:
  drill-down; la tabla a mano y la tarjeta entera como enlace son lo que se
  reemplaza.
- `app/pages/dashboard/estadisticas/snapshots.vue`: instantáneas; la creación
  en línea con texto libre y el detalle bajo la tabla son el anti-ejemplo.
- `app/pages/dashboard/estadisticas/exportar.vue`: le faltan el filtro común,
  la lista de columnas y la nota de privacidad.
- `app/pages/dashboard/mi-trabajo.vue`: variante "mi trabajo"; reimplementa el
  filtro y la tabla.
- `app/components/dashboard/DashboardPeriodFilter.vue`: base del
  `PeriodFilter` único (el rango rápido activo se deduce del rango, consulta
  explícita); corregir el `primary solid` del rango activo.
- No renombres claves de la API en español (`expedientesTotal`,
  `sesionesPromedioPorExpedienteActivo`) al cambiar textos visibles: el tipo es
  laxo y el typecheck no lo detecta.

## Fuentes

- Nielsen Norman Group, *Dashboards: Making Charts and Graphs Easier to Understand* (posición y longitud, sin pasteles ni medidores, el color no codifica magnitud). https://www.nngroup.com/articles/dashboards-preattentive/
- Carbon Design System, *Dashboards* (presentación vs. exploración, filtros, drill-down, gráficas enlazadas). https://carbondesignsystem.com/data-visualization/dashboards/
- UK Government Analysis Function, *Data visualisation: charts* (títulos con la conclusión, tablas de datos, etiquetas directas, base cero, ≤ 4 líneas). https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/
- Office for National Statistics, *Disclosure control for health statistics* (riesgo de conteos pequeños). https://www.ons.gov.uk/methodology/methodologytopicsandstatisticalconcepts/disclosurecontrol/healthstatistics
- OWASP, *Logging Cheat Sheet* (registrar exportaciones y acceso a datos sensibles). https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Nielsen Norman Group, *Progress indicators* (porcentaje para operaciones de ≥ 10 s). https://www.nngroup.com/articles/progress-indicators/
