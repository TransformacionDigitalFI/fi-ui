/** Tipos de src/vite.js (`@fi-unam/ui/vite`). */

/** Opciones para `ui()` de `@nuxt/ui/vite`. */
export declare const fiUiViteOptions: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ui: Record<string, any>
  theme: { colors: string[] }
  colorMode: false
}

/** Configuración de Vite: no pre-empaquetar el paquete. */
export declare const fiUiViteConfig: {
  optimizeDeps: { exclude: string[] }
}
