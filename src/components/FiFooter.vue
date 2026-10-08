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
 * Contacto, redes y enlaces son por proyecto: prop > `fiUi.footer` en la
 * configuración > los del portal.
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
  privacyUrl: () => fiPrivacyUrl,
  legalNotice: () => fiLegalNotice,
})

const config = useFiConfig()
const t = useFiT()
const text = useFiText()
const contact = computed(() => props.contact ?? config.value.footer?.contact ?? fiContact)
const social = computed(() => props.social ?? config.value.footer?.social ?? fiSocialLinks)
const links = computed(() => props.links ?? config.value.footer?.links ?? [])

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
            v-if="props.privacyUrl"
            raw
            :to="props.privacyUrl"
            target="_blank"
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
                :href="`tel:+52${contact.phone.replace(/\s+/g, '')}`"
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

    <template #right>
      <UButton
        v-for="item in social"
        :key="item.to"
        :to="item.to"
        target="_blank"
        :icon="item.icon"
        :aria-label="text(item.label)"
        color="neutral"
        variant="ghost"
        size="sm"
      />
    </template>

    <template #bottom>
      <UContainer class="py-8 text-sm text-muted">
        <p>{{ t('rights', { year }) }}</p>
        <p
          v-if="props.legalNotice"
          class="mt-3 max-w-5xl leading-relaxed"
        >
          {{ text(props.legalNotice) }}
        </p>
      </UContainer>
    </template>
  </UFooter>
</template>
