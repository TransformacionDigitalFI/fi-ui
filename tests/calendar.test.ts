import { describe, expect, it } from 'vitest'
import { fiDefaultCalendar, monthDayIn, resolveFiTheme } from '../src/themes/calendar'

// Mediodía en Ciudad de México (UTC-6, sin horario de verano desde 2022).
const cdmx = (iso: string) => new Date(`${iso}T12:00:00-06:00`)

describe('resolveFiTheme', () => {
  it('sin fecha especial usa el tema FI', () => {
    expect(resolveFiTheme({ date: cdmx('2026-10-07') })).toBe('fi')
  })

  it.each([
    ['2027-03-08', '8m'],
    ['2026-09-10', 'prevencion-suicidio'],
    ['2026-10-10', 'salud-mental'],
    ['2026-10-19', 'cancer-mama'],
    ['2026-11-25', '25n'],
  ])('el %s activa %s', (day, theme) => {
    expect(resolveFiTheme({ date: cdmx(day) })).toBe(theme)
  })

  it('evalúa la fecha en la zona de la Facultad, no en UTC', () => {
    // 7 de marzo a las 19:00 en CDMX ya es 8 de marzo en UTC.
    const evening = new Date('2027-03-07T19:00:00-06:00')
    expect(resolveFiTheme({ date: evening })).toBe('fi')
    expect(resolveFiTheme({ date: evening, timeZone: 'UTC' })).toBe('8m')
  })

  it('un tema fijo gana sobre el calendario', () => {
    expect(resolveFiTheme({ setting: 'luto', date: cdmx('2027-03-08') })).toBe('luto')
  })

  it('un valor desconocido cae en el tema FI', () => {
    expect(resolveFiTheme({ setting: 'no-existe' })).toBe('fi')
  })

  it('con ventanas traslapadas gana la más corta', () => {
    const calendar = [
      { theme: 'cancer-mama' as const, from: '10-01' as const, to: '10-31' as const },
      { theme: 'salud-mental' as const, from: '10-10' as const, to: '10-10' as const },
    ]
    expect(resolveFiTheme({ date: cdmx('2026-10-10'), calendar })).toBe('salud-mental')
    expect(resolveFiTheme({ date: cdmx('2026-10-11'), calendar })).toBe('cancer-mama')
  })

  it('una ventana puede cruzar el año', () => {
    const calendar = [{ theme: 'luto' as const, from: '12-28' as const, to: '01-02' as const }]
    expect(resolveFiTheme({ date: cdmx('2026-12-31'), calendar })).toBe('luto')
    expect(resolveFiTheme({ date: cdmx('2027-01-02'), calendar })).toBe('luto')
    expect(resolveFiTheme({ date: cdmx('2027-01-03'), calendar })).toBe('fi')
  })

  it('rechaza fechas mal escritas en vez de ignorarlas', () => {
    const calendar = [{ theme: '8m' as const, from: '3-8' as const, to: '03-08' as const }]
    expect(() => resolveFiTheme({ date: cdmx('2027-03-08'), calendar })).toThrow(/MM-DD/)
  })
})

describe('calendario por defecto', () => {
  it('solo trae temas con fechas, y el luto no es uno', () => {
    const themes = fiDefaultCalendar().map(e => e.theme)
    expect(themes).not.toContain('luto')
    expect(themes).not.toContain('fi')
  })

  it('monthDayIn rellena con cero', () => {
    expect(monthDayIn(cdmx('2027-03-08'))).toBe('03-08')
  })
})
