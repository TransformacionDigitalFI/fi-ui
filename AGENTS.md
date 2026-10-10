# fi-ui — guía para agentes que trabajan en el paquete

Esto es para cambiar `@fi-unam/ui` en sí. Si estás construyendo vistas en un
proyecto que lo **usa**, lo tuyo es la skill:
[skills/fi-ui/SKILL.md](skills/fi-ui/SKILL.md).

Consumidor de referencia: PSM-SI-V2 (`../PSM-SI-V2`), que instala el paquete
con `npm run ui:link` (copia, no enlace). Prosa, comentarios y documentación en
español; identificadores en inglés. Los comentarios explican **por qué** (la
trampa, la medición, el hallazgo), no qué hace la línea.

## Estructura

| Ruta | Qué es |
|------|--------|
| `src/css/tokens.css` | Semillas → escalas OKLCH → tokens de Nuxt UI; superficies y estados en claro; paleta de gráficas; radio |
| `src/css/themes.css` | Un bloque `[data-fi-theme="…"]` por tema especial (solo semillas y listón) |
| `src/css/no-fonts.css` | `@source`, familias, escala tipográfica, utilidades `fi-*` (`@theme inline`), base y clases editoriales |
| `src/css/fonts.css`, `index.css` | Fontsource; `index.css` = fonts + no-fonts |
| `src/app-config.js` (+ `.d.ts`) | `fiAppConfig.ui`: la configuración FI de Nuxt UI. **JavaScript sin imports** |
| `src/vite.js` (+ `.d.ts`) | `fiUiViteOptions`, `fiUiViteConfig` para `vite.config.ts`. **JavaScript con imports `.js` explícitos** |
| `src/nuxt/module.ts`, `src/nuxt/runtime/plugin.ts` | Módulo de Nuxt (opciones `fiUi`) y su plugin (tema, cromo, idioma) |
| `src/vue/plugin.ts` | `createFiUi` para Vue + Vite |
| `src/components/*.vue` | Los `Fi*`. **Solo `.vue`**: el módulo registra todo lo que haya ahí |
| `src/composables/` | `useFiTheme`, `useFiConfig` y los tipos compartidos de los componentes (`fiComponents.ts`) |
| `src/i18n.ts` | Diccionario es/en del paquete, `LocalizedText`, `useFiT`, `useFiText` |
| `src/themes/registry.ts`, `calendar.ts` | Metadatos de los temas y el calendario de `theme: 'auto'` |
| `src/chrome.ts`, `src/color.ts` | `theme-color`; matemática de color (OKLCH, contraste, ΔE) que usan las pruebas |
| `src/fi-data.ts` | Datos del portal (`@fi-unam/ui/data`) |
| `src/index.ts` | Todas las exportaciones públicas |
| `skills/fi-ui/` | La skill del lenguaje visual (se publica con el paquete) |
| `tests/` | Vitest; `tests/components/` renderiza los `.vue` en servidor sin plugin de Vite |

## Pruebas

```bash
npm test
```

No hay `tsconfig` ni typecheck propio: el proyecto que consume compila el
paquete y su `typecheck` lo cubre. Para revisar tipos aquí, corre el
`vue-tsc` de PSM con un tsconfig temporal que extienda
`../PSM-SI-V2/.nuxt/tsconfig.app.json` e incluya `src/**`.

| Archivo | Protege |
|---------|---------|
| `contrast.test.ts`, `surfaces.test.ts`, `themes.test.ts` | Contraste AA de roles, estados, superficies y bordes en **todos** los temas; que CSS y registro digan lo mismo |
| `charts.test.ts` | Paleta de gráficas: contraste, distancia entre vecinas (también con daltonismo), sin tonos de estado |
| `app-config.test.ts` | Reglas de `fiAppConfig` (superficies, tamaños ≥ 12 px, íconos Phosphor, clases literales) |
| `tailwind.test.ts` | Que las utilidades `fi-*` y la escala existan al compilar con Tailwind |
| `module.test.ts`, `plugins.test.ts`, `vite-entry.test.ts` | Opciones del módulo, plugins y que Node cargue `@fi-unam/ui/vite` desde `node_modules` |
| `tests/components/*` | Marcado y accesibilidad de cada `Fi*`; `package.test.ts`: solo `.vue`, todo exportado, sin `dark:`, sin texto < 12 px |
| `docs.test.ts` | Enlaces y anclas de README, AGENTS y la skill; que los snippets usen props reales de los `Fi*`; que el README documente cada componente y prop |

**Las pruebas de contraste no se relajan para que pase un cambio.** Si una
falla, el color está mal: busca otro paso u otra semilla. El umbral y el paso
de cada token los eligen las pruebas (p. ej. los estados en 800 porque 700
falla sobre `bg-muted`).

`tests/components/.cache/` (ignorada por git) guarda los SFC compilados y no
se poda; bórrala si crece.

## Reglas del código

- **Solo claro.** Nada de `dark:` en componentes; lo oscuro es una isla (la
  clase `dark` en la raíz: `FiHeader`, `FiFooter`, `FiCtaBand`). En
  `app-config.js`, `dark:` solo para devolver dentro de una isla el valor que
  una clase de claro cambió (`fiPrimaryOnTint`).
- **Sin texto fijo.** Textos propios en el diccionario de `src/i18n.ts`;
  textos del proyecto por props `LocalizedText`.
- **Sin `#imports` en componentes**: deben funcionar en Vue + Vite. Nuxt UI se
  importa por archivo (`@nuxt/ui/components/Button.vue`).
- **Nada por debajo de 12 px**; `text-xs` ya es 13 px en la escala FI.
- **Clases literales** en `app-config.js` y en los componentes: Tailwind las
  encuentra por `@source` y no ve `${…}`.
- `app-config.js` y `vite.js` son JavaScript a propósito (Node los carga desde
  `vite.config.ts` y no acepta TypeScript en `node_modules`). No los conviertas
  a `.ts`; si cambias la forma de lo que exportan, actualiza su `.d.ts`.

## Añadir un tema

1. `src/css/themes.css`: bloque `[data-fi-theme="<id>"]` con sus semillas
   (`--fi-seed-primary`, y las demás solo si cambian) y su listón.
2. `src/themes/registry.ts`: `label`, `description` (texto alternativo del
   listón), `ribbon`, `dates` y `chromeColor` (= su `--fi-seed-primary`).
3. `npm test`: rechaza la semilla si no pasa AA (botón sólido, texto sobre las
   tres superficies, isla oscura) o si el primario se confunde con un estado.
4. Tabla de temas en el README y en `skills/fi-ui/references/foundations.md`.

## Añadir o cambiar un componente

1. `src/components/Fi<Nombre>.vue`, construido con Nuxt UI. Tipos compartidos
   en `src/composables/fiComponents.ts`, nunca en `src/components/`.
2. Exportarlo en `src/index.ts` (`export { default as Fi<Nombre> } …`).
3. Prueba en `tests/components/Fi<Nombre>.test.ts` con el arnés de
   `render.ts` (si usa un componente de Nuxt UI nuevo, agrega su sustituto en
   `stubs.ts`).
4. Documentarlo: sección con tabla de props y slots en el README (la exige
   `docs.test.ts`) y en `skills/fi-ui/references/components.md`; si cambia una
   regla, también en `SKILL.md`.

## Cambiar `fiAppConfig`

- Antes de escribir una clave, compruébala contra el tema real de Nuxt UI 4.9
  (`node_modules/@nuxt/ui/dist/runtime/components/*.vue` o los temas que
  genera un proyecto en `.nuxt/ui/*.ts`). Una clave mal escrita no falla: no
  hace nada.
- Regla de superficies: overlay o campo → `bg-elevated`; tinte de reposo,
  hover o selección → `bg-muted`; tinte fuerte → `bg-accented`. `bg-elevated`
  nunca como hover.
- Se mezcla por debajo del `app.config` del proyecto: cadenas se sustituyen,
  `compoundVariants` se concatenan (gana la del paquete en conflicto).

## La skill va al día con el código

`skills/fi-ui/` es la documentación de uso y la leen agentes que la toman al
pie de la letra. Cualquier cambio de API (prop, slot, default, utilidad,
token, opción del módulo, export, ruta de import) se refleja en el mismo
cambio:

| Cambiaste | Actualiza |
|-----------|-----------|
| Props o slots de un `Fi*` | README, `references/components.md` y los snippets que lo usen (`rg '<FiNombre' skills`) |
| Tokens, utilidades, contraste | `references/foundations.md`, README ("Tokens y utilidades") |
| `fiAppConfig` | `references/components.md` ("Lo que fiAppConfig ya estiliza"), `foundations.md` sección 2 |
| Opciones del módulo, entradas de `package.json` | README, `references/setup.md` |
| Paleta de gráficas | `references/data-viz.md` |
| Una regla de diseño | `SKILL.md` (reglas de oro), `references/patterns.md`, `references/checklist.md` |

`docs.test.ts` detecta enlaces rotos y props inventadas, no reglas
desactualizadas: esas las revisas tú. Sube `version` en `package.json` con
cada cambio de API.
