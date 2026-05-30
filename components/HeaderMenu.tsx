'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, FileText, Flame, Network, TrendingUp, User } from 'lucide-react'

interface MenuItem {
    href: string
    icon: any
    label: string
    color: string
}

const MENU: MenuItem[] = [
    { href: '/profile', icon: User, label: 'Profile', color: 'text-cyan-400' },
    { href: '/revision', icon: FileText, label: 'Revise', color: 'text-violet-400' },
    { href: '/pulse', icon: Flame, label: 'Pulse', color: 'text-orange-400' },
    { href: '/skilltree', icon: Network, label: 'Skill Tree', color: 'text-cyan-400' },
    { href: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-pink-400' },
]

export default function HeaderMenu() {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('keydown', handleEsc)
        return () => document.removeEventListener('keydown', handleEsc)
    }, [])

    return (
        <>
            {/* MOBILE: dropdown menu (only visible on small screens) */}
            <div ref={ref} className="relative lg:hidden">
                <button
                    onClick={() => setOpen(!open)}
                    className="glass glass-hover px-3 py-1.5 text-xs flex items-center gap-1.5 transition shrink-0"
                    aria-label="Menu"
                >
                    {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>

                {open && (
                    <div
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/15 p-2 z-50 shadow-2xl shadow-black/60"
                        style={{
                            background: 'rgb(15, 15, 30)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                        }}
                    >
                        {MENU.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-sm"
                                >
                                    <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* DESKTOP: full nav buttons (only visible on large screens) */}
            <div className="hidden lg:flex items-center gap-2">
                {MENU.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="glass glass-hover px-3 py-2 text-sm flex items-center gap-1.5 transition shrink-0"
                        >
                            <Icon className={`w-4 h-4 ${item.color}`} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </>
    )
}