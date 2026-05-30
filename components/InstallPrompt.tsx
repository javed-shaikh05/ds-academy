'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

const DISMISSED_KEY = 'ds-install-dismissed'
const DISMISS_DAYS = 7 // re-show prompt after a week if dismissed

export default function InstallPrompt() {
    const [installEvent, setInstallEvent] = useState<any>(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [showIOSGuide, setShowIOSGuide] = useState(false)

    useEffect(() => {
        // Already installed? Bail out.
        if (window.matchMedia('(display-mode: standalone)').matches) return
        if ((window.navigator as any).standalone) return // iOS

        // Detect iOS (it doesn't fire beforeinstallprompt)
        const ua = window.navigator.userAgent
        const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
        setIsIOS(iOS)

        // Recently dismissed? Don't show.
        const dismissed = localStorage.getItem(DISMISSED_KEY)
        if (dismissed) {
            const daysSince = (Date.now() - parseInt(dismissed, 10)) / 86400000
            if (daysSince < DISMISS_DAYS) return
        }

        // Android / desktop Chrome path
        const handler = (e: any) => {
            e.preventDefault() // stop browser's automatic prompt
            setInstallEvent(e)
            setShowBanner(true)
        }
        window.addEventListener('beforeinstallprompt', handler)

        // iOS path — show after a short delay (since no event fires)
        if (iOS) {
            const t = setTimeout(() => setShowBanner(true), 3000)
            return () => clearTimeout(t)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const install = async () => {
        if (isIOS) {
            setShowIOSGuide(true)
            return
        }
        if (!installEvent) return
        installEvent.prompt()
        const choice = await installEvent.userChoice
        if (choice.outcome === 'accepted') {
            setShowBanner(false)
        } else {
            dismiss()
        }
    }

    const dismiss = () => {
        setShowBanner(false)
        localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    }

    if (!showBanner) return null

    return (
        <>
            {/* Install banner */}
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-100 animate-slide-in-up">
                <div className="glass glow-cyan p-4 border border-cyan-400/30 bg-linear-to-br from-cyan-500/10 to-violet-500/10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-linear-to-r from-cyan-500 to-violet-500 rounded-lg shrink-0">
                            <Download className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold mb-0.5">Install DS Academy</p>
                            <p className="text-xs text-gray-400 mb-3">
                                Add it to your home screen for the full app experience — works offline, instant load.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={install}
                                    className="bg-linear-to-r from-cyan-500 to-violet-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition"
                                >
                                    {isIOS ? 'Show me how' : 'Install'}
                                </button>
                                <button
                                    onClick={dismiss}
                                    className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                        <button onClick={dismiss} aria-label="Close" className="text-gray-500 hover:text-white shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* iOS install guide modal */}
            {showIOSGuide && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)}>
                    <div className="glass glow-cyan p-5 sm:p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Install on iPhone</h3>
                            <button onClick={() => setShowIOSGuide(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <ol className="space-y-3 text-sm">
                            <li className="flex gap-3">
                                <span className="bg-cyan-500/20 text-cyan-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                <span>Make sure you&apos;re using <strong>Safari</strong> (not Chrome — iOS only allows PWAs in Safari)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="bg-cyan-500/20 text-cyan-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                <span className="flex items-center gap-1">Tap the <Share className="w-4 h-4 inline text-cyan-400" /> Share button (bottom of screen)</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="bg-cyan-500/20 text-cyan-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                <span>Scroll down → tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="bg-cyan-500/20 text-cyan-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                <span>Tap <strong>Add</strong> — icon appears on home screen 🎉</span>
                            </li>
                        </ol>
                        <button
                            onClick={() => { setShowIOSGuide(false); dismiss() }}
                            className="w-full mt-5 bg-linear-to-r from-cyan-500 to-violet-500 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}