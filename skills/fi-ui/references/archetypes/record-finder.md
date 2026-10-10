# Arquetipo `record-finder` — Buscador de registros

El índice operativo para **encontrar rápido** el registro de una persona (o
de un grupo) que ya existe, y lanzar desde ahí la siguiente acción, o crear
uno nuevo si no está. Búsqueda con alcance, conteo de resultados que se
anuncia, filas fáciles de escanear y, por resultado, una acción visible y el
resto en un menú.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** personal que atiende (en PSM: asesores que buscan la cédula de
  una persona para agendar, atender sin cita o pedir acceso).
- **Tarea:** escribir un nombre o un número de cuenta, reconocer a la persona
  en la lista y actuar, o crearla si no existe.
- **Éxito:** el resultado correcto se reconoce por nombre y cuenta sin abrir
  nada; la acción más probable está a un clic; lo que no se encontró se
  explica con una salida.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Buscar registros operativos de personas o casos (historiales, cédulas, grupos). | Despachar elementos que llegan solos: es [`worklist-queue`](worklist-queue.md). |
| El punto de partida para "agendar a…", "atender a…", "pedir acceso a…". | Mantener datos de referencia (categorías, instituciones): es [`catalog-admin`](catalog-admin.md). |
| | Ver todo de un registro: es [`record-detail`](record-detail.md), al que se llega desde aquí. |
| | Buscar en todo el sistema desde cualquier vista: eso es `UDashboardSearch` (⌘K), que puede incluir registros recientes. |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar` con `#left` (`UBreadcrumb`). | Mismo ancho y orden que las vistas hermanas (D-11). |
| 1 | Encabezado | `FiPageHeader title="Historiales"` con `#actions`: "Nueva cédula" (`neutral outline` si la búsqueda tiene botón; sólido si la búsqueda es instantánea). | Un solo sólido en la vista. |
| 2 | Búsqueda | `<form role="search" aria-label="…">` en una tarjeta FI: `UTabs variant="pill" color="neutral" :content="false"` para el **alcance** ("Mis historiales · Todos"); `UFormField` + `UInput type="search"` con botón de borrar en `#trailing`; filtros (`UFormField` + `USelect`); botón "Buscar" (`type="submit"`). | El alcance y los filtros viven en la URL; **la búsqueda no** (es un nombre o una cuenta). |
| 3 | Filtros activos | Chips quitables + "Limpiar filtros" (`neutral link`). | Solo si hay filtros. |
| 4 | Conteo | `<p role="status">` siempre presente: "12 resultados para «ana»". | Se anuncia al cambiar. Si se truncó: `UAlert color="info"` "Mostramos los primeros 50; afina la búsqueda". |
| 5 | Resultados | `UTable` (por defecto): Persona (enlace + cuenta), Estatus (`FiStatusBadge`), Último contacto, Responsable, Acciones. | Primera columna = identificador humano que enlaza al detalle. **Máximo una acción visible** por resultado + `UDropdownMenu` "Más acciones". |
| 6 | Paginación | `UPagination` debajo, con el total. | — |
| 7 | Antes de buscar | `FiSectionCard title="Recientes"` con los últimos registros abiertos. | Cada visita no empieza en blanco (inventario). |

**Tabla o tarjetas.** Tabla cuando se escanean nombres y números (personas).
Tarjetas solo cuando cada resultado necesita contexto visual propio (un grupo
con su próxima sesión y número de miembros); entonces, tarjeta clicable con
enlace estirado, una acción y menú (receta en
[patterns.md](../patterns.md#tarjeta-clicable)).

**Búsqueda con botón o instantánea.** Con botón ("Buscar", Enter envía) cuando
la búsqueda va al servidor sobre datos personales o es costosa: la persona
decide cuándo se consulta y el conteo habla de lo que buscó. Instantánea (300
ms de espera, mínimo 2–3 caracteres, `UInput :loading`) solo para listas
cortas ya cargadas. Vistas hermanas usan el mismo modo, o hay una razón
escrita para que no (inventario: la búsqueda de cédulas tenía botón y la de
grupos era instantánea, sin razón).

### Esqueleto

```vue
<!-- pages/dashboard/cedulas/buscar.vue -->
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { RECORD_STATUS_TONE, type RecordStatus } from '~/utils/presenters/record-status'

interface RecordRow {
  id: string
  name: string
  accountNumber: string
  status: RecordStatus
  statusLabel: string
  lastContactLabel: string | null
  counsellor: string | null
  canAccess: boolean
}

const ALL = 'all' // centinela: un item de USelect con value '' rompe reka-ui
const route = useRoute()
const router = useRouter()

// En la URL: alcance y filtros. Nunca el texto buscado (datos personales).
const scope = computed({
  get: () => (route.query.alcance === 'todos' ? 'todos' : 'mios'),
  set: (value: string | number) => router.replace({ query: { ...route.query, alcance: String(value) } }),
})
const statusFilter = computed({
  get: () => (route.query.estatus as string) ?? ALL,
  set: (value: string) => router.replace({ query: { ...route.query, estatus: value === ALL ? undefined : value } }),
})
const statusItems = [
  { label: 'Todos los estatus', value: ALL },
  { label: 'En espera', value: 'WAITING' },
  { label: 'En acompañamiento', value: 'ACTIVE' },
  { label: 'Concluido', value: 'CONCLUDED' },
]

const query = ref('')
const searched = ref('') // lo que de verdad se buscó: de eso habla el conteo
const tooShort = ref(false)

// POST: el texto buscado viaja en el cuerpo, no en la URL ni en los logs de acceso.
const { data, status, error, execute } = useLazyFetch<{ items: RecordRow[], total: number, truncated: boolean }>('/api/historiales/buscar', {
  method: 'POST',
  body: computed(() => ({ q: searched.value, scope: scope.value, status: statusFilter.value })),
  immediate: false,
  watch: false,
})

async function onSearch() {
  tooShort.value = query.value.trim().length < 3
  if (tooShort.value) return
  searched.value = query.value.trim()
  await execute()
}

// Cambiar alcance o filtro vuelve a consultar lo ya buscado.
watch([scope, statusFilter], () => {
  if (searched.value) void execute()
})

const hasFilters = computed(() => statusFilter.value !== ALL)
const countLabel = computed(() => {
  if (!searched.value || status.value === 'pending' || error.value || !data.value) return ''
  const n = data.value.total
  return `${n} ${n === 1 ? 'resultado' : 'resultados'} para «${searched.value}»`
})

const columns: TableColumn<RecordRow>[] = [
  { accessorKey: 'name', header: 'Persona' },
  { accessorKey: 'status', header: 'Estatus' },
  { accessorKey: 'lastContactLabel', header: 'Último contacto', meta: { class: { td: 'whitespace-nowrap' } } },
  { accessorKey: 'counsellor', header: 'Responsable' },
  { id: 'actions', header: 'Acciones', meta: { class: { th: 'sr-only', td: 'text-right' } } },
]

// El mismo modelo de acciones que el detalle (ver record-detail.md): una
// principal según el estatus y el resto agrupado en el menú.
const { actionsFor } = useRecordActions()
</script>

<template>
  <UDashboardPanel id="historiales-buscar">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Historiales' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <FiPageHeader title="Historiales" description="Busca por nombre, número de cuenta o correo.">
          <template #actions>
            <UButton label="Nueva cédula" icon="i-ph-plus" color="neutral" variant="outline" @click="openCreate()" />
          </template>
        </FiPageHeader>

        <form
          role="search"
          aria-label="Buscar historiales"
          class="flex flex-col gap-4 rounded-2xl border border-default bg-elevated p-4 sm:p-5"
          @submit.prevent="onSearch"
        >
          <UTabs
            v-model="scope"
            :items="[{ label: 'Mis historiales', value: 'mios' }, { label: 'Todos', value: 'todos' }]"
            variant="pill"
            color="neutral"
            :content="false"
            size="sm"
            class="sm:w-fit"
          />

          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <UFormField
              name="q"
              label="Nombre, número de cuenta o correo"
              :error="tooShort ? 'Escribe al menos 3 caracteres' : undefined"
              class="min-w-0 flex-1"
            >
              <UInput v-model="query" type="search" icon="i-ph-magnifying-glass" autocomplete="off" class="w-full">
                <template v-if="query" #trailing>
                  <!-- Botón de borrar en el slot de UInput: foco y relleno correctos (C-33). -->
                  <UButton icon="i-ph-x" color="neutral" variant="link" size="sm" aria-label="Borrar la búsqueda" @click="query = '';" />
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Estatus" class="sm:w-52">
              <USelect v-model="statusFilter" :items="statusItems" class="w-full" />
            </UFormField>

            <UButton type="submit" label="Buscar" icon="i-ph-magnifying-glass" :loading="status === 'pending'" />
          </div>
        </form>

        <!-- Siempre en el DOM: una región viva que aparece ya llena no siempre se anuncia. -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p role="status" class="text-sm text-muted">{{ countLabel }}</p>
          <UButton v-if="hasFilters" label="Limpiar filtros" color="neutral" variant="link" size="sm" @click="statusFilter = ALL;" />
        </div>

        <FiSectionCard v-if="!searched" title="Recientes" icon="i-ph-clock-counter-clockwise">
          <!-- …los últimos registros abiertos, como enlaces -->
        </FiSectionCard>

        <UAlert
          v-else-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No se pudo hacer la búsqueda"
          description="Puede ser un problema de conexión. Tu búsqueda se conserva."
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => execute() }]"
        />

        <template v-else>
          <UAlert
            v-if="data?.truncated"
            color="info"
            variant="subtle"
            icon="i-ph-info"
            title="Mostramos los primeros 50 resultados"
            description="Agrega el apellido o el número de cuenta para afinar la búsqueda."
          />

          <UTable :data="data?.items ?? []" :columns="columns" :loading="status === 'pending'" sticky="header" caption="Resultados de la búsqueda">
            <template #name-cell="{ row }">
              <ULink v-if="row.original.canAccess" :to="`/dashboard/cedulas/${row.original.id}`" class="font-medium text-highlighted hover:underline">
                {{ row.original.name }}
              </ULink>
              <!-- Sin acceso: la identidad se atenúa con texto e ícono; la acción nunca. -->
              <span v-else class="flex items-center gap-1.5 font-medium text-muted">
                <UIcon name="i-ph-lock-simple" class="size-4" />
                {{ row.original.name }}
                <span class="sr-only">(sin acceso)</span>
              </span>
              <p class="text-sm text-muted tabular-nums">{{ row.original.accountNumber }}</p>
            </template>

            <template #status-cell="{ row }">
              <FiStatusBadge :status="RECORD_STATUS_TONE[row.original.status]" :label="row.original.statusLabel" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center justify-end gap-1">
                <!-- Una sola acción visible: la más probable según el estatus. -->
                <UButton v-if="actionsFor(row.original).primary" v-bind="actionsFor(row.original).primary" color="neutral" variant="outline" size="sm" />
                <UDropdownMenu v-if="actionsFor(row.original).menu.length" :items="actionsFor(row.original).menu" :content="{ align: 'end' }">
                  <UButton icon="i-ph-dots-three" color="neutral" variant="ghost" size="sm" :aria-label="`Más acciones para ${row.original.name}`" />
                </UDropdownMenu>
              </div>
            </template>

            <!-- Obligatorio con :loading en 4.9: sin él la tabla muestra el vacío mientras carga. -->
            <template #loading>
              <div role="status" class="space-y-3 px-4">
                <span class="sr-only">Buscando…</span>
                <USkeleton v-for="n in 5" :key="n" class="h-12 w-full" aria-hidden="true" />
              </div>
            </template>

            <template #empty>
              <UEmpty
                variant="naked"
                size="sm"
                :title="`No encontramos «${searched}»`"
                :description="hasFilters ? 'Prueba sin filtros o con el número de cuenta.' : 'Revisa la ortografía o busca por número de cuenta.'"
                :actions="hasFilters
                  ? [{ label: 'Limpiar filtros', color: 'neutral', variant: 'outline', onClick: () => (statusFilter = ALL) }]
                  : [{ label: 'Nueva cédula', icon: 'i-ph-plus', color: 'neutral', variant: 'outline', onClick: openCreate }]"
              >
                <template #leading><FiIconBadge icon="i-ph-magnifying-glass" /></template>
              </UEmpty>
            </template>
          </UTable>

          <!-- UPagination debajo, con el total: "128 historiales" -->
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Antes de buscar | "Recientes" y el formulario listo. Sin conteo, sin tabla vacía. | No es un "sin resultados". |
| Texto demasiado corto | Error en línea del campo: "Escribe al menos 3 caracteres". | No se consulta. |
| Buscando | Botón "Buscar" con `:loading` y filas `USkeleton` en el `#loading` de la tabla. | Lo que ya se veía se queda mientras se revalida un filtro. |
| Resultados | Conteo en `role="status"` + tabla + paginación. | — |
| Sin resultados | `UEmpty` "No encontramos «…»" con "Limpiar filtros" (si hay) o "Nueva cédula". | Un vacío filtrado siempre tiene salida (C-21). |
| Resultados truncados | `UAlert color="info"` arriba de la tabla. | Nunca truncar en silencio. |
| Error | `UAlert color="error" role="alert"` con "Reintentar"; la búsqueda escrita se conserva. | Nunca "sin resultados" cuando la consulta falló. |
| Resultado sin acceso | Nombre en `text-muted` con candado y texto "(sin acceso)"; acción visible "Solicitar acceso" a contraste completo. | Nunca `opacity-50 grayscale` sobre la fila entera (D-06). |

## Jerarquía de acciones

1. **Nivel página:** un sólido. Con búsqueda por botón, el sólido es
   "Buscar" y "Nueva cédula" va en `neutral outline`. Con búsqueda
   instantánea, "Nueva cédula" es el sólido.
2. **Por resultado:** el nombre es el enlace al detalle (navegación, no un
   botón "Ver"). **Una** acción visible, la más probable según el estatus
   ("Agendar cita", "Solicitar acceso"), en `neutral outline size="sm"`. El
   resto en `UDropdownMenu` agrupado (Atención · Derivación · Cierre), con lo
   destructivo al final en `color: 'error'`.
3. **El mismo modelo de acciones que el detalle** (`useRecordActions`): el
   menú de una fila y el "Más acciones" del registro ofrecen lo mismo
   (D-23).
4. Acciones urgentes del dominio (p. ej. atención de emergencia) van primero
   en el menú y siempre en el encabezado del detalle; si de verdad necesitan
   estar visibles en la fila, son la segunda y última acción visible, con
   `color="error" variant="ghost"` e ícono + texto.
5. Navegación interna con `i-ph-arrow-right` o el nombre como enlace; nunca
   `i-ph-arrow-square-out`, que dice "externo" (D-23).

## Responsive

- `< sm`: el formulario se apila (alcance, campo, filtro, botón a todo el
  ancho). Los hijos del `flex` llevan `min-w-0`.
- La tabla se desplaza en horizontal dentro de su contenedor; la primera
  columna (persona + cuenta) es la que identifica. Si en `< md` resulta
  incómoda, una lista de tarjetas con el mismo contenido y las mismas
  acciones.
- En móvil, filtros extra en un `UDrawer` con "Filtros (2)".

## Accesibilidad

- `role="search"` con `aria-label` en el formulario; el campo tiene etiqueta
  visible (`UFormField label`), no solo placeholder (E-22).
- El conteo es `role="status"` y está siempre en el DOM.
- `UTable` con `caption`. El nombre es un enlace real; no uses `@select` de
  `UTable` como única vía (en 4.9 la fila no responde a Enter).
- El disparador de "Más acciones" nombra a la persona: "Más acciones para Ana
  Pérez".
- `UTabs` para el alcance (no botones con `aria-pressed` hechos a mano).
- Nada de elevación en hover sin `motion-safe:` (D-31).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Una acción visible + "Más acciones", el mismo modelo que el detalle. | Cinco o seis botones `xs` del mismo peso por tarjeta, con un conjunto distinto al del detalle (D-23). |
| Atenuar solo la identidad de un resultado sin acceso, con candado y texto. | `opacity-50 grayscale` sobre la tarjeta entera, incluido "Solicitar acceso" (D-06). |
| Filas para escanear nombres y cuentas. | Una rejilla de tarjetas para buscar personas (inventario). |
| "Recientes" antes de buscar. | Cada visita empieza en blanco aunque el proyecto ya guarda los recientes (inventario). |
| `UEmpty` con "Limpiar filtros". | Un vacío filtrado igual al de primer uso, sin forma de quitar el filtro (C-21). |
| Botón de borrar en `#trailing` de `UInput`. | Un botón de borrar posicionado encima del input, sin relleno reservado ni foco de Nuxt UI (C-33). |
| `UTabs` para el alcance. | Una fila de "pestañas" de módulo renderizada antes del encabezado y fuera de la columna central (D-11, D-10). |
| Centinela `'all'` en `USelect`. | Una opción "Todos" con `value: ''`: reka-ui lanza al montar y deja la navegación colgada (trampa de reka-ui). |
| `UFormField label` en el campo de búsqueda. | Campo identificado solo por su placeholder (E-22). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/cedulas/buscar.vue` con
  `app/components/cedulas/CedulasBuscarPanel.vue`: buena referencia del
  formulario (ya usa `UTabs` para "mías/todas", campo con etiqueta, botón de
  envío explícito y conteo con `aria-live`). Lo que cambia según el
  inventario: resultados como filas, una acción principal por fila con
  "Atención de emergencia" distinguible y el resto en menú, "Recientes"
  (`useRecentDestinations`) e integración con ⌘K, y un solo mapa de acciones
  por estatus compartido con el detalle.
- `app/components/cedulas/CedulaSearchCard.vue`: el anti-ejemplo de la fila de
  botones.
- `app/pages/dashboard/operacion/grupos/index.vue`: variante de tarjetas; el
  inventario pide mostrar la próxima sesión y los miembros, ordenar por
  próxima sesión y un filtro "Sin sesión programada".

## Fuentes

- Nielsen Norman Group, *Data tables* (primera columna legible, filtros visibles, acciones por fila). https://www.nngroup.com/articles/data-tables/
- Ministry of Justice Design System, *Filter a list* (filtros, etiquetas quitables, conteo de resultados). https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/
- W3C WAI-ARIA APG, *Search landmark*. https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
- W3C WAI, *Understanding 4.1.3 Status Messages*. https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- Nuxt UI, *Table*. https://ui.nuxt.com/docs/components/table
