# Arquetipo `catalog-admin` — Administración de catálogos (CRUD)

Mantiene **datos de referencia** que otras vistas eligen de una lista:
categorías, directorio de instituciones, tipos, plantillas, usuarios y roles.
Buscar, filtrar, crear, editar, desactivar y, solo si nadie lo usa, eliminar.
Todas las vistas de catálogo de un proyecto son **una sola generación**: el
mismo encabezado, la misma barra de herramientas, la misma tabla, el mismo
modal y la misma confirmación.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** coordinación o administración con el permiso del catálogo. Lo
  usa pocas veces al mes, así que no recuerda la interfaz: todo debe verse sin
  descubrir nada.
- **Tarea:** encontrar un elemento y corregirlo, o dar de alta uno nuevo, sin
  romper lo que ya lo usa.
- **Éxito:** encuentra el elemento en segundos (búsqueda + filtro), lo edita
  en un diálogo corto, y antes de desactivar o eliminar sabe **a cuántos
  registros afecta**.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Colecciones de datos de referencia: categorías, instituciones, tipos de servicio, promos, cuestionarios (la lista), campañas, usuarios y roles. | Registros operativos de personas o casos: es [`record-finder`](record-finder.md). |
| Cualquier lista cuyo ciclo sea crear → editar → desactivar. | Elementos que **llegan** y hay que despachar: es [`worklist-queue`](worklist-queue.md). |
| | Editar **el contenido** de un elemento versionado (secciones, preguntas, publicar): es [`builder-editor`](builder-editor.md). La lista de cuestionarios sí es catálogo. |
| | Las opciones de **una sola cosa** (mi perfil, el interruptor de la recepción): es [`settings`](settings.md). |
| | Dar de alta cientos de filas o importar un CSV: es [`bulk-entry`](bulk-entry.md); el catálogo enlaza ahí desde "Más acciones". |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar` con `#left` (`UBreadcrumb` del módulo) | Sin `title` en el navbar: el `h1` lo pone `FiPageHeader` (C-M1). |
| 1 | Encabezado | `FiPageHeader` con `title` en **sustantivo plural** ("Instituciones"), `description` de una frase y en `#actions` **un** `UButton` sólido primary "Crear …". Exportar/Importar van en un `UDropdownMenu` "Más acciones" `neutral outline`. | Un solo sólido. Nunca otro sólido en el vacío, la barra de lote o los filtros (C-29, E-17). |
| 2 | Cifras (opcional) | `FiStatGrid` con `FiStat` que **tienen `to`** hacia la lista ya filtrada ("Sin datos de contacto: 7"). | Solo si la cifra lleva a una decisión. Una cifra que no filtra nada ("Total", "Máx. subcategorías") no va (E-04, inventario). |
| 3 | Barra de herramientas | `UInput type="search"` + `UTabs` de estado (`variant="pill" color="neutral" :content="false"`, conteos en `badge`) + `USelect` por atributo (centinela `'all'`). Debajo: chips de filtros activos, conteo `role="status"` y "Limpiar filtros". | Todo el estado en la URL. Nada de `UBadge @click` ni píldoras `<button>` a mano (D-05, E-13, C-08). |
| 4 | Colección | `UTable` (por defecto). Primera columna = nombre, que abre la edición. Uso (`tabular-nums`, a la derecha), estado con `FiStatusBadge`, fecha de actualización, y una columna de acciones con **≤ 2** controles visibles + `UDropdownMenu`. | Tarjetas **solo** para entidades visuales (promos con imagen). Nunca un conmutador "tabla / tarjetas" en un catálogo de texto (inventario). |
| 5 | Paginación | `UPagination` fuera de la tabla, con el total ("128 instituciones") y `active-color="neutral"`. | Paginar a partir de 25–50 filas. Página en la URL. |
| 6 | Crear / editar | `UModal` si son **≤ 6 campos simples**; `USlideover` si es mediano o necesita la lista como contexto; una página `/[id]` si tiene secciones o listas relacionadas. | Nunca modal sobre modal. Pie: `[Cancelar (neutral outline)] [Crear … / Guardar cambios (primary)]` (D-22, E-19). |
| 7 | Desactivar / eliminar | Desactivar = acción inmediata + toast con "Deshacer". Eliminar = `ConfirmDialog` que nombra el objeto y el impacto; si está en uso, se bloquea y se ofrece desactivar. | Misma receta en todos los catálogos (E-18, C-02). |

Ancho: `max-w-7xl` centrado, como el resto de las vistas de trabajo del dashboard
([patterns.md](../patterns.md#responsive)).

### Elegir el contenedor de edición

| El elemento tiene… | Contenedor | Ejemplo |
|---|---|---|
| ≤ 6 campos simples, sin listas anidadas | `UModal` | categoría (nombre, descripción, activa), institución |
| 7–15 campos, o hay que ver la fila mientras se edita | `USlideover side="right"` | usuario con roles y servicios |
| Secciones, listas relacionadas, versiones, vista previa | Página `/[id]` | cuestionario → [`builder-editor`](builder-editor.md) |
| Pasos con consecuencias (crear con imagen, vigencia y prioridad) | `USlideover` o página con `UStepper` | promo |

Un `StepIndicator` propio de `div`s dentro de un modal es lo que no se hace
(E-21): si hacen falta pasos, `UStepper` y espacio para él.

### Esqueleto de la vista

```vue
<!-- pages/dashboard/gestion/instituciones.vue -->
<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'
import type { FiStatItem, FiStatus } from '@fi-unam/ui'
import ConfirmDialog from '~/components/app/ConfirmDialog.vue'
import InstitutionFormModal from '~/components/catalogs/InstitutionFormModal.vue'

type InstitutionKind = 'PUBLIC' | 'PRIVATE' | 'NGO'
type InstitutionStatus = 'ACTIVE' | 'INACTIVE'

interface InstitutionRow {
  id: string
  name: string
  kind: InstitutionKind
  hasContact: boolean
  /** Uso: cuántas derivaciones la citan. Es el "radio de impacto" de borrarla. */
  referralCount: number
  status: InstitutionStatus
  updatedAt: string
  updatedAtLabel: string // "3 oct 2026", ya formateado
}

/** Lo que edita el modal (InstitutionFormModal). */
interface InstitutionRecord {
  id: string
  name: string
  kind: InstitutionKind
  emails: string[]
  website: string
  notes: string
}

interface InstitutionPage {
  items: InstitutionRow[]
  total: number // con los filtros actuales
  totalAll: number // sin filtros: distingue "primer uso" de "sin resultados"
  counts: Record<InstitutionStatus, number>
  missingContact: number
}

const ALL = 'all' // nunca '' en un USelect: reka-ui lanza y congela la vista
const PAGE_SIZE = 25

// Estado del registro → estado FI. Inactiva es un desenlace normal: neutral.
const STATUS: Record<InstitutionStatus, { status: FiStatus, label: string }> = {
  ACTIVE: { status: 'success', label: 'Activa' },
  INACTIVE: { status: 'neutral', label: 'Inactiva' },
}

// El tipo es una CATEGORÍA, no un estado: neutral con ícono distinto (E-04).
const KIND: Record<InstitutionKind, { label: string, icon: string }> = {
  PUBLIC: { label: 'Pública', icon: 'i-ph-bank' },
  PRIVATE: { label: 'Privada', icon: 'i-ph-buildings' },
  NGO: { label: 'Organización civil', icon: 'i-ph-hand-heart' },
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const overlay = useOverlay()
const confirmDialog = overlay.create(ConfirmDialog)
const formModal = overlay.create(InstitutionFormModal)
const int = new Intl.NumberFormat('es-MX')

// ── Filtros: la URL es la fuente de verdad (se comparte, se recarga, "Atrás" funciona).
function setQuery(patch: Record<string, string | undefined>) {
  // Cambiar un filtro regresa a la página 1.
  router.replace({ query: { ...route.query, page: undefined, ...patch } })
}

const status = computed({
  get: () => (route.query.estado as string) ?? 'ACTIVE', // por defecto, solo activas
  set: (value: string | number) => setQuery({ estado: value === 'ACTIVE' ? undefined : String(value) }),
})
const kind = computed({
  get: () => (route.query.tipo as string) ?? ALL,
  set: (value: string) => setQuery({ tipo: value === ALL ? undefined : value }),
})
const page = computed({
  get: () => Number(route.query.page ?? 1),
  set: (value: number) => router.replace({ query: { ...route.query, page: value > 1 ? String(value) : undefined } }),
})

// `q` en la URL: el nombre de una institución no es dato personal. En un
// catálogo de personas (usuarios) la búsqueda queda en estado local (patterns.md → Privacidad).
const search = ref((route.query.q as string) ?? '')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (q) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => setQuery({ q: q.trim() || undefined }), 300)
})

const { data, status: fetchStatus, error, refresh } = useLazyFetch<InstitutionPage>('/api/catalogs/institutions', {
  query: computed(() => ({ ...route.query, pageSize: PAGE_SIZE })),
})

const firstLoad = computed(() => fetchStatus.value === 'pending' && !data.value)
const rows = computed(() => data.value?.items ?? [])

// ── Chips: lo que está filtrando ahora, cada uno quitable. Las pestañas de
// estado no generan chip: ya se ven seleccionadas.
const chips = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (route.query.q) list.push({ key: 'q', label: `«${route.query.q}»`, clear: () => { search.value = '' } })
  if (kind.value !== ALL) {
    list.push({ key: 'tipo', label: `Tipo: ${KIND[kind.value as InstitutionKind].label}`, clear: () => { kind.value = ALL } })
  }
  if (route.query.contacto === 'sin') list.push({ key: 'contacto', label: 'Sin datos de contacto', clear: () => setQuery({ contacto: undefined }) })
  return list
})
const hasFilters = computed(() => chips.value.length > 0 || status.value !== 'ACTIVE')
function clearFilters() {
  search.value = ''
  router.replace({ query: {} })
}
const showInactive = () => {
  status.value = 'INACTIVE'
}

const statusTabs = computed<TabsItem[]>(() => [
  { label: 'Activas', value: 'ACTIVE', badge: data.value?.counts.ACTIVE },
  { label: 'Inactivas', value: 'INACTIVE', badge: data.value?.counts.INACTIVE },
  { label: 'Todas', value: ALL },
])
const kindItems = [
  { label: 'Todos los tipos', value: ALL },
  ...Object.entries(KIND).map(([value, item]) => ({ label: item.label, value, icon: item.icon })),
]

// ── Cifras: solo las que llevan a una decisión, y cada una filtra la lista.
const stats = computed<FiStatItem[]>(() => [
  {
    label: 'Sin datos de contacto',
    value: int.format(data.value?.missingContact ?? 0),
    icon: 'i-ph-address-book',
    tone: (data.value?.missingContact ?? 0) > 0 ? 'warning' : 'default',
    hint: 'No se pueden usar para derivar',
    to: '/dashboard/gestion/instituciones?contacto=sin',
    loading: firstLoad.value,
  },
  {
    label: 'Inactivas',
    value: int.format(data.value?.counts.INACTIVE ?? 0),
    icon: 'i-ph-archive',
    hint: 'Ya no aparecen como opción',
    to: '/dashboard/gestion/instituciones?estado=INACTIVE',
    loading: firstLoad.value,
  },
])

// ── Tabla
const columns: TableColumn<InstitutionRow>[] = [
  { accessorKey: 'name', header: 'Nombre', meta: { class: { td: 'min-w-56' } } },
  { accessorKey: 'kind', header: 'Tipo' },
  {
    accessorKey: 'referralCount',
    header: 'En uso',
    meta: { class: { th: 'text-right', td: 'text-right tabular-nums whitespace-nowrap' } },
    cell: ({ row }) => int.format(row.original.referralCount),
  },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'updatedAtLabel', header: 'Actualizada', meta: { class: { td: 'whitespace-nowrap tabular-nums' } } },
  { id: 'actions', header: 'Acciones', meta: { class: { th: 'sr-only', td: 'text-right' } } },
]

function rowMenu(row: InstitutionRow): DropdownMenuItem[][] {
  return [
    [
      { label: 'Editar', icon: 'i-ph-pencil-simple', onSelect: () => openEdit(row) },
      row.status === 'ACTIVE'
        ? { label: 'Desactivar', icon: 'i-ph-archive', onSelect: () => setStatus(row, 'INACTIVE') }
        : { label: 'Activar', icon: 'i-ph-arrow-counter-clockwise', onSelect: () => setStatus(row, 'ACTIVE') },
    ],
    // Lo destructivo, en su propio grupo y al final.
    [{ label: 'Eliminar', icon: 'i-ph-trash', color: 'error', onSelect: () => remove(row) }],
  ]
}

// ── Mutaciones
async function openCreate() {
  const saved = await formModal.open({})
  if (saved) {
    toast.add({ title: `Se creó «${saved.name}»`, color: 'success', icon: 'i-ph-check-circle' })
    await refresh()
  }
}

async function openEdit(row: InstitutionRow) {
  // El registro completo se pide aquí y entra como prop: un componente abierto
  // con useOverlay no debe tener `await` en su setup (no hay Suspense que lo espere).
  const institution = await $fetch<InstitutionRecord>(`/api/catalogs/institutions/${row.id}`)
  const saved = await formModal.open({ institution })
  if (saved) {
    toast.add({ title: 'Cambios guardados', color: 'success', icon: 'i-ph-check-circle' })
    await refresh()
  }
}

// Reversible: actúa ya y ofrece deshacer. Nada de confirmación.
async function setStatus(row: InstitutionRow, next: InstitutionStatus) {
  try {
    await $fetch(`/api/catalogs/institutions/${row.id}/status`, { method: 'PUT', body: { status: next } })
  } catch (err) {
    // Acción sin formulario: toast persistente con "Copiar detalles" (patterns.md → Canales).
    return notifyTechnicalError(err)
  }
  await refresh()
  toast.add({
    title: next === 'INACTIVE' ? `Se desactivó «${row.name}»` : `Se activó «${row.name}»`,
    color: 'success',
    icon: 'i-ph-check-circle',
    actions: [{ label: 'Deshacer', color: 'neutral', variant: 'outline', onClick: () => setStatus(row, row.status) }],
  })
}

// Exporta lo que se ve: el servidor recibe los mismos filtros de la URL.
function exportCsv() {
  window.location.assign(router.resolve({ path: '/api/catalogs/institutions/export.csv', query: route.query }).href)
}

// Irreversible: confirma con nombre e impacto. Si está en uso, no se borra.
async function remove(row: InstitutionRow) {
  if (row.referralCount > 0) {
    const deactivate = await confirmDialog.open({
      title: `«${row.name}» está en uso`,
      description: `La citan ${int.format(row.referralCount)} derivaciones, así que no se puede eliminar. Desactívala: deja de aparecer como opción y las derivaciones existentes la conservan.`,
      confirmLabel: 'Desactivar institución',
      tone: 'primary',
    })
    if (deactivate === true) await setStatus(row, 'INACTIVE')
    return
  }

  // `action`: el borrado corre dentro del diálogo; si falla, queda abierto con el error.
  const confirmed = await confirmDialog.open({
    title: `¿Eliminar la institución «${row.name}»?`,
    description: 'Se borrará del directorio. Esta acción no se puede deshacer.',
    confirmLabel: 'Eliminar institución',
    action: () => $fetch(`/api/catalogs/institutions/${row.id}`, { method: 'DELETE' }),
  })
  if (confirmed !== true) return
  toast.add({ title: `Se eliminó «${row.name}»`, color: 'success', icon: 'i-ph-check-circle' })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="instituciones">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Gestión', to: '/dashboard/gestion' }, { label: 'Instituciones' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <FiPageHeader title="Instituciones" description="Directorio de instituciones externas para derivar.">
          <template #actions>
            <UDropdownMenu
              :items="[[{ label: 'Exportar CSV', icon: 'i-ph-download-simple', onSelect: exportCsv }, { label: 'Importar…', icon: 'i-ph-upload-simple', to: '/dashboard/gestion/instituciones/importar' }]]"
              :content="{ align: 'end' }"
            >
              <UButton label="Más acciones" icon="i-ph-dots-three" color="neutral" variant="outline" />
            </UDropdownMenu>
            <!-- El único sólido de la vista. -->
            <UButton label="Crear institución" icon="i-ph-plus" color="primary" variant="solid" @click="openCreate()" />
          </template>
        </FiPageHeader>

        <FiStatGrid :stats="stats" :columns="2" />

        <!-- Barra de herramientas: se pinta final desde el primer frame. -->
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <UInput
              v-model="search"
              type="search"
              icon="i-ph-magnifying-glass"
              placeholder="Nombre o correo"
              aria-label="Buscar instituciones"
              class="w-full sm:w-72"
            />
            <UTabs v-model="status" :items="statusTabs" :content="false" variant="pill" color="neutral" size="sm" />
            <USelect v-model="kind" :items="kindItems" aria-label="Tipo de institución" class="w-full sm:w-56" />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <p role="status" class="text-sm text-muted">
              {{ data ? `${int.format(data.total)} instituciones` : '' }}
            </p>
            <UButton
              v-for="chip in chips"
              :key="chip.key"
              :label="chip.label"
              trailing-icon="i-ph-x"
              color="neutral"
              variant="subtle"
              size="xs"
              :aria-label="`Quitar filtro ${chip.label}`"
              @click="chip.clear()"
            />
            <UButton v-if="hasFilters" label="Limpiar filtros" color="neutral" variant="link" size="sm" @click="clearFilters" />
          </div>
        </div>

        <!-- Error: en el lugar de la tabla, nunca una tabla vacía. -->
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          role="alert"
          title="No se pudo cargar el directorio"
          description="Tus filtros se conservan."
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <template v-else>
          <UTable :data="rows" :columns="columns" :loading="firstLoad" sticky="header" caption="Instituciones del directorio">
            <template #name-cell="{ row }">
              <!-- El nombre abre la edición: es el control principal de la fila
                   (ULink sin `to` rinde un <button> con foco visible). -->
              <ULink as="button" class="text-start font-medium text-highlighted hover:underline" @click="openEdit(row.original)">
                {{ row.original.name }}
              </ULink>
              <p v-if="!row.original.hasContact" class="text-sm text-muted">Sin datos de contacto</p>
            </template>

            <template #kind-cell="{ row }">
              <UBadge :label="KIND[row.original.kind].label" :icon="KIND[row.original.kind].icon" color="neutral" variant="outline" />
            </template>

            <template #status-cell="{ row }">
              <FiStatusBadge v-bind="STATUS[row.original.status]" />
            </template>

            <template #actions-cell="{ row }">
              <UDropdownMenu :items="rowMenu(row.original)" :content="{ align: 'end' }">
                <UButton
                  icon="i-ph-dots-three"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Más acciones para ${row.original.name}`"
                />
              </UDropdownMenu>
            </template>

            <!-- Obligatorio con :loading: sin él, UTable 4.9 muestra el vacío mientras carga. -->
            <template #loading>
              <div role="status" class="space-y-3 px-4">
                <span class="sr-only">Cargando instituciones…</span>
                <USkeleton v-for="n in 6" :key="n" class="h-10 w-full" aria-hidden="true" />
              </div>
            </template>

            <template #empty>
              <UEmpty
                v-if="data && data.totalAll === 0"
                variant="naked"
                size="sm"
                title="Aún no hay instituciones"
                description="Agrega las instituciones a las que se puede derivar; aparecerán como opción en cada derivación."
                :actions="[{ label: 'Crear institución', icon: 'i-ph-plus', color: 'neutral', variant: 'outline', onClick: () => openCreate() }]"
              >
                <template #leading><FiIconBadge icon="i-ph-buildings" size="lg" /></template>
              </UEmpty>
              <UEmpty
                v-else-if="hasFilters"
                variant="naked"
                size="sm"
                title="Sin resultados con estos filtros"
                :actions="[{ label: 'Limpiar filtros', color: 'neutral', variant: 'outline', onClick: clearFilters }]"
              >
                <template #leading><FiIconBadge icon="i-ph-magnifying-glass" /></template>
              </UEmpty>
              <!-- Hay registros, pero ninguno activo: "Limpiar filtros" no serviría (activas es el default). -->
              <UEmpty
                v-else
                variant="naked"
                size="sm"
                title="No hay instituciones activas"
                :actions="[{ label: 'Ver inactivas', color: 'neutral', variant: 'outline', onClick: showInactive }]"
              >
                <template #leading><FiIconBadge icon="i-ph-archive" /></template>
              </UEmpty>
            </template>
          </UTable>

          <div v-if="data && data.total > PAGE_SIZE" class="flex justify-end">
            <!-- active-color neutral: la página actual no es un segundo primary sólido. -->
            <UPagination v-model:page="page" :total="data.total" :items-per-page="PAGE_SIZE" active-color="neutral" />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

`exportCsv` exporta **con los filtros actuales** y lo dice en el nombre del
archivo y en la confirmación (ver [analytics](analytics.md#exportar-con-alcance-explícito)).

### El modal de crear / editar (≤ 6 campos)

Un solo componente para crear y editar, abierto con `useOverlay`: la página no
guarda estado de modal y el resultado llega como promesa.

```vue
<!-- components/catalogs/InstitutionFormModal.vue -->
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre.'),
  kind: z.enum(['PUBLIC', 'PRIVATE', 'NGO'], { error: 'Elige el tipo.' }),
  emails: z.array(z.email('Revisa este correo.')),
  website: z.union([z.url('Escribe la dirección completa, con https://'), z.literal('')]),
  notes: z.string().max(500, 'Máximo 500 caracteres.'),
})
type InstitutionForm = z.output<typeof schema>

// Sin `institution` crea; con ella edita. Sin `await` en el setup: los datos
// llegan como prop (ver openEdit en la página).
const props = defineProps<{ institution?: InstitutionForm & { id: string } }>()
const emit = defineEmits<{ close: [saved: { id: string, name: string } | false] }>()

const isEdit = computed(() => Boolean(props.institution))

const initial: InstitutionForm = props.institution
  ? { name: props.institution.name, kind: props.institution.kind, emails: [...props.institution.emails], website: props.institution.website, notes: props.institution.notes }
  : { name: '', kind: 'PUBLIC', emails: [], website: '', notes: '' }
const state = reactive<InstitutionForm>(structuredClone(initial))

// Sucio = distinto de lo guardado. No uses `form.dirty` de UForm 4.9: marca
// sucio con cualquier tecla, no vuelve a limpio si el valor regresa al
// original y `clear()` solo borra errores.
const isDirty = computed(() => JSON.stringify(state) !== JSON.stringify(initial))
const confirmingDiscard = ref(false)
const submitError = ref<string | null>(null)
const saving = ref(false)
const form = useTemplateRef('form')

function requestClose() {
  if (isDirty.value) confirmingDiscard.value = true
  else emit('close', false)
}
function keepEditing() {
  confirmingDiscard.value = false
}
function discard() {
  emit('close', false)
}

async function onSubmit(event: FormSubmitEvent<InstitutionForm>) {
  submitError.value = null
  saving.value = true
  try {
    const result = await $fetch<{ id: string, name: string }>(
      isEdit.value ? `/api/catalogs/institutions/${props.institution!.id}` : '/api/catalogs/institutions',
      { method: isEdit.value ? 'PUT' : 'POST', body: event.data },
    )
    emit('close', result) // se cierra solo cuando el servidor confirmó
  } catch (err: any) {
    if (err?.statusCode === 409) {
      // La unicidad la valida el servidor; el error va en el campo.
      form.value?.setErrors([{ name: 'name', message: 'Ya existe una institución con ese nombre.' }])
    } else {
      submitError.value = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo; lo que escribiste se conserva.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- Con cambios, clic fuera o Escape no cierran: preguntan en línea (nunca modal sobre modal). -->
  <UModal
    :title="isEdit ? 'Editar institución' : 'Crear institución'"
    :dismissible="!isDirty"
    @close:prevent="requestClose()"
  >
    <template #body>
      <UForm id="institution-form" ref="form" :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
        <UAlert v-if="submitError" role="alert" color="error" variant="subtle" icon="i-ph-warning-circle" :title="submitError" />

        <UFormField name="name" label="Nombre">
          <UInput v-model="state.name" class="w-full" autofocus />
        </UFormField>
        <UFormField name="kind" label="Tipo">
          <USelect
            v-model="state.kind"
            :items="[{ label: 'Pública', value: 'PUBLIC' }, { label: 'Privada', value: 'PRIVATE' }, { label: 'Organización civil', value: 'NGO' }]"
            class="w-full"
          />
        </UFormField>
        <!-- Chips de entrada: UInputTags, no chips a mano con una x sin nombre (E-24, E-08). -->
        <UFormField name="emails" label="Correos de contacto" hint="(opcional)" description="Escribe un correo y pulsa Enter.">
          <UInputTags v-model="state.emails" class="w-full" />
        </UFormField>
        <UFormField name="website" label="Sitio web" hint="(opcional)">
          <UInput v-model="state.website" type="url" placeholder="https://" class="w-full" />
        </UFormField>
        <UFormField name="notes" label="Notas para quien deriva" hint="(opcional)">
          <UTextarea v-model="state.notes" :rows="3" autoresize class="w-full" />
        </UFormField>
      </UForm>

      <UAlert
        v-if="confirmingDiscard"
        class="mt-5"
        role="alert"
        color="warning"
        variant="subtle"
        icon="i-ph-warning"
        title="Tienes cambios sin guardar"
        :actions="[
          { label: 'Seguir editando', color: 'neutral', variant: 'outline', onClick: keepEditing },
          { label: 'Descartar cambios', color: 'error', variant: 'ghost', onClick: discard },
        ]"
      />
    </template>

    <template #footer>
      <UButton label="Cancelar" color="neutral" variant="outline" @click="requestClose()" />
      <!-- El pie está fuera del <UForm> (se enlaza con form="…"): el estado de
           carga del formulario no le llega, así que lleva su propio :loading. -->
      <UButton
        type="submit"
        form="institution-form"
        :label="isEdit ? 'Guardar cambios' : 'Crear institución'"
        color="primary"
        variant="solid"
        :loading="saving"
      />
    </template>
  </UModal>
</template>
```

### Catálogo jerárquico (categorías → subcategorías)

Un solo `UTable` con filas anidadas, no un árbol aparte más una tabla aparte:

```vue
<UTable
  v-model:expanded="expanded"
  :data="categories"
  :columns="columns"
  :get-sub-rows="(row) => row.subcategories"
  caption="Categorías y subcategorías"
>
  <template #name-cell="{ row }">
    <div class="flex items-center gap-2" :style="{ paddingInlineStart: `${row.depth * 1.5}rem` }">
      <UButton
        v-if="row.getCanExpand()"
        :icon="row.getIsExpanded() ? 'i-ph-caret-down' : 'i-ph-caret-right'"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-expanded="row.getIsExpanded()"
        :aria-label="`${row.getIsExpanded() ? 'Ocultar' : 'Mostrar'} subcategorías de ${row.original.name}`"
        @click="row.toggleExpanded()"
      />
      <span class="font-medium text-highlighted">{{ row.original.name }}</span>
    </div>
  </template>
</UTable>
```

- Al buscar, el servidor devuelve las coincidencias **con sus ancestros** y la
  vista pone `expanded = true`: la jerarquía no desaparece justo cuando se busca
  (inventario, categorías). Nada de aplanar la lista con una banda de aviso.
- La confirmación de eliminar una categoría dice cuántas subcategorías y
  registros arrastra.

### Variante con tarjetas: solo entidades visuales

Si lo que se administra **se ve** (promos con imagen, banners), la colección
puede ser una rejilla de tarjetas. Reglas:

- Tarjeta clicable con enlace estirado y acciones secundarias encima
  (`relative z-10`), ver [patterns.md](../patterns.md#tarjeta-clicable).
- La imagen con la **proporción real** con la que se publica (`aspect-[3/1]` si
  el carrusel es 3:1), `alt=""` porque el título ya nombra la tarjeta.
- Estado con `FiStatusBadge`: "Visible" `success`, "Oculta" `neutral` con
  `icon="i-ph-eye-slash"`, "Vencida" `neutral`. Nunca una barra roja para
  "oculta" (E-04).
- Prioridad u orden: botones "Subir"/"Bajar" siempre visibles con
  `aria-label` y anuncio `aria-live`; el arrastre es una mejora, no el único
  camino (receta en [builder-editor](builder-editor.md#reordenar-con-teclado)).
  Nada de "P1" críptico.
- Nada de `hover:-translate-y-0.5` ni `group-hover:scale-105` sin
  `motion-safe:` (E-28).

### Usuarios y roles (catálogo sensible)

Mismo arquetipo, con dos endurecimientos (C-02, inventario):

- **Cambiar roles o servicios** se hace en un `USlideover` con "Guardar
  cambios" explícito y un resumen de lo que cambia antes de guardar ("Se
  agregará: Coordinación · Se quitará: Recepción"). Nunca se guarda con cada
  cambio de un multiselect.
- **Deshabilitar una cuenta** abre un `ConfirmDialog` que explica la
  consecuencia ("Ana Pérez ya no podrá iniciar sesión; sus citas futuras
  quedan sin asesor"). Nunca un `USwitch` que actúa al instante.
- Selección múltiple y barra de lote: receta de
  [worklist-queue](worklist-queue.md#variante-b-selección-y-acción-en-lote).
  La acción de lote es `neutral outline`, no un tercer sólido (C-29).

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Encabezado, filtros y pestañas finales desde el primer frame; `FiStat :loading`; filas `USkeleton` en el `#loading` de `UTable`. | Nada de spinner de página (C-27). |
| Vacío — primer uso | `UEmpty` en el `#empty`: qué es el catálogo, para qué sirve y "Crear …" en `neutral outline`. | Se decide con `totalAll === 0` del servidor, no con "no hay filas". |
| Vacío — sin resultados | `UEmpty` "Sin resultados con estos filtros" + "Limpiar filtros". | Nunca el vacío de primer uso con filtros activos (C-21). |
| Vacío — solo hay inactivos | `UEmpty` "No hay instituciones activas" + "Ver inactivas". | "Limpiar filtros" no sirve cuando el filtro es el valor por defecto. |
| Error de carga | `UAlert color="error"` con "Reintentar" en el lugar de la tabla. | Nunca "Aún no hay…" cuando la carga falló. |
| Guardando | El botón del pie con `:loading`; el modal sigue abierto. | Se cierra solo cuando el servidor confirmó. |
| Error al guardar | `UAlert` `role="alert"` dentro del modal; unicidad como error del campo. | Lo escrito se conserva. Nunca solo un toast (D-15). |
| En uso (no se puede eliminar) | El diálogo lo explica con la cifra y ofrece "Desactivar". | No se esconde "Eliminar": se explica por qué no. |
| Revalidando | La tabla se queda; solo el botón que lo pidió gira. | — |

## Jerarquía de acciones

1. **"Crear …"** en `FiPageHeader #actions`: el único `primary solid`.
2. **Exportar, Importar, plantillas**: `UDropdownMenu` "Más acciones"
   `neutral outline` en el encabezado.
3. **Fila:** el nombre abre la edición; como máximo **dos** controles visibles
   (`neutral ghost`, `size="sm"`) y el resto en `UDropdownMenu` con
   `aria-label` que nombra la fila. Todo visible sin hover (E-09).
4. **Desactivar/Activar:** inmediato + toast con "Deshacer".
5. **Eliminar:** `color="error"` en el menú (o `error ghost` si es visible),
   siempre con `ConfirmDialog`: título con el nombre, descripción con el
   impacto, botón "Eliminar institución", foco en "Cancelar"
   ([patterns.md](../patterns.md#acciones-destructivas-y-confirmación)).
6. **Pie del modal:** `[Cancelar (neutral outline)] [Crear … / Guardar cambios (primary)]`, a la derecha.
7. **Vacío de primer uso:** la acción en `neutral outline`, porque el
   encabezado ya tiene el sólido (C-29).

## Responsive

- Encabezado: las acciones bajan bajo el título (lo hace `FiPageHeader`).
- Barra de herramientas: en `< sm` búsqueda, pestañas y select apilados a todo
  el ancho; los chips envuelven (`flex-wrap`).
- `UTable` se desplaza en horizontal dentro de su contenedor; el nombre es la
  primera columna. Si hay más de 5 columnas, oculta las secundarias en `< md`
  con `v-model:column-visibility` y `useBreakpoints`.
- Los modales de ≤ 6 campos caben en móvil; si no caben, era un slideover o
  una página.
- Filas de campos en el formulario con `min-w-0` (E-23).

## Accesibilidad

- `caption` en la tabla ("Instituciones del directorio").
- Todo botón de solo ícono con `aria-label` que nombra la fila ("Más acciones
  para Hospital Juárez"). `UTooltip` no da nombre (E-08).
- `UTable` 4.9 no pone `aria-sort`: si una columna es ordenable, el botón del
  encabezado dice el orden en su nombre ("Nombre, orden ascendente. Cambiar
  orden").
- El conteo de resultados es `role="status"`: se anuncia al filtrar.
- Los chips son `UButton` con `aria-label` "Quitar filtro …"; los filtros que
  se combinan son botones con `aria-pressed` dentro de `role="group"`
  ([patterns.md](../patterns.md#filtros-búsqueda-y-chips)).
- El modal tiene `title` (su nombre accesible) y devuelve el foco al disparador
  al cerrar.
- Expandir filas: botón con `aria-expanded` y nombre que dice qué muestra.

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Todas las vistas de catálogo con la misma anatomía: `FiPageHeader` → cifras accionables → barra → `UTable` → modal. | Tres generaciones conviviendo: página CRUD con tabla, encabezado + franja a mano + rejilla de tarjetas, y encabezado dentro de una tarjeta (inventario; E-11). |
| Un solo `primary solid` ("Crear …"). | "Crear" sólido en el encabezado **y** en el vacío, más "Asignar" sólido en la barra de lote (C-29, E-17). |
| `UTabs` `pill` `neutral` para estado; `USelect` con `'all'` para atributos; chips `UButton` quitables. | Cinco implementaciones de chips: `bg-(--ui-primary) text-white`, hover que no cambia nada, sin `aria-pressed` (E-13, C-08); `UBadge @click` como filtro (D-05). |
| Tipo o categoría en `UBadge neutral outline` con ícono. | "Estadístico" en rojo, "Instrumento" en ámbar, "Primer contacto" en verde; "Raíz" y "Pública" en rojo FI (E-04). |
| `UTable` con el estilo de `fiAppConfig`. | `:ui="{ root: 'rounded-xl border-(--ui-border-muted)' }"` en cada vista, o una rejilla de `div` que oculta el encabezado en móvil (E-12, C-15). |
| Eliminar `error` + `ConfirmDialog` con nombre e impacto; si está en uso, ofrecer desactivar. | "Eliminar" en `neutral ghost` en la tarjeta, `error ghost` en el modal y `error soft` en otra vista; borrar una sección con preguntas sin confirmar (E-18). |
| Roles en slideover con "Guardar cambios" y resumen; deshabilitar con confirmación. | Roles que se guardan con cada cambio del multiselect y cuenta deshabilitada con un `USwitch`, sin confirmación ni deshacer (C-02). |
| Ícono solo con `aria-label` que nombra el objeto. | 21 botones de solo ícono sin nombre en categorías y promos, algunos "nombrados" solo con `UTooltip` (E-08). |
| `UFormField` con etiqueta arriba; `UInputTags` para listas de correos. | Campos con placeholder como única etiqueta; chips de correo a mano con clases `pizarra-*` que no generan CSS (E-22, E-24, E-05). |
| Vacío filtrado con "Limpiar filtros". | El vacío completo de "no hay datos" con filtros activos y sin salida (C-21). |
| Skeleton de filas en `UTable`. | Spinner de página completa en la lista de usuarios (C-27). |
| Cifras que filtran la lista. | "Sin contacto: 7" que no se puede pulsar para ver cuáles (inventario, instituciones). |
| Nada de `dark:` en vistas de contenido. | 10 clases `dark:` muertas y una banda `bg-warning-50` a mano en lugar de `UAlert` (inventario; E-26). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/gestion/categorias.vue` y `gestion/promos/index.vue`:
  `DashboardCrudPage` es lo más cercano a la anatomía correcta (cifras + barra
  + `UTable`); lo que sobra es el conmutador árbol/tabla, los `dark:` y las
  cifras que no filtran.
- `app/pages/dashboard/gestion/instituciones.vue`: `deleteNamed` (el
  `aria-label` con el nombre de la fila) es la referencia buena; la franja de
  resumen y los chips a mano se reemplazan.
- `app/pages/dashboard/seguridad/usuarios-programa.vue`: el anti-ejemplo de
  catálogo sensible (roles al vuelo, `USwitch` que deshabilita, rejilla de
  tarjetas para 50+ personas, spinner de página).
- `app/pages/dashboard/gestion/campanas.vue`: encabezado y vacío hechos a mano;
  "Cerrar" una campaña activa de un clic. Con el rediseño: `FiPageHeader`,
  `UTable`, detalle en `USlideover` (URL completa, QR, "Ver resultados") y
  confirmación con cuántas respuestas lleva.
- `DashboardDeleteModal` y `OpenviewsConfirmActionModal` se funden en un solo
  `ConfirmDialog` (C-02).

## Fuentes

- Shopify App Home, *Resource index* (título plural, acción principal, vacío, paginación). https://shopify.dev/docs/api/app-home/latest/patterns/templates/resource-index
- Shopify App Home, *Details* (dos columnas, barra de guardado, confirmar lo destructivo con modal). https://shopify.dev/docs/api/app-home/latest/patterns/templates/details
- Nielsen Norman Group, *Confirmation dialogs* (confirmaciones específicas, botones con verbo, deshacer). https://www.nngroup.com/articles/confirmation-dialog/
- Primer, *Saving* (guardado explícito, conservar datos al fallar). https://primer.style/product/ui-patterns/saving/
- Nuxt UI, *Table* (columnas TanStack, filas anidadas, selección, paginación, `#empty`). https://ui.nuxt.com/docs/components/table
- Nuxt UI, *useOverlay* (modales programáticos que devuelven una promesa). https://ui.nuxt.com/docs/composables/use-overlay
- Ministry of Justice Design System, *Filter a list* (filtros visibles, chips quitables, limpiar). https://design-patterns.service.justice.gov.uk/patterns/filter-a-list/
