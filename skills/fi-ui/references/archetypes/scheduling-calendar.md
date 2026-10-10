# Arquetipo `scheduling-calendar` — Agenda

La semana (o el día) de citas y sesiones de una persona del equipo. Sirve
para ver qué toca, elegir un evento y actuar sobre él: iniciar la atención,
reprogramar o cancelar. En escritorio es una rejilla semanal con un panel de
detalle; en el teléfono, una lista del día.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** personal que atiende con cita (en PSM: asesores). Coordinación
  la consulta para ver la carga.
- **Tarea:** ver la semana, elegir una cita o sesión grupal y actuar. Arrancar
  la atención a tiempo es lo más frecuente.
- **Éxito:** al abrir la vista se ve hoy, la siguiente cita se distingue sin
  leer colores, y "Iniciar atención" está a un clic del evento.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| La agenda semanal o diaria del personal. | Que el público elija un horario: eso es una lista de horarios disponibles agrupados por día dentro de un [`public-guided-flow`](public-guided-flow.md), no una rejilla. |
| Ver y actuar sobre citas y sesiones grupales. | Procesar solicitudes que aún no tienen cita: es [`worklist-queue`](worklist-queue.md). |
| | Elegir una fecha en un formulario: `UInputDate` (y `UCalendar` en un `UPopover` como apoyo). |
| | La lista de hoy en el inicio: es un bloque de [`dashboard-home`](dashboard-home.md). |

> **`UCalendar` es un selector de fecha, no una agenda.** Sirve para el
> "Ir a fecha" y para un mini mes con marcas. La rejilla semanal se construye
> (receta abajo) o se toma de un componente de agenda dedicado.

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar` con `#left` (`UBreadcrumb` Operación › Agenda) | Las secciones hermanas del módulo viven en el sidebar. No repitas sus enlaces como "pestañas" sobre la vista (D-10, E-14). |
| 1 | Encabezado | `FiPageHeader title="Agenda"`, la semana en `#description` (con `aria-live="polite"`), y en `#actions`: `UFieldGroup` [‹ · Hoy · ›], "Ir a fecha" (`UPopover` + `UCalendar`) y "Nueva cita" (`neutral outline`). | Los botones ‹ › son solo ícono: llevan `aria-label` ("Semana anterior"). La semana vive en la URL (`?semana=2026-10-13`). |
| 2 | Sesión abierta | Un `UAlert color="warning"` con "Retomar". | Uno a la vez. Va antes de la rejilla. |
| 3 | Rejilla semanal (≥ lg) | Tarjeta `rounded-2xl border border-default bg-elevated` con columna de horas `aria-hidden` y una `<section>` por día con su `<h3>` y una `<ul>` de eventos (`<button>`). | Hoy marcado con `aria-current="date"` y el número en `bg-primary text-inverted`. Línea de "ahora" en `bg-primary`, decorativa. |
| 4 | Detalle del evento | ≥ xl: `FiSectionCard` en una columna lateral (`xl:grid-cols-[minmax(0,1fr)_22rem]`). < xl: `USlideover` con el mismo componente. | Lleva el único botón sólido: "Iniciar atención". |
| 5 | Leyenda | `<ul>` bajo la rejilla: tipo de evento con ícono + muestra de color + texto. | Toda distinción de color tiene leyenda y otra señal (ícono o texto). |
| 6 | Lista del día (< lg) | `UTabs variant="pill" color="neutral" :content="false"` con los 7 días ("L 13") + `<ol>` de tarjetas de evento ordenadas por hora. | Abre en hoy. Nunca una rejilla de 7 columnas con desplazamiento horizontal en el teléfono. |

Colores de evento: **categoría por rol de marca, estado por `FiStatusBadge`.**

| Qué se codifica | Cómo | Ejemplo |
|---|---|---|
| Tipo de evento (categoría) | Borde izquierdo `border-s-4` + tinte suave + ícono, con roles `tertiary` y `secondary`. Nunca colores de estado ni paletas crudas. | Individual: `border-tertiary bg-tertiary/10` + `i-ph-user`. Grupal: `border-secondary bg-secondary/10` + `i-ph-users-three`. |
| Estado de la cita | `FiStatusBadge` con el mapa semántico único. | Programada y En curso `info` (ícono distinto), Atendida `success`, No asistió y Cancelada `neutral` (Cancelada además tachada). |
| Hoy y "ahora" | `primary`: es acento de marca y navegación, no alarma. | Número del día en `bg-primary text-inverted`; línea de 2 px `bg-primary`. |

### Esqueleto

```ts
// utils/presenters/agenda.ts — un solo presenter para la agenda, el detalle,
// el inicio y las líneas del tiempo (D-03, D-M5).
import type { FiStatus } from '@fi-unam/ui'

export type EventKind = 'individual' | 'group'
export type EventStatus = 'SCHEDULED' | 'ON_GOING' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED'

// Categoría (qué es) → rol de marca. Las clases van completas para que
// Tailwind las detecte.
export const EVENT_KIND: Record<EventKind, { label: string, icon: string, border: string, tint: string }> = {
  individual: { label: 'Sesión individual', icon: 'i-ph-user', border: 'border-tertiary', tint: 'bg-tertiary/10' },
  group: { label: 'Sesión grupal', icon: 'i-ph-users-three', border: 'border-secondary', tint: 'bg-secondary/10' },
}

// Estado (cómo va) → mapa semántico. Cancelar o no asistir son desenlaces
// normales, no errores del sistema. Mismo estado de color = ícono distinto.
export const EVENT_STATUS: Record<EventStatus, { status: FiStatus, label: string, icon: string }> = {
  SCHEDULED: { status: 'info', label: 'Programada', icon: 'i-ph-calendar-blank' },
  ON_GOING: { status: 'info', label: 'En curso', icon: 'i-ph-play-circle' },
  COMPLETED: { status: 'success', label: 'Atendida', icon: 'i-ph-check-circle' },
  NO_SHOW: { status: 'neutral', label: 'No asistió', icon: 'i-ph-user-minus' },
  CANCELED: { status: 'neutral', label: 'Cancelada', icon: 'i-ph-calendar-x' },
}
```

```vue
<!-- components/agenda/WeekGrid.vue -->
<script setup lang="ts">
import { EVENT_KIND, EVENT_STATUS } from '~/utils/presenters/agenda'
import type { EventKind, EventStatus } from '~/utils/presenters/agenda'

interface AgendaDay {
  index: number // 0 = lunes
  date: string // '2026-10-13'
  label: string // 'lunes 13 de octubre' (Intl.DateTimeFormat es-MX en FI_TIME_ZONE)
  shortLabel: string // 'lun'
  dayNumber: number
  isToday: boolean
}

interface AgendaEvent {
  id: string
  kind: EventKind
  status: EventStatus
  title: string // persona o grupo
  timeLabel: string // '10:00–10:50'
  dayIndex: number
  startMinutes: number // minutos desde las 00:00, hora de la FI
  durationMinutes: number
}

const props = defineProps<{
  weekLabel: string
  days: AgendaDay[]
  events: AgendaEvent[]
  selectedId: string | null
  startHour: number
  endHour: number
  nowOffsetPx: number | null // null fuera del horario o de la semana actual
}>()
const emit = defineEmits<{ select: [id: string] }>()

const HOUR_PX = 64
const hours = computed(() => Array.from({ length: props.endHour - props.startHour }, (_, i) => props.startHour + i))

// El orden del DOM es día por día y por hora: es el orden del tabulador.
function eventsOf(dayIndex: number) {
  return props.events.filter(event => event.dayIndex === dayIndex).sort((a, b) => a.startMinutes - b.startMinutes)
}

function blockStyle(event: AgendaEvent) {
  const top = ((event.startMinutes - props.startHour * 60) / 60) * HOUR_PX
  // Al menos 24 px de objetivo aunque la cita dure 15 min (WCAG 2.5.8).
  const height = Math.max((event.durationMinutes / 60) * HOUR_PX, 24)
  return { top: `${top}px`, height: `${height}px` }
}

// Nombre completo: el lector de pantalla no ve la posición en la rejilla.
function accessibleName(event: AgendaEvent, day: AgendaDay) {
  return `${day.label}, ${event.timeLabel}, ${event.title}, ${EVENT_KIND[event.kind].label}, ${EVENT_STATUS[event.status].label}`
}
</script>

<template>
  <section aria-labelledby="week-title" class="rounded-2xl border border-default bg-elevated">
    <h2 id="week-title" class="sr-only">{{ weekLabel }}</h2>

    <div class="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
      <!-- Horas: decorativas, cada evento ya dice su hora. -->
      <div aria-hidden="true" class="pt-12">
        <div v-for="hour in hours" :key="hour" class="h-16 pe-2 text-end text-xs tabular-nums text-muted">
          {{ hour }}:00
        </div>
      </div>

      <section v-for="day in days" :key="day.date" :aria-labelledby="`day-${day.index}`" class="border-s border-default">
        <h3
          :id="`day-${day.index}`"
          :aria-current="day.isToday ? 'date' : undefined"
          class="sticky top-0 z-10 flex h-12 items-center justify-center gap-1.5 border-b border-default bg-elevated text-sm"
        >
          <span aria-hidden="true" class="text-muted">{{ day.shortLabel }}</span>
          <span
            aria-hidden="true"
            class="grid size-7 place-items-center rounded-full font-semibold tabular-nums"
            :class="day.isToday ? 'bg-primary text-inverted' : 'text-highlighted'"
          >{{ day.dayNumber }}</span>
          <span class="sr-only">{{ day.label }}{{ day.isToday ? ', hoy' : '' }}</span>
        </h3>

        <div class="relative" :style="{ height: `${hours.length * HOUR_PX}px` }">
          <ul>
            <li v-for="event in eventsOf(day.index)" :key="event.id" class="absolute inset-x-1" :style="blockStyle(event)">
              <!-- Selección ≠ foco: la selección es fondo + palomita +
                   aria-pressed; el foco es el anillo de contorno (D-19). -->
              <button
                type="button"
                class="flex size-full flex-col items-start gap-0.5 overflow-hidden rounded-lg border-s-4 px-2 py-1 text-start text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :class="[
                  EVENT_KIND[event.kind].border,
                  event.id === selectedId ? 'bg-accented' : EVENT_KIND[event.kind].tint,
                ]"
                :aria-pressed="event.id === selectedId"
                :aria-label="accessibleName(event, day)"
                @click="emit('select', event.id)"
              >
                <span class="flex items-center gap-1 tabular-nums text-muted">
                  <UIcon :name="EVENT_KIND[event.kind].icon" class="size-3.5 shrink-0" />
                  {{ event.timeLabel }}
                  <UIcon v-if="event.id === selectedId" name="i-ph-check-circle-fill" class="size-3.5 shrink-0 text-highlighted" />
                </span>
                <span
                  class="line-clamp-2 font-medium"
                  :class="event.status === 'CANCELED' ? 'text-muted line-through' : 'text-highlighted'"
                >{{ event.title }}</span>
              </button>
            </li>
          </ul>

          <div
            v-if="day.isToday && nowOffsetPx !== null"
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-primary"
            :style="{ top: `${nowOffsetPx}px` }"
          />
        </div>
      </section>
    </div>
  </section>
</template>
```

```vue
<!-- pages/dashboard/operacion/index.vue (fragmento del encabezado y la distribución) -->
<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <FiPageHeader title="Agenda">
      <template #description>
        <span aria-live="polite">{{ weekLabel }}</span>
      </template>
      <template #actions>
        <UFieldGroup>
          <UButton icon="i-ph-caret-left" color="neutral" variant="outline" aria-label="Semana anterior" @click="shiftWeek(-1)" />
          <UButton label="Hoy" color="neutral" variant="outline" @click="goToday()" />
          <UButton icon="i-ph-caret-right" color="neutral" variant="outline" aria-label="Semana siguiente" @click="shiftWeek(1)" />
        </UFieldGroup>
        <UPopover>
          <UButton label="Ir a fecha" icon="i-ph-calendar-dots" color="neutral" variant="ghost" />
          <template #content>
            <UCalendar v-model="jumpDate" :week-starts-on="1" class="p-2" />
          </template>
        </UPopover>
        <UButton label="Nueva cita" icon="i-ph-plus" color="neutral" variant="outline" @click="openCreateAppointment()" />
      </template>
    </FiPageHeader>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <WeekGrid
        class="hidden lg:block"
        :week-label="weekLabel"
        :days="days"
        :events="events"
        :selected-id="selectedId"
        :start-hour="8"
        :end-hour="20"
        :now-offset-px="nowOffsetPx"
        @select="selectedId = $event"
      />
      <DayList class="lg:hidden" :days="days" :events="events" @select="selectedId = $event" />

      <!-- ≥ xl: detalle en columna. Sin selección, una línea de ayuda; nunca
           un recuadro punteado alto encima del calendario. -->
      <aside class="hidden xl:block">
        <EventDetail v-if="selected" :event="selected" />
        <p v-else class="text-sm text-muted">Elige un evento para ver su detalle.</p>
      </aside>
    </div>

    <!-- < xl: el mismo detalle en un slideover.
         isWide = useBreakpoints(breakpointsTailwind).greaterOrEqual('xl') -->
    <USlideover v-if="!isWide" v-model:open="isDetailOpen" :title="selected?.title" description="Detalle del evento">
      <template #body>
        <EventDetail v-if="selected" :event="selected" />
      </template>
    </USlideover>
  </div>
</template>
```

`EventDetail` es un `FiSectionCard` con el nombre como título, el
`FiStatusBadge`, un `dl` (fecha con día de la semana, hora, duración,
modalidad, lugar o enlace) y las acciones de la sección siguiente. `DayList`
usa los mismos presenters y el mismo `aria-label` por evento.

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | La rejilla en esqueleto: columnas de día con dos o tres bloques `USkeleton` a alturas distintas, dentro de un contenedor `aria-hidden` y una sola región `role="status"` ("Cargando la semana…"). Encabezado y navegación de semana ya activos. | Nunca un spinner que hace saltar el layout (D-20, inventario). |
| Semana sin eventos | La rejilla vacía se pinta igual (se ven los días) y arriba una línea: "No tienes citas esta semana." con "Nueva cita". | Vacío no es error. |
| Error | `UAlert color="error" role="alert"` con "Reintentar" en lugar de la rejilla. El encabezado sigue funcionando. | Nunca una semana vacía cuando la carga falló. |
| Parcial | Si el servidor avisa que una fuente no respondió (p. ej. sesiones grupales), se pintan las citas individuales y un `UAlert color="warning"`: "No se pudieron cargar las sesiones grupales. Reintentar". | El éxito parcial es un campo del endpoint, no un `catch` que devuelve `[]`. |
| Sin selección | ≥ xl: una línea de ayuda en la columna lateral. < xl: nada. | Inventario: el recuadro de "selecciona un evento" aparecía **encima** del calendario en móvil. |
| Evento pasado | Detalle en lectura; sin "Iniciar atención". | — |
| Conflicto al reprogramar | `UAlert` en el formulario de reprogramación: "Ya tienes una cita a esa hora". | Se detecta antes de guardar. |

## Jerarquía de acciones

1. **Principal:** "Iniciar atención" (o "Iniciar sesión grupal") en el detalle
   del evento seleccionado, sólido. Es la acción más frecuente y la única
   sólida de la vista.
2. **Crear:** "Nueva cita" en `FiPageHeader #actions`, `neutral outline`.
3. **Sobre el evento:** "Reprogramar" `neutral outline`; "Cancelar cita" en un
   `UDropdownMenu` "Más acciones" con `color: 'error'`, que abre
   `UModal :close="false"` con la pregunta "¿Cancelar la cita de Ana Pérez del
   lun 14 oct, 10:00?", el motivo (recibe el foco al abrir) y el pie
   [Volver (neutral outline)] [Cancelar cita (error)]. El botón de escape dice
   "Volver" porque "Cancelar" chocaría con la acción.
4. **Navegación de semana:** botones `neutral outline` en un `UFieldGroup`.
5. **Cronómetros de guardia o tiempo de espera:** "Detener" en
   `neutral outline`, nunca un segundo sólido junto a "Iniciar atención"
   (D-25).
6. Sin arrastrar para reprogramar. Si algún día se añade, "Reprogramar" sigue
   existiendo como alternativa de un solo puntero (WCAG 2.5.7).

## Responsive

- `≥ xl`: rejilla + columna de detalle de 22 rem.
- `lg`–`xl`: rejilla a todo el ancho; el detalle abre en `USlideover`.
- `< lg`: lista del día con `UTabs` de los 7 días (abre en hoy), tarjetas de
  evento ordenadas por hora, detalle en `USlideover`. Nada de `min-w-[640px]`
  con desplazamiento horizontal (inventario).
- Altura de la rejilla con `dvh`, no `vh`, si se ajusta al viewport (D-29).

## Accesibilidad

- Un solo `h1` (`FiPageHeader`). La semana es una `<section>` con `h2`
  (oculto) y cada día una `<section>` con `h3` y su lista de eventos.
- Cada evento es un `<button>` con nombre completo: día, hora, persona, tipo y
  estado. La rejilla de horas es `aria-hidden`.
- Selección con `aria-pressed` y señal visual distinta del foco.
- El tipo de evento nunca va solo en color: ícono y leyenda. El estado va en
  texto (`FiStatusBadge` en el detalle y en el nombre accesible).
- Hoy: `aria-current="date"`. Al cambiar de semana, la descripción se anuncia
  (`aria-live="polite"`).
- Fechas en español de México con día de la semana y la zona de la FI:
  `Intl.DateTimeFormat('es-MX', { timeZone: FI_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' })`
  (`FI_TIME_ZONE` lo exporta `@fi-unam/ui`). Hora desconocida = solo fecha,
  nunca "00:00".
- Texto de la rejilla ≥ 12 px reales (`text-xs` es 13 px en la escala FI). Sin
  `opacity-70` sobre el texto (D-30).
- Transiciones del detalle con `motion-safe:` (D-31).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Tipo de evento con `tertiary` / `secondary` + ícono + leyenda. | Sesiones grupales en `violet-*` crudo, que no sigue los temas especiales (D-02). |
| Un presenter para tipo y estado, usado en agenda, detalle y líneas del tiempo. | "Grupo" violeta en la agenda, oro en otra tarjeta e índigo en la línea del tiempo; citas rutinarias en rojo primario con una línea "ahora" en rojo de error encima (D-03). |
| Cancelada y No asistió en `neutral`, con ícono propio. | `CANCELED` en `error` en una tarjeta, gris al 70 % en la agenda y otro color en la siguiente (D-M5). |
| Selección = fondo + palomita + `aria-pressed`; foco = contorno. | `ring-2` tanto para "seleccionado" como para el foco, sin `aria-pressed` (D-19). |
| `text-inverted` sobre `bg-primary`. | `text-(--ui-bg)`: el color de fondo de la página usado como texto (D-27). |
| Íconos de cifra en `text-tertiary`. | `text-pizarra-600`, que no genera CSS (D-01, E-05). |
| Etiquetas de día en `text-xs` (13 px). | Nombres de día de 11 px y hora del evento con `opacity-70` (D-30). |
| Un sólido: "Iniciar atención". | "Detener" sólido junto a "Iniciar atención" sólido (D-25). |
| Las secciones del módulo en el sidebar. | Una fila de "pestañas" que repite los enlaces del sidebar, con `role="tablist"` sobre enlaces (D-10, E-14). |
| Esqueleto con la forma de la rejilla. | Spinner de página completa (D-20). |

## Ejemplo de referencia en PSM

`app/pages/dashboard/operacion/index.vue` con
`app/components/operacion/OperadorWeeklyCalendar.vue` (rejilla),
`OperadorAppointmentDetailCard.vue` y `OperadorGroupMeetingDetailCard.vue`
(detalle) y `WaitingPeriodCard.vue` (cronómetro de guardia). Lo que se
conserva: la columna de detalle en `xl` y la navegación ant./hoy/sig. Lo que
cambia, según el inventario: vista "Hoy" en lista por debajo de `lg`, detalle
en `USlideover` en móvil, "Nueva cita" y "Atención sin cita" en el
encabezado, cifras como chips (o fuera) en vez de una fila de tarjetas sobre
la herramienta, colores de evento por presenter, y la rejilla en esqueleto.
`OperadorTodayEventCard.vue` no tiene usos: es código muerto.

## Fuentes

- GOV.UK Design System, *Dates* (el calendario no es la única forma de dar una fecha). https://design-system.service.gov.uk/patterns/dates/
- Gobierno de Gales, *Book an appointment pattern* (tipo → fecha y hora → datos → revisar → confirmación). https://digitalpublicservices.gov.wales/node/1435
- W3C WAI, *What's new in WCAG 2.2* (2.5.7 alternativa al arrastre, 2.5.8 tamaño de objetivo). https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Nuxt UI, *Calendar* (selector de fecha, `#day` con marcas). https://ui.nuxt.com/docs/components/calendar
