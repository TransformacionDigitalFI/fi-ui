# Visualización de datos

Gráficas, mapas de calor, cifras clave y formato de números en sistemas FI.
Vale para cualquier librería (SVG propio, Unovis, ECharts, Chart.js): las
reglas son de color, texto, interacción y accesibilidad, no de una API.

**fi-ui no trae componentes de gráfica** (Nuxt UI tampoco): trae la paleta
(`--fi-chart-*`), las cifras clave (`FiStat`) y estas reglas. La gráfica es
SVG propio con las recetas de abajo o una librería configurada con estos
tokens; la tarjeta que la envuelve es el `ChartCard` del proyecto
([analytics](archetypes/analytics.md#chartcard-una-sección-de-gráfica)).

> Los snippets suponen Nuxt 4 con `@fi-unam/ui/nuxt` y Nuxt UI 4.9. Los textos
> literales son ilustrativos: en el proyecto van al diccionario de i18n. Las
> cifras clave usan `FiStat`/`FiStatGrid` (API en
> [components.md](components.md#fistat-y-fistatgrid)).

## Índice

1. [Antes de graficar](#antes-de-graficar)
2. [Paleta categórica `--fi-chart-*`](#paleta-categórica---fi-chart-)
3. [Rampa secuencial `--fi-chart-seq-*`](#rampa-secuencial---fi-chart-seq-)
4. [Cuándo se permiten colores de estado](#cuándo-se-permiten-colores-de-estado)
5. [Una sola serie, un solo color](#una-sola-serie-un-solo-color)
6. [Varias series, distinguibles sin color](#varias-series-distinguibles-sin-color)
7. [Tooltips](#tooltips)
8. [Alternativa en tabla y resumen en texto](#alternativa-en-tabla-y-resumen-en-texto)
9. [Texto de ejes: 12 px reales](#texto-de-ejes-12-px-reales)
10. [Mapas de calor](#mapas-de-calor)
11. [Cifras clave con FiStat](#cifras-clave-con-fistat)
12. [Formato de números](#formato-de-números)
13. [Supresión de conteos pequeños](#supresión-de-conteos-pequeños)
14. [Estados de una gráfica](#estados-de-una-gráfica)
15. [Errores de la auditoría que no hay que repetir](#errores-de-la-auditoría-que-no-hay-que-repetir)

---

## Antes de graficar

| Pregunta | Forma | No |
|----------|-------|----|
| ¿Cuánto hay ahora? | `FiStat` (cifra + contexto en `hint`) | una gráfica para un solo número |
| ¿Cómo cambia en el tiempo? | Línea (≤ 4 series) o columnas si son pocos periodos | más de 4 líneas: divide en paneles pequeños |
| ¿Cómo se compara entre categorías? | Barras **ordenadas** por valor, horizontales si las etiquetas son largas | pastel con más de 5 partes; colores distintos por barra |
| ¿Qué parte del total? | Barra apilada al 100 % o barras con porcentaje | pastel salvo ≤ 5 partes con una dominante |
| ¿Cuándo se concentra (día × hora)? | Mapa de calor con rampa secuencial | colores de estado como cubetas |
| ¿Cómo se relacionan dos medidas? | Dispersión | — |

Reglas generales:

- **El título dice la conclusión**, el subtítulo dice medida, población y
  periodo: "Las solicitudes subieron 18 % en septiembre" / "Solicitudes
  recibidas por semana, estudiantes de licenciatura, ago–sep 2026".
- Pie de gráfica con fuente, definiciones y la fecha de los datos ("Datos al 8
  oct 2026, 10:30").
- Barras desde 0. Sin doble eje, sin 3D, sin medidores tipo velocímetro.
- Cada porcentaje dice su base: "42 % (n = 87)".
- Una vista de analítica muestra 6–8 visuales como máximo: cifras clave
  primero, tendencia, luego desgloses.

---

## Paleta categórica `--fi-chart-*`

fi-ui trae ocho colores de datos **sin tonos de estado** (nada de verde, ámbar
o rojo), derivados de los roles de la marca (azul marino, azul pizarra, oro,
grafito y mezclas entre ellos). Cada uno tiene ≥ 4.8:1 contra blanco y ≥ 4.2:1
contra la página (WCAG 1.4.11 pide 3:1), y cada par de vecinas se distingue
también con protanopia y deuteranopia (tests/charts.test.ts).

**Son fijos: un tema especial no repinta las gráficas.** Una serie conserva su
color de un día a otro (un tema dura un día), y derivados del tema activo se
rompían: en `luto` todos salían grafito.

| Token | Valor | Rol |
|-------|-------|-----|
| `--fi-chart-1` | `#1A3856` | azul marino |
| `--fi-chart-2` | `#3A72A8` | azul pizarra |
| `--fi-chart-3` | `#8A6A00` | oro |
| `--fi-chart-4` | `#944BA8` | púrpura (pizarra ↔ rojo FI) |
| `--fi-chart-5` | `#5A4400` | oro oscuro |
| `--fi-chart-6` | `#007D8C` | azul verdoso |
| `--fi-chart-7` | `#612F6F` | ciruela |
| `--fi-chart-8` | `#6A737B` | grafito; también "Otros" |

| Token | Utilidades | Uso |
|-------|------------|-----|
| `--fi-chart-1` | `bg-fi-chart-1`, `fill-fi-chart-1`, `stroke-fi-chart-1`, `text-fi-chart-1` | Serie única; primera serie |
| `--fi-chart-2` … `--fi-chart-8` | igual, con su número | Series 2 a 8, en orden |

Reglas:

1. **Asigna en orden** (1, 2, 3…) y **estable**: la misma serie lleva el mismo
   color en toda la vista y en toda la app. El mapa serie → token vive en **un**
   módulo, con valores únicos [E-03].
2. **El servidor manda un rol semántico, no un color** (`'total'`,
   `'favorable'`, `'adverse'`, el id de la categoría); el cliente traduce a
   token [E-02].
3. Más de 8 categorías: las 7 primeras con su color y el resto agrupado en
   "Otros" (`--fi-chart-8`), o barras ordenadas de un solo color con etiqueta
   en el eje. Nunca reciclar colores (dos categorías iguales) [E-01].
4. En gráficas donde cualquier par se toca (dispersión, mapas), solo las
   **tres primeras** son distinguibles entre todas; con más series, paneles
   pequeños (facetas).
5. **Nunca** `primary` (rojo FI) como serie: se confunde con error y lo cambia
   el tema [E-01, E-03]. **Nunca** paletas crudas de Tailwind (`violet-500`,
   `cyan-500`) ni pasos `-500` de estado como categorías [D-02, E-01].
6. Una marca de datos (barra, punto, línea) usa el token tal cual. Un **texto**
   sobre o junto a la gráfica va en tinta (`text-default`, `text-muted`), no en
   el color de la serie: la paleta está medida para marcas, no para texto
   sobre todas las superficies.

```ts
// app/utils/chart-series.ts — único mapa rol → color de la app
export const CHART_COLORS = [
  'var(--fi-chart-1)', 'var(--fi-chart-2)', 'var(--fi-chart-3)', 'var(--fi-chart-4)',
  'var(--fi-chart-5)', 'var(--fi-chart-6)', 'var(--fi-chart-7)', 'var(--fi-chart-8)',
] as const

/**
 * Colores estables por id: el orden de llegada no cambia el color de una
 * categoría. Nunca recicla: con más de 8, agrupa el resto en "Otros" antes.
 */
export function colorById(ids: readonly string[]): Record<string, string> {
  if (ids.length > CHART_COLORS.length) {
    throw new Error(`colorById: ${ids.length} categorías; agrupa desde la 8.ª en "Otros" (--fi-chart-8)`)
  }
  return Object.fromEntries(ids.map((id, i) => [id, CHART_COLORS[i]!]))
}
```

`colorById` recibe la lista **completa y ordenada** de categorías posibles (del
catálogo), no las que llegaron en esta respuesta; así "Ansiedad" es siempre el
mismo color aunque un mes no aparezca.

### En SVG

Usa el token directamente, como utilidad (`fill-fi-chart-1`,
`stroke-fi-chart-2`) o como variable:

```vue
<rect :width="w" :height="h" class="fill-fi-chart-1" />
<path :d="line" fill="none" stroke="var(--fi-chart-2)" stroke-width="2" />
```

### En librerías que pintan en canvas

Un canvas no entiende `var(--…)`. Resuelve el token a un color con un elemento
de prueba al montar (la paleta no cambia con el tema, así que basta una vez):

```ts
// app/composables/useChartColors.ts
function resolveCssColor(value: string): string {
  const probe = document.createElement('span')
  probe.style.color = value
  probe.style.display = 'none'
  document.body.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

export function useChartColors(tokens: () => string[]) {
  const colors = ref<string[]>([])
  onMounted(() => {
    colors.value = tokens().map(resolveCssColor)
  })
  return colors
}
```

---

## Rampa secuencial `--fi-chart-seq-*`

Cinco pasos de azul pizarra, de claro (`--fi-chart-seq-1`) a oscuro
(`--fi-chart-seq-5`), para **magnitud**: mapas de calor, coropletas, cubetas.
Fijos, como la paleta categórica. Utilidades `bg-fi-chart-seq-1…5` cuando la
clase va escrita literal; con el paso en una variable, `var(--fi-chart-seq-N)`
en `style` (Tailwind no ve clases armadas con `${}`).

| Paso | Valor | Uso | Texto encima (contraste) |
|------|-------|-----|--------------------------|
| `--fi-chart-seq-1` | pizarra-100 | cubeta más baja (> 0) | tinta: `text-default` (12.0:1) |
| `--fi-chart-seq-2` | pizarra-200 | | tinta: `text-default` (9.1:1) |
| `--fi-chart-seq-3` | pizarra-400 | | tinta: `text-default` (5.0:1) |
| `--fi-chart-seq-4` | pizarra-600 | | blanco: `text-white` (7.2:1) |
| `--fi-chart-seq-5` | pizarra-800 | cubeta más alta | blanco: `text-white` (13.9:1) |

El corte (tinta en 1–3, blanco en 4–5) está escrito en `tokens.css` junto a
los tokens. Guárdalo en **una** constante, no lo decidas por celda:

```ts
// app/utils/chart-series.ts
/** Primer paso de la rampa que lleva texto blanco (ver tokens.css). */
export const SEQ_INVERTED_FROM = 4

export const seqFill = (step: number) => `var(--fi-chart-seq-${step})`
export const seqText = (step: number) => (step >= SEQ_INVERTED_FROM ? 'text-white' : 'text-default')

/**
 * Cortes FIJOS (límite inferior de los pasos 1–5), iguales para todas las
 * gráficas que se comparan. Ejemplo con supresión de conteos pequeños: el
 * primero es 5 y lo suprimido ("< 5") va sin relleno, igual que el 0. Sin
 * supresión, el primer corte es 1.
 */
export const SEQ_BREAKS = [5, 10, 20, 40, 80] as const
export const seqStep = (n: number) => SEQ_BREAKS.findLastIndex(min => n >= min) + 1 // 0 = sin relleno
```

La leyenda sale de los mismos cortes ("5–9", "10–19"… "80 o más"). Si el
rango de los datos cambia mucho entre periodos, el servidor calcula los cortes
(p. ej. cuantiles) y los manda con los datos: el cliente no los recalcula por
gráfica.

`text-white` aquí y no `text-inverted`: la celda es un relleno de datos con
su propio contraste medido, no una superficie de Nuxt UI.

- **Cero no es la cubeta 1.** Una celda en 0 va sin relleno (fondo de la
  tarjeta) y con el número en `text-muted`.
- Gráficas que se comparan entre sí usan **las mismas cubetas**; no recalcules
  los cortes por gráfica.
- Nunca codifiques magnitud con colores de estado ni con el rojo FI (el
  "mapa de calor rojo" y el "ámbar" de la auditoría) [E-03, E-06].

---

## Cuándo se permiten colores de estado

Un color de estado (`success`, `warning`, `error`, `info`) en una gráfica dice
"esto está bien / mal / pendiente". Solo se usa cuando **el valor es** eso.

| Caso | ¿Estado? | Cómo |
|------|----------|------|
| Categorías (tipos de malestar, carreras, semestres, rangos de edad) | **No** | paleta categórica o un solo color [E-01, E-03] |
| Una sola medida (solicitudes por semana) | **No** | `--fi-chart-1` |
| Resultado con significado propio: favorable / adverso, vigente / caducado, a tiempo / vencido | **Sí** | `var(--ui-success)`, `var(--ui-error)`… **más** patrón de línea o etiqueta directa [E-02] |
| Umbral o meta ("más de 7 días de espera") | **Sí, solo la parte que lo cruza** | marcas bajo el umbral en `--fi-chart-1`, las que lo cruzan en `var(--ui-warning)`, con línea de umbral rotulada |
| Destacar un valor "porque sí" o decorar | **No** | — [E-03] |

En marcas usa los **tokens de rol** (`var(--ui-success)`, `var(--ui-warning)`,
`var(--ui-error)`), que fi-ui oscurece en modo claro para que pasen 3:1 sobre
blanco; nunca `var(--ui-color-success-500)` ni `-300` [D-M2]. El significado
nunca depende solo del color: la línea "Adversos" es punteada **y** dice
"Adversos" al final.

---

## Una sola serie, un solo color

Una gráfica con una sola medida usa **un** color de datos: `--fi-chart-1`.
Barras de distintas categorías con su etiqueta en el eje **no** necesitan
colores distintos: el eje ya dice cuál es cuál.

```vue
<!-- Barras horizontales ordenadas, un color, valor rotulado al final -->
<ul class="space-y-2" aria-label="Solicitudes por carrera, ago–sep 2026">
  <li v-for="row in sortedRows" :key="row.id" class="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
    <span class="truncate text-sm text-default">{{ row.label }}</span>
    <span class="h-3 rounded-sm bg-fi-chart-1" :style="{ width: `${(row.value / maxValue) * 100}%` }" aria-hidden="true" />
    <span class="text-sm tabular-nums text-highlighted">{{ fmt.int(row.value) }}</span>
  </li>
</ul>
```

- **No:** barras de "Malestares individuales" en rojo de error y de "Cédulas
  por edad" en verde [E-03]; un punto por columna rotulada pintado con 12
  colores distintos [E-01].

---

## Varias series, distinguibles sin color

Cada serie se distingue **por algo más que el color** (WCAG 1.4.1): patrón de
línea, forma del marcador y etiqueta directa. La leyenda no basta.

| Serie | Color | `stroke-dasharray` | Marcador |
|-------|-------|--------------------|----------|
| 1 | `--fi-chart-1` | — (sólida) | círculo |
| 2 | `--fi-chart-2` | `6 4` (guiones) | cuadrado |
| 3 | `--fi-chart-3` | `2 3` (puntos) | triángulo |
| 4 | `--fi-chart-4` | `8 3 2 3` (guion-punto) | rombo |

- **Etiqueta directa** al final de cada línea: una muestra corta de la línea
  (color + patrón) y el nombre en tinta. Si hay leyenda, va en el mismo orden
  que las líneas al final.
- Máximo 4 líneas por gráfica; si son más, paneles pequeños con la misma
  escala.
- Grosor de línea ≥ 2 px; marcadores ≥ 6 px.

```vue
<!-- Fragmento dentro del <svg>: líneas con patrón + etiqueta directa en tinta -->
<g v-for="(s, i) in series" :key="s.id">
  <path :d="linePath(s.values)" fill="none" :stroke="s.color" stroke-width="2" :stroke-dasharray="DASHES[i]" />
  <g :transform="`translate(${plotRight + 8}, ${yOf(s.values.at(-1) ?? 0)})`">
    <line x1="0" x2="16" y1="0" y2="0" :stroke="s.color" stroke-width="2" :stroke-dasharray="DASHES[i]" />
    <text x="22" dy="0.35em" class="fill-current text-xs font-medium text-default">{{ s.label }}</text>
  </g>
</g>
```

```ts
const DASHES = [undefined, '6 4', '2 3', '8 3 2 3'] as const
```

Las etiquetas directas al final de líneas cercanas se enciman: sepáralas
verticalmente un mínimo de 14 px (ordena por `y` y empuja hacia abajo).

---

## Tooltips

- El tooltip de un punto en el tiempo **lista todas las series** en ese
  instante, en el orden de las líneas, con su muestra de color + patrón, nombre
  y valor formateado [E-02].
- Se alcanza con teclado: puntos o columnas enfocables (`tabindex="0"`) con
  `aria-label` que contiene lo mismo que el tooltip ("Semana del 7 oct: Total
  42, Favorables 30, Adversos 4"), o un cursor que se mueve con ←/→ cuando la
  gráfica tiene el foco.
- En táctil, un toque lo muestra y otro lo cierra; no depende de `hover`.
- **El tooltip nunca es el único camino al dato**: lo esencial está rotulado o
  en la tabla alternativa [E-M3].
- Áreas de interacción ≥ 24 px de ancho aunque la marca sea más delgada
  (WCAG 2.5.8).

---

## Alternativa en tabla y resumen en texto

Toda gráfica tiene:

1. **Un resumen en texto** visible bajo el título o al pie: la conclusión en
   una o dos frases, con las cifras clave.
2. **Los datos en tabla**, a un clic: un control "Gráfica / Tabla" que todos
   pueden usar (sirve también para copiar y comparar), con `UTable` y los
   mismos formatos de número.
3. El SVG con `role="img"`, nombre por `<title>` + `aria-labelledby` (el
   título de la gráfica) y el resumen por `aria-describedby` (lo que pasa
   `ChartCard` en su slot `#chart`). Si hay tabla accesible, el SVG no
   necesita describir cada punto.

```vue
<script setup lang="ts">
const view = ref<'chart' | 'table'>('chart')
const fmt = useFormat()
</script>

<template>
  <FiSectionCard
    title="Las solicitudes subieron 18 % en septiembre"
    description="Solicitudes recibidas por semana · licenciatura · ago–sep 2026"
  >
    <template #actions>
      <UTabs
        v-model="view"
        :items="[{ label: 'Gráfica', value: 'chart', icon: 'i-ph-chart-line' }, { label: 'Tabla', value: 'table', icon: 'i-ph-table' }]"
        :content="false"
        variant="pill"
        color="neutral"
        size="xs"
      />
    </template>

    <p id="requests-trend-summary" class="text-sm text-muted">
      Se recibieron 312 solicitudes en septiembre, 48 más que en agosto. La semana con más fue la del 22 sep (96).
    </p>

    <RequestsTrendChart v-if="view === 'chart'" :series="series" aria-describedby="requests-trend-summary" class="mt-4" />
    <UTable v-else :data="rows" :columns="columns" caption="Solicitudes por semana" class="mt-4" />

    <template #footer>
      <p class="text-sm text-muted">Fuente: registro de solicitudes. Datos al 8 oct 2026, 10:30.</p>
    </template>
  </FiSectionCard>
</template>
```

- **No:** la gráfica con un `aria-label` genérico ("Gráfica") y ninguna
  alternativa [E-02].

---

## Texto de ejes: 12 px reales

El texto dentro de un `<svg viewBox="0 0 900 260" class="w-full">` **se escala
con el SVG**: un `text-[11px]` mide ~4 px en un teléfono y ~14 px en un
monitor ancho [E-07]. Regla: **ningún texto de gráfica mide menos de 12 px
reales** en ningún ancho (usa `text-xs`, 13 px en la escala FI). Dos formas
correctas:

1. **El `viewBox` sigue al ancho real** del contenedor (1 unidad = 1 px). Mide
   con `ResizeObserver` y recalcula la escala; el texto conserva su tamaño.
2. **Etiquetas en HTML** posicionadas sobre o alrededor del SVG; el SVG solo
   dibuja marcas.

```vue
<script setup lang="ts">
const props = defineProps<{ title: string, labels: string[] }>()
const titleId = useId()

const container = useTemplateRef<HTMLDivElement>('container')
const width = ref(0)
let observer: ResizeObserver | undefined

onMounted(() => {
  if (!container.value) return
  width.value = container.value.clientWidth
  observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = Math.round(entry.contentRect.width)
  })
  observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

const HEIGHT = 240
const PAD = { top: 12, right: 112, bottom: 28, left: 44 } // right: espacio para etiquetas directas

// Coordenadas en píxeles reales: 1 unidad del viewBox = 1 px de pantalla.
const plotWidth = computed(() => Math.max(0, width.value - PAD.left - PAD.right))
const xOf = (i: number) => PAD.left + (props.labels.length > 1 ? (i / (props.labels.length - 1)) * plotWidth.value : 0)

// Menos marcas en el eje X cuando no caben: ~1 por cada 72 px.
const xTickEvery = computed(() => Math.max(1, Math.ceil(props.labels.length / Math.max(2, Math.floor(plotWidth.value / 72)))))
</script>

<template>
  <div ref="container" class="w-full min-w-0">
    <svg
      v-if="width"
      :width="width"
      :height="HEIGHT"
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      role="img"
      :aria-labelledby="titleId"
      class="block"
    >
      <title :id="titleId">{{ props.title }}</title>
      <!-- ejes, rejilla y marcas en coordenadas de píxel -->
      <text
        v-for="(label, i) in props.labels"
        v-show="i % xTickEvery === 0"
        :key="label"
        :x="xOf(i)"
        :y="HEIGHT - 8"
        text-anchor="middle"
        class="fill-current text-xs tabular-nums text-muted"
      >{{ label }}</text>
    </svg>
  </div>
</template>
```

- Etiquetas rotadas solo como último recurso; antes, menos marcas o
  abreviaturas ("sep", "22 sep").
- Números de eje con formato compacto ("1.2 mil") y `tabular-nums`.
- Altos con `min-h`, no proporciones fijas que aplasten la gráfica en móvil.

---

## Mapas de calor

Un mapa de calor (día × hora, carrera × semestre) es **una tabla**: tiene
filas y columnas con encabezado. Constrúyelo como `<table>` real (o con
`role="grid"` completo) para que un lector de pantalla diga la fila y la
columna de cada número [E-M3].

Es la **única excepción** a "`UTable` siempre": el estilo de `UTable` (encabezado
en versalitas, celdas con padding de tabla de datos) no sirve para celdas de
color. Vive en un solo componente de gráfica (p. ej.
`components/charts/HeatmapTable.vue`), y el grep de `<table` de
[checklist.md](checklist.md) lo listará: es la excepción revisada, no la copies
en vistas.

```vue
<div class="overflow-x-auto" role="region" aria-labelledby="heatmap-title" tabindex="0">
  <table class="border-separate border-spacing-1 text-xs">
    <caption id="heatmap-title" class="sr-only">Solicitudes por día y hora, septiembre 2026</caption>
    <thead>
      <tr>
        <td />
        <th v-for="hour in hours" :key="hour" scope="col" class="px-1 font-medium tabular-nums text-muted">{{ hour }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="day in days" :key="day.id">
        <th scope="row" class="pe-2 text-start font-medium text-muted">{{ day.label }}</th>
        <td
          v-for="cell in day.cells"
          :key="cell.hour"
          class="size-9 rounded-md text-center tabular-nums"
          :class="cell.step ? seqText(cell.step) : 'text-muted'"
          :style="cell.step ? { backgroundColor: seqFill(cell.step) } : undefined"
        >{{ fmt.int(cell.value) }}</td>
      </tr>
    </tbody>
    <tfoot>
      <!-- totales por columna, en tinta -->
    </tfoot>
  </table>
</div>
<!-- Leyenda con los rangos de cada cubeta, en texto -->
<ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Escala">
  <li v-for="bucket in buckets" :key="bucket.step" class="flex items-center gap-1.5">
    <span class="size-3 rounded-sm" :style="{ backgroundColor: seqFill(bucket.step) }" aria-hidden="true" />
    {{ bucket.label }} <!-- "1–4", "5–9", "10–19"… -->
  </li>
</ul>
```

- El número de cada celda cambia de color con su cubeta (`seqText`): tinta en
  los pasos claros, blanco en los oscuros. Nunca un solo color de texto sobre
  todas las cubetas: los más oscuros quedaban en 1.4:1 [E-06].
- Encabezados y números ≥ 12 px (`text-xs`) [E-06, D-30].
- El detalle de una celda no vive solo en un tooltip de hover [E-M3].
- Nada de `hover:scale-105` sin `motion-safe:` [E-06].
- El total general va en tinta, no en rojo FI [E-03].

---

## Cifras clave con FiStat

| Regla | Cómo |
|-------|------|
| El valor llega formateado | `:value="fmt.int(n)"`; nunca `toFixed` ni separadores a mano |
| Color solo si la cifra **es** un estado | `tone="warning"` en "Vencidas: 3"; "Atendidas: 120" va en `default` (navy) |
| Contexto en texto | `hint`: comparación ("+12 % vs. septiembre"), base ("de 87 en total") o meta; nunca una flecha verde/roja sola |
| Porcentaje con su base | `value="42 %"` + `hint="36 de 87 solicitudes"` |
| Drill-down | `to` con la ruta filtrada (`'/solicitudes?estado=vencida'`) |
| Ayuda de la métrica | Fuera del área clicable y con objetivo ≥ 24 px; nunca un botón dentro de un `FiStat` con `to` [E-10, E-M2] |
| Carga | `loading` en todas las del mismo origen, a la vez |
| Agrupación | `FiStatGrid` con `columns` 3–4 en escritorio; apila en móvil |
| Definición | Cada métrica tiene una definición escrita (glosario, descripción o ayuda) |

```vue
<FiStatGrid :columns="4">
  <FiStat label="Solicitudes recibidas" :value="fmt.int(kpis.received)" icon="i-ph-tray" :hint="`${fmt.delta(kpis.receivedChange)} vs. agosto`" :loading="pending" />
  <FiStat label="Tiempo medio de respuesta" :value="`${fmt.dec(kpis.avgResponseDays)} días`" icon="i-ph-timer" :loading="pending" />
  <FiStat label="Vencidas" :value="fmt.int(kpis.overdue)" icon="i-ph-clock" tone="warning" to="/solicitudes?estado=vencida" :loading="pending" />
  <FiStat label="Atendidas" :value="fmt.pct(kpis.closedShare)" icon="i-ph-check-circle" :hint="`${fmt.int(kpis.closed)} de ${fmt.int(kpis.received)}`" :loading="pending" />
</FiStatGrid>
```

- **No:** cuatro diseños de KPI en vistas vecinas (navy 2xl, tinta 4xl,
  monoespaciado…) [E-16, C-14]; cifras grandes sin `tabular-nums` [E-16];
  rótulos de 11 px en versalitas [E-15].

---

## Formato de números

Todo número, porcentaje y fecha visible pasa por `Intl` con el idioma activo y
la zona horaria de la FI. Nada de `toFixed`, `toLocaleString()` sin locale ni
separadores escritos a mano.

```ts
// app/composables/useFormat.ts
import { FI_TIME_ZONE } from '@fi-unam/ui'

const LOCALE_TAGS: Record<string, string> = { es: 'es-MX', en: 'en-US' }

export function useFormat() {
  const { locale } = useI18n()

  return computed(() => {
    const tag = LOCALE_TAGS[locale.value] ?? 'es-MX'
    const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 })
    const dec = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    const pct = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 1 })
    const delta = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })
    const compact = new Intl.NumberFormat(tag, { notation: 'compact', maximumFractionDigits: 1 })
    const date = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: FI_TIME_ZONE })
    // Fechas de calendario sin hora ('2026-08-01'): new Date() las lee como
    // medianoche UTC, que en la Ciudad de México es el día anterior.
    const day = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    const dateTime = new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: FI_TIME_ZONE })

    return {
      int: (n: number) => int.format(n),
      dec: (n: number) => dec.format(n),
      /** Recibe una fracción: 0.253 → "25.3 %". */
      pct: (fraction: number) => pct.format(fraction),
      /** Cambio relativo con signo: 0.12 → "+12 %". */
      delta: (fraction: number) => delta.format(fraction),
      /** Ejes: 1250 → "1.3 mil". */
      compact: (n: number) => compact.format(n),
      /** Un instante (con hora): en la zona horaria de la FI. */
      date: (value: Date | string) => date.format(new Date(value)),
      /** Una fecha de calendario 'AAAA-MM-DD': sin correrse un día. */
      day: (isoDate: string) => day.format(new Date(`${isoDate}T00:00:00Z`)),
      dateTime: (value: Date | string) => dateTime.format(new Date(value)),
      /** Porcentaje con su base: "42 % (n = 87)". */
      share: (part: number, total: number) => (total > 0 ? `${pct.format(part / total)} (n = ${int.format(total)})` : '—'),
    }
  })
}
```

En la plantilla, `const fmt = useFormat()` y `{{ fmt.int(total) }}` (el
`computed` se desenvuelve solo).

- **`tabular-nums` en toda cifra que se compara:** columnas numéricas
  (`meta.class` de `UTable`), `FiStat` (ya lo trae), etiquetas de eje, celdas de
  mapas de calor, totales.
- Fecha sin hora conocida: solo la fecha; nunca "00:00".
- Día de la semana cuando importa para actuar ("lun 14 oct 2026, 10:00").
- Valores ausentes: "—" con explicación en el pie, no "0" ni "NaN".
- Unidades con su número ("3 días", "42 %"), no en el encabezado lejano.

---

## Supresión de conteos pequeños

En datos sensibles (salud, bienestar, situaciones personales), un conteo de 1
a 4 en un cruce fino (carrera × semestre × motivo) puede identificar a una
persona. Regla para estadísticas agregadas:

1. **Umbral:** los conteos de 1 a 4 se muestran como **"< 5"**. Los ceros se
   muestran. El umbral es una constante del proyecto, escrita en la nota.
2. **Se suprime en el servidor.** El cliente nunca recibe el valor real: lo
   que llega al navegador se puede inspeccionar.
3. **Supresión secundaria:** si un total menos las celdas visibles revela una
   celda suprimida, suprime otra celda de la fila (la siguiente más pequeña) o
   muestra el total redondeado.
4. **Porcentajes derivados** de una celda suprimida también se suprimen.
5. **En gráficas:** la barra suprimida no se dibuja como 0; se deja el hueco
   con la etiqueta "< 5". En mapas de calor, celda sin relleno con "< 5".
6. **Nota visible** bajo la tabla o gráfica: "Para proteger la privacidad, los
   valores menores a 5 se muestran como «< 5»."
7. **Exportaciones** aplican la misma supresión y llevan la nota y los filtros
   aplicados.
8. **Sin desglose hasta personas** desde una estadística anonimizada, salvo que
   el rol lo permita y el acceso quede registrado.

```ts
// server/utils/suppression.ts
export const SMALL_COUNT_THRESHOLD = 5

export type PublicCount = { value: number } | { suppressed: true }

export function suppressSmall(n: number): PublicCount {
  return n > 0 && n < SMALL_COUNT_THRESHOLD ? { suppressed: true } : { value: n }
}
```

```ts
// cliente: formatear sin conocer el valor real
const showCount = (c: PublicCount) => ('suppressed' in c ? `< ${SMALL_COUNT_THRESHOLD}` : fmt.value.int(c.value))
```

---

## Estados de una gráfica

Las gráficas siguen el contrato de [patterns.md](patterns.md#estados-de-datos):

| Estado | Gráfica |
|--------|---------|
| Carga | Skeleton con la forma: el marco del área de trazo a su altura real (`USkeleton class="h-60 w-full"`) dentro de la región `role="status"` de la vista |
| Vacío | `UEmpty variant="naked" size="sm"` en el lugar de la gráfica: "Sin solicitudes en este periodo"; mismo tratamiento en **todas** las gráficas [E-20] |
| Error | Si varias gráficas vienen de una petición, **una** región de error para todas; si cada una tiene su petición, cada una su error con reintento |
| Parcial | La gráfica que falló dice que no está disponible; las demás se muestran |

Un periodo sin datos (vacío) y una consulta que falló (error) **nunca** se ven
igual.

---

## Errores de la auditoría que no hay que repetir

| Id | Lo que se hizo | Lo correcto |
|----|----------------|-------------|
| E-01 | Paleta categórica de 12 colores armada con `primary-500`, `warning-500`, `success-500`, `error-500`… (rojo FI y rojo de error a 1.49:1 entre sí) | `--fi-chart-1…8`, sin estados; > 8 categorías → "Otros" |
| E-02 | Tres líneas iguales (total, favorables, adversos) distinguibles solo por verde/rojo; tooltip con una sola serie | patrón de línea + etiqueta directa; tooltip con todas las series; tabla alternativa |
| E-03 | Rojo de error para "Malestares individuales", verde para rangos de edad; mapa serie → color copiado en dos páginas y con choques | una serie = `--fi-chart-1`; un solo módulo de mapa con valores únicos |
| E-06 | Número en tinta sobre la cubeta más oscura (1.4:1); encabezados de 10 px | texto por cubeta (`seqText`); ≥ 12 px |
| E-07 | `text-[10px]` dentro de un `viewBox` de 900 unidades: ~4 px en móvil | `viewBox` al ancho real o etiquetas en HTML |
| E-10 | Tarjeta KPI `<button>` con un botón de ayuda dentro | `FiStat` con `to`; ayuda fuera del área clicable |
| E-16 | Cuatro diseños de KPI y cifras grandes sin `tabular-nums` | `FiStat` / `FiStatGrid` en todas las vistas |
| E-M2 | Botón de ayuda de 16 × 16 px junto a cada cifra | objetivo ≥ 24 px |
| E-M3 | Mapa de calor de `div` sin semántica de tabla; día y hora solo en un tooltip de hover | `<table>` con `th scope`; dato en la celda |
| D-02 | `violet-*`, `cyan-*` crudos para categorías de eventos | paleta categórica o neutro + ícono |
