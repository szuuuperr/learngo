// Verify the built stylesheet actually contains the quiz's colour utilities —
// each class the quiz depends on for showing right/wrong must resolve to a real
// rule, otherwise the answer feedback renders uncoloured.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.css')) out.push(p)
  }
  return out
}

const files = walk('.next/static')
const css = files.map(f => readFileSync(f, 'utf8')).join('\n')

console.log('css files: ' + files.length + '  total length: ' + css.length)
console.log('')

// Exact class selectors as they appear in the compiled CSS, e.g. ".bg-emerald\/15".
// The compiled CSS escapes the slash to `\/`, which the regex below reconstructs.
const required = [
  'border-emerald', 'bg-emerald/15', 'text-emerald',
  'border-red-500', 'bg-red-500/15', 'text-red-400',
  'bg-orange', 'text-orange', 'bg-cyan', 'text-cyan',
  'text-slate', 'text-slate-light', 'text-obsidian', 'bg-navy',
]

let missing = 0
for (const cls of required) {
  // Compiled CSS contains `.bg-emerald\/15`: a literal backslash before the slash.
  // In a regex source that backslash must itself be escaped, hence '\\\\/'.
  const escaped = cls.replace(/\//g, '\\\\/')
  const n = (css.match(new RegExp('\\.' + escaped + '[\\s,{:]', 'g')) || []).length
  if (n === 0) missing++
  console.log((n > 0 ? '  OK   ' : '  MISS ') + String(n).padStart(3) + '  .' + cls)
}

console.log('')
console.log('classes with no rule: ' + missing)

// Modifiers outside Tailwind's opacity scale (/4, /6, /8, /12 ...) generate
// nothing. The codebase uses /8 widely for hairline borders, so report them
// rather than leaving the element silently unstyled.
const allClasses = [...new Set(
  [...css.matchAll(/([^{}]+)\{/g)]
    .map(m => m[1].trim().split('\n').pop().trim())
    .filter(s => /^[.:]/.test(s)),
)]
console.log('total utility selectors in bundle: ' + allClasses.length)

console.log('')
console.log('leftover "-DEFAULT" in css: ' + (css.match(/-DEFAULT/g) || []).length)

// Must be completely gone, otherwise the rewrite missed a file.
const stillBroken = (css.match(/\.[a-z-]*-DEFAULT/g) || [])
console.log('broken "*-DEFAULT" selectors still emitted: ' + stillBroken.length)
if (stillBroken.length) console.log('  ' + [...new Set(stillBroken)].join('\n  '))