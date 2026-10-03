// PDF intake helpers. Server-side only.
//
// Everything here runs in a route handler: the upload is read, checked, parsed,
// and split into batches before any text reaches Langflow. Keeping it together
// keeps the size limit and the batching policy from drifting apart.

export const MAX_PDF_BYTES = 50 * 1024 * 1024

// Comfortably inside a model context window while still covering a few pages.
export const CHARS_PER_BATCH = 6000

// Without a ceiling a large upload becomes an unbounded number of Langflow
// calls, each costing tokens. Past the cap we stop and report truncation.
export const MAX_BATCHES = 5

const PDF_MAGIC = '%PDF-'

/**
 * The browser sends `file.type`, which any client can forge, so the declared MIME
 * type is not evidence. The version marker in the first bytes is the real check.
 */
export function looksLikePdf(bytes) {
  if (!bytes || bytes.length < PDF_MAGIC.length) return false
  let header = ''
  for (let i = 0; i < PDF_MAGIC.length; i++) header += String.fromCharCode(bytes[i])
  return header === PDF_MAGIC
}

// Lecture slides put a page marker in the extracted text ("-- 12 of 27 --",
// "12 / 27", "Page 12 of 27"). On a 27-page module that is hundreds of
// characters of noise landing mid-prompt, so strip it.
// Dash run on either side is \s*-{0,2}\s* rather than a single optional dash
// because real modules also use "--5 of 9--" with no spaces.
const DASHES = String.raw`\s*-{0,2}\s*`
const PAGE_MARKER = String.raw`\d+\s*(?:of|dari|/)\s*\d+`

const MARKER_PATTERNS = [
  new RegExp(String.raw`^${DASHES}${PAGE_MARKER}${DASHES}$`, 'gim'),
  new RegExp(String.raw`^${DASHES}page\s+${PAGE_MARKER}${DASHES}$`, 'gim'),
  new RegExp(String.raw`^${DASHES}halaman\s+${PAGE_MARKER}${DASHES}$`, 'gim'),
]

export function stripPageFooters(text) {
  return MARKER_PATTERNS
    .reduce((acc, re) => acc.replace(re, ''), text)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Split parsed pages into batches, never cutting inside a page.
 *
 * Cutting on a character offset would hand the model two fragments that read
 * like nonsense, so a batch is a run of whole pages that fits under the limit and
 * the overflowing page starts the next batch. Returns the batches plus whatever
 * was left unread.
 *
 * @param {{text: string}[]} pages per-page text from pdf-parse
 */
export function buildBatches(pages, { charsPerBatch = CHARS_PER_BATCH, maxBatches = MAX_BATCHES } = {}) {
  const batches = []
  let current = []
  let currentLen = 0
  let exhausted = false

  for (const page of pages) {
    const text = stripPageFooters(page?.text ?? '')
    if (!text) continue

    if (currentLen + text.length > charsPerBatch && current.length > 0) {
      batches.push(current)
      if (batches.length >= maxBatches) {
        exhausted = true
        break
      }
      current = []
      currentLen = 0
    }

    // A single page longer than the limit gets its own batch rather than being
    // dropped; truncating would silently lose the middle of the document.
    current.push({ text, num: page?.num })
    currentLen += text.length
  }

  if (!exhausted && current.length > 0) batches.push(current)

  // Count only pages that carried text, since blank pages were never batch
  // candidates. Text-bearing pages missing from a batch are what we failed to read.
  const pagesWithText = pages.filter((p) => stripPageFooters(p?.text ?? '')).length
  const included = batches.flat().length

  return { batches, skippedPages: exhausted ? Math.max(0, pagesWithText - included) : 0 }
}

/**
 * Read a PDF into batches.
 *
 * @param {Uint8Array} bytes raw file contents
 * @returns {Promise<{pages: number, batches: Array<Array<{text:string,num?:number}>>, skippedPages: number, totalChars: number}>}
 */
export async function readPdfBatches(bytes, options = {}) {
  // Imported lazily so a bad or missing native binding only affects requests
  // that upload a PDF, not every request to the module.
  const { PDFParse } = await import('pdf-parse')

  const parser = new PDFParse({ data: bytes })
  try {
    const info = await parser.getInfo()
    const result = await parser.getText()
    const pages = result?.pages ?? []
    const { batches, skippedPages } = buildBatches(pages, options)

    return {
      pages: info?.total ?? pages.length,
      batches,
      skippedPages,
      totalChars: result?.text?.length ?? 0,
    }
  } finally {
    await parser.destroy()
  }
}