// ─── AI Service — OpenAI Chat Completions ─────────────────────────────────────
// Falls back gracefully when no API key is present.

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPTS = {
  strict: `You are a Socratic AI tutor for computer science students. Your ONLY method is to respond with guiding questions — never give direct answers, code solutions, or explain step-by-step unless the student has already tried and shown their work. Probe their reasoning, expose gaps with targeted questions, and let them discover answers themselves. Keep responses concise (2-4 sentences). Always end with a question.`,

  guided: `You are a helpful AI tutor for computer science students. You use the Guided Socratic method: provide clear hints, partial explanations, and nudges in the right direction. You may give short code snippets as examples, but always accompany them with a question that asks the student to extend or apply what they just learned. Keep responses focused and encouraging. Always end with a question or a small challenge.`,
}

/**
 * Send a message to the OpenAI API.
 * @param {Array<{role: string, content: string}>} chatHistory — recent messages (last 10)
 * @param {'strict'|'guided'} mode — Socratic mode
 * @param {string} apiKey — VITE_OPENAI_API_KEY value
 * @returns {Promise<string>} — assistant reply text
 */
export async function sendSocraticMessage(chatHistory, mode, apiKey) {
  const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.guided

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-10), // send last 10 messages for context
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI API error ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}
