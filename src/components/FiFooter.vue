<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UContainer from '@nuxt/ui/components/Container.vue'
import UFooter from '@nuxt/ui/components/Footer.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { computed } from 'vue'
import { useFiConfig } from '../composables/useFiConfig'
import { fiContact, fiLegalNotice, fiPrivacyUrl, fiSocialLinks } from '../fi-data'
import type { FiContact, FiLink, FiSocialLink } from '../fi-data'
import { useFiT, useFiText } from '../i18n'
import type { LocalizedText } from '../i18n'
import FiLogo from './FiLogo.vue'

/**
 * Pie de los sitios FI sobre UFooter de Nuxt UI, como el portal y los
 * micrositios: bloque grafito con filete claro de 5 px arriba, tres columnas
 * (logotipo y aviso de privacidad, domicilio, contacto), una fila con enlaces
 * y redes, y la franja de derechos más oscura al final.
 *
 * Es oscuro siempre: la clase `dark` en la raíz hace que los tokens de Nuxt UI
 * (text-muted, border-default…) tomen sus valores de modo oscuro solo aquí
 * dentro, así que lo que se ponga en los slots se lee bien sin clases a mano.
 *
 * El slot por defecto es para contenido propio del sitio (marca, columnas);
 * ocupa la fila completa debajo de las tres columnas.
 *
 * Contacto, redes, enlaces, aviso de privacidad y leyenda legal son por
 * proyecto, todos con la misma precedencia: prop > `fiUi.footer` en la
 * configuración > los del portal. `false` (en prop o configuración) quita el
 * aviso o la leyenda; no cae al valor del portal.
 */
const props = withDefaults(defineProps<{
  contact?: FiContact
  social?: FiSocialLink[]
  links?: FiLink[]
  privacyUrl?: string | false
  legalNotice?: LocalizedText | false
}>(), {
  contact: undefined,
  social: undefined,
  links: undefined,
  privacyUrl: undefined,
  legalNotice: undefined,
})

const config = useFiConfig()
const t = useFiT()
const text = useFiText()
const contact = computed(() => props.contact ?? config.value.footer?.contact ?? fiContact)
const social = computed(() => props.social ?? config.value.footer?.social ?? fiSocialLinks)
const links = computed(() => props.links ?? config.value.footer?.links ?? [])
const privacyUrl = computed(() => props.privacyUrl ?? config.value.footer?.privacyUrl ?? fiPrivacyUrl)
const legalNotice = computed(() => props.legalNotice ?? config.value.footer?.legalNotice ?? fiLegalNotice)

// Pestaña nueva solo para sitios externos: una ruta propia del proyecto
// (`/privacidad`) se abre en la misma, como cualquier enlace interno.
const isExternal = (url: string) => /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url)

// Un teléfono escrito con lada internacional (`+52 55 …`) se usa tal cual; uno
// local, como los del portal, se marca desde México.
const phoneHref = computed(() => {
  const digits = contact.value.phone.replace(/[^\d+]/g, '')
  return `tel:${digits.startsWith('+') ? digits : `+52${digits}`}`
})

const year = new Date().getFullYear()
</script>

<template>
  <UFooter
    class="dark border-t-5 border-white/15 bg-neutral-700 text-default"
    :ui="{
      top: 'pt-14 pb-10',
      container: 'py-6 lg:py-5 border-t border-white/10',
      bottom: 'p-0 lg:p-0 bg-black/20',
    }"
  >
    <template #top>
      <UContainer class="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <FiLogo
            variant="footer"
            height="67px"
          />
          <ULink
            v-if="privacyUrl"
            raw
            :to="privacyUrl"
            :target="isExternal(privacyUrl) ? '_blank' : undefined"
            class="mt-4 inline-block text-sm text-muted transition-colors hover:text-highlighted"
          >
            {{ t('privacyNotice') }}
          </ULink>
        </div>

        <div>
          <p class="text-[0.9375rem] font-bold uppercase tracking-wider text-highlighted">
            {{ text(contact.institution) }}
          </p>
          <address class="mt-4 text-sm not-italic leading-relaxed text-muted">
            <strong class="font-semibold text-highlighted">{{ text(contact.entity) }}</strong>
            <span
              v-for="line in contact.address"
              :key="text(line)"
              class="block"
            >{{ text(line) }}</span>
          </address>
        </div>

        <dl class="space-y-4 text-sm">
          <div>
            <dt class="font-semibold text-highlighted">
              {{ t('phone') }}
            </dt>
            <dd class="text-muted">
              <a
                :href="phoneHref"
                class="hover:text-highlighted"
              >{{ contact.phone }}</a>
            </dd>
          </div>
          <div>
            <dt class="font-semibold text-highlighted">
              {{ t('email') }}
            </dt>
            <dd>
              <a
                :href="`mailto:${contact.email}`"
                class="text-highlighted underline decoration-white/40 underline-offset-2 hover:decoration-white"
              >{{ contact.email }}</a>
            </dd>
          </div>
        </dl>

        <div
          v-if="$slots.default"
          class="md:col-span-2 lg:col-span-3"
        >
          <slot />
        </div>
      </UContainer>
    </template>

    <template #left>
      <nav
        v-if="links.length"
        :aria-label="t('footerLinks')"
      >
        <ul class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li
            v-for="link in links"
            :key="link.to"
          >
            <ULink
              raw
              :to="link.to"
              :target="link.target"
              class="text-sm text-muted transition-colors hover:text-highlighted"
            >
              {{ text(link.label) }}
            </ULink>
          </li>
        </ul>
      </nav>
    </template>

    <!-- El hover de un botón neutro ghost es bg-accented (fiAppConfig), que en
         una isla `dark` es neutral-700: el mismo gris de este pie, así que no
         se veía. Aquí aclara el fondo en lugar de oscurecerlo. -->
    <template #right>
      <UButton
        v-for="item in social"
        :key="item.to"
        :to="item.to"
        :target="item.target ?? '_blank'"
        :icon="item.icon"
        :aria-label="text(item.label)"
        color="neutral"
        variant="ghost"
        size="sm"
        class="hover:bg-white/10 active:bg-white/15"
      />
    </template>

    <template #bottom>
      <UContainer class="py-8 text-sm text-muted">
        <p>{{ t('rights', { year }) }}</p>
        <p
          v-if="legalNotice"
          class="mt-3 max-w-5xl leading-relaxed"
        >
          {{ text(legalNotice) }}
        </p>
      </UContainer>
    </template>
  </UFooter>
</template>
