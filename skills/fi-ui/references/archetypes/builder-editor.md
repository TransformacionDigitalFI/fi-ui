# Arquetipo `builder-editor` — Constructor o editor versionado

Compone algo que **otras personas van a usar tal como se publique**: un
cuestionario (secciones, preguntas, condiciones), un aviso legal, una
plantilla de documento. Se trabaja en un **borrador** que se guarda solo, se
prueba en una **vista previa** fiel y se **publica** con una confirmación que
dice qué cambia. Lo publicado queda bloqueado: para cambiarlo, se crea una
versión nueva.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** coordinación o administración con permiso sobre el artefacto.
  Trabaja en sesiones largas y con interrupciones.
- **Tarea:** armar o corregir el contenido, comprobar cómo lo verá quien lo
  conteste, y publicarlo sabiendo a quién afecta.
- **Éxito:** nunca pierde trabajo (el borrador se guarda solo y lo dice),
  reordena sin mouse, y al publicar sabe qué versión queda bloqueada y quién
  empieza a usarla.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Contenido con estructura y **versiones**: cuestionarios, avisos legales, plantillas de constancia o de correo. | La lista de cuestionarios (buscar, crear, archivar): es [`catalog-admin`](catalog-admin.md); desde ahí se abre este editor. |
| Cualquier cosa con estados borrador → publicado → archivado. | Un formulario corto de un registro (≤ 6 campos): es un `UModal` del catálogo. |
| | Escribir un documento de un caso con consecuencias (nota, derivación): es [`internal-task-flow`](internal-task-flow.md). |
| | Ajustes de un objeto sin versiones (interruptor de la recepción): es [`settings`](settings.md). |

## Modelo de estados

| Estado de la versión | `FiStatusBadge` | Se puede | No se puede |
|---|---|---|---|
| Borrador | `status="neutral"` "Borrador", `icon="i-ph-pencil-simple-line"` | Editar (autoguardado), vista previa, publicar | Asignarse ni contestarse |
| Publicada (vigente) | `status="success"` "Publicada" | Vista previa, crear la versión siguiente, ver historial | Editar: **solo lectura** |
| Archivada | `status="neutral"` "Archivada", `icon="i-ph-archive"` | Vista previa, ver historial | Editar, publicar |

Reglas del modelo:

- **Una sola versión publicada a la vez** por artefacto. Publicar la N archiva
  la N-1.
- **Lo publicado no se edita, se versiona.** "Crear versión N+1" copia la
  publicada en un borrador nuevo.
- El número de versión va en un `UBadge color="neutral" variant="outline"`
  ("Versión 3") junto al estado; nunca mezclado con badges de tipo o
  aplicación en colores de estado (E-04).
- El tipo del artefacto ("Tamizaje", "Instrumento") es categoría: `UBadge
  neutral outline` con ícono, nunca rojo/ámbar/verde (E-04).

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar` con `#left` (`UBreadcrumb`: Cuestionarios › nombre) | Sin `title` en el navbar. |
| 1 | Barra del editor (fija) | `FiPageHeader :rule="false" back="…"` **en el `#header` del panel**: `#badges` = estado + versión; `#actions` = indicador de guardado (`role="status"`), "Vista previa" `neutral outline`, y **la** acción de la versión en `primary solid`: "Publicar versión N" (borrador) o "Crear versión N+1" (publicada). | Va en `#header`: queda a la vista mientras el cuerpo se desplaza. "Publicar" vive aquí, no enterrado en una tarjeta de metadatos (inventario). |
| 2 | Avisos | **Uno** a la vez, en este orden de prioridad: error de guardado (`UAlert color="error"`, persiste, "Reintentar"); problemas antes de publicar (`UAlert color="error"` con lista de enlaces); solo lectura (`UAlert color="info"` con candado). | Nunca un toast para "no se guardó". |
| 3 | Índice (≥ lg) | `<nav aria-label="Índice">` con `<ol>` de secciones y preguntas como enlaces de ancla, `sticky`. | Cuestionarios largos se recorren por el índice, no con scroll infinito. |
| 4 | Contenido | Una `FiSectionCard` por sección (`headingLevel` 2, `:padded="false"`, `divided`), con `<ol class="divide-y">` de preguntas. Cada pregunta: resumen como **botón de disclosure** (`aria-expanded`) + controles **siempre visibles** (Subir, Bajar, Quitar) + panel de edición con `UFormField`. | Nada de `<div @click>` ni controles `opacity-0 group-hover` (E-09). Filas, no tarjetas dentro de la tarjeta. |
| 5 | Agregar | "Agregar pregunta" `neutral ghost` en el `#footer` de cada sección; "Agregar sección" `neutral outline` al final. | Nunca sólidos: el sólido es "Publicar". |
| 6 | Vista previa | `USlideover side="right"` con `UTabs` "Teléfono · Escritorio" y **el mismo componente** que contesta la persona usuaria, en modo de prueba. | Sin salir del editor (inventario). La ruta `/vista-previa` queda solo para enlaces directos. |
| 7 | Publicar | `ConfirmDialog tone="primary"` que nombra la versión, dice que queda bloqueada y cuántas asignaciones/campañas empiezan a usarla. | Publicar es irreversible: **siempre** confirma (E-30, inventario). |
| 8 | Historial de versiones | `USlideover` con `UTable` (versión, `FiStatusBadge`, fecha, quién publicó) abierto desde "Más acciones". | Solo lectura. |

Ancho: `max-w-7xl`, el de las vistas de trabajo ([patterns.md](../patterns.md#responsive)). Con índice: `lg:grid-cols-[15rem_minmax(0,1fr)]`. Un
inspector a la derecha (opciones, condiciones) solo si el contenido lo pide, a
partir de `xl`; abajo de eso, el panel de edición de cada pregunta lo
sustituye.

### Autoguardado del borrador

El borrador se guarda solo, con espera de 1.5 s tras el último cambio, y **lo
dice** siempre. Esto vale solo para borradores versionados; en
[`settings`](settings.md) los textos se guardan con un botón.

```ts
// composables/useDraftAutosave.ts
import { useDebounceFn, useEventListener } from '@vueuse/core'
import type { Ref } from 'vue'

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

export function useDraftAutosave<T>(draft: Ref<T | null>, save: (value: T) => Promise<unknown>, delay = 1500) {
  const state = ref<SaveState>('saved')
  const savedAt = ref<Date | null>(null)
  // Comparar contra lo último que confirmó el servidor, no contar teclas.
  let lastSaved = ''

  async function flush() {
    if (!draft.value) return
    const snapshot = JSON.stringify(draft.value)
    if (snapshot === lastSaved) {
      state.value = 'saved'
      return
    }
    state.value = 'saving'
    try {
      await save(JSON.parse(snapshot) as T)
      lastSaved = snapshot
      savedAt.value = new Date()
      // Si se siguió escribiendo durante el guardado, sigue sucio.
      state.value = JSON.stringify(draft.value) === lastSaved ? 'saved' : 'dirty'
    } catch {
      state.value = 'error' // los cambios siguen en pantalla; el aviso ofrece reintentar
    }
  }

  const scheduleSave = useDebounceFn(flush, delay)

  watch(draft, (value) => {
    if (!value || JSON.stringify(value) === lastSaved) return
    state.value = 'dirty'
    void scheduleSave()
  }, { deep: true })

  /** Lo que acaba de llegar del servidor es la nueva base (carga, recarga, versión nueva). */
  function reset(value: T) {
    lastSaved = JSON.stringify(value)
    state.value = 'saved'
  }

  // Cerrar la pestaña con cambios sin guardar: el navegador pregunta.
  useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
    if (state.value !== 'saved') event.preventDefault()
  })

  return { state, savedAt, flush, reset }
}
```

### Esqueleto de la vista

```vue
<!-- pages/dashboard/gestion/cuestionarios/[id]/index.vue -->
<script setup lang="ts">
import type { FiStatus } from '@fi-unam/ui'
import ConfirmDialog from '~/components/app/ConfirmDialog.vue'
import type { SaveState } from '~/composables/useDraftAutosave'
import type { QuestionnaireVersion, Section, VersionState } from '~/types/questionnaire'

// ~/types/questionnaire.ts
//   type VersionState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
//   type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT'
//   interface Question { id: string, text: string, type: QuestionType, required: boolean }
//   interface Section { id: string, title: string, questions: Question[] }
//   interface QuestionnaireVersion {
//     id: string, name: string, number: number, state: VersionState, sections: Section[]
//     publishedAtLabel: string | null
//     usage: { assignments: number, activeCampaigns: number } // quién empieza a usarla al publicar
//   }

const VERSION_STATE: Record<VersionState, { status: FiStatus, label: string, icon: string }> = {
  DRAFT: { status: 'neutral', label: 'Borrador', icon: 'i-ph-pencil-simple-line' },
  PUBLISHED: { status: 'success', label: 'Publicada', icon: 'i-ph-check-circle' },
  ARCHIVED: { status: 'neutral', label: 'Archivada', icon: 'i-ph-archive' },
}

const SAVE_TEXT: Record<SaveState, { label: string, icon: string }> = {
  saved: { label: 'Guardado', icon: 'i-ph-check' },
  dirty: { label: 'Cambios sin guardar', icon: 'i-ph-dot-outline' },
  saving: { label: 'Guardando…', icon: 'i-ph-cloud-arrow-up' },
  error: { label: 'No se guardó', icon: 'i-ph-warning-circle' },
}

const route = useRoute()
const toast = useToast()
const confirmDialog = useOverlay().create(ConfirmDialog)

const { data, status, error, refresh } = useLazyFetch<QuestionnaireVersion>(() => `/api/questionnaires/versions/${route.params.id}`)

// `draft` es la copia que se edita y se autoguarda; `data`, lo último confirmado.
const draft = ref<QuestionnaireVersion | null>(null)
const { state: saveState, flush, reset } = useDraftAutosave(draft, value =>
  $fetch(`/api/questionnaires/versions/${value.id}`, { method: 'PUT', body: { sections: value.sections } }),
)
watch(data, (value) => {
  if (!value) return
  reset(value)
  draft.value = structuredClone(value)
}, { immediate: true })

const isReadOnly = computed(() => draft.value?.state !== 'DRAFT')
const isPreviewOpen = ref(false)
const publishing = ref(false)

// ── Publicar: validar → confirmar con consecuencia → guardar lo pendiente → publicar.
const publishProblems = ref<{ id: string, message: string }[]>([])
const problemsAlert = useTemplateRef<{ $el: HTMLElement }>('problems-alert')

async function publish() {
  const version = draft.value
  if (!version) return

  publishProblems.value = findPublishProblems(version) // [{ id: 'q-…', message: 'Pregunta 4 sin texto' }]
  if (publishProblems.value.length) {
    await nextTick()
    problemsAlert.value?.$el.focus() // el resumen recibe el foco; cada problema enlaza a su pregunta
    return
  }

  const { assignments, activeCampaigns } = version.usage
  const confirmed = await confirmDialog.open({
    title: `¿Publicar la versión ${version.number} de «${version.name}»?`,
    description: `La versión ${version.number} quedará bloqueada: ya no podrás editarla. Desde ahora la usarán ${assignments} asignaciones y ${activeCampaigns} campañas activas; la versión anterior se archiva.`,
    confirmLabel: `Publicar versión ${version.number}`,
    tone: 'primary',
  })
  if (confirmed !== true) return

  publishing.value = true
  try {
    await flush() // nunca publicar con cambios sin guardar
    if (saveState.value !== 'saved') return // el aviso de error de guardado ya está en pantalla
    await $fetch(`/api/questionnaires/versions/${version.id}/publish`, { method: 'POST' })
    toast.add({ title: `Versión ${version.number} publicada`, color: 'success', icon: 'i-ph-check-circle' })
    await refresh()
  } finally {
    publishing.value = false
  }
}

// ── Salir con cambios: primero intenta guardar; si no se puede, pregunta.
onBeforeRouteLeave(async () => {
  if (saveState.value === 'saved') return true
  await flush()
  if (saveState.value === 'saved') return true
  const leave = await confirmDialog.open({
    title: '¿Salir sin guardar?',
    description: 'No se pudieron guardar los últimos cambios del borrador. Si sales, se pierden.',
    confirmLabel: 'Salir sin guardar',
  })
  return leave === true
})
</script>

<template>
  <UDashboardPanel id="cuestionario-editor">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Cuestionarios', to: '/dashboard/gestion/cuestionarios' }, { label: draft?.name ?? '…' }]" />
        </template>
      </UDashboardNavbar>

      <!-- Barra del editor: en #header para que estado y "Publicar" no se pierdan al desplazar. -->
      <div class="border-b border-default px-4 py-4 sm:px-6">
        <FiPageHeader
          :title="draft?.name ?? 'Cuestionario'"
          description="Tamizaje · se aplica en el primer contacto"
          :description-loading="!draft"
          back="/dashboard/gestion/cuestionarios"
          :rule="false"
        >
          <template v-if="draft" #badges>
            <FiStatusBadge v-bind="VERSION_STATE[draft.state]" />
            <UBadge :label="`Versión ${draft.number}`" color="neutral" variant="outline" />
          </template>

          <template #actions>
            <p v-if="draft && !isReadOnly" role="status" class="flex items-center gap-1.5 text-sm text-muted">
              <UIcon :name="SAVE_TEXT[saveState].icon" class="size-4" aria-hidden="true" />
              {{ SAVE_TEXT[saveState].label }}
            </p>
            <UDropdownMenu
              :items="[[
                { label: 'Editar datos del cuestionario', icon: 'i-ph-pencil-simple', onSelect: editMetadata },
                { label: 'Historial de versiones', icon: 'i-ph-clock-counter-clockwise', onSelect: openVersionHistory },
              ]]"
              :content="{ align: 'end' }"
            >
              <UButton label="Más acciones" icon="i-ph-dots-three" color="neutral" variant="outline" />
            </UDropdownMenu>
            <UButton label="Vista previa" icon="i-ph-eye" color="neutral" variant="outline" :disabled="!draft" @click="isPreviewOpen = true;" />
            <!-- La única acción sólida: la de la versión. -->
            <UButton
              v-if="draft?.state === 'DRAFT'"
              :label="`Publicar versión ${draft.number}`"
              icon="i-ph-paper-plane-tilt"
              :loading="publishing"
              @click="publish()"
            />
            <UButton
              v-else-if="draft?.state === 'PUBLISHED'"
              :label="`Crear versión ${draft.number + 1}`"
              icon="i-ph-copy"
              @click="createNextVersion()"
            />
          </template>
        </FiPageHeader>
      </div>
    </template>

    <template #body>
      <div v-if="status === 'pending' && !draft" role="status" class="mx-auto w-full max-w-7xl">
        <span class="sr-only">Cargando el cuestionario…</span>
        <div class="flex flex-col gap-6" aria-hidden="true">
          <USkeleton v-for="n in 3" :key="n" class="h-48 rounded-2xl" />
        </div>
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        role="alert"
        title="No se pudo abrir el cuestionario"
        :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
      />

      <div v-else-if="draft" class="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Índice del cuestionario" class="hidden lg:block">
          <ol class="sticky top-0 flex flex-col gap-3 text-sm">
            <li v-for="(section, sIndex) in draft.sections" :key="section.id">
              <ULink :to="`#s-${section.id}`" class="font-semibold text-highlighted">{{ section.title || `Sección ${sIndex + 1}` }}</ULink>
              <ol class="mt-1 flex flex-col gap-1 border-s border-default ps-3">
                <li v-for="(question, qIndex) in section.questions" :key="question.id">
                  <ULink :to="`#q-${question.id}`" class="line-clamp-1 text-muted hover:text-highlighted">
                    {{ qIndex + 1 }}. {{ question.text || 'Pregunta sin texto' }}
                  </ULink>
                </li>
              </ol>
            </li>
          </ol>
        </nav>

        <div class="flex min-w-0 flex-col gap-6">
          <!-- Un aviso a la vez, por prioridad. -->
          <UAlert
            v-if="saveState === 'error'"
            role="alert"
            color="error"
            variant="subtle"
            icon="i-ph-warning-circle"
            title="No se pudo guardar el borrador"
            description="Tus cambios siguen aquí. Revisa la conexión e inténtalo de nuevo."
            :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => flush() }]"
          />
          <UAlert
            v-else-if="publishProblems.length"
            ref="problems-alert"
            tabindex="-1"
            role="alert"
            color="error"
            variant="subtle"
            icon="i-ph-list-checks"
            :title="`Antes de publicar, corrige ${publishProblems.length} ${publishProblems.length === 1 ? 'problema' : 'problemas'}`"
          >
            <template #description>
              <ul class="mt-1 list-disc ps-5">
                <li v-for="problem in publishProblems" :key="problem.id">
                  <ULink :to="`#${problem.id}`" class="underline">{{ problem.message }}</ULink>
                </li>
              </ul>
            </template>
          </UAlert>
          <UAlert
            v-else-if="isReadOnly"
            color="info"
            variant="subtle"
            icon="i-ph-lock-simple"
            :title="`Versión ${draft.number} ${draft.state === 'PUBLISHED' ? 'publicada' : 'archivada'}: solo lectura`"
            :description="draft.state === 'PUBLISHED'
              ? `Se publicó el ${draft.publishedAtLabel}. Para cambiarla, crea la versión ${draft.number + 1}; esta se conserva tal cual.`
              : 'Se conserva para consulta. Las respuestas que se dieron con ella siguen asociadas a esta versión.'"
          />

          <UEmpty
            v-if="!draft.sections.length"
            variant="naked"
            title="El cuestionario está vacío"
            description="Empieza con una sección; dentro de ella agregas las preguntas."
            :actions="isReadOnly ? [] : [{ label: 'Agregar sección', icon: 'i-ph-plus', color: 'neutral', variant: 'outline', onClick: () => addSection() }]"
          >
            <template #leading><FiIconBadge icon="i-ph-list-plus" size="lg" /></template>
          </UEmpty>

          <FiSectionCard
            v-for="(section, sIndex) in draft.sections"
            :id="`s-${section.id}`"
            :key="section.id"
            :title="section.title || `Sección ${sIndex + 1}`"
            :description="`${section.questions.length} ${section.questions.length === 1 ? 'pregunta' : 'preguntas'}`"
            :padded="false"
            divided
            class="scroll-mt-24"
          >
            <template v-if="!isReadOnly" #actions>
              <UButton label="Editar sección" icon="i-ph-pencil-simple" color="neutral" variant="ghost" size="sm" @click="editSection(section)" />
              <UButton icon="i-ph-trash" color="error" variant="ghost" size="sm" :aria-label="`Eliminar la sección «${section.title}»`" @click="removeSection(section)" />
            </template>

            <ol class="divide-y divide-default">
              <QuestionRow
                v-for="(question, qIndex) in section.questions"
                :key="question.id"
                v-model="section.questions[qIndex]!"
                :index="qIndex"
                :count="section.questions.length"
                :read-only="isReadOnly"
                @move="(delta) => moveQuestion(section, qIndex, delta)"
                @remove="removeQuestion(section, qIndex)"
              />
            </ol>

            <template v-if="!isReadOnly" #footer>
              <UButton label="Agregar pregunta" icon="i-ph-plus" color="neutral" variant="ghost" size="sm" @click="addQuestion(section)" />
            </template>
          </FiSectionCard>

          <UButton
            v-if="!isReadOnly && draft.sections.length"
            label="Agregar sección"
            icon="i-ph-plus"
            color="neutral"
            variant="outline"
            class="self-start"
            @click="addSection()"
          />
        </div>
      </div>

      <!-- Anuncios de reordenar (ver más abajo). -->
      <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    </template>
  </UDashboardPanel>

  <QuestionnairePreview v-if="draft" v-model:open="isPreviewOpen" :version="draft" />
</template>
```

`findPublishProblems`, `addSection`, `editSection` y `editMetadata` (un
`UModal` de ≤ 6 campos cada uno), `removeSection`, `addQuestion`,
`removeQuestion`, `openVersionHistory` (un `USlideover`) y
`createNextVersion` son del proyecto. Las reglas que deben cumplir están en
[Jerarquía de acciones](#jerarquía-de-acciones).

### La fila de pregunta

```vue
<!-- components/questionnaires/QuestionRow.vue -->
<script setup lang="ts">
import type { Question, QuestionType } from '~/types/questionnaire'

const question = defineModel<Question>({ required: true })
const props = defineProps<{ index: number, count: number, readOnly: boolean }>()
const emit = defineEmits<{ move: [delta: -1 | 1], remove: [] }>()

const TYPE: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Opción única',
  MULTIPLE_CHOICE: 'Opción múltiple',
  SCALE: 'Escala',
  TEXT: 'Texto libre',
}
const typeItems = Object.entries(TYPE).map(([value, label]) => ({ value, label }))

const open = ref(false)
const panelId = useId()
const label = computed(() => question.value.text.trim() || 'Pregunta sin texto')
</script>

<template>
  <li :id="`q-${question.id}`" class="scroll-mt-24 px-4 py-3 sm:px-5">
    <div class="flex items-start gap-3">
      <span class="w-6 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-muted">{{ props.index + 1 }}.</span>

      <!-- El resumen es un botón de disclosure real: teclado, nombre y estado. -->
      <button
        type="button"
        class="min-w-0 flex-1 rounded-lg text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click="open = !open"
      >
        <span class="block font-medium text-highlighted">{{ label }}</span>
        <span class="text-sm text-muted">{{ TYPE[question.type] }}{{ question.required ? ' · Obligatoria' : '' }}</span>
      </button>

      <!-- Controles SIEMPRE visibles (táctil y teclado). Nunca opacity-0 + group-hover. -->
      <div v-if="!props.readOnly" class="flex shrink-0 items-center gap-1">
        <UButton
          data-move="up"
          icon="i-ph-arrow-up"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="props.index === 0"
          :aria-label="`Subir «${label}»`"
          @click="emit('move', -1)"
        />
        <UButton
          data-move="down"
          icon="i-ph-arrow-down"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="props.index === props.count - 1"
          :aria-label="`Bajar «${label}»`"
          @click="emit('move', 1)"
        />
        <UButton icon="i-ph-trash" color="error" variant="ghost" size="sm" :aria-label="`Quitar «${label}»`" @click="emit('remove')" />
      </div>
    </div>

    <div v-if="open" :id="panelId" class="mt-4 ps-9">
      <!-- Solo lectura: el contenido como texto, no campos deshabilitados (bajo contraste). -->
      <dl v-if="props.readOnly" class="grid gap-3 sm:grid-cols-2">
        <div><dt class="fi-label">Texto</dt><dd class="text-default">{{ label }}</dd></div>
        <div><dt class="fi-label">Tipo de respuesta</dt><dd class="text-default">{{ TYPE[question.type] }}</dd></div>
      </dl>

      <div v-else class="flex flex-col gap-4">
        <UFormField label="Texto de la pregunta" :name="`q-${question.id}-text`">
          <UTextarea v-model="question.text" :rows="2" autoresize class="w-full" />
        </UFormField>
        <UFormField label="Tipo de respuesta" :name="`q-${question.id}-type`">
          <USelect v-model="question.type" :items="typeItems" class="w-full sm:w-64" />
        </UFormField>
        <!-- USwitch con su label, no un span hermano (E-22). -->
        <USwitch v-model="question.required" label="Obligatoria" description="La persona no puede continuar sin contestarla." />
      </div>
    </div>
  </li>
</template>
```

### Reordenar con teclado

El orden se cambia con **botones** "Subir" y "Bajar" en cada elemento. El
arrastre es una mejora opcional (p. ej. `useSortable` de
`@vueuse/integrations`), nunca el único camino: WCAG 2.5.7 pide una
alternativa de un solo puntero y el teclado no arrastra (E-09).

```ts
const announcement = ref('')

async function moveQuestion(section: Section, index: number, delta: -1 | 1) {
  const target = index + delta
  if (target < 0 || target >= section.questions.length) return

  const [moved] = section.questions.splice(index, 1)
  section.questions.splice(target, 0, moved!)

  // Se anuncia la posición nueva: quien usa lector de pantalla no ve el salto.
  announcement.value = `«${moved!.text || 'Pregunta sin texto'}» ahora es la pregunta ${target + 1} de ${section.questions.length}.`

  // El foco sigue al elemento movido. Si su botón quedó deshabilitado (llegó a
  // un extremo), pasa al otro; nunca se pierde en <body>.
  await nextTick()
  const row = document.getElementById(`q-${moved!.id}`)
  const same = row?.querySelector<HTMLButtonElement>(`[data-move="${delta < 0 ? 'up' : 'down'}"]:not(:disabled)`)
  const other = row?.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)')
  ;(same ?? other)?.focus()
}
```

- Mover entre secciones: un `UDropdownMenu` "Mover a…" en el elemento, con las
  secciones como opciones; no pidas arrastrar de una tarjeta a otra.
- Reordenar marca el borrador como sucio y se autoguarda como cualquier otro
  cambio.
- Si hay asa de arrastre, es decorativa para el teclado (`aria-hidden="true"`,
  sin `tabindex`): los botones ya cubren esa función.

### Vista previa fiel

```vue
<!-- components/questionnaires/QuestionnairePreview.vue -->
<script setup lang="ts">
import type { QuestionnaireVersion } from '~/types/questionnaire'

const open = defineModel<boolean>('open', { required: true })
defineProps<{ version: QuestionnaireVersion }>()
const width = ref<'phone' | 'desktop'>('phone') // la mayoría contesta en el teléfono
</script>

<template>
  <USlideover
    v-model:open="open"
    side="right"
    :title="`Vista previa · versión ${version.number}`"
    description="Así lo verá quien conteste. Las respuestas de la vista previa no se guardan."
    :ui="{ content: 'max-w-4xl' }"
  >
    <template #body>
      <UTabs
        v-model="width"
        :items="[{ label: 'Teléfono', value: 'phone', icon: 'i-ph-device-mobile' }, { label: 'Escritorio', value: 'desktop', icon: 'i-ph-desktop' }]"
        :content="false"
        variant="pill"
        color="neutral"
        size="sm"
      />
      <div class="mt-4 bg-default p-4" :class="width === 'phone' ? 'mx-auto max-w-[390px] rounded-2xl border border-default' : 'rounded-2xl'">
        <!-- El MISMO componente que usa la persona, en modo prueba: nada de una réplica que se desincroniza. -->
        <QuestionnaireAnswerForm :version="version" preview />
      </div>
    </template>
  </USlideover>
</template>
```

### Texto enriquecido (avisos, plantillas)

Para contenido con formato, `UEditor` + `UEditorToolbar` de Nuxt UI 4.9 (pide
las dependencias de TipTap que lista Nuxt UI), no una barra de botones hecha a
mano con `outline: none` (E-25):

```vue
<UEditor v-slot="{ editor }" v-model="notice.body" content-type="markdown" class="min-h-64 w-full">
  <UEditorToolbar
    :editor="editor"
    :items="[
      [{ kind: 'heading', level: 2, icon: 'i-ph-text-h-two', 'aria-label': 'Título' }, { kind: 'heading', level: 3, icon: 'i-ph-text-h-three', 'aria-label': 'Subtítulo' }],
      [{ kind: 'mark', mark: 'bold', icon: 'i-ph-text-b', 'aria-label': 'Negritas' }, { kind: 'mark', mark: 'italic', icon: 'i-ph-text-italic', 'aria-label': 'Cursivas' }],
      [{ kind: 'bulletList', icon: 'i-ph-list-bullets', 'aria-label': 'Lista' }, { kind: 'orderedList', icon: 'i-ph-list-numbers', 'aria-label': 'Lista numerada' }],
    ]"
  />
</UEditor>
```

En 4.9 la barra marca el botón activo solo con la variante (`active`), sin
`aria-pressed`. Si el editor es pieza central, usa el slot `#item` de
`UEditorToolbar` para renderizar cada botón con `:aria-pressed`.

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Barra del editor con el nombre en skeleton (`descriptionLoading`); bloques `USkeleton` con el alto de una sección. | Nada de spinner de página. |
| Error al abrir | `UAlert color="error"` con "Reintentar". | — |
| Borrador vacío | `UEmpty` "El cuestionario está vacío" + "Agregar sección" `neutral outline`. | El sólido sigue siendo "Publicar"; validará que no esté vacío. |
| Cambios sin guardar | Indicador "Cambios sin guardar" (`role="status"`). | Visible siempre, sin parpadeo: no cambies el ancho del encabezado. |
| Guardando / guardado | "Guardando…" → "Guardado". | — |
| Error al guardar | `UAlert color="error"` persistente arriba del contenido, con "Reintentar"; el indicador dice "No se guardó". | Nunca un toast que desaparece; los cambios siguen en pantalla. Salir pregunta. |
| Problemas antes de publicar | `UAlert color="error"` que recibe el foco, con la lista de problemas como enlaces a cada pregunta. | "Publicar" no se deshabilita para avisar: se pulsa y explica. |
| Publicando | "Publicar versión N" con `:loading`; el diálogo ya se cerró. | Primero se guarda lo pendiente. |
| Publicada | `FiStatusBadge` "Publicada", aviso `info` con candado, contenido como texto, sin controles de edición; el sólido pasa a "Crear versión N+1". | No campos deshabilitados: texto legible. |
| Archivada | Igual que publicada, aviso "archivada", sin acción sólida. | — |
| Conflicto (otra persona guardó) | `UAlert color="warning"`: "Laura M. guardó cambios en este borrador hace 2 min" + "Recargar". | No sobrescribas en silencio. |

## Jerarquía de acciones

1. **La acción de la versión** es el único `primary solid`, en la barra del
   editor: "Publicar versión N" en borrador, "Crear versión N+1" en publicada,
   ninguna en archivada.
2. **Publicar siempre confirma** con `ConfirmDialog tone="primary"`: título
   "¿Publicar la versión 3 de «Tamizaje»?", descripción con lo que queda
   bloqueado y quién empieza a usarla, botón "Publicar versión 3", foco en
   "Cancelar" ([patterns.md](../patterns.md#acciones-destructivas-y-confirmación)).
3. **"Vista previa"** `neutral outline`, junto a la acción principal. Nunca
   más prominente que publicar (inventario: "Probar" estaba en el encabezado y
   "Publicar" escondido).
4. **Editar metadatos, historial, duplicar, archivar:** `UDropdownMenu` "Más
   acciones" `neutral outline` en la barra.
5. **Agregar:** `neutral ghost` (pregunta) y `neutral outline` (sección).
6. **Quitar** dentro del borrador: una pregunta o una sección vacía se quitan
   al instante con toast "Deshacer"; una sección **con** preguntas confirma
   diciendo cuántas se van ("¿Eliminar la sección «Hábitos»? Sus 6 preguntas
   también se eliminarán."). La misma regla en todo el editor (E-18).
7. Nada de botones de editar ni quitar en una versión publicada o archivada:
   se ocultan, no se deshabilitan.

## Responsive

- `≥ lg`: índice fijo a la izquierda (15rem) + contenido. `≥ xl`: inspector
  opcional a la derecha.
- `< lg`: sin índice lateral; "Ir a…" como `USelectMenu` de secciones en la
  barra del editor si el cuestionario tiene más de 3 secciones.
- La barra del editor apila acciones bajo el título (`FiPageHeader`); en `< sm`
  el indicador de guardado va en su propio renglón y "Vista previa" puede ir a
  "Más acciones".
- Controles de fila de 32 px como mínimo (`size="sm"`), siempre visibles.
- La vista previa abre en "Teléfono" por defecto.

## Accesibilidad

- Un solo `h1` (el nombre del artefacto); cada sección es `h2`
  (`FiSectionCard`).
- Resumen de pregunta = `<button aria-expanded aria-controls>`; el panel tiene
  el `id` correspondiente (C-18, E-09).
- Todo campo dentro de `UFormField` con etiqueta visible; nada de placeholder
  como etiqueta ni `<input>` desnudos con `focus:outline-none` (E-22, E-09).
- Reordenar: botones con nombre ("Subir «¿Cómo dormiste?»"), anuncio
  `aria-live="polite"` de la nueva posición y foco que sigue al elemento.
- Indicador de guardado `role="status"`; error de guardado `role="alert"`.
- El resumen de problemas recibe el foco (`tabindex="-1"`) y cada problema
  enlaza a su elemento (`scroll-mt-*` para que la barra fija no lo tape, WCAG
  2.4.11).
- No sobrescribas `::selection` en la vista: fi-ui ya lo define (C-M3).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| "Publicar versión N" `primary solid` en la barra del editor, con confirmación que dice qué se bloquea y a quién afecta. | "Publicar" como botón `success soft sm` dentro de la tarjeta de metadatos, sin confirmación, mientras "Probar" ocupa el encabezado (inventario, `[id]/index.vue`). |
| Estado de versión con `FiStatusBadge`; tipo en `neutral outline`. | "Versión vigente" en rojo FI, tipo "Estadístico" en rojo, botón "Publicar" en verde (E-04). |
| Resumen de pregunta como `<button aria-expanded>`. | La tarjeta colapsada es un `<div @click>` sin rol ni teclado (E-09). |
| Subir/Bajar siempre visibles, con nombre y anuncio. | Botones de mover `invisible group-hover:visible`: fuera del orden de tabulación, el teclado no puede reordenar (E-09). |
| Editar y quitar visibles (o con `group-focus-within:`). | `opacity-0 group-hover:opacity-100`: enfocables pero invisibles al enfocarlos (E-09). |
| `UFormField` + `UInput`/`USelect`; `USwitch` con `label`. | Texto, ayuda y tipo con solo placeholder; código y puntaje en `<input>` desnudos con `focus:outline-none` (E-09, E-22). |
| Misma regla para quitar en todo el editor. | Eliminar una pregunta confirma y eliminar una sección con preguntas no (E-18). |
| `UEditor` + `UEditorToolbar`. | Barra de TipTap a mano sin estado presionado y con `outline: none` en los selects (E-25). |
| Vista previa en `USlideover` con el componente real y ancho de teléfono. | Vista previa en otra ruta con encabezado distinto: se pierde el contexto y no se puede ver en ancho de teléfono (inventario). |
| Error de guardado en línea y persistente. | "No se guardó" en un toast que desaparece. |
| Dejar el `::selection` de fi-ui. | `selection:bg-primary-100 selection:text-primary-900` local en la vista (C-M3, inventario). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/gestion/cuestionarios/[id]/index.vue`: hoy usa
  `DashboardPageHeader` con "Probar" y deja "Publicar" sin confirmar en la
  tarjeta de metadatos. El rediseño del inventario: índice a la izquierda con
  reordenar, editor al centro, inspector a la derecha, barra fija con estado,
  "Vista previa" en slideover y "Publicar" con la confirmación "La versión vN
  quedará bloqueada; los cuestionarios asignados usarán vN".
- `app/components/administracion/QuestionCard.vue`: concentra los errores de
  accesibilidad de E-09 (div clicable, controles solo con hover, campos sin
  etiqueta).
- `app/pages/dashboard/gestion/cuestionarios/[id]/vista-previa.vue`: la vista
  previa como ruta aparte; se conserva solo para enlaces directos.
- `app/components/LegalEditor.vue`: barra de formato a mano (E-25); migrar a
  `UEditorToolbar`.

## Fuentes

- Primer, *Saving* (guardado automático vs. explícito, indicar el estado, avisar antes de salir con cambios). https://primer.style/product/ui-patterns/saving/
- Nielsen Norman Group, *Confirmation dialogs* (confirmar lo irreversible, botón con verbo y objeto). https://www.nngroup.com/articles/confirmation-dialog/
- W3C, *Understanding SC 2.5.7 Dragging Movements* (alternativa de un solo puntero al arrastre). https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- W3C WAI-ARIA APG, *Disclosure (Show/Hide)* (`aria-expanded`, `aria-controls`). https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- Nuxt UI, *Editor* y *EditorToolbar*. https://ui.nuxt.com/docs/components/editor
- Nuxt UI, *Slideover*. https://ui.nuxt.com/docs/components/slideover
