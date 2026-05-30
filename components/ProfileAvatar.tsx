'use client'

import Image from 'next/image'
import { User } from 'lucide-react'

interface Props {
    url?: string | null
    name: string
    size?: number
    level?: number
    showRing?: boolean
}

// Ring color by level (higher level = fancier ring)
function ringStyle(level: number = 1) {
    if (level >= 10) return 'from-yellow-400 via-orange-400 to-red-400'    // 🔥 legendary
    if (level >= 7) return 'from-pink-400 via-violet-400 to-cyan-400'     // 💫 epic
    if (level >= 4) return 'from-cyan-400 to-violet-400'                  // 🌊 rare
    return 'from-gray-500 to-gray-400'                                     // ⚪ default
}

export default function ProfileAvatar({ url, name, size = 80, level = 1, showRing = true }: Props) {
    const initials = name?.slice(0, 2).toUpperCase() || '??'
    const ring = ringStyle(level)
    const innerSize = size - 6

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Glowing ring */}
            {showRing && (
                <div
                    className={`absolute inset-0 rounded-full bg-linear-to-br ${ring} p-[3px] ${level >= 7 ? 'animate-spin-slow' : ''}`}
                    style={{ filter: level >= 7 ? 'drop-shadow(0 0 10px rgba(168,85,247,0.4))' : 'none' }}
                >
                    <div className="w-full h-full rounded-full bg-[rgb(8,8,20)]" />
                </div>
            )}

            {/* Avatar image or initials */}
            <div
                className="relative rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0"
                style={{ width: innerSize, height: innerSize }}
            >
                {url ? (
                    <Image src={url} alt={name} width={innerSize} height={innerSize} className="object-cover w-full h-full" unoptimized />
                ) : (
                    <span className="font-bold text-white" style={{ fontSize: size * 0.32 }}>{initials}</span>
                )}
            </div>
        </div>
    )
}