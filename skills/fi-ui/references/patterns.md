# Patrones transversales

Reglas que valen en **todas** las vistas, sin importar el arquetipo. Cada
sección dice qué hacer, con qué componente, y qué error real de la auditoría
evita (ids entre corchetes).

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` y Nuxt UI 4.9. En Vue +
> Vite importa los `Fi*` desde `@fi-unam/ui`. Los textos literales son
> ilustrativos: en el proyecto van al diccionario de i18n (ver
> [Contenido e i18n](#contenido-e-i18n)). La API completa de cada componente
> está en [components.md](components.md).

## Índice

1. [Estados de datos](#estados-de-datos)
2. [Canales de retroalimentación](#canales-de-retroalimentación)
3. [Acciones destructivas y confirmación](#acciones-destructivas-y-confirmación)
4. [Jerarquía de botones](#jerarquía-de-botones)
5. [Formularios](#formularios)
6. [Tablas](#tablas)
7. [Tarjeta clicable](#tarjeta-clicable)
8. [Filtros, búsqueda y chips](#filtros-búsqueda-y-chips)
9. [Navegación](#navegación)
10. [Responsive](#responsive)
11. [Accesibilidad base (WCAG 2.2 AA)](#accesibilidad-base-wcag-22-aa)
12. [Movimiento](#movimiento)
13. [Contenido e i18n](#contenido-e-i18n)
14. [Privacidad](#privacidad)

---

## Estados de datos

Toda región que depende de datos tiene **cuatro estados además del
contenido**, y cada uno se ve distinto:

| Estado | Se ve | Componente | Nunca |
|--------|-------|------------|-------|
| Carga | Skeleton **con la forma** del contenido (mismas filas, tarjetas, alturas) | `USkeleton` dentro de **una** región `role="status"` | spinner de página completa [D-20, C-27]; texto "Cargando…" suelto [E-20] |
| Vacío — primer uso | Qué es esto y cómo empezar | `UEmpty` + acción de crear | "No hay datos" en gris |
| Vacío — sin resultados | Que los filtros no encontraron nada | `UEmpty` + **"Limpiar filtros"** | el vacío de primer uso con filtros activos [C-21] |
| Vacío — todo al día | Que no hay pendientes, y es bueno | `UEmpty` con `FiIconBadge tone="success"` | — |
| Error | Qué falló y **Reintentar** | `UAlert color="error"` `role="alert"` donde iba el contenido | "Sin datos" cuando la carga falló |
| Parcial | Lo que sí cargó + aviso en la sección que no | `UAlert color="warning"` en esa sección | tirar la vista entera por una subconsulta |

Reglas:

- **Fetch grueso, render fino.** Una petición por vista (o por grupo de
  regiones) y muchas regiones de carga que se resuelven a la vez. No agregues
  un fetch por región para "poder mostrar su skeleton aparte".
- **Lo que no depende de datos se pinta final desde el primer frame:**
  encabezado, buscador, filtros, botones. Nunca un skeleton ahí.
- **Lo que no ocupa lugar fijo** (contadores, "Se muestran 9 de N") está
  ausente hasta que hay datos.
- **Una petición, una región de error.** Si falló, falló todo: no pintes nueve
  recuadros de error.
- **Revalidar no es cargar.** Con datos en pantalla, mantenlos mientras se
  revalida; solo el botón que lo disparó muestra `:loading`.
- En Nuxt 4, `data` de `useFetch` es un `shallowRef`: cambiar un campo anidado
  no vuelve a pintar. Para una actualización optimista, reasigna el objeto
  (`data.value = { ...data.value, items }`).
- Umbrales: < 1 s puede no mostrar nada; 1–10 s skeleton; ≥ 10 s barra
  determinada (`UProgress` con valor y "Procesando 3 de 50").
- Spinner solo **dentro** del control que disparó una acción (`:loading`).

### Región de datos completa

```vue
<script setup lang="ts">
const route = useRoute()
// Solo filtros sin datos personales viajan en la URL (ver Privacidad).
const { data, status, error, refresh } = await useFetch('/api/requests', {
  query: computed(() => ({ estado: route.query.estado })),
  lazy: true,
})

// Primera carga: sin datos todavía. Una revalidación con datos en pantalla no cuenta.
const firstLoad = computed(() => status.value === 'pending' && !data.value)
const hasFilters = computed(() => Boolean(route.query.estado))
const router = useRouter()
const clearFilters = () => router.replace({ query: {} })
</script>

<template>
  <FiSectionCard title="Solicitudes" :padded="false">
    <!-- 1. Error: una región, con reintento. Va primero: nunca caer al vacío. -->
    <div v-if="error" class="p-5">
      <UAlert
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        title="No se pudieron cargar las solicitudes"
        description="Puede ser un problema de conexión. Tus filtros se conservan."
        :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        role="alert"
      />
    </div>

    <!-- 2. Carga: forma de las filas reales; una sola región viva. -->
    <div v-else-if="firstLoad" role="status" aria-busy="true">
      <span class="sr-only">Cargando solicitudes…</span>
      <ul class="divide-y divide-default" aria-hidden="true">
        <li v-for="n in 6" :key="n" class="flex items-center gap-4 px-5 py-4">
          <USkeleton class="size-10 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-4 w-2/3" />
          </div>
          <USkeleton class="h-6 w-24 rounded-full" />
        </li>
      </ul>
    </div>

    <!-- 3. Vacío: sin resultados (con salida) o primer uso. -->
    <UEmpty
      v-else-if="!data?.items.length && hasFilters"
      variant="naked"
      title="Sin resultados con estos filtros"
      :actions="[{ label: 'Limpiar filtros', color: 'neutral', variant: 'outline', onClick: clearFilters }]"
    >
      <template #leading><FiIconBadge icon="i-ph-magnifying-glass" /></template>
    </UEmpty>
    <UEmpty
      v-else-if="!data?.items.length"
      variant="naked"
      title="Bandeja al día"
      description="Cuando llegue una solicitud nueva aparecerá aquí."
    >
      <template #leading><FiIconBadge icon="i-ph-check-circle" tone="success" /></template>
    </UEmpty>

    <!-- 4. Contenido -->
    <ul v-else class="divide-y divide-default">
      <!-- … -->
    </ul>
  </FiSectionCard>
</template>
```

`USkeleton` (4.9) pone `role="alert"` y `aria-live` en **cada** bloque: nueve
bloques serían nueve anuncios. Por eso los bloques van dentro de un contenedor
`aria-hidden="true"` y el anuncio lo hace una sola región `role="status"` con
texto `sr-only`.

### Estado parcial

Cuando el servidor devuelve éxito parcial (p. ej. el listado llegó pero el
resumen no), la sección afectada lo dice y el resto funciona:

```vue
<FiSectionCard title="Resumen del periodo">
  <UAlert
    v-if="data?.summaryUnavailable"
    color="warning"
    variant="subtle"
    icon="i-ph-warning"
    title="El resumen no está disponible por ahora"
    description="El listado de abajo está completo. Intenta de nuevo en unos minutos."
    :actions="[{ label: 'Reintentar', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
  />
  <FiStatGrid v-else :stats="stats" :columns="3" />
</FiSectionCard>
```

El éxito parcial es un **contrato deliberado** del endpoint (un campo que dice
qué faltó), no un `catch` que convierte el error en `[]`.

---

## Canales de retroalimentación

Una situación, un canal. Nunca dos canales para el mismo resultado.

| Resultado | Canal | Componente | Persiste |
|-----------|-------|------------|----------|
| Error de un campo | Bajo el campo | `UFormField` (`:error` o el schema de `UForm`) | hasta corregir |
| Error de envío **accionable** (validación del servidor, conflicto 409, regla de negocio) | En línea, junto al formulario o en el modal | `UAlert color="error"` `role="alert"` | hasta corregir |
| Fallo **técnico** de una acción sin formulario (botón de fila, menú: 500, red) | Toast **persistente** (`duration: 0`) con "Copiar detalles" | `useToast` | hasta cerrarlo |
| Cualquier fallo al **enviar un formulario** (público, modal, panel), también el técnico | En línea, junto al botón de envío, con lo escrito intacto | `UAlert color="error"` `role="alert"` | hasta reintentar |
| Fallo al cargar datos | Región de error con reintento, donde iba el contenido | `UAlert` | hasta reintentar |
| Acción exitosa | Toast transitorio, con **Deshacer** si se puede | `useToast` | ~5 s |
| Resultado que es el objetivo de la vista (documento válido, solicitud enviada) | Región en línea `role="status"` o pantalla de resultado | `UAlert` / `UEmpty` | sí |
| Aviso de todo el sitio | Banner único, se recuerda al cerrarlo | `UBanner` con `id` | hasta cerrarlo |
| Decisión que bloquea | Diálogo | `UModal` | — |
| Llegaron elementos nuevos (tiempo real) | Píldora "3 nuevas · Mostrar", sin reordenar bajo el cursor | `UButton` + `aria-live="polite"` | — |

Reglas:

- **Un error que la persona puede corregir no va en un toast.** Va donde está
  su mirada y se queda mientras corrige [B-M4]. El toast desaparece, sobre todo
  en móvil.
- **Todo cambio de estado se anuncia:** `role="alert"` para errores,
  `role="status"` o `aria-live="polite"` para resultados y conteos (WCAG
  4.1.3) [D-15, B-10].
- **Modales y paneles no se cierran hasta que la acción confirma.** En curso:
  queda abierto, el botón gira (`:loading`). Éxito: se cierra **y luego** el
  toast. Fallo: queda abierto, con lo escrito intacto y el error en línea.
- **El texto de error dice qué pasó y qué hacer**, sin culpar ni bromear y sin
  el `error.message` crudo [B-M5].

```ts
// Éxito reversible: toast con Deshacer
const toast = useToast()

async function archive(category: Category) {
  await archiveCategory(category.id)
  toast.add({
    title: `Se archivó «${category.name}»`,
    color: 'success',
    icon: 'i-ph-check-circle',
    actions: [{
      label: 'Deshacer',
      color: 'neutral',
      variant: 'outline',
      onClick: () => restoreCategory(category.id),
    }],
  })
}

// Fallo técnico: persistente y con detalle copiable
function notifyTechnicalError(err: unknown) {
  const details = err instanceof Error ? err.message : String(err)
  toast.add({
    title: 'No se pudo completar la acción',
    description: 'Inténtalo de nuevo. Si se repite, copia los detalles y repórtalo.',
    color: 'error',
    icon: 'i-ph-warning-circle',
    duration: 0,
    actions: [{ label: 'Copiar detalles', color: 'neutral', variant: 'outline', onClick: () => navigator.clipboard.writeText(details) }],
  })
}
```

```vue
<!-- Error accionable dentro de un modal: en línea, persiste, se anuncia -->
<UModal v-model:open="open" title="Nueva categoría">
  <template #body>
    <UForm id="category-form" :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
      <UAlert v-if="submitError" color="error" variant="subtle" icon="i-ph-warning-circle" :title="submitError" role="alert" />
      <UFormField name="name" label="Nombre">
        <UInput v-model="state.name" class="w-full" />
      </UFormField>
    </UForm>
  </template>
  <template #footer>
    <UButton label="Cancelar" color="neutral" variant="outline" @click="open = false;" />
    <UButton type="submit" form="category-form" label="Crear categoría" color="primary" variant="solid" :loading="saving" />
  </template>
</UModal>
```

---

## Acciones destructivas y confirmación

### Qué tratamiento lleva cada acción

| Acción | Tratamiento |
|--------|-------------|
| Reversible: archivar, ocultar, quitar una etiqueta, marcar como leído | Actúa ya + toast con **Deshacer** |
| Irreversible: eliminar, revocar, rechazar algo que notifica a otra persona | **Confirmar** con `UModal` |
| Deja a alguien fuera: deshabilitar una cuenta, quitar todos los roles | **Confirmar** (también si el control es un `USwitch`) [C-02] |
| Crea un registro inmutable o publica: instantánea, versión vigente, envío final | **Confirmar** con resumen de lo que se va a generar; botón `primary` [E-30] |
| Grave y rara: borrar un catálogo completo | Confirmar escribiendo el nombre del objeto |
| Hay alternativa menos dañina (desactivar, archivar) | Ofrécela antes que eliminar; bloquea eliminar lo que está en uso y explica por qué |

Botones de la acción destructiva **fuera** del diálogo: `color="error"`
`variant="ghost"` en filas y tarjetas, `variant="outline"` en una zona de
peligro. Siempre con texto o `aria-label` que nombre el objeto. El botón
**dentro** del diálogo es el único `error solid`.

### Reglas de texto del diálogo

| Parte | Regla | Bien | Mal |
|-------|-------|------|-----|
| Título | Pregunta con verbo + objeto con su nombre | ¿Eliminar la categoría «Ansiedad»? | ¿Estás seguro? |
| Descripción | Consecuencia concreta, cifras si las hay; si no se puede deshacer, dilo | Se desvinculará de 12 subcategorías. Esta acción no se puede deshacer. | Esta acción es permanente. |
| Botón de acción | Verbo + objeto, igual al título | Eliminar categoría | Sí · Aceptar · OK · Confirmar |
| Botón de escape | "Cancelar" | Cancelar | No |
| Publicar / irreversible no destructivo | Mismo esquema, botón `primary` | ¿Publicar la versión 3? · Publicar versión | Continuar |

### Diálogo de confirmación reutilizable

Uno por proyecto (fi-ui no lo trae: es composición de `UModal`). Foco inicial
en **Cancelar**: reka-ui enfoca el primer control del diálogo al abrir; sin la
`x` del encabezado (`:close="false"`) y con el cuerpo sin controles, ese
control es Cancelar, el primero del pie. Escape sigue cerrando.

Con `action`, la acción corre **dentro** del diálogo: queda abierto mientras
corre y si falla (error en línea), y solo se cierra cuando el servidor
confirmó, como pide [Canales de retroalimentación](#canales-de-retroalimentación).
Con `reasonLabel` pide un motivo obligatorio (rechazar, revocar, descartar):
el campo recibe el foco al abrir, y está bien, no es el botón destructivo.

```vue
<!-- components/app/ConfirmDialog.vue -->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  /** error = destructiva; primary = publicar u otra irreversible no destructiva. */
  tone?: 'error' | 'primary'
  /** Pide un motivo obligatorio, que recibe `action`. */
  reasonLabel?: string
  /** Hace la acción aquí dentro; si lanza, el diálogo queda abierto con el error. */
  action?: (reason: string) => Promise<unknown>
  errorMessage?: string
}>(), {
  cancelLabel: 'Cancelar',
  tone: 'error',
  reasonLabel: undefined,
  action: undefined,
  errorMessage: 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.',
})

const emit = defineEmits<{ close: [confirmed: boolean] }>()

const reason = ref('')
const reasonError = ref<string>()
const submitError = ref<string | null>(null)
const running = ref(false)

async function confirm() {
  if (props.reasonLabel && !reason.value.trim()) {
    reasonError.value = 'Escribe el motivo: queda en el historial.'
    return
  }
  reasonError.value = undefined
  if (!props.action) return emit('close', true)
  running.value = true
  submitError.value = null
  try {
    await props.action(reason.value.trim())
    emit('close', true)
  } catch {
    submitError.value = props.errorMessage
  } finally {
    running.value = false
  }
}
</script>

<template>
  <!-- El pie ya se alinea a la derecha (fiAppConfig: modal.slots.footer);
       no hace falta un div propio. -->
  <UModal :title="props.title" :description="props.description" :close="false" :dismissible="!running">
    <template v-if="props.reasonLabel || submitError" #body>
      <div class="space-y-4">
        <UFormField v-if="props.reasonLabel" name="reason" :label="props.reasonLabel" :error="reasonError">
          <UTextarea v-model="reason" :rows="3" autoresize aria-required="true" class="w-full" />
        </UFormField>
        <UAlert v-if="submitError" role="alert" color="error" variant="subtle" icon="i-ph-warning-circle" :title="submitError" />
      </div>
    </template>
    <template #footer>
      <UButton :label="props.cancelLabel" color="neutral" variant="outline" :disabled="running" @click="emit('close', false)" />
      <UButton :label="props.confirmLabel" :color="props.tone" variant="solid" :loading="running" @click="confirm()" />
    </template>
  </UModal>
</template>
```

```ts
// Uso con useOverlay: la promesa resuelve con lo emitido en `close`.
// Escape o clic fuera resuelven `undefined`: trátalo como "no".
import ConfirmDialog from '~/components/app/ConfirmDialog.vue'

const overlay = useOverlay()
const confirmDialog = overlay.create(ConfirmDialog)

async function deleteCategory(category: Category) {
  const confirmed = await confirmDialog.open({
    title: `¿Eliminar la categoría «${category.name}»?`,
    description: `Se desvinculará de ${category.subcategoryCount} subcategorías. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar categoría',
    action: () => $fetch(`/api/categories/${category.id}`, { method: 'DELETE' }),
  })
  if (confirmed !== true) return
  toast.add({ title: `Se eliminó «${category.name}»`, color: 'success', icon: 'i-ph-check-circle' })
}

// Decisión negativa con motivo obligatorio (worklist-queue):
await confirmDialog.open({
  title: `¿Rechazar la derivación de ${item.personName}?`,
  description: 'Sale de tu bandeja y quien la envió verá tu motivo.',
  confirmLabel: 'Rechazar derivación',
  reasonLabel: 'Motivo',
  action: reason => $fetch(`/api/derivaciones/${item.id}/rechazar`, { method: 'POST', body: { reason } }),
})
```

- **No:** "Rechazar" que actúa al primer clic, al lado de "Aceptar" [D-07];
  borrar una sección con preguntas sin confirmar mientras borrar una pregunta
  sí confirma [E-18]; dos componentes de confirmación distintos en la misma app
  [C-02]; deshabilitar una cuenta con un switch que actúa de inmediato [C-02];
  "Eliminar" en `neutral ghost` en una vista y `error soft` en otra [E-18].

---

## Jerarquía de botones

La matriz completa (`color` × `variant` por rol) está en
[components.md](components.md#ubutton). Lo esencial:

1. **Un solo `primary solid` visible por vista o diálogo.** Si hay un CTA en el
   encabezado y la lista está vacía, la acción del `UEmpty` va en `neutral
   outline` [C-29, E-17].
2. Secundarias `neutral outline` (o `soft` en zonas densas); terciarias
   `neutral ghost` o `link`.
3. Más de dos acciones de nivel página: la principal visible, una secundaria,
   el resto en `UDropdownMenu` "Más acciones" agrupado por tema [D-23].
4. **Pie de diálogo y de formulario en línea:** `[Cancelar (neutral outline)]
   [Acción (primary o error solid)]`, alineados a la derecha. Igual en modales,
   paneles y editores en línea [D-22, E-19].
5. **Pie de asistente:** "Atrás" `neutral ghost` a la izquierda; "Continuar" /
   "Enviar" `primary solid` (`size="lg"` en público) a la derecha, con ícono de
   fin consistente [B-17].
6. Navegar es un enlace (`to`), no un `@click`. Un selector activo es `neutral
   subtle` con `aria-pressed`, nunca `primary solid` [E-17].
7. Acciones de página en el encabezado; acciones de una sección dentro de su
   sección (`FiSectionCard #actions`).

---

## Formularios

| Regla | Cómo |
|-------|------|
| Etiqueta arriba, siempre visible | `UFormField label`; nunca placeholder como etiqueta [E-22, B-23] |
| Una sola columna | Campos apilados; dos columnas solo para pares cortos relacionados (nombre y apellidos) en `≥ sm` |
| Opcional, no asterisco | `hint="(opcional)"` en los opcionales; obligatorio sin marca visual + `aria-required="true"` en el control. No uses la prop `required` (solo pinta `*`) |
| Ayuda breve | `description` (una frase); detalles largos, en un enlace |
| Errores asociados | `UForm` con `schema` + `UFormField name`; `aria-invalid` y `aria-describedby` salen solos |
| Datos personales con `autocomplete` | `name`, `given-name`, `family-name`, `email`, `tel`, `username`, `current-password`, `new-password`, `bday`, `street-address` (WCAG 1.3.5) |
| Teclado correcto | `type="email"`, `type="tel"`, `inputmode="numeric"` para números de cuenta |
| No reescribir lo dado | Prellena lo que ya se sabe (WCAG 3.3.7) |
| Conserva lo escrito ante un error | Nunca limpiar el formulario al fallar |
| No deshabilites "Enviar" para señalar que falta algo | Valida al enviar y di qué falta |
| Validación | **Públicos** (flujos y formularios cortos): solo al enviar o al pulsar "Continuar" (`:validate-on="[]"`), con resumen de errores arriba; quien está escribiendo no recibe errores a medias. **Dashboard:** al enviar y al salir del campo (`:validate-on="['blur']"`). Nunca en cada tecla |
| Botón con verbo específico | "Enviar solicitud", "Guardar cambios"; nunca "Aceptar" |
| Grupos de opciones | `URadioGroup` / `UCheckboxGroup` con `legend`; escalas con `variant="card"` `orientation="horizontal"` [B-03] |

### Formulario con resumen de errores y foco

```vue
<script setup lang="ts">
import { z } from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  fullName: z.string().min(1, 'Escribe tu nombre completo'),
  email: z.string().email('Escribe un correo válido, por ejemplo nombre@ingenieria.unam.edu'),
  phone: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ fullName: '', email: '', phone: '' })
const errors = ref<FormError[]>([])
const summary = useTemplateRef<HTMLElement>('summary')

async function onSubmit(event: FormSubmitEvent<Schema>) {
  errors.value = []
  await sendRequest(event.data)
}

async function onError(event: FormErrorEvent) {
  errors.value = event.errors
  await nextTick()
  // Formularios largos: el foco va al resumen. Cortos: al primer campo con error.
  summary.value?.focus()
}
</script>

<template>
  <!-- Formulario público: valida al enviar. En el dashboard, :validate-on="['blur']". -->
  <UForm :schema="schema" :state="state" :validate-on="[]" class="space-y-5" @submit="onSubmit" @error="onError">
    <div v-if="errors.length" ref="summary" tabindex="-1" class="focus:outline-none">
      <UAlert color="error" variant="subtle" icon="i-ph-warning-circle" title="Revisa estos datos" role="alert">
        <template #description>
          <ul class="list-disc ps-5">
            <li v-for="err in errors" :key="err.id">
              <a :href="`#${err.id}`" class="underline underline-offset-2">{{ err.message }}</a>
            </li>
          </ul>
        </template>
      </UAlert>
    </div>

    <UFormField name="fullName" label="Nombre completo">
      <UInput v-model="state.fullName" autocomplete="name" aria-required="true" class="w-full" />
    </UFormField>

    <UFormField name="email" label="Correo institucional" description="Te escribiremos aquí para confirmar tu cita.">
      <UInput v-model="state.email" type="email" autocomplete="email" aria-required="true" class="w-full" />
    </UFormField>

    <UFormField name="phone" label="Teléfono" hint="(opcional)">
      <UInput v-model="state.phone" type="tel" autocomplete="tel" class="w-full" />
    </UFormField>

    <div class="flex justify-end gap-2">
      <UButton label="Cancelar" color="neutral" variant="outline" to="/solicitudes" />
      <UButton type="submit" label="Enviar solicitud" color="primary" variant="solid" />
    </div>
  </UForm>
</template>
```

Preguntas obligatorias de un cuestionario: después del primer intento, cada
pregunta sin respuesta lleva su `:error` en su `UFormField` y el resumen
enlaza a la primera; nunca solo "Faltan 3 respuestas" al final [B-M3].

- **No:** `<p class="ui-label">` junto a un `textarea` [B-23, D-09]; el
  error de "acepta el consentimiento" solo en un toast [B-M4]; `<input>` desnudo
  con `focus:outline-none` [E-09]; mezclar `<input type="radio">` nativo y
  `UCheckbox` en el mismo formulario [B-03].

---

## Tablas

La receta completa con columnas, celdas, menú de fila, carga y vacío está en
[components.md](components.md#utable). Las reglas:

1. **`UTable` siempre.** Nada de `<table>` a mano ni rejillas de `div` con
   encabezado propio: pierden la semántica y el estilo central [D-13, E-12,
   C-15].
2. Primera columna: identificador humano (nombre, folio) que enlaza al
   detalle. Nunca un UUID.
3. Números a la derecha con `tabular-nums` (`meta.class`); fechas y números con
   `whitespace-nowrap`; texto largo que corte (`min-w-56 max-w-md`) [C-16].
4. Estado con `FiStatusBadge`, nunca color suelto.
5. ≤ 2 acciones visibles por fila + `UDropdownMenu`; visibles sin hover (táctil
   y teclado) [E-09].
6. Nombre accesible: `caption` (queda `sr-only`) o `aria-label`.
7. La tabla vive en su propio contenedor con scroll (`UTable` ya lo hace): la
   página nunca scrollea en horizontal.
8. Encabezado fijo (`sticky="header"`) en listas largas; paginación con total
   fuera de la tabla (`UPagination active-color="neutral"`: su activo por
   defecto sería un segundo `primary solid`).
9. Orden, filtros y página en la URL; la búsqueda por nombre o cuenta **de
   personas**, no (es dato personal: ver [Privacidad](#privacidad)). En un
   catálogo de datos de referencia (dependencias, instituciones, categorías)
   el texto buscado no es personal y sí puede ir en la URL (`?q=`); en el de
   usuarios, no.
10. `:loading` **siempre** con slot `#loading`; error fuera de la tabla.
11. Detalle profundo de una fila: `USlideover` o una página, no un modal
    gigante ni una sección bajo la tabla [E-30].

---

## Tarjeta clicable

Una tarjeta que lleva a otro lugar es un `<article class="relative">` cuyo
**enlace principal se estira** sobre toda la tarjeta con un pseudo-elemento;
las acciones secundarias quedan por encima con `relative z-10`. Nunca un
`<button>` o `<a>` que envuelve otros controles [D-04, E-10].

```vue
<article class="relative rounded-2xl border border-default bg-elevated p-5 transition-colors hover:border-fi-navy">
  <div class="flex items-start justify-between gap-3">
    <h3 class="text-base font-semibold text-highlighted">
      <ULink
        :to="`/solicitudes/${request.id}`"
        class="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
      >
        {{ request.studentName }}
      </ULink>
    </h3>
    <FiStatusBadge :status="REQUEST_STATUS_TONE[request.status]" :label="statusLabel(request.status)" />
  </div>

  <p class="mt-1 text-sm text-muted">{{ request.reason }}</p>

  <!-- Acciones secundarias por encima del enlace estirado -->
  <div class="relative z-10 mt-4 flex flex-wrap gap-2">
    <UButton label="Asignar" color="neutral" variant="outline" size="sm" @click="assign(request)" />
  </div>
</article>
```

- El foco se ve en toda la tarjeta (el anillo vive en el `::after`) y el hover
  cambia el borde a navy [B-24].
- El nombre accesible del enlace es el título: no repitas el título en el
  `alt` de una miniatura (pon `alt=""`) [C-M5].
- Si la tarjeta abre en otra pestaña, ícono `i-ph-arrow-square-out` y texto
  `sr-only` "(se abre en otra pestaña)" [C-M5, D-32].
- Nada de affordances solo con hover (`opacity-0 group-hover:opacity-100`):
  usa también `group-focus-within:` o muéstralas siempre [E-09, C-M5].
- **No:** `<button>` raíz con otro `<button>` y un enlace dentro [D-04]; una
  tarjeta KPI `<button>` con un botón de ayuda dentro [E-10]; `<div @click>`
  o `<article @click>` sin rol ni teclado [E-09, D-05].

---

## Filtros, búsqueda y chips

| Necesitas | Componente | Detalle |
|-----------|-----------|---------|
| Cambiar entre vistas de la misma lista (2–5 opciones excluyentes) | `UTabs` `variant="pill"` `color="neutral"` `:content="false"` | conteos en `badge` del item [C-08, D-10] |
| Elegir un valor de una lista larga | `USelect` / `USelectMenu` | "Todos" con centinela `'all'`, **nunca `''`** |
| Filtros que se combinan (varios a la vez) | `UButton` toggles con `aria-pressed` dentro de `role="group"` | activo `subtle` + ícono check; inactivo `outline` [E-13, D-05] |
| Una sola elección dentro de un formulario | `URadioGroup` | no botones que fingen radios [D-09] |
| Búsqueda | `UInput type="search"` con ícono y nombre accesible | `:loading` mientras busca, con debounce |
| Rango de fechas o periodo | El **único** `PeriodFilter` del proyecto (receta en [analytics](archetypes/analytics.md#filtro-de-periodo-un-solo-componente): rangos rápidos + "Desde"/"Hasta" + "Aplicar") | nunca un rango armado en cada vista [C-31] |
| Mostrar lo que está filtrando | Chips quitables + "Limpiar filtros" + conteo de resultados | conteo con `role="status"` |

**Trampa de reka-ui:** una opción de `USelect`/`USelectMenu` con `value: ''`
lanza una excepción dentro de `SelectItem` al montar, y en una navegación de
cliente deja la página colgada sin error visible. Usa un centinela con texto y
compara contra la constante.

```vue
<script setup lang="ts">
const ALL = 'all'
const route = useRoute()
const router = useRouter()

// Estado de filtros en la URL: se comparte, se recarga y "Atrás" funciona.
function setQuery(patch: Record<string, string | undefined>) {
  router.replace({ query: { ...route.query, ...patch } })
}

// Búsqueda por nombre o folio: dato personal, así que NO va en la URL
// (ver Privacidad). Estado local con espera de 300 ms; la petición la manda
// en el cuerpo (POST /search) o en una query que no se registra.
const search = ref('')
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (q) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { searchQuery.value = q.trim() }, 300)
})

const status = computed({
  get: () => (route.query.estado as string) ?? ALL,
  set: value => setQuery({ estado: value === ALL ? undefined : value }),
})
const statusItems = [
  { label: 'Todos los estados', value: ALL },
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Asignada', value: 'ASSIGNED' },
  { label: 'Atendida', value: 'COMPLETED' },
]

const kinds = [
  { value: 'individual', label: 'Individual', icon: 'i-ph-user' },
  { value: 'group', label: 'Grupal', icon: 'i-ph-users-three' },
]
const selectedKinds = computed(() => new Set(((route.query.tipo as string) ?? '').split(',').filter(Boolean)))
function toggleKind(value: string) {
  const next = new Set(selectedKinds.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  setQuery({ tipo: next.size ? [...next].join(',') : undefined })
}

const hasFilters = computed(() => Boolean(searchQuery.value || route.query.estado || route.query.tipo))
// `searching` y `total` salen de la petición de la lista (status y conteo).
const clearFilters = () => {
  search.value = ''
  router.replace({ query: {} })
}
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
    <UInput
      v-model="search"
      type="search"
      icon="i-ph-magnifying-glass"
      placeholder="Nombre o folio"
      aria-label="Buscar solicitudes"
      :loading="searching"
      class="w-full sm:w-72"
    />
    <USelect v-model="status" :items="statusItems" aria-label="Estado" class="w-full sm:w-48" />

    <div role="group" aria-label="Tipo de atención" class="flex flex-wrap gap-2">
      <UButton
        v-for="kind in kinds"
        :key="kind.value"
        :label="kind.label"
        :icon="selectedKinds.has(kind.value) ? 'i-ph-check' : kind.icon"
        color="neutral"
        :variant="selectedKinds.has(kind.value) ? 'subtle' : 'outline'"
        size="sm"
        :aria-pressed="selectedKinds.has(kind.value)"
        @click="toggleKind(kind.value)"
      />
    </div>
  </div>

  <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
    <p role="status" class="text-sm text-muted">{{ total }} solicitudes</p>
    <UButton v-if="hasFilters" label="Limpiar filtros" color="neutral" variant="link" size="sm" @click="clearFilters" />
  </div>
</template>
```

- Filtros visibles arriba de la lista (en móvil, en un `UDrawer` con botón
  "Filtros (2)").
- El estado seleccionado lleva **dos pistas** (relleno + ícono check),
  nunca solo color [C-08].
- **No:** `UBadge @click` como filtro [D-05]; píldoras `<button>` con
  `bg-(--ui-primary) text-white` y un hover que no cambia nada [E-13]; el
  filtro de periodo reconstruido en cada vista [C-31].

---

## Navegación

| Regla | Cómo | Evita |
|-------|------|-------|
| Rutas absolutas | `to: '/ubicaciones'`, nunca `'ubicaciones'` (vue-router la resuelve contra la ruta actual) | 404 o la página equivocada según desde dónde se haga clic [B-05] |
| Navegar es un enlace | `UButton to`, `ULink`, items con `to`; nunca `@click="navigateTo(…)"` ni `window.open` | sin abrir en pestaña nueva, sin menú contextual, invisible a buscadores [B-05] |
| Regresar | `FiBackButton fallback="/padre"` o `FiPageHeader back="/padre"` | siete tratamientos de "volver" [B-18] |
| Migas en vistas profundas del dashboard | `UBreadcrumb` en el `#left` del `UDashboardNavbar` | — |
| Un solo `<h1>` por vista | `FiPageHeader` (o el slot `#title` de `UAuthForm`, o el `h1` del héroe); sin `FiPageHeader`, el `title` del `UDashboardNavbar` | dos `h1` por vista con el navbar [C-M1]; login sin encabezado [B-16] |
| Encabezados en orden | h1 → h2 (secciones, `FiSectionCard`) → h3 (subsecciones, tarjetas de lista); sin saltos | h1 → h3 [C-34, D-32] |
| Un encabezado nunca va dentro de un botón | el `<button>` dentro del `<h3>`, no al revés | contenido inválido [D-32] |
| Un solo `<main id="main-content" tabindex="-1">` | en el **layout**; las páginas no ponen `<main>` | vistas sin landmark o con dos [C-20, E-29] |
| "Saltar al contenido" | primer elemento enfocable: FiHeader lo rinde en el sitio público (apunta a `#main-content`, prop `skipTo`); en el dashboard, un enlace propio en el layout (receta en [components.md](components.md#shell-del-dashboard-udashboard)) | tabular 10 paradas de chrome en cada página [B-M1] |
| Pestañas | `UTabs` en la página; `UNavigationMenu` si cambian de ruta | `role="tablist"` sobre enlaces [E-14] |
| Navegación activa | `UNavigationMenu` pinta el activo en `primary`; `aria-current="page"` solo lo emite en items con `exact: true` (Nuxt UI 4.9): ponlo en los items que son una página concreta | activo solo por un color propio |
| Enlaces externos o en pestaña nueva | `target="_blank"` + ícono `i-ph-arrow-square-out` + `sr-only` "(se abre en otra pestaña)" | pestañas que se abren en silencio [D-32] |
| Navegación interna | ícono `i-ph-arrow-right` o la tarjeta completa como enlace | `arrow-square-out` (dice "externo") para ir a otra vista [D-23] |
| Ayuda siempre en el mismo lugar | contacto, ayuda y crisis en la misma posición en todas las páginas (WCAG 3.2.6) | — |
| Cambio de paso o de vista dentro de la página | mueve el foco al nuevo encabezado (`tabindex="-1"` + `.focus()`) y el scroll arriba | el foco se queda en "Siguiente" al final de un paso largo [B-M2] |
| Detalle que aparece en la página | ábrelo en `USlideover` o mueve foco y scroll a él | "Ver detalle" que parece no hacer nada [E-30] |

```ts
// Al cambiar de paso: scroll y foco al título del paso
const stepHeading = useTemplateRef<HTMLHeadingElement>('stepHeading')

watch(step, async () => {
  await nextTick()
  stepHeading.value?.scrollIntoView({ block: 'start', behavior: 'auto' })
  stepHeading.value?.focus({ preventScroll: true })
})
```

```vue
<h2 ref="stepHeading" tabindex="-1" class="text-lg font-semibold text-fi-navy focus:outline-none">
  {{ stepTitle }}
</h2>
```

---

## Responsive

Diseña primero para 360 px y agrega columnas hacia arriba (`sm:`, `md:`,
`lg:`). La página **nunca** scrollea en horizontal y todo se lee a 320 px
(WCAG 1.4.10).

| Regla | Cómo | Evita |
|-------|------|-------|
| Trampa `min-width: auto` | hijos de `grid` y `flex` que contienen inputs, tablas o texto largo llevan `min-w-0` | filas que empujan la tarjeta fuera de la pantalla [E-23, C-20] |
| Filas de campos | `grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_6rem_auto]`, o `flex` con `min-w-0 flex-1` en los inputs | inputs con ancho intrínseco en `flex gap-2` [E-23] |
| Contenido ancho (tabla, gráfica, línea del tiempo, calendario) | su propio contenedor `overflow-x-auto`; si no tiene nada enfocable adentro, `tabindex="0"` `role="region"` `aria-label` | scroll que el teclado no alcanza [D-M1] |
| Acciones | `flex flex-wrap gap-2`; en móvil el `primary` puede ir `block` | botones cortados |
| Encabezado de vista | `FiPageHeader` apila las acciones bajo el título en móvil | — |
| Lista-detalle | detalle `hidden lg:flex`; abajo de `lg`, el detalle en `USlideover` (la lista conserva su lugar); si es largo o necesita URL, ruta de detalle con "Regresar" | dos paneles apretados |
| Tarjeta sobre un mapa o imagen | debajo de `md` va **debajo**, no encima | tarjeta que tapa el mapa [B-29] |
| Indicador de pasos | en móvil "Paso 2 de 4 · Contacto" + `UProgress` | stepper con scroll horizontal [B-29] |
| Altura de pantalla | `min-h-dvh`, `h-[calc(100dvh-…)]` | `100vh` (salta con la barra del navegador) [D-29] |
| Objetivos táctiles | ≥ 24 × 24 px siempre; 44 px en CTAs públicos móviles | botón de ayuda de 16 px [E-M2] |
| Barras fijas | `scroll-padding-top` igual al alto de la barra, para que el foco no quede tapado (WCAG 2.4.11) | — |
| Hover | nada esencial depende de hover (no existe en táctil) | controles invisibles hasta pasar el mouse [E-09] |

Anchos de contenido recomendados:

| Contexto | Ancho |
|----------|-------|
| Formularios, ajustes (`settings`), asistentes internos (`internal-task-flow`) | `max-w-3xl` |
| Vistas de trabajo del dashboard (`dashboard-home`, `worklist-queue`, `record-finder`, `record-detail`, `scheduling-calendar`, `bulk-entry`, `catalog-admin`, `builder-editor`): **uno solo** para que las vistas hermanas se alineen [D-11] | `max-w-7xl` |
| Analítica y bitácora (`analytics`, `audit-and-monitoring`) | ancho completo del panel |
| Asistentes públicos | `max-w-2xl` |
| Login y utilidades públicas | `max-w-md` (verificación: `max-w-2xl`) |
| Texto corrido | `max-w-prose` (60–75 caracteres por línea) |

```vue
<!-- Trampa min-w-0: sin él, el input del segundo hijo desborda la rejilla -->
<div class="grid gap-4 xl:grid-cols-2">
  <div class="min-w-0">
    <UInput v-model="search" type="search" aria-label="Buscar" class="w-full" />
  </div>
  <div class="flex min-w-0 flex-col gap-2 sm:flex-row">
    <UInputDate v-model="from" aria-label="Desde" class="w-full sm:w-40" />
    <UInputDate v-model="to" aria-label="Hasta" class="w-full sm:w-40" />
  </div>
</div>
```

---

## Accesibilidad base (WCAG 2.2 AA)

Esto es el piso de toda vista FI. Los componentes de Nuxt UI y los `Fi*` ya
cumplen buena parte; lo que se rompe casi siempre es lo que se hace a mano.

| Criterio | Regla concreta en fi-ui |
|----------|-------------------------|
| 1.1.1 Contenido no textual | Íconos decorativos sin nombre (`FiIconBadge` sin `label`); imágenes decorativas `alt=""`; gráficas con resumen en texto y tabla ([data-viz.md](data-viz.md)) |
| 1.3.1 Información y relaciones | `UTable` para datos tabulares; `UFormField` para campos; listas como `ul`/`ol`; `legend` en grupos; encabezados en orden |
| 1.3.5 Propósito de la entrada | `autocomplete` en datos personales |
| 1.4.1 Uso del color | Estado = ícono + texto + color (`FiStatusBadge`); selección con dos pistas; series de gráfica con patrón o etiqueta directa |
| 1.4.3 Contraste de texto | Solo tokens: `text-default`, `text-muted`, `text-highlighted`, `text-fi-navy`, `text-success`… (fi-ui los ajusta a ≥ 4.5:1 sobre sus tres superficies). Nunca `-500`/`-600` de estado para texto [D-06] |
| 1.4.10 Reflow | Sin scroll horizontal de página a 320 px |
| 1.4.11 Contraste no textual | Bordes de controles ≥ 3:1 (fiAppConfig); íconos blancos solo sobre fondos ≥ 3:1 [D-M2]; marcas de gráfica ≥ 3:1 |
| 1.4.12 / 1.4.4 Texto | Nada < 12 px; la escala de fi-ui va en `rem` |
| 2.1.1 Teclado | Todo lo clicable es `button`, `a` o un componente de Nuxt UI; nada de `@click` en `div`, `span`, `article`, `UBadge` ni `UTimeline @select` [D-M1, E-09] |
| 2.4.1 Saltar bloques | "Saltar al contenido" (FiHeader, o el layout del dashboard) + `<main id="main-content">` |
| 2.4.3 Orden del foco | Diálogos atrapan y devuelven el foco (Nuxt UI lo hace); cambios de paso mueven el foco al título |
| 2.4.6 Encabezados y etiquetas | Un `h1`; títulos que describen; botones con verbo |
| 2.4.7 Foco visible | No quites `outline` sin reemplazo; controles nativos inevitables con `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` [D-19, E-25] |
| 2.4.11 Foco no tapado | `scroll-padding-top` con barras fijas |
| 2.5.7 Arrastre | Todo lo que se arrastra (reordenar) tiene alternativa con botones "Subir/Bajar" visibles con teclado [E-09] |
| 2.5.8 Tamaño del objetivo | ≥ 24 × 24 px [E-M2] |
| 3.2.6 Ayuda consistente | Ayuda, contacto y crisis en el mismo lugar de cada página |
| 3.3.1 / 3.3.3 Errores | Mensaje junto al campo, que dice cómo corregir; resumen enlazado en formularios largos |
| 3.3.7 Entrada redundante | No pedir dos veces lo mismo en un flujo |
| 3.3.8 Autenticación accesible | Permitir pegar y gestores de contraseñas (`autocomplete`) |
| 4.1.2 Nombre, rol, valor | Botón de solo ícono con `aria-label` (`UTooltip` no da nombre) [C-10, E-08]; toggles con `aria-pressed`; disclosures con `UCollapsible`/`UAccordion` o `aria-expanded` [C-18]; checkboxes de fila con `aria-label` [D-09] |
| 4.1.3 Mensajes de estado | `role="alert"` errores; `role="status"` resultados, conteos y cargas |

---

## Movimiento

- Transiciones de UI de **150–200 ms**; nada decorativo en bucle ni en
  autoplay.
- Toda animación propia va con `motion-safe:` o dentro de
  `@media (prefers-reduced-motion: no-preference)`. Esto incluye
  `hover:scale-*`, `animate-pulse`, `animate-spin` y transiciones de
  `translate` [B-25, C-28, D-31, E-28, E-06].
- **Nada animado en contenido de crisis.** Ni `FiReveal`, ni contadores, ni
  héroes con movimiento.
- Cambios en tiempo real sin mover lo que la persona está leyendo: píldora
  "3 nuevas · Mostrar" en vez de reordenar.
- El reveal de contenido tras un skeleton: solo opacidad, sin escalar ni
  desplazar (eso reintroduce el salto de layout).
- `FiReveal` y los componentes de Nuxt UI ya respetan la preferencia; lo tuyo,
  no: revisa cada `transition-*` y `animate-*` que escribas.

```vue
<!-- El color cambia siempre; el desplazamiento y el giro, solo si no se pidió reducir el movimiento -->
<article class="border border-default transition-[border-color,translate] duration-150 hover:border-fi-navy motion-safe:hover:-translate-y-0.5">
  …
</article>
<UIcon name="i-ph-arrows-clockwise" class="size-4 motion-safe:animate-spin" />
```

---

## Contenido e i18n

### Todo el texto visible pasa por i18n

Incluye `aria-label`, `title`, `placeholder`, textos de `UEmpty`, de
toasts, de confirmaciones, nombres de archivo de exportación y etiquetas de
gráficas. Las props de texto de los `Fi*` reciben el texto ya traducido; los
textos propios del paquete ("Regresar", "Aviso de privacidad") ya siguen al
idioma activo.

Extracto de `i18n/locales/es.json`:

```json
{
  "categories": {
    "delete": {
      "title": "¿Eliminar la categoría «{name}»?",
      "description": "Se desvinculará de {count} subcategorías. Esta acción no se puede deshacer.",
      "confirm": "Eliminar categoría"
    },
    "actionsFor": "Más acciones para {name}"
  },
  "common": {
    "cancel": "Cancelar",
    "retry": "Reintentar",
    "clearFilters": "Limpiar filtros",
    "optional": "(opcional)",
    "newTab": "(se abre en otra pestaña)"
  }
}
```

```ts
const { t } = useI18n()
const confirmed = await confirmDialog.open({
  title: t('categories.delete.title', { name: category.name }),
  description: t('categories.delete.description', { count: category.subcategoryCount }),
  confirmLabel: t('categories.delete.confirm'),
  cancelLabel: t('common.cancel'),
})
```

- Claves por dominio (`requests.*`, `referrals.*`); no reutilices la clave de
  otro dominio porque "dice lo mismo": acopla dos pantallas que cambiarán por
  separado [D-33]. Lo genérico va en `common.*`.
- Cuando cambies texto visible, **no renombres llaves de la respuesta de la
  API** aunque estén en otro idioma o se parezcan al texto: un reemplazo masivo
  rompe la lectura de los datos sin que el typecheck lo note.
- Fechas, números y porcentajes con `Intl` y el idioma activo (ver
  [data-viz.md](data-viz.md#formato-de-números)). Zona horaria de la FI:
  `FI_TIME_ZONE` (exportado por `@fi-unam/ui`).

### Lenguaje claro

| Regla | Ejemplo |
|-------|---------|
| Frases de ≤ 20 palabras, voz activa | "Te escribiremos en 3 días hábiles." |
| Lo importante primero | Respuesta o acción antes que el contexto |
| Tratamiento consistente (tú o usted) en todo el sitio | — |
| Mayúscula solo al inicio en títulos, botones, pestañas e insignias | "Nueva categoría", no "Nueva Categoría" ni "NUEVA CATEGORÍA". Las versalitas de `.fi-label` y de los `th` son CSS: el texto fuente va en caja normal |
| Siglas desarrolladas la primera vez | "Programa de Salud Mental (PSM)" |
| Errores sin culpa, sin humor, sin jerga, con salida | "No encontramos ese número de cuenta. Revisa que tenga 9 dígitos." |
| Sin `error.message` crudo al público | mensaje mapeado + detalle técnico solo para copiar [B-M5] |
| Vocabulario del dominio, no el de la base de datos | En PSM: *malestar* (no síntoma), *acompañamiento* (no terapia), *historial* (no expediente), *derivación interna* (no interconsulta) [B-21, D-24, E-32] |

Los nombres de tablas, columnas e identificadores de código no cambian por
esta regla: aplica solo al texto visible.

---

## Privacidad

| Regla | Cómo |
|-------|------|
| Nada de datos personales en la URL | Ni en la ruta ni en la query: ids opacos (`/historiales/8f3c…`), nunca `?correo=` ni `?cuenta=`. Los filtros de texto libre con datos personales van en el cuerpo o en estado local |
| Mínimo necesario en pantalla | Muestra lo que la tarea requiere; lo más sensible con "Mostrar" a demanda y registro del acceso |
| Identificadores humanos, no internos | Nombre y folio; nunca UUIDs a la vista |
| Conteos pequeños suprimidos en estadísticas | "< 5" con nota que explica la regla ([data-viz.md](data-viz.md#supresión-de-conteos-pequeños)) |
| Exportaciones | Reflejan los filtros activos, dicen cuáles en el archivo, incluyen solo los campos que el rol necesita, y quedan registradas |
| Sesiones | Avisa antes de que expire; conserva borradores |
| Sin terceros innecesarios | Fuentes servidas por el paquete (sin Google Fonts); nada de rastreo en vistas sensibles |
| Errores públicos | Sin trazas, rutas internas ni datos de otras personas |
| Copias y portapapeles | "Copiar detalles" de un error no incluye datos personales |
