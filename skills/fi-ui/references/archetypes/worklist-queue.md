# Arquetipo `worklist-queue` — Bandeja de trabajo

Una cola de elementos que **llegan** y hay que despachar uno por uno: triar,
tomar, aceptar o rechazar, iniciar o cerrar. Primero lo más antiguo (o lo más
urgente), con una pestaña de historial para auditar lo que ya se decidió.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** personal que atiende una cola. En PSM: recepción (solicitudes),
  asesores (derivaciones internas dirigidas a su servicio, seguimientos) y
  coordinación (accesos por ratificar).
- **Tarea:** procesar lo pendiente sin perder el lugar: leer lo necesario para
  decidir, decidir y pasar al siguiente.
- **Éxito:** la persona procesa la cola de arriba abajo sin volver a buscar
  dónde iba, cada decisión negativa queda con su motivo, y al final ve
  "Bandeja al día".

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Solicitudes entrantes, derivaciones dirigidas a mí, pendientes por ratificar, seguimientos obligatorios. | Encontrar un registro que ya sabes que existe: es [`record-finder`](record-finder.md). |
| Cualquier lista donde el elemento sale de "pendiente" al decidir. | Mantener un catálogo (crear, editar, borrar datos de referencia): es [`catalog-admin`](catalog-admin.md). |
| | Ver la semana de citas: es [`scheduling-calendar`](scheduling-calendar.md). |
| | Revisar una bitácora sin decidir nada: es [`audit-and-monitoring`](audit-and-monitoring.md). |

Dos variantes, según cómo se despacha:

- **A. Lista-detalle** (por defecto): se decide **un elemento a la vez**
  leyendo su contenido (un motivo, una carta). Solicitudes, derivaciones.
- **B. Tabla con selección:** se decide **en lote** o con poca lectura por
  elemento. Seguimientos obligatorios, accesos por ratificar.

## Anatomía (de arriba abajo)

### Variante A — lista-detalle

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Panel de lista | `UDashboardPanel id="…-lista" :default-size="30" :min-size="20" :max-size="45" resizable` | Es el que queda en móvil. |
| 1 | Navbar del panel de lista | `UDashboardNavbar title="Solicitudes"` con el conteo en `#trailing` (`UBadge color="neutral" variant="subtle"`) | **Excepción al marco:** aquí no hay `FiPageHeader`, así que el `title` del navbar es el `h1` de la vista. Un panel angosto no carga un encabezado grande. |
| 2 | Vistas y orden | `UDashboardToolbar`: `UTabs variant="pill" color="neutral" :content="false"` (**Bandeja (n) · Historial**, conteo en `badge`) a la izquierda; el orden visible ("Más antiguas primero") a la derecha. La vista vive en la URL (`?vista=historial`). | Nada de botones redondos con `aria-pressed` ni `role="tab"` a mano (D-10, C-08). |
| 3 | Lista | `<ul>` de filas. Cada fila: nombre (botón estirado `after:absolute after:inset-0`), identificador humano, `FiStatusBadge` de espera, extracto del motivo (`line-clamp-2`), señales como "Primera vez" (`UBadge neutral outline`). | Una columna, de arriba abajo, más antigua primero. Nada de rejilla de 2 o 3 columnas: rompe el orden FIFO (inventario). |
| 4 | Panel de detalle | `UDashboardPanel id="…-detalle" class="hidden lg:flex"` con `UDashboardNavbar :toggle="false"` y el nombre como `<h2>` en `#left`. | En `< lg`, el mismo detalle va en `USlideover`. |
| 5 | Detalle | Fila de decisiones arriba (negativa `error ghost` + positiva sólida), datos en `dl`, motivo completo, `UTimeline color="neutral"` con lo ocurrido. | La decisión negativa abre `UModal` con motivo **obligatorio**. |
| 6 | Historial | Con `?vista=historial` la página rinde **un solo** `UDashboardPanel` (otro `id`, sin `resizable`) con el mismo navbar y las mismas pestañas: el `PeriodFilter` del proyecto ([receta](analytics.md#filtro-de-periodo-un-solo-componente)) + `UTable` a todo el ancho (persona, resultado con `FiStatusBadge`, fecha, quién decidió, motivo). | Una tabla de cinco columnas no cabe en el panel de lista (20–45 %). Siempre `UTable`; nunca filas de `div` con un encabezado que se oculta en móvil (D-13). |

### Variante B — tabla con selección

`FiPageHeader` (aquí sí: es una vista de una columna) + `UTabs` de estados del
flujo (Obligatorios · En curso · Cerrados) + búsqueda y filtros + `UTable` con
columna de selección + barra de acciones en lote. La acción que **crea**
trabajo ("Iniciar seguimiento") es el botón del encabezado, **no** una pestaña
más (inventario, seguimientos).

### Esqueleto (variante A)

```vue
<!-- pages/dashboard/solicitudes/index.vue -->
<script setup lang="ts">
// @vueuse/core llega con Nuxt UI; si lo importas, decláralo en tu package.json.
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import type { FiStatus } from '@fi-unam/ui'
import type { TabsItem } from '@nuxt/ui'

type WaitSeverity = 'fresh' | 'due' | 'late'

interface InboxItem {
  id: string
  personName: string
  subtitle: string // "422012345 · Ingeniería Civil": identificador humano, nunca un UUID
  reason: string
  createdAt: string // ISO
  firstTime: boolean
  wait: { severity: WaitSeverity, label: string } // "Espera 3 días", calculado en el servidor
}

// La espera se dice con texto + ícono; el color solo refuerza.
const WAIT: Record<WaitSeverity, { status: FiStatus, icon: string }> = {
  fresh: { status: 'neutral', icon: 'i-ph-clock' },
  due: { status: 'warning', icon: 'i-ph-clock-countdown' },
  late: { status: 'error', icon: 'i-ph-warning' },
}

const route = useRoute()
const router = useRouter()

// La vista vive en la URL: recargar o compartir el enlace conserva la pestaña.
const view = computed({
  get: () => (route.query.vista === 'historial' ? 'historial' : 'bandeja'),
  set: (value: string | number) => router.replace({ query: { ...route.query, vista: String(value) } }),
})

const { data, status, error, refresh } = useLazyFetch<InboxItem[]>('/api/solicitudes/bandeja')
const firstLoad = computed(() => status.value === 'pending' && !data.value)

// Más antigua primero. Si el dominio tiene urgencia, primero urgencia y luego antigüedad.
const items = computed(() => [...(data.value ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)))

const tabs = computed<TabsItem[]>(() => [
  { label: 'Bandeja', value: 'bandeja', badge: { label: String(items.value.length), color: 'neutral', variant: 'soft' } },
  { label: 'Historial', value: 'historial' },
])

const selectedId = ref<string | null>(null)
const selected = computed(() => items.value.find(item => item.id === selectedId.value) ?? null)

// < lg: el detalle se abre en un USlideover sobre la lista.
const isMobile = useBreakpoints(breakpointsTailwind).smaller('lg')
const isDetailOpen = computed({
  get: () => isMobile.value && selected.value !== null,
  set: (open: boolean) => {
    if (!open) selectedId.value = null
  },
})

// Después de decidir, pasa a la siguiente sin perder el lugar en la lista.
function onDecided(id: string) {
  const index = items.value.findIndex(item => item.id === id)
  selectedId.value = items.value[index + 1]?.id ?? null
  void refresh()
}
</script>

<template>
  <!-- Historial: un solo panel a todo el ancho, con el mismo navbar y pestañas. -->
  <UDashboardPanel v-if="view === 'historial'" id="solicitudes-historial">
    <template #header>
      <UDashboardNavbar title="Solicitudes">
        <template #leading>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <UTabs v-model="view" :items="tabs" variant="pill" color="neutral" :content="false" size="sm" />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <RequestHistory />
    </template>
  </UDashboardPanel>

  <!-- Bandeja: lista-detalle. -->
  <template v-else>
    <UDashboardPanel id="solicitudes-lista" :default-size="30" :min-size="20" :max-size="45" resizable>
      <template #header>
        <!-- Excepción: sin FiPageHeader, el title del navbar es el h1 de la vista. -->
        <UDashboardNavbar title="Solicitudes">
          <template #leading>
            <UDashboardSidebarCollapse class="hidden lg:flex" />
          </template>
          <template #trailing>
            <UBadge v-if="data" :label="`${items.length} pendientes`" color="neutral" variant="subtle" />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <UTabs v-model="view" :items="tabs" variant="pill" color="neutral" :content="false" size="sm" />
          </template>
          <template #right>
            <p class="text-sm text-muted">Más antiguas primero</p>
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <!-- Error primero: nunca caer en "bandeja al día" si la carga falló. -->
        <UAlert
          v-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No pudimos cargar la bandeja"
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <!-- USkeleton 4.9 lleva role="alert" en cada bloque: se ocultan y una
             sola región role="status" hace el anuncio. -->
        <div v-else-if="firstLoad" role="status">
          <span class="sr-only">Cargando solicitudes…</span>
          <div class="flex flex-col gap-2" aria-hidden="true">
            <USkeleton v-for="n in 6" :key="n" class="h-20 rounded-xl" />
          </div>
        </div>

        <UEmpty
          v-else-if="items.length === 0"
          variant="naked"
          title="Bandeja al día"
          description="No hay solicitudes pendientes. Las nuevas aparecerán aquí."
        >
          <template #leading>
            <FiIconBadge icon="i-ph-check-circle" tone="success" />
          </template>
        </UEmpty>

        <ul v-else class="-mx-4 divide-y divide-default sm:-mx-6" aria-label="Solicitudes pendientes, más antiguas primero">
          <li
            v-for="item in items"
            :key="item.id"
            class="relative border-s-4 px-4 py-3 sm:px-6"
            :class="item.id === selectedId ? 'border-primary bg-muted' : 'border-transparent hover:bg-muted/60'"
          >
            <div class="flex items-start justify-between gap-3">
              <!-- El botón del nombre cubre la fila (after:inset-0): toda la
                   fila es clicable sin anidar interactivos. -->
              <button
                type="button"
                class="min-w-0 text-start font-semibold text-highlighted after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
                :aria-current="item.id === selectedId ? 'true' : undefined"
                @click="selectedId = item.id"
              >
                <span class="line-clamp-1">{{ item.personName }}</span>
              </button>
              <FiStatusBadge
                :status="WAIT[item.wait.severity].status"
                :icon="WAIT[item.wait.severity].icon"
                :label="item.wait.label"
                size="sm"
                class="shrink-0"
              />
            </div>
            <p class="text-sm text-muted">{{ item.subtitle }}</p>
            <p class="mt-1 line-clamp-2 text-sm text-default">{{ item.reason }}</p>
            <UBadge v-if="item.firstTime" class="mt-2" label="Primera vez" color="neutral" variant="outline" size="sm" />
          </li>
        </ul>
      </template>
    </UDashboardPanel>

    <UDashboardPanel id="solicitudes-detalle" class="hidden lg:flex">
      <template #header>
        <!-- :toggle="false": el botón del sidebar móvil ya está en el panel de lista.
             #left en vez de title: el detalle es h2, no otro h1. -->
        <UDashboardNavbar :toggle="false">
          <template #left>
            <h2 class="truncate text-base font-semibold text-highlighted">
              {{ selected?.personName ?? 'Detalle' }}
            </h2>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <RequestDetail v-if="selected" :key="selected.id" :request="selected" @decided="onDecided" />
        <p v-else class="my-auto text-center text-sm text-muted">Elige una solicitud para ver su detalle y decidir.</p>
      </template>
    </UDashboardPanel>

    <USlideover v-if="isMobile" v-model:open="isDetailOpen" :title="selected?.personName ?? 'Detalle'" description="Detalle de la solicitud">
      <template #body>
        <RequestDetail v-if="selected" :key="selected.id" :request="selected" @decided="onDecided" />
      </template>
    </USlideover>
  </template>
</template>
```

Si el detalle es largo, se comparte por enlace o tiene sus propias
pestañas, en `< lg` usa una ruta de detalle (`/dashboard/solicitudes/[id]`)
con `FiPageHeader back` en lugar del slideover.

### La decisión negativa: confirmación con motivo

```vue
<!-- components/RequestDetail.vue (fragmento) -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{ request: InboxItem }>()
const emit = defineEmits<{ decided: [id: string] }>()

const toast = useToast()
// Un estado de carga POR BOTÓN: "Crear cita" no gira cuando se descarta.
const pending = ref<'schedule' | 'discard' | null>(null)

const isDiscardOpen = ref(false)
const discardError = ref<string | null>(null)
const discardSchema = z.object({
  reason: z.string().trim().min(1, 'Escribe el motivo: queda en el historial.'),
})
type DiscardForm = z.output<typeof discardSchema>
const discardState = reactive<Partial<DiscardForm>>({ reason: '' })

async function onDiscard(event: FormSubmitEvent<DiscardForm>) {
  pending.value = 'discard'
  discardError.value = null
  try {
    await $fetch(`/api/solicitudes/${props.request.id}/descartar`, { method: 'POST', body: event.data })
    // Éxito: primero se cierra el diálogo, luego el toast (con deshacer si se puede).
    isDiscardOpen.value = false
    toast.add({
      title: 'Solicitud descartada',
      color: 'success',
      icon: 'i-ph-check-circle',
      actions: [{ label: 'Deshacer', color: 'neutral', variant: 'outline', onClick: () => undoDiscard(props.request.id) }],
    })
    emit('decided', props.request.id)
  } catch {
    // Fallo: el diálogo queda abierto, con lo escrito intacto y el error en línea.
    discardError.value = 'No se pudo descartar. Revisa tu conexión e inténtalo de nuevo.'
  } finally {
    pending.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Decisiones: la negativa a la izquierda de la positiva, alineadas a la derecha. -->
    <div class="flex flex-wrap justify-end gap-2">
      <UButton label="Descartar" icon="i-ph-x" color="error" variant="ghost" @click="isDiscardOpen = true;" />
      <UButton label="Crear cita" icon="i-ph-calendar-plus" color="primary" variant="solid" :loading="pending === 'schedule'" @click="openSchedule()" />
    </div>

    <!-- dl con los datos, motivo completo, UTimeline color="neutral" de lo ocurrido… -->

    <!-- :close="false": sin la "x", el primer control enfocable es el motivo,
         nunca el botón destructivo. Escape sigue cerrando. -->
    <UModal
      v-model:open="isDiscardOpen"
      :title="`¿Descartar la solicitud de ${request.personName}?`"
      description="Sale de la bandeja y queda en el historial con tu motivo."
      :close="false"
    >
      <template #body>
        <UForm id="discard-form" :schema="discardSchema" :state="discardState" class="space-y-4" @submit="onDiscard">
          <UAlert v-if="discardError" role="alert" color="error" variant="subtle" icon="i-ph-warning-circle" :title="discardError" />
          <UFormField name="reason" label="Motivo" description="Lo verá quien revise el historial.">
            <UTextarea v-model="discardState.reason" :rows="3" autoresize aria-required="true" class="w-full" />
          </UFormField>
        </UForm>
      </template>

      <!-- El pie ya alinea a la derecha (fiAppConfig): sin div propio. -->
      <template #footer="{ close }">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="close" />
        <UButton type="submit" form="discard-form" label="Descartar solicitud" color="error" variant="solid" :loading="pending === 'discard'" />
      </template>
    </UModal>
  </div>
</template>
```

Con varias decisiones negativas en la app, usa el `ConfirmDialog` único del
proyecto con `reasonLabel` (motivo obligatorio) y `action` (la petición corre
dentro del diálogo, que queda abierto si falla), en vez de un modal por vista:
receta en [patterns.md](../patterns.md#diálogo-de-confirmación-reutilizable).

**Decisión positiva con datos** ("Aceptar" con nota, "Asignar" a alguien): si
la positiva pide algo más que un clic, abre un `UModal` con la misma forma
(título con el nombre, `UForm` en el cuerpo, pie `[Cancelar] [Aceptar
solicitud]` en `primary solid`); una nota opcional lleva `hint="(opcional)"`.
Si no pide nada, actúa al clic con toast y "Deshacer".

### Historial en `UTable`

```ts
import type { TableColumn } from '@nuxt/ui'
import type { FiStatus } from '@fi-unam/ui'

type Outcome = 'SCHEDULED' | 'DISCARDED'

interface HistoryRow {
  id: string
  personName: string
  outcome: Outcome
  decidedAtLabel: string
  decidedBy: string
  note: string | null
}

// Un desenlace registrado no es un error: descartar es un resultado normal.
const OUTCOME: Record<Outcome, { status: FiStatus, label: string, icon: string }> = {
  SCHEDULED: { status: 'success', label: 'Cita creada', icon: 'i-ph-calendar-check' },
  DISCARDED: { status: 'neutral', label: 'Descartada', icon: 'i-ph-minus-circle' },
}

const columns: TableColumn<HistoryRow>[] = [
  { accessorKey: 'personName', header: 'Persona' },
  { accessorKey: 'outcome', header: 'Resultado' },
  // nowrap solo en fechas y cifras; el texto largo se ajusta (C-16).
  { accessorKey: 'decidedAtLabel', header: 'Fecha', meta: { class: { td: 'whitespace-nowrap tabular-nums' } } },
  { accessorKey: 'decidedBy', header: 'Decidió' },
  { accessorKey: 'note', header: 'Motivo', meta: { class: { td: 'min-w-56 max-w-md' } } },
]
```

```vue
<UTable :data="history" :columns="columns" :loading="historyLoading" sticky="header" caption="Historial de solicitudes del periodo">
  <!-- En Nuxt UI 4.9, @select vuelve la fila enfocable pero Enter no la
       activa: el elemento interactivo real va en la primera columna. -->
  <template #personName-cell="{ row }">
    <ULink :to="`/dashboard/solicitudes/${row.original.id}`" class="font-medium text-highlighted hover:underline">
      {{ row.original.personName }}
    </ULink>
  </template>
  <template #outcome-cell="{ row }">
    <FiStatusBadge v-bind="OUTCOME[row.original.outcome]" />
  </template>
  <!-- Obligatorio con :loading: sin este slot, UTable 4.9 muestra el vacío mientras carga. -->
  <template #loading>
    <div role="status" class="space-y-3 px-4">
      <span class="sr-only">Cargando historial…</span>
      <USkeleton v-for="n in 5" :key="n" class="h-10 w-full" aria-hidden="true" />
    </div>
  </template>
  <template #empty>
    <UEmpty variant="naked" size="sm" title="Sin movimientos en este periodo">
      <template #leading><FiIconBadge icon="i-ph-calendar-x" /></template>
    </UEmpty>
  </template>
</UTable>
```

### Variante B: selección y acción en lote

```ts
const UCheckbox = resolveComponent('UCheckbox')

// Cada casilla con nombre propio: "Seleccionar a Ana Pérez" (D-09).
const selectColumn: TableColumn<FollowUpRow> = {
  id: 'select',
  header: ({ table }) => h(UCheckbox, {
    'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
    'aria-label': 'Seleccionar todas',
  }),
  cell: ({ row }) => h(UCheckbox, {
    'modelValue': row.getIsSelected(),
    'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
    'aria-label': `Seleccionar a ${row.original.personName}`,
  }),
}
```

La barra de lote aparece con la selección (`v-model:row-selection`), dice
cuántas hay en un `aria-live="polite"`, y su acción abre un `UModal` que
**lista los nombres** afectados antes de confirmar. "Iniciar todos" sin
confirmación ni lista de a quién afecta es justo lo que hay que evitar
(inventario, seguimientos).

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Filas `USkeleton` del alto de una fila real, dentro de una sola región `role="status"`; `#loading` en el historial. Navbar y pestañas se pintan de inmediato. | Nada de spinner de página (D-20). |
| Bandeja al día | `UEmpty variant="naked"` "Bandeja al día" con `FiIconBadge tone="success"`. | Es una buena noticia, no un error: sin caja verde hecha a mano (D-21). |
| Sin resultados (búsqueda o filtro) | `UEmpty` "Sin resultados para «…»" con "Limpiar filtros". | Nunca el mismo vacío que "bandeja al día" sin forma de quitar el filtro (C-21). |
| Sin selección (≥ lg) | Una línea de ayuda centrada en el panel de detalle. | Solo en el panel de detalle. En móvil no existe: el detalle es un slideover. |
| Error de carga | `UAlert color="error" role="alert"` con "Reintentar" donde iba la lista. | Nunca "bandeja al día" cuando la carga falló. |
| Llegan elementos nuevos | Una píldora arriba de la lista: "3 nuevas · Mostrar" (`UButton size="xs" color="neutral" variant="soft"`), con `aria-live="polite"`. | Nunca reordenar la lista bajo el cursor. |
| Conflicto al tomar | `UAlert color="warning"` en el detalle: "Ana P. ya tomó esta derivación hace 1 min". Se refresca la lista. | Tomar es optimista; el conflicto se explica en línea, no en un toast. |
| El elemento ya se atendió (otra pestaña, otra persona) | En el detalle: "Esta solicitud ya se atendió" + "Ir a la siguiente". | — |
| Historial vacío en el periodo | `UEmpty` en `#empty` de `UTable`. | — |

## Jerarquía de acciones

1. **Decisión positiva** ("Crear cita", "Aceptar", "Tomar"): `UButton`
   sólido (primary) **solo en el detalle**. Es el único sólido visible. Usa
   `primary` para toda decisión afirmativa, nunca `success` (D-25).
2. **Decisión negativa** ("Descartar", "Rechazar", "Revocar"):
   `color="error" variant="ghost"`. **Siempre** abre un `UModal` que pregunta
   con el nombre del elemento, dice la consecuencia, pide motivo obligatorio y
   usa un botón con verbo ("Rechazar derivación"). Nunca de un clic (D-07,
   C-02).
3. **Un `loading` por botón.** Aceptar y Rechazar no comparten bandera
   (inventario, canalización interna).
4. **En las filas de la lista no hay botones** en la variante A: la fila
   selecciona. En la variante B, como máximo 1–2 acciones por fila
   (`ghost`/`outline`, nunca sólidas) y el resto en `UDropdownMenu`.
5. **Después de decidir:** se cierra el diálogo, toast transitorio con
   "Deshacer" cuando el servidor lo permite, la selección pasa al siguiente
   elemento y la lista conserva el desplazamiento.
6. **Lote:** casillas + barra de lote + `UModal` que lista a quién afecta.
7. La acción que crea trabajo nuevo ("Iniciar seguimiento") va en
   `FiPageHeader #actions` (variante B), no como pestaña.

## Responsive

- `≥ lg`: dos paneles. El de lista es redimensionable (20–45 %) y
  `UDashboardGroup` recuerda el tamaño.
- `< lg`: solo la lista, a todo el ancho. Al elegir una fila, el detalle abre
  en `USlideover` (mismo componente). Al cerrarlo, el foco vuelve a la fila.
- El historial en `UTable` se desplaza en horizontal dentro de su
  contenedor; la primera columna (persona) identifica la fila.
- Una sola columna de filas en todos los tamaños. La rejilla de tarjetas no
  es una cola.

## Accesibilidad

- Un solo `h1` (el `title` del navbar del panel de lista). El detalle usa
  `h2`.
- `UTabs` da `tablist`, `tab`, `tabpanel` y flechas. No lo reemplaces con
  botones.
- Cada fila tiene un solo control (el botón del nombre) con
  `aria-current="true"` en la seleccionada. La selección se ve con dos
  señales (borde izquierdo y fondo), distintas del anillo de foco.
- La espera es texto ("Espera 3 días") con ícono. El color nunca va solo.
- El foco no se pierde al decidir: pasa a la siguiente fila o al encabezado
  del detalle siguiente.
- Atajos de una sola tecla (`j`/`k`, `a`, `d`) solo si se pueden desactivar
  (WCAG 2.1.4). Las flechas dentro de la lista enfocada no tienen ese
  problema.
- La barra fija de lote y el navbar no tapan la fila enfocada (WCAG 2.4.11):
  `scroll-padding` en el contenedor que se desplaza.

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| `UTabs variant="pill" color="neutral" :content="false"` con el conteo en `badge`. | Cuatro conmutadores distintos y ninguno `UTabs`: botones redondos con `aria-pressed`, `role="tab"` sin `tabpanel`, chips con "(n)" (D-10, C-08). |
| "Rechazar" `error ghost` → `UModal` con motivo obligatorio. | "Rechazar" de un clic, sin confirmación, sin motivo y sin deshacer, junto a "Aceptar" en cada tarjeta (D-07). |
| `primary` para toda decisión afirmativa. | "Aceptar" en `success` y "Tomar" en `primary` en la misma vista: el color de la acción principal cambia según el tipo (D-25). |
| `UEmpty` "Bandeja al día". | La misma caja punteada con palomita verde copiada en tres páginas (D-21, D-12). |
| `UTable` para el historial, con `caption`. | Filas de `div` con encabezado en mayúsculas hecho a mano, sin semántica de tabla (D-13). |
| Cifras de resumen con `FiStat` (azul marino, `tabular-nums`). | Franjas de resumen copiadas con `text-(--ui-error)` y conteos sin `tabular-nums` (D-12, D-18). |
| Texto de estado con `FiStatusBadge`. | `text-(--ui-warning)` sobre blanco: 2.1:1 (D-06). |
| Casillas con `aria-label` con el nombre de la persona. | `UCheckbox` de selección sin etiqueta (D-09). |
| Un componente de bandeja compartido y claves i18n propias (`common.inbox.*`). | La misma página copiada en Solicitudes y Canalización interna, ya desincronizada (D-12), con claves i18n de un dominio usadas en otro (D-33). |
| Fila o tarjeta clicable con enlace estirado. | Tarjeta `<button>` con otro `<button>` y un enlace adentro (D-04). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/solicitudes/index.vue`: el enlace estirado
  (`after:inset-0`, con su comentario) y el mapa `WAIT_BADGE` son la
  referencia buena. El conmutador, la rejilla de 3 columnas, los dos modales
  seguidos (detalle → crear cita) y el historial de `div` son lo que se
  reemplaza.
- `app/pages/dashboard/canalizacion-interna.vue`: misma estructura; el
  "Rechazar" de un clic es el error a no repetir.
- `app/pages/dashboard/seguimientos/index.vue`: variante B (selección y lote).
- `app/pages/dashboard/seguridad/accesos.vue`: variante B con "Ratificar" en
  línea; el inventario propone `UTabs` "Por ratificar (n) · Permisos
  vigentes · Historial".

## Fuentes

- Nielsen Norman Group, *Data tables* (primera columna legible, filtros, acciones en lote, evitar modales para detalle profundo). https://www.nngroup.com/articles/data-tables/
- Ministry of Justice Design System, *Filter a list* (filtros visibles, etiquetas quitables, limpiar filtros). https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/
- Android Developers, *Canonical layouts: list-detail*. https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts
- Nuxt UI, *DashboardPanel* (paneles redimensionables, lista + detalle). https://ui.nuxt.com/docs/components/dashboard-panel
- Carbon Design System, *Data table* (barra de lote, ≤ 5 acciones en la barra). https://carbondesignsystem.com/components/data-table/usage/
