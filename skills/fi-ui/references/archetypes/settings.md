# Arquetipo `settings` — Configuración de un objeto

Muestra y cambia la configuración de **una sola cosa**: mi perfil, el
interruptor de un servicio, los parámetros de un módulo. Cada valor se lee
de un vistazo (rótulo arriba, valor abajo), se edita en su lugar o en un
diálogo corto, y nada se pierde ni se aplica por accidente: lo que tiene
consecuencias confirma, y lo peligroso vive al final, separado.

> Los snippets suponen Nuxt 4 con el módulo `@fi-unam/ui/nuxt`, que
> auto-registra los componentes `Fi*`. En Vue + Vite, importa los `Fi*` desde
> `@fi-unam/ui`. Los textos literales son ilustrativos: en un proyecto con
> i18n van al diccionario. El marco común (layout, navbar sin `h1`) está en
> [dashboard-home](dashboard-home.md#marco-del-dashboard).

## Propósito y usuario

- **Usuario:** cualquier persona con sesión (su perfil) o quien administra un
  servicio (abrir o cerrar la recepción pública, parámetros).
- **Tarea:** revisar cómo está algo y cambiar un valor concreto.
- **Éxito:** encuentra el valor sin desplazarse por una página de mil líneas,
  lo cambia, ve la confirmación junto al control, y no puede cerrar un servicio
  público ni quedarse sin acceso con un clic accidental.

## Cuándo usarlo / cuándo no

| Úsalo para | No lo uses para |
|---|---|
| Mi perfil, mi seguridad, mis sesiones activas, mis notificaciones. | Una **colección** (semestres, usuarios, categorías): es [`catalog-admin`](catalog-admin.md). La lista de semestres es catálogo; los parámetros **de** un semestre pueden ser ajustes. |
| El estado de un servicio (recepción abierta/cerrada) y su aviso. | Contenido versionado que se publica: es [`builder-editor`](builder-editor.md). |
| Parámetros de un módulo (horarios, límites, plantillas por defecto). | Capturar muchas filas o pegar un CSV: es [`bulk-entry`](bulk-entry.md). |

## Anatomía (de arriba abajo)

| # | Bloque | Componentes exactos | Regla |
|---|---|---|---|
| 0 | Marco | `UDashboardPanel` + `UDashboardNavbar` con `#left` (nombre del área como texto o `UBreadcrumb`). | Sin `title` en el navbar. |
| 1 | Encabezado | `FiPageHeader` con el nombre del objeto ("Mi perfil", "Recepción de solicitudes") y una frase de qué se configura. `#leading` = `UAvatar` en el perfil. | **Sin acción sólida** en el encabezado: los sólidos aparecen solo al editar ("Guardar cambios"). Nada destructivo en el encabezado (C-13). |
| 2 | Subnavegación (opcional) | Más de 3 temas o una página larga → `UNavigationMenu orientation="horizontal"` en `UDashboardToolbar`, una **ruta hija** por tema (`/mi-perfil`, `/mi-perfil/seguridad`, `/mi-perfil/sesiones`). | Cada tema tiene URL propia (se enlaza y se comparte). Nunca `role="tablist"` sobre enlaces (E-14). |
| 3 | Secciones | Una `FiSectionCard` por tema (`title` + `description` + `divided`), apiladas, `max-w-3xl`. | Credenciales (correo, contraseña) en su propia sección, separadas de identidad (inventario, mi-perfil). |
| 4 | Filas de valor | `<dl class="divide-y">` de `SettingsRow`: rótulo `.fi-label` **arriba**, valor abajo, "Editar" `neutral ghost` con nombre propio. Al editar, la fila se abre en su lugar con `UForm` y pie `[Cancelar] [Guardar cambios]`. | Un rótulo por valor, siempre arriba; nada de valores sin rótulo ni rótulos de cinco recetas (E-15, B-15). |
| 5 | Preferencias inmediatas | `USwitch` con `label` y `description`, que se aplica al instante con confirmación breve. | Solo para lo de **bajo impacto** (recordatorios por correo). Lo que cierra un servicio o deja a alguien fuera **no** es un switch: es un botón que abre confirmación (C-02). |
| 6 | Zona de riesgo | Última `FiSectionCard`, "Zona de riesgo": filas con la consecuencia en texto y un botón `color="error" variant="outline"` que abre `ConfirmDialog`. | Al final y separada de lo rutinario. Escribir el nombre para confirmar solo en lo irreversible y grave. |

### Reglas de guardado (no las mezcles)

| Tipo de valor | Cómo se guarda | Confirmación |
|---|---|---|
| Texto, selección, fechas (nombre, grado, aviso) | **Explícito**: "Guardar cambios" en el pie de la fila o de la sección | Toast breve "Cambios guardados"; el error, en línea y persistente |
| Preferencia de bajo impacto (switch) | **Inmediato** al cambiar | Toast breve; si falla, el switch vuelve a su valor y el error queda junto a él |
| Cambio de alto impacto (cerrar la recepción, deshabilitar, revocar) | **Botón + `UModal`** que explica la consecuencia | El modal; después, toast |
| Credencial (correo, contraseña) | `UModal` que pide la contraseña actual | Toast; el error de la contraseña actual, en el campo |

Nunca autoguardes texto en ajustes: quien escribe un aviso a medias no quiere
que se publique a medias (Primer, *Saving*). El autoguardado es de borradores
versionados ([`builder-editor`](builder-editor.md#autoguardado-del-borrador)).

### Rastreo de cambios (sucio)

- **Sucio = distinto de lo guardado**, comparado contra una copia del último
  valor que confirmó el servidor. No uses `form.dirty` de `UForm` 4.9: se
  marca con cualquier tecla, no vuelve a limpio si regresas al valor original
  y `clear()` solo borra errores.
- Mientras hay cambios: "Cambios sin guardar" con `role="status"` junto al pie.
- "Guardar cambios" **no** se deshabilita: sin cambios, cierra la edición sin
  pedir nada al servidor; con errores, valida y los muestra.
- **Una edición abierta a la vez.** Abrir otra fila con cambios pendientes en
  la actual muestra el aviso "Tienes cambios sin guardar" en la actual.
- **Formulario de sección siempre visible** (p. ej. el aviso de recepción
  cerrada): el pie `[Descartar cambios (neutral outline)] [Guardar cambios
  (primary)]` aparece **solo con cambios**, junto a "Cambios sin guardar".
  "Descartar cambios" regresa a lo guardado sin otra confirmación: el botón
  ya dice lo que hace y lo guardado no se toca.
- Salir de la vista con cambios: `onBeforeRouteLeave` + `beforeunload`
  preguntan (receta en [builder-editor](builder-editor.md#esqueleto-de-la-vista)).

### `SettingsRow`: rótulo arriba, valor, edición en su lugar

Un componente del proyecto (fi-ui no lo trae: es composición), usado en todas
las filas de ajustes.

```vue
<!-- components/settings/SettingsRow.vue -->
<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { ComponentPublicInstance, Ref } from 'vue'
import type { FormSchema, FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{
  label: string
  /** El valor como se lee ("Ana Pérez López", "Sin especificar"). */
  display: string
  /** Lo guardado: punto de partida del borrador y referencia de "sucio". */
  value: T
  save: (draft: T) => Promise<void>
  schema?: FormSchema
}>()
const emit = defineEmits<{ saved: [] }>()

const editing = ref(false)
const draft = ref(structuredClone(toRaw(props.value))) as Ref<T>
const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(props.value))
const saving = ref(false)
const error = ref<string | null>(null)
const panelId = useId()
const editButton = useTemplateRef<ComponentPublicInstance>('edit-button')

function open() {
  draft.value = structuredClone(toRaw(props.value))
  error.value = null
  editing.value = true
}

async function close() {
  editing.value = false
  await nextTick()
  // El foco regresa al botón que abrió la edición.
  ;(editButton.value?.$el as HTMLElement | undefined)?.focus()
}

async function onSubmit(event: FormSubmitEvent<T>) {
  if (!isDirty.value) return close() // nada que guardar: no se llama al servidor
  saving.value = true
  error.value = null
  try {
    await props.save(event.data)
    emit('saved')
    await close()
  } catch {
    error.value = 'No se pudo guardar. Lo que escribiste se conserva; inténtalo de nuevo.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- Un <div> dentro de <dl> agrupa un par dt/dd: el botón y el formulario viven en el <dd>. -->
  <div class="py-4">
    <dt class="fi-label">{{ props.label }}</dt>
    <dd class="mt-1">
      <div class="flex items-start justify-between gap-4">
        <p class="min-w-0 break-words text-default">{{ props.display }}</p>
        <UButton
          v-if="!editing"
          ref="edit-button"
          label="Editar"
          icon="i-ph-pencil-simple"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="`Editar ${props.label.toLowerCase()}`"
          :aria-expanded="false"
          :aria-controls="panelId"
          @click="open()"
        />
      </div>

      <UForm v-if="editing" :id="panelId" :schema="props.schema" :state="draft" class="mt-4 flex flex-col gap-4" @submit="onSubmit">
        <slot :state="draft" />

        <UAlert v-if="error" role="alert" color="error" variant="subtle" icon="i-ph-warning-circle" :title="error" />

        <div class="flex flex-wrap items-center justify-end gap-2">
          <!-- La región viva existe siempre; solo cambia su texto (si se inserta con v-if, no se anuncia). -->
          <p role="status" class="me-auto text-sm text-muted">{{ isDirty ? 'Cambios sin guardar' : '' }}</p>
          <UButton label="Cancelar" color="neutral" variant="outline" @click="close()" />
          <UButton type="submit" label="Guardar cambios" color="primary" variant="solid" :loading="saving" />
        </div>
      </UForm>
    </dd>
  </div>
</template>
```

### Esqueleto de la vista (perfil)

```vue
<!-- pages/dashboard/mi-perfil/index.vue -->
<script setup lang="ts">
import * as z from 'zod'
import ConfirmDialog from '~/components/app/ConfirmDialog.vue'

interface Profile {
  firstName: string
  lastName: string
  degree: string | null
  avatarUrl: string | null
  emailReminders: boolean
  otherSessions: number
}

const toast = useToast()
const confirmDialog = useOverlay().create(ConfirmDialog)
const { data: profile, error, refresh } = useLazyFetch<Profile>('/api/me/profile')

const nameSchema = z.object({
  firstName: z.string().trim().min(1, 'Escribe tu nombre.'),
  lastName: z.string().trim().min(1, 'Escribe tus apellidos.'),
})

async function saveName(draft: { firstName: string, lastName: string }) {
  await $fetch('/api/me/profile', { method: 'PATCH', body: draft })
  toast.add({ title: 'Cambios guardados', color: 'success', icon: 'i-ph-check-circle' })
  await refresh()
}

// Preferencia de bajo impacto: inmediata. Si falla, vuelve atrás y lo dice junto al control.
const reminderError = ref<string | null>(null)
async function setReminders(value: boolean) {
  if (!profile.value) return
  const previous = profile.value.emailReminders
  // En Nuxt 4 `data` de useFetch es shallowRef: se reemplaza el objeto, no se muta.
  profile.value = { ...profile.value, emailReminders: value }
  reminderError.value = null
  try {
    await $fetch('/api/me/preferences', { method: 'PATCH', body: { emailReminders: value } })
    toast.add({ title: value ? 'Recordatorios activados' : 'Recordatorios desactivados', color: 'success', icon: 'i-ph-check-circle' })
  } catch {
    if (profile.value) profile.value = { ...profile.value, emailReminders: previous }
    reminderError.value = 'No se pudo cambiar la preferencia. Inténtalo de nuevo.'
  }
}

// Zona de riesgo: confirma con la consecuencia.
async function signOutOthers() {
  const sessions = profile.value?.otherSessions ?? 0
  const confirmed = await confirmDialog.open({
    title: '¿Cerrar la sesión en los demás dispositivos?',
    description: `Se cerrarán ${sessions} sesiones abiertas en otros equipos. Esta sesión sigue abierta.`,
    confirmLabel: 'Cerrar las demás sesiones',
  })
  if (confirmed !== true) return
  await $fetch('/api/me/sessions/others', { method: 'DELETE' })
  toast.add({ title: 'Se cerraron las demás sesiones', color: 'success', icon: 'i-ph-check-circle' })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="mi-perfil">
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UDashboardSidebarCollapse class="hidden lg:flex" />
          <span class="font-semibold text-highlighted">Mi cuenta</span>
        </template>
      </UDashboardNavbar>
      <!-- Temas con ruta propia: se enlazan y "Atrás" funciona. -->
      <UDashboardToolbar>
        <UNavigationMenu
          :items="[
            { label: 'Perfil', icon: 'i-ph-user', to: '/dashboard/mi-perfil', exact: true },
            { label: 'Seguridad', icon: 'i-ph-shield-check', to: '/dashboard/mi-perfil/seguridad' },
            { label: 'Sesiones', icon: 'i-ph-devices', to: '/dashboard/mi-perfil/sesiones' },
          ]"
          orientation="horizontal"
          variant="link"
          highlight
          aria-label="Secciones de mi cuenta"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <FiPageHeader title="Mi perfil" description="Cómo te ven las demás personas del programa.">
          <template #leading>
            <UAvatar :src="profile?.avatarUrl ?? undefined" :alt="profile ? `${profile.firstName} ${profile.lastName}` : ''" size="xl" />
          </template>
        </FiPageHeader>

        <UAlert
          v-if="error"
          role="alert"
          color="error"
          variant="subtle"
          icon="i-ph-warning-circle"
          title="No se pudo cargar tu perfil"
          :actions="[{ label: 'Reintentar', color: 'neutral', variant: 'outline', onClick: () => refresh() }]"
        />

        <template v-else-if="profile">
          <FiSectionCard title="Datos personales" description="Aparecen en tus citas y en las notas que firmas." icon="i-ph-identification-card" divided>
            <dl class="divide-y divide-default">
              <SettingsRow
                v-slot="{ state }"
                label="Nombre"
                :display="`${profile.firstName} ${profile.lastName}`"
                :value="{ firstName: profile.firstName, lastName: profile.lastName }"
                :schema="nameSchema"
                :save="saveName"
              >
                <UFormField name="firstName" label="Nombre(s)">
                  <UInput v-model="state.firstName" autocomplete="given-name" class="w-full" />
                </UFormField>
                <UFormField name="lastName" label="Apellidos">
                  <UInput v-model="state.lastName" autocomplete="family-name" class="w-full" />
                </UFormField>
              </SettingsRow>
              <!-- Grado, género, foto… con la misma fila. La foto: botón "Cambiar foto" con nombre, nunca un ícono de cámara mudo (C-10). -->
            </dl>
          </FiSectionCard>

          <FiSectionCard title="Notificaciones" description="Los cambios se aplican al momento." icon="i-ph-bell" divided>
            <USwitch
              :model-value="profile.emailReminders"
              label="Recibir recordatorios de citas por correo"
              description="Un día antes de cada cita."
              @update:model-value="setReminders"
            />
            <p v-if="reminderError" role="alert" class="mt-2 text-sm text-error">{{ reminderError }}</p>
          </FiSectionCard>

          <!-- Siempre la última sección. -->
          <FiSectionCard title="Zona de riesgo" description="Acciones que te sacan de otros dispositivos o no se pueden deshacer." icon="i-ph-warning" divided>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-medium text-highlighted">Cerrar la sesión en los demás dispositivos</p>
                <p class="text-sm text-muted">Úsalo si dejaste tu sesión abierta en un equipo compartido.</p>
              </div>
              <UButton label="Cerrar las demás sesiones" color="error" variant="outline" class="shrink-0" @click="signOutOthers()" />
            </div>
          </FiSectionCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
```

### Cambio de alto impacto: abrir o cerrar un servicio

El estado se **muestra** con `FiStatusBadge` y se **cambia** con un botón que
abre un modal; el modal reúne lo que hace falta para el cambio (el aviso de
cerrado) y muestra el resultado antes de confirmar. Nunca un `USwitch` que
cierra la recepción pública al primer toque, ni un switch arriba del
formulario del aviso que se puede accionar antes de escribirlo
(recepcion-solicitudes, inventario).

```vue
<FiSectionCard title="Estado de la recepción" description="Si está cerrada, /agendar muestra el aviso en lugar del formulario." icon="i-ph-door-open" divided>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <!-- Cerrada no es un error: es neutral. -->
      <FiStatusBadge
        :status="intake.open ? 'success' : 'neutral'"
        :label="intake.open ? 'Abierta' : 'Cerrada'"
        :icon="intake.open ? 'i-ph-door-open' : 'i-ph-door'"
        size="lg"
      />
      <p class="mt-2 text-sm text-muted">Último cambio: {{ intake.changedAtLabel }}, por {{ intake.changedBy }}.</p>
    </div>
    <!-- Botón con "…": abre un diálogo, no actúa. -->
    <UButton
      :label="intake.open ? 'Cerrar recepción…' : 'Abrir recepción…'"
      :icon="intake.open ? 'i-ph-lock-simple' : 'i-ph-lock-simple-open'"
      color="neutral"
      variant="outline"
      class="shrink-0"
      @click="intake.open ? closeIntake() : openIntake()"
    />
  </div>

  <template #footer>
    <ULink to="/agendar" target="_blank" class="text-sm">
      Ver lo que ven hoy las y los estudiantes <span class="sr-only">(se abre en otra pestaña)</span>
      <UIcon name="i-ph-arrow-square-out" class="size-4 align-[-2px]" aria-hidden="true" />
    </ULink>
  </template>
</FiSectionCard>
```

`closeIntake()` abre un `UModal` (≤ 6 campos) con título "Cerrar la recepción
de solicitudes", los campos del aviso **precargados** (título, mensaje, fecha
de reapertura), una vista previa en vivo del estado cerrado de `/agendar`, y el
pie `[Cancelar] [Cerrar recepción]` (el segundo `primary solid`). La
descripción dice la consecuencia: "Las y los estudiantes no podrán enviar
solicitudes hasta que la abras de nuevo. Las solicitudes ya recibidas no
cambian."

### Zona de riesgo: escribir el nombre para confirmar

Solo para lo irreversible **y** grave (eliminar un servicio con su historial,
eliminar una cuenta). El cuerpo del `UModal` lleva un `UFormField`:

```vue
<UFormField name="confirmName" :label="`Escribe «${service.name}» para confirmar`" :error="nameError ?? undefined">
  <UInput v-model="typedName" autocomplete="off" class="w-full" />
</UFormField>
```

El botón "Eliminar servicio" (`error solid`) **valida al pulsarse**: si no
coincide, error en el campo. No lo deshabilites para avisar.

### Parámetros en tabla (p. ej. población de un semestre)

Si un ajuste es una tabla corta de valores (carrera × género → conteo):

- Columnas con encabezado visible, no inputs con placeholder como etiqueta
  (E-22). Una fila = `grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_6rem_auto]`
  con `min-w-0`, o `UTable` con celdas editables (E-23).
- Suma en vivo contra el total, con el error en línea si no cuadra.
- Pegar desde una hoja de cálculo o importar CSV: es [`bulk-entry`](bulk-entry.md).
- Guardado explícito con "Guardar población" en el pie de la sección, igual que
  cualquier otra sección.

## Estados

| Estado | Qué se ve | Regla |
|---|---|---|
| Cargando | Encabezado final; dentro de cada `FiSectionCard`, `USkeleton` de una línea por fila (rótulo + valor). | Nada de spinner de página. |
| Error de carga | `UAlert color="error"` con "Reintentar" en lugar de las secciones. | Nunca filas vacías como si no hubiera datos. |
| Valor vacío | "Sin especificar" en `text-muted` + "Editar"; nunca una fila en blanco. | — |
| Editando | La fila abierta con su `UForm` y el pie; las demás siguen en lectura. | Una edición a la vez. |
| Cambios sin guardar | "Cambios sin guardar" (`role="status"`) en el pie; salir pregunta. | — |
| Guardando | "Guardar cambios" con `:loading`; los campos se desactivan solos (`loading-auto`). | — |
| Error al guardar | `UAlert` `role="alert"` dentro de la fila; lo escrito se conserva. | Nunca solo un toast (D-15). |
| Preferencia que falló | El switch regresa a su valor y el error queda junto a él. | — |
| Estado de servicio | `FiStatusBadge` (Abierta `success`, Cerrada `neutral`) con "último cambio" y quién. | Cerrada no es `error`. |

## Jerarquía de acciones

1. **Sin sólido en reposo.** La vista de ajustes no tiene acción principal
   permanente; "Guardar cambios" (`primary solid`) aparece solo en la fila o
   sección que se está editando. Así nunca hay dos.
2. **"Editar"** por fila: `neutral ghost`, `size="sm"`, con `aria-label` que
   nombra el valor ("Editar nombre").
3. **Pie de edición:** `[Cancelar (neutral outline)] [Guardar cambios (primary)]`,
   a la derecha, en filas, secciones y modales por igual (D-22).
4. **Alto impacto:** botón `neutral outline` con "…" que abre `UModal`; el
   sólido está dentro del modal.
5. **Zona de riesgo:** `error outline` fuera del diálogo, `error solid` dentro,
   foco inicial en "Cancelar" ([patterns.md](../patterns.md#acciones-destructivas-y-confirmación)).
6. Nada destructivo en el encabezado ni junto a acciones rutinarias (un "Quitar
   foto" como enlace de texto en el encabezado es lo que no se hace, C-13).

## Responsive

- Una sola columna `max-w-3xl` en todos los tamaños
  ([patterns.md](../patterns.md#responsive)).
- `< sm`: el botón "Editar" queda a la derecha del valor; si el valor es largo,
  hace `break-words` y el botón no se encoge (`shrink-0`).
- La subnavegación horizontal se desplaza dentro del toolbar si no cabe; con
  más de 5 temas, en móvil usa un `USelectMenu` de temas.
- Filas de la zona de riesgo: texto arriba, botón abajo a todo el ancho en
  `< sm`.

## Accesibilidad

- Un solo `h1` (`FiPageHeader`); cada `FiSectionCard` es `h2`.
- Rótulos de valor con `<dl>`/`<dt>`/`<dd>`: el lector de pantalla asocia
  "Correo" con su valor.
- "Editar" con `aria-expanded` y `aria-controls`; al cerrar, el foco vuelve a
  "Editar" (C-18).
- Cada `USwitch` con `label` que dice el resultado ("Recibir recordatorios por
  correo") y `description` enlazada (E-22).
- Resultado de guardar anunciado (`role="status"` o toast); error con
  `role="alert"` (WCAG 4.1.3).
- Datos personales con `autocomplete` (`given-name`, `family-name`, `email`);
  cambiar la contraseña pide la actual (`autocomplete="current-password"`) y
  la nueva (`new-password`).
- Botones de solo ícono (cámara, revocar sesión) con `aria-label`; `UTooltip`
  no da nombre (C-10).

## Do / Don't

| Do | Don't (hallazgo) |
|---|---|
| `FiPageHeader` + secciones `FiSectionCard` con `h2` navy. | Tres encabezados distintos en tres vistas de ajustes, ninguno compartido; títulos de sección con `.ui-label`, con `h2 text-lg navy` y con `h2 text-xl` sin navy y anidados (inventario; E-31). |
| Cerrar la recepción con botón + modal que precarga el aviso y muestra la vista previa. | Cerrar la recepción pública con un solo cambio de `USwitch`, sin confirmación y antes de escribir el aviso (inventario, recepcion-solicitudes). |
| Deshabilitar o revocar con `ConfirmDialog`; reversible con "Deshacer". | Borrar una formación o un tema de un clic mientras revocar sesión sí confirma; dos componentes de confirmación distintos (C-02). |
| Sucio comparado contra lo guardado; "Descartar" y aviso al salir. | Una vista que rastrea cambios y su hermana que no (inventario: recepción sí, semestres no). |
| Rótulo `.fi-label` arriba del valor. | Rótulos de 11 px en cinco recetas (E-15, B-15). |
| `UFormField` con etiqueta para cada campo. | Inputs de población con placeholder como única etiqueta y el de conteo sin nada (E-22). |
| Subnavegación con rutas (`UNavigationMenu`). | Una página de 1438 líneas sin navegación por secciones que mezcla credenciales con identidad (inventario, mi-perfil). |
| Ninguna variante `dark:` en la vista. | 29 clases `dark:` muertas en el perfil (inventario; D-26). |
| Dejar el `::selection` de fi-ui. | `selection:bg-(--ui-color-primary-100)` local que cambia el color del texto seleccionado solo en esta vista (C-M3). |
| Botón de cámara con `aria-label="Cambiar foto"`. | Botón nativo de cámara sin nombre y "revocar sesión" nombrado solo por `UTooltip` (C-10). |

## Ejemplo de referencia en PSM

- `app/pages/dashboard/mi-perfil.vue`: el patrón de fila que se expande para
  editar (con `:inert` en lo que no se edita) es la base de `SettingsRow`; le
  falta `aria-expanded`. El inventario propone partirla en Perfil · Seguridad ·
  Perfil profesional · Sesiones.
- `app/pages/dashboard/gestion/recepcion-solicitudes.vue`: el rastreo de
  cambios con "Descartar"/"Guardar" es la referencia buena; el `USwitch` que
  cierra la recepción (línea ~150) es lo que se reemplaza por botón + modal.
- `app/pages/dashboard/gestion/semestres.vue`: la lista de semestres pasa a
  [`catalog-admin`](catalog-admin.md); el editor de población queda como
  parámetros en tabla con columnas etiquetadas (E-22, E-23).

## Fuentes

- Shopify App Home, *Settings* (secciones apiladas, barra de guardado, toast de éxito, modal para lo destructivo). https://shopify.dev/docs/api/app-home/latest/patterns/templates/settings
- Primer, *Saving* (explícito vs. automático, no mezclarlos, aviso al salir con cambios). https://primer.style/product/ui-patterns/saving/
- Nielsen Norman Group, *Confirmation dialogs* (confirmar con el objeto y la consecuencia; escribir para confirmar solo en lo grave). https://www.nngroup.com/articles/confirmation-dialog/
- Nuxt UI, *Switch* y *Form*. https://ui.nuxt.com/docs/components/switch
- W3C WAI-ARIA APG, *Disclosure (Show/Hide)*. https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
