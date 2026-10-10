# Arquetipo `status-and-error` — Estado del servicio y errores

Explica que algo no está disponible y ofrece la mejor acción siguiente. Cubre
lo que pasa a nivel de **página**: 404, 500, sin acceso, servicio en receso,
recepción cerrada y mantenimiento. Nunca deja un callejón sin salida, y el
acceso de crisis sigue en su lugar.

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` (componentes `Fi*`
> auto-registrados). En Vue + Vite, importa los `Fi*` desde `@fi-unam/ui`. Los
> textos literales son ilustrativos: en un proyecto con i18n van al
> diccionario.

## Propósito y usuario

- **Usuario:** cualquiera. Alguien que siguió un enlace roto, una estudiante
  que quiere pedir el servicio cuando está cerrado, una persona del personal
  que abrió una ruta sin permiso.
- **Tarea:** entender qué pasó, sin jerga, y saber qué hacer ahora.
- **Éxito:** sigue adelante con un clic (inicio, volver, alternativa, crisis)
  sin perder el contexto: el chrome público o el shell del panel siguen ahí.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| 404, 403 y 500 de página completa (`app/error.vue`). | Una tabla o lista vacía o con error dentro de una vista que sí cargó. Eso es un estado de **sección**: `UEmpty` o `UAlert` con "Reintentar" en el lugar del contenido. |
| La página "El servicio está en receso". | Errores de campo de un formulario, que van en línea en `UFormField` (ver [public-guided-flow](public-guided-flow.md)). |
| El aviso "La recepción está cerrada" dentro de otra página (portada, inicio de un flujo). | Confirmaciones pasajeras, que van en toast. |
| Un aviso de mantenimiento programado (`UBanner`). | |

### Página o sección

| Alcance | Componente | Regla |
|---|---|---|
| Página completa (la ruta no existe, falló el servidor o no hay acceso) | `app/error.vue` → `NuxtLayout` → `UError as="div"` | El chrome (público o del panel) se conserva. |
| Servicio en pausa (receso) | Una página propia (`/receso`) con el bloque de estado | La fecha y el texto salen de la configuración, no de constantes. |
| Aviso dentro de otra página (recepción cerrada) | `UAlert color="neutral" variant="subtle"` en el lugar del botón de acción | Un solo aviso por página. |
| Aviso para todo el sitio (mantenimiento) | `UBanner` con `id` | Uno a la vez. Al cerrarlo, queda recordado. |
| Sección vacía o con error dentro de una vista | `UEmpty` en lugar del contenido, o `UAlert color="error" variant="subtle"` con "Reintentar" | Nunca "Sin datos" cuando la carga falló. Si el vacío viene de filtros, ofrece "Limpiar filtros" (C-21). |

## Anatomía (de arriba abajo)

### Página de error (`app/error.vue`)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Chrome | `NuxtLayout` con el layout de la zona: `default` (FiHeader con el acceso de crisis + FiFooter) o el del panel | Un 404 dentro de `/dashboard` **no saca** a la persona del shell. |
| 1 | Ícono | `FiIconBadge size="xl"` en el slot `#leading` de `UError` | El tono sale de la tabla de abajo. Nunca rojo para un 404. |
| 2 | Código | Slot `#statusCode` con `<span class="fi-label">Error 404</span>` | Dato secundario, no titular. |
| 3 | Título (`h1`) | `UError` lo pinta como `h1` desde `statusMessage` | Lenguaje claro: "No encontramos esta página". Nunca "404" ni "Oops". |
| 4 | Mensaje | `message` | Qué pasó y qué hacer. En un 500, di si lo que se estaba enviando se guardó. |
| 5 | Acciones | Slot `#links`: `UButton to` (inicio), `FiBackButton` y, en público, "Mapa del sitio" | Enlaces reales: al navegar, Nuxt limpia el error solo. |
| 6 | Detalle técnico | Solo en desarrollo (`import.meta.dev`). En producción, a lo más un id de referencia | Nunca el `error.message` crudo a visitantes (B-M5). |

### Tono por situación

| Situación | `FiIconBadge` | Ícono (Phosphor) | Título |
|---|---|---|---|
| 404 no encontrada | `tone="neutral"` | `i-ph-compass` | "No encontramos esta página" |
| 403 sin acceso | `tone="neutral"` | `i-ph-lock-simple` | "No tienes acceso a esta página" |
| 500 problema del servicio | `tone="warning"` | `i-ph-warning` | "Lo sentimos, hay un problema con el servicio" |
| Receso del servicio | `tone="navy"` | `i-ph-calendar-blank` | "El programa está en receso" |
| Recepción cerrada (en línea) | `UAlert color="neutral"` | `i-ph-calendar-x` | "La recepción de solicitudes está cerrada" |
| Bloqueo temporal | `tone="warning"` | `i-ph-clock` | "Por seguridad, pausamos el acceso" |
| Mantenimiento programado | `UBanner color="info"` | `i-ph-wrench` | "El sábado 10 de 8:00 a 12:00 no podrás enviar solicitudes" |

`neutral` significa *cerrado* o *inactivo* y `warning` significa
*degradado* (el mapa de estados de fi-ui). El rojo de `error` se reserva para
fallos que bloquean una acción concreta y para la crisis. Un 404 no es ni lo
uno ni lo otro.

### Esqueleto: `app/error.vue`

```vue
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const route = useRoute()

// Un 404 dentro del panel conserva el sidebar y la navegación. Si el layout
// del panel depende de datos que pueden fallar, usa también el público.
const inDashboard = computed(() => route.path.startsWith('/dashboard'))
const home = computed(() => (inDashboard.value ? '/dashboard' : '/'))
const code = computed(() => props.error.statusCode ?? 500)

type Copy = { title: string, message: string, icon: string, tone: 'neutral' | 'warning' }
const COPY: Record<number, Copy> = {
  404: {
    title: 'No encontramos esta página',
    message: 'Revisa que la dirección esté bien escrita. Si llegaste desde un enlace, puede que ya no exista.',
    icon: 'i-ph-compass',
    tone: 'neutral',
  },
  403: {
    title: 'No tienes acceso a esta página',
    message: 'Si crees que deberías tenerlo, escribe a coordinación.',
    icon: 'i-ph-lock-simple',
    tone: 'neutral',
  },
}
const FALLBACK: Copy = {
  title: 'Lo sentimos, hay un problema con el servicio',
  message: 'Inténtalo de nuevo en unos minutos. Si estabas enviando algo, no se guardó.',
  icon: 'i-ph-warning',
  tone: 'warning',
}
const copy = computed(() => COPY[code.value] ?? FALLBACK)

// El mensaje técnico nunca llega a visitantes: solo en desarrollo.
const isDev = import.meta.dev

useHead({ title: () => `${copy.value.title} – Programa de Salud Mental` })

// Foco al h1: el lector de pantalla anuncia dónde quedó la persona.
onMounted(() => {
  const heading = document.querySelector<HTMLElement>('main h1')
  if (heading) {
    heading.tabIndex = -1
    heading.focus()
  }
})
</script>

<template>
  <!-- error.vue reemplaza a app.vue: necesita su propio UApp. -->
  <UApp>
    <NuxtLayout :name="inDashboard ? 'dashboard' : 'default'">
      <!-- as="div": el layout ya tiene el <main> (un solo landmark). -->
      <UError
        as="div"
        :error="{ statusCode: code, statusMessage: copy.title, message: copy.message }"
        :clear="false"
        :ui="{
          root: 'min-h-0 px-4 py-16 sm:py-24',
          statusCode: 'text-muted',
          statusMessage: 'text-2xl sm:text-3xl tracking-tight text-fi-navy',
          message: 'text-base text-muted max-w-prose',
        }"
      >
        <template #leading>
          <FiIconBadge :icon="copy.icon" :tone="copy.tone" size="xl" />
        </template>
        <template #statusCode>
          <span class="fi-label">Error {{ code }}</span>
        </template>
        <template #links>
          <div class="flex flex-wrap justify-center gap-3">
            <!-- Enlaces reales, no clearError() en un botón: Nuxt limpia el
                 error al navegar y se pueden abrir en otra pestaña. -->
            <UButton :to="home" label="Ir al inicio" />
            <FiBackButton :fallback="home" />
            <UButton
              v-if="!inDashboard"
              to="/mapa-del-sitio"
              color="neutral"
              variant="link"
              label="Ver mapa del sitio"
            />
          </div>
        </template>
      </UError>

      <!-- Detalle técnico solo en desarrollo. -->
      <pre v-if="isDev && props.error.message" class="mx-auto mb-16 max-w-2xl overflow-x-auto rounded-xl border border-default bg-elevated p-4 text-sm">{{ props.error.message }}</pre>
    </NuxtLayout>
  </UApp>
</template>
```

En Vue + Vite sin Nuxt, el 404 es una ruta comodín
(`{ path: '/:pathMatch(.*)*', component: NotFoundPage }`) que se pinta
**dentro** del layout, y los errores de servidor se muestran con el mismo
bloque desde un `onErrorCaptured` en el componente raíz.

### Esqueleto: página de receso

```vue
<!-- pages/receso.vue -->
<script setup lang="ts">
// Una sola fuente de verdad: la misma configuración que decide si la
// recepción está abierta. Nunca RETURN_DATE ni el correo como constantes de
// la página: se contradicen con la configuración (inventario, descanso.vue).
const intake = useIntakeStatus() // { closedTitle, closedMessage, reopensAt, reopensAtLabel }
const contact = useServiceContact() // { email }
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
    <div class="flex flex-col items-center gap-4 text-center">
      <FiIconBadge icon="i-ph-calendar-blank" tone="navy" size="xl" />
      <h1 class="text-2xl font-bold tracking-tight text-fi-navy sm:text-3xl">
        {{ intake.closedTitle }}
      </h1>
      <p class="text-muted">{{ intake.closedMessage }}</p>
      <!-- La fecha, una sola vez. -->
      <p class="text-lg font-semibold text-highlighted">
        Volvemos el <time :datetime="intake.reopensAt">{{ intake.reopensAtLabel }}</time>
      </p>
    </div>

    <section aria-labelledby="meanwhile" class="mt-10 space-y-4">
      <h2 id="meanwhile" class="text-lg font-semibold text-fi-navy">Mientras tanto</h2>
      <!-- La crisis va primero entre las alternativas. -->
      <UAlert
        color="error"
        variant="subtle"
        icon="i-ph-first-aid-kit"
        title="Si necesitas ayuda ahora, no esperes"
        :actions="[{ label: 'Ver líneas de ayuda', to: '/emergencia', color: 'error', variant: 'outline' }]"
      />
      <ul class="grid gap-4 sm:grid-cols-2">
        <li>
          <FiSectionCard as="article" title="Habla con Nabin" :heading-level="3" class="h-full">
            <p class="text-muted">El asistente sigue disponible. No es para emergencias.</p>
            <UButton to="/nabin" color="neutral" variant="outline" label="Conocer a Nabin" class="mt-3" />
          </FiSectionCard>
        </li>
        <li>
          <FiSectionCard as="article" title="Escríbenos" :heading-level="3" class="h-full">
            <p class="text-muted">Respondemos al volver del receso.</p>
            <UButton :to="`mailto:${contact.email}`" color="neutral" variant="outline" :label="contact.email" class="mt-3" />
          </FiSectionCard>
        </li>
      </ul>
    </section>
  </div>
</template>
```

### Recepción cerrada en línea

El mismo aviso en todas las páginas donde estaría el botón de solicitar
(héroe de la portada, página previa al flujo, inicio del flujo). Va **en
lugar** del botón, nunca junto a un botón deshabilitado.

```vue
<!-- components/IntakeClosedNotice.vue (del proyecto) -->
<script setup lang="ts">
const intake = useIntakeStatus()
</script>

<template>
  <!-- neutral = cerrado en el mapa de estados. No uses warning: sólido no
       pasa AA con texto blanco (B-01) y un trámite cerrado no es una alerta. -->
  <UAlert
    color="neutral"
    variant="subtle"
    icon="i-ph-calendar-x"
    title="La recepción de solicitudes está cerrada"
    :description="`Vuelve a abrir el ${intake.reopensAtLabel}.`"
    :actions="[
      { label: 'Ayuda inmediata', to: '/emergencia', color: 'error', variant: 'subtle', icon: 'i-ph-first-aid-kit' },
      { label: 'Hablar con Nabin', to: '/nabin', color: 'neutral', variant: 'outline' },
    ]"
  />
</template>
```

Dentro del héroe (isla oscura `dark`), el mismo componente toma los tokens
oscuros solo, sin clases extra.

### Mantenimiento programado

```vue
<!-- app.vue o el layout: uno a la vez; el id hace que el cierre se recuerde. -->
<UBanner
  id="mantenimiento-2026-10-10"
  color="info"
  icon="i-ph-wrench"
  title="El sábado 10 de octubre, de 8:00 a 12:00, no podrás enviar solicitudes."
  close
/>
```

## Estados

Este arquetipo **es** un estado. Las reglas son de qué mostrar y cuándo:

| Situación | Regla |
|---|---|
| Mientras se decide si el servicio está abierto | En SSR, resuelve el estado antes de pintar. Si llega del cliente, va un `USkeleton` del tamaño del botón o del aviso. Nunca muestres "abierto" para luego cambiarlo a "cerrado". |
| Error al cargar la configuración del cierre | Muestra el camino abierto y deja que el servidor rechace con un mensaje claro. Nunca bloquees todo el sitio por no saber la fecha. |
| 500 durante un envío | Di explícitamente si se guardó ("no se guardó; vuelve a intentarlo"). |
| Varios avisos a la vez | Uno por página, y un `UBanner` para el sitio. Si el cierre ya está en el héroe, no lo repitas en la banda final ni en el pie (inventario, `agendar/index.vue`: el aviso aparecía tres veces). |

## Jerarquía de acciones

1. **Una** acción principal sólida primary: "Ir al inicio" (o "Ir al inicio del panel").
2. "Volver" es `FiBackButton`, con el historial o un `fallback`.
3. Las alternativas son `neutral outline` (Nabin, correo) o `link` (mapa del sitio).
4. La crisis es `error subtle` con `i-ph-first-aid-kit`, **primero** entre las alternativas cuando el servicio está cerrado, y siempre presente en el chrome.
5. Todo es un enlace real (`to`), nunca `@click="clearError(...)"` en un botón sin `href`.

## Contenido y tono

- 404: "No encontramos esta página". Sugiere revisar la dirección y da salidas. Sin "Oops", sin "404" como titular, sin humor y sin rojo.
- 500: "Lo sentimos, hay un problema con el servicio. Inténtalo más tarde." Di si los datos se guardaron y da un contacto. Aquí sí cabe la disculpa.
- 403: di que no hay acceso y a quién pedirlo. No reveles si el registro existe más allá de lo necesario.
- Receso o cierre: cuándo vuelve (fecha con día de la semana: "lunes 12 de enero de 2027"), qué hacer mientras tanto, y la crisis primero.
- Sin códigos ni jerga en el texto principal. Un id de referencia puede ir como texto secundario.
- Sin "por favor" ni "lo sentimos" en estados rutinarios. La disculpa se reserva para fallos reales.

## Responsive

- Columna centrada `max-w-xl` y el texto en `max-w-prose`. Este es el único arquetipo público donde el bloque va centrado.
- `UError` trae `min-h-[calc(100vh-…)]`: dentro de un layout con header y pie, quítalo (`root: 'min-h-0 …'`) para que el pie no quede lejos.
- Las acciones se envuelven (`flex-wrap`) y caben en 320 px.
- Las alternativas van en `sm:grid-cols-2`, como máximo dos columnas.

## Accesibilidad

- Un solo `h1` (el de `UError`, o el de la página de receso). Al cargar la página de error, el foco va al `h1`.
- Un solo `<main>`: `UError` se pinta como `<main>` por defecto. Dentro de un layout que ya tiene `<main>`, usa `as="div"`.
- `FiIconBadge` sin `label` es decorativo (`aria-hidden`). El significado está en el título.
- El estado nunca va solo por color: título, ícono y texto.
- `UBanner` y los avisos no se cierran solos. Si se cierran, es con un botón con nombre accesible.
- Nada animado: ni brillos ni contadores.

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Copy amable según el código y el detalle técnico solo en desarrollo. | `Error: {{ error.message }}` crudo, en monoespaciado, para visitantes anónimos (B-M5). |
| Varias salidas: inicio, volver, mapa del sitio, más la crisis en el chrome. | Una sola salida ("Ir al inicio") en una página azul marino fuera del layout, sin crisis ni navegación (inventario, `error.vue`). |
| `NuxtLayout` según la zona: un 404 del panel conserva el shell. | Que un 404 dentro de `/dashboard` saque a la persona del panel (inventario, `[...slug].vue`). |
| Enlaces reales en las acciones. | "Regresar al inicio" como botón que llama a `clearError` (B-M5). |
| **Un** aviso de recepción cerrada, `neutral subtle`, con fecha y alternativas. | El cierre mostrado de tres formas: página, `UAlert` sólido `warning` con texto blanco que no pasa AA, y una tarjeta con círculo `warning` (B-11, B-01). |
| La fecha de regreso desde la configuración. | `RETURN_DATE` y `CONTACT_EMAIL` como constantes de la página, que se contradicen con la configuración (inventario, `descanso.vue`). |
| La crisis primero entre las alternativas. | La alternativa de emergencia como tercera tarjeta, al final (inventario, `descanso.vue`). |
| `FiIconBadge` y `.fi-label`. | El código en serif con un brillo `radial-gradient` copiado (B-12) y antetítulos de 11 px hechos a mano (B-15). |
| Utilidades `text-fi-navy` y `text-fi-gold`. | El dorado sobre azul marino elegido a mano en cada archivo (B-19). |

## Ejemplo de referencia en PSM

En PSM-SI-V2: `app/pages/[...slug].vue` (lanza el 404) + `app/error.vue`
(página de error azul marino fuera del layout), `app/pages/descanso.vue`
(receso), y el estado de recepción cerrada en `app/pages/agendar/index.vue` y
`app/pages/agendar/solicitud.vue`. Úsalas por el contenido: textos del
receso, alternativas, configuración de recepción (`reopensAtLabel`). La
estructura de este documento reemplaza a la de esas páginas.

## Fuentes

- GOV.UK Design System, *Page not found pages*: redacción del 404, sin jerga, sin humor, sin texto rojo. https://design-system.service.gov.uk/patterns/page-not-found-pages/
- GOV.UK Design System, *There is a problem with the service pages*: redacción del 500 y el aviso de respuestas guardadas. https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/
- Nielsen Norman Group, *Error-message guidelines*: visibilidad, lenguaje claro, conservar lo escrito, sin humor. https://www.nngroup.com/articles/error-message-guidelines/
- Nuxt UI, *Error*: `UError` en `error.vue`. https://ui.nuxt.com/docs/components/error
- Nuxt UI, *Empty*: props y slots de `UEmpty` para estados de sección. https://ui.nuxt.com/docs/components/empty
