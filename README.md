# @fi-unam/ui

Lenguaje visual de la **Facultad de Ingeniería, UNAM** para proyectos Vue con
**Nuxt UI v4** y Tailwind v4: tokens de color con temas especiales (8M, luto,
prevención del suicidio…), superficies pizarra y blanco, tipografía y fuentes,
la configuración FI de los componentes de Nuxt UI, encabezado y pie del
portal, y primitivas de vista (encabezado de vista, tarjeta de sección, cifras
clave, insignia de estado…).

No reemplaza a Nuxt UI ni lo envuelve: lo configura por los mecanismos
normales (`app.config` → `ui`, tokens CSS) y añade componentes `Fi*` hechos
con piezas de Nuxt UI. Botones, formularios y tablas siguen siendo Nuxt UI.

**Las reglas de diseño** (qué componente usar, superficies, color, estados,
arquetipos de vista, revisión) están en la skill
[`skills/fi-ui/SKILL.md`](skills/fi-ui/SKILL.md), que viaja con el paquete.
Este README es la referencia técnica: instalación y API.

- [Instalación](#instalación)
- [Nuxt](#nuxt)
- [Vue + Vite](#vue--vite)
- [Hojas de estilo](#hojas-de-estilo)
- [Componentes](#componentes)
- [Tokens y utilidades](#tokens-y-utilidades)
- [Temas especiales](#temas-especiales)
- [Enlaces, redes e idioma](#enlaces-redes-e-idioma)
- [Exportaciones](#exportaciones)
- [Desarrollo](#desarrollo)

## Instalación

```bash
npm install @fi-unam/ui@github:TransformacionDigitalFI/fi-ui#main @iconify-json/ph
# Si usas FiHeader, FiTopBar o FiFooter (íconos del portal):
npm install @iconify-json/fa6-brands @iconify-json/fa6-solid @iconify-json/bi
```

Requiere `@nuxt/ui` ^4.9, `vue` ^3.5, `@iconify-json/ph` (los íconos de la
interfaz son Phosphor) y Node ≥ 22.12. Las fuentes (Fontsource) son
dependencias del paquete y se instalan solas. El lockfile fija el commit
exacto; `#main` solo dice de dónde actualizar. El repo es público: en CI o
Docker no hacen falta credenciales.

Para probar cambios del paquete sin publicarlos, con el repo clonado al lado:

```bash
rm -rf node_modules/@fi-unam/ui node_modules/.cache/vite
npm install ../fi-ui --install-links --no-save   # y reinicia el servidor de desarrollo
```

`--install-links` copia el paquete en vez de enlazarlo (un enlace simbólico da
dos copias de Vue). Tras cada cambio hay que repetirlo y borrar la caché de
Vite. Detalle en [setup.md](skills/fi-ui/references/setup.md#desarrollo-local-del-paquete).

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // '@fi-unam/ui/nuxt' ANTES que '@nuxt/ui' (o solo: instala @nuxt/ui por su cuenta)
  modules: ['@fi-unam/ui/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: { fonts: false }, // las fuentes vienen en el CSS del paquete
  fiUi: {
    theme: 'auto',
  },
})
```

```css
/* main.css */
@import "tailwindcss";
@import "@nuxt/ui";
@import "@fi-unam/ui";
```

El módulo registra los componentes `Fi*` y el composable `useFiTheme()`,
mezcla `fiAppConfig` por debajo del `app.config.ts` del proyecto (el proyecto
gana), pide a Nuxt UI la variante `tertiary`, apaga el color mode, excluye el
paquete del pre-empaquetado de Vite y decide el tema en el servidor (llega en
el HTML como `<html data-fi-theme="…">`, sin parpadeo).

### Opciones del módulo (`fiUi`)

| Opción | Tipo | Por defecto | Qué hace |
|--------|------|-------------|----------|
| `theme` | `'auto' \| FiThemeId` | `'auto'` | `'auto'` sigue el calendario; un id fija el tema. Sin recompilar: `NUXT_PUBLIC_FI_UI_THEME=luto`. |
| `calendar` | `FiCalendarEntry[]` | fechas del registro | Reemplaza el calendario (`{ theme, from: 'MM-DD', to: 'MM-DD' }`, en `America/Mexico_City`). |
| `previewParam` | `string \| false` | `'tema'` | `?tema=8m` muestra un tema solo a quien abre ese enlace. |
| `colorMode` | `'light' \| 'app'` | `'light'` | Solo claro: `ui.colorMode = false`, `<html>` nunca recibe `.dark` (lo oscuro existe solo como isla, un contenedor con la clase `dark`). `'app'` deja el color mode al proyecto, bajo su riesgo: `--fi-navy` no tiene versión oscura. |
| `chrome` | `boolean` | `true` | Fondo rojo de `<html>` (Safari 26 tiñe su barra con él) y `<meta name="theme-color">` con el primario del tema activo. `false` apaga ambos (`<html data-fi-chrome="off">`). |

Si `@nuxt/ui` va antes en `modules`, Nuxt UI ya instaló `@nuxtjs/color-mode`
cuando fi-ui intenta apagarlo: el módulo lo fija en claro y avisa al arrancar.

**No declares en tu `app.config.ts`** `ui.colors.primary`, `secondary`,
`tertiary` ni `neutral` (pisarías las escalas FI y los temas especiales). Los
estados (`success` green, `info` sky, `warning` amber, `error` red) ya vienen
con contraste probado. Importa los datos del portal desde `@fi-unam/ui/data`,
nunca desde la raíz del paquete (arrastraría componentes al servidor):

```ts
// app.config.ts
import { fiSocialLinks, fiTopLinks } from '@fi-unam/ui/data'

export default defineAppConfig({
  fiUi: {
    topBar: { links: fiTopLinks },
    footer: { social: fiSocialLinks, privacyUrl: '/privacidad' },
  },
})
```

## Vue + Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { fiUiViteConfig, fiUiViteOptions } from '@fi-unam/ui/vite'

export default defineConfig({
  ...fiUiViteConfig,                         // optimizeDeps.exclude del paquete
  plugins: [vue(), ui(fiUiViteOptions)],     // fiAppConfig, `tertiary`, colorMode: false
})
```

```ts
// main.ts
import ui from '@nuxt/ui/vue-plugin'
import { createFiUi } from '@fi-unam/ui/vue'

createApp(App).use(router).use(ui).use(createFiUi({ theme: 'auto' })).mount('#app')
```

`vite.config.ts` importa de **`@fi-unam/ui/vite`** (JavaScript: Node lo carga
sin pasar por Vite y no acepta TypeScript dentro de `node_modules`).
`createFiUi(options)` acepta `theme`, `calendar`, `previewParam`, `locale`
(texto o ref, p. ej. `i18n.global.locale`), `chrome`, `topBar` y `footer`. El
CSS es el mismo de Nuxt. Los componentes se importan:
`import { FiHeader, FiPageHeader } from '@fi-unam/ui'`. Sin SSR el tema se
aplica al montar.

## Hojas de estilo

| Import | Trae |
|--------|------|
| `@fi-unam/ui` (= `@fi-unam/ui/css`) | Fuentes + todo el lenguaje visual. Va después de `tailwindcss` y `@nuxt/ui`. |
| `@fi-unam/ui/css/no-fonts` | Todo menos las `@font-face`, para un proyecto que ya sirve Inter y Playfair Display. |
| `@fi-unam/ui/css/fonts` | Solo Inter y Playfair Display (variables, con itálica), desde Fontsource: sin Google Fonts. |

## Componentes

Todos se construyen con Nuxt UI, no tienen texto fijo (los textos propios
salen de un diccionario es/en que sigue al idioma activo), no usan `dark:` y
no emiten eventos (salvo `v-model:open` de `FiHeader`). Las props de texto
aceptan `LocalizedText`: un `string` o `{ es: string, en?: string }`. Los
atributos sueltos (`class`, `id`…) van a la raíz, salvo en `FiHeader` (van al
`UHeader`). Recetas y reglas de uso:
[components.md](skills/fi-ui/references/components.md).

### Primitivas de vista

#### FiPageHeader

Encabezado de una vista de trabajo: el único `<h1>`, descripción, insignias y
acciones (a la derecha en `≥ sm`, debajo en móvil). Raíz `<div>`.

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `title` | `LocalizedText` | — (requerida) | |
| `description` | `LocalizedText` | — | |
| `eyebrow` | `LocalizedText` | — | Antetítulo en `.fi-tag`. |
| `descriptionLoading` | `boolean` | `false` | Bloque de una línea en lugar de la descripción. |
| `rule` | `boolean` | `true` | Filete dorado corto bajo el título. |
| `as` | `'h1' \| 'h2'` | `'h1'` | |
| `back` | `string \| false` | — | Ruta de respaldo: muestra `FiBackButton` solo ícono. |

Slots: `leading`, `badges`, `description`, `actions`.

#### FiSectionCard

Tarjeta blanca con encabezado (ícono, título, descripción, acciones) y pie.

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `title` | `LocalizedText` | — | |
| `description` | `LocalizedText` | — | |
| `icon` | `string` | — | En un `FiIconBadge` `sm` `neutral`. |
| `as` | `'section' \| 'article' \| 'div'` | `'section'` | |
| `headingLevel` | `2 \| 3` | `2` | h2 `text-lg` navy; h3 `text-base` highlighted. |
| `padded` | `boolean` | `true` | `false`: cuerpo a sangre (tablas, listas). |
| `divided` | `boolean` | `false` | Borde bajo el encabezado. |

Slots: `header` (reemplaza el encabezado), `actions`, default (cuerpo), `footer`.
La raíz es columna flexible: con `class="h-full"` en una rejilla, los pies se
alinean abajo.

#### FiStat y FiStatGrid

Cifras clave en una lista de definiciones (`<dl>`, rótulo `<dt>`, valor `<dd>`).

`FiStat`:

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `label` | `LocalizedText` | — (requerida) | |
| `value` | `string \| number` | — (requerida) | Ya formateado. `tabular-nums`, azul marino. |
| `icon` | `string` | — | Círculo azul marino (o del tono). |
| `hint` | `LocalizedText` | — | Contexto en texto. |
| `tone` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Solo cuando la cifra es un estado; cambia el círculo del ícono. |
| `to` | `string` | — | La tarjeta entera es enlace, con foco visible. |
| `loading` | `boolean` | `false` | Bloque del mismo alto en lugar del valor. |

Slots: `hint`; `help` (un botón "¿qué mide?" junto al rótulo: va fuera del
enlace estirado, así que con `to` se pulsa sin navegar).

`FiStatGrid`:

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `stats` | `FiStatItem[]` | — | Atajo; mismas claves que las props de `FiStat`. |
| `columns` | `2 \| 3 \| 4 \| 5` | con `stats`, tantas como cifras (2–5); con el slot, 4 | Máximo en escritorio; una en móvil. |
| `loading` | `boolean` | `false` | Para las cifras de `stats` sin `loading` propio. |

Slot: default (`FiStat` a mano).

#### FiStatusBadge

Estado con ícono + texto (`UBadge` con `color` = el estado).

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `status` | `FiStatus` (`'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'`) | — (requerida) | |
| `label` | `LocalizedText` | — (requerida) | |
| `icon` | `string` | `fiStatusIcons[status]` | `i-ph-check-circle`, `-clock`, `-x-circle`, `-info`, `-minus-circle`. |
| `variant` | `'subtle' \| 'soft' \| 'outline'` | `'subtle'` | |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | |

Cada proyecto traduce sus estados con una tabla:
`const STATUS_TONE: Record<EstadoSolicitud, FiStatus> = { … }`.

#### FiIconBadge

Ícono en un círculo.

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `icon` | `string` | — (requerida) | |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 32 / 40 / 48 / 56 px. |
| `tone` | `'navy' \| 'gold' \| 'primary' \| 'neutral' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'navy'` | |
| `label` | `LocalizedText` | — | Sin ella, `aria-hidden`; con ella, `role="img"`. |

#### FiCtaBand

Banda azul marino de llamado a la acción con brillo dorado, isla `dark`.

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `title` | `LocalizedText` | — (requerida) | |
| `description` | `LocalizedText` | — | |
| `eyebrow` | `LocalizedText` | — | Versalitas doradas (`text-secondary-300`). |
| `icon` | `string` | — | Dorado, decorativo. |
| `headingLevel` | `2 \| 3` | `2` | |

Slots: default (bajo la descripción), `actions` (centradas).

#### FiDashboardBrand

Marca para el slot `#header` de `UDashboardSidebar`: logotipo blanco y nombre
del sistema en dorado; todo es un enlace.

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `name` | `LocalizedText` | — | Nombre del sistema. |
| `to` | `string` | `'/'` | |
| `collapsed` | `boolean` | `false` | Escudo solo; el nombre queda para lectores de pantalla. |

Slots: `logo` (expandida), `mark` (contraída, decorativo), `name`.

### Chrome público

#### FiHeader

`FiTopBar` + barra oscura fija (`UHeader`, isla `dark`) con logotipo, nombre
del sitio y menú en versalitas; panel lateral en móvil. Lo primero que rinde
es el enlace "Saltar al contenido".

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `items` | `NavigationMenuItem[]` | `[]` | `to` absolutos. |
| `title` | `LocalizedText` | — | Nombre del sitio junto al logotipo. |
| `to` | `string` | `'/'` | Destino del logotipo. |
| `topBar` | `boolean` | `true` | |
| `topLinks` | `FiLink[]` | `fiUi.topBar.links` > portal | |
| `social` | `FiSocialLink[]` | `fiUi.topBar.social` > portal | |
| `skipTo` | `string \| false` | `'#main-content'` | Destino de "Saltar al contenido"; pon ese `id` en tu `<main>`. |
| `brandClass` | `string` | — | Clases del bloque de marca (el del filete junto al logotipo). Para ocultarlo en móvil, `'hidden sm:block'` aquí y no dentro del slot `brand`, o el filete queda solo. |
| `v-model:open` | `boolean` | `false` | Panel móvil. |

Slots: `logo`, `brand`, `actions`, `menu-footer`, `top-bar-end` (recibe
`{ controlClass }`).

#### FiTopBar

Cinta roja del portal (ya incluida en `FiHeader`).

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `links` | `FiLink[]` | `fiUi.topBar.links` > portal |
| `social` | `FiSocialLink[]` | `fiUi.topBar.social` > portal |

Slot `end`: recibe `{ controlClass }`, la receta de un control de la cinta.
Variable pública: `--fi-topbar-hover`.

#### FiFooter

Pie grafito (isla `dark`): logotipo y aviso de privacidad, domicilio,
contacto, enlaces, redes y derechos.

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `contact` | `FiContact` | `fiUi.footer.contact` > portal |
| `social` | `FiSocialLink[]` | `fiUi.footer.social` > portal |
| `links` | `FiLink[]` | `fiUi.footer.links` > `[]` |
| `privacyUrl` | `string \| false` | `fiUi.footer.privacyUrl` > portal |
| `legalNotice` | `LocalizedText \| false` | `fiUi.footer.legalNotice` > portal |

`false` quita el aviso o la leyenda. Slot default: contenido propio a todo lo
ancho.

#### FiLogo

| Prop | Tipo | Por defecto | |
|------|------|-------------|---|
| `variant` | `'wordmark' \| 'inverse' \| 'footer' \| 'escudo'` | `'wordmark'` | |
| `alt` | `LocalizedText` | "Facultad de Ingeniería" en el idioma activo | `''` lo vuelve decorativo. |
| `height` | `string` | `'3rem'` | La altura va por prop, no por clase. |

#### FiBackButton

"Regresar": vuelve en el historial si se navegó dentro del sitio; si no, va a
`fallback`. Es un enlace real (abrir en otra pestaña funciona).

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `fallback` | `string` | `'/'` |
| `label` | `LocalizedText` | "Regresar" |
| `iconOnly` | `boolean` | `false` (36 px, con `aria-label`) |
| `icon` | `string` | `'i-ph-arrow-left'` |

### Piezas editoriales

#### FiSectionHeading

Encabezado editorial de sección: etiqueta-flecha, título navy grande, filete
dorado con rombo.

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `title` | `LocalizedText` | — (requerida) |
| `eyebrow` | `LocalizedText` | — |
| `description` | `LocalizedText` | — |
| `align` | `'center' \| 'start'` | `'center'` |
| `as` | `'h1' \| 'h2' \| 'h3'` | `'h2'` |

Slots: `title`, `description`.

#### FiStepBadge

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `value` | `number \| string` | — (requerida) |
| `tone` | `'navy' \| 'gold' \| 'auto'` | `'auto'` (impar navy, par oro) |

#### FiReveal

Entrada suave al hacer scroll; nunca deja contenido invisible y respeta
`prefers-reduced-motion`.

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `as` | `string` | `'div'` |
| `delay` | `number` (ms) | `0` |

Slot: default.

#### FiThemeRibbon

Listón del tema activo; no pinta nada sin tema. Ya va dentro de `FiHeader`.

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `height` | `string` | `'2rem'` |

## Tokens y utilidades

| Utilidad o variable | Qué es |
|---------------------|--------|
| `bg-default` / `bg-elevated` / `bg-muted` / `bg-accented` | Página pizarra `#EDF2F7` / tarjeta blanca / banda `#D6E4F5` / tinte fuerte `#C3D6EE` (tokens de Nuxt UI, redefinidos en claro) |
| `text-fi-navy`, `bg-fi-navy`, `border-fi-navy` | Azul marino editorial (`--fi-navy`, rol: sigue al tema) |
| `bg-fi-gold`, `text-fi-gold`, `border-fi-gold` | Oro decorativo (`--fi-gold`): filetes, nunca texto sobre claro |
| `bg-fi-header` | Fondo oscuro del encabezado y del sidebar (`--fi-header-bg`) |
| `bg-fi-chart-1…8`, `fill-`, `stroke-`, `text-` | Paleta categórica de gráficas (fija, sin colores de estado) |
| `bg-fi-chart-seq-1…5` | Rampa secuencial de pizarra (mapas de calor) |
| `.fi-label` | Rótulo de dato: 13 px, semibold, versalitas, `text-muted` |
| `.fi-tag`, `.fi-band`, `.fi-eyebrow`, `.fi-serif-accent`, `.fi-navlink` | Piezas editoriales de los sitios FI |
| `--fi-header-offset` | Alto del encabezado completo: `min-h-[calc(100svh-var(--fi-header-offset))]` |

Escala tipográfica FI (reemplaza la de Tailwind): `text-xs` 13 px … `text-2xl`
25 px. Todo con utilidades semánticas; nada de hex, paletas crudas de
Tailwind ni `--fi-seed-*` / `--color-fi-*` (privadas). Detalle y contrastes
medidos: [foundations.md](skills/fi-ui/references/foundations.md).

## Temas especiales

| Id | Fecha (`auto`) | Cambia |
|----|----------------|--------|
| `fi` | resto del año | — |
| `8m` | 8 mar | primario morado |
| `prevencion-suicidio` | 10 sep | turquesa + morado |
| `salud-mental` | 10 oct | verde |
| `cancer-mama` | 19 oct | rosa |
| `25n` | 25 nov | naranja |
| `luto` | solo manual | grafito |

Un tema cambia las semillas de color (y con ellas `primary`, `secondary`,
`tertiary`, `--fi-navy`, `--fi-gold`, el listón y `theme-color`); nunca las
superficies, los estados ni la paleta de gráficas. Previsualizar: `?tema=8m`.
En un solo bloque: `<section data-fi-theme="8m">`.

Crear un tema: bloque en `src/css/themes.css` con sus semillas, entrada en
`src/themes/registry.ts` (nombre, descripción, fechas, `chromeColor` = su
`--fi-seed-primary`) y `npm test`, que rechaza la semilla si no pasa los
contrastes o si se confunde con un color de estado. Ver [AGENTS.md](AGENTS.md).

## Enlaces, redes e idioma

Cinta y pie traen por defecto los enlaces, redes y contacto del portal
ingenieria.unam.mx (`@fi-unam/ui/data`). Precedencia en cada componente:
**prop > `fiUi` del `app.config` (en Vue, `createFiUi`) > portal**. Un arreglo
vacío quita esa parte.

- `FiLink`: `{ label, to, target?, children? }`.
- `FiSocialLink`: `{ label, icon, to, color?, target? }`; `color` es el fondo
  de la marca al pasar el cursor.
- `FiContact`: `{ institution, entity, address[], phone, email }`.

Idioma: con `@nuxtjs/i18n` el módulo toma el idioma activo solo; en Vue,
`createFiUi({ locale })`. Códigos regionales (`en-US`) cuentan como `en`; sin
proveedor, español.

## Exportaciones

| Entrada | Exporta |
|---------|---------|
| `@fi-unam/ui` | Los 17 componentes `Fi*`; `fiAppConfig`, `fiUiColors`, `fiUiThemeColors`, `fiStatusColors`, `fiIcons`, `fiPrimaryOnTint`; `fiStatusIcons`, `fiReadableTextOn`; `useFiTheme`, `createFiThemeState`, `fiThemeKey`; `useFiConfig`, `fiConfigKey`; `useFiT`, `useFiText`, `useFiLocale`, `resolveText`, `normalizeFiLocale`, `fiLocaleKey`; `fiThemes`, `fiThemeIds`, `isFiThemeId`, `FI_DEFAULT_THEME`, `resolveFiTheme`, `fiDefaultCalendar`, `monthDayIn`, `FI_TIME_ZONE`; `FI_CHROME_COLOR`, `fiChromeColor`, `readRootColor`; `contrast`, `mixOklch`; los datos del portal. Tipos: `LocalizedText`, `FiLocale`, `FiStatus`, `FiStatTone`, `FiStatItem`, `FiIconBadgeTone`, `FiIconBadgeSize`, `FiThemeId`, `FiThemeDefinition`, `FiThemeSetting`, `FiCalendarEntry`, `FiLink`, `FiSocialLink`, `FiContact`, `FiUiConfig`… |
| `@fi-unam/ui/nuxt` | El módulo de Nuxt |
| `@fi-unam/ui/vue` | `createFiUi` (y reexporta las opciones de Vite) |
| `@fi-unam/ui/vite` | `fiUiViteOptions`, `fiUiViteConfig` (JavaScript, para `vite.config.ts`) |
| `@fi-unam/ui/data` | `fiTopLinks`, `fiTopBarSocial`, `fiSocialLinks`, `fiContact`, `fiPrivacyUrl`, `fiLegalNotice`, `fiPortalUrl` |
| `@fi-unam/ui/css`, `/css/fonts`, `/css/no-fonts` | Hojas de estilo |
| `@fi-unam/ui/components/*`, `@fi-unam/ui/assets/*` | Archivos sueltos |

## Desarrollo

```bash
npm install
npm test
```

El paquete se publica como código fuente (`.vue`, `.ts`); el proyecto que lo
consume lo compila, y su `typecheck` cubre también estos archivos. Estructura,
pruebas y cómo añadir un tema o un componente: [AGENTS.md](AGENTS.md).
