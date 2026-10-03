// Prompts for the PDF summariser. Kept apart from langflow.js because these
// belong to the summary flow rather than to the tutor chat.

export const SUMMARY_BATCH_PROMPT = `You are a summariser that reads lecture notes. This is NOT a tutoring conversation: do not ask the reader anything, do not greet them, and do not reply with questions. Your only output is the JSON described below.

Reply in the SAME language as the text.

Return ONLY valid JSON, no prose and no code fence, in exactly this shape:
{"points": ["...", "...", "..."], "question": "..."}

"points" must have exactly 3 short entries, each the single most important idea in THIS section only. Be specific to the material (use its terminology), not generic advice about studying.
"question" must be ONE quiz question that tests understanding of THIS section. It must not be answerable by guessing.

This is one part of a longer module. List what matters here even if a later part builds on it.`

// The prompt has to fight for attention: the flow carries a Socratic tutor
// persona, and a merge instruction that reads like a normal request gets
// answered with a question back.
export const SUMMARY_MERGE_PROMPT = `You are a summariser that compiles notes. This is NOT a tutoring conversation: do not ask the reader anything, do not greet them, and do not reply with questions. Your only output is the JSON described below.

Consolidate the following candidate notes, taken from every section of one university lecture module, into a single overview. Reply in the SAME language as the notes.

Return ONLY valid JSON, no prose and no code fence, in exactly this shape:
{"points": ["...", "...", "..."], "question": "..."}

"points" must be exactly 3 entries: the most important ideas of the WHOLE module, merged and deduplicated. Merge overlapping ideas rather than listing near-duplicates. Prefer concrete concepts over general statements.
"question" must be ONE quiz question about a core concept of the module as a whole.`

/**
 * Pick the strongest point from each batch, then keep the top ones.
 *
 * Used when the merge call fails. Returning only the first batch's summary would
 * drop most of the document; this covers every section, and prefers longer
 * points because a longer candidate usually carries a fuller explanation.
 */
export function localMerge(batchSummaries, limit = 3) {
  const seen = new Set()
  const candidates = []

  for (const summary of batchSummaries) {
    for (const point of summary?.points ?? []) {
      const key = point.toLowerCase().replace(/[^a-z0-9]/gi, '').slice(0, 40)
      if (!key || seen.has(key)) continue
      seen.add(key)
      candidates.push(point)
    }
  }

  const points = candidates
    .slice()
    .sort((a, b) => b.length - a.length)
    .slice(0, limit)

  // Keep the original document order so the summary still reads top-to-bottom.
  points.sort((a, b) => candidates.indexOf(a) - candidates.indexOf(b))

  return { points, question: batchSummaries[0]?.question ?? null }
}

/**
 * Build the input for one batch. Page numbers help the model judge what
 * "important" means relative to its place in the module.
 */
export function buildBatchInput(prompt, batch) {
  const first = batch[0]?.num
  const last = batch[batch.length - 1]?.num
  const span = first === last ? `page ${first}` : `pages ${first}-${last}`

  const body = batch.map((p) => p.text).join('\n\n')
  return `${prompt}\n\nThis is ${span} of the module:\n\n${body}\n\nJSON:`
}

/** Merge-pass input: every batch's candidate points, not the raw text. */
export function buildMergeInput(prompt, perBatch) {
  const seen = new Map()

  perBatch.forEach((summary, i) => {
    if (!summary) return
    summary.points.forEach((p) => {
      const key = p.toLowerCase().replace(/[^a-z0-9]/gi, '').slice(0, 40)
      if (!seen.has(key)) seen.set(key, { text: p, from: [i + 1] })
      else seen.get(key).from.push(i + 1)
    })
  })

  const lines = [...seen.values()].map(
    ({ text, from }) => `- ${text} (from batch ${from.join(', ')})`,
  )

  return `${prompt}\n\nCandidate points collected across ${perBatch.length} section(s):\n\n${lines.join('\n')}\n\nJSON:`
}