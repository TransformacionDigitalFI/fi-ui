/**
 * Configuración de Nuxt UI que conecta sus colores semánticos con las escalas
 * del paquete. Es lo único que el paquete cambia de Nuxt UI: radios, tamaños
 * y variantes se quedan en los valores de Nuxt UI (el radio por defecto,
 * 0.25rem, ya es el del portal FI).
 *
 * `info`, `success`, `warning` y `error` tampoco se tocan: un tema especial
 * cambia la marca, nunca el significado de un estado.
 */

/** Colores que Nuxt UI debe generar como variantes (`color="tertiary"`). */
export const fiUiThemeColors = ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error']

export const fiUiColors = {
  primary: 'fi-primary',
  secondary: 'fi-secondary',
  tertiary: 'fi-tertiary',
  neutral: 'fi-neutral',
}

export const fiAppConfig = {
  ui: {
    colors: fiUiColors,
  },
}
