import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callLangflow } from '@/lib/langflow'
import { parseSummary } from '@/lib/summary'
import { SUMMARY_BATCH_PROMPT, SUMMARY_MERGE_PROMPT, buildBatchInput, buildMergeInput, localMerge } from '@/lib/summaryPrompt'
import { looksLikePdf, readPdfBatches, MAX_PDF_BYTES } from '@/lib/pdf'

// PDF upload -> AI summary.
//
// Two stages. A module can be longer than one request's worth of text, so it is
// split into batches that each get summarised independently, then one merge call
// reduces all of them to the 3 points and 1 quiz the brief asks for. Collapsing
// in a second pass is what keeps the output at exactly 3 points; simply
// concatenating the batches would return 3 per batch.

export const runtime = 'nodejs'
// Parsing and summarising a large module is slower than a normal API call.
export const maxDuration = 120

export async function POST(request) {
  // ── Require a session ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to upload lecture notes.' },
      { status: 401 },
    )
  }

  // ── Read the upload ────────────────────────────────────────────────────────
  let file
  try {
    const form = await request.formData()
    file = form.get('file')
  } catch {
    return NextResponse.json({ error: 'Expected a multipart upload.' }, { status: 400 })
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }

  const name = file.name || 'lecture-notes.pdf'

  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 })
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: `File too large. The limit is ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} MB.` },
      { status: 413 },
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  // The browser-declared MIME type is client-controlled, so the file signature
  // is what actually decides.
  if (!looksLikePdf(bytes)) {
    return NextResponse.json({ error: 'That file is not a PDF.' }, { status: 415 })
  }

  // ── Parse into batches ─────────────────────────────────────────────────────
  let parsed
  try {
    parsed = await readPdfBatches(bytes)
  } catch (err) {
    console.error('[api/summarize] parse failed:', err.message)
    return NextResponse.json(
      { error: 'Could not read that PDF. It may be encrypted or damaged.', detail: err.message },
      { status: 422 },
    )
  }

  if (!parsed.batches.length) {
    return NextResponse.json(
      { error: 'No readable text found. Scanned images need OCR, which is not supported.' },
      { status: 422 },
    )
  }

  // Each call gets a throwaway session id. The flow carries a Socratic tutor
  // persona, and measured against the same document the batch summaries are
  // not reliably JSON - reusing ids made an occasional batch come back as a
  // question instead. A fresh id per call avoids any memory the flow may hold.
  const runId = crypto.randomUUID()
  const sessionFor = (label) => `pdf-${runId}-${label}`

  // ── Stage 1: one summary call per batch, in parallel ───────────────────────
  // Parallel rather than sequential: five batches at once is five times less
  // waiting for the user, and Langflow handles concurrent requests.
  let perBatch
  try {
    perBatch = await Promise.all(
      parsed.batches.map((batch, i) =>
        callLangflow({
          message: buildBatchInput(SUMMARY_BATCH_PROMPT, batch),
          mode: 'guided',
          sessionId: sessionFor(`b${i}`),
        }).catch((err) => {
          console.error(`[api/summarize] batch ${i + 1} failed:`, err.message)
          return null
        }),
      ),
    )
  } catch (err) {
    console.error('[api/summarize] batch stage failed:', err.message)
    return NextResponse.json(
      { error: 'The AI summariser is unreachable right now.', detail: err.message },
      { status: 502 },
    )
  }

  const batchSummaries = perBatch.map((raw) => (raw ? parseSummary(raw) : null)).filter(Boolean)

  if (!batchSummaries.length) {
    return NextResponse.json(
      { error: 'The AI summariser did not return a usable summary. Please try again.' },
      { status: 502 },
    )
  }

  // A batch that answered in the wrong voice is dropped rather than fatal, so
  // one flaky call costs one section instead of the whole summary.
  const failedBatches = parsed.batches.length - batchSummaries.length

  // ── Stage 2: merge to exactly 3 points and 1 question ──────────────────────
  let final = null
  let merged = false

  if (batchSummaries.length > 1) {
    try {
      const raw = await callLangflow({
        message: buildMergeInput(SUMMARY_MERGE_PROMPT, batchSummaries),
        mode: 'guided',
        sessionId: sessionFor('merge'),
      })
      const attempt = parseSummary(raw)
      if (attempt?.points?.length) {
        final = attempt
        merged = true
      }
    } catch (err) {
      console.error('[api/summarize] merge failed:', err.message)
    }
  }

  // Without a merge pass, combine what we do have locally. Falling back to
  // batchSummaries[0] alone would silently drop the rest of the document.
  if (!final) {
    final = batchSummaries.length > 1
      ? localMerge(batchSummaries)
      : batchSummaries[0]
  }

  if (!final?.points?.length) {
    return NextResponse.json(
      { error: 'Could not build a summary from that document.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    points: final.points,
    question: final.question ?? null,
    // Surfaced so the UI can say "summary covers 10 of 27 pages" instead of
    // quietly pretending it read everything.
    partial: failedBatches > 0 || !merged && batchSummaries.length > 1,
    skippedPages: parsed.skippedPages,
    failedBatches,
    pages: parsed.pages,
    batches: parsed.batches.length,
    filename: name,
  })
}