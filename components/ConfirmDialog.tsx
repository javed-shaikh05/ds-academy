'use client'

import { AlertTriangle, X } from 'lucide-react'

interface Props {
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    onConfirm,
    onCancel,
}: Props) {
    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="glass glow-cyan p-5 sm:p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-xl shrink-0 ${danger ? 'bg-red-500/15' : 'bg-cyan-500/15'}`}>
                        <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-cyan-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{title}</h3>
                        <p className="text-sm text-gray-400">{message}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-white transition shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-2 mt-5">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${danger
                                ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300'
                                : 'bg-linear-to-r from-cyan-500 to-violet-500 hover:opacity-90'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}