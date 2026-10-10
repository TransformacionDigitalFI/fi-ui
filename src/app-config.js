/**
 * Configuración de Nuxt UI con el lenguaje visual FI (`ui` del app.config).
 *
 * Cómo se mezcla: el módulo de Nuxt la pone POR DEBAJO del app.config.ts del
 * proyecto (y por encima de los valores de Nuxt UI), así que el proyecto gana
 * en todo lo que declare:
 *   - textos de clase (`slots.title`, `variants.size.md.base`…): el del
 *     proyecto sustituye al de aquí;
 *   - arreglos (`compoundVariants`): Nuxt los CONCATENA (defu), proyecto
 *     primero y paquete después, y tailwind-merge deja la última clase en
 *     conflicto — o sea la del paquete. Para pisar un compoundVariant de
 *     aquí, el proyecto declara una función: `compoundVariants: () => [...]`
 *     (defuFn la llama con el valor del paquete y usa lo que devuelva).
 * En Vue sin Nuxt entra por `fiUiViteOptions.ui` (src/vite.js).
 *
 * Es JavaScript y no TypeScript a propósito: vite.config.ts de un proyecto
 * Vue la importa (vía `@fi-unam/ui/vite`) y Vite deja que la cargue Node,
 * que se niega a quitar tipos dentro de node_modules. Por lo mismo no
 * importa nada. Los tipos están en app-config.d.ts.
 *
 * Por qué hace falta tanto: las superficies FI están invertidas respecto a
 * Nuxt UI (tokens.css). Nuxt UI pinta la página con bg-default (blanco) y usa
 * bg-elevated como tinte de hover, selección y relleno; aquí la página es
 * pizarra (bg-default) y las tarjetas son blancas (bg-elevated). Sin estos
 * ajustes un hover dentro de una tarjeta es blanco sobre blanco, los menús y
 * diálogos salen pizarra y los campos se funden con la página. La regla que
 * se aplica en cada componente:
 *   - superficie de overlay o de campo (Nuxt UI: bg-default) → bg-elevated;
 *   - tinte de reposo, hover o selección (Nuxt UI: bg-elevated) → bg-muted;
 *   - tinte más fuerte (activo, hover sobre un relleno) → bg-accented.
 * bg-muted y bg-accented son tintes de pizarra que se ven sobre blanco Y
 * sobre la página; tests/surfaces.test.ts mide cada par.
 *
 * Radios: no se tocan aquí. Todo sale de --ui-radius (tokens.css) y la
 * jerarquía está escrita ahí.
 */

/** Colores que Nuxt UI debe generar como variantes (`color="tertiary"`). */
export const fiUiThemeColors = ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error']

/**
 * Roles de marca → escalas del paquete. Un tema especial cambia estas
 * escalas desde el CSS, sin tocar el app.config.
 */
export const fiUiColors = {
  primary: 'fi-primary',
  secondary: 'fi-secondary',
  tertiary: 'fi-tertiary',
  neutral: 'fi-neutral',
}

/**
 * Estados por defecto (paletas de Tailwind). Un tema especial nunca los
 * cambia: un tema cambia la marca, no el significado de un aviso. En modo
 * claro tokens.css los oscurece al paso 800 para que pasen AA como texto,
 * en insignias soft/subtle y como botón sólido (tests/contrast.test.ts).
 * Mapa semántico único:
 *   success = completado, vigente, abierto
 *   warning = pendiente, por vencer, degradado
 *   error   = fallo, bloqueado, riesgo (nunca el rojo de marca)
 *   info    = informativo
 *   neutral = borrador, inactivo, cerrado, archivado
 */
export const fiStatusColors = {
  success: 'green',
  info: 'sky',
  warning: 'amber',
  error: 'red',
}

/**
 * Íconos de Nuxt UI en Phosphor (`@iconify-json/ph`, dependencia par del
 * paquete): un solo juego en toda la interfaz. Font Awesome y Bootstrap
 * Icons quedan solo para la cinta y el pie (las redes del portal).
 */
export const fiIcons = {
  arrowDown: 'i-ph-arrow-down',
  arrowLeft: 'i-ph-arrow-left',
  arrowRight: 'i-ph-arrow-right',
  arrowUp: 'i-ph-arrow-up',
  caution: 'i-ph-warning-circle',
  check: 'i-ph-check',
  chevronDoubleLeft: 'i-ph-caret-double-left',
  chevronDoubleRight: 'i-ph-caret-double-right',
  chevronDown: 'i-ph-caret-down',
  chevronLeft: 'i-ph-caret-left',
  chevronRight: 'i-ph-caret-right',
  chevronUp: 'i-ph-caret-up',
  close: 'i-ph-x',
  copy: 'i-ph-copy',
  copyCheck: 'i-ph-check',
  dark: 'i-ph-moon',
  drag: 'i-ph-dots-six-vertical',
  ellipsis: 'i-ph-dots-three',
  error: 'i-ph-x-circle',
  external: 'i-ph-arrow-square-out',
  eye: 'i-ph-eye',
  eyeOff: 'i-ph-eye-slash',
  file: 'i-ph-file',
  folder: 'i-ph-folder',
  folderOpen: 'i-ph-folder-open',
  hash: 'i-ph-hash',
  info: 'i-ph-info',
  light: 'i-ph-sun',
  loading: 'i-ph-spinner',
  menu: 'i-ph-list',
  minus: 'i-ph-minus',
  panelClose: 'i-ph-arrow-line-left',
  panelOpen: 'i-ph-arrow-line-right',
  plus: 'i-ph-plus',
  reload: 'i-ph-arrow-counter-clockwise',
  search: 'i-ph-magnifying-glass',
  stop: 'i-ph-stop',
  success: 'i-ph-check-circle',
  system: 'i-ph-monitor',
  tip: 'i-ph-lightbulb',
  upload: 'i-ph-upload-simple',
  warning: 'i-ph-warning',
}

/**
 * Texto del primario sobre un tinte del primario (insignia soft, botón soft,
 * hover de outline/ghost, alerta soft, enlace activo de menú).
 *
 * --ui-primary se queda en el paso 500 — el rojo exacto del portal, #CD171E,
 * en enlaces, navegación activa y botón sólido —, y ese paso no llega a AA
 * sobre su propio tinte encima de pizarra (4.23:1 en el tema FI). Bajarlo a
 * 600 lo arreglaba todo de golpe pero lo volvía indistinguible del rojo de
 * error (ΔE OKLab 0.02 contra red-800); así que solo el texto sobre tinte
 * baja un paso. `dark:` devuelve el valor de isla oscura (400).
 * tests/contrast.test.ts lee el paso de esta constante.
 */
export const fiPrimaryOnTint = 'text-primary-600 dark:text-primary'

// Escalas de texto por tamaño, las del PSM: un paso arriba de Nuxt UI, sobre
// la escala tipográfica FI (src/css/no-fonts.css), que ya es mayor que la de
// Tailwind.
// Ojo: Nuxt UI reduce los campos un paso desde `md:` (variante `fixed`);
// esto fija el tamaño en móvil y la altura de línea.
const fieldSizes = {
  xs: { base: 'text-sm' },
  sm: { base: 'text-sm' },
  md: { base: 'text-base' },
  lg: { base: 'text-base' },
  xl: { base: 'text-lg' },
}

// Etiquetas de grupo y fichas de los menús: Nuxt UI usa 10px en xs/sm.
// En FI no hay texto por debajo de 12px (text-xs = 13px en la escala FI).
const menuSmallLabels = {
  xs: { label: 'text-xs' },
  sm: { label: 'text-xs' },
}

// Rellenos de campo por variante. `outline` (el de por defecto) es blanco
// para que el campo se lea igual en una tarjeta, en un diálogo y sobre la
// página; su borde es ring-accented (≥ 3:1, ver tokens.css).
const fieldVariants = {
  outline: 'bg-elevated',
  soft: 'bg-muted/50 hover:bg-muted focus:bg-muted disabled:bg-muted/50',
  subtle: 'bg-muted',
  ghost: 'hover:bg-muted focus:bg-muted',
}

// InputTags, InputDate e InputTime reescriben `focus:` como `has-focus:`
// en sus propias variantes; lo de aquí no pasa por esa reescritura.
const fieldVariantsHasFocus = {
  outline: 'bg-elevated',
  soft: 'bg-muted/50 hover:bg-muted has-focus:bg-muted disabled:bg-muted/50',
  subtle: 'bg-muted',
  ghost: 'hover:bg-muted has-focus:bg-muted',
}

// Contenido de menús desplegables y listas de opciones.
const overlayContent = 'bg-elevated'
const overlayArrow = 'fill-(--ui-bg-elevated)'
const highlightedItem = 'data-highlighted:not-data-disabled:before:bg-muted'

// Opción activa o resaltada de un menú desplegable o contextual.
const menuItemActive = {
  true: { item: 'before:bg-accented' },
  false: { item: 'data-highlighted:before:bg-muted data-[state=open]:before:bg-muted' },
}

// Opción de menú con `color: 'primary'`: su resaltado es un tinte del primario.
const primaryMenuItem = 'text-primary-600 data-highlighted:text-primary-600 dark:text-primary dark:data-highlighted:text-primary'

const segmentFocus = [
  { variant: 'outline', class: { segment: 'focus:bg-muted' } },
  { variant: 'ghost', class: { segment: 'focus:bg-muted group-hover:focus:bg-accented' } },
  { variant: 'none', class: { segment: 'focus:bg-muted' } },
]

export const fiAppConfig = {
  ui: {
    colors: { ...fiUiColors, ...fiStatusColors },
    icons: fiIcons,

    button: {
      variants: { size: fieldSizes },
      compoundVariants: [
        { color: 'primary', variant: ['soft', 'subtle'], class: fiPrimaryOnTint },
        {
          color: 'primary',
          variant: ['outline', 'ghost'],
          class: 'hover:text-primary-600 active:text-primary-600 dark:hover:text-primary dark:active:text-primary',
        },
        {
          color: 'neutral',
          variant: 'outline',
          class: 'bg-elevated hover:bg-accented active:bg-accented disabled:bg-elevated aria-disabled:bg-elevated',
        },
        {
          color: 'neutral',
          variant: ['soft', 'subtle'],
          class: 'bg-muted hover:bg-accented active:bg-accented disabled:bg-muted aria-disabled:bg-muted',
        },
        { color: 'neutral', variant: 'ghost', class: 'hover:bg-accented active:bg-accented' },
      ],
    },

    badge: {
      // Nuxt UI trae xs = 8px y sm = 10px.
      variants: {
        size: {
          xs: { base: 'text-xs' },
          sm: { base: 'text-sm' },
          md: { base: 'text-sm' },
          lg: { base: 'text-base' },
        },
      },
      compoundVariants: [
        { color: 'primary', variant: ['soft', 'subtle'], class: fiPrimaryOnTint },
        { color: 'neutral', variant: 'outline', class: 'bg-elevated' },
        { color: 'neutral', variant: ['soft', 'subtle'], class: 'bg-muted' },
      ],
    },

    alert: {
      compoundVariants: [
        { color: 'primary', variant: ['soft', 'subtle'], class: { root: fiPrimaryOnTint } },
        { color: 'neutral', variant: 'outline', class: { root: 'bg-elevated' } },
        { color: 'neutral', variant: ['soft', 'subtle'], class: { root: 'bg-muted' } },
      ],
    },

    avatar: {
      variants: { color: { neutral: { root: 'bg-muted' } } },
    },

    calendar: {
      variants: { size: { xs: { headCell: 'text-xs', headCellWeek: 'text-xs' } } },
      compoundVariants: [
        { color: 'neutral', variant: 'outline', class: { cellTrigger: 'data-selected:bg-elevated' } },
        { color: 'neutral', variant: ['soft', 'subtle'], class: { cellTrigger: 'data-selected:bg-muted' } },
      ],
    },

    // La tarjeta FI: blanca, con borde y rounded-2xl, sobre la página pizarra.
    card: {
      slots: { root: 'rounded-2xl' },
      variants: {
        variant: {
          outline: { root: 'bg-elevated' },
          soft: { root: 'bg-muted' },
          subtle: { root: 'bg-muted' },
        },
      },
    },

    // La misma tarjeta en el sitio público (UPageGrid, "Cómo funciona"). Con
    // `to` toda la tarjeta es enlace y su hover era bg-elevated: invisible
    // sobre una tarjeta que ya es blanca.
    pageCard: {
      slots: { root: 'rounded-2xl' },
      variants: {
        variant: {
          outline: { root: 'bg-elevated' },
          soft: { root: 'bg-muted' },
          subtle: { root: 'bg-muted' },
        },
      },
      compoundVariants: [
        { variant: ['outline', 'ghost'], to: true, class: { root: 'hover:bg-muted/50' } },
        { variant: ['soft', 'subtle'], to: true, class: { root: 'hover:bg-accented' } },
      ],
    },

    slider: { slots: { thumb: 'bg-elevated' } },

    empty: {
      variants: {
        variant: {
          outline: { root: 'bg-elevated' },
          soft: { root: 'bg-muted' },
          subtle: { root: 'bg-muted' },
        },
      },
    },

    kbd: {
      variants: { size: { sm: 'text-xs/4', md: 'text-xs/4' } },
      compoundVariants: [
        { color: 'neutral', variant: 'outline', class: 'bg-elevated' },
        { color: 'neutral', variant: ['soft', 'subtle'], class: 'bg-muted' },
      ],
    },

    // Nuxt UI anima el skeleton sin mirar prefers-reduced-motion.
    skeleton: { base: 'bg-accented motion-reduce:animate-none' },

    stepper: { slots: { trigger: 'bg-muted' } },

    switch: { slots: { thumb: 'bg-elevated' } },

    tabs: {
      variants: { variant: { pill: { list: 'bg-muted' } } },
    },

    timeline: { slots: { separator: 'bg-accented' } },

    radioGroup: { slots: { indicator: 'after:bg-elevated' } },

    // ── Campos ──────────────────────────────────────────────────────────────
    input: {
      variants: { size: fieldSizes, variant: fieldVariants },
    },

    textarea: {
      variants: {
        size: {
          sm: { base: 'text-sm' },
          md: { base: 'text-base' },
          lg: { base: 'text-base' },
        },
        variant: fieldVariants,
      },
    },

    inputNumber: {
      variants: { variant: fieldVariants },
    },

    pinInput: {
      variants: { variant: fieldVariants },
    },

    inputTags: {
      slots: { item: 'bg-muted' },
      variants: {
        size: { xs: { item: 'text-xs' }, sm: { item: 'text-xs' } },
        variant: fieldVariantsHasFocus,
      },
    },

    inputDate: {
      variants: { variant: fieldVariantsHasFocus },
      compoundVariants: segmentFocus,
    },

    inputTime: {
      variants: { variant: fieldVariantsHasFocus },
      compoundVariants: segmentFocus,
    },

    select: {
      slots: { content: overlayContent, arrow: overlayArrow, item: highlightedItem },
      variants: {
        size: {
          xs: { base: 'text-sm', label: 'text-xs' },
          sm: { base: 'text-sm', label: 'text-xs' },
          md: { base: 'text-base' },
          lg: { base: 'text-base' },
          xl: { base: 'text-lg' },
        },
        variant: {
          ...fieldVariants,
          outline: 'bg-elevated hover:bg-muted/50 disabled:bg-elevated',
          subtle: 'bg-muted hover:bg-accented disabled:bg-muted',
        },
      },
    },

    selectMenu: {
      slots: { content: overlayContent, arrow: overlayArrow, item: highlightedItem },
      variants: {
        size: {
          xs: { base: 'text-sm', label: 'text-xs' },
          sm: { base: 'text-sm', label: 'text-xs' },
          md: { base: 'text-base' },
          lg: { base: 'text-base' },
          xl: { base: 'text-lg' },
        },
        variant: {
          ...fieldVariants,
          outline: 'bg-elevated hover:bg-muted/50 disabled:bg-elevated',
          subtle: 'bg-muted hover:bg-accented disabled:bg-muted',
        },
      },
    },

    inputMenu: {
      slots: { content: overlayContent, arrow: overlayArrow, item: highlightedItem, tagsItem: 'bg-muted' },
      variants: {
        size: {
          xs: { base: 'text-sm', label: 'text-xs', tagsItem: 'text-xs' },
          sm: { base: 'text-sm', label: 'text-xs', tagsItem: 'text-xs' },
          md: { base: 'text-base' },
          lg: { base: 'text-base' },
          xl: { base: 'text-lg' },
        },
        variant: fieldVariants,
      },
      compoundVariants: [
        { variant: ['soft', 'ghost'], multiple: true, class: 'has-focus:bg-muted' },
      ],
    },

    listbox: {
      slots: { item: highlightedItem },
      variants: { size: menuSmallLabels },
    },

    formField: {
      slots: {
        label: 'text-base font-medium text-default',
        description: 'text-sm text-muted',
        hint: 'text-sm text-muted',
        help: 'text-sm text-muted',
        error: 'text-sm text-error',
      },
    },

    // ── Overlays: blancos, como las tarjetas ───────────────────────────────
    // El pie de un diálogo es [Cancelar] [Acción] alineados a la derecha en
    // todo el lenguaje FI; Nuxt UI los deja a la izquierda. Un pie que
    // necesite algo a la izquierda (Eliminar) lo empuja con `me-auto`.
    modal: {
      slots: {
        content: 'bg-elevated',
        header: 'border-b border-default',
        title: 'font-bold text-fi-navy',
        footer: 'justify-end gap-2',
      },
    },

    slideover: {
      slots: {
        content: 'bg-elevated',
        header: 'border-b border-default',
        title: 'font-bold text-fi-navy',
        footer: 'justify-end gap-2',
      },
    },

    drawer: {
      slots: { content: 'bg-elevated', title: 'font-bold text-fi-navy' },
    },

    popover: {
      slots: { content: overlayContent, arrow: overlayArrow },
    },

    tooltip: {
      slots: { content: overlayContent, arrow: overlayArrow },
    },

    toast: {
      slots: { root: 'bg-elevated' },
    },

    dropdownMenu: {
      slots: { content: overlayContent, arrow: overlayArrow },
      variants: { active: menuItemActive },
      compoundVariants: [{ color: 'primary', class: { item: primaryMenuItem } }],
    },

    contextMenu: {
      slots: { content: overlayContent },
      variants: { active: menuItemActive },
      compoundVariants: [{ color: 'primary', class: { item: primaryMenuItem } }],
    },

    commandPalette: {
      variants: {
        size: menuSmallLabels,
        active: {
          true: { item: 'before:bg-accented' },
          false: { item: highlightedItem },
        },
      },
    },

    navigationMenu: {
      slots: { viewport: 'bg-elevated', arrow: 'bg-elevated' },
      variants: {
        active: {
          true: { childLink: 'before:bg-accented' },
          false: { childLink: 'hover:before:bg-muted' },
        },
      },
      compoundVariants: [
        { variant: 'pill', active: false, class: { link: 'hover:before:bg-muted' } },
        { variant: 'pill', highlight: true, orientation: 'horizontal', class: { link: 'data-[state=open]:before:bg-muted' } },
        { variant: 'pill', highlight: false, active: false, orientation: 'horizontal', class: { link: 'data-[state=open]:before:bg-muted' } },
        { variant: 'pill', active: true, highlight: false, class: { link: 'before:bg-accented' } },
        { variant: 'pill', active: true, highlight: true, disabled: false, class: { link: 'hover:before:bg-muted' } },
        // El activo de `pill` lleva tinte; el de `link` no, y se queda en 500.
        { color: 'primary', variant: 'pill', active: true, class: { link: fiPrimaryOnTint, linkLeadingIcon: fiPrimaryOnTint } },
      ],
    },

    tree: {
      variants: { selected: { true: { link: 'before:bg-accented' } } },
      compoundVariants: [
        { color: 'primary', selected: true, class: { link: fiPrimaryOnTint } },
        { selected: false, disabled: false, class: { link: 'hover:before:bg-muted' } },
      ],
    },

    // ── Tablas ──────────────────────────────────────────────────────────────
    // La tabla es su propia tarjeta sobre la página. Encabezados como los
    // rótulos de los sitios FI: versalitas azul marino sobre la banda pizarra
    // (la receta de .fi-label, en navy). Nuxt UI pone whitespace-nowrap en
    // TODAS las celdas y el texto largo desborda: aquí se quita, y una
    // columna numérica o de fecha lo pide con `meta: { class: { td:
    // 'whitespace-nowrap' } }`.
    table: {
      slots: {
        root: 'rounded-2xl border border-default bg-elevated',
        thead: 'bg-muted',
        th: 'text-xs font-semibold uppercase tracking-[0.08em] text-fi-navy',
        td: 'text-sm text-default whitespace-normal',
        tbody: '[&>tr]:data-[selectable=true]:hover:bg-muted/50',
        tr: 'data-[selected=true]:bg-muted',
      },
      variants: {
        pinned: { true: { th: 'bg-muted', td: 'bg-elevated' } },
        sticky: {
          true: { thead: 'bg-muted', tfoot: 'bg-elevated/90' },
          header: { thead: 'bg-muted' },
          footer: { tfoot: 'bg-elevated/90' },
        },
      },
    },

    // ── Dashboard ───────────────────────────────────────────────────────────
    // Página pizarra; barra lateral oscura como el encabezado público (isla
    // `dark`: lo de adentro toma los tokens oscuros de Nuxt UI sin clases a
    // mano) con la cinta roja arriba; barra superior blanca que continúa esa
    // cinta, con el título en azul marino. El rojo es `primary-500` explícito:
    // el filete es marca, no un estado.
    dashboardGroup: { base: 'bg-default' },

    dashboardSidebar: {
      slots: {
        root: 'dark bg-fi-header text-default border-t-4 border-t-primary-500',
        header: 'h-auto min-h-(--ui-header-height) py-4 border-b border-default',
        footer: 'border-t border-default',
        content: 'dark bg-fi-header text-default border-t-4 border-t-primary-500',
      },
      // La variante `side` pone `border-default` después del slot, y
      // tailwind-merge la deja ganarle al color del filete de arriba: se
      // repite aquí para que quede al final.
      variants: {
        side: {
          left: { root: 'border-t-primary-500' },
          right: { root: 'border-t-primary-500' },
        },
      },
    },

    dashboardNavbar: {
      slots: {
        root: 'bg-elevated border-t-4 border-t-primary-500',
        title: 'font-bold text-fi-navy',
      },
    },

    dashboardPanel: {
      slots: { root: 'bg-default' },
    },

    dashboardToolbar: {
      slots: { root: 'bg-elevated' },
    },
  },
}
