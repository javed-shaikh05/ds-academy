'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DATASETS, getDataset } from '@/lib/datasets/samples'
import {
    ArrowLeft, Loader2, Briefcase, Play, CheckCircle2, Lightbulb,
    ClipboardList, Award, ThumbsUp, TrendingUp, Database, FileSpreadsheet
} from 'lucide-react'
import { showXP } from '@/components/XPToast'

export default function InternView() {
    const [stage, setStage] = useState<'pick' | 'work' | 'result'>('pick')
    const [datasetId, setDatasetId] = useState<string | null>(null)
    const [projectId, setProjectId] = useState<string | null>(null)
    const [brief, setBrief] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState('')
    const [output, setOutput] = useState('')
    const [running, setRunning] = useState(false)
    const [review, setReview] = useState<any>(null)
    const [pyodide, setPyodide] = useState<any>(null)
    const [showData, setShowData] = useState(false)

    const ds = datasetId ? getDataset(datasetId) : null

    const startProject = async (id: string) => {
        setDatasetId(id)
        setLoading(true)
        try {
            const res = await fetch('/api/intern', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'brief', datasetId: id }),
            })
            const data = await res.json()
            if (data.error) { alert(data.error); return }
            setBrief(data.brief)
            setProjectId(data.projectId)
            // Starter code that loads the dataset
            const dataset = getDataset(id)!
            setCode(`import pandas as pd
from io import StringIO

# Your dataset is loaded into the 'data' variable
data = """${dataset.csv}"""
df = pd.read_csv(StringIO(data))

# Start exploring! For example:
print(df.head())
print(df.shape)
`)
            setStage('work')
        } finally {
            setLoading(false)
        }
    }

    const loadPyodide = async () => {
        if (pyodide) return pyodide
        // @ts-ignore
        if (!window.loadPyodide) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js'
                script.onload = () => resolve()
                script.onerror = reject
                document.head.appendChild(script)
            })
        }
        // @ts-ignore
        const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' })
        await py.loadPackage(['pandas', 'numpy'])
        setPyodide(py)
        return py
    }

    const runCode = async () => {
        setRunning(true)
        setOutput('')
        try {
            const py = await loadPyodide()
            // Capture stdout
            py.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
`)
            py.runPython(code)
            const stdout = py.runPython('sys.stdout.getvalue()')
            setOutput(stdout || '(no output — use print() to see results)')
        } catch (err: any) {
            setOutput(`Error:\n${err.message}`)
        } finally {
            setRunning(false)
        }
    }

    const submitForReview = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/intern', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'review', projectId, code, output }),
            })
            const data = await res.json()
            if (data.error) { alert(data.error); return }
            setReview(data.review)
            setStage('result')
            showXP({ xp_earned: 100 })
        } finally {
            setLoading(false)
        }
    }

    // ── PICK DATASET ──
    if (stage === 'pick') {
        return (
            <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
                <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-6">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-7 h-7 text-cyan-400" />
                    <h1 className="text-xl sm:text-2xl font-bold">Intern Project Lab</h1>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                    Work a real dataset like a first-day intern. Pick a project, get a brief from your &quot;manager&quot;, write Python, and get reviewed.
                </p>

                <div className="space-y-3">
                    {DATASETS.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => startProject(d.id)}
                            disabled={loading}
                            className="glass glass-hover w-full p-4 sm:p-5 text-left transition disabled:opacity-50 group"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-3xl shrink-0">{d.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{d.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.difficulty === 'Beginner' ? 'bg-green-500/15 text-green-300' : 'bg-yellow-500/15 text-yellow-300'
                                            }`}>
                                            {d.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-cyan-400 mb-1">{d.domain}</p>
                                    <p className="text-sm text-gray-400">{d.description}</p>
                                </div>
                                {loading && datasetId === d.id && <Loader2 className="w-5 h-5 animate-spin text-cyan-400 shrink-0" />}
                            </div>
                        </button>
                    ))}
                </div>
            </main>
        )
    }

    // ── WORK ──
    if (stage === 'work' && brief) {
        return (
            <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
                <button onClick={() => setStage('pick')} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to projects
                </button>

                {/* Brief */}
                <div className="glass p-5 sm:p-6 mb-4 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{ds?.emoji}</span>
                        <div>
                            <p className="text-[10px] text-cyan-400 uppercase tracking-wider">Your assignment</p>
                            <h1 className="text-lg font-bold">{brief.title}</h1>
                        </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">{brief.scenario}</p>

                    <div className="bg-white/5 rounded-xl p-3 mb-3">
                        <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4 text-cyan-400" /> Your tasks
                        </p>
                        <ul className="space-y-1.5">
                            {brief.tasks.map((t: string, i: number) => (
                                <li key={i} className="text-sm text-gray-300 flex gap-2">
                                    <span className="text-cyan-400 font-semibold shrink-0">{i + 1}.</span> {t}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {brief.hint && (
                        <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-3 flex gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-100">{brief.hint}</p>
                        </div>
                    )}

                    <button
                        onClick={() => setShowData(!showData)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 mt-3 flex items-center gap-1.5"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> {showData ? 'Hide' : 'Preview'} dataset
                    </button>
                    {showData && (
                        <pre className="mt-2 text-[10px] bg-black/40 rounded-lg p-3 overflow-x-auto text-gray-400 max-h-40 overflow-y-auto">
                            {ds?.csv.split('\n').slice(0, 8).join('\n')}
                            {'\n...'}
                        </pre>
                    )}
                </div>

                {/* Code editor */}
                <div className="glass p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-violet-400" /> Your Python workspace
                    </p>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        rows={14}
                        spellCheck={false}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs font-mono focus:outline-none focus:border-cyan-400/50 resize-y leading-relaxed"
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={runCode}
                            disabled={running}
                            className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                        >
                            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {running ? 'Running...' : 'Run code'}
                        </button>
                        <button
                            onClick={submitForReview}
                            disabled={loading || !output}
                            title={!output ? 'Run your code first' : ''}
                            className="bg-green-500/15 border border-green-400/30 text-green-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 hover:bg-green-500/25 transition"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Submit to manager
                        </button>
                    </div>
                </div>

                {/* Output */}
                {output && (
                    <div className="glass p-4">
                        <p className="text-xs font-semibold text-gray-300 mb-2">Output</p>
                        <pre className="text-xs bg-black/40 rounded-lg p-3 overflow-x-auto text-green-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                            {output}
                        </pre>
                    </div>
                )}
            </main>
        )
    }

    // ── RESULT ──
    return (
        <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-6">
                <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>

            <div className="glass p-6 text-center mb-5 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
                <Award className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-4xl font-bold mb-1">{review.score}<span className="text-base text-gray-400">/100</span></p>
                <p className="text-sm text-gray-400">Manager&apos;s review</p>
            </div>

            {review.manager_note && (
                <div className="glass p-4 mb-4 bg-cyan-500/5 border border-cyan-400/20">
                    <p className="text-[10px] text-cyan-300 uppercase tracking-wider mb-1">Note from your manager</p>
                    <p className="text-sm text-gray-200">{review.manager_note}</p>
                </div>
            )}

            {review.what_went_well?.length > 0 && (
                <div className="glass p-4 mb-3">
                    <p className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> What went well</p>
                    <ul className="space-y-1">{review.what_went_well.map((s: string, i: number) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}</ul>
                </div>
            )}

            {review.improvements?.length > 0 && (
                <div className="glass p-4 mb-5">
                    <p className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> To improve next time</p>
                    <ul className="space-y-1">{review.improvements.map((s: string, i: number) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}</ul>
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={() => { setStage('pick'); setReview(null); setBrief(null); setOutput(''); setCode('') }} className="glass glass-hover px-4 py-3 rounded-xl text-sm flex-1">
                    Another project
                </button>
                <Link href="/dashboard" className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-3 rounded-xl text-sm flex-1 text-center">
                    Done
                </Link>
            </div>
        </main>
    )
}