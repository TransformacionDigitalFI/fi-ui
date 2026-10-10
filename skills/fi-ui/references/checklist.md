# Lista de revisión

Pásala antes de dar por terminada una vista o un componente, y al revisar el
trabajo de otro. Tres pasos, en este orden:

1. **Comandos** (sección 1): mecánicos, deben salir en cero para los archivos
   que tocaste.
2. **Revisión manual** (sección 2): lo que un grep no ve.
3. **Prueba en el navegador** (sección 3): temas, teclado, 320 px.

Los ids entre corchetes son hallazgos reales de la auditoría del consumidor de
referencia: cada regla existe porque alguien ya cometió ese error.

## 1. Comandos

Requieren ripgrep ≥ 13 (`rg`, con `--pcre2`). `SRC` es un arreglo; funciona
igual en bash y en zsh:

```bash
SRC=(app)                      # Nuxt 4
SRC=(src)                      # Vue + Vite
# Solo lo que cambiaste respecto a main:
SRC=($(git diff --name-only --diff-filter=AM origin/main...HEAD -- '*.vue' '*.ts' '*.css'))
```

Pega el bloque completo; cada sección imprime sus hallazgos bajo su título.

```bash
echo "== 1. Paletas crudas de Tailwind (incluye pizarra-* y oro-*, que no existen)"
rg -n --pcre2 --glob '*.{vue,ts,css}' '(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|shadow|accent|caret|placeholder)-(?:slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|pizarra|oro)-\d{2,3}\b' "${SRC[@]}"

echo "== 2. Blanco y negro literales (usa bg-elevated, text-highlighted, text-inverted)"
rg -n --pcre2 --glob '*.vue' '(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|divide)-(?:white|black)\b' "${SRC[@]}"

echo "== 3. Hex, rgb(), hsl(), oklch() literales"
rg -n --pcre2 --glob '*.{vue,ts,css}' --glob '!**/app.config.ts' '(?<!<template )(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|oklch)\(\s*[\d.]' "${SRC[@]}"

echo "== 4. Forma larga de tokens (usa text-muted, bg-elevated, text-fi-navy…)"
rg -n --glob '*.{vue,ts}' '\b(?:text|bg|border|ring|divide|outline|fill|stroke|from|via|to)-\(--(?:ui-(?:text|bg|border|color|primary|secondary|tertiary|success|info|warning|error)|fi-(?:navy|gold|header-bg))\b' "${SRC[@]}"

echo "== 5. Tokens privados y rgb(var(--…))"
rg -n --glob '*.{vue,ts,css}' -e '--fi-seed-' -e '--color-fi-' -e 'rgba?\(\s*var\(--(?:ui|fi)-' "${SRC[@]}"

echo "== 6. dark: en vistas, selectores de modo y UApp class=light"
rg -n --pcre2 --glob '*.vue' '(?<![\w-])dark:' "${SRC[@]}"
rg -n --pcre2 --glob '*.{vue,ts}' 'useColorMode|UColorMode(?:Button|Switch|Select)|colorMode\.preference\s*=|<UApp\b[^>]*class="[^"]*\blight\b' "${SRC[@]}"

echo "== 7. Texto menor de 12 px"
rg -n --pcre2 --glob '*.{vue,ts,css}' 'text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]|text-\[0?\.(?:[0-6]\d*|7[0-4]\d*)rem\]|font-size:\s*(?:(?:[0-9]|1[01])(?:\.\d+)?px|0?\.(?:[0-6]\d*|7[0-4]\d*)rem)' "${SRC[@]}"

echo "== 8. Rótulos ad hoc (usa .fi-label)"
rg -n --pcre2 --glob '*.vue' 'class="(?=[^"]*\buppercase\b)(?=[^"]*\btracking-)[^"]*"|\bui-label\b' "${SRC[@]}"

echo "== 9. <table> a mano (usa UTable)"
rg -n --glob '*.vue' '<table\b' "${SRC[@]}"

echo "== 10. role=tab/tablist escritos a mano (usa UTabs o UNavigationMenu)"
rg -n --glob '*.vue' 'role="tab(?:list)?"' "${SRC[@]}"

echo "== 11. Botón de solo ícono sin nombre accesible"
rg -n -U --pcre2 --glob '*.vue' '<UButton\b(?![^>]*(?:\blabel=|aria-label))[^>]*\s:?(?:leading-|trailing-)?icon=[^>]*/>' "${SRC[@]}"
rg -n -U --pcre2 --glob '*.vue' '<button\b(?![^>]*aria-label)[^>]*>\s*<UIcon\b[^>]*/>\s*</button>' "${SRC[@]}"

echo "== 12. @click en elementos no interactivos"
rg -n -U --pcre2 --glob '*.vue' '<(?:div|span|li|p|img|td|tr|article|section|UBadge|UCard|UIcon|UAvatar)\b[^>]*?\s(?:@click|v-on:click)\b' "${SRC[@]}"

echo "== 13. Hover invisible sobre blanco"
rg -n --glob '*.vue' 'hover:bg-(?:elevated|white)\b|hover:bg-\(--ui-bg-elevated\)' "${SRC[@]}"

echo "== 14. Movimiento sin motion-safe o de más de 200 ms"
rg -n --pcre2 --glob '*.{vue,css}' '(?<!motion-safe:)(?<![\w-])animate-(?:spin|pulse|bounce|ping)\b|\bduration-(?:[3-9]\d\d|\d{4,})\b' "${SRC[@]}"

echo "== 15. Opciones con value vacío (USelect/USelectMenu lanzan con '')"
rg -n --pcre2 --glob '*.{vue,ts}' "\bvalue:\s*(?:''|\"\")" "${SRC[@]}"

echo "== 16. Íconos fuera de Phosphor"
rg -n --pcre2 --glob '*.{vue,ts}' --glob '!**/app.config.ts' '\bi-(?:lucide|heroicons|mdi|tabler|material-symbols|simple-icons|carbon|fa6-[a-z]+|bi)-[a-z0-9-]+' "${SRC[@]}"

echo "== 17. Más de un h1 por archivo"
rg -c --with-filename --glob '*.vue' '<h1\b' "${SRC[@]}" | awk -F: '$2 > 1'

echo "== 18. confirm() nativo y theme-color propio"
rg -n --pcre2 --glob '*.{vue,ts}' '(?<!function )(?<![\w.])(?:window\.)?confirm\(|theme-color' "${SRC[@]}"
```

| # | Detecta | Regla | Falsos positivos aceptables |
|---|---------|-------|-----------------------------|
| 1 | `text-blue-600`, `bg-violet-100`, `text-pizarra-600`, `dark:text-oro-400` | Color solo por token [D-01, D-02, E-05] | Ninguno. `neutral-*`, `primary-*` y los de estado no salen: son alias del tema |
| 2 | `bg-white`, `text-black` | Superficies y texto semánticos | `text-white` dentro de un componente que vive en una isla o sobre un relleno sólido (mejor `text-inverted`) |
| 3 | `#CD171E`, `rgb(255 255 255 / .5)` | Nada de literales | PDFs, correos y canvas generados (no son UI de Nuxt UI); comentarios |
| 4 | `text-(--ui-text-muted)`, `bg-(--ui-bg-elevated)`, `text-(--fi-navy)` | Un solo dialecto [C-30, E-27] | Ninguno: todos tienen utilidad |
| 5 | `var(--fi-seed-primary)`, `var(--color-fi-tertiary-800)`, `rgb(var(--ui-primary))` | Capas privadas; las variables guardan colores completos | Ninguno |
| 6 | `dark:bg-success-950`, `useColorMode()`, `<UApp class="light">` | Solo claro [D-26, E-26, M-01, D-M3] | `dark:` en un componente que se renderiza dentro de una isla y necesita un valor distinto del token |
| 7 | `text-[11px]`, `text-[0.6875rem]` | Mínimo 12 px [C-11, D-30, E-15] | Ninguno |
| 8 | `text-xs font-bold uppercase tracking-wider`, `.ui-label` | Rótulos con `.fi-label` [C-11, D-17] | Clases del propio paquete |
| 9 | `<table class="w-full">` | `UTable` [D-13, E-12] | HTML de un PDF o de contenido Markdown; el único componente de mapa de calor del proyecto ([data-viz.md](data-viz.md#mapas-de-calor)) |
| 10 | `role="tablist"` sobre enlaces o botones | `UTabs` / `UNavigationMenu` [D-10, E-14] | Ninguno: los componentes ponen sus propios roles |
| 11 | `<UButton icon="i-ph-trash" @click="…" />` sin `aria-label` | Nombre accesible [C-10, E-08, D-08] | Botón cuyo nombre llega por `v-bind` de un objeto; los atributos con `=>` cortan la regex: usa también el script de abajo |
| 12 | `<div @click>`, `<UBadge @click>` | Controles reales [D-05, E-09] | `@click.stop` en un contenedor para frenar propagación (no es un control) |
| 13 | `hover:bg-elevated` en una tarjeta blanca | Hover visible [A-01, E-10] | Ninguno |
| 14 | `animate-spin` suelto, `duration-300` | ≤ 200 ms y `motion-safe:` [B-25, C-28] | `animate-spin` dentro de una regla CSS ya protegida por `prefers-reduced-motion` |
| 15 | `{ label: 'Todas', value: '' }` | Centinela `'all'`/`'none'`: reka-ui reserva `''` y `SelectItem` lanza, congelando la navegación | Un `<select>` nativo sí acepta `''` |
| 16 | `i-lucide-*`, `i-simple-icons-*` | Phosphor en la app [A-22, B-26] | `fa6`/`bi` dentro de los datos de `FiTopBar`/`FiFooter` |
| 17 | Dos `<h1>` en el mismo archivo | Un `h1` por vista [C-M1] | `h1` alternativos con `v-if`/`v-else` (pasos de un asistente) |
| 18 | `window.confirm(`, `<meta name="theme-color">` | Confirmación con `UModal`; el paquete gestiona `theme-color` | Ninguno |

### Script: botones `solid primary` y botones de solo ícono

El "un solo `solid primary` por vista" no se puede contar con grep: en
`UButton`, sin `color` el color es `primary` y sin `variant` la variante es
`solid`. Guarda esto en un archivo temporal (fuera del repo) y córrelo con
`node fi-ui-check.mjs app`:

```js
// fi-ui-check.mjs: cuenta UButton solid primary por archivo y busca
// botones de solo ícono sin nombre accesible.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? 'app'
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.vue')) files.push(path)
  }
}
walk(root)

// Lee una etiqueta de apertura respetando comillas: un `=>` dentro de un
// atributo no la corta.
function readTag(src, start) {
  let i = start
  let quote = null
  while (i < src.length) {
    const ch = src[i]
    if (quote) { if (ch === quote) quote = null }
    else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '>') break
    i++
  }
  const raw = src.slice(start, i + 1)
  const attrs = {}
  for (const m of raw.matchAll(/([:@#]?[\w.-]+)(?:=("[^"]*"|'[^']*'))?/g)) attrs[m[1]] = m[2]?.slice(1, -1) ?? true
  return { attrs, selfClosing: raw.endsWith('/>') }
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length
let problems = 0
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const tpl = src.indexOf('<template')
  if (tpl < 0) continue
  const solids = []
  for (const m of src.slice(tpl).matchAll(/<UButton\b/g)) {
    const at = tpl + m.index
    const { attrs, selfClosing } = readTag(src, at)
    const color = attrs[':color'] ? '(dinámico)' : (attrs.color ?? 'primary')
    const variant = attrs[':variant'] ? '(dinámico)' : (attrs.variant ?? 'solid')
    if (color === 'primary' && variant === 'solid') solids.push(lineOf(src, at))
    const hasIcon = ['icon', ':icon', 'leading-icon', ':leading-icon', 'trailing-icon', ':trailing-icon'].some(k => k in attrs)
    const named = ['label', ':label', 'aria-label', ':aria-label', 'aria-labelledby', ':aria-labelledby'].some(k => k in attrs)
    if (hasIcon && !named && selfClosing) {
      problems++
      console.log(`${file}:${lineOf(src, at)}  UButton de solo ícono sin aria-label`)
    }
  }
  if (solids.length > 1) {
    problems++
    console.log(`${file}  ${solids.length} UButton solid primary (líneas ${solids.join(', ')}): revisa que solo uno sea visible a la vez`)
  }
}
console.log(problems ? `\n${problems} hallazgos` : 'Sin hallazgos')
process.exitCode = problems ? 1 : 0
```

Dos `solid primary` en el mismo archivo pueden ser legítimos si nunca se ven a
la vez (uno en el encabezado y otro dentro de un `UModal`, o en ramas
`v-if`/`v-else`). Lo que no vale: encabezado + estado vacío + barra de
herramientas con tres rojos sólidos a la vista [C-29, E-17]. Si el proyecto
cambió `defaultVariants` de Nuxt UI, ajusta los valores por defecto del
script.

## 2. Revisión manual

### Tokens y color

- [ ] Página sin fondo propio; tarjetas con `FiSectionCard` (o
      `UCard`/`UPageCard`, que fiAppConfig ya pone blancas); nada de
      `bg-elevated border border-default rounded-2xl` copiado a mano; `UEmpty`
      en `variant="naked"` dentro de una tarjeta [A-01, B-14].
- [ ] `primary` solo en la acción principal, la navegación activa y acentos de
      marca. Nunca en avisos informativos, numeración, categorías, filtros
      seleccionados ni chips de "hoy" [B-08, E-13].
- [ ] Todo estado usa `FiStatusBadge` y la tabla de su dominio
      (`Record<DomainStatus, FiStatus>`); el mismo valor tiene el mismo color en
      todas las vistas [D-M4, E-04].
- [ ] Ninguna categoría usa `success`/`warning`/`error`/`info` [D-03, C-19].
- [ ] Texto de estado con el token (`text-error`), no con `-500`/`-600`;
      íconos blancos sobre relleno con ≥ 3:1 [D-06, D-M2].
- [ ] Sin `text-primary` sobre `bg-muted` (4.35:1); sin oro como texto
      sobre claro; en una isla azul marino, sin `text-dimmed` ni
      `text-primary` [A-02].
- [ ] Sin `opacity-*` para atenuar texto o acciones; una tarjeta restringida
      atenúa su contenido, nunca su botón [C-09, D-06].
- [ ] Gráficas con `--fi-chart-*`; colores de estado solo para valores que son
      buenos o malos [E-01, E-03].

### Tipografía

- [ ] Un solo `h1`, el de `FiPageHeader`; el `UDashboardNavbar` no aporta otro
      (slot `#left` con texto de ubicación). Solo sin `FiPageHeader` el
      `title` del navbar es el h1 [C-M1].
- [ ] Niveles sin saltos: `h2` de sección `text-lg font-semibold text-fi-navy`,
      `h3` de tarjeta `text-base font-semibold text-highlighted` [C-26, E-31].
- [ ] Rótulos con `.fi-label`; `.fi-tag` como antetítulo, máximo uno por vista
      o sección y siempre seguido de un encabezado [E-15].
- [ ] Cifras con `tabular-nums` [D-18, E-16]; texto en caja de oración en
      i18n (las versalitas las pone el CSS).
- [ ] `.fi-serif-accent` y `.fi-eyebrow` solo en el sitio público.

### Componentes

- [ ] Se usó el `Fi*` que existe: `FiPageHeader`, `FiSectionCard`, `FiStat`,
      `FiStatGrid`, `FiStatusBadge`, `FiIconBadge`, `FiCtaBand`, `FiBackButton`
      [C-13, C-14, B-12, B-13].
- [ ] Nuxt UI en vez de recetas: `UTable`, `UTabs`/`UNavigationMenu`, `UAlert`,
      `UEmpty`, `UStepper`, `UTimeline`, `UInputTags`, `UFormField`
      [D-14, E-21, E-24].
- [ ] Un solo `solid primary` visible por vista o diálogo; secundarias
      `outline`/`soft` neutral; terciarias `ghost`/`link`; agregar fila =
      `neutral ghost` [C-29, E-17].
- [ ] Pie de diálogo: `[Cancelar (neutral outline)] [Acción]` a la derecha, en
      todos los diálogos [D-22, E-19].
- [ ] Un toggle seleccionado es `neutral` (no `primary solid`) y lleva
      `aria-pressed` [E-13, E-17].
- [ ] Ningún `:ui` ni `class` cambia el color de un componente de Nuxt UI.
- [ ] Tablas: primera columna = identificador humano; números a la derecha
      con `tabular-nums` y `whitespace-nowrap` (por columna, en `meta.class`);
      texto largo con ancho mínimo (`meta: { class: { td: 'min-w-56 max-w-md' } }`);
      ≤ 2 acciones por fila + `UDropdownMenu`; `UPagination` con
      `active-color="neutral"` [C-16].
- [ ] Tarjeta clicable: `<article class="relative">`, un enlace o botón
      principal con `after:absolute after:inset-0`, acciones secundarias con
      `relative z-10`. Nunca un botón dentro de otro [D-04, E-10].

### Estados y retroalimentación

- [ ] Carga: `USkeleton` con la forma del contenido; spinner solo en el botón
      que dispara la acción (`:loading`) [D-20, C-27].
- [ ] Vacío distingue primer uso, sin resultados (con "Limpiar filtros") y todo
      al día; su CTA no compite con el del encabezado [C-21, D-21].
- [ ] Error con "Reintentar"; nunca "sin datos" cuando la carga falló; sección
      parcial explica qué falta [E-20].
- [ ] Error de campo o sección en línea, persistente, con `role="alert"` o
      `aria-live`; el toast solo confirma algo transitorio [D-15, B-M4].
- [ ] Destructivo o irreversible: `color="error"`, `UModal` que nombra el objeto
      y la consecuencia, botón con verbo ("Eliminar categoría"), foco inicial en
      Cancelar; o deshacer [C-02, D-07, E-18].
- [ ] A un visitante nunca se le muestra `error.message` crudo [B-M5].

### Accesibilidad

- [ ] Todo control de solo ícono tiene `aria-label` traducido; `UTooltip` es
      adicional, no lo nombra [C-10, E-08].
- [ ] Nada de `@click` en `div`, `span`, `li`, `UBadge` ni `UCard` [D-05, E-09].
- [ ] Foco visible en todo; un elemento nativo usa
      `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`
      [D-19].
- [ ] `aria-pressed` en toggles, `aria-expanded` en lo que despliega,
      `aria-current="page"` en navegación (`UNavigationMenu` lo pone) [C-18, E-25].
- [ ] Formularios: `UFormField` con etiqueta arriba, "(opcional)" en vez de
      asteriscos, error asociado al campo, `autocomplete` en datos personales;
      nunca el placeholder como etiqueta [B-23, E-22].
- [ ] Un `<main id="main-content">` en el layout, enlace "Saltar al
      contenido" (FiHeader o el layout del dashboard), landmarks coherentes
      [B-M1, C-20, E-29].
- [ ] En un asistente, al cambiar de paso el foco va al título del paso
      [B-M2].
- [ ] Objetivos ≥ 24 px (ayuda de métrica incluida) [E-M2].
- [ ] Lo interactivo de una línea del tiempo o un mapa de calor se alcanza con
      teclado [D-M1, E-M3].
- [ ] Un enlace que abre otra pestaña lo dice [C-M5].

### i18n y contenido

- [ ] Ningún texto visible literal en plantilla o script: también `aria-label`,
      `title`, `placeholder`, toasts y nombres de archivo de exportación [C-35].
- [ ] Claves del dominio propio, sin reusar las de otro dominio [D-33].
- [ ] Vocabulario del proyecto (en PSM, no clínico: malestar, acompañamiento,
      historial) [B-21, D-24].
- [ ] Al cambiar texto visible no se renombró ningún identificador que viene de
      la API.
- [ ] Fechas y números con `Intl` en es-MX (fechas de calendario sin
      correrse un día); sin datos personales en la URL, tampoco la búsqueda
      por nombre.

### Responsive

- [ ] A 320 px no hay scroll horizontal de página; las tablas desbordan dentro
      de su contenedor [E-23].
- [ ] Las acciones del encabezado bajan en móvil (`FiPageHeader` lo hace).
- [ ] Sin `100vh` en vistas de trabajo; `dvh`/`svh` o el scroll del panel
      [D-29].
- [ ] Rejillas a una columna en móvil; ningún stepper ni barra fuerza scroll
      horizontal [B-29].
- [ ] Detalle y filtros en `USlideover`/`UDrawer` en pantallas chicas.

## 3. Prueba en el navegador

- [ ] Abre la vista con `?tema=luto`, `?tema=8m` y `?tema=prevencion-suicidio`.
      Si algo no cambia con el tema o se vuelve ilegible, hay un color que no
      sale de un token.
- [ ] `<html>` sin clase `dark`; el sidebar y el encabezado siguen oscuros.
- [ ] Recorre la vista solo con teclado: orden lógico, foco siempre visible,
      ningún foco escondido bajo un encabezado fijo, diálogos que atrapan y
      devuelven el foco.
- [ ] A 320 px de ancho y con zoom al 200 %: nada se corta ni se encima.
- [ ] Con `prefers-reduced-motion: reduce` emulado, nada se mueve.
- [ ] Con la red lenta: aparecen skeletons, no "sin datos"; con la petición
      fallando: error con "Reintentar".
- [ ] El `typecheck` y el `lint` del proyecto no reportan nada nuevo.
