# Arquetipo `public-utility` — Utilidad pública de un solo paso (acceso y verificación)

Un formulario corto con **un solo resultado**: iniciar sesión, o comprobar que
un documento emitido es auténtico. Sin contenido de marketing ni pasos. La
página existe para ese único formulario y su respuesta.

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` (componentes `Fi*`
> auto-registrados) y zod 4. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario.

## Propósito y usuario

| Variante | Usuario | Tarea | Éxito |
|---|---|---|---|
| Inicio de sesión | Personal del servicio | Entrar al sistema | Entra a la primera, o entiende por qué no y qué hacer, sin perder lo que escribió. |
| Validar documento | Una institución receptora (a menudo llega escaneando el QR) o la persona titular | Saber si un documento es auténtico | Ve el veredicto (válido, no válido o anulado) arriba, inequívoco y sin desplazarse. |

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Iniciar sesión, recuperar la contraseña, verificar un folio o un código, darse de baja de un aviso. | Envíos de varios pasos o con consentimiento: es [`public-guided-flow`](public-guided-flow.md). |
| Cualquier formulario de 1–3 campos con un solo resultado. | Una verificación de identidad **dentro** de un flujo: es el *identity gate* de [`public-guided-flow`](public-guided-flow.md#identity-gate-verificación-de-identidad). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Chrome | El layout mínimo (`FiHeader :items="[]" :top-bar="false"` con el acceso de crisis, `<main id="main-content">`, `FiFooter`) o el layout público | Sin menú principal ni contenido promocional. |
| 1 | Contenedor | `<div class="mx-auto w-full max-w-md px-4 py-10 sm:py-16">` (acceso) o `max-w-2xl` (verificación) | Un ancho fijo por variante en todo el sitio. |
| 2 | Encabezado | Acceso: el `h1` dentro del slot `#title` de `UAuthForm`. Verificación: `FiPageHeader` | **Siempre un `h1` visible.** `UAuthForm` pinta su `title` en un `<div>`, que no es un encabezado. |
| 3 | Formulario | Acceso: `UAuthForm` dentro de una tarjeta FI. Verificación: `UForm` + `UFormField` + `UInput` + `UButton type="submit"` | Etiqueta arriba, sin placeholder como etiqueta. |
| 4 | Error del formulario | `UAlert role="alert" color="error" variant="subtle"` en el slot `#validation` de `UAuthForm`, o sobre el botón | **En línea**, junto al formulario. Nunca solo un toast. |
| 5 | Resultado (verificación) | `<div role="status" aria-live="polite">` con `UAlert` de veredicto y los datos en `FiSectionCard` + `<dl>` | El veredicto domina; los metadatos van después. |
| 6 | Enlaces de ayuda | Slot `#footer` de `UAuthForm`, o un párrafo bajo el formulario | "¿Olvidaste tu contraseña?" y a quién escribir. |

### Esqueleto: inicio de sesión

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'flow' })
useHead({ title: 'Iniciar sesión – Programa de Salud Mental' })

const route = useRoute()
const authForm = useTemplateRef('authForm')

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Correo institucional',
    autocomplete: 'username',
    'aria-required': true,
    spellcheck: false,
    autocapitalize: 'off',
    // En una página que solo sirve para entrar, el autofoco es aceptable.
    autofocus: true,
    size: 'lg',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Contraseña',
    autocomplete: 'current-password',
    'aria-required': true,
    size: 'lg',
  },
]

const schema = z.object({
  email: z.email('Escribe tu correo con el formato nombre@ingenieria.unam.edu'),
  password: z.string().min(1, 'Escribe tu contraseña'),
})

// Mensaje del formulario: credenciales, sesión vencida o bloqueo temporal.
// Vive junto a los campos, no en un toast.
const notice = ref<{ color: 'error' | 'info', title: string, description?: string } | null>(
  route.query.motivo === 'sesion-vencida'
    ? { color: 'info', title: 'Tu sesión terminó', description: 'Vuelve a entrar para continuar.' }
    : null,
)

async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
  const result = await signIn(event.data) // API del proyecto
  if (result.ok) {
    // Solo rutas internas: evita redirigir a otro dominio.
    const target = typeof route.query.redirect === 'string'
      && route.query.redirect.startsWith('/')
      && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : '/dashboard'
    return navigateTo(target)
  }
  // Se conserva el correo y se borra la contraseña. El mensaje no dice qué
  // campo falló.
  if (authForm.value) authForm.value.state.password = ''
  notice.value = result.lockedUntilLabel
    ? { color: 'error', title: 'Por seguridad, pausamos el acceso', description: `Podrás intentarlo de nuevo a las ${result.lockedUntilLabel}.` }
    : { color: 'error', title: 'El correo o la contraseña no son correctos' }
}
</script>

<template>
  <div class="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
    <!-- FiSectionCard: la tarjeta FI de las tareas públicas. -->
    <FiSectionCard as="div">
      <UAuthForm
        ref="authForm"
        :fields="fields"
        :schema="schema"
        :validate-on="[]"
        :submit="{ label: 'Iniciar sesión', block: true, size: 'lg' }"
        @submit="onSubmit"
      >
        <template #leading>
          <FiIconBadge icon="i-ph-lock-simple" tone="navy" size="lg" />
        </template>
        <template #title>
          <h1 class="text-2xl font-bold tracking-tight text-fi-navy">Acceso del personal</h1>
        </template>
        <template #description>
          Entra con tu correo institucional.
        </template>

        <!-- Va justo antes del botón de enviar. -->
        <template #validation>
          <UAlert
            v-if="notice"
            :role="notice.color === 'error' ? 'alert' : 'status'"
            :color="notice.color"
            variant="subtle"
            :icon="notice.color === 'error' ? 'i-ph-warning-circle' : 'i-ph-info'"
            :title="notice.title"
            :description="notice.description"
          />
        </template>

        <template #footer>
          <ul class="space-y-1 text-sm">
            <li><ULink to="/recuperar-contrasena" class="text-primary underline underline-offset-2">¿Olvidaste tu contraseña?</ULink></li>
            <li class="text-muted">¿Sigues sin poder entrar? Escribe a coordinación.</li>
          </ul>
        </template>
      </UAuthForm>
    </FiSectionCard>
  </div>
</template>
```

### Esqueleto: validar documento (una sola ruta, con folio opcional)

```vue
<!-- pages/validar-documento/[[id]].vue: una ruta sirve para la consulta
     manual y para quien llega por QR (/validar-documento/ABC123). -->
<script setup lang="ts">
import * as z from 'zod'

type Verdict = 'valid' | 'invalid' | 'voided'

const route = useRoute()
const initialId = typeof route.params.id === 'string' ? route.params.id : ''

const state = reactive({ folio: initialId })
const schema = z.object({
  folio: z.string().trim().min(1, 'Escribe el folio que aparece al pie del documento'),
})

// Con folio en la URL (QR), se verifica en el servidor: el veredicto llega
// pintado, sin héroe ni espera.
const { data: result, status, error, execute } = await useAsyncData(
  'document-verdict',
  () => verifyDocument(state.folio), // API del proyecto
  { immediate: !!initialId },
)

const VERDICT = {
  valid: { color: 'success', icon: 'i-ph-seal-check', title: 'Documento válido' },
  invalid: { color: 'error', icon: 'i-ph-x-circle', title: 'No encontramos un documento con ese folio' },
  voided: { color: 'error', icon: 'i-ph-prohibit', title: 'Este documento fue anulado' },
} as const satisfies Record<Verdict, { color: 'success' | 'error', icon: string, title: string }>
</script>

<template>
  <div class="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <FiPageHeader
      title="Verifica un documento"
      description="Escribe el folio que aparece al pie del documento o escanea su código QR."
    />

    <!-- Con veredicto por QR, el formulario pasa a segundo plano. -->
    <FiSectionCard as="div">
      <UForm
        :schema="schema"
        :state="state"
        :validate-on="[]"
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
        @submit="execute()"
      >
        <UFormField name="folio" label="Folio" class="flex-1">
          <UInput
            v-model="state.folio"
            autocomplete="off"
            spellcheck="false"
            autocapitalize="characters"
            aria-required="true"
            size="lg"
            class="w-full"
          />
        </UFormField>
        <UButton type="submit" size="lg" :loading="status === 'pending'" label="Verificar" class="justify-center" />
      </UForm>
    </FiSectionCard>

    <!-- La región existe siempre (aunque vacía) para que aria-live anuncie
         el resultado cuando aparezca. -->
    <div role="status" aria-live="polite" class="space-y-4">
      <USkeleton v-if="status === 'pending'" class="h-24 w-full rounded-2xl" />

      <!-- Un fallo de la consulta NO es "documento no válido". -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        icon="i-ph-warning-circle"
        title="No pudimos verificar el documento en este momento"
        description="Revisa tu conexión e inténtalo de nuevo. Esto no significa que el documento sea falso."
        :actions="[{ label: 'Reintentar', color: 'neutral', variant: 'outline', onClick: () => execute() }]"
      />

      <template v-else-if="result">
        <UAlert
          :color="VERDICT[result.verdict].color"
          variant="subtle"
          :icon="VERDICT[result.verdict].icon"
          :title="VERDICT[result.verdict].title"
          :ui="{ title: 'text-lg font-bold', icon: 'size-7' }"
        />
        <!-- Advertencias no bloqueantes de un documento válido: warning, más chico. -->
        <UAlert
          v-for="caveat in result.caveats"
          :key="caveat"
          color="warning"
          variant="subtle"
          icon="i-ph-info"
          :description="caveat"
        />
        <FiSectionCard v-if="result.verdict !== 'invalid'" title="Datos del documento" :heading-level="2">
          <template #actions>
            <UButton color="neutral" variant="outline" icon="i-ph-printer" label="Imprimir verificación" @click="printPage" />
          </template>
          <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_1fr]">
            <dt class="fi-label">Tipo</dt>
            <dd>{{ result.type }}</dd>
            <dt class="fi-label">Emitido el</dt>
            <dd><time :datetime="result.issuedAt">{{ result.issuedAtLabel }}</time></dd>
          </dl>
        </FiSectionCard>
      </template>
    </div>
  </div>
</template>
```

`printPage` llama a `window.print()`.

## Estados

| Estado | Inicio de sesión | Validar documento |
|---|---|---|
| Inicial | El formulario con el foco en el primer campo. | El formulario. Si hay folio en la URL, el veredicto ya viene resuelto en SSR. |
| Enviando | El botón con `loading` (UAuthForm lo hace solo). Los campos quedan deshabilitados por `loadingAuto`. | El botón con `loading`, más un `USkeleton` con la forma del veredicto. |
| Error de validación | El error en cada campo (`UFormField`). | El error en el campo. |
| Rechazo | `UAlert` de error en `#validation`, con mensaje genérico. Se conserva el correo y se borra la contraseña. | Veredicto `invalid` o `voided` con `color="error"`. |
| Bloqueo temporal | `UAlert` de error con la hora a la que podrá reintentar. | `UAlert` con la hora a la que podrá reintentar. |
| Sesión vencida | `UAlert color="info"` al llegar ("Tu sesión terminó"). Nunca un toast. | — |
| Fallo de red o servidor | `UAlert` de error, "Inténtalo de nuevo". Distinto del rechazo. | `UAlert` de error con "Reintentar" y la aclaración de que **no** es un veredicto. |
| Éxito | Redirección a la ruta de origen (solo interna). Un toast "Cerraste sesión" es aceptable al salir, no al entrar. | Veredicto `valid` (`success`), los datos y "Imprimir verificación". |

## Jerarquía de acciones

1. **Un** botón sólido primary: "Iniciar sesión" (`block`, `size="lg"`) o "Verificar".
2. Recuperar contraseña y pedir ayuda son enlaces (`ULink`), nunca botones que compitan.
3. "Imprimir verificación" es `neutral outline`, dentro de la tarjeta del resultado.
4. Para volver al inicio no hace falta un botón: el logotipo del header ya lleva ahí. Si lo pones, que sea `FiBackButton` y no un `NuxtLink` gris sin subrayado (B-18, B-30).

## Contenido y tono

- El `h1` dice qué es la página: "Acceso del personal", "Verifica un documento".
- Una frase de propósito bajo el título. Nada más.
- Acceso:
  - Mensaje genérico ("El correo o la contraseña no son correctos").
  - Nunca "El usuario no existe".
  - En un bloqueo, di cuándo se puede reintentar.
  - Di dónde pedir ayuda.
- Verificación:
  - Explica dónde está el folio ("al pie, junto al código QR"). Si puedes, agrega una imagen de ejemplo con `alt` que lo describa.
  - El veredicto en palabras claras: "Documento válido", "Este documento fue anulado".
  - "No válido" nunca usa el amarillo de advertencia: las advertencias son para matices no bloqueantes (B-10).
- El contenido sellado o sensible de un documento solo se revela con un segundo dato que da la persona titular. Ese dato nunca va en la URL.

## Responsive

- Contenedor `max-w-md` (acceso) o `max-w-2xl` (verificación), centrado, `px-4`.
- En móvil, el campo y el botón de verificar se apilan (`flex-col sm:flex-row`).
- No pongas un héroe antes del formulario: en el teléfono empuja el campo fuera del primer viewport (inventario, `validar-documento/index.vue`).
- Quien llega por QR ve el veredicto en el primer viewport.

## Accesibilidad

- WCAG 3.3.8 (autenticación accesible):
  - Se puede pegar y usar gestores de contraseñas.
  - No hay CAPTCHA de rompecabezas sin alternativa.
  - Los códigos de un solo uso aceptan pegado (`type: 'otp'` en `UAuthForm`).
- Mostrar u ocultar la contraseña: `UAuthForm` ya trae el botón con `aria-label` y `aria-pressed`. No lo reimplementes.
- `autocomplete="username"` y `"current-password"` (`"new-password"` al crear una). Usa `spellcheck="false"` y `autocapitalize="off"` en el correo. No pongas `maxlength`.
- Los errores se anuncian: el `UAlert` del formulario lleva `role="alert"`, y el resultado de la verificación vive en `role="status" aria-live="polite"`.
- Un solo `h1` visible. El de `UAuthForm` va en `#title`, porque su `title` por prop no es un encabezado.
- Registra los inicios de sesión exitosos y fallidos para auditoría (en el servidor).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| `h1` visible ("Acceso del personal"). | Una página de acceso sin encabezado, solo con un `<p>` de introducción (B-16). |
| El rechazo en un `UAlert` en línea, con `role="alert"`. | Las credenciales rechazadas o la sesión vencida avisadas solo con un toast (inventario, `login.vue`). |
| Veredicto `error` para no válido o anulado, `warning` solo para matices. | No válido y anulado en ámbar de advertencia, iguales a "sin sello" (B-10). |
| `role="status" aria-live="polite"` en la región del resultado. | Resultados que aparecen sin anunciarse (B-10). |
| `UAlert` para el veredicto y `FiIconBadge` para el ícono. | Cajas de resultado hechas a mano con tres rellenos, radios y opacidades distintos (B-07), y un candado en un círculo armado a mano (B-13). |
| Una sola ruta `[[id]].vue`. | Dos páginas con el mismo héroe duplicado (inventario, `validar-documento/[id].vue`). |
| Solo utilidades semánticas. | Variantes `dark:` muertas en el panel del validador (B-06). |
| El fallo de red, distinto del rechazo. | Un error de consulta que se lee como "documento falso". |

## Ejemplo de referencia en PSM

En PSM-SI-V2: `app/pages/login.vue` (acceso) y
`app/pages/validar-documento/index.vue` + `app/pages/validar-documento/[id].vue`
con el componente `PublicValidateIssuedDocumentPanel` (verificación con sello
revelable). Son la referencia del **flujo**. Faltan el `h1`, el error en línea
y el veredicto en `error`, y sobran el héroe duplicado y los `dark:`.

## Fuentes

- GOV.UK Design System, *Password input*: mostrar u ocultar, `autocomplete`, pegado, `spellcheck` y mensaje genérico. https://design-system.service.gov.uk/components/password-input/
- W3C WAI, *What's new in WCAG 2.2*: 3.3.8 autenticación accesible (mínimo). https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Nuxt UI, *AuthForm*: campos, proveedores, esquema y slots. https://ui.nuxt.com/docs/components/auth-form
- OWASP, *Logging Cheat Sheet*: registrar éxitos y fallos de autenticación. https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
