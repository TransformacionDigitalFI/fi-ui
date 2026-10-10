# Arquetipo `live-session` — Sesión de trabajo en vivo

El espacio de trabajo **durante** una atención: una sola tarea al centro (la
nota, con autoguardado), el contexto de la persona a un lado, una barra fija
con el estado y el tiempo, y una sola salida explícita ("Finalizar sesión")
que lleva al flujo de cierre.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** la persona del equipo que atiende (en PSM: asesor en una
  sesión individual o quien facilita una sesión grupal).
- **Tarea:** escribir lo necesario mientras conversa, con el contexto de la
  persona a la mano, y terminar la atención con sus tiempos reales.
- **Éxito:** nunca se pierde lo escrito, la persona sabe en todo momento si
  está guardado, y "Finalizar" no se dispara por accidente.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Una atención en curso con nota y cronómetro. | Consultar el historial completo de alguien: es [`record-detail`](record-detail.md). |
| Una sesión grupal: nota grupal, asistencia y notas individuales. | El cierre con varios pasos y consecuencias (siguiente cita, conclusión): es [`internal-task-flow`](internal-task-flow.md), y va **después** de esta vista. |
| | Registrar sesiones pasadas: es [`bulk-entry`](bulk-entry.md). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | Dos `UDashboardPanel` hermanos: trabajo (`id="sesion-trabajo"`, crece) y contexto (`id="sesion-contexto"`, `class="hidden xl:flex xl:max-w-md"`). | Modo foco: el sidebar se colapsa al entrar. Por debajo de `xl`, el contexto va en `USlideover`. |
| 1 | Barra de sesión | `#header` del panel de trabajo: `` UDashboardNavbar :title="`Sesión con ${name}`" `` con `FiStatusBadge` "En curso" en `#trailing` y **"Finalizar sesión"** en `#right`. | **Excepción al marco:** aquí no hay `FiPageHeader`; el `title` del navbar es el `h1`. Está en `#header`, que no se desplaza: siempre visible. |
| 2 | Estado | `UDashboardToolbar` bajo el navbar: tiempo transcurrido (`role="timer"`) y estado de guardado (`role="status"`). En `< xl`, botón "Contexto". | Silencioso: sin toasts por cada guardado. |
| 3 | Trabajo | `FiSectionCard title="Nota de la sesión"` con campos estructurados (si los hay) y el texto libre en `UFormField` + `UTextarea autoresize` (o el editor del proyecto). | El editor va en tarjeta, como el resto (D-28). Con etiqueta real, no un `<span>` (D-09, D-32). |
| 4 | Contexto | En el panel de contexto: `UDashboardNavbar :toggle="false"` con `<h2>Contexto</h2>` en `#left`; cuerpo con identidad (`UUser`), alertas vigentes (`UAlert`), malestares activos (`UBadge neutral subtle`), contactos de emergencia (enlaces `tel:`), últimas 3 notas y próxima cita. | **Compacto y de solo lectura.** El historial completo se abre aparte ("Ver historial completo"), nunca en un modal sobre el editor. |
| 5 | Confirmación de salida | `UModal :close="false"` que dice qué pasa al finalizar: [Seguir en la sesión] [Finalizar sesión]. | Al confirmar: guarda lo pendiente, registra la hora de término y lleva al flujo de cierre. |

Variante grupal: un `UStepper disabled` arriba del trabajo muestra las fases
(Sesión → Asistencia → Notas individuales → Salida) para que quien facilita
sepa cuántos pasos faltan. La asistencia es un `URadioGroup` por persona
("Asistió · No asistió") con "Marcar a todas como presentes"; nunca botones
sólidos verde/rojo.

### Esqueleto

```vue
<!-- pages/dashboard/operacion/sesion/[id]/index.vue -->
<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints, useEventListener, useNow, watchDebounced } from '@vueuse/core'
import ConfirmDialog from '~/components/app/ConfirmDialog.vue' // el diálogo único del proyecto (patterns.md)

const route = useRoute()
const sessionId = computed(() => String(route.params.id))

const { data: session, status, error, refresh } = useLazyFetch<SessionView>(() => `/api/sesiones/${sessionId.value}`)
const firstLoad = computed(() => status.value === 'pending' && !session.value)

// ── Tiempo transcurrido: discreto y por minuto. Nunca termina la sesión solo.
const now = useNow({ interval: 30_000 })
const elapsedLabel = computed(() => {
  if (!session.value) return ''
  const minutes = Math.max(0, Math.floor((now.value.getTime() - Date.parse(session.value.startedAt)) / 60_000))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
})

// ── Autoguardado: borrador en el servidor; el cierre es una acción aparte.
type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'
const note = ref('')
const saveState = ref<SaveState>('idle')
const savedAtLabel = ref('')
const dirty = ref(false)

watch(note, () => {
  dirty.value = true
})
watchDebounced(note, () => saveNow(), { debounce: 1500 })

async function saveNow() {
  if (!dirty.value) return
  saveState.value = 'saving'
  try {
    await $fetch(`/api/sesiones/${sessionId.value}/nota`, { method: 'PUT', body: { content: note.value } })
    dirty.value = false
    saveState.value = 'saved'
    savedAtLabel.value = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date())
  } catch {
    // Sin red: el borrador se queda en esta pestaña hasta que vuelva la conexión.
    // keepLocalDraft = helper del proyecto: sessionStorage con try/catch, por sesión.
    saveState.value = navigator.onLine ? 'error' : 'offline'
    keepLocalDraft(sessionId.value, note.value)
  }
}

const saveLabel = computed(() => ({
  idle: 'Sin cambios',
  saving: 'Guardando…',
  saved: `Guardado ${savedAtLabel.value}`,
  offline: 'Sin conexión: guardado en este equipo',
  error: 'No se pudo guardar',
})[saveState.value])

// ⌘S / Ctrl+S guarda ya, también con el foco en el editor.
defineShortcuts({ meta_s: { usingInput: true, handler: () => saveNow() } })

// ── Nunca perder lo escrito: aviso al cerrar la pestaña y al navegar.
useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
  if (dirty.value) event.preventDefault()
})

const overlay = useOverlay()
const confirmLeave = overlay.create(ConfirmDialog)

onBeforeRouteLeave(async () => {
  await saveNow()
  if (!dirty.value) return true
  return (await confirmLeave.open({
    title: '¿Salir sin guardar la nota?',
    description: 'Lo último que escribiste no se pudo guardar. Si sales ahora, se pierde.',
    confirmLabel: 'Salir sin guardar',
  })) === true
})

// ── Finalizar: confirmación que dice qué pasa, y luego el flujo de cierre.
const isFinishOpen = ref(false)
const finishing = ref(false)
const finishError = ref<string | null>(null)

async function finish() {
  finishing.value = true
  finishError.value = null
  try {
    await saveNow()
    await $fetch(`/api/sesiones/${sessionId.value}/finalizar`, { method: 'POST' })
    isFinishOpen.value = false
    await navigateTo(`/dashboard/operacion/sesion/${sessionId.value}/salida`)
  } catch {
    finishError.value = 'No se pudo finalizar la sesión. Tu nota está guardada; inténtalo de nuevo.'
  } finally {
    finishing.value = false
  }
}

const isWide = useBreakpoints(breakpointsTailwind).greaterOrEqual('xl')
const isContextOpen = ref(false)
</script>

<template>
  <UDashboardPanel id="sesion-trabajo">
    <template #header>
      <!-- Excepción: sin FiPageHeader, el title del navbar es el h1. El header
           del panel no se desplaza, así que la barra queda siempre visible. -->
      <UDashboardNavbar :title="session ? `Sesión con ${session.personName}` : 'Sesión'">
        <template #leading>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
        </template>
        <template #trailing>
          <FiStatusBadge v-if="session" status="info" icon="i-ph-play-circle" label="En curso" size="sm" />
        </template>
        <template #right>
          <UButton label="Finalizar sesión" icon="i-ph-flag-checkered" :disabled="!session" @click="isFinishOpen = true;" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <p class="flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-ph-timer" class="size-4" />
            <span role="timer" aria-label="Tiempo transcurrido" class="tabular-nums">{{ elapsedLabel }}</span>
          </p>
          <p role="status" class="flex items-center gap-1.5 text-sm" :class="saveState === 'error' ? 'text-error' : 'text-muted'">
            <UIcon
              :name="saveState === 'error' ? 'i-ph-warning-circle' : saveState === 'offline' ? 'i-ph-wifi-slash' : 'i-ph-cloud-check'"
              class="size-4"
              :class="saveState === 'saving' && 'motion-safe:animate-pulse'"
            />
            {{ saveLabel }}
          </p>
          <UButton v-if="saveState === 'error'" label="Reintentar" color="neutral" variant="link" size="sm" @click="saveNow()" />
        </template>
        <template #right>
          <UButton v-if="!isWide" label="Contexto" icon="i-ph-sidebar-simple" color="neutral" variant="outline" size="sm" @click="isContextOpen = true;" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UAlert
        v-if="error"
        role="alert"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        title="No pudimos abrir la sesión"
        :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
      />

      <div v-else-if="firstLoad" role="status">
        <span class="sr-only">Cargando la sesión…</span>
        <USkeleton class="h-96 rounded-2xl" aria-hidden="true" />
      </div>

      <FiSectionCard v-else title="Nota de la sesión" icon="i-ph-note-pencil" class="mx-auto w-full max-w-3xl">
        <UFormField label="Nota" description="Se guarda sola mientras escribes. Puedes completarla al cerrar la sesión.">
          <UTextarea v-model="note" :rows="14" autoresize class="w-full" />
        </UFormField>
      </FiSectionCard>
    </template>
  </UDashboardPanel>

  <UDashboardPanel id="sesion-contexto" class="hidden xl:flex xl:max-w-md">
    <template #header>
      <UDashboardNavbar :toggle="false">
        <template #left>
          <h2 class="text-base font-semibold text-highlighted">Contexto</h2>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <SessionContext v-if="session" :session="session" />
    </template>
  </UDashboardPanel>

  <USlideover v-if="!isWide" v-model:open="isContextOpen" title="Contexto" description="Datos de la persona para esta sesión">
    <template #body>
      <SessionContext v-if="session" :session="session" />
    </template>
  </USlideover>

  <!-- :close="false": el primer control enfocable es "Seguir en la sesión". -->
  <UModal
    v-model:open="isFinishOpen"
    :title="`¿Finalizar la sesión con ${session?.personName}?`"
    description="Se registra la hora de término y la nota queda guardada. Después llenarás la forma de salida: nota final, siguiente cita y malestares."
    :close="false"
  >
    <template v-if="finishError" #body>
      <UAlert role="alert" color="error" variant="subtle" icon="i-ph-warning-circle" :title="finishError" />
    </template>
    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton label="Seguir en la sesión" color="neutral" variant="outline" @click="close" />
        <UButton label="Finalizar sesión" :loading="finishing" @click="finish()" />
      </div>
    </template>
  </UModal>
</template>
```

`SessionContext` es una columna de `FiSectionCard :heading-level="3"` (bajo el
`h2` "Contexto"): identidad, alertas vigentes, malestares activos, contactos
de emergencia, últimas notas y próxima cita, con un enlace "Ver historial
completo" que abre el registro en otra pestaña (ícono
`i-ph-arrow-square-out` + `sr-only` "(se abre en otra pestaña)"). El
`ConfirmDialog` es el diálogo único del proyecto
([patterns.md](../patterns.md#acciones-destructivas-y-confirmación)).

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Esqueleto con la forma de las dos columnas (editor alto + tarjetas de contexto), una sola región `role="status"`. La barra de sesión ya muestra el botón (deshabilitado) y el título genérico. | Nunca un spinner de página (D-20). |
| Error de carga | `UAlert color="error" role="alert"` con "Reintentar". | La variante grupal no lo tenía (solo "no encontrada"): toda vista en vivo lo necesita. |
| Sin acceso vigente al registro | Se manda al flujo de solicitud de acceso con la explicación, no a un "no se pudo cargar". | Un 403 que tiene trámite no es un error que reintentar. |
| Guardando / guardado | En la barra: "Guardando…" → "Guardado 10:41". | Silencioso: nada de toasts por cada guardado. |
| Sin conexión | "Sin conexión: guardado en este equipo", con el borrador en `sessionStorage` (se borra al sincronizar). | Notas sensibles: nunca en `localStorage`, que sobrevive al cierre de sesión en una computadora compartida. |
| Error al guardar | Texto en `text-error` con ícono y "Reintentar" en la barra. | Persiste hasta que se guarda. |
| Editada en otro lado | `UAlert color="warning"`: "Esta nota cambió en otra pestaña a las 10:43" con "Ver la otra versión" y "Conservar la mía". | Ante un conflicto se conservan las dos versiones; nunca gana la última en silencio. |
| Sesión ya finalizada | `UAlert color="info"` "Esta sesión terminó a las 10:50" con enlace a la forma de salida; editor en solo lectura. | — |
| Tiempo de sesión de la cuenta por vencer | `UModal` al menos 20 s antes, con "Seguir conectado" en un clic; el borrador se guarda antes. | WCAG 2.2.1. |

## Jerarquía de acciones

1. **"Finalizar sesión"**: único botón sólido, en la barra fija. Siempre
   confirma con un `UModal` que dice qué pasa (hora de término, y que sigue la
   forma de salida). No es destructiva: el botón del diálogo es `primary`, no
   `error`. También en la variante grupal, que antes saltaba directo a
   asistencia (inventario).
2. **Guardar** no es un botón grande: es automático. "Reintentar" aparece
   solo si falló; ⌘S fuerza el guardado.
3. **Acciones del contexto** ("Agregar malestar", "Agregar contacto"):
   `neutral outline size="sm"` en `#actions` de su tarjeta, y abren un
   `USlideover`, no un modal encima del editor.
4. **Sin "Regresar"** en la barra. Salir de la vista es posible por el
   sidebar, con la guarda de cambios sin guardar. La sesión sigue abierta y el
   inicio avisa "Tienes una sesión abierta".
5. En la variante grupal, "Siguiente fase" es el sólido de cada fase, y la
   fase final lleva a la forma de salida.

## Responsive

- `≥ xl`: dos paneles; el de contexto mide hasta 28 rem (`xl:max-w-md`) y el
  de trabajo toma el resto (≈ 70/30).
- `< xl`: un panel; el contexto abre en `USlideover` desde "Contexto" en la
  barra de estado.
- `< sm`: el título del navbar se trunca; "Finalizar sesión" se queda
  visible. La barra de estado envuelve sus dos datos en dos renglones si hace
  falta.
- Alturas con `dvh`, nunca `vh` (D-29). La nota se limita a `max-w-3xl` para
  que las líneas no pasen de ~75 caracteres.

## Accesibilidad

- Un solo `h1` (el `title` del navbar). El contexto es `h2`, sus tarjetas
  `h3`.
- Estado de guardado en `role="status"` (WCAG 4.1.3); el reloj en
  `role="timer"`, que no se anuncia a cada cambio.
- El editor tiene etiqueta real (`UFormField label`), no un `<p>` o `<span>`
  encima (D-09, D-32).
- Los íconos que giran o laten van con `motion-safe:` (D-31).
- Atajos con modificador (⌘S), nunca de una sola tecla mientras se escribe
  (WCAG 2.1.4).
- La barra fija no tapa el foco: el cuerpo del panel es el que se desplaza.
- Variante grupal: asistencia con `URadioGroup` (`legend` = nombre de la
  persona); "No asistió" en `neutral`, nunca un botón sólido rojo (D-09,
  D-M5).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Contexto compacto (identidad, alertas, malestares activos, contactos, últimas notas) y "Ver historial completo" aparte. | El panel completo del registro (cinco cifras, línea del tiempo, pestañas, historial, notas) junto al editor durante la conversación (inventario). |
| Barra fija con tiempo transcurrido y estado de guardado. | Sin reloj, y el estado de guardado escondido dentro del editor (inventario). |
| Guarda de navegación y `beforeunload` con cambios sin guardar. | Un botón de volver que abandona la sesión en curso sin aviso (inventario). |
| Confirmación para finalizar, también en grupo. | "Terminar" en la sesión grupal que ejecuta directo y salta a asistencia (inventario). |
| Fases visibles con `UStepper disabled`. | Fases que aparecen una tras otra sin saber cuántas faltan (inventario). |
| `URadioGroup` para la asistencia, "No asistió" en `neutral`. | Botones sólido/outline verde y rojo sin `radiogroup` ni `aria-pressed`, y "Ausente" en `error` (D-09, D-M5). |
| La barra de sesión en el `#header` del panel. | Cuatro encabezados hechos a mano (flecha + `h1` + metadatos) con espaciados distintos, y paneles con `100vh` (D-29). |
| Botones de solo ícono con `aria-label`. | La flecha de volver sin nombre accesible (D-08). |
| El editor dentro de su `FiSectionCard`. | El editor flotando sobre la pizarra junto a una columna de tarjetas (D-28). |
| Esqueleto de dos columnas. | Spinner de página (D-20). |
| Íconos de grupo con el presenter de tipo (`secondary`). | Ícono de grupo en `text-violet-500` (D-02). |
| `text-error` para el error de guardado. | `text-error-600 dark:text-error-400`: tono que no pasa AA y una variante oscura muerta (D-06, D-26). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/operacion/sesion/[id]/index.vue`: sesión individual.
  Lo bueno: `UModal` para completar, guardado antes de finalizar
  (`saveIfDirty`), y el 403 de "acceso vencido" que manda a solicitar acceso
  en vez de mostrar un error. Además, la decisión de producto vale como regla:
  **la nota no bloquea el cierre**; mientras se conversa lo esperable es no
  escribir, y la nota se completa en la forma de salida.
- `app/components/operacion/SessionNoteEditor.vue`: ya usa `role="status"`
  para el guardado; falta moverlo a la barra fija, ponerlo en tarjeta y dar
  etiqueta al editor.
- `app/pages/dashboard/operacion/sesion-grupal/[id].vue`: variante grupal; el
  inventario propone `UStepper` fijo (Sesión → Asistencia → Notas
  individuales → Salida), `URadioGroup` por fila con "Marcar a todas como
  presentes", confirmación al terminar y región de error con reintento.

## Fuentes

- Android Developers, *Canonical layouts: supporting pane* (70/30, panel inferior en pantallas compactas). https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts
- Primer, *Saving* (guardado explícito vs. automático, aviso de cambios sin guardar). https://primer.style/product/ui-patterns/saving/
- SAP Fiori, *Draft handling* (el borrador automático no sustituye al guardado explícito; indicador de guardado). https://www.sap.com/design-system/fiori-design-web/v1-96/foundations/best-practices/global-patterns/object-handling/draft-handling
- W3C WAI, *Understanding 2.2.1 Timing Adjustable* (aviso y extensión antes de un tiempo límite). https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- Nuxt UI, *DashboardPanel*. https://ui.nuxt.com/docs/components/dashboard-panel
