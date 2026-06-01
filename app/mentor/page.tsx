'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MENTORS, MentorId } from '@/lib/ai/personalities'
import {
  Send, Loader2, ArrowLeft, BookOpen, ChevronDown,
  Trash2, Volume2, VolumeX, Mic, Square
} from 'lucide-react'
import { showXP } from '@/components/XPToast'
import MentorAvatar from '@/components/MentorAvatar'
import { speak, stopSpeaking, pickVoice, isSpeechSupported, getVoices } from '@/lib/voice/speech'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ source: string; similarity: number; preview: string }>
}

const VOICE: Record<string, { color: string; rate: number; pitch: number }> = {
  friendly_teacher: { color: '#22d3ee', rate: 0.95, pitch: 1.0 },
  faang_interviewer: { color: '#f472b6', rate: 1.0, pitch: 0.95 },
  strict_professor: { color: '#a78bfa', rate: 0.9, pitch: 0.95 },
  startup_mentor: { color: '#fb923c', rate: 1.05, pitch: 1.0 },
  ml_researcher: { color: '#34d399', rate: 0.95, pitch: 1.0 },
  motivational_coach: { color: '#facc15', rate: 1.05, pitch: 1.05 },
}

export default function MentorPage() {
  const [mentorId, setMentorId] = useState<MentorId>('friendly_teacher')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [voiceOn, setVoiceOn] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const mentor = MENTORS[mentorId]
  const voiceCfg = VOICE[mentorId]

  // ── Load chat history ──
  useEffect(() => {
    fetch('/api/chat/history')
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) setMessages(d.messages)
        setHistoryLoading(false)
      })
      .catch(() => setHistoryLoading(false))
  }, [])

  // ── Load voices (async in Chrome — poll until ready) ──
  useEffect(() => {
    if (!isSpeechSupported()) return

    getVoices()
    window.speechSynthesis.onvoiceschanged = () => getVoices()

    const poll = setInterval(() => {
      const v = getVoices()
      if (v.length) clearInterval(poll)
    }, 100)

    const timeout = setTimeout(() => clearInterval(poll), 3000)

    return () => {
      clearInterval(poll)
      clearTimeout(timeout)
      stopSpeaking()
    }
  }, [])

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // ── Auto-grow textarea ──
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // ── Speak reply — retries until voices are loaded ──
  const speakReply = (text: string) => {
    if (!voiceOn) return

    const attempt = (retriesLeft: number) => {
      const voice = pickVoice()
      if (!voice && retriesLeft > 0) {
        setTimeout(() => attempt(retriesLeft - 1), 150)
        return
      }
      speak(
        text,
        { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) },
        { voice, rate: voiceCfg.rate, pitch: voiceCfg.pitch }
      )
    }

    attempt(6) // up to ~900ms wait
  }

  // ── Send message ──
  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return

    stopSpeaking()
    setSpeaking(false)

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setPickerOpen(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mentorId, history: messages.slice(-6) }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error}` }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.reply, sources: data.sources }])
        speakReply(data.reply)

        fetch('/api/xp/award', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'mentor_chat' }),
        }).then((r) => r.json()).then((xp) => xp.xp_earned && showXP(xp))

        fetch('/api/missions/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionType: 'chat_with_mentor' }),
        })
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle TTS voice on/off ──
  const toggleVoice = () => {
    if (voiceOn) { stopSpeaking(); setSpeaking(false) }
    setVoiceOn(!voiceOn)
  }

  // ── Start speech recognition ──
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome on desktop or Android.")
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setListening(false)
      send(text)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  // ── Clear history ──
  const clearHistory = async () => {
    stopSpeaking()       // ← stop voice mid-speech immediately
    setSpeaking(false)
    await fetch('/api/chat/history', { method: 'DELETE' })
    setMessages([])
    setShowClearConfirm(false)
  }

  return (
    <main className="flex flex-col h-dvh max-w-4xl mx-auto">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3">

          {/* Back */}
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-full hover:bg-white/5 transition text-gray-400 hover:text-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* ── Mentor pill — opens picker ── */}
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <div className="relative">
              <MentorAvatar speaking={speaking} color={voiceCfg.color} size={28} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[rgb(8,8,20)]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">{mentor.name}</p>
              <p className="text-[10px] text-gray-400 leading-tight">
                {speaking ? 'Speaking...' : listening ? 'Listening...' : 'Online'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full transition ${voiceOn
                ? 'text-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              aria-label="Toggle voice"
              title={voiceOn ? 'Voice on' : 'Voice off'}
            >
              {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-white/5 transition"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Mentor picker dropdown ── */}
        {pickerOpen && (
          <div className="border-t border-white/5 px-3 sm:px-5 py-3 bg-black/30">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Switch mentor</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(MENTORS).map((m) => {
                const isActive = m.id === mentorId
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (!isActive) {
                        setMentorId(m.id as MentorId)
                        stopSpeaking()
                        setSpeaking(false)
                      }
                      setPickerOpen(false)
                    }}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition ${isActive
                      ? 'bg-linear-to-br from-cyan-500/20 to-violet-500/20 border-cyan-400/40'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                  >
                    <span className="text-lg leading-none mt-0.5">{m.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{m.tagline}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── MESSAGES ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-5 space-y-4 min-h-0"
      >
        {historyLoading ? (
          <div className="flex items-center justify-center mt-12 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="mb-5">
              <MentorAvatar speaking={speaking} color={voiceCfg.color} size={80} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">Hi, I&apos;m {mentor.name}</h2>
            <p className="text-sm text-gray-400 max-w-sm mb-6">{mentor.tagline}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {[
                'Explain gradient descent simply',
                'What is overfitting?',
                'Compare bagging vs boosting',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 text-xs rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%] sm:max-w-[78%]">
              <div
                className={`px-4 py-2.5 rounded-2xl overflow-hidden ${m.role === 'user'
                  ? 'bg-linear-to-br from-cyan-500/25 to-violet-500/25 border border-cyan-400/30 rounded-br-md'
                  : 'bg-white/[0.04] border border-white/10 rounded-bl-md'
                  }`}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 px-1">
                  {m.sources.map((s: any, j: number) => (
                    <span
                      key={j}
                      title={s.preview}
                      className="text-[10px] bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-help"
                    >
                      <BookOpen className="w-2.5 h-2.5" /> {s.source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">{mentor.name} is thinking</span>
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <div className="px-3 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="flex items-end gap-2">

          {/* Mic */}
          <button
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition ${listening
              ? 'bg-red-500/20 text-red-300'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            aria-label="Voice input"
          >
            {listening ? (
              <div className="relative">
                <Square className="w-4 h-4" />
                <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
              </div>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={
              listening ? 'Listening...' : loading ? 'Thinking...' : `Message ${mentor.name}...`
            }
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm leading-6 py-2 px-2 focus:outline-none placeholder:text-gray-500 max-h-40 border-b border-transparent focus:border-cyan-400/40 transition"
          />

          {/* Send / loading */}
          {input.trim() && !loading ? (
            <button
              onClick={() => send()}
              className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-violet-500 flex items-center justify-center hover:opacity-90 transition shadow-lg shadow-cyan-500/30"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : loading ? (
            <div className="shrink-0 w-10 h-10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Confirm clear dialog ── */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Clear chat history?"
        message="This will permanently delete all your messages with this mentor. This cannot be undone."
        confirmText="Clear chat"
        cancelText="Keep it"
        danger
        onConfirm={clearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />
    </main>
  )
}