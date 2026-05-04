export async function callClaude(params: {
  systemPrompt?: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY_PIJPLIJN
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY_PIJPLIJN ontbreekt')

  const body: Record<string, unknown> = {
    model: 'claude-opus-4-7',
    max_tokens: params.maxTokens ?? 8000,
    temperature: params.temperature ?? 0.4,
    messages: [{ role: 'user', content: params.userPrompt }],
  }
  if (params.systemPrompt) body.system = params.systemPrompt

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('Geen tekst in Anthropic response')
  return text
}

export function parseClaudeJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(cleaned) as T
}
