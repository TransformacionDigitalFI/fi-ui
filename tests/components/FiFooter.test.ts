import { describe, expect, it } from 'vitest'
import { fiPrivacyUrl } from '../../src/fi-data'
import { loadComponent, openingTag, render } from './render'

const FiFooter = await loadComponent('FiFooter')

const privacyLink = (html: string) => openingTag(html, /<a [^>]*>\s*Aviso de privacidad/)

describe('FiFooter: prop > fiUi.footer > portal', () => {
  it('sin prop ni configuración usa el aviso del portal, en otra pestaña por ser externo', async () => {
    const link = privacyLink(await render(FiFooter))
    expect(link).toContain(`href="${fiPrivacyUrl}"`)
    expect(link).toContain('target="_blank"')
  })

  it('la configuración gana al portal; una ruta propia abre en la misma pestaña', async () => {
    const link = privacyLink(await render(FiFooter, {}, { config: { footer: { privacyUrl: '/privacidad' } } }))
    expect(link).toContain('href="/privacidad"')
    expect(link).not.toContain('target=')
  })

  it('la prop gana a la configuración', async () => {
    const html = await render(FiFooter, { privacyUrl: '/aviso' }, { config: { footer: { privacyUrl: '/privacidad' } } })
    expect(privacyLink(html)).toContain('href="/aviso"')
  })

  it('`false` en la configuración quita aviso y leyenda (no cae al portal)', async () => {
    const html = await render(FiFooter, {}, { config: { footer: { privacyUrl: false, legalNotice: false } } })
    expect(html).not.toContain('Aviso de privacidad')
    expect(html).not.toContain('max-w-5xl')
  })

  it('leyenda legal por configuración, `{ es, en }`', async () => {
    const html = await render(FiFooter, {}, { locale: 'en', config: { footer: { legalNotice: { es: 'Leyenda', en: 'Notice' } } } })
    expect(html).toMatch(/max-w-5xl[^>]*>\s*Notice\s*</)
  })

  it('teléfono: local se marca desde México; con lada internacional, tal cual', async () => {
    const contact = { institution: 'I', entity: 'E', address: [], email: 'a@b.mx' }
    expect(await render(FiFooter, { contact: { ...contact, phone: '55 5622 0866' } })).toContain('href="tel:+525556220866"')
    expect(await render(FiFooter, { contact: { ...contact, phone: '+1 (555) 010-0000' } })).toContain('href="tel:+15550100000"')
  })

  it('las redes respetan su `target`', async () => {
    const html = await render(FiFooter, {
      social: [
        { label: 'Contacto', icon: 'i-ph-envelope', to: '/contacto', target: '_self' },
        { label: 'Instagram', icon: 'i-fa6-brands-instagram', to: 'https://instagram.com/x' },
      ],
    })
    expect(openingTag(html, /<a [^>]*href="\/contacto"[^>]*>/)).toContain('target="_self"')
    expect(openingTag(html, /<a [^>]*href="https:\/\/instagram.com\/x"[^>]*>/)).toContain('target="_blank"')
  })
})
