'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, X, Upload, Trash2, Check } from 'lucide-react'

// 18 preloaded avatars across 6 fun styles — all from DiceBear (free, no API key)
const PRELOADED = [
    // ── Adventurer (cartoon heroes) ──
    { id: 'adv1', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=22d3ee' },
    { id: 'adv2', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka&backgroundColor=a78bfa' },
    { id: 'adv3', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thor&backgroundColor=ef4444' },
    { id: 'adv4', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Storm&backgroundColor=10b981' },
    { id: 'adv5', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Phoenix&backgroundColor=fb923c' },
    { id: 'adv6', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=f472b6' },
    { id: 'adv7', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Orion&backgroundColor=fbbf24' },
    { id: 'adv8', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Maya&backgroundColor=6366f1' },

    // ── Dylan (modern flat) ──
    { id: 'dyl1', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Cool&backgroundColor=22d3ee' },
    { id: 'dyl2', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Vibe&backgroundColor=a78bfa' },
    { id: 'dyl3', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Spark&backgroundColor=f472b6' },
    { id: 'dyl4', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Zen&backgroundColor=fbbf24' },
    { id: 'dyl5', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Bold&backgroundColor=10b981' },
    { id: 'dyl6', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Fresh&backgroundColor=ef4444' },
    { id: 'dyl7', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Wave&backgroundColor=fb923c' },
    { id: 'dyl8', url: 'https://api.dicebear.com/9.x/dylan/svg?seed=Drift&backgroundColor=6366f1' },

    // ── Initials (clean letter-based) ──
    { id: 'ini1', url: 'https://api.dicebear.com/9.x/initials/svg?seed=DS&backgroundColor=22d3ee' },
    { id: 'ini2', url: 'https://api.dicebear.com/9.x/initials/svg?seed=AI&backgroundColor=a78bfa' },
    { id: 'ini3', url: 'https://api.dicebear.com/9.x/initials/svg?seed=ML&backgroundColor=f472b6' },
    { id: 'ini4', url: 'https://api.dicebear.com/9.x/initials/svg?seed=DL&backgroundColor=fbbf24' },
    { id: 'ini5', url: 'https://api.dicebear.com/9.x/initials/svg?seed=NN&backgroundColor=10b981' },
    { id: 'ini6', url: 'https://api.dicebear.com/9.x/initials/svg?seed=GPT&backgroundColor=ef4444' },
    { id: 'ini7', url: 'https://api.dicebear.com/9.x/initials/svg?seed=PY&backgroundColor=fb923c' },
    { id: 'ini8', url: 'https://api.dicebear.com/9.x/initials/svg?seed=NLP&backgroundColor=6366f1' },

    // ── Lorelei Neutral (stylish, simpler) ──
    { id: 'lor1', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Storm&backgroundColor=22d3ee' },
    { id: 'lor2', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Flare&backgroundColor=a78bfa' },
    { id: 'lor3', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Echo&backgroundColor=f472b6' },
    { id: 'lor4', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Zara&backgroundColor=fbbf24' },
    { id: 'lor5', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Kai&backgroundColor=10b981' },
    { id: 'lor6', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Iris&backgroundColor=ef4444' },
    { id: 'lor7', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Atlas&backgroundColor=fb923c' },
    { id: 'lor8', url: 'https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=Nova&backgroundColor=6366f1' },

    // ── Micah (professional) ──
    { id: 'mic1', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Pro&backgroundColor=22d3ee' },
    { id: 'mic2', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Boss&backgroundColor=a78bfa' },
    { id: 'mic3', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Lead&backgroundColor=f472b6' },
    { id: 'mic4', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Chief&backgroundColor=fbbf24' },
    { id: 'mic5', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Senior&backgroundColor=10b981' },
    { id: 'mic6', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Architect&backgroundColor=ef4444' },
    { id: 'mic7', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Mentor&backgroundColor=fb923c' },
    { id: 'mic8', url: 'https://api.dicebear.com/9.x/micah/svg?seed=Founder&backgroundColor=6366f1' },

    // ── Miniavs (mini people) ──
    { id: 'min1', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Alex&backgroundColor=22d3ee' },
    { id: 'min2', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Riley&backgroundColor=a78bfa' },
    { id: 'min3', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Jordan&backgroundColor=f472b6' },
    { id: 'min4', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Sam&backgroundColor=fbbf24' },
    { id: 'min5', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Casey&backgroundColor=10b981' },
    { id: 'min6', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Morgan&backgroundColor=ef4444' },
    { id: 'min7', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Quinn&backgroundColor=fb923c' },
    { id: 'min8', url: 'https://api.dicebear.com/9.x/miniavs/svg?seed=Avery&backgroundColor=6366f1' },

    // ── Thumbs (thumbs-up characters) ──
    { id: 'thu1', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Win&backgroundColor=22d3ee' },
    { id: 'thu2', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Yes&backgroundColor=a78bfa' },
    { id: 'thu3', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Hero&backgroundColor=f472b6' },
    { id: 'thu4', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Champ&backgroundColor=fbbf24' },
    { id: 'thu5', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Ace&backgroundColor=10b981' },
    { id: 'thu6', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Boss&backgroundColor=ef4444' },
    { id: 'thu7', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Star&backgroundColor=fb923c' },
    { id: 'thu8', url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=King&backgroundColor=6366f1' },

    // ── Personas (professional headshots) ──
    { id: 'per1', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Engineer&backgroundColor=22d3ee' },
    { id: 'per2', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Scientist&backgroundColor=a78bfa' },
    { id: 'per3', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Analyst&backgroundColor=f472b6' },
    { id: 'per4', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Manager&backgroundColor=fbbf24' },
    { id: 'per5', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Researcher&backgroundColor=10b981' },
    { id: 'per6', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Developer&backgroundColor=ef4444' },
    { id: 'per7', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Designer&backgroundColor=fb923c' },
    { id: 'per8', url: 'https://api.dicebear.com/9.x/personas/svg?seed=Strategist&backgroundColor=6366f1' },
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