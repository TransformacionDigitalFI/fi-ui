/**
 * Configuración de Vite para Vue + Vite sin Nuxt (`@fi-unam/ui/vite`).
 *
 *   // vite.config.ts
 *   import ui from '@nuxt/ui/vite'
 *   import { fiUiViteConfig, fiUiViteOptions } from '@fi-unam/ui/vite'
 *   export default defineConfig({
 *     ...fiUiViteConfig,
 *     plugins: [vue(), ui(fiUiViteOptions)],
 *   })
 *
 * Es JavaScript, con imports con extensión y sin dependencias, porque Vite
 * carga vite.config.ts dejando fuera los paquetes (Vite 8, igual con
 * `configLoader` 'bundle' y 'runner') y Node no quita tipos dentro de
 * node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). Por eso esto
 * no vive en src/vue/plugin.ts, que es TypeScript; ese archivo lo reexporta
 * para el código de la app. tests/vite-entry.test.ts lo carga con Node desde
 * un node_modules de verdad.
 */

import { fiAppConfig, fiUiThemeColors } from './app-config.js'

/**
 * Opciones para `ui()` de `@nuxt/ui/vite`: la configuración FI de Nuxt UI,
 * la variante `tertiary` y el color mode apagado — el lenguaje FI es solo
 * claro, con islas `dark` (ver tokens.css). Si el proyecto lo enciende, que
 * fije el modo en claro y no ofrezca selector.
 *
 * Opciones propias del proyecto: mézclalas con `defu(propias, fiUiViteOptions)`
 * para que ganen las del proyecto.
 */
export const fiUiViteOptions = {
  ui: fiAppConfig.ui,
  theme: { colors: fiUiThemeColors },
  colorMode: false,
}

/**
 * Configuración de Vite que el módulo de Nuxt pone solo. El paquete se
 * publica como código fuente (.vue y .ts) y Vite no debe pre-empaquetarlo:
 * los componentes .vue se cargan aparte, y si el resto del paquete viajara
 * empaquetado habría dos copias de las claves de inyección — createFiUi
 * proveería con una y los componentes leerían con otra, y el idioma, el tema
 * y los enlaces caerían en silencio a sus valores por defecto. Cada entrada
 * va por separado para que un import profundo tampoco se empaquete.
 * Si el proyecto ya tiene `optimizeDeps`, que una las listas.
 */
export const fiUiViteConfig = {
  optimizeDeps: {
    exclude: ['@fi-unam/ui', '@fi-unam/ui/vue', '@fi-unam/ui/data'],
  },
}
