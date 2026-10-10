# Arquetipo `public-guided-flow` — Flujo público guiado (varios pasos, con identidad)

Un envío sensible en varios pasos: verificar identidad, consentimiento,
datos, motivo o respuestas, revisión y confirmación. Sigue el modelo de
GOV.UK: **una cosa por página**, la validación al continuar, un resumen de
errores, la revisión de respuestas y una confirmación con folio.

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` (componentes `Fi*`
> auto-registrados) y zod 4. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. `FlowStepForm`, `IdentityGate` y `useStepFocus`
> son **recetas del proyecto**: fi-ui no las trae.

## Propósito y usuario

- **Usuario:** una persona estudiante, a menudo desde el teléfono y a veces
  con malestar. Escribe datos personales y sensibles.
- **Tarea:** completar el envío sin errores ni sustos y saber qué pasa
  después.
- **Éxito:** termina con un folio y la fecha en que le responderán, sin
  perder lo que escribió en ningún momento.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Solicitar un servicio, dar consentimiento informado, contestar un cuestionario o una encuesta, con o sin verificación de identidad. | Un formulario de un paso con un solo resultado (iniciar sesión, validar un documento): es [`public-utility`](public-utility.md). |
| Cualquier flujo de 3 o más preguntas o grupos que se envía al final. | Un flujo del personal dentro del dashboard: es el arquetipo `internal-task-flow`. |
| | Una tarea de dos campos. Si cabe en una sola página, no la partas en pasos. |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Chrome mínimo | `layouts/flow.vue`: `FiHeader :items="[]" :top-bar="false"` con el [acceso de crisis](crisis-info.md#acceso-de-crisis-persistente-en-el-chrome) en `#actions`, `<main id="main-content">` y `FiFooter` | Sin menú principal: menos salidas accidentales. El logotipo sigue llevando al inicio y la crisis sigue en su lugar de siempre. |
| 1 | Progreso | En móvil, "Paso 2 de 5 · Datos de contacto" + `UProgress`. Desde `sm`, `UStepper size="sm" disabled` | Solo si el total es fiable y son 3 o más pasos lineales. El stepper es **indicador**, no navegación. |
| 2 | Encabezado del paso | `FiPageHeader :title :description` (renderiza el `h1`) | El `h1` es la pregunta o el nombre del paso. La descripción, una pista de una frase. |
| 3 | Resumen de errores | `UAlert id="error-summary" role="alert" tabindex="-1" color="error" variant="subtle"` | Solo después de un envío fallido. Lista enlaces a cada campo. Recibe el foco. |
| 4 | Campos | `FiSectionCard as="div"` + `UForm :validate-on="[]"` + `UFormField` | Una sola columna, etiqueta arriba, `hint="(opcional)"` en los opcionales (nunca la prop `required`, que solo pinta un asterisco), `aria-required="true"` en los obligatorios, `autocomplete` en datos personales. |
| 5 | Error del envío | `UAlert role="alert" color="error" variant="subtle"` **junto a los botones** | Para fallos del servidor. Lo escrito se conserva. |
| 6 | Navegación | `[Atrás: neutral ghost]` a la izquierda y `[Continuar: primary sólido lg]` a la derecha. En el último paso, el verbo final ("Enviar solicitud") | Un solo `primary` sólido. "Atrás" es un enlace real al paso anterior. |
| 7 | Nota de privacidad | `<p class="text-sm text-muted">` con enlace al aviso de privacidad | Persistente en todos los pasos. |

### Secuencia típica

| Paso | Contenido | Patrón |
|---|---|---|
| (antes) | Página explicativa: qué necesitas, cuánto tarda, que no es de emergencia | [`public-content`](public-content.md) |
| 1 | Verificación de identidad | [Identity gate](#identity-gate-verificación-de-identidad) |
| 2 | Consentimiento | [Consentimiento](#consentimiento) |
| 3 | Datos de contacto | `UFormField` + `autocomplete` |
| 4 | Motivo, en palabras de la persona | `UTextarea` en `UFormField` con contador en `hint` |
| 5 | Revisa tus respuestas | [Revisar respuestas](#revisar-respuestas) |
| 6 | Confirmación | [Confirmación](#confirmación) |

### Layout mínimo del flujo

```vue
<!-- layouts/flow.vue -->
<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <FiHeader :items="[]" :top-bar="false" title="Programa de Salud Mental">
      <template #actions>
        <UButton
          to="/emergencia"
          icon="i-ph-first-aid-kit"
          color="error"
          variant="subtle"
          label="Ayuda inmediata"
        />
      </template>
    </FiHeader>
    <main id="main-content" tabindex="-1" class="flex flex-1 flex-col focus:outline-none">
      <slot />
    </main>
    <FiFooter />
  </div>
</template>
```

```css
/* main.css del proyecto: el header es sticky. Sin esto, el h1 y los campos
   enfocados quedan debajo de él (WCAG 2.4.11). */
@layer base {
  html { scroll-padding-top: 6rem; }
}
```

### Paso de formulario reutilizable (receta del proyecto)

Un solo componente para todos los pasos, para que el botón, el resumen de
errores y el foco sean iguales en todos los flujos (B-17).

```vue
<!-- components/FlowStepForm.vue (del proyecto) -->
<script setup lang="ts">
import type { FormErrorEvent, FormSchema, FormSubmitEvent } from '@nuxt/ui'
import type { RouteLocationRaw } from 'vue-router'

/**
 * Paso de un flujo público al estilo GOV.UK: valida solo al enviar, resume
 * los errores arriba con enlaces a cada campo y les pasa el foco. UFormField
 * pone aria-invalid y aria-describedby en cada control, y lo escrito nunca se
 * borra.
 */
const props = defineProps<{
  schema: FormSchema
  state: Record<string, unknown>
  /** Título completo de la pestaña: "Paso 3 de 5: Contacto – Servicio". */
  pageTitle: string
  /** "Continuar", o el verbo final en el último paso: "Enviar solicitud". */
  submitLabel: string
  /** Paso anterior como enlace real; false en el primer paso. */
  backTo: RouteLocationRaw | false
  /** Se espera con await: mientras corre, UForm deshabilita los campos y el botón muestra carga. */
  action: (data: any) => Promise<void> | void
  /** Error del servidor, que se muestra junto a los botones. */
  submitError?: string
}>()

const errors = ref<FormErrorEvent['errors']>([])

// "Error: " al inicio del título: el lector de pantalla anuncia el fallo
// aunque la persona no esté mirando la página.
useHead({ title: () => (errors.value.length ? `Error: ${props.pageTitle}` : props.pageTitle) })

async function onError(event: FormErrorEvent) {
  errors.value = event.errors
  await nextTick()
  document.getElementById('error-summary')?.focus()
}

async function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  errors.value = []
  await props.action(event.data)
}

function focusField(id?: string) {
  if (id) document.getElementById(id)?.focus()
}
</script>

<template>
  <UForm
    :schema="props.schema"
    :state="props.state"
    :validate-on="[]"
    class="space-y-6"
    @submit="onSubmit"
    @error="onError"
  >
    <UAlert
      v-if="errors.length"
      id="error-summary"
      role="alert"
      tabindex="-1"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      title="Revisa estos datos"
    >
      <template #description>
        <ul class="mt-1 list-disc space-y-1 ps-5">
          <li v-for="error in errors" :key="error.id ?? error.name">
            <a
              :href="`#${error.id}`"
              class="underline underline-offset-2"
              @click.prevent="focusField(error.id)"
            >{{ error.message }}</a>
          </li>
        </ul>
      </template>
    </UAlert>

    <!-- FiSectionCard es la tarjeta FI de las tareas públicas: sin clases de
         tarjeta repetidas (B-14). -->
    <FiSectionCard as="div">
      <div class="space-y-5">
        <slot />
      </div>
    </FiSectionCard>

    <UAlert
      v-if="props.submitError"
      role="alert"
      color="error"
      variant="subtle"
      icon="i-ph-warning-circle"
      :description="props.submitError"
    />

    <!-- En móvil el botón principal queda arriba (flex-col-reverse) y a ancho completo. -->
    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UButton
        v-if="props.backTo"
        :to="props.backTo"
        color="neutral"
        variant="ghost"
        icon="i-ph-arrow-left"
        label="Atrás"
        class="justify-center"
      />
      <span v-else class="hidden sm:block" />
      <!-- Nunca disabled para "avisar" que falta algo: se deja enviar y se explica. -->
      <UButton
        type="submit"
        size="lg"
        color="primary"
        variant="solid"
        loading-auto
        trailing-icon="i-ph-arrow-right"
        :label="props.submitLabel"
        class="justify-center"
      />
    </div>
  </UForm>
</template>
```

Por qué `:validate-on="[]"` (solo al enviar) en un flujo público: validar al
salir de cada campo marca errores mientras la persona todavía está llenando el
formulario, y en un tema sensible eso se lee como regaño. GOV.UK valida solo
al pulsar "Continuar". En los formularios del personal se puede validar
también al salir del campo (`['blur']`), después del primer envío.

### Página del flujo

```vue
<!-- pages/solicitud.vue -->
<script setup lang="ts">
import * as z from 'zod'

definePageMeta({ layout: 'flow' })

const STEPS = [
  { value: 'identidad', title: 'Identidad' },
  { value: 'consentimiento', title: 'Consentimiento' },
  { value: 'contacto', title: 'Datos de contacto' },
  { value: 'motivo', title: 'Lo que te trae' },
  { value: 'revisar', title: 'Revisa tus respuestas' },
]

const route = useRoute()
const router = useRouter()

// Estado del flujo y borrador en sessionStorage (ver "Borrador y sesión").
// Sabe qué pasos están completos: desde la URL no se puede saltar adelante.
const flow = useRequestFlow()

// El paso vive en la URL (?paso=contacto): Atrás del navegador y recargar
// funcionan. El paso no es un dato personal; los datos nunca van en la URL.
const current = computed(() => flow.resolveStep(route.query.paso))
const index = computed(() => STEPS.findIndex(s => s.value === current.value))

const { focusStepHeading } = useStepFocus()
watch(current, focusStepHeading)

const contactSchema = z.object({
  email: z.email('Escribe un correo con el formato nombre@ejemplo.com'),
  phone: z.union([z.literal(''), z.string().regex(/^\d{10}$/, 'Escribe 10 dígitos, sin espacios')]),
})

async function saveContact(data: z.output<typeof contactSchema>) {
  flow.complete('contacto', data)
  // Si llegó desde "Cambiar" en la revisión, regresa ahí y no al paso siguiente.
  const next = route.query.volver === 'revisar' ? 'revisar' : 'motivo'
  await router.push({ query: { paso: next } })
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <!-- Progreso. En móvil, texto + barra (nunca un stepper con scroll
         horizontal, B-29). Desde sm, el stepper como indicador: `disabled`
         para que nadie se salte pasos con un clic. -->
    <div class="sm:hidden">
      <p class="text-sm font-medium text-highlighted">
        Paso {{ index + 1 }} de {{ STEPS.length }} · {{ STEPS[index]?.title }}
      </p>
      <UProgress :model-value="index + 1" :max="STEPS.length" size="sm" class="mt-2" />
    </div>
    <UStepper
      class="hidden sm:flex"
      :items="STEPS"
      :model-value="current"
      size="sm"
      disabled
    />

    <template v-if="current === 'contacto'">
      <FiPageHeader
        title="¿Cómo te contactamos?"
        description="Solo usaremos estos datos para darte seguimiento."
      />
      <FlowStepForm
        :schema="contactSchema"
        :state="flow.contact"
        :page-title="`Paso ${index + 1} de ${STEPS.length}: Datos de contacto – Programa de Salud Mental`"
        submit-label="Continuar"
        :back-to="{ query: { paso: 'consentimiento' } }"
        :action="saveContact"
      >
        <UFormField name="email" label="Correo electrónico">
          <UInput
            v-model="flow.contact.email"
            type="email"
            autocomplete="email"
            spellcheck="false"
            aria-required="true"
            size="lg"
            class="w-full"
          />
        </UFormField>
        <UFormField
          name="phone"
          label="Teléfono celular"
          hint="(opcional)"
          description="10 dígitos, sin espacios."
        >
          <UInput
            v-model="flow.contact.phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel-national"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </FlowStepForm>
    </template>

    <!-- …un bloque igual por paso (o un componente por paso)… -->

    <p class="text-sm text-muted">
      Tus datos son confidenciales.
      <ULink to="/privacidad" target="_blank" class="text-primary underline underline-offset-2">
        Lee el aviso de privacidad (abre en otra pestaña)
      </ULink>
    </p>
  </div>
</template>
```

### Foco y scroll al cambiar de paso

```ts
// composables/useStepFocus.ts (del proyecto)
/**
 * Al cambiar de paso, lleva el foco al h1 del paso nuevo y lo muestra arriba.
 * Sin esto, el lector de pantalla se queda en "Continuar" y en el teléfono la
 * vista queda a media página del paso anterior (B-M2). El scroll es
 * instantáneo: un scroll suave dura más de 200 ms y marea.
 */
export function useStepFocus() {
  async function focusStepHeading() {
    await nextTick()
    const heading = document.querySelector<HTMLElement>('main h1')
    if (!heading) return
    heading.tabIndex = -1
    heading.scrollIntoView({ block: 'start' })
    heading.focus({ preventScroll: true })
  }
  return { focusStepHeading }
}
```

### Identity gate (verificación de identidad)

**Un solo componente** compartido por todos los flujos del sitio. La auditoría
encontró dos implementaciones con layout, tamaño de campos, encabezado y
botones distintos (B-17).

| Regla | Detalle |
|---|---|
| Encabezado real | `FiPageHeader title="Confirma que eres tú"` (`h1`). Nunca un `h1` de `text-sm` (B-16). |
| Por qué se pide | La descripción dice para qué y que los datos no se comparten. |
| Formato | El número de cuenta lleva una pista ("9 dígitos, sin guiones. Está en tu credencial."), `inputmode="numeric"`, `autocomplete="off"` y `spellcheck="false"`. |
| Mensaje genérico | "No pudimos verificar tus datos." No digas qué campo falló ni si la cuenta existe. |
| Intentos | Solo **después** del primer fallo: "Te quedan 2 intentos." Mostrarlos antes genera ansiedad. |
| Bloqueo | Reemplaza el formulario por un bloque de estado: cuándo se puede reintentar y alternativas, con la crisis primero. |
| Después | "Continúas como Ana P. (cuenta terminada en 1234) · No soy yo". El número nunca va completo en pantalla ni en la URL. |
| Crisis | El acceso del header siempre está visible, y debajo del formulario va un enlace "¿Necesitas ayuda ahora?". |

```vue
<!-- components/IdentityGate.vue (del proyecto) -->
<script setup lang="ts">
import * as z from 'zod'

const emit = defineEmits<{ verified: [identity: { displayName: string, accountTail: string }] }>()

const state = reactive({ account: '', name: '' })
const schema = z.object({
  account: z.string().regex(/^\d{9}$/, 'Escribe los 9 dígitos de tu número de cuenta'),
  name: z.string().trim().min(1, 'Escribe tu nombre como aparece en tu credencial'),
})

// null hasta el primer fallo: el contador no se muestra antes.
const remaining = ref<number | null>(null)
const submitError = ref<string>()

async function verify(data: z.output<typeof schema>) {
  const result = await verifyIdentity(data) // API del proyecto
  if (result.ok) return emit('verified', result.identity)
  remaining.value = result.remainingAttempts
  submitError.value = `No pudimos verificar tus datos. Revisa tu número de cuenta y tu nombre. Te quedan ${result.remainingAttempts} intentos.`
}
</script>

<template>
  <FiPageHeader
    title="Confirma que eres tú"
    description="Lo usamos solo para encontrar tu historial. No lo compartimos."
  />
  <FlowStepForm
    v-if="remaining !== 0"
    :schema="schema"
    :state="state"
    page-title="Confirma que eres tú – Programa de Salud Mental"
    submit-label="Continuar"
    :back-to="false"
    :action="verify"
    :submit-error="submitError"
  >
    <UFormField
      name="account"
      label="Número de cuenta"
      description="9 dígitos, sin guiones. Está en tu credencial."
    >
      <UInput
        v-model="state.account"
        inputmode="numeric"
        autocomplete="off"
        spellcheck="false"
        aria-required="true"
        size="lg"
        class="w-full"
      />
    </UFormField>
    <UFormField name="name" label="Nombre">
      <UInput v-model="state.name" autocomplete="name" aria-required="true" size="lg" class="w-full" />
    </UFormField>
  </FlowStepForm>
  <!-- Bloqueado: estado con fecha y alternativas (ver status-and-error.md). -->
  <IdentityLockedNotice v-else />

  <p class="text-sm">
    <ULink to="/emergencia" class="text-primary underline underline-offset-2">
      ¿Necesitas ayuda ahora? Ve las líneas de atención inmediata
    </ULink>
  </p>
</template>
```

### Consentimiento

- Es **su propio paso**, nunca un párrafo dentro de otro.
- Por capas: un resumen en lenguaje claro (3–5 puntos, en lista ordenada con `FiStepBadge` o `<ol>` simple) y un enlace al aviso de privacidad completo, que dice que abre otra pestaña.
- Una casilla **sin marcar** por cada finalidad (`UCheckbox` dentro de `UFormField`). Nunca premarcada, nunca varias finalidades en una sola casilla.
- El error va **debajo de la casilla**, en línea. Nunca en un toast (B-M4).
- Tono neutro. Un trámite de rutina no lleva aviso `warning` (inventario, `consentimiento.vue`).

```vue
<UFormField name="consent">
  <UCheckbox
    v-model="state.consent"
    label="Acepto que el Programa use mis datos para darme acompañamiento"
  />
</UFormField>
```

```ts
const consentSchema = z.object({
  consent: z.literal(true, { error: 'Marca la casilla para continuar' }),
})
```

### Revisar respuestas

```vue
<FiPageHeader title="Revisa tus respuestas" description="Puedes cambiar cualquier dato antes de enviar." />

<FiSectionCard title="Datos de contacto" :heading-level="2" divided>
  <template #actions>
    <!-- "Cambiar" lleva al paso y regresa aquí al guardar, no al inicio. -->
    <UButton
      :to="{ query: { paso: 'contacto', volver: 'revisar' } }"
      color="neutral"
      variant="link"
      label="Cambiar"
      aria-label="Cambiar datos de contacto"
    />
  </template>
  <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]">
    <dt class="fi-label">Correo</dt>
    <dd>{{ flow.contact.email }}</dd>
    <dt class="fi-label">Teléfono</dt>
    <dd>{{ flow.contact.phone || 'No lo diste' }}</dd>
  </dl>
</FiSectionCard>

<!-- …una FiSectionCard por paso… -->

<p>Al enviar confirmas que la información es correcta.</p>
<!-- El verbo final dice qué pasa: nunca "Continuar" ni "Finalizar". -->
<UButton size="lg" loading-auto label="Enviar solicitud" icon="i-ph-paper-plane-tilt" color="primary" variant="solid" @click="submit" />
```

### Confirmación

- Es una **página**, no un toast. El toast desaparece y el folio se pierde.
- Llega con `router.replace`, para que Atrás no reenvíe el formulario. Al llegar, el foco va al `h1` y el borrador se borra.
- El folio y el correo enmascarado llegan por el estado del flujo (o los devuelve el servidor por la sesión), no en la query: un enlace copiado no debe mostrar el comprobante de otra persona. Si se recarga y ya no hay estado, la página dice "Tu solicitud ya se envió; la confirmación está en tu correo" con un enlace al inicio, nunca un error.

```vue
<div class="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
  <FiSectionCard as="div">
    <div class="space-y-4">
      <FiIconBadge icon="i-ph-check-circle" tone="success" size="xl" />
      <h1 class="text-2xl font-bold tracking-tight text-fi-navy sm:text-3xl">Recibimos tu solicitud</h1>
      <div>
        <p class="fi-label">Tu folio</p>
        <p class="flex items-center gap-2 text-2xl font-bold tabular-nums text-fi-navy">
          {{ folio }}
          <!-- Botón solo con ícono: aria-label obligatorio; un UTooltip no da nombre (C-10). -->
          <UButton
            icon="i-ph-copy"
            color="neutral"
            variant="ghost"
            aria-label="Copiar folio"
            @click="copyFolio"
          />
        </p>
      </div>
      <p>Te enviamos una copia a {{ maskedEmail }}.</p>
    </div>
  </FiSectionCard>

  <section aria-labelledby="next-steps">
    <h2 id="next-steps" class="text-lg font-semibold text-fi-navy">Qué sigue</h2>
    <ol class="mt-3 list-decimal space-y-2 ps-5">
      <li>Revisamos tu solicitud en un máximo de 5 días hábiles.</li>
      <li>Te escribimos para acordar tu primera sesión.</li>
    </ol>
  </section>

  <UAlert
    color="error"
    variant="subtle"
    icon="i-ph-first-aid-kit"
    title="Si tu situación se vuelve urgente, no esperes nuestra respuesta"
    :actions="[{ label: 'Ver líneas de ayuda', to: '/emergencia', color: 'error', variant: 'outline' }]"
  />

  <div class="flex flex-wrap gap-3">
    <UButton to="/" color="neutral" variant="outline" label="Volver al inicio" />
    <UButton color="neutral" variant="ghost" icon="i-ph-printer" label="Imprimir comprobante" @click="printPage" />
  </div>
</div>
```

`copyFolio` copia al portapapeles y confirma con un toast ("Folio copiado").
Ese sí es un aviso pasajero. `printPage` llama a `window.print()`.

### Preguntas de cuestionario (escalas, sí/no, opción múltiple)

- Cada pregunta es un grupo con nombre: `URadioGroup :legend="question.text"` (sí/no, opción única, escala; `variant="card" orientation="horizontal"` en escalas) o `UCheckboxGroup :legend` (opción múltiple). Nunca `<button>` sueltos con la selección marcada solo por color (B-03).
- El campo "Otro" es un `UInput` con `aria-label="Otro: especifica"`. Nunca `focus:outline-none` (B-03).
- Las preguntas obligatorias sin responder llevan su error **en la pregunta** (`UFormField :error`), más el resumen arriba. Nunca solo "Faltan 3 respuestas" (B-M3).
- El progreso va en texto: "Respondidas 5 de 12". En encuestas largas, agrúpalas en secciones.
- Un solo renderizador de preguntas para todo el sitio: el anónimo y el identificado comparten componente (B-02).

### Borrador y sesión

- Guarda el borrador por paso en `sessionStorage` (se borra al cerrar la pestaña). Nunca en `localStorage` ni en la URL: son datos sensibles y la computadora puede ser compartida.
- Bórralo al confirmar el envío.

`useRequestFlow` (receta del proyecto, la usa la página del flujo) cumple este
contrato:

| Pieza | Qué hace |
|---|---|
| Estado | Un objeto por paso (`consent`, `contact`, `reason`…) más la lista de pasos completos; reactivo y compartido entre pasos (`useState` en Nuxt, un `ref` de módulo en Vue). |
| `resolveStep(paso)` | Devuelve el paso pedido si es válido **y** no está más allá del primer paso incompleto; si no, ese primer paso incompleto. Así `?paso=revisar` no salta pasos. |
| `complete(paso, datos)` | Guarda los datos del paso, lo marca completo y escribe el borrador en `sessionStorage`. |
| `clear()` | Borra estado y borrador; se llama al confirmar el envío. |
| Hidratación | `sessionStorage` solo existe en el cliente: lee el borrador en `onMounted` (o sirve la ruta sin SSR, `routeRules: { '/solicitud': { ssr: false } }`), y muestra el skeleton del paso hasta entonces. Leerlo durante el render del servidor da otro paso que el del cliente. |
- Si la verificación abre una sesión con caducidad, avisa al menos 20 s antes con la opción de extenderla (WCAG 2.2.1), y conserva el borrador si caduca.

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando (configuración, sesión) | `USkeleton` con la forma de la tarjeta del paso: encabezado y 2–3 campos | Nunca un spinner a pantalla completa ni el texto "Redirigiendo…" como único contenido. |
| Recepción cerrada | El bloque de estado de [status-and-error](status-and-error.md#recepción-cerrada-en-línea) **en lugar del flujo** | Nunca dejes llenar el formulario para rechazarlo al final. |
| Solicitud reciente (ya enviada) | Aviso neutral con el folio previo, qué esperar y a quién escribir | Sin rojo: no hay error. |
| Bloqueado (intentos agotados) | Bloque de estado con hora de reintento y alternativas, con la crisis primero | — |
| Error de validación | Resumen arriba, con foco, más un error por campo; título "Error: …" | Lo escrito se conserva. |
| Error del servidor | `UAlert` junto a los botones con "Inténtalo de nuevo" | Lo escrito se conserva. Di si algo se guardó. |
| Éxito | Página de confirmación | Nunca solo un toast. |

Las tarjetas de estado (cerrado, bloqueado, éxito) usan **una** receta:
`FiIconBadge size="xl"` con el tono del estado, `h1` (o `h2` si la página ya
tiene `h1`), descripción y acciones. La auditoría encontró nueve versiones con
círculos de 3 tamaños y títulos de `h1 text-2xl` a `p text-sm` (B-11).

## Jerarquía de acciones

1. Por paso, **un** `UButton` sólido primary `size="lg"`: "Continuar" o el verbo final ("Enviar solicitud", "Enviar respuestas"). Mismo tamaño e ícono en todos los flujos (B-17).
2. "Atrás" es `color="neutral" variant="ghost"` con `icon="i-ph-arrow-left"`, como enlace real al paso anterior. Un solo control de regreso por pantalla (B-18).
3. "Cambiar" en la revisión es `variant="link"` con `aria-label` específico.
4. El stepper no es navegación: `disabled`. Nadie se salta pasos obligatorios desde él.
5. El botón de enviar nunca se deshabilita para indicar que falta algo. La persona envía y el resumen explica.

## Contenido y tono

- **Una cosa por página.** El `h1` es la pregunta ("¿Cómo te contactamos?"), no el nombre técnico del paso.
- Pide solo lo necesario. Nunca pidas dos veces un dato que ya diste (WCAG 3.3.7): rellénalo desde la sesión. Ofrece "Prefiero no decir" donde aplique.
- Las pistas son de una frase. Los placeholders nunca sustituyen a la etiqueta.
- Errores concretos y sin culpa: "Escribe los 9 dígitos de tu número de cuenta", no "Campo inválido". Sin "por favor" ni "lo sentimos" en errores de validación.
- Vocabulario no clínico si el proyecto lo usa. En PSM: "Lo que te trae", no "motivo de consulta"; "primer contacto", no "valoración" (B-21).
- Recuerda en el flujo que no es un servicio de emergencia (acceso de crisis en el header y en la confirmación).

## Responsive

- Una columna `max-w-2xl`. El ancho no cambia entre pasos ni entre flujos del mismo sitio.
- En `< sm`, el progreso es "Paso 2 de 5 · Datos de contacto" con `UProgress`. El `UStepper` horizontal se muestra solo desde `sm`. Nunca un stepper con `min-w-[34rem]` dentro de `overflow-x-auto`: deja pasos fuera de la pantalla sin aviso (B-29).
- Campos y botones `size="lg"`. Los botones van a ancho completo en móvil, con el primario arriba.
- `html { scroll-padding-top }` evita que el header sticky tape el campo enfocado o el `h1`.

## Accesibilidad

- Un `h1` por paso. Al cambiar de paso, el foco va al `h1` y el título de la pestaña cambia ("Paso 2 de 5: Datos de contacto – …").
- Si un envío falla, el foco va al resumen de errores (`role="alert"`, `tabindex="-1"`). Cada enlace del resumen enfoca su campo.
- `UFormField` asocia la etiqueta, la descripción y el error (`aria-describedby`) y marca `aria-invalid`. Por eso **todo** control va dentro de un `UFormField`. Un `<p class="ui-label">` junto a un `UTextarea` no lo nombra (B-23).
- Los grupos de opciones usan `legend` (`URadioGroup`/`UCheckboxGroup`).
- `autocomplete` en datos personales (WCAG 1.3.5): `name`, `email`, `tel-national`.
- `UAlert` no trae `role`: agrega `role="alert"` a los avisos de error que aparecen tras una acción.
- Nada de movimiento en las transiciones entre pasos, o solo con `motion-safe:` y ≤ 200 ms (B-25).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Un `FlowStepForm` y un `IdentityGate` compartidos por todos los flujos. | "Siguiente" en primary `lg` en un flujo y `neutral outline md` en otro; dos gates de identidad con layouts distintos (B-17). |
| Foco al `h1` y scroll arriba al cambiar de paso. | Cambiar solo el índice del paso, dejando el foco en "Siguiente" y la vista a media página (B-M2). |
| Un error en cada pregunta faltante y un resumen con enlaces. | Un único "Faltan N respuestas" al pie, sin marcar cuáles (B-M3). |
| El error del consentimiento bajo la casilla. | "Acepta el consentimiento" y "revisa tus datos" solo como toast (B-M4). |
| `UFormField` alrededor de cada control. | Un textarea nombrado solo por su placeholder, con errores en `<p>` sueltos (B-23). |
| `URadioGroup` y `UCheckboxGroup` con `legend`. | Botones de sí/no y de escala sin `aria-pressed` ni `role="radio"`, con la pregunta en un `<p>` (B-03). |
| Un renderizador de preguntas reutilizado. | La página de encuestas anónimas con una copia del formulario que ya se desfasó (B-02). |
| "Paso 2 de 5" y `UProgress` en móvil. | Un stepper forzado a `min-w-[34rem]` con scroll horizontal (B-29). |
| `FiPageHeader` (`h1` `text-2xl sm:text-3xl text-fi-navy`). | Un `h1` en `text-sm`, otro en `text-xl` y otro en `text-2xl` dentro del mismo flujo, o páginas sin `h1` (B-16). |
| `UAlert` para avisos y `FiIconBadge` para el estado. | Cajas tintadas a mano y nueve tarjetas de resultado distintas (B-07, B-11). |
| `UAlert color="info"` para "mantén tus datos al día" y `FiStepBadge` para numerar. | Una nota informativa en rojo `primary-50` y cuadros rojos numerados (B-08). |
| Utilidades semánticas (`border-default bg-elevated text-muted`). | `border-(--ui-border) bg-(--ui-bg-elevated)` y variantes `dark:` muertas (B-06). |

## Ejemplo de referencia en PSM

En PSM-SI-V2: `app/pages/agendar/solicitud.vue` (solicitud de cinco pasos con
identidad), `app/pages/cuestionarios/index.vue` (gate y lista de pendientes),
`app/pages/cuestionarios/consentimiento.vue` (consentimiento),
`app/pages/cuestionarios/[id].vue` (cuestionario por secciones) y
`app/pages/campanas/[token].vue` (encuesta anónima). Son la referencia del
**contenido** y de los pasos. Los defectos de navegación, foco, errores y
estados son los que citan los hallazgos de arriba.

## Fuentes

- GOV.UK Design System, *Question pages*: una cosa por página, enlace Atrás, "Continuar", "(opcional)" sin asteriscos. https://design-system.service.gov.uk/patterns/question-pages/
- GOV.UK Design System, *Validation*: validar al enviar, conservar las respuestas, "Error:" en el título. https://design-system.service.gov.uk/patterns/validation/
- GOV.UK Design System, *Error summary*: ubicación, foco y enlaces a los campos. https://design-system.service.gov.uk/components/error-summary/
- GOV.UK Design System, *Check answers*: enlaces "Cambiar", declaración y verbo final específico. https://design-system.service.gov.uk/patterns/check-answers/
- GOV.UK Design System, *Confirmation pages*: panel, folio, qué sigue y cómo guardar el comprobante. https://design-system.service.gov.uk/patterns/confirmation-pages/
