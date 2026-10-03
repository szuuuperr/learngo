// One-off: strip the invalid `-DEFAULT` suffix from Tailwind utility classes.
// `DEFAULT` is a key in tailwind.config.js, not part of a class name, so
// `bg-orange-DEFAULT/40` matches no utility and Tailwind emits no rule for it.
// The rewrite keeps the utility prefix and colour: `bg-orange-DEFAULT/40` -> `bg-orange/40`.
import { readFileSync, writeFileSync } from 'node:fs'

const files = [
  'components/AuthModals.jsx',
  'components/Header.jsx',
  'screens/AITutorScreen.jsx',
  'screens/CommunityScreen.jsx',
  'screens/LearnScreen.jsx',
  'screens/OtherScreen.jsx',
  'screens/QuestsScreen.jsx',
  'screens/QuizScreen.jsx',
]

// Scoped to utility prefixes and the custom palette only, so nothing else that
// happens to contain "DEFAULT" is touched.
const re = /\b(bg|text|border|from|via|to|ring|ring-offset|divide|placeholder|caret|accent|fill|stroke|shadow|outline|decoration)-(obsidian|orange|emerald|cyan|navy|slate)-DEFAULT(?=\/|\b)/g

let grand = 0
for (const f of files) {
  const before = readFileSync(f, 'utf8')
  const n = (before.match(re) || []).length
  if (n === 0) {
    console.log('   0  ' + f)
    continue
  }
  writeFileSync(f, before.replace(re, '$1-$2'))
  console.log(String(n).padStart(4) + '  ' + f)
  grand += n
}
console.log('----')
console.log(grand + ' class names rewritten')