'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, X, Upload, Trash2, Check } from 'lucide-react'

// 18 preloaded avatars across 6 fun styles — all from DiceBear (free, no API key)
const PRELOADED = [
    // Fun heroic / cartoon characters
    { id: 'h1', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=22d3ee' },
    { id: 'h2', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka&backgroundColor=a78bfa' },
    { id: 'h3', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mittens&backgroundColor=f472b6' },

    // Bots / cyberpunk vibe
    { id: 'b1', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Buddy&backgroundColor=22d3ee' },
    { id: 'b2', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Pixel&backgroundColor=a78bfa' },
    { id: 'b3', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Zap&backgroundColor=fbbf24' },

    // Pixel art (gamer)
    { id: 'p1', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Ace&backgroundColor=22d3ee' },
    { id: 'p2', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Nova&backgroundColor=a78bfa' },
    { id: 'p3', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Rex&backgroundColor=f472b6' },

    // Fun emoji-style
    { id: 'f1', url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cool&backgroundColor=22d3ee' },
    { id: 'f2', url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Spark&backgroundColor=a78bfa' },
    { id: 'f3', url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Boom&backgroundColor=fbbf24' },

    // Minimal initials-style (clean)
    { id: 'i1', url: 'https://api.dicebear.com/9.x/initials/svg?seed=DS&backgroundColor=22d3ee' },
    { id: 'i2', url: 'https://api.dicebear.com/9.x/initials/svg?seed=AI&backgroundColor=a78bfa' },
    { id: 'i3', url: 'https://api.dicebear.com/9.x/initials/svg?seed=ML&backgroundColor=f472b6' },

    // Lorelei (stylish characters)
    { id: 'l1', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Storm&backgroundColor=22d3ee' },
    { id: 'l2', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Flare&backgroundColor=a78bfa' },
    { id: 'l3', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Echo&backgroundColor=fbbf24' },
]

interface Props {
    currentUrl: string | null
    uploading: boolean
    onSelect: (url: string) => void   // pick from preloaded
    onUpload: (file: File) => void    // upload custom
    onRemove: () => void              // remove current
    onClose: () => void
}

export default function AvatarPicker({ currentUrl, uploading, onSelect, onUpload, onRemove, onClose }: Props) {
    const [tab, setTab] = useState<'choose' | 'upload'>('choose')

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="glass glow-cyan p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Profile picture</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-xl">
                    <button
                        onClick={() => setTab('choose')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'choose' ? 'bg-linear-to-r from-cyan-500/30 to-violet-500/30 text-white' : 'text-gray-400'
                            }`}
                    >
                        Choose avatar
                    </button>
                    <button
                        onClick={() => setTab('upload')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'upload' ? 'bg-linear-to-r from-cyan-500/30 to-violet-500/30 text-white' : 'text-gray-400'
                            }`}
                    >
                        Upload photo
                    </button>
                </div>

                {/* CHOOSE */}
                {tab === 'choose' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                        {PRELOADED.map((a) => {
                            const selected = currentUrl === a.url
                            return (
                                <button
                                    key={a.id}
                                    onClick={() => onSelect(a.url)}
                                    disabled={uploading}
                                    className={`relative aspect-square rounded-xl overflow-hidden bg-white/10 border-2 transition hover:scale-105 ${selected ? 'border-cyan-400 shadow-lg shadow-cyan-500/30' : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <Image src={a.url} alt="avatar" fill className="object-cover" unoptimized />
                                    {selected && (
                                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                            <div className="bg-cyan-400 rounded-full p-1">
                                                <Check className="w-4 h-4 text-black" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* UPLOAD */}
                {tab === 'upload' && (
                    <div>
                        <label className="block">
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-400/50 hover:bg-white/5 transition">
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
                                        <p className="text-sm text-gray-400">Uploading...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                        <p className="text-sm font-medium mb-1">Click to upload your photo</p>
                                        <p className="text-xs text-gray-400">Max 2 MB · PNG, JPG, WebP</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                            />
                        </label>
                    </div>
                )}

                {/* Remove current */}
                {currentUrl && (
                    <button
                        onClick={onRemove}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-sm hover:bg-red-500/20 transition"
                    >
                        <Trash2 className="w-4 h-4" /> Remove current picture
                    </button>
                )}
            </div>
        </div>
    )
}