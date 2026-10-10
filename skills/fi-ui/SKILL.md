---
name: fi-ui
description: >-
  Lenguaje visual de la Facultad de Ingeniería, UNAM: el paquete @fi-unam/ui
  sobre Nuxt UI v4 y Tailwind v4. Cárgala para CUALQUIER trabajo de interfaz en
  un proyecto que use @fi-unam/ui o que deba seguir la identidad visual FI UNAM:
  crear, rediseñar, migrar o revisar vistas, páginas públicas, dashboards,
  formularios, tablas, modales, tarjetas, KPIs, gráficas, estados de carga,
  vacío y error, navegación, encabezados y pies; elegir colores, tokens,
  superficies, tipografía, íconos o radios; temas especiales (luto, 8M, salud
  mental, 25N…); instalar o configurar el paquete en Nuxt o en Vue + Vite; o
  auditar consistencia, contraste y accesibilidad de la UI. Úsala aunque nadie
  diga "fi-ui" si el package.json tiene @fi-unam/ui, si el código usa FiHeader,
  FiFooter, FiPageHeader u otro Fi*, o si se habla de "la identidad FI", "el
  rojo FI", "fondo pizarra", "azul marino y oro" o "los micrositios de la
  Facultad".
---

# fi-ui — lenguaje visual de la FI UNAM

## Qué es

`@fi-unam/ui` es la identidad visual de la Facultad de Ingeniería empaquetada
para Vue. **No reemplaza ni envuelve a Nuxt UI**: lo configura y le añade piezas.

| Capa | Qué trae | Dónde |
|------|----------|-------|
| Tokens | Semillas de color → escalas OKLCH → tokens de Nuxt UI; superficies pizarra/blanco; escala tipográfica; utilidades `text-fi-navy`, `bg-fi-gold`, `.fi-label`… | `@import "@fi-unam/ui"` |
| Configuración de Nuxt UI | `fiAppConfig.ui`: colores de rol y de estado, íconos Phosphor, tamaños, tablas, overlays, inputs, badges, tarjetas, shell de dashboard | módulo de Nuxt, o `fiUiViteOptions` de `@fi-unam/ui/vite` |
| Componentes `Fi*` | Chrome público (`FiHeader`, `FiFooter`), chrome de dashboard (`FiDashboardBrand`), primitivas de vista (`FiPageHeader`, `FiSectionCard`, `FiStat`, `FiStatusBadge`…) | auto-registrados en Nuxt; `import { … } from '@fi-unam/ui'` en Vue |

Imagen mental: **página pizarra, tarjetas blancas con borde, títulos en azul
marino, el rojo FI solo para la acción principal y la navegación activa, el oro
como filete.** Todo sale de tokens, así que un tema especial (luto, 8M…) cambia
el sitio entero sin tocar una vista.

Consumidor de referencia: PSM-SI-V2 (sitio público + dashboard del Programa de
Salud Mental). Sus rutas aparecen como "ejemplo de referencia"; las reglas
valen para cualquier proyecto.

## Antes de escribir una línea

1. ¿El paquete ya está instalado y configurado? Si no, o si ves colores
   raros, lee [references/setup.md](references/setup.md).
2. Decide el arquetipo con el árbol de abajo y **lee su archivo**: trae la
   anatomía exacta, los estados y los errores que ya se cometieron.
3. Para cualquier color, tamaño o radio, [references/foundations.md](references/foundations.md).
4. Al terminar, pasa [references/checklist.md](references/checklist.md)
   (los greps deben salir en cero).

## Reglas de oro

1. **Solo modo claro.** Lo oscuro existe únicamente como *isla*: un contenedor
   con la clase `dark` (FiHeader, FiFooter, sidebar, `FiCtaBand`). Nunca un
   selector de tema, nunca `.dark` en `<html>`, nunca variantes `dark:` en
   vistas de contenido (son código muerto). [D1; A-12, M-01, D-26]
2. **Superficies fijas.** Página `bg-default` (pizarra); tarjeta
   `bg-elevated border border-default rounded-2xl` (blanca); banda tenue
   `bg-muted`. Nada de `bg-white`, `bg-gray-50` ni `hover:bg-elevated` sobre
   blanco. [D2; A-01]
3. **Color solo por token.** Utilidades semánticas de Nuxt UI (`text-muted`,
   `text-highlighted`, `bg-elevated`, `border-default`, `text-success`) y las
   editoriales de fi-ui (`text-fi-navy`, `bg-fi-gold`, `bg-fi-header`).
   Prohibido: hex, `rgb()`, paletas crudas (`blue-500`, `gray-*`, `violet-*`)
   y las que ni existen (`pizarra-*`, `oro-*`), y la forma larga
   `text-(--ui-text-muted)`. [D3, D4; D-01, E-05, C-30]
4. **El rojo FI es marca, no error.** `primary` = CTA principal, navegación
   activa, acento de marca. Error y peligro = `color="error"` con ícono y
   texto. Ningún tema especial usa `primary` para significar un estado. [D3;
   A-03, B-08, M-04]
5. **Estado = ícono + texto + color, con un solo mapa.** success =
   completado/vigente/publicado; warning = pendiente/por vencer/pide acción;
   error = fallo/bloqueado/rechazado/riesgo; info = informativo/en curso;
   neutral = borrador/inactivo/cerrado/archivado. Casos dudosos ("vencido"):
   ¿alguien tiene que actuar? ([foundations §3](references/foundations.md#mapa-de-estados-único-para-todo-el-proyecto)).
   Usa `FiStatusBadge`; nunca un estado solo con color, nunca un color de
   estado para una *categoría*. [D3; D-03, E-04]
6. **Un solo botón `solid` `primary` por vista o diálogo.** Secundarias
   `outline`/`soft` en `neutral`; terciarias `ghost`/`link`. Pie de diálogo:
   `[Cancelar (neutral outline)] [Acción]` alineados a la derecha. [D11; C-29,
   E-17]
7. **Jerarquía tipográfica fija.** Un solo `<h1>` por vista: lo pone
   `FiPageHeader`, y entonces el `UDashboardNavbar` usa `#left` (su `title`
   siempre sale como `<h1>`). Solo una vista sin `FiPageHeader` (panel de
   lista de una lista-detalle, barra de una sesión en vivo) deja que el
   `title` del navbar sea su h1. Rótulos con
   `.fi-label`; `.fi-tag` solo como antetítulo editorial, máximo uno por
   sección. Nada de texto < 12 px. Cifras con `tabular-nums`. [D4; C-M1, E-15,
   D-30]
8. **Componente antes que receta.** Si existe un `Fi*`, úsalo; si no, el
   componente de Nuxt UI (`UTable`, `UTabs`, `UAlert`, `UEmpty`, `UStepper`,
   `UTimeline`, `UFormField`…). Nunca `<table>` a mano, tabs con `role` a
   mano, callouts con `div` teñidos. [D8; D-13, D-14, E-21]
9. **Todo dato tiene cuatro estados.** Carga = `USkeleton` con la forma del
   contenido (spinner solo dentro de un botón); vacío (primer uso / sin
   resultados con "Limpiar filtros" / todo al día); error con "Reintentar";
   parcial con explicación. Nunca "sin datos" cuando la carga falló. [D11;
   C-21, E-20]
10. **El canal de la respuesta es fijo.** Error de campo o sección: en línea,
    persistente, `role="alert"`. Toast: solo confirmación transitoria (con
    deshacer si se puede). Destructivo: `color="error"` + `UModal` que nombra
    el objeto y la consecuencia, botón con verbo, foco inicial en Cancelar.
    [D11; C-02, D-07, D-15]
11. **Accesible por construcción.** Botón de solo ícono con `aria-label`
    (`UTooltip` no da nombre); nada de `@click` en `div`, `span` o `UBadge`;
    tarjeta clicable = enlace estirado (`after:absolute after:inset-0`), nunca
    botón dentro de botón; formularios con `UFormField` y etiqueta arriba.
    [D11; C-10, E-08, D-04, E-10, E-22]
12. **Navegación con enlaces reales.** `to` con rutas absolutas
    (`'/ubicaciones'`); pestañas de ruta con `UNavigationMenu`, pestañas de
    página con `UTabs` (nunca `role="tablist"` sobre enlaces); un solo
    `<main id="main-content">` en el layout, destino del enlace "Saltar al
    contenido" que rinde `FiHeader`. [D11; B-05, E-14, B-M1]
13. **Íconos Phosphor (`i-ph-*`).** Font Awesome y Bootstrap Icons solo dentro
    de `FiTopBar`/`FiFooter`. Íconos decorativos sin nombre; los que actúan,
    con nombre. [D6; A-22]
14. **Movimiento mínimo.** ≤ 200 ms, siempre con `motion-safe:` o bajo
    `prefers-reduced-motion`; nada animado en contenido de crisis. [D11; B-25,
    C-28]
15. **Texto por i18n, sin datos personales en la URL.** Todo texto visible sale
    del diccionario (también `aria-label`); vocabulario del dominio (en PSM,
    no clínico). Gráficas con `--fi-chart-*`, nunca colores de estado como
    serie. [D11; E-01, B-21]

## ¿Qué tipo de vista estoy construyendo?

Primera pregunta: **¿la ve alguien sin sesión (sitio público) o personal con
sesión (dashboard)?** Luego toma la primera fila que describa la tarea
principal de la vista y lee `references/archetypes/<id>.md`.

### Sitio público (FiHeader + FiFooter)

| Si la vista… | Arquetipo |
|--------------|-----------|
| atiende a alguien en crisis: números de ayuda con un toque, primeros auxilios | [`crisis-info`](references/archetypes/crisis-info.md) |
| es la puerta de entrada del servicio: qué es, para quién, una acción principal | [`public-landing`](references/archetypes/public-landing.md) |
| explica algo (programa, canal, sede, preguntas) sin capturar datos | [`public-content`](references/archetypes/public-content.md) |
| captura un envío en varios pasos: identidad, consentimiento, revisar respuestas, confirmación | [`public-guided-flow`](references/archetypes/public-guided-flow.md) |
| es un solo formulario corto con un resultado: iniciar sesión, verificar un documento | [`public-utility`](references/archetypes/public-utility.md) |
| dice que algo no está disponible: 404/500, receso, recepción cerrada | [`status-and-error`](references/archetypes/status-and-error.md) |

### Dashboard (shell `UDashboardGroup` + sidebar isla oscura)

| Si la vista… | Arquetipo |
|--------------|-----------|
| es el inicio del rol: "¿qué requiere mi atención ahora?" | [`dashboard-home`](references/archetypes/dashboard-home.md) |
| procesa elementos entrantes uno a uno (aceptar, rechazar, cerrar) con historial | [`worklist-queue`](references/archetypes/worklist-queue.md) |
| muestra la semana o el día y permite actuar sobre citas | [`scheduling-calendar`](references/archetypes/scheduling-calendar.md) |
| es el espacio de trabajo durante una atención en vivo (notas con autoguardado) | [`live-session`](references/archetypes/live-session.md) |
| guía una escritura con consecuencias: wizard interno, compositor de documento | [`internal-task-flow`](references/archetypes/internal-task-flow.md) |
| captura o importa muchos registros a la vez, con validación por fila | [`bulk-entry`](references/archetypes/bulk-entry.md) |
| sirve para encontrar un registro operativo y lanzar la siguiente acción | [`record-finder`](references/archetypes/record-finder.md) |
| muestra todo de un registro: vista 360, pestañas, línea del tiempo | [`record-detail`](references/archetypes/record-detail.md) |
| mantiene datos de referencia (catálogos, usuarios, roles): CRUD | [`catalog-admin`](references/archetypes/catalog-admin.md) |
| compone algo versionado con vista previa y "Publicar" | [`builder-editor`](references/archetypes/builder-editor.md) |
| cambia la configuración de una sola cosa: perfil, interruptor, parámetros | [`settings`](references/archetypes/settings.md) |
| resume cifras y gráficas de un periodo, con detalle y exportación | [`analytics`](references/archetypes/analytics.md) |
| supervisa: bitácora, actividad, salud de procesos | [`audit-and-monitoring`](references/archetypes/audit-and-monitoring.md) |

Desempates frecuentes:

- **worklist-queue vs record-finder.** Los elementos *llegan* y hay que
  despacharlos → worklist. Buscas algo que ya sabes que existe → finder.
- **record-finder vs catalog-admin.** Registros operativos de personas o casos
  → finder. Datos de referencia que otros eligen de una lista → catalog.
- **internal-task-flow vs bulk-entry.** Un registro con consecuencias → task
  flow. Muchas filas parecidas → bulk-entry.
- **settings vs catalog-admin.** Un solo objeto con sus opciones → settings.
  Una colección → catalog.
- Una vista que mezcla dos arquetipos casi siempre son dos vistas. Si no se
  puede separar, manda el arquetipo de la tarea principal y el otro va como
  sección secundaria.

## Cómo elegir componente

Orden de preferencia:

1. **Un `Fi*`** si existe para esa necesidad (identidad resuelta, accesible,
   sin `dark:`).
2. **Un componente de Nuxt UI** con su API normal. La apariencia FI ya llega
   por `fiAppConfig`: no le pongas clases de color; usa `color` y `variant`.
3. **Composición** de Nuxt UI + utilidades semánticas.
4. **Nunca** CSS nuevo con colores, tamaños de letra fuera de la escala ni un
   `:ui` que cambie color. `:ui` y `class` sirven para layout (ancho, padding,
   alineación).

| Necesito | Usa | No hagas |
|----------|-----|----------|
| Título de la vista, descripción y acciones | `FiPageHeader` | `<h1>` suelto con flex a mano; el título en `UDashboardNavbar` |
| Encabezado de sección editorial (público) | `FiSectionHeading` | `.fi-tag` + `h2` + filete copiados |
| Tarjeta con título y acciones | `FiSectionCard` | `div` con `rounded-xl bg-white shadow` |
| Cifras clave (KPI) | `FiStat`, `FiStatGrid` | tarjetas KPI a mano, color por string |
| Estado de un registro | `FiStatusBadge` | `UBadge` con color decidido en cada vista |
| Ícono en círculo | `FiIconBadge` | `div` redondo con `bg-*-100` |
| Banda azul marino de llamado a la acción | `FiCtaBand` | gradiente copiado de otra página |
| Marca en el sidebar | `FiDashboardBrand` | logo + nombre a mano |
| Volver | `FiBackButton` (`iconOnly` en encabezados) | `UButton` con flecha sin `aria-label` |
| Encabezado y pie del sitio público | `FiHeader`, `FiFooter` | `UHeader` con colores propios |
| Tabla | `UTable` | `<table>` a mano |
| Pestañas dentro de la página | `UTabs` | botones con `role="tab"` |
| Pestañas que cambian de ruta | `UNavigationMenu` horizontal | `UButton :to` dentro de `role="tablist"` |
| Aviso o callout | `UAlert` | `div` teñido con ícono |
| Vacío | `UEmpty` | párrafo gris "No hay datos" |
| Asistente por pasos | `UStepper` | indicador de pasos propio |
| Historial | `UTimeline` | lista con puntos a mano |
| Campo | `UFormField` + `UInput`/`USelect`/`UTextarea` | placeholder como etiqueta |
| Chips de entrada | `UInputTags` | chips a mano con `x` sin nombre |
| Confirmación | `UModal` (con `useOverlay`) | `window.confirm`; borrar sin confirmar |
| Detalle lateral | `USlideover` | modal enorme |
| Confirmación transitoria | `useToast` | toast como único aviso de un error |
| Carga | `USkeleton` | spinner de página completa |
| Login | `UAuthForm` | formulario propio |
| Shell del dashboard | `UDashboardGroup`, `UDashboardSidebar`, `UDashboardPanel`, `UDashboardNavbar`, `UDashboardToolbar` | layout a mano |

APIs completas de los `Fi*` y recetas FI de los componentes de Nuxt UI:
[references/components.md](references/components.md).

## Definición de terminado

Una vista está terminada cuando, además de funcionar:

- Los greps de [checklist.md](references/checklist.md) salen en cero para tus
  archivos (paletas crudas, hex, `dark:`, texto < 12 px, `<table>`, tabs falsas,
  `@click` en `div`, ícono sin nombre, más de un `solid primary`).
- Tiene un `<h1>`, un `<main>` y una sola acción `solid primary` visible.
- Cada región de datos tiene carga, vacío, error y (si aplica) parcial.
- Se usa entera con teclado, con foco visible, y lee bien a 320 px de ancho.
- Ningún texto visible está escrito a mano en la plantilla: todo es i18n.
- Se ve correcta con `?tema=luto` y `?tema=8m` (prueba de que todo sale de
  tokens).
- `typecheck` y `lint` del proyecto sin errores nuevos.

## Índice de referencias

| Archivo | Para qué |
|---------|----------|
| [references/setup.md](references/setup.md) | Instalar y configurar: Nuxt, Vue + Vite, i18n, opciones `fiUi`, desarrollo local del paquete, exponer esta skill a agentes |
| [references/foundations.md](references/foundations.md) | Tokens y roles, superficies, mapa de estados y contraste, utilidades editoriales, tipografía, radios, bordes, espaciado, íconos, islas oscuras, temas especiales, fuentes |
| [references/components.md](references/components.md) | API de los `Fi*` (props, slots, eventos) y recetas FI para componentes de Nuxt UI |
| [references/patterns.md](references/patterns.md) | Reglas transversales en detalle: estados de datos, retroalimentación, destructivas, formularios, tablas, tarjeta clicable, navegación |
| [references/data-viz.md](references/data-viz.md) | Gráficas: paleta `--fi-chart-*`, rampa secuencial, ejes, leyendas, alternativa en tabla |
| [references/checklist.md](references/checklist.md) | Revisión antes de entregar y comandos `rg` que detectan las violaciones comunes |
| `references/archetypes/<id>.md` | Un archivo por arquetipo: propósito, anatomía, estados, acciones, responsive, accesibilidad, do/don't, ejemplo en PSM y errores típicos |

Arquetipos, en el orden de las tablas de arriba. Públicos:
[crisis-info](references/archetypes/crisis-info.md),
[public-landing](references/archetypes/public-landing.md),
[public-content](references/archetypes/public-content.md),
[public-guided-flow](references/archetypes/public-guided-flow.md),
[public-utility](references/archetypes/public-utility.md),
[status-and-error](references/archetypes/status-and-error.md). Dashboard:
[dashboard-home](references/archetypes/dashboard-home.md),
[worklist-queue](references/archetypes/worklist-queue.md),
[scheduling-calendar](references/archetypes/scheduling-calendar.md),
[live-session](references/archetypes/live-session.md),
[internal-task-flow](references/archetypes/internal-task-flow.md),
[bulk-entry](references/archetypes/bulk-entry.md),
[record-finder](references/archetypes/record-finder.md),
[record-detail](references/archetypes/record-detail.md),
[catalog-admin](references/archetypes/catalog-admin.md),
[builder-editor](references/archetypes/builder-editor.md),
[settings](references/archetypes/settings.md),
[analytics](references/archetypes/analytics.md),
[audit-and-monitoring](references/archetypes/audit-and-monitoring.md).

Para trabajar **en** el paquete (no en un proyecto que lo usa), lee
`AGENTS.md` en la raíz del repositorio: estructura, pruebas y cómo mantener
esta skill al día.
