'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, RotateCcw, Check, Repeat, Lightbulb, CheckCircle2 } from 'lucide-react'

interface Card {
    front: string
    back: string
    hook?: string
}

export default function Flashcards({ subtopicId, onClose }: { subtopicId: string; onClose: () => void }) {
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [queue, setQueue] = useState<number[]>([])
    const [mastered, setMastered] = useState<Set<number>>(new Set())
    const [flipped, setFlipped] = useState(false)
    const [showHint, setShowHint] = useState(false)

    useEffect(() => {
        fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subtopicId }),
        })
            .then((r) => r.json())
            .then((d) => {
                const c = d.cards || []
                setCards(c)
                setQueue(c.map((_: any, i: number) => i))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [subtopicId])

    const current = queue[0]
    const finished = !loading && cards.length > 0 && queue.length === 0

    const gotIt = () => {
        setMastered((m) => new Set(m).add(current))
        setQueue((q) => q.slice(1))
        setFlipped(false)
        setShowHint(false)
    }

    const reviewAgain = () => {
        setQueue((q) => [...q.slice(1), q[0]]) // move to back of deck
        setFlipped(false)
        setShowHint(false)
    }

    const restart = () => {
        setQueue(cards.map((_, i) => i))
        setMastered(new Set())
        setFlipped(false)
        setShowHint(false)
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="glass glow-cyan p-5 sm:p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold">Flashcards</h3>
                        {!loading && cards.length > 0 && (
                            <p className="text-xs text-gray-400">{mastered.size} / {cards.length} mastered</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0"><X className="w-5 h-5" /></button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Building flashcards...
                    </div>
                ) : finished ? (
                    <div className="text-center py-10">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="font-semibold mb-1">All {cards.length} cards mastered! 🎉</p>
                        <p className="text-sm text-gray-400 mb-5">You recalled every one. That&apos;s how memory sticks.</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={restart} className="glass glass-hover px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Practice again
                            </button>
                            <button onClick={onClose} className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm">Done</button>
                        </div>
                    </div>
                ) : cards.length === 0 ? (
                    <p className="text-sm text-gray-400 py-10 text-center">No flashcards available.</p>
                ) : (
                    <>
                        {/* Progress bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all"
                                style={{ width: `${(mastered.size / cards.length) * 100}%` }}
                            />
                        </div>

                        {/* The card (click to flip) */}
                        <div
                            className={`flip-card ${flipped ? 'flipped' : ''} h-56 mb-4`}
                            onClick={() => setFlipped((f) => !f)}
                        >
                            <div className="flip-card-inner">
                                {/* Front */}
                                <div className="flip-card-front rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
                                    <p className="text-[10px] text-cyan-400 uppercase tracking-wider mb-3">Question</p>
                                    <p className="text-base sm:text-lg font-medium">{cards[current].front}</p>
                                    <p className="text-[11px] text-gray-500 mt-4">Tap to reveal answer</p>
                                </div>
                                {/* Back */}
                                <div className="flip-card-back rounded-2xl border border-cyan-400/30 bg-linear-to-br from-cyan-500/10 to-violet-500/10 p-5 text-center overflow-y-auto">
                                    <p className="text-[10px] text-green-400 uppercase tracking-wider mb-2">Answer</p>
                                    <p className="text-sm sm:text-base">{cards[current].back}</p>
                                </div>
                            </div>
                        </div>

                        {/* Hint */}
                        {cards[current].hook && (
                            <div className="mb-4">
                                {showHint ? (
                                    <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-3 flex gap-2">
                                        <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-100">{cards[current].hook}</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowHint(true)}
                                        className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 mx-auto"
                                    >
                                        <Lightbulb className="w-3.5 h-3.5" /> Show memory hook
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Actions — only after flip */}
                        {flipped ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={reviewAgain}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/10 border border-orange-400/30 text-orange-300 text-sm hover:bg-orange-500/20 transition"
                                >
                                    <Repeat className="w-4 h-4" /> Review again
                                </button>
                                <button
                                    onClick={gotIt}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/15 border border-green-400/30 text-green-300 text-sm hover:bg-green-500/25 transition"
                                >
                                    <Check className="w-4 h-4" /> Got it
                                </button>
                            </div>
                        ) : (
                            <p className="text-center text-xs text-gray-500">Try to recall the answer, then tap the card</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}