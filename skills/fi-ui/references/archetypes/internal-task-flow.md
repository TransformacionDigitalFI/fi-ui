# Arquetipo `internal-task-flow` — Flujo interno de tarea

Una escritura **con consecuencias** que el personal completa en varios pasos o
en un compositor: cerrar una sesión (nota, siguiente cita, malestares,
conclusión), emitir un documento que además cambia el estado de un registro.
Progreso visible, un solo canal de validación, un paso de revisión antes de lo
irreversible y un resultado claro.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** personal del equipo, a menudo justo después de atender (en
  PSM: el asesor que cierra una sesión o emite una canalización externa).
- **Tarea:** dejar asentado algo que tiene efectos (crea una cita, concluye un
  acompañamiento, emite un folio) sin errores y sin sorpresas.
- **Éxito:** antes de guardar, la persona ve exactamente qué se va a crear o
  cambiar; si algo falta, lo sabe en el campo correcto; y al terminar sabe qué
  pasó y qué sigue.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Un asistente interno de varios pasos (forma de salida de una sesión). | Muchas filas parecidas a la vez: es [`bulk-entry`](bulk-entry.md). |
| Un compositor de documento con vista previa (oficio, constancia, canalización). | Editar unos pocos campos de un registro: `UModal` o `USlideover` dentro de [`record-detail`](record-detail.md). |
| Cualquier "guardar" que cree o cierre cosas en otros registros. | Un formulario público con identidad y consentimiento: es [`public-guided-flow`](public-guided-flow.md). |
| | Configurar un objeto: es [`settings`](settings.md). |

## Anatomía (de arriba abajo)

### Variante A — asistente

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | Un `UDashboardPanel`; `UDashboardNavbar` con `#left` (`UBreadcrumb`). | Sin `h1` en el navbar. |
| 1 | Encabezado | `FiPageHeader back="/ruta-de-origen"` con la tarea en `title` ("Cerrar la sesión") y el objeto en `description` ("Ana Pérez · 422012345 · lun 14 oct, 10:00–10:50"). | `back` pone un "Regresar" de solo ícono con `aria-label` (D-08, D-29). Sin acciones en el encabezado: las del flujo van al pie. |
| 2 | Progreso | `UStepper disabled size="sm"` en `≥ sm`; en móvil "Paso 2 de 4 · Siguiente cita" + `UProgress`. | El stepper **indica**, no navega: se avanza con "Continuar" (que valida) y se vuelve con "Atrás" o con "Editar" en la revisión. |
| 3 | Resumen de errores | `UAlert color="error" role="alert"` arriba del paso, con un enlace por error al campo (`#id`). Recibe el foco si falla la validación. | Es el **mismo** canal para errores del paso y del servidor. Nunca toasts para validar (B-M4). |
| 4 | Paso | `FiSectionCard` con el título del paso como `<h2 tabindex="-1">` (recibe el foco al cambiar de paso) y los campos en `UFormField`. | Un solo `UForm` para todo el flujo: lo escrito se conserva al ir y volver. |
| 5 | Decisión con consecuencias | `URadioGroup variant="card"`: "Continúa en acompañamiento" · "Concluir el acompañamiento". Al concluir aparecen tipo y motivo obligatorios. | Nunca una casilla escondida en el último paso para algo que cierra un caso (inventario). |
| 6 | Revisar y guardar | Último paso: `dl` por sección con lo que se va a crear (nota, cita con fecha y hora, malestares, conclusión) y "Editar" por sección. | Obligatorio antes de un commit con consecuencias. |
| 7 | Pie fijo | `#footer` del `UDashboardPanel`: "Atrás" `neutral ghost` a la izquierda; "Continuar" sólido a la derecha; en el último paso "Guardar y cerrar la sesión" con `:loading`. | Un solo sólido. El pie del panel no se desplaza y no tapa el foco. |
| 8 | Resultado | Si hay algo que hacer con el resultado (descargar, copiar un folio): estado de éxito en la página. Si no: volver al origen + toast "Sesión cerrada". | El éxito nunca es solo un toast cuando trae un siguiente paso. |

### Variante B — compositor de documento

Igual, pero en vez de pasos: secciones del formulario a la izquierda y una
**vista previa tipo hoja** a la derecha (`xl:grid-cols-2`, la vista previa
`xl:sticky xl:top-0`), que se actualiza mientras se escribe. "Emitir
documento" abre un `UModal` que lista las consecuencias: folio, destinatario
y, si aplica, que el acompañamiento queda concluido. Después, estado de éxito
con "Descargar PDF" como acción principal.

### Esqueleto (variante A)

```vue
<!-- pages/dashboard/operacion/sesion/[id]/salida.vue -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent, StepperItem } from '@nuxt/ui'

type StepId = 'note' | 'next' | 'concerns' | 'review'

const steps: StepperItem[] = [
  { value: 'note', title: 'Nota', icon: 'i-ph-note-pencil' },
  { value: 'next', title: 'Siguiente paso', icon: 'i-ph-calendar-plus' },
  { value: 'concerns', title: 'Malestares', icon: 'i-ph-cloud' },
  { value: 'review', title: 'Revisar', icon: 'i-ph-list-checks' },
]

const schema = z.object({
  note: z.string().trim().min(1, 'Escribe la nota de la sesión'),
  continuation: z.enum(['continue', 'conclude'], { message: 'Elige si el acompañamiento continúa o concluye' }),
  nextDate: z.string().optional(),
  concludeReason: z.string().optional(),
  concernIds: z.array(z.string()),
}).superRefine((value, ctx) => {
  if (value.continuation === 'continue' && !value.nextDate) {
    ctx.addIssue({ code: 'custom', path: ['nextDate'], message: 'Elige la fecha de la siguiente cita' })
  }
  if (value.continuation === 'conclude' && !value.concludeReason?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['concludeReason'], message: 'Escribe el motivo de la conclusión' })
  }
})
type Schema = z.output<typeof schema>

// Qué campos valida cada paso, y a qué paso pertenece cada campo.
const STEP_FIELDS: Record<StepId, (keyof Schema)[]> = {
  note: ['note'],
  next: ['continuation', 'nextDate', 'concludeReason'],
  concerns: [],
  review: [],
}
const stepOfField = (name?: string): StepId =>
  (Object.keys(STEP_FIELDS) as StepId[]).find(step => STEP_FIELDS[step].includes(name as keyof Schema)) ?? 'note'

const route = useRoute()
const state = reactive<Partial<Schema>>({ note: '', continuation: undefined, nextDate: undefined, concludeReason: '', concernIds: [] })
const step = ref<StepId>('note')
const stepIndex = computed(() => steps.findIndex(item => item.value === step.value))

const form = useTemplateRef('flow-form')
const errors = ref<FormError[]>([])
const summary = useTemplateRef<HTMLElement>('error-summary')
const stepHeading = useTemplateRef<HTMLHeadingElement>('step-heading')
const saving = ref(false)

// Al cambiar de paso: scroll y foco al título del paso (B-M2).
watch(step, async () => {
  await nextTick()
  stepHeading.value?.scrollIntoView({ block: 'start' })
  stepHeading.value?.focus({ preventScroll: true })
})

async function showErrors(found: FormError[]) {
  errors.value = found
  await nextTick()
  summary.value?.focus()
}

async function next() {
  const fields = STEP_FIELDS[step.value]
  // Valida solo los campos de este paso; los errores salen en línea y en el resumen.
  if (fields.length && !(await form.value?.validate({ name: fields, silent: true }))) {
    return showErrors(form.value?.getErrors() ?? [])
  }
  errors.value = []
  step.value = steps[stepIndex.value + 1]!.value as StepId
}

function back() {
  errors.value = []
  step.value = steps[stepIndex.value - 1]!.value as StepId
}

// Al guardar se valida todo: si algo falla, salta al paso del primer error.
async function onError(event: FormErrorEvent) {
  step.value = stepOfField(event.errors[0]?.name)
  await showErrors(event.errors)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await $fetch(`/api/sesiones/${route.params.id}/salida`, { method: 'POST', body: event.data })
    useToast().add({ title: 'Sesión cerrada', color: 'success', icon: 'i-ph-check-circle' })
    await navigateTo('/dashboard/operacion')
  } catch {
    // Error accionable del servidor: mismo resumen, nada se pierde.
    await showErrors([{ message: 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo; tus datos siguen aquí.' }])
  } finally {
    saving.value = false
  }
}

// Cambios sin guardar: avisa antes de salir de la vista.
onBeforeRouteLeave(() => (form.value?.dirty && !saving.value ? window.confirm('¿Salir sin guardar? Se pierde lo que escribiste.') : true))
</script>

<template>
  <UDashboardPanel id="salida">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <UBreadcrumb :items="[{ label: 'Agenda', to: '/dashboard/operacion' }, { label: 'Cerrar sesión' }]" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <FiPageHeader back="/dashboard/operacion" title="Cerrar la sesión" description="Ana Pérez · 422012345 · lun 14 oct, 10:00–10:50" />

        <UStepper v-model="step" :items="steps" disabled size="sm" class="hidden sm:flex" />
        <div class="sm:hidden">
          <p class="text-sm font-medium text-highlighted">Paso {{ stepIndex + 1 }} de {{ steps.length }} · {{ steps[stepIndex]?.title }}</p>
          <UProgress :model-value="stepIndex + 1" :max="steps.length" size="sm" class="mt-2" />
        </div>

        <UForm id="flow-form" ref="flow-form" :schema="schema" :state="state" :validate-on="['blur']" @submit="onSubmit" @error="onError">
          <div v-if="errors.length" ref="error-summary" tabindex="-1" class="mb-6 focus:outline-none">
            <UAlert color="error" variant="subtle" icon="i-ph-warning-circle" title="Revisa estos datos" role="alert">
              <template #description>
                <ul class="list-disc ps-5">
                  <li v-for="(err, i) in errors" :key="err.name ?? i">
                    <a v-if="err.id" :href="`#${err.id}`" class="underline underline-offset-2">{{ err.message }}</a>
                    <span v-else>{{ err.message }}</span>
                  </li>
                </ul>
              </template>
            </UAlert>
          </div>

          <FiSectionCard>
            <template #header>
              <!-- El slot reemplaza solo el contenido del encabezado; el relleno lo pone la tarjeta. -->
              <h2 ref="step-heading" tabindex="-1" class="text-lg font-semibold text-fi-navy focus:outline-none">
                {{ steps[stepIndex]?.title }}
              </h2>
            </template>

            <div v-show="step === 'note'" class="space-y-5">
              <UFormField name="note" label="Nota de la sesión">
                <UTextarea v-model="state.note" :rows="8" autoresize aria-required="true" class="w-full" />
              </UFormField>
            </div>

            <div v-show="step === 'next'" class="space-y-5">
              <UFormField name="continuation">
                <URadioGroup
                  v-model="state.continuation"
                  legend="¿Cómo sigue el acompañamiento?"
                  variant="card"
                  :items="[
                    { value: 'continue', label: 'Continúa en acompañamiento', description: 'Agenda la siguiente cita.' },
                    { value: 'conclude', label: 'Concluir el acompañamiento', description: 'El historial queda cerrado. Pide tipo y motivo.' },
                  ]"
                />
              </UFormField>
              <UFormField v-if="state.continuation === 'continue'" name="nextDate" label="Fecha de la siguiente cita">
                <UInput v-model="state.nextDate" type="date" class="w-full sm:w-60" />
              </UFormField>
              <UFormField v-if="state.continuation === 'conclude'" name="concludeReason" label="Motivo de la conclusión">
                <UTextarea v-model="state.concludeReason" :rows="3" autoresize aria-required="true" class="w-full" />
              </UFormField>
            </div>

            <div v-show="step === 'concerns'">
              <!-- Selector de malestares del proyecto; opcional: hint="(opcional)" -->
            </div>

            <dl v-show="step === 'review'" class="divide-y divide-default">
              <div class="flex flex-wrap items-start justify-between gap-2 py-3">
                <div class="min-w-0">
                  <dt class="fi-label">Nota</dt>
                  <dd class="mt-1 line-clamp-3 text-default">{{ state.note }}</dd>
                </div>
                <UButton label="Editar" aria-label="Editar la nota" color="neutral" variant="link" size="sm" @click="step = 'note';" />
              </div>
              <!-- …una fila por sección: siguiente cita (fecha y hora) o conclusión (tipo y motivo), malestares -->
            </dl>
          </FiSectionCard>
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-2 border-t border-default bg-elevated px-4 py-3 sm:px-6">
        <UButton v-if="stepIndex > 0" label="Atrás" icon="i-ph-arrow-left" color="neutral" variant="ghost" @click="back()" />
        <span v-else />
        <UButton v-if="step !== 'review'" label="Continuar" trailing-icon="i-ph-arrow-right" @click="next()" />
        <UButton v-else type="submit" form="flow-form" label="Guardar y cerrar la sesión" icon="i-ph-check" :loading="saving" />
      </div>
    </template>
  </UDashboardPanel>
</template>
```

Notas del esqueleto:

- `v-show` y no `v-if` en los pasos: los campos siguen montados, así el
  `UForm` conserva estado y errores, y los enlaces del resumen (`#id`)
  encuentran su campo.
- La guarda usa `window.confirm` por brevedad; en el proyecto va el
  `ConfirmDialog` único con `useOverlay` (receta en
  [patterns.md](../patterns.md#acciones-destructivas-y-confirmación)).
- El resultado con siguiente paso (variante B) se pinta en la misma vista:

```vue
<FiSectionCard v-if="result" title="Documento emitido" icon="i-ph-check-circle">
  <UAlert
    role="status"
    color="success"
    variant="subtle"
    icon="i-ph-check-circle"
    :title="`Se emitió la canalización con folio ${result.folio}`"
    description="El acompañamiento quedó concluido y el documento ya se puede validar en línea."
  />
  <template #footer>
    <div class="flex flex-wrap justify-end gap-2">
      <UButton label="Volver al historial" color="neutral" variant="outline" :to="`/dashboard/cedulas/${result.recordId}`" />
      <UButton label="Descargar PDF" icon="i-ph-download-simple" :href="result.pdfUrl" target="_blank" />
    </div>
  </template>
</FiSectionCard>
```

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando el contexto | Encabezado con `descriptionLoading`, stepper ya pintado y el paso en esqueleto (`USkeleton` con la forma de los campos, una sola región `role="status"`). | Nunca un spinner de página (D-20). |
| Error al cargar | `UAlert color="error" role="alert"` con "Reintentar" en lugar del paso. | — |
| Error de un paso | Mensaje bajo cada campo (`UFormField`) + resumen arriba con enlaces, que recibe el foco. No avanza. | Mismo canal en todos los pasos. |
| Error al guardar | Se salta al paso del primer error (validación) o se muestra el resumen con el mensaje del servidor. Lo escrito se conserva. | Nunca solo un toast; nunca limpiar el formulario. |
| Guardando | "Guardar y cerrar la sesión" con `:loading`; el `UForm` deshabilita los campos (`loadingAuto`). | Un doble clic no crea dos registros. |
| Precondición faltante | P. ej. no hay instituciones para la canalización: `UEmpty` con "Agregar institución" (enlace, si hay permiso). | Nunca solo un texto sin salida (inventario). |
| Éxito con siguiente paso | Estado de éxito en la página (`UAlert role="status"` + acciones). | Variante B. |
| Éxito sin siguiente paso | Vuelta al origen + toast transitorio. | Variante A. |

## Jerarquía de acciones

1. **Un solo sólido a la vez**, en el pie: "Continuar" en los pasos,
   "Guardar y cerrar la sesión" (verbo + objeto) en la revisión, "Emitir
   documento" en el compositor. Siempre `primary`: avanzar no es secundario
   (inventario: "Siguiente" estaba en `neutral outline`).
2. **"Atrás"**: `neutral ghost` a la izquierda del pie. No borra lo escrito.
3. **"Editar"** en la revisión: `link`, con `aria-label` que nombra la
   sección.
4. **Commit irreversible o con efectos en otros registros:** paso de revisión
   (asistente) o `UModal` con las consecuencias (compositor): folio,
   destinatario, conclusión. Botón `primary` (no es destructivo), con verbo.
5. **Salir:** "Regresar" de `FiPageHeader back`, con guarda si hay cambios.
6. Nada de acciones ajenas al flujo en el encabezado.

## Responsive

- Una columna, `max-w-3xl`, en todos los tamaños (variante A). La variante B
  pasa a dos columnas (formulario + vista previa) en `xl`; abajo, la vista
  previa va en un `USlideover` desde "Ver vista previa".
- `UStepper` solo en `≥ sm`; en móvil, texto "Paso n de N · Título" +
  `UProgress` (sin desplazamiento horizontal, B-29).
- El pie fijo del panel lleva los botones a ambos extremos; en `< sm` las
  etiquetas largas se acortan ("Guardar") sin perder el `aria-label`
  completo.

## Accesibilidad

- Un solo `h1` (`FiPageHeader`); cada paso es un `h2` que recibe el foco
  (`tabindex="-1"`) al cambiar de paso, con scroll arriba (B-M2).
- Errores: `aria-invalid` y `aria-describedby` los pone `UFormField`; el
  resumen es `role="alert"` y enlaza a cada campo por su `id`.
- Etiquetas reales (`UFormField label`) en todo, también en textareas
  (D-09). Opcionales con `hint="(opcional)"`; obligatorios con
  `aria-required="true"`, sin asteriscos.
- La decisión con consecuencias es un `URadioGroup` (con su etiqueta como
  leyenda), no una casilla suelta.
- El stepper tiene `aria-current="step"` (lo pone `UStepper`); no lo
  reemplaces con un indicador de `div`s (E-21).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Validar al pulsar "Continuar", con errores en línea y resumen. | Diferir la validación al guardar y avisar con toasts; la nota faltante salta al paso 1, pero una cita incompleta no salta a su paso (inventario, B-M4). |
| Paso "Revisar y guardar" con lo que se va a crear y "Editar". | Guardar la cita y el cierre sin ningún paso de revisión (inventario). |
| "Guardar y cerrar la sesión" con `:loading`. | Guardar solo con `:disabled="hasSubmitted"`, sin indicador (inventario). |
| `URadioGroup` "Continúa · Concluir" con tipo y motivo obligatorios. | Concluir el acompañamiento como una casilla dentro del último paso (inventario). |
| `UAlert color="success"` para el éxito. | Caja de éxito a mano con `bg-success-50 dark:bg-success-950/30` (D-14, D-26). |
| `UAlert role="alert"` para el error del envío. | `<p class="text-sm text-error-600">` sin región viva (D-15). |
| `UFormField label` en el textarea. | `<p class="ui-label">` encima del textarea, sin etiqueta programática (D-09). |
| `FiPageHeader back` para encabezado y "Regresar". | Encabezado hecho a mano en cada flujo, con la flecha de volver sin `aria-label` (D-29, D-08). |
| `UStepper` como indicador. | Un `StepIndicator` propio de `div`s sin `aria-current="step"` (E-21). |
| Vocabulario del dominio: "Conclusión del acompañamiento", "historial". | "Alta", "Motivo del alta", "el expediente queda cerrado" (D-24). |
| Foco y scroll al título del paso. | Cambiar de paso y dejar el foco en el botón "Siguiente", a media página (B-M2). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/operacion/sesion/[id]/salida.vue`: asistente de cierre
  (`UStepper` no lineal + secciones con `v-show`). Lo que cambia según el
  inventario: validar por paso, paso final de revisión, `:loading` en
  guardar, "Siguiente" en `primary` y la conclusión como decisión explícita.
- `app/pages/dashboard/cedulas/[id]/canalizacion-externa.vue`: compositor de
  documento. El inventario propone formulario + vista previa tipo hoja,
  confirmación con consecuencias (folio, conclusión, destinatario), enlace
  "Agregar institución" cuando no hay, y éxito con "Descargar PDF" como
  principal y enlace a la validación del documento.

## Fuentes

- GOV.UK Design System, *Validation* y *Error summary* (resumen arriba que recibe el foco, mensajes en línea, conservar lo escrito). https://design-system.service.gov.uk/patterns/validation/ · https://design-system.service.gov.uk/components/error-summary/
- GOV.UK Design System, *Check answers* (revisar antes de enviar, con "Cambiar" por sección). https://design-system.service.gov.uk/patterns/check-answers/
- Nuxt UI, *Stepper* (indicador de progreso con botones propios; `disabled`). https://ui.nuxt.com/docs/components/stepper
- Nuxt UI, *Form* (validación por campos con `validate({ name })`, evento `@error` con `id` por error). https://ui.nuxt.com/docs/components/form
- Nielsen Norman Group, *Confirmation dialogs*. https://www.nngroup.com/articles/confirmation-dialog/
