# Instalación y configuración

Cómo poner fi-ui en un proyecto Nuxt 4 o Vue 3 + Vite, cómo probar cambios
del paquete sin publicarlos y cómo darle esta skill a un agente.

## Requisitos

| Paquete | Versión | Notas |
|---------|---------|-------|
| `@nuxt/ui` | ^4.9 | Trae Tailwind v4 |
| `vue` | ^3.5 | |
| `@iconify-json/ph` | ^1.2 | **Obligatorio**: Phosphor es el set de íconos de la app |
| `@iconify-json/fa6-brands`, `@iconify-json/fa6-solid`, `@iconify-json/bi` | ^1.2 | Solo si usas `FiHeader`, `FiTopBar` o `FiFooter` (réplica del portal) |
| Node | ≥ 22.12 | |

Las fuentes (`@fontsource-variable/inter`, `@fontsource-variable/playfair-display`)
son dependencias del paquete: se instalan solas.

## Instalar desde el repositorio público

```bash
npm install @fi-unam/ui@github:TransformacionDigitalFI/fi-ui#main @iconify-json/ph
# Si usas el encabezado o el pie públicos:
npm install @iconify-json/fa6-brands @iconify-json/fa6-solid @iconify-json/bi
```

- `package.json` queda con `"@fi-unam/ui": "github:TransformacionDigitalFI/fi-ui#main"`.
  **El lockfile fija el commit exacto**; `#main` solo dice de dónde actualizar.
  Todos los que instalan con ese lockfile obtienen el mismo commit.
- El repo es público: npm descarga el tarball de ese commit por HTTPS
  (`codeload.github.com`). En CI o Docker no hacen falta credenciales, llave
  SSH ni git instalado.
- No está en el registro de npm (`"private": true`): `npm install @fi-unam/ui`
  a secas falla.
- Para fijar otra rama, etiqueta o commit: `#<rama|etiqueta|sha>`.

Actualizar a lo último de `main`:

```bash
npm install @fi-unam/ui@github:TransformacionDigitalFI/fi-ui#main
rm -rf node_modules/.cache/vite   # y reinicia el servidor de desarrollo
```

## Nuxt 4

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  // '@fi-unam/ui/nuxt' ANTES que '@nuxt/ui' (o solo: instala @nuxt/ui por su
  // cuenta). Ver "Orden de los módulos" abajo.
  modules: ['@fi-unam/ui/nuxt', '@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  ui: {
    // Inter y Playfair vienen en el CSS de fi-ui. Sin @nuxt/fonts no se
    // resuelve ninguna familia contra Google Fonts.
    fonts: false,
  },
  fiUi: {
    theme: 'auto',
    previewParam: 'tema',
    colorMode: 'light',
    chrome: true,
  },
})
```

**Orden de los módulos.** Nuxt UI decide si instala `@nuxtjs/color-mode`
mientras resuelve sus propias dependencias. Si `@nuxt/ui` aparece antes que
`@fi-unam/ui/nuxt`, ya lo instaló cuando fi-ui intenta apagarlo: el módulo
entonces fija el color mode en claro (con otra clave de almacenamiento, para
ignorar un "oscuro" guardado) y avisa al arrancar. Funciona, pero deja
instalado un módulo que no hace falta. Con fi-ui primero (o con
`ui: { colorMode: false }` escrito a mano) no se instala.

No declares:

- `ui.theme.colors`: el módulo ya pide a Nuxt UI `primary`, `secondary`,
  `tertiary`, `info`, `success`, `warning` y `error`. Repetirla es redundante
  (las listas se unen, no se pisan) y la vuelve a escribir en el proyecto
  [M-05].
- Un bloque `colorMode: { preference: 'light' }`: con `fiUi.colorMode: 'light'`
  el módulo de color mode ni se instala.
- Un `<meta name="theme-color">` en `app.head`: el paquete lo gestiona y
  tendrías dos.

### Opciones del módulo (`fiUi` en `nuxt.config.ts`)

| Opción | Tipo | Por defecto | Qué hace |
|--------|------|-------------|----------|
| `theme` | `'auto'` \| id de tema | `'auto'` | `'auto'` sigue el calendario; un id (`'luto'`) fija ese tema. Sin recompilar: `NUXT_PUBLIC_FI_UI_THEME=luto` y reiniciar |
| `calendar` | `{ theme, from: 'MM-DD', to: 'MM-DD' }[]` | fechas del registro | Reemplaza el calendario. Fechas en `America/Mexico_City`; si dos ventanas se traslapan gana la más corta |
| `previewParam` | `string` \| `false` | `'tema'` | `?tema=8m` muestra un tema solo a quien abre ese enlace |
| `colorMode` | `'light'` \| `'app'` | `'light'` | `'light'` pone `ui.colorMode = false`: `<html>` nunca recibe `.dark`. `'app'` deja el color mode al proyecto, bajo su riesgo: `--fi-navy` no tiene versión oscura |
| `chrome` | `boolean` | `true` | Pinta `<html>` con el rojo de la cinta (Safari 26 tiñe su barra con ese fondo) y emite `<meta name="theme-color">` con el primario del tema activo, también en páginas sin `FiHeader`. `false` apaga las dos cosas en todo el sitio (`<html data-fi-chrome="off">`): para apps sin la cinta roja arriba (un dashboard puro) |

Las fuentes no son una opción del módulo: se eligen con la hoja que importas
(abajo).

Temas: para **ver** uno basta `?tema=8m` (solo quien abre el enlace; se
conserva al navegar y se pierde al recargar sin el parámetro). Para
**activarlo** en el sitio, `theme: '8m'` o `NUXT_PUBLIC_FI_UI_THEME=8m`. Para
**otras fechas**, `calendar` reemplaza la lista completa: repite las ventanas
del registro que quieras conservar (tabla en
[foundations.md](foundations.md#12-temas-especiales)) y añade la tuya. En
`nuxt.config.ts` no importes la raíz del paquete (`fiDefaultCalendar`
arrastra los `.vue` y la configuración no carga): escribe la lista.

```ts
fiUi: {
  calendar: [
    { theme: '8m', from: '03-02', to: '03-08' }, // semana del 8M
    { theme: 'prevencion-suicidio', from: '09-10', to: '09-10' },
    { theme: 'salud-mental', from: '10-10', to: '10-10' },
    { theme: 'cancer-mama', from: '10-19', to: '10-19' },
    { theme: '25n', from: '11-25', to: '11-25' },
  ],
},
```

Apagar el cromo solo en un layout (el del dashboard, en un sitio que también
tiene páginas públicas): en ese layout,

```ts
useHead({ htmlAttrs: { 'data-fi-chrome': 'off' } })
```

Con eso `<html>` deja de pintarse de rojo en esas páginas; el `theme-color`
del paquete sigue emitiéndose.

### CSS del proyecto

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
@import "@fi-unam/ui";

/* Lo propio del proyecto, después. */
```

El orden importa: fi-ui va **después** de Nuxt UI para compartir su contexto de
Tailwind y reemplazar sus superficies y su escala tipográfica. El paquete ya le
dice a Tailwind dónde están sus componentes (`@source`); no hay que
configurarlo.

- Hojas del paquete:

  | Import | Trae |
  |--------|------|
  | `@fi-unam/ui` (= `@fi-unam/ui/css`) | Fuentes + todo el lenguaje visual |
  | `@fi-unam/ui/css/no-fonts` | Todo menos las `@font-face`: para un proyecto que ya sirve Inter y Playfair Display (la pila cae a `"Inter"` / `"Playfair Display"`) |
  | `@fi-unam/ui/css/fonts` | Solo las fuentes (Fontsource, variables, con su itálica) |
- No redefinas `--ui-bg`, `--ui-primary`, `--ui-text-*`, la escala `--text-*`
  ni ninguna `--fi-*`: dejarían de seguir al tema.
- No declares `@font-face` de Inter, `::selection` por vista [C-M3] ni clases
  de rótulo propias (`.ui-label`): usa `.fi-label`.

### `app.config.ts` y precedencia

```
defaults de Nuxt UI  <  fiAppConfig (lo mezcla el módulo)  <  app.config.ts del proyecto
```

El proyecto gana. Por eso:

- **No declares** `ui.colors.primary`, `secondary`, `tertiary` ni `neutral`:
  pisarías los `fi-*` y los temas especiales dejarían de funcionar.
- Los colores de estado (`success` green, `info` sky, `warning` amber,
  `error` red) ya los trae fi-ui con contraste probado. Cámbialos solo con una
  razón; el contraste pasa a ser tuyo.
- No repitas lo que fi-ui ya configura (íconos Phosphor, tamaños de texto de
  controles, `formField`, `table`, `modal`, `slideover`, tarjetas, shell del
  dashboard: la lista completa está en
  [components.md](components.md#lo-que-fiappconfig-ya-estiliza-no-lo-reestilices)).
  Declara solo diferencias reales del proyecto, y nunca colores ni superficies.
- Cómo se mezclan: una cadena de clases del proyecto (`slots.title`)
  **sustituye** a la de fi-ui; un arreglo (`compoundVariants`) se
  **concatena**, y como el del paquete queda después, en una clase en
  conflicto gana el paquete. Para reemplazar los `compoundVariants` de un
  componente, decláralos como función: `compoundVariants: () => [ … ]`.

La clave `fiUi` del `app.config.ts` lleva el contenido institucional de la
cinta y el pie. Importa los datos del portal desde `@fi-unam/ui/data`, **no**
desde la raíz del paquete (arrastraría componentes al servidor) [M-02]:

```ts
// app/app.config.ts
import { fiSocialLinks, fiTopLinks } from '@fi-unam/ui/data'

export default defineAppConfig({
  fiUi: {
    topBar: {
      links: [
        ...fiTopLinks,
        { label: { es: 'Mi dependencia', en: 'My office' }, to: 'https://example.unam.mx' },
      ],
      social: [
        // `color` es el color de la red social al pasar el cursor: la única
        // excepción a "nada de hex en el proyecto".
        { label: 'Instagram', icon: 'i-fa6-brands-instagram', color: '#FCAF45', to: 'https://www.instagram.com/…' },
      ],
    },
    footer: {
      social: fiSocialLinks,
      links: [{ label: { es: 'Accesibilidad', en: 'Accessibility' }, to: '/accesibilidad' }],
      // Sin `contact`, el pie muestra el contacto general de la FI. Una
      // dependencia pone el suyo (el teléfono sin "+" se marca con +52).
      contact: {
        institution: { es: 'Universidad Nacional Autónoma de México', en: 'National Autonomous University of Mexico' },
        entity: { es: 'Facultad de Ingeniería · Mi dependencia', en: 'Faculty of Engineering · My office' },
        address: ['Av. Universidad 3000, Ciudad Universitaria,', 'Coyoacán, Cd. Mx., C.P. 04510'],
        phone: '55 5622 0000',
        email: 'mi-dependencia@ingenieria.unam.edu',
      },
      // Por defecto, el aviso del portal FI; una ruta propia abre en la misma pestaña.
      privacyUrl: '/privacidad',
    },
  },
})
```

Precedencia en cada componente: prop > `fiUi` del `app.config` > datos del
portal. Un arreglo vacío quita esa parte (no vuelve al portal); `false` en
`privacyUrl` o `legalNotice` los oculta. Para buscar un enlace del portal
compara su `to`, no su `label` (cambia con el idioma). El aviso de privacidad
ya tiene su enlace propio en el pie: no lo repitas en `footer.links`.

### `app.vue` y layout público

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import { en, es } from '@nuxt/ui/locale'

const { locale } = useI18n()
const uiLocale = computed(() => (locale.value === 'en' ? en : es))

useHead({ htmlAttrs: { lang: locale } })
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

```vue
<!-- app/layouts/default.vue -->
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const items = computed<NavigationMenuItem[]>(() => [
  { label: t('nav.about'), to: '/acerca-de' },
  { label: t('nav.locations'), to: '/ubicaciones' },
])
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <FiHeader :items="items" :title="t('site.name')" />
    <!-- FiHeader rinde primero "Saltar al contenido" hacia #main-content
         (prop skipTo) y le pasa el foco al hacer clic. -->
    <main id="main-content" tabindex="-1" class="flex-1 focus:outline-none">
      <slot />
    </main>
    <FiFooter />
  </div>
</template>
```

- Un solo `<main id="main-content">` por página, en el layout, no en cada
  vista. Es el destino por defecto de `skipTo`; si tu `<main>` ya tiene otro
  `id`, pásalo: `<FiHeader skip-to="#contenido">`.
- No pongas `class="light"` en `UApp`: no tiene raíz en el DOM y la clase se
  descarta [M-01]. El modo claro lo impone el módulo.
- El shell del dashboard (sidebar isla oscura, navbar, `FiDashboardBrand`)
  está en components.md y en los archivos de arquetipo del dashboard. Sin
  `FiHeader`, el layout del dashboard pone su propio enlace "Saltar al
  contenido".

### Idioma

- Con `@nuxtjs/i18n`, el módulo toma el idioma activo solo (lo lee en diferido,
  así que el orden de módulos no importa). Códigos regionales como `en-US` se
  tratan como `en`. Sin i18n, español.
- Los textos propios del paquete ("Regresar", "Aviso de privacidad", "Saltar
  al contenido"…) vienen en español e inglés.
- Los datos que pasas en `app.config` aceptan `LocalizedText`: un texto fijo o
  `{ es, en? }` (sin `en`, se muestra el español). En las props de los `Fi*`
  dentro de una vista, pasa el texto ya traducido con `t()`.
- Los textos internos de Nuxt UI (cerrar, sin resultados…) salen de
  `UApp :locale`.
- Para tus propios componentes: `useFiT()`, `useFiText()` y `resolveText()`
  se exportan desde `@fi-unam/ui`.

## Vue 3 + Vite (sin Nuxt)

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { fiUiViteConfig, fiUiViteOptions } from '@fi-unam/ui/vite'

export default defineConfig({
  // optimizeDeps.exclude: el paquete se publica como código fuente (.vue,
  // .ts) y no debe pre-empaquetarse (habría dos copias de sus claves de
  // inyección y el tema y el idioma caerían a sus valores por defecto).
  ...fiUiViteConfig,
  // fiUiViteOptions trae la configuración FI de Nuxt UI, la variante
  // `tertiary` y `colorMode: false` (solo claro).
  plugins: [vue(), ui(fiUiViteOptions)],
})
```

- Importa de **`@fi-unam/ui/vite`**, no de `@fi-unam/ui/vue`: `vite.config.ts`
  lo carga Node, que no acepta TypeScript dentro de `node_modules`, y
  `@fi-unam/ui/vite` es JavaScript a propósito. (`@fi-unam/ui/vue` lo
  reexporta para el código de la app, pero en `vite.config.ts` falla al
  arrancar.)
- Si el proyecto ya tiene `optimizeDeps`, une las listas en lugar de
  sobrescribirlas.
- Opciones propias de `ui`: mézclalas con el proyecto primero para que gane,
  `ui({ ...fiUiViteOptions, ui: defu(projectUi, fiUiViteOptions.ui) })`
  (`defu` da prioridad al primer argumento).

```ts
// src/main.ts
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import ui from '@nuxt/ui/vue-plugin'
import { createFiUi } from '@fi-unam/ui/vue'
import App from './App.vue'
import { routes } from './routes'
import { messages } from './i18n'
import './assets/main.css'

const i18n = createI18n({ legacy: false, locale: 'es', fallbackLocale: 'es', messages })
const router = createRouter({ history: createWebHistory(), routes })

createApp(App)
  .use(router)
  .use(i18n)
  .use(ui)
  .use(createFiUi({
    theme: 'auto',
    // Un ref: los textos del paquete cambian de idioma en vivo.
    locale: i18n.global.locale,
    topBar: { links: [] },
    // Lo mismo que `fiUi.footer` del app.config de Nuxt (contact, links, privacyUrl…).
    footer: { privacyUrl: '/privacidad' },
  }))
  .mount('#app')
```

- El CSS es el mismo de Nuxt (`main.css` con los tres `@import`).
- Los componentes se importan: `import { FiHeader, FiFooter, FiPageHeader } from '@fi-unam/ui'`.
- `createFiUi` acepta `theme`, `calendar`, `previewParam`, `locale`, `chrome`,
  `topBar` y `footer` (los dos últimos son lo que en Nuxt va en
  `app.config`). `chrome: false` hace lo mismo que en Nuxt.
- No uses `useColorMode` de `@vueuse/core` ni un selector de tema.
- Sin SSR el tema se aplica al montar: en un día de tema especial puede verse
  un instante el tema base.
- `App.vue` envuelve todo en `<UApp :locale="es">` (de `@nuxt/ui/locale`) y,
  dentro, el layout con `FiHeader`, `<main id="main-content">`, `<RouterView />`
  y `FiFooter` (el mismo de Nuxt, con `RouterView` en vez de `<slot />`).

Las recetas de la skill están escritas para Nuxt. En Vue + Vite, el plugin
`ui()` auto-importa los componentes `U*` y los composables de Nuxt UI
(`useToast`, `useOverlay`); el resto se traduce así:

| En las recetas (Nuxt) | En Vue + Vite |
|-----------------------|---------------|
| `ref`, `computed`, `watch`, `useRoute`, `useRouter` sin importar | Impórtalos de `vue` y `vue-router`, o agrégalos a `ui({ ...fiUiViteOptions, autoImport: { imports: ['vue', 'vue-router'] } })` |
| `useI18n()` | De `vue-i18n` |
| `useFetch` / `useLazyFetch` (`data`, `status`, `error`, `refresh`) | Tu capa de datos, con esa misma forma, para que los estados de carga, vacío y error de las recetas se copien tal cual |
| `$fetch` | `fetch` u `ofetch` |
| `useHead({ title })` | `@unhead/vue` o `document.title` |
| `useState` | Un `ref` a nivel de módulo o Pinia |
| `definePageMeta({ layout })` | `meta.layout` en la ruta y el layout elegido en `App.vue`, o rutas anidadas |
| `routeRules: { prerender: true }` (página de crisis) | Una SPA no funciona sin JavaScript: prerenderiza esa ruta (p. ej. `vite-ssg`) o publícala también como HTML estático |
| `~/components/…` | El alias que tenga tu `vite.config.ts` (p. ej. `@/components/…`) |

## Verificar la instalación

Con el sitio abierto, en las herramientas del navegador:

1. `<html>` tiene `data-fi-theme="fi"` y **no** tiene la clase `dark`.
2. El fondo del `body` es `#EDF2F7` y un `UButton` por defecto es `#CD171E`.
3. `?tema=8m` vuelve morado el botón; quitarlo lo regresa.
4. `getComputedStyle(document.documentElement).getPropertyValue('--fi-navy')`
   devuelve un color, y un elemento con `text-fi-navy` se ve azul marino (si
   no, falta `@import "@fi-unam/ui"` o está antes de Nuxt UI).
5. En Red, los `.woff2` de Inter y Playfair salen de tu propio origen; nada
   de `fonts.googleapis.com` ni `fonts.gstatic.com`.
6. Un `UInput` dentro de una tarjeta blanca tiene borde visible.

## Desarrollo local del paquete

Para probar cambios de fi-ui en un proyecto sin publicarlos, con el repo
clonado al lado (`../fi-ui`):

```bash
rm -rf node_modules/@fi-unam/ui node_modules/.cache/vite
npm install ../fi-ui --install-links --no-save
# reinicia el servidor de desarrollo
```

- **`--install-links` es obligatorio.** Sin él npm crea un enlace simbólico,
  y Vite y TypeScript resuelven `vue` desde `../fi-ui/node_modules`: dos copias
  de Vue, `inject()` que no encuentra nada y errores de tipos absurdos. Con la
  opción, npm **copia** el paquete.
- Como es una copia, **tras cada cambio en fi-ui hay que repetir el comando**.
- **Borra la caché de Vite.** Vite sirve `node_modules` con `?v=<hash>` y
  `Cache-Control: immutable`, y el hash solo cambia con el lockfile: el
  navegador mezcla archivos viejos y nuevos ("does not provide an export named
  …"). El módulo de Nuxt manda `no-cache` para los archivos del paquete en
  desarrollo, pero la caché del optimizador en `node_modules/.cache/vite`
  igual hay que borrarla.
- **Reinicia el servidor**: Vite no vigila `node_modules`.
- `--no-save` deja intactos `package.json` y el lockfile. Para volver a la
  versión del lockfile: `rm -rf node_modules/@fi-unam/ui node_modules/.cache/vite && npm install`.
- El paquete se publica como código fuente: el `typecheck` del proyecto cubre
  también sus `.ts` y `.vue`, así que un error de tipos del paquete aparece en
  el proyecto.

Scripts recomendados en el `package.json` del proyecto (ejemplo de referencia:
PSM-SI-V2):

```json
{
  "scripts": {
    "ui:link": "rm -rf node_modules/@fi-unam/ui node_modules/.cache/vite && npm install ../fi-ui --install-links --no-save --no-audit --no-fund",
    "ui:unlink": "rm -rf node_modules/@fi-unam/ui node_modules/.cache/vite && npm install --no-audit --no-fund",
    "ui:update": "npm install @fi-unam/ui@github:TransformacionDigitalFI/fi-ui#main --no-audit --no-fund && rm -rf node_modules/.cache/vite"
  }
}
```

## Darle esta skill a un agente

La skill viaja dentro del paquete, en
`node_modules/@fi-unam/ui/skills/fi-ui/`, y se actualiza con él. Apunta el
agente ahí en vez de copiarla.

### Claude Code

```bash
mkdir -p .claude/skills
ln -s ../../node_modules/@fi-unam/ui/skills/fi-ui .claude/skills/fi-ui
ls .claude/skills/fi-ui/SKILL.md   # comprobación
git add .claude/skills/fi-ui        # se versiona el enlace, no el contenido
```

- El enlace es relativo a `.claude/skills/`, por eso sube dos niveles.
- Antes de `npm install` queda colgando; no estorba.
- Claude Code la carga sola por su descripción cuando el trabajo es de UI, o
  se puede pedir por nombre (`fi-ui`).
- Conviene una línea en el `CLAUDE.md` del proyecto: "Para cualquier trabajo
  de interfaz, carga la skill fi-ui".

### Cursor

Una regla del proyecto en `.cursor/rules/fi-ui.mdc` (el bloque de metadatos va
en la primera línea del archivo):

```markdown
---
description: Identidad visual FI UNAM (@fi-unam/ui) para cualquier trabajo de interfaz
globs: ["**/*.vue", "**/app.config.ts", "**/assets/css/**"]
alwaysApply: false
---
Antes de crear o modificar UI, lee node_modules/@fi-unam/ui/skills/fi-ui/SKILL.md
y el archivo de references/archetypes/ que corresponda al tipo de vista.
Sigue sus reglas de oro y corre los comandos de references/checklist.md antes de terminar.
```

Si el agente no puede leer dentro de `node_modules` (lo excluye
`.cursorignore` o la configuración del editor), copia la skill al instalar y
apunta la regla a la copia:

```json
{
  "scripts": {
    "postinstall": "rm -rf .cursor/fi-ui && cp -R node_modules/@fi-unam/ui/skills/fi-ui .cursor/fi-ui"
  }
}
```

La copia (`.cursor/fi-ui/`) va en `.gitignore`: se regenera en cada
`npm install`, así que nunca queda desfasada del paquete.

### Codex, Copilot y otros

En `AGENTS.md` (Codex y la mayoría de agentes) o
`.github/copilot-instructions.md` (GitHub Copilot):

```markdown
## Interfaz

Toda la UI sigue @fi-unam/ui (identidad FI UNAM sobre Nuxt UI 4). Antes de tocar
una vista, lee `node_modules/@fi-unam/ui/skills/fi-ui/SKILL.md` y el arquetipo
que corresponda en `references/archetypes/`. Antes de entregar, corre los
comandos de `references/checklist.md`.
```

## Problemas comunes

- **`Cannot find module '../assets/fi-wordmark.png'` en el typecheck.** Un
  tsconfig que compila el código fuente del paquete sin los tipos de Vite
  (típicamente el de las pruebas). En Nuxt el módulo ya agrega la
  declaración a los tipos del proyecto; en otro tsconfig añade
  `/// <reference types="@fi-unam/ui/env" />` (o `"types": ["vite/client"]`).

| Síntoma | Causa | Arreglo |
|---------|-------|---------|
| "does not provide an export named …" tras actualizar o enlazar | Caché de Vite | `rm -rf node_modules/.cache/vite` y reiniciar |
| `inject()` no encuentra el tema o el idioma; dos Vue | `npm install ../fi-ui` sin `--install-links` | Reinstalar con `--install-links` |
| Un tema especial no cambia el rojo | El `app.config` declara `ui.colors.primary` | Quitarlo |
| Aparece modo oscuro, títulos ilegibles | `fiUi.colorMode: 'app'`, o Vue sin `fiUiViteOptions` | Volver a solo claro |
| Al arrancar: "@nuxtjs/color-mode está instalado y el lenguaje FI es solo claro" | `@nuxt/ui` va antes que `@fi-unam/ui/nuxt` en `modules` | Poner `@fi-unam/ui/nuxt` primero |
| Vue: `vite.config.ts` falla con `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` o "Cannot find module" | Importa de `@fi-unam/ui/vue` | Importar de `@fi-unam/ui/vite` |
| `text-pizarra-600` o `bg-oro-100` no pintan | Esas utilidades no existen | Token semántico (foundations.md) |
| `text-fi-navy` no pinta | Falta `@import "@fi-unam/ui"` o va antes de Nuxt UI | Orden de `main.css` |
| Acentos serif en Georgia | Playfair no carga (hoja sin fuentes) | Importar `@fi-unam/ui` o `@fi-unam/ui/css/fonts` |
| Las celdas de una columna de fechas o cifras se parten | fi-ui quitó el `whitespace-nowrap` global de `UTable` | `meta: { class: { td: 'whitespace-nowrap' } }` en esa columna |
| Build del servidor: "Expected '{', got 'interface'" | Se importa el paquete en `app.config.ts` sin el módulo, o desde la raíz | Usar el módulo e importar de `@fi-unam/ui/data` |
| Dos `<meta name="theme-color">` | El proyecto declara el suyo | Quitarlo (o `fiUi.chrome: false`) |
| Rojo al estirar el scroll en un dashboard | `<html>` pintado por el chrome | `fiUi.chrome: false` en apps sin `FiHeader` |
| Vue: Vite falla al pre-empaquetar un `.vue`, o el tema y el idioma no llegan a los componentes | Falta `...fiUiViteConfig` (`optimizeDeps.exclude`) | Ver vite.config de arriba |
