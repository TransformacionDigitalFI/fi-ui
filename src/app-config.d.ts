/**
 * Tipos de src/app-config.js. El archivo es JavaScript para que Node pueda
 * cargarlo desde vite.config.ts (ver su cabecera); TypeScript lee esta
 * declaración en su lugar.
 *
 * `fiAppConfig.ui` va abierto (`Record<string, any>`) y no con la forma exacta
 * de cada componente: se mezcla con el `ui` de Nuxt UI y del proyecto, cuyos
 * tipos genera cada proyecto, y una forma exacta obligaba a castear en un
 * vite.config.ts con tipos estrictos.
 */

/** Colores que Nuxt UI debe generar como variantes (`color="tertiary"`). */
export declare const fiUiThemeColors: string[]

/** Roles de marca → escalas del paquete (`fi-primary`…). */
export declare const fiUiColors: {
  primary: string
  secondary: string
  tertiary: string
  neutral: string
}

/** Estados por defecto: success green, info sky, warning amber, error red. */
export declare const fiStatusColors: {
  success: string
  info: string
  warning: string
  error: string
}

/** Íconos de Nuxt UI (`ui.icons`) en Phosphor. */
export declare const fiIcons: Readonly<Record<string, string>>

/** Clases del texto primario sobre un tinte del primario (paso 600). */
export declare const fiPrimaryOnTint: string

/** Configuración de Nuxt UI con el lenguaje visual FI (el `ui` del app.config). */
export declare const fiAppConfig: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ui: Record<string, any>
}
