import { GoogleGenerativeAI } from '@google/generative-ai'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash']

interface GenerateOptions {
  prompt?: string
  contents?: any[]
  systemInstruction?: any
  jsonMode?: boolean
  temperature?: number
}

// ── Groq fallback (free, high limits) ──
async function groqGenerate(opts: GenerateOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('No Groq key configured')

  // Convert our format to OpenAI-style messages
  const messages: any[] = []
  if (opts.systemInstruction) {
    const sysText = opts.systemInstruction.parts?.[0]?.text || ''
    if (sysText) messages.push({ role: 'system', content: sysText })
  }
  if (opts.contents) {
    for (const c of opts.contents) {
      messages.push({
        role: c.role === 'model' ? 'assistant' : 'user',
        content: c.parts?.map((p: any) => p.text).join(' ') || '',
      })
    }
  } else if (opts.prompt) {
    messages.push({ role: 'user', content: opts.prompt })
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Gemini with retry ──
async function geminiGenerate(opts: GenerateOptions): Promise<string> {
  let lastError: any = null

  for (const modelName of GEMINI_MODELS) {
    const model = genai.getGenerativeModel({ model: modelName })
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: any = {
          contents: opts.contents || [{ role: 'user', parts: [{ text: opts.prompt }] }],
        }
        if (opts.systemInstruction) config.systemInstruction = opts.systemInstruction
        const genConfig: any = {}
        if (opts.jsonMode) genConfig.responseMimeType = 'application/json'
        if (opts.temperature !== undefined) genConfig.temperature = opts.temperature
        if (Object.keys(genConfig).length) config.generationConfig = genConfig

        const result = await model.generateContent(config)
        return result.response.text()
      } catch (err: any) {
        lastError = err
        const msg = err.message || ''
        if (msg.includes('429') || msg.includes('503') || msg.includes('quota') || msg.includes('high demand')) {
          // Rate limited / quota — don't waste time retrying Gemini, bail to Groq
          throw new Error('GEMINI_EXHAUSTED')
        }
        throw err
      }
    }
  }
  throw lastError || new Error('Gemini failed')
}

// ── Main entry: try Gemini, fall back to Groq ──
export async function generateWithRetry(opts: GenerateOptions): Promise<string> {
  try {
    return await geminiGenerate(opts)
  } catch (err: any) {
    console.log('⚠️ Gemini unavailable, falling back to Groq...', err.message)
    try {
      return await groqGenerate(opts)
    } catch (groqErr: any) {
      console.error('Both Gemini and Groq failed:', groqErr.message)
      throw new Error('AI services are busy. Please try again in a minute.')
    }
  }
}