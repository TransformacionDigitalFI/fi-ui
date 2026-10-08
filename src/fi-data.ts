import type { LocalizedText } from './i18n'

/**
 * Datos públicos del portal de la Facultad (ingenieria.unam.mx): los enlaces
 * de la barra superior, las redes y el contacto del pie. Son los valores por
 * defecto de FiTopBar y FiFooter; cada proyecto puede pasar los suyos.
 * Los textos son `LocalizedText`: fijos o `{ es, en }`.
 */

export interface FiLink {
  label: LocalizedText
  to: string
  target?: '_blank' | '_self'
  children?: FiLink[]
}

export interface FiSocialLink {
  /** Texto que la cinta despliega al pasar el cursor; también es el aria-label. */
  label: LocalizedText
  /**
   * Nombre Iconify. Los de por defecto son los del portal: Font Awesome 6
   * (`@iconify-json/fa6-brands`) y Bootstrap Icons (`@iconify-json/bi`).
   */
  icon: string
  to: string
  /** Fondo al pasar el cursor en la cinta (el color de la marca). */
  color?: string
  /** Por defecto `_blank`; el contacto del portal abre en la misma pestaña. */
  target?: '_blank' | '_self'
}

export interface FiContact {
  institution: LocalizedText
  entity: LocalizedText
  address: LocalizedText[]
  phone: string
  email: string
}

const PORTAL = 'https://www.ingenieria.unam.mx'

export const fiPortalUrl = PORTAL

export const fiPrivacyUrl = `${PORTAL}/aviso_privacidad.php`

export const fiTopLinks: FiLink[] = [
  { label: { es: 'Alumnado', en: 'Students' }, to: `${PORTAL}/alumnado.php` },
  { label: { es: 'Profesorado', en: 'Faculty' }, to: `${PORTAL}/profesorado.php` },
  { label: { es: 'Exalumnos', en: 'Alumni' }, to: `${PORTAL}/exalumnos.php` },
  {
    label: { es: 'Género', en: 'Gender' },
    to: `${PORTAL}/genero.php`,
    children: [
      { label: 'Género-FI', to: `${PORTAL}/genero.php` },
      { label: 'UIG-FI', to: `${PORTAL}/uigfi.php` },
      { label: 'CINIG-FI', to: `${PORTAL}/cinig.php` },
      { label: 'CIGU', to: 'https://coordinaciongenero.unam.mx/', target: '_blank' },
    ],
  },
  { label: 'UNAM', to: 'https://www.unam.mx/', target: '_blank' },
  { label: { es: 'Avisos', en: 'Notices' }, to: `${PORTAL}/listado_avisos.php` },
  { label: { es: 'Acciones Institucionales', en: 'Institutional Actions' }, to: `${PORTAL}/acciones_institucionales.php` },
]

// Etiquetas, íconos y colores tal como los tiene la cinta del portal
// (#top-social del tema Canvas, colores --cnvs-color-*).
export const fiSocialLinks: FiSocialLink[] = [
  { label: 'Facebook', icon: 'i-fa6-brands-facebook-f', color: '#3B5998', to: 'https://www.facebook.com/FacultadIngenieriaUNAM' },
  { label: 'Twitter', icon: 'i-fa6-brands-x-twitter', color: '#010101', to: 'https://twitter.com/FIUNAM_MX' },
  { label: 'Instagram', icon: 'i-fa6-brands-instagram', color: '#FCAF45', to: 'https://www.instagram.com/fiunam_mx/' },
  { label: 'Youtube', icon: 'i-fa6-brands-youtube', color: '#C4302B', to: 'https://www.youtube.com/tvingenieria' },
  { label: 'Telegram', icon: 'i-fa6-brands-telegram', color: '#24A1DE', to: 'https://t.me/s/FIUNAM_MX' },
  { label: 'Linkedin', icon: 'i-fa6-brands-linkedin', color: '#0E76A8', to: 'https://mx.linkedin.com/in/facultad-de-ingenier%C3%ADa-oficial-unam-2a0b4b207' },
]

/** La cinta del portal cierra las redes con el contacto de la Facultad. */
export const fiTopBarSocial: FiSocialLink[] = [
  ...fiSocialLinks,
  { label: 'fainge@unam.mx', icon: 'i-bi-envelope-fill', color: '#6567A5', to: `${PORTAL}/contacto.php`, target: '_self' },
]

export const fiContact: FiContact = {
  institution: { es: 'Universidad Nacional Autónoma de México', en: 'National Autonomous University of Mexico' },
  entity: { es: 'Facultad de Ingeniería', en: 'Faculty of Engineering' },
  address: ['Av. Universidad 3000, Ciudad Universitaria,', 'Coyoacán, Cd. Mx., C.P. 04510'],
  phone: '55 5622 0607',
  email: 'fainge@unam.mx',
}

export const fiLegalNotice: LocalizedText = {
  es: 'Esta es la página electrónica institucional de la Facultad de Ingeniería de la UNAM. '
    + 'Puede ser reproducida con fines no lucrativos, siempre y cuando no se mutile, se cite '
    + 'la fuente completa y su dirección electrónica.',
  en: 'This is the official website of the Faculty of Engineering, UNAM. '
    + 'It may be reproduced for non-profit purposes, provided it is not altered and the full '
    + 'source and its web address are cited.',
}
