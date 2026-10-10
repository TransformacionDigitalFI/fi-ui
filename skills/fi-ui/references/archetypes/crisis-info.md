# Arquetipo `crisis-info` — Información de crisis y emergencia

La página a la que llega alguien en crisis, o quien la acompaña. La regla es
**cero fricción**: el primer elemento útil de la pantalla es un número al que
se llama con un toque. Este archivo también define el **acceso de crisis
persistente**, que todas las páginas públicas llevan en el chrome.

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` (componentes `Fi*`
> auto-registrados). En Vue + Vite, importa los `Fi*` desde `@fi-unam/ui`. Los
> textos literales son ilustrativos: en un proyecto con i18n van al
> diccionario. **Los números de teléfono de los ejemplos son de México.
> Verifícalos antes de publicar.**

## Propósito y usuario

- **Usuario:** una persona en crisis o alguien que la acompaña. Puede tener
  las manos temblorosas, poca atención, pantalla chica y mala señal.
- **Tarea:** llamar ahora a una línea que funcione y saber qué hacer mientras
  tanto.
- **Éxito:** sin desplazarse en un teléfono de 375 × 667, la persona ve el
  primer número y lo puede marcar con un toque.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| La página `/emergencia` (o `/ayuda-inmediata`) de cualquier servicio público de bienestar. | La portada del servicio, que es [`public-landing`](public-landing.md). La crisis **no** es el héroe de la portada. |
| El acceso de crisis en el chrome y los avisos "esto no es un servicio de emergencia" dentro de otras páginas (ver la sección siguiente). | Formularios, bots o colas. Nunca son la ruta de crisis. |

## Acceso de crisis persistente en el chrome

Es el mismo patrón en todo el sitio, siempre en el mismo lugar (WCAG 3.2.6) y
con el mismo color y tono. El rojo de estado significa *riesgo*, así que la
crisis usa `color="error"`. La intensidad sube con la gravedad: `subtle` para
el acceso permanente, `outline` para las líneas urgentes y `solid` **solo**
para la emergencia de riesgo de vida.

| Lugar | Componente exacto |
|---|---|
| `FiHeader`, slot `#actions` (se ve también en móvil, junto al botón de menú) | `<UButton to="/emergencia" icon="i-ph-first-aid-kit" color="error" variant="subtle" label="Ayuda inmediata" />` |
| Dentro de una página (formulario, canal alterno, contacto, servicio cerrado) | `<UAlert color="error" variant="subtle" icon="i-ph-first-aid-kit" title="…" :actions="[{ label: 'Ver líneas de ayuda', to: '/emergencia', color: 'error', variant: 'outline' }]" />` |
| Texto corrido o pie de un flujo | `<ULink to="/emergencia">¿Necesitas ayuda ahora?</ULink>` |

```vue
<!-- layouts/default.vue (y el layout mínimo de los flujos guiados) -->
<FiHeader :items="nav" title="Programa de Salud Mental">
  <template #actions>
    <!-- El texto se ve siempre, también en móvil: un botón con solo ícono
         no comunica "crisis" a quien llega con prisa. -->
    <UButton
      to="/emergencia"
      icon="i-ph-first-aid-kit"
      color="error"
      variant="subtle"
      label="Ayuda inmediata"
    />
  </template>
</FiHeader>
```

Las reglas del acceso:

- Es un enlace real con ruta absoluta (`to="/emergencia"`). Nunca `@click="navigateTo(…)"` (B-05).
- Nunca va como botón sólido `error` junto a un sólido `primary`: serían dos rojos con significados distintos, lado a lado (B-09).
- No es el héroe ni un tercer botón del héroe, y tampoco vive solo en el pie.
- Si el proyecto lo encapsula (p. ej. `CrisisAccessButton.vue`), el componente vive en el proyecto, con estas props fijas. fi-ui no lo trae.

## Anatomía de la página (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Chrome | `FiHeader` (con el acceso de crisis), `<main id="main-content">`, `FiFooter` | Igual que el resto del sitio. |
| 1 | Encabezado compacto | `FiPageHeader title="Si necesitas ayuda ahora" description="…"` | **Sin héroe decorativo, sin imagen y sin banda azul marino** antes de los números. Una sola frase tranquilizadora. |
| 2 | Emergencia (riesgo de vida) | `<section>` con tarjeta de borde `error` + `FiStatusBadge status="error" label="Emergencia"` dentro del `h2` + viñetas "Llama al 911 si:" + `UButton color="error" variant="solid" size="xl" block` con `tel:` | Es el único tratamiento rojo sólido de la página. |
| 3 | Urgente (hablar hoy) | `<section>` + lista de líneas, **primero las 24 h**. Cada una es un `FiSectionCard as="article" :heading-level="3"` con el número visible grande, `UBadge` "24 h · gratuita" y, en `#footer`, `UButton color="error" variant="outline" size="lg" block` con `tel:` | Máximo 2 columnas (`sm:grid-cols-2`). El número también va como texto seleccionable. |
| 4 | No urgente | `<section>` con el servicio propio: horario, ubicación y botón `neutral outline` a la solicitud | Di claramente que el servicio **no** es de emergencia y en cuánto responde. |
| 5 | Qué pasa cuando llamas | Párrafos cortos | Tranquiliza: llamar no es una molestia, es confidencial, y estos son los límites de la confidencialidad. |
| 6 | Si te preocupa otra persona | Lista ordenada con `FiStepBadge` (primeros auxilios psicológicos) | Puede ir en `UAccordion`. **Los números nunca van dentro de un acordeón.** |
| 7 | Verificación | `<p class="text-sm text-muted">Información verificada el <time datetime="2026-10-08">8 oct 2026</time></p>` y las fuentes | Revisa los números cada semestre. |

### Esqueleto

```vue
<!-- pages/emergencia.vue -->
<script setup lang="ts">
interface CrisisLine {
  name: string
  /** Como se lee y se copia: "800 911 2000". */
  display: string
  /** E.164 para el enlace: funciona igual desde cualquier lada. */
  tel: string
  hours: string
  description: string
}

// Fecha de TU última verificación de cada número contra su fuente oficial
// (p. ej. gob.mx/conasama). Revísalos cada semestre: un número muerto en esta
// página es el peor error posible del sitio.
const VERIFIED_AT = '2026-10-08'
const verifiedAtLabel = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })
  .format(new Date(`${VERIFIED_AT}T12:00:00`))

// Ordenadas por disponibilidad: primero las 24 h.
const urgentLines: CrisisLine[] = [
  {
    name: 'Línea de la Vida',
    display: '800 911 2000',
    tel: '+528009112000',
    hours: '24 h · gratuita',
    description: 'Atención en crisis y orientación en todo el país.',
  },
  {
    name: 'SAPTEL',
    display: '55 5259 8121',
    tel: '+525552598121',
    hours: '24 h · gratuita',
    description: 'Apoyo emocional por teléfono.',
  },
]
</script>

<template>
  <!-- Una columna estrecha. Nada animado: ni FiReveal ni transiciones de
       entrada. Nada pesado: ni mapas, ni video, ni componentes diferidos. -->
  <div class="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
    <FiPageHeader
      title="Si necesitas ayuda ahora"
      description="Llamar no es una molestia. Las líneas son gratuitas y confidenciales."
    />

    <!-- Emergencia: el único rojo sólido de la página. Es la única tarjeta
         con borde de estado del sitio, por eso se arma aquí y no con
         FiSectionCard (su borde es border-default). -->
    <section
      aria-labelledby="tier-emergency"
      class="rounded-2xl border-2 border-error bg-elevated p-5 sm:p-6"
    >
      <h2 id="tier-emergency" class="flex flex-wrap items-center gap-2 text-lg font-semibold text-fi-navy">
        <FiStatusBadge status="error" icon="i-ph-siren" label="Emergencia" />
        <span>Llama al 911 si:</span>
      </h2>
      <ul class="mt-3 list-disc space-y-1 ps-5">
        <li>tu vida o la de otra persona está en riesgo ahora, o</li>
        <li>sientes que no puedes mantenerte a salvo.</li>
      </ul>
      <UButton
        to="tel:911"
        color="error"
        variant="solid"
        size="xl"
        block
        icon="i-ph-phone-call"
        label="Llamar al 911"
        class="mt-5"
      />
    </section>

    <!-- Urgente: hablar hoy con alguien -->
    <section aria-labelledby="tier-urgent">
      <h2 id="tier-urgent" class="text-lg font-semibold text-fi-navy">
        Si necesitas hablar hoy con alguien
      </h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2">
        <li v-for="line in urgentLines" :key="line.tel">
          <FiSectionCard as="article" :title="line.name" :heading-level="3" class="h-full">
            <!-- El número también va como texto: se lee, se copia y se dicta. -->
            <p class="text-2xl font-bold tabular-nums text-fi-navy">{{ line.display }}</p>
            <UBadge
              color="neutral"
              variant="subtle"
              icon="i-ph-clock"
              :label="line.hours"
              class="mt-2"
            />
            <p class="mt-2 text-muted">{{ line.description }}</p>
            <template #footer>
              <UButton
                :to="`tel:${line.tel}`"
                color="error"
                variant="outline"
                size="lg"
                block
                icon="i-ph-phone"
                :label="`Llamar a ${line.name}`"
              />
            </template>
          </FiSectionCard>
        </li>
      </ul>
    </section>

    <!-- No urgente: el servicio propio -->
    <section aria-labelledby="tier-service">
      <h2 id="tier-service" class="text-lg font-semibold text-fi-navy">
        Si no es urgente
      </h2>
      <p class="mt-2">
        El Programa no es un servicio de emergencia. Respondemos solicitudes en
        un máximo de 5 días hábiles, de lunes a viernes de 9:00 a 18:00.
      </p>
      <UButton
        to="/solicitud"
        color="neutral"
        variant="outline"
        label="Solicitar acompañamiento"
        class="mt-4"
      />
    </section>

    <!-- Qué pasa cuando llamas / Si te preocupa otra persona (FiStepBadge)… -->

    <p class="text-sm text-muted">
      Información verificada el
      <time :datetime="VERIFIED_AT">{{ verifiedAtLabel }}</time>.
    </p>
  </div>
</template>
```

```ts
// nuxt.config.ts: la página funciona sin JavaScript y carga al instante
export default defineNuxtConfig({
  routeRules: { '/emergencia': { prerender: true } },
})
```

## Estados

| Estado | Regla |
|---|---|
| Carga | **No hay estado de carga.** Los números van escritos en el código o en la configuración y se prerenderizan. No los traigas de una API en el cliente: si la API falla, la página queda vacía justo cuando más se necesita. |
| Sin JavaScript | Todo funciona: `<a href="tel:…">` no necesita JS. Verifícalo con JS desactivado. |
| "Abierto ahora" (opcional) | Solo para líneas con horario. Calcúlalo en `America/Mexico_City` y muéstralo con `FiStatusBadge status="success" label="Abierto ahora"` o `status="neutral" label="Abre a las 9:00"`. Si no hay certeza, muestra el horario y no el estado. |
| Error | No aplica. La página es estática. Si una parte dinámica (como "abierto ahora") falla, se omite en silencio y los números siguen ahí. |

## Jerarquía de acciones

1. **Emergencia:** un solo `UButton color="error" variant="solid" size="xl" block` ("Llamar al 911"). Es el único rojo sólido.
2. **Urgente:** un `UButton color="error" variant="outline" size="lg" block` por línea, con el verbo y el nombre: "Llamar a Línea de la Vida".
3. **No urgente:** `color="neutral" variant="outline"` hacia la solicitud del servicio.
4. **No hay `primary`** en esta página. El rojo FI es de marca y aquí confundiría con el rojo de riesgo (B-09).
5. Cada acción de llamada es un enlace `tel:` en formato E.164. Ningún número es solo texto sin enlace, y ningún enlace oculta el número.

## Contenido y tono

- **Primero los números.** El encabezado lleva una sola frase. Nada de párrafos de contexto antes de la primera llamada.
- Usa encabezados con acción: "Llama al 911 si:", seguidos de viñetas cortas y concretas. Nombra como máximo dos servicios por encabezado.
- Ordena por gravedad (emergencia → urgente → no urgente) y, dentro de cada nivel, primero lo que está disponible 24 h.
- Muestra horario y costo de cada línea, y la fecha de "Información verificada el …".
- Tranquiliza: hay ayuda, llamar no es hacer perder el tiempo a nadie, es confidencial. Di con honestidad cuáles son los límites de la confidencialidad.
- Sigue las guías de comunicación segura: nada de detalles de métodos, nada de imágenes gráficas. Escribe "murió por suicidio", no "cometió suicidio".
- **Salida rápida ("Salir de esta página"):** solo si las personas usuarias pueden estar vigiladas, como en casos de violencia. Si la pones, explica que **no** borra el historial del navegador.

## Responsive

- Una columna (`max-w-3xl`). Las líneas urgentes van en 1 columna en móvil y como máximo 2 desde `sm`. Nunca 5 columnas: a 1280 px dejaban tarjetas de 220 px con el nombre partido en tres renglones (B-20).
- Los botones de llamada son `block` a ancho completo dentro de su tarjeta y miden al menos 44 px de alto (`size="lg"` o mayor).
- **Barra fija de llamada (recomendada en móvil):** `fixed inset-x-0 bottom-0 sm:hidden` con un solo botón a la línea 24 h principal. Agrega `pb-24 sm:pb-0` al contenedor para que la barra no tape el foco (WCAG 2.4.11). Es la misma acción "urgente" de la lista (`error outline`): el 911 sigue siendo el único rojo sólido.

```vue
<!-- En el script: const primaryLine = urgentLines[0]! (la primera 24 h).
     En la plantilla, al final y fuera del contenedor con pb-24: -->
<div class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-elevated p-3 sm:hidden">
  <UButton
    :to="`tel:${primaryLine.tel}`"
    color="error"
    variant="outline"
    size="lg"
    block
    icon="i-ph-phone"
    :label="`Llamar a ${primaryLine.name} (24 h)`"
  />
</div>
```
- Se imprime limpia: sin mapas, videos ni fondos oscuros que gasten tinta.

## Accesibilidad

- Un `h1` (el de `FiPageHeader`). Cada nivel es una `<section aria-labelledby>` con su `h2`. Lo que va después de una tarjeta lleva su propio encabezado, para que el lector de pantalla no lo asocie a la tarjeta anterior.
- La gravedad nunca va solo por color: el nivel está en el texto del encabezado ("Emergencia"), con ícono y palabra.
- Los números son texto seleccionable y copiable, además del botón.
- **Sin movimiento:** no uses `FiReveal`, contadores ni transiciones de entrada, y no se cierra nada solo. Esta es la única vista donde ni siquiera `motion-safe:` justifica una animación.
- Sin límites de tiempo, sin modales, sin carruseles ni pestañas que escondan números.
- Contraste: los botones `error` sólidos con texto blanco pasan AA con los tokens de fi-ui 0.2, que oscurecen el paso del rojo de estado. No los cambies por `bg-error-500` a mano (B-01).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| Encabezado compacto y el primer número arriba del pliegue. | Un héroe decorativo completo (badge, título de dos tonos, descripción) sin acción, con los números debajo del pliegue en el teléfono (B-20). |
| Primero la línea 24 h. | La línea del servicio, en horario de oficina, primero, y las 24 h después (B-20). |
| `error` sólido solo para el 911 y `error outline` para las líneas urgentes. | Los botones de llamada como `primary outline`: el énfasis secundario para la única acción que importa, y todas las líneas con el mismo peso (B-09, inventario). |
| El mismo acceso de crisis en todas las páginas (`error subtle` + `i-ph-first-aid-kit` + `to="/emergencia"`). | La urgencia pintada de seis formas: `error` sólido, `error` soft, `error-600` a mano, una caja tintada… (B-09). |
| `` <UButton :to="`tel:${line.tel}`"> ``, un enlace real. | Un botón con `@click` o con `window.open` (B-05). |
| La página estática y prerenderizada. | Traer los números de una API o meter un mapa, un video o un componente diferido. |
| Nada animado. | Spinners con `animate-spin` sin guardia de movimiento reducido (B-25). |

## Ejemplo de referencia en PSM

`app/pages/emergencia.vue` en PSM-SI-V2. Hoy tiene `MarketingHero`, después
una rejilla `xl:grid-cols-5` con la línea del PSM primero y botones `tel:` en
`primary outline`. Úsalo por la **lista de líneas** (SOS UNAM, Línea de la
Vida, SAPTEL) y los pasos de primeros auxilios psicológicos, no por la
estructura. El inventario propone un héroe compacto con la línea principal en
un botón sólido a ancho completo, el resto como lista con insignia "24 h", una
barra fija en móvil y los primeros auxilios psicológicos en `UAccordion`.

## Fuentes

- NHS Service Manual, *Care cards*: niveles no urgente, urgente y emergencia, encabezados "Call X if:" y el nivel en texto oculto. https://service-manual.nhs.uk/design-system/components/care-cards
- NHS, *Where to get urgent help for mental health*: estructura de una página de crisis y tono tranquilizador. https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/
- GOV.UK Design System, *Exit this page*: salida rápida, ubicación y advertencias. https://design-system.service.gov.uk/components/exit-this-page/
- SAVE, *Safe Messaging Guidelines*: comunicación segura y cómo presentar los recursos de crisis. https://www.save.org/wp-content/uploads/2026/05/Safe-Messaging-Guidelines-.pdf
- CONASAMA (opera la Línea de la Vida 800 911 2000, 24/7; el 911 es para riesgo inmediato). Verifica antes de publicar. https://www.gob.mx/conasama
