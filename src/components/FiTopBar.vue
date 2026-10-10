<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import ULink from '@nuxt/ui/components/Link.vue'
import { fiReadableTextOn } from '../composables/fiComponents'
import { useFiConfig } from '../composables/useFiConfig'
import { fiTopBarSocial, fiTopLinks } from '../fi-data'
import type { FiLink, FiSocialLink } from '../fi-data'
import { useFiT, useFiText } from '../i18n'

/**
 * Cinta superior del portal ingenieria.unam.mx, réplica de su #top-bar (tema
 * Canvas): mismas medidas, separadores, hover gris, submenú rojo y redes que
 * al pasar el cursor toman el color de la marca y despliegan su nombre.
 * El CSS de abajo traduce las reglas del portal una a una; si algo se ve
 * distinto al portal, el error está aquí.
 *
 * Enlaces y redes son por proyecto: prop > `fiUi.topBar` en la configuración
 * (app.config.ts en Nuxt, createFiUi en Vue) > los del portal.
 *
 * El fondo es primary-500 y no un rojo fijo: un tema especial (luto, 8M)
 * también tiñe la cinta.
 *
 * Dos desviaciones deliberadas del portal, por contraste (AA, 4.5:1):
 * - El hover y el foco de los enlaces son neutral-500 y no #ADB5BD, que con
 *   texto blanco daba 2.07:1 (lo mismo hace el micrositio de planes).
 * - El nombre que despliega cada red toma texto oscuro cuando el color de la
 *   marca es claro: blanco sobre el naranja de Instagram daba 1.75:1.
 *
 * Ranura `end`: controles del proyecto al final de la cinta (p. ej. el cambio
 * de idioma). Recibe `controlClass`, la receta de un botón de la cinta (alto,
 * tipografía, hover y foco), para no copiar estos estilos con un hex fijo:
 *
 *   <template #end="{ controlClass }">
 *     <button type="button" :class="controlClass">English</button>
 *   </template>
 *
 * `--fi-topbar-hover` es pública: el fondo de hover/foco de la cinta.
 */
const props = defineProps<{
  links?: FiLink[]
  social?: FiSocialLink[]
}>()

const config = useFiConfig()
const t = useFiT()
const text = useFiText()

const links = computed(() => props.links ?? config.value.topBar?.links ?? fiTopLinks)
const social = computed(() => props.social ?? config.value.topBar?.social ?? fiTopBarSocial)

// Receta de un control en la ranura `end`, con utilidades (no CSS con
// alcance): así el proyecto puede ajustarla con sus propias clases.
const controlClass = [
  'inline-flex h-full items-center gap-1.5 px-2.5 text-[0.8125rem] font-semibold text-white',
  'transition-colors hover:bg-(--fi-topbar-hover) focus-visible:bg-(--fi-topbar-hover)',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white',
  'motion-reduce:transition-none',
].join(' ')

function socialStyle(color: string | undefined) {
  return color ? { '--fi-social-color': color, '--fi-social-text': fiReadableTextOn(color) } : undefined
}

// Alto real de la cinta en --fi-topbar-offset: en móvil los enlaces ocupan
// varios renglones y las portadas de pantalla completa lo necesitan para
// restarlo (ver --fi-header-offset en tokens.css).
const root = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

function publishHeight() {
  if (root.value) document.documentElement.style.setProperty('--fi-topbar-offset', `${root.value.offsetHeight}px`)
}

onMounted(() => {
  publishHeight()
  if ('ResizeObserver' in window && root.value) {
    observer = new ResizeObserver(publishHeight)
    observer.observe(root.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.documentElement.style.removeProperty('--fi-topbar-offset')
})

defineExpose({ root })
</script>

<template>
  <div
    ref="root"
    class="fi-topbar"
  >
    <div class="fi-topbar__container">
      <div class="fi-topbar__row">
        <nav
          v-if="links.length"
          class="fi-topbar__links"
          :aria-label="t('facultyLinks')"
        >
          <ul class="fi-topbar__list">
            <li
              v-for="link in links"
              :key="link.to"
              class="fi-topbar__item"
            >
              <ULink
                raw
                :to="link.to"
                :target="link.target"
                class="fi-topbar__link"
              >
                <!-- Etiqueta e ícono pegados: un salto de línea aquí deja un
                     espacio que ensancha el enlace 4 px respecto al portal. -->
                {{ text(link.label) }}<UIcon
                  v-if="link.children?.length"
                  name="i-fa6-solid-caret-down"
                  class="fi-topbar__caret"
                />
              </ULink>
              <ul
                v-if="link.children?.length"
                class="fi-topbar__submenu"
              >
                <li
                  v-for="child in link.children"
                  :key="child.to"
                  class="fi-topbar__item"
                >
                  <ULink
                    raw
                    :to="child.to"
                    :target="child.target"
                    class="fi-topbar__link"
                  >
                    {{ text(child.label) }}
                  </ULink>
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        <div
          v-if="social.length || $slots.end"
          class="fi-topbar__aside"
        >
          <ul
            v-if="social.length"
            class="fi-topbar__social"
            :aria-label="t('socialNetworks')"
          >
            <li
              v-for="item in social"
              :key="item.to"
            >
              <ULink
                raw
                :to="item.to"
                :target="item.target ?? '_blank'"
                :aria-label="text(item.label)"
                class="fi-topbar__social-link"
                :style="socialStyle(item.color)"
              >
                <span class="fi-topbar__social-icon">
                  <UIcon
                    :name="item.icon"
                    class="fi-topbar__social-glyph"
                  />
                </span>
                <span
                  class="fi-topbar__social-text"
                  aria-hidden="true"
                >{{ text(item.label) }}</span>
              </ULink>
            </li>
          </ul>

          <!-- Controles propios del proyecto al final de la cinta (p. ej. idioma). -->
          <div
            v-if="$slots.end"
            class="fi-topbar__end"
          >
            <slot
              name="end"
              v-bind="{ controlClass }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variables del #top-bar del portal. El hover no es el del portal (#ADB5BD,
   neutral-400): con texto blanco no llega a AA. Ver el comentario de arriba. */
.fi-topbar {
  --fi-topbar-height: 45px;
  --fi-topbar-border: rgb(0 0 0 / 0.1);
  --fi-topbar-hover: var(--color-fi-neutral-500);
  position: relative;
  z-index: 60;
  border-bottom: 1px solid var(--fi-topbar-border);
  background-color: var(--ui-color-primary-500);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.5;
  color: #fff;
}

/* .container de Bootstrap 5: los anchos del portal, no los de UContainer. */
.fi-topbar__container {
  width: 100%;
  margin-inline: auto;
  padding-inline: 12px;
}
@media (min-width: 576px) { .fi-topbar__container { max-width: 540px; } }
@media (min-width: 768px) { .fi-topbar__container { max-width: 720px; } }
@media (min-width: 992px) { .fi-topbar__container { max-width: 960px; } }
@media (min-width: 1200px) { .fi-topbar__container { max-width: 1140px; } }
@media (min-width: 1400px) { .fi-topbar__container { max-width: 1320px; } }

/* .row.justify-content-between con dos .col-12.col-md-auto */
.fi-topbar__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.fi-topbar__links,
.fi-topbar__aside {
  flex: 0 0 100%;
}
@media (min-width: 768px) {
  .fi-topbar__links,
  .fi-topbar__aside {
    flex: 0 0 auto;
  }
}

/* Redes y ranura final comparten renglón: centrado en móvil, a la derecha
   en escritorio. Sin ranura, es exactamente el bloque de redes del portal. */
.fi-topbar__aside {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* .top-links */
.fi-topbar__links {
  position: relative;
  border-bottom: 1px solid var(--fi-topbar-border);
}
@media (min-width: 768px) {
  .fi-topbar__links { border-bottom: 0; }
}

.fi-topbar__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* .top-links-item */
.fi-topbar__item {
  position: relative;
  border-left: 1px solid var(--fi-topbar-border);
}
.fi-topbar__item:first-child,
.fi-topbar__submenu .fi-topbar__item {
  border-left: 0;
}
.fi-topbar__item:hover,
.fi-topbar__item:focus-within {
  background-color: var(--fi-topbar-hover);
}

.fi-topbar__link {
  display: block;
  padding: 12px;
  line-height: calc(var(--fi-topbar-height) - 24px);
  font-weight: 500;
  color: #fff;
  text-decoration: none;
}
.fi-topbar__link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -2px;
}

/* El caret de Font Awesome mide 320×512: a 12 px de alto ocupa 7.5 px de ancho.
   Con una caja cuadrada el enlace crecía 4.5 px y desalineaba la fila. */
.fi-topbar__caret {
  width: 7.5px;
  height: 0.75rem;
  margin-left: 0.375rem;
  vertical-align: -1px;
}

/* .top-links-sub-menu: aparece al pasar el cursor o con el foco del teclado. */
.fi-topbar__submenu {
  position: absolute;
  top: 100%;
  left: -1px;
  z-index: -1;
  width: 140px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  line-height: 1.5;
  background: var(--ui-color-primary-500);
  border-top: 1px solid var(--ui-color-primary-500);
  box-shadow: 0 13px 42px 11px rgb(0 0 0 / 0.05);
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease, margin 0.2s ease;
}
.fi-topbar__item:hover > .fi-topbar__submenu,
.fi-topbar__item:focus-within > .fi-topbar__submenu {
  z-index: 499;
  margin-top: 0;
  visibility: visible;
  pointer-events: auto;
  opacity: 1;
}
.fi-topbar__submenu .fi-topbar__item:not(:first-child) {
  border-top: 1px solid var(--fi-topbar-border);
}
.fi-topbar__submenu .fi-topbar__link {
  display: flex;
  align-items: center;
  padding-block: 0.625rem;
  font-size: 0.75rem;
  line-height: 20px;
}

/* #top-social */
.fi-topbar__social {
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
.fi-topbar__social > li {
  position: relative;
  border-left: 1px solid var(--fi-topbar-border);
}
.fi-topbar__social > li:first-child {
  border-left: 0;
}

.fi-topbar__social-link {
  display: flex;
  overflow: hidden;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
}
.fi-topbar__social-link:hover,
.fi-topbar__social-link:focus-visible {
  color: var(--fi-social-text, var(--color-fi-neutral-50));
  background-color: var(--fi-social-color, var(--fi-topbar-hover));
}
.fi-topbar__social-link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -2px;
}

.fi-topbar__social-icon,
.fi-topbar__social-text {
  display: flex;
  align-items: center;
  height: var(--fi-topbar-height);
}
.fi-topbar__social-icon {
  justify-content: center;
  width: 40px;
  flex: none;
}
.fi-topbar__social-glyph {
  width: 0.875rem;
  height: 0.875rem;
}
.fi-topbar__social-text {
  max-width: 0;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.fi-topbar__social-link:hover .fi-topbar__social-text,
.fi-topbar__social-link:focus-visible .fi-topbar__social-text {
  max-width: 200px;
  padding-right: 12px;
  transition: all 0.4s ease;
}

@media (prefers-reduced-motion: reduce) {
  .fi-topbar__submenu,
  .fi-topbar__social-text,
  .fi-topbar__social-link:hover .fi-topbar__social-text {
    transition: none;
  }
}

/* Ranura final: hereda alto y tipografía de la cinta. */
.fi-topbar__end {
  display: flex;
  align-items: center;
  height: var(--fi-topbar-height);
  margin-left: 0.5rem;
  color: #fff;
}
</style>
