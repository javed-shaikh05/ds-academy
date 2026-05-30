'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Camera, Loader2, Check, AlertTriangle, RefreshCw,
    Trash2, Lock, User as UserIcon, Star, Trophy, BookOpen, FileCode, Flame
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProfileAvatar from '@/components/ProfileAvatar'
import AvatarPicker from '@/components/AvatarPicker'

interface Props {
    email: string
    displayName: string
    avatarUrl: string | null
    stats: any
    badges: any[]
    counts: { lessons: number; interviews: number; projects: number }
}

export default function ProfileView({ email, displayName, avatarUrl, stats, badges, counts }: Props) {
    const router = useRouter()
    const supabase = createClient()


    const [name, setName] = useState(displayName)
    const [avatar, setAvatar] = useState(avatarUrl)
    const [savingName, setSavingName] = useState(false)
    const [nameMsg, setNameMsg] = useState('')

    const [newPassword, setNewPassword] = useState('')
    const [savingPwd, setSavingPwd] = useState(false)
    const [pwdMsg, setPwdMsg] = useState('')

    const [uploading, setUploading] = useState(false)
    const [showPicker, setShowPicker] = useState(false)

    const [resetting, setResetting] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteText, setDeleteText] = useState('')

    const earnedBadges = badges.filter((b) => b.earned)
    const lockedBadges = badges.filter((b) => !b.earned)
    const level = stats?.level || 1

    const saveName = async () => {
        setSavingName(true); setNameMsg('')
        const res = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: name }),
        })
        const data = await res.json()
        setSavingName(false)
        if (data.error) setNameMsg(`❌ ${data.error}`)
        else { setNameMsg('✓ Saved'); setTimeout(() => setNameMsg(''), 2000) }
    }

    const savePassword = async () => {
        if (newPassword.length < 6) { setPwdMsg('❌ Min 6 characters'); return }
        setSavingPwd(true); setPwdMsg('')
        const res = await fetch('/api/profile/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword }),
        })
        const data = await res.json()
        setSavingPwd(false)
        if (data.error) setPwdMsg(`❌ ${data.error}`)
        else { setPwdMsg('✓ Password updated'); setNewPassword(''); setTimeout(() => setPwdMsg(''), 3000) }
    }

    const setAvatarUrl = async (url: string | null) => {
        await fetch('/api/profile/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: url }),
        })
        setAvatar(url)
    }

    const pickPreloaded = async (url: string) => {
        setUploading(true)
        try {
            await setAvatarUrl(url)
            setShowPicker(false)
        } finally {
            setUploading(false)
        }
    }

    const uploadAvatar = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB'); return }
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const ext = file.name.split('.').pop()
            const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

            const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
            if (error) { alert(`Upload failed: ${error.message}`); return }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            await setAvatarUrl(publicUrl)
            setShowPicker(false)
        } finally {
            setUploading(false)
        }
    }

    const removeAvatar = async () => {
        setUploading(true)
        try {
            // If it's a Supabase-uploaded file, delete it from storage too
            if (avatar && avatar.includes('/avatars/')) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    // Extract path after /avatars/
                    const parts = avatar.split('/avatars/')
                    if (parts[1]) {
                        await supabase.storage.from('avatars').remove([parts[1]])
                    }
                }
            }
            await setAvatarUrl(null)
            setShowPicker(false)
        } finally {
            setUploading(false)
        }
    }

    const resetProgress = async () => {
        setResetting(true)
        await fetch('/api/profile/reset', { method: 'POST' })
        setResetting(false)
        setShowResetConfirm(false)
        router.push('/dashboard')
        router.refresh()
    }

    const deleteAccount = async () => {
        await fetch('/api/profile/delete', { method: 'POST' })
        router.push('/login')
        router.refresh()
    }

    return (
        <main className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-20">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm mb-4 sm:mb-6">
                <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>

            {/* ── ACHIEVEMENT SHOWCASE ── */}
            <div className="glass p-5 sm:p-8 mb-6 text-center bg-linear-to-br from-cyan-500/5 to-violet-500/5 relative overflow-hidden">
                {/* Floating stars around avatar for earned badges */}
                <div className="relative inline-block mb-4">
                    <ProfileAvatar url={avatar} name={name} size={120} level={level} />
                    {/* Top earned badges as small floating chips */}
                    {earnedBadges.slice(0, 4).map((b, i) => {
                        const positions = [
                            { top: 0, right: -8 },
                            { bottom: 0, right: -8 },
                            { bottom: 0, left: -8 },
                            { top: 0, left: -8 },
                        ]
                        return (
                            <div
                                key={b.id}
                                title={b.name}
                                className="absolute w-8 h-8 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-base shadow-lg shadow-yellow-500/40 border-2 border-[rgb(8,8,20)]"
                                style={positions[i]}
                            >
                                {b.emoji}
                            </div>
                        )
                    })}
                </div>

                {/* Camera button */}
                <button
                    onClick={() => setShowPicker(true)}
                    disabled={uploading}
                    className="absolute top-5 right-5 sm:top-6 sm:right-6 glass glass-hover p-2 rounded-full transition disabled:opacity-50"
                    aria-label="Change avatar"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>

                <h1 className="text-xl sm:text-2xl font-bold mb-1">{name}</h1>
                <p className="text-xs text-gray-400 mb-4">{email}</p>

                {/* Rank chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 mb-5">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm font-semibold">Level {level} · {stats?.rank_name || 'Beginner'}</span>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto">
                    <ShowcaseStat icon={Star} color="text-yellow-400" label="XP" value={(stats?.total_xp || 0).toLocaleString()} />
                    <ShowcaseStat icon={Flame} color="text-orange-400" label="Best streak" value={`${stats?.longest_streak || 0}d`} />
                    <ShowcaseStat icon={BookOpen} color="text-cyan-400" label="Lessons" value={counts.lessons} />
                    <ShowcaseStat icon={Trophy} color="text-pink-400" label="Interviews" value={counts.interviews} />
                </div>
            </div>

            {/* ── EARNED BADGES ── */}
            {earnedBadges.length > 0 && (
                <div className="glass p-4 sm:p-5 mb-6">
                    <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" /> Badges Earned ({earnedBadges.length})
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                        {earnedBadges.map((b) => (
                            <div
                                key={b.id}
                                title={b.description}
                                className="glass p-2 sm:p-3 text-center bg-linear-to-br from-yellow-500/10 to-transparent border border-yellow-400/30"
                            >
                                <div className="text-2xl sm:text-3xl mb-1">{b.emoji}</div>
                                <p className="text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">{b.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked badges (motivation) */}
            {lockedBadges.length > 0 && (
                <div className="glass p-4 sm:p-5 mb-6">
                    <h2 className="font-semibold mb-3 text-gray-300">Locked ({lockedBadges.length})</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                        {lockedBadges.map((b) => (
                            <div key={b.id} title={b.description} className="glass p-2 sm:p-3 text-center opacity-40">
                                <div className="text-2xl sm:text-3xl mb-1 grayscale">{b.emoji}</div>
                                <p className="text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">{b.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ACCOUNT SETTINGS ── */}
            <h2 className="text-lg font-semibold mb-3 mt-8">Account</h2>

            {/* Display name */}
            <div className="glass p-4 sm:p-5 mb-3">
                <label className="text-xs text-gray-400 mb-2 block flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" /> Display name
                </label>
                <div className="flex gap-2">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50"
                    />
                    <button
                        onClick={saveName}
                        disabled={savingName || name === displayName}
                        className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                </div>
                {nameMsg && <p className="text-xs mt-2 text-cyan-400">{nameMsg}</p>}
            </div>

            {/* Password */}
            <div className="glass p-4 sm:p-5 mb-3">
                <label className="text-xs text-gray-400 mb-2 block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Change password
                </label>
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50"
                    />
                    <button
                        onClick={savePassword}
                        disabled={savingPwd || newPassword.length < 6}
                        className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                    </button>
                </div>
                {pwdMsg && <p className="text-xs mt-2 text-cyan-400">{pwdMsg}</p>}
            </div>

            {/* ── DANGER ZONE ── */}
            <h2 className="text-lg font-semibold mb-3 mt-8 text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>

            {/* Reset progress */}
            <div className="glass p-4 sm:p-5 mb-3 border border-orange-400/20">
                <p className="text-sm font-medium mb-1">Reset all learning progress</p>
                <p className="text-xs text-gray-400 mb-3">Wipes XP, streaks, badges, lessons completed, chats, interviews — but keeps your account.</p>
                {showResetConfirm ? (
                    <div className="flex gap-2">
                        <button onClick={resetProgress} disabled={resetting} className="bg-orange-500/20 border border-orange-400/40 text-orange-300 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                            {resetting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Yes, reset everything'}
                        </button>
                        <button onClick={() => setShowResetConfirm(false)} className="glass glass-hover px-4 py-2 rounded-xl text-sm">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setShowResetConfirm(true)} className="bg-orange-500/10 border border-orange-400/30 text-orange-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-500/20 transition">
                        <RefreshCw className="w-4 h-4" /> Reset progress
                    </button>
                )}
            </div>

            {/* Delete account */}
            <div className="glass p-4 sm:p-5 border border-red-400/20">
                <p className="text-sm font-medium mb-1 text-red-300">Delete account</p>
                <p className="text-xs text-gray-400 mb-3">Permanently deletes all your data. This cannot be undone.</p>
                {showDeleteConfirm ? (
                    <div>
                        <p className="text-xs text-gray-300 mb-2">Type <code className="text-red-300">DELETE</code> to confirm:</p>
                        <input
                            value={deleteText}
                            onChange={(e) => setDeleteText(e.target.value)}
                            className="w-full bg-white/5 border border-red-400/30 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={deleteAccount}
                                disabled={deleteText !== 'DELETE'}
                                className="bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-30"
                            >
                                Delete forever
                            </button>
                            <button onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }} className="glass glass-hover px-4 py-2 rounded-xl text-sm">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-red-500/20 transition">
                        <Trash2 className="w-4 h-4" /> Delete account
                    </button>
                )}
            </div>
            {/* Avatar picker modal */}
            {showPicker && (
                <AvatarPicker
                    currentUrl={avatar}
                    uploading={uploading}
                    onSelect={pickPreloaded}
                    onUpload={uploadAvatar}
                    onRemove={removeAvatar}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </main>
    )
}

function ShowcaseStat({ icon: Icon, color, label, value }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-3">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className="text-base sm:text-lg font-bold leading-tight">{value}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
        </div>
    )
}