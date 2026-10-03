// Dump every selector in the built stylesheet that mentions a palette colour,
// so the compiled output can be read directly instead of guessed at.
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

const css = walk('.next/static').map(f => readFileSync(f, 'utf8')).join('\n')

const wanted = process.argv.slice(2)
const filter = wanted.length ? new RegExp(wanted.join('|')) : /emerald|red-500/

const selectors = [...css.matchAll(/([^{}]+)\{/g)]
  .map(m => m[1].trim().split('\n').pop().trim())
  .filter(s => filter.test(s))

console.log('matching selectors: ' + selectors.length)
for (const s of selectors) console.log('  ' + s)