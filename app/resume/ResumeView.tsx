'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Loader2, Sparkles, CheckCircle2, AlertTriangle, Target,
    FileText, History, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react'
import { showXP } from '@/components/XPToast'

export default function ResumeView() {
    const [stage, setStage] = useState<'input' | 'result'>('input')
    const [resumeText, setResumeText] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [showJD, setShowJD] = useState(false)
    const [loading, setLoading] = useState(false)
    const [review, setReview] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/resume').then((r) => r.json()).then((d) => setHistory(d.history || []))
    }, [])

    const submit = async () => {
        if (!resumeText.trim() || loading) return
        setLoading(true)
        try {
            const res = await fetch('/api/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, jobDescription: showJD ? jobDescription : null }),
            })
            const data = await res.json()
            if (data.error) { alert(data.error); return }
            setReview(data.review)
            setStage('result')
            showXP({ xp_earned: 40 })
            // refresh history
            fetch('/api/resume').then((r) => r.json()).then((d) => setHistory(d.history || []))
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setStage('input')
        setReview(null)
    }

    const scoreColor = (s: number) =>
        s >= 75 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-orange-400'

    const verdictColor = (v: string) =>
        v?.includes('Strong') ? 'text-green-400'
            : v?.includes('Pass') ? 'text-red-400'
                : v?.includes('Likely') ? 'text-cyan-400' : 'text-yellow-400'

    return (
        <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6">
                <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>

            <h1 className="text-xl sm:text-3xl font-bold mb-1.5">Resume Review</h1>
            <p className="text-xs sm:text-sm text-gray-400 mb-6">FAANG-recruiter-level feedback on your resume + ATS scoring</p>

            {stage === 'input' && (
                <div className="space-y-4">
                    {/* Resume input */}
                    <div>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400" /> Paste your resume
                        </label>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Copy your resume text and paste it here. Include all sections: experience, projects, skills, education..."
                            rows={14}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 resize-y font-mono"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                            Tip: copy text directly from your PDF/Word — don&apos;t worry about formatting.
                        </p>
                    </div>

                    {/* Optional JD */}
                    <div>
                        <button
                            onClick={() => setShowJD(!showJD)}
                            className="text-sm font-medium flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
                        >
                            <Target className="w-4 h-4" />
                            {showJD ? 'Hide' : 'Add'} target job description (optional)
                            {showJD ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showJD && (
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste a job description to get tailored feedback for that specific role..."
                                rows={6}
                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 resize-y"
                            />
                        )}
                    </div>

                    <button
                        onClick={submit}
                        disabled={loading || resumeText.trim().length < 50}
                        className="w-full bg-linear-to-r from-cyan-500 to-violet-500 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loading ? 'Reviewing...' : 'Review my resume'}
                    </button>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-400">
                                <History className="w-4 h-4" /> Previous reviews
                            </h3>
                            <div className="space-y-2">
                                {history.map((h) => (
                                    <div key={h.id} className="glass p-3 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {new Date(h.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={`font-semibold shrink-0 ${scoreColor(h.review?.recruiter_score || 0)}`}>
                                                {h.review?.recruiter_score || 0}/100
                                            </span>
                                            <span className="text-gray-400 truncate text-xs">{h.review?.verdict}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {history.length >= 2 && (
                                <p className="text-[11px] text-cyan-400 mt-2 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Track your improvement over time
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Result */}
            {stage === 'result' && review && (
                <div className="space-y-4">
                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="glass p-4 sm:p-5 text-center bg-linear-to-br from-cyan-500/10 to-transparent">
                            <p className="text-xs text-gray-400 mb-1">Recruiter Score</p>
                            <p className={`text-3xl sm:text-4xl font-bold ${scoreColor(review.recruiter_score)}`}>
                                {review.recruiter_score}<span className="text-sm text-gray-400">/100</span>
                            </p>
                        </div>
                        <div className="glass p-4 sm:p-5 text-center bg-linear-to-br from-violet-500/10 to-transparent">
                            <p className="text-xs text-gray-400 mb-1">ATS Pass Score</p>
                            <p className={`text-3xl sm:text-4xl font-bold ${scoreColor(review.ats_score)}`}>
                                {review.ats_score}<span className="text-sm text-gray-400">/100</span>
                            </p>
                        </div>
                    </div>

                    {/* Verdict */}
                    <div className="glass p-4 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Verdict</p>
                        <p className={`font-semibold ${verdictColor(review.verdict)}`}>{review.verdict}</p>
                    </div>

                    {/* Top priorities */}
                    {review.top_priorities?.length > 0 && (
                        <div className="glass p-4 sm:p-5 bg-pink-500/5 border border-pink-400/20">
                            <p className="text-sm font-semibold text-pink-300 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" /> Fix these first
                            </p>
                            <ul className="space-y-1.5">
                                {review.top_priorities.map((p: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                                        <span className="text-pink-400 font-bold shrink-0">{i + 1}.</span>
                                        <span>{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Strengths */}
                    {review.strengths?.length > 0 && (
                        <div className="glass p-4">
                            <p className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Strengths
                            </p>
                            <ul className="space-y-1">
                                {review.strengths.map((s: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-300">• {s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Red flags */}
                    {review.red_flags?.length > 0 && (
                        <div className="glass p-4">
                            <p className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Red flags
                            </p>
                            <ul className="space-y-1">
                                {review.red_flags.map((s: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-300">• {s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Missing skills */}
                    {review.missing_skills?.length > 0 && (
                        <div className="glass p-4">
                            <p className="text-sm font-semibold text-yellow-400 mb-2">Missing / weak skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {review.missing_skills.map((s: string, i: number) => (
                                    <span key={i} className="text-xs bg-yellow-500/10 border border-yellow-400/20 text-yellow-300 px-2 py-1 rounded-md">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bullet rewrites */}
                    {review.bullet_rewrites?.length > 0 && (
                        <div className="glass p-4 sm:p-5">
                            <p className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" /> Rewrites for your weakest bullets
                            </p>
                            <div className="space-y-4">
                                {review.bullet_rewrites.map((b: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                        <div className="p-2.5 bg-red-500/5 border border-red-400/20 rounded-lg">
                                            <p className="text-[10px] text-red-300 uppercase tracking-wider mb-1">Before</p>
                                            <p className="text-xs sm:text-sm text-gray-300">{b.original}</p>
                                        </div>
                                        <div className="p-2.5 bg-green-500/5 border border-green-400/20 rounded-lg">
                                            <p className="text-[10px] text-green-300 uppercase tracking-wider mb-1">After</p>
                                            <p className="text-xs sm:text-sm text-gray-200">{b.improved}</p>
                                        </div>
                                        <p className="text-[11px] text-gray-400 px-1">💡 {b.why}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={reset} className="glass glass-hover px-4 py-3 rounded-xl text-sm flex-1">
                            Review another
                        </button>
                        <Link href="/dashboard" className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-3 rounded-xl text-sm flex-1 text-center">
                            Done
                        </Link>
                    </div>
                </div>
            )}
        </main>
    )
}