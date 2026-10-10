# Fundamentos: color, superficies, tipografía y forma

Todo lo visual de fi-ui sale de tokens. Si una vista necesita un color, un
tamaño o un radio que no está aquí, la respuesta casi siempre es "usa el token
que ya existe", no "añade uno". Los ids entre corchetes (`A-01`, `D-06`…) son
hallazgos de la auditoría que motivan la regla.

## 1. Cómo está hecho el color

Tres capas; un tema especial solo toca la primera.

| Capa | Variables | Quién la escribe | ¿La usas? |
|------|-----------|------------------|-----------|
| 1. Semillas | `--fi-seed-primary`, `--fi-seed-secondary`, `--fi-seed-tertiary` | los temas (`themes.css`) | Nunca |
| 2. Escalas | `--color-fi-{rol}-{50…950}` (OKLCH desde la semilla = 500); fijas: `--color-fi-neutral-*`, `--color-fi-pizarra-*` | `tokens.css` | Nunca directamente |
| 3. Nuxt UI | `--ui-color-{rol}-*`, `--ui-primary`, `--ui-bg`, `--ui-text-muted`… | Nuxt UI desde `app.config` (`ui.colors.primary = 'fi-primary'`) + superficies de `tokens.css` | Sí, **a través de utilidades** |

Identidad FI:

| Rol | Semilla | Qué es |
|-----|---------|--------|
| `primary` | `#CD171E` | Rojo FI, exacto del portal ingenieria.unam.mx |
| `secondary` | `#8A6A00` | Oro UNAM, oscurecido para AA |
| `tertiary` | `#3A72A8` | Azul pizarra de los micrositios FI |
| `neutral` | grafito del portal (fijo) | Componentes neutros, texto, chrome oscuro |

### API pública de color

| Quieres | Escribe |
|---------|---------|
| Texto normal | nada (el `body` ya trae `text-default`) |
| Texto fuerte, título de tarjeta | `text-highlighted` |
| Texto secundario | `text-muted` |
| Metadatos, texto terciario | `text-dimmed` |
| Texto sobre relleno sólido de color | `text-inverted` |
| Fondo de página | `bg-default` (ya lo pinta el `body`) |
| Tarjeta, overlay, input | `bg-elevated` |
| Banda tenue, fila seleccionada | `bg-muted` |
| Hover de controles neutros, skeleton, chip neutro | `bg-accented` |
| Borde de tarjeta y divisor entre filas / separación secundaria | `border-default`, `divide-default` / `border-muted` |
| Color de un rol | `text-primary`, `bg-primary`, `bg-primary/10`, `ring-primary`, `border-secondary`… |
| Estado | `text-success`, `bg-warning/10`, `text-error`, `ring-info/25`… o mejor `FiStatusBadge` / `UAlert` |
| Paso concreto de un rol (sin utilidad semántica que sirva) | `bg-primary-50`, `text-secondary-300`, `bg-success-50` (siguen al tema) |
| Títulos editoriales | `text-fi-navy` |
| Filete, rombo, viñeta | `bg-fi-gold`, `bg-fi-gold/60`, `border-fi-gold` |
| Fondo de encabezado/sidebar oscuro | `bg-fi-header` |
| Serie de una gráfica | `bg-fi-chart-1…8`, `fill-fi-chart-1`, `stroke-fi-chart-2`, `fill="var(--fi-chart-1)"` |
| Paso de la rampa secuencial | `bg-fi-chart-seq-1…5`, `var(--fi-chart-seq-3)` |
| CSS o SVG a mano | `var(--ui-primary)`, `var(--ui-text-muted)`, `var(--fi-navy)` |

Variables CSS públicas del paquete: `--fi-navy`, `--fi-gold`, `--fi-header-bg`,
`--fi-header-offset`, `--fi-ribbon`, `--fi-topbar-hover` (fondo de hover de la
cinta), `--fi-chart-*`, `--fi-chart-seq-*`. En utilidades, `text-fi-navy`,
`bg-fi-gold/60`, `bg-fi-header`, `bg-fi-chart-3`… (sección 4). Privadas
(pueden cambiar sin aviso): `--fi-seed-*`, las escalas `--color-fi-{rol}-*`,
`--color-fi-neutral-*` y `--color-fi-pizarra-*`, y `--fi-topbar-offset`.

### No escribas → escribe

| No escribas | Escribe | Por qué |
|-------------|---------|---------|
| `text-(--ui-text-muted)`, `bg-(--ui-bg-elevated)`, `border-(--ui-border)` | `text-muted`, `bg-elevated`, `border-default` | Un solo dialecto; los greps de revisión lo buscan así [C-30, E-27] |
| `text-(--fi-navy)`, `bg-(--fi-gold)` | `text-fi-navy`, `bg-fi-gold` | La forma larga sigue funcionando, pero la canónica es la utilidad [B-19] |
| `text-(--ui-color-warning-700)` | `text-warning` (texto) o `text-warning-700` | El token runtime ya es el paso legible [D-06] |
| `bg-white`, `text-black`, `text-gray-900` | `bg-elevated`, `text-highlighted` | No siguen al tema ni a las islas |
| `text-gray-500`, `bg-slate-100` | `text-muted`, `bg-accented` | Paleta cruda |
| `bg-blue-50 text-blue-700` (aviso) | `UAlert color="info" variant="subtle"` | Callout a mano [D-14] |
| `text-violet-500`, `bg-indigo-100` (categoría) | `UBadge color="tertiary" variant="subtle"` o `--fi-chart-*` | Un tema no los puede re-sembrar [D-02] |
| `text-pizarra-600`, `bg-oro-100` | `text-muted`, `bg-accented`, `text-tertiary`, `bg-secondary/10` | **No existen**: Tailwind no genera nada y el estado activo desaparece [D-01, E-05] |
| `#CD171E`, `rgb(205 23 30)` | `text-primary` | Hex prohibido en proyectos |
| `rgb(var(--ui-primary))` | `var(--ui-primary)` | Las variables guardan colores completos, no ternas RGB |
| `var(--fi-seed-primary)`, `var(--color-fi-tertiary-800)` | `var(--ui-primary)`, `var(--fi-navy)` | Capas privadas |
| `text-(--ui-bg)` sobre un relleno primario | `text-inverted` | Un fondo no es un color de texto [D-27] |
| `opacity-50` / `opacity-70` para atenuar texto | `text-muted` / `text-dimmed` | La opacidad baja el contraste de todo, también de la acción [C-09, D-06] |

## 2. Superficies

fi-ui **invierte** las superficies de Nuxt UI: la página es pizarra y las
tarjetas son blancas, como los micrositios FI.

| Superficie | Token | Clase | Valor | Para |
|------------|-------|-------|-------|------|
| Página | `--ui-bg` | `bg-default` | `#EDF2F7` (pizarra-50) | Fondo de toda vista; no lo repintes |
| Tarjeta | `--ui-bg-elevated` | `bg-elevated` | `#FFFFFF` | Tarjetas, overlays, inputs, tablas |
| Banda tenue | `--ui-bg-muted` | `bg-muted` | `#D6E4F5` (pizarra-100) | `thead`, bandas de sección, fila seleccionada |
| Acento | `--ui-bg-accented` | `bg-accented` | `#C3D6EE` (entre pizarra-100 y 200) | Hover de controles neutros y de lo que ya está en `bg-muted`, skeleton, chips |
| Borde | `--ui-border` | `border-default` | `#6A96C0` (3.1:1 sobre blanco) | Borde de tarjeta |
| Borde tenue | `--ui-border-muted` | `border-muted` | `#B0C9E6` | Separaciones secundarias dentro de un panel interno (entre filas: `divide-default`) |
| Borde de control | `--ui-border-accented` | `border-accented` | `#5284B4` (3.95 sobre blanco, 3.51 sobre la página, 3.06 sobre `bg-muted`) | Lo usan inputs, selects, checkbox, radio y el botón neutro outline |

`bg-muted` y `bg-accented` son tintes distintos a propósito: el hover de algo
que ya está en `bg-muted` (un botón `soft`, una banda) necesita un paso más.

Anatomía mínima (página → tarjeta → panel interno; nunca más de tres niveles):

```vue
<template>
  <!-- La página ya es bg-default: no le pongas fondo al contenedor -->
  <section class="rounded-2xl border border-default bg-elevated p-4 sm:p-5">
    <h2 class="text-lg font-semibold text-fi-navy">{{ t('profile.contact.title') }}</h2>
    <div class="mt-4 rounded-xl bg-muted p-4">
      <!-- panel interno: banda tenue, sin otro borde -->
    </div>
  </section>
</template>
```

Mejor aún: `FiSectionCard` ya es esa tarjeta (ver components.md).

### Qué corrige fi-ui y qué te toca a ti

Nuxt UI asume página blanca y tarjetas grises. `fiAppConfig` corrige los
componentes que dependen de eso, para que funcionen igual sobre la página y
sobre una tarjeta blanca [A-01, C-06]. La regla que aplica en cada componente: superficie de overlay o de campo →
`bg-elevated` (blanco); tinte de reposo, hover o selección → `bg-muted`; tinte
más fuerte (activo, hover sobre un relleno) → `bg-accented`.

| Componente | Corrección que ya trae fi-ui |
|------------|------------------------------|
| `UButton` neutral `ghost`/`outline`/`soft`/`subtle` | Hover y activo visibles (`bg-accented`), nunca `bg-elevated`; `outline` en reposo es blanco |
| `UModal`, `USlideover`, `UDrawer`, `UPopover`, `UTooltip`, `UDropdownMenu`, `UContextMenu`, menús de `USelect`/`USelectMenu`/`UInputMenu`, `UCommandPalette`, `UToast` | Contenido blanco (`bg-elevated`); en `UModal` y `USlideover`, pie alineado a la derecha |
| `UInput`, `UTextarea`, `USelect`, `USelectMenu`, `UInputMenu`, `UInputNumber`, `UInputTags`, `UInputDate`, `UInputTime`, `UPinInput` | `outline` blanco, borde ≥ 3:1; `soft`/`subtle` en `bg-muted` |
| `UTable` | Es su propia tarjeta (`rounded-2xl border border-default bg-elevated`), `thead` en `bg-muted`, `th` azul marino en versalitas, hover y selección visibles; `td` sin `whitespace-nowrap` global |
| `UBadge`, `UAlert`, `UKbd` `soft`/`subtle` | Relleno visible sobre blanco y sobre pizarra |
| `UCard`, `UPageCard` | La tarjeta FI: `outline` blanco, `rounded-2xl`; con `to`, hover visible |
| `UEmpty` | `outline` blanco; `soft`/`subtle` en `bg-muted` |
| `USkeleton` | `bg-accented` (visible sobre blanco) y quieto con `prefers-reduced-motion` |
| `UTabs` `pill`, `UTimeline`, `UAvatar` neutro, `USwitch`, `USlider`, `UStepper`, `URadioGroup` | Pista, separador, indicador y círculos en `bg-muted`/`bg-accented`; perillas blancas |
| `UNavigationMenu`, `UTree`, `UListbox`, `UCalendar` | Activo y resaltado con tintes de pizarra |

Lo que **tú** debes hacer:

- `UEmpty`: `variant="naked"` dentro de la superficie que ocuparía el
  contenido (una tarjeta, el `#empty` de una tabla); las otras variantes ya
  se ven, pero añaden una caja dentro de la caja.
- En el dashboard, la tarjeta es `FiSectionCard` (encabezado, acciones y pie
  resueltos); `UCard` queda para casos sin encabezado.
- No uses `hover:bg-elevated` ni `hover:bg-white` en algo que ya es blanco: es
  un hover invisible [E-10]. Usa `hover:bg-muted` o `hover:bg-accented`.
- La separación la da el borde. No añadas `shadow-*` a tarjetas de contenido;
  lo que flota (popover, menú, toast) ya trae su sombra.

## 3. Roles de color, estados y contraste

### Roles de marca

| Rol | Úsalo para | Nunca para |
|-----|-----------|------------|
| `primary` (rojo FI) | La acción principal (un solo `solid` por vista o diálogo), navegación activa, foco, un acento de marca puntual | Error, alerta, peligro, notas informativas, numeración, categorías, filtros seleccionados, chips de "hoy" [B-08, E-13] |
| `secondary` (oro) | Acentos editoriales, badges de una categoría secundaria | Texto largo; botón principal |
| `tertiary` (azul pizarra) | Acentos de marca sobrios, categorías, íconos de cifras, enlaces de apoyo | Estados |
| `neutral` (grafito) | Botones secundarios y terciarios, chips, toggles seleccionados, badges de "inactivo" | — |

El rojo FI y el rojo de error se parecen (`#CD171E` contra el `red-800` del
token `error`: 1.49:1 de contraste entre sí). Por eso **el color nunca basta
para decir "error"**:
siempre ícono + texto, y las acciones destructivas llevan confirmación
[A-03, B-09].

### Mapa de estados (único para todo el proyecto)

| Estado | `color` | Significa | Ícono por defecto de `FiStatusBadge` |
|--------|---------|-----------|--------------------------------------|
| `success` | green | completado, vigente, abierto, aprobado, publicado | `i-ph-check-circle` |
| `warning` | amber | pendiente, por vencer, plazo vencido que pide acción, degradado, requiere revisión | `i-ph-clock` |
| `error` | red | fallo, bloqueado, rechazado, riesgo | `i-ph-x-circle` |
| `info` | sky | informativo, en curso, programado, novedad | `i-ph-info` |
| `neutral` | grafito | borrador, inactivo, cerrado, archivado, cancelado, descartado, vigencia terminada | `i-ph-minus-circle` |

fi-ui provee estos cuatro colores de estado por defecto; el proyecto puede
cambiarlos en su `app.config`, pero entonces el contraste es su
responsabilidad.

Cada dominio declara **una** tabla de su estado al estado FI, en un solo
archivo, y todas las vistas (tabla, calendario, línea del tiempo, detalle) la
usan. El mismo valor nunca cambia de color entre vistas [D-M4, D-M5]:

```ts
// app/utils/presenters/request-status.ts
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
<FiStatusBadge
  :status="REQUEST_STATUS_TONE[request.status]"
  :label="t(`requests.status.${request.status}`)"
/>
```

Reglas:

- Estado = ícono + texto + color. Nunca un punto de color solo, nunca texto
  coloreado sin palabra [D-06, B-10].
- Máximo 5–6 estados distintos visibles en una vista.
- Una **categoría** (tipo de evento, servicio, área) no es un estado: va en
  `neutral`, `tertiary` o `secondary` `subtle`, o con la paleta de gráficas.
  Nunca verde/ámbar/rojo para un tipo [D-02, D-03, C-19, E-04].
- Una alerta de riesgo del dominio (p. ej. riesgo para una persona) y un error
  del sistema llevan ícono y etiqueta distintos aunque compartan `error`.

Casos frontera (la pregunta es **¿alguien tiene que hacer algo?**):

| Estado del dominio | `status` | Por qué |
|--------------------|----------|---------|
| Borrador | `neutral` + `icon="i-ph-pencil-simple"` | Aún no cuenta; no pide acción a nadie más |
| Publicado, vigente | `success` | Está funcionando |
| Por vencer (publicado, vence en ≤ N días) | `warning` + `icon="i-ph-hourglass-medium"` | Pide revisar antes de la fecha |
| Vencido: terminó su vigencia (convocatoria, aviso, promo) | `neutral` + `icon="i-ph-calendar-x"` | Fin natural, nadie tiene que actuar |
| Vencido: plazo incumplido (solicitud sin respuesta) | `warning`; un segundo escalón de riesgo, `error` | Pide acción; si el dominio tiene dos umbrales ("Espera 5 días" / "Fuera de plazo"), el segundo es riesgo |
| Archivado | `neutral` + `icon="i-ph-archive"` | Retirado a propósito |
| Rechazado (la petición no procede y alguien debe enterarse) | `error` | Desenlace negativo que se comunica |
| Descartado, cancelado, no asistió | `neutral` | Desenlace normal, sin falla |
| En curso, programado | `info` | Nunca `primary` |

Si varios estados de una misma vista caen en `neutral` (borrador, archivado,
vencido), cada uno lleva **su ícono** además de su texto: el color no los
distingue.

### Contraste: qué está garantizado

fi-ui reasigna en modo claro los tokens runtime de estado (`--ui-success`,
`--ui-info`, `--ui-warning`, `--ui-error`) al paso **800** de su paleta: el
más claro que pasa en las tres superficies (con 700 fallan los cuatro sobre
`bg-muted`; tests/contrast.test.ts lo comprueba). Así `text-success`, los
`UBadge` `soft`/`subtle` y los `UButton` sólidos con texto blanco pasan AA
(4.5:1) sobre `bg-default`, `bg-elevated` y `bg-muted`. Con el paso 500 de
Tailwind no pasaba ninguno (sobre pizarra: success 1.97, info 2.40, warning
1.90, error 3.38) [A-03, B-01]. Lo mismo hace con los roles de marca:
`--ui-secondary` y `--ui-tertiary` bajan al paso 600; `--ui-primary` se queda
en 500 (el rojo exacto del portal).

- **Texto de estado:** siempre el token (`text-error`, `text-warning`). No
  elijas pasos a mano.
- **Íconos y puntos:** pueden usar `-500`/`-600`. Pero un **ícono blanco sobre
  un punto de color** necesita ≥ 3:1: usa el token (`bg-success`) o `-700`,
  nunca `-500` (blanco sobre amber-500 = 2.13:1) [D-M2].

Roles de marca como texto (tema FI, medido):

| Texto | `bg-default` | `bg-elevated` | `bg-muted` |
|-------|--------------|---------------|------------|
| `text-primary` | 4.99 ✓ | 5.62 ✓ | **4.35 ✗** (peor tema: 3.95) |
| `text-secondary` (paso 600) | 6.24 ✓ | 7.03 ✓ | 5.45 ✓ |
| `text-tertiary` (paso 600) | 6.20 ✓ | 6.98 ✓ | 5.41 ✓ |
| `text-fi-navy` | 10.7 ✓ | 12.0 ✓ | 9.3 ✓ |
| `text-fi-gold` | 2.7 ✗ | 3.0 ✗ | 2.3 ✗ — **el oro es decorativo** |
| `text-muted` / `text-dimmed` | 10.0 / 6.4 ✓ | 11.2 / 7.2 ✓ | 8.7 / 5.6 ✓ |

Primario, secundario y terciario pasan sobre la página y las tarjetas en
**todos** los temas (el peor: `text-primary` de `prevencion-suicidio` sobre la
página, 4.53).

- **Sobre `bg-muted` no pongas `text-primary`**: queda bajo 4.5:1 en todos
  los temas [A-02]. Un enlace sobre una banda tenue va en `text-fi-navy`
  (subrayado). `text-secondary` y `text-tertiary` sí pasan ahí.
- El texto primario **sobre su propio tinte** (badge `soft`, botón `soft`,
  alerta `soft`, enlace activo de un menú) ya lo baja fi-ui al paso 600
  (`fiPrimaryOnTint`); no lo corrijas a mano.
- El `UButton` sólido `primary` conserva `#CD171E` exacto (5.6:1 con blanco) en
  el tema FI; cada tema especial está probado con texto blanco.
- Nada de texto pequeño sobre `bg-fi-gold`, ni oro como color de texto sobre
  superficies claras.
- Dentro de una isla oscura, ver la sección 11.

### Temas especiales y estados

Varios temas tiñen el primario con un tono de estado: `salud-mental` es verde,
`25n` naranja, `cancer-mama` rosa cercano al rojo. Por eso `primary` jamás
comunica un estado: si un botón o un chip rojo FI "significa" algo, ese día
significará otra cosa [M-04].

## 4. Utilidades editoriales

Siguen al tema activo y aceptan opacidad (`bg-fi-gold/60`).

| Utilidad | Valor | Úsala para | No |
|----------|-------|-----------|----|
| `text-fi-navy` | `--fi-navy` (tertiary-800; `#1A3856` en tema FI) | `h1`, `h2`, títulos de modal y slideover, cifras de KPI, `th` | Texto corrido; dentro de islas oscuras |
| `bg-fi-navy` | `--fi-navy` | Rellenos editoriales: `.fi-tag`, `FiStepBadge`, `FiCtaBand` (isla) | Fondo de tarjetas de contenido |
| `border-fi-navy` | `--fi-navy` | Acento izquierdo de una cita o bloque destacado | Bordes de tarjeta |
| `bg-fi-gold`, `border-fi-gold`, `text-fi-gold` | `--fi-gold` (secondary-400) | Filetes, rombo, viñetas, íconos decorativos | Texto sobre claro; fondo bajo texto |
| `bg-fi-header` | `--fi-header-bg` (`#1E2125`) | Fondo del encabezado público y del sidebar (islas) | Contenido |
| `bg-fi-chart-1…8`, `bg-fi-chart-seq-1…5` (y `text-`, `fill-`, `stroke-`) | `--fi-chart-*` | Marcas de gráficas ([data-viz.md](data-viz.md)) | Decorar, categorías fuera de una gráfica |

`--fi-navy` y `--fi-gold` son **roles**, no tonos: en `prevencion-suicidio` el
"oro" es lavanda y en `luto` el "azul marino" es gris. Elígelos por función
(tinta de título, filete), nunca porque "quiero azul" [A-19].

Portada que llena la primera pantalla bajo `FiHeader`:
`min-h-[calc(100svh-var(--fi-header-offset))]`.

## 5. Paleta de gráficas

- `--fi-chart-1` … `--fi-chart-8`: paleta categórica derivada de los roles
  FI (azul marino, azul pizarra, oro, grafito y mezclas entre ellos), **sin
  tonos de estado**, cada color ≥ 4.8:1 contra blanco y vecinas
  distinguibles también con daltonismo. **Fija:** un tema especial no
  repinta las gráficas (una serie conserva su color de un día a otro).
- `--fi-chart-seq-1` … `--fi-chart-seq-5`: rampa secuencial de azul pizarra
  (claro → oscuro) para mapas de calor, también fija. Texto encima:
  `text-default` en los pasos 1–3, blanco en 4–5.
- Utilidades `bg-fi-chart-N`, `fill-fi-chart-N`, `stroke-fi-chart-N`,
  `bg-fi-chart-seq-N`; en SVG también `fill="var(--fi-chart-N)"`.
- Verde/ámbar/rojo solo cuando el valor **es** bueno/malo, nunca para
  distinguir series [E-01, E-02, E-03].

Ejes, leyendas, etiquetas directas y alternativa en tabla: [data-viz.md](data-viz.md).

## 6. Tipografía

Familias: **Inter** para todo, **Playfair Display** solo para acentos
editoriales del sitio público (`.fi-serif-accent`, `.fi-eyebrow`). Monoespaciada:
la del proyecto.

### Escala (la define fi-ui en `@theme`; reemplaza la de Tailwind)

| Clase | Tamaño / interlínea | px | Uso |
|-------|---------------------|----|-----|
| `text-xs` | 0.8125rem / 1.25rem | 13 | `.fi-label`, metadatos, badges `xs`. **El mínimo.** |
| `text-sm` | 0.9375rem / 1.375rem | 15 | Celdas de tabla, descripciones, ayudas de campo |
| `text-base` | 1.0625rem / 1.625rem | 17 | Cuerpo, inputs, botones `md` |
| `text-lg` | 1.1875rem / 1.75rem | 19 | `h2` de sección |
| `text-xl` | 1.3125rem / 1.875rem | 21 | Subtítulos destacados |
| `text-2xl` | 1.5625rem / 2rem | 25 | `h1` en móvil, cifras de KPI |
| `text-3xl` y mayores | los de Tailwind | 30+ | `h1` desde `sm`, titulares públicos |

`text-sm` aquí mide 15 px, no 14: no lo "compenses" con tamaños arbitrarios.
**Prohibido** `text-[10px]`, `text-[11px]`, `text-[0.7rem]` y cualquier texto
< 12 px [C-11, D-30, E-15].

### Jerarquía de encabezados

| Elemento | Etiqueta | Clases | Lo pone |
|----------|----------|--------|---------|
| Título de la vista | `h1` (uno solo) | `text-2xl sm:text-3xl font-bold tracking-tight text-fi-navy` | `FiPageHeader` |
| Sección | `h2` | `text-lg font-semibold text-fi-navy` | `FiSectionCard` (`headingLevel` 2) |
| Tarjeta o subsección | `h3` | `text-base font-semibold text-highlighted` | `FiSectionCard` (`headingLevel` 3) |
| Sección editorial pública | `h2` | `text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-fi-navy` | `FiSectionHeading` |
| Título de modal y slideover | — | `font-bold text-fi-navy` | `fiAppConfig` |
| Cifra | — | `font-bold tabular-nums text-fi-navy` | `FiStat` |

- El nivel lo da la estructura, no el tamaño; no te saltes niveles [E-31].
- `UDashboardNavbar` pinta su `title` dentro de un `<h1>`. Si la vista tiene
  `FiPageHeader`, no le pases `title` como encabezado: sobrescribe su slot
  `#left` con texto de ubicación (`<p>` o migas) [C-M1].
- Escribe el texto en caja de oración en el código y en i18n; las versalitas
  las pone el CSS (`.fi-label`, `.fi-tag`). Un lector de pantalla lee el texto
  original.
- `text-balance` en títulos, `text-pretty` en párrafos, `max-w-prose` en texto
  corrido (60–75 caracteres por línea).
- Cifras con `tabular-nums`; fechas en es-MX (`lun 14 oct 2026, 10:00`).

### Clases tipográficas del paquete

| Clase | Qué es | Úsala para | No |
|-------|--------|-----------|----|
| `.fi-label` | `text-xs` (13 px), `font-semibold`, versalitas, `tracking-[0.08em]`, `text-muted` | Rótulo de dato (`dt`), de grupo en el sidebar, de métrica | Etiquetas de formulario (eso es `UFormField`), títulos de sección |
| `.fi-tag` | Etiqueta-flecha azul marino, ≥ 12 px, versalitas | Antetítulo editorial: **máximo uno por vista o sección**, siempre seguido de un encabezado | Rótulos de dato; varias por página [E-15] |
| `.fi-eyebrow` | Antetítulo serif en caja de oración | Antetítulo del sitio público | Dashboard |
| `.fi-serif-accent` | Itálica serif | Un fragmento dentro de un titular público | Dashboard; párrafos |
| `.fi-band` | Banda-píldora azul marino | Título de bloque dentro de una sección pública | Botones, badges |
| `.fi-navlink` | Versalitas de menú | La usa `FiHeader` | Contenido |

Las clases del paquete viven en la capa `components` de Tailwind: una
utilidad las corrige sin pelear por el orden (`fi-label text-fi-navy` da el
rótulo en azul marino, que es la receta de los `th` de `UTable`).

Prefiere las props: `eyebrow` de `FiPageHeader`/`FiSectionHeading` pinta el
`.fi-tag` por ti.

```vue
<!-- Rótulo de dato en una vista de detalle -->
<dl class="grid gap-4 sm:grid-cols-2">
  <div>
    <dt class="fi-label">{{ t('person.fields.email') }}</dt>
    <dd class="mt-1 text-base text-highlighted">{{ person.email }}</dd>
  </div>
</dl>

<!-- Acento serif en un titular público -->
<h1 class="text-4xl font-bold tracking-tight text-fi-navy">
  {{ t('home.hero.titleStart') }}
  <span class="fi-serif-accent">{{ t('home.hero.titleAccent') }}</span>
</h1>
```

No reinventes el rótulo: las combinaciones `text-[11px] uppercase
tracking-wider`, `text-xs font-bold uppercase tracking-[0.18em]` y similares
(más de 80 en el consumidor de referencia) son todas `.fi-label` [C-11, D-17].

## 7. Radios

`--ui-radius` = 0.375rem (6 px). Nuxt UI deriva su escala de ese valor:
`rounded-md` 9 px, `rounded-lg` 12, `rounded-xl` 18, `rounded-2xl` 24,
`rounded-3xl` 36.

| Elemento | Clase |
|----------|-------|
| Tarjeta (y `UTable`) | `rounded-2xl` |
| Panel interno, imagen o bloque dentro de una tarjeta | `rounded-xl` |
| Controles: botón, input, select, badge | el que trae Nuxt UI; no lo sobrescribas |
| Banda o hero del sitio público | `rounded-3xl` (solo sitio público) |
| Avatar, `FiIconBadge`, puntos | `rounded-full` |

El radio interior siempre es menor que el exterior; el mismo rol lleva el mismo
radio en todo el proyecto [A-13, D-28].

## 8. Bordes

- Tarjeta: `border border-default` (3.1:1 contra blanco).
- Divisores dentro de una tarjeta: entre filas de una lista y bajo un
  encabezado, `divide-y divide-default` / `border-default` (el mismo que traza
  `FiSectionCard` con `divided` y en su pie); `divide-muted` / `border-muted`
  solo para una separación secundaria dentro de un panel interno.
- Controles: el borde lo pone `fiAppConfig` y está probado a ≥ 3:1 contra su
  fondo (WCAG 1.4.11). No lo reemplaces por `ring-muted` ni `border-muted`
  [A-04]. Un control nativo hecho a mano usa `border-accented`.
- Un borde de color (acento izquierdo) no sustituye ícono + texto.
- Filetes de marca: dorado bajo títulos (`FiPageHeader` con `rule`,
  `FiSectionHeading`); rojo arriba solo en el chrome (navbar y sidebar del
  dashboard).
- Foco: el anillo de Nuxt UI. En un elemento nativo:
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`
  [D-19].

## 9. Espaciado y ritmo

Escala de 4 px de Tailwind. Valores por defecto, salvo que el arquetipo diga
otra cosa:

| Relación | Dashboard | Sitio público |
|----------|-----------|---------------|
| Contenedor | el cuerpo de `UDashboardPanel` | `UContainer` |
| Entre bloques de una vista | `gap-6` / `space-y-6` | `py-16 sm:py-24` por sección (`UPageSection`) |
| Relleno de tarjeta | `p-4 sm:p-5` (lo pone `FiSectionCard`) | `p-6 sm:p-8` |
| Rejilla de tarjetas | `gap-4 sm:gap-6` | `gap-6 lg:gap-8` |
| Título → contenido | `mt-4` | `mt-6` |
| Rótulo → valor | `mt-1` | `mt-1` |
| Texto corrido | `max-w-prose` | `max-w-prose`, centrado en páginas de contenido |

Objetivos táctiles ≥ 24 × 24 px (WCAG 2.5.8); en móvil público, 44 px. Nada de
`100vh` en vistas de trabajo: `min-h-0` y el scroll del panel [D-29].

## 10. Íconos

- Set del proyecto: **Phosphor** (`i-ph-*`). `fiAppConfig.ui.icons` ya mapea
  los íconos internos de Nuxt UI (flechas, cerrar, cargando…) a Phosphor, y
  `@iconify-json/ph` es dependencia obligatoria.
- Font Awesome (`i-fa6-*`) y Bootstrap Icons (`i-bi-*`) **solo** dentro de
  `FiTopBar` y `FiFooter` (réplica del portal). Marcas en el contenido:
  Phosphor (`i-ph-instagram-logo`, `i-ph-whatsapp-logo`) [A-22, B-26].
- Variante `-fill` solo para un estado activo (favorito marcado).
- Tamaño: `size-4` junto a `text-sm`, `size-5` junto a `text-base`; ícono en
  círculo con `FiIconBadge` (32/40/48/56 px), nunca un `div` redondo a mano
  [B-13].
- Un ícono junto a texto es decorativo. Un control de solo ícono necesita
  `aria-label`. Un ícono que comunica estado va con texto (`FiStatusBadge`).
- El ícono también es vocabulario: en un programa no clínico, nada de
  estetoscopios ni electrocardiogramas [D-24].

## 11. Solo claro, con islas oscuras

El lenguaje FI es claro. `--fi-navy` y `--fi-gold` no tienen versión oscura:
un título azul marino sobre grafito queda en 1.28:1 [A-12].

- **Nuxt:** el módulo pone `ui.colorMode = false` por defecto. Nuxt UI no
  instala `@nuxtjs/color-mode` y `<html>` nunca recibe `.dark`.
  `fiUi.colorMode: 'app'` devuelve el control al proyecto, bajo su riesgo.
- **Vue + Vite:** `fiUiViteOptions` ya trae `colorMode: false` para el plugin
  de Nuxt UI (ver setup.md).
- `<UApp class="light">` **no hace nada**: `UApp` no tiene raíz en el DOM y la
  clase se descarta [M-01].
- Prohibido: `UColorModeButton`, `UColorModeSwitch`, `UColorModeSelect`,
  `useColorMode()`, un grupo "Apariencia" en la paleta de comandos [D-M3].
- Prohibido: variantes `dark:` en vistas de contenido. Son código muerto y
  esconden el token real [D-26, E-26].

Una **isla** es un contenedor con la clase `dark`. Dentro, los tokens de Nuxt
UI toman sus valores oscuros (`bg-default` grafito, `text-highlighted` blanco,
`text-primary` paso 400) y los componentes se ven bien sin clases a mano.

| Isla | La provee |
|------|-----------|
| Encabezado público | `FiHeader` |
| Pie público | `FiFooter` |
| Banda azul marino | `FiCtaBand` |
| Sidebar del dashboard | `fiAppConfig` (`dark bg-fi-header border-t-4 border-t-primary-500`) + `FiDashboardBrand` |

Si de verdad necesitas una isla propia:

```vue
<template>
  <aside class="dark rounded-3xl bg-fi-navy p-6 text-default sm:p-8">
    <h2 class="text-xl font-bold text-highlighted">{{ t('promo.title') }}</h2>
    <p class="mt-2 text-muted">{{ t('promo.body') }}</p>
    <UButton
      class="mt-4"
      color="neutral"
      variant="outline"
      to="/contacto"
      :label="t('promo.cta')"
    />
  </aside>
</template>
```

Dentro de una isla:

| Sobre `bg-fi-navy` | Sobre `bg-fi-header` |
|--------------------|----------------------|
| `text-highlighted`, `text-default`, `text-muted` ✓ | igual ✓ |
| `text-dimmed` ✗ (2.5:1) | `text-dimmed` ✗ (3.4:1) |
| `text-primary` ✗ (3.8:1) | `text-primary` ✓ (5.0:1) |
| Oro como texto: `text-secondary-300` (6.0:1); `text-fi-gold` (4.0:1) solo ≥ 24 px o decorativo | `text-fi-gold` ✓ (5.4:1) |

`dark:` solo se admite en un componente que se renderiza **dentro** de una
isla y necesita un valor distinto del que da el token (raro). Los overlays que
abres desde una isla se portan a `<body>` y salen claros: es lo correcto.

## 12. Temas especiales

| Id | Fecha con `theme: 'auto'` | Cambia |
|----|---------------------------|--------|
| `fi` | resto del año | — |
| `8m` | 8 mar | primario morado |
| `prevencion-suicidio` | 10 sep | primario turquesa, secundario morado |
| `salud-mental` | 10 oct | primario verde |
| `cancer-mama` | 19 oct | primario rosa |
| `25n` | 25 nov | primario naranja |
| `luto` | solo manual | primario, secundario y terciario grafito |

**Qué cambia:** las semillas, y con ellas las escalas de `primary`,
`secondary` y `tertiary`, `--fi-navy` y `--fi-gold` (derivados), el listón
(`FiThemeRibbon`, ya dentro de `FiHeader`) y el `theme-color` del navegador.

**Qué nunca cambia:** superficies (pizarra y blanco), neutro, colores de
estado, tipografía, radios, layout y textos.

Cómo se activa (detalle en setup.md):

- `fiUi.theme: 'auto' | '<id>'` en `nuxt.config.ts` (`createFiUi({ theme })` en Vue).
- Sin recompilar: `NUXT_PUBLIC_FI_UI_THEME=luto` y reiniciar.
- Vista previa solo para quien abre el enlace: `?tema=8m`.
- Un solo bloque: `<section data-fi-theme="8m">` recalcula la escala ahí dentro.

Reglas para tu código:

- Nunca `if (theme === 'luto')` para decidir un color, y nunca un hex sacado
  de un tema. Si algo se ve mal en un tema, el error está en un color que no
  sale de un token.
- `useFiTheme()` (`theme`, `definition`, `setTheme`, `chromeColor`) sirve para
  textos o comportamiento del chrome, no para elegir colores. `setTheme(id)`
  cambia `<html data-fi-theme>` en vivo: solo para una vista previa interna
  (el tema del sitio se decide en configuración, no por visitante).
- `?tema=8m` se decide al cargar y se conserva al navegar dentro del sitio;
  recargar sin el parámetro vuelve al tema configurado.
- Antes de entregar, abre la vista con `?tema=luto`, `?tema=8m` y
  `?tema=prevencion-suicidio` (el "oro" se vuelve lavanda).
- Un tema nuevo se crea en el paquete (`themes.css` + `registry.ts` + `npm
  test`), nunca en el proyecto.

## 13. Fuentes

- El paquete trae **Inter** y **Playfair Display** (variables, con su
  itálica, OFL) mediante `@fontsource-variable/inter` y
  `@fontsource-variable/playfair-display`, importadas desde su CSS. Cada hoja
  declara todos los subconjuntos con `unicode-range` y el navegador solo
  descarga los que usa la página (latin y latin-ext para español). El
  bundler las sirve desde el mismo origen: sin peticiones a Google Fonts
  (privacidad). Funciona igual en Nuxt y en Vue + Vite.
- En Nuxt, desactiva `@nuxt/fonts` (`ui: { fonts: false }`) para que no
  intente resolver esas familias contra proveedores externos, y no declares
  otro `@font-face` de Inter.
- Si el proyecto ya sirve sus fuentes, importa la hoja sin fuentes (ver
  setup.md).
- Si los acentos serif se ven en Georgia, Playfair no está cargando [A-10,
  C-12].
