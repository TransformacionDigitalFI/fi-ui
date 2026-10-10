# Arquetipo `dashboard-home` — Inicio del dashboard

La primera pantalla después de iniciar sesión. Responde una sola pregunta,
según el rol: **"¿qué requiere mi atención ahora?"**, y lleva ahí con un clic.
No es una portada: no lleva héroe azul marino, ni valores institucionales, ni
el nombre y correo que ya están en el menú de usuario.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. Este archivo también resume el
> [marco del dashboard](#marco-del-dashboard) que comparten todos los
> arquetipos con sesión; la receta completa del shell está en
> [components.md](../components.md#shell-del-dashboard-udashboard).

## Propósito y usuario

- **Usuario:** todo el personal con sesión. El contenido se arma por rol y
  permisos (en PSM: asesores, coordinación, administración).
- **Tarea:** empezar el turno. Ver qué está pendiente, qué toca hoy y retomar
  lo que quedó a medias.
- **Éxito:** sin desplazarse, la persona ve sus bandejas con conteo, su
  siguiente cita y cualquier cosa abierta (por ejemplo, una sesión sin
  cerrar), y llega a cada una con un clic.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| La raíz del dashboard (`/dashboard`). | Analizar tendencias o comparar periodos: es [`analytics`](analytics.md). |
| Un "Hoy" por rol: bandejas, agenda del día, recientes. | Despachar los pendientes ahí mismo: el inicio **enlaza** a la bandeja, no la reimplementa. Es [`worklist-queue`](worklist-queue.md). |
| | La agenda completa de la semana: es [`scheduling-calendar`](scheduling-calendar.md). |
| | El avance personal detallado (horas, constancias): va en su propia vista, enlazada desde aquí. |

## Marco del dashboard

Todos los arquetipos con sesión comparten el mismo marco:

```
UDashboardGroup
├─ enlace "Saltar al contenido"
├─ UDashboardSidebar            isla oscura (la pone fiAppConfig) + FiDashboardBrand + UNavigationMenu
└─ <main id="main-content">             uno solo, en el layout
   └─ UDashboardPanel (uno o dos, los declara cada vista)
      ├─ #header  UDashboardNavbar (orientación: migas o sección; sin h1)
      │           UDashboardToolbar (opcional: vistas, búsqueda, filtros)
      ├─ #body    FiPageHeader (el único h1) + tarjetas blancas sobre la pizarra
      └─ #footer  (opcional: barra de acciones fija de un flujo)
```

```vue
<!-- Marco de una vista de una sola columna -->
<template>
  <UDashboardPanel id="agenda">
    <template #header>
      <!-- El navbar UBICA; el h1 lo pone FiPageHeader. UDashboardNavbar envuelve
           la prop `title` en un <h1> y lo pinta aunque esté vacío: con
           FiPageHeader en la vista se usa #left, nunca `title`. -->
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Operación', to: '/dashboard/operacion' }, { label: 'Agenda' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Un solo ancho de contenedor para todas las vistas del proyecto. -->
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <FiPageHeader title="Agenda" description="Semana del 13 al 19 de octubre" />
        <!-- …tarjetas blancas (FiSectionCard) sobre la página pizarra -->
      </div>
    </template>
  </UDashboardPanel>
</template>
```

Reglas del marco:

1. **El navbar ubica, el h1 lo pone `FiPageHeader`.** Con `FiPageHeader` en
   la vista, `UDashboardNavbar` usa el slot `#left` (migas o el nombre de la
   sección como texto), nunca la prop `title` (C-M1, C-07). La única
   excepción es el panel de lista de una lista-detalle sin `FiPageHeader`
   (ver [worklist-queue](worklist-queue.md)) o la barra de una sesión en vivo
   (ver [live-session](live-session.md)): ahí el `title` del navbar **es** el
   `h1`.
2. **Cada vista declara sus paneles.** El layout no envuelve la vista en un
   `UDashboardPanel` propio: una lista-detalle o un panel de apoyo necesitan
   dos.
3. **Un solo ancho de contenedor** (`max-w-7xl` para las vistas de trabajo;
   formularios y ajustes `max-w-3xl`, analítica y bitácora a todo el ancho:
   [patterns.md](../patterns.md#responsive)) y el mismo orden en todas las
   vistas hermanas: navbar → encabezado → barra de herramientas → contenido
   (D-11, C-20).
4. **Sin "hoja" blanca que envuelva la vista.** El cuerpo va sobre la pizarra
   (`bg-default`) y cada sección es su tarjeta (`FiSectionCard`). Tarjeta
   sobre tarjeta es un error (D-28, C-15).
5. **Las secciones del módulo** (Agenda · Grupos · Registro diferido…) viven
   en el sidebar. Si también se quieren arriba, `UNavigationMenu` horizontal
   en un `UDashboardToolbar`, nunca botones con `role="tablist"` (D-10,
   E-14).
6. **Sin selector de modo oscuro** en el menú de usuario ni en la paleta de
   comandos: fi-ui es solo claro (D-M3).

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel id="home"` + `UDashboardNavbar` con `#left` ("Inicio" como texto) | Sin `h1` en el navbar. |
| 1 | Encabezado | `FiPageHeader` con saludo en `title` y fecha + rol en `description`. En `#actions`, como máximo un acceso general en `neutral outline` ("Nueva cita"). | Una línea. Nada de héroe que ocupe medio viewport ni tarjeta de usuario. |
| 2 | Lo que quedó abierto | **Un** `UAlert` (`color="warning" variant="subtle"`) con acción "Retomar". | Máximo uno a la vez. Persiste hasta resolverse. Nunca un toast. |
| 3 | Requiere tu atención | `<section>` con `h2` + `FiStatGrid` de `FiStat` con `to`, una por bandeja que el rol puede atender. | Lo que el rol no puede hacer **se oculta**, no se deshabilita. Cada cifra enlaza a su lista ya filtrada. El `hint` dice la antigüedad del más viejo. |
| 4 | Hoy | `FiSectionCard title="Tu agenda de hoy"` con `<ol>` de citas (hora, persona, `FiStatusBadge`) y "Ver semana" en `#actions`. | La siguiente cita lleva el único botón sólido de la vista: "Iniciar atención". |
| 5 | Recientes | `FiSectionCard title="Recientes"` con `<ul>` de enlaces a los últimos registros abiertos. | Máximo 5. Solo el nombre del registro, sin datos sensibles. |
| 6 | Indicadores de la semana (opcional, coordinación) | `FiStatGrid :columns="3"` con `FiStat` que enlazan a [`analytics`](analytics.md). | Máximo 4 cifras. Sin gráficas exploratorias en el inicio. |

Distribución: el bloque 3 va a todo el ancho. Debajo, `grid lg:grid-cols-3`:
"Hoy" ocupa dos columnas y "Recientes" (más el 6, si existe) la tercera.

### Esqueleto

```vue
<!-- pages/dashboard/index.vue -->
<script setup lang="ts">
import type { FiStatus } from '@fi-unam/ui'

type QueueKey = 'requests' | 'followUps' | 'referrals' | 'accessRequests'

interface QueueSummary {
  count: number
  /** Días que lleva esperando el elemento más antiguo; null si no hay ninguno. */
  oldestDays: number | null
}

interface AgendaItem {
  id: string
  startsAt: string // ISO
  timeLabel: string // "10:00", ya formateado en la zona de la FI
  personName: string
  kindLabel: string
  statusTone: FiStatus
  statusLabel: string
  /** Lo decide el servidor: la siguiente cita que ya se puede iniciar. */
  canStart: boolean
}

interface HomeData {
  queues: Record<QueueKey, QueueSummary>
  agenda: AgendaItem[]
  /** Contrato de éxito parcial: los bloques que el servidor no pudo armar. */
  unavailable: Array<'queues' | 'agenda'>
}

// Una tarjeta por bandeja, en orden de prioridad. El permiso decide si se ve.
const QUEUES: { key: QueueKey, permission: string, label: string, icon: string, to: string }[] = [
  { key: 'requests', permission: 'requests:manage', label: 'Solicitudes sin asignar', icon: 'i-ph-tray', to: '/dashboard/solicitudes' },
  { key: 'followUps', permission: 'operations:use', label: 'Seguimientos obligatorios', icon: 'i-ph-phone-call', to: '/dashboard/seguimientos?vista=obligatorios' },
  { key: 'referrals', permission: 'referrals:use', label: 'Derivaciones internas para ti', icon: 'i-ph-arrows-left-right', to: '/dashboard/canalizacion-interna' },
  { key: 'accessRequests', permission: 'access:manage', label: 'Accesos por ratificar', icon: 'i-ph-key', to: '/dashboard/seguridad/accesos' },
]

const { can } = usePermissions() // la capa de permisos de tu proyecto
const visibleQueues = computed(() => QUEUES.filter(queue => can(queue.permission)))
const attentionColumns = computed(() => (visibleQueues.value.length >= 4 ? 4 : visibleQueues.value.length === 3 ? 3 : 2))

// Una petición para la vista; cada bloque se degrada por separado si el
// servidor avisa que no pudo armarlo (fetch grueso, render fino).
const { data, status, error, refresh } = useLazyFetch<HomeData>('/api/home')
const firstLoad = computed(() => status.value === 'pending' && !data.value)
const queuesUnavailable = computed(() => data.value?.unavailable.includes('queues') ?? false)
const agendaUnavailable = computed(() => data.value?.unavailable.includes('agenda') ?? false)

function queueHint(key: QueueKey): string {
  const days = data.value?.queues[key]?.oldestDays
  if (days == null) return 'Al día'
  if (days === 0) return 'La más antigua llegó hoy'
  return `La más antigua espera ${days} ${days === 1 ? 'día' : 'días'}`
}

// La siguiente cita que ya se puede iniciar lleva el único botón sólido.
const nextUp = computed(() => data.value?.agenda.find(item => item.canStart) ?? null)
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <span class="font-semibold text-highlighted">Inicio</span>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <!-- Lo que no depende de datos se pinta desde el primer frame. -->
        <FiPageHeader title="Buenos días, Ana" description="Martes 14 de octubre · Coordinación">
          <template #actions>
            <UButton label="Nueva cita" icon="i-ph-calendar-plus" color="neutral" variant="outline" @click="openCreateAppointment()" />
          </template>
        </FiPageHeader>

        <!-- Falló la petición entera: UNA región de error, no una por bloque. -->
        <UAlert
          v-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No pudimos cargar tu inicio"
          description="Puede ser un problema de conexión."
          :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <template v-else>
          <UAlert
            v-if="openSession"
            color="warning"
            variant="subtle"
            icon="i-ph-timer"
            title="Tienes una sesión abierta"
            :description="`Con ${openSession.personName} desde las ${openSession.startedAtLabel}.`"
            :actions="[{ label: 'Retomar sesión', to: openSession.to, color: 'neutral', variant: 'outline' }]"
          />

          <section aria-labelledby="attention-title" class="flex flex-col gap-3">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="attention-title" class="text-lg font-semibold text-fi-navy">Requiere tu atención</h2>
              <p v-if="data" class="text-sm text-muted" role="status">Actualizado hace 2 min</p>
            </div>

            <!-- Parcial: este bloque no se pudo armar; el resto de la vista sí. -->
            <UAlert
              v-if="queuesUnavailable"
              color="warning"
              variant="subtle"
              icon="i-ph-warning"
              title="No pudimos contar tus pendientes"
              description="La agenda de abajo está completa."
              :actions="[{ label: 'Reintentar', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
            />
            <FiStatGrid v-else :columns="attentionColumns">
              <FiStat
                v-for="queue in visibleQueues"
                :key="queue.key"
                :label="queue.label"
                :value="data?.queues[queue.key]?.count ?? 0"
                :hint="queueHint(queue.key)"
                :icon="queue.icon"
                :to="queue.to"
                :loading="firstLoad"
              />
            </FiStatGrid>
          </section>

          <div class="grid gap-6 lg:grid-cols-3">
            <FiSectionCard class="lg:col-span-2" title="Tu agenda de hoy" icon="i-ph-calendar-blank">
              <template #actions>
                <UButton to="/dashboard/operacion" label="Ver semana" color="neutral" variant="ghost" size="sm" trailing-icon="i-ph-arrow-right" />
              </template>

              <!-- USkeleton 4.9 lleva role="alert" en cada bloque: se ocultan y
                   una sola región role="status" hace el anuncio. -->
              <div v-if="firstLoad" role="status">
                <span class="sr-only">Cargando tu agenda…</span>
                <div class="flex flex-col gap-3" aria-hidden="true">
                  <USkeleton v-for="n in 3" :key="n" class="h-14 rounded-xl" />
                </div>
              </div>

              <UAlert
                v-else-if="agendaUnavailable"
                color="warning"
                variant="subtle"
                icon="i-ph-warning"
                title="Tu agenda no está disponible por ahora"
                :actions="[{ label: 'Reintentar', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
              />

              <!-- Dentro de una FiSectionCard (h2) el título del vacío va como <p>:
                   UEmpty pinta su `title` como <h2> fijo. -->
              <UEmpty v-else-if="!data?.agenda.length" variant="naked" size="sm">
                <template #header>
                  <FiIconBadge icon="i-ph-calendar-check" size="md" />
                  <p class="text-sm font-medium text-highlighted">No tienes citas hoy</p>
                  <p class="text-sm text-muted">Las citas nuevas aparecerán aquí.</p>
                </template>
              </UEmpty>

              <ol v-else class="divide-y divide-default">
                <li v-for="item in data?.agenda ?? []" :key="item.id" class="flex flex-wrap items-center gap-3 py-3">
                  <time :datetime="item.startsAt" class="w-14 font-semibold tabular-nums text-highlighted">{{ item.timeLabel }}</time>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-highlighted">{{ item.personName }}</p>
                    <p class="text-sm text-muted">{{ item.kindLabel }}</p>
                  </div>
                  <FiStatusBadge :status="item.statusTone" :label="item.statusLabel" />
                  <!-- El único botón sólido de la vista: la siguiente acción concreta. -->
                  <UButton v-if="item.id === nextUp?.id" label="Iniciar atención" size="sm" @click="startSession(item)" />
                </li>
              </ol>
            </FiSectionCard>

            <FiSectionCard title="Recientes" icon="i-ph-clock-counter-clockwise">
              <ul v-if="recent.length" class="flex flex-col gap-1">
                <li v-for="entry in recent" :key="entry.to">
                  <ULink
                    :to="entry.to"
                    raw
                    class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-default hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <UIcon :name="entry.icon" class="size-4 shrink-0 text-muted" />
                    <span class="truncate">{{ entry.label }}</span>
                  </ULink>
                </li>
              </ul>
              <p v-else class="text-sm text-muted">Lo que abras aparecerá aquí.</p>
            </FiSectionCard>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

`openSession`, `recent`, `openCreateAppointment` y `startSession` vienen de
composables del proyecto (en PSM: `useOperatorReminders` y
`useRecentDestinations`).

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | `FiStat :loading` (mismo tamaño que la tarjeta real) y filas `USkeleton` en "Hoy", con una sola región `role="status"`. El encabezado se pinta de inmediato. | Nunca un spinner de página. Nunca "0" mientras carga (C-27, D-20). |
| Todo al día | Las tarjetas de bandeja se quedan, con `0` y `hint` "Al día". | Las posiciones no cambian entre días: la persona aprende dónde mirar. |
| Agenda vacía | `UEmpty variant="naked"` "No tienes citas hoy" dentro de su tarjeta. | Vacío ≠ error. Nada de tarjeta en blanco. |
| Error (falló la petición) | **Un** `UAlert color="error" role="alert"` con "Reintentar" en lugar de los bloques de datos. | Una petición, una región de error. Nunca "0" ni "sin pendientes" cuando la carga falló (D11). |
| Parcial | El bloque que el servidor no pudo armar muestra `UAlert color="warning"` con "Reintentar"; los demás se pintan. | El éxito parcial es un contrato del endpoint (`unavailable`), no un `catch` que convierte el error en `[]`. |
| Frescura | "Actualizado hace 2 min" junto al `h2`. Se revalida al recuperar el foco de la ventana. | Nada de auto-refresco que mueva el layout. Revalidar no es cargar: los datos se quedan en pantalla. |

## Jerarquía de acciones

1. **Principal:** como máximo **una** acción `solid primary` en toda la vista,
   y es la siguiente acción concreta del día: "Iniciar atención" en la cita
   que sigue. Si no hay cita próxima, no hay botón sólido, y está bien.
2. **Accesos generales** ("Nueva cita"): en `FiPageHeader #actions`, en
   `neutral outline`. El buscador ya vive en el sidebar
   (`UDashboardSearchButton`, ⌘K): no lo dupliques.
3. **Cada cifra es un enlace** (`FiStat to`) a la lista filtrada. No añadas
   un botón "Ver" junto a cada tarjeta.
4. "Ver semana", "Ver todo": `ghost` o `link` en `#actions` de su tarjeta.
5. Nada de acciones destructivas en el inicio.

## Responsive

- `< sm`: una columna en este orden: encabezado → aviso → bandejas → hoy →
  recientes. `FiStatGrid` baja a una columna sola.
- `lg`: bandejas a todo el ancho; abajo, "Hoy" en dos columnas y "Recientes"
  en la tercera.
- La hora de cada cita va a la izquierda en ancho fijo (`w-14 tabular-nums`)
  para que la columna se lea de un vistazo. En móvil, el botón "Iniciar
  atención" baja a su propio renglón (`flex-wrap`).
- Reflujo a 320 px sin desplazamiento horizontal (WCAG 1.4.10).

## Accesibilidad

- Un solo `h1`: el de `FiPageHeader`. Cada región es una `<section>` o
  `FiSectionCard` con su `h2`.
- `FiStat` con `to` es un enlace estirado con nombre completo (rótulo y
  cifra) y foco visible en el contorno. No lo envuelvas en otro enlace ni le
  pongas un botón adentro (E-10).
- Las cifras nunca dependen solo del color: el `tone` de `FiStat` se usa solo
  cuando la cifra **es** un estado ("Vencidos"), y siempre con su rótulo.
- La agenda es una lista ordenada (`<ol>`) con `<time datetime>`.
- La línea de frescura es `role="status"` (educada). Nunca `role="alert"`
  para actualizaciones de datos.

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Encabezado de una línea con `FiPageHeader` y bandejas con conteo debajo. | Un héroe azul marino que ocupa ~60 % del viewport, repite nombre y correo del menú de usuario y termina en tres tarjetas de "valores" sin ninguna acción (inventario, `dashboard/index.vue`). |
| `FiStat` con `to` hacia la bandeja filtrada. | Calcular los pendientes para los puntos del sidebar y no mostrarlos en el inicio: otro clic obligatorio en cada sesión (inventario). |
| `FiStat tone` solo cuando la cifra es un estado. | Un API de KPI que recibe `color: string` crudo y cambia de aspecto según quién lo llame; cifras sin `tabular-nums` (C-14, D-18, E-16). |
| `FiIconBadge` (o el ícono de `FiStat`) en azul marino. | Círculos de ícono que alternan azul marino y oro, o verdes y rojos, sin ningún significado (C-25). |
| Navbar con `#left` y un solo `h1` en `FiPageHeader`. | `UDashboardNavbar :title` más un `h1` propio: dos `h1` por vista, y el del navbar con el nombre genérico del programa (C-M1, C-07). |
| Un solo botón sólido: la siguiente acción concreta. | Dos o tres `solid primary` a la vez (C-29, E-17). |
| Íconos de cifra en `text-tertiary` o `FiIconBadge`. | `text-pizarra-600`, que no genera CSS: el ícono hereda el color y se pierde (D-01, E-05). |
| Solo modo claro. | Un grupo "Apariencia" con claro/oscuro/sistema en la paleta de comandos de una app que se dice solo clara: produce un tema híbrido (D-M3, M-01). |

## Ejemplo de referencia en PSM

`app/pages/dashboard/index.vue` en PSM-SI-V2 es hoy el **anti-ejemplo**: héroe
decorativo sin acciones. Las piezas para el rediseño ya existen en el
proyecto: `useOperatorReminders` y `useDashboardNavigation` calculan los
pendientes (los puntos del sidebar), `useRecentDestinations` guarda los
recientes, `useRevalidateOnFocus` revalida al volver a la pestaña, y
`app/pages/dashboard/mi-trabajo.vue` tiene el avance personal que hoy solo se
alcanza desde el menú de usuario. El inventario propone: franja delgada de
saludo, tarjetas de bandeja con conteo y enlace (solo con permiso), agenda de
hoy con "Iniciar atención", banner de sesiones abiertas y, para coordinación,
el estado de la recepción pública y tres indicadores de la semana. El layout
del shell está en `app/layouts/dashboard.vue`; hoy envuelve la vista en un
`UDashboardPanel` propio, lo que impide la lista-detalle.

## Fuentes

- Nielsen Norman Group, *Dashboards: Making Charts and Graphs Easier to Understand* (vistazo, operativo vs. analítico, sin pasteles ni medidores). https://www.nngroup.com/articles/dashboards-preattentive/
- Carbon Design System, *Dashboards* (jerarquía, patrón F, pocas métricas). https://carbondesignsystem.com/data-visualization/dashboards/
- Shopify App Home, *Homepage template* (acciones en el encabezado, un banner, tarjetas de métricas, elementos que requieren atención). https://shopify.dev/docs/api/app-home/latest/patterns/templates/homepage
- Primer, *Degraded experiences* (la región que falla no tumba la página). https://primer.style/product/ui-patterns/degraded-experiences/
- Nielsen Norman Group, *Skeleton screens*. https://www.nngroup.com/articles/skeleton-screens/
