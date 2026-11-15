import { HttpError } from '../middleware/auth.js';

// Calls the Anthropic Messages API. No key => explicit 503 (never fabricated output).
export async function askAI(system, user, { maxTokens = 2500 } = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(503, 'AI is not configured. Add ANTHROPIC_API_KEY to backend/.env and restart the server.');

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-sonnet-5-5',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
  } catch {
    throw new HttpError(502, 'Could not reach the AI service. Check your internet connection.');
  }
  if (!res.ok) {
    const body = await res.text();
    console.error('AI error', res.status, body);
    throw new HttpError(502, `AI service error (${res.status}). Check your API key and model name.`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

export async function askAIJson(system, user, opts) {
  const text = await askAI(
    system + '\nRespond with a single valid JSON object only. No markdown fences, no commentary.',
    user,
    opts
  );
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new HttpError(502, 'AI returned an unreadable response. Please try again.');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new HttpError(502, 'AI returned malformed JSON. Please try again.');
  }
}

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
