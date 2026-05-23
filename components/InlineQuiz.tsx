'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, RotateCcw, Brain } from 'lucide-react'
import { showXP } from '@/components/XPToast'

interface MCQ {
  id: number
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export default function InlineQuiz({ subtopicId }: { subtopicId: string }) {
  const [mcqs, setMcqs] = useState<MCQ[]>([])
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const loadQuiz = async () => {
    setLoading(true)
    setStarted(true)
    setError('')
    try {
      const res = await fetch('/api/mcq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setMcqs((data.mcqs || []).slice(0, 3)) // just 3 for inline practice
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const current = mcqs[idx]

  const choose = async (optIdx: number) => {
    if (answered) return
    setSelected(optIdx)
    setAnswered(true)
    const correct = optIdx === current.correct_index
    if (correct) setScore((s) => s + 1)

    const res = await fetch('/api/mcq/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcqId: current.id, correct }),
    })
    const data = await res.json()
    if (data.xp_earned) showXP({ xp_earned: data.xp_earned })
  }

  const next = () => {
    if (idx + 1 >= mcqs.length) setDone(true)
    else { setIdx(idx + 1); setSelected(null); setAnswered(false) }
  }

  const restart = () => {
    setIdx(0); setSelected(null); setAnswered(false); setScore(0); setDone(false)
  }

  // Initial "start practice" prompt
  if (!started) {
    return (
      <button
        onClick={loadQuiz}
        className="w-full glass glass-hover p-4 flex items-center justify-center gap-2 text-sm font-medium transition"
      >
        <Brain className="w-4 h-4 text-cyan-400" />
        Test yourself — 3 quick questions
      </button>
    )
  }

  if (loading) {
    return (
      <div className="glass p-6 flex items-center justify-center text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Building your quiz...
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass p-4 text-sm text-gray-400">
        Couldn&apos;t load quiz. <button onClick={loadQuiz} className="text-cyan-400 underline">Retry</button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="glass p-5 text-center">
        <p className="text-2xl font-bold mb-1">{score}/{mcqs.length}</p>
        <p className="text-sm text-gray-400 mb-4">
          {score === mcqs.length ? 'Perfect! You\'ve got this 🎯' : score >= 2 ? 'Nice work! 💪' : 'Review the lesson and try again 📚'}
        </p>
        <button onClick={restart} className="glass glass-hover px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="glass p-4 sm:p-5">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {mcqs.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? 'bg-cyan-500' : i === idx ? 'bg-cyan-500/50' : 'bg-white/10'}`} />
        ))}
      </div>

      <p className="text-sm sm:text-base font-medium mb-4">{current.question}</p>
      <div className="space-y-2">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correct_index
          const isSelected = i === selected
          let cls = 'bg-white/5 border-white/10 hover:bg-white/10'
          if (answered) {
            if (isCorrect) cls = 'bg-green-500/15 border-green-400/40'
            else if (isSelected) cls = 'bg-red-500/15 border-red-400/40'
            else cls = 'bg-white/5 border-white/10 opacity-50'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              className={`w-full text-left p-3 rounded-xl border text-sm transition flex items-center justify-between gap-2 ${cls}`}
            >
              <span>{opt}</span>
              {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
              {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </button>
          )
        })}
      </div>

      {answered && (
        <>
          <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
            <p className="text-xs sm:text-sm text-gray-300">
              <span className="text-cyan-400 font-medium">Why: </span>{current.explanation}
            </p>
          </div>
          <button
            onClick={next}
            className="w-full mt-3 bg-linear-to-r from-cyan-500 to-violet-500 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition"
          >
            {idx + 1 >= mcqs.length ? 'See result' : 'Next question →'}
          </button>
        </>
      )}
    </div>
  )
}