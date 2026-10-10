# Componentes — catálogo `Fi*` y Nuxt UI con acento FI

Este archivo responde dos preguntas: **qué hace cada componente de fi-ui y
cómo se llama su API**, y **cómo usar los componentes de Nuxt UI 4.9 para que
se vean y se comporten FI** sin reestilizarlos.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los `Fi*` (prefijo `Fi`) y los componentes de Nuxt UI. En
> Vue + Vite importa los `Fi*` desde `@fi-unam/ui`
> (`import { FiPageHeader, FiStat } from '@fi-unam/ui'`) y `useI18n` desde
> `vue-i18n`. Los textos literales son ilustrativos: en un proyecto con i18n
> van al diccionario, igual que los `aria-label`.

Reglas que valen para todos los `Fi*`:

- **Nuxt UI por dentro.** Heredan `fiAppConfig`, los íconos Phosphor y el tema
  especial activo. No les pases clases de color: si un `Fi*` no se ve bien,
  el error está en el paquete, no en tu vista.
- **Sin texto fijo.** Lo visible llega por props o sale del diccionario del
  paquete (`useFiT`: "Regresar", "Aviso de privacidad"…), que sigue al idioma
  activo. Las props de texto aceptan `LocalizedText`: un `string` (ya
  traducido con tu `t()`) o `{ es, en }`.
- **Sin `dark:`.** Los que son oscuros (FiHeader, FiFooter, FiCtaBand) son
  *islas*: llevan la clase `dark` en su raíz y los tokens de Nuxt UI se
  invierten solos dentro. FiDashboardBrand vive dentro de otra isla (el sidebar
  del dashboard).
- **Atributos sueltos** (`class`, `id`, `data-*`) caen en la raíz, salvo que la
  fila del componente diga otra cosa (FiHeader los manda al `UHeader`).

## Índice

| Componente | Para qué | Dónde aparece |
|------------|----------|---------------|
| [`FiHeader`](#fiheader) | Encabezado del sitio público: cinta roja + barra oscura con logo y menú | todo el sitio público |
| [`FiTopBar`](#fitopbar) | Cinta roja del portal (ya incluida en FiHeader) | sitio público |
| [`FiFooter`](#fifooter) | Pie grafito con logo, domicilio, contacto, redes | sitio público |
| [`FiLogo`](#filogo) | Logotipo de la Facultad en sus cuatro variantes | chrome, portadas |
| [`FiThemeRibbon`](#fithemeribbon) | Listón del tema especial activo | ya incluido en FiHeader |
| [`FiSectionHeading`](#fisectionheading) | Encabezado editorial de sección (antetítulo, título navy, filete dorado con rombo) | `public-landing`, `public-content` |
| [`FiStepBadge`](#fistepbadge) | Círculo numerado marino/oro | pasos de "Cómo funciona" |
| [`FiReveal`](#fireveal) | Entrada suave al hacer scroll | sitio público, nunca en crisis |
| [`FiBackButton`](#fibackbutton) | "Regresar" con historial | tareas públicas, encabezados de vista |
| [`FiPageHeader`](#fipageheader) | Encabezado de vista: h1, descripción, insignias, acciones | todas las vistas del dashboard y tareas públicas |
| [`FiSectionCard`](#fisectioncard) | Tarjeta blanca con encabezado de sección | `record-detail`, `settings`, `dashboard-home`… |
| [`FiStat` / `FiStatGrid`](#fistat-y-fistatgrid) | Cifras clave (KPI) | `dashboard-home`, `analytics`, cabeceras de listas |
| [`FiStatusBadge`](#fistatusbadge) | Estado con ícono + texto | tablas, tarjetas, encabezados |
| [`FiIconBadge`](#fiiconbadge) | Ícono en círculo | vacíos, resultados, tarjetas de servicio |
| [`FiCtaBand`](#fictaband) | Banda azul marino de llamado a la acción | cierre de páginas públicas |
| [`FiDashboardBrand`](#fidashboardbrand) | Logo + nombre de la app en el sidebar | shell del dashboard |

Los componentes de Nuxt UI con receta FI están en
[Nuxt UI con acento FI](#nuxt-ui-con-acento-fi), al final.

---

## Chrome y piezas editoriales

### FiHeader

Encabezado de los sitios FI sobre `UHeader`: `FiTopBar` (franja roja que se va
con el scroll) y debajo la barra oscura fija con el logotipo blanco, el nombre
del sitio y el menú en versalitas. Se contrae al bajar; en móvil el menú pasa a
un panel lateral oscuro. Es isla oscura: lo que pongas en `#actions` se lee
bien sin clases.

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `items` | `NavigationMenuItem[]` | `[]` | Menú principal. **`to` siempre absoluto** (`'/ubicaciones'`), nunca `'ubicaciones'` [B-05]. |
| `title` | `LocalizedText` | — | Nombre del sitio, junto al logo tras un filete. Sin él solo va el logo (el enlace se llama "Facultad de Ingeniería"). |
| `to` | `string` | `'/'` | Destino del logo. |
| `topBar` | `boolean` | `true` | `false` quita la cinta roja. |
| `topLinks` | `FiLink[]` | config > portal | Enlaces de la cinta. |
| `social` | `FiSocialLink[]` | config > portal | Redes de la cinta. |
| `skipTo` | `string \| false` | `'#main-content'` | Destino del enlace "Saltar al contenido", que FiHeader rinde primero (WCAG 2.4.1): oculto hasta recibir el foco; al usarlo pasa el foco al destino (le pone `tabindex="-1"` si no lo tiene) sin tocar la URL. Tu layout pone `<main id="main-content">`; `false` lo quita si el layout ya trae el suyo. |
| `brandClass` | `string` | — | Clases del bloque de marca (filete + `title` o slot `brand`). Para ocultarlo en móvil usa `'hidden sm:block'` aquí: ocultar solo el contenido del slot deja el filete solo junto al logotipo FI. |
| `v-model:open` | `boolean` | `false` | Panel móvil. |

| Slot | Para qué |
|------|----------|
| `actions` | Botones a la derecha (acceso de crisis, idioma, iniciar sesión). |
| `logo` | Reemplaza el `FiLogo` inverso. |
| `brand` | Reemplaza el texto de `title`. |
| `menu-footer` | Debajo del menú en el panel móvil. |
| `top-bar-end` | Al final de la cinta roja (selector de idioma). Recibe `{ controlClass }`, la receta de un control de la cinta (ver [FiTopBar](#fitopbar)). |

Los atributos sueltos van al `UHeader`, no a la cinta. El layout pone
`<main id="main-content" tabindex="-1">` (ver
[patterns.md](patterns.md#navegación)).

```vue
<FiHeader :items="nav" title="Programa de Salud Mental">
  <template #actions>
    <UButton to="/emergencia" icon="i-ph-first-aid-kit" color="error" variant="subtle" label="Ayuda inmediata" />
  </template>
</FiHeader>
```

- **Sí:** un solo FiHeader por layout; menú con 4–6 entradas cortas.
- **No:** `UHeader` con colores propios; `items` con rutas relativas [B-05];
  un `<meta name="theme-color">` propio (el paquete ya lo mantiene).

### FiTopBar

Réplica de la cinta roja del portal ingenieria.unam.mx. Casi nunca se usa
sola: FiHeader ya la incluye.

| Prop | Tipo | Default |
|------|------|---------|
| `links` | `FiLink[]` (`{ label, to, target?, children? }`) | `fiUi.topBar.links` > portal |
| `social` | `FiSocialLink[]` (`{ label, icon, to, color?, target? }`) | `fiUi.topBar.social` > portal |

Slot `end` (en FiHeader, `top-bar-end`): controles propios al final de la
cinta, como el cambio de idioma. Recibe `{ controlClass }`, la receta de un
control de la cinta (alto, tipografía, hover y foco con `--fi-topbar-hover`),
para no copiar sus estilos con un hex:

```vue
<script setup lang="ts">
const switchLocalePath = useSwitchLocalePath() // @nuxtjs/i18n
const nav = [{ label: 'Acerca de', to: '/acerca-de' }]
</script>

<template>
  <FiHeader :items="nav">
    <template #top-bar-end="{ controlClass }">
      <NuxtLink :to="switchLocalePath('en')" :class="controlClass" lang="en">English</NuxtLink>
    </template>
  </FiHeader>
</template>
```

Hover y foco de la cinta son `neutral-500` (4.8:1 con texto blanco); el
nombre que despliega cada red al pasar el cursor toma texto oscuro o claro
según su color de marca. Precedencia en todo el chrome: **prop >
configuración `fiUi` > datos del portal**; un arreglo vacío quita esa parte.
Para buscar un enlace del portal compara `to`, nunca la etiqueta (cambia con
el idioma). Íconos de la cinta: Font Awesome 6 y
Bootstrap Icons (los del portal); en el resto de la app, Phosphor.

```ts
// app.config.ts — la forma normal de cambiar la cinta (FiHeader la lee sola)
import { fiTopLinks } from '@fi-unam/ui/data'

export default defineAppConfig({
  fiUi: {
    topBar: {
      links: [{ label: { es: 'Salud UNAM', en: 'UNAM Health' }, to: 'https://salud.unam.mx/', target: '_blank' }, ...fiTopLinks],
    },
  },
})
```

Desde `app.config.ts` importa de `@fi-unam/ui/data`, no de la raíz del
paquete (arrastraría componentes) [M-02].

### FiFooter

Pie grafito sobre `UFooter`: logotipo y aviso de privacidad, domicilio,
contacto; fila de enlaces y redes; franja de derechos. Isla oscura.

| Prop | Tipo | Default |
|------|------|---------|
| `contact` | `FiContact` (`{ institution, entity, address: LocalizedText[], phone, email }`) | `fiUi.footer.contact` > portal (el contacto general de la FI: una dependencia pone el suyo) |
| `social` | `FiSocialLink[]` | `fiUi.footer.social` > portal |
| `links` | `FiLink[]` | `fiUi.footer.links` > `[]` |
| `privacyUrl` | `string \| false` | `fiUi.footer.privacyUrl` > portal; `false` lo oculta |
| `legalNotice` | `LocalizedText \| false` | `fiUi.footer.legalNotice` > portal; `false` lo oculta |

Slot por defecto: contenido propio del sitio, a todo lo ancho debajo de las
tres columnas. `privacyUrl` abre en otra pestaña solo si es externa (una ruta
propia como `/privacidad` abre en la misma). El teléfono de `contact` se
marca tal cual si empieza con `+`; si no, con `+52` delante.

```vue
<FiFooter :links="[{ label: 'Accesibilidad', to: '/accesibilidad' }, { label: 'Contacto', to: '/contacto' }]" />
```

- **Sí:** contacto real del servicio en `fiUi.footer.contact`, una sola vez.
- **No:** datos de contacto copiados en varias páginas [B-27]; íconos de redes
  de otro set [B-26].

### FiLogo

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `variant` | `'wordmark' \| 'inverse' \| 'footer' \| 'escudo'` | `'wordmark'` | `wordmark` sobre claro; `inverse` sobre oscuro o color; `footer` el del pie (no lo escales arriba de 67 px); `escudo` a color. |
| `height` | `string` (longitud CSS) | `'3rem'` | La altura va por prop, **no** por clase `h-*` (competiría con la del componente). |
| `alt` | `LocalizedText` | "Facultad de Ingeniería" en el idioma activo | Pasa `alt=""` solo si el nombre ya está escrito al lado. |

```vue
<FiLogo variant="inverse" height="2.5rem" />
```

### FiThemeRibbon

Listón del tema especial activo (luto, 8M…). No pinta nada en el tema base, así
que puede quedarse fijo. Su nombre accesible es la descripción del tema.

| Prop | Tipo | Default |
|------|------|---------|
| `height` | `string` (longitud CSS; el ancho sigue la proporción 3:4) | `'2rem'` |

Ya está dentro de FiHeader; úsalo suelto solo en un chrome propio:

```vue
<FiThemeRibbon height="1.75rem" />
```

### FiSectionHeading

Encabezado de sección **editorial** del sitio público: etiqueta-flecha
(`.fi-tag`) como antetítulo, título navy grande, filete dorado con rombo y
descripción. No es para el dashboard: ahí usa `FiPageHeader` o
`FiSectionCard`.

| Prop | Tipo | Default |
|------|------|---------|
| `title` | `LocalizedText` (requerido) | — |
| `eyebrow` | `LocalizedText` | — (máximo un `.fi-tag` por sección) |
| `description` | `LocalizedText` | — |
| `align` | `'center' \| 'start'` | `'center'` |
| `as` | `'h1' \| 'h2' \| 'h3'` | `'h2'` |

Slots: `title`, `description`.

```vue
<UPageSection>
  <template #header>
    <FiSectionHeading eyebrow="Antes de empezar" title="Qué necesitas" description="Tu número de cuenta y 10 minutos." />
  </template>
  <!-- contenido -->
</UPageSection>
```

- **Sí:** `as="h1" align="start"` como encabezado compacto de una página de
  tarea pública si no hay héroe [B-16].
- **No:** copiar a mano el filete o el `.fi-tag` + `h2` [A-08]; dos `.fi-tag`
  en la misma sección [E-15].

### FiStepBadge

Círculo numerado de las infografías FI. Alterna solo: impar marino, par oro.

| Prop | Tipo | Default |
|------|------|---------|
| `value` | `number \| string` (requerido) | — |
| `tone` | `'navy' \| 'gold' \| 'auto'` | `'auto'` |

Dentro de un `<ol>` el número ya lo da la lista: márcalo `aria-hidden="true"`.

```vue
<ol class="grid gap-6 sm:grid-cols-3">
  <li v-for="(step, i) in steps" :key="step.title" class="flex gap-4">
    <FiStepBadge :value="i + 1" aria-hidden="true" />
    <div>
      <h3 class="text-base font-semibold text-highlighted">{{ step.title }}</h3>
      <p class="text-sm text-muted">{{ step.description }}</p>
    </div>
  </li>
</ol>
```

### FiReveal

Entrada suave al hacer scroll (opacidad + 10 px, 300 ms, una sola vez). Nunca
deja contenido invisible: lo que ya está en pantalla al montar no se anima,
respeta `prefers-reduced-motion` y tiene temporizador de respaldo.

| Prop | Tipo | Default |
|------|------|---------|
| `as` | `string` | `'div'` |
| `delay` | `number` (ms) | `0` |

- **Sí:** bloques de una portada pública, debajo del primer viewport.
- **No:** en `crisis-info` ni en contenido de crisis [D11]; en el dashboard; en
  cada tarjeta de una lista larga con retrasos escalonados.

### FiBackButton

"Regresar" de los sitios FI. Si se llegó navegando dentro del sitio, vuelve a
la página anterior (`history.back()`); si se llegó por enlace externo o carga
directa, va a `fallback`. Es un enlace real (`ULink`), así que abrir en otra
pestaña funciona.

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `fallback` | `string` | `'/'` | **Ruta absoluta** del padre lógico (`'/solicitudes'`). |
| `label` | `LocalizedText` | "Regresar" (diccionario) | Más específico si ayuda: "Volver a solicitudes". |
| `iconOnly` | `boolean` | `false` | Solo la flecha; `label` pasa a `aria-label`. Para encabezados compactos. |
| `icon` | `string` | `'i-ph-arrow-left'` | Va por prop (no por `ui.icons`) para no depender de Nuxt. |

Ctrl/Cmd-clic y clic central siguen el enlace como cualquier otro (pestaña
nueva). `iconOnly` da un blanco de 36 px con `aria-label` y `title`.

```vue
<FiBackButton fallback="/solicitudes" label="Volver a solicitudes" />
```

- **Sí:** el único "regresar" de la app; dentro de `FiPageHeader` usa su prop
  `back` en lugar de ponerlo a mano.
- **No:** `UButton icon="i-ph-arrow-left"` sin `aria-label` [D-08]; siete
  tratamientos distintos de "volver" [B-18]; `navigateTo('..')` en un
  `@click`.

---

## Primitivas de vista (fi-ui 0.2)

### FiPageHeader

Encabezado de **vista**: el único `<h1>` de la página, su descripción, insignias
junto al título y las acciones de nivel página. Se usa en todas las vistas del
dashboard y en las tareas públicas sin héroe.

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `title` | `LocalizedText` (requerido) | — | Sustantivo plural en listas ("Solicitudes"), nombre del objeto en detalles. |
| `description` | `LocalizedText` | — | Una frase: qué hay aquí o qué se hace. |
| `eyebrow` | `LocalizedText` | — | Renderiza `.fi-tag`. Opcional y escaso: nombre del área o del flujo. |
| `descriptionLoading` | `boolean` | `false` | Skeleton de una línea mientras la descripción depende de datos. |
| `rule` | `boolean` | `true` | Filete dorado corto bajo el título. |
| `as` | `'h1' \| 'h2'` | `'h1'` | `h2` solo si la vista ya tiene otro h1 (raro). |
| `back` | `string \| false` | — | Ruta del padre lógico: muestra `FiBackButton` compacto (`iconOnly`, `aria-label` "Regresar"). Sin ella (o `false`), no hay botón. |

Raíz: un `<div>` (no `<header>`, que fuera de `<main>` se volvería el landmark
del sitio). Título: `text-2xl sm:text-3xl font-bold tracking-tight
text-fi-navy`.

| Slot | Para qué |
|------|----------|
| `leading` | Avatar o `FiIconBadge` antes del título. |
| `badges` | `FiStatusBadge`/`UBadge` junto al título (estado del registro). |
| `description` | Descripción con marcado (enlaces, cifras). |
| `actions` | Acciones de la vista. A la derecha en `≥ sm`, debajo del título en móvil. |

Regla de `actions`: **un solo `UButton` sólido primary**; el resto `neutral`
`outline`/`ghost`, y a partir de la tercera acción un `UDropdownMenu` "Más
acciones" [D-23, E-17].

```vue
<FiPageHeader
  title="Ana Pérez López"
  description="Historial abierto el 14 oct 2026 · Asesora: Laura Méndez"
  back="/historiales"
>
  <template #badges>
    <FiStatusBadge status="success" label="Vigente" />
  </template>
  <template #actions>
    <UDropdownMenu :items="moreActions" :content="{ align: 'end' }">
      <UButton label="Más acciones" icon="i-ph-dots-three" color="neutral" variant="outline" />
    </UDropdownMenu>
    <UButton label="Registrar sesión" icon="i-ph-plus" color="primary" variant="solid" :to="`/historiales/${id}/sesion`" />
  </template>
</FiPageHeader>
```

- **Sí:** FiPageHeader como primer bloque del `#body` del `UDashboardPanel`.
- **No:** el título de la vista dentro de `UDashboardNavbar` además del
  FiPageHeader (dos `<h1>`) [C-M1]; cuatro encabezados hechos a mano en la
  misma área [C-13, E-11, D-29]; siete botones `xs soft` sin jerarquía [D-23].

### FiSectionCard

Tarjeta de sección: superficie blanca (`bg-elevated border border-default
rounded-2xl`) con encabezado (ícono, título, descripción, acciones) y pie
opcional. Es **la** tarjeta FI del dashboard y de las tareas públicas.

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `title` | `LocalizedText` | — | Si falta, no hay encabezado (salvo slot `header`). |
| `description` | `LocalizedText` | — | |
| `icon` | `string` | — | Phosphor (`i-ph-*`), decorativo. |
| `as` | `'section' \| 'article' \| 'div'` | `'section'` | `article` para tarjetas autocontenidas en una lista. |
| `headingLevel` | `2 \| 3` | `2` | Respeta el orden: h1 (vista) > h2 (sección) > h3 (subsección). |
| `padded` | `boolean` | `true` | `false` para meter una tabla o una lista a sangre. |
| `divided` | `boolean` | `false` | Borde bajo el encabezado. |

El encabezado se rinde si hay `title`, slot `header` o slot `actions`; el
ícono va en un `FiIconBadge` `sm` `neutral`. La raíz es columna flexible y el
cuerpo crece: con `class="h-full"` en una rejilla, los pies quedan alineados
abajo. `class` y demás atributos van a la raíz.

| Slot | Para qué |
|------|----------|
| `header` | Reemplaza el encabezado completo. |
| `actions` | Acciones de la sección, a la derecha del título. Acciones de **sección**, no de página. |
| default | Contenido. |
| `footer` | Pie (totales, "Ver todo", paginación). |

```vue
<FiSectionCard title="Contactos de emergencia" icon="i-ph-phone" divided>
  <template #actions>
    <UButton label="Agregar contacto" icon="i-ph-plus" color="neutral" variant="outline" size="sm" @click="openCreate" />
  </template>
  <ul class="divide-y divide-default">
    <!-- … -->
  </ul>
</FiSectionCard>
```

Tabla dentro de tarjeta: `UTable` ya es una tarjeta. Si necesita título y
acciones encima, usa `FiSectionCard :padded="false"` y quita el borde de la
tabla con el **único** override de superficie permitido:
`<UTable :ui="{ root: 'rounded-none border-0' }" … />` [C-15]. Sin eso queda
una tarjeta dentro de otra.

- **No:** 47 copias de `rounded-2xl border border-default bg-elevated` a mano
  [B-14]; `rounded-xl` en una tarjeta hermana de otras `rounded-2xl` [D-28];
  encabezados de sección hechos de tres formas [D-16]; `<p>` como título de
  tarjeta [D-32].

### FiStat y FiStatGrid

Cifra clave: rótulo, valor grande en navy con `tabular-nums`, ícono en círculo
azul marino y una pista opcional. `FiStatGrid` las acomoda en una lista
semántica.

`FiStat`:

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `label` | `LocalizedText` (requerido) | — | Qué se cuenta, sin abreviar ("Solicitudes sin asignar"). |
| `value` | `string \| number` (requerido) | — | **Pásalo ya formateado** con `Intl` (ver [data-viz.md](data-viz.md#formato-de-números)). |
| `icon` | `string` | — | Phosphor. Círculo azul marino por defecto. |
| `hint` | `LocalizedText` | — | Contexto en texto: "+12 % vs. septiembre", "de 87 en total". |
| `tone` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | **Solo cuando la cifra ES un estado** ("Vencidas: 3" → `warning`). Nunca para decorar. |
| `to` | `string` | — | Hace la tarjeta enlace (drill-down) con foco visible. |
| `loading` | `boolean` | `false` | Skeleton del mismo tamaño: nada salta cuando llegan los datos. |

`FiStatGrid`:

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `stats` | `FiStatItem[]` | — | Atajo; `FiStatItem` tiene las mismas claves que las props de `FiStat`. |
| `columns` | `2 \| 3 \| 4 \| 5` | con `stats`, tantas como cifras (de 2 a 5); con el slot, 4 | Máximo en escritorio; en móvil, una. 4 → `sm:2 lg:4`; 5 → `sm:2 lg:3 xl:5`. |
| `loading` | `boolean` | `false` | Pone en carga las cifras del atajo `stats` que no traen su propio `loading`. |

Slot por defecto: `FiStat` a mano (cuando cada uno necesita algo distinto).
`FiStat` tiene además el slot `hint`, para una pista con marcado, y el slot
`help`, para el botón de ayuda de la métrica ("¿qué mide?", con
`aria-label`): se rinde junto al rótulo pero **fuera** del enlace estirado y
encima de él, así que en una tarjeta con `to` se pulsa sin navegar y no queda
un control dentro de otro. No lo pongas en `hint`.

Marcado: `FiStatGrid` es un `<dl>` y cada `FiStat` un par `<dt>` (rótulo) /
`<dd>` (valor, puesto arriba con `order-first`); suelto, `FiStat` es su
propio `<dl>`. Un lector de pantalla oye "Sin asignar, 12". Con `to`, el
rótulo es un enlace estirado sobre la tarjeta (foco en su contorno, flecha
de pista); con `loading`, el rótulo se queda y el valor es un bloque del
mismo alto con "Cargando…" para lectores de pantalla.

```vue
<script setup lang="ts">
import type { FiStatItem } from '@fi-unam/ui'

const int = new Intl.NumberFormat('es-MX')
const stats = computed<FiStatItem[]>(() => [
  { label: 'Sin asignar', value: int.format(summary.value?.unassigned ?? 0), icon: 'i-ph-tray', to: '/solicitudes?vista=sin-asignar', loading: pending.value },
  { label: 'En espera más de 7 días', value: int.format(summary.value?.overdue ?? 0), icon: 'i-ph-clock', tone: 'warning', loading: pending.value },
  { label: 'Atendidas este mes', value: int.format(summary.value?.closedThisMonth ?? 0), icon: 'i-ph-check-circle', hint: '+12 % vs. septiembre', loading: pending.value },
])
</script>

<template>
  <FiStatGrid :stats="stats" :columns="3" />
</template>
```

- **Sí:** el mismo `loading` en todas las cifras que vienen de la misma
  petición; la comparación en `hint` como texto.
- **No:** API de color por string que cambia el look por llamador [C-14];
  cifras de 4xl en tinta sin `tabular-nums` junto a otras navy de 2xl [E-16,
  D-18]; un botón de ayuda (popover) dentro de un `FiStat` con `to` (botón
  dentro de enlace) [E-10]; el color como única pista de "va bien/mal".

### FiStatusBadge

Insignia de **estado**: ícono + texto + color, con el mapa semántico único de
fi-ui. Nunca solo color.

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `status` | `'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` (tipo `FiStatus`) | — | Sale de tu mapa dominio → estado. |
| `label` | `LocalizedText` (requerido) | — | El nombre del estado en el idioma activo. |
| `icon` | `string` | por estado | `i-ph-check-circle`, `i-ph-clock`, `i-ph-x-circle`, `i-ph-info`, `i-ph-minus-circle`. |
| `variant` | `'subtle' \| 'soft' \| 'outline'` | `'subtle'` | Deja `subtle` salvo razón. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Los de `UBadge`. |

Rinde un `UBadge` con `color` = el estado y un `data-status` con su valor.

Mapa semántico (D3):

| `status` | Significa | Ejemplos |
|----------|-----------|----------|
| `success` | completado, vigente, abierto, aceptado, publicado | Atendida, Vigente, Publicado, Inscripción abierta |
| `warning` | pendiente, por vencer, plazo vencido que pide acción, requiere atención | Pendiente, Por vencer, En espera > 7 días |
| `error` | fallo, bloqueado, rechazado, riesgo | Rechazada, Bloqueado, Falló el envío |
| `info` | informativo, en curso, programado | En curso, Programada |
| `neutral` | borrador, inactivo, cerrado, archivado, cancelado, vigencia terminada | Borrador, Cerrada, Cancelada, No asistió, Vencida (convocatoria) |

Casos frontera ("vencido" tiene dos sentidos, varios neutrales en una vista):
[foundations.md](foundations.md#mapa-de-estados-único-para-todo-el-proyecto).

Cada proyecto declara **una** tabla por dominio y la usa en todas las vistas
(lista, detalle, calendario, línea del tiempo):

```ts
// app/utils/presenters/request-status.ts (la misma de foundations.md)
import type { FiStatus } from '@fi-unam/ui'

export type RequestStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELED'

export const REQUEST_STATUS_TONE: Record<RequestStatus, FiStatus> = {
  PENDING: 'warning',
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELED: 'neutral',
}
```

```vue
<FiStatusBadge :status="REQUEST_STATUS_TONE[row.status]" :label="t(`requests.status.${row.status}`)" />
```

- **Sí:** cancelado o "no asistió" en `neutral` (es un resultado normal, no
  un error) [D-M5]; "en curso" en `info`, nunca `primary` [D-M4].
- **No:** el mismo valor en `warning` al elegirlo y `error` al mostrarlo
  [D-M4]; tipos o categorías con colores de estado ("Estadístico" en rojo,
  "Primer contacto" en verde) [E-04, C-19]; `UBadge @click` como filtro [D-05].

### FiIconBadge

Ícono dentro de un círculo. Reemplaza las ~31 copias a mano de "`div` redondo
+ `UIcon`" [B-13].

| Prop | Tipo | Default | Nota |
|------|------|---------|------|
| `icon` | `string` (requerido) | — | Phosphor. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 32 / 40 / 48 / 56 px. |
| `tone` | `'navy' \| 'gold' \| 'primary' \| 'neutral' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'navy'` | Los de estado solo si el ícono comunica ese estado (resultado de una operación). |
| `label` | `LocalizedText` | — | Sin `label` es decorativo (`aria-hidden`). Con `label`, el círculo tiene nombre (`role="img"`). |

Tonos: `navy` azul marino con ícono blanco; `gold` `secondary-500` con ícono
blanco (el oro decorativo no aguanta blanco encima); `primary` el rojo FI
exacto; `neutral` `bg-accented` con ícono azul marino (encabezados de
tarjeta); los de estado, tinte del estado al 10 % con el ícono en su token de
texto.

```vue
<FiIconBadge icon="i-ph-calendar-check" size="lg" />
<FiIconBadge icon="i-ph-check-circle" tone="success" label="Solicitud enviada" size="xl" />
```

- **No:** `bg-error-100` con ícono `error-500` (no llega a 3:1) [D-M2]; seis
  tamaños distintos para lo mismo [B-13].

### FiCtaBand

Banda azul marino con brillo dorado para el llamado a la acción de cierre de
una página pública. Es isla oscura: los `UButton` dentro se ven bien sin
clases.

| Prop | Tipo | Nota |
|------|------|------|
| `title` | `LocalizedText` (requerido) | Lo que la persona gana, no el nombre del programa. |
| `description` | `LocalizedText` | Una o dos frases. |
| `eyebrow` | `LocalizedText` | Antetítulo pequeño en versalitas doradas (`text-secondary-300`, 6:1 sobre el azul marino; no `.fi-tag`, que es azul marino). |
| `icon` | `string` | Ícono dorado (`text-fi-gold`) sobre el título, decorativo. |
| `headingLevel` | `2 \| 3` | Nivel del título dentro del orden de la página. Por defecto `2`. |

Slots: `actions` (los botones, centrados), default (contenido extra bajo la
descripción). Raíz: `<section class="dark … rounded-3xl bg-fi-navy">`. El
brillo es estático: nada se anima.

```vue
<FiCtaBand
  title="¿Quieres hablar con alguien?"
  description="El acompañamiento es gratuito y confidencial para estudiantes de la Facultad."
>
  <template #actions>
    <UButton to="/agendar" label="Solicitar acompañamiento" color="primary" variant="solid" size="lg" />
    <UButton to="/preguntas" label="Preguntas frecuentes" color="neutral" variant="outline" size="lg" />
  </template>
</FiCtaBand>
```

- **Sí:** una por página, al final.
- **No:** el gradiente copiado en cada página [B-12]; botones con
  `bg-transparent text-white ring-white/40` a mano [B-18]; en contenido de
  crisis.

### FiDashboardBrand

Marca para el `#header` del `UDashboardSidebar`: `FiLogo` inverso y, debajo, el
nombre del sistema en versalitas doradas; todo es un enlace al inicio del
dashboard. Con `collapsed` queda el escudo y el nombre pasa a texto solo para
lectores de pantalla (el enlace conserva su nombre accesible).

| Prop | Tipo | Default |
|------|------|---------|
| `name` | `LocalizedText` | — (nombre del sistema) |
| `to` | `string` | `'/'` (usa la ruta de inicio del dashboard) |
| `collapsed` | `boolean` | `false` |

| Slot | Para qué |
|------|----------|
| `logo` | Reemplaza el logotipo expandido. |
| `mark` | Reemplaza el escudo contraído (decorativo: `alt=""`). |
| `name` | Nombre con marcado. |

Expandida: `FiLogo` `inverse` de 2.5 rem y el nombre en `text-xs` dorado
(`text-fi-gold`, 5.4:1 sobre `bg-fi-header`). Contraída: el escudo a color de
2 rem y "Facultad de Ingeniería — {name}" como texto solo para lectores de
pantalla.

```vue
<UDashboardSidebar collapsible resizable>
  <template #header="{ collapsed }">
    <FiDashboardBrand name="Programa de Salud Mental" to="/dashboard" :collapsed="collapsed" />
  </template>
  <!-- … -->
</UDashboardSidebar>
```

---

## Nuxt UI con acento FI

La apariencia FI de los componentes de Nuxt UI llega por `fiAppConfig` (el
módulo la mezcla **por debajo** del `app.config` del proyecto: el proyecto gana
si declara la misma clave). En la vista usa `color`, `variant` y `size`; `class`
y `:ui` solo para layout (ancho, alineación, padding), nunca para color.

### Lo que fiAppConfig ya estiliza (no lo reestilices)

| Componente | fiAppConfig pone | Tú no |
|------------|------------------|-------|
| `ui.colors` | `primary`/`secondary`/`tertiary`/`neutral` → escalas FI; `success` green, `info` sky, `warning` amber, `error` red, con tokens de texto oscurecidos para AA (D3) | declarar `primary`, `secondary`, `tertiary` ni `neutral` en tu `app.config` (pisarías el tema) |
| `ui.icons` | Phosphor completo (`i-ph-*`) | mezclar Lucide/Heroicons en la app |
| `UButton` | tamaños de texto por `size`; `neutral` `ghost`/`outline`/`soft`/`subtle` con hover visible sobre blanco y sobre pizarra | `hover:bg-*`, `bg-white`, `text-white` en botones |
| `UInput`, `UTextarea`, `USelect`, `USelectMenu`, `UInputMenu`, `UInputNumber`, `UInputTags`, `UInputDate`, `UInputTime`, `UPinInput` | `outline` blanco, borde ≥ 3:1 (D5), tamaños de texto; `soft`/`subtle` en `bg-muted` | `bg-*`, `border-*`, `class="text-sm"` |
| `UFormField` | label `text-base font-medium`; description/hint `text-sm text-muted`; error `text-sm text-error` | etiquetas propias (`<p class="ui-label">`), asteriscos a mano |
| `UTable` | raíz `rounded-2xl border border-default bg-elevated`; `thead` `bg-muted`; `th` versalitas navy; `td` **sin** `whitespace-nowrap` global; hover y fila seleccionada visibles | `:ui="{ root: … }"` o `class="rounded-xl"`; `<table>` a mano [C-15, E-12] |
| `UModal`, `USlideover` | contenido blanco; header con `border-b`; título `font-bold text-fi-navy`; pie `justify-end gap-2` ([Cancelar] [Acción] a la derecha) | `class="rounded-xl"` (no afecta al portal) [E-19]; títulos propios en el body; un `div` propio para alinear el pie |
| `UDrawer`, `UPopover`, `UTooltip`, `UDropdownMenu`, `UContextMenu`, contenido de selects, `UCommandPalette`, `UToast` | contenido blanco (`bg-elevated`); resaltado y activo con tintes de pizarra | fondos propios |
| `UBadge`, `UAlert`, `UKbd` | `soft`/`subtle` visibles sobre blanco y pizarra; texto de estado AA; primario sobre su tinte en el paso 600; tamaños `xs`/`sm` de 13–15 px (Nuxt UI traía 8–10 px) | `bg-*-50 text-*-600` a mano |
| `UCard`, `UPageCard` | la tarjeta FI: `outline` blanco y `rounded-2xl`; `UPageCard` con `to` tiene hover visible | `class="bg-white rounded-xl"` por instancia |
| `UEmpty` | `outline` blanco; `soft`/`subtle` en `bg-muted` | — (usa `naked` dentro de una tarjeta, abajo) |
| `USkeleton` | `bg-accented` y `motion-reduce:animate-none` | `class="bg-gray-200"` |
| `UTabs` `pill`, `UTimeline`, `UStepper`, `USwitch`, `USlider`, `URadioGroup`, `UAvatar` neutro | pista, separador, indicador y círculos en `bg-muted`/`bg-accented`; perillas blancas | — |
| `UNavigationMenu`, `UTree`, `UListbox`, `UCalendar` | hover, abierto y activo con tintes de pizarra; activo primario en el paso 600 sobre su tinte | — |
| `UDashboardGroup` / `UDashboardSidebar` / `UDashboardNavbar` / `UDashboardPanel` / `UDashboardToolbar` | sidebar isla oscura (`dark bg-fi-header`) con filete rojo arriba (`border-t-4 border-t-primary-500`); navbar y toolbar blancos, navbar con filete rojo y título navy; panel sobre la página pizarra | `dark:` ni colores en el shell |

### Lo que fiAppConfig no puede resolver

Si un componente de Nuxt UI se ve mal sobre las superficies FI, el arreglo va
**en el paquete** (`src/app-config.js`), no en el `app.config.ts` del proyecto
ni por instancia. Lo que queda del lado del proyecto son **valores por
defecto de props**, que no pasan por el tema:

| Componente | Valor por defecto en 4.9 | Pásale siempre |
|------------|--------------------------|----------------|
| `UButton`, `UBadge`, `UAlert` | `color="primary"` + `variant="solid"`: rojo FI lleno | `color` y `variant` explícitos |
| `UPagination` | página activa `primary` `solid`: un segundo rojo sólido en la vista | `active-color="neutral"` (con su `active-variant` por defecto) |
| `UEmpty` | `variant="outline"`: una caja con borde dentro de la tarjeta | `variant="naked"` dentro de una superficie |
| `UTable` | sin slot `#loading`, `:loading` cae al `#empty` y dice "sin datos" | el slot `#loading` (receta en [UTable](#utable)) |

### UButton

La jerarquía se expresa con `color` + `variant`, nunca con clases.

| Rol | `color` | `variant` | Cuándo | Límite |
|-----|---------|-----------|--------|--------|
| Principal | `primary` | `solid` | La acción para la que existe la vista o el diálogo: Crear, Guardar, Enviar, Continuar | **1** visible por vista o diálogo |
| Secundaria | `neutral` | `outline` | Alternativas: Exportar, Cancelar, Atrás en un pie de diálogo | — |
| Secundaria densa | `neutral` | `soft` | Dentro de tarjetas o toolbars cargadas | — |
| Terciaria | `neutral` | `ghost` | Acciones de fila, "Ver todo", íconos, "Atrás" en un wizard | — |
| En línea | `primary` o `neutral` | `link` | Acción dentro de un texto o un pie de tarjeta | — |
| Destructiva en fila o tarjeta | `error` | `ghost` | Eliminar, Rechazar, Quitar: **abre confirmación** | — |
| Destructiva en "Zona de riesgo" | `error` | `outline` | "Eliminar cuenta" en la última sección de `settings` o de `record-detail` | — |
| Confirmar destructiva | `error` | `solid` | Solo dentro del diálogo de confirmación | 1 |
| Filtro/toggle activo | `neutral` | `subtle` + `:aria-pressed="true"` | Chips y toggles | — |
| Filtro/toggle inactivo | `neutral` | `ghost` u `outline` + `:aria-pressed="false"` | — | — |

- **Navegar = enlace.** Si el botón lleva a otra vista, `to="/ruta"`
  (absoluta); nunca `@click="navigateTo(…)"` [B-05]. Externo:
  `target="_blank"` y avísalo (ver [patterns.md](patterns.md#navegación)).
- **Solo ícono = `aria-label` obligatorio**, con el objeto si es una fila:
  `:aria-label="`Eliminar a ${member.name}`"`. `UTooltip` es opcional y además,
  nunca en lugar de [C-10, D-08, E-08].
- **En curso:** `:loading="saving"` en el botón que disparó la acción, o
  `loading-auto` con un `@click` asíncrono. Nada de spinner de página.
- **Tamaños:** `md` por defecto; `lg` en CTAs públicos y en el pie de un
  wizard público; `sm` en acciones de fila y de sección; nada por debajo de
  `xs` (24 px, WCAG 2.5.8).
- **Islas oscuras** (FiCtaBand, héroe `dark bg-fi-navy`, FiHeader): los mismos
  `primary solid` y `neutral outline`; los tokens se invierten solos.
- **No:** `success` como color de una acción ("Aceptar" verde) [D-25];
  `warning`, `info`, `secondary` o `tertiary` como color de botón; el filtro
  activo en `primary solid` junto al CTA [E-17]; dos o tres `primary solid` a la
  vez (encabezado + vacío + acción masiva) [C-29]; `@click="open = false"` sin
  `;` final en un componente de Nuxt UI (rompe el typecheck: escribe
  `@click="open = false;"`).

```vue
<!-- Pie de un formulario de edición -->
<div class="flex justify-end gap-2">
  <UButton label="Cancelar" color="neutral" variant="outline" @click="emit('close')" />
  <UButton type="submit" label="Guardar cambios" color="primary" variant="solid" :loading="saving" />
</div>
```

### UBadge vs FiStatusBadge

| Muestras | Usa | Props |
|----------|-----|-------|
| El **estado** de un registro | `FiStatusBadge` | `:status` desde tu mapa `Record<Dominio, FiStatus>` |
| Una **categoría o tipo** (tipo de cuestionario, de evento, de institución) | `UBadge` | `color="neutral"` `variant="outline"` + `icon` distintivo |
| Un **conteo** (en una pestaña, junto a un título) | `UBadge` | `color="neutral"` `variant="soft"`, número formateado |
| Un **rol** o atributo de persona | `UBadge` | `color="neutral"` `variant="subtle"` |

- `UBadge` sin `color` es `primary solid` (rojo FI lleno): **siempre** pasa
  `color` y `variant`.
- Un `UBadge` no es un control: nunca `@click` [D-05]. Si filtra, es un
  `UButton` con `aria-pressed`.
- `tertiary`/`secondary` para categorías solo si la vista necesita distinguir
  2–3 tipos de un vistazo y cada uno lleva su ícono; nunca colores de estado
  ni `primary` [E-04, D-03].

### UAlert

Para todo aviso o callout dentro de una vista: informativo, advertencia, error
de envío, resultado de una verificación. Variante única: **`subtle`**.

| Situación | `color` | `icon` | Atributo | Ejemplo |
|-----------|---------|--------|----------|---------|
| Información de contexto | `info` | `i-ph-info` | — | "Las solicitudes se responden en 3 días hábiles." |
| Advertencia antes de actuar | `warning` | `i-ph-warning` | — | "La recepción de solicitudes cierra el viernes." |
| Error de envío o de carga | `error` | `i-ph-warning-circle` | `role="alert"` | "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." |
| Resultado positivo que debe persistir | `success` | `i-ph-check-circle` | `role="status"` | "El documento es válido." |
| Nota neutra | `neutral` | `i-ph-note` | — | "Este registro es de solo lectura." |

```vue
<UAlert
  color="error"
  variant="subtle"
  icon="i-ph-warning-circle"
  title="No se pudo cargar el historial"
  description="Puede ser un problema de conexión."
  :actions="[{ label: 'Reintentar', icon: 'i-ph-arrow-clockwise', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
  role="alert"
/>
```

- `UAlert` sin `color` es `primary solid`: un aviso en rojo FI. **Siempre**
  pasa `color` y `variant="subtle"` [B-08].
- Listas largas en el slot `#description`; enlaces y botones en `actions` o
  `#actions`.
- Aviso de sitio completo (una sola vez, se recuerda al cerrarlo): `UBanner`
  con `id`, no `UAlert`.
- **No:** `div` teñidos con ícono hechos a mano (12+ variantes) [B-07, C-17,
  D-14]; un resultado inválido y una advertencia menor con el mismo ámbar
  [B-10]; `<p class="text-error-600">` como error de formulario sin
  `role="alert"` [D-15].

### UEmpty

Receta FI: **`variant="naked"`**, dentro de la superficie que ocuparía el
contenido (el `#empty` de un `UTable`, una `FiSectionCard`), con el ícono en un
círculo azul marino vía `FiIconBadge` en el slot `#leading`.

| Variante del vacío | Ícono | Título | Acción |
|--------------------|-------|--------|--------|
| Primer uso | del objeto (`i-ph-tray`, `i-ph-folder-plus`) | "Aún no hay categorías" | Crear: `neutral outline` si el encabezado ya tiene el `primary solid`; si no, `primary solid` |
| Sin resultados (filtros/búsqueda) | `i-ph-magnifying-glass` | "Sin resultados para «ana»" | **"Limpiar filtros"** `neutral outline` |
| Todo al día | `i-ph-check-circle`, `tone="success"` | "Bandeja al día" | ninguna, o "Ver historial" `neutral ghost` |

```vue
<UEmpty
  variant="naked"
  title="Aún no hay categorías"
  description="Las categorías agrupan los malestares que se registran en cada sesión."
  :actions="[{ label: 'Nueva categoría', icon: 'i-ph-plus', color: 'neutral', variant: 'outline', onClick: openCreate }]"
>
  <template #leading>
    <FiIconBadge icon="i-ph-folder-plus" size="lg" />
  </template>
</UEmpty>
```

**Nivel de encabezado.** `UEmpty` renderiza su título como `<h2>` fijo. A nivel
de página (debajo del h1) está bien. Dentro de una `FiSectionCard` (que ya es
h2) no pases `title`: usa el slot `#header` y escribe el título como `<p>`:

```vue
<FiSectionCard title="Próximas citas">
  <UEmpty variant="naked" size="sm">
    <template #header>
      <FiIconBadge icon="i-ph-calendar-blank" size="md" />
      <p class="text-sm font-medium text-highlighted">No hay citas esta semana</p>
      <p class="text-sm text-muted">Las nuevas citas aparecen aquí en cuanto se agendan.</p>
    </template>
  </UEmpty>
</FiSectionCard>
```

- `UEmpty` 4.9 **no** tiene `loading` (llegó en 4.10): la carga es otro estado,
  con skeleton.
- **No:** el vacío "sin datos" cuando la carga falló [D11]; un vacío filtrado
  sin "Limpiar filtros" [C-21]; cajas punteadas a mano con tamaños distintos
  [D-21, E-20]; un segundo `primary solid` en el vacío además del encabezado
  [C-29].

### UTabs

Dos usos, dos recetas. Pestañas que **cambian de ruta** no son `UTabs`.

| Necesitas | Componente | Props |
|-----------|-----------|-------|
| Control segmentado: filtrar o cambiar la vista de la misma lista ("Pendientes · Historial", "Tabla · Tarjetas") | `UTabs` | `variant="pill"` `color="neutral"` `:content="false"` `size="sm"` |
| Pestañas de sección con su panel ("Resumen · Sesiones · Notas") | `UTabs` | `variant="link"` `color="primary"`, contenido por slot del item |
| Pestañas que navegan a otras rutas | `UNavigationMenu` | `orientation="horizontal"` `variant="link"` `highlight`, items con `to` absoluto |

```vue
<!-- Control segmentado con conteos y estado en la URL -->
<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const view = computed({
  get: () => (route.query.vista as string) ?? 'pending',
  set: value => router.replace({ query: { ...route.query, vista: value } }),
})

const viewItems = computed(() => [
  { label: 'Pendientes', value: 'pending', badge: { label: String(counts.value.pending), color: 'neutral', variant: 'soft' } },
  { label: 'Historial', value: 'history' },
])
</script>

<template>
  <UTabs v-model="view" :items="viewItems" :content="false" variant="pill" color="neutral" size="sm" />
</template>
```

```vue
<!-- Pestañas de sección de un registro -->
<UTabs
  v-model="tab"
  :items="[
    { label: 'Resumen', value: 'summary', slot: 'summary' },
    { label: 'Sesiones', value: 'sessions', slot: 'sessions' },
    { label: 'Notas', value: 'notes', slot: 'notes' },
  ]"
  variant="link"
  color="primary"
>
  <template #summary><RecordSummary :record="record" /></template>
  <template #sessions><RecordSessions :record-id="record.id" /></template>
  <template #notes><RecordNotes :record-id="record.id" /></template>
</UTabs>
```

```vue
<!-- Pestañas de ruta: enlaces reales dentro de un <nav>, sin roles de pestaña. En 4.9,
     aria-current="page" solo sale en items con exact: true; el resto marca el activo
     por prefijo de ruta. -->
<UNavigationMenu
  :items="[
    { label: 'Resumen', to: '/estadisticas', exact: true },
    { label: 'Periodo', to: '/estadisticas/periodo' },
    { label: 'Instantáneas', to: '/estadisticas/instantaneas' },
  ]"
  orientation="horizontal"
  variant="link"
  highlight
  aria-label="Secciones de estadísticas"
/>
```

- ≤ 6 pestañas, etiquetas de 1–2 palabras, estado en la URL (`?tab=`,
  `?vista=`).
- **No:** `role="tab"` sobre enlaces que navegan [E-14, D-10]; cinco
  implementaciones de pestañas con estilos distintos [D-10]; píldoras a mano
  con el color como única pista [C-08]; el conteo blanco al 70 % sobre rojo
  [C-08].

### UTable

Toda tabla de datos es `UTable`: trae semántica, teclado, ordenamiento,
selección y el estilo de fiAppConfig.

Reglas de columnas:

| Columna | Regla | `meta.class` |
|---------|-------|--------------|
| Primera | Identificador humano (nombre, folio), nunca un UUID; enlaza al detalle | — |
| Números | A la derecha, `tabular-nums`, sin corte | `{ th: 'text-right', td: 'text-right tabular-nums whitespace-nowrap' }` |
| Fechas y horas | Sin corte | `{ td: 'whitespace-nowrap' }` |
| Texto largo | Que corte, con ancho mínimo | `{ td: 'min-w-56 max-w-md' }` |
| Estado | `FiStatusBadge` | — |
| Acciones | ≤ 2 visibles + `UDropdownMenu`, a la derecha | `{ th: 'sr-only', td: 'text-right' }` |

```vue
<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { REQUEST_STATUS_TONE, type RequestStatus } from '~/utils/presenters/request-status'

type RequestRow = {
  id: string
  folio: string
  studentName: string
  reason: string
  status: RequestStatus
  waitingDays: number
}

const props = defineProps<{ rows: RequestRow[], loading: boolean, filtered: boolean }>()
const emit = defineEmits<{ clearFilters: [], assign: [row: RequestRow], reject: [row: RequestRow] }>()

const { t } = useI18n()
const statusLabel = (status: RequestStatus) => t(`requests.status.${status}`)
const int = new Intl.NumberFormat('es-MX')

const columns: TableColumn<RequestRow>[] = [
  { accessorKey: 'studentName', header: 'Estudiante' },
  { accessorKey: 'reason', header: 'Motivo', meta: { class: { td: 'min-w-56 max-w-md' } } },
  { accessorKey: 'status', header: 'Estado' },
  {
    accessorKey: 'waitingDays',
    header: 'Días en espera',
    meta: { class: { th: 'text-right', td: 'text-right tabular-nums whitespace-nowrap' } },
    cell: ({ row }) => int.format(row.original.waitingDays),
  },
  { id: 'actions', header: 'Acciones', meta: { class: { th: 'sr-only', td: 'text-right' } } },
]

function rowMenu(row: RequestRow): DropdownMenuItem[][] {
  return [
    [{ label: 'Asignar', icon: 'i-ph-user-plus', onSelect: () => emit('assign', row) }],
    [{ label: 'Rechazar', icon: 'i-ph-x-circle', color: 'error', onSelect: () => emit('reject', row) }],
  ]
}
</script>

<template>
  <!-- La tabla tiene nombre accesible; el contenedor scrollea si no cabe. -->
  <UTable
    :data="props.rows"
    :columns="columns"
    :loading="props.loading"
    sticky="header"
    caption="Solicitudes pendientes"
    class="max-h-[70dvh]"
  >
    <template #studentName-cell="{ row }">
      <ULink :to="`/solicitudes/${row.original.id}`" class="font-medium text-highlighted hover:underline">
        {{ row.original.studentName }}
      </ULink>
      <p class="text-sm text-muted">{{ row.original.folio }}</p>
    </template>

    <template #status-cell="{ row }">
      <FiStatusBadge :status="REQUEST_STATUS_TONE[row.original.status]" :label="statusLabel(row.original.status)" />
    </template>

    <template #actions-cell="{ row }">
      <UDropdownMenu :items="rowMenu(row.original)" :content="{ align: 'end' }">
        <UButton
          icon="i-ph-dots-three"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="`Más acciones para ${row.original.studentName}`"
        />
      </UDropdownMenu>
    </template>

    <!-- Obligatorio si usas :loading: sin este slot, UTable 4.9 muestra el vacío mientras carga. -->
    <template #loading>
      <div role="status" class="space-y-3 px-4">
        <span class="sr-only">Cargando solicitudes…</span>
        <USkeleton v-for="n in 5" :key="n" class="h-10 w-full" aria-hidden="true" />
      </div>
    </template>

    <template #empty>
      <UEmpty
        v-if="props.filtered"
        variant="naked"
        size="sm"
        title="Sin resultados con estos filtros"
        :actions="[{ label: 'Limpiar filtros', color: 'neutral', variant: 'outline', onClick: () => emit('clearFilters') }]"
      >
        <template #leading><FiIconBadge icon="i-ph-magnifying-glass" /></template>
      </UEmpty>
      <UEmpty v-else variant="naked" size="sm" title="Bandeja al día" description="No hay solicitudes pendientes.">
        <template #leading><FiIconBadge icon="i-ph-check-circle" tone="success" /></template>
      </UEmpty>
    </template>
  </UTable>
  <!-- Paginación fuera de la tabla, con total -->
</template>
```

- **El error de carga no va en la tabla.** Si la petición falló, no pintes la
  tabla vacía: pinta la región de error con reintento en su lugar (ver
  [patterns.md](patterns.md#estados-de-datos)).
- **Trampa de 4.9:** con `:loading="true"` y sin slot `#loading`, la tabla cae
  al `#empty` y dice "sin datos" mientras carga.
- Selección: columna `UCheckbox` con `aria-label` por fila ("Seleccionar
  solicitud de Ana P.") y para "Seleccionar todas" [D-09]; con filas
  seleccionadas, barra de acciones masivas arriba.
- Paginación: `UPagination` fuera de la tabla, con el total ("128
  solicitudes") y `active-color="neutral"` (su activo por defecto es un
  segundo `primary solid`); nunca cuatro botones de flecha a mano [E-12].
- Orden: `UTable` 4.9 no pone `aria-sort`. El botón del encabezado dice el
  estado en su nombre ("Fecha, orden descendente").
- Móvil: la raíz de `UTable` ya hace scroll horizontal; deja que lo haga o
  muestra tarjetas apiladas abajo de `md`. Nunca columnas que se salen del
  contenedor.
- **No:** `<table>` o rejillas de `div` a mano con su propio encabezado [D-13,
  E-12, C-15]; `whitespace-nowrap` en texto largo [C-16]; números a la
  izquierda [C-15]; acciones de fila que solo aparecen con hover [E-09].

### UForm y UFormField

Etiqueta arriba, en una sola columna, con el error asociado. La forma completa
(con resumen de errores y foco) está en
[patterns.md](patterns.md#formularios).

```vue
<UFormField name="email" label="Correo institucional" description="Te escribiremos aquí para confirmar tu cita.">
  <UInput v-model="state.email" type="email" autocomplete="email" aria-required="true" class="w-full" />
</UFormField>

<UFormField name="phone" label="Teléfono" hint="(opcional)">
  <UInput v-model="state.phone" type="tel" autocomplete="tel" class="w-full" />
</UFormField>
```

- **Opcional, no obligatorio.** Marca los opcionales con `hint="(opcional)"`.
  No uses la prop `required` de `UFormField`: solo pinta un asterisco. Señala
  lo obligatorio con `aria-required="true"` en el control.
- `UFormField` conecta solo `aria-describedby` (descripción, hint, ayuda,
  error) y `aria-invalid`. Para eso el control va **dentro** del `UFormField`
  y el `UFormField` lleva `name`.
- Grupos de opciones: `URadioGroup` (una opción) o `UCheckboxGroup` (varias),
  con `legend` = la pregunta; nunca filas de botones que fingen radios [B-03,
  D-09].
- Interruptor: `<USwitch v-model="visible" label="Visible para estudiantes" />`,
  con su `label` [E-22].
- Archivo: `UFileUpload` dentro de `UFormField` [E-22].
- "¿Hay cambios sin guardar?": no uses `form.dirty` de `UForm` 4.9. Se
  marca con cualquier entrada, no vuelve a limpio si el valor regresa al
  original y `clear()` solo limpia errores. Compara el estado contra el
  último valor guardado (receta en [settings](archetypes/settings.md)).
- **No:** placeholder como única etiqueta [E-22, B-23]; `<p class="ui-label">`
  como etiqueta [D-09]; `<input>` desnudos con `focus:outline-none` [E-09].

### UStepper

Indicador de progreso de un asistente. Los botones de avanzar y volver son
tuyos, fuera del stepper.

```vue
<UStepper
  v-model="step"
  :items="[
    { value: 'identity', title: 'Identidad', icon: 'i-ph-identification-card' },
    { value: 'contact', title: 'Contacto', icon: 'i-ph-phone' },
    { value: 'reason', title: 'Motivo', icon: 'i-ph-chat-text' },
    { value: 'review', title: 'Revisar', icon: 'i-ph-list-checks' },
  ]"
  color="primary"
  size="sm"
  disabled
  class="hidden sm:flex"
/>
<!-- En móvil: texto + barra, sin scroll horizontal [B-29] -->
<div class="sm:hidden">
  <p class="text-sm font-medium text-highlighted">Paso {{ stepIndex + 1 }} de 4 · {{ stepTitle }}</p>
  <UProgress :model-value="stepIndex + 1" :max="4" size="sm" class="mt-2" />
</div>
```

- `disabled` evita que se salte pasos haciendo clic en el indicador; la
  navegación es con "Continuar"/"Atrás".
- Al cambiar de paso, lleva el foco al título del paso (`tabindex="-1"`) y el
  scroll arriba [B-M2].
- Flujos públicos largos: una ruta por paso, para que "Atrás" del navegador y
  recargar funcionen.
- **No:** un `StepIndicator` propio de `div`s sin `aria-current="step"` [E-21];
  `min-w-[34rem]` dentro de un `overflow-x-auto` en móvil [B-29].

### UTimeline

Historial de un registro, más reciente primero.

**Caveat de teclado [D-M1].** En 4.9 cada ítem es un `<div @click>` sin
`tabindex` ni `role`: con `@select` el detalle solo se abre con el mouse. **No
uses `@select`.** Pon un `<button>` real en el slot `#title` y estíralo sobre el
ítem (el ítem ya es `relative`):

```vue
<section aria-labelledby="history-title">
  <h2 id="history-title" class="text-lg font-semibold text-fi-navy">Historial</h2>
  <UTimeline :items="events" color="neutral" size="sm" class="mt-4">
    <template #date="{ item }">
      <time :datetime="item.isoDate">{{ item.date }}</time>
    </template>
    <template #title="{ item }">
      <button
        type="button"
        class="text-start font-medium text-highlighted after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
        @click="openEvent(item)"
      >
        {{ item.title }}
      </button>
    </template>
  </UTimeline>
</section>
```

- Tipos de evento = **categorías**: `color="neutral"` (indicador en
  `bg-muted`, ya resuelto por fiAppConfig) e ícono distinto por tipo, nunca
  un color de estado por tipo [D-03]. Si un ícono
  blanco va sobre color, el fondo debe dar ≥ 3:1: usa el token de rol
  (`bg-success`, ya oscurecido en claro), nunca `-500` [D-M2].
- Fecha sin hora conocida: solo la fecha (nunca "00:00").
- Si hay scroll horizontal, el contenedor necesita `tabindex="0"`, `role="region"`
  y `aria-label`.

### UModal, USlideover y UDrawer

| Necesitas | Usa | Por qué |
|-----------|-----|---------|
| Confirmar una acción (destructiva, irreversible, publicar) | `UModal` | Decisión bloqueante, corta. Receta en [patterns.md](patterns.md#acciones-destructivas-y-confirmación). |
| Crear o editar algo simple (≤ 6 campos) | `UModal` | El contexto de la lista no hace falta. |
| Ver el detalle de un elemento sin perder la lista; editar algo mediano | `USlideover` (`side="right"`) | La lista sigue visible; el detalle es profundo. |
| Lo mismo en móvil, o filtros en móvil | `UDrawer` | Hoja inferior con asa, natural en táctil. |
| Editar algo complejo (secciones, listas relacionadas) | Una página `/[id]` | Un modal no escala; nunca modal sobre modal. |

```vue
<USlideover v-model:open="open" title="Solicitud S-2026-0142" description="Recibida el 7 oct 2026">
  <template #body>
    <!-- detalle -->
  </template>
  <template #footer>
    <UButton label="Cerrar" color="neutral" variant="outline" @click="open = false;" />
    <UButton label="Asignar" color="primary" variant="solid" @click="assign" />
  </template>
</USlideover>
<!-- El pie ya es `justify-end gap-2` (fiAppConfig): no lo envuelvas en un div.
     Algo que deba ir a la izquierda (Eliminar en un editor) lleva class="me-auto". -->
```

- Siempre `title` (es el nombre accesible del diálogo).
- Pie: `[Cancelar/Cerrar (neutral outline)] [Acción]`, a la derecha [D-22,
  E-19].
- No se cierra hasta que la acción confirma; si falla, queda abierto con lo
  escrito y el error en línea (ver [patterns.md](patterns.md#canales-de-retroalimentación)).
- Programáticos: `useOverlay().create(MiDialogo)` y `await instancia.open(props)`
  devuelve lo que el diálogo emitió en `close`.
- **No:** el detalle debajo de la tabla sin mover el foco ni el scroll [E-30];
  `class="rounded-xl"` en el `UModal` [E-19].
- Un componente abierto con `useOverlay` no lleva `await` de nivel superior
  en su `setup`: ningún `<Suspense>` lo espera y no se monta. Carga sus datos
  con `useFetch` sin `await` (o en `onMounted`) y muestra su skeleton.

### Shell del dashboard: UDashboard\*

Anatomía: `UDashboardGroup` > `UDashboardSidebar` (isla oscura, estilo de
fiAppConfig) + `<main id="main-content">` con uno o más `UDashboardPanel`.
Cada panel abre con `UDashboardNavbar` y, si hace falta, `UDashboardToolbar`.
Sin `FiHeader`, el enlace "Saltar al contenido" lo pone el layout.

```vue
<!-- layouts/dashboard.vue -->
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const nav: NavigationMenuItem[] = [
  { label: 'Inicio', icon: 'i-ph-house', to: '/dashboard', exact: true },
  { label: 'Solicitudes', icon: 'i-ph-tray', to: '/dashboard/solicitudes' },
  { label: 'Historiales', icon: 'i-ph-folder-open', to: '/dashboard/historiales' },
]

// Sin la cinta roja arriba, <html> no se pinta de rojo (se vería al estirar el
// scroll). Si la app es SOLO dashboard, mejor `fiUi: { chrome: false }` en
// nuxt.config (ver setup.md).
useHead({ htmlAttrs: { 'data-fi-chrome': 'off' } })
</script>

<template>
  <!-- Sin FiHeader, el salto lo pone el layout (el mismo destino que en el sitio público). -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-elevated focus:px-4 focus:py-2 focus:text-highlighted focus:outline-2 focus:outline-primary"
  >Saltar al contenido</a>

  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable>
      <template #header="{ collapsed }">
        <FiDashboardBrand name="Programa de Salud Mental" to="/dashboard" :collapsed="collapsed" />
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu :items="nav" orientation="vertical" :collapsed="collapsed" aria-label="Navegación principal" />
      </template>
      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <main id="main-content" tabindex="-1" class="flex min-w-0 flex-1 focus:outline-none">
      <slot />
    </main>
  </UDashboardGroup>
</template>
```

```vue
<!-- pages/dashboard/solicitudes/index.vue -->
<template>
  <UDashboardPanel id="requests">
    <template #header>
      <!-- #left reemplaza el <h1> del navbar: la vista ya tiene el suyo en FiPageHeader [C-M1] -->
      <UDashboardNavbar>
        <template #left>
          <UBreadcrumb :items="[{ label: 'Inicio', to: '/dashboard' }, { label: 'Solicitudes' }]" aria-label="Ruta de navegación" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
        <FiPageHeader title="Solicitudes" description="Solicitudes de acompañamiento por asignar y su historial." />
        <!-- … -->
      </div>
    </template>
  </UDashboardPanel>
</template>
```

- **Navbar = orientación, no encabezado.** `UDashboardNavbar` pone su `title`
  dentro de un `<h1>`. Si la vista tiene `FiPageHeader`, usa el slot `#left`
  (migas o el nombre de la sección como texto); el botón de menú móvil se
  conserva porque vive fuera de ese slot. Solo usa `title` cuando el navbar
  **es** el título de la vista (paneles de lista-detalle sin FiPageHeader).
- Lista-detalle (`worklist-queue`, `catalog-admin` con vista previa): dos
  `UDashboardPanel` hermanos; el de lista `resizable` (`:default-size="30"`
  `:min-size="20"` `:max-size="45"`), el de detalle `class="hidden lg:flex"`.
  Abajo de `lg`, el detalle abre en un `USlideover` (como la plantilla de
  dashboard de Nuxt UI) y la lista conserva su lugar; si el detalle es largo
  o necesita URL propia, una ruta de detalle con `FiPageHeader back`. Receta
  en [worklist-queue](archetypes/worklist-queue.md).
- `UDashboardToolbar` (`#left`/`#right`) bajo el navbar para búsqueda,
  filtros y vistas guardadas.
- Altos de pantalla con `dvh`, nunca `vh` [D-29].
- **No:** `<main>` dentro de cada página además del layout [C-20, E-29];
  `dark:` o colores en el sidebar; un selector de modo oscuro en el menú de
  usuario [D-M3].

### UInputTags

Chips de entrada: correos, palabras clave, alias. Trae teclado, borrado y
accesibilidad.

```vue
<UFormField name="emails" label="Correos de contacto" description="Escribe un correo y pulsa Enter.">
  <UInputTags v-model="state.emails" add-on-blur add-on-paste class="w-full" />
</UFormField>
```

- Valida cada entrada en el schema y muestra el error del `UFormField`, no
  anillos de color [E-24].
- **No:** chips a mano (span + `x` sin nombre + `UInput` que agrega con Enter)
  [E-24].

### UTree

Jerarquías navegables: categorías con subcategorías, estructura de un
catálogo.

```vue
<UTree v-model="selected" :items="categoryTree" color="primary" size="md" aria-label="Categorías de malestar" />
```

- Cada nodo con `label` legible; `children` para anidar.
- Para elegir un nodo en un formulario, `UTree` dentro de un `UPopover` o una
  `USelectMenu` agrupada; no una lista de botones con `aria-pressed` [D-19].

### UAuthForm

Inicio de sesión y verificación: campos, proveedores y envío con `UForm`
dentro. Va en una tarjeta angosta.

```vue
<FiSectionCard class="mx-auto w-full max-w-md">
  <UAuthForm
    description="Usa tu cuenta institucional."
    icon="i-ph-lock-key"
    :fields="[
      { name: 'email', type: 'email', label: 'Correo institucional', autocomplete: 'username' },
      { name: 'password', type: 'password', label: 'Contraseña', autocomplete: 'current-password' },
    ]"
    :submit="{ label: 'Iniciar sesión', color: 'primary', variant: 'solid', block: true }"
    :schema="schema"
    :loading="pending"
    @submit="onSubmit"
  >
    <!-- En 4.9 la prop `title` se pinta en un <div>: el h1 va en el slot. -->
    <template #title>
      <h1 class="text-2xl font-bold tracking-tight text-fi-navy">Iniciar sesión</h1>
    </template>
    <template #validation>
      <UAlert v-if="authError" color="error" variant="subtle" icon="i-ph-warning-circle" :title="authError" role="alert" />
    </template>
  </UAuthForm>
</FiSectionCard>
```

- El `<h1>` de la vista de login va en el slot `#title`: la prop `title` de
  `UAuthForm` 4.9 sale en un `<div>`, y un login sin encabezado no se puede
  navegar por encabezados [B-16]. Receta completa en
  [public-utility](archetypes/public-utility.md).
- `autocomplete` en cada campo; nada de bloquear pegar.

### UPageHero, UPageSection y UPageCard (sitio público)

| Bloque | Componente | Receta FI |
|--------|-----------|-----------|
| Héroe de portada | `UPageHero` | `class="dark bg-fi-navy"` (isla oscura); `title` = la necesidad, no la sigla; **un** `primary solid` + máximo un `neutral outline` en `links` |
| Sección | `UPageSection` | `FiSectionHeading` en `#header`; alterna fondo con `class="bg-muted"` |
| Tarjeta de servicio o paso | `UPageCard` | blanca y `rounded-2xl` (fiAppConfig); `FiIconBadge` en `#leading`; el `h3` en el slot `#title` (la prop sale en un `<div>`); con `to` toda la tarjeta es enlace: no metas botones dentro |
| Llamado final | `FiCtaBand` | una por página |
| Preguntas frecuentes | `UAccordion` | solo lo secundario va plegado |

```vue
<UPageHero
  class="dark bg-fi-navy"
  title="Acompañamiento psicológico para estudiantes de Ingeniería"
  description="Gratuito y confidencial. Solicítalo en línea en 10 minutos."
  :links="[
    { label: 'Solicitar acompañamiento', to: '/agendar', color: 'primary', variant: 'solid', size: 'xl' },
    { label: 'Cómo funciona', to: '#como-funciona', color: 'neutral', variant: 'outline', size: 'xl' },
  ]"
/>

<UPageSection id="como-funciona">
  <template #header>
    <FiSectionHeading eyebrow="Paso a paso" title="Cómo funciona" />
  </template>
  <UPageGrid>
    <UPageCard
      v-for="service in services"
      :key="service.to"
      :description="service.description"
      :to="service.to"
    >
      <template #leading>
        <FiIconBadge :icon="service.icon" size="lg" />
      </template>
      <template #title>
        <h3>{{ service.title }}</h3>
      </template>
    </UPageCard>
  </UPageGrid>
</UPageSection>
```

- **No:** crisis como héroe de la portada ni escondida solo en el pie (ver el
  arquetipo [`crisis-info`](archetypes/crisis-info.md)); `MarketingSurface` u
  otras tarjetas propias usadas en dos vistas y copiadas en 47 [B-14];
  `rounded-3xl` fuera de bandas y héroes públicos.
