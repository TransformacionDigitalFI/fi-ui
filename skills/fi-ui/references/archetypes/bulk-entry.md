# Arquetipo `bulk-entry` — Captura masiva

Registrar **muchas filas parecidas a la vez**: pegarlas desde una hoja de
cálculo (o importar un CSV), revisarlas antes de enviar, validar cada fila y
cada celda, y recibir un resultado **por fila**. Lo que entra se marca como
registrado; lo que falla se queda en la tabla con su motivo para corregirlo y
reenviarlo, sin duplicar lo que ya entró.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** personal que pasa al sistema trabajo hecho fuera de él (en
  PSM: el asesor que atendió en papel y registra sus sesiones pasadas al
  final del semestre; coordinación que pega una lista de cuentas).
- **Tarea:** capturar 10, 50 o 100 registros sin teclearlos uno por uno, y
  saber con certeza cuáles entraron.
- **Éxito:** al terminar, cada fila dice "Registrada" (con enlace) o por qué
  no; reenviar no crea duplicados; nada se descartó en silencio.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Captura por lote de registros homogéneos (sesiones pasadas, una lista de cuentas, una población por semestre). | Un solo registro con consecuencias: es [`internal-task-flow`](internal-task-flow.md). |
| Importar un CSV con mapeo de columnas. | Editar un catálogo fila por fila: es [`catalog-admin`](catalog-admin.md). |
| | Actuar en lote sobre elementos que **ya existen** (cerrar 20 seguimientos): es la barra de lote de [`worklist-queue`](worklist-queue.md). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | Un `UDashboardPanel`; `UDashboardNavbar` con `#left` (`UBreadcrumb`); pie fijo en `#footer`. | Página completa, nunca un modal: hay revisión y corrección. |
| 1 | Encabezado | `FiPageHeader` con la tarea en `title` y la política en `description`. En `#actions`: "Descargar plantilla" (`neutral outline`), si hay CSV. | — |
| 2 | Reglas | `UAlert color="info" variant="subtle"`: ventana de fechas permitida, máximo de filas por envío y **política de éxito parcial**: "Cada fila se registra por separado: las que fallen se quedan para corregirlas". | La política se dice **antes** de enviar. |
| 3 | Valores por defecto | `FiSectionCard title="Valores por defecto"`: los campos que se repiten (servicio, duración). | Se aplican a las filas nuevas y a las que no tienen valor. |
| 4 | Resultado del último envío | `UAlert` (success / warning / error) **arriba de la tabla**, que recibe el foco tras enviar, con acción "Ver filas con error". | Nunca debajo de la tabla, fuera de la pantalla (inventario). |
| 5 | Filas | `FiSectionCard title="Sesiones" :padded="false"` con `#actions`: "Pegar desde hoja de cálculo" (`neutral outline`) y "Agregar fila" (`neutral ghost`). Dentro: `UTabs variant="pill" color="neutral" :content="false"` (Todas · Con error · Registradas, con conteos) y `UTable` editable. | Celdas con `UInput`/`USelect` dentro de `UFormField` (etiqueta `sr-only` + `error` de la celda). Columna de estado con `FiStatusBadge`. |
| 6 | Pie fijo | `#footer` del panel: conteos ("12 listas · 2 con error · 5 registradas", `role="status"`), "Quitar las registradas" (`neutral ghost`) y **"Registrar 12 sesiones"** sólido con `:loading`. | El conteo va en la etiqueta del botón. No se deshabilita para señalar errores: si no hay filas listas, el resumen lo dice. |
| 7 | Pegar | `UModal` con `UFormField` + `UTextarea` (etiqueta y formato esperado), **vista previa** de lo interpretado y de las líneas que no se pudieron leer, y "Agregar 12 filas". | Lo ignorado se dice en el diálogo, línea por línea; no en un toast. |

Importación de CSV con mapeo de columnas (opcional): la misma vista con
`UStepper` (Archivo · Columnas · Revisión · Resultado), `UFileUpload
accept=".csv"` con alternativa de botón, y una tabla de mapeo (columna del
archivo → campo, con `USelect` y valores de muestra).

### Esqueleto

```ts
import type { TableColumn } from '@nuxt/ui'

// Modelo de fila. `rowId` es estable: empata cada resultado del servidor con
// su fila y sirve de clave de idempotencia.
interface BatchRow {
  rowId: string
  account: string
  date: string // 'yyyy-mm-dd'
  time: string // 'hh:mm'
  duration: number
  serviceId: string | null
  note: string
  state: 'pending' | 'done' | 'failed'
  serverError?: string
  createdUrl?: string
}

type Field = 'account' | 'date' | 'time' | 'serviceId'
type RowResult = { rowId: string, ok: true, url: string } | { rowId: string, ok: false, error: string }

const BATCH_MAX = 100
const rows = ref<BatchRow[]>([])
const defaults = reactive({ duration: 50, serviceId: null as string | null }) // tarjeta "Valores por defecto"
const attempted = ref(false) // los errores de celda aparecen tras el primer intento

// Número de fila estable para etiquetas y mensajes, aunque la vista esté filtrada.
const rowNumber = (row: BatchRow) => rows.value.indexOf(row) + 1

const newRow = (partial: Partial<BatchRow> = {}): BatchRow => ({
  rowId: crypto.randomUUID(),
  account: '',
  date: '',
  time: '',
  duration: defaults.duration,
  serviceId: defaults.serviceId,
  note: '',
  state: 'pending',
  ...partial,
})

// Validación local por celda: ayuda a corregir, no sustituye la del servidor.
function fieldErrors(row: BatchRow): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  if (!/^\d{9}$/.test(row.account.trim())) errors.account = 'Escribe los 9 dígitos de la cuenta'
  else if (lookupOf(row.account)?.status === 'missing') errors.account = 'No hay un registro con esa cuenta'
  if (!row.date) errors.date = 'Falta la fecha'
  else if (!isInsideWindow(row.date)) errors.date = 'Fuera de la ventana de registro'
  if (!row.time) errors.time = 'Falta la hora'
  if (!row.serviceId) errors.serviceId = 'Elige el servicio'
  return errors
}

// Duplicados dentro del mismo lote: misma persona y mismo inicio.
const duplicateOf = computed(() => {
  const firstIndex = new Map<string, number>()
  const duplicates = new Map<string, number>() // rowId → número de la fila original
  rows.value.forEach((row, index) => {
    if (row.state === 'done' || !row.account || !row.date || !row.time) return
    const key = `${row.account.trim()}|${row.date}|${row.time}`
    const first = firstIndex.get(key)
    if (first === undefined) firstIndex.set(key, index)
    else duplicates.set(row.rowId, first + 1)
  })
  return duplicates
})

// Solo las pendientes se envían. Una fila que falló vuelve a "pendiente" al
// editarla o con "Reintentar" en su celda de estado (touch).
const isReady = (row: BatchRow) =>
  row.state === 'pending' && Object.keys(fieldErrors(row)).length === 0 && !duplicateOf.value.has(row.rowId)
const hasProblem = (row: BatchRow) => row.state === 'failed' || (row.state === 'pending' && attempted.value && !isReady(row))

const readyRows = computed(() => rows.value.filter(isReady))
const invalidCount = computed(() => rows.value.filter(hasProblem).length)
const doneCount = computed(() => rows.value.filter(row => row.state === 'done').length)

const filter = ref<'all' | 'errors' | 'done'>('all')
const filterTabs = computed(() => [
  { label: 'Todas', value: 'all', badge: { label: String(rows.value.length), color: 'neutral' as const, variant: 'soft' as const } },
  { label: 'Con error', value: 'errors', badge: { label: String(invalidCount.value), color: 'neutral' as const, variant: 'soft' as const } },
  { label: 'Registradas', value: 'done', badge: { label: String(doneCount.value), color: 'neutral' as const, variant: 'soft' as const } },
])
const visibleRows = computed(() => {
  if (filter.value === 'errors') return rows.value.filter(hasProblem)
  if (filter.value === 'done') return rows.value.filter(row => row.state === 'done')
  return rows.value
})

const columns: TableColumn<BatchRow>[] = [
  { id: 'number', header: 'Fila', cell: ({ row }) => rowNumber(row.original), meta: { class: { td: 'tabular-nums text-muted' } } },
  { accessorKey: 'account', header: 'Cuenta' },
  { accessorKey: 'date', header: 'Fecha' },
  { accessorKey: 'time', header: 'Hora' },
  { accessorKey: 'duration', header: 'Duración' },
  { accessorKey: 'serviceId', header: 'Servicio' },
  { accessorKey: 'note', header: 'Nota (opcional)', meta: { class: { td: 'min-w-56' } } },
  { id: 'status', header: 'Estado' },
  { id: 'actions', header: 'Acciones', meta: { class: { th: 'sr-only', td: 'text-right' } } },
]

// Editar una fila que falló (o pulsar "Reintentar") la devuelve a "pendiente".
function touch(row: BatchRow) {
  if (row.state === 'failed') {
    row.state = 'pending'
    row.serverError = undefined
  }
}

const submitting = ref(false)
const summary = ref<{ color: 'success' | 'warning' | 'error', title: string, description?: string } | null>(null)
const summaryBox = useTemplateRef<HTMLElement>('summary-box')

async function submit() {
  attempted.value = true
  if (readyRows.value.length === 0) {
    summary.value = { color: 'error', title: 'No hay filas listas para registrar', description: 'Corrige las filas marcadas con error.' }
    return focusSummary()
  }

  // Las filas registradas nunca se reenvían: reenviar el lote no duplica.
  const batch = readyRows.value.slice(0, BATCH_MAX)
  submitting.value = true
  try {
    const results = await $fetch<RowResult[]>('/api/sesiones/lote', {
      method: 'POST',
      body: batch.map(({ rowId, account, date, time, duration, serviceId, note }) => ({ rowId, account, date, time, duration, serviceId, note })),
    })
    for (const result of results) {
      const row = rows.value.find(candidate => candidate.rowId === result.rowId)
      if (!row) continue
      if (result.ok) Object.assign(row, { state: 'done', createdUrl: result.url, serverError: undefined })
      else Object.assign(row, { state: 'failed', serverError: result.error })
    }
    const done = results.filter(result => result.ok).length
    const failed = results.length - done
    summary.value = failed === 0
      ? { color: 'success', title: `Se registraron ${done} sesiones` }
      // Un éxito parcial no se ve como éxito: dice cuántas faltan y dónde están.
      : { color: 'warning', title: `Se registraron ${done} de ${results.length} sesiones`, description: `${failed} filas no se registraron; siguen en la tabla con su motivo.` }
  } catch {
    // La petición falló entera. Las filas quedan intactas, y como cada una
    // lleva su rowId, reintentar es seguro aunque el servidor sí la hubiera
    // procesado.
    summary.value = { color: 'error', title: 'No se pudo enviar el lote', description: 'Revisa tu conexión e inténtalo de nuevo. Tus filas siguen aquí.' }
  } finally {
    submitting.value = false
    await focusSummary()
  }
}

async function focusSummary() {
  await nextTick()
  summaryBox.value?.focus()
}
```

```vue
<template>
  <UDashboardPanel id="registro-diferido">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Operación', to: '/dashboard/operacion' }, { label: 'Registro diferido' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <FiPageHeader
          title="Registro diferido"
          description="Registra varias sesiones pasadas a la vez. Cada fila se registra por separado: las que fallen se quedan para corregirlas."
        />

        <div v-if="summary" ref="summary-box" tabindex="-1" class="focus:outline-none">
          <UAlert
            :role="summary.color === 'success' ? 'status' : 'alert'"
            :color="summary.color"
            variant="subtle"
            :icon="summary.color === 'success' ? 'i-ph-check-circle' : 'i-ph-warning-circle'"
            :title="summary.title"
            :description="summary.description"
            :actions="summary.color === 'warning' ? [{ label: 'Ver filas con error', color: 'neutral', variant: 'outline', onClick: () => (filter = 'errors') }] : undefined"
          />
        </div>

        <FiSectionCard title="Sesiones" icon="i-ph-rows" :padded="false">
          <template #actions>
            <UButton label="Pegar desde hoja de cálculo" icon="i-ph-clipboard-text" color="neutral" variant="outline" size="sm" @click="isPasteOpen = true;" />
            <UButton label="Agregar fila" icon="i-ph-plus" color="neutral" variant="ghost" size="sm" @click="rows.push(newRow())" />
          </template>

          <UEmpty
            v-if="rows.length === 0"
            variant="naked"
            :actions="[
              { label: 'Pegar desde hoja de cálculo', icon: 'i-ph-clipboard-text', color: 'neutral', variant: 'outline', onClick: () => (isPasteOpen = true) },
              { label: 'Agregar fila', icon: 'i-ph-plus', color: 'neutral', variant: 'ghost', onClick: () => rows.push(newRow()) },
            ]"
          >
            <template #header>
              <FiIconBadge icon="i-ph-rows" />
              <p class="text-sm font-medium text-highlighted">Aún no hay filas</p>
              <p class="text-sm text-muted">Copia las filas de tu hoja de cálculo y pégalas aquí, o agrégalas una por una.</p>
            </template>
          </UEmpty>

          <template v-else>
            <div class="px-4 pt-4 sm:px-5">
              <UTabs v-model="filter" :items="filterTabs" variant="pill" color="neutral" :content="false" size="sm" />
            </div>
            <!-- Dentro de la tarjeta, la tabla va sin su propio borde (no tarjeta sobre tarjeta). -->
            <UTable :data="visibleRows" :columns="columns" caption="Sesiones por registrar" :ui="{ root: 'rounded-none border-0' }" class="mt-4">
              <template #account-cell="{ row }">
                <UFormField
                  :label="`Cuenta, fila ${rowNumber(row.original)}`"
                  :ui="{ label: 'sr-only' }"
                  :error="attempted && row.original.state !== 'done' ? fieldErrors(row.original).account : undefined"
                >
                  <UInput
                    v-model="row.original.account"
                    inputmode="numeric"
                    autocomplete="off"
                    :disabled="row.original.state === 'done'"
                    class="w-36"
                    @update:model-value="touch(row.original)"
                  />
                </UFormField>
                <!-- La persona que corresponde a la cuenta: confirma la identidad sin abrir nada. -->
                <p class="mt-1 text-sm text-muted">{{ nameOf(row.original.account) }}</p>
              </template>

              <!-- …date, time, duration, serviceId, note: misma receta -->

              <template #status-cell="{ row }">
                <FiStatusBadge v-bind="rowStatus(row.original)" size="sm" />
                <p v-if="row.original.serverError" class="mt-1 text-sm text-error">{{ row.original.serverError }}</p>
                <UButton
                  v-if="row.original.state === 'failed'"
                  label="Reintentar"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :aria-label="`Reintentar la fila ${rowNumber(row.original)} en el próximo envío`"
                  @click="touch(row.original)"
                />
                <ULink v-if="row.original.createdUrl" :to="row.original.createdUrl" class="mt-1 block text-sm">Ver sesión</ULink>
              </template>

              <template #actions-cell="{ row }">
                <UButton
                  v-if="row.original.state !== 'done'"
                  icon="i-ph-trash"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Quitar la fila ${rowNumber(row.original)}`"
                  @click="removeRow(row.original.rowId)"
                />
              </template>
            </UTable>
          </template>
        </FiSectionCard>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default bg-elevated px-4 py-3 sm:px-6">
        <p role="status" class="text-sm text-muted tabular-nums">
          {{ readyRows.length }} listas · {{ invalidCount }} con error · {{ doneCount }} registradas
        </p>
        <div class="flex gap-2">
          <UButton v-if="doneCount" label="Quitar las registradas" color="neutral" variant="ghost" @click="clearDone()" />
          <UButton
            :label="`Registrar ${Math.min(readyRows.length, BATCH_MAX)} sesiones`"
            icon="i-ph-check"
            :loading="submitting"
            @click="submit()"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

```ts
// Estado de una fila → FiStatus. "Lista" es informativo; "Con error" y
// "No se registró" son fallos; "Duplicada" pide atención.
import type { FiStatus } from '@fi-unam/ui'

function rowStatus(row: BatchRow): { status: FiStatus, label: string, icon?: string } {
  if (row.state === 'done') return { status: 'success', label: 'Registrada' }
  if (row.state === 'failed') return { status: 'error', label: 'No se registró' }
  const original = duplicateOf.value.get(row.rowId)
  if (original) return { status: 'warning', label: `Duplicada de la fila ${original}`, icon: 'i-ph-copy' }
  if (attempted.value && Object.keys(fieldErrors(row)).length) return { status: 'error', label: 'Con error' }
  return { status: 'info', label: 'Lista', icon: 'i-ph-paper-plane-tilt' }
}
```

### Idempotencia y duplicados

Una captura masiva se reintenta: hay doble clic, conexiones que se cortan y
lotes que se reenvían después de corregir. Reglas:

1. **Cada fila lleva un `rowId` estable** generado en el cliente
   (`crypto.randomUUID()`). El servidor responde por `rowId`, nunca por
   posición. En un sistema nuevo, guárdalo como clave de idempotencia
   (restricción única): reenviar la misma fila devuelve el mismo resultado en
   vez de crear otra.
2. **Las filas registradas se bloquean** (solo lectura, con enlace) y **se
   excluyen** del siguiente envío. "Quitar las registradas" limpia la tabla.
3. **Duplicados dentro del lote** se marcan antes de enviar ("Duplicada de la
   fila 4", `warning`) y no se envían hasta corregirlos o quitarlos.
4. **Duplicados contra lo ya guardado** los detecta el servidor y los
   devuelve como **error de esa fila**, con un motivo que se entiende ("Ya hay
   una sesión de esta persona en ese horario"). Nunca se omiten en silencio
   ni se "arreglan" solos.
5. **El servidor vuelve a validar todo.** La validación local solo ayuda a
   corregir antes.
6. **Las filas son independientes:** una que falla no detiene a las demás. Si
   el efecto depende del orden (p. ej. el estado de un registro cambia con la
   primera sesión), el servidor las procesa en orden cronológico.
7. **Límite por envío** dicho de antemano ("hasta 100 filas"). Si hay más
   listas, el botón dice cuántas se enviarán y el resto espera al siguiente
   envío. Un proceso de 10 s o más lleva `UProgress` con "Registrando 34 de
   100" en `role="status"`.

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Primer uso | `UEmpty` con "Pegar desde hoja de cálculo" y "Agregar fila". | Sin encabezado de tabla vacío (inventario). |
| Interpretando lo pegado | En el diálogo de pegar: "Se reconocieron 12 filas" + lista de líneas ignoradas con su motivo ("Línea 4: falta la fecha"), en `aria-live="polite"`. | Nada se descarta en silencio. |
| Buscando nombres de cuentas | "Buscando…" en la celda; las búsquedas van **por lote y con espera** (una petición para 60 cuentas, no 60). | — |
| Fila con error local | `UFormField :error` en la celda culpable (`aria-invalid` incluido) + `FiStatusBadge` "Con error". | Tras el primer intento de envío; no en filas recién agregadas. |
| Enviando | Botón con `:loading`; las filas no cambian de lugar. | Un doble clic no reenvía (`:loading` y `rowId`). |
| Éxito total | `UAlert color="success" role="status"` arriba; todas las filas "Registrada" con enlace. | — |
| Éxito parcial | `UAlert color="warning" role="alert"` arriba: "Se registraron 12 de 14", con "Ver filas con error". | Nunca se ve como un éxito. |
| Falló el envío entero | `UAlert color="error" role="alert"`: "No se pudo enviar el lote. Tus filas siguen aquí." | Reintentar es seguro por el `rowId`. |
| Nada listo | Al pulsar "Registrar", resumen `error`: "No hay filas listas para registrar". | El botón no se deshabilita para señalar errores. |

## Jerarquía de acciones

1. **"Registrar N sesiones"**: único sólido, en el pie fijo, con el conteo en
   la etiqueta.
2. **"Pegar desde hoja de cálculo"**: `neutral outline` en `#actions` de la
   tarjeta. Es la vía principal de entrada, pero no compite con el envío.
3. **"Agregar fila"**: `neutral ghost`. Nunca un "+" sólido por fila o por
   sección (E-17).
4. **"Quitar fila"**: ícono con `aria-label` que dice qué fila. No pide
   confirmación (la fila aún no existe en el sistema); "Quitar las
   registradas" tampoco (no borra nada guardado).
5. **"Descargar plantilla"** y "Descargar errores" (si hay CSV): `neutral
   outline` en el encabezado o en el resumen.

## Responsive

- `≥ lg`: `UTable` editable dentro de su tarjeta; la tabla se desplaza en
  horizontal **dentro** de su contenedor, nunca la página.
- `< lg`: **una tarjeta por fila** con los mismos campos apilados (etiquetas
  visibles), su `FiStatusBadge` y "Quitar". Una tabla de 60 rem no se usa en
  un teléfono (inventario).
- Filas de campos con `min-w-0` en los hijos de `grid`/`flex`, para que los
  inputs no empujen la tarjeta fuera de la pantalla (E-23).
- El pie fijo envuelve conteos y botones en dos renglones en `< sm`.

## Accesibilidad

- Un solo `h1` (`FiPageHeader`). La tarjeta de filas es `h2`.
- Cada celda editable tiene nombre: `UFormField` con etiqueta `sr-only`
  ("Cuenta, fila 3"). Errores asociados (`aria-invalid`, `aria-describedby`)
  y con texto, nunca solo un fondo rojo de fila.
- El estado de cada fila es `FiStatusBadge` (ícono + texto).
- El resumen recibe el foco tras enviar; los conteos del pie son
  `role="status"`.
- El campo de pegar tiene etiqueta y explica el orden de columnas esperado
  (D-09).
- Enlaces a registros creados en otra pestaña: ícono + `sr-only` "(se abre en
  otra pestaña)", o sin `target="_blank"` (D-32).
- Subir un archivo siempre tiene botón además de arrastrar (WCAG 2.5.7).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Resumen del envío arriba de la tabla, con foco. | Resumen debajo de la tabla, que puede quedar fuera de la pantalla (inventario, registro diferido). |
| Error en la celda culpable (`UFormField :error`). | Errores solo en la columna de estado, sin marcar el campo (inventario). |
| `UEmpty` cuando no hay filas. | El encabezado de la tabla visible sin ninguna fila (inventario). |
| Tarjeta por fila en `< lg`. | Una tabla de `min-w-[60rem]` en el teléfono (inventario). |
| `UTable` con celdas de `UFormField`. | `<table>` escrito a mano que repite las clases del encabezado de la config central y se desfasa cuando esta cambia (D-13). |
| Etiqueta en el campo de pegar. | `textarea` de pegar sin etiqueta (D-09). |
| Líneas ignoradas listadas en el diálogo de pegar. | Un toast "Se omitieron 3 líneas" que no dice cuáles (código de referencia, `notifyWarning` al pegar). |
| "Agregar fila" en `neutral ghost`. | Botones "+" sólidos para agregar filas junto al sólido de guardar (E-17). |
| Filas de campos con `min-w-0`. | Filas de inputs que desbordan en horizontal en el teléfono (E-23). |
| Texto de estado con su token (`text-error`, `FiStatusBadge`). | Estado en `text-(--ui-warning)` (500) sobre blanco (D-06). La captura diferida de PSM ya usaba el paso 700: es la referencia buena. |

## Ejemplo de referencia en PSM

`app/pages/dashboard/operacion/registro-diferido.vue` es la referencia
**del modelo**: cada fila con su `id` de cliente (`crypto.randomUUID()`), el
lote se envía junto pero se registra fila por fila, las filas `done` quedan
deshabilitadas y fuera del siguiente envío, los nombres de las cuentas se
resuelven por lote con espera, y el resumen cuenta registradas, fallidas y
efectos secundarios (citas corregidas, interrupciones resueltas). En el
servidor, `server/application/clinical/operations/late-sessions.ts`
(`registerLateSessionBatch`) procesa en orden cronológico, aísla los fallos
por fila y detecta duplicados contra lo guardado (una sesión de la misma
persona que se cruza en horario responde 409 con un motivo legible). La
ventana de fechas y el máximo por envío (`LATE_SESSION_BATCH_MAX = 100`)
viven en `shared/domain/late-session.ts`, compartidos por cliente y servidor.
Lo que cambia según el inventario: resumen arriba con enlaces a las filas
fallidas, error en la celda, tarjetas en móvil, vista previa de lo pegado y
`UEmpty` sin filas.

## Fuentes

- Carbon Design System, *Import pattern* (subir o explorar, tipos limitados, página o panel cuando hay metadatos). https://carbondesignsystem.com/community/patterns/import-pattern
- Department for Education, *Building a CSV bulk upload feature* (solo CSV, progreso, resumen, éxito parcial, CSV de errores, el resumen confundido con éxito). https://teacher-cpd.design-history.education.gov.uk/ecf-v2/building%20a%20CSV%20bulk%20upload%20feature
- Nielsen Norman Group, *Progress indicators* ("Actualizando 3 de 50"). https://www.nngroup.com/articles/progress-indicators/
- Nuxt UI, *FileUpload*. https://ui.nuxt.com/docs/components/file-upload
