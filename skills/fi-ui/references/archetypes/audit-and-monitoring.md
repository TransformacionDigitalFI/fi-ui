# Arquetipo `audit-and-monitoring` — Auditoría y monitoreo

Supervisión de solo lectura: **quién hizo qué** (bitácora) y **si los
procesos están sanos** (procesos programados, embudo público, rutas lentas).
Primero lo que requiere atención, luego el detalle bajo demanda, y siempre
cuándo se actualizó lo que se ve.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard). El filtro de
> periodo es el componente único descrito en
> [analytics](analytics.md#filtro-de-periodo-un-solo-componente).

## Propósito y usuario

- **Usuario:** coordinación (actividad, asesores) y administración (procesos,
  observabilidad), con permisos de lectura específicos.
- **Tarea:** detectar lo anómalo (un acceso denegado, un historial consultado
  fuera de su servicio, un proceso que dejó de correr), revisarlo con todo su
  contexto y dejar constancia de que se revisó.
- **Éxito:** lo que requiere atención está arriba y completo (no "y 14 más"
  sin forma de verlos), cada evento responde quién, qué, cuándo, dónde y con
  qué resultado, y ningún dato viejo se ve verde.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Bitácora de actividad y accesos, actividad por persona, cobertura. | Despachar elementos que llegan (aceptar, rechazar): es [`worklist-queue`](worklist-queue.md). "Marcar como revisado" no convierte una bitácora en bandeja. |
| Salud de procesos programados, embudo de la recepción pública, rutas lentas o con error. | Cifras del programa por periodo con gráficas: es [`analytics`](analytics.md). |
| | Avisar a quien usa el sitio que algo no funciona (página o `UBanner` de mantenimiento): es [`status-and-error`](status-and-error.md). |

Dos variantes con la misma anatomía:

- **A. Bitácora:** eventos de personas y del sistema, de solo lectura, más
  reciente primero.
- **B. Salud:** una fila por proceso o componente con su estado, última y
  próxima ejecución, e historial bajo demanda.

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar #left` (`UBreadcrumb`: Seguridad › Actividad). | Sin `title` en el navbar. |
| 1 | Encabezado | `FiPageHeader` con `description` "Solo lectura…" y, en salud, el **estado general** en `#badges` (`FiStatusBadge size="lg"`, el peor de los componentes). `#actions`: "Exportar…" `neutral outline`; en salud, "Actualizar" `neutral ghost`. | Sin `primary solid` en reposo: es una vista de lectura. |
| 2 | Frescura | "Datos al mar 7 oct, 18:45" (bitácora) o "Última verificación: hace 30 s" (salud), con `role="status"`, bajo el encabezado. | Siempre visible. Un dato viejo no se pinta verde. |
| 3 | Filtros | `FiSectionCard` sin título (`aria-label`) con el `PeriodFilter` del proyecto y, en `#filters`: persona (`UInputMenu` con búsqueda), acción y resultado (`USelect` con `'all'`). Debajo: chips quitables, conteo `role="status"` y "Limpiar filtros". | La misma tarjeta (`rounded-2xl`) que el resto del dashboard; nada de `rounded-xl border-(--ui-border-muted)` a mano (inventario). Todo en la URL. |
| 4 | Aviso de truncado | `UAlert color="warning" variant="subtle"`: "Se muestran los 5 000 eventos más recientes de 12 431. Acota el periodo o los filtros para ver el resto." | Cuando el servidor corta la consulta. Nunca en silencio. |
| 5 | Requiere atención | **Un** `UAlert color="warning"` (o `error` si algo falló) que dice cuántos y qué, con acción a la lista completa ("Revisar ahora" → pestaña "Por revisar"). | Primero que todo lo demás. Un aviso con lista, no un aviso por elemento ni secciones teñidas a mano (C-17). La lista completa, nunca cortada en 12 con "y n más" (inventario). |
| 6 | Cifras (opcional) | `FiStatGrid` con 3–4 `FiStat`; `tone` solo en las que son estado ("Denegados" `error`, "Por revisar" `warning`, con `to`). | — |
| 7 | Contenido | **A:** `UTabs` "Por revisar (n) · Todos" + `UTable` de eventos. **B:** `UTable` de procesos con `FiStatusBadge`. | `UTable` siempre: ni `<table>` nativa ni filas de `div` (inventario, observabilidad; D-13). |
| 8 | Detalle | `USlideover` con el evento (o las ejecuciones del proceso). | Nunca un modal enorme ni una sección que aparece abajo. |
| 9 | Desgloses (opcional) | `UAccordion` (por persona, cobertura), cada panel con su `UTable`. | Nada de botones a mano que muestran y ocultan sin `aria-expanded` (C-18). |

Ancho: completo del panel (tablas densas, [patterns.md](../patterns.md#responsive)).

### Qué responde cada evento (bitácora)

| Columna | Contenido | Regla |
|---|---|---|
| Fecha | `<time datetime>` absoluta con zona ("mar 7 oct 2026, 18:42"); relativa en el detalle. | `whitespace-nowrap tabular-nums`. Más reciente primero. |
| Persona | Nombre + rol ("Ana Pérez · Coordinación"), o "Sistema". | Nunca un id interno solo. |
| Acción | **Frase legible** armada en el servidor: "cambió el estado de la solicitud S-0142 de «Pendiente» a «Asignada»". El tipo como `UBadge neutral outline` con ícono. | Nunca el código crudo (`LOG_MODIFY`) solo. Tipo = categoría: sin colores de estado (C-19). |
| Recurso | `ULink` al registro, si existe y el rol puede verlo. | — |
| Resultado | `FiStatusBadge`: Permitido `success`, Denegado `error`; "Requiere revisión" `warning` cuando aplica. | Ícono + texto. |
| Detalle | `UButton` `neutral ghost` de solo ícono, `aria-label="Ver detalle del evento de Ana Pérez, 18:42"`. | — |

Reglas de la bitácora:

- **Solo lectura y solo agregar.** Ningún control para editar o borrar
  eventos. "Marcar como revisado" es una anotación sobre el evento, no un
  cambio del evento.
- **Nada sensible en claro:** contraseñas, tokens y contenido clínico no se
  registran ni se muestran; los datos personales, al mínimo y enmascarados
  donde se pueda. Ver la bitácora también queda registrado.
- **Paginación con total** (`UPagination`, servidor), no scroll infinito: una
  auditoría necesita poder citar "página 3 de 12".
- Exportar = CSV de los eventos **con los filtros actuales**, con el alcance
  explícito ([analytics](analytics.md#exportar-con-alcance-explícito)).

### Esqueleto de la bitácora

```vue
<!-- pages/dashboard/seguridad/actividad.vue -->
<script setup lang="ts">
import type { TableColumn, TabsItem } from '@nuxt/ui'
import type { FiStatItem, FiStatus } from '@fi-unam/ui'
import { defaultRange, type PeriodRange } from '~/utils/period'

type Outcome = 'ALLOWED' | 'DENIED'
type EventKind = 'RECORD_VIEW' | 'RECORD_UPDATE' | 'ACCESS_GRANTED' | 'EXPORT' | 'SIGN_IN'

interface AuditEvent {
  id: string
  at: string // ISO con zona
  atLabel: string // "mar 7 oct 2026, 18:42", formateado en la zona de la FI
  actor: { name: string, role: string } | null // null = Sistema
  kind: EventKind
  /** Frase legible armada en el servidor. */
  summary: string
  resource: { label: string, to: string | null }
  outcome: Outcome
  needsReview: boolean
}

interface AuditPage {
  items: AuditEvent[]
  total: number // eventos que se pueden paginar (≤ limit)
  matched: number // eventos que cumplen el filtro; si > limit, se truncó
  limit: number
  toReview: number
  denied: number
  generatedAt: string
}

const OUTCOME: Record<Outcome, { status: FiStatus, label: string, icon: string }> = {
  ALLOWED: { status: 'success', label: 'Permitido', icon: 'i-ph-check-circle' },
  DENIED: { status: 'error', label: 'Denegado', icon: 'i-ph-prohibit' },
}

// El tipo de evento es una CATEGORÍA: neutral con ícono propio (C-19).
const KIND: Record<EventKind, { label: string, icon: string }> = {
  RECORD_VIEW: { label: 'Consulta', icon: 'i-ph-eye' },
  RECORD_UPDATE: { label: 'Cambio', icon: 'i-ph-pencil-simple' },
  ACCESS_GRANTED: { label: 'Permiso', icon: 'i-ph-key' },
  EXPORT: { label: 'Exportación', icon: 'i-ph-download-simple' },
  SIGN_IN: { label: 'Inicio de sesión', icon: 'i-ph-sign-in' },
}

const PAGE_SIZE = 50
const route = useRoute()
const router = useRouter()
const fmt = useFormat()

const fallback = defaultRange()
const from = ref((route.query.desde as string) ?? fallback.from)
const to = ref((route.query.hasta as string) ?? fallback.to)
function applyPeriod(range: PeriodRange) {
  router.replace({ query: { ...route.query, desde: range.from, hasta: range.to, page: undefined } })
}

const view = computed({
  get: () => (route.query.vista === 'por-revisar' ? 'por-revisar' : 'todos'),
  set: (value: string | number) => router.replace({ query: { ...route.query, vista: value === 'todos' ? undefined : String(value), page: undefined } }),
})
const page = computed({
  get: () => Number(route.query.page ?? 1),
  set: (value: number) => router.replace({ query: { ...route.query, page: value > 1 ? String(value) : undefined } }),
})

const { data, status, error, refresh } = useLazyFetch<AuditPage>('/api/audit/events', {
  query: computed(() => ({ ...route.query, pageSize: PAGE_SIZE })),
})
const firstLoad = computed(() => status.value === 'pending' && !data.value)
const truncated = computed(() => Boolean(data.value && data.value.matched > data.value.limit))

const tabs = computed<TabsItem[]>(() => [
  { label: 'Por revisar', value: 'por-revisar', icon: 'i-ph-flag', badge: data.value?.toReview },
  { label: 'Todos los eventos', value: 'todos', icon: 'i-ph-list-bullets' },
])

const stats = computed<FiStatItem[]>(() => [
  { label: 'Eventos en el periodo', value: data.value ? fmt.value.int(data.value.matched) : '—', icon: 'i-ph-list-bullets', loading: firstLoad.value },
  { label: 'Accesos denegados', value: data.value ? fmt.value.int(data.value.denied) : '—', icon: 'i-ph-prohibit', tone: 'error', to: '/dashboard/seguridad/actividad?resultado=DENIED', loading: firstLoad.value },
  { label: 'Por revisar', value: data.value ? fmt.value.int(data.value.toReview) : '—', icon: 'i-ph-flag', tone: 'warning', to: '/dashboard/seguridad/actividad?vista=por-revisar', loading: firstLoad.value },
])

const columns: TableColumn<AuditEvent>[] = [
  { accessorKey: 'atLabel', header: 'Fecha', meta: { class: { td: 'whitespace-nowrap tabular-nums' } } },
  { id: 'actor', header: 'Persona' },
  { accessorKey: 'summary', header: 'Acción', meta: { class: { td: 'min-w-64 max-w-xl' } } }, // texto largo: que corte (C-16)
  { id: 'resource', header: 'Recurso' },
  { accessorKey: 'outcome', header: 'Resultado' },
  { id: 'detail', header: 'Detalle', meta: { class: { th: 'sr-only', td: 'text-right' } } },
]

// Detalle en slideover: se pide al abrir.
const selected = ref<AuditEvent | null>(null)
const isDetailOpen = computed({
  get: () => selected.value !== null,
  set: (open: boolean) => {
    if (!open) selected.value = null
  },
})
</script>

<template>
  <UDashboardPanel id="actividad">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Seguridad', to: '/dashboard/seguridad' }, { label: 'Actividad' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex w-full flex-col gap-6">
        <FiPageHeader title="Actividad" description="Solo lectura. Quién consultó o cambió qué, y con qué resultado.">
          <template #actions>
            <UButton label="Exportar…" icon="i-ph-download-simple" color="neutral" variant="outline" @click="openExport()" />
          </template>
        </FiPageHeader>

        <FiSectionCard aria-label="Filtros de la bitácora">
          <PeriodFilter v-model:from="from" v-model:to="to" :loading="status === 'pending'" @apply="applyPeriod">
            <template #filters>
              <!-- Persona: UInputMenu con búsqueda; acción y resultado: USelect con centinela 'all' -->
            </template>
          </PeriodFilter>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <p role="status" class="text-sm text-muted">
              {{ data ? `${fmt.int(data.matched)} eventos · datos al ${fmt.dateTime(data.generatedAt)}` : '' }}
            </p>
            <!-- chips quitables + "Limpiar filtros": receta de catalog-admin -->
          </div>
        </FiSectionCard>

        <UAlert
          v-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No se pudo cargar la bitácora"
          description="Tus filtros se conservan."
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <template v-else>
          <!-- Truncado: nunca en silencio. -->
          <UAlert
            v-if="truncated"
            color="warning"
            variant="subtle"
            icon="i-ph-scissors"
            :title="`Se muestran los ${fmt.int(data!.limit)} eventos más recientes de ${fmt.int(data!.matched)}`"
            description="Acota el periodo o los filtros para ver el resto."
          />

          <!-- Lo que requiere atención va primero, completo y con salida. -->
          <UAlert
            v-if="data && data.toReview > 0 && view !== 'por-revisar'"
            color="warning"
            variant="subtle"
            icon="i-ph-flag"
            :title="`${fmt.int(data.toReview)} eventos requieren revisión`"
            description="Accesos fuera de horario y consultas a historiales fuera del servicio de quien consulta."
            :actions="[{ label: 'Revisar ahora', color: 'neutral', variant: 'outline', to: '/dashboard/seguridad/actividad?vista=por-revisar' }]"
          />

          <FiStatGrid :stats="stats" :columns="3" />

          <UTabs v-model="view" :items="tabs" :content="false" variant="pill" color="neutral" size="sm" />

          <UTable :data="data?.items ?? []" :columns="columns" :loading="firstLoad" sticky="header" caption="Eventos de la bitácora, más recientes primero">
            <template #atLabel-cell="{ row }">
              <time :datetime="row.original.at">{{ row.original.atLabel }}</time>
            </template>
            <template #actor-cell="{ row }">
              <template v-if="row.original.actor">
                <p class="font-medium text-highlighted">{{ row.original.actor.name }}</p>
                <p class="text-sm text-muted">{{ row.original.actor.role }}</p>
              </template>
              <p v-else class="text-muted">Sistema</p>
            </template>
            <template #summary-cell="{ row }">
              <UBadge :label="KIND[row.original.kind].label" :icon="KIND[row.original.kind].icon" color="neutral" variant="outline" size="sm" />
              <p class="mt-1 text-default">{{ row.original.summary }}</p>
            </template>
            <template #resource-cell="{ row }">
              <ULink v-if="row.original.resource.to" :to="row.original.resource.to" class="text-highlighted hover:underline">{{ row.original.resource.label }}</ULink>
              <span v-else class="text-muted">{{ row.original.resource.label }}</span>
            </template>
            <template #outcome-cell="{ row }">
              <FiStatusBadge v-if="row.original.needsReview" status="warning" label="Requiere revisión" icon="i-ph-flag" />
              <FiStatusBadge v-else v-bind="OUTCOME[row.original.outcome]" />
            </template>
            <template #detail-cell="{ row }">
              <UButton
                icon="i-ph-arrow-square-in"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="`Ver detalle del evento de ${row.original.actor?.name ?? 'Sistema'}, ${row.original.atLabel}`"
                @click="selected = row.original;"
              />
            </template>

            <template #loading>
              <div role="status" class="space-y-3 px-4">
                <span class="sr-only">Cargando eventos…</span>
                <USkeleton v-for="n in 8" :key="n" class="h-10 w-full" aria-hidden="true" />
              </div>
            </template>
            <template #empty>
              <UEmpty
                v-if="view === 'por-revisar'"
                variant="naked"
                size="sm"
                title="Nada por revisar"
                description="Los eventos marcados para revisión aparecerán aquí."
              >
                <template #leading><FiIconBadge icon="i-ph-check-circle" tone="success" /></template>
              </UEmpty>
              <UEmpty
                v-else
                variant="naked"
                size="sm"
                title="Sin eventos con estos filtros"
                :actions="[{ label: 'Limpiar filtros', color: 'neutral', variant: 'outline', onClick: () => router.replace({ query: {} }) }]"
              >
                <template #leading><FiIconBadge icon="i-ph-magnifying-glass" /></template>
              </UEmpty>
            </template>
          </UTable>

          <div v-if="data && data.total > PAGE_SIZE" class="flex justify-end">
            <UPagination v-model:page="page" :total="data.total" :items-per-page="PAGE_SIZE" active-color="neutral" />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>

  <AuditEventSlideover v-model:open="isDetailOpen" :event="selected" />
</template>
```

En la pestaña "Por revisar", la tabla suma la columna de selección y la barra
de lote "Marcar como revisados (n)" de
[worklist-queue](worklist-queue.md#variante-b-selección-y-acción-en-lote).
Marcar como revisado es reversible: actúa ya y ofrece "Deshacer" en el toast.
Esa acción de lote es el único `primary solid` de la vista.

### Detalle de un evento

```vue
<!-- components/audit/AuditEventSlideover.vue (cuerpo) -->
<USlideover v-model:open="open" :title="event?.summary ?? 'Evento'" :description="event?.atLabel">
  <template #body>
    <div v-if="pending" role="status" class="space-y-3">
      <span class="sr-only">Cargando el evento…</span>
      <USkeleton v-for="n in 5" :key="n" class="h-6 w-full" aria-hidden="true" />
    </div>

    <template v-else-if="detail">
      <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
        <dt class="fi-label">Quién</dt>
        <dd class="text-default">{{ detail.actor ? `${detail.actor.name} · ${detail.actor.role}` : 'Sistema' }}</dd>
        <dt class="fi-label">Cuándo</dt>
        <dd class="text-default"><time :datetime="detail.at">{{ detail.atLabel }}</time> · {{ detail.atRelative }}</dd>
        <dt class="fi-label">Resultado</dt>
        <dd><FiStatusBadge v-bind="OUTCOME[detail.outcome]" /></dd>
        <dt class="fi-label">Origen</dt>
        <dd class="font-mono text-sm text-default">{{ detail.ip }} · {{ detail.device }}</dd>
        <dt class="fi-label">Id de correlación</dt>
        <dd class="break-all font-mono text-sm text-default">{{ detail.correlationId }}</dd>
      </dl>

      <!-- Antes / Después con texto, no solo rojo y verde. -->
      <h3 class="mt-6 text-base font-semibold text-highlighted">Cambios</h3>
      <UTable
        class="mt-2"
        :data="detail.changes"
        :columns="[
          { accessorKey: 'field', header: 'Campo' },
          { accessorKey: 'before', header: 'Antes', meta: { class: { td: 'font-mono text-sm' } } },
          { accessorKey: 'after', header: 'Después', meta: { class: { td: 'font-mono text-sm' } } },
        ]"
        caption="Valores antes y después del cambio"
      />

      <!-- Datos técnicos plegados por defecto (los secretos ya vienen enmascarados del servidor). -->
      <UCollapsible class="mt-6">
        <UButton label="Datos técnicos (JSON)" trailing-icon="i-ph-caret-down" color="neutral" variant="ghost" size="sm" />
        <template #content>
          <pre class="mt-2 overflow-x-auto rounded-xl bg-muted p-4 font-mono text-sm text-default">{{ detail.rawJson }}</pre>
        </template>
      </UCollapsible>
    </template>
  </template>
</USlideover>
```

### Salud de procesos

Vocabulario fijo, una tabla para todo el proyecto:

| Estado | `FiStatus` | Ícono | Significa |
|---|---|---|---|
| Operativo | `success` | `i-ph-check-circle` | Corrió a tiempo y sin errores. |
| Degradado | `warning` | `i-ph-warning` | Corrió, pero lento o con errores parciales. |
| Sin verificar | `warning` | `i-ph-question` | La última verificación es más vieja que dos intervalos. **Nunca verde.** |
| Falló | `error` | `i-ph-x-circle` | La última ejecución falló o no corrió cuando debía. |
| En pausa | `neutral` | `i-ph-pause-circle` | Detenido a propósito (vacaciones, mantenimiento programado). |

```ts
import type { FiStatus } from '@fi-unam/ui'

type Health = 'OK' | 'DEGRADED' | 'STALE' | 'FAILING' | 'PAUSED'

// `rank` ordena la gravedad: el estado general es el peor de los procesos.
const HEALTH: Record<Health, { status: FiStatus, label: string, icon: string, rank: number }> = {
  OK: { status: 'success', label: 'Operativo', icon: 'i-ph-check-circle', rank: 0 },
  PAUSED: { status: 'neutral', label: 'En pausa', icon: 'i-ph-pause-circle', rank: 1 },
  STALE: { status: 'warning', label: 'Sin verificar', icon: 'i-ph-question', rank: 2 },
  DEGRADED: { status: 'warning', label: 'Degradado', icon: 'i-ph-warning', rank: 3 },
  FAILING: { status: 'error', label: 'Falló', icon: 'i-ph-x-circle', rank: 4 },
}

interface ProcessRow {
  id: string
  name: string // nombre de cara a la persona: "Recordatorios de citas", no "cron-reminders"
  purpose: string // "Envía el correo de recordatorio un día antes de cada cita"
  health: Health // STALE lo decide el SERVIDOR con la hora de la última verificación
  lastRun: { atLabel: string, at: string, durationLabel: string } | null
  nextRunLabel: string | null
}

const overall = computed<Health>(() =>
  (data.value?.processes ?? []).reduce<Health>((worst, p) => (HEALTH[p.health].rank > HEALTH[worst].rank ? p.health : worst), 'OK'),
)
// Requieren atención: lo que no está operativo ni en pausa, del más grave al menos.
const attention = computed(() =>
  (data.value?.processes ?? [])
    .filter(p => HEALTH[p.health].rank >= 2)
    .sort((a, b) => HEALTH[b.health].rank - HEALTH[a.health].rank),
)
```

```vue
<FiPageHeader title="Procesos programados" description="Tareas automáticas del sistema. Solo lectura.">
  <template v-if="data" #badges>
    <FiStatusBadge v-bind="HEALTH[overall]" size="lg" />
  </template>
  <template #actions>
    <UButton label="Actualizar" icon="i-ph-arrow-clockwise" color="neutral" variant="ghost" :loading="status === 'pending'" @click="refresh()" />
  </template>
</FiPageHeader>
<p v-if="data" role="status" class="text-sm text-muted">
  Última verificación: <time :datetime="data.checkedAt">{{ fmt.dateTime(data.checkedAt) }}</time>
</p>

<!-- Un aviso con la lista, no un aviso por proceso. -->
<UAlert
  v-if="attention.length"
  :color="attention.some(p => p.health === 'FAILING') ? 'error' : 'warning'"
  variant="subtle"
  icon="i-ph-warning"
  :title="`${attention.length} ${attention.length === 1 ? 'proceso requiere' : 'procesos requieren'} atención`"
>
  <template #description>
    <ul class="mt-1 list-disc ps-5">
      <li v-for="p in attention" :key="p.id">
        <span class="font-medium">{{ p.name }}</span>: {{ HEALTH[p.health].label.toLowerCase() }}{{ p.lastRun ? ` · última ejecución ${p.lastRun.atLabel}` : ' · nunca ha corrido' }}
      </li>
    </ul>
  </template>
</UAlert>

<UTable :data="data?.processes ?? []" :columns="processColumns" caption="Procesos programados y su estado">
  <template #name-cell="{ row }">
    <p class="font-medium text-highlighted">{{ row.original.name }}</p>
    <p class="text-sm text-muted">{{ row.original.purpose }}</p>
  </template>
  <template #health-cell="{ row }">
    <FiStatusBadge v-bind="HEALTH[row.original.health]" />
  </template>
  <template #actions-cell="{ row }">
    <UButton label="Ver ejecuciones" color="neutral" variant="ghost" size="sm" :aria-label="`Ver ejecuciones de ${row.original.name}`" @click="openRuns(row.original)" />
  </template>
</UTable>
```

Las ejecuciones de un proceso abren en `USlideover` con un `UTable`: inicio
(`whitespace-nowrap tabular-nums`), duración (a la derecha, `tabular-nums`),
resultado (`FiStatusBadge`) y mensaje (que corte, `min-w-56`; el
`whitespace-nowrap` global de `td` ya no existe, C-16).

Otras superficies de salud:

- **Embudo** (recepción pública): barras horizontales con la caída entre pasos
  en texto ("−32 % entre «Datos» y «Motivo»"), no cifras sueltas
  (inventario, observabilidad). Receta de barras en [data-viz.md](../data-viz.md).
- **Rutas lentas o con error:** `UTable` ordenable (ruta, peticiones, p95 en
  ms a la derecha, tasa de error) con el umbral como `FiStatusBadge`
  ("Lenta" `warning` > 1 s, "Muy lenta" `error` > 3 s), nunca solo el número
  en rojo.
- **Señales técnicas** (latencia, tráfico, errores, saturación) solo para
  administración, como `ChartCard` de [analytics](analytics.md#chartcard-una-sección-de-gráfica).

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Encabezado y filtros finales; `FiStat :loading`; filas `USkeleton` en el `#loading` de `UTable`. | — |
| Error de carga | `UAlert color="error"` con "Reintentar" en lugar de cifras y tabla. | En salud, el estado general **no** se muestra (ni verde ni rojo): no se sabe. |
| Truncado | `UAlert color="warning"` con cuántos se muestran de cuántos y cómo acotar. | Siempre que el servidor corte. |
| Requiere atención | Un `UAlert` arriba con la lista y la salida a la lista completa. | Completo; nunca "y 14 más" sin enlace. |
| Nada por revisar | `UEmpty` "Nada por revisar" con `FiIconBadge tone="success"`. | Es buena noticia: sin rojo. |
| Sin resultados | `UEmpty` "Sin eventos con estos filtros" + "Limpiar filtros". | Distinto de "nada por revisar" (C-21). |
| Dato viejo (salud) | "Sin verificar" `warning` en el proceso; la frescura en el encabezado. | Un dato viejo nunca se pinta verde. |
| Revalidando | La tabla se queda; "Actualizar" o "Aplicar" giran. | Nada de auto-refresco que mueva las filas bajo el cursor. |

## Jerarquía de acciones

1. **En reposo, ningún `primary solid`:** es lectura. "Exportar…" `neutral
   outline`; "Actualizar" `neutral ghost`.
2. **Revisar:** "Revisar ahora" (`neutral outline`) en el aviso de atención
   lleva a la pestaña "Por revisar"; ahí, con selección, "Marcar como
   revisados (n)" es el único sólido. Reversible con "Deshacer".
3. **Por fila:** como máximo "Ver detalle" (ícono con nombre) y un enlace al
   recurso. Nada de editar o borrar eventos.
4. **Desde una persona** (actividad de asesores): la fila enlaza a la bitácora
   filtrada por esa persona (`/seguridad/actividad?persona=…`), y en
   "inactivos" la acción directa es "Escribirle" (`mailto:` con nombre
   propio), no solo un listado (inventario, asesores).
5. **Exportar** siempre con el alcance a la vista y registrada.

## Responsive

- Ancho completo; la tabla se desplaza dentro de su contenedor y la fecha es
  la primera columna.
- Filtros: rangos rápidos y fechas apilados en móvil; filtros extra en un
  `UDrawer` "Filtros (2)" debajo de `sm`.
- El detalle en `USlideover` ocupa la pantalla en móvil.
- `FiStatGrid` apila solo. El estado general (salud) queda junto al título en
  todos los tamaños.

## Accesibilidad

- Un solo `h1`; el detalle usa `h3` dentro del slideover (su título es el
  nombre del diálogo).
- `caption` en cada tabla; `<time datetime>` en cada fecha.
- Estado y resultado siempre con `FiStatusBadge` (ícono + texto); los cambios
  "antes/después" con encabezados de texto, no solo rojo y verde.
- Frescura y conteos con `role="status"`; actualizaciones de datos nunca con
  `role="alert"`.
- Paneles plegables con `UAccordion`/`UCollapsible` (dan `aria-expanded`);
  nada de botones a mano con solo un caret como pista (C-18).
- Botón de detalle con nombre que identifica el evento ("Ver detalle del
  evento de Ana Pérez, 18:42").
- Ids y JSON en `font-mono` con `break-all`/`overflow-x-auto` para que no
  rompan el reflujo a 320 px.

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Un `PeriodFilter` en todas las vistas de supervisión. | Procesos rehace el filtro (rangos sólido/outline + fechas + "Consultar") y usa claves i18n de la pantalla de accesos (C-31, inventario). |
| `UTable` en todas las tablas. | Tabla de rutas como `<table>` nativa que no se ordena (inventario, observabilidad; C-15). |
| Un `UAlert` de atención con la lista completa y salida. | Secciones de advertencia a mano con `bg-(--ui-color-warning-50)`, borde 200/300 y `dark:` en cada vista (C-17). |
| La lista de pendientes completa en su pestaña. | Atención cortada en 12 con "y n más" sin forma de ver el resto; inactivos cortados en 10 sin acción (inventario). |
| Tipo de evento neutral con ícono; resultado con estado. | `ACCESS_GRANTED` en ámbar, `APPOINTMENT` en rojo FI, `SESSION` en verde; "concedido" en verde en una vista y ámbar en otra (C-19). |
| `UAccordion` para desgloses. | "Actividad por persona" y "Alcance" con botones a mano sin `aria-expanded` (C-18). |
| Texto largo que corta en la tabla. | Detalle, rastro y mensajes de error en una sola línea que obliga a desplazar la tabla (C-16). |
| Tarjeta de filtros `FiSectionCard` (`rounded-2xl`). | `rounded-xl border-(--ui-border-muted)` en actividad y procesos, `rounded-2xl` en el resto (inventario). |
| Embudo como barras con la caída en texto. | El embudo como cifras sueltas (inventario, observabilidad). |
| Nombre de proceso de cara a la persona. | Nombres internos o códigos crudos en la tabla de procesos. |
| Estado "Sin verificar" cuando el dato es viejo. | Una verificación de hace horas mostrada en verde. |

## Ejemplo de referencia en PSM

Es la familia más consistente del dashboard: `DashboardPageHeader` → tarjeta
de filtros con `DashboardPeriodFilter` → skeleton → aviso de truncado →
cifras → atención → tablas.

- `app/pages/dashboard/seguridad/actividad.vue`: el `UAlert` de truncado es la
  referencia buena; la lista de atención cortada en 12, el filtro de cuenta en
  texto libre y los colapsables a mano son lo que se cambia (pestaña "Por
  revisar (n)", marcado masivo, `UAccordion`, detalle en `USlideover`).
- `app/pages/dashboard/seguridad/asesores.vue`: cada fila debe llevar a la
  actividad filtrada de esa persona; "Escribirle" en inactivos.
- `app/pages/dashboard/seguridad/procesos.vue`: pasar a una fila por proceso
  con estado en texto, última y próxima ejecución, y "Ver ejecuciones" en
  slideover; usar el filtro común.
- `app/pages/dashboard/seguridad/observabilidad.vue`: embudo como gráfica y
  `UTable` ordenable con umbrales en `FiStatusBadge`.

## Fuentes

- OWASP, *Logging Cheat Sheet* (qué registrar: cuándo, dónde, quién, qué; qué excluir o enmascarar). https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Nielsen Norman Group, *Data tables* (filtros, identificadores legibles, panel lateral para el detalle). https://www.nngroup.com/articles/data-tables/
- Carbon Design System, *Data table* (densidad, barra de herramientas, paginación). https://carbondesignsystem.com/components/data-table/usage/
- Atlassian Statuspage, *Component status* (operativo, degradado, interrupción, mantenimiento). https://support.atlassian.com/statuspage/docs/what-is-a-component
- Google SRE Book, *Monitoring distributed systems* (cuatro señales doradas, alertar por síntomas). https://sre.google/sre-book/monitoring-distributed-systems/
- Primer, *Degraded experiences* (lo no disponible nunca se muestra como vacío). https://primer.style/product/ui-patterns/degraded-experiences/
- Carbon Design System, *Status indicator pattern* (forma + color + texto, ≤ 5–6 indicadores). https://carbondesignsystem.com/patterns/status-indicator-pattern/
