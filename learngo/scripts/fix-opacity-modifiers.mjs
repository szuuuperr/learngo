// One-off: remap opacity modifiers that fall outside Tailwind's scale.
//
// Tailwind only emits `/N` utilities for N in its opacity scale, so /4, /6 and
// /8 silently produce no CSS at all - the element renders with no background or
// border. These are rounded to the nearest valid step so the intended subtlety
// survives: 4->5, 6->5, 8->10.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const REMAP = { 4: 5, 6: 5, 8: 10 }

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (/\.(jsx?|css)$/.test(entry.name)) out.push(p)
  }
  return out
}

// Only utility prefixes, so a division or a path segment cannot be touched.
const re = /\b(bg|text|border|from|via|to|ring|fill|stroke|shadow|divide|outline|placeholder|accent|caret|decoration)-([a-z]+(?:-[a-z]+)*)\/(4|6|8)\b/g

let total = 0
for (const file of walk(process.cwd())) {
  const before = readFileSync(file, 'utf8')
  if (!re.test(before)) { re.lastIndex = 0; continue }
  re.lastIndex = 0

  let n = 0
  const after = before.replace(re, (_, prefix, color, mod) => {
    n++
    return prefix + '-' + color + '/' + REMAP[mod]
  })
  if (n > 0) {
    writeFileSync(file, after)
    console.log(String(n).padStart(4) + '  ' + file.replace(process.cwd() + '\\', ''))
    total += n
  }
}

console.log('----')
console.log(total + ' opacity modifiers remapped')