// Browser text-to-speech using the free, built-in Web Speech API.

let cachedVoices: SpeechSynthesisVoice[] = []

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return []
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

// Ranked list of the best natural voices across platforms.
// First match wins.
const PREMIUM_VOICES = [
  // Microsoft Edge — neural voices, very natural
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Guy Online (Natural) - English (United States)',
  'Microsoft Sonia Online (Natural) - English (United Kingdom)',
  'Microsoft Ryan Online (Natural) - English (United Kingdom)',
  'Microsoft Libby Online (Natural) - English (United Kingdom)',
  'Microsoft Natasha Online (Natural) - English (Australia)',

  // Google Chrome
  'Google US English',
  'Google UK English Female',
  'Google UK English Male',

  // Apple (Safari / iOS / macOS)
  'Samantha',
  'Karen',
  'Daniel',
  'Moira',
  'Tessa',

  // Windows fallbacks
  'Microsoft Zira - English (United States)',
  'Microsoft David - English (United States)',
]

export function pickVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length ? cachedVoices : getVoices()
  if (!voices.length) return null

  // Pass 1: exact premium name match
  for (const wanted of PREMIUM_VOICES) {
    const found = voices.find((v) => v.name === wanted)
    if (found) return found
  }

  // Pass 2: any voice with "Natural" in the name
  const natural = voices.find((v) => /Natural/i.test(v.name) && v.lang.startsWith('en'))
  if (natural) return natural

  // Pass 3: non-local (cloud) English voice
  const cloudEn = voices.find((v) => v.lang.startsWith('en') && !v.localService)
  if (cloudEn) return cloudEn

  // Pass 4: any English voice except the basic desktop fallbacks
  const goodEn = voices.find(
    (v) => v.lang.startsWith('en') && !/Microsoft (Mark|Hazel|Zira) Desktop/i.test(v.name)
  )
  if (goodEn) return goodEn

  // Last resort
  return voices.find((v) => v.lang.startsWith('en')) || voices[0]
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}

// Strip markdown so the voice doesn't read symbols out loud
function cleanText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface SpeakOpts {
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  volume?: number
}

interface SpeakCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onBoundary?: () => void
}

export function speak(text: string, callbacks?: SpeakCallbacks, opts?: SpeakOpts) {
  if (!isSpeechSupported()) return
  stopSpeaking()

  const clean = cleanText(text)

  // Split into chunks of ~200 chars at sentence boundaries
  // Sounds more natural and avoids Chrome's cutoff bug on long utterances
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean]
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + s).length > 200) {
      if (current) chunks.push(current.trim())
      current = s
    } else {
      current += s
    }
  }
  if (current) chunks.push(current.trim())

  let chunkIndex = 0
  callbacks?.onStart?.()

  const speakChunk = () => {
    if (chunkIndex >= chunks.length) {
      callbacks?.onEnd?.()
      return
    }

    const u = new SpeechSynthesisUtterance(chunks[chunkIndex])
    if (opts?.voice) u.voice = opts.voice
    u.rate = opts?.rate ?? 1.0
    u.pitch = opts?.pitch ?? 1.0
    u.volume = opts?.volume ?? 1.0

    u.onboundary = () => callbacks?.onBoundary?.()
    u.onend = () => { chunkIndex++; speakChunk() }
    u.onerror = () => callbacks?.onEnd?.()

    window.speechSynthesis.speak(u)
  }

  speakChunk()
}