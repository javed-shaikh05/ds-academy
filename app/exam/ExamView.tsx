'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, Trophy,
    ChevronLeft, ChevronRight, Flag, History, GraduationCap
} from 'lucide-react'
import { showXP } from '@/components/XPToast'

const EXAM_MINUTES = 12

export default function ExamView() {
    const [stage, setStage] = useState<'intro' | 'exam' | 'result'>('intro')
    const [questions, setQuestions] = useState<any[]>([])
    const [examId, setExamId] = useState<string | null>(null)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [current, setCurrent] = useState(0)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [timeLeft, setTimeLeft] = useState(EXAM_MINUTES * 60)
    const startTimeRef = useRef<number>(0)
    const timerRef = useRef<any>(null)

    useEffect(() => {
        fetch('/api/exam').then((r) => r.json()).then((d) => setHistory(d.history || []))
    }, [])

    // Timer
    useEffect(() => {
        if (stage !== 'exam') return
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current)
                    submitExam() // auto-submit when time's up
                    return 0
                }
                return t - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [stage])

    const startExam = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', count: 10 }),
            })
            const data = await res.json()
            if (data.error) { alert(data.error); return }
            setQuestions(data.questions)
            setExamId(data.examId)
            setAnswers(new Array(data.questions.length).fill(null))
            setTimeLeft(EXAM_MINUTES * 60)
            startTimeRef.current = Date.now()
            setStage('exam')
        } finally {
            setLoading(false)
        }
    }

    const choose = (optionIndex: number) => {
        setAnswers((a) => {
            const copy = [...a]
            copy[current] = optionIndex
            return copy
        })
    }

    const submitExam = async () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setLoading(true)
        try {
            const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
            const res = await fetch('/api/exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'submit', examId, answers, durationSeconds }),
            })
            const data = await res.json()
            if (data.error) { alert(data.error); return }
            setResult(data)
            setStage('result')
            showXP({ xp_earned: 80 })
            fetch('/api/exam').then((r) => r.json()).then((d) => setHistory(d.history || []))
        } finally {
            setLoading(false)
        }
    }

    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const answeredCount = answers.filter((a) => a !== null).length

    // ── INTRO ──
    if (stage === 'intro') {
        return (
            <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
                <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-6">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>

                <div className="glass p-6 sm:p-8 text-center bg-linear-to-br from-violet-500/10 to-cyan-500/10 mb-6">
                    <GraduationCap className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">Exam Mode</h1>
                    <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                        A timed test across topics you&apos;ve studied. No hints during the exam — you&apos;ll see your score and explanations at the end.
                    </p>

                    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6 text-center">
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-lg font-bold">10</p>
                            <p className="text-[11px] text-gray-400">Questions</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-lg font-bold">{EXAM_MINUTES} min</p>
                            <p className="text-[11px] text-gray-400">Time limit</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-lg font-bold">60%</p>
                            <p className="text-[11px] text-gray-400">To pass</p>
                        </div>
                    </div>

                    <button
                        onClick={startExam}
                        disabled={loading}
                        className="bg-linear-to-r from-violet-500 to-cyan-500 px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                        {loading ? 'Preparing exam...' : 'Start Exam'}
                    </button>
                </div>

                {history.length > 0 && (
                    <div className="glass p-4 sm:p-5">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-400">
                            <History className="w-4 h-4" /> Past exams
                        </h3>
                        <div className="space-y-2">
                            {history.map((h) => {
                                const pct = Math.round((h.score / h.total) * 100)
                                return (
                                    <div key={h.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                                        <span className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString()}</span>
                                        <span className={`font-semibold ${pct >= 60 ? 'text-green-400' : 'text-orange-400'}`}>
                                            {h.score}/{h.total} ({pct}%)
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>
        )
    }

    // ── EXAM ──
    if (stage === 'exam') {
        const q = questions[current]
        return (
            <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
                {/* Top bar: timer + progress */}
                <div className="flex items-center justify-between mb-5">
                    <span className="text-sm text-gray-400">Question {current + 1} of {questions.length}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${timeLeft < 60 ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-gray-300'
                        }`}>
                        <Clock className="w-4 h-4" /> {mins}:{secs.toString().padStart(2, '0')}
                    </div>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1 mb-6">
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`flex-1 h-1.5 rounded-full transition ${i === current ? 'bg-cyan-400' : answers[i] !== null ? 'bg-violet-500/60' : 'bg-white/10'
                                }`}
                        />
                    ))}
                </div>

                {/* Question */}
                <div className="glass p-5 sm:p-6 mb-4">
                    <p className="text-base sm:text-lg font-medium mb-5">{q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((opt: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => choose(i)}
                                className={`w-full text-left p-3 rounded-xl border text-sm transition ${answers[current] === i
                                        ? 'bg-linear-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <span className="font-semibold mr-2 text-cyan-400">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                        disabled={current === 0}
                        className="glass glass-hover px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    {current === questions.length - 1 ? (
                        <button
                            onClick={submitExam}
                            disabled={loading}
                            className="bg-linear-to-r from-green-500 to-cyan-500 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                            Submit ({answeredCount}/{questions.length})
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                            className="glass glass-hover px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </main>
        )
    }

    // ── RESULT ──
    return (
        <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-6">
                <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>

            {/* Score card */}
            <div className={`glass p-6 sm:p-8 text-center mb-6 bg-linear-to-br ${result.passed ? 'from-green-500/15 to-cyan-500/10' : 'from-orange-500/15 to-red-500/10'
                }`}>
                <Trophy className={`w-12 h-12 mx-auto mb-3 ${result.passed ? 'text-yellow-400' : 'text-gray-500'}`} />
                <p className="text-4xl font-bold mb-1">{result.pct}%</p>
                <p className="text-sm text-gray-400 mb-2">{result.score} out of {result.total} correct</p>
                <p className={`text-sm font-semibold ${result.passed ? 'text-green-400' : 'text-orange-400'}`}>
                    {result.passed ? '✅ Passed!' : 'Keep practicing — you\'ll get there'}
                </p>
            </div>

            {/* Question review */}
            <h2 className="font-semibold mb-3">Review</h2>
            <div className="space-y-3 mb-6">
                {result.review.map((r: any, i: number) => (
                    <div key={i} className="glass p-4">
                        <div className="flex items-start gap-2 mb-2">
                            {r.is_correct
                                ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                            <p className="text-sm font-medium">{r.question}</p>
                        </div>
                        <div className="space-y-1 ml-7">
                            {r.options.map((opt: string, j: number) => {
                                const isCorrect = j === r.correct_index
                                const isUserWrong = j === r.user_answer && !r.is_correct
                                return (
                                    <p key={j} className={`text-xs px-2 py-1 rounded ${isCorrect ? 'bg-green-500/15 text-green-300'
                                            : isUserWrong ? 'bg-red-500/15 text-red-300 line-through'
                                                : 'text-gray-400'
                                        }`}>
                                        {String.fromCharCode(65 + j)}. {opt}
                                        {isCorrect && ' ✓'}
                                        {isUserWrong && ' (your answer)'}
                                    </p>
                                )
                            })}
                            <p className="text-xs text-gray-400 mt-2 italic">💡 {r.explanation}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button onClick={() => { setStage('intro'); setResult(null); setCurrent(0) }} className="glass glass-hover px-4 py-3 rounded-xl text-sm flex-1">
                    Back to start
                </button>
                <Link href="/dashboard" className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-3 rounded-xl text-sm flex-1 text-center">
                    Done
                </Link>
            </div>
        </main>
    )
}