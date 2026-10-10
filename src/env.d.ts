/**
 * Módulos de imagen que importan los componentes del paquete (FiLogo).
 *
 * Nuxt y Vite ya los declaran (vite/client); este archivo cubre los
 * tsconfig que no los cargan — p. ej. el de las pruebas de un proyecto —
 * cuando compilan el código fuente del paquete. El módulo de Nuxt lo añade
 * solo a los tipos del proyecto; en otro tsconfig:
 *
 *   /// <reference types="@fi-unam/ui/env" />
 */
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
