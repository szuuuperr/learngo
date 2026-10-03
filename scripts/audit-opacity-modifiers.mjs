// List the opacity modifiers the app actually ships, and flag any class in the
// source that asks for a modifier outside Tailwind's scale (those emit nothing).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (/\.(jsx?|css)$/.test(entry.name)) out.push(p)
  }
  return out
}

// Tailwind's default opacity scale.
const SCALE = new Set([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100])

const sources = walk(ROOT)
const used = new Map()
const bad = new Map()

for (const file of sources) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/\b((?:bg|text|border|from|via|to|ring|fill|stroke|shadow|divide|outline|placeholder|accent|caret|decoration)-[a-z]+(?:-[a-z]+)*)\/(\d{1,3})\b/g)) {
    const cls = m[1] + '/' + m[2]
    used.set(cls, (used.get(cls) || 0) + 1)
    const v = Number(m[2])
    if (!SCALE.has(v)) {
      if (!bad.has(v)) bad.set(v, new Set())
      bad.get(v).add(cls)
    }
  }
}

console.log('distinct opacity-qualified classes in source: ' + used.size)
console.log('')
console.log('modifiers OUTSIDE Tailwind\'s scale (generate no CSS):')
if (bad.size === 0) {
  console.log('  none')
} else {
  for (const [v, examples] of [...bad].sort((a, b) => a[0] - b[0])) {
    console.log('  /' + String(v).padEnd(3) + ' used ' + [...examples].slice(0, 3).join(', '))
  }
}