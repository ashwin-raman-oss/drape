import { supabase } from './supabase.js'

export async function classifyOccasion(description) {
  try {
    const response = await callClaude({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Classify this event description as 'indoor', 'outdoor', or 'ambiguous'. Reply with exactly one word. Description: ${description}`,
      }],
    })
    const text = (response?.content?.[0]?.text ?? '').trim().toLowerCase()
    if (text === 'indoor' || text === 'outdoor' || text === 'ambiguous') return text
    return 'ambiguous'
  } catch {
    return 'ambiguous'
  }
}

export async function callClaude(body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? err?.error ?? `Claude API error: ${res.status}`)
  }
  return res.json()
}

// Extracts and parses the JSON from a Claude response, handling markdown fences.
// Claude sometimes wraps JSON in ```json ... ``` despite "Return ONLY" instructions.
export function extractJSON(claudeResponse) {
  const raw = claudeResponse?.content?.[0]?.text ?? ''
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(cleaned)
}
