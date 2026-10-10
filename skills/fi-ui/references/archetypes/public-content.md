# Arquetipo `public-content` — Página informativa o de contenido

Explica algo (el programa, un canal, un servicio, cómo llegar, a quién
escribir) y termina con **un solo paso siguiente** claro. No captura datos.
Incluye variantes con forma propia (contacto, ubicaciones, canal alterno,
mapa del sitio) y una variante interna (biblioteca de ayuda del personal).

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` (componentes `Fi*`
> auto-registrados). En Vue + Vite, importa los `Fi*` desde `@fi-unam/ui`. Los
> textos literales son ilustrativos: en un proyecto con i18n van al
> diccionario.

## Propósito y usuario

- **Usuario:** público general, estudiantes, otras instituciones. Llegan desde
  un buscador, desde la portada o desde un enlace compartido.
- **Tarea:** entender algo concreto y saber qué hacer después.
- **Éxito:** la respuesta está en las dos primeras frases bajo el `h1`, y la
  página termina en una acción (solicitar, escribir, llamar, ir a otra
  página), nunca en un callejón sin salida.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| "Acerca de", "Cómo funciona", "Contacto", "Ubicaciones", la página de un canal alterno (bot, línea), preguntas frecuentes, mapa del sitio. | La raíz del sitio, que es [`public-landing`](public-landing.md). |
| La biblioteca de ayuda o tutoriales del personal (variante interna, dentro del shell del dashboard). | Información de crisis, que tiene reglas propias: [`crisis-info`](crisis-info.md). |
| | "El servicio está cerrado", 404 o 500, que van en [`status-and-error`](status-and-error.md). |
| | Cualquier página con formulario: [`public-guided-flow`](public-guided-flow.md) o [`public-utility`](public-utility.md). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Chrome | `FiHeader` (con el [acceso de crisis](crisis-info.md#acceso-de-crisis-persistente-en-el-chrome) en `#actions`), `<main id="main-content">`, `FiFooter` | Igual en todo el sitio. |
| 1 | Héroe compacto | `PublicPageHero` del proyecto (receta abajo): `UPageHero` en isla `dark bg-fi-navy`, alineado a la izquierda | **Un solo tamaño** para todas las páginas de contenido. Nada de `size="large"`, nada de pantalla completa y nada de centrado (el centrado es para [`status-and-error`](status-and-error.md)). El `h1` y 1–2 frases que resumen la respuesta. |
| 2 | Migas (opcional) | `UBreadcrumb` | Solo en páginas a 2 o más niveles de profundidad. |
| 3 | Secciones | `UPageSection` con `FiSectionHeading as="h2" align="start"` en `#header`. Alterna `bg-default` y `bg-muted` (banda tenue) | Una idea por sección. Encabezados descriptivos que empiezan con la palabra clave. |
| 3a | Texto largo | `UPage` + `UPageAside` con `UPageAnchors` ("En esta página") en `lg` + `UPageBody` con `max-w-prose` | Solo si la página pasa de unas 3 pantallas. |
| 3b | Rejillas | `UPageGrid` de `UPageCard` con `FiIconBadge` en `#leading` y el `h3` en `#title` | `UPageCard` ya sale blanca y `rounded-2xl` (fiAppConfig). Tarjetas planas. Nada de `hover:-translate` ni `shadow-md`. |
| 3c | Pasos | `<ol>` de `UPageCard as="li"` con `FiStepBadge` en `#leading` | No pongas "Paso 01" a mano junto al número. |
| 3d | Historia | `UTimeline` | Lo más reciente arriba. |
| 3e | Avisos | `UAlert variant="subtle"`, con el color según el significado (ver la tabla de colores abajo) | Nunca cajas tintadas hechas a mano. |
| 3f | Preguntas frecuentes | `UAccordion` | La información esencial **no** va escondida en un acordeón. |
| 4 | Revisión | `<p class="text-sm text-muted">Última revisión: <time datetime="…">…</time> · Responsable: …</p>` | Obligatoria en páginas con datos que cambian: horarios, teléfonos, requisitos. |
| 5 | Siguiente paso | `FiCtaBand` con **una** acción en `#actions` | Toda página de contenido termina aquí. |

### Héroe compartido (componente del proyecto)

fi-ui no trae héroe: lo arma el proyecto **una vez**, con `UPageHero`, para
que las páginas no copien el `:ui` (la auditoría encontró la banda azul marino
pegada en línea en cuatro páginas, B-12).

```vue
<!-- components/PublicPageHero.vue (del proyecto) -->
<script setup lang="ts">
/**
 * Héroe de las páginas públicas: banda azul marino como isla oscura (`dark`),
 * así que UButton y UBadge dentro se leen bien sin clases a mano. Alineado a
 * la izquierda siempre; `lg` solo para la portada. Con el slot `aside`, el
 * héroe pasa a dos columnas en lg.
 */
const props = withDefaults(defineProps<{
  title: string
  description?: string
  badge?: string
  size?: 'md' | 'lg'
}>(), {
  description: undefined,
  badge: undefined,
  size: 'md',
})

const slots = useSlots()
const orientation = computed(() => (slots.aside ? 'horizontal' : 'vertical'))
</script>

<template>
  <UPageHero
    as="section"
    class="dark bg-fi-navy"
    :orientation="orientation"
    :title="props.title"
    :description="props.description"
    :ui="{
      container: props.size === 'lg' ? 'py-14 sm:py-20 lg:py-24 gap-10' : 'py-10 sm:py-14 gap-8',
      wrapper: 'text-start max-w-3xl',
      headline: 'justify-start',
      title: props.size === 'lg'
        ? 'text-3xl sm:text-4xl lg:text-5xl text-highlighted text-balance'
        : 'text-2xl sm:text-3xl lg:text-4xl text-highlighted text-balance',
      description: 'text-base sm:text-lg text-default text-pretty',
      links: 'justify-start gap-3',
    }"
  >
    <!-- Antetítulo: en la isla, neutral sólido es blanco con texto oscuro. -->
    <template v-if="props.badge" #headline>
      <UBadge color="neutral" variant="solid" :label="props.badge" />
    </template>
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="slots.links" #links>
      <slot name="links" />
    </template>
    <slot name="aside" />
  </UPageHero>
</template>
```

### Esqueleto de una página de contenido

```vue
<!-- pages/acerca-de.vue -->
<script setup lang="ts">
const areas = [
  { icon: 'i-ph-chats-circle', title: 'Acompañamiento', description: 'Sesiones individuales y grupales.' },
  { icon: 'i-ph-chalkboard-teacher', title: 'Formación', description: 'Talleres para estudiantes y docentes.' },
  { icon: 'i-ph-handshake', title: 'Vinculación', description: 'Trabajo con otras instancias de la UNAM.' },
]

// UTimeline: lo más reciente primero.
const milestones = [
  { date: '2026', title: 'Atención en línea', description: 'Sesiones por videollamada.', icon: 'i-ph-video-camera' },
  { date: '2024', title: 'Inicio del programa', description: 'Primer semestre de acompañamiento.', icon: 'i-ph-flag' },
]
</script>

<template>
  <PublicPageHero
    badge="Conócenos"
    title="Qué es el Programa de Salud Mental"
    description="Un servicio gratuito de la Facultad que acompaña a estudiantes con malestar emocional."
  />

  <UPageSection :ui="{ container: 'py-12 sm:py-16' }">
    <template #header>
      <FiSectionHeading as="h2" align="start" title="Qué hacemos" />
    </template>
    <UPageGrid>
      <!-- Su `title` es un <div>: el h3 va en #title para que la tarjeta
           tenga encabezado navegable. -->
      <UPageCard v-for="area in areas" :key="area.title" :description="area.description">
        <template #leading>
          <FiIconBadge :icon="area.icon" tone="navy" size="md" />
        </template>
        <template #title>
          <h3>{{ area.title }}</h3>
        </template>
      </UPageCard>
    </UPageGrid>
  </UPageSection>

  <UPageSection class="bg-muted" :ui="{ container: 'py-12 sm:py-16' }">
    <template #header>
      <FiSectionHeading as="h2" align="start" title="Nuestra historia" />
    </template>
    <UTimeline :items="milestones" />
  </UPageSection>

  <UContainer class="space-y-6 py-12 sm:py-16">
    <FiCtaBand
      title="¿Quieres hablar con alguien?"
      description="Pide acompañamiento. Es gratuito y confidencial."
    >
      <template #actions>
        <UButton to="/solicitud" size="lg" label="Solicitar acompañamiento" />
      </template>
    </FiCtaBand>
    <p class="text-sm text-muted">
      Última revisión: <time datetime="2026-10-08">8 oct 2026</time>
    </p>
  </UContainer>
</template>
```

### Variantes con forma propia

| Variante | Qué cambia | Regla clave |
|---|---|---|
| **Contacto** | Una tarjeta por canal: correo, teléfono, ubicación. Cada una con **su acción**: `UButton :to="'mailto:' + email"`, `:to="'tel:' + tel"`, "Cómo llegar". Con horario y tiempo de respuesta. | Lo primero es el contacto **del servicio**, no el del soporte técnico. Agrega el aviso de crisis (`UAlert` de [crisis-info](crisis-info.md#acceso-de-crisis-persistente-en-el-chrome)). Los datos de contacto salen de **una** fuente (configuración), nunca de literales repetidos (B-22, B-27). |
| **Ubicaciones** | En `lg`, lista y mapa lado a lado (mapa `sticky`). En móvil, la lista primero y el mapa debajo o bajo demanda. Elegir una tarjeta resalta su marcador, y tocar un marcador lleva a su tarjeta. | "Cómo llegar" es `<UButton :to="mapsUrl" target="_blank" external>`, un enlace real (B-05). El antetítulo de cada tarjeta es `.fi-label`. |
| **Canal alterno** (bot, línea) | Héroe con **un** botón de acción, 3 pasos con `FiStepBadge` para empezar, funciones, video con enlace de descarga como respaldo. | `UAlert` "No es para emergencias" junto al primer botón, con enlace a `/emergencia`. El color del botón es `primary` o `neutral`, nunca `info` como "color de la marca del tercero" (B-01). |
| **Mapa del sitio** | Enlaces agrupados por intención: Pedir ayuda, Conocer el programa, Documentos, Acceso del personal. | Solo rutas con `meta.public === true`, con etiqueta traducida. Sin rutas técnicas visibles en monoespaciado (B-04). |
| **Interna** (biblioteca de ayuda del personal) | Va dentro del shell del dashboard: `FiPageHeader` + rejilla o lista buscable agrupada por tarea, con la duración de cada video. | Si está vacía, **oculta la entrada del menú** en lugar de llevar a un estado vacío permanente. Las tarjetas siguen la regla de tarjeta clicable de abajo. |

### Tarjeta clicable (cuando toda la tarjeta lleva a otra página)

Sin acciones secundarias, basta `UPageCard :to`: toda la tarjeta es el enlace,
y dentro no van botones. Con una acción secundaria (descargar, compartir), usa
esta receta:

```vue
<!-- Un solo enlace cubre la tarjeta con ::after. Las acciones secundarias van
     encima con z-10. Nunca un botón dentro de otro botón. -->
<article class="relative rounded-2xl border border-default bg-elevated p-6 transition-colors hover:border-fi-navy">
  <h3 class="text-base font-semibold text-highlighted">
    <ULink
      :to="item.to"
      raw
      class="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
    >
      {{ item.title }}
    </ULink>
  </h3>
  <p class="mt-1 text-muted">{{ item.description }}</p>
  <UButton
    class="relative z-10 mt-4"
    :to="item.pdf"
    target="_blank"
    color="neutral"
    variant="link"
    icon="i-ph-download-simple"
    label="Descargar PDF (abre en otra pestaña)"
  />
</article>
```

## Estados

Casi todo es estático. Los estados aparecen en las partes vivas:

| Parte | Carga | Vacío | Error |
|---|---|---|---|
| Cifra en vivo ("personas acompañadas") | `USkeleton class="h-9 w-20"` con la forma de la cifra | — | Oculta la cifra. **Nunca** muestres `0` mientras carga ni después de un fallo. |
| Mapa (`<ClientOnly>` o un componente `Lazy`) | Esqueleto del alto final del mapa, sin spinner animado | — | Oculta el mapa. La lista de direcciones sigue sirviendo. |
| Video | Póster estático | — | Enlace de descarga visible siempre, no solo al fallar. |
| Lista dinámica (actividades, novedades) | Esqueletos de tarjeta | `UEmpty variant="naked"` en el lugar de la lista, con un siguiente paso ("Mientras tanto, conoce los talleres") | `UAlert color="error" variant="subtle"` con botón "Reintentar". El resto de la página sigue funcionando. |

## Jerarquía de acciones

1. **Una** acción principal por página: la del `FiCtaBand` del cierre. En el héroe puede aparecer la misma, nunca otra que compita.
2. Los canales (correo, teléfono, cómo llegar) son botones `neutral outline` o `soft` dentro de su tarjeta, uno por tarjeta.
3. Los enlaces en texto corrido son `ULink` con un estilo único en el proyecto: `text-primary underline underline-offset-2`. Defínelo una vez (un componente o una clase del proyecto), no por página (B-30). Sobre una banda `bg-muted`, `text-primary` no pasa AA (4.35:1): ahí el enlace es `text-fi-navy underline underline-offset-2`.
4. Las descargas son opcionales, con formato y tamaño en la etiqueta: "Descargar guía (PDF, 1.2 MB)". El HTML es el contenido principal; el PDF es extra.

## Contenido y tono

- **Pirámide invertida:** la respuesta o la acción primero y el detalle después. Un resumen de 1–2 frases bajo el `h1`.
- Lenguaje claro: frases de hasta 20 palabras, párrafos de hasta 3 frases, voz activa, el mismo trato (tú o usted) en todo el sitio, siglas desarrolladas la primera vez.
- Encabezados descriptivos que empiezan con la palabra clave: "Horario de atención", no "Información".
- El texto de un enlace dice a dónde lleva. Nunca "aquí" ni "clic aquí". Marca los enlaces que abren otra pestaña o salen del sitio.
- Vocabulario no clínico si el proyecto tiene esa guía. En PSM: *malestar*, *acompañamiento*, *historial*, *primer contacto*; no *valoración*, *atención psicológica* en titulares, ni *cédulas registradas* en cifras públicas (B-21).
- Si la página toca el suicidio o las autolesiones, sigue las guías de comunicación segura: nada de detalles de métodos, siempre con recursos de ayuda y en clave de esperanza.
- Nada de humor ni de palabras alarmistas sobre salud mental.

### Color de los avisos (mapa único, nunca el rojo FI)

| Significado | `UAlert` |
|---|---|
| Informativo ("mantén tus datos al día") | `color="info" variant="subtle"` o `color="neutral"` |
| Precaución real | `color="warning" variant="subtle"` |
| Ayuda inmediata | `color="error" variant="subtle" icon="i-ph-first-aid-kit"` (el acceso de crisis) |
| Confirmación | `color="success" variant="subtle"` |

`color="primary"` **nunca** pinta un aviso: el rojo FI es de marca y en una
caja se lee como error (B-08).

## Responsive

- El héroe compacto mide como máximo un tercio del viewport en móvil (`py-10`). El contenido empieza en la primera pantalla.
- Rejillas `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. Texto en `max-w-prose` (65–75 caracteres por renglón).
- `UPageAside` con `UPageAnchors` solo desde `lg`. En móvil, la lista "En esta página" va como enlaces al inicio, o no va.
- Ubicaciones: la lista primero en móvil y el mapa de `h-72` debajo, nunca un mapa de pantalla completa antes de la primera dirección.
- El reflujo funciona a 320 px y con el texto al 200 % (WCAG 1.4.4 y 1.4.10).

## Accesibilidad

- Un `h1` (el del héroe), `h2` por sección (`FiSectionHeading as="h2"`) y `h3` en tarjetas, sin saltarse niveles.
- `<html lang="es">`, y `lang="en"` en frases en otro idioma.
- Las tarjetas clicables tienen foco visible (la receta de arriba). No dependas del contorno del navegador ni de un hover que solo cambia el borde (B-24, C-M5).
- Los enlaces que abren otra pestaña lo dicen en el texto o en un `aria-label`.
- Los íconos decorativos de `FiIconBadge` no llevan `label` (quedan `aria-hidden`). Si el ícono es el único portador de significado, pasa `label`.
- El movimiento es opcional y discreto: `FiReveal` respeta `prefers-reduced-motion`. Los contadores animados deben comprobar `matchMedia('(prefers-reduced-motion: reduce)')` (B-25).
- El texto nunca baja de 12 px: usa `.fi-label` (13 px en la escala FI), nunca `text-[11px]` (B-15).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| `FiCtaBand` al cierre, una vez por página. | Copiar el bloque `rounded-3xl bg-(--fi-navy)` + `radial-gradient(var(--fi-gold))` en cuatro páginas, con tres tamaños de `h2` distintos (B-12). |
| Un componente de héroe del proyecto, alineado a la izquierda y de un solo tamaño. | Héroe grande y centrado en una página secundaria, centrado en unas páginas y a la izquierda en otras sin una regla (inventario, `acerca-de.vue`). |
| Tarjetas de contacto accionables (`mailto:`, `tel:`, "Cómo llegar"). | Una página "Contacto" que en realidad es soporte técnico, con un correo de gmail y datos que no son enlaces (B-22). |
| Datos de contacto en una sola configuración. | El correo y el teléfono del servicio escritos a mano en seis lugares (B-27). |
| `<UButton :to="mapsUrl" target="_blank" external>`. | "Abrir en Maps" como botón que llama a `window.open` (B-05). |
| Mapa del sitio con rutas públicas y etiquetas traducidas. | Listar las rutas internas `/dashboard/**` con etiquetas derivadas del path (B-04). |
| `bg-muted` o `bg-secondary-50` para superficies. | `bg-[color-mix(in_srgb,var(--fi-gold)_7%,…)]` arbitrario (B-M6). |
| `UAlert color="info" variant="subtle"` para notas informativas. | Una nota informativa teñida de `primary-50/200/600`, que se lee como error (B-08). |
| `UAlert` para cualquier aviso. | Doce cajas tintadas hechas a mano con radios, rellenos y opacidades distintos (B-07). |
| Tarjetas FI planas (`border-default bg-elevated rounded-2xl`). | 47 tarjetas en línea con dos dialectos de tokens (`bg-elevated` y `bg-(--ui-bg-elevated)`) y radios mezclados (B-14, B-06). |

## Ejemplo de referencia en PSM

En PSM-SI-V2: `app/pages/acerca-de.vue` (contenido general),
`app/pages/contacto.vue` (variante contacto),
`app/pages/ubicaciones.vue` (ubicaciones), `app/pages/nabin.vue` (canal
alterno), `app/pages/agendar/index.vue` (explicación previa a un flujo),
`app/pages/mapa-del-sitio.vue` y `app/pages/dashboard/tutoriales/index.vue`
(variante interna). Úsalas por el contenido. Todas comparten los defectos que
citan los hallazgos de arriba: banda copiada, héroes de varios tamaños y
antetítulos hechos a mano.

## Fuentes

- NHS Service Manual, *How we write*: frases de hasta 20 palabras, párrafos de hasta 3 frases, voz activa. https://service-manual.nhs.uk/content/how-we-write
- NHS Service Manual, *A to Z of NHS health writing*: lenguaje centrado en la persona; evitar "sufre de" y "trastorno". https://service-manual.nhs.uk/content/a-to-z-of-nhs-health-writing
- SAVE, *Safe Messaging Guidelines*: avisos de contenido, sin detalle de métodos, "murió por suicidio". https://www.save.org/wp-content/uploads/2026/05/Safe-Messaging-Guidelines-.pdf
- Orygen, *#chatsafe*: guías para hablar del suicidio en línea con seguridad. https://orygen.org.au/chatsafe/Resources/International-guidelines/US-English-(1)
