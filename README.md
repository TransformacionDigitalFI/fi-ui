# @fi-unam/ui

Identidad visual de la **Facultad de Ingeniería, UNAM** para proyectos Vue con
**Nuxt UI v4**: tokens de color con temas especiales (8M, luto, prevención del
suicidio…), encabezado y pie del portal, y logotipos.

No reemplaza a Nuxt UI ni lo envuelve: le conecta los colores de la Facultad
por el mecanismo normal (`app.config` → `ui.colors`) y añade unos pocos
componentes hechos con piezas de Nuxt UI (`UHeader`, `UFooter`,
`UNavigationMenu`…). Todo lo demás —botones, formularios, tablas— es Nuxt UI
sin tocar.

## Instalación

```bash
npm install github:<org>/fi-ui        # o la ruta local: npm install ../fi-ui --install-links
```

Requiere `@nuxt/ui` ^4.9 y `vue` ^3.5. Los íconos de la cinta y del pie son
los del portal: `@iconify-json/fa6-brands`, `@iconify-json/fa6-solid` y
`@iconify-json/bi`.

> **Con ruta local usa `--install-links`.** Sin esa opción npm crea un enlace
> simbólico y Vite/TypeScript resuelven `vue` desde `../fi-ui/node_modules`,
> lo que da dos copias de Vue. Con la opción, npm copia el paquete; tras
> editarlo hay que volver a copiarlo **y borrar la caché de Vite**, y luego
> reiniciar el servidor de desarrollo (Vite no vigila `node_modules`):
> `rm -rf node_modules/@fi-unam/ui node_modules/.cache/vite && npm install ../fi-ui --install-links`
> (en PSM: `npm run ui:sync`). Sin borrar la caché, Vite sirve el paquete con
> el mismo `?v=` y `Cache-Control: immutable`, y el navegador sigue usando la
> copia vieja: errores como "does not provide an export named …".

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@fi-unam/ui/nuxt'],
  css: ['~/assets/css/main.css'],
  fiUi: {
    theme: 'auto',        // o un id fijo: 'luto'
    previewParam: 'tema', // ?tema=8m para previsualizar; false lo apaga
  },
})
```

```css
/* main.css */
@import "tailwindcss";
@import "@nuxt/ui";
@import "@fi-unam/ui";
```

El módulo registra los componentes (`<FiHeader>`, `<FiFooter>`…), el
composable `useFiTheme()`, la variante `tertiary` de Nuxt UI, y decide el tema
en el servidor (llega en el HTML como `<html data-fi-theme="…">`, sin
parpadeo).

**No declares `primary`, `secondary`, `tertiary` ni `neutral` en tu
`app.config.ts`**: lo pisaría. Los colores de estado (`success`, `info`,
`warning`, `error`) sí son tuyos.

### Vue + Vite

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { fiUiViteOptions } from '@fi-unam/ui/vue'

export default defineConfig({ plugins: [vue(), ui(fiUiViteOptions)] })
```

```ts
// main.ts
import ui from '@nuxt/ui/vue-plugin'
import { createFiUi } from '@fi-unam/ui/vue'

createApp(App).use(router).use(ui).use(createFiUi({ theme: 'auto' })).mount('#app')
```

El CSS es el mismo de arriba. Los componentes se importan:
`import { FiHeader, FiFooter } from '@fi-unam/ui'`. Sin SSR el tema se aplica
al montar.

## Color

Tres capas; un tema solo toca la primera.

| Capa | Variables | Quién la escribe |
|------|-----------|------------------|
| 1. Semillas | `--fi-seed-primary`, `--fi-seed-secondary`, `--fi-seed-tertiary` | los temas |
| 2. Escalas | `--color-fi-{rol}-{50…950}` | `color-mix()` en OKLCH a partir de la semilla (semilla = 500) |
| 3. Nuxt UI | `--ui-color-{rol}-*`, `--ui-primary`, `--ui-bg`… | Nuxt UI, desde `app.config` |

Identidad FI (del portal ingenieria.unam.mx):

| Rol | Semilla | |
|-----|---------|---|
| `primary` | `#CD171E` | rojo FI, exacto |
| `secondary` | `#8A6A00` | oro UNAM, oscurecido para AA con texto blanco |
| `tertiary` | `#3A72A8` | azul pizarra, el de los micrositios FI |
| `neutral` | grafito del portal | fijo; componentes `neutral`, títulos #212529, pie, modo oscuro |

Superficies de modo claro (fijas, no cambian con los temas): página azul
pizarra `#EDF2F7` con tarjetas blancas, borde `#6A96C0` y texto secundario
`#1E3D5A` — el fondo de los micrositios FI. En oscuro son las de Nuxt UI sobre
el grafito.

Acentos editoriales: `--fi-navy` (= tertiary-800, títulos y etiquetas) y
`--fi-gold` (= secondary-400, filetes y viñetas; decorativo, no lleva texto).
`--fi-header-bg` (`#1E2125`) es el fondo del encabezado.

En tus componentes usa solo la capa 3 (`text-primary`, `bg-elevated`,
`var(--ui-primary)`), nunca un hex ni una `--fi-*`: así siguen al tema.

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

Todos menos `fi` muestran un listón (`<FiThemeRibbon>`, ya incluido en
`FiHeader`). Las fechas se evalúan en `America/Mexico_City`. Si dos ventanas se
traslapan gana la más corta; un tema fijo gana siempre.

**Activar uno sin recompilar (Nuxt):** `NUXT_PUBLIC_FI_UI_THEME=luto` y reiniciar.
**Previsualizar:** `?tema=8m` en la URL.
**Calendario propio:** `fiUi.calendar: [{ theme: '8m', from: '03-01', to: '03-08' }]`.
**Tema en un solo bloque:** `<section data-fi-theme="8m">` recalcula la escala ahí dentro.

Los colores son una propuesta razonada, no una norma institucional; si
Comunicación de la FI define otros, se cambian en `src/css/themes.css`.

### Crear un tema

1. `src/css/themes.css`:

   ```css
   [data-fi-theme="orgullo"] {
     --fi-seed-primary: #7C3AED;
     --fi-ribbon: #7C3AED;
   }
   ```

2. `src/themes/registry.ts`: nombre, descripción (texto alternativo del
   listón), `ribbon` y `dates`.
3. `npm test`. Falla si la semilla no da AA (500 con texto blanco y 400 con
   texto oscuro, los pares de un botón sólido en claro y oscuro), si la
   escala no baja de claro a oscuro, o si CSS y registro no listan los mismos
   temas.

## Enlaces y redes por proyecto

La cinta superior y el pie traen por defecto los enlaces, redes y contacto del
portal ingenieria.unam.mx. Cada proyecto puede cambiarlos sin tocar el
paquete. Precedencia: prop del componente > configuración del proyecto >
datos del portal. Un arreglo vacío quita esa parte (no vuelve al portal).

```ts
// app.config.ts (Nuxt)
import { fiSocialLinks, fiTopLinks } from '@fi-unam/ui'

export default defineAppConfig({
  fiUi: {
    topBar: {
      links: [
        ...fiTopLinks,
        { label: 'Mi dependencia', to: 'https://…' },
      ],
      social: [
        { label: 'Instagram', icon: 'i-fa6-brands-instagram', color: '#FCAF45', to: 'https://instagram.com/…' },
        { label: 'contacto@…', icon: 'i-bi-envelope-fill', color: '#6567A5', to: '/contacto', target: '_self' },
      ],
    },
    footer: {
      social: fiSocialLinks,
      links: [{ label: 'Aviso de privacidad', to: '/privacidad' }],
      // contact: { institution, entity, address: [...], phone, email },
    },
  },
})
```

En Vue + Vite van en `createFiUi({ topBar: {...}, footer: {...} })`.

- `links`: `{ label, to, target?, children? }`. Con `children` el enlace muestra
  el caret y un submenú (como "Género" en el portal).
- `social`: `{ label, icon, to, color?, target? }`. `color` es el fondo de la
  marca al pasar el cursor; `label` es el texto que se despliega.

La cinta usa los íconos del portal (Font Awesome 6 y Bootstrap Icons), así que
el proyecto necesita `@iconify-json/fa6-brands`, `@iconify-json/fa6-solid` y
`@iconify-json/bi`.

## Idioma

Los componentes hablan español o inglés. El paquete no depende de ninguna
librería de i18n: solo necesita saber el idioma activo.

- **Nuxt**: si el proyecto usa `@nuxtjs/i18n`, el módulo toma su idioma solo.
  Sin él, español.
- **Vue**: `createFiUi({ locale })`, con un texto fijo o un ref (por ejemplo
  `i18n.global.locale`) para que cambie en vivo.

Los textos propios ("Aviso de privacidad", "Redes sociales", la línea de
derechos) vienen traducidos. Los que pasa el proyecto —enlaces y redes de la
cinta, contacto del pie, aviso legal— aceptan `LocalizedText`: un texto fijo
o `{ es, en }`; sin `en`, se muestra el español.

```ts
// app.config.ts
fiUi: {
  topBar: {
    links: [{ label: { es: 'Salud UNAM', en: 'UNAM Health' }, to: 'https://salud.unam.mx/' }],
  },
}
```

`FiHeader` tiene la ranura `top-bar-end` (y `FiTopBar` la ranura `end`) para
poner un selector de idioma u otro control al final de la cinta, junto a las
redes. Para buscar un enlace del portal no compares su etiqueta (cambia con el
idioma): usa `to`.

`useFiT()`, `useFiText()` y `resolveText()` se exportan por si un proyecto
quiere resolver `LocalizedText` en sus propios componentes.

## Barra del navegador y portadas de pantalla completa

- **`theme-color`**: el paquete lo pone y lo mantiene al día (rojo mientras se
  ve la cinta, oscuro cuando solo queda el header; sigue al tema especial). No
  declares otro `<meta name="theme-color">` en el proyecto: tendrías dos.
- **Safari 26** ya no lee `theme-color` y tiñe su barra con el fondo de la
  página; por eso el paquete pinta `<html>` con el rojo de la cinta (el `body`
  conserva `--ui-bg`). Apple cambia este comportamiento entre versiones:
  revísalo en un dispositivo real.
- **`--fi-header-offset`**: alto del encabezado completo (cinta + barra) sin
  contraer, con la cinta medida en vivo. Una portada que llena la primera
  pantalla usa `min-h-[calc(100svh-var(--fi-header-offset))]`.
- **`@fi-unam/ui/data`**: solo los datos del portal (enlaces, redes, contacto),
  para importarlos desde `app.config.ts` sin arrastrar componentes. El módulo
  de Nuxt habilita a Nitro para compilar este paquete; sin eso el build del
  servidor falla al importar TypeScript desde `node_modules`.

## Componentes

| Componente | Sobre | Qué es |
|------------|-------|--------|
| `FiHeader` | `UHeader` | Franja roja de accesos + barra oscura fija con logotipo blanco, `title` del sitio, menú en versalitas y slot `actions`. Se contrae al hacer scroll; en móvil todo pasa a un panel lateral oscuro. |
| `FiTopBar` | — | Réplica de la cinta roja del portal (#top-bar): mismas medidas, contenedor, hover, submenú y redes que se despliegan con el color de su marca. `links` y `social` por prop o por configuración. |
| `FiFooter` | `UFooter` | Pie grafito con filete de 5 px: logotipo y aviso de privacidad, domicilio, contacto; fila de enlaces y redes; franja de derechos. Slot por defecto para contenido propio. |
| `FiLogo` | — | `variant`: `wordmark`, `inverse`, `footer`, `escudo`; `height`. |
| `FiSectionHeading` | — | Encabezado de sección de los micrositios: etiqueta-flecha (`eyebrow`), título azul marino, filete dorado con rombo, descripción. |
| `FiStepBadge` | — | Círculo numerado marino/oro de las infografías (alterna solo). |
| `FiReveal` | — | Entrada suave al hacer scroll; nunca deja contenido invisible. |
| `FiBackButton` | `ULink` | "Regresar": historial si se navegó dentro del sitio, `fallback` si no. |
| `FiThemeRibbon` | — | Listón del tema activo; no pinta nada sin tema. |

Los enlaces, redes y contacto por defecto son los del portal (`src/fi-data.ts`);
todos se pueden reemplazar por props.

Clases editoriales (en cualquier elemento): `.fi-tag` (etiqueta-flecha),
`.fi-band` (banda-píldora), `.fi-eyebrow` (antetítulo serif), `.fi-serif-accent`
(acento en itálica serif dentro de un titular), `.fi-navlink` (versalitas de
menú). La serif es Playfair Display (`--font-serif`); cárgala en el proyecto o
caerá en Georgia.

## Desarrollo

```bash
npm install
npm test
```

El paquete se publica como código fuente (`.vue`, `.ts`); el proyecto que lo
consume lo compila. Su `typecheck` cubre también los archivos del paquete, así
que un error de tipos aquí aparece allá.
