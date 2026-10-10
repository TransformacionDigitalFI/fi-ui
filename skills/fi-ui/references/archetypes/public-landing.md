# Arquetipo `public-landing` — Portada pública

La página de inicio de un servicio FI. En segundos dice qué es el servicio y
para quién es, y lleva a la persona a la puerta correcta: **una** acción
principal, una secundaria y el acceso de crisis siempre a la vista, aparte.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario.

## Propósito y usuario

- **Usuario:** público general. En un servicio de bienestar, sobre todo
  estudiantes que quizá llegan con malestar, desde el teléfono y con poco
  tiempo.
- **Tarea:** decidir a dónde ir. Puede ser pedir el servicio, usar un canal
  alterno (bot, correo) o conseguir ayuda inmediata.
- **Éxito:** en el primer viewport del teléfono (375 × 667) se ven qué es el
  servicio, el botón principal y el acceso de crisis.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| La raíz `/` de un sitio público FI. | Una página secundaria que explica algo: es [`public-content`](public-content.md). |
| La página de inicio de un servicio con varias puertas de entrada. | La página de crisis, que no lleva héroe decorativo: es [`crisis-info`](crisis-info.md). |
| | El aviso de que el servicio está cerrado o en receso: es [`status-and-error`](status-and-error.md). |
| | Un formulario: es [`public-guided-flow`](public-guided-flow.md) o [`public-utility`](public-utility.md). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Chrome | `FiHeader` (incluye `FiTopBar`) con el **acceso de crisis** en el slot `#actions`; `<main id="main-content">`; `FiFooter` | El acceso de crisis vive en el chrome de **todas** las páginas públicas, siempre en el mismo lugar (WCAG 3.2.6). Ver [crisis-info](crisis-info.md#acceso-de-crisis-persistente-en-el-chrome). |
| 1 | Héroe | `UPageHero as="section"` con `class="dark bg-fi-navy"` (isla oscura). Si el sitio tiene más páginas con héroe, usa el componente del proyecto `PublicPageHero size="lg"` con el slot `aside` (receta en [public-content](public-content.md#héroe-compartido-componente-del-proyecto)); el snippet de abajo lo muestra expandido. | El `h1` nombra la necesidad ("Acompañamiento psicológico para estudiantes de Ingeniería"), no la sigla del programa. Lleva una frase de apoyo, **un** `UButton` sólido primary y como máximo un secundario `neutral outline`. |
| 2 | Antes de empezar | `UPageSection` + `FiSectionHeading` en `#header` | Qué necesitas, cuánto tarda, que es gratuito y confidencial, y que **no es un servicio de emergencia**, con enlace a `/emergencia`. |
| 3 | Cómo funciona | `UPageSection` + `<ol>` de 3 o 4 `UPageCard as="li"` con `FiStepBadge` en `#leading` | Los pasos van antes de las actividades o novedades: a quien busca ayuda le importa más el proceso. |
| 4 | Servicios | `UPageSection class="bg-muted"` + `UPageGrid` de `UPageCard` con `FiIconBadge` en `#leading` | `UPageCard` ya sale blanca y `rounded-2xl` (fiAppConfig). Nada de clases de tarjeta repetidas (B-14) ni círculos con ícono hechos a mano (B-13). |
| 5 | Actividades / novedades | `UPageSection` | Opcional. Va después del proceso. |
| 6 | Preguntas frecuentes | `UPageSection` + `UAccordion` | En el acordeón va lo secundario, nunca información esencial. |
| 7 | Ubicación | `UPageSection` + mapa diferido (`<LazyMiMapa>` o `<ClientOnly>`) | En `< md` la tarjeta de datos va **debajo** del mapa, que mide unos 280 px. El enlace "Cómo llegar" es un enlace real. |
| 8 | Cierre | `FiCtaBand` | Repite la acción principal. Es la única banda azul marino con brillo dorado de la página. |

### Esqueleto

```vue
<!-- layouts/default.vue: el chrome lo comparten todas las páginas públicas -->
<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <FiHeader :items="nav" title="Programa de Salud Mental">
      <template #actions>
        <!-- Acceso de crisis persistente. Mismo lugar en todas las páginas. -->
        <UButton
          to="/emergencia"
          icon="i-ph-first-aid-kit"
          color="error"
          variant="subtle"
          label="Ayuda inmediata"
        />
      </template>
    </FiHeader>

    <!-- tabindex="-1": el enlace "Saltar al contenido" y los cambios de paso
         mueven el foco aquí. -->
    <main id="main-content" tabindex="-1" class="flex flex-1 flex-col focus:outline-none">
      <slot />
    </main>

    <FiFooter />
  </div>
</template>
```

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
// Una sola fuente de verdad para "¿está abierta la recepción?": la
// configuración del servicio, nunca una constante en la página (ver
// status-and-error.md, "Recepción cerrada en línea").
const intake = useIntakeStatus() // { open: boolean, reopensAtLabel?: string }

const steps = [
  { title: 'Llena la solicitud', description: 'Te toma unos 10 minutos desde el teléfono.' },
  { title: 'Te contactamos', description: 'En un máximo de 5 días hábiles, por correo.' },
  { title: 'Primera sesión', description: 'En persona o en línea, como prefieras.' },
]

const services = [
  { icon: 'i-ph-chats-circle', title: 'Acompañamiento individual', description: 'Sesiones con una persona del equipo.' },
  { icon: 'i-ph-users-three', title: 'Grupos', description: 'Espacios para hablar de temas comunes.' },
  { icon: 'i-ph-chalkboard-teacher', title: 'Talleres', description: 'Herramientas para el día a día.' },
]
</script>

<template>
  <!-- 1. Héroe. La clase `dark` vuelve el bloque una isla oscura: los tokens de
       Nuxt UI toman su valor oscuro solo aquí dentro, así que UButton y UBadge
       se ven bien sin clases a mano. -->
  <UPageHero
    as="section"
    orientation="horizontal"
    class="dark bg-fi-navy"
    :ui="{
      container: 'py-14 sm:py-20 lg:py-24 gap-10',
      title: 'text-3xl sm:text-4xl lg:text-5xl text-highlighted text-balance',
      description: 'text-base sm:text-lg text-default',
      links: 'gap-3',
    }"
  >
    <template #headline>
      <!-- En la isla, neutral sólido es blanco con texto oscuro: un antetítulo
           legible sin hacks. (.fi-tag es azul marino y desaparece sobre azul
           marino.) -->
      <UBadge color="neutral" variant="solid" label="Facultad de Ingeniería · UNAM" />
    </template>

    <template #title>
      Acompañamiento psicológico
      <span class="fi-serif-accent text-fi-gold">para estudiantes</span>
    </template>

    <template #description>
      Gratuito y confidencial. Habla con alguien del equipo sobre lo que te
      está pasando.
    </template>

    <template #links>
      <template v-if="intake.open">
        <!-- w-full en móvil: botones apilados y fáciles de tocar. -->
        <UButton
          to="/solicitud"
          size="xl"
          trailing-icon="i-ph-arrow-right"
          label="Solicitar acompañamiento"
          class="w-full justify-center sm:w-auto"
        />
        <UButton
          to="/nabin"
          size="xl"
          color="neutral"
          variant="outline"
          label="Hablar con Nabin"
          class="w-full justify-center sm:w-auto"
        />
      </template>
      <!-- Cerrado: el bloque de estado ocupa el lugar del botón. Nunca un botón
           deshabilitado. -->
      <IntakeClosedNotice v-else />
    </template>

    <!-- Aside: logotipos o una ilustración neutra, decorativa (alt=""). -->
    <img src="/illustration-hero.svg" alt="" class="hidden lg:block">
  </UPageHero>

  <!-- 2. Antes de empezar -->
  <UPageSection :ui="{ container: 'py-12 sm:py-16' }">
    <template #header>
      <FiSectionHeading as="h2" align="start" title="Antes de empezar" />
    </template>
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- …qué necesitas, tiempo, gratuito, confidencial… -->
    </ul>
    <UAlert
      class="mt-6"
      color="error"
      variant="subtle"
      icon="i-ph-first-aid-kit"
      title="Esta solicitud no es un servicio de emergencia"
      description="Si estás en riesgo o no puedes mantenerte a salvo, busca ayuda ahora."
      :actions="[{ label: 'Ver líneas de ayuda', to: '/emergencia', color: 'error', variant: 'outline' }]"
    />
  </UPageSection>

  <!-- 3. Cómo funciona -->
  <UPageSection id="como-funciona" :ui="{ container: 'py-12 sm:py-16' }">
    <template #header>
      <FiSectionHeading as="h2" align="start" title="¿Cómo pido acompañamiento?" />
    </template>
    <!-- UPageCard: blanca y rounded-2xl por fiAppConfig. Su `title` es un
         <div>: el h3 va en el slot #title para que la tarjeta tenga
         encabezado navegable. -->
    <ol class="grid gap-6 md:grid-cols-3">
      <UPageCard
        v-for="(step, i) in steps"
        :key="step.title"
        as="li"
        :description="step.description"
      >
        <template #leading>
          <FiStepBadge :value="i + 1" />
        </template>
        <template #title>
          <h3>{{ step.title }}</h3>
        </template>
      </UPageCard>
    </ol>
  </UPageSection>

  <!-- 4. Servicios, sobre banda tenue -->
  <UPageSection class="bg-muted" :ui="{ container: 'py-12 sm:py-16' }">
    <template #header>
      <FiSectionHeading as="h2" align="start" title="Qué ofrecemos" />
    </template>
    <UPageGrid>
      <UPageCard
        v-for="service in services"
        :key="service.title"
        :description="service.description"
      >
        <template #leading>
          <FiIconBadge :icon="service.icon" tone="navy" size="md" />
        </template>
        <template #title>
          <h3>{{ service.title }}</h3>
        </template>
      </UPageCard>
    </UPageGrid>
  </UPageSection>

  <!-- 5–7. Actividades, preguntas frecuentes (UAccordion), ubicación… -->

  <!-- 8. Cierre: repite la acción principal -->
  <UContainer class="py-12 sm:py-16">
    <FiCtaBand
      title="¿Quieres hablar con alguien?"
      description="Pide acompañamiento. Te respondemos en un máximo de 5 días hábiles."
    >
      <template #actions>
        <UButton to="/solicitud" size="lg" label="Solicitar acompañamiento" />
      </template>
    </FiCtaBand>
  </UContainer>
</template>
```

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando la configuración (abierto o cerrado) | El héroe se pinta en SSR con el estado ya resuelto. Si llega del cliente, va un `USkeleton` del tamaño del botón en el lugar de las acciones. | Nunca muestres "Solicitar" y luego lo cambies por "Cerrado". Nunca muestres un botón deshabilitado mientras carga. |
| Recepción abierta | El botón principal "Solicitar acompañamiento". | — |
| Recepción cerrada | `IntakeClosedNotice` (receta en [status-and-error](status-and-error.md#recepción-cerrada-en-línea)) en lugar del botón: fecha de reapertura y alternativas, con la crisis primero. | Un solo aviso por página. La auditoría lo encontró repetido tres veces en `/agendar` (inventario). |
| Cifra en vivo (p. ej. "personas acompañadas") | `USkeleton` con el ancho de la cifra hasta que llega el dato. | Nunca `?? 0` mientras carga: afirma "0" en falso (inventario, `acerca-de.vue`). Si la carga falla, oculta la cifra. |
| Mapa | Un esqueleto del alto del mapa mientras carga el componente diferido. | Nada de `animate-spin` sin `motion-safe:` (B-25). |

## Jerarquía de acciones

1. **Principal:** un `UButton` sólido (`color` por defecto `primary`, `size="xl"` en el héroe) con verbo de acción: "Solicitar acompañamiento". Nunca "Empezar aquí" ni "Clic".
2. **Secundaria:** como máximo una, con `color="neutral" variant="outline"`. Dentro de la isla se ve blanca, sin clases a mano.
3. **Crisis:** fuera del héroe. Va en el chrome (`#actions` de `FiHeader`) y en la nota "no es un servicio de emergencia". Nunca es un tercer botón del héroe.
4. **Todo lo demás** son enlaces (`ULink`) o botones `ghost`/`link`.
5. La navegación es siempre `to="/ruta-absoluta"`. Nunca `@click="navigateTo(...)"` ni `window.open` (B-05).

## Contenido y tono

- El `h1` nombra la necesidad que atiende el servicio, no el nombre interno del programa.
- Antes del formulario di qué se necesita (número de cuenta, correo institucional), que es gratuito, cuánto tarda, qué pasa después y en cuánto tiempo responden.
- Tono informado por trauma: seguridad, agencia, privacidad y esperanza. Di explícitamente que es confidencial y voluntario.
- Usa vocabulario no clínico si el proyecto tiene esa guía (en PSM: *acompañamiento*, *malestar*, *primer contacto*; no *valoración*, *terapia* ni *expediente*). Ver B-21.
- Nada de fotos de personas angustiadas. Usa una ilustración neutra o esperanzadora, o nada.
- Los créditos (financiamiento, desarrollo) van al pie o a "Acerca de", nunca pegados a un botón.

## Responsive

- **Móvil primero.** A 375 px, el `h1` (máximo `text-3xl`), la frase y el botón principal caben en el primer viewport bajo el header. No uses `min-h-[calc(100svh-…)]` si empuja el botón fuera.
- Los botones del héroe se apilan a ancho completo en `< sm`: pon `class="w-full justify-center sm:w-auto"` en cada `UButton` de `#links`.
- El aside del héroe (logotipos, ilustración) se oculta en `< lg` o va debajo del texto. Nunca va arriba del botón.
- Las rejillas usan `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. No pases de 4 columnas: las tarjetas angostas parten los textos.
- Mapa: `h-72 md:h-[28rem]`. En `< md` la tarjeta de datos se apila debajo. En `lg` puede ir encimada.
- El reflujo debe funcionar a 320 px (WCAG 1.4.10).

## Accesibilidad

- Un solo `h1`, que es el del héroe. Las secciones usan `h2` (`FiSectionHeading as="h2"`) y las tarjetas `h3`.
- Landmarks: `header` (FiHeader), un único `<main id="main-content" tabindex="-1">` y `footer` (FiFooter). El enlace "Saltar al contenido" (B-M1) lo rinde FiHeader como primer elemento enfocable y apunta a `#main-content`.
- Contraste: el texto de los botones ≥ 4.5:1 y el borde ≥ 3:1. No uses `color="info"` sólido como color de marca de un tercero, como el azul de Telegram (B-01). Para un canal alterno usa `neutral` o `tertiary`.
- El dorado (`text-fi-gold`) va solo en titulares grandes (≥ 24 px) sobre azul marino. Nunca en texto chico.
- Objetivos táctiles de al menos 24 × 24 px (WCAG 2.5.8); en móvil, apunta a 44 px. Las notas al pie de un solo carácter tienen `aria-label="Nota 1"` (B-24).
- Las imágenes decorativas llevan `alt=""`.
- Movimiento: `FiReveal` ya respeta `prefers-reduced-motion`. Los contadores animados y los spinners propios necesitan `motion-safe:` o `matchMedia` (B-25).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Un botón sólido primary en el héroe y un secundario `neutral outline`. | Tres botones `xl` sólidos de tres colores en la misma fila: primary, `info` y `error`. No hay jerarquía, y dos rojos con significados distintos quedan juntos (B-09). |
| `<UButton to="/emergencia">`: un enlace real, con ruta absoluta. | `<UButton @click="navigateTo('emergencia')">`: un botón sin `href`, con ruta relativa, que no se abre en otra pestaña (B-05). |
| El canal alterno en `neutral`/`tertiary`. | `color="info"` sólido como "azul de Telegram": 2.7:1 con texto blanco, no pasa AA (B-01). |
| `FiCtaBand` para la banda azul marino con brillo dorado. | Copiar `rounded-3xl bg-(--fi-navy)` con un `radial-gradient` en línea en cada página (B-12). |
| `FiIconBadge :icon tone size` para el ícono en círculo. | `grid size-12 place-items-center rounded-full bg-(--fi-navy)` hecho a mano: 31 copias con 6 tamaños (B-13). |
| Utilidades `bg-fi-navy`, `text-fi-navy`, `text-fi-gold`. | `bg-(--fi-navy)`/`text-(--fi-gold)` como valores arbitrarios: 129 usos (B-19). |
| `FiSectionHeading eyebrow` o `.fi-label` (≥ 12 px). | Antetítulos `text-[11px] tracking-[0.12em] uppercase` hechos a mano: unas 25 recetas (B-15). |
| Mapa con la tarjeta apilada en móvil. | Una tarjeta `absolute` sobre un mapa de 500 px que lo tapa en el teléfono (B-29). |
| "Cómo funciona" antes de "Actividades". | Las actividades antes del proceso para pedir ayuda (inventario, `index.vue`). |

## Ejemplo de referencia en PSM

`app/pages/index.vue` en PSM-SI-V2. Sirve de referencia **del contenido**, no
del patrón: hoy tiene los tres botones que compiten, el botón de emergencia
hecho con `navigateTo` y el mapa tapado en móvil. El rediseño que propone el
inventario es este: héroe con un solo botón principal y Nabin en `outline`, la
crisis en el chrome, y el orden héroe → pasos → servicios → actividades →
ubicación.

## Fuentes

- GOV.UK Design System, *Start using a service*: contenido de la página de inicio, texto del botón, otras vías, costo y tiempo. https://design-system.service.gov.uk/patterns/start-using-a-service/
- Chayn y UNFPA, *Feminist Design* (principios informados por trauma: seguridad, agencia, privacidad, esperanza). https://www.unfpa.org/sites/default/files/resource-pdf/SummaryforBusiness%20and%20Tech-Feminist%20Design_2022.pdf
- W3C WAI, *What's new in WCAG 2.2*: 2.5.8 tamaño de objetivo y 3.2.6 ayuda consistente. https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
