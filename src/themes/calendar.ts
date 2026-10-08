import { FI_DEFAULT_THEME, fiThemes, isFiThemeId } from './registry'
import type { FiThemeId, MonthDay } from './registry'

/**
 * Cuándo se activa solo cada tema. Las fechas se evalúan en la zona horaria de
 * la Facultad, no en la del servidor ni la del navegador: un servidor en UTC
 * cambiaría de tema a las 18:00 del día anterior.
 */

export const FI_TIME_ZONE = 'America/Mexico_City'

/** `'auto'` decide por fecha; un id fija ese tema sin importar la fecha. */
export type FiThemeSetting = FiThemeId | 'auto'

export interface FiCalendarEntry {
  theme: FiThemeId
  from: MonthDay
  to: MonthDay
}

const MONTH_DAY = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/** Calendario por defecto: las fechas declaradas en el registro de temas. */
export function fiDefaultCalendar(): FiCalendarEntry[] {
  return Object.entries(fiThemes).flatMap(([theme, def]) =>
    def.dates.map(window => ({ theme: theme as FiThemeId, ...window })),
  )
}

export function monthDayIn(date: Date, timeZone: string = FI_TIME_ZONE): MonthDay {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, month: '2-digit', day: '2-digit' })
    .formatToParts(date)
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  return `${month}-${day}` as MonthDay
}

function assertMonthDay(value: string): void {
  if (!MONTH_DAY.test(value)) throw new Error(`Fecha de tema no válida: "${value}" (se espera MM-DD)`)
}

function contains(entry: FiCalendarEntry, today: MonthDay): boolean {
  return entry.from <= entry.to
    ? today >= entry.from && today <= entry.to
    : today >= entry.from || today <= entry.to
}

/** Largo aproximado de la ventana en días; solo sirve para desempatar. */
function span(entry: FiCalendarEntry): number {
  const ordinal = (md: MonthDay) => {
    const [m, d] = md.split('-').map(Number) as [number, number]
    return m * 31 + d
  }
  const raw = ordinal(entry.to) - ordinal(entry.from)
  return raw >= 0 ? raw : raw + 12 * 31
}

export interface ResolveFiThemeOptions {
  setting?: FiThemeSetting | string | null
  date?: Date
  timeZone?: string
  calendar?: FiCalendarEntry[]
}

/**
 * Tema vigente. Un valor fijo gana siempre (así se impone el luto aunque sea
 * 8 de marzo). En `'auto'`, si dos ventanas se traslapan gana la más corta —
 * el día concreto sobre el mes que lo contiene — y, empatadas, la primera.
 * Un valor desconocido cae en el tema base en vez de romper la página.
 */
export function resolveFiTheme(options: ResolveFiThemeOptions = {}): FiThemeId {
  const { setting = 'auto', date = new Date(), timeZone = FI_TIME_ZONE } = options
  if (setting && setting !== 'auto') return isFiThemeId(setting) ? setting : FI_DEFAULT_THEME

  const calendar = options.calendar ?? fiDefaultCalendar()
  const today = monthDayIn(date, timeZone)
  let best: FiCalendarEntry | undefined
  for (const entry of calendar) {
    assertMonthDay(entry.from)
    assertMonthDay(entry.to)
    if (contains(entry, today) && (!best || span(entry) < span(best))) best = entry
  }
  return best?.theme ?? FI_DEFAULT_THEME
}
