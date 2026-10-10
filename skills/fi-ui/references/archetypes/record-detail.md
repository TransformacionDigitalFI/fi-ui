# Arquetipo `record-detail` — Detalle de registro (vista 360)

Todo lo de una persona (o de un grupo) en un lugar, para entender su contexto
y actuar: identidad y estado arriba, **una** acción principal y el resto en
"Más acciones", unas pocas cifras que importan, un resumen siempre a la vista
con lo crítico (contactos, malestares activos, próxima cita), y el historial,
las notas y los datos en pestañas.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** personal que acompaña a la persona (en PSM: asesores; para
  grupos, quien facilita).
- **Tarea:** ponerse en contexto antes o después de una atención y tomar la
  siguiente acción (agendar, iniciar atención, derivar, concluir).
- **Éxito:** en el primer viewport se ve quién es, en qué estado está, si hay
  algo crítico (una alerta, un seguimiento pendiente, la próxima cita) y cuál
  es la siguiente acción; lo demás está a una pestaña.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| El historial completo de una persona o un grupo. | Trabajar **durante** una atención: es [`live-session`](live-session.md), con un contexto compacto. |
| El destino de un resultado de búsqueda o de un elemento de una bandeja. | Editar varios pasos con consecuencias: es [`internal-task-flow`](internal-task-flow.md), lanzado desde aquí. |
| | Configurar un objeto (perfil, ajustes): es [`settings`](settings.md). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar` con `#left`: `UBreadcrumb` (Historiales › Ana Pérez). | La miga con el nombre queda visible aunque se desplace la vista. |
| 1 | Identidad | `FiPageHeader back="/ruta-del-buscador"`: nombre en `title`; identificadores humanos y responsable en `description` ("422012345 · Ingeniería en Computación · Responsable: Luis M."); `#badges`: `FiStatusBadge` del estatus + señales críticas (ícono + texto). | Nunca un UUID visible como identificador. |
| 2 | Acciones | `FiPageHeader #actions`: **un** `UButton` sólido según el estatus ("Iniciar atención", "Agendar cita") y `UDropdownMenu` "Más acciones" (`neutral outline`) agrupado: Atención · Derivación · Cierre. | Mismo modelo de acciones que el buscador (`useRecordActions`). Nada de siete botones del mismo peso (D-23). |
| 3 | Alertas | `UAlert` persistente por cada alerta vigente que pide acción (seguimiento pendiente, interrupción del acompañamiento), con su acción. | Nunca solo un toast. Las alertas del caso tienen ícono y texto propios, distintos de un error del sistema. |
| 4 | Cifras | `FiStatGrid :columns="4"`: sesiones, última atención, próxima cita, malestares activos. | Cifras que informan una decisión. Los conteos de sección van en el `badge` de su pestaña, no en tarjetas. |
| 5 | Resumen (aside) | `<aside aria-label="Resumen">` con `FiSectionCard`: contactos de emergencia (enlaces `tel:`), malestares activos (`UBadge color="neutral" variant="subtle"`), próxima cita, responsable. | En `lg` va a la derecha y fijo (`lg:sticky lg:top-0`); en móvil va **antes** de las pestañas. |
| 6 | Secciones | `UTabs variant="link" color="primary"`: Historial · Notas · Datos · Cuestionarios · Documentos (≤ 6, 1–2 palabras, conteo en `badge`). La pestaña activa en la URL (`?tab=notas`). | `UTabs` real: nada de `role="tab"` sin `tabpanel` (D-10). |
| 7 | Historial | Filtro por tipo (`UButton` con `aria-pressed` en `role="group"`) + `UTimeline color="neutral"`, más reciente primero, con un `<button>` estirado en `#title` y `<time>` en `#date`. El detalle de un evento abre en `USlideover`. | `@select` de `UTimeline` no funciona con teclado en 4.9 (D-M1): no lo uses. |
| 8 | Notas | Lista, más reciente primero, con autor y fecha; "Agregar nota" (`neutral outline size="sm"`) en `#actions` de la sección; edición en `USlideover`. | — |
| 9 | Datos | `FiSectionCard` por grupo (Contacto, Académico, Contactos de emergencia) con "Editar" en `#actions`; edición en línea con pie `[Cancelar] [Guardar cambios]` a la derecha, o en `USlideover`. | Una sola receta de encabezado de sección para todas (D-16). |
| 10 | Zona de riesgo | Al final de "Datos": `FiSectionCard title="Zona de riesgo"` (la misma receta que en [settings](settings.md)) con "Eliminar grupo" `color="error" variant="outline"` → `ConfirmDialog`. | Lo destructivo no vive junto a las acciones de uso diario (inventario, grupos). |

### Un solo modelo de acciones (buscador y detalle)

```ts
// composables/useRecordActions.ts — qué se puede hacer con un registro según
// su estatus y los permisos. Lo usan la fila del buscador y el encabezado del
// detalle, así ofrecen siempre lo mismo (D-23).
import type { ButtonProps, DropdownMenuItem } from '@nuxt/ui'
import type { RecordStatus } from '~/utils/presenters/record-status'

interface ActionableRecord { id: string, status: RecordStatus, canAccess: boolean }

export function useRecordActions() {
  const { can } = usePermissions()

  function actionsFor(record: ActionableRecord): { primary: ButtonProps | null, menu: DropdownMenuItem[][] } {
    if (!record.canAccess) {
      return { primary: { label: 'Solicitar acceso', icon: 'i-ph-key', onClick: () => requestAccess(record.id) }, menu: [] }
    }

    // La acción principal depende del estatus: la siguiente cosa que toca.
    const primary: ButtonProps | null
      = record.status === 'ACTIVE' ? { label: 'Iniciar atención', icon: 'i-ph-play', onClick: () => startSession(record.id) }
        : record.status === 'WAITING' ? { label: 'Agendar cita', icon: 'i-ph-calendar-plus', onClick: () => schedule(record.id) }
          : null

    const menu: DropdownMenuItem[][] = [
      [
        { type: 'label', label: 'Atención' },
        // Lo urgente del dominio va primero, con color e ícono propios.
        { label: 'Atención de emergencia', icon: 'i-ph-first-aid-kit', color: 'error', onSelect: () => emergency(record.id) },
        { label: 'Registrar sesión diferida', icon: 'i-ph-clock-counter-clockwise', onSelect: () => lateSession(record.id) },
      ],
      [
        { type: 'label', label: 'Derivación' },
        { label: 'Derivación interna', icon: 'i-ph-arrows-left-right', onSelect: () => internalReferral(record.id) },
        { label: 'Canalización externa', icon: 'i-ph-buildings', to: `/dashboard/cedulas/${record.id}/canalizacion-externa` },
      ],
      [
        { type: 'label', label: 'Cierre' },
        // Concluir no es destructivo pero cierra el caso: confirma con resumen.
        { label: 'Concluir acompañamiento', icon: 'i-ph-flag-checkered', onSelect: () => conclude(record.id) },
      ],
    ]

    // Lo que el rol no puede hacer no aparece (no se deshabilita).
    return {
      primary,
      menu: menu
        .map(group => group.filter(item => item.type === 'label' || can(item.permission ?? 'operations:use')))
        .filter(group => group.some(item => item.type !== 'label')),
    }
  }

  return { actionsFor }
}
```

### Esqueleto

```vue
<!-- pages/dashboard/cedulas/[id]/index.vue -->
<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { RECORD_STATUS_TONE } from '~/utils/presenters/record-status'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: record, status, error, refresh } = useLazyFetch<RecordView>(() => `/api/historiales/${id.value}`)
const firstLoad = computed(() => status.value === 'pending' && !record.value)

// La pestaña activa vive en la URL: recargar o compartir conserva la sección.
const tab = computed({
  get: () => (route.query.tab as string) ?? 'historial',
  set: (value: string | number) => router.replace({ query: { ...route.query, tab: String(value) } }),
})

const count = (n?: number) => ({ label: String(n ?? 0), color: 'neutral' as const, variant: 'soft' as const })
const tabs = computed<TabsItem[]>(() => [
  { label: 'Historial', value: 'historial', slot: 'historial' },
  { label: 'Notas', value: 'notas', slot: 'notas', badge: count(record.value?.counts.notes) },
  { label: 'Datos', value: 'datos', slot: 'datos' },
  { label: 'Cuestionarios', value: 'cuestionarios', slot: 'cuestionarios', badge: count(record.value?.counts.questionnaires) },
  { label: 'Documentos', value: 'documentos', slot: 'documentos' },
])

const { actionsFor } = useRecordActions()
const actions = computed(() => (record.value ? actionsFor(record.value) : null))
const fmt = useFormat() // data-viz.md → Formato de números: el valor de FiStat llega formateado
</script>

<template>
  <UDashboardPanel id="historial-detalle">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Historiales', to: '/dashboard/cedulas/buscar' }, { label: record?.name ?? 'Historial' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <FiPageHeader
          back="/dashboard/cedulas/buscar"
          :title="record?.name ?? 'Historial'"
          :description="record ? `${record.accountNumber} · ${record.program} · Responsable: ${record.counsellor}` : undefined"
          :description-loading="firstLoad"
        >
          <template #badges>
            <FiStatusBadge v-if="record" :status="RECORD_STATUS_TONE[record.status]" :label="record.statusLabel" />
            <!-- Señales del caso: ícono y texto propios, distintos de un error del sistema. -->
            <FiStatusBadge v-for="flag in record?.flags ?? []" :key="flag.id" status="warning" :icon="flag.icon" :label="flag.label" />
          </template>

          <template v-if="actions" #actions>
            <UButton v-if="actions.primary" v-bind="actions.primary" />
            <UDropdownMenu v-if="actions.menu.length" :items="actions.menu" :content="{ align: 'end' }">
              <UButton label="Más acciones" icon="i-ph-dots-three" trailing-icon="i-ph-caret-down" color="neutral" variant="outline" />
            </UDropdownMenu>
          </template>
        </FiPageHeader>

        <UAlert
          v-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No pudimos abrir este historial"
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <template v-else>
          <UAlert
            v-for="alert in record?.alerts ?? []"
            :key="alert.id"
            color="warning"
            variant="subtle"
            :icon="alert.icon"
            :title="alert.title"
            :description="alert.description"
            :actions="alert.action ? [{ ...alert.action, color: 'neutral', variant: 'outline' }] : undefined"
          />

          <FiStatGrid
            :columns="4"
            :loading="firstLoad"
            :stats="[
              { label: 'Sesiones', value: fmt.int(record?.counts.sessions ?? 0), icon: 'i-ph-chats-circle' },
              { label: 'Última atención', value: record?.lastSessionLabel ?? '—', icon: 'i-ph-calendar-check' },
              { label: 'Próxima cita', value: record?.nextAppointmentLabel ?? 'Sin cita', icon: 'i-ph-calendar-blank' },
              { label: 'Malestares activos', value: fmt.int(record?.counts.activeConcerns ?? 0), icon: 'i-ph-cloud' },
            ]"
          />

          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <!-- El resumen va primero en el DOM (en móvil se lee antes) y en lg se
                 coloca a la derecha, fijo mientras se desplaza la columna principal. -->
            <aside aria-label="Resumen" class="flex flex-col gap-4 lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:self-start">
              <FiSectionCard title="Contactos de emergencia" icon="i-ph-phone">
                <ul class="divide-y divide-default">
                  <li v-for="contact in record?.emergencyContacts ?? []" :key="contact.id" class="py-2">
                    <p class="font-medium text-highlighted">{{ contact.name }} <span class="text-sm text-muted">· {{ contact.relation }}</span></p>
                    <ULink :href="`tel:${contact.phone}`" class="text-sm tabular-nums">{{ contact.phone }}</ULink>
                  </li>
                </ul>
              </FiSectionCard>

              <FiSectionCard title="Malestares activos" icon="i-ph-cloud">
                <div class="flex flex-wrap gap-1.5">
                  <UBadge v-for="concern in record?.activeConcerns ?? []" :key="concern.id" :label="concern.name" color="neutral" variant="subtle" />
                </div>
              </FiSectionCard>
            </aside>

            <div class="min-w-0 lg:col-start-1 lg:row-start-1">
              <UTabs v-model="tab" :items="tabs" variant="link" color="primary">
                <template #historial><RecordTimeline :record-id="id" /></template>
                <template #notas><RecordNotes :record-id="id" /></template>
                <template #datos><RecordData :record="record" /></template>
                <template #cuestionarios><RecordQuestionnaires :record-id="id" /></template>
                <template #documentos><RecordDocuments :record-id="id" /></template>
              </UTabs>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

### Historial accesible por teclado

```vue
<!-- components/RecordTimeline.vue (fragmento) -->
<script setup lang="ts">
import type { TimelineItem } from '@nuxt/ui'

type EventKind = 'session' | 'appointment' | 'referral' | 'concern' | 'note'

// Tipo de evento = categoría: ícono propio e indicador neutro. Nunca un color
// de estado por tipo (D-03), nunca ícono blanco sobre un -500 (D-M2).
const KIND: Record<EventKind, { label: string, icon: string }> = {
  session: { label: 'Sesión', icon: 'i-ph-chats-circle' },
  appointment: { label: 'Cita', icon: 'i-ph-calendar-blank' },
  referral: { label: 'Derivación', icon: 'i-ph-arrows-left-right' },
  concern: { label: 'Malestar registrado', icon: 'i-ph-cloud' },
  note: { label: 'Nota', icon: 'i-ph-note-pencil' },
}

const props = defineProps<{ events: RecordEvent[] }>() // del servidor, más reciente primero
const active = ref(new Set<EventKind>(Object.keys(KIND) as EventKind[]))

function toggle(kind: EventKind) {
  const next = new Set(active.value)
  if (next.has(kind)) next.delete(kind)
  else next.add(kind)
  active.value = next
}

const items = computed<TimelineItem[]>(() => props.events
  .filter(event => active.value.has(event.kind))
  .map(event => ({
    value: event.id,
    date: event.dateLabel, // "lun 14 oct 2026, 10:00"; sin hora conocida, solo la fecha
    isoDate: event.iso,
    title: event.title,
    description: `${KIND[event.kind].label} · ${event.byline}`,
    icon: KIND[event.kind].icon,
    event,
  })))
</script>

<template>
  <section aria-labelledby="timeline-title" class="flex flex-col gap-4">
    <h2 id="timeline-title" class="text-lg font-semibold text-fi-navy">Historial</h2>

    <!-- Filtros que se combinan: botones con aria-pressed, nunca UBadge @click (D-05). -->
    <div role="group" aria-label="Tipos de evento" class="flex flex-wrap gap-2">
      <UButton
        v-for="(meta, kind) in KIND"
        :key="kind"
        :label="meta.label"
        :icon="active.has(kind) ? 'i-ph-check' : meta.icon"
        color="neutral"
        :variant="active.has(kind) ? 'subtle' : 'outline'"
        size="sm"
        :aria-pressed="active.has(kind)"
        @click="toggle(kind)"
      />
    </div>

    <UTimeline :items="items" color="neutral" size="sm">
      <template #date="{ item }">
        <time :datetime="item.isoDate">{{ item.date }}</time>
      </template>
      <!-- Sin @select (en 4.9 el ítem es un div sin teclado): un botón real
           estirado sobre el ítem, que ya es `relative`. -->
      <template #title="{ item }">
        <button
          type="button"
          class="text-start font-medium text-highlighted after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
          @click="openEvent(item.event)"
        >
          {{ item.title }}
        </button>
      </template>
    </UTimeline>
  </section>
</template>
```

`openEvent` abre el detalle del evento en un `USlideover` (con `title`), no en
un modal sobre otro modal.

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | `FiPageHeader` con `description-loading`, `FiStatGrid :loading`, y el resumen y las pestañas en esqueleto (una sola región `role="status"`). | Nunca un spinner de página (D-20). |
| No encontrado (404) | `UEmpty` "No encontramos este historial" con "Volver a la búsqueda". | Distinto de un error de red. |
| Sin acceso (403) | Explicación ("Tu acceso a este historial venció") + "Solicitar acceso". | Un trámite pendiente no es un "no se pudo cargar". |
| Error | `UAlert color="error" role="alert"` con "Reintentar" bajo el encabezado. | — |
| Parcial | La pestaña o tarjeta que no cargó muestra `UAlert color="warning"` con "Reintentar"; el resto funciona. | El éxito parcial es un contrato del endpoint. |
| Sección vacía | `UEmpty variant="naked" size="sm"` con el título en `#header` como `<p>` (la tarjeta ya es `h2`) y la acción en `neutral outline` ("Agregar nota"). | Una receta para todos los vacíos de sección (D-21). |
| Historial cerrado (concluido) | `UAlert color="info"` "Acompañamiento concluido el 3 oct 2026"; la acción principal cambia (o desaparece) según `useRecordActions`. | — |
| Guardando una edición | El botón "Guardar cambios" con `:loading`; el editor no se cierra hasta que confirma. Éxito: se cierra y toast. Fallo: queda abierto con el error en línea. | — |

## Jerarquía de acciones

1. **Una** acción sólida en el encabezado, según el estatus (la siguiente cosa
   que toca). Si no hay ninguna clara, ningún sólido.
2. **"Más acciones"** (`neutral outline`, ícono + texto + caret) con grupos
   etiquetados. Lo urgente del dominio primero en su grupo, con color e ícono
   propios; lo destructivo, separado y al final.
3. **Acciones de sección** dentro de su `FiSectionCard #actions`: "Agregar
   nota", "Editar", "Agregar contacto", en `neutral outline size="sm"`. Una
   sola receta (D-16).
4. **Edición en línea:** pie `[Cancelar (neutral outline)] [Guardar cambios
   (primary)]` alineado a la derecha, igual que en los modales (D-22).
5. **Destructivas** ("Eliminar grupo", "Quitar miembro"): `color="error"`,
   confirmación que nombra el objeto y la consecuencia; botón de solo ícono
   con `aria-label` que incluye el nombre ("Quitar a Ana Pérez del grupo").
6. **Concluir** (cierra el caso sin borrar): confirmación con resumen y botón
   `primary` con verbo; lo hace el [`internal-task-flow`](internal-task-flow.md)
   de cierre cuando hay que capturar tipo y motivo.

## Responsive

- `≥ lg`: columna principal + resumen de 20 rem a la derecha, fijo
  (`lg:sticky lg:top-0 lg:self-start`).
- `< lg`: una columna; el resumen va antes de las pestañas (va primero en el
  DOM, así el orden de lectura y de foco coincide con el visual en móvil).
- `FiPageHeader` apila las acciones bajo el título en móvil. Con una acción y
  un menú, no se envuelven en tres renglones (inventario: siete botones `xs`
  ocupaban dos o tres renglones en `md`).
- Pestañas en una sola fila; si no caben, `UTabs` se desplaza en horizontal.
  No conviertas las pestañas en un carrusel ni las partas en dos filas.

## Accesibilidad

- Un solo `h1` (`FiPageHeader`). Resumen y pestañas con `h2`; tarjetas dentro
  de una pestaña con `h3` (`FiSectionCard :heading-level="3"`).
- `UTabs` da el patrón ARIA completo (flechas, `aria-selected`, `tabpanel`);
  la pestaña activa se distingue con dos señales (color y subrayado).
- Línea del tiempo operable con teclado (botón estirado en `#title`), fechas
  con `<time datetime>`. Si hay desplazamiento horizontal, el contenedor
  lleva `tabindex="0"`, `role="region"` y `aria-label` (D-M1).
- Ningún encabezado dentro de un botón (D-32); secciones plegables con
  `UCollapsible`/`UAccordion`, que ponen `aria-expanded` (C-18).
- Datos más sensibles (p. ej. teléfonos de terceros) con "Mostrar" bajo
  demanda si la política del proyecto lo pide, registrando el acceso.
- Nada de datos personales en la URL: el `id` del registro es opaco y la
  pestaña es `?tab=`.

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Un sólido según el estatus + "Más acciones" agrupado, igual que en el buscador. | Siete botones `xs soft` del mismo peso en el encabezado, sin acción principal, con un conjunto distinto al de la tarjeta de búsqueda (D-23). |
| Resumen con lo crítico (contactos, malestares activos, próxima cita) siempre a la vista; conteos en las pestañas. | Cinco tarjetas de conteos primero, y lo relevante para el riesgo escondido en pestañas al fondo de un solo desplazamiento largo (inventario). |
| Malestares con `UBadge color="neutral" variant="subtle"`. | Chips con `bg-pizarra-50 text-pizarra-700`, que no generan CSS y se ven como texto plano (D-01, E-05). |
| Un presenter por tipo de evento, con indicador neutro e ícono. | El mismo concepto en colores distintos por vista, y "malestar" pintado como error (D-03). |
| Botón estirado en `#title` de `UTimeline`. | `UTimeline @select`: los eventos no se pueden abrir con teclado (D-M1). |
| Indicadores de la línea del tiempo con contraste ≥ 3:1. | Ícono blanco sobre `amber-500`/`success-500`: 2.1–2.2:1 (D-M2). |
| Filtros de tipo con `UButton :aria-pressed`. | `UBadge @click` como filtro: ni enfocable ni con estado (D-05). |
| `FiSectionCard` para todas las secciones. | Encabezados de sección hechos de tres formas, con la acción "agregar" en tres estilos (D-16). |
| `UEmpty` para los vacíos de sección. | Trece copias del mismo bloque de vacío con tamaños distintos (D-21). |
| Pie de edición `[Cancelar] [Guardar cambios]` a la derecha. | Guardar a la izquierda y Cancelar después en los editores en línea, al revés que en los modales (D-22). |
| `UTabs` para las secciones. | Pestañas con `role="tab"` sin `tabpanel`, sin flechas (D-10). |
| Un mapa de estado por dominio, igual al elegir y al mostrar. | El mismo resultado en `warning` al elegirlo y en `error` al mostrarlo (D-M4). |
| Vocabulario e íconos del dominio (malestar con `i-ph-cloud`). | "Alta", "expediente" y estetoscopio o latido como íconos (D-24). |
| "Eliminar" lejos de lo diario, con confirmación. | Eliminar el grupo dentro del panel, junto a acciones de uso diario (inventario, grupos). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/cedulas/[id]/index.vue` con
  `app/components/cedulas/CedulaDetailPanel.vue`,
  `CedulaTimelineSection.vue` y `CedulaInfoTabsCard.vue`: la vista 360 de una
  persona. Lo que se conserva: `DashboardPageHeader` con "Regresar" y badges,
  la región de esqueleto y los estados bloqueado / error / no encontrado. Lo
  que cambia según el inventario: encabezado de identidad con "Agendar cita" o
  "Iniciar atención" como principal y "Más acciones" (diferida, derivación
  interna/externa, cuestionario, concluir); layout 360 con el resumen a un
  lado y `UTabs` Historial · Notas · Datos · Cuestionarios · Documentos; los
  conteos en las etiquetas de las pestañas.
- `app/pages/dashboard/operacion/grupos/[id].vue` con
  `TherapyGroupDetailPanel.vue`: la variante de grupo; el inventario pide
  miembros y próxima sesión en el encabezado, malestares como
  `UBadge neutral subtle`, miembros en tabla y "Eliminar" en "Más acciones" o
  en una sección aparte.

## Fuentes

- Ministry of Justice Design System, *Identity bar* (identidad y acciones del registro siempre a la vista). https://design-patterns.service.justice.gov.uk/components/identity-bar/
- Ministry of Justice Design System, *Timeline* (título, autor, fecha, más reciente primero, sin "00:00" inventado). https://design-patterns.service.justice.gov.uk/components/timeline/
- Ministry of Justice Design System, *Page header actions* (acciones de página vs. de componente). https://design-patterns.service.justice.gov.uk/components/page-header-actions
- Shopify App Home, *Details template* (columna principal y aside, migas, barra de guardado). https://shopify.dev/docs/api/app-home/latest/patterns/templates/details
- Nielsen Norman Group, *Tabs, used right* (pocas pestañas, etiquetas cortas, dos señales de selección, una fila). https://www.nngroup.com/articles/tabs-used-right/
- Nuxt UI, *Timeline*. https://ui.nuxt.com/docs/components/timeline
