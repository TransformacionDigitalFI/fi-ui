import type { LocalizedText } from '../i18n'

/**
 * Registro de temas. Los COLORES viven en src/css/themes.css — aquí solo va lo
 * que el CSS no puede decir: nombre, motivo, cuándo se activa solo y el color
 * de la barra del navegador, que el servidor necesita antes de tener CSS.
 * `tests/themes.test.ts` falla si este registro y el CSS no listan los mismos
 * temas o no dicen el mismo primario.
 */

/** Fecha de calendario sin año, `MM-DD`. */
export type MonthDay = `${number}-${number}`

/** Ventana de fechas inclusiva. Si `from` es posterior a `to`, cruza el año. */
export interface FiDateWindow {
  from: MonthDay
  to: MonthDay
}

export interface FiThemeDefinition {
  label: LocalizedText
  /** Por qué existe el tema; sirve de texto alternativo del listón. */
  description: LocalizedText
  /** Si el tema muestra listón de conmemoración (color en --fi-ribbon). */
  ribbon: boolean
  /** Fechas en que se activa con `theme: 'auto'`. Sin fechas = solo manual. */
  dates: FiDateWindow[]
  /**
   * Color de la barra del navegador (`<meta name="theme-color">`) con este
   * tema: su semilla primaria, la del <html> y la cinta. Vive aquí, y no solo
   * en el CSS, porque el servidor tiene que escribirlo en el HTML antes de
   * que exista una hoja resuelta. `tests/themes.test.ts` verifica que
   * coincida con --fi-seed-primary de themes.css.
   */
  chromeColor: string
}

export const fiThemes = {
  fi: {
    label: { es: 'Facultad de Ingeniería', en: 'Faculty of Engineering' },
    description: { es: 'Identidad institucional de la Facultad de Ingeniería, UNAM.', en: 'Institutional identity of the Faculty of Engineering, UNAM.' },
    ribbon: false,
    dates: [],
    chromeColor: '#CD171E',
  },
  luto: {
    label: { es: 'Luto institucional', en: 'Institutional mourning' },
    description: { es: 'La Facultad de Ingeniería está de luto.', en: 'The Faculty of Engineering is in mourning.' },
    ribbon: true,
    dates: [],
    chromeColor: '#5B636B',
  },
  '8m': {
    label: '8M',
    description: { es: '8 de marzo, Día Internacional de la Mujer.', en: 'March 8, International Women’s Day.' },
    ribbon: true,
    dates: [{ from: '03-08', to: '03-08' }],
    chromeColor: '#8B4AB8',
  },
  'prevencion-suicidio': {
    label: { es: 'Prevención del suicidio', en: 'Suicide prevention' },
    description: { es: '10 de septiembre, Día Mundial para la Prevención del Suicidio.', en: 'September 10, World Suicide Prevention Day.' },
    ribbon: true,
    dates: [{ from: '09-10', to: '09-10' }],
    chromeColor: '#0B7A82',
  },
  'salud-mental': {
    label: { es: 'Salud mental', en: 'Mental health' },
    description: { es: '10 de octubre, Día Mundial de la Salud Mental.', en: 'October 10, World Mental Health Day.' },
    ribbon: true,
    dates: [{ from: '10-10', to: '10-10' }],
    chromeColor: '#2E7D32',
  },
  'cancer-mama': {
    label: { es: 'Cáncer de mama', en: 'Breast cancer' },
    description: { es: '19 de octubre, Día Internacional de la Lucha contra el Cáncer de Mama.', en: 'October 19, International Breast Cancer Day.' },
    ribbon: true,
    dates: [{ from: '10-19', to: '10-19' }],
    chromeColor: '#BE185D',
  },
  '25n': {
    label: '25N',
    description: { es: '25 de noviembre, Día Internacional de la Eliminación de la Violencia contra las Mujeres.', en: 'November 25, International Day for the Elimination of Violence against Women.' },
    ribbon: true,
    dates: [{ from: '11-25', to: '11-25' }],
    chromeColor: '#C2410C',
  },
} as const satisfies Record<string, FiThemeDefinition>

export type FiThemeId = keyof typeof fiThemes

export const FI_DEFAULT_THEME: FiThemeId = 'fi'

export const fiThemeIds = Object.keys(fiThemes) as FiThemeId[]

export function isFiThemeId(value: unknown): value is FiThemeId {
  return typeof value === 'string' && Object.hasOwn(fiThemes, value)
}
