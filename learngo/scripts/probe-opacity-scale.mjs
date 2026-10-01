// Which of the opacity modifiers used in the app actually resolve?
//
// A modifier like `/8` or `/15` only produces a rule if that value is in
// Tailwind's opacity scale. Anything outside it is silently dropped, so the
// element renders with no background/border at all - which is a second,
// independent reason the quiz feedback looked uncoloured.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'tw-opacity-'))
const html = join(dir, 'probe.html')
const css = join(dir, 'in.css')
const out = join(dir, 'out.css')
const config = join(dir, 'tw.config.js')

const modifiers = [4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80]

writeFileSync(
  html,
  '<div class="' +
    modifiers.map(m => `bg-emerald/${m} border-red-500/${m}`).join(' ') +
    '"></div>',
)
writeFileSync(css, '@tailwind utilities;')
writeFileSync(
  config,
  `module.exports = {
  content: ['${html.replace(/\\/g, '/')}'],
  theme: { extend: { colors: {
    emerald: { DEFAULT: 'rgb(16 185 129 / <alpha-value>)' },
  } } },
}`,
)

execFileSync(
  'npx',
  ['tailwindcss', '-c', config, '-i', css, '-o', out],
  { stdio: 'ignore', shell: true },
)

const generated = readFileSync(out, 'utf8')

for (const m of modifiers) {
  const bg = new RegExp('\\.bg-emerald\\\\/' + m + '[\\s,{:]').test(generated)
  const border = new RegExp('\\.border-red-500\\\\/' + m + '[\\s,{:]').test(generated)
  console.log(
    (bg ? '  OK   ' : '  MISS ') + '/' + String(m).padEnd(3) + '  bg=' + (bg ? 'y' : 'n') + '  border=' + (border ? 'y' : 'n'),
  )
}