// Langflow client. Server-side only - never import this from a 'use client'
// file, or LANGFLOW_API_KEY ships to the browser.
//
// The system prompt is set here as well as in the Langflow flow config. That
// duplication is deliberate: the prompt in the dashboard is what shapes the
// demo, and this copy is the fallback that still holds if the flow is
// reconfigured or points at the wrong flow.

export const SYSTEM_PROMPTS = {
  strict: `You are Bob, a Socratic AI tutor for computer science students studying in Indonesia. Your ONLY method is to respond with guiding questions — never give direct answers, complete code solutions, or step-by-step explanations unless the student has already tried and shown their work. Probe their reasoning and expose gaps with targeted questions so they discover the answer themselves. Keep responses to 2-4 sentences. Always end with a question.

Rules:
- Never write a full working solution, even if the student asks directly.
- If asked for code, give at most a short fragment or a hint about which construct to reach for, then ask a question.
- Reply in the language the student uses. If they write in Indonesian, reply in Indonesian.
- Use **bold** sparingly for the key term you want them to think about.`,

  guided: `You are Bob, an AI tutor for computer science students studying in Indonesia. You use the Guided Socratic method: provide clear hints, partial explanations, and nudges in the right direction. You may give short code snippets as examples, but always follow them with a question asking the student to extend or apply what they just learned. Keep responses focused and encouraging. Always end with a question or a small challenge.

Rules:
- Never paste a complete solution to the exact problem the student is on. Hints and partial examples only.
- Reply in the language the student uses. If they write in Indonesian, reply in Indonesian.
- Use **bold** sparingly for the key term you want them to notice.`,
}

export function getSystemPrompt(mode) {
  return SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.guided
}

// Langflow's response shape is deeply nested and has shifted between versions:
//   outputs[0].outputs[0].results.message.text   (chat component)
//   outputs[0].outputs[0].artifacts.message     (older builds)
//   outputs[0].outputs[0].results.message       (text component)
// Walking the object and returning the first non-empty string is more durable
// than hardcoding one path.
export function extractLangflowText(payload) {
  const first = payload?.outputs?.[0]
  if (!first) return ''

  const candidates = [
    first.outputs?.[0]?.results?.message?.text,
    first.outputs?.[0]?.artifacts?.message,
    first.outputs?.[0]?.results?.message,
    first.outputs?.[0]?.results?.text,
    first.outputs?.[0]?.outputs?.message,
    first.artifacts?.message,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }

  // Last resort: stringify and look for a text field anywhere in the subtree.
  const found = findFirstText(first, 0)
  return found ?? ''
}

function findFirstText(node, depth) {
  if (depth > 6 || node == null || typeof node !== 'object') return null
  if (typeof node.text === 'string' && node.text.trim()) return node.text.trim()
  if (typeof node.result === 'string' && node.result.trim()) return node.result.trim()
  for (const value of Object.values(node)) {
    const hit = findFirstText(value, depth + 1)
    if (hit) return hit
  }
  return null
}

/**
 * Call the Langflow flow.
 * @returns {Promise<string>} assistant reply text
 */
export async function callLangflow({ message, mode, sessionId }) {
  const base = process.env.LANGFLOW_URL?.replace(/\/+$/, '')
  const flowId = process.env.LANGFLOW_FLOW_ID
  const apiKey = process.env.LANGFLOW_API_KEY

  if (!base || !flowId || !apiKey) {
    throw new Error('Langflow is not configured. Set LANGFLOW_URL, LANGFLOW_FLOW_ID and LANGFLOW_API_KEY in .env.')
  }

  const inputType = process.env.LANGFLOW_INPUT_TYPE || 'chat'
  const outputType = process.env.LANGFLOW_OUTPUT_TYPE || 'chat'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)

  try {
    const res = await fetch(`${base}/api/v1/run/${flowId}?stream=false`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        input_value: message,
        input_type: inputType,
        output_type: outputType,
        // Langflow uses this to scope conversation memory server-side, so the
        // flow can hold context without us resending the whole transcript.
        session_id: sessionId,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Langflow ${res.status}: ${detail.slice(0, 200) || res.statusText}`)
    }

    const payload = await res.json()
    const text = extractLangflowText(payload)
    if (!text) throw new Error('Langflow returned an empty response')
    return text
  } finally {
    clearTimeout(timeout)
  }
}