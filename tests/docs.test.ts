import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * La documentación viaja con el paquete (README, AGENTS.md y la skill en
 * skills/fi-ui) y la leen agentes que la toman al pie de la letra: un enlace
 * roto o una prop que no existe se convierten en código que no compila en el
 * proyecto. Estas pruebas atan la documentación al código.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SKILL = join(ROOT, 'skills/fi-ui')
const COMPONENTS = join(ROOT, 'src/components')

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return markdownFiles(path)
    return name.endsWith('.md') ? [path] : []
  })
}

const docs = [join(ROOT, 'README.md'), join(ROOT, 'AGENTS.md'), ...markdownFiles(SKILL)]
const read = (file: string) => readFileSync(file, 'utf8')
const rel = (file: string) => relative(ROOT, file)

/** Sin bloques ni fragmentos de código: un `[x](y)` dentro de un snippet no es un enlace. */
function prose(src: string): string {
  return src
    .replace(/^```[\s\S]*?^```/gm, block => block.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]*`/g, span => ' '.repeat(span.length))
}

/** Anclas de los encabezados, con el algoritmo de GitHub (minúsculas, sin puntuación, espacios → guiones). */
function anchors(file: string): Set<string> {
  const seen = new Map<string, number>()
  const out = new Set<string>()
  for (const [, heading] of read(file).replace(/^```[\s\S]*?^```/gm, '').matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const text = heading!.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '')
    const slug = text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replace(/ /g, '-')
    const n = seen.get(slug) ?? 0
    seen.set(slug, n + 1)
    out.add(n ? `${slug}-${n}` : slug)
  }
  return out
}

describe('enlaces de la documentación', () => {
  it.each(docs.map(rel))('%s: todo enlace relativo apunta a un archivo y ancla que existen', (file) => {
    const path = join(ROOT, file)
    const broken: string[] = []
    for (const [, target] of prose(read(path)).matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      if (/^(?:https?:|mailto:|tel:)/.test(target!)) continue
      const [file_, anchor] = target!.split('#')
      const dest = file_ ? resolve(dirname(path), decodeURI(file_)) : path
      if (!existsSync(dest)) broken.push(`${target} (no existe)`)
      else if (anchor !== undefined && dest.endsWith('.md') && !anchors(dest).has(decodeURIComponent(anchor))) {
        broken.push(`${target} (ancla)`)
      }
    }
    expect(broken).toEqual([])
  })

  it('SKILL.md enlaza todas sus referencias y arquetipos', () => {
    const index = read(join(SKILL, 'SKILL.md'))
    const missing = markdownFiles(join(SKILL, 'references'))
      .map(file => relative(SKILL, file))
      .filter(file => !index.includes(`](${file})`))
    expect(missing).toEqual([])
  })
})

/** Props y slots declarados en cada SFC (defineProps<{…}>, defineModel, <slot name>). */
const api = Object.fromEntries(readdirSync(COMPONENTS).map((file) => {
  const src = read(join(COMPONENTS, file))
  const block = /defineProps<\{([\s\S]*?)\n?\}>\(\)/.exec(src)?.[1] ?? ''
  const props = new Set([...block.replace(/\/\*\*[\s\S]*?\*\//g, '').matchAll(/^\s*(\w+)\??:/gm)].map(m => m[1]!))
  for (const [, model] of src.matchAll(/defineModel<[^>]*>\('(\w+)'/g)) props.add(model!)
  const slots = new Set([...src.matchAll(/<slot(?:\s[^>]*?)?(?:\sname="([\w-]+)")?[\s/>]/g)].map(m => m[1] ?? 'default'))
  return [file.replace(/\.vue$/, ''), { props, slots }]
}))

const camel = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
const PASSTHROUGH = /^(?:class|style|id|key|ref|role|tabindex|title|aria-[\w-]+|data-[\w-]+|v-[\w-]+)$/

describe('los snippets usan la API real de los Fi*', () => {
  it.each(docs.map(rel))('%s: solo props que existen', (file) => {
    const wrong: string[] = []
    for (const [, name, attrs] of read(join(ROOT, file)).matchAll(/<(Fi[A-Z]\w*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
      const component = api[name!]
      if (!component) continue // FiStatItem y otros tipos en genéricos de TypeScript
      const bare = attrs!.replace(/"[^"]*"|'[^']*'/g, '""')
      for (const [, prefix, attr] of bare.matchAll(/(?:^|\s)(v-model:|v-bind:|[:@#]?)([\w-]+)(?:\.[\w.]+)?(?==|\s|\/|$)/g)) {
        if (prefix === '#' || PASSTHROUGH.test(attr!) || (prefix === 'v-bind:' && !attr)) continue
        if (prefix === '@') { wrong.push(`${name} @${attr} (no emite eventos)`); continue }
        if (title(name!, attr!)) continue
        if (!component.props.has(camel(attr!))) wrong.push(`${name} ${attr}`)
      }
    }
    expect(wrong).toEqual([])
  })
})

// `title` es prop en varios Fi* y atributo nativo en el resto: solo cuenta si es prop.
function title(component: string, attr: string): boolean {
  return attr === 'title' && !api[component]!.props.has('title')
}

describe('el README documenta todos los componentes', () => {
  const readme = read(join(ROOT, 'README.md'))
  const components = read(join(SKILL, 'references/components.md'))

  it.each(Object.keys(api))('%s tiene su sección en el README y en components.md', (name) => {
    expect(readme).toMatch(new RegExp(`^#{3,4} (?:Fi\\w+ y )?${name}\\b`, 'm'))
    expect(components).toMatch(new RegExp(`^#{3} (?:${name}\\b|Fi\\w+ y ${name}\\b)`, 'm'))
  })

  it.each(Object.entries(api).flatMap(([name, { props }]) => [...props].map(prop => [name, prop])))(
    '%s: la prop %s aparece en el README',
    (name, prop) => {
      const section = readme.slice(readme.search(new RegExp(`^#{3,4} (?:Fi\\w+ y )?${name}\\b`, 'm')))
      const firstLine = section.indexOf('\n') + 1
      const end = section.slice(firstLine).search(/^#{2,4} /m)
      const body = end < 0 ? section : section.slice(0, firstLine + end)
      const shown = prop === 'open' ? 'v-model:open' : prop
      expect(body, `${name}.${prop}`).toContain(`\`${shown}\``)
    },
  )
})
