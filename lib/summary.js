// JSON extraction from model output.
//
// The prompt asks for JSON, but a model can wrap it in a fence, prepend prose,
// or trailing-commas the array. Try in order: direct parse, fenced block, first
// balanced object, then a line-based salvage. The salvage path exists so a
// slightly malformed response degrades instead of blanking the panel.

/** First balanced {...}, ignoring braces inside strings so prose "}" is safe. */
function findFirstObject(text) {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function tryParse(candidate) {
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

/** Remove ```json fences and anything outside them. */
function stripFences(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return fenced ? fenced[1] : text
}

/** Last-resort: rebuild from numbered lines when the JSON itself is unusable. */
function salvage(text) {
  const points = []
  const numbered = text.matchAll(/^\s*(?:[-*•]|\d+[.)])\s*(.{10,})$/gm)
  for (const m of numbered) {
    const line = m[1].trim()
    if (line && !points.includes(line)) points.push(line)
  }

  const qMatch = text.match(/(?:^|\n)\s*(?:[-*•]|\d+[.)])?\s*(?:pertanyaan|question|kuis|quiz)\s*[:\-]\s*(.{10,})/i)

  return {
    points: points.slice(0, 3),
    question: qMatch ? qMatch[1].trim() : null,
  }
}

export function parseSummary(raw) {
  if (!raw || typeof raw !== 'string') return null

  const fromFence = tryParse(stripFences(raw).trim())
  if (fromFence) return normalise(fromFence)

  const balanced = tryParse(findFirstObject(stripFences(raw)) ?? '')
  if (balanced) return normalise(balanced)

  const salvaged = salvage(raw)
  if (salvaged.points.length) return normalise(salvaged)

  return null
}

/** Coerce model output into the UI's shape: 3 points and a nullable question. */
function normalise(obj) {
  const list = Array.isArray(obj?.points)
    ? obj.points
    : Array.isArray(obj?.keyPoints)
      ? obj.keyPoints
      : Array.isArray(obj?.poin)
        ? obj.poin
        : []

  const points = list
    .map((p) => (typeof p === 'string' ? p : p?.text ?? p?.point ?? p?.title ?? ''))
    .map((p) => String(p).replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  const q = obj?.question ?? obj?.quiz ?? obj?.pertanyaan ?? obj?.kuis ?? null
  const question = typeof q === 'string' && q.trim() ? q.trim() : null

  return { points, question }
}