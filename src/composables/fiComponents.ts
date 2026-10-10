import type { InjectionKey } from 'vue'
import { contrast } from '../color'
import type { LocalizedText } from '../i18n'

/**
 * Tipos y piezas compartidas por los componentes del paquete. Viven aquí y no
 * en src/components porque el módulo de Nuxt registra como componente todo lo
 * que encuentra en esa carpeta.
 */

/**
 * Mapa semántico único de estados (contrato D3): success = completado,
 * vigente, abierto; warning = pendiente, por vencer, degradado; error = fallo,
 * bloqueado, riesgo; info = informativo; neutral = borrador, inactivo,
 * cerrado, archivado. El proyecto traduce sus estados de dominio con su propia
 * tabla (`const STATUS_TONE: Record<EstadoSolicitud, FiStatus> = { … }`).
 */
export type FiStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral'

/**
 * Ícono por defecto de cada estado (Phosphor). Con el texto, es lo que evita
 * que el estado dependa solo del color (WCAG 1.4.1): cada forma es distinta.
 */
export const fiStatusIcons: Readonly<Record<FiStatus, string>> = {
  success: 'i-ph-check-circle',
  warning: 'i-ph-clock',
  error: 'i-ph-x-circle',
  info: 'i-ph-info',
  neutral: 'i-ph-minus-circle',
}

/** Tono de una cifra: `default` es el círculo azul marino; los demás, solo si la cifra ES un estado. */
export type FiStatTone = 'default' | 'success' | 'warning' | 'error' | 'info'

/** Una cifra para `FiStatGrid` (el atajo `stats`); mismas claves que las props de `FiStat`. */
export interface FiStatItem {
  label: LocalizedText
  value: string | number
  icon?: string
  hint?: LocalizedText
  tone?: FiStatTone
  to?: string
  loading?: boolean
}

export type FiIconBadgeTone = 'navy' | 'gold' | 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info'

/** 32, 40, 48 y 56 px. */
export type FiIconBadgeSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * FiStatGrid lo provee para que cada FiStat sepa que ya está dentro de un
 * `<dl>`: dentro rinde `<div><dt/><dd/></div>`; suelto, su propio `<dl>`.
 * Así la lista es válida con el atajo `stats` y con FiStat en el slot.
 */
export const fiStatGridKey: InjectionKey<true> = Symbol('fi-ui:stat-grid')

const LIGHT_TEXT = '#F8F9FA' // --color-fi-neutral-50
const DARK_TEXT = '#212529' // --color-fi-neutral-900

/**
 * Color de texto legible sobre un fondo de marca (las redes de FiTopBar al
 * pasar el cursor). Gana el que dé más contraste: el texto claro del portal
 * sobre el naranja de Instagram quedaba en 1.75:1. Un color que no sea hex de
 * seis dígitos (var(), rgb()) conserva el texto claro: no hay cómo medirlo
 * sin navegador.
 */
export function fiReadableTextOn(background: string | undefined): string {
  if (!background || !/^#[0-9a-f]{6}$/i.test(background.trim())) return 'var(--color-fi-neutral-50)'
  return contrast(DARK_TEXT, background) > contrast(LIGHT_TEXT, background)
    ? 'var(--color-fi-neutral-900)'
    : 'var(--color-fi-neutral-50)'
}
